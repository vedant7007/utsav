import type { JSX } from "react";
import Link from "next/link";

export default function NotFound(): JSX.Element {
  return (
    <section
      aria-labelledby="nf-heading"
      className="sticker mx-auto my-12 max-w-xl p-8 text-center"
    >
      <h1 id="nf-heading" className="display text-4xl">
        Page not found
      </h1>
      <p className="mt-2 text-muted">This page does not exist. Your saved plan is safe.</p>
      <Link href="/" className="btn btn-primary mt-5">
        Back to Utsav
      </Link>
    </section>
  );
}
