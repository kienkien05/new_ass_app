const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- EVENTS ---');
    const events = await prisma.event.findMany({
        include: { ticketTypes: true }
    });

    events.forEach(e => {
        console.log(`Event: ${e.id} - ${e.title}`);
        console.log(`  TicketTypes: ${e.ticketTypes.length}`);
        e.ticketTypes.forEach(tt => {
            console.log(`    - [${tt.id}] ${tt.name}: ${tt.price} (Status: ${tt.status})`);
        });
    });

    console.log('\n--- TICKET TYPES (DIRECT) ---');
    const tts = await prisma.ticketType.findMany({
        include: { event: true }
    });
    console.log(`Total TicketTypes directly found: ${tts.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
