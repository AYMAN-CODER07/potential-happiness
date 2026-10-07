# CodeHub

CodeHub is a static learning and compiler site. GitHub Pages hosts the site; Supabase Auth provides real email/password sign-up and login. The local Node server remains available for development.

## Run locally

```powershell
node server.js
```

Open `http://127.0.0.1:3000/`. When the Supabase config is blank, the local server's account API is used.

## Deploy with GitHub Pages

1. Create a Supabase project and enable Email/password under **Authentication > Providers**.
2. In Supabase **Authentication > URL Configuration**, set the Site URL to `https://OWNER.github.io/REPOSITORY/`. Add that exact URL to the allowed redirect URLs. Replace `OWNER` and `REPOSITORY` with your GitHub values.
3. In GitHub **Settings > Secrets and variables > Actions > Variables**, add:
   - `SUPABASE_URL`: the Project URL from Supabase API settings.
   - `SUPABASE_ANON_KEY`: the project's publishable/anon key.
4. In GitHub **Settings > Pages**, choose **GitHub Actions** as the build and deployment source.
5. Push this repository to GitHub on the `main` branch, or run the **Deploy CodeHub to GitHub Pages** workflow manually.

The workflow generates `supabase-config.js` during deployment and uploads only `index.html`, `app.js`, `style.css`, and that generated config. It does not publish the local Node server, account database, or test data. Never put a Supabase `service_role` key in GitHub variables or browser code. The anon key is public by design; protect data with Supabase Row Level Security if you add database tables.

The GitHub Pages URL appears in **Actions > Deploy CodeHub to GitHub Pages** after a successful deployment. GitHub Pages cannot run `server.js`; hosted account access uses Supabase instead.
