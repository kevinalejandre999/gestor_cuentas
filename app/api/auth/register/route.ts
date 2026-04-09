import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, lastName, phone, password, confirmPassword } = body;

    if (!email || !name || !lastName || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben completarse" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Las contraseñas no coinciden" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        name,
        lastName,
        phone: phone || null,
        password: hashed,
      },
    });

    return NextResponse.json(
      { message: "Usuario registrado correctamente" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Error al registrar el usuario" },
      { status: 500 }
    );
  }
}
