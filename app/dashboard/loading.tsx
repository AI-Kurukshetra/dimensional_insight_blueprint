export default function LoadingDashboard() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-72 animate-pulse rounded-xl bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl bg-white shadow" />
        ))}
      </div>
    </div>
  );
}
