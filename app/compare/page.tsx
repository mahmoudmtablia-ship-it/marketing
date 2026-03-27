import CompareClient from "@/components/CompareClient";

export default function ComparePage({
  searchParams,
}: {
  searchParams: { ids?: string | string[] };
}) {
  const idsParam = Array.isArray(searchParams.ids)
    ? searchParams.ids[0] ?? ""
    : typeof searchParams.ids === "string"
      ? searchParams.ids
      : "";
  const ids = idsParam
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return <CompareClient initialIds={ids} />;
}
