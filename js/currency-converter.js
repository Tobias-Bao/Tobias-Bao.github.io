// 货币转换器
// 使用提供的 API 来获取实时汇率数据
const apiUrl = "https://open.er-api.com/v6/latest/";

/**
 * 初始化货币转换器
 */
function initConverter() {
  // 转换按钮的事件监听器
  document
    .getElementById("convertButton")
    .addEventListener("click", convertCurrency);

  // 切换按钮的事件监听器
  document
    .getElementById("switchButton")
    .addEventListener("click", switchCurrencies);

  // 输入框的事件监听器
  document
    .getElementById("amount")
    .addEventListener("input", debounce(convertCurrency, 500));
  document
    .getElementById("fromCurrency")
    .addEventListener("change", convertCurrency);
  document
    .getElementById("toCurrency")
    .addEventListener("change", convertCurrency);

  // 初始执行一次货币转换
  convertCurrency();
}

/**
 * 执行货币转换
 */
function convertCurrency() {
  const fromCurrency = document.getElementById("fromCurrency").value;
  const toCurrency = document.getElementById("toCurrency").value;
  const amount = document.getElementById("amount").value;

  // 显示加载动画
  showLoader(true);

  // 获取汇率数据
  fetch(`${apiUrl}${fromCurrency}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("网络错误: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      // 检查数据格式
      if (!data.rates) {
        throw new Error("无效的汇率数据");
      }

      const rate = data.rates[toCurrency];
      if (!rate) {
        throw new Error(`无效的汇率: ${fromCurrency} -> ${toCurrency}`);
      }

      const result = amount * rate;

      // 更新结果
      updateResult(result, fromCurrency, toCurrency, rate);

      // 隐藏加载动画
      showLoader(false);
    })
    .catch((error) => {
      console.error("错误:", error);
      document.getElementById("result").value = "错误: 请检查输入";
      document.getElementById("rate").innerText = "错误: 无法获取汇率";

      // 隐藏加载动画
      showLoader(false);
    });
}

/**
 * 更新结果
 */
function updateResult(result, fromCurrency, toCurrency, rate) {
  const resultElement = document.getElementById("result");
  const rateElement = document.getElementById("rate");

  // 格式化结果
  const formattedResult = result.toFixed(4);
  resultElement.value = formattedResult;

  // 更新汇率
  rateElement.innerHTML = `
        <i class="fas fa-exchange-alt"></i> 
        1 ${fromCurrency} = 
        ${rate.toFixed(4)} ${toCurrency}
    `;

  // 添加高亮效果
  resultElement.classList.remove("highlight");
  void resultElement.offsetWidth;
  resultElement.classList.add("highlight");
}

/**
 * 切换货币
 */
function switchCurrencies() {
  const fromCurrency = document.getElementById("fromCurrency");
  const toCurrency = document.getElementById("toCurrency");

  // 添加旋转动画
  const switchButton = document.getElementById("switchButton");
  switchButton.classList.add("rotating");

  // 交换货币
  const tempCurrency = fromCurrency.value;
  fromCurrency.value = toCurrency.value;
  toCurrency.value = tempCurrency;

  // 动画后移除旋转动画
  setTimeout(() => {
    switchButton.classList.remove("rotating");
  }, 500);

  // 执行货币转换
  convertCurrency();
}

/**
 * 显示或隐藏加载动画
 */
function showLoader(show) {
  // 创建或获取加载动画元素
  let loader = document.querySelector(".loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.className = "loader";
    document.querySelector(".rate").after(loader);
  }

  // 显示或隐藏加载动画
  loader.style.display = show ? "block" : "none";
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// 初始化货币转换器
document.addEventListener("DOMContentLoaded", initConverter);
