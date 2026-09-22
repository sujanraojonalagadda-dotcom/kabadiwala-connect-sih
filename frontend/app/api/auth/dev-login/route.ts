import { db } from "@/prisma/db";

import {
  createDevSession,
  DEV_SESSION_COOKIE_NAME,
} from "@/lib/dev-session";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const phone =
      typeof body.phone === "string"
        ? body.phone.replace(/\D/g, "")
        : "";

    const requestedRole =
      body.role === "RECYCLER" || body.role === "COLLECTOR"
        ? body.role
        : null;

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

    const existingUser = await db.orm.public.User
      .where({ phone })
      .select("id", "phone", "role")
      .first();

    /*
     * Existing account:
     * Always use the role already stored in the database.
     * A user cannot change their role during login.
     */
    if (existingUser) {
      const session = createDevSession(existingUser.id);

      const response = Response.json(
        {
          ok: true,
          user: existingUser,
          existing: true,
        },
        { status: 200 },
      );

      response.headers.append(
        "Set-Cookie",
        `${DEV_SESSION_COOKIE_NAME}=${session}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
      );

      return response;
    }

    /*
     * New account, but no role selected yet.
     * Do NOT create anything.
     * The frontend will now show Collector / Recycler selection.
     */
    if (!requestedRole) {
      return Response.json(
        {
          ok: true,
          user: null,
          existing: false,
          requiresRoleSelection: true,
        },
        { status: 200 },
      );
    }

    /*
     * Recycler accounts require a business name.
     */
    if (requestedRole === "RECYCLER" && !businessName) {
      return Response.json(
        {
          ok: false,
          error: "Business name is required for a recycler account.",
        },
        { status: 400 },
      );
    }

    /*
     * Create the new user only after the role has been selected.
     */
    const user = await db.orm.public.User.create({
      id: crypto.randomUUID(),
      phone,
      role: requestedRole,
    });

    if (requestedRole === "COLLECTOR") {
      await db.orm.public.Collector.create({
        id: crypto.randomUUID(),
        userId: user.id,
      });
    }

    if (requestedRole === "RECYCLER") {
      const recycler = await db.orm.public.Recycler.create({
        id: crypto.randomUUID(),
        userId: user.id,
        businessName,
        verificationStatus: "PENDING",
      });

      await db.orm.public.VerificationRequest.create({
        id: crypto.randomUUID(),
        recyclerId: recycler.id,
        status: "PENDING",
      });
    }

    const session = createDevSession(user.id);

    const response = Response.json(
      {
        ok: true,
        user,
        existing: false,
        requiresRoleSelection: false,
      },
      { status: 201 },
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
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}