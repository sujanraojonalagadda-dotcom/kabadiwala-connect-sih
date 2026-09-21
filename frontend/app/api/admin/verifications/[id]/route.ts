import { db } from "@/prisma/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const status = body.status;

    if (status !== "VERIFIED" && status !== "REJECTED") {
      return Response.json(
        {
          ok: false,
          error: "Status must be VERIFIED or REJECTED.",
        },
        { status: 400 },
      );
    }

    const verification = await db.orm.public.VerificationRequest
      .where({ id })
      .first();

    if (!verification) {
      return Response.json(
        {
          ok: false,
          error: "Verification request not found.",
        },
        { status: 404 },
      );
    }

    const updatedVerification =
      await db.orm.public.VerificationRequest
        .where({ id })
        .update({
          status,
          reviewedAt: new Date().toISOString(),
        });

    await db.orm.public.Recycler
      .where({ id: verification.recyclerId })
      .update({
        verificationStatus: status,
      });

    return Response.json({
      ok: true,
      verification: updatedVerification,
    });
  } catch (error) {
    console.error("UPDATE ADMIN VERIFICATION ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update verification request.",
      },
      { status: 500 },
    );
  }
}
