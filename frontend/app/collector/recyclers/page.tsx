"use client";

import Link from "next/link";

export default function RecyclerDiscoveryPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-8">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 px-4 py-4">

          <Link
            href="/collector"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl"
          >
            ←
          </Link>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-700">
              Kabadiwala Connect
            </p>

            <h1 className="truncate text-lg font-bold text-gray-900">
              Find Recyclers
            </h1>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-xl">
            📍
          </div>

        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5">

        {/* Material Context */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
              📦
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Recycler search
              </p>

              <h2 className="mt-1 text-lg font-bold text-gray-900">
                Select a material lot
              </h2>

              <p className="mt-1 text-sm leading-5 text-gray-600">
                Recycler availability will be loaded from the connected
                backend.
              </p>

            </div>

          </div>

        </section>

        {/* Location */}
        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-xl">
              📍
            </div>

            <div className="min-w-0 flex-1">

              <h2 className="font-bold text-gray-900">
                Location
              </h2>

              <p className="mt-1 text-sm leading-5 text-gray-600">
                Your location will be used to find eligible recyclers nearby.
              </p>

            </div>

          </div>

          <button
            type="button"
            className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700"
          >
            Select Location
          </button>

        </section>

        {/* Real Data State */}
        <section className="mt-7 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-200">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
            ♻️
          </div>

          <h2 className="mt-4 text-lg font-bold text-gray-900">
            No recyclers available yet
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-600">
            Recycler information will appear here once verified recycler
            records are available in the system.
          </p>

        </section>

        {/* Backend Status */}
        <section className="mt-5 rounded-2xl bg-yellow-50 p-4">

          <div className="flex items-start gap-3">

            <span className="text-xl">
              ℹ️
            </span>

            <div>

              <p className="text-sm font-semibold text-yellow-900">
                Recycler directory is not connected yet
              </p>

              <p className="mt-1 text-xs leading-5 text-yellow-800">
                This screen will display only verified records retrieved from
                the application backend. No placeholder recycler information
                is being shown.
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}