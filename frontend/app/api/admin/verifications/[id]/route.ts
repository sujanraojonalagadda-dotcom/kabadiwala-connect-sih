import { db } from "@/prisma/db";
import { getCurrentUser } from "@/lib/current-user";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    if (!id) {
      return Response.json(
        {
          ok: false,
          error: "Verification request ID is required.",
        },
        { status: 400 },
      );
    }

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
