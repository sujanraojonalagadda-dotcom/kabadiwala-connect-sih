"use client";

import { useEffect, useState } from "react";

type Recycler = {
  id: string;
  userId: string;
  businessName: string | null;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
};

export default function RecyclersPage() {
  const [recyclers, setRecyclers] = useState<Recycler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecyclers() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/recyclers");

        if (!response.ok) {
          throw new Error("Unable to load recyclers.");
        }

        const data = await response.json();

        if (!data.ok) {
          throw new Error(data.error || "Unable to load recyclers.");
        }

        setRecyclers(data.recyclers);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load recyclers.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadRecyclers();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f8f4] px-5 py-6">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <p className="text-sm font-medium text-green-700">
            Kabadiwala Connect
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Find Recyclers
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Connect your material lot with verified recyclers.
          </p>
        </header>

        <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-900">
            Recycler availability
          </p>

          <p className="mt-1 text-sm text-gray-600">
            Only verified recycler records from the connected database are
            shown.
          </p>
        </section>

        {loading && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
            <p className="text-sm text-gray-600">
              Loading verified recyclers...
            </p>
          </section>
        )}

        {!loading && error && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-800">
              Unable to load recyclers
            </p>

            <p className="mt-1 text-sm text-red-700">{error}</p>
          </section>
        )}

        {!loading && !error && recyclers.length === 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
              ♻️
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No verified recyclers available yet
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Verified recycler records will appear here when they are
              available in the system.
            </p>
          </section>
        )}

        {!loading && !error && recyclers.length > 0 && (
          <section className="space-y-3">
            {recyclers.map((recycler) => (
              <article
                key={recycler.id}
                className="rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {recycler.businessName || "Verified Recycler"}
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                      Verified recycler
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    Verified
                  </span>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}