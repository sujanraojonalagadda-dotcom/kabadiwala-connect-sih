"use client";

import { useEffect, useState } from "react";

import { useLanguage } from "@/lib/i18n/use-language";

type User = {
  id: string;
  phone: string;
  role: string;
};

type Earning = {
  transactionId: string;
  requestId: string;
  paymentId: string;
  amount: string;
  method: string | null;
  recordedAt: string | null;
  completedAt: string | null;
  material: string | null;
  weightKg: string | number | null;
};

function formatMaterial(material: string | null, unavailableLabel: string) {
  if (!material) {
    return unavailableLabel;
  }

  return material
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null, unavailableLabel: string) {
  if (!value) {
    return unavailableLabel;
  }

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CollectorEarningsPage() {
  const { language, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [totalAmount, setTotalAmount] = useState("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("kabadiwala_user");

    if (!storedUser) {
      setError(t("loginRequired"));
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as User;
      setUser(parsedUser);

      if (parsedUser.role !== "COLLECTOR") {
        setError(t("collectorAccountInvalid"));
        setLoading(false);
        return;
      }

      fetch(
        `/api/earnings?collectorId=${encodeURIComponent(parsedUser.id)}`,
      )
        .then(async (response) => {
          const data = await response.json();

          if (!response.ok || !data.ok) {
            throw new Error(data.error || t("unableToLoadEarnings"));
          }

          setEarnings(data.earnings ?? []);
          setTotalAmount(data.totalAmount ?? "0");
        })
        .catch((err) => {
          setError(
            err instanceof Error
              ? err.message
              : t("unableToLoadEarnings"),
          );
        })
        .finally(() => {
          setLoading(false);
        });
    } catch {
      setError(t("authenticationRequired"));
      setLoading(false);
    }
  }, [language]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-4xl">
          <p className="text-slate-500">{t("loading")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <p className="text-lg font-medium text-emerald-700">
          Kabadiwala Connect
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight">
          {t("myEarnings")}
        </h1>

        <p className="mt-3 text-lg text-slate-600">
          {t("earningsRecordedDescription")}
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        {!error && user && (
          <>
            <section className="mt-8 rounded-2xl bg-emerald-700 p-6 text-white shadow-sm">
              <p className="text-sm font-medium uppercase tracking-wide text-emerald-100">
                {t("totalRecordedEarnings")}
              </p>

              <p className="mt-2 text-4xl font-bold">
                ₹{totalAmount}
              </p>

              <p className="mt-2 text-sm text-emerald-100">
                {t("completedPaymentsOnly")}
              </p>
            </section>

            <section className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">
                  {t("paymentHistory")}
                </h2>

                <span className="text-sm text-slate-500">
                  {earnings.length}{" "}
                  {earnings.length === 1 ? t("payment") : t("payments")}
                </span>
              </div>

              {earnings.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                  <h3 className="text-lg font-semibold">
                    {t("noRecordedEarnings")}
                  </h3>

                  <p className="mt-2 text-slate-600">
                    {t("earningsAfterPayment")}
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {earnings.map((earning) => (
                    <article
                      key={earning.paymentId}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm text-slate-500">
                            {formatMaterial(earning.material, t("materialDetailsUnavailable"))}
                          </p>

                          <p className="mt-1 text-lg font-semibold">
                            {earning.weightKg !== null
                              ? `${earning.weightKg} kg`
                              : t("weightUnavailable")}
                          </p>

                          <p className="mt-2 text-sm text-slate-500">
                            {t("recorded")} {formatDate(earning.recordedAt, t("dateUnavailable"))}
                          </p>
                        </div>

                        <p className="text-2xl font-bold text-emerald-700">
                          ₹{earning.amount}
                        </p>
                      </div>

                      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:grid-cols-2">
                        <div>
                          <span className="font-medium text-slate-800">
                            {t("paymentMethod")}:
                          </span>{" "}
                          {earning.method || t("notSpecified")}
                        </div>

                        <div>
                          <span className="font-medium text-slate-800">
                            {t("completed")}:
                          </span>{" "}
                          {formatDate(earning.completedAt, t("dateUnavailable"))}
                        </div>
                      </div>

                      <p className="mt-4 break-all font-mono text-xs text-slate-400">
                        {t("transactionLabel")}: {earning.transactionId}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
