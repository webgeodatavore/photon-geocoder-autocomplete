// Format result in the search input autocomplete
var formatResult = function (feature, el) {
  var title = document.createElement("strong");
  el.appendChild(title);
  var detailsContainer = document.createElement("small");
  el.appendChild(detailsContainer);
  var details = [];
  title.innerHTML = feature.properties.label || feature.properties.name;
  var types = {
    housenumber: "numéro",
    street: "rue",
    locality: "lieu-dit",
    municipality: "commune",
  };
  if (types[feature.properties.type]) {
    var spanType = document.createElement("span");
    spanType.className = "type";
    title.appendChild(spanType);
    spanType.innerHTML = types[feature.properties.type];
  }
  if (
    feature.properties.city &&
    feature.properties.city !== feature.properties.name
  ) {
    details.push(feature.properties.city);
  }
  if (feature.properties.context) {
    details.push(feature.properties.context);
  }
  detailsContainer.innerHTML = details.join(", ");
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
}

// URL for API
var API_URL = "//api-adresse.data.gouv.fr";

// Create search by adresses component
var container = new Photon.Search({
  resultsHandler: myHandler,
  onSelected: onSelected,
  placeholder: "Tapez une adresse",
  formatResult: formatResult,
  url: API_URL + "/search/?",
  feedbackEmail: null,
});

const element = document.createElement("div");
element.className = "photon-geocoder-autocomplete ol-unselectable ol-control";
element.appendChild(container);
document.body.appendChild(element);
