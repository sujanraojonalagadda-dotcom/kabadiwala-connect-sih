"use client";

import { useEffect, useState } from "react";

type Verification = {
  id: string;
  recyclerId: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  submittedAt: string;
  reviewedAt: string | null;
};

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  async function loadVerifications() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/verifications");
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to load verification requests.");
      }

      setVerifications(data.verifications);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load verification requests.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateVerification(
    id: string,
    status: "VERIFIED" | "REJECTED",
  ) {
    try {
      setActionId(id);
      setError("");

      const response = await fetch(`/api/admin/verifications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to update verification.");
      }

      await loadVerifications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update verification.",
      );
    } finally {
      setActionId(null);
    }
  }

  useEffect(() => {
    loadVerifications();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-emerald-700">Admin</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Recycler Verification
          </h1>
          <p className="mt-2 text-slate-600">
            Review recycler verification requests and update their status.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
            Loading verification requests...
          </div>
        ) : verifications.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center">
            <h2 className="font-semibold text-slate-900">
              No verification requests
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              There are currently no recycler verification requests.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {verifications.map((verification) => (
              <section
                key={verification.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="font-semibold text-slate-900">
                        Recycler Verification
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          verification.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : verification.status === "VERIFIED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {verification.status}
                      </span>
                    </div>

                    <dl className="mt-4 space-y-2 text-sm">
                      <div>
                        <dt className="inline font-medium text-slate-700">
                          Verification ID:{" "}
                        </dt>
                        <dd className="inline break-all text-slate-500">
                          {verification.id}
                        </dd>
                      </div>

                      <div>
                        <dt className="inline font-medium text-slate-700">
                          Recycler ID:{" "}
                        </dt>
                        <dd className="inline break-all text-slate-500">
                          {verification.recyclerId}
                        </dd>
                      </div>

                      <div>
                        <dt className="inline font-medium text-slate-700">
                          Submitted:{" "}
                        </dt>
                        <dd className="inline text-slate-500">
                          {verification.submittedAt}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {verification.status === "PENDING" && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={actionId === verification.id}
                        onClick={() =>
                          updateVerification(verification.id, "REJECTED")
                        }
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        disabled={actionId === verification.id}
                        onClick={() =>
                          updateVerification(verification.id, "VERIFIED")
                        }
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
