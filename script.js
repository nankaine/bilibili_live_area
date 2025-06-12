document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const cardsContainer = document.getElementById('cards-container');
    const paginationContainer = document.getElementById('pagination-container');
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input');
    
    // --- State Variables ---
    let allSubCategories = []; 
    let currentFilteredList = [];
    const ITEMS_PER_PAGE = 56; 
    let currentPage = 1;

    // --- Main Fetch Function ---
    async function fetchData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            const categoryList = Array.isArray(result) ? result : result.data;
            if (!Array.isArray(categoryList)) {
                throw new Error('Fetched data is not in the expected array format.');
            }
            
            allSubCategories = categoryList.flatMap(category => 
                category.list.map(sub => ({...sub, parent_name: category.name}))
            );
            
            populateCategoryFilter(categoryList);
            addEventListeners(); 
            applyFilters();

        } catch (error) {
            console.error('Error fetching or processing data:', error);
            cardsContainer.innerHTML = `<p style="color: red; text-align: center; grid-column: 1 / -1;">加载数据失败：${error.message}</p>`;
        }
    }

    // --- Filter and Search (此部分无改动) ---

    function populateCategoryFilter(data) {
        categoryFilter.removeEventListener('change', applyFilters);
        categoryFilter.innerHTML = '<option value="all">所有分区</option>';

        data.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }

    function addEventListeners() {
        categoryFilter.addEventListener('change', applyFilters);
        searchInput.addEventListener('input', applyFilters);
    }

    function applyFilters() {
        const selectedCategory = categoryFilter.value;
        const searchTerm = searchInput.value.toLowerCase().trim();

        let filtered = allSubCategories;
        if (selectedCategory !== 'all') {
            filtered = allSubCategories.filter(sub => sub.parent_name === selectedCategory);
        }

        if (/^\d+$/.test(searchTerm)) {
            // 如果是纯数字，按 ID 匹配
            filtered = filtered.filter(sub => String(sub.id) === searchTerm);
        } else {
            // 否则按名称模糊匹配
            filtered = filtered.filter(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        currentFilteredList = filtered;
        
        renderPage(1);
        setupPagination();
    }

    // --- Rendering and Pagination ---

    function renderPage(page) {
        currentPage = page;
        cardsContainer.innerHTML = '';
        // 只有当用户主动翻页时才滚动，初始加载不滚动
        if (page > 1) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        if (currentFilteredList.length === 0) {
            cardsContainer.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">没有找到匹配的分区。</p>';
            paginationContainer.innerHTML = '';
            return;
        }

        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const itemsToRender = currentFilteredList.slice(startIndex, endIndex);

        itemsToRender.forEach(subCategory => {
            const card = document.createElement('div');
            card.className = 'card';
            card.title = `${subCategory.parent_name} - ${subCategory.name}\n点击复制ID: ${subCategory.id}`;

            card.addEventListener('click', () => {
                navigator.clipboard.writeText(subCategory.id).then(() => {
                    showToast(`分区ID: ${subCategory.id} 已复制!`);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                    showToast('复制失败!', true);
                });
            });

            if (subCategory.pic) {
                const img = document.createElement('img');
                const originalUrl = subCategory.pic.replace(/^(https?:)?\/\//, '');
                img.src = `https://images.weserv.nl/?url=${originalUrl}`;
                img.alt = subCategory.name;
                img.loading = 'lazy';
                card.appendChild(img);
            }

            const name = document.createElement('p');
            name.textContent = subCategory.name;
            card.appendChild(name);

            // --- 核心改动 2：添加显示ID的元素 ---
            const idElement = document.createElement('p');
            idElement.className = 'card-id';
            idElement.textContent = `ID: ${subCategory.id}`;
            card.appendChild(idElement);
            
            cardsContainer.appendChild(card);
        });

        updatePaginationUI();
    }
    
    // (setupPagination, updatePaginationUI, showToast 函数均无改动)

    function setupPagination() {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(currentFilteredList.length / ITEMS_PER_PAGE);

        if (totalPages <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.textContent = '上一页';
        prevButton.className = 'pagination-btn';
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) renderPage(currentPage - 1);
        });
        paginationContainer.appendChild(prevButton);

        const pageInfo = document.createElement('span');
        pageInfo.className = 'pagination-info';
        paginationContainer.appendChild(pageInfo);

        const nextButton = document.createElement('button');
        nextButton.textContent = '下一页';
        nextButton.className = 'pagination-btn';
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) renderPage(currentPage + 1);
        });
        paginationContainer.appendChild(nextButton);

        updatePaginationUI();
    }
    
    function updatePaginationUI() {
        const totalPages = Math.ceil(currentFilteredList.length / ITEMS_PER_PAGE);
        const prevButton = paginationContainer.querySelector('button:first-child');
        const nextButton = paginationContainer.querySelector('button:last-child');
        const pageInfo = paginationContainer.querySelector('.pagination-info');
        
        if (pageInfo) {
            pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页`;
        }
        if (prevButton) {
            prevButton.disabled = currentPage === 1;
        }
        if (nextButton) {
            nextButton.disabled = currentPage === totalPages;
        }
    }
    
    function showToast(message, isError = false) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        if (isError) toast.style.backgroundColor = '#f44336';
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }
    
    // --- Initial Call ---
    fetchData();
});
