const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const products = await prisma.product.findMany();
  console.log(`There are ${products.length} products in DB.`);
  process.exit(0);
}

check();
