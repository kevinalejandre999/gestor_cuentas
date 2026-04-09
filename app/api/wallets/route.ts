import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const wallets = await prisma.wallet.findMany({
      where: {
        members: {
          some: { userId: session.user.id },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, lastName: true },
            },
          },
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(wallets);
  } catch (error) {
    console.error("GET wallets error:", error);
    return NextResponse.json(
      { error: "Error al obtener carteras" },
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
    const { name, currency = "USD" } = body;

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    const wallet = await prisma.wallet.create({
      data: {
        name,
        currency,
        ownerId: session.user.id,
        balance: 0,
      },
    });

    await prisma.walletMember.create({
      data: {
        userId: session.user.id,
        walletId: wallet.id,
        role: "owner",
      },
    });

    return NextResponse.json(wallet, { status: 201 });
  } catch (error) {
    console.error("POST wallet error:", error);
    return NextResponse.json(
      { error: "Error al crear la cartera" },
      { status: 500 }
    );
  }
}
