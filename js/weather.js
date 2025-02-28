// Wettervorhersage-Funktionalität
const weatherApiKey = '4d8fb5b93d4af21d66a2948710284366'; // API-Schlüssel für OpenWeatherMap
const weatherApiUrl = 'https://api.openweathermap.org/data/2.5/';

// Mehrsprachige Städteliste für Autovervollständigung
// Format: [Name auf Deutsch, Name auf Chinesisch, Name auf Englisch]
const citiesList = [
    ["Berlin", "柏林", "Berlin"],
    ["München", "慕尼黑", "Munich"],
    ["Hamburg", "汉堡", "Hamburg"],
    ["Frankfurt", "法兰克福", "Frankfurt"],
    ["Köln", "科隆", "Cologne"],
    ["Düsseldorf", "杜塞尔多夫", "Dusseldorf"],
    ["Stuttgart", "斯图加特", "Stuttgart"],
    ["Leipzig", "莱比锡", "Leipzig"],
    ["Dresden", "德累斯顿", "Dresden"],
    ["Hannover", "汉诺威", "Hanover"],
    ["Nürnberg", "纽伦堡", "Nuremberg"],
    ["Peking", "北京", "Beijing"],
    ["Shanghai", "上海", "Shanghai"],
    ["Guangzhou", "广州", "Guangzhou"],
    ["Shenzhen", "深圳", "Shenzhen"],
    ["Hongkong", "香港", "Hong Kong"],
    ["Chengdu", "成都", "Chengdu"],
    ["Wuhan", "武汉", "Wuhan"],
    ["Tianjin", "天津", "Tianjin"],
    ["Xi'an", "西安", "Xi'an"],
    ["Chongqing", "重庆", "Chongqing"],
    ["New York", "纽约", "New York"],
    ["Los Angeles", "洛杉矶", "Los Angeles"],
    ["Chicago", "芝加哥", "Chicago"],
    ["Houston", "休斯顿", "Houston"],
    ["Phoenix", "凤凰城", "Phoenix"],
    ["Philadelphia", "费城", "Philadelphia"],
    ["San Antonio", "圣安东尼奥", "San Antonio"],
    ["San Diego", "圣地亚哥", "San Diego"],
    ["Dallas", "达拉斯", "Dallas"],
    ["San Jose", "圣何塞", "San Jose"],
    ["London", "伦敦", "London"],
    ["Paris", "巴黎", "Paris"],
    ["Rom", "罗马", "Rome"],
    ["Madrid", "马德里", "Madrid"],
    ["Amsterdam", "阿姆斯特丹", "Amsterdam"],
    ["Brüssel", "布鲁塞尔", "Brussels"],
    ["Wien", "维也纳", "Vienna"],
    ["Lissabon", "里斯本", "Lisbon"],
    ["Athen", "雅典", "Athens"],
    ["Stockholm", "斯德哥尔摩", "Stockholm"],
    ["Oslo", "奥斯陆", "Oslo"],
    ["Kopenhagen", "哥本哈根", "Copenhagen"],
    ["Helsinki", "赫尔辛基", "Helsinki"],
    ["Warschau", "华沙", "Warsaw"],
    ["Prag", "布拉格", "Prague"],
    ["Budapest", "布达佩斯", "Budapest"],
    ["Tokio", "东京", "Tokyo"],
    ["Seoul", "首尔", "Seoul"],
    ["Bangkok", "曼谷", "Bangkok"],
    ["Singapur", "新加坡", "Singapore"]
];

// Zwischenspeicher für API-Ergebnisse
const cityCache = {};

/**
 * Initialisiert die Wettervorhersage-Seite
 */
function initWeather() {
    // Initialisiert die Autovervollständigung
    initAutocomplete();
    
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
 * Initialisiert die Autovervollständigung für die Städtesuche
 */
function initAutocomplete() {
    const cityInput = document.getElementById('cityInput');
    
    // Erstellt Container für die Autovervollständigung
    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.className = 'autocomplete-container';
    cityInput.parentNode.insertBefore(autocompleteContainer, cityInput.nextSibling);
    
    // Verschiebt das Eingabefeld in den Container
    autocompleteContainer.appendChild(cityInput);
    
    // Erstellt die Liste für Vorschläge
    const autocompleteList = document.createElement('div');
    autocompleteList.className = 'autocomplete-list';
    autocompleteList.id = 'autocompleteList';
    autocompleteContainer.appendChild(autocompleteList);
    
    // 添加滚轮事件监听器，确保只滚动联想栏而不是整个页面
    autocompleteList.addEventListener('wheel', function(e) {
        // 阻止事件冒泡和默认行为
        e.stopPropagation();
        e.preventDefault();
        
        // 手动滚动联想栏
        this.scrollTop += e.deltaY;
    }, { passive: false });
    
    // Event-Listener für Eingabeänderungen
    cityInput.addEventListener('input', function() {
        updateAutocomplete(this.value);
    });
    
    // Event-Listener für Fokus
    cityInput.addEventListener('focus', function() {
        if (this.value.length > 0) {
            updateAutocomplete(this.value);
        }
    });
    
    // Event-Listener für Klicks außerhalb
    document.addEventListener('click', function(e) {
        if (!autocompleteContainer.contains(e.target)) {
            autocompleteList.style.display = 'none';
            // Zeigt die Wetterinfos wieder an
            const weatherInfo = document.querySelector('.weather-info');
            if (weatherInfo) {
                weatherInfo.style.display = 'block';
            }
        }
    });
    
    // Event-Listener für Tastaturnavigation
    cityInput.addEventListener('keydown', function(e) {
        const list = document.getElementById('autocompleteList');
        const items = list.getElementsByClassName('autocomplete-item');
        let selectedIndex = -1;
        
        // Findet den aktuell ausgewählten Index
        for (let i = 0; i < items.length; i++) {
            if (items[i].classList.contains('selected')) {
                selectedIndex = i;
                break;
            }
        }
        
        // Pfeil nach unten
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (list.style.display === 'none') {
                updateAutocomplete(this.value);
                return;
            }
            
            if (selectedIndex < items.length - 1) {
                if (selectedIndex >= 0) {
                    items[selectedIndex].classList.remove('selected');
                }
                items[selectedIndex + 1].classList.add('selected');
                items[selectedIndex + 1].scrollIntoView({ block: 'nearest' });
            }
        }
        // Pfeil nach oben
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (list.style.display === 'none') {
                return;
            }
            
            if (selectedIndex > 0) {
                items[selectedIndex].classList.remove('selected');
                items[selectedIndex - 1].classList.add('selected');
                items[selectedIndex - 1].scrollIntoView({ block: 'nearest' });
            }
        }
        // Enter-Taste
        else if (e.key === 'Enter') {
            if (list.style.display !== 'none' && selectedIndex >= 0) {
                e.preventDefault();
                this.value = items[selectedIndex].getAttribute('data-value');
                list.style.display = 'none';
                
                // Zeigt die Wetterinfos wieder an
                const weatherInfo = document.querySelector('.weather-info');
                if (weatherInfo) {
                    weatherInfo.style.display = 'block';
                }
                
                searchWeather();
            }
        }
        // Escape-Taste
        else if (e.key === 'Escape') {
            list.style.display = 'none';
            
            // Zeigt die Wetterinfos wieder an
            const weatherInfo = document.querySelector('.weather-info');
            if (weatherInfo) {
                weatherInfo.style.display = 'block';
            }
        }
    });
}

/**
 * Aktualisiert die Autovervollständigungsliste basierend auf der Eingabe
 */
function updateAutocomplete(input) {
    const list = document.getElementById('autocompleteList');
    const weatherInfo = document.querySelector('.weather-info');
    
    // Leert die Liste
    list.innerHTML = '';
    
    if (!input || input.trim() === '') {
        list.style.display = 'none';
        
        // Zeigt die Wetterinfos wieder an
        if (weatherInfo) {
            weatherInfo.style.display = 'block';
        }
        
        return;
    }
    
    const trimmedInput = input.trim().toLowerCase();
    
    // Zuerst lokale Suche in der vordefinierten Liste
    const localMatches = findMatchingCitiesLocal(trimmedInput);
    
    // Zeigt lokale Übereinstimmungen an
    if (localMatches.length > 0) {
        displayCityMatches(localMatches, list);
        list.style.display = 'block';
        
        // Versteckt nur die Wetterinfos
        if (weatherInfo) {
            weatherInfo.style.display = 'none';
        }
    }
    
    // Wenn die Eingabe mindestens 3 Zeichen hat, suche auch über die API
    if (trimmedInput.length >= 3) {
        // Prüft, ob das Ergebnis bereits im Cache ist
        if (cityCache[trimmedInput]) {
            const apiMatches = cityCache[trimmedInput];
            if (apiMatches.length > 0) {
                // Fügt eine Trennlinie hinzu, wenn es bereits lokale Ergebnisse gibt
                if (localMatches.length > 0) {
                    const divider = document.createElement('div');
                    divider.className = 'autocomplete-divider';
                    divider.textContent = 'Online-Ergebnisse';
                    list.appendChild(divider);
                }
                
                displayCityMatches(apiMatches, list);
                list.style.display = 'block';
                
                // Versteckt nur die Wetterinfos
                if (weatherInfo) {
                    weatherInfo.style.display = 'none';
                }
            }
        } else {
            // Sucht über die API
            searchCitiesAPI(trimmedInput, list, localMatches.length > 0);
        }
    }
    
    // Wenn keine Übereinstimmungen gefunden wurden, verstecke die Liste
    if (list.children.length === 0) {
        list.style.display = 'none';
        
        // Zeigt die Wetterinfos wieder an
        if (weatherInfo) {
            weatherInfo.style.display = 'block';
        }
    }
}

/**
 * Findet Städte in der lokalen Liste, die mit der Eingabe übereinstimmen
 */
function findMatchingCitiesLocal(input) {
    return citiesList.filter(city => {
        // Sucht in allen Sprachversionen
        return city[0].toLowerCase().includes(input) || // Deutsch
               city[1].includes(input) || // Chinesisch
               city[2].toLowerCase().includes(input);  // Englisch
    }).slice(0, 5); // Begrenzt auf 5 Ergebnisse
}

/**
 * Sucht Städte über die OpenWeatherMap Geocoding API
 */
function searchCitiesAPI(input, list, hasLocalMatches) {
    // Geocoding API-Endpunkt
    const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(input)}&limit=5&appid=${weatherApiKey}`;
    
    fetch(geocodingUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('API-Anfrage fehlgeschlagen');
            }
            return response.json();
        })
        .then(data => {
            // Formatiert die API-Ergebnisse
            const apiMatches = data.map(city => {
                const name = city.local_names?.de || city.name;
                const chineseName = city.local_names?.zh || city.name;
                const englishName = city.local_names?.en || city.name;
                return [
                    `${name}${city.state ? ', ' + city.state : ''}, ${city.country}`,
                    chineseName,
                    englishName
                ];
            });
            
            // Speichert die Ergebnisse im Cache
            cityCache[input] = apiMatches;
            
            // Wenn es API-Ergebnisse gibt und die Liste noch angezeigt wird
            if (apiMatches.length > 0 && list.style.display !== 'none') {
                // Fügt eine Trennlinie hinzu, wenn es bereits lokale Ergebnisse gibt
                if (hasLocalMatches) {
                    const divider = document.createElement('div');
                    divider.className = 'autocomplete-divider';
                    divider.textContent = 'Online-Ergebnisse';
                    list.appendChild(divider);
                }
                
                displayCityMatches(apiMatches, list);
                list.style.display = 'block';
                
                // Versteckt nur die Wetterinfos
                const weatherInfo = document.querySelector('.weather-info');
                if (weatherInfo) {
                    weatherInfo.style.display = 'none';
                }
            }
        })
        .catch(error => {
            console.error('Fehler bei der API-Anfrage:', error);
        });
}

/**
 * Zeigt die gefundenen Städte in der Autovervollständigungsliste an
 */
function displayCityMatches(matches, list) {
    matches.forEach(city => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.setAttribute('data-value', city[0]); // Deutscher Name als Wert
        
        // Zeigt alle Sprachversionen an
        item.innerHTML = `${city[0]} <small>(${city[1]})</small>`;
        
        // Event-Listener für Klick
        item.addEventListener('click', function() {
            document.getElementById('cityInput').value = this.getAttribute('data-value');
            list.style.display = 'none';
            
            // Zeigt die Wetterinfos wieder an
            const weatherInfo = document.querySelector('.weather-info');
            if (weatherInfo) {
                weatherInfo.style.display = 'block';
            }
            
            searchWeather();
        });
        
        list.appendChild(item);
    });
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
    
    // Versteckt die Autovervollständigungsliste und entfernt den Fokus vom Eingabefeld
    document.getElementById('autocompleteList').style.display = 'none';
    cityInput.blur();
    
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
    
    // Fügt Wetteranimation hinzu
    addWeatherAnimation(data.weather[0].id, '.current-weather');
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
        
        // Fügt Wetteranimation für die Vorhersage hinzu
        addWeatherAnimation(forecast.weather[0].id, forecastItem);
        
        forecastContainer.appendChild(forecastItem);
    });
}

/**
 * Fügt basierend auf dem Wettercode eine Animation hinzu
 */
function addWeatherAnimation(weatherId, container) {
    // Entfernt vorhandene Animationen
    if (typeof container === 'string') {
        const containerElement = document.querySelector(container);
        const existingAnimation = containerElement.querySelector('.weather-animation');
        if (existingAnimation) {
            existingAnimation.remove();
        }
    } else {
        const existingAnimation = container.querySelector('.weather-animation');
        if (existingAnimation) {
            existingAnimation.remove();
        }
    }
    
    // Erstellt neuen Animationscontainer
    const animationContainer = document.createElement('div');
    animationContainer.className = 'weather-animation';
    
    // Wählt Animation basierend auf Wettercode
    // Wettercode-Referenz: https://openweathermap.org/weather-conditions
    
    // Klarer Himmel
    if (weatherId === 800) {
        const sun = document.createElement('div');
        sun.className = 'sun';
        animationContainer.appendChild(sun);
    }
    // Leicht bewölkt
    else if (weatherId === 801) {
        const sun = document.createElement('div');
        sun.className = 'sun';
        animationContainer.appendChild(sun);
        
        const cloud = document.createElement('div');
        cloud.className = 'cloud cloud-1';
        animationContainer.appendChild(cloud);
    }
    // Bewölkt
    else if (weatherId >= 802 && weatherId <= 804) {
        for (let i = 1; i <= 3; i++) {
            const cloud = document.createElement('div');
            cloud.className = `cloud cloud-${i}`;
            animationContainer.appendChild(cloud);
        }
    }
    // Regen
    else if ((weatherId >= 300 && weatherId <= 321) || (weatherId >= 500 && weatherId <= 531)) {
        // Wolken
        for (let i = 1; i <= 2; i++) {
            const cloud = document.createElement('div');
            cloud.className = `cloud cloud-${i}`;
            animationContainer.appendChild(cloud);
        }
        
        // Regentropfen
        for (let i = 0; i < 20; i++) {
            const raindrop = document.createElement('div');
            raindrop.className = 'raindrop';
            raindrop.style.left = `${Math.random() * 100}%`;
            raindrop.style.animationDuration = `${0.5 + Math.random() * 1}s`;
            raindrop.style.animationDelay = `${Math.random() * 2}s`;
            raindrop.style.height = `${20 + Math.random() * 30}px`;
            animationContainer.appendChild(raindrop);
        }
    }
    // Schnee
    else if (weatherId >= 600 && weatherId <= 622) {
        // Wolken
        for (let i = 1; i <= 2; i++) {
            const cloud = document.createElement('div');
            cloud.className = `cloud cloud-${i}`;
            animationContainer.appendChild(cloud);
        }
        
        // Schneeflocken
        for (let i = 0; i < 30; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.style.left = `${Math.random() * 100}%`;
            snowflake.style.animationDuration = `${3 + Math.random() * 5}s`;
            snowflake.style.animationDelay = `${Math.random() * 3}s`;
            snowflake.style.width = `${3 + Math.random() * 5}px`;
            snowflake.style.height = snowflake.style.width;
            animationContainer.appendChild(snowflake);
        }
    }
    // Gewitter
    else if (weatherId >= 200 && weatherId <= 232) {
        // Wolken
        for (let i = 1; i <= 3; i++) {
            const cloud = document.createElement('div');
            cloud.className = `cloud cloud-${i}`;
            cloud.style.background = 'rgba(100, 100, 100, 0.8)';
            animationContainer.appendChild(cloud);
        }
        
        // Blitz
        const lightning = document.createElement('div');
        lightning.className = 'lightning';
        animationContainer.appendChild(lightning);
        
        // Regentropfen
        for (let i = 0; i < 15; i++) {
            const raindrop = document.createElement('div');
            raindrop.className = 'raindrop';
            raindrop.style.left = `${Math.random() * 100}%`;
            raindrop.style.animationDuration = `${0.5 + Math.random() * 1}s`;
            raindrop.style.animationDelay = `${Math.random() * 2}s`;
            raindrop.style.height = `${20 + Math.random() * 30}px`;
            animationContainer.appendChild(raindrop);
        }
    }
    // Nebel, Dunst
    else if (weatherId >= 701 && weatherId <= 781) {
        const fog = document.createElement('div');
        fog.className = 'fog';
        animationContainer.appendChild(fog);
    }
    
    // Fügt Animation zum Container hinzu
    if (typeof container === 'string') {
        document.querySelector(container).appendChild(animationContainer);
    } else {
        container.appendChild(animationContainer);
    }
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
 * Zeigt oder versteckt die Ladeanimation
 */
function showLoader(show) {
    const loader = document.getElementById('weatherLoader');
    if (loader) {
        loader.style.display = show ? 'block' : 'none';
    }
}

/**
 * Zeigt eine Fehlermeldung an
 */
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

/**
 * Versteckt die Fehlermeldung
 */
function hideError() {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

/**
 * Großschreibt den ersten Buchstaben eines Strings
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialisiert die Wettervorhersage-Seite, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', initWeather);
