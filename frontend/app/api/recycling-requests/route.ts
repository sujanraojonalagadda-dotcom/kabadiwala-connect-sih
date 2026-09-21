import { db } from "@/prisma/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const materialLotId =
      typeof body.materialLotId === "string"
        ? body.materialLotId.trim()
        : "";

    const collectorId =
      typeof body.collectorId === "string"
        ? body.collectorId.trim()
        : "";

    const recyclerId =
      typeof body.recyclerId === "string"
        ? body.recyclerId.trim()
        : "";

    if (!materialLotId || !collectorId || !recyclerId) {
      return Response.json(
        {
          ok: false,
          error: "materialLotId, collectorId, and recyclerId are required.",
        },
        { status: 400 },
      );
    }

    const collector = await db.orm.public.User
      .where({ id: collectorId })
      .first();

    if (!collector || collector.role !== "COLLECTOR") {
      return Response.json(
        {
          ok: false,
          error: "Collector not found.",
        },
        { status: 404 },
      );
    }

    const materialLot = await db.orm.public.MaterialLot
      .where({ id: materialLotId })
      .first();

    if (!materialLot) {
      return Response.json(
        {
          ok: false,
          error: "Material lot not found.",
        },
        { status: 404 },
      );
    }

    if (materialLot.collectorId !== collectorId) {
      return Response.json(
        {
          ok: false,
          error: "Material lot does not belong to this collector.",
        },
        { status: 403 },
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
          error: "Requests can only be sent to verified recyclers.",
        },
        { status: 403 },
      );
    }

    const existingRequest = await db.orm.public.RecyclingRequest
      .where({ materialLotId, recyclerId })
      .first();

    if (existingRequest) {
      return Response.json(
        {
          ok: false,
          error: "A request already exists for this material lot and recycler.",
        },
        { status: 409 },
      );
    }

    const recyclingRequest = await db.orm.public.RecyclingRequest.create({
      id: crypto.randomUUID(),
      materialLotId,
      collectorId,
      recyclerId,
      status: "SUBMITTED",
    });

    return Response.json(
      {
        ok: true,
        request: recyclingRequest,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE RECYCLING REQUEST ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create recycling request.",
      },
      { status: 500 },
    );
  }
}
