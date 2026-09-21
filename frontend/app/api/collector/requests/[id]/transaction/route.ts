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

    const scheduledAt =
      typeof body.scheduledAt === "string"
        ? body.scheduledAt.trim()
        : null;

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

    if (recyclingRequest.status !== "ACCEPTED") {
      return Response.json(
        {
          ok: false,
          error: "A transaction can only be created for an accepted request.",
        },
        { status: 409 },
      );
    }

    const existingTransaction =
      await db.orm.public.Transaction
        .where({ requestId: id })
        .first();

    if (existingTransaction) {
      return Response.json(
        {
          ok: false,
          error: "A transaction already exists for this request.",
        },
        { status: 409 },
      );
    }

    const transaction =
      await db.orm.public.Transaction.create({
        id: crypto.randomUUID(),
        requestId: id,
        collectorId: recyclingRequest.collectorId,
        recyclerId: recyclingRequest.recyclerId,
        status: "SCHEDULED",
        paymentStatus: "PENDING",
        scheduledAt,
      });

    return Response.json(
      {
        ok: true,
        transaction,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE TRANSACTION ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create transaction.",
      },
      { status: 500 },
    );
  }
}