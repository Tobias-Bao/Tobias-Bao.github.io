var map = L.map('map').setView([51.505, -0.09], 13);

var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var currentLocationMarker;

// 添加定位按钮
L.Control.Locate = L.Control.extend({
    onAdd: function(map) {
        var btn = L.DomUtil.create('button', 'leaflet-control-locate leaflet-bar');
        btn.innerHTML = '<i class="fas fa-crosshairs"></i>'; // 使用 Font Awesome 图标
        L.DomEvent.on(btn, 'click', function() {
            map.locate({setView: true, maxZoom: 16});
        });
        return btn;
    },
    onRemove: function(map) {
        // Nothing to do here
    }
});

L.control.locate = function(opts) {
    return new L.Control.Locate(opts);
}

L.control.locate({position: 'bottomright'}).addTo(map);

// 定位事件处理
map.on('locationfound', function(e) {
    if (currentLocationMarker) {
        map.removeLayer(currentLocationMarker);
    }
    currentLocationMarker = L.marker(e.latlng).addTo(map)
        .bindPopup('您在这里').openPopup();
});

map.on('locationerror', function(e) {
    alert(e.message);
});

document.getElementById('search-button').addEventListener('click', function() {
    var query = document.getElementById('search-input').value;
    if (query) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    var latlng = [data[0].lat, data[0].lon];
                    map.setView(latlng, 13);
                    if (currentLocationMarker) {
                        map.removeLayer(currentLocationMarker);
                    }
                    currentLocationMarker = L.marker(latlng).addTo(map)
                        .bindPopup(query).openPopup();
                } else {
                    alert('未找到结果');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('搜索出错');
            });
    }
});

function showSuggestions() {
    var query = document.getElementById('search-input').value;
    if (query) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
            .then(response => response.json())
            .then(data => {
                var suggestions = document.getElementById('suggestions');
                suggestions.innerHTML = '';
                if (data && data.length > 0) {
                    data.forEach(item => {
                        var suggestion = document.createElement('div');
                        suggestion.textContent = item.display_name;
                        suggestion.addEventListener('click', function() {
                            var latlng = [item.lat, item.lon];
                            map.setView(latlng, 13);
                            if (currentLocationMarker) {
                                map.removeLayer(currentLocationMarker);
                            }
                            currentLocationMarker = L.marker(latlng).addTo(map)
                                .bindPopup(item.display_name).openPopup();
                            suggestions.style.display = 'none';
                        });
                        suggestions.appendChild(suggestion);
                    });
                    suggestions.style.display = 'block';
                } else {
                    suggestions.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    } else {
        document.getElementById('suggestions').style.display = 'none';
    }
}

function showMap() {
    document.getElementById('map-container').style.display = 'block';
    document.getElementById('search-container').style.display = 'flex';
}

function showWeather() {
    document.getElementById('map-container').style.display = 'none';
    document.getElementById('search-container').style.display = 'none';
}
