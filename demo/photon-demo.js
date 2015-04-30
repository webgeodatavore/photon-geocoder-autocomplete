      // Format result in the search input autocomplete
      var formatResult = function(feature, el) {
          var title = ol.domUtils.create('strong', '', el),
              detailsContainer = ol.domUtils.create('small', '', el),
              details = [];
          title.innerHTML = feature.properties.label || feature.properties.name;
          var types = {
              housenumber: 'numéro',
              street: 'rue',
              locality: 'lieu-dit',
              hamlet: 'hameau',
              village: 'village',
              city: 'ville',
              commune: 'commune'
          };
          if (types[feature.properties.type]) {
            ol.domUtils.create('span', 'type', title).innerHTML = types[feature.properties.type];
          }
          if (feature.properties.city && feature.properties.city !== feature.properties.name) {
            details.push(feature.properties.city);
          }
          if (feature.properties.context) {
            details.push(feature.properties.context);
          }
          detailsContainer.innerHTML = details.join(', ');
      };

      // Create map
      var map = new ol.Map({
        target: 'map',
        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          })
        ],
        view: new ol.View({
          center: ol.proj.transform([-1.55, 47.22], 'EPSG:4326', 'EPSG:3857'),
          zoom: 9
        })
      });

      // Function to show you can do something with the returned elements
      function myHandler(featureCollection) {
          console.debug(featureCollection);
      }
      
      // We reused the default function to center and zoom on selected feature.
      // You can make your own. For instance, you could center, zoom
      // and add a point on the map
      function onSelected(feature) {
        console.log(feature);
        var coordinates = ol.proj.transform(
          [feature.geometry.coordinates[0], feature.geometry.coordinates[1]],
          'EPSG:4326',
          map.getView().getProjection()
        );
        map.getView().setCenter(coordinates);
        map.getView().setZoom(16);
      }

      // URL for API
      var API_URL = '//api-adresse.data.gouv.fr';

      // Create search by adresses component
      var container = new ol.Photon.Search(map, {
        resultsHandler: myHandler,
        onSelected: onSelected,
        placeholder: 'Tapez une adresse du type Impasse Juton, Nantes',
        formatResult: formatResult,
        url: API_URL + '/search/?',
        position: 'topright'
      });

      // Add the created DOM element within the map
      var controlGeocoder = new ol.Photon.AddDomControl(container, 'ol-photon-geocoder ol-unselectable ol-control');
      map.addControl(controlGeocoder);

      // Select element and set options for reverse geocoding
      // var reverseEl = document.getElementById('reverse');
      var reverseEl = ol.domUtils.create('div', 'reverse');
      var optionsReverse = {
        url: API_URL + '/reverse/?',
        handleResults: function(data) {
          if (data.features.length) {
            reverseEl.innerHTML = 'Carte centrée sur «' + data.features[0].properties.label + '»';
            reverseEl.parentElement.style.display = 'block';
          } else {
            reverseEl.innerHTML = '';
            reverseEl.parentElement.style.display = 'none';
          }
        }
      };

      // Instanciate the reverse geocoding component
      var reverse = ol.Photon.Reverse(optionsReverse);
      var controlReverseGeocoder = new ol.Photon.AddDomControl(reverseEl, 'ol-photon-reverse-geocoder ol-unselectable ol-control');
      map.addControl(controlReverseGeocoder);
      document.querySelector('.ol-photon-reverse-geocoder').style.display = 'none';

      // Add event on map
      map.on('moveend', function(evt) {
        var map = evt.map;
        var coordinates = ol.proj.transform(
          map.getView().getCenter(),
          'EPSG:3857',
          'EPSG:4326'
        );
        if (map.getView().getZoom() > 12) {
          reverse.doReverse(coordinates);
        } else {
          // If we dezoom and then move, we will keep displaying the wrong adress, hence this solution
          reverseEl.innerHTML = '';
          reverseEl.parentElement.style.display = 'none';
        }
      });