import { db } from "@/prisma/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const phone =
      typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";

    if (phone.length !== 10) {
      return Response.json(
        {
          ok: false,
          error: "A valid 10-digit mobile number is required.",
        },
        { status: 400 },
      );
    }

    const existingUser = await db.orm.public.User
      .where({ phone })
      .select("id", "phone", "role")
      .first();

    if (existingUser) {
      return Response.json({
        ok: true,
        user: existingUser,
        existing: true,
      });
    }

    const user = await db.orm.public.User.create({
      id: crypto.randomUUID(),
      phone,
      role: "COLLECTOR",
    });

    await db.orm.public.Collector.create({
      id: crypto.randomUUID(),
      userId: user.id,
    });

    return Response.json(
      {
        ok: true,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
        },
        existing: false,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("DEV LOGIN ERROR:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}