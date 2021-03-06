(function() {
  var $, MarkdownPreviewView, fs, path, temp, wrench;

  path = require('path');

  fs = require('fs-plus');

  temp = require('temp');

  wrench = require('wrench');

  MarkdownPreviewView = require('../lib/markdown-preview-view');

  $ = require('atom-space-pen-views').$;

  describe("Markdown preview package", function() {
    var expectPreviewInSplitPane, preview, workspaceElement, _ref;
    _ref = [], workspaceElement = _ref[0], preview = _ref[1];
    beforeEach(function() {
      var fixturesPath, tempPath;
      fixturesPath = path.join(__dirname, 'fixtures');
      tempPath = temp.mkdirSync('atom');
      wrench.copyDirSyncRecursive(fixturesPath, tempPath, {
        forceDelete: true
      });
      atom.project.setPaths([tempPath]);
      jasmine.useRealClock();
      workspaceElement = atom.views.getView(atom.workspace);
      jasmine.attachToDOM(workspaceElement);
      waitsForPromise(function() {
        return atom.packages.activatePackage("markdown-preview");
      });
      return waitsForPromise(function() {
        return atom.packages.activatePackage('language-gfm');
      });
    });
    expectPreviewInSplitPane = function() {
      runs(function() {
        return expect(atom.workspace.getPanes()).toHaveLength(2);
      });
      waitsFor("markdown preview to be created", function() {
        return preview = atom.workspace.getPanes()[1].getActiveItem();
      });
      return runs(function() {
        expect(preview).toBeInstanceOf(MarkdownPreviewView);
        return expect(preview.getPath()).toBe(atom.workspace.getActivePaneItem().getPath());
      });
    };
    describe("when a preview has not been created for the file", function() {
      it("displays a markdown preview in a split pane", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/file.markdown");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview:toggle');
        });
        expectPreviewInSplitPane();
        return runs(function() {
          var editorPane;
          editorPane = atom.workspace.getPanes()[0];
          expect(editorPane.getItems()).toHaveLength(1);
          return expect(editorPane.isActive()).toBe(true);
        });
      });
      describe("when the editor's path does not exist", function() {
        return it("splits the current pane to the right with a markdown preview for the file", function() {
          waitsForPromise(function() {
            return atom.workspace.open("new.markdown");
          });
          runs(function() {
            return atom.commands.dispatch(workspaceElement, 'markdown-preview:toggle');
          });
          return expectPreviewInSplitPane();
        });
      });
      describe("when the editor does not have a path", function() {
        return it("splits the current pane to the right with a markdown preview for the file", function() {
          waitsForPromise(function() {
            return atom.workspace.open("");
          });
          runs(function() {
            return atom.commands.dispatch(workspaceElement, 'markdown-preview:toggle');
          });
          return expectPreviewInSplitPane();
        });
      });
      describe("when the path contains a space", function() {
        return it("renders the preview", function() {
          waitsForPromise(function() {
            return atom.workspace.open("subdir/file with space.md");
          });
          runs(function() {
            return atom.commands.dispatch(workspaceElement, 'markdown-preview:toggle');
          });
          return expectPreviewInSplitPane();
        });
      });
      return describe("when the path contains accented characters", function() {
        return it("renders the preview", function() {
          waitsForPromise(function() {
            return atom.workspace.open("subdir/áccéntéd.md");
          });
          runs(function() {
            return atom.commands.dispatch(workspaceElement, 'markdown-preview:toggle');
          });
          return expectPreviewInSplitPane();
        });
      });
    });
    describe("when a preview has been created for the file", function() {
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/file.markdown");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview:toggle');
        });
        return expectPreviewInSplitPane();
      });
      it("closes the existing preview when toggle is triggered a second time on the editor", function() {
        var editorPane, previewPane, _ref1;
        atom.commands.dispatch(workspaceElement, 'markdown-preview:toggle');
        _ref1 = atom.workspace.getPanes(), editorPane = _ref1[0], previewPane = _ref1[1];
        expect(editorPane.isActive()).toBe(true);
        return expect(previewPane.getActiveItem()).toBeUndefined();
      });
      it("closes the existing preview when toggle is triggered on it and it has focus", function() {
        var editorPane, previewPane, _ref1;
        _ref1 = atom.workspace.getPanes(), editorPane = _ref1[0], previewPane = _ref1[1];
        previewPane.activate();
        atom.commands.dispatch(workspaceElement, 'markdown-preview:toggle');
        return expect(previewPane.getActiveItem()).toBeUndefined();
      });
      describe("when the editor is modified", function() {
        it("re-renders the preview", function() {
          var markdownEditor;
          spyOn(preview, 'showLoading');
          markdownEditor = atom.workspace.getActiveTextEditor();
          markdownEditor.setText("Hey!");
          waitsFor(function() {
            return preview.text().indexOf("Hey!") >= 0;
          });
          return runs(function() {
            return expect(preview.showLoading).not.toHaveBeenCalled();
          });
        });
        it("invokes ::onDidChangeMarkdown listeners", function() {
          var listener, markdownEditor;
          markdownEditor = atom.workspace.getActiveTextEditor();
          preview.onDidChangeMarkdown(listener = jasmine.createSpy('didChangeMarkdownListener'));
          runs(function() {
            return markdownEditor.setText("Hey!");
          });
          return waitsFor("::onDidChangeMarkdown handler to be called", function() {
            return listener.callCount > 0;
          });
        });
        describe("when the preview is in the active pane but is not the active item", function() {
          return it("re-renders the preview but does not make it active", function() {
            var markdownEditor, previewPane;
            markdownEditor = atom.workspace.getActiveTextEditor();
            previewPane = atom.workspace.getPanes()[1];
            previewPane.activate();
            waitsForPromise(function() {
              return atom.workspace.open();
            });
            runs(function() {
              return markdownEditor.setText("Hey!");
            });
            waitsFor(function() {
              return preview.text().indexOf("Hey!") >= 0;
            });
            return runs(function() {
              expect(previewPane.isActive()).toBe(true);
              return expect(previewPane.getActiveItem()).not.toBe(preview);
            });
          });
        });
        describe("when the preview is not the active item and not in the active pane", function() {
          return it("re-renders the preview and makes it active", function() {
            var editorPane, markdownEditor, previewPane, _ref1;
            markdownEditor = atom.workspace.getActiveTextEditor();
            _ref1 = atom.workspace.getPanes(), editorPane = _ref1[0], previewPane = _ref1[1];
            previewPane.splitRight({
              copyActiveItem: true
            });
            previewPane.activate();
            waitsForPromise(function() {
              return atom.workspace.open();
            });
            runs(function() {
              editorPane.activate();
              return markdownEditor.setText("Hey!");
            });
            waitsFor(function() {
              return preview.text().indexOf("Hey!") >= 0;
            });
            return runs(function() {
              expect(editorPane.isActive()).toBe(true);
              return expect(previewPane.getActiveItem()).toBe(preview);
            });
          });
        });
        return describe("when the liveUpdate config is set to false", function() {
          return it("only re-renders the markdown when the editor is saved, not when the contents are modified", function() {
            var didStopChangingHandler;
            atom.config.set('markdown-preview.liveUpdate', false);
            didStopChangingHandler = jasmine.createSpy('didStopChangingHandler');
            atom.workspace.getActiveTextEditor().getBuffer().onDidStopChanging(didStopChangingHandler);
            atom.workspace.getActiveTextEditor().setText('ch ch changes');
            waitsFor(function() {
              return didStopChangingHandler.callCount > 0;
            });
            runs(function() {
              expect(preview.text()).not.toContain("ch ch changes");
              return atom.workspace.getActiveTextEditor().save();
            });
            return waitsFor(function() {
              return preview.text().indexOf("ch ch changes") >= 0;
            });
          });
        });
      });
      return describe("when a new grammar is loaded", function() {
        return it("re-renders the preview", function() {
          var grammarAdded;
          atom.workspace.getActiveTextEditor().setText("```javascript\nvar x = y;\n```");
          waitsFor("markdown to be rendered after its text changed", function() {
            return preview.find("atom-text-editor").data("grammar") === "text plain null-grammar";
          });
          grammarAdded = false;
          runs(function() {
            return atom.grammars.onDidAddGrammar(function() {
              return grammarAdded = true;
            });
          });
          waitsForPromise(function() {
            expect(atom.packages.isPackageActive('language-javascript')).toBe(false);
            return atom.packages.activatePackage('language-javascript');
          });
          waitsFor("grammar to be added", function() {
            return grammarAdded;
          });
          return waitsFor("markdown to be rendered after grammar was added", function() {
            return preview.find("atom-text-editor").data("grammar") !== "source js";
          });
        });
      });
    });
    describe("when the markdown preview view is requested by file URI", function() {
      return it("opens a preview editor and watches the file for changes", function() {
        waitsForPromise("atom.workspace.open promise to be resolved", function() {
          return atom.workspace.open("markdown-preview://" + (atom.project.getDirectories()[0].resolve('subdir/file.markdown')));
        });
        runs(function() {
          preview = atom.workspace.getActivePaneItem();
          expect(preview).toBeInstanceOf(MarkdownPreviewView);
          spyOn(preview, 'renderMarkdownText');
          return preview.file.emitter.emit('did-change');
        });
        return waitsFor("markdown to be re-rendered after file changed", function() {
          return preview.renderMarkdownText.callCount > 0;
        });
      });
    });
    describe("when the editor's grammar it not enabled for preview", function() {
      return it("does not open the markdown preview", function() {
        atom.config.set('markdown-preview.grammars', []);
        waitsForPromise(function() {
          return atom.workspace.open("subdir/file.markdown");
        });
        return runs(function() {
          spyOn(atom.workspace, 'open').andCallThrough();
          atom.commands.dispatch(workspaceElement, 'markdown-preview:toggle');
          return expect(atom.workspace.open).not.toHaveBeenCalled();
        });
      });
    });
    describe("when the editor's path changes on #win32 and #darwin", function() {
      return it("updates the preview's title", function() {
        var titleChangedCallback;
        titleChangedCallback = jasmine.createSpy('titleChangedCallback');
        waitsForPromise(function() {
          return atom.workspace.open("subdir/file.markdown");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview:toggle');
        });
        expectPreviewInSplitPane();
        runs(function() {
          expect(preview.getTitle()).toBe('file.markdown Preview');
          preview.onDidChangeTitle(titleChangedCallback);
          return fs.renameSync(atom.workspace.getActiveTextEditor().getPath(), path.join(path.dirname(atom.workspace.getActiveTextEditor().getPath()), 'file2.md'));
        });
        waitsFor(function() {
          return preview.getTitle() === "file2.md Preview";
        });
        return runs(function() {
          return expect(titleChangedCallback).toHaveBeenCalled();
        });
      });
    });
    describe("when the URI opened does not have a markdown-preview protocol", function() {
      return it("does not throw an error trying to decode the URI (regression)", function() {
        waitsForPromise(function() {
          return atom.workspace.open('%');
        });
        return runs(function() {
          return expect(atom.workspace.getActiveTextEditor()).toBeTruthy();
        });
      });
    });
    describe("when markdown-preview:copy-html is triggered", function() {
      it("copies the HTML to the clipboard", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/simple.md");
        });
        return runs(function() {
          atom.commands.dispatch(workspaceElement, 'markdown-preview:copy-html');
          expect(atom.clipboard.read()).toBe("<p><em>italic</em></p>\n<p><strong>bold</strong></p>\n<p>encoding \u2192 issue</p>");
          atom.workspace.getActiveTextEditor().setSelectedBufferRange([[0, 0], [1, 0]]);
          atom.commands.dispatch(workspaceElement, 'markdown-preview:copy-html');
          return expect(atom.clipboard.read()).toBe("<p><em>italic</em></p>");
        });
      });
      return describe("code block tokenization", function() {
        preview = null;
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.packages.activatePackage('language-ruby');
          });
          waitsForPromise(function() {
            return atom.packages.activatePackage('markdown-preview');
          });
          waitsForPromise(function() {
            return atom.workspace.open("subdir/file.markdown");
          });
          return runs(function() {
            workspaceElement = atom.views.getView(atom.workspace);
            atom.commands.dispatch(workspaceElement, 'markdown-preview:copy-html');
            return preview = $('<div>').append(atom.clipboard.read());
          });
        });
        describe("when the code block's fence name has a matching grammar", function() {
          return it("tokenizes the code block with the grammar", function() {
            return expect(preview.find("pre span.entity.name.function.ruby")).toExist();
          });
        });
        describe("when the code block's fence name doesn't have a matching grammar", function() {
          return it("does not tokenize the code block", function() {
            return expect(preview.find("pre.lang-kombucha .line .null-grammar").children().length).toBe(2);
          });
        });
        describe("when the code block contains empty lines", function() {
          return it("doesn't remove the empty lines", function() {
            expect(preview.find("pre.lang-python").children().length).toBe(6);
            expect(preview.find("pre.lang-python div:nth-child(2)").text().trim()).toBe('');
            expect(preview.find("pre.lang-python div:nth-child(4)").text().trim()).toBe('');
            return expect(preview.find("pre.lang-python div:nth-child(5)").text().trim()).toBe('');
          });
        });
        return describe("when the code block is nested in a list", function() {
          return it("detects and styles the block", function() {
            return expect(preview.find("pre.lang-javascript")).toHaveClass('editor-colors');
          });
        });
      });
    });
    describe("sanitization", function() {
      it("removes script tags and attributes that commonly contain inline scripts", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/evil.md");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview:toggle');
        });
        expectPreviewInSplitPane();
        return runs(function() {
          return expect(preview[0].innerHTML).toBe("<p>hello</p>\n<p></p>\n<p>\n<img>\nworld</p>");
        });
      });
      return it("remove the first <!doctype> tag at the beginning of the file", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/doctype-tag.md");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview:toggle');
        });
        expectPreviewInSplitPane();
        return runs(function() {
          return expect(preview[0].innerHTML).toBe("<p>content\n&lt;!doctype html&gt;</p>");
        });
      });
    });
    describe("when the markdown contains an <html> tag", function() {
      return it("does not throw an exception", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/html-tag.md");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview:toggle');
        });
        expectPreviewInSplitPane();
        return runs(function() {
          return expect(preview[0].innerHTML).toBe("content");
        });
      });
    });
    return describe("when the markdown contains a <pre> tag", function() {
      return it("does not throw an exception", function() {
        waitsForPromise(function() {
          return atom.workspace.open("subdir/pre-tag.md");
        });
        runs(function() {
          return atom.commands.dispatch(workspaceElement, 'markdown-preview:toggle');
        });
        expectPreviewInSplitPane();
        return runs(function() {
          return expect(preview.find('atom-text-editor')).toExist();
        });
      });
    });
  });

}).call(this);
