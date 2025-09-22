document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const stockListContainer = document.getElementById('stock-list');
    const statusMessage = document.getElementById('status-message');
    const sortBySelect = document.getElementById('sort-by');
    const lastUpdated = document.getElementById('last-updated');
    const paginationControls = document.getElementById('pagination-controls');
    const searchInput = document.getElementById('search-input');

    // Filter Inputs
    const allFilterInputs = [
        document.getElementById('price-min'), document.getElementById('price-max'),
        document.getElementById('changePercent-min'), document.getElementById('changePercent-max'),
        document.getElementById('turnover-min'), document.getElementById('turnover-max'),
    ];

    // Modal Elements
    const modal = document.getElementById('stock-chart-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const chartStockName = document.getElementById('chart-stock-name');
    const chartTimeRangeContainer = document.getElementById('chart-time-range');
    const chartLoader = document.getElementById('chart-loader');
    const chartCanvas = document.getElementById('stock-chart');

    // App State
    let allStockData = [];
    let filteredStockData = [];
    let allMarketStockCodes = [];
    let updateInterval;
    let currentPage = 1;
    const itemsPerPage = 20;
    let stockChart = null;
    let currentChartStockCode = null;

    // --- Main Functions ---
    async function init() {
        showLoading('正在获取所有A股代码...');
        try {
            const response = await fetch(`https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeDataNew?page=1&num=8000&sort=symbol&asc=1&node=hs_a&symbol=&_s_r_a=page`);
            const data = await response.json();
            if (data && Array.isArray(data)) {
                allMarketStockCodes = data.map(item => item.symbol);
            }
            fetchStockData();
            updateInterval = setInterval(fetchStockData, 5000);
            initModal();
        } catch (error) {
            showError('获取A股列表失败，请稍后重试');
            console.error('Failed to fetch stock codes:', error);
        }
    }

    async function fetchStockData() {
        const isInitialLoad = allStockData.length === 0;
        if (isInitialLoad) {
            showLoading('正在更新全市场行情...');
        }

        const batchSize = 100;
        let priceData = [];
        for (let i = 0; i < allMarketStockCodes.length; i += batchSize) {
            const batch = allMarketStockCodes.slice(i, i + batchSize);
            const results = await fetchBatchData(batch);
            priceData.push(...results);
        }

        allStockData = priceData;
        applyFiltersAndRender({ preserveScroll: !isInitialLoad, source: 'fetch' });
        updateTimestamp();
    }

    async function fetchBatchData(codes) {
        if (codes.length === 0) return [];
        const url = `https://qt.gtimg.cn/q=${codes.join(',')}`;
        try {
            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            const decoder = new TextDecoder('gbk');
            const text = decoder.decode(buffer);
            return parseStockData(text);
        } catch (error) {
            console.error('Failed to fetch batch data:', error);
            return [];
        }
    }

    function parseStockData(rawData) {
        const lines = rawData.trim().split('\n');
        return lines.map(line => {
            const parts = line.split('~');
            if (parts.length < 40) return null;

            const marketInfo = parts[0];
            let market = 'sz';
            if (marketInfo.includes('sh')) market = 'sh';
            else if (marketInfo.includes('bj')) market = 'bj';

            return {
                code: parts[2], name: parts[1].trim(), price: parseFloat(parts[3]),
                changePercent: parseFloat(parts[32]), volume: parseFloat(parts[6]),
                turnover: parseFloat(parts[38]), turnoverAmount: parseFloat(parts[37]),
                market: market
            };
        }).filter(s => s && s.price > 0);
    }


    function applyFiltersAndRender({ preserveScroll = false, source = 'user' } = {}) {
        if (source === 'user') currentPage = 1;

        if (allStockData.length > 0) {
            hideMessage();
        }

        const searchTerm = searchInput.value.trim().toLowerCase();

        const filters = {
            price: { min: parseFloat(document.getElementById('price-min').value) || 0, max: parseFloat(document.getElementById('price-max').value) || Infinity },
            changePercent: { min: parseFloat(document.getElementById('changePercent-min').value) || -Infinity, max: parseFloat(document.getElementById('changePercent-max').value) || Infinity },
            turnover: { min: parseFloat(document.getElementById('turnover-min').value) || 0, max: parseFloat(document.getElementById('turnover-max').value) || Infinity },
        };

        filteredStockData = allStockData.filter(stock => {
            const matchesSearch = searchTerm === '' || stock.name.toLowerCase().includes(searchTerm) || stock.code.includes(searchTerm);
            const matchesFilters = Object.keys(filters).every(key => stock[key] >= filters[key].min && stock[key] <= filters[key].max);
            return matchesSearch && matchesFilters;
        });

        const sortBy = sortBySelect.value;
        filteredStockData.sort((a, b) => b[sortBy] - a[sortBy]);

        renderPage({ preserveScroll });
    }

    function renderPage({ preserveScroll = false } = {}) {
        const scrollY = window.scrollY;
        const totalPages = Math.ceil(filteredStockData.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = totalPages || 1;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = filteredStockData.slice(startIndex, endIndex);

        if (pageItems.length === 0 && searchTerm.length > 0) {
            showError('没有满足筛选条件的股票');
        }

        renderStockList(pageItems, startIndex);
        renderPagination(totalPages);

        if (preserveScroll) window.scrollTo({ top: scrollY, behavior: 'instant' });
    }

    function formatVolume(volumeInShou) {
        if (volumeInShou >= 100000000) return `${(volumeInShou / 100000000).toFixed(2)}亿手`;
        if (volumeInShou >= 10000) return `${(volumeInShou / 10000).toFixed(2)}万手`;
        return `${volumeInShou.toFixed(0)}手`;
    }

    function formatTurnoverAmount(amountInWanYuan) {
        if (amountInWanYuan >= 10000) return `${(amountInWanYuan / 10000).toFixed(2)}亿`;
        return `${amountInWanYuan.toFixed(0)}万`;
    }

    function renderStockList(stocks, startIndex) {
        if (stocks.length === 0 && allStockData.length > 0) {
            showError('没有满足筛选条件的股票');
            stockListContainer.innerHTML = '';
            document.getElementById('stock-list-container').classList.add('hidden');
            return;
        }

        const fragment = document.createDocumentFragment();
        stocks.forEach((stock, index) => {
            const colorClass = stock.changePercent > 0 ? 'stock-up' : (stock.changePercent < 0 ? 'stock-down' : 'stock-flat');
            const sign = stock.changePercent > 0 ? '+' : '';
            const item = document.createElement('div');
            item.className = 'stock-item';
            item.dataset.stockCode = `${stock.market}${stock.code}`;
            item.dataset.stockName = stock.name;

            const seq = startIndex + index + 1;

            item.innerHTML = `
                <!-- Desktop View: A single grid row -->
                <div class="desktop-view-grid">
                    <div class="text-center text-gray-500 text-sm">${seq}</div>
                    <div class="text-left">
                        <div class="stock-name">${stock.name}</div>
                        <div class="stock-code">${stock.market.toUpperCase()}${stock.code}</div>
                    </div>
                    <div class="text-right ${colorClass} font-medium">${stock.price.toFixed(2)}</div>
                    <div class="text-right ${colorClass} font-bold">${sign}${stock.changePercent.toFixed(2)}%</div>
                    <div class="text-right">${stock.turnover.toFixed(2)}%</div>
                    <div class="text-right">${formatVolume(stock.volume)}</div>
                    <div class="text-right">${formatTurnoverAmount(stock.turnoverAmount)}</div>
                </div>

                <!-- Mobile View: A compact card -->
                <div class="mobile-view-card">
                    <div class="mobile-main-info">
                        <div>
                            <div class="stock-name">${stock.name}</div>
                            <div class="stock-code">${stock.market.toUpperCase()}${stock.code}</div>
                        </div>
                        <div class="text-right ${colorClass}">
                            <div class="font-medium text-lg">${stock.price.toFixed(2)}</div>
                            <div class="font-bold">${sign}${stock.changePercent.toFixed(2)}%</div>
                        </div>
                    </div>
                    <div class="mobile-secondary-info">
                        <div class="info-pair"><span class="info-label">换手率</span><span class="info-value">${stock.turnover.toFixed(2)}%</span></div>
                        <div class="info-pair"><span class="info-label">成交量</span><span class="info-value">${formatVolume(stock.volume)}</span></div>
                        <div class="info-pair"><span class="info-label">成交额</span><span class="info-value">${formatTurnoverAmount(stock.turnoverAmount)}</span></div>
                    </div>
                </div>
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
        const pageInfo = document.createElement('span');
        pageInfo.className = 'text-sm font-medium text-gray-600';
        pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页 (共 ${filteredStockData.length} 项)`;
        const prevButton = document.createElement('button');
        prevButton.innerHTML = `&larr; 上一页`;
        prevButton.className = 'pagination-btn';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderPage(); } });
        const nextButton = document.createElement('button');
        nextButton.innerHTML = `下一页 &rarr;`;
        nextButton.className = 'pagination-btn';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderPage(); } });
        paginationControls.appendChild(prevButton);
        paginationControls.appendChild(pageInfo);
        paginationControls.appendChild(nextButton);
    }

    // --- Chart Modal Functions ---
    function initModal() {
        modalCloseBtn.addEventListener('click', closeStockChartModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeStockChartModal(); });
        stockListContainer.addEventListener('click', (e) => {
            const stockItem = e.target.closest('.stock-item');
            if (stockItem) {
                openStockChartModal(stockItem.dataset.stockCode, stockItem.dataset.stockName);
            }
        });
        chartTimeRangeContainer.addEventListener('click', (e) => {
            if (e.target.matches('.time-range-btn')) {
                chartTimeRangeContainer.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                updateChart(currentChartStockCode, e.target.dataset.range);
            }
        });
    }

    function openStockChartModal(stockCode, stockName) {
        currentChartStockCode = stockCode;
        chartStockName.textContent = `${stockName} (${stockCode.toUpperCase()})`;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        const currentActive = chartTimeRangeContainer.querySelector('.active');
        if (currentActive) currentActive.classList.remove('active');
        chartTimeRangeContainer.querySelector('[data-range="intraday"]').classList.add('active');
        updateChart(stockCode, 'intraday');
    }

    function closeStockChartModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        if (stockChart) { stockChart.destroy(); stockChart = null; }
    }

    async function updateChart(stockCode, range) {
        chartLoader.classList.remove('hidden');
        try {
            const data = await fetchChartData(stockCode, range);
            renderChart(data, range);
        } catch (error) {
            console.error(`Failed to update chart for ${stockCode}, range ${range}:`, error);
            if (stockChart) stockChart.destroy();
            const ctx = chartCanvas.getContext('2d');
            ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
            Object.assign(ctx, { textAlign: 'center', fillStyle: '#f87171', font: '16px Inter' });
            ctx.fillText(`加载图表数据失败 (${error.message})`, chartCanvas.width / 2, chartCanvas.height / 2);
        } finally {
            chartLoader.classList.add('hidden');
        }
    }

    async function fetchChartData(stockCode, range) {
        if (range === 'intraday') {
            const url = `https://web.ifzq.gtimg.cn/appstock/app/minute/query?code=${stockCode}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`请求失败: ${response.status}`);
            const result = await response.json();
            const intradayData = result?.data?.[stockCode]?.data?.data;
            if (!intradayData?.length) return { labels: [], values: [] };
            const datePrefix = new Date().toISOString().split('T')[0];
            return {
                labels: intradayData.map(d => `${datePrefix} ${d.split(' ')[0].replace(/(\d{2})(\d{2})/, '$1:$2')}`),
                values: intradayData.map(d => parseFloat(d.split(' ')[1])),
            };
        }
        let klt;
        switch (range) {
            case 'daily': klt = 101; break; case 'weekly': klt = 102; break;
            case 'monthly': klt = 103; break; case 'quarterly': klt = 104; break;
            case 'yearly': klt = 105; break; default: klt = 101;
        }
        const marketCode = stockCode.startsWith('sh') ? '1' : '0';
        const secid = `${marketCode}.${stockCode.substring(2)}`;
        const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&ut=fa5fd1943c7b386f172d6893dbfba10b&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55&klt=${klt}&fqt=1&end=20500101&lmt=1000`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);
        const result = await response.json();
        const klines = result?.data?.klines;
        if (!klines?.length) return { labels: [], values: [] };
        return {
            labels: klines.map(d => d.split(',')[0]),
            values: klines.map(d => parseFloat(d.split(',')[2])),
        };
    }

    function renderChart({ labels, values }, range) {
        if (stockChart) stockChart.destroy();
        const ctx = chartCanvas.getContext('2d');
        if (!values?.length) {
            ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
            Object.assign(ctx, { textAlign: 'center', fillStyle: '#9ca3af', font: '16px Inter' });
            ctx.fillText('该时间段无可用数据', chartCanvas.width / 2, chartCanvas.height / 2);
            return;
        }
        const isUp = values[values.length - 1] >= values[0];
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, isUp ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)');
        gradient.addColorStop(1, isUp ? 'rgba(239, 68, 68, 0)' : 'rgba(34, 197, 94, 0)');
        const borderColor = isUp ? '#ef4444' : '#22c55e';
        stockChart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ data: values, borderColor, borderWidth: 2, pointRadius: 0, tension: range === 'intraday' ? 0.1 : 0, fill: true, backgroundColor: gradient }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: (tooltipItems) => {
                                const date = new Date(tooltipItems[0].parsed.x);
                                if (range === 'intraday') {
                                    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
                                }
                                return date.toLocaleDateString('zh-CN');
                            },
                            label: ctx => `价格: ${ctx.parsed.y.toFixed(2)}`
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            parser: 'yyyy-MM-dd HH:mm',
                            unit: range === 'intraday' ? 'minute' : 'day',
                            displayFormats: {
                                minute: 'HH:mm',
                                hour: 'HH:mm',
                                day: 'yyyy-MM-dd'
                            }
                        },
                        grid: { display: false },
                        ticks: {
                            display: true,
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 7
                        }
                    },
                    y: {
                        position: 'right',
                        grid: { color: '#f3f4f6' },
                        ticks: { callback: v => v.toFixed(2) }
                    }
                },
                interaction: { mode: 'index', intersect: false }
            }
        });
    }

    // --- UI & Utility Functions ---
    function showLoading(message) {
        stockListContainer.innerHTML = '';
        document.getElementById('stock-list-container').classList.add('hidden');
        paginationControls.innerHTML = '';
        statusMessage.classList.remove('hidden');
        statusMessage.innerHTML = `<div class="loader"></div><p class="mt-4">${message}</p>`;
    }

    function showError(message) {
        stockListContainer.innerHTML = '';
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
        return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); };
    }

    // --- Event Listeners ---
    const debouncedRender = debounce(() => applyFiltersAndRender({ source: 'user' }), 400);
    allFilterInputs.forEach(input => input.addEventListener('input', debouncedRender));
    searchInput.addEventListener('input', debouncedRender);
    sortBySelect.addEventListener('change', () => applyFiltersAndRender({ source: 'user' }));

    // --- Initial Load ---
    init();
});

