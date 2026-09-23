export type PendingMaterialLot = {
  queueId: string;
  collectorId: string;
  material: string;
  weightKg: number;
  photoName: string;
  photoDataUrl: string;
  photoUrl: string | null;
  createdAt: string;
};

const STORAGE_KEY = "kabadiwala_pending_material_lots";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getPendingMaterialLots(): PendingMaterialLot[] {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.map((lot) => ({
      ...lot,
      photoUrl: typeof lot.photoUrl === "string" ? lot.photoUrl : null,
    }));
  } catch {
    return [];
  }
}

export function savePendingMaterialLot(
  lot: Omit<PendingMaterialLot, "queueId" | "createdAt" | "photoUrl"> & {
    photoUrl?: string | null;
  },
) {
  if (!isBrowser()) return;

  const pendingLot: PendingMaterialLot = {
    ...lot,
    photoUrl: lot.photoUrl ?? null,
    queueId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  const current = getPendingMaterialLots();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...current, pendingLot]),
  );
}

export function updatePendingMaterialLot(
  queueId: string,
  updates: Partial<Pick<PendingMaterialLot, "photoUrl">>,
) {
  if (!isBrowser()) return;

  const updated = getPendingMaterialLots().map((lot) =>
    lot.queueId === queueId ? { ...lot, ...updates } : lot,
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function removePendingMaterialLot(queueId: string) {
  if (!isBrowser()) return;

  const remaining = getPendingMaterialLots().filter(
    (lot) => lot.queueId !== queueId,
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
}

export async function syncPendingMaterialLots(): Promise<number> {
  if (!isBrowser() || !navigator.onLine) return 0;

  const pendingLots = getPendingMaterialLots();
  let syncedCount = 0;

  for (const lot of pendingLots) {
    try {
      let photoUrl = lot.photoUrl;

      if (!photoUrl && lot.photoDataUrl) {
        const photoResponse = await fetch(lot.photoDataUrl);

        if (!photoResponse.ok) {
          continue;
        }

        const blob = await photoResponse.blob();

        const extension =
          lot.photoName.split(".").pop()?.toLowerCase() || "jpg";

        const file = new File(
          [blob],
          lot.photoName || `material-photo.${extension}`,
          {
            type: blob.type || "image/jpeg",
          },
        );

        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const uploadResponse = await fetch(
          "/api/material-lots/upload",
          {
            method: "POST",
            body: uploadFormData,
          },
        );

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadData.ok) {
          continue;
        }

        photoUrl = uploadData.path ?? null;

        updatePendingMaterialLot(lot.queueId, {
          photoUrl,
        });
      }

      const createResponse = await fetch("/api/material-lots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          material: lot.material,
          weightKg: lot.weightKg,
          photoUrl,
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok || !createData.ok) {
        continue;
      }

      const createdLot = Array.isArray(createData.materialLot)
        ? createData.materialLot[0]
        : createData.materialLot;

      if (!createdLot?.id) {
        continue;
      }

      removePendingMaterialLot(lot.queueId);
      syncedCount += 1;
    } catch {
      // Keep the item queued for a later retry.
    }
  }

  return syncedCount;
}
