export default function AppLoading() {
  return (
    <main aria-busy="true" aria-label="Loading">
      <div className="space-y-3 pt-4">
        <div className="skeleton h-8 w-2/3" />
        <div className="skeleton h-28 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-24 w-full" />
        </div>
      </div>
    </main>
  );
}
