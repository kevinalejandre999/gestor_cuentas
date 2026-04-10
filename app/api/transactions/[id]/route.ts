import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getMembership(walletId: string, userId: string) {
  return prisma.walletMember.findUnique({
    where: { userId_walletId: { userId, walletId } },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { id: true, name: true, lastName: true },
        },
        wallet: { select: { id: true, name: true, currency: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    const membership = await getMembership(
      transaction.walletId,
      session.user.id
    );
    if (!membership) {
      return NextResponse.json(
        { error: "No tienes acceso a esta transacción" },
        { status: 403 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("GET transaction error:", error);
    return NextResponse.json(
      { error: "Error al obtener la transacción" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const existing = await prisma.transaction.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    const membership = await getMembership(
      existing.walletId,
      session.user.id
    );
    if (!membership) {
      return NextResponse.json(
        { error: "No tienes acceso a esta transacción" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { type, amount, description, category, date } = body;

    const updated = await prisma.$transaction(async (tx) => {
      // Revertir efecto anterior
      const oldAdjustment =
        existing.type === "INCOME"
          ? -Number(existing.amount)
          : Number(existing.amount);
      await tx.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { increment: oldAdjustment } },
      });

      // Aplicar nuevo efecto
      const newAdjustment =
        type === "INCOME" ? Number(amount) : -Number(amount);
      await tx.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { increment: newAdjustment } },
      });

      return tx.transaction.update({
        where: { id: params.id },
        data: {
          type,
          amount: Number(amount),
          description: description ?? existing.description,
          category: category ?? existing.category,
          date: date ? new Date(date) : existing.date,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH transaction error:", error);
    return NextResponse.json(
      { error: "Error al actualizar la transacción" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const existing = await prisma.transaction.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    const membership = await getMembership(
      existing.walletId,
      session.user.id
    );
    if (!membership) {
      return NextResponse.json(
        { error: "No tienes acceso a esta transacción" },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const adjustment =
        existing.type === "INCOME"
          ? -Number(existing.amount)
          : Number(existing.amount);
      await tx.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { increment: adjustment } },
      });

      await tx.transaction.delete({ where: { id: params.id } });
    });

    return NextResponse.json({ message: "Transacción eliminada" });
  } catch (error) {
    console.error("DELETE transaction error:", error);
    return NextResponse.json(
      { error: "Error al eliminar la transacción" },
      { status: 500 }
    );
  }
}
