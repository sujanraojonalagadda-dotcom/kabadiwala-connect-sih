import { db } from "@/prisma/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const amount = Number(body.amount);

    const method =
      typeof body.method === "string"
        ? body.method.trim()
        : null;

    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json(
        {
          ok: false,
          error: "amount must be greater than zero.",
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

    if (transaction.status !== "COMPLETED") {
      return Response.json(
        {
          ok: false,
          error:
            "Payment can only be recorded for a completed transaction.",
        },
        { status: 409 },
      );
    }

    if (transaction.paymentStatus === "RECORDED") {
      return Response.json(
        {
          ok: false,
          error: "Payment has already been recorded.",
        },
        { status: 409 },
      );
    }

    const existingPayment =
      await db.orm.public.Payment
        .where({ transactionId: id })
        .first();

    if (existingPayment) {
      return Response.json(
        {
          ok: false,
          error: "A payment already exists for this transaction.",
        },
        { status: 409 },
      );
    }

    const payment =
      await db.orm.public.Payment.create({
        id: crypto.randomUUID(),
        transactionId: id,
        amount: amount.toString(),
        status: "RECORDED",
        method,
        recordedAt: new Date().toISOString(),
      });

    const updatedTransaction =
      await db.orm.public.Transaction
        .where({ id })
        .update({
          paymentStatus: "RECORDED",
        });

    return Response.json(
      {
        ok: true,
        payment,
        transaction: updatedTransaction,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("RECORD PAYMENT ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to record payment.",
      },
      { status: 500 },
    );
  }
}