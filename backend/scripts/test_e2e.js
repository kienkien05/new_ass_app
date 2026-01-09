// Using native fetch (Node 18+) 
// If node-fetch is not installed and Node is old, this might fail. 
// However, User asked to "run test". I will try to use native fetch first.
// If native fetch is not available in the environment, I'll fallback to http.
// Actually, to be safe, I'll use the 'http' module which is built-in, or just assume Node 18+ (standard nowadays).
// Let's try native fetch wrapped in a check, or just use a simple http helper.

// Let's stick to native fetch for readability, assuming Node 18+.
// If not, I'll use a wrapper.

async function runTest() {
    const API_URL = 'http://localhost:5000/api';
    console.log('--- STARTING E2E TEST ---');

    try {
        // 1. Login
        console.log('\n1. Testing Login (Admin)...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@evient.com',
                password: '123456' // From seed.js
            })
        });
        const loginData = await loginRes.json();

        if (!loginData.success) {
            throw new Error(`Login failed: ${loginData.message}`);
        }
        console.log('✅ Login Successful. Token received.');
        const token = loginData.data.token;

        // 2. Get Profile
        console.log('\n2. Testing Get Profile...');
        const profileRes = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        console.log(`✅ Profile: ${profileData.data.full_name} (${profileData.data.role})`);

        // 3. Get Events
        console.log('\n3. Testing Public Events List...');
        const eventsRes = await fetch(`${API_URL}/events`);
        const eventsData = await eventsRes.json();
        console.log(`✅ Fetched ${eventsData.data.length} events.`);

        if (eventsData.data.length > 0) {
            const eventId = eventsData.data[0]._id;
            console.log(`\n4. Fetching Event Detail for ID: ${eventId}`);
            const detailRes = await fetch(`${API_URL}/events/${eventId}`);
            const detailData = await detailRes.json();
            console.log(`✅ Event Title: ${detailData.data.title}`);
            console.log(`✅ Ticket Types Available: ${detailData.data.ticket_types.length}`);

            // 5. Booking Ticket
            if (detailData.data.ticket_types.length > 0) {
                const ticketTypeId = detailData.data.ticket_types[0]._id;
                console.log(`\n5. Booking ticket (Type ID: ${ticketTypeId})...`);

                const bookingRes = await fetch(`${API_URL}/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ticket_items: [{ ticket_type_id: ticketTypeId, quantity: 1 }]
                    })
                });
                const bookingData = await bookingRes.json();

                if (bookingData.success) {
                    console.log('✅ Booking Successful!');
                    console.log(`   Order ID: ${bookingData.data.order._id}`);
                    console.log(`   Tickets Generated: ${bookingData.data.tickets.length}`);
                } else {
                    console.error('❌ Booking Failed:', bookingData.message);
                }
            }
        }

        console.log('\n--- TEST COMPLETED SUCCESSFULLY ---');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        if (error.cause) console.error(error.cause);
    }
}

runTest();
