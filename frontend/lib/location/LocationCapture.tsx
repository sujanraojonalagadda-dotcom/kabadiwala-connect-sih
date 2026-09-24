"use client";

import { useEffect, useState } from "react";

type SavedLocation = {
  latitude: number | string;
  longitude: number | string;
  address: string | null;
};

export default function LocationCapture() {
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLocation() {
      try {
        const response = await fetch("/api/location", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Unable to load saved location.");
        }

        setLocation(data.location ?? null);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load saved location.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadLocation();
  }, []);

  async function saveLocation(latitude: number, longitude: number) {
    const response = await fetch("/api/location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        latitude,
        longitude,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Unable to save location.");
    }

    setLocation(data.location);
  }

  function captureLocation() {
    setError("");

    if (!navigator.geolocation) {
      setError("Location services are not supported on this device.");
      return;
    }

    setCapturing(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await saveLocation(
            position.coords.latitude,
            position.coords.longitude,
          );
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to save location.",
          );
        } finally {
          setCapturing(false);
        }
      },
      (positionError) => {
        setCapturing(false);

        if (positionError.code === positionError.PERMISSION_DENIED) {
          setError("Location permission was denied.");
        } else if (
          positionError.code === positionError.POSITION_UNAVAILABLE
        ) {
          setError("Your current location is unavailable.");
        } else if (positionError.code === positionError.TIMEOUT) {
          setError("Location request timed out. Please try again.");
        } else {
          setError("Unable to get your current location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      },
    );
  }

  async function saveManualLocation() {
    setError("");

    const address = manualAddress.trim();

    if (address.length < 3) {
      setError("Enter an area, landmark, or address.");
      return;
    }

    try {
      setSavingManual(true);

      const response = await fetch("/api/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to find that location.");
      }

      setLocation(data.location);
      setManualAddress("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to find that location.",
      );
    } finally {
      setSavingManual(false);
    }
  }

  return (
    <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
          📍
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-gray-900">My Location</h2>

          <p className="mt-1 text-sm leading-5 text-gray-600">
            Save your real current location to help find nearby recyclers.
          </p>

          {loading && (
            <p className="mt-3 text-xs font-semibold text-gray-500">
              Checking saved location...
            </p>
          )}

          {!loading && location && (
            <div className="mt-3 rounded-xl bg-green-50 p-3">
              <p className="text-xs font-semibold text-green-800">
                Location saved
              </p>

              <p className="mt-1 break-all text-xs text-green-700">
                {Number(location.latitude).toFixed(6)},{" "}
                {Number(location.longitude).toFixed(6)}
              </p>
            </div>
          )}

          {!loading && !location && !error && (
            <p className="mt-3 text-xs font-semibold text-gray-500">
              No location saved yet.
            </p>
          )}

          {error && (
            <div className="mt-3 rounded-xl bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-700">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={captureLocation}
            disabled={capturing}
            className="mt-4 rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {capturing ? "Getting location..." : "📍 Use My Current Location"}
          </button>

          <div className="mt-5 border-t border-gray-100 pt-5">
            <p className="text-sm font-semibold text-gray-900">
              Enter Your Area or Address
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Enter a nearby area, landmark, or address if GPS is unavailable.
            </p>

            <input
              type="text"
              value={manualAddress}
              onChange={(event) => setManualAddress(event.target.value)}
              placeholder="e.g. Benz Circle, Vijayawada"
              className="mt-3 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-green-600"
            />

            <button
              type="button"
              onClick={saveManualLocation}
              disabled={savingManual || !manualAddress.trim()}
              className="mt-3 rounded-xl border border-green-700 px-4 py-3 text-sm font-bold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingManual ? "Finding location..." : "Save This Location"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
