import { db } from "@/prisma/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const phone =
      typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";

    const businessName =
      typeof body.businessName === "string"
        ? body.businessName.trim()
        : "";

    if (phone.length !== 10) {
      return Response.json(
        {
          ok: false,
          error: "A valid 10-digit mobile number is required.",
        },
        { status: 400 },
      );
    }

    if (!businessName) {
      return Response.json(
        {
          ok: false,
          error: "Business name is required.",
        },
        { status: 400 },
      );
    }

    const existingUser = await db.orm.public.User
      .where({ phone })
      .select("id", "phone", "role")
      .first();

    if (existingUser) {
      return Response.json(
        {
          ok: false,
          error: "A user with this mobile number already exists.",
        },
        { status: 409 },
      );
    }

    const user = await db.orm.public.User.create({
      id: crypto.randomUUID(),
      phone,
      role: "RECYCLER",
    });

    const recycler = await db.orm.public.Recycler.create({
      id: crypto.randomUUID(),
      userId: user.id,
      businessName,
      verificationStatus: "PENDING",
    });

    const verificationRequest =
      await db.orm.public.VerificationRequest.create({
        id: crypto.randomUUID(),
        recyclerId: recycler.id,
        status: "PENDING",
      });

    return Response.json(
      {
        ok: true,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
        },
        recycler: {
          id: recycler.id,
          businessName: recycler.businessName,
          verificationStatus: recycler.verificationStatus,
        },
        verificationRequest: {
          id: verificationRequest.id,
          status: verificationRequest.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("RECYCLER REGISTRATION ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to register recycler.",
      },
      { status: 500 },
    );
  }
}