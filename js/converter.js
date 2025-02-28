// Währungsumrechner-Funktionalität
// Wir verwenden eine zuverlässigere API ohne Schlüssel
const apiUrl = 'https://open.er-api.com/v6/latest/';

// Währungssymbole
const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'CNY': '¥',
    'JPY': '¥',
    'GBP': '£'
};

/**
 * Initialisiert den Währungsumrechner
 */
function initConverter() {
    // Event-Listener für den Umrechnungsbutton
    document.getElementById('convertButton').addEventListener('click', convertCurrency);
    
    // Event-Listener für den Umschalter
    document.getElementById('switchButton').addEventListener('click', switchCurrencies);
    
    // Event-Listener für automatische Umrechnung bei Änderungen
    document.getElementById('amount').addEventListener('input', debounce(convertCurrency, 500));
    document.getElementById('fromCurrency').addEventListener('change', convertCurrency);
    document.getElementById('toCurrency').addEventListener('change', convertCurrency);
    
    // Fügt Währungssymbole hinzu
    addCurrencySymbols();
    
    // Führt die erste Umrechnung durch
    convertCurrency();
}

/**
 * Führt die Währungsumrechnung durch
 */
function convertCurrency() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const amount = document.getElementById('amount').value;
    
    // Zeigt Ladeanimation
    showLoader(true);
    
    // Holt die Wechselkursdaten
    fetch(`${apiUrl}${fromCurrency}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Netzwerkantwort war nicht ok');
            }
            return response.json();
        })
        .then(data => {
            // Prüft, ob die Daten gültig sind
            if (!data.rates) {
                throw new Error('Ungültiges Datenformat von der API');
            }
            
            const rate = data.rates[toCurrency];
            if (!rate) {
                throw new Error(`Wechselkurs für ${toCurrency} nicht gefunden`);
            }
            
            const result = amount * rate;
            
            // Aktualisiert das Ergebnis mit Animation
            updateResult(result, fromCurrency, toCurrency, rate);
            
            // Versteckt Ladeanimation
            showLoader(false);
        })
        .catch(error => {
            console.error('Fehler beim Abrufen des Wechselkurses:', error);
            document.getElementById('result').value = 'Fehler bei der Umrechnung';
            document.getElementById('rate').innerText = 'Fehler: Bitte versuchen Sie es später erneut';
            
            // Versteckt Ladeanimation
            showLoader(false);
        });
}

/**
 * Aktualisiert das Ergebnisfeld mit Animation
 */
function updateResult(result, fromCurrency, toCurrency, rate) {
    const resultElement = document.getElementById('result');
    const rateElement = document.getElementById('rate');
    
    // Formatiert das Ergebnis mit Währungssymbol
    const formattedResult = `${currencySymbols[toCurrency] || ''} ${result.toFixed(4)}`;
    resultElement.value = formattedResult;
    
    // Zeigt den aktuellen Wechselkurs an
    rateElement.innerHTML = `
        <i class="fas fa-exchange-alt"></i> 
        1 ${fromCurrency} (${currencySymbols[fromCurrency] || ''}) = 
        ${rate.toFixed(4)} ${toCurrency} (${currencySymbols[toCurrency] || ''})
    `;
    
    // Fügt Highlight-Animation hinzu
    resultElement.classList.remove('highlight');
    void resultElement.offsetWidth; // Erzwingt Reflow
    resultElement.classList.add('highlight');
}

/**
 * Wechselt die Währungen
 */
function switchCurrencies() {
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    
    // Fügt Rotationsanimation hinzu
    const switchButton = document.getElementById('switchButton');
    switchButton.classList.add('rotating');
    
    // Tauscht die Währungen
    const tempCurrency = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = tempCurrency;
    
    // Entfernt die Rotationsklasse nach der Animation
    setTimeout(() => {
        switchButton.classList.remove('rotating');
    }, 500);
    
    // Führt die Umrechnung mit den neuen Werten durch
    convertCurrency();
}

/**
 * Fügt Währungssymbole zu den Auswahlfeldern hinzu
 */
function addCurrencySymbols() {
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    
    // Aktualisiert die Optionen mit Währungssymbolen
    [fromCurrency, toCurrency].forEach(select => {
        Array.from(select.options).forEach(option => {
            const currency = option.value;
            const symbol = currencySymbols[currency] || '';
            option.text = `${symbol} ${option.text}`;
        });
    });
}

/**
 * Zeigt oder versteckt die Ladeanimation
 */
function showLoader(show) {
    // Erstellt Ladeanimation, falls sie noch nicht existiert
    let loader = document.querySelector('.loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.className = 'loader';
        document.querySelector('.rate').after(loader);
    }
    
    // Zeigt oder versteckt die Ladeanimation
    loader.style.display = show ? 'block' : 'none';
}

/**
 * Debounce-Funktion zur Begrenzung der Ausführungshäufigkeit
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Initialisiert den Währungsumrechner, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', initConverter);
