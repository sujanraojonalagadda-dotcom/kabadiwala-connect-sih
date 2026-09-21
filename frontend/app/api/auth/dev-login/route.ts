import { db } from "@/prisma/db";
import {
  createDevSession,
  DEV_SESSION_COOKIE_NAME,
} from "@/lib/dev-session";

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

    let user = existingUser;
    let status = 200;

    if (!user) {
      user = await db.orm.public.User.create({
        id: crypto.randomUUID(),
        phone,
        role: "COLLECTOR",
      });

      await db.orm.public.Collector.create({
        id: crypto.randomUUID(),
        userId: user.id,
      });

      status = 201;
    }

    const session = createDevSession(user.id);

    const response = Response.json(
      {
        ok: true,
        user,
        existing: Boolean(existingUser),
      },
      { status },
    );

    response.headers.append(
      "Set-Cookie",
      `${DEV_SESSION_COOKIE_NAME}=${session}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
    );

    return response;
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
