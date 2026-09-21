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

    const amount = Number(body.amount);

    const pricePerKg =
      body.pricePerKg === undefined ||
      body.pricePerKg === null ||
      body.pricePerKg === ""
        ? null
        : Number(body.pricePerKg);

    const notes =
      typeof body.notes === "string"
        ? body.notes.trim()
        : null;

    if (!recyclerId) {
      return Response.json(
        {
          ok: false,
          error: "recyclerId is required.",
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json(
        {
          ok: false,
          error: "amount must be greater than zero.",
        },
        { status: 400 },
      );
    }

    if (
      pricePerKg !== null &&
      (!Number.isFinite(pricePerKg) || pricePerKg <= 0)
    ) {
      return Response.json(
        {
          ok: false,
          error: "pricePerKg must be greater than zero.",
        },
        { status: 400 },
      );
    }

    const recycler = await db.orm.public.Recycler
      .where({ userId: recyclerId })
      .first();

    if (!recycler) {
      return Response.json(
        {
          ok: false,
          error: "Recycler not found.",
        },
        { status: 404 },
      );
    }

    if (recycler.verificationStatus !== "VERIFIED") {
      return Response.json(
        {
          ok: false,
          error: "Recycler is not verified.",
        },
        { status: 403 },
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

    if (recyclingRequest.recyclerId !== recyclerId) {
      return Response.json(
        {
          ok: false,
          error: "This request does not belong to this recycler.",
        },
        { status: 403 },
      );
    }

    if (recyclingRequest.status !== "SUBMITTED") {
      return Response.json(
        {
          ok: false,
          error: "A quote can only be submitted for a SUBMITTED request.",
        },
        { status: 409 },
      );
    }

    const existingQuote =
      await db.orm.public.Quote
        .where({ requestId: id })
        .first();

    if (existingQuote) {
      return Response.json(
        {
          ok: false,
          error: "A quote already exists for this request.",
        },
        { status: 409 },
      );
    }

    const quote = await db.orm.public.Quote.create({
      id: crypto.randomUUID(),
      requestId: id,
      amount: amount.toString(),
      pricePerKg:
        pricePerKg === null
          ? null
          : pricePerKg.toString(),
      notes,
    });

    const updatedRequest =
      await db.orm.public.RecyclingRequest
        .where({ id })
        .update({
          status: "QUOTE_RECEIVED",
        });

    return Response.json(
      {
        ok: true,
        quote,
        request: updatedRequest,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE RECYCLER QUOTE ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create quote.",
      },
      { status: 500 },
    );
  }
}