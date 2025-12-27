import ErrorPage from "@/components/error-page";

export default function NotFound() {
  return <ErrorPage code={404} title="Page not found" message="The page you requested doesn't exist." />;
}
