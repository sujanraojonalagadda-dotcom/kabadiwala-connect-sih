import { db } from "@/prisma/db";

import { getCurrentUser } from "@/lib/current-user";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

async function geocodeAddress(address: string) {
  const url = new URL(NOMINATIM_URL);

  url.searchParams.set("q", address);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "in");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "KabadiwalaConnect-SIH/1.0",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to find that location right now.");
  }

  const results = await response.json();

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error(
      "Location not found. Try entering a nearby area, landmark, or city.",
    );
  }

  const result = results[0];

  const latitude = Number(result.lat);
  const longitude = Number(result.lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("The location service returned invalid coordinates.");
  }

  return {
    latitude,
    longitude,
    address: String(result.display_name || address),
  };
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        {
          ok: false,
          error: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const location = await db.orm.public.Location
      .where({ userId: currentUser.id })
      .orderBy((location) => location.createdAt.desc())
      .first();

    return Response.json({
      ok: true,
      location: location ?? null,
    });
  } catch (error) {
    console.error("GET LOCATION ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load location.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        {
          ok: false,
          error: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const address =
      typeof body.address === "string"
        ? body.address.trim()
        : "";

    let latitude =
      typeof body.latitude === "number"
        ? body.latitude
        : Number(body.latitude);

    let longitude =
      typeof body.longitude === "number"
        ? body.longitude
        : Number(body.longitude);

    let savedAddress = address || null;

    if (address && (!Number.isFinite(latitude) || !Number.isFinite(longitude))) {
      const geocoded = await geocodeAddress(address);

      latitude = geocoded.latitude;
      longitude = geocoded.longitude;
      savedAddress = geocoded.address;
    }

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      return Response.json(
        {
          ok: false,
          error: "Invalid location.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return Response.json(
        {
          ok: false,
          error: "Invalid location.",
        },
        { status: 400 },
      );
    }

    const existingLocation = await db.orm.public.Location
      .where({ userId: currentUser.id })
      .orderBy((location) => location.createdAt.desc())
      .first();

    let location;

    if (existingLocation) {
      location = await db.orm.public.Location
        .where({ id: existingLocation.id })
        .update({
          latitude,
          longitude,
          address: savedAddress,
        });
    } else {
      location = await db.orm.public.Location.create({
        id: crypto.randomUUID(),
        userId: currentUser.id,
        latitude,
        longitude,
        address: savedAddress,
      });
    }

    return Response.json({
      ok: true,
      location,
    });
  } catch (error) {
    console.error("POST LOCATION ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to save location.",
      },
      { status: 500 },
    );
  }
}
