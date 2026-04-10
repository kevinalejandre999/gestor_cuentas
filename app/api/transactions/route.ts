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
  const from = searchParams.get("from");
  const to = searchParams.get("to");

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

    const where: any = { walletId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, lastName: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("GET transactions error:", error);
    return NextResponse.json(
      { error: "Error al obtener transacciones" },
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
    const { type, amount, description, category, date, walletId } = body;

    if (!walletId || !type || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo de transacción inválido" },
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

    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          type,
          amount: Number(amount),
          description: description || null,
          category: category || null,
          date: date ? new Date(date) : new Date(),
          walletId,
          userId: session.user.id,
        },
      });

      const adjustment = type === "INCOME" ? Number(amount) : -Number(amount);
      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: adjustment } },
      });

      return created;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("POST transaction error:", error);
    return NextResponse.json(
      { error: "Error al crear la transacción" },
      { status: 500 }
    );
  }
}
