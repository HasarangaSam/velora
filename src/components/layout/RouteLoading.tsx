export default function RouteLoading({
  label,
  type = "content",
}: {
  label: string;
  type?: "content" | "products" | "dashboard" | "account";
}) {
  return (
    <main aria-label={label} aria-busy="true" className="mx-auto min-h-[55vh] w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div role="status" className="sr-only">{label}</div>
      {type === "products" ? (
        <>
          <div className="mb-8 space-y-3"><div className="h-3 w-24 animate-pulse rounded bg-stone-200" /><div className="h-8 w-60 max-w-full animate-pulse rounded bg-stone-200" /></div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 8 }, (_, index) => <div key={index} className="space-y-3"><div className="aspect-[4/5] animate-pulse rounded-2xl bg-stone-100" /><div className="h-3 w-20 animate-pulse rounded bg-stone-100" /><div className="h-4 w-4/5 animate-pulse rounded bg-stone-100" /><div className="h-4 w-1/3 animate-pulse rounded bg-stone-100" /></div>)}
          </div>
        </>
      ) : type === "dashboard" ? (
        <>
          <div className="mb-8 space-y-3"><div className="h-3 w-28 animate-pulse rounded bg-slate-200" /><div className="h-8 w-64 max-w-full animate-pulse rounded bg-slate-200" /></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div>
          <div className="mt-6 h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </>
      ) : type === "account" ? (
        <>
          <div className="mb-8 space-y-3"><div className="h-3 w-24 animate-pulse rounded bg-slate-200" /><div className="h-8 w-56 max-w-full animate-pulse rounded bg-slate-200" /></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div>
        </>
      ) : (
        <div className="space-y-5"><div className="h-8 w-64 max-w-full animate-pulse rounded bg-slate-200" /><div className="h-4 w-full max-w-2xl animate-pulse rounded bg-slate-100" /><div className="h-64 animate-pulse rounded-2xl bg-slate-100" /></div>
      )}
    </main>
  );
}
