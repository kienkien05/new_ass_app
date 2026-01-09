const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Fetch events from API and render to container
 * @param {string} containerSelector - CSS selector for container
 * @param {boolean} isFeatured - Fetch featured events only?
 */
async function loadEventsFromAPI(containerSelector, isFeatured = false) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    try {
        const endpoint = isFeatured ? '/events/featured' : '/events';
        const res = await fetch(`${API_BASE_URL}${endpoint}`);
        const data = await res.json();

        if (data.success && data.data.length > 0) {
            const mappedEvents = data.data.map(e => {
                const startDate = new Date(e.start_time);
                return {
                    id: e._id,
                    title: e.title,
                    image: e.thumbnail_image || e.banner_image || 'https://via.placeholder.com/400x200',
                    category: e.category,
                    date: startDate.toLocaleDateString('vi-VN'),
                    time: startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                    location: e.location,
                    price: 'Chi tiết', // API list doesn't return price yet
                    isHot: e.is_hot,
                    tagBg: e.is_hot ? 'bg-red-500' : 'bg-blue-500',
                    tagText: e.is_hot ? 'Hot' : 'New'
                };
            });

            // Use the global renderEvents function from event-utils.js
            // But renderEvents expects an ID, and we might have querySelector.
            // Let's modify renderEvents or just inline the render logic specific here if needed.
            // event-utils.js renderEvents takes (containerId, events).

            // If container has an ID, use it.
            if (container.id) {
                if (window.renderEvents) {
                    window.renderEvents(container.id, mappedEvents);
                }
            } else {
                // Manual render if no ID or renderEvents not found
                if (window.getEventCardTemplate) {
                    container.innerHTML = mappedEvents.map(event => window.getEventCardTemplate(event)).join('');
                }
            }
        } else {
            console.log('No events found from API');
        }

    } catch (error) {
        console.error('Error fetching events:', error);
        container.innerHTML = '<div class="col-span-full text-center text-red-500">Lỗi kết nối server</div>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on Home page
    const homeContainer = document.getElementById('event-scroll-container');
    if (homeContainer) {
        loadEventsFromAPI('#event-scroll-container', true);
    }

    // Check if we are on Events page
    // The grid in events.html doesn't have an ID, it's inside main
    // We can select it by class assumption
    const eventGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
    if (eventGrid) {
        // Give it an ID to be safe or pass to function
        if (!eventGrid.id) eventGrid.id = 'events-grid-dynamic';
        loadEventsFromAPI(`#${eventGrid.id}`, false);
    }
});
