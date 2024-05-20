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
