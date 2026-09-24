import Link from "next/link";

type ProductPaginationProps = {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
};

export default function ProductPagination({
  page,
  totalPages,
  searchParams,
}: ProductPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  function buildUrl(targetPage: number) {
    const params = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
      if (key === "page" || value === undefined) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => params.append(key, item));
      } else {
        params.set(key, value);
      }
    });

    params.set("page", String(targetPage));

    return `/shop?${params.toString()}`;
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      {page > 1 && (
        <Link
          href={buildUrl(page - 1)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Previous
        </Link>
      )}

      <span className="px-4 text-sm text-slate-600">
        Page {page} of {totalPages}
      </span>

      {page < totalPages && (
        <Link
          href={buildUrl(page + 1)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Next
        </Link>
      )}
    </div>
  );
}
