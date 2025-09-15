document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const diceCountSelect = document.getElementById('dice-count');
    const resultText = document.getElementById('result-text');
    const rollButton = document.getElementById('roll-button');
    const historyList = document.getElementById('history-list');
    const clearHistoryButton = document.getElementById('clear-history-button');
    const noHistoryMessage = document.getElementById('no-history');

    // State
    let history = [];
    const HISTORY_KEY = 'diceRollerHistory';

    // --- Core Functions ---

    function rollDice() {
        const count = parseInt(diceCountSelect.value, 10);
        resultText.classList.remove('opacity-50');

        if (isNaN(count) || count <= 0) {
            return;
        }

        const results = [];
        let total = 0;

        for (let i = 0; i < count; i++) {
            const result = Math.floor(Math.random() * 6) + 1;
            results.push(result);
            total += result;
        }

        // Display results directly
        const resultsString = results.join(' , ');
        if (count > 1) {
            resultText.innerHTML = `<span class="block text-4xl tracking-widest">${resultsString}</span><span class="block text-xl text-gray-500 mt-2">总点数: ${total}</span>`;
        } else {
            resultText.textContent = resultsString;
        }

        addToHistory(results, total);
    }

    function addToHistory(results, total) {
        const now = new Date();
        const timestamp = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const historyItem = { results, total, timestamp };

        history.unshift(historyItem);
        if (history.length > 50) history.pop();

        saveHistory();
        renderHistory();
    }

    function clearHistory() {
        history = [];
        saveHistory();
        renderHistory();
    }

    // --- Persistence ---

    function saveHistory() {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }



    function loadHistory() {
        const storedHistory = localStorage.getItem(HISTORY_KEY);
        if (storedHistory) {
            history = JSON.parse(storedHistory);
        }
        renderHistory();
    }

    // --- UI Update Functions ---

    function renderHistory() {
        historyList.innerHTML = '';

        if (history.length === 0) {
            noHistoryMessage.classList.remove('hidden');
            clearHistoryButton.classList.add('opacity-50', 'cursor-not-allowed');
            clearHistoryButton.disabled = true;
        } else {
            noHistoryMessage.classList.add('hidden');
            clearHistoryButton.classList.remove('opacity-50', 'cursor-not-allowed');
            clearHistoryButton.disabled = false;

            history.forEach(item => {
                const li = document.createElement('li');
                li.className = 'history-item';

                const resultsText = `点数: ${item.results.join(', ')}`;
                const totalText = item.results.length > 1 ? ` (总计: ${item.total})` : '';

                li.innerHTML = `
                    <span class="font-bold text-lg text-sky-600">${resultsText}${totalText}</span>
                    <span class="text-sm text-gray-500">${item.timestamp}</span>
                `;

                historyList.appendChild(li);
            });
        }
    }

    function setInitialState() {
        resultText.textContent = `点击按钮开始`;
        resultText.classList.add('opacity-50');
    }

    // --- Event Listeners ---
    rollButton.addEventListener('click', rollDice);
    clearHistoryButton.addEventListener('click', clearHistory);

    // --- Initial Load ---
    loadHistory();
    setInitialState();
});

