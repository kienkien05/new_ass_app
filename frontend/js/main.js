
// Main Global Logic

// Dark Mode Handling
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
} else {
    document.documentElement.classList.remove('dark')
}

function toggleDarkMode() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
    }
}

// ===== COMPONENT LOADING SYSTEM =====

/**
 * Load an HTML component into an element
 * @param {string} elementId - ID of the container element
 * @param {string} componentPath - Path to the HTML component file
 */
async function loadComponent(elementId, componentPath) {
    const element = document.getElementById(elementId);
    if (!element) return; // Skip if element doesn't exist

    try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`Failed to load ${componentPath}`);
        const html = await response.text();
        element.innerHTML = html;
    } catch (error) {
        console.error('Component load error:', error);
    }
}

/**
 * Set active state on sidebar navigation
 * @param {string} pageId - ID of the current page (e.g., 'dashboard', 'users')
 */
function setActiveNav(pageId) {
    const navLinks = document.querySelectorAll('#admin-sidebar nav a');
    navLinks.forEach(link => {
        const linkId = link.getAttribute('data-page');
        if (linkId === pageId) {
            // Active state
            link.className = 'flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/30 transition-all';
            const icon = link.querySelector('.material-symbols-outlined');
            if (icon) icon.className = 'material-symbols-outlined icon-fill text-white';
            const label = link.querySelector('span:last-child');
            if (label) label.className = 'text-sm font-semibold';
        }
    });
}

/**
 * Initialize admin page with sidebar and header
 * @param {string} pageId - Current page ID for nav highlighting
 * @param {string} pageName - Page name for breadcrumb
 */
async function initAdminPage(pageId, pageName) {
    // Load components
    await loadComponent('admin-sidebar', '../../components/admin-sidebar.html');
    await loadComponent('admin-header', '../../components/admin-header.html');

    // Set page title in header if element exists
    const titleEl = document.getElementById('header-page-title');
    if (titleEl && pageName) titleEl.textContent = pageName;

    // Initialize Header Events (Dropdowns, Toggles)
    initHeaderEvents();

    // Set active nav
    setActiveAdminNav(pageId);

    // Set document title
    if (pageName) {
        document.title = `${pageName} - EViENT Admin`;
    }
}

/**
 * Set active state on admin navigation
 * @param {string} pageId - ID of the current page
 */
function setActiveAdminNav(pageId) {
    const navLinks = document.querySelectorAll('aside nav a');

    navLinks.forEach(link => {
        const linkId = link.getAttribute('data-page');
        if (linkId === pageId) {
            // Active State
            link.className = 'flex items-center gap-3 px-4 py-3 rounded-xl bg-primary shadow-lg shadow-primary/30 transition-all';
            const icon = link.querySelector('.material-symbols-outlined');
            const text = link.querySelector('p');
            if (icon) icon.className = 'material-symbols-outlined text-white';
            if (text) text.className = 'text-white text-sm font-bold leading-normal';
        } else {
            // Inactive State
            link.className = 'flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent-dark transition-colors group';
            const icon = link.querySelector('.material-symbols-outlined');
            const text = link.querySelector('p');
            if (icon) icon.className = 'material-symbols-outlined text-text-secondary group-hover:text-white';
            if (text) text.className = 'text-text-secondary group-hover:text-white text-sm font-medium leading-normal';
        }
    });
}

// ===== USER PAGE COMPONENT SYSTEM =====

/**
 * Set active state on user navigation
 * @param {string} pageId - ID of the current page (e.g., 'home', 'wallet', 'events')
 */
function setActiveUserNav(pageId) {
    const navLinks = document.querySelectorAll('#user-header .nav-link');
    const mobileNavLinks = document.querySelectorAll('#user-header .nav-link-mobile');

    // Desktop nav
    navLinks.forEach(link => {
        const linkId = link.getAttribute('data-page');
        if (linkId === pageId) {
            link.classList.add('nav-link-active');
            link.classList.remove('text-slate-600', 'dark:text-gray-300');
        }
    });

    // Mobile nav
    mobileNavLinks.forEach(link => {
        const linkId = link.getAttribute('data-page');
        if (linkId === pageId) {
            link.classList.add('bg-primary/10', 'text-primary');
            link.classList.remove('text-slate-600', 'dark:text-gray-300');
        }
    });
}

// ===== UI LOGIC =====

/**
 * Update Header State (Guest vs User)
 * @param {boolean} isLoggedIn - True if user is logged in
 */
function updateHeaderState(isLoggedIn) {
    const authGuest = document.getElementById('auth-guest');
    const authUser = document.getElementById('auth-user');

    if (authGuest && authUser) {
        if (isLoggedIn) {
            authGuest.classList.add('hidden');
            authGuest.classList.remove('flex');
            authUser.classList.remove('hidden');
        } else {
            authGuest.classList.remove('hidden');
            authGuest.classList.add('flex');
            authUser.classList.add('hidden');
        }
    }
}

/**
 * Initialize Header Events
 */
function initHeaderEvents() {
    // Profile Dropdown Toggle
    const profileBtn = document.getElementById('profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = profileDropdown.classList.contains('hidden');

            if (isHidden) {
                // Show
                profileDropdown.classList.remove('hidden');
                // Small delay to allow transition to work
                setTimeout(() => {
                    profileDropdown.classList.remove('transform', 'scale-95', 'opacity-0');
                    profileDropdown.classList.add('transform', 'scale-100', 'opacity-100');
                }, 10);
            } else {
                // Hide
                closeDropdown(profileDropdown);
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                closeDropdown(profileDropdown);
            }
        });
    }

    // Notification Dropdown Toggle
    const notifBtn = document.getElementById('btn-notifications');
    const notifDropdown = document.getElementById('notification-dropdown');

    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = notifDropdown.classList.contains('hidden');

            if (isHidden) {
                // Close profile dropdown if open
                const profileDropdown = document.getElementById('profile-dropdown');
                if (profileDropdown && !profileDropdown.classList.contains('hidden')) {
                    closeDropdown(profileDropdown);
                }

                // Show
                notifDropdown.classList.remove('hidden');
                setTimeout(() => {
                    notifDropdown.classList.remove('transform', 'scale-95', 'opacity-0');
                    notifDropdown.classList.add('transform', 'scale-100', 'opacity-100');
                }, 10);
            } else {
                // Hide
                closeDropdown(notifDropdown);
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
                closeDropdown(notifDropdown);
            }
        });
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        // Remove old listeners to avoid duplicates if re-init
        const newBtn = mobileMenuBtn.cloneNode(true);
        mobileMenuBtn.parentNode.replaceChild(newBtn, mobileMenuBtn);

        newBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

function closeDropdown(dropdown) {
    if (!dropdown) return;

    dropdown.classList.remove('transform', 'scale-100', 'opacity-100');
    dropdown.classList.add('transform', 'scale-95', 'opacity-0');

    setTimeout(() => {
        dropdown.classList.add('hidden');
    }, 150); // Match transition duration
}

/**
 * Initialize user page with header and footer
 * @param {string} pageId - Current page ID for nav highlighting
 * @param {string} pageName - Page name for title
 */
async function initUserPage(pageId, pageName) {
    // Load components
    await loadComponent('user-header', '../../components/user-header.html');
    await loadComponent('user-footer', '../../components/user-footer.html');

    // Initialize Header Events (Dropdowns, etc)
    initHeaderEvents();

    // Default to User state for demo (CHANGE TO FALSE FOR PROD)
    updateHeaderState(false);

    // Set active nav
    setActiveUserNav(pageId);

    // Update page title
    if (pageName) {
        document.title = `${pageName} - EViENT`;
    }
}

// Expose to window
window.toggleDarkMode = toggleDarkMode;
window.loadComponent = loadComponent;
window.setActiveNav = setActiveNav;
window.initAdminPage = initAdminPage;
window.initUserPage = initUserPage;
window.setActiveUserNav = setActiveUserNav;

window.updateHeaderState = updateHeaderState;

document.addEventListener("DOMContentLoaded", () => {
    // Add any global initialization here
});
