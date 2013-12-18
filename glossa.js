var mori = require('mori');

var Glossa = {};

/**
 * Dev-time HTML interface to compiler
 */
if(!!this.CodeMirror) {
  Glossa.initializeDev = function() {
    console.log("[x] Initializing dev environment");
    var sharedConfig = {
      mode: "clojure",
      theme: "blackboard",
      tabSize: 2
    };
    Glossa.devEditor = CodeMirror.fromTextArea(document.getElementById('input'), sharedConfig);
    Glossa.devOutput = CodeMirror.fromTextArea(document.getElementById('output'), sharedConfig);
  }

  Glossa.readInputField = function() {
    return Glossa.devEditor.getValue();
  }

  Glossa.writeOutputField = function(s) {
    // setValue requires a string
    Glossa.devOutput.setValue('' + s);
  }

  Glossa.mainUi = function() {
    var output = objformat(Glossa.compile(Glossa.readInputField()));
    console.log("FINAL OUTPUT:", output);
    Glossa.writeOutputField(output);
  }
}

/***
 * Pretty-printers
 ***/

function arrayformat(o) {
  var s = '#[';
  var j = o.length - 1;
  for(var i = 0; i<o.length; i++) {
    s += objformat(o[i]);
    if(i !== j) s += ',';
  }
  s += ']';
  return s;
}

function listformat(o) {
  var s = '(';
  var i = 0;
  var j = mori.count(o) - 1;
  mori.each(o, function(x) {
    console.log("X??:", x, typeof(x));
    s += objformat(x);
    if(i !== j) s += ' ';
    i++
  });
  s += ')';
  return s;
}

function vectorformat(o) {
  var s = '[';
  var i = 0;
  var j = mori.count(o) - 1;
  mori.each(o, function(x) {
    s += objformat(x);
    if(i !== j) s += ' ';
    i++;
  });
  s += ']';
  return s;
}

function mapformat(o) {
  var s = '{';
  var i = 0;
  var j = mori.count(mori.keys(o)) - 1;
  mori.each(o, function(entry) {
    s += objformat(mori.first(entry)) + ' ' + objformat(mori.first(mori.rest(entry)));
    if(i !== j) s += ', ';
    i++;
  });
  s += '}';
  return s;
}

function setformat(o) {
  var s = '#{';
  var i = 0;
  var j = mori.count(o) - 1;
  mori.each(o, function(x) {
    s += objformat(x);
    if(i !== j) s += ' ';
    i++;
  });
  s += '}';
  return s;
}

/**
 * Entry-point pretty-printer
 */
function objformat(o) {
  // null
  if(o == null) {
    return 'null';
  }
  // mori types
  else if(mori.is_list(o)) {
    console.log("IS LIST!");
    return listformat(o);
  }
  else if(mori.is_vector(o)) {
    return vectorformat(o);
  }
  else if(mori.is_map(o)) {
    return mapformat(o);
  } else if(mori.is_set(o)) {
    return setformat(o);
  }
  // arrays
  else if(o instanceof Array) {
    return arrayformat(o);
  }
  // strings
  else if(typeof(o) === 'string') {
    return '"' + o + '"';
  }
  // things with fine representations already
  else if (o instanceof RegExp ||
           typeof(o) !== 'object') {
    return o;
  }
  // plain ol' objects
  else {
    // Not readable
    var s = 'native_obj{';
    var j = Object.keys(o).length - 1;
    var i = 0;
    for(var k in o) {
      var v = o[k];
      s += '"' + k + '"' + ' : ' + objformat(v);
      if(i !== j) s += ', ';
      i++;
    }
    s += '}';
    return s;
  }
}

/****************
 * StringBuffer
 *
 * Copied from Google Closure's goog.string.StringBuffer implementation
 ****************/

/**
 * Utility class to facilitate string concatenation.
 *
 * @param {*=} opt_a1 Optional first initial item to append.
 * @param {...*} var_args Other initial items to
 *     append, e.g., new StringBuffer('foo', 'bar').
 * @constructor
 */
function StringBuffer(opt_a1, var_args) {
  if (opt_a1 != null) {
    this.append.apply(this, arguments);
  }
};


/**
 * Internal buffer for the string to be concatenated.
 * @type {string}
 * @private
 */
StringBuffer.prototype.buffer_ = '';


/**
 * Sets the contents of the string buffer object, replacing what's currently
 * there.
 *
 * @param {*} s String to set.
 */
StringBuffer.prototype.set = function(s) {
  this.buffer_ = '' + s;
};


/**
 * Appends one or more items to the buffer.
 *
 * Calling this with null, undefined, or empty arguments is an error.
 *
 * @param {*} a1 Required first string.
 * @param {*=} opt_a2 Optional second string.
 * @param {...*} var_args Other items to append,
 *     e.g., sb.append('foo', 'bar', 'baz').
 * @return {StringBuffer} This same StringBuffer object.
 * @suppress {duplicate}
 */
StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
  // Use a1 directly to avoid arguments instantiation for single-arg case.
  this.buffer_ += a1;
  if (opt_a2 != null) { // second argument is undefined (null == undefined)
    for (var i = 1; i < arguments.length; i++) {
      this.buffer_ += arguments[i];
    }
  }
  return this;
};


/**
 * Clears the internal buffer.
 */
StringBuffer.prototype.clear = function() {
  this.buffer_ = '';
};


/**
 * @return {number} the length of the current contents of the buffer.
 */
StringBuffer.prototype.getLength = function() {
  return this.buffer_.length;
};


/**
 * @return {string} The concatenated string.
 * @override
 */
StringBuffer.prototype.toString = function() {
  return this.buffer_;
};

function StringPushbackReader(s, buffer, idx) {
  this.s = s;
  this.buffer = buffer;
  this.idx = idx;
}

StringPushbackReader.prototype.readChar = function() {
  if (this.buffer.length === 0) {
    this.idx += 1;
    return this.s[this.idx];
  } else {
    return this.buffer.pop();
  }
}

StringPushbackReader.prototype.unreadChar = function(ch) {
  this.buffer.push(ch);
}

StringPushbackReader.prototype.readTwoChars = function() {
  new StringBuffer(this.readChar(), this.readChar()).toString();
}

StringPushbackReader.prototype.readFourChars = function() {
  new StringBuffer(this.readChar(), this.readChar(),
                   this.readChar(), this.readChar()).toString();
}

/**
 * Read until first character that doesn't match the predicate,
 * return that character.
 */
StringPushbackReader.prototype.readPast = function(pred) {
  for(; ;) {
    var ch = this.readChar();
    if(pred(ch))
      continue;
    else
      return ch;
  }
}

function stringPushbackReader(s) {
  return new StringPushbackReader(s, [], -1);
}

/**
 * Checks whether a string contains a given substring.
 * @param {string} s The string to test.
 * @param {string} ss The substring to test for.
 * @return {boolean} True if {@code s} contains {@code ss}.
 */
function strContains(s, ss) {
  return s.indexOf(ss) != -1;
};

/**
 * Verifies that a match matches from end-to-end,
 * returning either the whole string back or the array of matches
 * if groups were used.
 */
function regexMatches(re, s) {
  var matches = re.exec(s);
  if(matches != null && matches[0] === s) {
    if(matches.length === 1) {
      return matches[0];
    } else {
      return matches;
    }
  }
}

/**
 * Same as regexMatches, excepts doesn't required end-to-end match.
 */
function regexFind(re, s) {
  var matches = re.exec(s);
  if(matches != null) {
    if(matches.length === 1) {
      return matches[0];
    } else {
      return matches;
    }
  }
}

var intPattern = /^([-+]?)(?:(0)|([1-9][0-9]*)|0[xX]([0-9A-Fa-f]+)|0([0-7]+)|([1-9][0-9]?)[rR]([0-9A-Za-z]+)|0[0-9]+)(N)?$/;
var floatPattern = /([-+]?[0-9]+(\.[0-9]*)?([eE][-+]?[0-9]+)?)(M)?/;
var ratioPattern = /([-+]?[0-9]+)\/([0-9]+)/;
var symbolPattern = /[:]?([^0-9\/].*\/)?([^0-9\/][^\/]*)/

// Google Closure's isBreakingWhitespace
function isCharacterWhitespace(s) {
  return !/[^\t\n\r ]/.test(s);
}

/**
 * This differs from Google Closure's function of the same name
 * in that it is, in fact, limited only to breaking whitespace and
 * not to all whitespace.
 */
function isBreakingWhitespace(s) {
  return !/[^\n\r]/.test(s);
}

/**
 * All whitespace considered by Clojure/Glossa.
 */
function isWhitespace(s) {
  return isCharacterWhitespace(s) || s === ',';
}

function isMacroTerminating(s) {
  return (s !== '#' &&
          s !== "'" &&
          s !== ':' &&
          macros(s))
}

// From Google Closure goog.string
function isNumeric(s) {
  return !/[^0-9]/.test(s);
}

function isNumberLiteral(reader, s) {
  if(isNumeric(s)) {
    return true;
  } else {
    var isSign = (s === '+' || s === '-');
    var nextChar = reader.readChar();
    reader.unreadChar(nextChar);
    return isSign && isNumeric(nextChar);
  }
}

function matchInt(s) {
  var groups = regexFind(intPattern, s);
  var group3 = groups[2];
  if (!(group3 == null || group3.length < 1)) {
    return 0;
  } else {
    var negate = groups[1] === '-' ? -1 : 1;
    var a;
    if(groups[3] != null) a = [groups[3], 10];
    if(groups[4] != null) a = [groups[4], 16];
    if(groups[5] != null) a = [groups[5], 8];
    if(groups[7] != null) a = [groups[7], parseInt(groups[7])];
    if(a == null) a = [null, null];
    var n = a[0];
    var radix = a[1];
    if(n == null) {
      return null;
    } else {
      return buildToken(Glossa.Tags.integer, negate * parseInt(n, radix));
    }
  }
}

function matchFloat(s) {
  return buildToken(Glossa.Tags.float, parseFloat(s));
}

function matchRatio(s) {
  var groups = regexFind(ratioPattern, s);
  var numerator = groups[1];
  var denominator = groups[2];
  return buildToken(Glossa.Tags.ratio, [parseInt(numerator,10), parseInt(denominator,10)]);
}

function matchNumber(s) {
  if(regexMatches(intPattern, s)) {
    return matchInt(s);
  } else if(regexMatches(floatPattern, s)) {
    return matchFloat(s);
  } else if(regexMatches(ratioPattern, s)) {
    return matchRatio(s);
  } else {
    return null;
  }
}

function isCommentPrefix(s) {
  return s === ';';
}

function skipLine(reader, ch) {
  for(; ;) {
    if(isBreakingWhitespace(ch) || ch == null)
      return reader;
  }
}

function escapeCharMapping(c) {
  if(c === 't') return "\t";
  if(c === 'r') return "\r";
  if(c === 'n') return "\n";
  if(c === '\\') return '\\';
  if(c === '"') return '"';
  if(c === 'b') return "\b";
  if(c === 'f') return "\f";
  return null;
}

function validateUnicodeEscape(unicodePattern, reader, escapeChar, unicodeStr) {
  if(regexMatches(unicodePattern, unicodeStr)) {
    return unicodeStr;
  } else {
    throw new Error("Unexpected unicode escape \\" + escapeChar + unicodeStr);
  }
}

function makeUnicodeChar(codeStr) {
  return String.fromCharCode(parseInt(codeStr, 16));
}

var unicodeTwoPattern = /[0-9A-Fa-f]{2}/;
var unicodeFourPattern = /[0-9A-Fa-f]{4}/;

function escapeChar(buffer, reader) {
  var ch = reader.readChar();
  var known = escapeCharMapping(ch);
  if(known) {
    return known;
  } else {
    if(ch === 'x') {
      var chs = reader.readTwoChars();
      var unicodeStr = validateUnicodeEscape(unicodeTwoPattern, reader, ch, chs);
      return makeUnicodeChar(unicodeStr);
    } else if(ch === 'u') {
      var chs = reader.readFourChars();
      var unicodeStr = validateUnicodeEscape(unicodeFourPattern, reader, ch, chs);
      return makeUnicodeChar(unicodeStr);
    } else if(isNumeric(ch)) {
      return String.fromCharCode(ch);
    } else {
      throw new Error("Unexpected unicode escape \\" + ch);
    }
  }
}

function readDispatch(reader, na) {
  var ch = reader.readChar();
  var dm = dispatchMacros(ch);
  if(dm) {
    return dm(reader, na);
  } else {
    // TODO Tagged type
    throw new Error("No dispatch macro for " + ch);
  }
}

function readString(reader, ch) {
  console.log("[x] Read String");
  var buffer = new StringBuffer();
  for(; ;) {
    var ch = reader.readChar();
    if(ch == null) throw new Error("EOF while reading string");
    if(ch === '\\') {
      buffer.append(escapeChar(buffer, reader));
    } else if(ch === '"') {
      return buildToken(Glossa.Tags.string, buffer.toString());
    } else {
      buffer.append(ch);
    }
  }
}

function readRegex(reader, ch) {
  return buildToken(Glossa.Tags.regex, new RegExp(readString(reader, ch)));
}

function readKeyword(reader, initch) {
  var token, a, kw, ns, name;
  token = readToken(reader, reader.readChar());
  a = regexMatches(symbolPattern, token);
  token = a[0];
  ns = a[1];
  name = a[2];
  if((ns != null && ns.slice(ns.length-2,ns.length) === ':/') ||
     (name[name.length-1] === ':') ||
     (token.indexOf('::') !== -1)) {
    throw new Error("Invalid token for keyword: " + token);
  } else {
    if(ns != null && ns.length > 0) {
      kw = buildKeyword(ns.slice(0, ns.indexOf('/')), name);
    } else {
      kw = buildKeyword(null, token);
    }
  }
  return buildToken(Glossa.Tags.keyword, kw);
}

function readUnmatchedDelimiter(reader, ch) {
  throw new Error("Unmatched delimiter " + ch);
}

function readDelimitedList(delim, reader, isRecursive) {
  var a = [];
  for(; ;) {
    var ch = reader.readPast(isWhitespace);
    if(!ch) throw new Error("EOF while reading delimited list");
    if(ch === delim) {
      return a;
    } else {
      var macroFn = macros(ch);
      if(macroFn) {
        var result = macroFn(reader, ch);
        if(result === reader) {
          return a;
        } else {
          a.push(result);
          continue;
        }
      } else {
        reader.unreadChar(ch);
        var o = Glossa.Reader.read(reader, true, null, isRecursive);
        if(o === reader) {
          return a;
        } else {
          a.push(o);
          continue;
        }
      }
    }
  }
}

/**
 * Create List data structure from output of readDelimitedList
 */
function readList(reader, na) {
  console.log("[x] Reading list");
  return buildToken(Glossa.Tags.list, mori.list.apply(this, readDelimitedList(')', reader, true)));
}

function readVector(reader, na) {
  console.log("[x] Reading vector");
  return buildToken(Glossa.Tags.vector, mori.vector.apply(this, readDelimitedList(']', reader, true)));
}

function readMap(reader, na) {
  console.log("[x] Read map");
  var delimitedList = readDelimitedList('}', reader, true);
  if(delimitedList.length % 2 !== 0) {
    throw new Error("Map literal must contain an even number of forms");
  } else {
    return buildToken(Glossa.Tags.map, mori.hash_map.apply(this, delimitedList));
  }
}

function readObject(reader, na) {
  console.log("[x] Read object");
  var delimitedList = readDelimitedList('>', reader, true);
  if(delimitedList.length % 2 !== 0) {
    throw new Error("Object literal must contain an even number of forms");
  } else {
    return buildToken(Glossa.Tags.object, buildObject(delimitedList));
  }
}

/**
 * Return mori set for given delimited structure.
 *
 * Note that sets take a seqable, whereas other mori collection
 * constructors take varargs.
 */
function readSet(reader, na) {
  return buildToken(Glossa.Tags.set, mori.set(readDelimitedList('}', reader, true)));
}

function readArray(reader, na) {
  return buildToken(Glossa.Tags.array, readDelimitedList(']', reader, true));
}

function wrappingReader(symbol) {
  return function(reader, ch) {
    return [symbol, Glossa.Reader.read(reader, true, null, true)];
  };
}

// SHUFFLED
// (identical? c \^) read-meta
// (identical? c \`) not-implemented
// (identical? c \~) not-implemented
function macros(ch) {
  if(ch === '"') return readString;
  if(ch === ':') return readKeyword;
  if(ch === "'") return wrappingReader('quote');
  if(ch === '@') return wrappingReader('deref');
  if(ch === '(') return readList;
  if(ch === ')') return readUnmatchedDelimiter;
  if(ch === '[') return readVector;
  if(ch === ']') return readUnmatchedDelimiter;
  if(ch === '{') return readMap;
  if(ch === '}') return readUnmatchedDelimiter;
  if(ch === '#') return readDispatch;
  return null;
}

function dispatchMacros(ch) {
  console.log("Dispatched");
  if(ch === '[') return readArray;
  if(ch === '{') return readSet;
  if(ch === '<') throw new Error("Unreadable form. Anything that starts with #< is unreadable.");
  if(ch === '"') return readRegex;
  // if(ch === '!') return readComment;
  // if(ch === '_') return readDiscard;
  return null;
}

function readNumber(reader, initch) {
  var buffer = new StringBuffer(initch);
  for(; ;) {
    var ch = reader.readChar();
    if (ch == null || isWhitespace(ch) || macros(ch)) {
      reader.unreadChar(ch);
      var s = buffer.toString();
      var matchedNumber = matchNumber(s);
      if(matchedNumber) {
        return matchedNumber;
      } else {
        throw new Error('Invalid number format [' + s + ']');
      }
    } else {
      buffer.append(ch);
    }
  }
}

function readToken(reader, initch) {
  var buffer = new StringBuffer(initch);
  for(; ;) {
    var ch = reader.readChar();
    if(ch == null || isWhitespace(ch) || isMacroTerminating(ch)) {
      reader.unreadChar(ch);
      return buffer.toString();
    } else {
      buffer.append(ch);
    }
  }
}

function readSymbol(reader, initch) {
  console.log("[x] Read symbol");
  var tag, token, sym;
  token = readToken(reader, initch);
  if(strContains(token, '/')) {
    var idx = token.indexOf('/');
    sym = buildSymbol(token.slice(0,idx), token.slice(idx+1,token.length));
  } else {
    sym = buildSpecialSymbol(token);
  }
  if(sym.value === null) tag = Glossa.Tags.nil
  if(sym.value === true || sym.value === false) tag = Glossa.Tags.boolean
  return buildToken(tag || Glossa.Tags.symbol, sym);
}

/***
 * Reading and Parsing
 ***/

Glossa.Reader = {};

Glossa.Reader.readString = function(s) {
  var stringReader = new stringPushbackReader(s);
  return Glossa.Reader.read(stringReader, true, null, false);
}

Glossa.Reader.read = function(reader, eofIsError, sentinel, isRecursive) {
  for(; ;) {
    var ch = reader.readChar();
    if(ch == null) {
      if(eofIsError)
        throw new Error("EOF while reading");
      return sentinel;
    }

    if(isWhitespace(ch))
      continue;

    if(isCommentPrefix(ch)){
      skipline(reader, ch);
    }

    var macroFn = macros(ch);
    var res = null;
    if(macroFn != null) {
      res = macroFn(reader, ch);
    } else {
      if(isNumberLiteral(reader, ch)) {
        res = readNumber(reader, ch);
      } else {
        res = readSymbol(reader, ch);
      }
    }

    if(res === reader) {
      continue;
    } else {
      return res;
    }
  }
}

/*****
 * Analyzer
 *****/

function analyzeSymbol(env, sym) {
  if(env.isQuoted) {
    return new Glossa.Ast.Node(Glossa.Ops.constant, env, sym, Glossa.Tags.symbol);
  } else {
    var locallyBound = env.locals.hasSymbol(sym);
    if(locallyBound) {
      var node = new Glossa.Ast.Node(Glossa.Ops.var, env, sym, null);
      node['info'] = locallyBound;
    } else {
      if(!env.defVar) {

      }
    }
  }
}

function analyzeSeq(env,form) {

}

Glossa.Analyzer = {};

Glossa.Analyzer.analyze = function(env, form) {
  if(isSymbol(form)) {
    return analyzeSymbol(env, form);
  } else if (isSeq(form) && !isEmpty(form)) {
    return analyzeSeq(env, form);
  } // else if (isMap(form)) {
  //   return analyzeMap(env, form);
  // } else if (isVector(form)) {
  //   return analyzeVector(env, form);
  // } else if (isSet(form)) {
  //   return analyzeSet(env, form);
  // } else if (isKeyword(form)) {
  //   return analyzeKeyword(env, form);
  // } else if (isList(form) && isEmpty(form)) {
  //   return analyzeList(env, form);
  // } else {
  //   var tag = "foo";
  // }
}

/**
 * Like types, except there's no type system yet.
 *
 * These are used at read time to tag forms for later analysis.
 */
Glossa.Tags = {
  string: 'string',
  regex: 'regex',
  symbol: 'symbol',
  keyword: 'keyword',
  integer: 'integer',
  float: 'float',
  ratio: 'ratio',
  array: 'array',
  list: 'list',
  vector: 'vector',
  map: 'map',
  object: 'object',
  set: 'set',
  nil: 'nil',
  boolean: 'boolean'
};

Glossa.Ops = {
  constant: 'constant',
  var: 'var'
};

/**
 * Unified data structure for representing source code
 * that has been read.
 *
 * Many things are self-representative, like string values,
 * but most things require some amount of extra information
 * even at the parsing stage. Although JavaScript only supports
 * doubles, this language parses for integers, floats, and ratios.
 * Symbols and keywords need to carry namespace information with
 * them, if available. However, there is not always a clear "operation"
 * and there is certainly no compilation environment to store along
 * with these structures, so Glossa.Ast.Node will host all of that,
 * will these reader tokens objects will handle the appropriate subset
 * available at read time.
 */
Glossa.Reader.Token = function(tag, form) {
  this.tag = tag;
  this.form = form;
}

function buildToken(tag, form) {
  return new Glossa.Reader.Token(tag, form);
}

/********
 * AST Construction
 ********/
Glossa.Ast = {};

Glossa.Ast.Node = function(op, env, form, tag) {
  this.op = op;
  this.env = env;
  this.form = form;
  this.tag = tag;
}

/**
 * Language features
 */

Glossa.Symbol = function(ns, name, value) {
  this.ns = ns;
  this.name = name;
  this.value = value;
}

Glossa.ReservedSymbol = function(name) {
  this.ns = null;
  if(name === 'nil') {
    this.name = 'nil';
    this.value = null;
  } else if(name === 'true') {
    this.name = 'true';
    this.value = true;
  } else if(name === 'false') {
    this.name = 'false';
    this.value = false;
  }
}

Glossa.Keyword = function(ns, name) {
  this.ns = ns;
  this.name = name;
}

function buildSymbol(ns, name) {
  return new Glossa.Symbol(ns, name);
}

function buildSpecialSymbol(name) {
  if(name === 'nil' || name === 'true' || name === 'false') {
    return new Glossa.ReservedSymbol(name);
  } else {
    return new Glossa.Symbol(null, name);
  }
}

function buildKeyword(ns, name) {
  return new Glossa.Keyword(ns, name);
}

/**
 * Given a list with an even number of forms, create a native object.
 *
 * Since this initial implementation is in JavaScript, we will coerce the keys
 * to strings.
 */
function buildObject(delimitedList) {
  var o = {};
  for(var i = 0; i<delimitedList.length; i = i + 2) {
    o[delimitedList[i].toString()] = delimitedList[i+1];
  }
  return o;
}

// Types
Glossa.typeCheck = function(ast) {
  // Given a raw AST, do type inference and checking on it
}

Glossa.compile = function(s) {
  var ast = Glossa.Reader.readString(s);
  console.log("Raw AST:", ast);
  var typedAst = Glossa.typeCheck(ast);
  console.log("Type-Checked AST:", typedAst);
  // return typedAst;
  return ast;
}

module.exports = {
  Glossa: Glossa
};
