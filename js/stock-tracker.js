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
    let stockCodes = [];
    let updateInterval;
    let currentPage = 1;
    const itemsPerPage = 20;
    let stockChart = null;
    let currentChartStockCode = null;

    // --- Main Functions ---
    async function init() {
        showLoading('正在获取所有A股代码...');
        try {
            const response = await fetch(`https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeDataNew?page=1&num=5000&sort=symbol&asc=1&node=hs_a&symbol=&_s_r_a=page`);
            const data = await response.json();
            if (data && Array.isArray(data)) {
                stockCodes = data.map(item => item.symbol);
            }

            statusMessage.textContent = `成功获取 ${stockCodes.length} 支A股代码`;
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
            if (isInitialLoad) showError('更新数据失败，请检查网络连接');
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
            if (parts.length < 40) return null;
            return {
                code: parts[2],
                name: parts[1].trim(),
                price: parseFloat(parts[3]),
                changePercent: parseFloat(parts[32]),
                volume: parseFloat(parts[6]) / 100,
                turnover: parseFloat(parts[38]),
                turnoverAmount: parseFloat(parts[37]),
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
            showError('没有满足筛选条件的股票');
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
            item.dataset.stockCode = `${stock.market}${stock.code}`;
            item.dataset.stockName = stock.name;
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

    // --- Chart Modal Functions ---
    function initModal() {
        modalCloseBtn.addEventListener('click', closeStockChartModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeStockChartModal();
        });
        stockListContainer.addEventListener('click', (e) => {
            const stockItem = e.target.closest('.stock-item');
            if (stockItem) {
                const { stockCode, stockName } = stockItem.dataset;
                openStockChartModal(stockCode, stockName);
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
        if (stockChart) {
            stockChart.destroy();
            stockChart = null;
        }
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
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f87171';
            ctx.font = '16px Inter';
            ctx.fillText(`加载图表数据失败 (${error.message})`, chartCanvas.width / 2, chartCanvas.height / 2);
        } finally {
            chartLoader.classList.add('hidden');
        }
    }

    async function fetchChartData(stockCode, range) {
        let url;
        const proxy = 'https://api.allorigins.win/raw?url=';
        let originalUrl;

        switch (range) {
            case '7d':
                originalUrl = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${stockCode}&scale=240&ma=no&datalen=7`;
                url = `${proxy}${encodeURIComponent(originalUrl)}`;
                break;
            case '1m':
                originalUrl = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${stockCode}&scale=240&ma=no&datalen=30`;
                url = `${proxy}${encodeURIComponent(originalUrl)}`;
                break;
            case '3m':
                originalUrl = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${stockCode}&scale=240&ma=no&datalen=90`;
                url = `${proxy}${encodeURIComponent(originalUrl)}`;
                break;
            case '1y':
                originalUrl = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${stockCode}&scale=240&ma=no&datalen=365`;
                url = `${proxy}${encodeURIComponent(originalUrl)}`;
                break;
            case 'intraday':
            default:
                url = `https://web.ifzq.gtimg.cn/appstock/app/minute/query?code=${stockCode}`;
                break;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`请求失败，状态码: ${response.status}`);
        }

        let data;
        if (range === 'intraday') {
            const result = await response.json();
            data = result?.data?.[stockCode]?.data?.data;
        } else {
            data = await response.json();
        }

        if (!data || data.length === 0) {
            return { labels: [], values: [] };
        }

        const isDaily = range !== 'intraday';
        if (isDaily) {
            return {
                labels: data.map(d => d.day),
                values: data.map(d => parseFloat(d.close)),
            };
        } else {
            const today = new Date();
            const datePrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            return {
                labels: data.map(d => {
                    const parts = d.split(' ');
                    if (parts.length < 2) return null;
                    const timeStr = parts[0];
                    const hour = timeStr.substring(0, 2);
                    const minute = timeStr.substring(2, 4);
                    return `${datePrefix} ${hour}:${minute}`;
                }).filter(Boolean),
                values: data.map(d => {
                    const parts = d.split(' ');
                    return parts.length < 2 ? null : parseFloat(parts[1]);
                }).filter(v => v !== null),
            };
        }
    }

    function renderChart({ labels, values }, range) {
        if (stockChart) {
            stockChart.destroy();
        }
        const ctx = chartCanvas.getContext('2d');

        if (!values || values.length === 0) {
            ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '16px Inter';
            ctx.fillText('该时间段无可用数据', chartCanvas.width / 2, chartCanvas.height / 2);
            return;
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        const lastValue = values[values.length - 1];
        const firstValue = values[0];
        const isUp = lastValue >= firstValue;

        if (isUp) {
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
        }

        const borderColor = isUp ? '#ef4444' : '#22c55e';

        const timeUnit = range === 'intraday' ? 'hour' : 'day';
        const parser = range === 'intraday' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd';

        const today = new Date();
        const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: (context) => {
                            const date = new Date(context[0].parsed.x);
                            if (timeUnit === 'hour') {
                                return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                            }
                            return date.toLocaleDateString('zh-CN');
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        parser: parser,
                        tooltipFormat: 'yyyy-MM-dd HH:mm',
                        unit: timeUnit,
                        displayFormats: {
                            hour: 'HH:mm',
                            day: 'yy-MM-dd'
                        }
                    },
                    grid: { display: false },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 9 // Increased for more detail
                    }
                },
                y: {
                    position: 'right',
                    grid: {
                        color: '#f3f4f6',
                        borderColor: 'transparent'
                    },
                    ticks: {
                        callback: (value) => value.toFixed(2)
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        };

        if (range === 'intraday') {
            chartOptions.scales.x.min = `${todayDateString} 09:30:00`;
            chartOptions.scales.x.max = `${todayDateString} 15:00:00`;
        }

        stockChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    borderColor: borderColor,
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1,
                    fill: true,
                    backgroundColor: gradient,
                }]
            },
            options: chartOptions
        });
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

