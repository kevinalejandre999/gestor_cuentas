import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getMembership(walletId: string, userId: string) {
  return prisma.walletMember.findUnique({
    where: { userId_walletId: { userId, walletId } },
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const walletId = searchParams.get("walletId");

  if (!walletId) {
    return NextResponse.json(
      { error: "walletId es obligatorio" },
      { status: 400 }
    );
  }

  try {
    const membership = await getMembership(walletId, session.user.id);
    if (!membership) {
      return NextResponse.json(
        { error: "No tienes acceso a esta cartera" },
        { status: 403 }
      );
    }

    const recurring = await prisma.recurringTransaction.findMany({
      where: { walletId },
      include: {
        user: {
          select: { id: true, name: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(recurring);
  } catch (error) {
    console.error("GET recurring error:", error);
    return NextResponse.json(
      { error: "Error al obtener cuotas fijas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, type, amount, category, description, dayOfMonth, walletId } = body;

    if (!walletId || !title || !type || amount === undefined || dayOfMonth === undefined) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo invalido" },
        { status: 400 }
      );
    }

    const membership = await getMembership(walletId, session.user.id);
    if (!membership) {
      return NextResponse.json(
        { error: "No tienes acceso a esta cartera" },
        { status: 403 }
      );
    }

    const recurring = await prisma.recurringTransaction.create({
      data: {
        title,
        type,
        amount: Number(amount),
        category: category || null,
        description: description || null,
        dayOfMonth: Number(dayOfMonth),
        walletId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(recurring, { status: 201 });
  } catch (error) {
    console.error("POST recurring error:", error);
    return NextResponse.json(
      { error: "Error al crear cuota fija" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    const existing = await prisma.recurringTransaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cuota fija no encontrada" },
        { status: 404 }
      );
    }

    const membership = await getMembership(existing.walletId, session.user.id);
    if (!membership) {
      return NextResponse.json(
        { error: "No tienes acceso" },
        { status: 403 }
      );
    }

    await prisma.recurringTransaction.delete({ where: { id } });

    return NextResponse.json({ message: "Cuota fija eliminada" });
  } catch (error) {
    console.error("DELETE recurring error:", error);
    return NextResponse.json(
      { error: "Error al eliminar cuota fija" },
      { status: 500 }
    );
  }
}
