"use strict";
/*

import prisma from "../lib/prisma";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

async function main() {


  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.review.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();

  await prisma.product.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();

  await prisma.brand.deleteMany();
  await prisma.material.deleteMany();
  await prisma.origin.deleteMany();
  await prisma.color.deleteMany();
  await prisma.size.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();

  // --- Seed Categories and Subcategories ---
  const categories = await prisma.category.createMany({
    data: [
      { name: "Clothing" },
      { name: "Footwear" },
      { name: "Accessories" },
      { name: "Nursery & Bedding" },
      { name: "Feeding & Nursing" },
      { name: "Diapering" },
      { name: "Gear & Travel" },
      { name: "Toys & Learning" },
      { name: "Bath & Hygiene" },
      { name: "Health & Safety" },
      { name: "Home & Decor" },
    ],
  });

  const allCategories = await prisma.category.findMany();

  const subCategoryMap: Record<string, string[]> = {
    Clothing: ["Bodysuits", "Rompers", "Sleepwear", "Jackets", "Dresses", "Sets"],
    Footwear: ["Booties", "Sandals", "Sneakers", "Formal Shoes"],
    Accessories: ["Hats", "Socks", "Mittens", "Hair Accessories"],
    "Nursery & Bedding": ["Crib Sheets", "Blankets", "Mattress Pads"],
    "Feeding & Nursing": ["Bottles", "Breast Pumps", "High Chairs"],
    Diapering: ["Diapers", "Wipes", "Changing Pads"],
    "Gear & Travel": ["Strollers", "Car Seats", "Baby Carriers"],
    "Toys & Learning": ["Soft Toys", "Learning Boards", "Books"],
    "Bath & Hygiene": ["Bath Tubs", "Towels", "Grooming Kits"],
    "Health & Safety": ["Thermometers", "Monitors", "First Aid"],
    "Home & Decor": ["Wall Art", "Mobiles", "Night Lights"],
  };

  for (const cat of allCategories) {
    const subNames = subCategoryMap[cat.name] || [];
    for (const sub of subNames) {
      await prisma.subCategory.create({
        data: {
          name: sub,
          categoryId: cat.id,
        },
      });
    }
  }

  // --- Seed Other Related Models ---
  const [brands, materials, origins, colors, sizes, tags] = await Promise.all([
    prisma.brand.createMany({ data: ["Zara", "Nike", "Adidas", "Uniqlo", "H&M"].map(name => ({ name })) }),
    prisma.material.createMany({ data: ["Cotton", "Linen", "Polyester", "Silk", "Denim"].map(name => ({ name })) }),
    prisma.origin.createMany({ data: ["Ghana", "China", "Turkey", "Italy", "USA"].map(name => ({ name })) }),
    prisma.color.createMany({ data: ["Blue", "Pink", "White", "Green", "Yellow"].map(name => ({ name })) }),
    prisma.size.createMany({ data: ["Newborn", "0-3M", "3-6M", "6-12M", "1-2Y"].map(name => ({ name })) }),
    prisma.tag.createMany({ data: ["Eco-Friendly", "Organic", "Bestseller", "Premium", "Budget"].map(name => ({ name })) }),
  ]);

  const [brand, material, origin, xcolors, xsizes, xtags] = await Promise.all([
    prisma.brand.findFirst(),
    prisma.material.findFirst(),
    prisma.origin.findFirst(),
    prisma.color.findMany(),
    prisma.size.findMany(),
    prisma.tag.findMany(),
  ]);
  




  
  const password = await bcrypt.hash("rash4short123", 10);

  // Create Vendor User
  const vendorUser = await prisma.user.create({
    data: {
      name: "Rash4Short",
      email: "rash4short@gmail.com",
      passwordHash: password,
      phone: "+233 546715186",
      role: "vendor",
    },
  });


  // --- Seed Vendor ---
  const vendor = await prisma.vendor.create({
    data: {
      userId:vendorUser.id,
      shopName: "Rash4Short",
      shopPhone: "1234567890",
      shopLocation: "BabyWorld",
      shopEmail: "contact@rash4short.com",
      shopAddress: "123 Baby St.",
    },
  });

  // --- Seed Products ---
  const allSubCategories = await prisma.subCategory.findMany();
  const allCategoriesFresh = await prisma.category.findMany();

  for (let i = 1; i <= 60; i++) {
    const randomCat = faker.helpers.arrayElement(allCategoriesFresh);
    const subCats = await prisma.subCategory.findMany({ where: { categoryId: randomCat.id } });
    const subCat = faker.helpers.arrayElement(subCats);
    const tag = faker.helpers.arrayElement(xtags)

    const product = await prisma.product.create({
      data: {
        name: `Baby ${subCat.name} ${i}`,
        slug: `baby-${subCat.name.toLowerCase().replace(/\s+/g, "-")}-${i}`,
        description: `This is a high-quality ${subCat.name} for babies.`,
        longDescription: `Our ${subCat.name} ${i} is designed with comfort and safety in mind. Ideal for babies under 7 years.`,
        price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
        stock: Math.floor(Math.random() * 50) + 10,
        vendorId: vendor.id,
        categoryId: randomCat.id,
        subCategoryId: subCat.id,
        brandId: brand?.id!,
        materialId: material?.id!,
        originId: origin?.id!,
        tag: tag.name,
      },
    });

    // Create a few variants for this product with different colors and sizes
    const variantsToCreate = [];
    for (let j = 0; j < 3; j++) { // example 3 variants each product
      const color = faker.helpers.arrayElement(xcolors);
      const size = faker.helpers.arrayElement(xsizes);;

      //   price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
      //   stock: Math.floor(Math.random() * 50) + 10,
      variantsToCreate.push({
        productId: product.id,
        color: color.name,
        size: size.name,
        SKU: `SKU-${product.id}-${j}-${faker.number.int(9999)}`,
        stock: faker.number.int({ min: 10, max: 100 }),
        price: parseFloat((faker.number.float({ min: 10, max: 100, fractionDigits: 2 })).toFixed(2)),
      });
    }
    await prisma.productVariant.createMany({ data: variantsToCreate });

    //save images for each variant
    const newvariantsToCreate = await prisma.productVariant.findMany({
      where: {productId: product.id}
    })
    for (const variant of newvariantsToCreate) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          productVariantId: variant.id,  // relate image to the variant
          url: `http://localhost:5173/src/images/rash/img${i}.jpg`,
          alt: `Image for variant ${variant.SKU}`,
        },
      });
    }

 
  }

  console.log("✅ Seeding completed.");
}

main()
  .catch(e => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






  async function clearDatabase() {
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.review.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();

  await prisma.product.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();

  await prisma.brand.deleteMany();
  await prisma.material.deleteMany();
  await prisma.origin.deleteMany();
  await prisma.color.deleteMany();
  await prisma.size.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();
}
















































/*

import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";


async function main() {

  prisma.brand.deleteMany();
  prisma.material.deleteMany();
  prisma.origin.deleteMany();
  prisma.color.deleteMany();
  prisma.size.deleteMany();
  prisma.tag.deleteMany();

  prisma.productImage.deleteMany();
  prisma.product.deleteMany();
  prisma.subCategory.deleteMany();
  prisma.category.deleteMany();
  prisma.vendor.deleteMany();
  prisma.user.deleteMany();



  const password = await bcrypt.hash("rash4short123", 10);

  // Create Vendor User
  const vendorUser = await prisma.user.create({
    data: {
      name: "RASH4SHORT",
      email: "rash4short@gmail.com",
      passwordHash: password,
      phone: "+233 546715186",
      role: "vendor",
    },
  });

  // Create Vendor Profile
  const vendor = await prisma.vendor.create({
    data: {
      userId: vendorUser.id,
      shopName: "RASH FOR SHORT",
      shopAddress: "Gumani Street, Tamale",
    },
  });

  // Create Category and SubCategory
 // Step 1: Create categories
await prisma.category.createMany({
  data: [
    { name: "Clothing" },
    { name: "Footwear" },
    { name: "Accessories" },
    { name: "Nursery & Bedding" },
    { name: "Feeding & Nursing" },
    { name: "Diapering" },
    { name: "Gear & Travel" },
    { name: "Toys & Learning" },
    { name: "Bath & Hygiene" },
    { name: "Health & Safety" },
    { name: "Home & Decor" },
  ],
  skipDuplicates: true,
});

// Step 2: Fetch created categories
const categories = await prisma.category.findMany();
const categoryMap: Record<string, number> = {};
categories.forEach((c) => (categoryMap[c.name] = c.id));
// Step 3: Create subcategories mapped to each category


const subCategoryData = [
  // Clothing
  { name: "Baby Rompers", categoryId: categories.find(c => c.name === "Clothing")?.id },
  { name: "Bodysuits & Onesies", categoryId: categories.find(c => c.name === "Clothing")?.id },
  { name: "Baby Dresses", categoryId: categories.find(c => c.name === "Clothing")?.id },
  { name: "T-Shirts & Tops", categoryId: categories.find(c => c.name === "Clothing")?.id },
  { name: "Pants & Leggings", categoryId: categories.find(c => c.name === "Clothing")?.id },
  { name: "Hoodies & Jackets", categoryId: categories.find(c => c.name === "Clothing")?.id },
  { name: "Pajamas & Sleepwear", categoryId: categories.find(c => c.name === "Clothing")?.id },
  { name: "Baby Swimwear", categoryId: categories.find(c => c.name === "Clothing")?.id },
  { name: "Socks & Mittens", categoryId: categories.find(c => c.name === "Clothing")?.id },
  { name: "Baby Costumes", categoryId: categories.find(c => c.name === "Clothing")?.id },

  // Footwear
  { name: "Baby Shoes", categoryId: categories.find(c => c.name === "Footwear")?.id },
  { name: "Toddler Sneakers", categoryId: categories.find(c => c.name === "Footwear")?.id },
  { name: "First Walkers", categoryId: categories.find(c => c.name === "Footwear")?.id },
  { name: "Sandals", categoryId: categories.find(c => c.name === "Footwear")?.id },
  { name: "Winter Boots", categoryId: categories.find(c => c.name === "Footwear")?.id },
  { name: "Grip Socks", categoryId: categories.find(c => c.name === "Footwear")?.id },

  // Accessories
  { name: "Baby Hats & Caps", categoryId: categories.find(c => c.name === "Accessories")?.id },
  { name: "Headbands & Hair Clips", categoryId: categories.find(c => c.name === "Accessories")?.id },
  { name: "Bibs & Burp Cloths", categoryId: categories.find(c => c.name === "Accessories")?.id },
  { name: "Gloves & Mittens", categoryId: categories.find(c => c.name === "Accessories")?.id },
  { name: "Sunglasses for Kids", categoryId: categories.find(c => c.name === "Accessories")?.id },
  { name: "Scarves", categoryId: categories.find(c => c.name === "Accessories")?.id },

  // Nursery & Bedding
  { name: "Baby Blankets", categoryId: categories.find(c => c.name === "Nursery & Bedding")?.id },
  { name: "Baby Pillows", categoryId: categories.find(c => c.name === "Nursery & Bedding")?.id },
  { name: "Crib Bedding Sets", categoryId: categories.find(c => c.name === "Nursery & Bedding")?.id },
  { name: "Mattress Protectors", categoryId: categories.find(c => c.name === "Nursery & Bedding")?.id },
  { name: "Mosquito Nets", categoryId: categories.find(c => c.name === "Nursery & Bedding")?.id },

  // Feeding & Nursing
  { name: "Baby Bottles", categoryId: categories.find(c => c.name === "Feeding & Nursing")?.id },
  { name: "Sippy Cups", categoryId: categories.find(c => c.name === "Feeding & Nursing")?.id },
  { name: "Bottle Warmers", categoryId: categories.find(c => c.name === "Feeding & Nursing")?.id },
  { name: "Breast Pumps", categoryId: categories.find(c => c.name === "Feeding & Nursing")?.id },
  { name: "Milk Storage Bags", categoryId: categories.find(c => c.name === "Feeding & Nursing")?.id },
  { name: "High Chairs", categoryId: categories.find(c => c.name === "Feeding & Nursing")?.id },

  // Diapering
  { name: "Disposable Diapers", categoryId: categories.find(c => c.name === "Diapering")?.id },
  { name: "Cloth Diapers", categoryId: categories.find(c => c.name === "Diapering")?.id },
  { name: "Diaper Bags", categoryId: categories.find(c => c.name === "Diapering")?.id },
  { name: "Changing Pads", categoryId: categories.find(c => c.name === "Diapering")?.id },
  { name: "Wipes & Warmers", categoryId: categories.find(c => c.name === "Diapering")?.id },

  // Gear & Travel
  { name: "Baby Carriers & Slings", categoryId: categories.find(c => c.name === "Gear & Travel")?.id },
  { name: "Baby Strollers", categoryId: categories.find(c => c.name === "Gear & Travel")?.id },
  { name: "Car Seats", categoryId: categories.find(c => c.name === "Gear & Travel")?.id },
  { name: "Travel Cribs", categoryId: categories.find(c => c.name === "Gear & Travel")?.id },
  { name: "Baby Swings", categoryId: categories.find(c => c.name === "Gear & Travel")?.id },

  // Toys & Learning
  { name: "Plush Toys", categoryId: categories.find(c => c.name === "Toys & Learning")?.id },
  { name: "Teething Toys", categoryId: categories.find(c => c.name === "Toys & Learning")?.id },
  { name: "Musical Toys", categoryId: categories.find(c => c.name === "Toys & Learning")?.id },
  { name: "Activity Gyms", categoryId: categories.find(c => c.name === "Toys & Learning")?.id },
  { name: "Educational Toys", categoryId: categories.find(c => c.name === "Toys & Learning")?.id },
  { name: "Stackers & Blocks", categoryId: categories.find(c => c.name === "Toys & Learning")?.id },

  // Bath & Hygiene
  { name: "Baby Bathtubs", categoryId: categories.find(c => c.name === "Bath & Hygiene")?.id },
  { name: "Towels & Washcloths", categoryId: categories.find(c => c.name === "Bath & Hygiene")?.id },
  { name: "Bath Toys", categoryId: categories.find(c => c.name === "Bath & Hygiene")?.id },
  { name: "Baby Shampoo & Wash", categoryId: categories.find(c => c.name === "Bath & Hygiene")?.id },
  { name: "Grooming Kits", categoryId: categories.find(c => c.name === "Bath & Hygiene")?.id },

  // Health & Safety
  { name: "Thermometers", categoryId: categories.find(c => c.name === "Health & Safety")?.id },
  { name: "Baby Monitors", categoryId: categories.find(c => c.name === "Health & Safety")?.id },
  { name: "Corner Protectors", categoryId: categories.find(c => c.name === "Health & Safety")?.id },
  { name: "Safety Locks", categoryId: categories.find(c => c.name === "Health & Safety")?.id },
  { name: "Pacifiers & Clips", categoryId: categories.find(c => c.name === "Health & Safety")?.id },

  // Home & Decor
  { name: "Wall Decals", categoryId: categories.find(c => c.name === "Home & Decor")?.id },
  { name: "Growth Charts", categoryId: categories.find(c => c.name === "Home & Decor")?.id },
  { name: "Night Lights", categoryId: categories.find(c => c.name === "Home & Decor")?.id },
  { name: "Kids Furniture", categoryId: categories.find(c => c.name === "Home & Decor")?.id },
];
const  rawSubCategories = subCategoryData
  .map((item) => ({
    name: item.name,
    categoryId: categoryMap[item.name],
  }))
  .filter((item) => item.categoryId !== undefined); // ✅ Remove items with missing categoryId

// Step 4: Seed all subcategories
   
  await prisma.subCategory.createMany({
    data: rawSubCategories,
    skipDuplicates: true,
  });

 
  const brands = await prisma.brand.createMany({
    data: [
      { name: "Zara"},
      { name: "Nike"},
      { name: "Adidas"},
      { name: "Uniqlo"},
      { name: "Uniqlo"},
      { name: "M"}],
  });
 
  const materials = await prisma.material.createMany({
    data: [
      { name: "Cotton"},
      { name: "Linen"},
      { name: "Polyester"},
      { name: "Silk"},
      { name: "Denim"}],
  });
 
  const origins = await prisma.origin.createMany({
    data: [
      { name: "China"},
      { name: "Ghana"},
      { name: "India"},
      { name: "Iran"},
      { name: "Italy"},
      { name: "Russia"},
      { name: "Turkey"},
      { name: "USA"}],
  });

  const colors = await prisma.color.createMany({
    data: [
      { name: "Black"},
      { name: "Blue"},
      { name: "Green"},
      { name: "Indigo"},
      { name: "Red"},
      { name: "White"},
      { name: "Yello"}],
  });
  const sizes = await prisma.size.createMany({
    data: [
      { name: "S"},
      { name: "M"},
      { name: "XL"},
      { name: "XXL"}],
  });
  const tags = await prisma.tag.createMany({
    data: [
      { name: "cotton"},
      { name: "eco-friendly"},
      { name: "soft"}],
  });
 



 


  const xcategories = await prisma.category.findMany();
  const xsubCategories = await prisma.subCategory.findMany();

    const xvendors = await prisma.vendor.findMany();
    const xbrands = await prisma.brand.findMany();
    const xmaterials = await prisma.material.findMany();
    const xorigins = await prisma.origin.findMany();
    const xcolors = await prisma.color.findMany();
    const xsizes = await prisma.size.findMany();
    const xtags  = await prisma.tag.findMany();


 


  const products = [
    { name: "Soft Cotton Baby Romper", category: "Clothing", subCategory: "Bodysuits & Rompers" },
    { name: "Organic Baby T-Shirt", category: "Clothing", subCategory: "T-Shirts & Tops" },
    { name: "Newborn Pajama Set", category: "Clothing", subCategory: "Pajamas & Sleepwear" },
    { name: "Infant Cotton Leggings", category: "Clothing", subCategory: "Pants & Leggings" },
    { name: "First Walker Soft Sole Shoes", category: "Footwear", subCategory: "Baby Shoes" },
    { name: "Baby Summer Sandals", category: "Footwear", subCategory: "Sandals" },
    { name: "Sun Hat with Chin Strap", category: "Accessories", subCategory: "Hats & Caps" },
    { name: "Anti-Scratch Mittens", category: "Accessories", subCategory: "Socks & Mittens" },
    { name: "Foldable Baby Crib", category: "Nursery & Bedding", subCategory: "Cribs & Bassinets" },
    { name: "4-Piece Crib Bedding Set", category: "Nursery & Bedding", subCategory: "Bedding Sets" },
    { name: "Waterproof Baby Bibs", category: "Feeding & Nursing", subCategory: "Bibs & Burp Cloths" },
    { name: "Anti-Colic Feeding Bottle", category: "Feeding & Nursing", subCategory: "Bottles & Nipples" },
    { name: "Hypoallergenic Disposable Diapers", category: "Diapering", subCategory: "Diapers" },
    { name: "Portable Diaper Changing Pad", category: "Diapering", subCategory: "Changing Mats" },
    { name: "Lightweight Baby Stroller", category: "Gear & Travel", subCategory: "Strollers" },
    { name: "Rear-Facing Infant Car Seat", category: "Gear & Travel", subCategory: "Car Seats" },
    { name: "Color Sorting Toy Set", category: "Toys & Learning", subCategory: "Educational Toys" },
    { name: "Plush Teddy Bear for Babies", category: "Toys & Learning", subCategory: "Soft Toys" },
    { name: "Hooded Baby Towel", category: "Bath & Hygiene", subCategory: "Towels & Washcloths" },
    { name: "Baby Monitor with Night Vision", category: "Health & Safety", subCategory: "Monitors" },
  ];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    const categoryId = Number(xcategories.find(c => c.name === product.category)?.id) ;
    const subCategoryId = Number(xsubCategories.find(s => s.name === product.subCategory)?.id);
    const brandId = Number(xbrands.find(s => s.name === product.subCategory)?.id);
    const materialId = Number(xmaterials.find(s => s.name === product.subCategory)?.id);
    const originId = Number(xorigins.find(s => s.name === product.subCategory)?.id);
    const colorId = Number(xcolors.find(s => s.name === product.subCategory)?.id);
    const sizeId = Number(xsizes.find(s => s.name === product.subCategory)?.id);
    const tagId = Number(xtags.find(s => s.name === product.subCategory)?.id);

 


/*

   if (!categories || !xsubCategories) {
    console.warn(`Skipping product ${product.name} due to missing data`);
    continue;
  }

    const createdProduct = await prisma.product.create({
      data: {
        name: product.name,
        slug: product.name.toLowerCase().replace(/\s+/g, "-"),
        description: `This is a great item: ${product.name}.`,
        longDescription: `${product.name} is designed for comfort, style, and durability. Ideal for all seasons.`,
        SKU: `SKU-${1000 + i}`,
        price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
        stock: Math.floor(Math.random() * 50) + 10,
        vendorId: xvendors[0].id,
        categoryId,
        subCategoryId,
        brandId,
        materialId,
        originId,
        colorId,
        sizeId,
        tagId,
      },
    });

    await prisma.productImage.create({
      data: {
        productId: createdProduct.id,
        url: `https://cdn.pixabay.com/photo/2017/10/02/19/47/kid-2819325_1280.jpg`,
      },
    });
  }
 






  console.log("Seeded 20 products with vendor and category.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
 */ 
