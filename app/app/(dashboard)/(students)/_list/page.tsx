import { listStudents } from "./queries";
import { buildInitialQueryParams } from "./searchParams";
import StudentsClient from "./StudentsClient";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const initialQueryParams = buildInitialQueryParams(resolvedSearchParams);
  const initialData = await listStudents(initialQueryParams);

  return <StudentsClient initialData={initialData} initialQueryParams={initialQueryParams} />;
}
