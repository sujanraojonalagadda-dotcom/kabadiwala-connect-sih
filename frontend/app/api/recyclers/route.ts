import { db } from "@/prisma/db";

export async function GET() {
  try {
    const recyclers = await db.orm.public.Recycler
      .where({
        verificationStatus: "VERIFIED",
      })
      .all();

    const locations = await db.orm.public.Location.all();

    const locationByUserId = new Map(
      locations
        .filter(
          (location) =>
            typeof location.userId === "string" && location.userId.length > 0,
        )
        .map((location) => [location.userId as string, location]),
    );

    const recyclersWithLocations = recyclers.map((recycler) => ({
      ...recycler,
      location: locationByUserId.get(recycler.userId) ?? null,
    }));

    return Response.json({
      ok: true,
      recyclers: recyclersWithLocations,
    });
  } catch (error) {
    console.error("GET RECYCLERS ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load recyclers.",
      },
      { status: 500 },
    );
  }
}
