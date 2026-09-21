import { db } from "@/prisma/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const actorId =
      typeof body.actorId === "string"
        ? body.actorId.trim()
        : "";

    if (!actorId) {
      return Response.json(
        {
          ok: false,
          error: "actorId is required.",
        },
        { status: 400 },
      );
    }

    const transaction =
      await db.orm.public.Transaction
        .where({ id })
        .first();

    if (!transaction) {
      return Response.json(
        {
          ok: false,
          error: "Transaction not found.",
        },
        { status: 404 },
      );
    }

    if (
      transaction.collectorId !== actorId &&
      transaction.recyclerId !== actorId
    ) {
      return Response.json(
        {
          ok: false,
          error: "You are not a participant in this transaction.",
        },
        { status: 403 },
      );
    }

    if (transaction.status !== "SCHEDULED") {
      return Response.json(
        {
          ok: false,
          error:
            "Handover can only be initiated for a scheduled transaction.",
        },
        { status: 409 },
      );
    }

    const updatedTransaction =
      await db.orm.public.Transaction
        .where({ id })
        .update({
          status: "HANDOVER_INITIATED",
        });

    return Response.json({
      ok: true,
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("INITIATE HANDOVER ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to initiate handover.",
      },
      { status: 500 },
    );
  }
}