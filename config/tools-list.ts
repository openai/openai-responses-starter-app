// List of tools available to the assistant
// No need to include the top-level wrapper object as it is added in lib/tools/tools.ts
// More information on function calling: https://platform.openai.com/docs/guides/function-calling

export const toolsList = [
  {
    name: "get_weather",
    description: "Get the weather for a given location",
    parameters: {
      location: {
        type: "string",
        description: "Location to get weather for",
      },
      unit: {
        type: "string",
        description: "Unit to get weather in",
        enum: ["celsius", "fahrenheit"],
      },
    },
  },
  {
    name: "get_joke",
    description: "Get a programming joke",
    parameters: {},
  },
  {
    name: "github_create_repo",
    description: "Create a new GitHub repository",
    parameters: {
      name: {
        type: "string",
        description: "The name of the repository",
      },
      description: {
        type: "string",
        description: "The description of the repository",
      },
      private: {
        type: "boolean",
        description: "Whether the repository should be private",
      },
    },
  },
  {
    name: "github_create_file",
    description: "Create or update a file in a GitHub repository",
    parameters: {
      owner: {
        type: "string",
        description: "The owner of the repository",
      },
      repo: {
        type: "string",
        description: "The name of the repository",
      },
      path: {
        type: "string",
        description: "The path to the file",
      },
      content: {
        type: "string",
        description: "The content of the file",
      },
      message: {
        type: "string",
        description: "The commit message",
      },
    },
  },
  {
    name: "github_list_repos",
    description: "List repositories for the authenticated user",
    parameters: {},
  },
  {
    name: "github_get_file_content",
    description: "Get the content of a file in a GitHub repository",
    parameters: {
      owner: {
        type: "string",
        description: "The owner of the repository",
      },
      repo: {
        type: "string",
        description: "The name of the repository",
      },
      path: {
        type: "string",
        description: "The path to the file",
      },
    },
  },
];
