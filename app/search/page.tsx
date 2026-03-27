import SearchResultsClient from "@/components/SearchResultsClient";

export default function SearchResultsPage({
  searchParams,
}: {
  searchParams: { q?: string | string[] };
}) {
  const query = Array.isArray(searchParams.q)
    ? searchParams.q[0] ?? ""
    : typeof searchParams.q === "string"
      ? searchParams.q
      : "";

  return <SearchResultsClient initialQuery={query} />;
}
