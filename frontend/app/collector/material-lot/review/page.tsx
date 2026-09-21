"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type MaterialLotDraft = {
  material: string;
  weightKg: number;
  photoName: string;
  photoDataUrl: string;
};

const classifications = [
  { id: "E_WASTE", name: "E-Waste", icon: "💻" },
  { id: "PLASTIC", name: "Plastic", icon: "🧴" },
  { id: "METAL", name: "Metal", icon: "🔩" },
  { id: "PAPER", name: "Paper", icon: "📄" },
  { id: "OTHER", name: "Other", icon: "📦" },
];

export default function MaterialLotReviewPage() {
  const router = useRouter();

  const [draft, setDraft] = useState<MaterialLotDraft | null>(null);
  const [classification, setClassification] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const storedDraft = sessionStorage.getItem(
        "kabadiwala_material_lot_draft",
      );

      if (!storedDraft) {
        throw new Error("Your material lot draft was not found.");
      }

      const parsedDraft = JSON.parse(storedDraft) as MaterialLotDraft;

      if (
        !parsedDraft.material ||
        !Number.isFinite(Number(parsedDraft.weightKg)) ||
        Number(parsedDraft.weightKg) <= 0
      ) {
        throw new Error("The material lot draft is incomplete.");
      }

      setDraft(parsedDraft);
      setClassification(parsedDraft.material);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the material lot draft.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const selected = classifications.find(
    (item) => item.id === classification,
  );

  function handleClassificationChange(value: string) {
    setClassification(value);

    if (!draft) {
      return;
    }

    const updatedDraft = {
      ...draft,
      material: value,
    };

    setDraft(updatedDraft);

    sessionStorage.setItem(
      "kabadiwala_material_lot_draft",
      JSON.stringify(updatedDraft),
    );
  }

  async function handleSubmit() {
    if (!draft || !classification) {
      setError("Please select a material category.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const storedUser = localStorage.getItem("kabadiwala_user");

      if (!storedUser) {
        throw new Error("Your login session was not found.");
      }

      const user = JSON.parse(storedUser);

      if (!user?.id) {
        throw new Error("Your collector account is invalid.");
      }

      let photoUrl: string | null = null;

      /*
       * Upload the selected photo first.
       * The server returns the private Storage path.
       */
      if (draft.photoDataUrl) {
        const response = await fetch(draft.photoDataUrl);

        if (!response.ok) {
          throw new Error("Unable to prepare the selected photo.");
        }

        const blob = await response.blob();

        const extension =
          draft.photoName.split(".").pop()?.toLowerCase() || "jpg";

        const file = new File(
          [blob],
          draft.photoName || `material-photo.${extension}`,
          {
            type: blob.type || "image/jpeg",
          },
        );

        const uploadFormData = new FormData();

        uploadFormData.append("file", file);
        uploadFormData.append("collectorId", user.id);

        const uploadResponse = await fetch(
          "/api/material-lots/upload",
          {
            method: "POST",
            body: uploadFormData,
          },
        );

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadData.ok) {
          throw new Error(
            uploadData.error || "Unable to upload material photo.",
          );
        }

        photoUrl = uploadData.path ?? null;
      }

      /*
       * Create the real material lot only after
       * the photo upload succeeds.
       */
      const createResponse = await fetch("/api/material-lots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectorId: user.id,
          material: classification,
          weightKg: draft.weightKg,
          photoUrl,
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok || !createData.ok) {
        throw new Error(
          createData.error || "Unable to create material lot.",
        );
      }

      const createdLot = Array.isArray(createData.materialLot)
        ? createData.materialLot[0]
        : createData.materialLot;

      if (!createdLot?.id) {
        throw new Error(
          "The material lot was created but no Lot ID was returned.",
        );
      }

      sessionStorage.removeItem("kabadiwala_material_lot_draft");

      router.push(
        `/collector/material-lot/success?id=${encodeURIComponent(
          createdLot.id,
        )}`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create material lot.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">
          Loading material lot...
        </p>
      </main>
    );
  }

  if (!draft) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            Material lot draft unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            {error || "Please start the material lot process again."}
          </p>

          <Link
            href="/collector/material-lot"
            className="mt-6 block w-full rounded-2xl bg-green-700 px-6 py-4 text-center font-bold text-white"
          >
            Start Again
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-8">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link
            href="/collector/material-lot"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl"
          >
            ←
          </Link>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-green-700">
              Kabadiwala Connect
            </p>

            <h1 className="text-lg font-bold text-gray-900">
              Review Material
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5">
        <section className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-green-700">
              Review & confirm
            </span>

            <span className="text-xs font-medium text-gray-400">
              Step 2 of 3
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-2/3 rounded-full bg-green-600" />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="font-bold text-gray-900">
            Material photo
          </h2>

          {draft.photoDataUrl ? (
            <img
              src={draft.photoDataUrl}
              alt="Selected material"
              className="mt-4 h-56 w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="mt-4 flex h-40 items-center justify-center rounded-2xl bg-gray-100">
              <p className="text-sm text-gray-500">
                No photo selected
              </p>
            </div>
          )}

          {draft.photoName && (
            <p className="mt-3 truncate text-xs text-gray-500">
              {draft.photoName}
            </p>
          )}
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-bold text-gray-900">
            Confirm material category
          </h2>

          <p className="mt-1 text-sm leading-5 text-gray-600">
            Check the category and correct it if needed.
          </p>

          <div className="mt-4 space-y-2">
            {classifications.map((item) => {
              const selectedItem = classification === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    handleClassificationChange(item.id)
                  }
                  className={`flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left transition ${
                    selectedItem
                      ? "ring-2 ring-green-600"
                      : "ring-1 ring-gray-200"
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>

                  <span className="flex-1 font-semibold text-gray-900">
                    {item.name}
                  </span>

                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      selectedItem
                        ? "border-green-600 bg-green-600 text-sm text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedItem ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-7 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="font-bold text-gray-900">
            Material lot summary
          </h2>

          <div className="mt-4 divide-y divide-gray-100">
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-gray-500">
                Category
              </span>

              <span className="font-semibold text-gray-900">
                {selected?.icon} {selected?.name}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-500">
                Approx. weight
              </span>

              <span className="font-semibold text-gray-900">
                {draft.weightKg} kg
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-500">
                Photo
              </span>

              <span
                className={`font-semibold ${
                  draft.photoDataUrl
                    ? "text-green-700"
                    : "text-gray-500"
                }`}
              >
                {draft.photoDataUrl ? "✓ Added" : "Not added"}
              </span>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !classification}
          className="mt-7 w-full rounded-2xl bg-green-700 px-6 py-4 font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting
            ? "Uploading photo & creating lot..."
            : "Confirm & Create Lot"}
        </button>

        <p className="mt-3 text-center text-xs leading-5 text-gray-500">
          Your photo is uploaded securely before the material lot is
          created.
        </p>
      </div>
    </main>
  );
}