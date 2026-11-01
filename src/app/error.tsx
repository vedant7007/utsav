"use client";

import type { JSX } from "react";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }): JSX.Element {
  return (
    <section
      role="alert"
      aria-labelledby="err-heading"
      className="sticker mx-auto my-12 max-w-xl p-8 text-center"
    >
      <h1 id="err-heading" className="display text-4xl">
        Something went wrong
      </h1>
      <p className="mt-2 text-muted">Your saved plan is stored in this browser and is safe.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-5">
        Try again
      </button>
    </section>
  );
}
