"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useRef } from "react";

type MapLocation = {
  latitude: number | string;
  longitude: number | string;
};

type MapRecycler = {
  id: string;
  userId: string;
  businessName: string | null;
  location: MapLocation | null;
};

type RecyclerMapProps = {
  collectorLocation: MapLocation;
  recyclers: MapRecycler[];
  selectedRecyclerId: string;
  onSelectRecycler: (userId: string) => void;
};

function distanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const earthRadiusKm = 6371;
  const lat1 = (latitude1 * Math.PI) / 180;
  const lat2 = (latitude2 * Math.PI) / 180;
  const deltaLat = ((latitude2 - latitude1) * Math.PI) / 180;
  const deltaLon = ((longitude2 - longitude1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) ** 2;

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

export default function RecyclerMap({
  collectorLocation,
  recyclers,
  selectedRecyclerId,
  onSelectRecycler,
}: RecyclerMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  const collectorLatitude = Number(collectorLocation.latitude);
  const collectorLongitude = Number(collectorLocation.longitude);

  const mappedRecyclers = useMemo(
    () =>
      recyclers
        .map((recycler) => {
          if (!recycler.location) {
            return null;
          }

          const latitude = Number(recycler.location.latitude);
          const longitude = Number(recycler.location.longitude);

          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
          ) {
            return null;
          }

          return {
            ...recycler,
            latitude,
            longitude,
            distance: distanceKm(
              collectorLatitude,
              collectorLongitude,
              latitude,
              longitude,
            ),
          };
        })
        .filter(
          (
            recycler,
          ): recycler is MapRecycler & {
            latitude: number;
            longitude: number;
            distance: number;
          } => recycler !== null,
        ),
    [collectorLatitude, collectorLongitude, recyclers],
  );

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (
        !mapElementRef.current ||
        !Number.isFinite(collectorLatitude) ||
        !Number.isFinite(collectorLongitude)
      ) {
        return;
      }

      const L = await import("leaflet");

      if (cancelled || !mapElementRef.current) {
        return;
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(mapElementRef.current).setView(
        [collectorLatitude, collectorLongitude],
        14,
      );

      mapRef.current = map;

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        },
      ).addTo(map);

      L.circleMarker(
        [collectorLatitude, collectorLongitude],
        {
          radius: 10,
          color: "#166534",
          fillColor: "#22c55e",
          fillOpacity: 1,
          weight: 3,
        },
      )
        .addTo(map)
        .bindPopup("<strong>Your location</strong>");

      mappedRecyclers.forEach((recycler) => {
        const selected = recycler.userId === selectedRecyclerId;

        const marker = L.circleMarker(
          [recycler.latitude, recycler.longitude],
          {
            radius: selected ? 11 : 8,
            color: selected ? "#1d4ed8" : "#166534",
            fillColor: selected ? "#3b82f6" : "#22c55e",
            fillOpacity: 0.9,
            weight: 3,
          },
        ).addTo(map);

        const popup = document.createElement("div");
        popup.className = "min-w-36";

        const name = document.createElement("p");
        name.className = "font-semibold";
        name.textContent = recycler.businessName || "Verified Recycler";

        const distance = document.createElement("p");
        distance.className = "mt-1 text-sm";
        distance.textContent = `${recycler.distance.toFixed(2)} km away`;

        const button = document.createElement("button");
        button.type = "button";
        button.className =
          "mt-2 rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white";
        button.textContent = "Select Recycler";
        button.addEventListener("click", () => {
          onSelectRecycler(recycler.userId);
          marker.closePopup();
        });

        popup.appendChild(name);
        popup.appendChild(distance);
        popup.appendChild(button);

        marker.bindPopup(popup);

        marker.on("click", () => {
          onSelectRecycler(recycler.userId);
        });
      });
    }

    initializeMap();

    return () => {
      cancelled = true;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [
    collectorLatitude,
    collectorLongitude,
    mappedRecyclers,
    onSelectRecycler,
    selectedRecyclerId,
  ]);

  if (
    !Number.isFinite(collectorLatitude) ||
    !Number.isFinite(collectorLongitude)
  ) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Your saved location is not valid, so the map cannot be displayed.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="p-4">
        <h2 className="text-base font-semibold text-gray-900">
          Nearby Verified Recyclers
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Only recyclers with a real saved location are shown on the map.
        </p>
      </div>

      <div
        ref={mapElementRef}
        className="h-80 w-full"
        aria-label="Map showing your location and verified recyclers"
      />

      <div className="border-t border-gray-100 px-4 py-3">
        <p className="text-xs font-medium text-gray-500">
          {mappedRecyclers.length} verified recycler
          {mappedRecyclers.length === 1 ? "" : "s"} with a real map location
        </p>
      </div>
    </div>
  );
}
