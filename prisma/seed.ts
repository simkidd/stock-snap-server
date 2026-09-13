import 'dotenv/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient, UserRole, ProductStatusEnum } from '../src/generated/prisma/client';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting comprehensive StockSnap Nigerian Retail POS database seeding...');

  // 1. Clean existing data in logical reverse-dependency order
  try {
    await prisma.paymentTransaction.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.sales.deleteMany();
    await prisma.registerSession.deleteMany();
    await prisma.register.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.discount.deleteMany();
    await prisma.auth.deleteMany();
    await prisma.user.deleteMany();
    await prisma.store.deleteMany();
    await prisma.tenant.deleteMany();
    console.log('🧹 Cleaned existing tables successfully.');
  } catch (e) {
    console.log('Notice: Tables may have been empty, proceeding...');
  }

  // 2. Create Tenant (Port Harcourt, Rivers State)
  const tenant = await prisma.tenant.create({
    data: {
      name: 'StockSnap Supermarket Ltd',
      slug: 'stocksnap-ph',
      currency: 'NGN',
      phone: '+234 803 123 4567',
      email: 'contact@stocksnap.ng',
      address: 'Plot 12, Peter Odili Road, Trans-Amadi',
      city: 'Port Harcourt',
      state: 'Rivers State',
      country: 'Nigeria',
      cacNumber: 'RC-1892842',
      vatTIN: 'TIN-28492019-0001',
    },
  });
  console.log(`✅ Created Tenant: ${tenant.name} (${tenant.city}, ${tenant.state})`);

  // 3. Create Main Store Branch
  const store = await prisma.store.create({
    data: {
      tenantId: tenant.id,
      name: 'Peter Odili Main Branch',
      slug: 'peter-odili-branch',
      address: 'Plot 12, Peter Odili Road, Trans-Amadi',
      city: 'Port Harcourt',
      state: 'Rivers State',
      phone: '+234 803 123 4567',
      receiptHeader:
        'STOCKSNAP SUPERMARKET\nPlot 12, Peter Odili Road, Port Harcourt\nTel: +234 803 123 4567 | TIN: 28492019-0001',
      receiptFooter:
        'No refund of money after payment.\nGoods in good condition can be exchanged within 48 hours.\nThank you for your patronage!',
      defaultVatRate: 7.5,
      isMainStore: true,
    },
  });
  console.log(`✅ Created Store: ${store.name}`);

  // 4. Create Registers (Checkout Desks)
  const reg1 = await prisma.register.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      name: 'Counter 1 (Main Cashier)',
      code: 'REG-01',
    },
  });
  const reg2 = await prisma.register.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      name: 'Counter 2 (Fast Lane)',
      code: 'REG-02',
    },
  });
  console.log(`✅ Created Registers: ${reg1.code}, ${reg2.code}`);

  // 5. Create Staff Accounts with Passwords and 4-digit PINs
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminPinHash = await bcrypt.hash('1234', 10);
  const managerPinHash = await bcrypt.hash('9999', 10);
  const cashierPinHash = await bcrypt.hash('0000', 10);
  const inventoryPinHash = await bcrypt.hash('5555', 10);
  const accountantPinHash = await bcrypt.hash('7777', 10);

  const adminUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      firstName: 'Chidi',
      middleName: 'Ike',
      lastName: 'Amadi',
      email: 'admin@stocksnap.ng',
      role: UserRole.ADMIN,
      gender: 'Male',
      phoneNumber: '+234 803 000 0001',
      auth: {
        create: {
          password: passwordHash,
          pinCode: adminPinHash,
          isEmailVerified: true,
        },
      },
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      firstName: 'Tamuno',
      middleName: null,
      lastName: 'Briggs',
      email: 'manager@stocksnap.ng',
      role: UserRole.STORE_MANAGER,
      gender: 'Male',
      phoneNumber: '+234 803 000 0002',
      auth: {
        create: {
          password: passwordHash,
          pinCode: managerPinHash,
          isEmailVerified: true,
        },
      },
    },
  });

  const cashierUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      firstName: 'Blessing',
      middleName: 'Ada',
      lastName: 'Jumbo',
      email: 'cashier@stocksnap.ng',
      role: UserRole.CASHIER,
      gender: 'Female',
      phoneNumber: '+234 803 000 0003',
      auth: {
        create: {
          password: passwordHash,
          pinCode: cashierPinHash,
          isEmailVerified: true,
        },
      },
    },
  });

  const inventoryUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      firstName: 'Emeka',
      middleName: 'David',
      lastName: 'Nwachukwu',
      email: 'inventory@stocksnap.ng',
      role: UserRole.INVENTORY_CONTROLLER,
      gender: 'Male',
      phoneNumber: '+234 803 000 0004',
      auth: {
        create: {
          password: passwordHash,
          pinCode: inventoryPinHash,
          isEmailVerified: true,
        },
      },
    },
  });

  const accountantUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      firstName: 'Fatima',
      middleName: 'Zainab',
      lastName: 'Bello',
      email: 'accounts@stocksnap.ng',
      role: UserRole.ACCOUNTANT,
      gender: 'Female',
      phoneNumber: '+234 803 000 0005',
      auth: {
        create: {
          password: passwordHash,
          pinCode: accountantPinHash,
          isEmailVerified: true,
        },
      },
    },
  });
  console.log(
    `✅ Created Staff: Admin (${adminUser.email}), Manager (${managerUser.email}), Cashier (${cashierUser.email}), Inventory (${inventoryUser.email}), Accountant (${accountantUser.email})`
  );

  // 6. Create Suppliers
  const supplierDangote = await prisma.supplier.create({
    data: {
      tenantId: tenant.id,
      name: 'Dangote Distribution Hub Ltd',
      slug: 'dangote-distribution-hub',
      contactPhone: '08031234567',
      contactAddress: 'Plot 14, Trans-Amadi Industrial Layout, Port Harcourt',
    },
  });

  const supplierNestle = await prisma.supplier.create({
    data: {
      tenantId: tenant.id,
      name: 'Nestle Nigeria Plc Direct Logistics',
      slug: 'nestle-nigeria-logistics',
      contactPhone: '08098765432',
      contactAddress: 'Aba Road Depot, Port Harcourt',
    },
  });

  const supplierCocaCola = await prisma.supplier.create({
    data: {
      tenantId: tenant.id,
      name: 'NBC Coca-Cola Bottling Depot',
      slug: 'nbc-coca-cola-depot',
      contactPhone: '08023456789',
      contactAddress: 'Trans-Amadi Central Bottling Plant, Port Harcourt',
    },
  });

  const supplierFriesland = await prisma.supplier.create({
    data: {
      tenantId: tenant.id,
      name: 'FrieslandCampina WAMCO Distributor',
      slug: 'frieslandcampina-wamco-dist',
      contactPhone: '08056789012',
      contactAddress: 'Wharf Road Cold Hub, Port Harcourt',
    },
  });
  console.log('✅ Created 4 Verified FMCG Suppliers');

  // 7. Categories & Subcategories
  const catGroceries = await prisma.category.create({
    data: { tenantId: tenant.id, name: 'Groceries & Foods', slug: 'groceries-foods' },
  });

  const catBeverages = await prisma.category.create({
    data: { tenantId: tenant.id, name: 'Drinks & Beverages', slug: 'drinks-beverages' },
  });

  const catToiletries = await prisma.category.create({
    data: { tenantId: tenant.id, name: 'Toiletries & Household', slug: 'toiletries-household' },
  });

  const catApparel = await prisma.category.create({
    data: { tenantId: tenant.id, name: 'Apparel & Footwear', slug: 'apparel-footwear' },
  });

  const subPackaged = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Packaged Foods & Cereals',
      slug: 'packaged-foods',
      parentId: catGroceries.id,
    },
  });

  const subSoftDrinks = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Soft Drinks & Water',
      slug: 'soft-drinks',
      parentId: catBeverages.id,
    },
  });

  const subHygiene = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Personal Hygiene & Soap',
      slug: 'personal-hygiene',
      parentId: catToiletries.id,
    },
  });

  const subSneakers = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Sneakers & Shoes',
      slug: 'sneakers-shoes',
      parentId: catApparel.id,
    },
  });
  console.log('✅ Created Product Categories and Hierarchical Subcategories');

  // 8. Brands
  const brandNestle = await prisma.brand.create({
    data: { tenantId: tenant.id, name: 'Nestle', slug: 'nestle' },
  });
  const brandFriesland = await prisma.brand.create({
    data: { tenantId: tenant.id, name: 'FrieslandCampina Peak', slug: 'peak' },
  });
  const brandDufil = await prisma.brand.create({
    data: { tenantId: tenant.id, name: 'Dufil Prima (Indomie)', slug: 'indomie' },
  });
  const brandCocaCola = await prisma.brand.create({
    data: { tenantId: tenant.id, name: 'Coca-Cola NBC', slug: 'coca-cola' },
  });
  const brandReckitt = await prisma.brand.create({
    data: { tenantId: tenant.id, name: 'Reckitt (Dettol)', slug: 'dettol' },
  });
  const brandNike = await prisma.brand.create({
    data: { tenantId: tenant.id, name: 'Nike Sportswear', slug: 'nike' },
  });
  console.log('✅ Created 6 Trademark Brands');

  // 9. Standard Single FMCG Products
  const singleProducts = [
    {
      sku: 'SKU-GM-1KG',
      barcode: '8901030382910',
      name: 'Golden Morn Cereal 1kg',
      slug: 'golden-morn-cereal-1kg',
      costPrice: 3800,
      price: 4500,
      quantity: 45,
      minimumQuantity: 10,
      unit: 'Pack',
      piecesPerPack: 1,
      isTaxExempt: false,
      categoryId: subPackaged.id,
      brandId: brandNestle.id,
      supplierId: supplierNestle.id,
      addedById: adminUser.id,
      tags: ['breakfast', 'cereal', 'nestle'],
      description: 'Nestle Golden Morn Maize & Soya Protein Cereal 1kg',
    },
    {
      sku: 'SKU-PEAK-150G',
      barcode: '6151100010101',
      name: 'Peak Evaporated Milk Tin 150g',
      slug: 'peak-evaporated-milk-150g',
      costPrice: 650,
      price: 800,
      quantity: 120,
      minimumQuantity: 24,
      unit: 'Tin',
      piecesPerPack: 1,
      isTaxExempt: true, // Zero-rated raw food / milk commodity under Nigerian VAT
      categoryId: subPackaged.id,
      brandId: brandFriesland.id,
      supplierId: supplierFriesland.id,
      addedById: adminUser.id,
      tags: ['dairy', 'milk', 'breakfast', 'tax-exempt'],
      description: 'Peak Full Cream Evaporated Milk 150g Tin - Zero Rated VAT',
    },
    {
      sku: 'SKU-INDO-CTN-40',
      barcode: '8992388112345',
      name: 'Indomie Super Pack 120g (Carton of 40)',
      slug: 'indomie-super-pack-carton',
      costPrice: 14000,
      price: 16000,
      quantity: 25,
      minimumQuantity: 5,
      unit: 'Carton',
      piecesPerPack: 40,
      isTaxExempt: false,
      categoryId: subPackaged.id,
      brandId: brandDufil.id,
      supplierId: supplierDangote.id,
      addedById: adminUser.id,
      tags: ['noodles', 'carton', 'wholesale'],
      description: 'Indomie Instant Noodles Super Pack Onion Chicken Flavour 40x120g Carton',
    },
    {
      sku: 'SKU-INDO-SGL-120',
      barcode: '8992388112346',
      name: 'Indomie Super Pack 120g (Single Piece)',
      slug: 'indomie-super-pack-single',
      costPrice: 350,
      price: 450,
      quantity: 180,
      minimumQuantity: 40,
      unit: 'Piece',
      piecesPerPack: 1,
      isTaxExempt: false,
      categoryId: subPackaged.id,
      brandId: brandDufil.id,
      supplierId: supplierDangote.id,
      addedById: adminUser.id,
      tags: ['noodles', 'single', 'retail'],
      description: 'Indomie Instant Noodles Super Pack Onion Chicken Flavour 120g Single',
    },
    {
      sku: 'SKU-COKE-50CL',
      barcode: '5449000000996',
      name: 'Coca-Cola Pet Bottle 50cl',
      slug: 'coca-cola-pet-50cl',
      costPrice: 320,
      price: 400,
      quantity: 96,
      minimumQuantity: 24,
      unit: 'Bottle',
      piecesPerPack: 1,
      isTaxExempt: false,
      categoryId: subSoftDrinks.id,
      brandId: brandCocaCola.id,
      supplierId: supplierCocaCola.id,
      addedById: adminUser.id,
      tags: ['drink', 'soda', 'coke'],
      description: 'Refreshing Coca-Cola Original Taste 50cl Pet Bottle',
    },
    {
      sku: 'SKU-EVA-75CL',
      barcode: '6151100020202',
      name: 'Eva Premium Table Water 75cl',
      slug: 'eva-table-water-75cl',
      costPrice: 200,
      price: 300,
      quantity: 150,
      minimumQuantity: 30,
      unit: 'Bottle',
      piecesPerPack: 1,
      isTaxExempt: true, // Basic potable water zero-rated
      categoryId: subSoftDrinks.id,
      brandId: brandCocaCola.id,
      supplierId: supplierCocaCola.id,
      addedById: adminUser.id,
      tags: ['water', 'hydration', 'drinks'],
      description: 'Eva Pure Drinking Table Water 75cl Bottle',
    },
    {
      sku: 'SKU-DETTOL-250ML',
      barcode: '5000158068995',
      name: 'Dettol Antiseptic Disinfectant Liquid 250ml',
      slug: 'dettol-antiseptic-liquid-250ml',
      costPrice: 2200,
      price: 2800,
      quantity: 35,
      minimumQuantity: 8,
      unit: 'Bottle',
      piecesPerPack: 1,
      isTaxExempt: false,
      categoryId: subHygiene.id,
      brandId: brandReckitt.id,
      supplierId: supplierNestle.id,
      addedById: adminUser.id,
      tags: ['antiseptic', 'hygiene', 'dettol'],
      description: 'Dettol Original Disinfectant Liquid 250ml',
    },
  ];

  for (const prod of singleProducts) {
    await prisma.product.create({
      data: {
        tenantId: tenant.id,
        sku: prod.sku,
        barcode: prod.barcode,
        name: prod.name,
        slug: prod.slug,
        costPrice: prod.costPrice,
        price: prod.price,
        quantity: prod.quantity,
        minimumQuantity: prod.minimumQuantity,
        unit: prod.unit,
        piecesPerPack: prod.piecesPerPack,
        isTaxExempt: prod.isTaxExempt,
        hasVariants: false,
        categoryId: prod.categoryId,
        brandId: prod.brandId,
        supplierId: prod.supplierId,
        addedById: prod.addedById,
        tags: prod.tags,
        description: prod.description,
        status: ProductStatusEnum.AVAILABLE,
      },
    });
  }
  console.log(`✅ Seeded ${singleProducts.length} standard FMCG products with Nigerian Naira (₦) pricing.`);

  // 10. Multi-Variant Matrix Products (e.g. Nike Air Force 1 with Sizes & Colors)
  const variantOptions = [
    { name: 'Size', values: ['41', '42', '43', '44'] },
    { name: 'Color', values: ['Triple White', 'Black/White'] },
  ];

  const nikeSneaker = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      sku: 'PRD-NK-AF1',
      barcode: '8909876543210',
      name: "Nike Air Force 1 '07 Sneakers",
      slug: 'nike-air-force-1-07-sneakers',
      costPrice: 45000,
      price: 65000,
      quantity: 48, // Sum of all 8 variant quantities (6 each)
      minimumQuantity: 10,
      unit: 'Pair',
      piecesPerPack: 1,
      isTaxExempt: false,
      hasVariants: true,
      options: variantOptions,
      categoryId: subSneakers.id,
      brandId: brandNike.id,
      supplierId: supplierDangote.id,
      addedById: adminUser.id,
      tags: ['sneakers', 'nike', 'airforce', 'fashion'],
      description: 'Classic Nike Air Force 1 Low streetwear leather sneakers with padded collar.',
      status: ProductStatusEnum.AVAILABLE,
      variants: {
        create: [
          {
            name: "Nike Air Force 1 - Size 41 / Triple White",
            sku: 'NK-AF1-WHT-41',
            barcode: '890111114101',
            costPrice: 45000,
            price: 65000,
            quantity: 6,
            minimumQuantity: 2,
            attributes: { Size: '41', Color: 'Triple White' },
          },
          {
            name: "Nike Air Force 1 - Size 42 / Triple White",
            sku: 'NK-AF1-WHT-42',
            barcode: '890111114201',
            costPrice: 45000,
            price: 65000,
            quantity: 8,
            minimumQuantity: 2,
            attributes: { Size: '42', Color: 'Triple White' },
          },
          {
            name: "Nike Air Force 1 - Size 43 / Triple White",
            sku: 'NK-AF1-WHT-43',
            barcode: '890111114301',
            costPrice: 45000,
            price: 68000, // Premium size pricing
            quantity: 6,
            minimumQuantity: 2,
            attributes: { Size: '43', Color: 'Triple White' },
          },
          {
            name: "Nike Air Force 1 - Size 44 / Triple White",
            sku: 'NK-AF1-WHT-44',
            barcode: '890111114401',
            costPrice: 45000,
            price: 68000,
            quantity: 4,
            minimumQuantity: 2,
            attributes: { Size: '44', Color: 'Triple White' },
          },
          {
            name: "Nike Air Force 1 - Size 41 / Black/White",
            sku: 'NK-AF1-BLK-41',
            barcode: '890111114102',
            costPrice: 45000,
            price: 65000,
            quantity: 6,
            minimumQuantity: 2,
            attributes: { Size: '41', Color: 'Black/White' },
          },
          {
            name: "Nike Air Force 1 - Size 42 / Black/White",
            sku: 'NK-AF1-BLK-42',
            barcode: '890111114202',
            costPrice: 45000,
            price: 65000,
            quantity: 8,
            minimumQuantity: 2,
            attributes: { Size: '42', Color: 'Black/White' },
          },
          {
            name: "Nike Air Force 1 - Size 43 / Black/White",
            sku: 'NK-AF1-BLK-43',
            barcode: '890111114302',
            costPrice: 45000,
            price: 68000,
            quantity: 6,
            minimumQuantity: 2,
            attributes: { Size: '43', Color: 'Black/White' },
          },
          {
            name: "Nike Air Force 1 - Size 44 / Black/White",
            sku: 'NK-AF1-BLK-44',
            barcode: '890111114402',
            costPrice: 45000,
            price: 68000,
            quantity: 4,
            minimumQuantity: 2,
            attributes: { Size: '44', Color: 'Black/White' },
          },
        ],
      },
    },
  });
  console.log(`✅ Seeded Matrix Variant Product: ${nikeSneaker.name} with 8 live variations.`);

  // 11. Discounts & Promo Campaigns
  await prisma.discount.createMany({
    data: [
      {
        tenantId: tenant.id,
        code: 'FLASH10',
        description: 'Storewide 10% Flash Discount',
        percentage: 10,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      },
      {
        tenantId: tenant.id,
        code: 'EASTER15',
        description: 'Easter Festive Promo 15% Off',
        percentage: 15,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-05-01'),
      },
      {
        tenantId: tenant.id,
        code: 'VIP20',
        description: 'VIP Executive Loyalty 20% Rebate',
        percentage: 20,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      },
    ],
  });
  console.log('✅ Seeded 3 Active Promotional Discounts');

  // 12. Customers (Loyal Customer with Credit & Phone lookup)
  const customer1 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Chief Emeka Okoye',
      phoneNumber: '08035551234',
      email: 'emeka.okoye@gmail.com',
      address: 'Plot 4, Old GRA, Port Harcourt',
      storeCreditBalance: 1500, // ₦1,500 stored balance
      totalDebt: 0,
      debtLimit: 50000,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Dr. (Mrs) Nnenna George',
      phoneNumber: '08023334567',
      email: 'nnenna.george@unport.edu.ng',
      address: 'Choba, Port Harcourt',
      storeCreditBalance: 0,
      totalDebt: 5000, // ₦5,000 receivables ledger balance
      debtLimit: 100000,
    },
  });
  console.log(`✅ Seeded Customers: ${customer1.name} (${customer1.phoneNumber}), ${customer2.name}`);

  console.log('\n🎉 StockSnap POS Nigerian Retail Database Seeding completed successfully!');
  console.log('-------------------------------------------------------------------------');
  console.log('Tenant: StockSnap Supermarket Ltd (Port Harcourt, Rivers State)');
  console.log('Login Credentials:');
  console.log('  👑 Admin:     admin@stocksnap.ng     | Password: Password123! | PIN: 1234');
  console.log('  👔 Manager:   manager@stocksnap.ng   | Password: Password123! | PIN: 9999');
  console.log('  🛒 Cashier:   cashier@stocksnap.ng   | Password: Password123! | PIN: 0000');
  console.log('  📦 Inventory: inventory@stocksnap.ng | Password: Password123! | PIN: 5555');
  console.log('  💼 Accounts:  accounts@stocksnap.ng  | Password: Password123! | PIN: 7777');
  console.log('-------------------------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
