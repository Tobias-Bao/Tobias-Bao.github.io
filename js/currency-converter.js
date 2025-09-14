const fromCurrencySelect = document.getElementById('from-currency');
const toCurrencySelect = document.getElementById('to-currency');
const amountInput = document.getElementById('amount');
const resultDiv = document.getElementById('result');
const lastUpdatedP = document.getElementById('last-updated');
const swapButton = document.getElementById('swap-button');

const API_URL = 'https://open.er-api.com/v6/latest/';

let rates = {};

// 定义一个主要货币列表
const majorCurrencies = [
    "USD", "EUR", "JPY", "GBP", "CNY", "AUD", "CAD", "CHF", "HKD", "SGD", 
    "NZD", "KRW", "TWD", "THB", "MYR", "PHP", "IDR", "INR", "RUB", "BRL", 
    "ZAR", "TRY", "SEK", "NOK", "DKK", "PLN", "HUF", "CZK", "ILS", "MXN"
];

// 货币代码到中文名称的映射
const currencyNames = {
    "AED": "阿联酋迪拉姆",
    "AFN": "阿富汗尼",
    "ALL": "阿尔巴尼亚列克",
    "AMD": "亚美尼亚德拉姆",
    "ANG": "荷属安的列斯盾",
    "AOA": "安哥拉宽扎",
    "ARS": "阿根廷比索",
    "AUD": "澳元",
    "AWG": "阿鲁巴弗罗林",
    "AZN": "阿塞拜疆马纳特",
    "BAM": "波斯尼亚可兑换马克",
    "BBD": "巴巴多斯元",
    "BDT": "孟加拉塔卡",
    "BGN": "保加利亚列弗",
    "BHD": "巴林第纳尔",
    "BIF": "布隆迪法郎",
    "BMD": "百慕大元",
    "BND": "文莱元",
    "BOB": "玻利维亚诺",
    "BRL": "巴西雷亚尔",
    "BSD": "巴哈马元",
    "BTN": "不丹努尔特鲁姆",
    "BWP": "博茨瓦纳普拉",
    "BYN": "白俄罗斯卢布",
    "BZD": "伯利兹元",
    "CAD": "加元",
    "CDF": "刚果法郎",
    "CHF": "瑞士法郎",
    "CLP": "智利比索",
    "CNY": "人民币",
    "COP": "哥伦比亚比索",
    "CRC": "哥斯达黎加科朗",
    "CUP": "古巴比索",
    "CVE": "佛得角埃斯库多",
    "CZK": "捷克克朗",
    "DJF": "吉布提法郎",
    "DKK": "丹麦克朗",
    "DOP": "多米尼加比索",
    "DZD": "阿尔及利亚第纳尔",
    "EGP": "埃及镑",
    "ERN": "厄立特里亚纳克法",
    "ETB": "埃塞俄比亚比尔",
    "EUR": "欧元",
    "FJD": "斐济元",
    "FKP": "福克兰群岛镑",
    "FOK": "法罗群岛克朗",
    "GBP": "英镑",
    "GEL": "格鲁吉亚拉里",
    "GGP": "根西岛镑",
    "GHS": "加纳塞地",
    "GIP": "直布罗陀镑",
    "GMD": "冈比亚达拉西",
    "GNF": "几内亚法郎",
    "GTQ": "危地马拉格查尔",
    "GYD": "圭亚那元",
    "HKD": "港币",
    "HNL": "洪都拉斯伦皮拉",
    "HRK": "克罗地亚库纳",
    "HTG": "海地古德",
    "HUF": "匈牙利福林",
    "IDR": "印尼盾",
    "ILS": "以色列新谢克尔",
    "IMP": "马恩岛镑",
    "INR": "印度卢比",
    "IQD": "伊拉克第纳尔",
    "IRR": "伊朗里亚尔",
    "ISK": "冰岛克朗",
    "JEP": "泽西岛镑",
    "JMD": "牙买加元",
    "JOD": "约旦第纳尔",
    "JPY": "日元",
    "KES": "肯尼亚先令",
    "KGS": "吉尔吉斯斯坦索姆",
    "KHR": "柬埔寨瑞尔",
    "KID": "基里巴斯元",
    "KMF": "科摩罗法郎",
    "KRW": "韩元",
    "KWD": "科威特第纳尔",
    "KYD": "开曼群岛元",
    "KZT": "哈萨克斯坦坚戈",
    "LAK": "老挝基普",
    "LBP": "黎巴嫩镑",
    "LKR": "斯里兰卡卢比",
    "LRD": "利比里亚元",
    "LSL": "莱索托洛蒂",
    "LYD": "利比亚第纳尔",
    "MAD": "摩洛哥迪拉姆",
    "MDL": "摩尔多瓦列伊",
    "MGA": "马达加斯加阿里亚里",
    "MKD": "北马其顿代纳尔",
    "MMK": "缅甸元",
    "MNT": "蒙古图格里克",
    "MOP": "澳门元",
    "MRU": "毛里塔尼亚乌吉亚",
    "MUR": "毛里求斯卢比",
    "MVR": "马尔代夫拉菲亚",
    "MWK": "马拉维克瓦查",
    "MXN": "墨西哥比索",
    "MYR": "马来西亚林吉特",
    "MZN": "莫桑比克梅蒂卡尔",
    "NAD": "纳米比亚元",
    "NGN": "尼日利亚奈拉",
    "NIO": "尼加拉瓜科多巴",
    "NOK": "挪威克朗",
    "NPR": "尼泊尔卢比",
    "NZD": "新西兰元",
    "OMR": "阿曼里亚尔",
    "PAB": "巴拿马巴波亚",
    "PEN": "秘鲁索尔",
    "PGK": "巴布亚新几内亚基那",
    "PHP": "菲律宾比索",
    "PKR": "巴基斯坦卢比",
    "PLN": "波兰兹罗提",
    "PYG": "巴拉圭瓜拉尼",
    "QAR": "卡塔尔里亚尔",
    "RON": "罗马尼亚列伊",
    "RSD": "塞尔维亚第纳尔",
    "RUB": "俄罗斯卢布",
    "RWF": "卢旺达法郎",
    "SAR": "沙特里亚尔",
    "SBD": "所罗门群岛元",
    "SCR": "塞舌尔卢比",
    "SDG": "苏丹镑",
    "SEK": "瑞典克朗",
    "SGD": "新加坡元",
    "SHP": "圣赫勒拿镑",
    "SLE": "塞拉利昂利昂",
    "SLL": "塞拉利昂利昂",
    "SOS": "索马里先令",
    "SRD": "苏里南元",
    "SSP": "南苏丹镑",
    "STN": "圣多美和普林西比多布拉",
    "SYP": "叙利亚镑",
    "SZL": "斯威士兰里朗吉尼",
    "THB": "泰铢",
    "TJS": "塔吉克斯坦索莫尼",
    "TMT": "土库曼斯坦马纳特",
    "TND": "突尼斯第纳尔",
    "TOP": "汤加潘加",
    "TRY": "土耳其里拉",
    "TTD": "特立尼达和多巴哥元",
    "TVD": "图瓦卢元",
    "TWD": "新台币",
    "TZS": "坦桑尼亚先令",
    "UAH": "乌克兰格里夫纳",
    "UGX": "乌干达先令",
    "USD": "美元",
    "UYU": "乌拉圭比索",
    "UZS": "乌兹别克斯坦索姆",
    "VES": "委内瑞拉玻利瓦尔",
    "VND": "越南盾",
    "VUV": "瓦努阿图瓦图",
    "WST": "萨摩亚塔拉",
    "XAF": "中非金融合作法郎",
    "XCD": "东加勒比元",
    "XDR": "特别提款权",
    "XOF": "西非金融合作法郎",
    "XPF": "太平洋法郎",
    "YER": "也门里亚尔",
    "ZAR": "南非兰特",
    "ZMW": "赞比亚克瓦查",
    "ZWL": "津巴布韦元"
};

// 辅助函数：根据货币代码获取显示名称
const getCurrencyDisplayName = (code) => {
    return currencyNames[code] ? `${currencyNames[code]} (${code})` : code;
};


// 显示加载状态
function showLoading() {
    resultDiv.innerHTML = '<div class="loader"></div>';
    resultDiv.classList.add('loading');
    lastUpdatedP.textContent = '';
}

// 隐藏加载状态
function hideLoading() {
    resultDiv.classList.remove('loading');
}


// 获取汇率并填充选择框
async function fetchRatesAndPopulate() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}EUR`); // 以EUR为基础获取所有汇率
        if (!response.ok) {
            throw new Error('网络响应错误');
        }
        const data = await response.json();
        if (data.result === 'error') {
            throw new Error(`API错误: ${data['error-type']}`);
        }
        
        rates = data.rates;
        const currencies = Object.keys(rates);

        // 记住当前选择的货币
        const currentFrom = fromCurrencySelect.value || 'EUR';
        const currentTo = toCurrencySelect.value || 'CNY';

        populateCurrencyOptions(currencies);
        
        // 恢复之前的选择
        fromCurrencySelect.value = currencies.includes(currentFrom) ? currentFrom : 'EUR';
        toCurrencySelect.value = currencies.includes(currentTo) ? currentTo : 'CNY';

        updateLastUpdated(data.time_last_update_unix);
        hideLoading();
        convertCurrency();

    } catch (error) {
        hideLoading();
        resultDiv.innerHTML = `<span class="text-red-500">加载汇率失败: ${error.message}</span>`;
        console.error('获取汇率时出错:', error);
    }
}

// 填充货币下拉菜单
function populateCurrencyOptions(currencies) {
    fromCurrencySelect.innerHTML = '';
    toCurrencySelect.innerHTML = '';
    
    // 从主要货币列表中筛选出API实际支持的货币
    const availableMajorCurrencies = majorCurrencies.filter(code => currencies.includes(code));

    // 创建一个包含名称和代码的数组，然后排序
    const sortedCurrencies = availableMajorCurrencies
        .map(code => ({ code, name: getCurrencyDisplayName(code) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans'));

    sortedCurrencies.forEach(currency => {
        const option1 = new Option(currency.name, currency.code);
        const option2 = new Option(currency.name, currency.code);
        fromCurrencySelect.add(option1);
        toCurrencySelect.add(option2);
    });
}


// 执行转换
function convertCurrency() {
    // 如果仍在加载中，则不执行
    if (resultDiv.classList.contains('loading')) return;

    const amount = parseFloat(amountInput.value);
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;

    if (isNaN(amount) || !fromCurrency || !toCurrency || !rates[fromCurrency] || !rates[toCurrency]) {
        resultDiv.innerHTML = '<span>请输入有效信息。</span>';
        return;
    }

    const result = (amount / rates[fromCurrency]) * rates[toCurrency];

    const fromCurrencyName = currencyNames[fromCurrency] || fromCurrency;
    const toCurrencyName = currencyNames[toCurrency] || toCurrency;
    
    // 使用 'en-US' 区域设置来确保千位分隔符是逗号(,)，小数点是句点(.)
    const formattedAmount = amount.toLocaleString('en-US');
    const formattedResult = result.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });

    const fromText = `<span class="text-gray-600">${formattedAmount} ${fromCurrencyName}</span>`;
    const toText = `<span class="result-value text-indigo-600">${formattedResult} ${toCurrencyName}</span>`;
    
    resultDiv.innerHTML = `${fromText}<span class="text-gray-600 mx-2">=</span>${toText}`;
}

// 更新“最后更新时间”
function updateLastUpdated(timestamp) {
    const date = new Date(timestamp * 1000);
    lastUpdatedP.textContent = `更新于: ${date.toLocaleString()}`;
}

// 交换货币
function swapCurrencies() {
    const temp = fromCurrencySelect.value;
    fromCurrencySelect.value = toCurrencySelect.value;
    toCurrencySelect.value = temp;
    convertCurrency();
}

// 事件监听器
amountInput.addEventListener('input', convertCurrency);
fromCurrencySelect.addEventListener('change', convertCurrency);
toCurrencySelect.addEventListener('change', convertCurrency);
swapButton.addEventListener('click', swapCurrencies);

// 初始加载
fetchRatesAndPopulate();

// 每5分钟自动刷新一次汇率
setInterval(fetchRatesAndPopulate, 5 * 60 * 1000);