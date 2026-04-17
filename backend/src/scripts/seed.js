const { prisma } = require('../config/prisma');
const bcryptjs = require('bcryptjs');

const sampleData = {
  user: {
    name: 'Demo Student',
    email: 'demo@livo.app',
    password: 'Demo123!@#',
  },
  splitBills: [
    {
      title: 'Pizza Night',
      description: 'Friday night hangout at Pizza Hut',
      totalAmount: 180000,
      members: [
        { friendName: 'Bagas', amount: 60000 },
        { friendName: 'Siska', amount: 60000 },
        { friendName: 'Dini', amount: 60000 },
      ],
    },
    {
      title: 'Cafe Study Session',
      description: 'Coffee and snacks during exam prep',
      totalAmount: 145000,
      members: [
        { friendName: 'Rudi', amount: 72500 },
        { friendName: 'Maya', amount: 72500 },
      ],
    },
    {
      title: 'Transportation Home',
      description: 'Grab to airport after semester',
      totalAmount: 250000,
      members: [
        { friendName: 'Ahmad', amount: 125000 },
        { friendName: 'Lina', amount: 125000 },
      ],
    },
    {
      title: 'Grocery Shopping',
      description: 'Weekly groceries for dorm',
      totalAmount: 320000,
      members: [
        { friendName: 'Rina', amount: 80000 },
        { friendName: 'Tina', amount: 80000 },
        { friendName: 'Fina', amount: 80000 },
        { friendName: 'Nina', amount: 80000 },
      ],
    },
    {
      title: 'Movie Night',
      description: 'Cinema with friends',
      totalAmount: 100000,
      members: [
        { friendName: 'Joko', amount: 50000 },
        { friendName: 'Siti', amount: 50000 },
      ],
    },
    {
      title: 'Restaurant Lunch',
      description: 'Team lunch celebration',
      totalAmount: 420000,
      members: [
        { friendName: 'Budi', amount: 105000 },
        { friendName: 'Ari', amount: 105000 },
        { friendName: 'Toni', amount: 105000 },
        { friendName: 'Edo', amount: 105000 },
      ],
    },
  ],
};

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sampleData.user.email },
    });

    if (existingUser) {
      console.log(`✅ User ${sampleData.user.email} already exists. Skipping seed.`);
      return;
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(sampleData.user.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: sampleData.user.name,
        email: sampleData.user.email,
        password: hashedPassword,
      },
    });

    console.log(`✅ Created user: ${user.email}`);

    // Create split bills with members
    let billsCreated = 0;
    for (const bill of sampleData.splitBills) {
      const splitBill = await prisma.splitBill.create({
        data: {
          userId: user.id,
          title: bill.title,
          description: bill.description,
          totalAmount: bill.totalAmount,
          status: 'UNPAID',
          members: {
            create: bill.members.map((member, index) => ({
              friendName: member.friendName,
              amount: member.amount,
              status: index % 2 === 0 ? 'PAID' : 'UNPAID',
            })),
          },
        },
        include: { members: true },
      });
      billsCreated++;
      console.log(`✅ Created split bill: ${splitBill.title} with ${splitBill.members.length} members`);
    }

    console.log(`\n🎉 Seed completed successfully!`);
    console.log(`📊 Created 1 user and ${billsCreated} split bills`);
    console.log(`\n📝 Demo Credentials:`);
    console.log(`   Email: ${sampleData.user.email}`);
    console.log(`   Password: ${sampleData.user.password}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
