const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 EViENT - Clean Seed Script\n');
    console.log('⚠️  This will DELETE ALL existing data and create only admin account.\n');

    // Clean ALL existing data
    console.log('🧹 Cleaning existing data...');

    // Delete in order of dependencies
    await prisma.notification.deleteMany();
    console.log('   ✓ Notifications deleted');

    await prisma.ticket.deleteMany();
    console.log('   ✓ Tickets deleted');

    await prisma.order.deleteMany();
    console.log('   ✓ Orders deleted');

    await prisma.ticketType.deleteMany();
    console.log('   ✓ Ticket Types deleted');

    await prisma.banner.deleteMany();
    console.log('   ✓ Banners deleted');

    await prisma.seat.deleteMany();
    console.log('   ✓ Seats deleted');

    await prisma.room.deleteMany();
    console.log('   ✓ Rooms deleted');

    await prisma.event.deleteMany();
    console.log('   ✓ Events deleted');

    await prisma.user.deleteMany();
    console.log('   ✓ Users deleted');

    console.log('\n✅ All data cleaned!\n');

    // Create admin account
    console.log('👤 Creating admin account...');

    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);

    const admin = await prisma.user.create({
        data: {
            email: 'admin@evient.com',
            passwordHash: adminPassword,
            fullName: 'Admin EViENT',
            role: 'admin',
            isActive: true,
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        }
    });

    console.log(`   ✅ Admin created: ${admin.email}\n`);

    console.log('═══════════════════════════════════════════');
    console.log('✨ Seed completed successfully!');
    console.log('═══════════════════════════════════════════');
    console.log(`
🔐 Admin Login Credentials:
   Email:    admin@evient.com
   Password: admin123

📌 Next Steps:
   1. Start the backend: npm run dev
   2. Start the frontend: npm run dev (in frontend-react folder)
   3. Login as admin and create events, banners, etc.
    `);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
