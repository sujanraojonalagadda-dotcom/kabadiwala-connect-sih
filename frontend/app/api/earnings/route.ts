import { db } from "@/prisma/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(request: Request) {
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
          error: "Only collectors can view earnings.",
        },
        { status: 403 },
      );
    }

    const collectorId = currentUser.id;

    const transactions = await db.orm.public.Transaction
      .where({ collectorId })
      .all();

    const recordedEarnings = [];

    for (const transaction of transactions) {
      if (transaction.paymentStatus !== "RECORDED") {
        continue;
      }

      const payment = await db.orm.public.Payment
        .where({ transactionId: transaction.id })
        .first();

      if (!payment || payment.status !== "RECORDED") {
        continue;
      }

      const requestItem = await db.orm.public.RecyclingRequest
        .where({ id: transaction.requestId })
        .first();

      let materialLot = null;

      if (requestItem) {
        materialLot = await db.orm.public.MaterialLot
          .where({ id: requestItem.materialLotId })
          .first();
      }

      recordedEarnings.push({
        transactionId: transaction.id,
        requestId: transaction.requestId,
        paymentId: payment.id,
        amount: payment.amount,
        method: payment.method,
        recordedAt: payment.recordedAt,
        completedAt: transaction.completedAt,
        material: materialLot?.material ?? null,
        weightKg: materialLot?.weightKg ?? null,
      });
    }

    recordedEarnings.sort((a, b) => {
      const aTime = a.recordedAt
        ? new Date(a.recordedAt).getTime()
        : 0;
      const bTime = b.recordedAt
        ? new Date(b.recordedAt).getTime()
        : 0;

      return bTime - aTime;
    });

    const totalAmount = recordedEarnings.reduce(
      (total, earning) => total + Number(earning.amount),
      0,
    );

    return Response.json({
      ok: true,
      earnings: recordedEarnings,
      totalAmount: totalAmount.toString(),
    });
  } catch (error) {
    console.error("GET EARNINGS ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load earnings.",
      },
      { status: 500 },
    );
  }
}
