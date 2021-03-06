(function() {
  var $, BufferedProcess, Os, Path, StatusView, TagCreateView, TextEditorView, View, fs, git, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Os = require('os');

  Path = require('path');

  fs = require('fs-plus');

  BufferedProcess = require('atom').BufferedProcess;

  _ref = require('atom-space-pen-views'), $ = _ref.$, TextEditorView = _ref.TextEditorView, View = _ref.View;

  StatusView = require('./status-view');

  git = require('../git');

  module.exports = TagCreateView = (function(_super) {
    __extends(TagCreateView, _super);

    function TagCreateView() {
      return TagCreateView.__super__.constructor.apply(this, arguments);
    }

    TagCreateView.content = function() {
      return this.div((function(_this) {
        return function() {
          _this.div({
            "class": 'block'
          }, function() {
            return _this.subview('tagName', new TextEditorView({
              mini: true,
              placeholderText: 'Tag'
            }));
          });
          _this.div({
            "class": 'block'
          }, function() {
            return _this.subview('tagMessage', new TextEditorView({
              mini: true,
              placeholderText: 'Annotation message'
            }));
          });
          return _this.div({
            "class": 'block'
          }, function() {
            _this.span({
              "class": 'pull-left'
            }, function() {
              return _this.button({
                "class": 'btn btn-success inline-block-tight gp-confirm-button',
                click: 'createTag'
              }, 'Create Tag');
            });
            return _this.span({
              "class": 'pull-right'
            }, function() {
              return _this.button({
                "class": 'btn btn-error inline-block-tight gp-cancel-button',
                click: 'destroy'
              }, 'Cancel');
            });
          });
        };
      })(this));
    };

    TagCreateView.prototype.initialize = function() {
      if (this.panel == null) {
        this.panel = atom.workspace.addModalPanel({
          item: this
        });
      }
      this.panel.show();
      this.tagName.focus();
      this.on('core:cancel', (function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this));
      return this.on('core:confirm', (function(_this) {
        return function() {
          return _this.createTag();
        };
      })(this));
    };

    TagCreateView.prototype.createTag = function() {
      var tag;
      tag = {
        name: this.tagName.getModel().getText(),
        message: this.tagMessage.getModel().getText()
      };
      new BufferedProcess({
        command: 'git',
        args: ['tag', '-a', tag.name, '-m', tag.message],
        options: {
          cwd: git.dir()
        },
        stderr: function(data) {
          return new StatusView({
            type: 'error',
            message: data.toString()
          });
        },
        exit: function(code) {
          if (code === 0) {
            return new StatusView({
              type: 'success',
              message: "Tag '" + tag.name + "' has been created successfully!"
            });
          }
        }
      });
      return this.destroy();
    };

    TagCreateView.prototype.destroy = function() {
      return this.panel.destroy();
    };

    return TagCreateView;

  })(View);

}).call(this);
