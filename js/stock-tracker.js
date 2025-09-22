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
    const chartContainer = document.getElementById('stock-chart');

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
            // 获取所有A股代码
            const response = await fetch(`https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeDataNew?page=1&num=8000&sort=symbol&asc=1&node=hs_a&symbol=&_s_r_a=page`);
            const data = await response.json();
            if (data && Array.isArray(data)) {
                allMarketStockCodes = data.map(item => item.symbol);
            }
            fetchStockData();
            // 每5秒刷新一次数据
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
        // 使用腾讯财经接口批量获取数据
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
            if (parts.length < 50) return null;

            const marketInfo = parts[0];
            let market = 'sz';
            if (marketInfo.includes('sh')) market = 'sh';
            else if (marketInfo.includes('bj')) market = 'bj';

            return {
                code: parts[2],
                name: parts[1].trim(),
                price: parseFloat(parts[3]),
                changePercent: parseFloat(parts[32]),
                volume: parseFloat(parts[6]), // 成交量 (手)
                turnover: parseFloat(parts[38]), // 换手率 (%)
                turnoverAmount: parseFloat(parts[37]), // 成交额 (万)
                pe: parseFloat(parts[39]), // 市盈率
                marketCap: parseFloat(parts[45]), // 总市值 (亿)
                market: market
            };
        }).filter(s => s && s.price > 0 && s.marketCap > 0);
    }

    function applyFiltersAndRender({ preserveScroll = false, source = 'user' } = {}) {
        if (source === 'user') currentPage = 1;

        if (allStockData.length > 0) {
            hideMessage();
        }

        const searchTerm = searchInput.value.trim().toLowerCase();

        // Updated filters object, removing PE and MarketCap
        const filters = {
            price: { min: parseFloat(document.getElementById('price-min').value) || 0, max: parseFloat(document.getElementById('price-max').value) || Infinity },
            changePercent: { min: parseFloat(document.getElementById('changePercent-min').value) || -Infinity, max: parseFloat(document.getElementById('changePercent-max').value) || Infinity },
            turnover: { min: parseFloat(document.getElementById('turnover-min').value) || 0, max: parseFloat(document.getElementById('turnover-max').value) || Infinity },
        };

        filteredStockData = allStockData.filter(stock => {
            const matchesSearch = searchTerm === '' || stock.name.toLowerCase().includes(searchTerm) || stock.code.includes(searchTerm);
            // Updated filtering logic
            const matchesFilters = Object.keys(filters).every(key => {
                return stock[key] >= filters[key].min && stock[key] <= filters[key].max;
            });
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

        if (pageItems.length === 0 && (searchInput.value.trim().length > 0 || allFilterInputs.some(i => i.value !== ''))) {
            showError('没有满足筛选条件的股票');
        }

        renderStockList(pageItems, startIndex);
        renderPagination(totalPages);

        if (preserveScroll) window.scrollTo({ top: scrollY, behavior: 'instant' });
    }

    // --- Formatters ---
    const formatters = {
        volume: (v) => v >= 10000 ? `${(v / 10000).toFixed(2)}万手` : `${v.toFixed(0)}手`,
        turnoverAmount: (v) => v >= 10000 ? `${(v / 10000).toFixed(2)}亿` : `${v.toFixed(0)}万`,
        marketCap: (v) => v >= 10000 ? `${(v / 10000).toFixed(2)}万亿` : `${v.toFixed(0)}亿`,
        pe: (v) => v > 0 ? v.toFixed(2) : '亏损'
    };

    function renderStockList(stocks, startIndex) {
        if (stocks.length === 0 && allStockData.length > 0) {
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
                <!-- Desktop View -->
                <div class="desktop-view-grid">
                    <div class="text-center text-gray-500 text-sm">${seq}</div>
                    <div class="text-left">
                        <div class="stock-name">${stock.name}</div>
                        <div class="stock-code">${stock.market.toUpperCase()}${stock.code}</div>
                    </div>
                    <div class="text-right ${colorClass} font-medium">${stock.price.toFixed(2)}</div>
                    <div class="text-right ${colorClass} font-bold">${sign}${stock.changePercent.toFixed(2)}%</div>
                    <div class="text-right">${stock.turnover.toFixed(2)}%</div>
                    <div class="text-right">${formatters.pe(stock.pe)}</div>
                    <div class="text-right">${formatters.volume(stock.volume)}</div>
                    <div class="text-right">${formatters.turnoverAmount(stock.turnoverAmount)}</div>
                    <div class="text-right">${formatters.marketCap(stock.marketCap)}</div>
                </div>

                <!-- Mobile View (Updated) -->
                <div class="mobile-view-card">
                    <div class="mobile-main-info">
                        <div>
                            <div class="stock-name">${stock.name}</div>
                            <div class="stock-code">${stock.market.toUpperCase()}${stock.code}</div>
                        </div>
                        <div class="text-right">
                            <div class="info-label text-right">最新价</div>
                            <div class="${colorClass} font-medium text-lg">${stock.price.toFixed(2)}</div>
                        </div>
                         <div class="text-right">
                            <div class="info-label text-right">涨跌幅</div>
                            <div class="${colorClass} font-medium text-lg">${sign}${stock.changePercent.toFixed(2)}%</div>
                        </div>
                    </div>
                    <div class="mobile-secondary-info">
                        <div class="info-pair"><span class="info-label">换手率</span><span class="info-value">${stock.turnover.toFixed(2)}%</span></div>
                        <div class="info-pair"><span class="info-label">成交量</span><span class="info-value">${formatters.volume(stock.volume)}</span></div>
                        <div class="info-pair"><span class="info-label">成交额</span><span class="info-value">${formatters.turnoverAmount(stock.turnoverAmount)}</span></div>
                        <div class="info-pair"><span class="info-label">市盈率</span><span class="info-value">${formatters.pe(stock.pe)}</span></div>
                        <div class="info-pair"><span class="info-label">总市值</span><span class="info-value">${formatters.marketCap(stock.marketCap)}</span></div>
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
        prevButton.innerHTML = `<i data-lucide="arrow-left" class="h-4 w-4 mr-1"></i> 上一页`;
        prevButton.className = 'pagination-btn';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderPage(); } });
        const nextButton = document.createElement('button');
        nextButton.innerHTML = `下一页 <i data-lucide="arrow-right" class="h-4 w-4 ml-1"></i>`;
        nextButton.className = 'pagination-btn';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderPage(); } });
        paginationControls.appendChild(prevButton);
        paginationControls.appendChild(pageInfo);
        paginationControls.appendChild(nextButton);
        lucide.createIcons();
    }

    // --- Chart Modal Functions ---
    function initModal() {
        if (chartContainer) {
            stockChart = echarts.init(chartContainer);
            window.addEventListener('resize', () => {
                if (stockChart) {
                    stockChart.resize();
                }
            });
        }
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
        // Delay resize to ensure modal is fully rendered
        setTimeout(() => {
            if (stockChart) stockChart.resize();
        }, 50);
        updateChart(stockCode, 'intraday');
    }

    function closeStockChartModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        if (stockChart) stockChart.clear();
    }

    async function updateChart(stockCode, range) {
        chartLoader.classList.remove('hidden');
        if (stockChart) stockChart.clear();
        try {
            const data = await fetchChartData(stockCode, range);
            renderChart(data, range);
        } catch (error) {
            console.error(`Failed to update chart for ${stockCode}, range ${range}:`, error);
            if (stockChart) {
                stockChart.setOption({
                    title: {
                        show: true, text: '图表数据加载失败', left: 'center', top: 'center', textStyle: { color: '#ef4444' }
                    }
                });
            }
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
            const datePrefix = result?.data?.[stockCode]?.data?.date;
            if (!datePrefix) return { labels: [], values: [] };

            const formattedDate = `${datePrefix.slice(0, 4)}-${datePrefix.slice(4, 6)}-${datePrefix.slice(6, 8)}`;

            return {
                labels: intradayData.map(d => `${formattedDate} ${d.split(' ')[0].replace(/(\d{2})(\d{2})/, '$1:$2')}`),
                values: intradayData.map(d => parseFloat(d.split(' ')[1])),
                volumes: intradayData.map(d => parseFloat(d.split(' ')[2])),
                preclose: parseFloat(result?.data?.[stockCode]?.qt?.[stockCode]?.[4])
            };
        }

        let klt;
        switch (range) {
            case 'daily': klt = 101; break; case 'weekly': klt = 102; break; case 'monthly': klt = 103; break; default: klt = 101;
        }
        const marketCode = stockCode.startsWith('sh') ? '1' : '0';
        const secid = `${marketCode}.${stockCode.substring(2)}`;
        const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&ut=fa5fd1943c7b386f172d6893dbfba10b&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58&klt=${klt}&fqt=1&end=20500101&lmt=1000`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);
        const result = await response.json();
        const klines = result?.data?.klines;
        if (!klines?.length) return { dates: [], values: [] };

        return {
            dates: klines.map(d => d.split(',')[0]),
            // [open, close, low, high]
            values: klines.map(d => [parseFloat(d.split(',')[1]), parseFloat(d.split(',')[2]), parseFloat(d.split(',')[3]), parseFloat(d.split(',')[4])]),
        };
    }

    function renderChart(data, range) {
        if (!data || (!data.values || data.values.length === 0)) {
            stockChart.setOption({
                title: { show: true, text: '该时间段无可用数据', left: 'center', top: 'center', textStyle: { color: '#6b7280' } }
            });
            return;
        }

        let option;
        if (range === 'intraday') {
            option = getIntradayOption(data);
        } else {
            option = getCandlestickOption(data);
        }

        stockChart.setOption(option, true); // `true` to clear previous options
    }

    // --- Chart Options ---
    function getIntradayOption({ labels, values, preclose }) {
        const color = values[values.length - 1] >= preclose ? '#ef4444' : '#22c55e';
        return {
            tooltip: {
                trigger: 'axis',
                formatter: params => `时间: ${params[0].axisValueLabel.split(' ')[1]}<br/>价格: ${params[0].value.toFixed(2)}`,
                axisPointer: { type: 'cross' }
            },
            grid: { left: '10', right: '50', bottom: '20', top: '10', containLabel: true },
            xAxis: {
                type: 'category', data: labels, axisLabel: { formatter: val => val.split(' ')[1] }
            },
            yAxis: {
                type: 'value', scale: true,
                axisLabel: { formatter: v => v.toFixed(2) },
                splitLine: { lineStyle: { color: '#f3f4f6' } }
            },
            series: [{
                type: 'line', data: values, showSymbol: false, smooth: true,
                lineStyle: { color: color, width: 1.5 },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                        offset: 0, color: color, opacity: 0.3
                    }, {
                        offset: 1, color: color, opacity: 0
                    }])
                },
                markLine: {
                    symbol: 'none', silent: true, data: [{
                        yAxis: preclose, lineStyle: { type: 'dashed', color: '#6b7280' },
                        label: { show: true, position: 'start', formatter: '昨收', color: '#6b7280' }
                    }]
                }
            }]
        };
    }

    function getCandlestickOption({ dates, values }) {
        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                formatter: params => {
                    const data = params[0].data;
                    return `日期: ${params[0].axisValue}<br/>
                             开盘: ${data[1]}<br/>
                             收盘: ${data[2]}<br/>
                             最低: ${data[3]}<br/>
                             最高: ${data[4]}`;
                }
            },
            grid: { left: '10', right: '50', bottom: '20', top: '10', containLabel: true },
            xAxis: { type: 'category', data: dates, },
            yAxis: { scale: true, splitLine: { lineStyle: { color: '#f3f4f6' } } },
            series: [{
                type: 'candlestick',
                data: values.map(item => [item[0], item[1], item[2], item[3]]),
                itemStyle: {
                    color: '#ef4444', color0: '#22c55e',
                    borderColor: '#ef4444', borderColor0: '#22c55e'
                }
            }]
        };
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
        lastUpdated.textContent = `最后更新: ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`;
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

