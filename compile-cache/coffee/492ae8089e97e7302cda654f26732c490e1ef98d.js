(function() {
  var AutocompleteView, _;

  _ = require('underscore-plus');

  AutocompleteView = require('./autocomplete-view');

  module.exports = {
    configDefaults: {
      includeCompletionsFromAllBuffers: false
    },
    autocompleteViews: [],
    editorSubscription: null,
    activate: function() {
      return this.editorSubscription = atom.workspaceView.eachEditorView((function(_this) {
        return function(editor) {
          var autocompleteView;
          if (editor.attached && !editor.mini) {
            autocompleteView = new AutocompleteView(editor);
            editor.on('editor:will-be-removed', function() {
              if (!autocompleteView.hasParent()) {
                autocompleteView.remove();
              }
              return _.remove(_this.autocompleteViews, autocompleteView);
            });
            return _this.autocompleteViews.push(autocompleteView);
          }
        };
      })(this));
    },
    deactivate: function() {
      var _ref;
      if ((_ref = this.editorSubscription) != null) {
        _ref.off();
      }
      this.editorSubscription = null;
      this.autocompleteViews.forEach(function(autocompleteView) {
        return autocompleteView.remove();
      });
      return this.autocompleteViews = [];
    }
  };

}).call(this);
