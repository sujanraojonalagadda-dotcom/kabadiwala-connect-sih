import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16 text-center">
        {/* Logo */}
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
          ♻️
        </div>

        {/* Brand */}
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-green-700">
          Kabadiwala Connect
        </p>

        {/* Heading */}
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Connecting collectors with the formal recycling ecosystem
        </h1>

        {/* Description */}
        <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
          Create material lots, discover recyclers, receive quotes, and keep
          your recycling transactions documented in one place.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-xl bg-green-700 px-8 py-4 font-semibold text-white shadow-sm transition hover:bg-green-800"
          >
            Get Started
          </Link>

          <button
            type="button"
            className="rounded-xl border border-gray-300 bg-white px-8 py-4 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Learn More
          </button>
        </div>

        {/* Footer text */}
        <p className="mt-8 text-sm text-gray-500">
          Collector-first • Simple • Traceable
        </p>
      </section>
    </main>
  );
}