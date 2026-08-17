export default function ReportsLoading() {
  return (
    <main aria-busy="true" aria-label="Loading reports">
      <div className="space-y-3 pt-4">
        <div className="skeleton h-8 w-1/2" />
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-40 w-full" />
      </div>
    </main>
  );
}
