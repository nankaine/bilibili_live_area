let allData = []; // 用于存储从data.json加载的完整数据

document.addEventListener('DOMContentLoaded', () => {
    fetchData(); // 页面加载完成后立即获取数据
    setupThemeToggle(); // 设置主题切换功能
});

/**
 * 从 data.json 文件获取数据
 */
async function fetchData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        console.log(jsonData);
        allData = jsonData["data"]; // 存储获取到的数据（data字段的值）
        populateParentFilter(); // 填充父分区选择器
        applyFilters(); // 初始显示所有数据
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('content').innerHTML = '<p>加载数据失败，请稍后再试。</p>';
    }
}

/**
 * 填充父分区选择器
 */
function populateParentFilter() {
    const parentSelect = document.getElementById('parent-select');
    // 添加一个“所有分区”的默认选项
    parentSelect.innerHTML = '<option value="">所有分区</option>';

    allData.forEach(parentCategory => {
        const option = document.createElement('option');
        option.value = parentCategory.id; // 使用父分区的ID作为值
        option.textContent = parentCategory.name;
        parentSelect.appendChild(option);
    });

    // 为选择器和搜索框添加事件监听器，以便在值改变时应用筛选
    parentSelect.addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', applyFilters);
}

/**
 * 根据选择的父分区和搜索词应用筛选
 */
function applyFilters() {
    const selectedParentId = document.getElementById('parent-select').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    let filteredSubCategories = [];

    allData.forEach(parentCategory => {
        // 如果没有选择父分区（selectedParentId为空）或者当前父分区ID匹配
        if (selectedParentId === '' || parentCategory.id == selectedParentId) {
            parentCategory.list.forEach(subCategory => {
                // 搜索子分区名称是否包含搜索词（不区分大小写）
                if (subCategory.name.toLowerCase().includes(searchTerm)) {
                    // 为了方便显示，将父分区名称添加到子分区对象中
                    subCategory.parent_name = parentCategory.name;
                    filteredSubCategories.push(subCategory);
                }
            });
        }
    });

    displaySubCategories(filteredSubCategories); // 显示筛选后的子分区
}

/**
 * 在网页上显示子分区列表
 * @param {Array} subCategories - 要显示的子分区数组
 */
function displaySubCategories(subCategories) {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = ''; // 清空之前的内容

    if (subCategories.length === 0) {
        contentDiv.innerHTML = '<p>没有找到匹配的分区。</p>';
        return;
    }

    // 创建并添加每个子分区的卡片
    subCategories.forEach(subCategory => {
        const card = document.createElement('div');
        card.classList.add('category-card');

        card.addEventListener('click', () => {
            // 使用现代的 Clipboard API 复制文本
            navigator.clipboard.writeText(subCategory.id).then(() => {
                // 复制成功后，显示提示
                showToast(`分区ID: ${subCategory.id} 已复制!`);
            }).catch(err => {
                // 如果复制失败，也在控制台和提示框中告知用户
                console.error('Failed to copy text: ', err);
                showToast('复制失败!', true);
            });
        });

        // 如果有图片，则显示图片
        if (subCategory.pic) {
            const img = document.createElement('img');
            const originalUrl = subCategory.pic.replace(/^(https?:)?\/\//, '');
            img.src = `https://images.weserv.nl/?url=${originalUrl}`; 
            img.alt = subCategory.name;
            card.appendChild(img);
        }

        const name = document.createElement('h3');
        name.textContent = subCategory.name;
        card.appendChild(name);

        const parentName = document.createElement('p');
        parentName.textContent = `父分区: ${subCategory.parent_name}`;
        card.appendChild(parentName);

        const parentName2 = document.createElement('p');
        parentName2.textContent = `分区ID: ${subCategory.id}`;
        card.appendChild(parentName2);

        contentDiv.appendChild(card);
    });
}

/**
 * 设置主题切换功能（亮色/暗色模式）
 */
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    // 检查用户系统是否偏好暗色模式
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    // 优先从localStorage中获取用户保存的主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
    } else if (prefersDark.matches) { // 如果没有保存的设置，则根据系统偏好设置
        document.body.classList.add('dark-mode');
    }

    // 监听主题切换按钮的点击事件
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode'); // 切换dark-mode类
        // 将当前主题保存到localStorage
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    // 监听系统主题偏好变化，如果用户没有明确设置主题，则自动切换
    prefersDark.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) { // 只有在用户没有手动设置主题时才自动切换
            if (e.matches) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }
    });
}

/**
 * 显示一个短暂的提示框 (Toast)
 * @param {string} message - 要显示的消息
 * @param {boolean} isError - 是否为错误提示 (可选)
 */
function showToast(message, isError = false) {
    // 先移除可能已存在的旧提示框
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    // 创建新的提示框元素
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    // 如果是错误提示，改变背景颜色
    if (isError) {
        toast.style.backgroundColor = '#f44336'; // 红色
    }
    document.body.appendChild(toast);
    // 触发动画
    // 使用一个微小的延迟来确保CSS transition能够正确触发
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    // 3秒后自动移除提示框
    setTimeout(() => {
        toast.classList.remove('show');
        // 在动画结束后，从DOM中彻底移除元素
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}