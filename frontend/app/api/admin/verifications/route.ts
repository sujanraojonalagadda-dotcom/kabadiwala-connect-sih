import { db } from "@/prisma/db";

export async function GET() {
  try {
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