(function() {
  var $, Highlights, cheerio, convertCodeBlocksToAtomEditors, fs, highlighter, mathjaxHelper, packagePath, path, render, resolveImagePaths, resourcePath, roaster, sanitize, scopeForFenceName, tokenizeCodeBlocks, _;

  path = require('path');

  _ = require('underscore-plus');

  cheerio = require('cheerio');

  fs = require('fs-plus');

  Highlights = require('highlights');

  $ = require('atom-space-pen-views').$;

  roaster = null;

  scopeForFenceName = require('./extension-helper').scopeForFenceName;

  mathjaxHelper = require('./mathjax-helper');

  highlighter = null;

  resourcePath = atom.getLoadSettings().resourcePath;

  packagePath = path.dirname(__dirname);

  exports.toDOMFragment = function(text, filePath, grammar, callback) {
    if (text == null) {
      text = '';
    }
    return render(text, filePath, function(error, html) {
      var defaultCodeLanguage, domFragment, template;
      if (error != null) {
        return callback(error);
      }
      template = document.createElement('template');
      template.innerHTML = html;
      domFragment = template.content.cloneNode(true);
      if ((grammar != null ? grammar.scopeName : void 0) === 'source.litcoffee') {
        defaultCodeLanguage = 'coffee';
      }
      convertCodeBlocksToAtomEditors(domFragment, defaultCodeLanguage);
      return callback(null, domFragment);
    });
  };

  exports.toHTML = function(text, filePath, grammar, renderLaTeX, callback) {
    if (text == null) {
      text = '';
    }
    return render(text, filePath, renderLaTeX, function(error, html) {
      var defaultCodeLanguage;
      if (error != null) {
        return callback(error);
      }
      if ((grammar != null ? grammar.scopeName : void 0) === 'source.litcoffee') {
        defaultCodeLanguage = 'coffee';
      }
      html = tokenizeCodeBlocks(html, defaultCodeLanguage);
      return callback(null, html);
    });
  };

  render = function(text, filePath, renderLaTeX, callback) {
    var options;
    if (roaster == null) {
      roaster = require(path.join(packagePath, 'node_modules/roaster/lib/roaster'));
    }
    options = {
      mathjax: renderLaTeX,
      sanitize: false,
      breaks: atom.config.get('markdown-preview-plus.breakOnSingleNewline')
    };
    text = text.replace(/^\s*<!doctype(\s+.*)?>\s*/i, '');
    return roaster(text, options, (function(_this) {
      return function(error, html) {
        if (error != null) {
          return callback(error);
        }
        html = sanitize(html);
        html = resolveImagePaths(html, filePath);
        return callback(null, html.trim());
      };
    })(this));
  };

  sanitize = function(html) {
    var attribute, attributesToRemove, o, _i, _len;
    o = cheerio.load("<div>" + html + "</div>");
    o("script:not([type^='math/tex'])").remove();
    attributesToRemove = ['onabort', 'onblur', 'onchange', 'onclick', 'ondbclick', 'onerror', 'onfocus', 'onkeydown', 'onkeypress', 'onkeyup', 'onload', 'onmousedown', 'onmousemove', 'onmouseover', 'onmouseout', 'onmouseup', 'onreset', 'onresize', 'onscroll', 'onselect', 'onsubmit', 'onunload'];
    for (_i = 0, _len = attributesToRemove.length; _i < _len; _i++) {
      attribute = attributesToRemove[_i];
      o('*').removeAttr(attribute);
    }
    return o.html();
  };

  resolveImagePaths = function(html, filePath) {
    var img, imgElement, o, rootDirectory, src, _i, _len, _ref;
    rootDirectory = atom.project.relativizePath(filePath)[0];
    o = cheerio.load(html);
    _ref = o('img');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      imgElement = _ref[_i];
      img = o(imgElement);
      if (src = img.attr('src')) {
        if (src.match(/^(https?|atom):\/\//)) {
          continue;
        }
        if (src.startsWith(process.resourcesPath)) {
          continue;
        }
        if (src.startsWith(resourcePath)) {
          continue;
        }
        if (src.startsWith(packagePath)) {
          continue;
        }
        if (src[0] === '/') {
          if (!fs.isFileSync(src)) {
            img.attr('src', path.join(rootDirectory, src.substring(1)));
          }
        } else {
          img.attr('src', path.resolve(path.dirname(filePath), src));
        }
      }
    }
    return o.html();
  };

  convertCodeBlocksToAtomEditors = function(domFragment, defaultLanguage) {
    var codeBlock, codeElement, editor, editorElement, fenceName, fontFamily, grammar, preElement, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4;
    if (defaultLanguage == null) {
      defaultLanguage = 'text';
    }
    if (fontFamily = atom.config.get('editor.fontFamily')) {
      _ref = domFragment.querySelectorAll('code');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        codeElement = _ref[_i];
        codeElement.style.fontFamily = fontFamily;
      }
    }
    _ref1 = domFragment.querySelectorAll('pre');
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      preElement = _ref1[_j];
      codeBlock = (_ref2 = preElement.firstElementChild) != null ? _ref2 : preElement;
      fenceName = (_ref3 = (_ref4 = codeBlock.getAttribute('class')) != null ? _ref4.replace(/^lang-/, '') : void 0) != null ? _ref3 : defaultLanguage;
      editorElement = document.createElement('atom-text-editor');
      editorElement.setAttributeNode(document.createAttribute('gutter-hidden'));
      editorElement.removeAttribute('tabindex');
      preElement.parentNode.insertBefore(editorElement, preElement);
      preElement.remove();
      editor = editorElement.getModel();
      editor.getDecorations({
        "class": 'cursor-line',
        type: 'line'
      })[0].destroy();
      editor.setText(codeBlock.textContent.trim());
      if (grammar = atom.grammars.grammarForScopeName(scopeForFenceName(fenceName))) {
        editor.setGrammar(grammar);
      }
    }
    return domFragment;
  };

  tokenizeCodeBlocks = function(html, defaultLanguage) {
    var codeBlock, fenceName, fontFamily, highlightedBlock, highlightedHtml, o, preElement, _i, _len, _ref, _ref1, _ref2;
    if (defaultLanguage == null) {
      defaultLanguage = 'text';
    }
    o = cheerio.load(html);
    if (fontFamily = atom.config.get('editor.fontFamily')) {
      o('code').css('font-family', fontFamily);
    }
    _ref = o("pre");
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      preElement = _ref[_i];
      codeBlock = o(preElement).children().first();
      fenceName = (_ref1 = (_ref2 = codeBlock.attr('class')) != null ? _ref2.replace(/^lang-/, '') : void 0) != null ? _ref1 : defaultLanguage;
      if (highlighter == null) {
        highlighter = new Highlights({
          registry: atom.grammars
        });
      }
      highlightedHtml = highlighter.highlightSync({
        fileContents: codeBlock.text(),
        scopeName: scopeForFenceName(fenceName)
      });
      highlightedBlock = o(highlightedHtml);
      highlightedBlock.removeClass('editor').addClass("lang-" + fenceName);
      o(preElement).replaceWith(highlightedBlock);
    }
    return o.html();
  };

}).call(this);
