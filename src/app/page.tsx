import Link from "next/link";
export default function Dashboard() {
  return (
    <section>
      <p className="mb-3 text-xs font-semibold tracking-widest text-emerald-700 uppercase">
        Start with the essentials
      </p>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        Find your cadence.
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-stone-600">
        A place to bring your foods, recipes, and weekly meals together. We’re
        starting with a solid nutrition foundation.
      </p>
      <div className="mt-10 rounded-xl border border-stone-200 bg-white p-8">
        <p className="text-sm font-medium text-emerald-700">First up</p>
        <h2 className="mt-2 text-xl font-semibold">Your food collection</h2>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone-600">
          Keep the nutritional values for the foods you use in one place. Food
          entry will arrive in the next milestone.
        </p>
        <Link
          href="/foods"
          className="mt-6 inline-flex rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Explore Foods{" "}
          <span aria-hidden="true" className="ml-3">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
