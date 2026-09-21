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

    if (currentUser.role !== "RECYCLER") {
      return Response.json(
        {
          ok: false,
          error: "Only recyclers can confirm recycler handover.",
        },
        { status: 403 },
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

    if (transaction.recyclerId !== currentUser.id) {
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
