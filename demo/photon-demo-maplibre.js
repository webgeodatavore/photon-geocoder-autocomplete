// Define the map style (OpenStreetMap raster tiles)
const style = {
  "version": 8,
  "sources": {
    "osm": {
      "type": "raster",
      "tiles": ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      "tileSize": 256,
      "attribution": "&copy; OpenStreetMap Contributors",
      "maxzoom": 19
    }
  },
  "layers": [
    {
      "id": "osm",
      "type": "raster",
      "source": "osm" // This must match the source key above
    }
  ]
};

function AddDomControl(dom) {
  this._dom = dom
}

AddDomControl.prototype.onAdd = function(map) {
  this._map = map;
  this._container = document.createElement('div');
  this._container.className = 'mapboxgl-ctrl photon-geocoder-autocomplete';
  this._container.appendChild(this._dom);
  return this._container;
}
 
AddDomControl.prototype.onRemove = function() {
  this._container.parentNode.removeChild(this._container);
  this._map = undefined;
}


// Initialise the map
const map = new maplibregl.Map({
  container: 'map',
  style: style,
  center: [1, 15],
  zoom: 3
});

// Add the navigation control
map.addControl(new maplibregl.NavigationControl());

// Format result in the search input autocomplete
var formatResult = function(feature, el) {
  var title = document.createElement('strong');
  el.appendChild(title);
  var detailsContainer = document.createElement('small');
  el.appendChild(detailsContainer);
  var details = [];
  title.innerHTML = feature.properties.label || feature.properties.name;
  var types = {
    housenumber: 'numéro',
    street: 'rue',
    locality: 'lieu-dit',
    municipality: 'commune'
  };
  if (types[feature.properties.type]) {
    var spanType = document.createElement('span');
    spanType.className = 'type';
    title.appendChild(spanType);
    spanType.innerHTML = types[feature.properties.type];
  }
  if (feature.properties.city && feature.properties.city !== feature.properties.name) {
    details.push(feature.properties.city);
  }
  if (feature.properties.context) {
    details.push(feature.properties.context);
  }
  detailsContainer.innerHTML = details.join(', ');
};

// Function to show you can do something with the returned elements
function myHandler(featureCollection) {
    console.log(featureCollection);
}

// We reused the default function to center and zoom on selected feature.
// You can make your own. For instance, you could center, zoom
// and add a point on the map
function onSelected(feature) {
  console.log(feature);
  map.setCenter(feature.geometry.coordinates);
  map.setZoom(16);
}

// URL for API
var API_URL = '//api-adresse.data.gouv.fr';

// Create search by adresses component
var container = new Photon.Search({
  resultsHandler: myHandler,
  onSelected: onSelected,
  placeholder: 'Tapez une adresse',
  formatResult: formatResult,
  url: API_URL + '/search/?',
  feedbackEmail: null
});

map.addControl(new AddDomControl(container));
