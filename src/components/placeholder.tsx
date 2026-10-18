export function Placeholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section>
      <p className="mb-3 text-xs font-semibold tracking-widest text-emerald-700 uppercase">
        Your workspace
      </p>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        {title}
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-stone-600">
        {description}
      </p>
      <div className="mt-10 rounded-xl border border-dashed border-stone-300 bg-white/60 p-8">
        <h2 className="font-medium">Coming in a future milestone</h2>
        <p className="mt-2 text-sm text-stone-600">
          This space is ready for the next step.
        </p>
      </div>
    </section>
  );
}
