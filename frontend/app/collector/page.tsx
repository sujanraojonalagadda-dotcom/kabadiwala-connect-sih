"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MaterialLot = {
  id: string;
  material: string;
  weightKg: string | number;
  photoUrl: string | null;
  createdAt: string;
};

const materialNames: Record<string, string> = {
  E_WASTE: "E-Waste",
  PLASTIC: "Plastic",
  METAL: "Metal",
  PAPER: "Paper",
  OTHER: "Other",
};

function formatMaterial(material: string) {
  return materialNames[material] ?? material.replaceAll("_", " ");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CollectorDashboard() {
  const [lots, setLots] = useState<MaterialLot[]>([]);
  const [loadingLots, setLoadingLots] = useState(true);
  const [lotsError, setLotsError] = useState("");

  useEffect(() => {
    async function loadLots() {
      setLoadingLots(true);
      setLotsError("");

      try {
        const storedUser = localStorage.getItem("kabadiwala_user");

        if (!storedUser) {
          throw new Error("Your login session was not found.");
        }

        const user = JSON.parse(storedUser);

        if (!user?.id) {
          throw new Error("Your collector account is invalid.");
        }

        const response = await fetch(
          `/api/material-lots?collectorId=${encodeURIComponent(user.id)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(
            data.error || "Unable to load your material lots.",
          );
        }

        setLots(
          Array.isArray(data.materialLots) ? data.materialLots : [],
        );
      } catch (error) {
        setLotsError(
          error instanceof Error
            ? error.message
            : "Unable to load your material lots.",
        );
      } finally {
        setLoadingLots(false);
      }
    }

    loadLots();
  }, []);

  const totalWeight = useMemo(() => {
    return lots.reduce((total, lot) => {
      const weight = Number(lot.weightKg);

      return total + (Number.isFinite(weight) ? weight : 0);
    }, 0);
  }, [lots]);

  const recentLots = lots.slice(0, 3);

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Mobile Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-xl">
              ♻️
            </div>

            <div>
              <p className="text-xs font-semibold text-green-700">
                KABADIWALA CONNECT
              </p>

              <h1 className="text-base font-bold text-gray-900">
                Collector
              </h1>
            </div>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg"
            aria-label="Notifications"
          >
            🔔
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-lg px-4 py-5">
        {/* Welcome */}
        <section className="rounded-2xl bg-green-700 p-5 text-white shadow-sm">
          <p className="text-sm text-green-100">
            Welcome back 👋
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            Ready to recycle?
          </h2>

          <p className="mt-2 text-sm leading-6 text-green-50">
            Create a material lot and connect with formal recyclers.
          </p>
        </section>

        {/* Real Lot Summary */}
        <section className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              My Lots
            </p>

            {loadingLots ? (
              <div className="mt-2 h-8 w-16 animate-pulse rounded bg-gray-200" />
            ) : (
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {lots.length}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Total Weight
            </p>

            {loadingLots ? (
              <div className="mt-2 h-8 w-20 animate-pulse rounded bg-gray-200" />
            ) : (
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalWeight.toFixed(1)}
                <span className="ml-1 text-sm font-semibold text-gray-500">
                  kg
                </span>
              </p>
            )}
          </div>
        </section>

        {/* Main Action */}
        <section className="mt-5">
          <Link
            href="/collector/material-lot"
            className="block w-full rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-gray-200 active:bg-gray-50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-2xl">
                📦
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  Create Material Lot
                </h3>

                <p className="mt-1 text-sm leading-5 text-gray-600">
                  Add material, photo, weight and details.
                </p>
              </div>

              <span className="text-xl text-gray-400">
                →
              </span>
            </div>
          </Link>
        </section>

        {/* Recent Real Lots */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="px-1 text-base font-bold text-gray-900">
              Recent Material Lots
            </h2>

            <Link
              href="/collector/material-lot"
              className="text-xs font-semibold text-green-700"
            >
              Create new
            </Link>
          </div>

          {loadingLots && (
            <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-500">
                Loading your real material lots...
              </p>
            </div>
          )}

          {!loadingLots && lotsError && (
            <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
              <p className="text-sm font-semibold text-red-700">
                Unable to load material lots
              </p>

              <p className="mt-1 text-xs leading-5 text-red-600">
                {lotsError}
              </p>
            </div>
          )}

          {!loadingLots &&
            !lotsError &&
            recentLots.length === 0 && (
              <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-gray-200">
                <div className="text-3xl">
                  📦
                </div>

                <h3 className="mt-3 font-bold text-gray-900">
                  No material lots yet
                </h3>

                <p className="mt-1 text-sm leading-5 text-gray-600">
                  Create your first material lot to start building
                  your recycling history.
                </p>

                <Link
                  href="/collector/material-lot"
                  className="mt-4 inline-block rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white"
                >
                  Create Material Lot
                </Link>
              </div>
            )}

          {!loadingLots &&
            !lotsError &&
            recentLots.length > 0 && (
              <div className="space-y-3">
                {recentLots.map((lot) => (
                  <div
                    key={lot.id}
                    className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-xl">
                        {lot.material === "E_WASTE"
                          ? "💻"
                          : lot.material === "PLASTIC"
                            ? "🧴"
                            : lot.material === "METAL"
                              ? "🔩"
                              : lot.material === "PAPER"
                                ? "📄"
                                : "📦"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900">
                          {formatMaterial(lot.material)}
                        </h3>

                        <p className="mt-1 text-sm text-gray-600">
                          {Number(lot.weightKg).toFixed(1)} kg
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {formatDate(lot.createdAt)}
                        </p>
                      </div>

                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold uppercase text-green-700">
                        Recorded
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>

        {/* Quick Actions */}
        <section className="mt-6">
          <h2 className="mb-3 px-1 text-base font-bold text-gray-900">
            Quick Actions
          </h2>

          <div className="space-y-3">
            {/* Find Recyclers */}
            <Link
              href="/collector/recyclers"
              className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-gray-200 active:bg-gray-50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
                🔍
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900">
                  Find Recyclers
                </h3>

                <p className="mt-1 text-sm text-gray-600">
                  Discover formal recycling partners.
                </p>
              </div>

              <span className="text-lg text-gray-400">
                →
              </span>
            </Link>

            {/* Earnings */}
            <button
              type="button"
              className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-gray-200 active:bg-gray-50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-xl">
                💰
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900">
                  My Earnings
                </h3>

                <p className="mt-1 text-sm text-gray-600">
                  View payments and earnings.
                </p>
              </div>

              <span className="text-lg text-gray-400">
                →
              </span>
            </button>

            {/* Transactions */}
            <Link
              href="/collector/requests"
              className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-gray-200 active:bg-gray-50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-xl">
                📋
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900">
                  Transactions
                </h3>

                <p className="mt-1 text-sm text-gray-600">
                  Track your recycling transactions.
                </p>
              </div>

              <span className="text-lg text-gray-400">
                →
              </span>
            </Link>
          </div>
        </section>

        {/* Sync Status */}
        <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              🔄
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-gray-900">
                Connection Status
              </h3>

              <p className="mt-1 text-xs text-gray-600">
                {loadingLots
                  ? "Checking connection..."
                  : lotsError
                    ? "Unable to synchronize with the server."
                    : "Your latest information is synchronized."}
              </p>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                loadingLots
                  ? "bg-yellow-100 text-yellow-700"
                  : lotsError
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
              }`}
            >
              {loadingLots
                ? "SYNCING"
                : lotsError
                  ? "SYNC FAILED"
                  : "SYNCED"}
            </span>
          </div>
        </section>

        {/* Language */}
        <section className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Language
          </p>

          <div className="mt-2 flex justify-center gap-5 text-sm">
            <button
              type="button"
              className="font-semibold text-green-700"
            >
              हिंदी
            </button>

            <button
              type="button"
              className="font-semibold text-green-700"
            >
              मराठी
            </button>

            <button
              type="button"
              className="font-medium text-gray-700"
            >
              English
            </button>
          </div>
        </section>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
          <Link
            href="/collector"
            className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-green-700"
          >
            <span className="text-lg">
              🏠
            </span>

            <span className="text-[11px] font-semibold">
              Home
            </span>
          </Link>

          <Link
            href="/collector/material-lot"
            className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-gray-500"
          >
            <span className="text-lg">
              📦
            </span>

            <span className="text-[11px] font-medium">
              Lots
            </span>
          </Link>

          <a
            href="/collector/earnings"
            className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-gray-500"
          >
            <span className="text-lg">
              💰
            </span>
            <span className="text-[11px] font-medium">
              Earnings
            </span>
          </a>

          <a
            href="/collector/profile"
            className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-gray-500"
          >
            <span className="text-lg">
              👤
            </span>
            <span className="text-[11px] font-medium">
              Profile
            </span>
          </a>
        </div>
      </nav>
    </main>
  );
}