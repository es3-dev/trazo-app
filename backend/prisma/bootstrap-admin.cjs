require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const nombres = process.env.BOOTSTRAP_ADMIN_FIRST_NAME?.trim();
  const apellidos = process.env.BOOTSTRAP_ADMIN_LAST_NAME?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Set a valid BOOTSTRAP_ADMIN_EMAIL');
  }
  if (!nombres || !apellidos) {
    throw new Error('Set BOOTSTRAP_ADMIN_FIRST_NAME and BOOTSTRAP_ADMIN_LAST_NAME');
  }
  if (!password || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be 12-72 bytes long');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.$transaction(async (tx) => {
    const adminRole = await tx.rol.findUnique({
      where: { nombre: 'ADMINISTRADOR' },
    });
    if (
      adminRole &&
      (await tx.personaRol.findFirst({ where: { rolId: adminRole.id } }))
    ) {
      throw new Error('An administrator already exists; bootstrap is one-time only');
    }

    const role = await tx.rol.upsert({
      where: { nombre: 'ADMINISTRADOR' },
      update: {},
      create: { nombre: 'ADMINISTRADOR' },
    });
    const persona = await tx.persona.create({
      data: { nombres, apellidos, email },
    });
    await tx.personaRol.create({
      data: { personaId: persona.id, rolId: role.id },
    });
    await tx.usuario.create({
      data: { personaId: persona.id, email, passwordHash },
    });
  });

  console.log(`Created initial administrator account: ${email}`);
}

main()
  .catch((error) => {
    console.error('Could not bootstrap administrator:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
