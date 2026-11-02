export function ScreenSkeleton() {
  return (
    <div className="space-y-3 px-5 pt-6" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-28" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton h-20" />
      ))}
    </div>
  );
}
