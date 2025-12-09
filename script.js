/**
 * script.js - FINAL VERSION with Sidebar and Click Tracking
 * Handles Home Page rendering, Notifications, and new scholarship sorting.
 */

const path = window.location.pathname;
const page = path.split("/").pop();

// Store viewed IDs locally to reduce the NEW badge count after a click
let viewedIds = new Set();
const VIEWED_STORAGE_KEY = 'globalScholarsViewedIds';

// Only run home logic if we are on index
if (!page.includes("details.html")) {
    // Load viewed IDs from local storage
    const storedIds = localStorage.getItem(VIEWED_STORAGE_KEY);
    if (storedIds) {
        try {
            viewedIds = new Set(JSON.parse(storedIds));
        } catch (e) {
            console.error("Failed to parse viewed IDs from storage.", e);
        }
    }
    
    // We add a short delay to ensure all scripts and data are loaded
    setTimeout(initHomePage, 100); 
}

/**
 * Saves the current set of viewed IDs to local storage.
 */
function saveViewedIds() {
    localStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify(Array.from(viewedIds)));
}

/**
 * Marks an ID as viewed, updates the live count, and saves to storage.
 * This is called when a user clicks a notification link.
 * @param {number} id - The ID of the scholarship viewed.
 */
window.markNotificationAsViewed = function(id) {
    if (!viewedIds.has(id.toString())) {
        viewedIds.add(id.toString());
        saveViewedIds();
        
        // Re-run the update logic to refresh the badge and lists
        if (typeof scholarships !== 'undefined') {
            updateNotifications(scholarships);
        }
    }
    // Redirect to the details page (handled inline in the HTML link)
}


/* --- Utility Functions (Same as before) --- */

function isNewScholarship(postedDateString) {
    if (!postedDateString) return false;
    const postedDate = new Date(postedDateString);
    const fortyEightHoursInMs = 48 * 60 * 60 * 1000;
    
    return !isNaN(postedDate) && (new Date() - postedDate) < fortyEightHoursInMs;
}

function getTimeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes";
    return "just now";
}

/**
 * Creates the HTML element for a single scholarship notification.
 * @param {object} item - The scholarship data object.
 * @param {boolean} isSidebar - Controls the card appearance for the smaller sidebar widget.
 * @returns {string} The HTML string for the notification item.
 */
function createNotificationItemHTML(item, isSidebar = false) {
    // Add the click handler to reduce the count when clicked
    const clickHandler = `markNotificationAsViewed(${item.id});`;
    const link = `details.html?id=${item.id}`;
    const timeSincePost = item.date_posted ? getTimeSince(new Date(item.date_posted)) : 'recently';

    if (isSidebar) {
        return `
            <a href="${link}" onclick="${clickHandler}" class="block group p-2 hover:bg-gray-100 transition rounded-lg">
                <div class="font-bold text-sm text-gray-900 leading-tight group-hover:text-primary transition">${item.title}</div>
                <div class="text-[10px] text-gray-500 mt-0.5">${item.location} • ${timeSincePost} ago</div>
            </a>
        `;
    }

    // Full Slider HTML
    return `
        <a href="${link}" onclick="closeNotificationSlider(); ${clickHandler}" class="block p-3 hover:bg-gray-50 transition rounded-xl border border-gray-100 shadow-sm relative">
            <div class="flex items-start">
                <div class="flex-shrink-0 mr-3 mt-1">
                    <i class="fa-solid fa-star text-secondary text-sm"></i>
                </div>
                <div>
                    <div class="font-bold text-sm text-gray-900 leading-snug">${item.title}</div>
                    <div class="text-xs text-primary font-semibold">${item.location} (${item.level})</div>
                    <div class="text-[10px] text-gray-400 mt-1">${timeSincePost} ago</div>
                </div>
            </div>
            <span class="absolute top-1 right-1 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">New</span>
        </a>
    `;
}

/**
 * Updates the notification slider, the sidebar widget, and the bell badge.
 */
function updateNotifications(allScholarships) {
    const notificationListSlider = document.getElementById('notification-list');
    const notificationListSidebar = document.getElementById('sidebar-notification-list');
    const sidebarCountEl = document.getElementById('sidebar-notification-count');
    
    // 1. Filter for new scholarships (less than 48 hours old)
    let newScholarships = allScholarships.filter(s => isNewScholarship(s.date_posted));

    // 2. Filter out already viewed scholarships
    const unreadScholarships = newScholarships.filter(s => !viewedIds.has(s.id.toString()));

    // 3. Sort by date_posted (newest first)
    unreadScholarships.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
    
    // 4. Update Notification Badge count (only for UNREAD items)
    const newCount = unreadScholarships.length;
    if (window.updateNotificationBadge) {
        window.updateNotificationBadge(newCount); 
    }
    
    // 5. Populate the Full Slider (using UNREAD items)
    if (notificationListSlider) {
        if (newCount === 0) {
            notificationListSlider.innerHTML = `
                <div class="text-center py-10 text-gray-400 text-sm">
                    <i class="fa-regular fa-bell-slash text-2xl mb-2 block"></i>
                    No new scholarships for now.
                </div>
            `;
        } else {
            notificationListSlider.innerHTML = unreadScholarships.map(s => createNotificationItemHTML(s, false)).join('');
        }
    }
    
    // 6. Populate the Sidebar Widget (using top 3 UNREAD items)
    if (notificationListSidebar && sidebarCountEl) {
        if (newCount > 0) {
            sidebarCountEl.innerText = newCount;
            sidebarCountEl.classList.remove('hidden');
            
            // Limit sidebar to the top 3 unread
            const sidebarItems = unreadScholarships.slice(0, 3).map(s => createNotificationItemHTML(s, true)).join('');
            
            notificationListSidebar.innerHTML = sidebarItems;
            
        } else {
            sidebarCountEl.classList.add('hidden');
            notificationListSidebar.innerHTML = '<p class="text-xs text-gray-500 text-center py-2">No new updates.</p>';
        }
    }
}


function initHomePage() {
    // CRITICAL SAFETY CHECK: Ensure data is loaded
    if (typeof scholarships === 'undefined' || !Array.isArray(scholarships)) {
        console.error("Scholarship data not loaded. Check scholarships.js script tag order.");
        setTimeout(initHomePage, 500); 
        return; 
    }

    const grid = document.getElementById('scholarshipGrid');
    const searchInput = document.getElementById('searchInput');
    const levelFilter = document.getElementById('levelFilter');

    // --- Main Rendering Function ---
    function renderList(data) {
        if (!grid) return;
        grid.innerHTML = '';
        
        // 1. Separate new and old
        const newScholarships = data.filter(s => isNewScholarship(s.date_posted));
        const regularScholarships = data.filter(item => !isNewScholarship(item.date_posted));
        
        // 2. Sort both lists (newest first)
        newScholarships.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
        regularScholarships.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));

        // 3. Combine: new ones on top
        const sortedData = [...newScholarships, ...regularScholarships];

        sortedData.forEach(item => {
            const isNew = isNewScholarship(item.date_posted);
            
            // Add 'NEW' tag HTML if needed
            const newTagHTML = isNew ? 
                '<div class="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-widest">NEW</div>' : 
                '';

            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden group relative';
            
            card.innerHTML = `
                ${newTagHTML}
                <div class="p-6 flex flex-col h-full">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <i class="fa-solid fa-earth-americas text-primary/60"></i> ${item.location}
                        </span>
                        <span class="bg-primary/5 text-primary text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                            ${item.level}
                        </span>
                    </div>

                    <h3 class="text-xl font-bold text-gray-900 mb-3 leading-snug group-hover:text-primary transition-colors">
                        <a href="details.html?id=${item.id}">${item.title}</a>
                    </h3>

                    <div class="flex items-center gap-2 mb-4">
                        <div class="bg-green-100 text-green-700 text-[11px] px-2.5 py-0.5 rounded-full font-black uppercase">
                            ${item.amount}
                        </div>
                    </div>

                    <div class="mt-auto pt-5 border-t border-gray-50 flex justify-between items-center">
                        <div class="flex items-center gap-4 text-[11px] font-bold text-gray-400">
                            <span class="flex items-center gap-1.5 uppercase tracking-tight">
                                <i class="fa-regular fa-calendar"></i> ${item.date || 'Active'}
                            </span>
                            <span class="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                                <i class="fa-solid fa-eye text-[10px]"></i> 
                                <span id="view-count-${item.id}">--</span>
                            </span>
                        </div>
                        
                        <a href="details.html?id=${item.id}" class="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-primary transition-all">
                            <i class="fa-solid fa-arrow-right text-xs"></i>
                        </a>
                    </div>
                </div>
            `;
            grid.appendChild(card);

            // Real-time listener connection
            if (window.listenToViews) {
                window.listenToViews(item.id, item.views);
            } else {
                setTimeout(() => {
                    if (window.listenToViews) window.listenToViews(item.id, item.views);
                }, 150);
            }
        });
        
        // Update the notification center with the full list of scholarships
        updateNotifications(scholarships);
    }

    // Filter Logic
    window.filterScholarships = function() {
        if (typeof scholarships === 'undefined' || !Array.isArray(scholarships)) return;

        const query = searchInput.value.toLowerCase();
        const level = levelFilter.value;
        const noResults = document.getElementById('noResults');

        const filtered = scholarships.filter(item => {
            const title = item.title ? item.title.toLowerCase() : '';
            const location = item.location ? item.location.toLowerCase() : '';
            const itemLevel = item.level ? item.level.toLowerCase() : '';

            const matchesSearch = title.includes(query) || location.includes(query);
            const matchesLevel = level === 'all' || itemLevel.includes(level);
            return matchesSearch && matchesLevel;
        });

        if(filtered.length === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
        }
        
        renderList(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', window.filterScholarships);
    if (levelFilter) levelFilter.addEventListener('change', window.filterScholarships);

    // Initial render with all scholarships
    renderList(scholarships);
}
