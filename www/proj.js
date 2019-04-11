var h3, geojson2h3, fetchedData;
var h3Granularity = 10;
mapboxgl.accessToken = 'pk.eyJ1IjoiYW1vbG53IiwiYSI6ImNqdGY4ZjlqNjFxZDkzeW9iczE4MWg4MGEifQ.YpUeahTCDxjUq84pSDGeNw';

var pickupEndpoint = 'https://wurd78n85k.execute-api.us-east-1.amazonaws.com/test'
var proxyUrl = 'https://cors-anywhere.herokuapp.com/'
var today = new Date();
var hourOfDay = today.getHours()
var dayOfWeek = today.getDay()

const sourceId = 'h3-hexes';
const layerId = `${sourceId}-layer`;

var config = ({
  lng: -74.0111266,
  lat: 40.7051088,
  zoom: 14,
  fillOpacity: 0.6,
  //colorScale: ['#913e03', '#f7bb83', '#fae7d4'],
  colorScale: ['#0010E5','#3300E1','#7500DD','#B400D9','#D500BA','#D20078','#CE0038','#CA0500','#C64100','#C27A00','#BFB000'], 
  areaThreshold: 0.75
});

var map = new mapboxgl.Map({
  container: 'map',
  center: [
	config.lng,
	config.lat,
  ],
  zoom: config.zoom,
  // style: 'mapbox://styles/mapbox/streets-v10'
  style: 'mapbox://styles/mapbox/light-v9'
});

require(['h3-js'], function (h3loaded) {
	h3 = h3loaded
});

require(['geojson2h3'], function (geojson2h3loaded) {
	geojson2h3 = geojson2h3loaded
});

var request = JSON.stringify({weekday: dayOfWeekAsString(dayOfWeek), hour:hourOfDay})

postData(proxyUrl + pickupEndpoint, request)
  .then(data => renderHexes(map, collisionLayer(data)) )
  .catch(error => console.error(error));

async function postData(url, request) {
    let response  = await fetch(url, {
        method: "POST", 
        headers: {
            "Content-Type": "application/json"
        },
        body: request, 
    });
    let responseData = await response.json();
	return responseData;
}

function dayOfWeekAsString(dayIndex) {
  return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][dayIndex-1];
}

function normalizeLayer(layer, baseAtZero = false) {
  const h3Index = h3.geoToH3(config.lat, config.lng, h3Granularity);
  const nearbyh3 = h3.kRing(h3Index, 3);
  const newlayer = {};
  var filtered = Object.fromEntries(Object.entries(layer).filter(([k,v]) => nearbyh3.includes(k)));
  const hexagons = Object.keys(filtered);
  // Pass one, get max
  const max = hexagons.reduce((max, hex) => Math.max(max, layer[hex]), -Infinity);
  const min = baseAtZero ? hexagons.reduce((min, hex) => Math.min(min, layer[hex]), Infinity) : 0;
  
  //console.log(max, min)
  // Pass two, normalize
  hexagons.forEach(hex => {
    //if (nearbyh3.includes(hex)) {
      newlayer[hex] = (layer[hex] - min) / (max - min);
	  //console.log(layer[hex], newlayer[hex]);
    //}
  });
  //console.log(layer);
  //console.log(newlayer);
  return newlayer;
}

function renderHexes(map, hexagons) {
  // Transform the current hexagon map into a GeoJSON object
  const geojson = geojson2h3.h3SetToFeatureCollection(
    Object.keys(hexagons),
    hex => ({value: hexagons[hex]})
  );
  let source = map.getSource(sourceId);
  
  // Add the source and layer if we haven't created them yet
  if (!source) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson
    });
	map.addLayer({
      id: layerId,
      source: sourceId,
      type: 'fill',
      interactive: false,
      paint: {
        'fill-outline-color': 'rgba(0,0,0,0)',
      }
    });
    source = map.getSource(sourceId);
  }

  // Update the geojson data
  source.setData(geojson);
  
  // Update the layer paint properties, using the current config values
  map.setPaintProperty(layerId, 'fill-color', {
    property: 'value',
    stops: [
      //[0, config.colorScale[0]],
      //[0.5, config.colorScale[1]],
      //[1, config.colorScale[2]]
	  [0, config.colorScale[0]],
      [0.1, config.colorScale[1]],
      [0.2, config.colorScale[2]],
	  [0.3, config.colorScale[3]],
      [0.4, config.colorScale[4]],
      [0.5, config.colorScale[5]],
	  [0.6, config.colorScale[6]],
      [0.7, config.colorScale[7]],
      [0.8, config.colorScale[8]],
	  [0.9, config.colorScale[9]],
	  [1, config.colorScale[10]]
    ]
  });
  
  map.setPaintProperty(layerId, 'fill-opacity', config.fillOpacity);
}

// create the popup
var popup = new mapboxgl.Popup({ offset: 25 })
.setText('New York City to be filled');

// add markers to map

var marker = new mapboxgl.Marker({
draggable: true
})
.setLngLat([config.lng,config.lat])
.setPopup(popup) // sets a popup on this marker
.addTo(map);
 
function onDragEnd() {
var lngLat = marker.getLngLat();
coordinates.style.display = 'block';
coordinates.innerHTML = 'Longitude: ' + lngLat.lng + '<br />Latitude: ' + lngLat.lat;
}
 
marker.on('dragend', onDragEnd);


function collisionLayer(collision) {
  const layer = {};
  collision.forEach(({latitude, longitude, pickup_count}) => {
    const h3Index = h3.geoToH3(latitude, longitude, h3Granularity);
    layer[h3Index] = (layer[h3Index] || 0) + pickup_count;
  });
  fetchedData = normalizeLayer(layer);
  return fetchedData;
}

function handlePickups() {
  var checkBox = document.getElementById("pickup");
  if (checkBox.checked == true){
	console.log("Checked");  
	map.setLayoutProperty(layerId, 'visibility', 'visible');
	//renderHexes(map, fetchedData);
  } else {
    map.setLayoutProperty(layerId, 'visibility', 'none');
  }
} 



