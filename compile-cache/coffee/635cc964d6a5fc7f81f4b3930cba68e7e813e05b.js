(function() {
  var Scroll, ScrollCursor, ScrollCursorToBottom, ScrollCursorToMiddle, ScrollCursorToTop, ScrollDown, ScrollHalfScreenDown, ScrollHalfScreenUp, ScrollUp,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Scroll = (function() {
    Scroll.prototype.isComplete = function() {
      return true;
    };

    Scroll.prototype.isRecordable = function() {
      return false;
    };

    function Scroll(editor) {
      this.editor = editor;
      this.scrolloff = 2;
      this.rows = {
        first: this.editor.getFirstVisibleScreenRow(),
        last: this.editor.getLastVisibleScreenRow(),
        final: this.editor.getLastScreenRow()
      };
    }

    return Scroll;

  })();

  ScrollDown = (function(_super) {
    __extends(ScrollDown, _super);

    function ScrollDown() {
      return ScrollDown.__super__.constructor.apply(this, arguments);
    }

    ScrollDown.prototype.execute = function(count) {
      if (count == null) {
        count = 1;
      }
      this.keepCursorOnScreen(count);
      return this.scrollUp(count);
    };

    ScrollDown.prototype.keepCursorOnScreen = function(count) {
      var column, firstScreenRow, row, _ref;
      _ref = this.editor.getCursorScreenPosition(), row = _ref.row, column = _ref.column;
      firstScreenRow = this.rows.first + this.scrolloff + 1;
      if (row - count <= firstScreenRow) {
        return this.editor.setCursorScreenPosition([firstScreenRow + count, column]);
      }
    };

    ScrollDown.prototype.scrollUp = function(count) {
      var lastScreenRow;
      lastScreenRow = this.rows.last - this.scrolloff;
      return this.editor.scrollToScreenPosition([lastScreenRow + count, 0]);
    };

    return ScrollDown;

  })(Scroll);

  ScrollUp = (function(_super) {
    __extends(ScrollUp, _super);

    function ScrollUp() {
      return ScrollUp.__super__.constructor.apply(this, arguments);
    }

    ScrollUp.prototype.execute = function(count) {
      if (count == null) {
        count = 1;
      }
      this.keepCursorOnScreen(count);
      return this.scrollDown(count);
    };

    ScrollUp.prototype.keepCursorOnScreen = function(count) {
      var column, lastScreenRow, row, _ref;
      _ref = this.editor.getCursorScreenPosition(), row = _ref.row, column = _ref.column;
      lastScreenRow = this.rows.last - this.scrolloff - 1;
      if (row + count >= lastScreenRow) {
        return this.editor.setCursorScreenPosition([lastScreenRow - count, column]);
      }
    };

    ScrollUp.prototype.scrollDown = function(count) {
      var firstScreenRow;
      firstScreenRow = this.rows.first + this.scrolloff;
      return this.editor.scrollToScreenPosition([firstScreenRow - count, 0]);
    };

    return ScrollUp;

  })(Scroll);

  ScrollCursor = (function(_super) {
    __extends(ScrollCursor, _super);

    function ScrollCursor(editor, opts) {
      var cursor;
      this.editor = editor;
      this.opts = opts != null ? opts : {};
      ScrollCursor.__super__.constructor.apply(this, arguments);
      cursor = this.editor.getCursorScreenPosition();
      this.pixel = this.editor.pixelPositionForScreenPosition(cursor).top;
    }

    return ScrollCursor;

  })(Scroll);

  ScrollCursorToTop = (function(_super) {
    __extends(ScrollCursorToTop, _super);

    function ScrollCursorToTop() {
      return ScrollCursorToTop.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToTop.prototype.execute = function() {
      if (!this.opts.leaveCursor) {
        this.moveToFirstNonBlank();
      }
      return this.scrollUp();
    };

    ScrollCursorToTop.prototype.scrollUp = function() {
      if (this.rows.last === this.rows.final) {
        return;
      }
      this.pixel -= this.editor.getLineHeightInPixels() * this.scrolloff;
      return this.editor.setScrollTop(this.pixel);
    };

    ScrollCursorToTop.prototype.moveToFirstNonBlank = function() {
      return this.editor.moveToFirstCharacterOfLine();
    };

    return ScrollCursorToTop;

  })(ScrollCursor);

  ScrollCursorToMiddle = (function(_super) {
    __extends(ScrollCursorToMiddle, _super);

    function ScrollCursorToMiddle() {
      return ScrollCursorToMiddle.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToMiddle.prototype.execute = function() {
      if (!this.opts.leaveCursor) {
        this.moveToFirstNonBlank();
      }
      return this.scrollMiddle();
    };

    ScrollCursorToMiddle.prototype.scrollMiddle = function() {
      this.pixel -= this.editor.getHeight() / 2;
      return this.editor.setScrollTop(this.pixel);
    };

    ScrollCursorToMiddle.prototype.moveToFirstNonBlank = function() {
      return this.editor.moveToFirstCharacterOfLine();
    };

    return ScrollCursorToMiddle;

  })(ScrollCursor);

  ScrollCursorToBottom = (function(_super) {
    __extends(ScrollCursorToBottom, _super);

    function ScrollCursorToBottom() {
      return ScrollCursorToBottom.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToBottom.prototype.execute = function() {
      if (!this.opts.leaveCursor) {
        this.moveToFirstNonBlank();
      }
      return this.scrollDown();
    };

    ScrollCursorToBottom.prototype.scrollDown = function() {
      var offset;
      if (this.rows.first === 0) {
        return;
      }
      offset = this.editor.getLineHeightInPixels() * (this.scrolloff + 1);
      this.pixel -= this.editor.getHeight() - offset;
      return this.editor.setScrollTop(this.pixel);
    };

    ScrollCursorToBottom.prototype.moveToFirstNonBlank = function() {
      return this.editor.moveToFirstCharacterOfLine();
    };

    return ScrollCursorToBottom;

  })(ScrollCursor);

  ScrollHalfScreenUp = (function(_super) {
    __extends(ScrollHalfScreenUp, _super);

    function ScrollHalfScreenUp() {
      return ScrollHalfScreenUp.__super__.constructor.apply(this, arguments);
    }

    ScrollHalfScreenUp.prototype.execute = function() {
      this.scrollDown();
      return this.moveCursor();
    };

    ScrollHalfScreenUp.prototype.moveCursor = function() {
      var column, currentFirstScreenRow, dest, row, _ref;
      _ref = this.editor.getCursorScreenPosition(), row = _ref.row, column = _ref.column;
      currentFirstScreenRow = this.editor.getFirstVisibleScreenRow();
      dest = currentFirstScreenRow + row - this.rows.first;
      if (dest >= 0) {
        return this.editor.setCursorScreenPosition([dest, column]);
      }
    };

    ScrollHalfScreenUp.prototype.scrollDown = function() {
      var dest;
      dest = this.editor.getScrollTop() - Math.floor(this.editor.getHeight() / 2);
      return this.editor.setScrollTop(dest);
    };

    return ScrollHalfScreenUp;

  })(Scroll);

  ScrollHalfScreenDown = (function(_super) {
    __extends(ScrollHalfScreenDown, _super);

    function ScrollHalfScreenDown() {
      return ScrollHalfScreenDown.__super__.constructor.apply(this, arguments);
    }

    ScrollHalfScreenDown.prototype.execute = function() {
      this.scrollUp();
      return this.moveCursor();
    };

    ScrollHalfScreenDown.prototype.moveCursor = function() {
      var column, currentFirstScreenRow, dest, row, _ref;
      _ref = this.editor.getCursorScreenPosition(), row = _ref.row, column = _ref.column;
      currentFirstScreenRow = this.editor.getFirstVisibleScreenRow();
      dest = currentFirstScreenRow + row - this.rows.first;
      if (dest <= this.rows.final) {
        return this.editor.setCursorScreenPosition([dest, column]);
      }
    };

    ScrollHalfScreenDown.prototype.scrollUp = function() {
      var dest;
      dest = this.editor.getScrollTop() + Math.floor(this.editor.getHeight() / 2);
      return this.editor.setScrollTop(dest);
    };

    return ScrollHalfScreenDown;

  })(Scroll);

  module.exports = {
    ScrollDown: ScrollDown,
    ScrollUp: ScrollUp,
    ScrollCursorToTop: ScrollCursorToTop,
    ScrollCursorToMiddle: ScrollCursorToMiddle,
    ScrollCursorToBottom: ScrollCursorToBottom,
    ScrollHalfScreenUp: ScrollHalfScreenUp,
    ScrollHalfScreenDown: ScrollHalfScreenDown
  };

}).call(this);
