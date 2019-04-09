var h3,geojson2h3;
var h3Granularity = 10;
mapboxgl.accessToken = 'pk.eyJ1IjoiYW1vbG53IiwiYSI6ImNqdGY4ZjlqNjFxZDkzeW9iczE4MWg4MGEifQ.YpUeahTCDxjUq84pSDGeNw';

var config = ({
  lng: -74.0111266,
  lat: 40.7051088,
  zoom: 14,
  fillOpacity: 0.6,
  colorScale: ['#913e03', '#f7bb83', '#fae7d4'],
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

function normalizeLayer(layer, baseAtZero = false) {
  const h3Index = h3.geoToH3(config.lat, config.lng, h3Granularity);
  const nearbyh3 = h3.kRing(h3Index, 3);
  const newlayer = {};
  const hexagons = Object.keys(layer);
  // Pass one, get max
  const max = hexagons.reduce((max, hex) => Math.max(max, layer[hex]), -Infinity);
  const min = baseAtZero ? hexagons.reduce((min, hex) => Math.min(min, layer[hex]), Infinity) : 0;
  // Pass two, normalize
  hexagons.forEach(hex => {
    if (nearbyh3.includes(hex)) {
      newlayer[hex] = (layer[hex] - min) / (max - min); 
    }
  });
  return newlayer;
}

function renderHexes(map, hexagons) {
  
  // Transform the current hexagon map into a GeoJSON object
  const geojson = geojson2h3.h3SetToFeatureCollection(
    Object.keys(hexagons),
    hex => ({value: hexagons[hex]})
  );
  
  const sourceId = 'h3-hexes';
  const layerId = `${sourceId}-layer`;
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
      [0, config.colorScale[0]],
      [0.5, config.colorScale[1]],
      [1, config.colorScale[2]]
    ]
  });
  
  map.setPaintProperty(layerId, 'fill-opacity', config.fillOpacity);
}

function collisionLayer(collision) {
  const layer = {};
  collision.forEach(({lat, lng}) => {
    const h3Index = h3.geoToH3(lat, lng, h3Granularity);
    layer[h3Index] = (layer[h3Index] || 0) + 1;
  });
  return normalizeLayer(layer);
}

d3.json("https://gist.githubusercontent.com/amolnw/2568755aa04b916485b820690c47c198/raw/12edde611daeeb9bac053e82b0e1d8a686f8eb9a/CollisionVehicles.json").then(function(data) {
	console.log(collisionLayer(data));
	renderHexes(map, collisionLayer(data));
});





