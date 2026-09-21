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
          error: "Only collectors can create transactions.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    const scheduledAt =
      typeof body.scheduledAt === "string"
        ? body.scheduledAt.trim()
        : null;

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

    if (recyclingRequest.status !== "ACCEPTED") {
      return Response.json(
        {
          ok: false,
          error:
            "A transaction can only be created for an accepted request.",
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
