# Deploying TacticDev GenTel™ to Hostinger (Node.js)

Follow these steps to deploy the app to Hostinger using the Node.js app option.

1. Ensure Hostinger plan supports Node.js (Premium or Business tier).

2. Add the app in Hostinger > Node.js (or Apps > Add new Node app):
   - Framework preset: Next.js
   - Branch: `main`
   - Node version: 18.x or 22.x
   - Root directory: `./`

3. Build & output settings:
   - Build command:
     ```bash
     npm run build
     ```
     Note: this repo includes `prebuild` and `postbuild` scripts so `npm run build` will run `npm ci` before the build and `npm prune --production` after the build. This makes it compatible with providers that only accept a single build command.
   - Output directory: `.next/standalone`
   - Package manager: `npm`
   - App startup file: `.next/standalone/server.js`

4. Environment variables (add these in Hostinger UI):
   - NEXT_PUBLIC_APP_NAME = TacticDev GenTel™
   - NEXT_PUBLIC_SITE_ORIGIN = https://gen.tacticdev.com
   - OPENAI_API_KEY = <your-openai-api-key>
   - RESPONSES_MODEL = gpt-5.2
   - RESPONSES_DEVELOPER_PROMPT = <optional prompt override>
   - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
   - GITHUB_REDIRECT_URI = https://gen.tacticdev.com/api/oauth/github/callback
   - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
   - GOOGLE_REDIRECT_URI = https://gen.tacticdev.com/api/oauth/google/callback
   - OAUTH_STATE_SECRET = <long-random-string>
   - OAUTH_RETURN_ALLOWLIST = https://gen.tacticdev.com,https://teal-wasp-987766.hostingersite.com
   - DEFAULT_VECTOR_STORE_ID / DEFAULT_VECTOR_STORE_NAME (optional)
   - ADMIN_PASSWORD (required for admin endpoints)

5. GitHub / Google OAuth settings:
   - For GitHub App, set Authorization callback URL(s):
     - https://teal-wasp-987766.hostingersite.com/api/oauth/github/callback
     - https://gen.tacticdev.com/api/oauth/github/callback
   - For Google OAuth, set authorized redirect URIs similarly:
     - https://teal-wasp-987766.hostingersite.com/api/oauth/google/callback
     - https://gen.tacticdev.com/api/oauth/google/callback

6. DNS & domain:
   - Add the subdomain `gen.tacticdev.com` in Hostinger Domains > Subdomains.
   - Follow Hostinger documentation to point DNS to their servers (CNAME or A record) and add the custom domain to your Hostinger app.
   - Wait for DNS propagation.

7. Deploy:
   - Start the deployment in Hostinger (Deploy button).
   - Check build logs; if the build fails, paste logs here and I can help debug.

8. Post-deploy checks:
   - Visit the temporary domain first to confirm the app loads.
   - Click Connect GitHub and confirm OAuth succeeds (if not, copy the exact redirect URL from the browser error and add it to your GitHub OAuth app).
   - Visit https://gen.tacticdev.com once DNS is live.

9. Security best practices:
   - Never commit production secrets to the repo. Use Hostinger's env var UI instead.
   - Add `.env` to `.gitignore` (this repo already ignores `.env*` but has `.env` in history—remove it from repo history if needed).

10. Branded fallback error pages (recommended)

Hostinger and similar providers allow custom error pages that are served when the hosting stack returns HTTP errors (403/404/500) before your Node.js app handles the request. To provide a branded experience during outages or misconfiguration, this repo includes ready-made, branded static error pages located at `public/errors/403.html`, `public/errors/404.html`, and `public/errors/500.html`.

How to use them:
- In Hostinger hPanel, look for **Advanced → Error Pages** (or similar). For each relevant HTTP status (403, 404, 500), paste the contents of the matching `public/errors/*.html` page or upload the file if the panel allows it. This ensures that when the shared hosting layer or CDN responds with a 403/500/404, visitors see a TacticDev-branded message.
- After uploading/pasting, test the domain to confirm the custom pages are served as expected.

If you prefer, I can also provide separate unbranded/plain copies suitable for external communication or temporary maintenance pages.

If you want me to push these files and update the repository, say the word and I’ll commit and push them now.

