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

    if (currentUser.role !== "ADMIN") {
      return Response.json(
        {
          ok: false,
          error: "Admin access required.",
        },
        { status: 403 },
      );
    }

    const verifications =
      await db.orm.public.VerificationRequest.all();

    return Response.json({
      ok: true,
      verifications,
    });
  } catch (error) {
    console.error("GET ADMIN VERIFICATIONS ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load verification requests.",
      },
      { status: 500 },
    );
  }
}
