# Connectivity & Auth Diagnostics

We have implemented a comprehensive logging system to diagnose 403 Forbidden and 401 Unauthorized errors.

## Structured Logging

All API routes now use structured logging via `lib/logger.ts`. Logs are output to stdout/stderr and include:
- `timestamp`: ISO timestamp
- `level`: info, warn, error
- `message`: Human readable message
- `requestId`: Unique ID for tracing requests
- `status`: HTTP status code
- `duration`: Time taken for upstream calls
- `rateLimit`: GitHub rate limit headers (limit, remaining, reset)
- `upstreamError`: Full error body from upstream providers (GitHub, Google)

## Instrumented Routes

The following routes have been instrumented:
- `app/api/functions/github/list_repos/route.ts`
- `app/api/functions/github/create_file/route.ts`
- `app/api/functions/github/create_repo/route.ts`
- `app/api/functions/github/get_file_content/route.ts`
- `app/api/oauth/[provider]/auth/route.ts`
- `app/api/oauth/[provider]/callback/route.ts`
- `app/api/admin/login/route.ts`
- `app/api/admin/check/route.ts`

## How to Debug 403 Errors

1. **Check the Logs**: Look for `level: "error"` and `status: 403`.
2. **Inspect `upstreamError`**: The logs will contain the JSON body returned by GitHub/Google.
   - Example: `{"message": "Resource not accessible by integration", ...}`
3. **Check Rate Limits**: Look at the `rateLimit` object in the logs.
4. **Trace Request**: Use the `requestId` to correlate logs across different components.

## Common 403 Causes

- **Bad Credentials**: Token is invalid or expired. (Status 401 usually, but can be 403).
- **Insufficient Scope**: The token lacks the `repo` or `user` scope.
- **Rate Limit Exceeded**: `x-ratelimit-remaining` is 0.
- **SSO Enforcement**: Organization requires SAML SSO authorization for the token.
- **IP Allowlist**: GitHub organization restricts access by IP.
