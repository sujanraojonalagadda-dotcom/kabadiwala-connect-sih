import { db } from "@/prisma/db";

export async function GET() {
  try {
    const recyclers = await db.orm.public.Recycler
      .where({
        verificationStatus: "VERIFIED",
      })
      .all();

    return Response.json({
      ok: true,
      recyclers,
    });
  } catch (error) {
    console.error("GET RECYCLERS ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load recyclers.",
      },
      { status: 500 },
    );
  }
}