(function() {
  var StatusBarManager, VimState, helpers;

  helpers = require('./spec-helper');

  VimState = require('../lib/vim-state');

  StatusBarManager = require('../lib/status-bar-manager');

  describe("VimState", function() {
    var commandModeInputKeydown, editor, editorElement, keydown, vimState, _ref;
    _ref = [], editor = _ref[0], editorElement = _ref[1], vimState = _ref[2];
    beforeEach(function() {
      var vimMode;
      vimMode = atom.packages.loadPackage('vim-mode');
      vimMode.activateResources();
      return helpers.getEditorElement(function(element) {
        editorElement = element;
        editor = editorElement.getModel();
        vimState = editorElement.vimState;
        vimState.activateCommandMode();
        return vimState.resetCommandMode();
      });
    });
    keydown = function(key, options) {
      if (options == null) {
        options = {};
      }
      if (options.element == null) {
        options.element = editorElement;
      }
      return helpers.keydown(key, options);
    };
    commandModeInputKeydown = function(key, opts) {
      if (opts == null) {
        opts = {};
      }
      opts.element = editor.commandModeInputView.editor.find('input').get(0);
      opts.raw = true;
      return keydown(key, opts);
    };
    describe("initialization", function() {
      it("puts the editor in command-mode initially by default", function() {
        expect(editorElement.classList.contains('vim-mode')).toBe(true);
        return expect(editorElement.classList.contains('command-mode')).toBe(true);
      });
      return it("puts the editor in insert-mode if startInInsertMode is true", function() {
        atom.config.set('vim-mode.startInInsertMode', true);
        editor.vimState = new VimState(editorElement, new StatusBarManager);
        return expect(editorElement.classList.contains('insert-mode')).toBe(true);
      });
    });
    describe("::destroy", function() {
      it("re-enables text input on the editor", function() {
        expect(editorElement.component.isInputEnabled()).toBeFalsy();
        vimState.destroy();
        return expect(editorElement.component.isInputEnabled()).toBeTruthy();
      });
      return it("removes the mode classes from the editor", function() {
        expect(editorElement.classList.contains("command-mode")).toBeTruthy();
        vimState.destroy();
        return expect(editorElement.classList.contains("command-mode")).toBeFalsy();
      });
    });
    describe("command-mode", function() {
      describe("when entering an insertable character", function() {
        beforeEach(function() {
          return keydown('\\');
        });
        return it("stops propagation", function() {
          return expect(editor.getText()).toEqual('');
        });
      });
      describe("when entering an operator", function() {
        beforeEach(function() {
          return keydown('d');
        });
        describe("with an operator that can't be composed", function() {
          beforeEach(function() {
            return keydown('x');
          });
          return it("clears the operator stack", function() {
            return expect(vimState.opStack.length).toBe(0);
          });
        });
        describe("the escape keybinding", function() {
          beforeEach(function() {
            return keydown('escape');
          });
          return it("clears the operator stack", function() {
            return expect(vimState.opStack.length).toBe(0);
          });
        });
        return describe("the ctrl-c keybinding", function() {
          beforeEach(function() {
            return keydown('c', {
              ctrl: true
            });
          });
          return it("clears the operator stack", function() {
            return expect(vimState.opStack.length).toBe(0);
          });
        });
      });
      describe("the escape keybinding", function() {
        return it("clears any extra cursors", function() {
          editor.setText("one-two-three");
          editor.addCursorAtBufferPosition([0, 3]);
          expect(editor.getCursors().length).toBe(2);
          keydown('escape');
          return expect(editor.getCursors().length).toBe(1);
        });
      });
      describe("the v keybinding", function() {
        beforeEach(function() {
          return keydown('v');
        });
        return it("puts the editor into visual characterwise mode", function() {
          expect(editorElement.classList.contains('visual-mode')).toBe(true);
          expect(vimState.submode).toEqual('characterwise');
          return expect(editorElement.classList.contains('command-mode')).toBe(false);
        });
      });
      describe("the V keybinding", function() {
        beforeEach(function() {
          editor.setText("012345\nabcdef");
          editor.setCursorScreenPosition([0, 0]);
          return keydown('V', {
            shift: true
          });
        });
        it("puts the editor into visual linewise mode", function() {
          expect(editorElement.classList.contains('visual-mode')).toBe(true);
          expect(vimState.submode).toEqual('linewise');
          return expect(editorElement.classList.contains('command-mode')).toBe(false);
        });
        return it("selects the current line", function() {
          return expect(editor.getLastSelection().getText()).toEqual('012345\n');
        });
      });
      describe("the ctrl-v keybinding", function() {
        beforeEach(function() {
          return keydown('v', {
            ctrl: true
          });
        });
        return it("puts the editor into visual characterwise mode", function() {
          expect(editorElement.classList.contains('visual-mode')).toBe(true);
          expect(vimState.submode).toEqual('blockwise');
          return expect(editorElement.classList.contains('command-mode')).toBe(false);
        });
      });
      describe("selecting text", function() {
        return it("puts the editor into visual mode", function() {
          editor.setText("abc def");
          expect(vimState.mode).toEqual('command');
          editor.setSelectedBufferRanges([[[0, 0], [0, 3]]]);
          expect(vimState.mode).toEqual('visual');
          expect(vimState.submode).toEqual('characterwise');
          return expect(editor.getSelectedBufferRanges()).toEqual([[[0, 0], [0, 3]]]);
        });
      });
      describe("the i keybinding", function() {
        beforeEach(function() {
          return keydown('i');
        });
        return it("puts the editor into insert mode", function() {
          expect(editorElement.classList.contains('insert-mode')).toBe(true);
          return expect(editorElement.classList.contains('command-mode')).toBe(false);
        });
      });
      describe("with content", function() {
        beforeEach(function() {
          return editor.setText("012345\n\nabcdef");
        });
        xdescribe("on a line with content", function() {
          beforeEach(function() {
            return editor.setCursorScreenPosition([0, 6]);
          });
          return it("does not allow the cursor to be placed on the \n character", function() {
            return expect(editor.getCursorScreenPosition()).toEqual([0, 5]);
          });
        });
        return describe("on an empty line", function() {
          beforeEach(function() {
            return editor.setCursorScreenPosition([1, 0]);
          });
          return it("allows the cursor to be placed on the \n character", function() {
            return expect(editor.getCursorScreenPosition()).toEqual([1, 0]);
          });
        });
      });
      return describe('with character-input operations', function() {
        beforeEach(function() {
          return editor.setText('012345\nabcdef');
        });
        return it('properly clears the opStack', function() {
          keydown('d');
          keydown('r');
          expect(vimState.mode).toBe('command');
          expect(vimState.opStack.length).toBe(0);
          commandModeInputKeydown('escape');
          keydown('d');
          return expect(editor.getText()).toBe('012345\nabcdef');
        });
      });
    });
    describe("insert-mode", function() {
      beforeEach(function() {
        return keydown('i');
      });
      describe("with content", function() {
        beforeEach(function() {
          return editor.setText("012345\n\nabcdef");
        });
        describe("when cursor is in the middle of the line", function() {
          beforeEach(function() {
            return editor.setCursorScreenPosition([0, 3]);
          });
          return it("moves the cursor to the left when exiting insert mode", function() {
            keydown('escape');
            return expect(editor.getCursorScreenPosition()).toEqual([0, 2]);
          });
        });
        describe("when cursor is at the beginning of line", function() {
          beforeEach(function() {
            return editor.setCursorScreenPosition([1, 0]);
          });
          return it("leaves the cursor at the beginning of line", function() {
            keydown('escape');
            return expect(editor.getCursorScreenPosition()).toEqual([1, 0]);
          });
        });
        return describe("on a line with content", function() {
          beforeEach(function() {
            return editor.setCursorScreenPosition([0, 6]);
          });
          return it("allows the cursor to be placed on the \n character", function() {
            return expect(editor.getCursorScreenPosition()).toEqual([0, 6]);
          });
        });
      });
      it("puts the editor into command mode when <escape> is pressed", function() {
        keydown('escape');
        expect(editorElement.classList.contains('command-mode')).toBe(true);
        expect(editorElement.classList.contains('insert-mode')).toBe(false);
        return expect(editorElement.classList.contains('visual-mode')).toBe(false);
      });
      return it("puts the editor into command mode when <ctrl-c> is pressed", function() {
        helpers.mockPlatform(editorElement, 'platform-darwin');
        keydown('c', {
          ctrl: true
        });
        helpers.unmockPlatform(editorElement);
        expect(editorElement.classList.contains('command-mode')).toBe(true);
        expect(editorElement.classList.contains('insert-mode')).toBe(false);
        return expect(editorElement.classList.contains('visual-mode')).toBe(false);
      });
    });
    describe("visual-mode", function() {
      beforeEach(function() {
        editor.setText("one two three");
        editor.setCursorBufferPosition([0, 4]);
        return keydown('v');
      });
      it("selects the character under the cursor", function() {
        expect(editor.getSelectedBufferRanges()).toEqual([[[0, 4], [0, 5]]]);
        return expect(editor.getSelectedText()).toBe("t");
      });
      it("puts the editor into command mode when <escape> is pressed", function() {
        keydown('escape');
        expect(editor.getCursorBufferPositions()).toEqual([[0, 4]]);
        expect(editorElement.classList.contains('command-mode')).toBe(true);
        return expect(editorElement.classList.contains('visual-mode')).toBe(false);
      });
      describe("motions", function() {
        it("transforms the selection", function() {
          keydown('w');
          return expect(editor.getLastSelection().getText()).toEqual('two t');
        });
        return it("always leaves the initially selected character selected", function() {
          keydown("h");
          expect(editor.getSelectedText()).toBe(" t");
          keydown("l");
          expect(editor.getSelectedText()).toBe("t");
          keydown("l");
          keydown("l");
          return expect(editor.getSelectedText()).toBe("tw");
        });
      });
      describe("operators", function() {
        beforeEach(function() {
          editor.setText("012345\n\nabcdef");
          editor.setCursorScreenPosition([0, 0]);
          editor.selectLinesContainingCursors();
          return keydown('d');
        });
        return it("operate on the current selection", function() {
          return expect(editor.getText()).toEqual("\nabcdef");
        });
      });
      describe("returning to command-mode", function() {
        beforeEach(function() {
          editor.setText("012345\n\nabcdef");
          editor.selectLinesContainingCursors();
          return keydown('escape');
        });
        return it("operate on the current selection", function() {
          return expect(editor.getLastSelection().getText()).toEqual('');
        });
      });
      return describe("the o keybinding", function() {
        return it("reversed each selection", function() {
          editor.addCursorAtBufferPosition([0, Infinity]);
          keydown("v");
          keydown("i");
          keydown("w");
          expect(editor.getSelectedBufferRanges()).toEqual([[[0, 4], [0, 7]], [[0, 8], [0, 13]]]);
          expect(editor.getCursorBufferPositions()).toEqual([[0, 7], [0, 13]]);
          keydown("o");
          expect(editor.getSelectedBufferRanges()).toEqual([[[0, 4], [0, 7]], [[0, 8], [0, 13]]]);
          return expect(editor.getCursorBufferPositions()).toEqual([[0, 4], [0, 8]]);
        });
      });
    });
    return describe("marks", function() {
      beforeEach(function() {
        return editor.setText("text in line 1\ntext in line 2\ntext in line 3");
      });
      it("basic marking functionality", function() {
        editor.setCursorScreenPosition([1, 1]);
        keydown('m');
        commandModeInputKeydown('t');
        expect(editor.getText()).toEqual("text in line 1\ntext in line 2\ntext in line 3");
        editor.setCursorScreenPosition([2, 2]);
        keydown('`');
        commandModeInputKeydown('t');
        return expect(editor.getCursorScreenPosition()).toEqual([1, 1]);
      });
      it("real (tracking) marking functionality", function() {
        editor.setCursorScreenPosition([2, 2]);
        keydown('m');
        commandModeInputKeydown('q');
        editor.setCursorScreenPosition([1, 2]);
        keydown('o');
        keydown('escape');
        keydown('`');
        commandModeInputKeydown('q');
        return expect(editor.getCursorScreenPosition()).toEqual([3, 2]);
      });
      return it("real (tracking) marking functionality", function() {
        editor.setCursorScreenPosition([2, 2]);
        keydown('m');
        commandModeInputKeydown('q');
        editor.setCursorScreenPosition([1, 2]);
        keydown('d');
        keydown('d');
        keydown('escape');
        keydown('`');
        commandModeInputKeydown('q');
        return expect(editor.getCursorScreenPosition()).toEqual([1, 2]);
      });
    });
  });

}).call(this);
