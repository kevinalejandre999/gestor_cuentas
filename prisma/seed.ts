import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@gestorcuentas.com" },
    update: {},
    create: {
      email: "demo@gestorcuentas.com",
      name: "Demo",
      lastName: "Usuario",
      phone: "+1234567890",
      password: hashed,
    },
  });

  console.log("Seed completado:", user.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
