import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getMembership(walletId: string, userId: string) {
  return prisma.walletMember.findUnique({
    where: { userId_walletId: { userId, walletId } },
  });
}

export async function POST(
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
        { error: "No tienes permiso para invitar miembros" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "El email es obligatorio" },
        { status: 400 }
      );
    }

    const userToInvite = await prisma.user.findUnique({ where: { email } });
    if (!userToInvite) {
      return NextResponse.json(
        { error: "No existe un usuario con ese email" },
        { status: 404 }
      );
    }

    const existing = await prisma.walletMember.findUnique({
      where: {
        userId_walletId: { userId: userToInvite.id, walletId: params.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "El usuario ya es miembro de esta cartera" },
        { status: 409 }
      );
    }

    const member = await prisma.walletMember.create({
      data: {
        userId: userToInvite.id,
        walletId: params.id,
        role: "member",
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, lastName: true },
        },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("POST member error:", error);
    return NextResponse.json(
      { error: "Error al invitar miembro" },
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
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar miembros" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "El userId es obligatorio" },
        { status: 400 }
      );
    }

    const target = await getMembership(params.id, userId);
    if (!target) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    if (target.role === "owner") {
      return NextResponse.json(
        { error: "No puedes eliminar al propietario" },
        { status: 403 }
      );
    }

    await prisma.walletMember.delete({
      where: { id: target.id },
    });

    return NextResponse.json({ message: "Miembro eliminado" });
  } catch (error) {
    console.error("DELETE member error:", error);
    return NextResponse.json(
      { error: "Error al eliminar miembro" },
      { status: 500 }
    );
  }
}
