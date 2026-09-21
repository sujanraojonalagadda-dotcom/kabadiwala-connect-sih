import { db } from "@/prisma/db";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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

    if (currentUser.role !== "COLLECTOR") {
      return Response.json(
        {
          ok: false,
          error: "Only collectors can accept recycling quotes.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    const recyclingRequest =
      await db.orm.public.RecyclingRequest
        .where({ id })
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

    if (recyclingRequest.collectorId !== currentUser.id) {
      return Response.json(
        {
          ok: false,
          error: "This request does not belong to this collector.",
        },
        { status: 403 },
      );
    }

    if (recyclingRequest.status !== "QUOTE_RECEIVED") {
      return Response.json(
        {
          ok: false,
          error:
            "Only requests with a received quote can be accepted.",
        },
        { status: 409 },
      );
    }

    const quote =
      await db.orm.public.Quote
        .where({ requestId: id })
        .first();

    if (!quote) {
      return Response.json(
        {
          ok: false,
          error: "Quote not found for this request.",
        },
        { status: 404 },
      );
    }

    const updatedRequest =
      await db.orm.public.RecyclingRequest
        .where({ id })
        .update({
          status: "ACCEPTED",
        });

    return Response.json({
      ok: true,
      request: updatedRequest,
      quote,
    });
  } catch (error) {
    console.error("ACCEPT RECYCLING QUOTE ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to accept recycling quote.",
      },
      { status: 500 },
    );
  }
}
