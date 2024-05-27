const apiKey = 'c7ed3f19cf5a63a30e51b89e'; // 替换为你的 ExchangeRate-API API 密钥
const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/`;

document.getElementById('convertButton').addEventListener('click', function() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const amount = document.getElementById('amount').value;

    fetch(`${apiUrl}${fromCurrency}`)
        .then(response => response.json())
        .then(data => {
            const rate = data.conversion_rates[toCurrency];
            const result = amount * rate;
            document.getElementById('result').value = result.toFixed(4);
            document.getElementById('rate').innerText = `当前汇率: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
        })
        .catch(error => {
            console.error('Error fetching exchange rate:', error);
        });
});

document.getElementById('switchButton').addEventListener('click', function() {
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');

    const tempCurrency = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = tempCurrency;

    document.getElementById('amount').value = '';
    document.getElementById('result').value = '';
    document.getElementById('rate').innerText = '';
});
