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

// Historische Daten für das Diagramm (simuliert)
let historicalData = {};

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
    
    // Fügt Diagramm-Toggle hinzu
    addChartToggle();
    
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
            
            // Simuliert historische Daten für das Diagramm
            generateHistoricalData(fromCurrency, toCurrency, rate);
            
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
 * Generiert simulierte historische Daten für das Diagramm
 */
function generateHistoricalData(fromCurrency, toCurrency, currentRate) {
    const key = `${fromCurrency}-${toCurrency}`;
    
    // Erstellt simulierte Daten, falls sie noch nicht existieren
    if (!historicalData[key]) {
        const baseRate = currentRate;
        const dates = [];
        const rates = [];
        
        // Generiert Daten für die letzten 7 Tage
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
            
            // Simuliert leichte Schwankungen im Wechselkurs
            const randomFactor = 0.98 + Math.random() * 0.04; // ±2%
            rates.push(baseRate * randomFactor);
        }
        
        historicalData[key] = {
            dates,
            rates
        };
    }
    
    // Aktualisiert das Diagramm, falls es sichtbar ist
    if (document.querySelector('.chart-container').style.display !== 'none') {
        updateChart(fromCurrency, toCurrency);
    }
}

/**
 * Fügt den Diagramm-Toggle hinzu
 */
function addChartToggle() {
    // Erstellt den Diagramm-Container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.style.display = 'none'; // Standardmäßig ausgeblendet
    chartContainer.style.height = '300px'; // Feste Höhe für das Diagramm
    document.querySelector('.rate').after(chartContainer);
    
    // Erstellt den Diagramm-Toggle-Button
    const chartToggle = document.createElement('button');
    chartToggle.className = 'chart-toggle';
    chartToggle.innerHTML = '<i class="fas fa-chart-line"></i> Historische Daten anzeigen';
    chartContainer.before(chartToggle);
    
    // Erstellt das Canvas-Element für das Diagramm
    const canvas = document.createElement('canvas');
    canvas.id = 'rateChart';
    chartContainer.appendChild(canvas);
    
    // Lädt Chart.js direkt
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = function() {
        console.log('Chart.js wurde geladen');
        
        // Event-Listener für den Toggle erst nach dem Laden von Chart.js
        chartToggle.addEventListener('click', function() {
            const isVisible = chartContainer.style.display === 'block';
            chartContainer.style.display = isVisible ? 'none' : 'block';
            
            // Ändert den Button-Text
            this.innerHTML = isVisible ? 
                '<i class="fas fa-chart-line"></i> Historische Daten anzeigen' : 
                '<i class="fas fa-chart-line"></i> Historische Daten ausblenden';
            
            // Aktualisiert das Diagramm, wenn es angezeigt wird
            if (!isVisible) {
                const fromCurrency = document.getElementById('fromCurrency').value;
                const toCurrency = document.getElementById('toCurrency').value;
                updateChart(fromCurrency, toCurrency);
            }
        });
    };
    document.head.appendChild(script);
}

/**
 * Aktualisiert das Diagramm mit historischen Daten
 */
function updateChart(fromCurrency, toCurrency) {
    const key = `${fromCurrency}-${toCurrency}`;
    const data = historicalData[key];
    
    if (!data || typeof Chart === 'undefined') {
        console.error('Chart.js nicht geladen oder keine Daten verfügbar');
        return;
    }
    
    try {
        // Zerstört das vorhandene Diagramm, falls es existiert
        if (window.rateChart) {
            window.rateChart.destroy();
        }
        
        // Erstellt das neue Diagramm
        const canvas = document.getElementById('rateChart');
        const ctx = canvas.getContext('2d');
        
        // Stellt sicher, dass das Canvas sichtbar ist
        canvas.style.display = 'block';
        
        window.rateChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dates,
                datasets: [{
                    label: `${fromCurrency} zu ${toCurrency}`,
                    data: data.rates,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Rate: ${context.raw.toFixed(4)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                },
                animation: {
                    duration: 1000 // Animation für bessere Sichtbarkeit
                }
            }
        });
        
        console.log('Diagramm wurde aktualisiert');
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Diagramms:', error);
    }
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
