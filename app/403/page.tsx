import ErrorPage from "@/components/error-page";

export default function Forbidden() {
  return <ErrorPage code={403} title="Access denied" message="You don't have permission to access this page." />;
}
