/**
 * Event Utility Functions
 * Handles rendering of event cards and grids
 */

/**
 * Generate HTML for a single event card
 * @param {Object} event - Event object
 * @returns {string} HTML string
 */
function getEventCardTemplate(event) {
    // Ensure ID is passed for detailed link
    const eventId = event.id || event._id;

    // Optional Tag (Hot, New, etc.)
    const tagHtml = event.isHot
        ? `<div class="absolute top-3 right-3 ${event.tagBg || 'bg-red-500'} text-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm">${event.tagText || 'Hot'}</div>`
        : '';

    return `
    <a href="event-detail.html?id=${eventId}" 
       class="group bg-white dark:bg-surface-dark rounded-2xl overflow-hidden border border-gray-100 dark:border-[#222249] shadow-lg shadow-gray-200/50 dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
        <!-- Image -->
        <div class="relative aspect-[16/9] overflow-hidden">
            <img src="${event.image}" 
                 alt="${event.title}" 
                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                 loading="lazy">
            <div class="absolute top-3 left-3 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white shadow-sm">
                ${event.category}
            </div>
            ${tagHtml}
        </div>
        <!-- Content -->
        <div class="p-5 flex flex-col flex-1">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                ${event.title}
            </h3>
            <div class="space-y-2 mb-4">
                <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400">
                    <span class="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
                    <span>${event.date} • ${event.time}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400">
                    <span class="material-symbols-outlined text-[18px] text-primary">location_on</span>
                    <span class="truncate">${event.location}</span>
                </div>
            </div>
            <div class="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                <div class="flex flex-col">
                    <span class="text-xs text-slate-400">Giá chỉ từ</span>
                    <span class="text-lg font-bold text-primary">${event.price}</span>
                </div>
                <button class="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <span class="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </div>
    </a>
    `;
}

/**
 * Render events into a container
 * @param {string} containerId - ID of the container element
 * @param {Array} events - Array of event objects
 */
function renderEvents(containerId, events) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }

    if (!events || events.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-10 text-slate-500">Không tìm thấy sự kiện nào.</div>';
        return;
    }

    // Join all card HTML strings and set innerHTML
    container.innerHTML = events.map(event => getEventCardTemplate(event)).join('');

    // Update count if element exists
    const countElement = document.getElementById('event-count');
    if (countElement) {
        countElement.textContent = events.length;
    }
}

// Expose to window
window.renderEvents = renderEvents;
window.getEventCardTemplate = getEventCardTemplate;
