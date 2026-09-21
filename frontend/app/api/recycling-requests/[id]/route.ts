import { db } from "@/prisma/db";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    if (!id) {
      return Response.json(
        {
          ok: false,
          error: "Request ID is required.",
        },
        { status: 400 },
      );
    }

    const recyclingRequest =
      await db.orm.public.RecyclingRequest
        .where({
          id,
        })
        .first();

    if (!recyclingRequest) {
      return Response.json(
        {
          ok: false,
          error: "Recycling request not found.",
        },
        { status: 404 },
      );
    }

    const isCollector =
      recyclingRequest.collectorId === currentUser.id;

    const isRecycler =
      recyclingRequest.recyclerId === currentUser.id;

    if (!isCollector && !isRecycler) {
      return Response.json(
        {
          ok: false,
          error: "You are not authorized to view this request.",
        },
        { status: 403 },
      );
    }

    const quote =
      await db.orm.public.Quote
        .where({
          requestId: id,
        })
        .first();

    const transaction =
      await db.orm.public.Transaction
        .where({
          requestId: id,
        })
        .first();

    const materialLot =
      await db.orm.public.MaterialLot
        .where({
          id: recyclingRequest.materialLotId,
        })
        .first();

    const recycler =
      await db.orm.public.Recycler
        .where({
          userId: recyclingRequest.recyclerId,
        })
        .first();

    return Response.json({
      ok: true,
      request: recyclingRequest,
      quote: quote ?? null,
      transaction: transaction ?? null,
      materialLot: materialLot
        ? {
            id: materialLot.id,
            material: materialLot.material,
            weightKg: materialLot.weightKg,
            photoUrl: materialLot.photoUrl,
            createdAt: materialLot.createdAt,
          }
        : null,
      recycler: recycler
        ? {
            id: recycler.id,
            userId: recycler.userId,
            businessName: recycler.businessName,
            verificationStatus: recycler.verificationStatus,
          }
        : null,
    });
  } catch (error) {
    console.error("GET RECYCLING REQUEST ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load recycling request.",
      },
      { status: 500 },
    );
  }
}
