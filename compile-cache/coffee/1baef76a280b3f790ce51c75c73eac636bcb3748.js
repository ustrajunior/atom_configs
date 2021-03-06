(function() {
  var CompositeDisposable, DefaultSuggestionTypeIconHTML, IconTemplate, ItemTemplate, SuggestionListElement, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  CompositeDisposable = require('atom').CompositeDisposable;

  _ = require('underscore-plus');

  ItemTemplate = "<span class=\"icon-container\"></span>\n<span class=\"left-label\"></span>\n<span class=\"word-container\">\n  <span class=\"word\"></span>\n  <span class=\"right-label\"></span>\n</span>";

  IconTemplate = '<i class="icon"></i>';

  DefaultSuggestionTypeIconHTML = {
    'snippet': '<i class="icon-move-right"></i>'
  };

  SuggestionListElement = (function(_super) {
    __extends(SuggestionListElement, _super);

    function SuggestionListElement() {
      return SuggestionListElement.__super__.constructor.apply(this, arguments);
    }

    SuggestionListElement.prototype.maxItems = 200;

    SuggestionListElement.prototype.snippetRegex = /\$\{[0-9]+:([^}]+)\}/g;

    SuggestionListElement.prototype.snippetMarkerChar = '|';

    SuggestionListElement.prototype.snippetMarkerRegex = /\|/g;

    SuggestionListElement.prototype.createdCallback = function() {
      this.subscriptions = new CompositeDisposable;
      this.classList.add('popover-list', 'select-list', 'autocomplete-suggestion-list');
      return this.registerMouseHandling();
    };

    SuggestionListElement.prototype.attachedCallback = function() {
      this.parentElement.classList.add('autocomplete-plus');
      this.addActiveClassToEditor();
      if (!this.ol) {
        this.renderList();
      }
      this.calculateMaxListHeight();
      return this.itemsChanged();
    };

    SuggestionListElement.prototype.detachedCallback = function() {
      return this.removeActiveClassFromEditor();
    };

    SuggestionListElement.prototype.initialize = function(model) {
      this.model = model;
      if (model == null) {
        return;
      }
      this.subscriptions.add(this.model.onDidChangeItems(this.itemsChanged.bind(this)));
      this.subscriptions.add(this.model.onDidSelectNext(this.moveSelectionDown.bind(this)));
      this.subscriptions.add(this.model.onDidSelectPrevious(this.moveSelectionUp.bind(this)));
      this.subscriptions.add(this.model.onDidConfirmSelection(this.confirmSelection.bind(this)));
      this.subscriptions.add(this.model.onDidDispose(this.dispose.bind(this)));
      return this;
    };

    SuggestionListElement.prototype.registerMouseHandling = function() {
      this.onmousewheel = function(event) {
        return event.stopPropagation();
      };
      this.onmousedown = function(event) {
        var item, _ref, _ref1;
        item = event.target;
        while (!((_ref = item.dataset) != null ? _ref.index : void 0) && item !== this) {
          item = item.parentNode;
        }
        this.selectedIndex = (_ref1 = item.dataset) != null ? _ref1.index : void 0;
        return event.stopPropagation();
      };
      return this.onmouseup = function(event) {
        event.stopPropagation();
        return this.confirmSelection();
      };
    };

    SuggestionListElement.prototype.itemsChanged = function() {
      var _base;
      this.selectedIndex = 0;
      if (typeof (_base = atom.views).pollAfterNextUpdate === "function") {
        _base.pollAfterNextUpdate();
      }
      return atom.views.updateDocument((function(_this) {
        return function() {
          return _this.renderItems();
        };
      })(this));
    };

    SuggestionListElement.prototype.addActiveClassToEditor = function() {
      var editorElement, _ref;
      editorElement = atom.views.getView(atom.workspace.getActiveTextEditor());
      return editorElement != null ? (_ref = editorElement.classList) != null ? _ref.add('autocomplete-active') : void 0 : void 0;
    };

    SuggestionListElement.prototype.removeActiveClassFromEditor = function() {
      var editorElement, _ref;
      editorElement = atom.views.getView(atom.workspace.getActiveTextEditor());
      return editorElement != null ? (_ref = editorElement.classList) != null ? _ref.remove('autocomplete-active') : void 0 : void 0;
    };

    SuggestionListElement.prototype.moveSelectionUp = function() {
      if (!(this.selectedIndex <= 0)) {
        return this.setSelectedIndex(this.selectedIndex - 1);
      } else {
        return this.setSelectedIndex(this.visibleItems().length - 1);
      }
    };

    SuggestionListElement.prototype.moveSelectionDown = function() {
      if (!(this.selectedIndex >= (this.visibleItems().length - 1))) {
        return this.setSelectedIndex(this.selectedIndex + 1);
      } else {
        return this.setSelectedIndex(0);
      }
    };

    SuggestionListElement.prototype.setSelectedIndex = function(index) {
      this.selectedIndex = index;
      return this.renderItems();
    };

    SuggestionListElement.prototype.visibleItems = function() {
      var _ref, _ref1;
      return (_ref = this.model) != null ? (_ref1 = _ref.items) != null ? _ref1.slice(0, this.maxItems) : void 0 : void 0;
    };

    SuggestionListElement.prototype.getSelectedItem = function() {
      var _ref, _ref1;
      return (_ref = this.model) != null ? (_ref1 = _ref.items) != null ? _ref1[this.selectedIndex] : void 0 : void 0;
    };

    SuggestionListElement.prototype.confirmSelection = function() {
      var item;
      if (!this.model.isActive()) {
        return;
      }
      item = this.getSelectedItem();
      if (item != null) {
        return this.model.confirm(item);
      } else {
        return this.model.cancel();
      }
    };

    SuggestionListElement.prototype.renderList = function() {
      this.ol = document.createElement('ol');
      this.appendChild(this.ol);
      return this.ol.className = 'list-group';
    };

    SuggestionListElement.prototype.calculateMaxListHeight = function() {
      var itemHeight, li, maxVisibleItems, paddingHeight, _ref;
      maxVisibleItems = atom.config.get('autocomplete-plus.maxVisibleSuggestions');
      li = document.createElement('li');
      li.textContent = 'test';
      this.ol.appendChild(li);
      itemHeight = li.offsetHeight;
      paddingHeight = (_ref = parseInt(getComputedStyle(this)['padding-top']) + parseInt(getComputedStyle(this)['padding-bottom'])) != null ? _ref : 0;
      this.style['max-height'] = "" + (maxVisibleItems * itemHeight + paddingHeight) + "px";
      return li.remove();
    };

    SuggestionListElement.prototype.renderItems = function() {
      var index, item, items, li, _i, _len, _ref, _ref1;
      items = (_ref = this.visibleItems()) != null ? _ref : [];
      for (index = _i = 0, _len = items.length; _i < _len; index = ++_i) {
        item = items[index];
        this.renderItem(item, index);
      }
      while (li = this.ol.childNodes[items.length]) {
        li.remove();
      }
      return (_ref1 = this.selectedLi) != null ? _ref1.scrollIntoView(false) : void 0;
    };

    SuggestionListElement.prototype.renderItem = function(_arg, index) {
      var className, defaultIconHTML, iconHTML, leftLabel, leftLabelHTML, leftLabelSpan, li, replacementPrefix, rightLabel, rightLabelHTML, rightLabelSpan, sanitizedIconHTML, sanitizedType, snippet, text, type, typeIcon, typeIconContainer, wordSpan, _ref;
      iconHTML = _arg.iconHTML, type = _arg.type, snippet = _arg.snippet, text = _arg.text, className = _arg.className, replacementPrefix = _arg.replacementPrefix, leftLabel = _arg.leftLabel, leftLabelHTML = _arg.leftLabelHTML, rightLabel = _arg.rightLabel, rightLabelHTML = _arg.rightLabelHTML;
      li = this.ol.childNodes[index];
      if (!li) {
        li = document.createElement('li');
        li.innerHTML = ItemTemplate;
        li.dataset.index = index;
        this.ol.appendChild(li);
      }
      li.className = '';
      if (className) {
        li.classList.add(className);
      }
      if (index === this.selectedIndex) {
        li.classList.add('selected');
      }
      if (index === this.selectedIndex) {
        this.selectedLi = li;
      }
      typeIconContainer = li.querySelector('.icon-container');
      typeIconContainer.innerHTML = '';
      sanitizedType = _.isString(type) ? type : '';
      sanitizedIconHTML = _.isString(iconHTML) ? iconHTML : void 0;
      defaultIconHTML = (_ref = DefaultSuggestionTypeIconHTML[sanitizedType]) != null ? _ref : sanitizedType[0];
      if ((sanitizedIconHTML || defaultIconHTML) && iconHTML !== false) {
        typeIconContainer.innerHTML = IconTemplate;
        typeIcon = typeIconContainer.childNodes[0];
        typeIcon.innerHTML = sanitizedIconHTML != null ? sanitizedIconHTML : defaultIconHTML;
        if (type) {
          typeIcon.classList.add(type);
        }
      }
      wordSpan = li.querySelector('.word');
      wordSpan.innerHTML = this.getHighlightedHTML(text, snippet, replacementPrefix);
      leftLabelSpan = li.querySelector('.left-label');
      if (leftLabelHTML != null) {
        leftLabelSpan.innerHTML = leftLabelHTML;
      } else if (leftLabel != null) {
        leftLabelSpan.textContent = leftLabel;
      } else {
        leftLabelSpan.textContent = '';
      }
      rightLabelSpan = li.querySelector('.right-label');
      if (rightLabelHTML != null) {
        return rightLabelSpan.innerHTML = rightLabelHTML;
      } else if (rightLabel != null) {
        return rightLabelSpan.textContent = rightLabel;
      } else {
        return rightLabelSpan.textContent = '';
      }
    };

    SuggestionListElement.prototype.getHighlightedHTML = function(text, snippet, replacementPrefix) {
      var ch, completionIndex, highlightedChar, highlightedHTML, i, lastWordIndex, preChar, replacement, snippetCompletions, wordIndex, _i, _len;
      replacement = text;
      snippetCompletions = [];
      if (_.isString(snippet)) {
        replacement = snippet.replace(this.snippetRegex, (function(_this) {
          return function(match, snippetText) {
            snippetCompletions.push("<span class=\"snippet-completion\">" + snippetText + "</span>");
            return _this.snippetMarkerChar;
          };
        })(this));
      }
      highlightedHTML = '';
      wordIndex = 0;
      lastWordIndex = 0;
      for (i = _i = 0, _len = replacementPrefix.length; _i < _len; i = ++_i) {
        ch = replacementPrefix[i];
        while (wordIndex < replacement.length && replacement[wordIndex].toLowerCase() !== ch.toLowerCase()) {
          wordIndex += 1;
        }
        if (wordIndex >= replacement.length) {
          break;
        }
        preChar = replacement.substring(lastWordIndex, wordIndex);
        highlightedChar = "<span class=\"character-match\">" + replacement[wordIndex] + "</span>";
        highlightedHTML = "" + highlightedHTML + preChar + highlightedChar;
        wordIndex += 1;
        lastWordIndex = wordIndex;
      }
      highlightedHTML += replacement.substring(lastWordIndex);
      if (snippetCompletions.length) {
        completionIndex = 0;
        highlightedHTML = highlightedHTML.replace(this.snippetMarkerRegex, function(match, snippetText) {
          return snippetCompletions[completionIndex++];
        });
      }
      return highlightedHTML;
    };

    SuggestionListElement.prototype.dispose = function() {
      var _ref;
      this.subscriptions.dispose();
      return (_ref = this.parentNode) != null ? _ref.removeChild(this) : void 0;
    };

    return SuggestionListElement;

  })(HTMLElement);

  module.exports = SuggestionListElement = document.registerElement('autocomplete-suggestion-list', {
    prototype: SuggestionListElement.prototype
  });

}).call(this);
