import { db } from "@/prisma/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const collectorId =
      typeof body.collectorId === "string"
        ? body.collectorId.trim()
        : "";

    if (!collectorId) {
      return Response.json(
        {
          ok: false,
          error: "collectorId is required.",
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

    if (recyclingRequest.collectorId !== collectorId) {
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
          error: "Only requests with a received quote can be accepted.",
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