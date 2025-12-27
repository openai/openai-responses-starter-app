# Deploying TacticDev Gen Intel to Hostinger (Node.js)

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
     npm ci && npm run build && npm prune --production
     ```
   - Output directory: `.next/standalone`
   - Package manager: `npm`
   - App startup file: `.next/standalone/server.js`

4. Environment variables (add these in Hostinger UI):
   - NEXT_PUBLIC_APP_NAME = TacticDev Gen Intel
   - NEXT_PUBLIC_SITE_ORIGIN = https://gen.tacticdev.com
   - OPENAI_API_KEY = <your-openai-api-key>
   - RESPONSES_MODEL = gpt-5.2
   - RESPONSES_DEVELOPER_PROMPT = <optional prompt override>
   - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
   - GOOGLE_REDIRECT_URI = https://gen.tacticdev.com/api/google/callback
   - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
   - GITHUB_REDIRECT_URI = https://gen.tacticdev.com/api/github/callback
   - DEFAULT_VECTOR_STORE_ID / DEFAULT_VECTOR_STORE_NAME (optional)
   - ADMIN_PASSWORD (required for admin endpoints)

5. GitHub / Google OAuth settings:
   - For GitHub App, set Authorization callback URL(s):
     - https://<hostinger-temp-domain>/api/github/callback
     - https://gen.tacticdev.com/api/github/callback
   - For Google OAuth, set authorized redirect URIs similarly.

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

If you want, I can:
- Prepare the exact env var values text you can paste into Hostinger UI, or
- Remove `.env` from the Git history (git filter-repo or BFG) if you want me to redact secrets from history.

