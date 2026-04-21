import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Single endpoint:
 * - creates Scan
 * - creates Notification linked to Scan
 * - avoids FK violations
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, title, message } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: "Missing userId, title, or message" },
        { status: 400 }
      );
    }

    // 1. Create REAL scan first
    const scan = await prisma.scan.create({
      data: {
        userId,
        status: "completed",
      },
    });

    // 2. Create notification linked to REAL scan
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        scanId: scan.id, // ✅ valid FK
      },
    });

    return NextResponse.json({
      ok: true,
      scan,
      notification,
    });
  } catch (err) {
    console.error("❌ Notify route error:", err);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: String(err),
      },
      { status: 500 }
    );
  }
}