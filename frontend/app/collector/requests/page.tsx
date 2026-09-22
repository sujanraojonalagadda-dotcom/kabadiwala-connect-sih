"use client";

import { useEffect, useState } from "react";

type RequestItem = {
  id: string;
  materialLotId: string;
  collectorId: string;
  recyclerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type Quote = {
  id: string;
  requestId: string;
  amount: string;
  pricePerKg: string | null;
  notes: string | null;
};

type Transaction = {
  id: string;
  requestId: string;
  status: string;
  paymentStatus: string;
  completedAt: string | null;
};

type MaterialLot = {
  id: string;
  material: string;
  weightKg: string | number;
  photoUrl: string | null;
  createdAt: string;
};

type Recycler = {
  id: string;
  userId: string;
  businessName: string | null;
  verificationStatus: string;
};

type RequestDetails = {
  materialLot: MaterialLot | null;
  recycler: Recycler | null;
};

const materialNames: Record<string, string> = {
  E_WASTE: "E-Waste",
  PLASTIC: "Plastic",
  METAL: "Metal",
  PAPER: "Paper",
  OTHER: "Other",
};

function formatMaterial(material: string) {
  return (
    materialNames[material] ??
    material.replaceAll("_", " ")
  );
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default function CollectorRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);

  const [quotes, setQuotes] = useState<
    Record<string, Quote>
  >({});

  const [transactions, setTransactions] = useState<
    Record<string, Transaction>
  >({});

  const [details, setDetails] = useState<
    Record<string, RequestDetails>
  >({});

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [actionId, setActionId] = useState<string | null>(
    null,
  );

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/recycling-requests`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error || "Unable to load requests.",
        );
      }

      const requestItems: RequestItem[] =
        Array.isArray(data.requests)
          ? data.requests
          : [];

      setRequests(requestItems);

      const quoteEntries: Record<string, Quote> = {};
      const transactionEntries: Record<
        string,
        Transaction
      > = {};
      const detailEntries: Record<
        string,
        RequestDetails
      > = {};

      await Promise.all(
        requestItems.map(async (item) => {
          const detailResponse = await fetch(
            `/api/recycling-requests/${item.id}`,
            {
              method: "GET",
              cache: "no-store",
            },
          );

          if (!detailResponse.ok) {
            return;
          }

          const detailData =
            await detailResponse.json();

          if (!detailData.ok) {
            return;
          }

          if (detailData.quote) {
            quoteEntries[item.id] =
              detailData.quote;
          }

          if (detailData.transaction) {
            transactionEntries[item.id] =
              detailData.transaction;
          }

          detailEntries[item.id] = {
            materialLot:
              detailData.materialLot ?? null,
            recycler:
              detailData.recycler ?? null,
          };
        }),
      );

      setQuotes(quoteEntries);
      setTransactions(transactionEntries);
      setDetails(detailEntries);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load recycling requests.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function acceptQuote(requestId: string) {
    try {
      setActionId(requestId);
      setError("");

      const response = await fetch(
        `/api/collector/requests/${requestId}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error || "Unable to accept quote.",
        );
      }

      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to accept quote.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function createTransaction(requestId: string) {
    try {
      setActionId(requestId);
      setError("");

      const response = await fetch(
        `/api/collector/requests/${requestId}/transaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            "Unable to create transaction.",
        );
      }

      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create transaction.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function initiateHandover(requestId: string) {
    const transaction = transactions[requestId];

    if (!transaction) {
      setError("Transaction not found.");
      return;
    }

    try {
      setActionId(requestId);
      setError("");

      const response = await fetch(
        `/api/transactions/${transaction.id}/handover`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            "Unable to initiate handover.",
        );
      }

      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to initiate handover.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function confirmHandover(requestId: string) {
    const transaction = transactions[requestId];

    if (!transaction) {
      setError("Transaction not found.");
      return;
    }

    try {
      setActionId(requestId);
      setError("");

      const response = await fetch(
        `/api/transactions/${transaction.id}/collector-confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            "Unable to confirm handover.",
        );
      }

      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to confirm handover.",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-emerald-700">
            Kabadiwala Connect
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            My Recycling Requests
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Track your material requests, recycler quotes,
            handover and payment status.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
            Loading your requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center">
            <h2 className="font-semibold text-slate-900">
              No recycling requests yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Create a material lot and send it to a
              verified recycler.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map((item) => {
              const quote = quotes[item.id];

              const transaction =
                transactions[item.id];

              const requestDetails =
                details[item.id];

              const materialLot =
                requestDetails?.materialLot;

              const recycler =
                requestDetails?.recycler;

              const busy =
                actionId === item.id;

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >
                  {/* Request Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Request
                      </p>

                      <p className="mt-1 break-all font-mono text-xs text-slate-500">
                        {item.id}
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      {formatStatus(item.status)}
                    </span>
                  </div>

                  {/* Real Material + Recycler Details */}
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        Material Lot
                      </p>

                      <p className="mt-1 font-medium text-slate-900">
                        {materialLot
                          ? formatMaterial(
                              materialLot.material,
                            )
                          : "Material details unavailable"}
                      </p>

                      {materialLot && (
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {Number(
                            materialLot.weightKg,
                          ).toFixed(1)}{" "}
                          kg
                        </p>
                      )}

                      <p className="mt-1 break-all font-mono text-xs text-slate-500">
                        {item.materialLotId}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        Recycler
                      </p>

                      <p className="mt-1 font-medium text-slate-900">
                        {recycler?.businessName ||
                          "Recycler"}
                      </p>

                      {recycler && (
                        <p className="mt-1 text-sm font-semibold text-emerald-700">
                          {recycler.verificationStatus ===
                          "VERIFIED"
                            ? "Verified"
                            : recycler.verificationStatus}
                        </p>
                      )}

                      <p className="mt-1 break-all font-mono text-xs text-slate-500">
                        {item.recyclerId}
                      </p>
                    </div>
                  </div>

                  {/* Quote */}
                  {quote && (
                    <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                        Recycler Quote
                      </p>

                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        ₹{quote.amount}
                      </p>

                      {quote.pricePerKg && (
                        <p className="mt-1 text-sm text-slate-600">
                          ₹{quote.pricePerKg} / kg
                        </p>
                      )}

                      {quote.notes && (
                        <p className="mt-2 text-sm text-slate-600">
                          {quote.notes}
                        </p>
                      )}

                      {item.status ===
                        "QUOTE_RECEIVED" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            acceptQuote(item.id)
                          }
                          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busy
                            ? "Accepting..."
                            : "Accept Quote"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Transaction Creation */}
                  {item.status === "ACCEPTED" &&
                    !transaction && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          createTransaction(item.id)
                        }
                        className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy
                          ? "Creating..."
                          : "Create Handover Transaction"}
                      </button>
                    )}

                  {/* Transaction */}
                  {transaction && (
                    <div className="mt-5 rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">
                          Transaction
                        </p>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {formatStatus(
                            transaction.status,
                          )}
                        </span>
                      </div>

                      <p className="mt-2 break-all font-mono text-xs text-slate-500">
                        {transaction.id}
                      </p>

                      {transaction.status ===
                        "SCHEDULED" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            initiateHandover(item.id)
                          }
                          className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {busy
                            ? "Starting..."
                            : "Start Handover"}
                        </button>
                      )}

                      {transaction.status ===
                        "HANDOVER_INITIATED" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            confirmHandover(item.id)
                          }
                          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {busy
                            ? "Confirming..."
                            : "Confirm Handover"}
                        </button>
                      )}

                      {transaction.status ===
                        "COMPLETED" && (
                        <div className="mt-4 rounded-xl bg-emerald-50 p-4">
                          <p className="font-semibold text-emerald-800">
                            Transaction completed
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            Payment status:{" "}
                            {formatStatus(
                              transaction.paymentStatus,
                            )}
                          </p>

                          {transaction.completedAt && (
                            <p className="mt-1 text-xs text-slate-500">
                              Completed{" "}
                              {new Date(
                                transaction.completedAt,
                              ).toLocaleString(
                                "en-IN",
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}