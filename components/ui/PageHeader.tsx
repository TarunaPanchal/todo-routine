export function PageHeader({ title, right, sub }: { title: string; right?: React.ReactNode; sub?: string }) {
  return (
    <header className="flex items-end justify-between px-5 pb-3 pt-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">{title}</h1>
        {sub && <p className="text-sm font-semibold text-muted">{sub}</p>}
      </div>
      {right}
    </header>
  );
}
