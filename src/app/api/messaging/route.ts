import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/messaging?patientId=xxx
 * Fetch all messages for a patient's thread
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "Missing patientId" },
        { status: 400 }
      );
    }

    // find thread for patient
    const thread = await prisma.thread.findFirst({
      where: { patientId },
    });

    if (!thread) {
      return NextResponse.json({ messages: [] });
    }

    const messages = await prisma.message.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      threadId: thread.id,
      messages,
    });
  } catch (err) {
    console.error("GET Messaging Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messaging
 * Create message + auto-create thread if needed
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patientId, content, sender } = body;

    if (!patientId || !content || !sender) {
      return NextResponse.json(
        { error: "Missing patientId, content, or sender" },
        { status: 400 }
      );
    }

    // 1. Ensure thread exists (safe version of Option B)
    let thread = await prisma.thread.findFirst({
      where: { patientId },
    });

    if (!thread) {
      thread = await prisma.thread.create({
        data: {
          patientId,
        },
      });
    }

    // 2. Create message
    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        content,
        sender,
      },
    });

    return NextResponse.json({
      ok: true,
      threadId: thread.id,
      message,
    });
  } catch (err) {
    console.error("POST Messaging Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}