// Functions mapping to tool calls
// Define one function per tool call - each tool call should have a matching function
// Parameters for a tool call are passed as an object to the corresponding function

export const get_weather = async ({
  location,
  unit,
}: {
  location: string;
  unit: string;
}) => {
  const res = await fetch(
    `/api/functions/get_weather?location=${location}&unit=${unit}`
  ).then((res) => res.json());

  return res;
};

export const get_joke = async () => {
  const res = await fetch(`/api/functions/get_joke`).then((res) => res.json());
  return res;
};

export const github_create_repo = async (params: {
  name: string;
  description?: string;
  private?: boolean;
}) => {
  const res = await fetch("/api/functions/github/create_repo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }).then((res) => res.json());
  return res;
};

export const github_create_file = async (params: {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
}) => {
  const res = await fetch("/api/functions/github/create_file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }).then((res) => res.json());
  return res;
};

export const github_list_repos = async () => {
  const res = await fetch("/api/functions/github/list_repos").then((res) =>
    res.json()
  );
  return res;
};

export const github_get_file_content = async (params: {
  owner: string;
  repo: string;
  path: string;
}) => {
  const res = await fetch(
    `/api/functions/github/get_file_content?owner=${params.owner}&repo=${params.repo}&path=${params.path}`
  ).then((res) => res.json());
  return res;
};

export const functionsMap = {
  get_weather: get_weather,
  get_joke: get_joke,
  github_create_repo: github_create_repo,
  github_create_file: github_create_file,
  github_list_repos: github_list_repos,
  github_get_file_content: github_get_file_content,
};
