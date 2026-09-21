import { db } from "@/prisma/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const recyclerId = searchParams.get("recyclerId")?.trim();

    if (!recyclerId) {
      return Response.json(
        {
          ok: false,
          error: "recyclerId is required.",
        },
        { status: 400 },
      );
    }

    const recycler = await db.orm.public.Recycler
      .where({ userId: recyclerId })
      .first();

    if (!recycler) {
      return Response.json(
        {
          ok: false,
          error: "Recycler not found.",
        },
        { status: 404 },
      );
    }

    if (recycler.verificationStatus !== "VERIFIED") {
      return Response.json(
        {
          ok: false,
          error: "Recycler is not verified.",
        },
        { status: 403 },
      );
    }

    const requests = await db.orm.public.RecyclingRequest
      .where({ recyclerId })
      .all();

    return Response.json({
      ok: true,
      requests,
    });
  } catch (error) {
    console.error("GET RECYCLER REQUESTS ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load recycler requests.",
      },
      { status: 500 },
    );
  }
}