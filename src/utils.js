// trim whitespace from both sides of a string
var trim = function (str) {
  return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, "");
};

var splitWords = function (str) {
  return trim(str).split(/\s+/);
};

/**
 * Create DOM element. Excerpt from Leaflet library
 **/
var dom = {
  create: function (tagName, className, container) {
    var el = document.createElement(tagName);
    if (className) {
      el.className = className;
    }

    if (container) {
      container.appendChild(el);
    }
    return el;
  },
  hasClass: function (el, name) {
    if (el.classList !== undefined) {
      return el.classList.contains(name);
    }
    var className = dom.getClass(el);
    return (
      className.length > 0 &&
      new RegExp("(^|\\s)" + name + "(\\s|$)").test(className)
    );
  },
  addClass: function (el, name) {
    if (el.classList !== undefined) {
      var classes = splitWords(name);
      for (var i = 0, len = classes.length; i < len; i++) {
        el.classList.add(classes[i]);
      }
    } else if (!dom.hasClass(el, name)) {
      var className = dom.getClass(el);
      dom.setClass(el, (className ? className + " " : "") + name);
    }
  },
  removeClass: function (el, name) {
    if (el.classList !== undefined) {
      el.classList.remove(name);
    } else {
      dom.setClass(
        el,
        trim((" " + dom.getClass(el) + " ").replace(" " + name + " ", " "))
      );
    }
  },
  setClass: function (el, name) {
    if (el.className.baseVal === undefined) {
      el.className = name;
    } else {
      // in case of SVG element
      el.className.baseVal = name;
    }
  },
  getClass: function (el) {
    if (el.className.baseVal === undefined) {
      return el.className;
    } else {
      return el.className.baseVal;
    }
  },
};

var evt = {
  preventDefault: function (e) {
    if (e.preventDefault) {
      e.preventDefault();
    } else {
      e.returnValue = false;
    }
    return this;
  },
  stopPropagation: function (e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    } else {
      e.cancelBubble = true;
    }
    return this;
  },
  stop: function (e) {
    var intermediate = this.preventDefault(e);
    return intermediate.stopPropagation(e);
  },
};

/**
 * Export utils function
 **/
module.exports = {
  dom: dom,
  evt: evt,
};
