const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// Helper to generate slug from title
const slugify = (text) => {
    return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
};

async function main() {
    console.log('🌱 Starting seed...\n');

    // Clean existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.notification.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.order.deleteMany();
    await prisma.ticketType.deleteMany();
    await prisma.banner.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    // ==================== USERS ====================
    console.log('👥 Creating users...');

    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const userPassword = await bcrypt.hash('user123', salt);

    const admin = await prisma.user.create({
        data: {
            email: 'admin@evient.com',
            passwordHash: adminPassword,
            fullName: 'Admin User',
            role: 'admin',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        }
    });
    console.log(`  ✅ Admin: ${admin.email}`);

    const users = [];
    const userNames = [
        'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E',
        'Ngô Thị F', 'Đặng Văn G', 'Bùi Thị H', 'Đỗ Văn I', 'Vũ Thị K'
    ];

    for (let i = 0; i < 10; i++) {
        const user = await prisma.user.create({
            data: {
                email: `user${i + 1}@example.com`,
                passwordHash: userPassword,
                fullName: userNames[i],
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i + 1}`,
            }
        });
        users.push(user);
    }
    console.log(`  ✅ Created ${users.length} regular users`);

    // ==================== EVENTS ====================
    console.log('🎉 Creating events...');

    const now = new Date();
    const eventData = [
        {
            title: 'Đêm Nhạc Trịnh - Acoustic Night',
            description: 'Đêm nhạc acoustic với những ca khúc bất hủ của nhạc sĩ Trịnh Công Sơn',
            category: 'Music',
            location: 'Nhà hát Thành phố HCM',
            startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            status: 'completed',
            isHot: false,
            bannerImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200',
        },
        {
            title: 'Vietnam Tech Conference 2026',
            description: 'Hội nghị công nghệ lớn nhất Việt Nam với các diễn giả hàng đầu',
            category: 'Tech',
            location: 'Trung tâm Hội nghị Quốc gia',
            startTime: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
            status: 'completed',
            isHot: false,
            bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
        },
        {
            title: 'Lễ hội Ẩm thực Sài Gòn 2026',
            description: 'Khám phá hương vị đặc trưng của ẩm thực Sài Gòn',
            category: 'Food',
            location: 'Phố đi bộ Nguyễn Huệ',
            startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            status: 'published',
            isHot: true,
            bannerImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200',
        },
        {
            title: 'Concert Sơn Tùng M-TP - Sky Tour 2026',
            description: 'Đêm nhạc hoành tráng của Sơn Tùng M-TP',
            category: 'Music',
            location: 'Sân vận động Mỹ Đình',
            startTime: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
            status: 'published',
            isHot: true,
            bannerImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200',
        },
        {
            title: 'Hội chợ Startup Việt Nam',
            description: 'Kết nối startup với các nhà đầu tư tiềm năng',
            category: 'Business',
            location: 'Gem Center, Quận 1',
            startTime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            status: 'published',
            isHot: true,
            bannerImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200',
        },
    ];

    const events = [];
    for (const data of eventData) {
        const event = await prisma.event.create({
            data: {
                title: data.title,
                slug: slugify(data.title) + '-' + Date.now(),
                description: data.description,
                content: `<h2>Giới thiệu</h2><p>${data.description}</p><h2>Chi tiết sự kiện</h2><p>Thông tin chi tiết về sự kiện sẽ được cập nhật.</p>`,
                category: data.category,
                location: data.location,
                startTime: data.startTime,
                endTime: new Date(data.startTime.getTime() + 4 * 60 * 60 * 1000), // +4 hours
                status: data.status,
                isHot: data.isHot,
                bannerImage: data.bannerImage,
                thumbnailImage: data.bannerImage,
            }
        });
        events.push(event);
        console.log(`  ✅ Event: ${event.title}`);
    }

    // ==================== TICKET TYPES ====================
    console.log('🎫 Creating ticket types...');

    for (const event of events) {
        await prisma.ticketType.createMany({
            data: [
                {
                    eventId: event.id,
                    name: 'Standard',
                    description: 'Vé phổ thông',
                    price: 200000,
                    quantityTotal: 500,
                    quantitySold: event.status === 'completed' ? 450 : 50,
                    status: 'active',
                },
                {
                    eventId: event.id,
                    name: 'VIP',
                    description: 'Vé VIP với ghế ngồi ưu tiên',
                    price: 500000,
                    originalPrice: 600000,
                    quantityTotal: 100,
                    quantitySold: event.status === 'completed' ? 95 : 20,
                    status: 'active',
                },
            ]
        });
    }
    console.log(`  ✅ Created ticket types for all events`);

    // ==================== BANNERS ====================
    console.log('🖼️ Creating banners...');

    const hotEvents = events.filter(e => e.isHot);
    for (let i = 0; i < hotEvents.length; i++) {
        await prisma.banner.create({
            data: {
                title: hotEvents[i].title,
                imageUrl: hotEvents[i].bannerImage,
                linkUrl: `/events/${hotEvents[i].id}`,
                eventId: hotEvents[i].id,
                priority: i + 1,
                isActive: true,
            }
        });
    }
    console.log(`  ✅ Created ${hotEvents.length} banners`);

    // ==================== ORDERS & TICKETS ====================
    console.log('🛒 Creating sample orders and tickets...');

    const completedEvents = events.filter(e => e.status === 'completed');
    let ticketCount = 0;

    for (const event of completedEvents) {
        const ticketTypes = await prisma.ticketType.findMany({
            where: { eventId: event.id }
        });

        // Create orders for random users
        for (let i = 0; i < 5; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const randomTicketType = ticketTypes[Math.floor(Math.random() * ticketTypes.length)];
            const quantity = Math.floor(Math.random() * 2) + 1;

            const order = await prisma.order.create({
                data: {
                    userId: randomUser.id,
                    totalAmount: Number(randomTicketType.price) * quantity,
                    status: 'paid',
                    paymentMethod: 'credit_card',
                    paymentTransactionId: uuidv4(),
                }
            });

            // Create tickets
            for (let j = 0; j < quantity; j++) {
                await prisma.ticket.create({
                    data: {
                        orderId: order.id,
                        ticketTypeId: randomTicketType.id,
                        userId: randomUser.id,
                        eventId: event.id,
                        ticketCode: uuidv4(),
                        status: Math.random() > 0.3 ? 'used' : 'valid',
                        usedAt: Math.random() > 0.3 ? event.startTime : null,
                        priceAtPurchase: randomTicketType.price,
                    }
                });
                ticketCount++;
            }
        }
    }
    console.log(`  ✅ Created ${ticketCount} tickets`);

    console.log('\n✨ Seed completed successfully!');
    console.log(`
📊 Summary:
   - Users: ${users.length + 1} (1 admin + ${users.length} regular)
   - Events: ${events.length}
   - Banners: ${hotEvents.length}
   - Tickets: ${ticketCount}
   
🔐 Login credentials:
   Admin: admin@evient.com / admin123
   User:  user1@example.com / user123
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
