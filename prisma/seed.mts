import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL no configurada");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed...");

  // 1. Usuario administrador
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@fruteria.cl" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@fruteria.cl",
      password: adminPassword,
      role: "ADMIN",
      pin: "1234",
    },
  });
  console.log("✅ Usuario admin creado:", admin.email);

  // Cajero de ejemplo
  const cajeroPassword = await bcrypt.hash("cajero123", 10);
  const cajero = await prisma.user.upsert({
    where: { email: "cajero@fruteria.cl" },
    update: {},
    create: {
      name: "Cajero Demo",
      email: "cajero@fruteria.cl",
      password: cajeroPassword,
      role: "CAJERO",
      pin: "0000",
    },
  });
  console.log("✅ Usuario cajero creado:", cajero.email);

  // 2. Categorías
  const categoriesData = [
    { name: "Frutas", description: "Frutas frescas" },
    { name: "Verduras", description: "Verduras y hortalizas" },
    { name: "Lácteos", description: "Leche, yogurt, quesos" },
    { name: "Abarrotes", description: "Productos de despensa" },
    { name: "Galletas y Snacks", description: "Galletas, dulces, snacks" },
    { name: "Bebidas", description: "Bebidas, jugos, aguas" },
    { name: "Panadería", description: "Pan, marraquetas" },
    { name: "Limpieza", description: "Productos de aseo" },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { id: cat.name },
      update: {},
      create: cat,
    });
    categories[cat.name] = created.id;
  }
  console.log("✅ Categorías creadas:", categoriesData.length);

  // 3. Bodegas (2)
  const bodega1 = await prisma.warehouse.upsert({
    where: { id: "bodega-1" },
    update: {},
    create: {
      id: "bodega-1",
      name: "Bodega Principal",
      location: "Local comercial",
    },
  });
  const bodega2 = await prisma.warehouse.upsert({
    where: { id: "bodega-2" },
    update: {},
    create: {
      id: "bodega-2",
      name: "Bodega de Reserva",
      location: "Trastero",
    },
  });
  console.log("✅ Bodegas creadas:", bodega1.name, ",", bodega2.name);

  // 4. Productos de ejemplo
  const productsData = [
    { name: "Manzana Roja", category: "Frutas", unit: "KILO", cost: 1200, sale: 1900, stock: 50, minStock: 10 },
    { name: "Manzana Verde", category: "Frutas", unit: "KILO", cost: 1300, sale: 2000, stock: 30, minStock: 10 },
    { name: "Naranja", category: "Frutas", unit: "KILO", cost: 800, sale: 1500, stock: 80, minStock: 15 },
    { name: "Plátano", category: "Frutas", unit: "KILO", cost: 900, sale: 1500, stock: 60, minStock: 10 },
    { name: "Pera", category: "Frutas", unit: "KILO", cost: 1400, sale: 2200, stock: 25, minStock: 8 },
    { name: "Uva", category: "Frutas", unit: "KILO", cost: 2500, sale: 3900, stock: 15, minStock: 5 },
    { name: "Frutilla", category: "Frutas", unit: "KILO", cost: 3500, sale: 5900, stock: 8, minStock: 5 },
    { name: "Limón", category: "Frutas", unit: "KILO", cost: 1500, sale: 2500, stock: 40, minStock: 10 },
    { name: "Malla de Naranjas", category: "Frutas", unit: "MALLA", cost: 4500, sale: 6500, stock: 12, minStock: 4 },
    { name: "Manojo de Perejil", category: "Verduras", unit: "MANOJO", cost: 300, sale: 600, stock: 20, minStock: 5 },
    { name: "Leche Entera 1L", category: "Lácteos", unit: "UNIDAD", cost: 1100, sale: 1400, stock: 50, minStock: 10 },
    { name: "Yogurt Bebible 1L", category: "Lácteos", unit: "UNIDAD", cost: 1500, sale: 2200, stock: 25, minStock: 8 },
    { name: "Pan Marraqueta", category: "Panadería", unit: "UNIDAD", cost: 80, sale: 150, stock: 200, minStock: 50 },
    { name: "Galletas Tritón", category: "Galletas y Snacks", unit: "PACK", cost: 800, sale: 1300, stock: 30, minStock: 8 },
    { name: "Coca-Cola 1.5L", category: "Bebidas", unit: "UNIDAD", cost: 1500, sale: 2200, stock: 24, minStock: 6 },
    { name: "Agua Mineral 1.5L", category: "Bebidas", unit: "UNIDAD", cost: 700, sale: 1200, stock: 40, minStock: 10 },
  ];

  for (const p of productsData) {
    const catId = categories[p.category];
    if (!catId) continue;

    const product = await prisma.product.upsert({
      where: { sku: p.name.toUpperCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        name: p.name,
        sku: p.name.toUpperCase().replace(/\s+/g, "-"),
        categoryId: catId,
        unit: p.unit,
        priceCost: p.cost,
        priceSale: p.sale,
        minStock: p.minStock,
      },
    });

    // Stock en bodega principal
    await prisma.stock.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: bodega1.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        warehouseId: bodega1.id,
        quantity: p.stock,
        minStock: p.minStock,
      },
    });
  }
  console.log("✅ Productos de ejemplo creados:", productsData.length);

  // 5. Configuración de la tienda
  await prisma.storeConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Frutería El Principiante",
      address: "Av. Principal 123, Santiago, Chile",
      phone: "+56 9 1234 5678",
      email: "contacto@fruteriaelprincipiante.cl",
      taxId: "12.345.678-9",
      currency: "CLP",
      currencySymbol: "$",
      ticketHeader: "¡Gracias por su compra!",
      ticketFooter: "Vuelva pronto",
      ivaRate: 19,
    },
  });
  console.log("✅ Configuración de tienda creada");

  console.log("🎉 Seed completado!");
  console.log("\n📋 Credenciales:");
  console.log("   Admin:   admin@fruteria.cl   / admin123");
  console.log("   Cajero:  cajero@fruteria.cl  / cajero123");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
