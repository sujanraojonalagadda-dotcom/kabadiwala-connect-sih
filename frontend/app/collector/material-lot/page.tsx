"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const materials = [
  {
    id: "E_WASTE",
    name: "E-Waste",
    icon: "💻",
    description: "Electronic items and devices",
  },
  {
    id: "PLASTIC",
    name: "Plastic",
    icon: "🧴",
    description: "Plastic bottles and materials",
  },
  {
    id: "METAL",
    name: "Metal",
    icon: "🔩",
    description: "Iron, steel and other metals",
  },
  {
    id: "PAPER",
    name: "Paper",
    icon: "📄",
    description: "Paper, cardboard and books",
  },
  {
    id: "OTHER",
    name: "Other",
    icon: "📦",
    description: "Other recyclable material",
  },
];

export default function CreateMaterialLotPage() {
  const router = useRouter();

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
      setError("Unable to read the selected photo.");
    };

    reader.readAsDataURL(file);
  }

  function handleContinue() {
    setError("");

    if (!material) {
      setError("Please select a material.");
      return;
    }

    const weightKg = Number(weight);

    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      setError("Enter a weight greater than 0 kg.");
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
          : "Unable to continue to the review step.",
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
              Kabadiwala Connect
            </p>

            <h1 className="text-lg font-bold text-gray-900">
              Create Material Lot
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5">
        {/* Progress */}
        <section className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-green-700">
              Material details
            </span>

            <span className="text-xs font-medium text-gray-400">
              Step 1 of 3
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-1/3 rounded-full bg-green-600" />
          </div>
        </section>

        {/* Material */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">
            What material do you have?
          </h2>

          <p className="mt-1 text-sm leading-5 text-gray-600">
            Select the closest category.
          </p>

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
                    {item.name}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    {item.description}
                  </p>

                  {selected && (
                    <p className="mt-2 text-xs font-semibold text-green-700">
                      ✓ Selected
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
            Add a photo
          </h2>

          <p className="mt-1 text-sm leading-5 text-gray-600">
            A photo can be added for classification and verification.
          </p>

          <label className="mt-4 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white px-4 text-center">
            {photoDataUrl ? (
              <img
                src={photoDataUrl}
                alt="Selected material"
                className="h-32 w-full rounded-xl object-cover"
              />
            ) : (
              <>
                <span className="text-4xl">📷</span>

                <span className="mt-2 font-semibold text-gray-900">
                  Take or choose a photo
                </span>

                <span className="mt-1 text-xs text-gray-500">
                  JPG or PNG
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
                ✓ Photo selected
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
            Approximate weight
          </h2>

          <p className="mt-1 text-sm leading-5 text-gray-600">
            You can update the final weight during handover.
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
              kg
            </div>
          </div>
        </section>

        {/* Preview */}
        {selectedMaterial && weight && (
          <section className="mt-7 rounded-2xl bg-green-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Lot Preview
            </p>

            <div className="mt-3">
              <p className="font-bold text-gray-900">
                {selectedMaterial.icon} {selectedMaterial.name}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                Approx. {weight} kg
              </p>

              {photoName && (
                <p className="mt-1 text-sm text-green-700">
                  📷 Photo added
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
          {saving ? "Opening review..." : "Continue to Review"}
        </button>

        <p className="mt-3 text-center text-xs leading-5 text-gray-500">
          Your information will be reviewed before the material lot is
          created.
        </p>
      </div>
    </main>
  );
}