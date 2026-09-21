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

    const { id } = await params;

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
      transaction.collectorId !== currentUser.id &&
      transaction.recyclerId !== currentUser.id
    ) {
      return Response.json(
        {
          ok: false,
          error: "You are not a participant in this transaction.",
        },
        { status: 403 },
      );
    }

    if (transaction.status !== "RECYCLER_CONFIRMED") {
      return Response.json(
        {
          ok: false,
          error:
            "A transaction can only be completed after recycler confirmation.",
        },
        { status: 409 },
      );
    }

    const updatedTransaction =
      await db.orm.public.Transaction
        .where({ id })
        .update({
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
        });

    return Response.json({
      ok: true,
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("COMPLETE TRANSACTION ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to complete transaction.",
      },
      { status: 500 },
    );
  }
}
