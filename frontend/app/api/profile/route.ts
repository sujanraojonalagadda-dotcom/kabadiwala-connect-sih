import { db } from "@/prisma/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
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

    const profile = await db.orm.public.Profile
      .where({ userId: currentUser.id })
      .first();

    return Response.json({
      ok: true,
      profile: profile ?? null,
      user: {
        phone: currentUser.phone,
      },
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load profile.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
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
          error: "Only collectors can update this profile.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const fullName =
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : "";

    const language =
      typeof body.language === "string"
        ? body.language.trim()
        : "";

    if (fullName.length > 100) {
      return Response.json(
        {
          ok: false,
          error: "Full name must be 100 characters or fewer.",
        },
        { status: 400 },
      );
    }

    if (language.length > 20) {
      return Response.json(
        {
          ok: false,
          error: "Language value is too long.",
        },
        { status: 400 },
      );
    }

    const existingProfile = await db.orm.public.Profile
      .where({ userId: currentUser.id })
      .first();

    let profile;

    if (existingProfile) {
      profile = await db.orm.public.Profile
        .where({ id: existingProfile.id })
        .update({
          fullName: fullName || null,
          language: language || null,
        });
    } else {
      profile = await db.orm.public.Profile.create({
        id: crypto.randomUUID(),
        userId: currentUser.id,
        fullName: fullName || null,
        language: language || null,
      });
    }

    return Response.json({
      ok: true,
      profile,
    });
  } catch (error) {
    console.error("PATCH PROFILE ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update profile.",
      },
      { status: 500 },
    );
  }
}
