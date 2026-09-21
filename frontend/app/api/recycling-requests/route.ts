import { db } from "@/prisma/db";
import { getCurrentUser } from "@/lib/current-user";

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

    if (currentUser.role !== "COLLECTOR") {
      return Response.json(
        {
          ok: false,
          error: "Only collectors can view recycling requests.",
        },
        { status: 403 },
      );
    }

    const requests = await db.orm.public.RecyclingRequest
      .where({ collectorId: currentUser.id })
      .all();

    requests.sort(
      (a, b) =>
        new Date(String(b.createdAt)).getTime() -
        new Date(String(a.createdAt)).getTime(),
    );

    return Response.json({
      ok: true,
      requests,
    });
  } catch (error) {
    console.error("GET RECYCLING REQUESTS ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load recycling requests.",
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

    if (currentUser.role !== "COLLECTOR") {
      return Response.json(
        {
          ok: false,
          error: "Only collectors can create recycling requests.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const materialLotId =
      typeof body.materialLotId === "string"
        ? body.materialLotId.trim()
        : "";

    const recyclerId =
      typeof body.recyclerId === "string"
        ? body.recyclerId.trim()
        : "";

    if (!materialLotId || !recyclerId) {
      return Response.json(
        {
          ok: false,
          error: "materialLotId and recyclerId are required.",
        },
        { status: 400 },
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

    if (materialLot.collectorId !== currentUser.id) {
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
          error:
            "A request already exists for this material lot and recycler.",
        },
        { status: 409 },
      );
    }

    const recyclingRequest =
      await db.orm.public.RecyclingRequest.create({
        id: crypto.randomUUID(),
        materialLotId,
        collectorId: currentUser.id,
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
