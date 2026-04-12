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

    // Obtener mes y año actual
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Obtener todas las cuotas fijas activas
    const recurring = await prisma.recurringTransaction.findMany({
      where: { walletId, active: true },
      include: {
        user: {
          select: { id: true, name: true, lastName: true },
        },
        completions: {
          where: {
            month: currentMonth,
            year: currentYear,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Separar en pendientes y completadas
    const pending = recurring.filter((r) => r.completions.length === 0);
    const completed = recurring.filter((r) => r.completions.length > 0);

    return NextResponse.json({ pending, completed, currentMonth, currentYear });
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

// Marcar como completada
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, walletId } = body;

    if (!id || !walletId) {
      return NextResponse.json(
        { error: "Faltan datos" },
        { status: 400 }
      );
    }

    const membership = await getMembership(walletId, session.user.id);
    if (!membership) {
      return NextResponse.json(
        { error: "No tienes acceso" },
        { status: 403 }
      );
    }

    const recurring = await prisma.recurringTransaction.findUnique({
      where: { id },
    });

    if (!recurring) {
      return NextResponse.json(
        { error: "Cuota fija no encontrada" },
        { status: 404 }
      );
    }

    // Obtener mes y año actual
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Verificar si ya fue completada este mes
    const existingCompletion = await prisma.recurringCompletion.findUnique({
      where: {
        recurringId_month_year: {
          recurringId: id,
          month: currentMonth,
          year: currentYear,
        },
      },
    });

    if (existingCompletion) {
      return NextResponse.json(
        { error: "Esta cuota ya fue completada este mes" },
        { status: 400 }
      );
    }

    // Crear la transacción
    const transaction = await prisma.$transaction(async (tx) => {
      // Crear la transacción
      const newTransaction = await tx.transaction.create({
        data: {
          title: recurring.title,
          type: recurring.type,
          amount: recurring.amount,
          description: recurring.description || `Cuota fija - ${recurring.title}`,
          category: recurring.category,
          date: now,
          walletId,
          userId: session.user.id,
        },
      });

      // Actualizar el balance de la cartera
      const adjustment = recurring.type === "INCOME" ? Number(recurring.amount) : -Number(recurring.amount);
      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: adjustment } },
      });

      // Registrar la completación
      await tx.recurringCompletion.create({
        data: {
          recurringId: id,
          walletId,
          userId: session.user.id,
          month: currentMonth,
          year: currentYear,
          completedAt: now,
        },
      });

      return newTransaction;
    });

    return NextResponse.json({
      message: "Cuota completada",
      transaction,
    });
  } catch (error) {
    console.error("PATCH recurring error:", error);
    return NextResponse.json(
      { error: "Error al completar cuota" },
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
