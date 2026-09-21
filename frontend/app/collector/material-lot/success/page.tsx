"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const lotId = searchParams.get("id");

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto flex min-h-[90vh] max-w-lg items-center">
        <section className="w-full rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-200">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
            ✓
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-wider text-green-700">
            Kabadiwala Connect
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Material Lot Created
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Your material lot has been successfully recorded.
          </p>

          {lotId && (
            <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Real Lot ID
              </p>

              <p className="mt-2 break-all font-mono text-sm font-semibold text-gray-900">
                {lotId}
              </p>
            </div>
          )}

          <Link
            href="/collector"
            className="mt-6 block w-full rounded-2xl bg-green-700 px-6 py-4 font-bold text-white hover:bg-green-800"
          >
            Back to Dashboard
          </Link>

          <Link
            href="/collector/material-lot"
            className="mt-3 block w-full rounded-2xl border border-gray-300 bg-white px-6 py-4 font-semibold text-gray-700"
          >
            Create Another Lot
          </Link>
        </section>
      </div>
    </main>
  );
}

export default function MaterialLotSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-600">Loading...</p>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}