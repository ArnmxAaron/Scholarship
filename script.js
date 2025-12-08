/**
 * script.js
 * Handles Home Page rendering
 */

const path = window.location.pathname;
const page = path.split("/").pop();

// Only run home logic if we are on index
if (!page.includes("details.html")) {
    initHomePage();
}

function initHomePage() {
    const grid = document.getElementById('scholarshipGrid');
    const searchInput = document.getElementById('searchInput');
    const levelFilter = document.getElementById('levelFilter');

    function renderList(data) {
        if (!grid) return;
        grid.innerHTML = '';

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden group';
            
            card.innerHTML = `
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
                // Wait for Firebase module to define it if it's lagging
                setTimeout(() => {
                    if (window.listenToViews) window.listenToViews(item.id, item.views);
                }, 150);
            }
        });
    }

    // Filter Logic
    window.filterScholarships = function() {
        const query = searchInput.value.toLowerCase();
        const level = levelFilter.value;
        const noResults = document.getElementById('noResults');

        const filtered = scholarships.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(query) || item.location.toLowerCase().includes(query);
            const matchesLevel = level === 'all' || item.level.toLowerCase().includes(level);
            return matchesSearch && matchesLevel;
        });

        if(filtered.length === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
        }
        
        renderList(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', filterScholarships);
    if (levelFilter) levelFilter.addEventListener('change', filterScholarships);

    renderList(scholarships);
}