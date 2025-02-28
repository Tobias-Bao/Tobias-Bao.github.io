// Wettervorhersage-Funktionalität
const weatherApiKey = '4d8fb5b93d4af21d66a2948710284366'; // API-Schlüssel für OpenWeatherMap
const weatherApiUrl = 'https://api.openweathermap.org/data/2.5/';

/**
 * Initialisiert die Wettervorhersage-Seite
 */
function initWeather() {
    // Event-Listener für den Suchbutton
    document.getElementById('searchButton').addEventListener('click', searchWeather);
    
    // Event-Listener für die Eingabetaste im Suchfeld
    document.getElementById('cityInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            searchWeather();
        }
    });
    
    // Lädt das Wetter für die Standardstadt, falls vorhanden
    const lastCity = localStorage.getItem('lastWeatherCity');
    if (lastCity) {
        document.getElementById('cityInput').value = lastCity;
        searchWeather();
    }
}

/**
 * Sucht nach dem Wetter für die eingegebene Stadt
 */
function searchWeather() {
    const cityInput = document.getElementById('cityInput');
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('请输入城市名称');
        return;
    }
    
    // Speichert die Stadt für zukünftige Besuche
    localStorage.setItem('lastWeatherCity', city);
    
    // Zeigt Ladeanimation
    showLoader(true);
    hideError();
    
    // Holt das aktuelle Wetter
    fetchCurrentWeather(city);
}

/**
 * Holt das aktuelle Wetter für eine Stadt
 */
function fetchCurrentWeather(city) {
    fetch(`${weatherApiUrl}weather?q=${encodeURIComponent(city)}&units=metric&appid=${weatherApiKey}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(response.status === 404 ? '找不到城市' : '网络错误');
            }
            return response.json();
        })
        .then(data => {
            // Aktualisiert die Wetteranzeige
            updateCurrentWeather(data);
            
            // Holt die 5-Tage-Vorhersage
            return fetch(`${weatherApiUrl}forecast?q=${encodeURIComponent(city)}&units=metric&appid=${weatherApiKey}`);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('获取预报数据时出错');
            }
            return response.json();
        })
        .then(data => {
            // Aktualisiert die Vorhersageanzeige
            updateForecast(data);
            
            // Zeigt die Wetterinformationen an
            document.querySelector('.weather-info').style.display = 'block';
            
            // Versteckt Ladeanimation
            showLoader(false);
        })
        .catch(error => {
            console.error('Fehler beim Abrufen des Wetters:', error);
            showError(error.message || '获取天气数据时出错');
            showLoader(false);
            document.querySelector('.weather-info').style.display = 'none';
        });
}

/**
 * Aktualisiert die Anzeige des aktuellen Wetters
 */
function updateCurrentWeather(data) {
    // Aktualisiert Stadtname
    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    
    // Aktualisiert Datum
    const currentDate = new Date();
    document.getElementById('currentDate').textContent = formatDate(currentDate);
    
    // Aktualisiert Temperatur
    document.getElementById('temperature').textContent = Math.round(data.main.temp);
    
    // Aktualisiert Wetterbeschreibung
    document.getElementById('weatherDescription').textContent = capitalizeFirstLetter(data.weather[0].description);
    
    // Aktualisiert Wettericon
    const weatherIcon = document.querySelector('.weather-icon');
    weatherIcon.innerHTML = `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}">`;
    
    // Aktualisiert Wetterdaten
    document.getElementById('windSpeed').textContent = Math.round(data.wind.speed * 3.6); // Umrechnung von m/s in km/h
    document.getElementById('humidity').textContent = data.main.humidity;
    document.getElementById('pressure').textContent = data.main.pressure;
}

/**
 * Aktualisiert die 5-Tage-Vorhersage
 */
function updateForecast(data) {
    const forecastContainer = document.getElementById('forecast');
    forecastContainer.innerHTML = '';
    
    // Gruppiert die Vorhersagedaten nach Tagen
    const dailyForecasts = groupForecastByDay(data.list);
    
    // Erstellt für jeden Tag ein Vorhersageelement
    dailyForecasts.forEach(forecast => {
        const forecastDate = new Date(forecast.dt * 1000);
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        
        forecastItem.innerHTML = `
            <div class="day">${formatDay(forecastDate)}</div>
            <div class="forecast-icon">
                <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="${forecast.weather[0].description}">
            </div>
            <div class="forecast-temp">${Math.round(forecast.main.temp)}°C</div>
            <div class="forecast-desc">${capitalizeFirstLetter(forecast.weather[0].description)}</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
}

/**
 * Gruppiert die Vorhersagedaten nach Tagen und wählt die Mittagsvorhersage
 */
function groupForecastByDay(forecastList) {
    const dailyForecasts = [];
    const days = {};
    
    // Gruppiert die Vorhersagen nach Tagen
    forecastList.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const day = date.toISOString().split('T')[0];
        
        // Überspringt den aktuellen Tag
        if (date.getDate() === new Date().getDate()) {
            return;
        }
        
        // Speichert die Vorhersage für diesen Tag
        if (!days[day]) {
            days[day] = [];
        }
        
        days[day].push(forecast);
    });
    
    // Wählt für jeden Tag die Vorhersage um 12:00 Uhr aus
    Object.keys(days).forEach(day => {
        // Sucht nach der Vorhersage, die am nächsten zu 12:00 Uhr ist
        let noonForecast = days[day].reduce((closest, forecast) => {
            const forecastHour = new Date(forecast.dt * 1000).getHours();
            const closestHour = new Date(closest.dt * 1000).getHours();
            
            return Math.abs(forecastHour - 12) < Math.abs(closestHour - 12) ? forecast : closest;
        }, days[day][0]);
        
        dailyForecasts.push(noonForecast);
    });
    
    // Begrenzt auf 5 Tage
    return dailyForecasts.slice(0, 5);
}

/**
 * Formatiert das Datum als "Wochentag, Tag Monat Jahr"
 */
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('zh-CN', options);
}

/**
 * Formatiert den Wochentag
 */
function formatDay(date) {
    const options = { weekday: 'short' };
    return date.toLocaleDateString('zh-CN', options);
}

/**
 * Macht den ersten Buchstaben eines Strings groß
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Zeigt oder versteckt die Ladeanimation
 */
function showLoader(show) {
    document.getElementById('weatherLoader').style.display = show ? 'block' : 'none';
}

/**
 * Zeigt eine Fehlermeldung an
 */
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

/**
 * Versteckt die Fehlermeldung
 */
function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

// Initialisiert die Wettervorhersage, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', initWeather);
