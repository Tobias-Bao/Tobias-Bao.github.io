document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const diceElement = document.getElementById('dice');
    const rollButton = document.getElementById('roll-button');
    const historyList = document.getElementById('history-list');
    const clearHistoryButton = document.getElementById('clear-history-button');
    const noHistoryMessage = document.getElementById('no-history');

    // State
    let history = [];
    const HISTORY_KEY = 'diceRollerHistory';
    let isRolling = false;

    // --- Core Functions ---

    function rollDice() {
        if (isRolling) return;
        isRolling = true;
        rollButton.disabled = true;

        // Add rolling animation
        diceElement.classList.add('rolling');

        // Generate a random number between 1 and 6
        const result = Math.floor(Math.random() * 6) + 1;

        // Wait for the animation to be noticeable before showing the result
        setTimeout(() => {
            // Update dice face
            diceElement.className = 'dice'; // Reset classes
            diceElement.classList.add(`face-${result}`);

            // Add to history
            addToHistory(result);

            // Remove rolling animation class after it's done
            setTimeout(() => {
                diceElement.classList.remove('rolling');
                isRolling = false;
                rollButton.disabled = false;
            }, 500);

        }, 350);
    }

    function addToHistory(result) {
        const now = new Date();
        const timestamp = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const historyItem = { result, timestamp };

        // Add to the beginning of the array
        history.unshift(historyItem);

        // Keep history limited to a reasonable number (e.g., 50)
        if (history.length > 50) {
            history.pop();
        }

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
        // Clear current list
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

                li.innerHTML = `
                    <span class="font-bold text-lg text-emerald-600">点数: ${item.result}</span>
                    <span class="text-sm text-gray-500">${item.timestamp}</span>
                `;

                historyList.appendChild(li);
            });
        }
    }

    // --- Event Listeners ---
    rollButton.addEventListener('click', rollDice);
    clearHistoryButton.addEventListener('click', clearHistory);

    // --- Initial Load ---
    loadHistory();
});
