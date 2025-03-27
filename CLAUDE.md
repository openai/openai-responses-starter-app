# CLAUDE.md - OpenAI Responses Starter App Guidelines

## Project Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Code Style Guidelines
- **Imports**: Use absolute imports with @ alias (`@/components/*`). Group imports by external/internal.
- **TypeScript**: Use strict type checking. Define interfaces for data structures. Avoid `any` when possible.
- **Naming**: Use camelCase for variables/functions, PascalCase for components/types, kebab-case for files.
- **Components**: Follow React functional component patterns with explicit prop types.
- **Error Handling**: Use try/catch blocks with specific error messages and logging.
- **State Management**: Use Zustand for global state (see `useConversationStore.ts`).
- **Formatting**: Follow NextJS/TypeScript conventions with 2 space indentation.
- **File Organization**: Group related functionality in directories, separate UI/logic concerns.
- **Comments**: Add JSDoc comments for functions, especially for complex logic.