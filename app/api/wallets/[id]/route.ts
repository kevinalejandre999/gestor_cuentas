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
    const membership = await getMembership(params.id, session.user.id);
    if (!membership) {
      return NextResponse.json(
        { error: "No tienes acceso a esta cartera" },
        { status: 403 }
      );
    }

    const wallet = await prisma.wallet.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, lastName: true },
            },
          },
        },
      },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Cartera no encontrada" },
        { status: 404 }
      );
    }

    // Incluir el rol del usuario actual en la respuesta
    return NextResponse.json({
      ...wallet,
      userRole: membership.role,
    });
  } catch (error) {
    console.error("GET wallet error:", error);
    return NextResponse.json(
      { error: "Error al obtener la cartera" },
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
    const membership = await getMembership(params.id, session.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar esta cartera" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, currency } = body;

    const wallet = await prisma.wallet.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(currency !== undefined && { currency }),
      },
    });

    return NextResponse.json(wallet);
  } catch (error) {
    console.error("PATCH wallet error:", error);
    return NextResponse.json(
      { error: "Error al actualizar la cartera" },
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
    const membership = await getMembership(params.id, session.user.id);
    if (!membership || membership.role !== "owner") {
      return NextResponse.json(
        { error: "Solo el propietario puede eliminar la cartera" },
        { status: 403 }
      );
    }

    await prisma.wallet.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Cartera eliminada" });
  } catch (error) {
    console.error("DELETE wallet error:", error);
    return NextResponse.json(
      { error: "Error al eliminar la cartera" },
      { status: 500 }
    );
  }
}
