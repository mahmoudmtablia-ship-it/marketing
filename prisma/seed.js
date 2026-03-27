const { randomBytes, scryptSync } = require("crypto");
const { PrismaClient, Role } = require("@prisma/client");

const prisma = new PrismaClient();

const adminEmail = process.env.AUTH_ADMIN_EMAIL || "admin@example.com";
const shopperEmail = process.env.AUTH_USER_EMAIL || "user@example.com";
const adminPassword = process.env.AUTH_ADMIN_PASSWORD || "change-me-admin";
const shopperPassword = process.env.AUTH_USER_PASSWORD || "change-me-user";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derivedKey}`;
}

const sourceRecords = [
  {
    id: "src_amazon",
    name: "Amazon",
    logoUrl: "https://logo.clearbit.com/amazon.com",
    reliability: 0.96,
  },
  {
    id: "src_bestbuy",
    name: "BestBuy",
    logoUrl: "https://logo.clearbit.com/bestbuy.com",
    reliability: 0.93,
  },
  {
    id: "src_walmart",
    name: "Walmart",
    logoUrl: "https://logo.clearbit.com/walmart.com",
    reliability: 0.9,
  },
  {
    id: "src_rei",
    name: "REI",
    logoUrl: "https://logo.clearbit.com/rei.com",
    reliability: 0.94,
  },
];

const productRecords = [
  {
    id: "prod_sony_xm5",
    title: "Sony WH-1000XM5",
    description: "Flagship travel headphones with adaptive ANC, crisp mids, and all-day comfort.",
    category: "Audio",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    rating: 4.8,
    tags: ["headphones", "noise-canceling", "travel", "premium", "wireless"],
  },
  {
    id: "prod_bose_ultra",
    title: "Bose QuietComfort Ultra",
    description: "Comfort-first ANC headphones with immersive listening modes and strong call quality.",
    category: "Audio",
    imageUrl:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
    rating: 4.7,
    tags: ["headphones", "noise-canceling", "travel", "comfort", "wireless"],
  },
  {
    id: "prod_soundcore_q45",
    title: "Soundcore Space Q45",
    description: "High-value ANC headphones with long battery life and strong commuter performance.",
    category: "Audio",
    imageUrl:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80",
    rating: 4.5,
    tags: ["headphones", "budget", "noise-canceling", "battery", "travel"],
  },
  {
    id: "prod_nike_trail_gtx",
    title: "Nike Pegasus Trail 5 GTX",
    description: "Waterproof trail runner built for mixed terrain with lightweight cushioning.",
    category: "Running Shoes",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    rating: 4.6,
    tags: ["running", "waterproof", "trail", "shoes", "gore-tex"],
  },
  {
    id: "prod_hoka_speedgoat_gtx",
    title: "HOKA Speedgoat 5 GTX",
    description: "Aggressive grip and waterproof upper for wet trail runs and long-distance sessions.",
    category: "Running Shoes",
    imageUrl:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80",
    rating: 4.7,
    tags: ["running", "waterproof", "trail", "shoes", "outdoor"],
  },
  {
    id: "prod_garmin_265",
    title: "Garmin Forerunner 265",
    description: "AMOLED running watch with adaptive training guidance, GPS, and recovery metrics.",
    category: "Wearables",
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
    rating: 4.8,
    tags: ["running", "watch", "fitness", "gps", "training"],
  },
  {
    id: "prod_anker_powercore",
    title: "Anker PowerCore 10000",
    description: "Compact travel power bank for phones, headphones, and daily commuter kits.",
    category: "Accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1587033411391-5d9e51cce126?auto=format&fit=crop&w=900&q=80",
    rating: 4.4,
    tags: ["travel", "battery", "charger", "portable", "accessory"],
  },
  {
    id: "prod_bambino_plus",
    title: "Breville Bambino Plus",
    description: "Compact espresso machine with fast heat-up and automatic milk texturing.",
    category: "Home Appliances",
    imageUrl:
      "https://images.unsplash.com/photo-1517701550927-30cf4ba1f6d5?auto=format&fit=crop&w=900&q=80",
    rating: 4.6,
    tags: ["espresso", "coffee", "home", "kitchen", "appliance"],
  },
];

const productSourceRecords = [
  {
    id: "ps_sony_amazon",
    productId: "prod_sony_xm5",
    sourceId: "src_amazon",
    price: 329,
    url: "https://amazon.com/dp/B09XS7JWHH?tag=nexusai-20",
    stockStatus: "IN_STOCK",
  },
  {
    id: "ps_sony_bestbuy",
    productId: "prod_sony_xm5",
    sourceId: "src_bestbuy",
    price: 319,
    url: "https://bestbuy.com/site/sony-wh-1000xm5/6505727.p?tag=nexusai-20",
    stockStatus: "LIMITED_STOCK",
  },
  {
    id: "ps_bose_amazon",
    productId: "prod_bose_ultra",
    sourceId: "src_amazon",
    price: 379,
    url: "https://amazon.com/dp/B0CCZ1L489?tag=nexusai-20",
    stockStatus: "IN_STOCK",
  },
  {
    id: "ps_bose_bestbuy",
    productId: "prod_bose_ultra",
    sourceId: "src_bestbuy",
    price: 369,
    url: "https://bestbuy.com/site/bose-quietcomfort-ultra/6554465.p?tag=nexusai-20",
    stockStatus: "IN_STOCK",
  },
  {
    id: "ps_q45_amazon",
    productId: "prod_soundcore_q45",
    sourceId: "src_amazon",
    price: 149,
    url: "https://amazon.com/dp/B0B5VHRX7R?tag=nexusai-20",
    stockStatus: "IN_STOCK",
  },
  {
    id: "ps_q45_walmart",
    productId: "prod_soundcore_q45",
    sourceId: "src_walmart",
    price: 145,
    url: "https://walmart.com/ip/soundcore-space-q45/123456789?tag=nexusai-20",
    stockStatus: "LOW_STOCK",
  },
  {
    id: "ps_nike_rei",
    productId: "prod_nike_trail_gtx",
    sourceId: "src_rei",
    price: 168,
    url: "https://rei.com/product/nike-pegasus-trail-5-gtx?tag=nexusai-20",
    stockStatus: "IN_STOCK",
  },
  {
    id: "ps_nike_walmart",
    productId: "prod_nike_trail_gtx",
    sourceId: "src_walmart",
    price: 172,
    url: "https://walmart.com/ip/nike-pegasus-trail-5-gtx/223344556?tag=nexusai-20",
    stockStatus: "IN_STOCK",
  },
  {
    id: "ps_hoka_rei",
    productId: "prod_hoka_speedgoat_gtx",
    sourceId: "src_rei",
    price: 159,
    url: "https://rei.com/product/hoka-speedgoat-5-gtx?tag=nexusai-20",
    stockStatus: "IN_STOCK",
  },
  {
    id: "ps_hoka_amazon",
    productId: "prod_hoka_speedgoat_gtx",
    sourceId: "src_amazon",
    price: 164,
    url: "https://amazon.com/dp/B0C3HOKAGT?tag=nexusai-20",
    stockStatus: "IN_STOCK",
  },
  {
    id: "ps_garmin_amazon",
    productId: "prod_garmin_265",
    sourceId: "src_amazon",
    price: 429,
    url: "https://amazon.com/dp/B0BS1XYZ12?tag=nexusai-20",
    stockStatus: "IN_STOCK",
  },
  {
    id: "ps_garmin_bestbuy",
    productId: "prod_garmin_265",
    sourceId: "src_bestbuy",
    price: 419,
    url: "https://bestbuy.com/site/garmin-forerunner-265/6543321.p?tag=nexusai-20",
    stockStatus: "IN_STOCK",
  },
  {
    id: "ps_anker_amazon",
    productId: "prod_anker_powercore",
    sourceId: "src_amazon",
    price: 29,
    url: "https://amazon.com/dp/B0194WDVHI?tag=nexusai-20",
    stockStatus: "IN_STOCK",
  },
  {
    id: "ps_anker_walmart",
    productId: "prod_anker_powercore",
    sourceId: "src_walmart",
    price: 31,
    url: "https://walmart.com/ip/anker-powercore-10000/778899001?tag=nexusai-20",
    stockStatus: "IN_STOCK",
  },
  {
    id: "ps_bambino_amazon",
    productId: "prod_bambino_plus",
    sourceId: "src_amazon",
    price: 499,
    url: "https://amazon.com/dp/B07JVD78TT?tag=nexusai-20",
    stockStatus: "IN_STOCK",
  },
  {
    id: "ps_bambino_bestbuy",
    productId: "prod_bambino_plus",
    sourceId: "src_bestbuy",
    price: 489,
    url: "https://bestbuy.com/site/breville-bambino-plus/6421833.p?tag=nexusai-20",
    stockStatus: "IN_STOCK",
  },
];

const clickTimelineDays = [0, 1, 1, 2, 2, 3, 4, 5, 6, 8, 10, 12];

async function upsertSources() {
  for (const record of sourceRecords) {
    await prisma.source.upsert({
      where: { id: record.id },
      update: {
        name: record.name,
        logoUrl: record.logoUrl,
        reliability: record.reliability,
      },
      create: record,
    });
  }
}

async function upsertProducts() {
  for (const record of productRecords) {
    await prisma.product.upsert({
      where: { id: record.id },
      update: {
        title: record.title,
        description: record.description,
        category: record.category,
        imageUrl: record.imageUrl,
        rating: record.rating,
        tags: record.tags,
      },
      create: record,
    });
  }
}

async function upsertProductSources() {
  for (const record of productSourceRecords) {
    await prisma.productSource.upsert({
      where: { id: record.id },
      update: {
        productId: record.productId,
        sourceId: record.sourceId,
        price: record.price,
        currency: "USD",
        url: record.url,
        stockStatus: record.stockStatus,
        lastUpdated: new Date(),
      },
      create: {
        ...record,
        currency: "USD",
        lastUpdated: new Date(),
      },
    });
  }
}

async function upsertUsers() {
  const adminPasswordHash = hashPassword(adminPassword);
  const shopperPasswordHash = hashPassword(shopperPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Nexus Admin",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
      emailVerified: new Date(),
    },
    create: {
      id: "user_admin",
      email: adminEmail,
      name: "Nexus Admin",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
      emailVerified: new Date(),
    },
  });

  const shopper = await prisma.user.upsert({
    where: { email: shopperEmail },
    update: {
      name: "Alex Carter",
      passwordHash: shopperPasswordHash,
      role: Role.USER,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
      emailVerified: new Date(),
    },
    create: {
      id: "user_alex",
      email: shopperEmail,
      name: "Alex Carter",
      passwordHash: shopperPasswordHash,
      role: Role.USER,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
      emailVerified: new Date(),
    },
  });

  return { admin, shopper };
}

async function seedUserState(shopperId) {
  await prisma.wallet.upsert({
    where: { userId: shopperId },
    update: {
      pendingBalance: 18.75,
      availableBalance: 124.05,
      totalEarned: 142.8,
    },
    create: {
      id: "wallet_alex",
      userId: shopperId,
      pendingBalance: 18.75,
      availableBalance: 124.05,
      totalEarned: 142.8,
    },
  });

  await prisma.favorite.upsert({
    where: {
      userId_productId: {
        userId: shopperId,
        productId: "prod_sony_xm5",
      },
    },
    update: {},
    create: {
      id: "fav_alex_sony",
      userId: shopperId,
      productId: "prod_sony_xm5",
    },
  });

  await prisma.favorite.upsert({
    where: {
      userId_productId: {
        userId: shopperId,
        productId: "prod_nike_trail_gtx",
      },
    },
    update: {},
    create: {
      id: "fav_alex_nike",
      userId: shopperId,
      productId: "prod_nike_trail_gtx",
    },
  });

  await prisma.priceAlert.upsert({
    where: { id: "alert_sony" },
    update: {
      userId: shopperId,
      productId: "prod_sony_xm5",
      targetPrice: 299,
      isActive: true,
    },
    create: {
      id: "alert_sony",
      userId: shopperId,
      productId: "prod_sony_xm5",
      targetPrice: 299,
      isActive: true,
    },
  });

  await prisma.priceAlert.upsert({
    where: { id: "alert_hoka" },
    update: {
      userId: shopperId,
      productId: "prod_hoka_speedgoat_gtx",
      targetPrice: 149,
      isActive: true,
    },
    create: {
      id: "alert_hoka",
      userId: shopperId,
      productId: "prod_hoka_speedgoat_gtx",
      targetPrice: 149,
      isActive: true,
    },
  });

  const historyRecords = [
    { id: "hist_1", productId: "prod_soundcore_q45", viewedAt: 1 },
    { id: "hist_2", productId: "prod_sony_xm5", viewedAt: 2 },
    { id: "hist_3", productId: "prod_bose_ultra", viewedAt: 4 },
    { id: "hist_4", productId: "prod_nike_trail_gtx", viewedAt: 6 },
    { id: "hist_5", productId: "prod_hoka_speedgoat_gtx", viewedAt: 8 },
  ];

  for (const record of historyRecords) {
    const viewedAt = new Date();
    viewedAt.setHours(viewedAt.getHours() - record.viewedAt);

    await prisma.browsingHistory.upsert({
      where: { id: record.id },
      update: {
        userId: shopperId,
        productId: record.productId,
        viewedAt,
      },
      create: {
        id: record.id,
        userId: shopperId,
        productId: record.productId,
        viewedAt,
      },
    });
  }
}

async function seedClicks(shopperId, adminId) {
  const clickTemplates = [
    { id: "click_1", productId: "prod_sony_xm5", sourceAgent: "Search", userId: shopperId },
    { id: "click_2", productId: "prod_soundcore_q45", sourceAgent: "Compare", userId: shopperId },
    { id: "click_3", productId: "prod_sony_xm5", sourceAgent: "Recommendation", userId: shopperId },
    { id: "click_4", productId: "prod_nike_trail_gtx", sourceAgent: "Search", userId: shopperId },
    { id: "click_5", productId: "prod_hoka_speedgoat_gtx", sourceAgent: "Compare", userId: shopperId },
    { id: "click_6", productId: "prod_anker_powercore", sourceAgent: "Chatbot", userId: shopperId },
    { id: "click_7", productId: "prod_bose_ultra", sourceAgent: "Search", userId: shopperId },
    { id: "click_8", productId: "prod_garmin_265", sourceAgent: "Recommendation", userId: shopperId },
    { id: "click_9", productId: "prod_bambino_plus", sourceAgent: "Search", userId: adminId },
    { id: "click_10", productId: "prod_sony_xm5", sourceAgent: "Chatbot", userId: shopperId },
    { id: "click_11", productId: "prod_nike_trail_gtx", sourceAgent: "Search", userId: shopperId },
    { id: "click_12", productId: "prod_hoka_speedgoat_gtx", sourceAgent: "Recommendation", userId: shopperId },
  ];

  for (let index = 0; index < clickTemplates.length; index += 1) {
    const template = clickTemplates[index];
    const clickedAt = new Date();
    clickedAt.setDate(clickedAt.getDate() - clickTimelineDays[index]);

    await prisma.click.upsert({
      where: { id: template.id },
      update: {
        productId: template.productId,
        userId: template.userId,
        sourceAgent: template.sourceAgent,
        userAgent: "seed-script",
        ipHash: `seed-ip-${index + 1}`,
        clickedAt,
      },
      create: {
        id: template.id,
        productId: template.productId,
        userId: template.userId,
        sourceAgent: template.sourceAgent,
        userAgent: "seed-script",
        ipHash: `seed-ip-${index + 1}`,
        clickedAt,
      },
    });
  }
}

async function main() {
  await upsertSources();
  await upsertProducts();
  await upsertProductSources();

  const { admin, shopper } = await upsertUsers();
  await seedUserState(shopper.id);
  await seedClicks(shopper.id, admin.id);

  console.log("Seed completed successfully.");
  console.log(`Admin login email: ${adminEmail}`);
  console.log(`User login email: ${shopperEmail}`);
}

main()
  .catch((error) => {
    console.error("Seed failed.", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
