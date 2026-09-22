"use client";

import { FormEvent, useEffect, useState } from "react";

type User = {
  id: string;
  phone: string;
  role: string;
};

type RequestItem = {
  id: string;
  materialLotId: string;
  collectorId: string;
  recyclerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  collector: {
    id: string;
    phone: string;
    profile: {
      fullName: string | null;
      language: string | null;
    } | null;
  } | null;
};

type MaterialLot = {
  id: string;
  material: string;
  weightKg: string | number;
  photoUrl: string | null;
  createdAt: string;
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

type RequestDetails = {
  materialLot: MaterialLot | null;
  quote: Quote | null;
  transaction: Transaction | null;
};

function formatMaterial(material: string) {
  return material
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function RecyclerRequestsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [details, setDetails] = useState<Record<string, RequestDetails>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quoteAmounts, setQuoteAmounts] = useState<Record<string, string>>({});
  const [quotePrices, setQuotePrices] = useState<Record<string, string>>({});
  const [quoteNotes, setQuoteNotes] = useState<Record<string, string>>({});
  const [submittingQuote, setSubmittingQuote] = useState<string | null>(null);
  const [confirmingTransaction, setConfirmingTransaction] = useState<string | null>(null);
  const [completingTransaction, setCompletingTransaction] = useState<string | null>(null);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});
  const [recordingPayment, setRecordingPayment] = useState<string | null>(null);

  async function loadRequests() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/recycler/requests");
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to load recycling requests.");
      }

      const requestList: RequestItem[] = data.requests ?? [];
      setRequests(requestList);

      const detailEntries = await Promise.all(
        requestList.map(async (request) => {
          const detailResponse = await fetch(
            `/api/recycling-requests/${request.id}`,
          );
          const detailData = await detailResponse.json();

          if (!detailResponse.ok || !detailData.ok) {
            throw new Error(
              detailData.error ||
                `Unable to load details for request ${request.id}.`,
            );
          }

          return [
            request.id,
            {
              materialLot: detailData.materialLot ?? null,
              quote: detailData.quote ?? null,
              transaction: detailData.transaction ?? null,
            },
          ] as const;
        }),
      );

      setDetails(Object.fromEntries(detailEntries));
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

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      localStorage.removeItem("kabadiwala_user");
      window.location.href = "/login";
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("kabadiwala_user");

    if (!storedUser) {
      setError("Please log in before viewing recycler requests.");
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as User;
      setUser(parsedUser);

      if (parsedUser.role !== "RECYCLER") {
        setError("This page is available only to recycler accounts.");
        setLoading(false);
        return;
      }

      void loadRequests();
    } catch {
      setError("Your local session could not be read.");
      setLoading(false);
    }
  }, []);

  async function submitQuote(
    event: FormEvent<HTMLFormElement>,
    requestId: string,
  ) {
    event.preventDefault();

    const amount = quoteAmounts[requestId]?.trim();
    const pricePerKg = quotePrices[requestId]?.trim();
    const notes = quoteNotes[requestId]?.trim();

    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid quote amount.");
      return;
    }

    setSubmittingQuote(requestId);
    setError("");

    try {
      const response = await fetch(
        `/api/recycler/requests/${requestId}/quote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            pricePerKg: pricePerKg || undefined,
            notes: notes || undefined,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to submit quote.");
      }

      if (!user) {
        return;
      }

      await loadRequests();

      setQuoteAmounts((current) => ({
        ...current,
        [requestId]: "",
      }));

      setQuotePrices((current) => ({
        ...current,
        [requestId]: "",
      }));

      setQuoteNotes((current) => ({
        ...current,
        [requestId]: "",
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to submit quote.",
      );
    } finally {
      setSubmittingQuote(null);
    }
  }

  async function confirmRecyclerHandover(transactionId: string) {
    setConfirmingTransaction(transactionId);
    setError("");

    try {
      const response = await fetch(
        `/api/transactions/${transactionId}/recycler-confirm`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error || "Unable to confirm recycler handover.",
        );
      }

      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to confirm recycler handover.",
      );
    } finally {
      setConfirmingTransaction(null);
    }
  }

  async function completeTransaction(transactionId: string) {
    setCompletingTransaction(transactionId);
    setError("");

    try {
      const response = await fetch(
        `/api/transactions/${transactionId}/complete`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to complete transaction.");
      }

      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to complete transaction.",
      );
    } finally {
      setCompletingTransaction(null);
    }
  }

  async function recordPayment(
    transactionId: string,
    defaultAmount: string,
  ) {
    const amount =
      paymentAmounts[transactionId]?.trim() || defaultAmount;
    const method = paymentMethods[transactionId]?.trim();

    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }

    if (!method) {
      setError("Select a payment method.");
      return;
    }

    setRecordingPayment(transactionId);
    setError("");

    try {
      const response = await fetch(
        `/api/transactions/${transactionId}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            method,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to record payment.");
      }

      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to record payment.",
      );
    } finally {
      setRecordingPayment(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-5xl">
          <p className="text-slate-500">Loading recycler requests...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-medium text-emerald-700">
              Kabadiwala Connect
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              Recycler Requests
            </h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-fit rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Logout
          </button>
        </div>

        <p className="mt-3 text-lg text-slate-600">
          Review collector material requests and submit quotes using real
          transaction data.
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        {requests.length === 0 && !error && (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">No requests yet</h2>
            <p className="mt-2 text-slate-600">
              No recycling requests are currently assigned to this recycler.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {requests.map((request) => {
            const detail = details[request.id];
            const lot = detail?.materialLot;
            const quote = detail?.quote;
            const transaction = detail?.transaction;

            return (
              <section
                key={request.id}
                className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                      Request
                    </p>

                    <p className="mt-1 break-all font-mono text-sm text-slate-700">
                      {request.id}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                    {request.status}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Material Lot</p>

                    {lot ? (
                      <>
                        <p className="mt-2 text-2xl font-semibold">
                          {formatMaterial(lot.material)}
                        </p>

                        <p className="mt-2 text-lg font-semibold text-slate-700">
                          {lot.weightKg} kg
                        </p>

                        <p className="mt-3 break-all font-mono text-xs text-slate-500">
                          {lot.id}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-slate-500">
                        Material lot details unavailable.
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Collector</p>

                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      {request.collector?.profile?.fullName ||
                        request.collector?.phone ||
                        "Collector"}
                    </p>

                    {request.collector?.profile?.fullName &&
                      request.collector.phone && (
                        <p className="mt-1 text-sm text-slate-600">
                          {request.collector.phone}
                        </p>
                      )}

                    <p className="mt-3 break-all font-mono text-xs text-slate-500">
                      {request.collectorId}
                    </p>

                    <p className="mt-3 text-sm text-slate-500">
                      Submitted {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>

                {quote ? (
                  <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
                      Submitted Quote
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                      ₹{quote.amount}
                    </p>

                    {quote.pricePerKg && (
                      <p className="mt-2 text-slate-700">
                        ₹{quote.pricePerKg} / kg
                      </p>
                    )}

                    {quote.notes && (
                      <p className="mt-3 text-slate-700">{quote.notes}</p>
                    )}
                  </div>
                ) : (
                  <form
                    onSubmit={(event) => submitQuote(event, request.id)}
                    className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <h2 className="text-lg font-semibold">
                      Submit Recycler Quote
                    </h2>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">
                          Total amount (₹)
                        </span>

                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          value={quoteAmounts[request.id] ?? ""}
                          onChange={(event) =>
                            setQuoteAmounts((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-600"
                          placeholder="Enter amount"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">
                          Price per kg (₹)
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={quotePrices[request.id] ?? ""}
                          onChange={(event) =>
                            setQuotePrices((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-600"
                          placeholder="Optional"
                        />
                      </label>
                    </div>

                    <label className="mt-4 block">
                      <span className="text-sm font-medium text-slate-700">
                        Notes
                      </span>

                      <textarea
                        rows={3}
                        value={quoteNotes[request.id] ?? ""}
                        onChange={(event) =>
                          setQuoteNotes((current) => ({
                            ...current,
                            [request.id]: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-600"
                        placeholder="Optional quote notes"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={submittingQuote === request.id}
                      className="mt-5 rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submittingQuote === request.id
                        ? "Submitting..."
                        : "Submit Quote"}
                    </button>
                  </form>
                )}

                {transaction && (
                  <div className="mt-6 rounded-xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                          Transaction
                        </p>

                        <p className="mt-1 break-all font-mono text-sm text-slate-700">
                          {transaction.id}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                        {transaction.status}
                      </span>
                    </div>

                    <p className="mt-4 text-slate-600">
                      Payment status:{" "}
                      <span className="font-semibold">
                        {transaction.paymentStatus}
                      </span>
                    </p>

                    {transaction.status === "COLLECTOR_CONFIRMED" && (
                      <button
                        type="button"
                        onClick={() =>
                          confirmRecyclerHandover(transaction.id)
                        }
                        disabled={confirmingTransaction === transaction.id}
                        className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {confirmingTransaction === transaction.id
                          ? "Confirming..."
                          : "Confirm Handover"}
                      </button>
                    )}

                    {transaction.status === "RECYCLER_CONFIRMED" && (
                      <button
                        type="button"
                        onClick={() => completeTransaction(transaction.id)}
                        disabled={completingTransaction === transaction.id}
                        className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {completingTransaction === transaction.id
                          ? "Completing..."
                          : "Complete Transaction"}
                      </button>
                    )}

                    {transaction.completedAt && (
                      <p className="mt-2 text-sm text-slate-500">
                        Completed {formatDate(transaction.completedAt)}
                      </p>
                    )}

                    {transaction.status === "COMPLETED" &&
                      transaction.paymentStatus !== "RECORDED" && (
                        <div className="mt-5 rounded-xl bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-800">
                            Record Payment
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Enter the actual amount paid to the collector.
                          </p>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={
                                paymentAmounts[transaction.id] ??
                                quote?.amount ??
                                ""
                              }
                              onChange={(event) =>
                                setPaymentAmounts((current) => ({
                                  ...current,
                                  [transaction.id]: event.target.value,
                                }))
                              }
                              placeholder="Amount"
                              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                            />

                            <select
                              value={paymentMethods[transaction.id] ?? ""}
                              onChange={(event) =>
                                setPaymentMethods((current) => ({
                                  ...current,
                                  [transaction.id]: event.target.value,
                                }))
                              }
                              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                            >
                              <option value="">
                                Select payment method
                              </option>
                              <option value="CASH">Cash</option>
                              <option value="UPI">UPI</option>
                              <option value="BANK_TRANSFER">
                                Bank transfer
                              </option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              recordPayment(
                                transaction.id,
                                quote?.amount ?? "",
                              )
                            }
                            disabled={recordingPayment === transaction.id}
                            className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {recordingPayment === transaction.id
                              ? "Recording..."
                              : "Record Payment"}
                          </button>
                        </div>
                      )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}