# TacticDev GenTel™

**TacticDev GenTel™** is a private, internal generative intelligence platform designed to accelerate developer workflows and centralize organizational knowledge. Built on the OpenAI Responses API, it provides a secure, high-performance interface for interacting with advanced language models integrated with TacticDev's internal tools and data.

## Core Capabilities

- **Contextual Intelligence**: Seamlessly search through internal documentation and codebases using integrated vector stores.
- **Real-time Web Access**: Augmented responses with live web search for up-to-date technical information.
- **Ecosystem Integration**:
  - **GitHub**: Direct interaction with repositories, file management, and automated PR workflows.
  - **Google Workspace**: Secure connectivity to Calendar and Gmail for scheduling and communication assistance.
- **Extensible Tooling**: Support for Model Context Protocol (MCP) and custom function calling for specialized internal services.
- **Developer-First UX**: Optimized for speed with streaming responses, markdown support, and integrated code execution.

## Architecture

GenTel™ is built with a modern, cloud-native stack:
- **Frontend/Backend**: Next.js 15 (App Router)
- **AI Engine**: OpenAI Responses API (Real-time streaming)
- **Authentication**: Generic OAuth 2.0 framework with PKCE and HMAC-signed state management.
- **Styling**: Tailwind CSS with a unified "Midnight" dark mode.

## Deployment & Configuration

This application is designed for deployment in secure environments (e.g., Hostinger Node.js Selector, GitHub Codespaces). Configuration is managed strictly through environment variables to ensure security.

### Key Configuration Keys
- \`OPENAI_API_KEY\`: Primary AI engine access.
- \`OAUTH_STATE_SECRET\`: Cryptographic secret for secure authentication flows.
- \`GITHUB_CLIENT_ID\` / \`GITHUB_CLIENT_SECRET\`: Internal GitHub App credentials.
- \`GOOGLE_CLIENT_ID\` / \`GOOGLE_CLIENT_SECRET\`: Google Workspace integration credentials.

For detailed deployment instructions, refer to the internal \`DEPLOY_HOSTINGER.md\` or contact the platform engineering team.

---

*Proprietary and Confidential. For internal use by TacticDev personnel only.*
