import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Duke shtuar të dhëna demo...");

  // Create demo clients
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { email: "tech@alfabusiness.al" },
      update: {},
      create: { name: "Alfa Business Sh.p.k.", email: "tech@alfabusiness.al", phone: "+355 69 111 2233", city: "Tiranë", taxId: "K12345678A", address: "Rruga Myslym Shyri, Nr.5" },
    }),
    prisma.client.upsert({
      where: { email: "info@betastore.com" },
      update: {},
      create: { name: "Beta Store", email: "info@betastore.com", phone: "+355 68 999 8877", city: "Durrës", notes: "Klient VIP" },
    }),
    prisma.client.upsert({
      where: { email: "contact@gammamedia.al" },
      update: {},
      create: { name: "Gamma Media", email: "contact@gammamedia.al", phone: "+355 67 333 4455", city: "Vlorë", taxId: "L98765432B" },
    }),
  ]);

  console.log(`✅ Krijuar ${clients.length} klientë`);

  // Create demo invoices
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: "AXE-202506-1001",
      clientId: clients[0].id,
      status: "paid",
      subtotal: 1500,
      tax: 270,
      total: 1770,
      notes: "Shërbime menaxhimi rrjetesh sociale - Qershor 2025",
      items: {
        create: [
          { description: "Menaxhim Instagram & Facebook", quantity: 1, unitPrice: 800, total: 800 },
          { description: "Krijim Contentu (20 postime)", quantity: 20, unitPrice: 25, total: 500 },
          { description: "Raporte Analitike Mujore", quantity: 1, unitPrice: 200, total: 200 },
        ],
      },
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: "AXE-202506-1002",
      clientId: clients[1].id,
      status: "sent",
      subtotal: 2200,
      tax: 396,
      total: 2596,
      notes: "Kampanjë reklamuese verore",
      items: {
        create: [
          { description: "Dizajn Reklamash (10 kreativa)", quantity: 10, unitPrice: 120, total: 1200 },
          { description: "Meta Ads Management (1 muaj)", quantity: 1, unitPrice: 600, total: 600 },
          { description: "Strategji & Konsulencë", quantity: 2, unitPrice: 200, total: 400 },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "AXE-202606-1003",
      clientId: clients[2].id,
      status: "draft",
      subtotal: 850,
      tax: 153,
      total: 1003,
      items: {
        create: [
          { description: "Dizajn Logo & Brand Identity", quantity: 1, unitPrice: 500, total: 500 },
          { description: "Business Card Design", quantity: 1, unitPrice: 150, total: 150 },
          { description: "Cover Photo Social Media", quantity: 2, unitPrice: 100, total: 200 },
        ],
      },
    },
  });

  console.log(`✅ Krijuar 3 fatura (${invoice1.invoiceNumber}, ${invoice2.invoiceNumber}, ...)`);

  // Demo expenses
  const expenseData = [
    { title: "Qira Zyres - Qershor 2026", amount: 350, category: "Qira", date: new Date("2026-06-01") },
    { title: "Adobe Creative Cloud", amount: 60, category: "Software", date: new Date("2026-06-05") },
    { title: "Dritat & Uji", amount: 45, category: "Utilities", date: new Date("2026-06-08") },
    { title: "Meta Ads (Klient Gamma)", amount: 200, category: "Marketing", date: new Date("2026-06-10") },
    { title: "Canva Pro", amount: 13, category: "Software", date: new Date("2026-06-12") },
  ];

  for (const exp of expenseData) {
    await prisma.expense.create({ data: exp });
  }
  console.log(`✅ Krijuar ${expenseData.length} shpenzime`);

  // Demo posts
  const now = new Date();
  const posts = [
    {
      title: "Promovim Produkti - Alfa Business",
      content: "🚀 Produkti ynë i ri është këtu! Zbuloni ofertat e verës...",
      platform: "instagram",
      status: "scheduled",
      scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      clientId: clients[0].id,
      tags: "#marketing, #oferta, #vere2026",
    },
    {
      title: "Summer Sale - Beta Store",
      content: "☀️ Shitja e Verës ka filluar! Ulje deri 50% në të gjitha produktet.",
      platform: "facebook",
      status: "scheduled",
      scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      clientId: clients[1].id,
      tags: "#sale, #summer, #betastore",
    },
    {
      title: "Brand Reveal - Gamma Media",
      content: "✨ Prezantojmë identitetin e ri vizual të Gamma Media!",
      platform: "linkedin",
      status: "draft",
      clientId: clients[2].id,
      tags: "#branding, #design",
    },
    {
      title: "Behind the Scenes - Studio",
      content: "📸 Një ditë pune në studion tonë...",
      platform: "instagram",
      status: "scheduled",
      scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      tags: "#bts, #axemedia, #creative",
    },
  ];

  for (const post of posts) {
    await prisma.post.create({ data: post });
  }
  console.log(`✅ Krijuar ${posts.length} postime`);

  console.log("\n🎉 Të dhënat demo u shtuan me sukses!");
  console.log("🌐 Hap http://localhost:3000 për të parë aplikacionin");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
