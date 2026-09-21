import { db } from "@/prisma/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const recyclerId =
      typeof body.recyclerId === "string"
        ? body.recyclerId.trim()
        : "";

    if (!recyclerId) {
      return Response.json(
        {
          ok: false,
          error: "recyclerId is required.",
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

    if (transaction.recyclerId !== recyclerId) {
      return Response.json(
        {
          ok: false,
          error: "This transaction does not belong to this recycler.",
        },
        { status: 403 },
      );
    }

    if (transaction.status !== "COLLECTOR_CONFIRMED") {
      return Response.json(
        {
          ok: false,
          error:
            "Recycler confirmation requires collector confirmation.",
        },
        { status: 409 },
      );
    }

    const updatedTransaction =
      await db.orm.public.Transaction
        .where({ id })
        .update({
          status: "RECYCLER_CONFIRMED",
        });

    return Response.json({
      ok: true,
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("RECYCLER CONFIRMATION ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to confirm recycler handover.",
      },
      { status: 500 },
    );
  }
}