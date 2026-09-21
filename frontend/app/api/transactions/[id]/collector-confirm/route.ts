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

    if (transaction.collectorId !== collectorId) {
      return Response.json(
        {
          ok: false,
          error: "This transaction does not belong to this collector.",
        },
        { status: 403 },
      );
    }

    if (transaction.status !== "HANDOVER_INITIATED") {
      return Response.json(
        {
          ok: false,
          error:
            "Collector confirmation requires an initiated handover.",
        },
        { status: 409 },
      );
    }

    const updatedTransaction =
      await db.orm.public.Transaction
        .where({ id })
        .update({
          status: "COLLECTOR_CONFIRMED",
        });

    return Response.json({
      ok: true,
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("COLLECTOR CONFIRMATION ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to confirm collector handover.",
      },
      { status: 500 },
    );
  }
}