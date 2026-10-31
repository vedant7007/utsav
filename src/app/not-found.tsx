import Link from "next/link";

export default function NotFound() {
  return (
    <section aria-labelledby="nf-heading" className="card p-8 text-center">
      <h1 id="nf-heading" className="font-[family-name:var(--font-display)] text-3xl font-bold text-maroon">
        Page not found
      </h1>
      <p className="mt-2 text-muted">This page does not exist. Your saved plan is safe.</p>
      <Link href="/" className="btn btn-primary mt-5">
        Back to Utsav
      </Link>
    </section>
  );
}
