const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const {
    randomBytes,
    scrypt: scryptCallback,
    timingSafeEqual
} = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(scryptCallback);
const root = __dirname;
const dataDirectory = path.join(root, "data");
const usersFile = path.join(dataDirectory, "users.json");
const sessions = new Map();
const sessionLifetime = 7 * 24 * 60 * 60;
const passwordHashLength = 64;
const allowedFiles = new Map([
    ["/", "index.html"],
    ["/index.html", "index.html"],
    ["/style.css", "style.css"],
    ["/app.js", "app.js"],
    ["/supabase-config.js", "supabase-config.js"]
]);
const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8"
};

async function loadUsers() {
    await fs.mkdir(dataDirectory, { recursive: true });
    try {
        return JSON.parse(await fs.readFile(usersFile, "utf8"));
    } catch (error) {
        if (error.code === "ENOENT") return [];
        throw error;
    }
}

async function saveUsers(users) {
    await fs.mkdir(dataDirectory, { recursive: true });
    const temporaryFile = usersFile + ".tmp";
    await fs.writeFile(temporaryFile, JSON.stringify(users, null, 2), { mode: 0o600 });
    await fs.rename(temporaryFile, usersFile);
}

function sendJson(response, status, payload, headers = {}) {
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        ...headers
    });
    response.end(JSON.stringify(payload));
}

function readJson(request) {
    return new Promise((resolve, reject) => {
        let body = "";
        request.setEncoding("utf8");
        request.on("data", chunk => {
            body += chunk;
            if (body.length > 16_384) {
                reject(Object.assign(new Error("Request is too large."), { status: 413 }));
                request.destroy();
            }
        });
        request.on("end", () => {
            try {
                resolve(JSON.parse(body || "{}"));
            } catch {
                reject(Object.assign(new Error("Invalid request."), { status: 400 }));
            }
        });
        request.on("error", reject);
    });
}

function getCookies(request) {
    return Object.fromEntries((request.headers.cookie || "").split(";").map(part => {
        const separator = part.indexOf("=");
        if (separator < 0) return ["", ""];
        return [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())];
    }).filter(([name]) => name));
}

function sessionCookie(request, value, maxAge) {
    const secure = request.socket.encrypted ? "; Secure" : "";
    return `codehub_session=${encodeURIComponent(value)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
}

async function getSessionUser(request) {
    const token = getCookies(request).codehub_session;
    const session = sessions.get(token);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
        sessions.delete(token);
        return null;
    }
    const user = (await loadUsers()).find(record => record.email === session.email);
    return user ? { name: user.name, email: user.email } : null;
}

function checkSameOrigin(request) {
    const origin = request.headers.origin;
    if (!origin) return true;
    try {
        return new URL(origin).host === request.headers.host;
    } catch {
        return false;
    }
}

async function handleAuth(request, response, url) {
    if (request.method === "GET" && url.pathname === "/api/auth/session") {
        try {
            const user = await getSessionUser(request);
            return sendJson(response, 200, { user });
        } catch {
            return sendJson(response, 500, { error: "Unable to load your account." });
        }
    }

    if (request.method !== "POST") {
        return sendJson(response, 405, { error: "Method not allowed." }, { Allow: "GET, POST" });
    }
    if (!checkSameOrigin(request)) {
        return sendJson(response, 403, { error: "Request origin rejected." });
    }

    if (url.pathname === "/api/auth/logout") {
        const token = getCookies(request).codehub_session;
        sessions.delete(token);
        return sendJson(response, 200, { user: null }, {
            "Set-Cookie": sessionCookie(request, "", 0)
        });
    }

    if (!["/api/auth/signup", "/api/auth/login"].includes(url.pathname)) {
        return sendJson(response, 404, { error: "Not found." });
    }

    let input;
    try {
        input = await readJson(request);
    } catch (error) {
        return sendJson(response, error.status || 400, { error: error.message || "Invalid request." });
    }

    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const password = typeof input.password === "string" ? input.password : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return sendJson(response, 400, { error: "Enter a valid email address." });
    }
    if (password.length < 8 || password.length > 128) {
        return sendJson(response, 400, { error: "Password must be between 8 and 128 characters." });
    }

    try {
        const users = await loadUsers();
        let user = users.find(record => record.email === email);

        if (url.pathname === "/api/auth/signup") {
            const name = typeof input.name === "string" ? input.name.trim() : "";
            if (!name || name.length > 80) {
                return sendJson(response, 400, { error: "Enter a name between 1 and 80 characters." });
            }
            if (user) {
                return sendJson(response, 409, { error: "An account with this email already exists. Log in instead." });
            }

            const salt = randomBytes(16);
            const passwordHash = await scrypt(password, salt, passwordHashLength, { N: 16384, r: 8, p: 1 });
            user = {
                name,
                email,
                salt: salt.toString("hex"),
                passwordHash: passwordHash.toString("hex"),
                createdAt: new Date().toISOString()
            };
            users.push(user);
            await saveUsers(users);
        } else {
            const salt = user ? Buffer.from(user.salt, "hex") : Buffer.alloc(16);
            const expectedHash = user ? Buffer.from(user.passwordHash, "hex") : Buffer.alloc(passwordHashLength);
            const actualHash = await scrypt(password, salt, passwordHashLength, { N: 16384, r: 8, p: 1 });
            const passwordMatches = timingSafeEqual(actualHash, expectedHash);
            if (!user || !passwordMatches) {
                return sendJson(response, 401, { error: "Email or password is incorrect." });
            }
        }

        const token = randomBytes(32).toString("base64url");
        sessions.set(token, { email: user.email, expiresAt: Date.now() + sessionLifetime * 1000 });
        return sendJson(response, 200, {
            user: { name: user.name, email: user.email }
        }, {
            "Set-Cookie": sessionCookie(request, token, sessionLifetime)
        });
    } catch (error) {
        console.error("Authentication request failed:", error);
        return sendJson(response, 500, { error: "Unable to process your account request." });
    }
}

async function handler(request, response) {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
        return handleAuth(request, response, url);
    }

    const fileName = allowedFiles.get(url.pathname);
    if (!fileName || request.method !== "GET") {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        return response.end("Not found");
    }

    try {
        const contents = await fs.readFile(path.join(root, fileName));
        response.writeHead(200, {
            "Content-Type": mimeTypes[path.extname(fileName)],
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "same-origin"
        });
        response.end(contents);
    } catch {
        response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Unable to load CodeHub.");
    }
}

const port = Number(process.env.PORT || 3000);
http.createServer((request, response) => {
    handler(request, response).catch(error => {
        console.error("Request failed:", error);
        if (!response.headersSent) sendJson(response, 500, { error: "Unexpected server error." });
        else response.destroy();
    });
}).listen(port, "127.0.0.1", () => {
    console.log(`CodeHub is running at http://127.0.0.1:${port}`);
});
