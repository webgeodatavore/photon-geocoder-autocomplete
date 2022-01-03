'use strict';
var extend = require('extend');
var Utils = require('./utils');

/**
 * Base class for the library
 **/
var PhotonBase = function() {};
/**
 * Help to manage DOM element as array
 * @param {els} els Dom elements
 * @param {function} callback Callback function to use in the loop.
 **/
PhotonBase.prototype.forEach = function(els, callback) {
  Array.prototype.forEach.call(els, callback);
};

PhotonBase.prototype.ajax = function(callback, thisobj) {
  if (typeof this.xhr === 'object') {
    this.xhr.abort();
  }
  this.xhr = new XMLHttpRequest();
  this.xhr.open(
    'GET',
    this.options.url + this.buildQueryString(this.getParams()),
    true
  );

  this.xhr.onload = function(e) {
    var eventAjaxReturn = new Event('ajax:return');
    document.dispatchEvent(eventAjaxReturn);
    if (this.status === 200) {
      if (callback) {
        var raw = this.response;
        raw = JSON.parse(raw);
        callback.call(thisobj || this, raw);
      }
    }
    delete this.xhr;
  };

  var eventAjaxSend = new Event('ajax:send');
  document.dispatchEvent(eventAjaxSend);
  this.xhr.send();
};

PhotonBase.prototype.buildQueryString = function(params) {
  var queryString = [];
  for (var key in params) {
    if (params[key]) {
      queryString.push(
        encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
      );
    }
  }
  return queryString.join('&');
};

/**
 * Render all layers that are children of a group.
 *
 * @param {feature} feature Layer to be rendered (should have a title property).
 * @return {element} Return popup with content.
 */
PhotonBase.prototype.featureToPopupContent = function(feature) {
  var container = Utils.dom.create('div', 'ol-photon-popup');
  var title = Utils.dom.create('h3', '', container);
  title.innerHTML = feature.properties.label;
  return container;
};

/**
 *
 **/
var Search = function(options) {
  var extended = extend({}, PhotonBase.prototype, {
    options: {
      url: 'http://photon.komoot.de/api/?',
      placeholder: 'Start typing...',
      minChar: 3,
      limit: 5,
      submitDelay: 300,
      includePosition: null, //function() {return [0, 0]},
      noResultLabel: 'No result',
      feedbackEmail: 'photon@komoot.de' // Set to null to remove feedback box
    },
    CACHE: '',
    RESULTS: [],
    KEYS: {
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      TAB: 9,
      RETURN: 13,
      ESC: 27,
      APPLE: 91,
      SHIFT: 16,
      ALT: 17,
      CTRL: 18
    },
    initialize: function(input, options) {
      this.input = input;
      this.options = extend({}, this.options, options);
      var CURRENT = null;

      try {
        Object.defineProperty(this, 'CURRENT', {
          get: function() {
            return CURRENT;
          },
          set: function(index) {
            if (typeof index === 'object') {
              index = this.resultToIndex(index);
            }
            CURRENT = index;
          }
        });
      } catch (e) {
        // Hello IE8
      }
      this.input.type = 'search';
      this.input.placeholder = this.options.placeholder;
      this.input.autocomplete = 'off';
      this.input.autocorrect = 'off';

      this.input.addEventListener('keydown', this.onKeyDown.bind(this), false);
      this.input.addEventListener('input', this.onInput.bind(this), false);
      this.input.addEventListener('blur', this.onBlur.bind(this), false);
      this.input.addEventListener('focus', this.onFocus.bind(this), false);
      this.createResultsContainer();
    },
    createResultsContainer: function() {
      this.resultsContainer = Utils.dom.create(
        'ul',
        'photon-autocomplete',
        document.querySelector('body')
      );
    },
    resizeContainer: function() {
      var l = this.getLeft(this.input);
      var t = this.getTop(this.input) + this.input.offsetHeight;
      this.resultsContainer.style.left = l + 'px';
      this.resultsContainer.style.top = t + 'px';
      var width;
      if (this.options.width) {
        width = this.options.width;
      } else {
        width = this.input.offsetWidth - 2;
      }
      this.resultsContainer.style.width = width + 'px';
    },
    onKeyDown: function(e) {
      switch (e.keyCode) {
        case this.KEYS.TAB:
          if (this.CURRENT !== null) {
            this.setChoice();
          }
          Utils.evt.stop(e);
          break;
        case this.KEYS.RETURN:
          Utils.evt.stop(e);
          this.setChoice();
          break;
        case this.KEYS.ESC:
          Utils.evt.stop(e);
          this.hide();
          this.input.blur();
          break;
        case this.KEYS.DOWN:
          if (this.RESULTS.length > 0) {
            if (this.CURRENT !== null &&
                this.CURRENT < this.RESULTS.length - 1) { // what if one resutl?
              this.CURRENT++;
              this.highlight();
            } else if (this.CURRENT === null) {
              this.CURRENT = 0;
              this.highlight();
            }
          }
          break;
        case this.KEYS.UP:
          if (this.CURRENT !== null) {
            Utils.evt.stop(e);
          }
          if (this.RESULTS.length > 0) {
            if (this.CURRENT > 0) {
              this.CURRENT--;
              this.highlight();
            } else if (this.CURRENT === 0) {
              this.CURRENT = null;
              this.highlight();
            }
          }
          break;
      }
    },
    onInput: function(e) {
      if (typeof this.submitDelay === 'number') {
        window.clearTimeout(this.submitDelay);
        delete this.submitDelay;
      }
      this.submitDelay = window.setTimeout(
        this.search.bind(this),
        this.options.submitDelay
      );
    },
    onBlur: function(e) {
      var eventBlur = new Event('blur');
      document.dispatchEvent(eventBlur);
      setTimeout(function() {
        this.hide();
      }.bind(this), 100);
    },
    onFocus: function(e) {
      var eventFocus = new Event('focus');
      document.dispatchEvent(eventFocus);
      this.input.select();
      this.search(); // In case we have a value from a previous search.
    },
    clear: function() {
      this.RESULTS = [];
      this.CURRENT = null;
      this.CACHE = '';
      this.resultsContainer.innerHTML = '';
    },
    hide: function() {
      var eventHide = new Event('hide');
      document.dispatchEvent(eventHide);
      this.clear();
      this.resultsContainer.style.display = 'none';
    },
    setChoice: function(choice) {
      choice = choice || this.RESULTS[this.CURRENT];
      if (choice) {
        this.hide();
        this.input.value = '';
        var eventSelected = new CustomEvent(
          'selected', {
            choice: choice.feature
          }
        );
        document.dispatchEvent(eventSelected);
        this.onSelected(choice.feature);
      }
    },
    search: function() {
      var val = this.input.value;
      var minChar;
      if (typeof this.options.minChar === 'function') {
        minChar = this.options.minChar(val);
      } else {
        minChar = val.length >= this.options.minChar;
      }
      if (!val || !minChar) {
        return this.clear();
      }
      if (val + '' === this.CACHE + '') {
        return;
      } else {
        this.CACHE = val;
      }
      this._doSearch();
    },
    _doSearch: function() {
      this.ajax(this.handleResults, this);
    },
    _onSelected: function(feature) {
      console.log(feature);
    },
    onSelected: function(choice) {
      return (this.options.onSelected || this._onSelected).call(this, choice);
    },
    _formatResult: function(feature, el) {
      var title = Utils.dom.create('strong', '', el);
      var detailsContainer = Utils.dom.create('small', '', el);
      var details = [];
      var type = this.formatType(feature);
      title.innerHTML = feature.properties.name;
      if (type) {
        details.push(type);
      }
      if (feature.properties.city &&
          feature.properties.city !== feature.properties.name) {
        details.push(feature.properties.city);
      }
      if (feature.properties.country) {
        details.push(feature.properties.country);
      }
      detailsContainer.innerHTML = details.join(', ');
    },
    formatResult: function(feature, el) {
      return (
        this.options.formatResult || this._formatResult
      ).call(this, feature, el);
    },
    formatType: function(feature) {
      return (
        this.options.formatType || this._formatType
      ).call(this, feature);
    },
    _formatType: function(feature) {
      // jscs:disable
      return feature.properties.osm_value;
      // jscs:enable
    },
    createResult: function(feature) {
      var el = Utils.dom.create('li', '', this.resultsContainer);
      this.formatResult(feature, el);
      var result = {
        feature: feature,
        el: el
      };
      // Touch handling needed
      el.addEventListener('mouseover', function(e) {
        this.CURRENT = result;
        this.highlight();
      }.bind(this), false);
      el.addEventListener('mousedown', function(e) {
        this.setChoice();
      }.bind(this));
      return result;
    },
    resultToIndex: function(result) {
      var out = null;
      this.forEach(this.RESULTS, function(item, index) {
        if (item === result) {
          out = index;
          return;
        }
      });
      return out;
    },
    handleResults: function(geojson) {
      this.clear();
      this.resultsContainer.style.display = 'block';
      this.resizeContainer();
      this.forEach(geojson.features, function(feature) {
        this.RESULTS.push(this.createResult(feature));
      }.bind(this));
      if (geojson.features.length === 0) {
        var noresult = Utils.dom.create(
          'li',
          'photon-no-result',
          this.resultsContainer
        );
        noresult.innerHTML = this.options.noResultLabel;
      }
      if (this.options.feedbackEmail) {
        var feedback = Utils.dom.create(
          'a',
          'photon-feedback',
          this.resultsContainer
        );
        feedback.href = 'mailto:' + this.options.feedbackEmail;
        feedback.innerHTML = 'Feedback';
      }
      this.CURRENT = 0;
      this.highlight();
      if (this.options.resultsHandler) {
        this.options.resultsHandler(geojson);
      }
    },
    highlight: function() {
      this.forEach(this.RESULTS, function(item, index) {
        if (index === this.CURRENT) {
          Utils.dom.addClass(item.el, 'on');
        } else {
          Utils.dom.removeClass(item.el, 'on');
        }
      }.bind(this));
    },
    getLeft: function(el) {
      var tmp = el.offsetLeft;
      el = el.offsetParent;
      while (el) {
        tmp += el.offsetLeft;
        el = el.offsetParent;
      }
      return tmp;
    },
    getTop: function(el) {
      var tmp = el.offsetTop;
      el = el.offsetParent;
      while (el) {
        tmp += el.offsetTop;
        el = el.offsetParent;
      }
      return tmp;
    },
    getParams: function() {
      var x;
      var y;
      if (this.options.includePosition) {
        [x, y] = this.options.includePosition();
      } else {
        x = y = null;
      }
      return {
        q: this.CACHE,
        lang: this.options.lang,
        limit: this.options.limit,
        lat: y,
        lon: x
      };
    }
  });

  var container = Utils.dom.create('div', null); //, 'ol-photon');
  var input = Utils.dom.create('input', 'photon-input', container);
  var searchPhoton = Object.create(extended);
  extended.initialize(input, options);
  return container;
};

var Reverse = function(options) {
  var extended = extend({}, PhotonBase.prototype, {
    options: {
      url: 'http://photon.komoot.de/reverse/?',
      limit: 1,
      handleResults: null
    },
    initialize: function(options) {
      this.options = extend({}, this.options, options);
    },
    doReverse: function(coordinates) {
      var eventReverse = new CustomEvent(
        'selected', {
          coordinates: coordinates
        }
      );
      document.dispatchEvent(eventReverse);
      this.coordinates = coordinates;
      this.ajax(this.handleResults.bind(this), this);
    },
    _handleResults: function(data) {
      // console.log(data);
    },
    handleResults: function(data) {
      return (
        this.options.handleResults || this._handleResults
      ).call(this, data);
    },
    getParams: function() {
      return {
        lang: this.options.lang,
        limit: this.options.limit,
        lat: this.coordinates[1],
        lon: this.coordinates[0]
      };
    }
  });
  var reverse = Object.create(extended);
  reverse.initialize(options);
  return reverse;
};

/**
 * Main class for Photon
 **/
var Photon = {
  /*AddDomControl: function(elementToAdd, className, optOptions) {
    var options = optOptions || {};

    var element = document.createElement('div');
    if (className) {
      element.className = className;
    }
    element.appendChild(elementToAdd);

    ol.control.Control.call(this, {
      element: element,
      target: options.target
    });
  },*/
  Reverse: Reverse,
  Search: Search
};
//ol.inherits(Photon.AddDomControl, ol.control.Control);

/**
 * Export utils function
 **/
module.exports = Photon;
