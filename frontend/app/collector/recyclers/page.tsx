"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { useLanguage } from "@/lib/i18n/use-language";

const RecyclerMap = dynamic(
  () => import("@/components/maps/RecyclerMap"),
  { ssr: false },
);

import type { TranslationKey } from "@/lib/i18n/translations";

type Recycler = {
  id: string;
  userId: string;
  businessName: string | null;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
  location: {
    latitude: number | string;
    longitude: number | string;
  } | null;
};

type MaterialLot = {
  id: string;
  material: string;
  weightKg: string | number;
  photoUrl: string | null;
  createdAt: string;
};

const materialNameKeys: Record<string, TranslationKey> = {
  E_WASTE: "eWaste",
  PLASTIC: "plastic",
  METAL: "metal",
  PAPER: "paper",
  OTHER: "other",
};

function formatMaterial(
  material: string,
  t: (key: TranslationKey) => string,
) {
  const key = materialNameKeys[material];
  return key ? t(key) : material;
}

export default function RecyclersPage() {
  const { t } = useLanguage();
  const [recyclers, setRecyclers] = useState<Recycler[]>([]);
  const [materialLots, setMaterialLots] = useState<MaterialLot[]>([]);
  const [collectorLocation, setCollectorLocation] = useState<{
    latitude: number | string;
    longitude: number | string;
  } | null>(null);
  const [selectedLotId, setSelectedLotId] = useState("");
  const [selectedRecyclerId, setSelectedRecyclerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [recyclersResponse, lotsResponse, locationResponse] =
          await Promise.all([
            fetch("/api/recyclers"),
            fetch("/api/material-lots"),
            fetch("/api/location"),
          ]);

        const recyclersData = await recyclersResponse.json();
        const lotsData = await lotsResponse.json();
        const locationData = await locationResponse.json();

        if (!recyclersResponse.ok || !recyclersData.ok) {
          throw new Error(
            recyclersData.error || t("unableToLoadRecyclers"),
          );
        }

        if (!lotsResponse.ok || !lotsData.ok) {
          throw new Error(
            lotsData.error || t("unableToLoadMaterialLots"),
          );
        }

        if (!locationResponse.ok || !locationData.ok) {
          throw new Error(
            locationData.error || "Unable to load your saved location.",
          );
        }

        setCollectorLocation(locationData.location ?? null);
        setRecyclers(recyclersData.recyclers);
        setMaterialLots(lotsData.materialLots);

        if (lotsData.materialLots.length > 0) {
          setSelectedLotId(lotsData.materialLots[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t("unableToLoadRecyclerInfo"),
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function sendRequest() {
    if (!selectedLotId || !selectedRecyclerId) {
      setError(t("selectLotAndRecyclerFirst"));
      setSuccess("");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/recycling-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          materialLotId: selectedLotId,
          recyclerId: selectedRecyclerId,
        }),
      });

      const data = await response.json();

      if (response.status === 409) {
        setSuccess(t("requestAlreadySent"));
        return;
      }

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error || t("unableToSendRecyclingRequest"),
        );
      }

      setSuccess(t("recyclingRequestSentSuccessfully"));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("unableToSendRecyclingRequest"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] px-5 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => window.location.assign("/collector")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← {t("backToDashboard")}
          </button>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              localStorage.removeItem("kabadiwala_user");
              window.location.assign("/login");
            }}
            className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
          >
            {t("logout")}
          </button>
        </div>
        <header className="mb-6">
          <p className="text-sm font-medium text-green-700">
            Kabadiwala Connect
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            {t("findRecyclers")}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {t("findRecyclersDescription")}
          </p>
        </header>

        {loading && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
            <p className="text-sm text-gray-600">
              {t("loadingMaterialLotsAndRecyclers")}
            </p>
          </section>
        )}

        {!loading && error && (
          <section className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              {t("unableToContinue")}
            </p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </section>
        )}

        {!loading && success && (
          <section className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              {t("requestSent")}
            </p>
            <p className="mt-1 text-sm text-green-700">{success}</p>
          </section>
        )}

        {!loading && materialLots.length === 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
              ♻️
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              {t("noMaterialLotsAvailable")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Create a material lot first, then return here to connect with a
              verified recycler.
            </p>
          </section>
        )}

        {!loading && materialLots.length > 0 && (
          <>
            <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
              <h2 className="text-base font-semibold text-gray-900">
                {t("selectMaterialLot")}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {t("chooseRecordedMaterialLot")}
              </p>

              <div className="mt-3 space-y-2">
                {materialLots.map((lot) => (
                  <button
                    key={lot.id}
                    type="button"
                    onClick={() => setSelectedLotId(lot.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedLotId === lot.id
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatMaterial(lot.material, t)}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {lot.weightKg} kg
                        </p>
                      </div>
                      {selectedLotId === lot.id && (
                        <span className="text-sm font-semibold text-green-700">
                          {t("selected")}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {collectorLocation ? (
              <section className="mb-5">
                <RecyclerMap
                  collectorLocation={collectorLocation}
                  recyclers={recyclers}
                  selectedRecyclerId={selectedRecyclerId}
                  onSelectRecycler={setSelectedRecyclerId}
                />
              </section>
            ) : (
              <section className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <h2 className="text-base font-semibold text-amber-900">
                  Your location is not saved
                </h2>
                <p className="mt-1 text-sm leading-5 text-amber-800">
                  Save your real current location from the Collector dashboard
                  before using the recycler map.
                </p>
              </section>
            )}

            <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
              <h2 className="text-base font-semibold text-gray-900">
                {t("selectVerifiedRecycler")}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Only verified recycler records from the connected database are
                shown.
              </p>

              {recyclers.length === 0 ? (
                <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                  {t("noVerifiedRecyclersAvailable")}
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {recyclers.map((recycler) => (
                    <button
                      key={recycler.id}
                      type="button"
                      onClick={() => setSelectedRecyclerId(recycler.userId)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        selectedRecyclerId === recycler.userId
                          ? "border-green-600 bg-green-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {recycler.businessName || t("verifiedRecycler")}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {t("verifiedRecycler")}
                          </p>
                        </div>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                          {t("verified")}
                        </span>
                      </div>

                      {selectedRecyclerId === recycler.userId && (
                        <p className="mt-3 text-sm font-medium text-green-700">
                          {t("selected")}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <button
              type="button"
              onClick={sendRequest}
              disabled={
                submitting ||
                !selectedLotId ||
                !selectedRecyclerId ||
                recyclers.length === 0
              }
              className="w-full rounded-2xl bg-green-700 px-4 py-4 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {submitting ? t("sendingRequest") : t("sendRecyclingRequest")}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
