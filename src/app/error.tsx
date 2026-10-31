"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section role="alert" aria-labelledby="err-heading" className="card p-8 text-center">
      <h1 id="err-heading" className="font-[family-name:var(--font-display)] text-3xl font-bold text-maroon">
        Something went wrong
      </h1>
      <p className="mt-2 text-muted">Your saved plan is stored in this browser and is safe.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-5">
        Try again
      </button>
    </section>
  );
}
