"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/use-language";

import VoiceButton from "@/lib/voice/VoiceButton";
import type { TranslationKey } from "@/lib/i18n/translations";

const materials: Array<{ id: string; nameKey: TranslationKey; icon: string; descriptionKey: TranslationKey }> = [
  {
    id: "E_WASTE",
    nameKey: "eWaste",
    icon: "💻",
    descriptionKey: "electronicItemsDevices",
  },
  {
    id: "PLASTIC",
    nameKey: "plastic",
    icon: "🧴",
    descriptionKey: "plasticBottlesMaterials",
  },
  {
    id: "METAL",
    nameKey: "metal",
    icon: "🔩",
    descriptionKey: "ironSteelMetals",
  },
  {
    id: "PAPER",
    nameKey: "paper",
    icon: "📄",
    descriptionKey: "paperCardboardBooks",
  },
  {
    id: "OTHER",
    nameKey: "other",
    icon: "📦",
    descriptionKey: "otherRecyclableMaterial",
  },
];

export default function CreateMaterialLotPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [material, setMaterial] = useState("");
  const [weight, setWeight] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setPhotoName(file.name);
    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoDataUrl(reader.result);
      }
    };

    reader.onerror = () => {
      setPhotoDataUrl("");
      setError(t("unableToReadPhoto"));
    };

    reader.readAsDataURL(file);
  }

  function handleContinue() {
    setError("");

    if (!material) {
      setError(t("pleaseSelectMaterial"));
      return;
    }

    const weightKg = Number(weight);

    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      setError(t("enterWeightGreaterThanZero"));
      return;
    }

    setSaving(true);

    try {
      const draft = {
        material,
        weightKg,
        photoName,
        photoDataUrl,
      };

      sessionStorage.setItem(
        "kabadiwala_material_lot_draft",
        JSON.stringify(draft),
      );

      router.push("/collector/material-lot/review");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("unableToContinueReview"),
      );
      setSaving(false);
    }
  }

  const selectedMaterial = materials.find(
    (item) => item.id === material,
  );

  const canContinue =
    material !== "" &&
    Number.isFinite(Number(weight)) &&
    Number(weight) > 0;

  return (
    <main className="min-h-screen bg-gray-50 pb-8">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link
            href="/collector"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl"
          >
            ←
          </Link>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-green-700">
              {t("appName")}
            </p>

            <h1 className="text-lg font-bold text-gray-900">
              {t("createMaterialLot")}
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5">
        {/* Progress */}
        <section className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-green-700">
              {t("materialDetails")}
            </span>

            <span className="text-xs font-medium text-gray-400">
              {t("stepOfThree")}
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-1/3 rounded-full bg-green-600" />
          </div>
        </section>

        {/* Material */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">
            {t("whatMaterial")}
          </h2>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <p className="text-sm leading-5 text-gray-600">
              {t("selectClosestCategory")}
            </p>
            <VoiceButton
              text={`${t("whatMaterial")}. ${t("selectClosestCategory")}`}
              language={language}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {materials.map((item) => {
              const selected = material === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMaterial(item.id)}
                  className={`rounded-2xl bg-white p-4 text-left shadow-sm transition ${
                    selected
                      ? "ring-2 ring-green-600"
                      : "ring-1 ring-gray-200"
                  }`}
                >
                  <div className="text-2xl">{item.icon}</div>

                  <h3 className="mt-3 font-bold text-gray-900">
                    {t(item.nameKey)}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    {t(item.descriptionKey)}
                  </p>

                  {selected && (
                    <p className="mt-2 text-xs font-semibold text-green-700">
                      ✓ {t("selected")}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Photo */}
        <section className="mt-7">
          <h2 className="text-lg font-bold text-gray-900">
            {t("addPhoto")}
          </h2>

          <p className="mt-1 text-sm leading-5 text-gray-600">
            {t("photoClassificationDescription")}
          </p>

          <label className="mt-4 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white px-4 text-center">
            {photoDataUrl ? (
              <img
                src={photoDataUrl}
                alt={t("selectedMaterial")}
                className="h-32 w-full rounded-xl object-cover"
              />
            ) : (
              <>
                <span className="text-4xl">📷</span>

                <span className="mt-2 font-semibold text-gray-900">
                  {t("takeOrChoosePhoto")}
                </span>

                <span className="mt-1 text-xs text-gray-500">
                  {t("jpgOrPng")}
                </span>
              </>
            )}

            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhoto}
            />
          </label>

          {photoName && (
            <div className="mt-3 rounded-xl bg-green-50 p-3">
              <p className="text-sm font-semibold text-green-800">
                ✓ {t("photoSelected")}
              </p>

              <p className="mt-1 truncate text-xs text-green-700">
                {photoName}
              </p>
            </div>
          )}
        </section>

        {/* Weight */}
        <section className="mt-7">
          <h2 className="text-lg font-bold text-gray-900">
            {t("approximateWeight")}
          </h2>

          <p className="mt-1 text-sm leading-5 text-gray-600">
            {t("updateWeightDuringHandover")}
          </p>

          <div className="mt-4 flex">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              placeholder="0"
              className="w-full rounded-l-2xl border border-gray-300 bg-white px-5 py-4 text-2xl font-semibold outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />

            <div className="flex items-center rounded-r-2xl border border-l-0 border-gray-300 bg-gray-100 px-5 font-semibold text-gray-700">
              {t("kg")}
            </div>
          </div>
        </section>

        {/* Preview */}
        {selectedMaterial && weight && (
          <section className="mt-7 rounded-2xl bg-green-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              {t("lotPreview")}
            </p>

            <div className="mt-3">
              <p className="font-bold text-gray-900">
                {selectedMaterial.icon} {t(selectedMaterial.nameKey)}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {t("approx")} {weight} {t("kg")}
              </p>

              {photoName && (
                <p className="mt-1 text-sm text-green-700">
                  📷 {t("photoAdded")}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Continue */}
        <button
          type="button"
          disabled={!canContinue || saving}
          onClick={handleContinue}
          className="mt-7 w-full rounded-2xl bg-green-700 px-6 py-4 font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {saving ? t("openingReview") : t("continueToReview")}
        </button>

        <p className="mt-3 text-center text-xs leading-5 text-gray-500">
          {t("informationReviewNotice")}
        </p>
      </div>
    </main>
  );
}