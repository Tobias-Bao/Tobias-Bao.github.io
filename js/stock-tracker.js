document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const stockListContainer = document.getElementById('stock-list');
    const statusMessage = document.getElementById('status-message');
    const sortBySelect = document.getElementById('sort-by');
    const sortDirectionSelect = document.getElementById('sort-direction');
    const lastUpdated = document.getElementById('last-updated');
    const paginationControls = document.getElementById('pagination-controls');

    // Filter Inputs
    const allFilterInputs = [
        document.getElementById('price-min'), document.getElementById('price-max'),
        document.getElementById('changePercent-min'), document.getElementById('changePercent-max'),
        document.getElementById('turnover-min'), document.getElementById('turnover-max'),
        document.getElementById('volume-min'), document.getElementById('volume-max'),
        document.getElementById('turnoverAmount-min'), document.getElementById('turnoverAmount-max')
    ];

    // App State
    let allStockData = [];
    let filteredStockData = [];
    let stockCodes = [];
    let updateInterval;
    let currentPage = 1;
    const itemsPerPage = 20;

    // --- Main Functions ---
    async function init() {
        showLoading('正在获取所有A股代码...');
        try {
            const response = await fetch('https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=1&num=5000&sort=symbol&asc=1&node=hs_a&symbol=&_s_r_a=page');
            const data = await response.json();
            stockCodes = data.map(item => item.symbol);
            statusMessage.textContent = `成功获取 ${stockCodes.length} 支A股代码。`;
            fetchStockData();
            updateInterval = setInterval(fetchStockData, 5000);
        } catch (error) {
            showError('获取A股列表失败，请稍后重试。');
            console.error('Failed to fetch stock codes:', error);
        }
    }

    async function fetchStockData() {
        const isInitialLoad = allStockData.length === 0;
        if (isInitialLoad) {
            showLoading('正在更新行情数据...');
        }

        const batchSize = 100;
        const promises = [];
        for (let i = 0; i < stockCodes.length; i += batchSize) {
            promises.push(fetchBatchData(stockCodes.slice(i, i + batchSize)));
        }

        try {
            const results = await Promise.all(promises);
            allStockData = results.flat().filter(stock => stock && stock.price > 0);
            applyFiltersAndRender({ preserveScroll: !isInitialLoad, source: 'fetch' });
            updateTimestamp();
        } catch (error) {
            if (isInitialLoad) showError('更新数据失败，请检查网络连接。');
            console.error('Failed to fetch stock data:', error);
        }
    }

    async function fetchBatchData(codes) {
        const url = `https://qt.gtimg.cn/q=${codes.join(',')}`;
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('gbk');
        const text = decoder.decode(buffer);
        return parseStockData(text);
    }

    function parseStockData(rawData) {
        const lines = rawData.trim().split('\n');
        return lines.map(line => {
            const parts = line.split('~');
            if (parts.length < 39) return null;
            return {
                code: parts[2],
                name: parts[1].trim(),
                price: parseFloat(parts[3]),
                changePercent: parseFloat(parts[32]),
                volume: parseFloat(parts[6]) / 10000, // Convert from shares to 10k shares
                turnover: parseFloat(parts[38]),
                turnoverAmount: parseFloat(parts[37]), // 成交额 (万元)
                market: parts[0].includes('sh') ? 'sh' : 'sz'
            };
        }).filter(Boolean);
    }

    function applyFiltersAndRender({ preserveScroll = false, source = 'user' } = {}) {
        if (source === 'user') currentPage = 1;

        if (allStockData.length > 0) hideMessage();

        const filters = {
            price: { min: parseFloat(document.getElementById('price-min').value) || 0, max: parseFloat(document.getElementById('price-max').value) || Infinity },
            changePercent: { min: parseFloat(document.getElementById('changePercent-min').value) || -Infinity, max: parseFloat(document.getElementById('changePercent-max').value) || Infinity },
            turnover: { min: parseFloat(document.getElementById('turnover-min').value) || 0, max: parseFloat(document.getElementById('turnover-max').value) || Infinity },
            volume: { min: parseFloat(document.getElementById('volume-min').value) || 0, max: parseFloat(document.getElementById('volume-max').value) || Infinity },
            turnoverAmount: { min: parseFloat(document.getElementById('turnoverAmount-min').value) || 0, max: parseFloat(document.getElementById('turnoverAmount-max').value) || Infinity }
        };

        filteredStockData = allStockData.filter(stock =>
            Object.keys(filters).every(key => stock[key] >= filters[key].min && stock[key] <= filters[key].max)
        );

        const sortBy = sortBySelect.value;
        const sortDirection = sortDirectionSelect.value;
        filteredStockData.sort((a, b) => (sortDirection === 'asc' ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy]));

        renderPage({ preserveScroll });
    }

    function renderPage({ preserveScroll = false } = {}) {
        const scrollY = window.scrollY;

        const totalPages = Math.ceil(filteredStockData.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = totalPages || 1;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = filteredStockData.slice(startIndex, endIndex);

        renderStockList(pageItems);
        renderPagination(totalPages);

        if (preserveScroll) window.scrollTo({ top: scrollY, behavior: 'instant' });
    }

    function formatTurnoverAmount(amount) {
        if (amount >= 10000) {
            return `${(amount / 10000).toFixed(2)}亿`;
        }
        return `${amount.toFixed(0)}万`;
    }

    function renderStockList(stocks) {
        if (stocks.length === 0 && allStockData.length > 0) {
            showError('没有满足筛选条件的股票。');
            stockListContainer.innerHTML = '';
            document.getElementById('stock-list-container').classList.add('hidden');
            return;
        }

        const fragment = document.createDocumentFragment();
        stocks.forEach(stock => {
            const colorClass = stock.changePercent > 0 ? 'stock-up' : (stock.changePercent < 0 ? 'stock-down' : 'stock-flat');
            const sign = stock.changePercent > 0 ? '+' : '';
            const formattedTurnoverAmount = formatTurnoverAmount(stock.turnoverAmount);
            const item = document.createElement('div');
            item.className = 'stock-item';
            item.innerHTML = `
                <div class="stock-item-cell stock-name-cell"><div class="stock-name">${stock.name}</div><div class="stock-code">${stock.market.toUpperCase()}${stock.code}</div></div>
                <div class="stock-item-cell ${colorClass}"><span class="mobile-label">最新价</span><span class="font-medium">${stock.price.toFixed(2)}</span></div>
                <div class="stock-item-cell ${colorClass}"><span class="mobile-label">涨跌幅</span><span class="font-bold">${sign}${stock.changePercent.toFixed(2)}%</span></div>
                <div class="stock-item-cell"><span class="mobile-label">换手率</span><span>${stock.turnover.toFixed(2)}%</span></div>
                <div class="stock-item-cell"><span class="mobile-label">成交量</span><span>${stock.volume.toFixed(2)}万手</span></div>
                <div class="stock-item-cell"><span class="mobile-label">成交额</span><span>${formattedTurnoverAmount}</span></div>
            `;
            fragment.appendChild(item);
        });

        stockListContainer.innerHTML = '';
        stockListContainer.appendChild(fragment);
        document.getElementById('stock-list-container').classList.remove('hidden');
    }

    function renderPagination(totalPages) {
        paginationControls.innerHTML = '';
        if (totalPages <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = `&larr; 上一页`;
        prevButton.className = 'pagination-btn';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderPage({ preserveScroll: false });
            }
        });

        const pageInfo = document.createElement('span');
        pageInfo.className = 'text-sm font-medium text-gray-600';
        pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页 (共 ${filteredStockData.length} 项)`;

        const nextButton = document.createElement('button');
        nextButton.innerHTML = `下一页 &rarr;`;
        nextButton.className = 'pagination-btn';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderPage({ preserveScroll: false });
            }
        });

        paginationControls.appendChild(prevButton);
        paginationControls.appendChild(pageInfo);
        paginationControls.appendChild(nextButton);
    }

    // --- UI & Utility Functions ---
    function showLoading(message) {
        document.getElementById('stock-list-container').classList.add('hidden');
        paginationControls.innerHTML = '';
        statusMessage.classList.remove('hidden');
        statusMessage.innerHTML = `<div class="loader"></div><p class="mt-4">${message}</p>`;
    }

    function showError(message) {
        document.getElementById('stock-list-container').classList.add('hidden');
        paginationControls.innerHTML = '';
        statusMessage.classList.remove('hidden');
        statusMessage.innerHTML = `<p class="text-red-500">${message}</p>`;
    }

    function hideMessage() {
        if (!statusMessage.classList.contains('hidden')) {
            statusMessage.classList.add('hidden');
            statusMessage.innerHTML = '';
        }
    }

    function updateTimestamp() {
        lastUpdated.textContent = `最后更新: ${new Date().toLocaleTimeString()}`;
    }

    function debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // --- Event Listeners ---
    const debouncedRender = debounce(() => applyFiltersAndRender({ preserveScroll: true, source: 'user' }), 400);
    allFilterInputs.forEach(input => input.addEventListener('input', debouncedRender));
    sortBySelect.addEventListener('change', () => applyFiltersAndRender({ preserveScroll: true, source: 'user' }));
    sortDirectionSelect.addEventListener('change', () => applyFiltersAndRender({ preserveScroll: true, source: 'user' }));

    // --- Initial Load ---
    init();
});

