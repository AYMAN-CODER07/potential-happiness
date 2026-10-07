// ==========================================
// CODEHUB - MONACO EDITOR
// ==========================================

require.config({
    paths: {
        vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs"
    }
});


// ==========================================
// PROJECT FILES
// ==========================================

const files = {

    "index.html": {
        language: "html",
        code: `<!DOCTYPE html>
<html>

<head>
    <title>CodeHub</title>
</head>

<body>

    <h1>Hello CodeHub!</h1>
    <p>Welcome to your online compiler.</p>

</body>

</html>`
    },

    "style.css": {
        language: "css",
        code: `body {
    background: #111827;
    color: white;
    font-family: Arial;
    text-align: center;
}

h1 {
    color: #38bdf8;
}`
    },

    "script.js": {
        language: "javascript",
        code: `console.log("Hello CodeHub!");

alert("JavaScript is working!");`
    }

};


// ==========================================
// CURRENT FILE
// ==========================================

let currentFile = "index.html";


// ==========================================
// START MONACO EDITOR
// ==========================================

require(["vs/editor/editor.main"], function () {

    window.editor = monaco.editor.create(
        document.getElementById("editor"),
        {
            value: files["index.html"].code,

            language: "html",

            theme: "vs-dark",

            automaticLayout: true,

            fontSize: 15,

            lineNumbers: "on",

            minimap: {
                enabled: true
            },

            wordWrap: "on",

            scrollBeyondLastLine: false
        }
    );

    window.editor.onDidChangeModelContent(updateProgramInputHelp);
    updateProgramInputHelp();

});


// ==========================================
// SAVE CURRENT FILE
// ==========================================

function saveCurrentFile() {

    if (window.editor && files[currentFile]) {

        files[currentFile].code =
            window.editor.getValue();

    }

}


// ==========================================
// OPEN FILE
// ==========================================

function openFile(fileName, button) {

    if (!window.editor || !files[fileName]) {
        return;
    }

    // Save current file
    saveCurrentFile();

    // Change current file
    currentFile = fileName;

    // Change Monaco language
    monaco.editor.setModelLanguage(
        window.editor.getModel(),
        files[fileName].language
    );

    // Load selected file
    window.editor.setValue(
        files[fileName].code
    );

    // Remove active class
    document.querySelectorAll(".file-row").forEach(function (row) {

        row.classList.remove("active");

    });

    // Add active class
    button.closest(".file-row").classList.add("active");

}


// ==========================================
// EXISTING FILE BUTTONS
// ==========================================

document.querySelectorAll(".file-item").forEach(function (button) {

    button.addEventListener("click", function () {

        openFile(
            this.dataset.file,
            this
        );

    });

});


// ==========================================
// DELETE FILE
// ==========================================

function deleteFile(fileName, row) {

    // Don't allow index.html to be deleted
    if (fileName === "index.html") {

        alert("index.html cannot be deleted.");

        return;
    }

    // Ask for confirmation
    const confirmDelete = confirm(
        "Delete " + fileName + "?"
    );

    if (!confirmDelete) {
        return;
    }

    // If deleting the currently open file
    if (currentFile === fileName) {

        currentFile = "index.html";

        window.editor.setValue(
            files["index.html"].code
        );

        monaco.editor.setModelLanguage(
            window.editor.getModel(),
            "html"
        );

    }

    // Remove from files object
    delete files[fileName];

    // Remove from screen
    row.remove();

    // Activate index.html
    document.querySelectorAll(".file-row").forEach(function (item) {

        item.classList.remove("active");

    });

    const indexButton =
        document.querySelector(
            '[data-file="index.html"]'
        );

    if (indexButton) {

        indexButton
            .closest(".file-row")
            .classList.add("active");

    }

}


// ==========================================
// EXISTING DELETE BUTTONS
// ==========================================

document.querySelectorAll(".delete-file").forEach(function (button) {

    button.addEventListener("click", function (event) {

        // Stop file button from opening
        event.preventDefault();
        event.stopPropagation();

        const fileName =
            this.dataset.file;

        const row =
            this.closest(".file-row");

        deleteFile(
            fileName,
            row
        );

    });

});


// ==========================================
// CREATE NEW FILE
// ==========================================

document.getElementById("newFileButton")
    .addEventListener("click", function () {

        const fileName = prompt(
            "Enter file name:",
            "newfile.html"
        );

        // Cancel
        if (!fileName) {
            return;
        }

        // Check duplicate
        if (files[fileName]) {

            alert(
                "This file already exists."
            );

            return;
        }


        // ======================================
        // DETERMINE LANGUAGE
        // ======================================

        let language = "plaintext";

        if (fileName.endsWith(".html")) {

            language = "html";

        }

        else if (fileName.endsWith(".css")) {

            language = "css";

        }

        else if (fileName.endsWith(".js")) {

            language = "javascript";

        }


        // ======================================
        // CREATE FILE
        // ======================================

        files[fileName] = {

            language: language,

            code: ""

        };


        // ======================================
        // CREATE FILE ROW
        // ======================================

        const row =
            document.createElement("div");

        row.className = "file-row";


        // File button

        const button =
            document.createElement("button");

        button.className =
            "file-item";

        button.dataset.file =
            fileName;

        button.textContent =
            "📄 " + fileName;


        // Delete button

        const deleteButton =
            document.createElement("button");

        deleteButton.className =
            "delete-file";

        deleteButton.dataset.file =
            fileName;

        deleteButton.textContent =
            "×";


        // Add buttons to row

        row.appendChild(button);

        row.appendChild(deleteButton);


        // Add row to file list

        document.getElementById("fileList")
            .appendChild(row);


        // ======================================
        // OPEN NEW FILE
        // ======================================

        button.addEventListener(
            "click",
            function () {

                openFile(
                    fileName,
                    this
                );

            }
        );


        // ======================================
        // DELETE NEW FILE
        // ======================================

        deleteButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                deleteFile(
                    fileName,
                    row
                );

            }
        );


        // Open automatically

        button.click();

    });


// ==========================================
// RUN CODE
// ==========================================

document.getElementById("runButton")
    .addEventListener("click", function () {

        if (!window.editor) {

            alert(
                "Editor is not ready yet."
            );

            return;
        }


        // Save current file

        saveCurrentFile();


        const output =
            document.getElementById("output");

        const outputStatus =
            document.getElementById(
                "outputStatus"
            );


        // Clear previous output

        output.innerHTML = "";


        // Running status

        outputStatus.textContent =
            "Running...";


        // Create iframe

        const iframe =
            document.createElement("iframe");

        iframe.style.width =
            "100%";

        iframe.style.height =
            "400px";

        iframe.style.border =
            "none";

        iframe.style.background =
            "white";

        iframe.style.borderRadius =
            "8px";


        // ======================================
        // HTML
        // ======================================

        if (currentFile === "index.html") {

            iframe.srcdoc =
                files["index.html"].code;

        }


        // ======================================
        // CSS
        // ======================================

        else if (currentFile === "style.css") {

            iframe.srcdoc = `

<!DOCTYPE html>

<html>

<head>

<style>

${files["style.css"].code}

</style>

</head>

<body>

<h1>CodeHub CSS Preview</h1>

<p>Your CSS is running successfully.</p>

<div class="box">

CodeHub

</div>

</body>

</html>

`;

        }


        // ======================================
        // JAVASCRIPT
        // ======================================

       else if (currentFile === "script.js") {

    iframe.srcdoc = `

<!DOCTYPE html>

<html>

<head>

<title>CodeHub JavaScript</title>

<style>

body {
    font-family: Arial;
    padding: 20px;
}

.error {
    color: #ef4444;
    font-weight: bold;
}

</style>

</head>

<body>

<h1>JavaScript Output</h1>

<div id="result">
    JavaScript is running...
</div>

<script>

window.onerror = function(message, source, line, column) {

    document.getElementById("result").innerHTML =
        '<div class="error">' +
        '❌ Error: ' +
        message +
        '<br>Line: ' +
        line +
        '</div>';

    parent.postMessage({
        type: "error",
        message: message,
        line: line
    }, "*");

    return true;

};

try {

    ${files["script.js"].code}

    parent.postMessage({
        type: "success"
    }, "*");

}

catch (error) {

    document.getElementById("result").innerHTML =
        '<div class="error">' +
        '❌ Error: ' +
        error.message +
        '</div>';

    parent.postMessage({
        type: "error",
        message: error.message
    }, "*");

}

<\/script>

</body>

</html>

`;

}



    


        // ======================================
        // OTHER FILES
        // ======================================

        else {

            iframe.srcdoc = `

<!DOCTYPE html>

<html>

<body>

<h2>CodeHub</h2>

<p>
Preview is not available for this file type yet.
</p>

</body>

</html>

`;

        }


        // Add iframe

        output.appendChild(
            iframe
        );


        // Success

        outputStatus.textContent =
            "Success";

    });
// ==========================================
// JAVASCRIPT ERROR MESSAGE
// ==========================================

window.addEventListener("message", function (event) {

    if (!event.data) {
        return;
    }

    const outputStatus =
        document.getElementById("outputStatus");


    // JavaScript error

    if (event.data.type === "error") {

        outputStatus.textContent =
            "Error";

        outputStatus.style.color =
            "#ef4444";

    }


    // JavaScript success

    else if (event.data.type === "success") {

        outputStatus.textContent =
            "Success";

        outputStatus.style.color =
            "#22d3ee";

    }

});

// ==========================================
// CLEAR OUTPUT
// ==========================================

document.getElementById("clearOutput")
    .addEventListener("click", function () {

        document.getElementById("output")
            .innerHTML = `

<div class="output-placeholder">

    Run your code to see the result here.

</div>

`;

        document.getElementById(
            "outputStatus"
        ).textContent = "Ready";

    });


// ==========================================
// FULLSCREEN OUTPUT
// ==========================================

document.getElementById(
    "fullscreenOutput"
).addEventListener("click", function () {

    const output =
        document.getElementById("output");


    if (!document.fullscreenElement) {

        output.requestFullscreen();

    }

    else {

        document.exitFullscreen();

    }

});

// ==========================================
// LEARNING VIEWS AND MULTI-LANGUAGE RUNNER
// ==========================================

const mainFiles = {
    html: "index.html",
    css: "style.css",
    javascript: "script.js",
    python: "main.py",
    c: "main.c",
    cpp: "main.cpp",
    java: "Main.java"
};

const starterCode = {
    html: `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>My first page</title></head>
<body>
  <h1>Hello, CodeHub!</h1>
  <p>Edit this page, then run it.</p>
</body>
</html>`,
    css: `body {
  font-family: sans-serif;
  padding: 2rem;
  background: #f1f5f9;
}

h1 {
  color: #0f766e;
}`,
    javascript: `const message = "Hello, CodeHub!";
console.log(message);
document.body.innerHTML = "<h1>" + message + "</h1>";`,
    python: `name = "CodeHub"
print(f"Hello, {name}!")`,
    c: `#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    return 0;
}`,
    cpp: `#include <iostream>

int main() {
    std::cout << "Hello, CodeHub!\\n";
    return 0;
}`,
    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CodeHub!");
    }
}`
};

const languageInfo = {
    html: { name: "HTML", summary: "Build the structure and meaning of a web page.", topics: "Elements · headings · links · forms" },
    css: { name: "CSS", summary: "Style web pages with layout, color, and responsive rules.", topics: "Selectors · box model · flexbox · responsive design" },
    javascript: { name: "JavaScript", summary: "Add behavior and interactivity to the browser.", topics: "Values · functions · arrays · DOM events" },
    python: { name: "Python", summary: "Write clear programs for automation, data, and general problem solving.", topics: "Variables · conditions · loops · functions" },
    c: { name: "C", summary: "Learn structured programming and how programs work close to the machine.", topics: "Types · conditions · loops · functions" },
    cpp: { name: "C++", summary: "Build fast programs with modern C++ fundamentals.", topics: "Types · control flow · functions · standard library" },
    java: { name: "Java", summary: "Create portable programs with classes and a strongly typed language.", topics: "Types · methods · classes · collections" }
};

const practiceCode = {
    exercises: {
        html: `<!doctype html><html lang="en"><body>\n  <h1>Your name here</h1>\n  <!-- Exercise: add a short introduction below. -->\n</body></html>`,
        css: `body { font-family: sans-serif; padding: 2rem; }\nh1 { color: #0f766e; }\n/* Exercise: add a background color. */`,
        javascript: `const name = "Your name";\nconsole.log("Hello, " + name + "!");\n// Exercise: print one more sentence.`,
        python: `name = "Your name"\nprint("Hello, " + name + "!")\n# Exercise: print one more sentence.`,
        c: `#include <stdio.h>\n\nint main(void) {\n    const char name[] = "Your name";\n    printf("Hello, %s!\\n", name);\n    // Exercise: print one more sentence.\n    return 0;\n}`,
        cpp: `#include <iostream>\n#include <string>\n\nint main() {\n    std::string name = "Your name";\n    std::cout << "Hello, " << name << "!\\n";\n    // Exercise: print one more sentence.\n    return 0;\n}`,
        java: `public class Main {\n    public static void main(String[] args) {\n        String name = "Your name";\n        System.out.println("Hello, " + name + "!");\n        // Exercise: print one more sentence.\n    }\n}`
    },
    challenges: {
        html: `<!doctype html><html lang="en"><body>\n  <h1>Welcome, Ada!</h1>\n  <p>Today I am learning to code.</p>\n  <!-- Challenge: add a link to a page you like. -->\n</body></html>`,
        css: `body { font-family: sans-serif; padding: 2rem; background: #f1f5f9; }\nh1 { color: #0f766e; }\np { border-left: 4px solid #f97316; padding-left: 1rem; }`,
        javascript: `const name = "Ada";\nconsole.log("Welcome, " + name + "!");\nconsole.log("Today I am learning to code.");\ndocument.body.innerHTML = "<h1>Welcome, " + name + "!</h1><p>Today I am learning to code.</p>";`,
        python: `name = "Ada"\nprint("Welcome, " + name + "!")\nprint("Today I am learning to code.")`,
        c: `#include <stdio.h>\n\nint main(void) {\n    printf("Welcome, Ada!\\n");\n    printf("Today I am learning to code.\\n");\n    return 0;\n}`,
        cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Welcome, Ada!\\n";\n    std::cout << "Today I am learning to code.\\n";\n    return 0;\n}`,
        java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Welcome, Ada!");\n        System.out.println("Today I am learning to code.");\n    }\n}`
    }
};

const practiceInfo = {
    tutorials: { heading: "Start learning", title: "Your first program", description: "Choose a language, explore its core ideas, then run the starter program in the editor." },
    examples: { heading: "Examples", title: "Make it say hello", description: "Run a small working program and change the message to your own." },
    exercises: { heading: "Exercises", title: "Personalize the output", description: "Change the starter program so it introduces you or displays a message you choose." },
    challenges: { heading: "Challenges", title: "Add one more step", description: "Extend the program with a second message, value, or page element." }
};

let activeLanguage = "html";
let activePractice = "tutorials";

function updateProgramInputHelp() {
    const programInputLabel = document.getElementById("programInputLabel");
    const programInput = document.getElementById("programInput");
    const programInputHint = document.getElementById("programInputHint");
    if (!programInputLabel || !programInput || !programInputHint) return;

    const usesScanf = activeLanguage === "c" && window.editor && /\bscanf\s*\(/.test(window.editor.getValue());
    if (usesScanf) {
        const source = window.editor.getValue();
        const promptMatch = source.match(/printf\s*\(\s*"((?:\\.|[^"\\])*)"/);
        const promptText = promptMatch
            ? promptMatch[1].replace(/\\n/g, " ").replace(/%[a-zA-Z]/g, "...").trim()
            : "Enter the input requested by your program.";
        programInputLabel.textContent = "Program input for scanf";
        programInput.placeholder = promptText;
        programInputHint.textContent = "Enter values in the order scanf reads them. Separate multiple values with spaces or new lines.";
    } else {
        programInputLabel.textContent = "Program input (stdin)";
        programInput.placeholder = "Enter the input your program reads.";
        programInputHint.textContent = "Input is sent to the program before it runs. Match the format your code expects.";
    }
}

function renderLearningView() {
    const panel = document.getElementById("learning");
    const language = languageInfo[activeLanguage];
    const practice = practiceInfo[activePractice];
    const stdinPanel = document.getElementById("stdinPanel");
    if (stdinPanel) {
        stdinPanel.hidden = !["python", "c", "cpp", "java"].includes(activeLanguage);
    }
    updateProgramInputHelp();

    panel.innerHTML = `
        <div class="learning-heading">
            <div>
                <p class="eyebrow">${practice.heading}</p>
                <h2>${language.name}: ${practice.title}</h2>
                <p>${practice.description}</p>
            </div>
            <span class="topic-list">${language.topics}</span>
        </div>
        <div class="learning-actions">
            <button type="button" data-load-starter>Load starter in editor</button>
            <a href="#compiler">Open compiler</a>
        </div>`;

    document.querySelectorAll("[data-language]").forEach(function (link) {
        link.classList.toggle("active", link.dataset.language === activeLanguage);
    });
    document.querySelectorAll("[data-practice]").forEach(function (link) {
        link.classList.toggle("active", link.dataset.practice === activePractice);
    });

    panel.querySelector("[data-load-starter]").addEventListener("click", function () {
        loadStarter();
        document.getElementById("compiler").scrollIntoView({ behavior: "smooth" });
    });
}

function renderFileList() {
    const list = document.getElementById("fileList");
    const visibleFiles = activeLanguage === "html" || activeLanguage === "css" || activeLanguage === "javascript"
        ? ["index.html", "style.css", "script.js"].filter(function (name) { return files[name]; })
        : [mainFiles[activeLanguage]].filter(function (name) { return files[name]; });

    list.innerHTML = "";
    visibleFiles.forEach(function (name) {
        const row = document.createElement("div");
        row.className = "file-row" + (name === currentFile ? " active" : "");
        const button = document.createElement("button");
        button.className = "file-item";
        button.type = "button";
        button.dataset.file = name;
        button.textContent = name;
        button.addEventListener("click", function () {
            saveCurrentFile();
            currentFile = name;
            activeLanguage = files[name].language;
            document.getElementById("languageSelect").value = activeLanguage;
            monaco.editor.setModelLanguage(window.editor.getModel(), activeLanguage);
            window.editor.setValue(files[name].code);
            renderLearningView();
            renderFileList();
        });
        row.appendChild(button);
        list.appendChild(row);
    });
}

function loadStarter() {
    const fileName = mainFiles[activeLanguage];
    const code = practiceCode[activePractice]
        ? practiceCode[activePractice][activeLanguage]
        : starterCode[activeLanguage];
    files[fileName] = { language: activeLanguage, code: code };
    currentFile = fileName;
    if (window.editor) {
        monaco.editor.setModelLanguage(window.editor.getModel(), activeLanguage);
        window.editor.setValue(code);
    }
    renderFileList();
}

function selectLanguage(language) {
    if (!languageInfo[language]) return;
    saveCurrentFile();
    activeLanguage = language;
    currentFile = mainFiles[language];
    if (!files[currentFile]) {
        files[currentFile] = { language: language, code: starterCode[language] };
    }
    document.getElementById("languageSelect").value = language;
    if (window.editor) {
        monaco.editor.setModelLanguage(window.editor.getModel(), language);
        window.editor.setValue(files[currentFile].code);
    }
    renderLearningView();
    renderFileList();
}

document.querySelectorAll("[data-language]").forEach(function (link) {
    link.addEventListener("click", function (event) {
        event.preventDefault();
        selectLanguage(this.dataset.language);
        document.getElementById("learning").scrollIntoView({ behavior: "smooth" });
    });
});

document.querySelectorAll("[data-practice]").forEach(function (link) {
    link.addEventListener("click", function (event) {
        event.preventDefault();
        activePractice = this.dataset.practice;
        renderLearningView();
        document.getElementById("learning").scrollIntoView({ behavior: "smooth" });
    });
});

document.getElementById("languageSelect").addEventListener("change", function () {
    selectLanguage(this.value);
});

function runWebProject(output, outputStatus) {
    const iframe = document.createElement("iframe");
    iframe.title = "Code preview";
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.style.cssText = "width:100%;height:360px;border:0;background:white;border-radius:6px";
    const html = files["index.html"] ? files["index.html"].code : starterCode.html;
    const css = files["style.css"] ? `<style>${files["style.css"].code}</style>` : "";
    const js = files["script.js"] ? files["script.js"].code.replace(/<\/script/gi, "<\\/script") : "";
    const runtime = `<script>
        window.onerror = function(message) { parent.postMessage({type:"web-error", message:String(message)}, "*"); };
        const originalLog = console.log.bind(console);
        console.log = function(...values) { parent.postMessage({type:"web-log", message:values.join(" ")}, "*"); originalLog(...values); };
        window.addEventListener("DOMContentLoaded", function() { try { ${js}\n } catch (error) { parent.postMessage({type:"web-error", message:error.message}, "*"); } });
    <\/script>`;
    const injected = css + runtime;
    iframe.srcdoc = /<\/head>/i.test(html)
        ? html.replace(/<\/head>/i, injected + "</head>")
        : injected + html;
    output.appendChild(iframe);
    outputStatus.textContent = "Running";
    iframe.addEventListener("load", function () {
        outputStatus.textContent = "Success";
        outputStatus.style.color = "#22d3ee";
    });
}

async function runNativeProgram(output, outputStatus) {
    const fileName = currentFile;
    const compilerNames = {
        python: "cpython-3.13.8",
        c: "gcc-13.2.0-c",
        cpp: "gcc-13.2.0",
        java: "openjdk-jdk-21+35"
    };
    let source = files[fileName].code;
    if (activeLanguage === "java") {
        source = source.replace(/\b(public\s+)?class\s+Main\b/, "class prog");
    }
    const runButton = document.getElementById("runButton");
    runButton.disabled = true;
    outputStatus.classList.add("is-running");
    outputStatus.textContent = "Compiling " + languageInfo[activeLanguage].name + "...";
    try {
        const response = await fetch("https://wandbox.org/api/compile.json", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                compiler: compilerNames[activeLanguage],
                code: source,
                stdin: document.getElementById("programInput").value
            })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "The code runner rejected this request.");
        const pre = document.createElement("pre");
        pre.className = "program-output";
        pre.textContent = [result.compiler_error, result.program_output, result.program_error]
            .filter(Boolean).join("\n") || "Program finished with no output.";
        output.appendChild(pre);
        const succeeded = result.status === "0";
        outputStatus.textContent = succeeded ? "Success" : "Error";
        outputStatus.style.color = succeeded ? "#22d3ee" : "#ef4444";
    } catch (error) {
        const pre = document.createElement("pre");
        pre.className = "program-output error-output";
        pre.textContent = error.message + "\nCheck your internet connection and try again.";
        output.appendChild(pre);
        outputStatus.textContent = "Unavailable";
        outputStatus.style.color = "#ef4444";
    } finally {
        runButton.disabled = false;
        outputStatus.classList.remove("is-running");
    }
}

async function runProject() {
    if (!window.editor) {
        document.getElementById("outputStatus").textContent = "Editor loading";
        return;
    }
    saveCurrentFile();
    const output = document.getElementById("output");
    const outputStatus = document.getElementById("outputStatus");
    output.innerHTML = "";
    outputStatus.style.color = "#22d3ee";
    if (["html", "css", "javascript"].includes(activeLanguage)) {
        runWebProject(output, outputStatus);
    } else {
        const programInput = document.getElementById("programInput");
        const source = files[currentFile].code;
        if (activeLanguage === "c" && /\bscanf\s*\(/.test(source) && !programInput.value.trim()) {
            outputStatus.textContent = "Input required";
            outputStatus.style.color = "#fbbf24";
            const message = document.createElement("p");
            message.className = "input-required-message";
            message.textContent = "Enter the requested value in Program input above, then run again.";
            output.appendChild(message);
            programInput.focus();
            return;
        }
        await runNativeProgram(output, outputStatus);
    }
}

document.addEventListener("click", function (event) {
    if (event.target.closest("#runButton")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        runProject();
    }
}, true);

window.addEventListener("message", function (event) {
    const iframe = document.querySelector("#output iframe");
    if (!iframe || event.source !== iframe.contentWindow) return;
    if (event.data.type === "web-log") {
        let consoleOutput = document.querySelector("#output .console-output");
        if (!consoleOutput) {
            consoleOutput = document.createElement("pre");
            consoleOutput.className = "console-output";
            output.appendChild(consoleOutput);
        }
        consoleOutput.textContent += (consoleOutput.textContent ? "\n" : "") + event.data.message;
    } else if (event.data.type === "web-error") {
        document.getElementById("outputStatus").textContent = "Error";
        document.getElementById("outputStatus").style.color = "#ef4444";
    }
});

renderLearningView();

window.scrollTo(0, 0);
document.body.style.overflow = "hidden";

const entryScreen = document.getElementById("entryScreen");
const appShell = document.getElementById("appShell");
const entryChoice = document.getElementById("entryChoice");
const entryAuth = document.getElementById("entryAuth");
const authNameField = document.getElementById("nameField");
const authNameInput = document.getElementById("accountName");
const accountButton = document.getElementById("openLogin");
const supabaseClient = window.supabase && window.CODEHUB_SUPABASE_URL && window.CODEHUB_SUPABASE_ANON_KEY
    ? window.supabase.createClient(window.CODEHUB_SUPABASE_URL, window.CODEHUB_SUPABASE_ANON_KEY)
    : null;
let authMode = "login";
let authenticatedUser = null;

function openEntry(mode) {
    entryScreen.hidden = false;
    appShell.inert = true;
    document.body.style.overflow = "hidden";
    entryChoice.classList.toggle("hidden", Boolean(mode));
    entryAuth.classList.toggle("hidden", !mode);
    if (mode) {
        setAuthMode(mode);
        document.querySelector('#authForm [name="email"]').focus();
    }
}

function closeEntry() {
    entryScreen.hidden = true;
    appShell.inert = false;
    document.body.style.overflow = "";
    document.getElementById("authForm").reset();
}

function setAuthMode(mode) {
    authMode = mode;
    const isSignup = mode === "signup";
    document.getElementById("authForm").reset();
    entryChoice.classList.add("hidden");
    entryAuth.classList.remove("hidden");
    authNameField.classList.toggle("hidden", !isSignup);
    authNameInput.required = isSignup;
    document.querySelector('#authForm [name="password"]').autocomplete = isSignup ? "new-password" : "current-password";
    document.getElementById("authOverline").textContent = isSignup ? "JOIN CODEHUB" : "WELCOME BACK";
    document.getElementById("authTitle").textContent = isSignup ? "Create your account" : "Log in";
    document.getElementById("authDescription").textContent = isSignup
        ? "Set up your account to keep learning." : "Pick up where you left off.";
    document.getElementById("authSubmit").innerHTML = (isSignup ? "Create account" : "Log in") + ' <span aria-hidden="true">&rarr;</span>';
    document.getElementById("authNotice").textContent = "Passwords are securely handled by CodeHub’s account service and never stored in plain text.";
}

function setAuthenticatedUser(user) {
    authenticatedUser = user;
    accountButton.textContent = user ? "Log out" : "Login";
    accountButton.setAttribute("aria-label", user ? "Log out of " + user.email : "Log in");
}

async function restoreAuthSession() {
    try {
        if (supabaseClient) {
            const { data, error } = await supabaseClient.auth.getSession();
            if (error) throw error;
            if (data.session) {
                setAuthenticatedUser(data.session.user);
                closeEntry();
            }
            return;
        }
        const response = await fetch("/api/auth/session", { credentials: "same-origin" });
        if (!response.ok) return;
        const result = await response.json();
        if (result.user) {
            setAuthenticatedUser(result.user);
            closeEntry();
        }
    } catch {
        // Guest entry remains available when the local auth server is offline.
    }
}

document.querySelectorAll("[data-auth-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
        setAuthMode(this.dataset.authMode);
    });
});

document.getElementById("continueGuest").addEventListener("click", closeEntry);
document.getElementById("continueGuestFromAuth").addEventListener("click", closeEntry);
document.getElementById("authBack").addEventListener("click", function () {
    entryAuth.classList.add("hidden");
    entryChoice.classList.remove("hidden");
});
accountButton.addEventListener("click", async function () {
    if (!authenticatedUser) {
        openEntry("login");
        return;
    }
    try {
        if (supabaseClient) {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
        } else {
            await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
        }
    } finally {
        setAuthenticatedUser(null);
        openEntry();
    }
});
document.querySelector(".entry-logo").addEventListener("click", function (event) {
    event.preventDefault();
    entryAuth.classList.add("hidden");
    entryChoice.classList.remove("hidden");
});
document.getElementById("authForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = document.getElementById("authSubmit");
    const notice = document.getElementById("authNotice");
    const formData = new FormData(form);
    const credentials = Object.fromEntries(formData.entries());
    submitButton.disabled = true;
    notice.textContent = authMode === "signup" ? "Creating your account..." : "Checking your account...";
    try {
        if (supabaseClient) {
            if (authMode === "signup") {
                const { data, error } = await supabaseClient.auth.signUp({
                    email: credentials.email,
                    password: credentials.password,
                    options: { data: { full_name: credentials.name } }
                });
                if (error) throw error;
                if (data.session) {
                    setAuthenticatedUser(data.user);
                    closeEntry();
                } else {
                    notice.textContent = "Check your email to confirm your account, then log in here.";
                    form.reset();
                }
                return;
            }

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password
            });
            if (error) throw error;
            setAuthenticatedUser(data.user);
            closeEntry();
            return;
        }

        const response = await fetch("/api/auth/" + authMode, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(credentials)
        });
        const result = await response.json();
        if (!response.ok) {
            notice.textContent = result.error || "Unable to access your account.";
            return;
        }
        setAuthenticatedUser(result.user);
        closeEntry();
    } catch (error) {
        notice.textContent = supabaseClient
            ? error.message || "Unable to access your account. Check your Supabase Auth settings."
            : location.port === "3000"
                ? "Can’t reach the account server. In the project folder, run node server.js and open http://127.0.0.1:3000."
                : "Account access requires the CodeHub server. Open http://127.0.0.1:3000 instead of the Five Server page.";
    } finally {
        submitButton.disabled = false;
    }
});

restoreAuthSession();