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
