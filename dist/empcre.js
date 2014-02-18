// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func) {
    var table = FUNCTION_TABLE;
    var ret = table.length;
    assert(ret % 2 === 0);
    table.push(func);
    for (var i = 0; i < 2-1; i++) table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE;
    table[index] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + Pointer_stringify(code) + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((low>>>0)+((high>>>0)*4294967296)) : ((low>>>0)+((high|0)*4294967296))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math_min(Math_floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 22224;
var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } },{ func: function() { __GLOBAL__I_a() } },{ func: function() { __GLOBAL__I_a72() } },{ func: function() { __GLOBAL__I_a93() } },{ func: function() { __GLOBAL__I_a129() } });
var ___fsmu8;
var ___dso_handle;
var ___dso_handle=___dso_handle=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv120__si_class_type_infoE;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,224,69,0,0,250,2,0,0,86,1,0,0,160,0,0,0,142,1,0,0,206,0,0,0,102,0,0,0,252,0,0,0,30,1,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv119__pointer_type_infoE;
__ZTVN10__cxxabiv119__pointer_type_infoE=allocate([0,0,0,0,240,69,0,0,250,2,0,0,162,0,0,0,160,0,0,0,142,1,0,0,254,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv117__class_type_infoE;
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,16,70,0,0,250,2,0,0,242,2,0,0,160,0,0,0,142,1,0,0,206,0,0,0,62,2,0,0,22,1,0,0,158,1,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTIt;
__ZTIt=allocate([8,47,0,0,136,47,0,0], "i8", ALLOC_STATIC);
var __ZTIs;
__ZTIs=allocate([8,47,0,0,144,47,0,0], "i8", ALLOC_STATIC);
var __ZTIm;
__ZTIm=allocate([8,47,0,0,152,47,0,0], "i8", ALLOC_STATIC);
var __ZTIl;
__ZTIl=allocate([8,47,0,0,160,47,0,0], "i8", ALLOC_STATIC);
var __ZTIj;
__ZTIj=allocate([8,47,0,0,168,47,0,0], "i8", ALLOC_STATIC);
var __ZTIi;
__ZTIi=allocate([8,47,0,0,176,47,0,0], "i8", ALLOC_STATIC);
var __ZTIh;
__ZTIh=allocate([8,47,0,0,184,47,0,0], "i8", ALLOC_STATIC);
var __ZTIf;
__ZTIf=allocate([8,47,0,0,192,47,0,0], "i8", ALLOC_STATIC);
var __ZTId;
__ZTId=allocate([8,47,0,0,200,47,0,0], "i8", ALLOC_STATIC);
var __ZTIc;
__ZTIc=allocate([8,47,0,0,208,47,0,0], "i8", ALLOC_STATIC);
var __ZTIa;
__ZTIa=allocate([8,47,0,0,224,47,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([0,0,0,0,255,255,255,255,149,0,0,0,4,0,0,0,255,255,255,255,149,0,0,0,6,0,0,0,158,0,0,0,255,255,255,255,6,0,0,0,156,0,0,0,255,255,255,255,1,0,0,0,157,0,0,0,255,255,255,255,4,0,0,0,157,0,0,0,255,255,255,255,5,0,0,0,150,0,0,0,151,0,0,0,4,0,0,0,152,0,0,0,153,0,0,0,4,0,0,0,154,0,0,0,155,0,0,0,0,0,0,0,0,77,65,82,75,0,65,67,67,69,80,84,0,67,79,77,77,73,84,0,70,0,70,65,73,76,0,80,82,85,78,69,0,83,75,73,80,0,84,72,69,78,0,0,0,0,0,0,92,98,40,63,61,92,119,41,0,0,0,0,0,0,0,0,92,98,40,63,60,61,92,119,41,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,136,195,64,0,0,0,0,132,215,151,65,0,128,224,55,121,195,65,67,23,110,5,181,181,184,147,70,245,249,63,233,3,79,56,77,50,29,48,249,72,119,130,90,60,191,115,127,221,79,21,117,97,108,112,104,97,0,108,111,119,101,114,0,117,112,112,101,114,0,97,108,110,117,109,0,97,115,99,105,105,0,98,108,97,110,107,0,99,110,116,114,108,0,100,105,103,105,116,0,103,114,97,112,104,0,112,114,105,110,116,0,112,117,110,99,116,0,115,112,97,99,101,0,119,111,114,100,0,120,100,105,103,105,116,0,0,0,0,0,5,5,5,5,5,5,5,5,5,5,5,5,4,6,0,0,160,0,0,0,64,0,0,0,254,255,255,255,128,0,0,0,255,255,255,255,0,0,0,0,96,0,0,0,255,255,255,255,0,0,0,0,160,0,0,0,255,255,255,255,2,0,0,0,224,0,0,0,32,1,0,0,0,0,0,0,0,0,0,0,255,255,255,255,1,0,0,0,32,1,0,0,255,255,255,255,0,0,0,0,64,0,0,0,255,255,255,255,0,0,0,0,192,0,0,0,255,255,255,255,0,0,0,0,224,0,0,0,255,255,255,255,0,0,0,0,0,1,0,0,255,255,255,255,0,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,160,0,0,0,255,255,255,255,0,0,0,0,32,0,0,0,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,42,0,43,0,44,0,45,0,0,0,0,0,0,55,0,56,0,57,0,58,0,0,0,0,0,0,68,0,69,0,70,0,71,0,0,0,0,0,0,81,0,82,0,83,0,84,0,0,0,0,0,0,94,0,95,0,96,0,97,0,0,0,0,0,0,106,0,107,0,108,0,109,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,58,0,59,0,60,0,61,0,62,0,63,0,64,0,255,255,252,255,242,255,250,255,231,255,0,0,254,255,238,255,0,0,0,0,253,255,0,0,0,0,244,255,0,0,241,255,230,255,239,255,248,255,0,0,0,0,236,255,246,255,234,255,0,0,233,255,91,0,92,0,93,0,94,0,95,0,96,0,7,0,251,255,0,0,249,255,27,0,12,0,0,0,237,255,0,0,0,0,228,255,0,0,0,0,10,0,0,0,240,255,0,0,13,0,247,255,9,0,0,0,235,255,245,255,0,0,0,0,232,255,0,0,110,111,32,101,114,114,111,114,0,92,32,97,116,32,101,110,100,32,111,102,32,112,97,116,116,101,114,110,0,92,99,32,97,116,32,101,110,100,32,111,102,32,112,97,116,116,101,114,110,0,117,110,114,101,99,111,103,110,105,122,101,100,32,99,104,97,114,97,99,116,101,114,32,102,111,108,108,111,119,115,32,92,0,110,117,109,98,101,114,115,32,111,117,116,32,111,102,32,111,114,100,101,114,32,105,110,32,123,125,32,113,117,97,110,116,105,102,105,101,114,0,110,117,109,98,101,114,32,116,111,111,32,98,105,103,32,105,110,32,123,125,32,113,117,97,110,116,105,102,105,101,114,0,109,105,115,115,105,110,103,32,116,101,114,109,105,110,97,116,105,110,103,32,93,32,102,111,114,32,99,104,97,114,97,99,116,101,114,32,99,108,97,115,115,0,105,110,118,97,108,105,100,32,101,115,99,97,112,101,32,115,101,113,117,101,110,99,101,32,105,110,32,99,104,97,114,97,99,116,101,114,32,99,108,97,115,115,0,114,97,110,103,101,32,111,117,116,32,111,102,32,111,114,100,101,114,32,105,110,32,99,104,97,114,97,99,116,101,114,32,99,108,97,115,115,0,110,111,116,104,105,110,103,32,116,111,32,114,101,112,101,97,116,0,111,112,101,114,97,110,100,32,111,102,32,117,110,108,105,109,105,116,101,100,32,114,101,112,101,97,116,32,99,111,117,108,100,32,109,97,116,99,104,32,116,104,101,32,101,109,112,116,121,32,115,116,114,105,110,103,0,105,110,116,101,114,110,97,108,32,101,114,114,111,114,58,32,117,110,101,120,112,101,99,116,101,100,32,114,101,112,101,97,116,0,117,110,114,101,99,111,103,110,105,122,101,100,32,99,104,97,114,97,99,116,101,114,32,97,102,116,101,114,32,40,63,32,111,114,32,40,63,45,0,80,79,83,73,88,32,110,97,109,101,100,32,99,108,97,115,115,101,115,32,97,114,101,32,115,117,112,112,111,114,116,101,100,32,111,110,108,121,32,119,105,116,104,105,110,32,97,32,99,108,97,115,115,0,109,105,115,115,105,110,103,32,41,0,114,101,102,101,114,101,110,99,101,32,116,111,32,110,111,110,45,101,120,105,115,116,101,110,116,32,115,117,98,112,97,116,116,101,114,110,0,101,114,114,111,102,102,115,101,116,32,112,97,115,115,101,100,32,97,115,32,78,85,76,76,0,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,98,105,116,40,115,41,32,115,101,116,0,109,105,115,115,105,110,103,32,41,32,97,102,116,101,114,32,99,111,109,109,101,110,116,0,112,97,114,101,110,116,104,101,115,101,115,32,110,101,115,116,101,100,32,116,111,111,32,100,101,101,112,108,121,0,114,101,103,117,108,97,114,32,101,120,112,114,101,115,115,105,111,110,32,105,115,32,116,111,111,32,108,97,114,103,101,0,102,97,105,108,101,100,32,116,111,32,103,101,116,32,109,101,109,111,114,121,0,117,110,109,97,116,99,104,101,100,32,112,97,114,101,110,116,104,101,115,101,115,0,105,110,116,101,114,110,97,108,32,101,114,114,111,114,58,32,99,111,100,101,32,111,118,101,114,102,108,111,119,0,117,110,114,101,99,111,103,110,105,122,101,100,32,99,104,97,114,97,99,116,101,114,32,97,102,116,101,114,32,40,63,60,0,108,111,111,107,98,101,104,105,110,100,32,97,115,115,101,114,116,105,111,110,32,105,115,32,110,111,116,32,102,105,120,101,100,32,108,101,110,103,116,104,0,109,97,108,102,111,114,109,101,100,32,110,117,109,98,101,114,32,111,114,32,110,97,109,101,32,97,102,116,101,114,32,40,63,40,0,99,111,110,100,105,116,105,111,110,97,108,32,103,114,111,117,112,32,99,111,110,116,97,105,110,115,32,109,111,114,101,32,116,104,97,110,32,116,119,111,32,98,114,97,110,99,104,101,115,0,97,115,115,101,114,116,105,111,110,32,101,120,112,101,99,116,101,100,32,97,102,116,101,114,32,40,63,40,0,40,63,82,32,111,114,32,40,63,91,43,45,93,100,105,103,105,116,115,32,109,117,115,116,32,98,101,32,102,111,108,108,111,119,101,100,32,98,121,32,41,0,117,110,107,110,111,119,110,32,80,79,83,73,88,32,99,108,97,115,115,32,110,97,109,101,0,80,79,83,73,88,32,99,111,108,108,97,116,105,110,103,32,101,108,101,109,101,110,116,115,32,97,114,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,116,104,105,115,32,118,101,114,115,105,111,110,32,111,102,32,80,67,82,69,32,105,115,32,99,111,109,112,105,108,101,100,32,119,105,116,104,111,117,116,32,85,84,70,32,115,117,112,112,111,114,116,0,115,112,97,114,101,32,101,114,114,111,114,0,99,104,97,114,97,99,116,101,114,32,118,97,108,117,101,32,105,110,32,92,120,123,125,32,111,114,32,92,111,123,125,32,105,115,32,116,111,111,32,108,97,114,103,101,0,105,110,118,97,108,105,100,32,99,111,110,100,105,116,105,111,110,32,40,63,40,48,41,0,92,67,32,110,111,116,32,97,108,108,111,119,101,100,32,105,110,32,108,111,111,107,98,101,104,105,110,100,32,97,115,115,101,114,116,105,111,110,0,80,67,82,69,32,100,111,101,115,32,110,111,116,32,115,117,112,112,111,114,116,32,92,76,44,32,92,108,44,32,92,78,123,110,97,109,101,125,44,32,92,85,44,32,111,114,32,92,117,0,110,117,109,98,101,114,32,97,102,116,101,114,32,40,63,67,32,105,115,32,62,32,50,53,53,0,99,108,111,115,105,110,103,32,41,32,102,111,114,32,40,63,67,32,101,120,112,101,99,116,101,100,0,114,101,99,117,114,115,105,118,101,32,99,97,108,108,32,99,111,117,108,100,32,108,111,111,112,32,105,110,100,101,102,105,110,105,116,101,108,121,0,117,110,114,101,99,111,103,110,105,122,101,100,32,99,104,97,114,97,99,116,101,114,32,97,102,116,101,114,32,40,63,80,0,115,121,110,116,97,120,32,101,114,114,111,114,32,105,110,32,115,117,98,112,97,116,116,101,114,110,32,110,97,109,101,32,40,109,105,115,115,105,110,103,32,116,101,114,109,105,110,97,116,111,114,41,0,116,119,111,32,110,97,109,101,100,32,115,117,98,112,97,116,116,101,114,110,115,32,104,97,118,101,32,116,104,101,32,115,97,109,101,32,110,97,109,101,0,105,110,118,97,108,105,100,32,85,84,70,45,56,32,115,116,114,105,110,103,0,115,117,112,112,111,114,116,32,102,111,114,32,92,80,44,32,92,112,44,32,97,110,100,32,92,88,32,104,97,115,32,110,111,116,32,98,101,101,110,32,99,111,109,112,105,108,101,100,0,109,97,108,102,111,114,109,101,100,32,92,80,32,111,114,32,92,112,32,115,101,113,117,101,110,99,101,0,117,110,107,110,111,119,110,32,112,114,111,112,101,114,116,121,32,110,97,109,101,32,97,102,116,101,114,32,92,80,32,111,114,32,92,112,0,115,117,98,112,97,116,116,101,114,110,32,110,97,109,101,32,105,115,32,116,111,111,32,108,111,110,103,32,40,109,97,120,105,109,117,109,32,51,50,32,99,104,97,114,97,99,116,101,114,115,41,0,116,111,111,32,109,97,110,121,32,110,97,109,101,100,32,115,117,98,112,97,116,116,101,114,110,115,32,40,109,97,120,105,109,117,109,32,49,48,48,48,48,41,0,114,101,112,101,97,116,101,100,32,115,117,98,112,97,116,116,101,114,110,32,105,115,32,116,111,111,32,108,111,110,103,0,111,99,116,97,108,32,118,97,108,117,101,32,105,115,32,103,114,101,97,116,101,114,32,116,104,97,110,32,92,51,55,55,32,105,110,32,56,45,98,105,116,32,110,111,110,45,85,84,70,45,56,32,109,111,100,101,0,105,110,116,101,114,110,97,108,32,101,114,114,111,114,58,32,111,118,101,114,114,97,110,32,99,111,109,112,105,108,105,110,103,32,119,111,114,107,115,112,97,99,101,0,105,110,116,101,114,110,97,108,32,101,114,114,111,114,58,32,112,114,101,118,105,111,117,115,108,121,45,99,104,101,99,107,101,100,32,114,101,102,101,114,101,110,99,101,100,32,115,117,98,112,97,116,116,101,114,110,32,110,111,116,32,102,111,117,110,100,0,68,69,70,73,78,69,32,103,114,111,117,112,32,99,111,110,116,97,105,110,115,32,109,111,114,101,32,116,104,97,110,32,111,110,101,32,98,114,97,110,99,104,0,114,101,112,101,97,116,105,110,103,32,97,32,68,69,70,73,78,69,32,103,114,111,117,112,32,105,115,32,110,111,116,32,97,108,108,111,119,101,100,0,105,110,99,111,110,115,105,115,116,101,110,116,32,78,69,87,76,73,78,69,32,111,112,116,105,111,110,115,0,92,103,32,105,115,32,110,111,116,32,102,111,108,108,111,119,101,100,32,98,121,32,97,32,98,114,97,99,101,100,44,32,97,110,103,108,101,45,98,114,97,99,107,101,116,101,100,44,32,111,114,32,113,117,111,116,101,100,32,110,97,109,101,47,110,117,109,98,101,114,32,111,114,32,98,121,32,97,32,112,108,97,105,110,32,110,117,109,98,101,114,0,97,32,110,117,109,98,101,114,101,100,32,114,101,102,101,114,101,110,99,101,32,109,117,115,116,32,110,111,116,32,98,101,32,122,101,114,111,0,97,110,32,97,114,103,117,109,101,110,116,32,105,115,32,110,111,116,32,97,108,108,111,119,101,100,32,102,111,114,32,40,42,65,67,67,69,80,84,41,44,32,40,42,70,65,73,76,41,44,32,111,114,32,40,42,67,79,77,77,73,84,41,0,40,42,86,69,82,66,41,32,110,111,116,32,114,101,99,111,103,110,105,122,101,100,32,111,114,32,109,97,108,102,111,114,109,101,100,0,110,117,109,98,101,114,32,105,115,32,116,111,111,32,98,105,103,0,115,117,98,112,97,116,116,101,114,110,32,110,97,109,101,32,101,120,112,101,99,116,101,100,0,100,105,103,105,116,32,101,120,112,101,99,116,101,100,32,97,102,116,101,114,32,40,63,43,0,93,32,105,115,32,97,110,32,105,110,118,97,108,105,100,32,100,97,116,97,32,99,104,97,114,97,99,116,101,114,32,105,110,32,74,97,118,97,83,99,114,105,112,116,32,99,111,109,112,97,116,105,98,105,108,105,116,121,32,109,111,100,101,0,100,105,102,102,101,114,101,110,116,32,110,97,109,101,115,32,102,111,114,32,115,117,98,112,97,116,116,101,114,110,115,32,111,102,32,116,104,101,32,115,97,109,101,32,110,117,109,98,101,114,32,97,114,101,32,110,111,116,32,97,108,108,111,119,101,100,0,40,42,77,65,82,75,41,32,109,117,115,116,32,104,97,118,101,32,97,110,32,97,114,103,117,109,101,110,116,0,116,104,105,115,32,118,101,114,115,105,111,110,32,111,102,32,80,67,82,69,32,105,115,32,110,111,116,32,99,111,109,112,105,108,101,100,32,119,105,116,104,32,85,110,105,99,111,100,101,32,112,114,111,112,101,114,116,121,32,115,117,112,112,111,114,116,0,92,99,32,109,117,115,116,32,98,101,32,102,111,108,108,111,119,101,100,32,98,121,32,97,110,32,65,83,67,73,73,32,99,104,97,114,97,99,116,101,114,0,92,107,32,105,115,32,110,111,116,32,102,111,108,108,111,119,101,100,32,98,121,32,97,32,98,114,97,99,101,100,44,32,97,110,103,108,101,45,98,114,97,99,107,101,116,101,100,44,32,111,114,32,113,117,111,116,101,100,32,110,97,109,101,0,105,110,116,101,114,110,97,108,32,101,114,114,111,114,58,32,117,110,107,110,111,119,110,32,111,112,99,111,100,101,32,105,110,32,102,105,110,100,95,102,105,120,101,100,108,101,110,103,116,104,40,41,0,92,78,32,105,115,32,110,111,116,32,115,117,112,112,111,114,116,101,100,32,105,110,32,97,32,99,108,97,115,115,0,116,111,111,32,109,97,110,121,32,102,111,114,119,97,114,100,32,114,101,102,101,114,101,110,99,101,115,0,100,105,115,97,108,108,111,119,101,100,32,85,110,105,99,111,100,101,32,99,111,100,101,32,112,111,105,110,116,32,40,62,61,32,48,120,100,56,48,48,32,38,38,32,60,61,32,48,120,100,102,102,102,41,0,105,110,118,97,108,105,100,32,85,84,70,45,49,54,32,115,116,114,105,110,103,0,110,97,109,101,32,105,115,32,116,111,111,32,108,111,110,103,32,105,110,32,40,42,77,65,82,75,41,44,32,40,42,80,82,85,78,69,41,44,32,40,42,83,75,73,80,41,44,32,111,114,32,40,42,84,72,69,78,41,0,99,104,97,114,97,99,116,101,114,32,118,97,108,117,101,32,105,110,32,92,117,46,46,46,46,32,115,101,113,117,101,110,99,101,32,105,115,32,116,111,111,32,108,97,114,103,101,0,105,110,118,97,108,105,100,32,85,84,70,45,51,50,32,115,116,114,105,110,103,0,115,101,116,116,105,110,103,32,85,84,70,32,105,115,32,100,105,115,97,98,108,101,100,32,98,121,32,116,104,101,32,97,112,112,108,105,99,97,116,105,111,110,0,110,111,110,45,104,101,120,32,99,104,97,114,97,99,116,101,114,32,105,110,32,92,120,123,125,32,40,99,108,111,115,105,110,103,32,98,114,97,99,101,32,109,105,115,115,105,110,103,63,41,0,110,111,110,45,111,99,116,97,108,32,99,104,97,114,97,99,116,101,114,32,105,110,32,92,111,123,125,32,40,99,108,111,115,105,110,103,32,98,114,97,99,101,32,109,105,115,115,105,110,103,63,41,0,109,105,115,115,105,110,103,32,111,112,101,110,105,110,103,32,98,114,97,99,101,32,97,102,116,101,114,32,92,111,0,112,97,114,101,110,116,104,101,115,101,115,32,97,114,101,32,116,111,111,32,100,101,101,112,108,121,32,110,101,115,116,101,100,0,105,110,118,97,108,105,100,32,114,97,110,103,101,32,105,110,32,99,104,97,114,97,99,116,101,114,32,99,108,97,115,115,0,103,114,111,117,112,32,110,97,109,101,32,109,117,115,116,32,115,116,97,114,116,32,119,105,116,104,32,97,32,110,111,110,45,100,105,103,105,116,0,112,97,114,101,110,116,104,101,115,101,115,32,97,114,101,32,116,111,111,32,100,101,101,112,108,121,32,110,101,115,116,101,100,32,40,115,116,97,99,107,32,99,104,101,99,107,41,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,12,12,12,12,12,12,12,12,12,0,0,0,0,0,0,0,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,1,0,0,0,0,0,0,1,0,1,0,1,0,1,1,1,1,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0,1,0,1,1,1,1,0,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,1,0,0,0,0,0,0,1,0,1,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1,1,0,0,1,0,0,0,0,0,1,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0,0,1,1,0,0,1,0,0,0,0,0,0,0,1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,74,117,108,0,0,0,0,0,108,111,110,103,0,0,0,0,74,117,110,0,0,0,0,0,65,112,114,0,0,0,0,0,77,97,114,0,0,0,0,0,70,101,98,0,0,0,0,0,74,97,110,0,0,0,0,0,68,101,99,101,109,98,101,114,0,0,0,0,0,0,0,0,78,111,118,101,109,98,101,114,0,0,0,0,0,0,0,0,67,82,76,70,41,0,0,0,117,110,115,117,112,112,111,114,116,101,100,32,108,111,99,97,108,101,32,102,111,114,32,115,116,97,110,100,97,114,100,32,105,110,112,117,116,0,0,0,79,99,116,111,98,101,114,0,83,101,112,116,101,109,98,101,114,0,0,0,0,0,0,0,65,78,67,72,79,82,95,83,84,65,82,84,0,0,0,0,65,117,103,117,115,116,0,0,117,110,115,105,103,110,101,100,32,105,110,116,0,0,0,0,74,117,108,121,0,0,0,0,74,117,110,101,0,0,0,0,77,97,121,0,0,0,0,0,65,112,114,105,108,0,0,0,77,97,114,99,104,0,0,0,70,101,98,114,117,97,114,121,0,0,0,0,0,0,0,0,74,97,110,117,97,114,121,0,76,70,41,0,0,0,0,0,98,97,115,105,99,95,115,116,114,105,110,103,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,0,0,0,0,85,78,65,78,67,72,79,82,69,68,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,0,0,0,0,105,110,116,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,0,0,0,0,118,111,105,100,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,0,0,0,0,67,82,41,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,0,0,0,0,65,110,99,104,111,114,0,0,74,0,0,0,97,0,0,0,110,0,0,0,0,0,0,0,117,110,115,105,103,110,101,100,32,115,104,111,114,116,0,0,68,0,0,0,101,0,0,0,99,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,111,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,116,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,117,0,0,0,115,0,0,0,116,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,76,73,77,73,84,95,82,69,67,85,82,83,73,79,78,61,0,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,105,0,0,0,108,0,0,0,0,0,0,0,109,97,116,99,104,101,100,0,77,0,0,0,97,0,0,0,114,0,0,0,99,0,0,0,104,0,0,0,0,0,0,0,115,104,111,114,116,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,114,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,112,99,114,101,99,112,112,46,99,99,0,0,0,0,0,0,80,77,0,0,0,0,0,0,65,77,0,0,0,0,0,0,80,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,76,73,77,73,84,95,77,65,84,67,72,61,0,0,0,0,65,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,109,97,116,99,104,101,115,0,40,63,58,0,0,0,0,0,117,110,115,105,103,110,101,100,32,99,104,97,114,0,0,0,78,79,95,83,84,65,82,84,95,79,80,84,41,0,0,0,105,110,112,117,116,0,0,0,108,111,99,97,108,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,115,105,103,110,101,100,32,99,104,97,114,0,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,37,0,0,0,97,0,0,0,32,0,0,0,37,0,0,0,98,0,0,0,32,0,0,0,37,0,0,0,100,0,0,0,32,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,89,0,0,0,0,0,0,0,0,0,0,0,41,92,122,0,0,0,0,0,37,97,32,37,98,32,37,100,32,37,72,58,37,77,58,37,83,32,37,89,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,0,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,78,79,95,65,85,84,79,95,80,79,83,83,69,83,83,41,0,0,0,0,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,82,69,95,77,97,116,99,104,0,0,0,0,0,0,0,0,102,0,0,0,97,0,0,0,108,0,0,0,115,0,0,0,101,0,0,0,0,0,0,0,99,104,97,114,0,0,0,0,37,112,0,0,0,0,0,0,102,97,108,115,101,0,0,0,116,0,0,0,114,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,58,32,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,99,97,115,116,0,0,0,105,111,115,95,98,97,115,101,58,58,99,108,101,97,114,0,85,67,80,41,0,0,0,0,47,85,115,101,114,115,47,98,101,110,101,107,97,115,116,97,104,47,108,111,99,97,108,47,101,109,115,100,107,95,112,111,114,116,97,98,108,101,47,101,109,115,99,114,105,112,116,101,110,47,49,46,56,46,50,47,115,121,115,116,101,109,47,105,110,99,108,117,100,101,47,101,109,115,99,114,105,112,116,101,110,47,98,105,110,100,46,104,0,0,0,0,0,0,0,0,85,84,70,56,41,0,0,0,112,116,114,0,0,0,0,0,68,69,70,73,78,69,0,0,98,111,111,108,0,0,0,0,67,0,0,0,0,0,0,0,81,92,69,0,0,0,0,0,115,101,116,0,0,0,0,0,101,109,115,99,114,105,112,116,101,110,58,58,109,101,109,111,114,121,95,118,105,101,119,0,118,101,99,116,111,114,0,0,91,58,62,58,93,93,0,0,103,101,116,0,0,0,0,0,101,109,115,99,114,105,112,116,101,110,58,58,118,97,108,0,37,46,48,76,102,0,0,0,91,58,60,58,93,93,0,0,115,105,122,101,0,0,0,0,115,116,100,58,58,119,115,116,114,105,110,103,0,0,0,0,112,99,114,101,95,114,101,116,118,97,108,32,61,61,32,48,0,0,0,0,0,0,0,0,109,111,110,101,121,95,103,101,116,32,101,114,114,111,114,0,69,114,114,111,114,32,116,101,120,116,32,110,111,116,32,102,111,117,110,100,32,40,112,108,101,97,115,101,32,114,101,112,111,114,116,41,0,0,0,0,112,117,115,104,95,98,97,99,107,0,0,0,0,0,0,0,115,116,100,58,58,115,116,114,105,110,103,0,0,0,0,0,110,32,62,61,32,48,0,0,83,97,116,0,0,0,0,0,70,114,105,0,0,0,0,0,105,111,115,116,114,101,97,109,0,0,0,0,0,0,0,0,37,76,102,0,0,0,0,0,66,83,82,95,85,78,73,67,79,68,69,41,0,0,0,0,84,104,117,0,0,0,0,0,87,101,100,0,0,0,0,0,84,117,101,0,0,0,0,0,86,101,99,116,111,114,83,116,114,105,110,103,0,0,0,0,77,111,110,0,0,0,0,0,100,111,117,98,108,101,0,0,83,117,110,0,0,0,0,0,83,97,116,117,114,100,97,121,0,0,0,0,0,0,0,0,70,114,105,100,97,121,0,0,109,97,116,99,104,101,115,32,62,61,32,48,0,0,0,0,84,104,117,114,115,100,97,121,0,0,0,0,0,0,0,0,87,101,100,110,101,115,100,97,121,0,0,0,0,0,0,0,84,117,101,115,100,97,121,0,66,83,82,95,65,78,89,67,82,76,70,41,0,0,0,0,77,111,110,100,97,121,0,0,83,117,110,100,97,121,0,0,109,97,116,99,104,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,0,0,0,0,102,108,111,97,116,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,0,0,0,0,117,110,115,112,101,99,105,102,105,101,100,32,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,32,101,114,114,111,114,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,65,78,89,67,82,76,70,41,0,0,0,0,0,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,117,0,0,0,114,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,114,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,85,84,70,41,0,0,0,0,82,69,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,110,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,117,110,115,105,103,110,101,100,32,108,111,110,103,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,68,101,99,0,0,0,0,0,78,111,118,0,0,0,0,0,79,99,116,0,0,0,0,0,65,78,89,41,0,0,0,0,83,101,112,0,0,0,0,0,65,117,103,0,0,0,0,0,65,78,67,72,79,82,95,66,79,84,72,0,0,0,0,0,99,111,110,115,117,109,101,100,58,32,37,100,10,0,0,0,79,118,101,114,102,108,111,119,58,32,84,104,101,114,101,32,97,114,101,32,116,111,111,32,109,97,110,121,32,99,97,112,116,117,114,105,110,103,32,103,114,111,117,112,115,10,0,0,10,0,0,0,11,0,0,0,12,0,0,0,13,0,0,0,133,0,0,0,40,32,0,0,41,32,0,0,255,255,255,255,9,0,0,0,32,0,0,0,160,0,0,0,128,22,0,0,14,24,0,0,0,32,0,0,1,32,0,0,2,32,0,0,3,32,0,0,4,32,0,0,5,32,0,0,6,32,0,0,7,32,0,0,8,32,0,0,9,32,0,0,10,32,0,0,47,32,0,0,95,32,0,0,0,48,0,0,255,255,255,255,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,91,92,93,94,95,96,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,0,62,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,3,126,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,254,255,255,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,254,255,255,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,3,254,255,255,135,254,255,255,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,254,255,255,255,255,255,255,255,255,255,255,127,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,127,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,254,255,0,252,1,0,0,248,1,0,0,120,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,128,0,0,0,128,128,128,128,0,0,128,0,28,28,28,28,28,28,28,28,28,28,0,0,0,0,0,128,0,26,26,26,26,26,26,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,128,128,0,128,16,0,26,26,26,26,26,26,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,128,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,4,4,4,2,2,2,4,2,2,2,2,2,2,4,4,4,2,2,2,4,2,2,2,2,2,2,4,4,4,2,2,2,4,2,2,2,2,2,2,4,4,4,2,2,2,4,2,2,2,2,2,2,4,4,4,2,2,2,4,1,1,1,1,1,1,5,5,1,1,1,5,33,33,0,3,3,5,5,3,6,3,3,3,3,3,3,3,3,3,3,3,3,3,3,5,5,3,3,3,5,5,3,3,5,3,5,1,1,1,1,3,1,3,1,3,1,3,1,1,1,1,3,1,0,0,0,0,0,0,68,111,77,97,116,99,104,0,78,117,109,98,101,114,79,102,67,97,112,116,117,114,105,110,103,71,114,111,117,112,115,0,68,111,77,97,116,99,104,73,109,112,108,0,0,0,0,0,103,101,116,65,99,116,117,97,108,84,121,112,101,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,37,0,0,0,89,0,0,0,45,0,0,0,37,0,0,0,109,0,0,0,45,0,0,0,37,0,0,0,100,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,72,58,37,77,58,37,83,37,72,58,37,77,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,37,89,45,37,109,45,37,100,37,109,47,37,100,47,37,121,37,72,58,37,77,58,37,83,37,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,0,0,0,0,24,63,0,0,68,0,0,0,68,1,0,0,150,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,63,0,0,36,2,0,0,174,1,0,0,208,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,63,0,0,192,0,0,0,22,3,0,0,220,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,63,0,0,8,1,0,0,18,0,0,0,116,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,63,0,0,8,1,0,0,40,0,0,0,116,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,63,0,0,184,1,0,0,226,0,0,0,120,0,0,0,226,1,0,0,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,63,0,0,8,3,0,0,240,1,0,0,120,0,0,0,224,2,0,0,104,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,63,0,0,172,1,0,0,246,1,0,0,120,0,0,0,230,1,0,0,248,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,64,0,0,14,3,0,0,120,1,0,0,120,0,0,0,212,1,0,0,50,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,64,0,0,0,3,0,0,4,1,0,0,120,0,0,0,124,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,64,0,0,168,1,0,0,52,1,0,0,120,0,0,0,174,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,64,0,0,90,0,0,0,54,1,0,0,120,0,0,0,166,2,0,0,22,0,0,0,248,1,0,0,30,0,0,0,204,0,0,0,168,2,0,0,238,0,0,0,248,255,255,255,240,64,0,0,116,0,0,0,48,0,0,0,184,0,0,0,76,0,0,0,10,0,0,0,166,0,0,0,194,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,65,0,0,240,2,0,0,178,2,0,0,120,0,0,0,112,0,0,0,130,0,0,0,196,2,0,0,134,1,0,0,164,0,0,0,16,0,0,0,142,2,0,0,248,255,255,255,24,65,0,0,106,1,0,0,88,2,0,0,144,2,0,0,186,2,0,0,48,2,0,0,254,0,0,0,40,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,65,0,0,214,0,0,0,252,1,0,0,120,0,0,0,16,1,0,0,234,0,0,0,118,0,0,0,108,1,0,0,196,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,65,0,0,156,0,0,0,176,0,0,0,120,0,0,0,248,0,0,0,236,1,0,0,158,0,0,0,220,1,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,65,0,0,244,2,0,0,2,0,0,0,120,0,0,0,146,1,0,0,4,3,0,0,68,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,65,0,0,114,0,0,0,138,2,0,0,120,0,0,0,176,2,0,0,212,0,0,0,188,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,65,0,0,158,2,0,0,62,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,65,0,0,64,0,0,0,118,1,0,0,220,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,65,0,0,14,0,0,0,190,1,0,0,120,0,0,0,100,0,0,0,88,0,0,0,80,0,0,0,86,0,0,0,78,0,0,0,96,0,0,0,94,0,0,0,152,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,65,0,0].concat([14,1,0,0,38,0,0,0,120,0,0,0,30,2,0,0,34,2,0,0,20,2,0,0,32,2,0,0,12,1,0,0,24,2,0,0,22,2,0,0,194,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,65,0,0,92,0,0,0,50,0,0,0,120,0,0,0,102,2,0,0,96,2,0,0,86,2,0,0,90,2,0,0,234,1,0,0,94,2,0,0,84,2,0,0,108,2,0,0,106,2,0,0,104,2,0,0,94,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,66,0,0,134,0,0,0,6,0,0,0,120,0,0,0,236,2,0,0,222,2,0,0,216,2,0,0,218,2,0,0,192,2,0,0,220,2,0,0,214,2,0,0,178,1,0,0,228,2,0,0,226,2,0,0,92,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,66,0,0,202,0,0,0,0,1,0,0,120,0,0,0,88,1,0,0,16,2,0,0,56,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,66,0,0,62,0,0,0,198,1,0,0,120,0,0,0,10,2,0,0,130,2,0,0,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,66,0,0,24,0,0,0,232,1,0,0,120,0,0,0,74,0,0,0,222,1,0,0,78,2,0,0,164,2,0,0,72,2,0,0,154,2,0,0,134,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,66,0,0,206,1,0,0,102,1,0,0,120,0,0,0,202,2,0,0,6,3,0,0,40,2,0,0,26,1,0,0,46,0,0,0,46,2,0,0,28,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,66,0,0,206,1,0,0,42,0,0,0,120,0,0,0,6,1,0,0,108,0,0,0,244,0,0,0,64,2,0,0,64,1,0,0,164,1,0,0,232,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,66,0,0,206,1,0,0,34,1,0,0,120,0,0,0,18,2,0,0,192,1,0,0,128,2,0,0,154,0,0,0,136,1,0,0,116,1,0,0,12,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,66,0,0,206,1,0,0,72,0,0,0,120,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,67,0,0,146,0,0,0,156,1,0,0,120,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,67,0,0,206,1,0,0,218,0,0,0,120,0,0,0,124,1,0,0,190,0,0,0,80,1,0,0,252,2,0,0,194,0,0,0,52,2,0,0,2,2,0,0,58,0,0,0,122,0,0,0,148,2,0,0,42,1,0,0,196,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,67,0,0,20,3,0,0,82,0,0,0,120,0,0,0,150,0,0,0,54,0,0,0,96,1,0,0,140,2,0,0,142,0,0,0,100,1,0,0,176,1,0,0,130,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,67,0,0,182,0,0,0,170,2,0,0,160,1,0,0,60,2,0,0,72,1,0,0,112,2,0,0,118,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,67,0,0,206,1,0,0,228,0,0,0,120,0,0,0,18,2,0,0,192,1,0,0,128,2,0,0,154,0,0,0,136,1,0,0,116,1,0,0,12,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,67,0,0,206,1,0,0,230,2,0,0,120,0,0,0,18,2,0,0,192,1,0,0,128,2,0,0,154,0,0,0,136,1,0,0,116,1,0,0,12,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,67,0,0,84,1,0,0,204,2,0,0,198,0,0,0,144,1,0,0,10,1,0,0,58,2,0,0,4,2,0,0,216,1,0,0,132,2,0,0,148,0,0,0,136,0,0,0,128,0,0,0,16,3,0,0,250,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,67,0,0,20,0,0,0,70,1,0,0,0,2,0,0,188,2,0,0,184,2,0,0,12,2,0,0,18,1,0,0,244,1,0,0,92,1,0,0,34,0,0,0,60,0,0,0,208,2,0,0,76,1,0,0,214,1,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,216,67,0,0,106,0,0,0,124,2,0,0,252,255,255,255,252,255,255,255,216,67,0,0,128,1,0,0,82,1,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,240,67,0,0,160,2,0,0,210,2,0,0,252,255,255,255,252,255,255,255,240,67,0,0,50,1,0,0,54,2,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,8,68,0,0,240,0,0,0,24,3,0,0,248,255,255,255,248,255,255,255,8,68,0,0,208,1,0,0,200,2,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,32,68,0,0,48,1,0,0,82,2,0,0,248,255,255,255,248,255,255,255,32,68,0,0,110,1,0,0,132,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,68,0,0,70,2,0,0,210,1,0,0,220,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,68,0,0,246,2,0,0,182,2,0,0,186,0,0,0,144,1,0,0,10,1,0,0,58,2,0,0,44,1,0,0,216,1,0,0,132,2,0,0,148,0,0,0,136,0,0,0,128,0,0,0,98,2,0,0,212,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,68,0,0,152,1,0,0,204,1,0,0,58,1,0,0,188,2,0,0,184,2,0,0,12,2,0,0,6,2,0,0,244,1,0,0,92,1,0,0,34,0,0,0,60,0,0,0,208,2,0,0,234,2,0,0,178,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,68,0,0,172,2,0,0,126,1,0,0,120,0,0,0,104,1,0,0,150,2,0,0,166,1,0,0,254,2,0,0,56,0,0,0,36,1,0,0,32,1,0,0,216,0,0,0,98,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,69,0,0,46,1,0,0,144,0,0,0,120,0,0,0,126,2,0,0,12,0,0,0,74,2,0,0,174,2,0,0,190,2,0,0,250,0,0,0,136,2,0,0,200,1,0,0,138,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,69,0,0,180,2,0,0,66,1,0,0,120,0,0,0,98,0,0,0,60,1,0,0,70,0,0,0,154,1,0,0,10,3,0,0,202,1,0,0,44,2,0,0,224,1,0,0,168,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,69,0,0,210,0,0,0,188,1,0,0,120,0,0,0,80,2,0,0,110,2,0,0,28,1,0,0,146,2,0,0,2,1,0,0,200,0,0,0,162,1,0,0,122,2,0,0,114,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,69,0,0,246,0,0,0,36,0,0,0,238,1,0,0,144,1,0,0,10,1,0,0,58,2,0,0,4,2,0,0,216,1,0,0,132,2,0,0,112,1,0,0,218,1,0,0,170,0,0,0,16,3,0,0,250,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,69,0,0,28,0,0,0,162,2,0,0,14,2,0,0,188,2,0,0,184,2,0,0,12,2,0,0,18,1,0,0,244,1,0,0,92,1,0,0,56,2,0,0,126,0,0,0,32,0,0,0,76,1,0,0,214,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,69,0,0,250,2,0,0,230,0,0,0,160,0,0,0,142,1,0,0,76,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,69,0,0,250,2,0,0,38,2,0,0,160,0,0,0,142,1,0,0,206,0,0,0,66,0,0,0,152,2,0,0,38,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,70,0,0,250,2,0,0,180,0,0,0,160,0,0,0,142,1,0,0,232,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,118,0,0,0,0,0,0,0,116,0,0,0,0,0,0,0,115,0,0,0,0,0,0,0,109,0,0,0,0,0,0,0,108,0,0,0,0,0,0,0,106,0,0,0,0,0,0,0,105,0,0,0,0,0,0,0,104,0,0,0,0,0,0,0,102,0,0,0,0,0,0,0,100,0,0,0,0,0,0,0,99,0,0,0,0,0,0,0,98,0,0,0,0,0,0,0,97,0,0,0,0,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,83,116,57,101,120,99,101,112,116,105,111,110,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,83,116,56,98,97,100,95,99,97,115,116,0,0,0,0,0,83,116,49,51,114,117,110,116,105,109,101,95,101,114,114,111,114,0,0,0,0,0,0,0,83,116,49,50,108,101,110,103,116,104,95,101,114,114,111,114,0,0,0,0,0,0,0,0,83,116,49,49,108,111,103,105,99,95,101,114,114,111,114,0,80,78,83,116,51,95,95,49,54,118,101,99,116,111,114,73,78,83,95,49,50,98,97,115,105,99,95,115,116,114,105,110,103,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,99,69,69,69,69,78,83,52,95,73,83,54,95,69,69,69,69,0,0,80,78,55,112,99,114,101,99,112,112,50,82,69,69,0,0,80,75,78,83,116,51,95,95,49,54,118,101,99,116,111,114,73,78,83,95,49,50,98,97,115,105,99,95,115,116,114,105,110,103,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,99,69,69,69,69,78,83,52,95,73,83,54,95,69,69,69,69,0,80,75,78,55,112,99,114,101,99,112,112,50,82,69,69,0,78,83,116,51,95,95,49,57,116,105,109,101,95,98,97,115,101,69,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,55,102,97,105,108,117,114,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,119,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,99,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,119,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,99,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,115,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,105,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,54,118,101,99,116,111,114,73,78,83,95,49,50,98,97,115,105,99,95,115,116,114,105,110,103,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,99,69,69,69,69,78,83,52,95,73,83,54,95,69,69,69,69,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,102,97,99,101,116,69,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,95,95,105,109,112,69,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,49,95,95,98,97,115,105,99,95,115,116,114,105,110,103,95,99,111,109,109,111,110,73,76,98,49,69,69,69,0,0,0,78,83,116,51,95,95,49,50,48,95,95,118,101,99,116,111,114,95,98,97,115,101,95,99,111,109,109,111,110,73,76,98,49,69,69,69,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,57,95,95,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,69,0,0,0,78,83,116,51,95,95,49,49,55,95,95,119,105,100,101,110,95,102,114,111,109,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,49,54,95,95,110,97,114,114,111,119,95,116,111,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,101,114,114,111,114,95,99,97,116,101,103,111,114,121,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,115,104,97,114,101,100,95,99,111,117,110,116,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,112,117,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,103,101,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,51,109,101,115,115,97,103,101,115,95,98,97,115,101,69,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,95,95,118,101,99,116,111,114,95,98,97,115,101,73,78,83,95,49,50,98,97,115,105,99,95,115,116,114,105,110,103,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,99,69,69,69,69,78,83,52,95,73,83,54,95,69,69,69,69,0,0,0,78,83,116,51,95,95,49,49,50,115,121,115,116,101,109,95,101,114,114,111,114,69,0,0,78,83,116,51,95,95,49,49,50,99,111,100,101,99,118,116,95,98,97,115,101,69,0,0,78,83,116,51,95,95,49,49,50,98,97,115,105,99,95,115,116,114,105,110,103,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,50,98,97,115,105,99,95,115,116,114,105,110,103,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,50,95,95,100,111,95,109,101,115,115,97,103,101,69,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,99,116,121,112,101,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,116,105,109,101,95,112,117,116,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,119,69,69,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,99,69,69,0,78,55,112,99,114,101,99,112,112,50,82,69,69,0,0,0,78,55,112,99,114,101,99,112,112,50,82,69,54,65,110,99,104,111,114,69,0,0,0,0,78,49,48,101,109,115,99,114,105,112,116,101,110,51,118,97,108,69,0,0,0,0,0,0,78,49,48,101,109,115,99,114,105,112,116,101,110,49,49,109,101,109,111,114,121,95,118,105,101,119,69,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,51,95,95,102,117,110,100,97,109,101,110,116,97,108,95,116,121,112,101,95,105,110,102,111,69,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,57,95,95,112,111,105,110,116,101,114,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,112,98,97,115,101,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,101,110,117,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,68,110,0,0,0,0,0,0,53,77,97,116,99,104,0,0,8,47,0,0,128,47,0,0,8,47,0,0,216,47,0,0,0,0,0,0,232,47,0,0,0,0,0,0,248,47,0,0,0,0,0,0,8,48,0,0,16,63,0,0,0,0,0,0,0,0,0,0,24,48,0,0,16,63,0,0,0,0,0,0,0,0,0,0,40,48,0,0,16,63,0,0,0,0,0,0,0,0,0,0,64,48,0,0,88,63,0,0,0,0,0,0,0,0,0,0,88,48,0,0,16,63,0,0,0,0,0,0,0,0,0,0,104,48,0,0,0,0,0,0,216,66,0,0,0,0,0,0,192,48,0,0,0,0,0,0,160,69,0,0,0,0,0,0,208,48,0,0,1,0,0,0,216,66,0,0,0,0,0,0,40,49,0,0,1,0,0,0,160,69,0,0,0,0,0,0,56,49,0,0,48,47,0,0,80,49,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,200,68,0,0,0,0,0,0,48,47,0,0,152,49,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,208,68,0,0,0,0,0,0,48,47,0,0,224,49,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,216,68,0,0,0,0,0,0,48,47,0,0,40,50,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,224,68,0,0,0,0,0,0,0,0,0,0,112,50,0,0,160,65,0,0,0,0,0,0,0,0,0,0,160,50,0,0,160,65,0,0,0,0,0,0,48,47,0,0,208,50,0,0,0,0,0,0,1,0,0,0,192,67,0,0,0,0,0,0,48,47,0,0,232,50,0,0,0,0,0,0,1,0,0,0,192,67,0,0,0,0,0,0,48,47,0,0,0,51,0,0,0,0,0,0,1,0,0,0,200,67,0,0,0,0,0,0,48,47,0,0,24,51,0,0,0,0,0,0,1,0,0,0,200,67,0,0,0,0,0,0,48,47,0,0,48,51,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,120,69,0,0,0,8,0,0,48,47,0,0,120,51,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,120,69,0,0,0,8,0,0,48,47,0,0,192,51,0,0,0,0,0,0,3,0,0,0,240,66,0,0,2,0,0,0,168,63,0,0,2,0,0,0,96,67,0,0,0,8,0,0,48,47,0,0,8,52,0,0,0,0,0,0,3,0,0,0,240,66,0,0,2,0,0,0,168,63,0,0,2,0,0,0,104,67,0,0,0,8,0,0,0,0,0,0,80,52,0,0,240,66,0,0,0,0,0,0,0,0,0,0,104,52,0,0,240,66,0,0,0,0,0,0,48,47,0,0,128,52,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,208,67,0,0,2,0,0,0,48,47,0,0,152,52,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,208,67,0,0,2,0,0,0,0,0,0,0,176,52,0,0,0,0,0,0,200,52,0,0,80,68,0,0,0,0,0,0,48,47,0,0,232,52,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,80,64,0,0,0,0,0,0,48,47,0,0,48,53,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,104,64,0,0,0,0,0,0,48,47,0,0,120,53,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,128,64,0,0,0,0,0,0,48,47,0,0,192,53,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,152,64,0,0,0,0,0,0,0,0,0,0,8,54,0,0,240,66,0,0,0,0,0,0,0,0,0,0,32,54,0,0,240,66,0,0,0,0,0,0,48,47,0,0,56,54,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,96,68,0,0,2,0,0,0,48,47,0,0,96,54,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,96,68,0,0,2,0,0,0,48,47,0,0,136,54,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,96,68,0,0,2,0,0,0,48,47,0,0,176,54,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,96,68,0,0,2,0,0,0,48,47,0,0,216,54,0,0,0,0,0,0,1,0,0,0,56,68,0,0,0,0,0,0,0,0,0,0,48,55,0,0,184,67,0,0,0,0,0,0,0,0,0,0,72,55,0,0,240,66,0,0,0,0,0,0,48,47,0,0,96,55,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,112,69,0,0,2,0,0,0,48,47,0,0,120,55,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,112,69,0,0,2,0,0,0,0,0,0,0,144,55,0,0,0,0,0,0,184,55,0,0,0,0,0,0,224,55,0,0,0,0,0,0,8,56,0,0,0,0,0,0,48,56,0,0,152,68,0,0,0,0,0,0,0,0,0,0,80,56,0,0,184,66,0,0,0,0,0,0,0,0,0,0,120,56,0,0,184,66,0,0,0,0,0,0,0,0,0,0,160,56,0,0,0,0,0,0,216,56,0,0,0,0,0,0,16,57,0,0,0,0,0,0,48,57,0,0,0,0,0,0,80,57,0,0,0,0,0,0,112,57,0,0,0,0,0,0,144,57,0,0,48,47,0,0,168,57,0,0,0,0,0,0,1,0,0,0,48,64,0,0,3,244,255,255,48,47,0,0,216,57,0,0,0,0,0,0,1,0,0,0,64,64,0,0,3,244,255,255,48,47,0,0,8,58,0,0,0,0,0,0,1,0,0,0,48,64,0,0,3,244,255,255,48,47,0,0,56,58,0,0,0,0,0,0,1,0,0,0,64,64,0,0,3,244,255,255,48,47,0,0,104,58,0,0,0,0,0,0,1,0,0,0,88,67,0,0,0,0,0,0,0,0,0,0,200,58,0,0,56,63,0,0,0,0,0,0,0,0,0,0,224,58,0,0,48,47,0,0,248,58,0,0,0,0,0,0,1,0,0,0,80,67,0,0,0,0,0,0,48,47,0,0,56,59,0,0,0,0,0,0,1,0,0,0,80,67,0,0,0,0,0,0,0,0,0,0,120,59,0,0,176,67,0,0,0,0,0,0,0,0,0,0,144,59,0,0,160,67,0,0,0,0,0,0,0,0,0,0,176,59,0,0,168,67,0,0,0,0,0,0,0,0,0,0,208,59,0,0,0,0,0,0,240,59,0,0,0,0,0,0,16,60,0,0,0,0,0,0,48,60,0,0,48,47,0,0,80,60,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,104,69,0,0,2,0,0,0,48,47,0,0,112,60,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,104,69,0,0,2,0,0,0,48,47,0,0,144,60,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,104,69,0,0,2,0,0,0,48,47,0,0,176,60,0,0,0,0,0,0,2,0,0,0,240,66,0,0,2,0,0,0,104,69,0,0,2,0,0,0,0,0,0,0,208,60,0,0,0,0,0,0,232,60,0,0,0,0,0,0,0,61,0,0,0,0,0,0,24,61,0,0,160,67,0,0,0,0,0,0,0,0,0,0,48,61,0,0,168,67,0,0,0,0,0,0,0,0,0,0,72,61,0,0,96,47,0,0,88,61,0,0,0,0,0,0,112,61,0,0,0,0,0,0,136,61,0,0,0,0,0,0,168,61,0,0,32,70,0,0,0,0,0,0,0,0,0,0,208,61,0,0,16,70,0,0,0,0,0,0,0,0,0,0,248,61,0,0,16,70,0,0,0,0,0,0,0,0,0,0,32,62,0,0,0,70,0,0,0,0,0,0,0,0,0,0,72,62,0,0,32,70,0,0,0,0,0,0,0,0,0,0,112,62,0,0,32,70,0,0,0,0,0,0,0,0,0,0,152,62,0,0,8,63,0,0,0,0,0,0,0,0,0,0,192,62,0,0,32,70,0,0,0,0,0,0,8,47,0,0,232,62,0,0,0,0,0,0,240,62,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,65,66,67,68,69,70,120,88,43,45,112,80,105,73,110,78,0,0,0,0,0,0,0,0])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
function runPostSets() {
HEAP32[((16136 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((16144 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((16152 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((16168 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((16184 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((16200 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((16216 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((16232 )>>2)]=(((__ZTVN10__cxxabiv119__pointer_type_infoE+8)|0));
HEAP32[((16248 )>>2)]=(((__ZTVN10__cxxabiv119__pointer_type_infoE+8)|0));
HEAP32[((16264 )>>2)]=(((__ZTVN10__cxxabiv119__pointer_type_infoE+8)|0));
HEAP32[((16280 )>>2)]=(((__ZTVN10__cxxabiv119__pointer_type_infoE+8)|0));
HEAP32[((16296 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((16432 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((16448 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((16704 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((16720 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((16800 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((16808 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((16952 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((16968 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17136 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17152 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17232 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17240 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17248 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17256 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17264 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17280 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17296 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17312 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17320 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17328 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17336 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17344 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17352 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17360 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17488 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17504 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17560 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17576 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17592 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17608 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17616 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17624 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17632 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17768 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17776 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17784 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17792 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17808 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17824 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17840 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17848 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((17856 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17872 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17888 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17904 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17920 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17936 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17952 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17968 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((17992 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
}
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  function ___gxx_personality_v0() {
    }
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  var _mkport=undefined;var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr);
      } catch(e) { // XXX FIXME
      }
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = HEAP32[((_llvm_eh_exception.buf)>>2)];
      if (throwntype == -1) throwntype = HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return tempRet0 = typeArray[i],thrown;
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return tempRet0 = throwntype,thrown;
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }
  function _memmove(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      if (((src|0) < (dest|0)) & ((dest|0) < ((src + num)|0))) {
        // Unlikely case: Copy backwards in a safe manner
        ret = dest;
        src = (src + num)|0;
        dest = (dest + num)|0;
        while ((num|0) > 0) {
          dest = (dest - 1)|0;
          src = (src - 1)|0;
          num = (num - 1)|0;
          HEAP8[(dest)]=HEAP8[(src)];
        }
        dest = ret;
      } else {
        _memcpy(dest, src, num) | 0;
      }
      return dest | 0;
    }var _llvm_memmove_p0i8_p0i8_i32=_memmove;
;
;
;
;
;
;
;
  function ___assert_fail(condition, filename, line, func) {
      ABORT = true;
      throw 'Assertion failed: ' + Pointer_stringify(condition) + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + stackTrace();
    }
;
;
;
  function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      return ptr;
    }
  function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      __THREW__ = 0;
      // Clear type.
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=0
      // Call destructor if one is registered then clear it.
      var ptr = HEAP32[((_llvm_eh_exception.buf)>>2)];
      var destructor = HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)];
      if (destructor) {
        Runtime.dynCall('vi', destructor, [ptr]);
        HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=0
      }
      // Free ptr if it isn't null.
      if (ptr) {
        ___cxa_free_exception(ptr);
        HEAP32[((_llvm_eh_exception.buf)>>2)]=0
      }
    }
;
;
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
      return (ptr-num)|0;
    }var _llvm_memset_p0i8_i32=_memset;
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  var _llvm_memset_p0i8_i64=_memset;
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }
  function _memcmp(p1, p2, num) {
      p1 = p1|0; p2 = p2|0; num = num|0;
      var i = 0, v1 = 0, v2 = 0;
      while ((i|0) < (num|0)) {
        v1 = HEAPU8[(((p1)+(i))|0)];
        v2 = HEAPU8[(((p2)+(i))|0)];
        if ((v1|0) != (v2|0)) return ((v1|0) > (v2|0) ? 1 : -1)|0;
        i = (i+1)|0;
      }
      return 0;
    }
  function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;
  function _llvm_umul_with_overflow_i32(x, y) {
      x = x>>>0;
      y = y>>>0;
      return tempRet0 = x*y > 4294967295,(x*y)>>>0;
    }
  function ___errno_location() {
      return ___errno_state;
    }
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  function _strdup(ptr) {
      var len = _strlen(ptr);
      var newStr = _malloc(len + 1);
      (_memcpy(newStr, ptr, len)|0);
      HEAP8[(((newStr)+(len))|0)]=0;
      return newStr;
    }
;
;
;
;
;
;
;
;
  function _pthread_mutex_lock() {}
  function _pthread_mutex_unlock() {}
  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }
  function ___cxa_guard_release() {}
  function _pthread_cond_broadcast() {
      return 0;
    }
  function _pthread_cond_wait() {
      return 0;
    }
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStream(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  function _abort() {
      Module['abort']();
    }
  function ___cxa_rethrow() {
      ___cxa_end_catch.rethrown = true;
      throw HEAP32[((_llvm_eh_exception.buf)>>2)] + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function ___cxa_guard_abort() {}
  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }var _isxdigit_l=_isxdigit;
  var _isdigit_l=_isdigit;
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math_min(Math_floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text)
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      function get() { return HEAP8[(((s)+(index++))|0)]; };
      function unget() { index--; };
      return __scanString(format, get, unget, varargs);
    }
  function _catopen() { throw 'TODO: ' + aborter }
  function _catgets() { throw 'TODO: ' + aborter }
  function _catclose() { throw 'TODO: ' + aborter }
  function _newlocale(mask, locale, base) {
      return _malloc(4);
    }
  function _freelocale(locale) {
      _free(locale);
    }
  function _isascii(chr) {
      return chr >= 0 && (chr & 0x80) == 0;
    }
  function ___ctype_b_loc() {
      // http://refspecs.freestandards.org/LSB_3.0.0/LSB-Core-generic/LSB-Core-generic/baselib---ctype-b-loc.html
      var me = ___ctype_b_loc;
      if (!me.ret) {
        var values = [
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,8195,8194,8194,8194,8194,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,24577,49156,49156,49156,
          49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,55304,55304,55304,55304,55304,55304,55304,55304,
          55304,55304,49156,49156,49156,49156,49156,49156,49156,54536,54536,54536,54536,54536,54536,50440,50440,50440,50440,50440,
          50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,49156,49156,49156,49156,49156,
          49156,54792,54792,54792,54792,54792,54792,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,
          50696,50696,50696,50696,50696,50696,50696,49156,49156,49156,49156,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ];
        var i16size = 2;
        var arr = _malloc(values.length * i16size);
        for (var i = 0; i < values.length; i++) {
          HEAP16[(((arr)+(i * i16size))>>1)]=values[i]
        }
        me.ret = allocate([arr + 128 * i16size], 'i16*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_tolower_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-tolower-loc.html
      var me = ___ctype_tolower_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,91,92,93,94,95,96,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,
          134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,
          164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,
          194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
          224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,
          254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_toupper_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-toupper-loc.html
      var me = ___ctype_toupper_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,
          73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
          81,82,83,84,85,86,87,88,89,90,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,
          145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,
          175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,
          205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,
          235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
      var pattern = Pointer_stringify(format);
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }var _strftime_l=_strftime;
  function __parseInt64(str, endptr, base, min, max, unsign) {
      var isNegative = false;
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      if (HEAP8[(str)] == 45) {
        str++;
        isNegative = true;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var ok = false;
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            ok = true; // we saw an initial zero, perhaps the entire thing is just "0"
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      var start = str;
      // Get digits.
      var chr;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          str++;
          ok = true;
        }
      }
      if (!ok) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return tempRet0 = 0,0;
      }
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      try {
        var numberString = isNegative ? '-'+Pointer_stringify(start, str - start) : Pointer_stringify(start, str - start);
        i64Math.fromString(numberString, finalBase, min, max, unsign);
      } catch(e) {
        ___setErrNo(ERRNO_CODES.ERANGE); // not quite correct
      }
      return tempRet0 = HEAP32[(((tempDoublePtr)+(4))>>2)],HEAP32[((tempDoublePtr)>>2)];
    }function _strtoull(str, endptr, base) {
      return __parseInt64(str, endptr, base, 0, '18446744073709551615', true);  // ULONG_MAX.
    }var _strtoull_l=_strtoull;
  function _strtoll(str, endptr, base) {
      return __parseInt64(str, endptr, base, '-9223372036854775808', '9223372036854775807');  // LLONG_MIN, LLONG_MAX.
    }var _strtoll_l=_strtoll;
  function _uselocale(locale) {
      return 0;
    }
  var _llvm_va_start=undefined;
  function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }function _asprintf(s, format, varargs) {
      return _sprintf(-s, format, varargs);
    }function _vasprintf(s, format, va_arg) {
      return _asprintf(s, format, HEAP32[((va_arg)>>2)]);
    }
  function _llvm_va_end() {}
  function _vsnprintf(s, n, format, va_arg) {
      return _snprintf(s, n, format, HEAP32[((va_arg)>>2)]);
    }
  function _vsscanf(s, format, va_arg) {
      return _sscanf(s, format, HEAP32[((va_arg)>>2)]);
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            var errorInfo = '?';
            function onContextCreationError(event) {
              errorInfo = event.statusMessage || errorInfo;
            }
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");
var FUNCTION_TABLE = [0,0,__ZNSt3__18messagesIwED0Ev,0,__ZN10emscripten8internal13getActualTypeINSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEEEPKNS0_7_TYPEIDEPT_,0,__ZNSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev,0,__ZNKSt3__18numpunctIcE12do_falsenameEv,0,__ZNKSt3__120__time_get_c_storageIwE3__rEv,0,__ZNKSt3__110moneypunctIwLb0EE16do_thousands_sepEv,0,__ZNSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev,0,__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE11do_get_yearES4_S4_RNS_8ios_baseERjP2tm,0,__ZNSt12length_errorD0Ev,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEED1Ev,0,__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE11do_get_timeES4_S4_RNS_8ios_baseERjP2tm,0,__ZNSt3__17codecvtIwc11__mbstate_tED2Ev,0,__ZNSt3__16locale2id6__initEv,0,__ZNSt3__110__stdinbufIcED1Ev,0,__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE14do_get_weekdayES4_S4_RNS_8ios_baseERjP2tm,0,__ZNSt3__110__stdinbufIcE9pbackfailEi,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE9underflowEv,0,__ZNSt3__110__stdinbufIwED0Ev,0,__ZNSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev,0,__ZNSt11logic_errorD0Ev,0,__ZNSt3__17codecvtIDsc11__mbstate_tED0Ev,0,__ZNKSt3__17collateIcE7do_hashEPKcS3_,0,__ZNKSt3__17codecvtIcc11__mbstate_tE16do_always_noconvEv,0,__ZNKSt3__120__time_get_c_storageIwE8__monthsEv,0,__ZNSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev,0,__ZNKSt3__19money_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_bRNS_8ios_baseEwRKNS_12basic_stringIwS3_NS_9allocatorIwEEEE,0,__ZNKSt3__15ctypeIcE10do_toupperEPcPKc,0,__ZNKSt3__110moneypunctIwLb1EE16do_positive_signEv,0,__ZNKSt3__15ctypeIwE10do_tolowerEPwPKw,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE5uflowEv,0,__ZNSt3__17collateIcED1Ev,0,__ZNSt3__18ios_base7failureD2Ev,0,__ZNK10__cxxabiv121__vmi_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,0,__ZNSt9bad_allocD2Ev,0,__ZNKSt3__110moneypunctIcLb1EE11do_groupingEv,0,__ZNSt3__16locale5facetD0Ev,0,__ZNKSt3__17codecvtIwc11__mbstate_tE6do_outERS1_PKwS5_RS5_PcS7_RS7_,0,__ZNKSt3__120__time_get_c_storageIwE3__cEv,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwy,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwx,0,__ZNSt3__15ctypeIcED0Ev,0,__ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEKFjvEjPKSB_JEE6invokeERKSD_SF_,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwm,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwl,0,__ZNSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev,0,__ZNSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwe,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwd,0,__ZNKSt3__110moneypunctIcLb1EE16do_decimal_pointEv,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwb,0,__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,0,__ZNKSt3__19money_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_bRNS_8ios_baseEcRKNS_12basic_stringIcS3_NS_9allocatorIcEEEE,0,__ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEED1Ev,0,__ZNKSt3__17codecvtIDsc11__mbstate_tE5do_inERS1_PKcS5_RS5_PDsS7_RS7_,0,__ZN10emscripten8internal14raw_destructorINSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEEEvPT_,0,__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE13do_date_orderEv,0,__ZNSt3__18messagesIcED1Ev,0,__ZNKSt3__120__time_get_c_storageIwE7__weeksEv,0,__ZNKSt3__18numpunctIwE11do_groupingEv,0,__ZNSt3__16locale5facet16__on_zero_sharedEv,0,__ZNKSt3__15ctypeIwE8do_widenEc,0,__ZNKSt3__18time_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwPK2tmcc,0,__ZNSt3__110__stdinbufIcE5uflowEv,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE9pbackfailEj,0,__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE11do_get_timeES4_S4_RNS_8ios_baseERjP2tm,0,__ZTv0_n12_NSt3__113basic_istreamIcNS_11char_traitsIcEEED0Ev,0,__ZNSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE5uflowEv,0,__ZNKSt3__110moneypunctIwLb0EE13do_neg_formatEv,0,___ZN10emscripten8internal12MemberAccessI5MatchNSt3__112basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEEE7getWireIS2_EEPNS0_11BindingTypeIS9_E3$_0ERKMS2_S9_RKT__,0,__ZNKSt3__15ctypeIcE8do_widenEc,0,__ZNSt3__110moneypunctIwLb0EED0Ev,0,__ZNSt3__16locale5__impD2Ev,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE9underflowEv,0,__ZNKSt3__15ctypeIcE10do_toupperEc,0,__ZNKSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_RNS_8ios_baseEwPKv,0,__ZNKSt3__17codecvtIDic11__mbstate_tE11do_encodingEv,0,__ZNSt3__18numpunctIcED2Ev,0,__ZNKSt3__18numpunctIcE11do_groupingEv,0,__ZNK10__cxxabiv116__shim_type_info5noop1Ev,0,__ZN10__cxxabiv119__pointer_type_infoD0Ev,0,__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE16do_get_monthnameES4_S4_RNS_8ios_baseERjP2tm,0,__ZNKSt3__120__time_get_c_storageIwE3__xEv,0,__ZNKSt3__110moneypunctIcLb1EE13do_neg_formatEv,0,__ZNSt3__110__stdinbufIwE9pbackfailEj,0,__ZN10emscripten8internal12VectorAccessINSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEE3getERKSB_j,0,__ZNKSt3__18time_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcPK2tmcc,0,__ZNSt3__18numpunctIcED0Ev,0,__ZNSt3__111__stdoutbufIcE8overflowEi,0,__ZN10__cxxabiv116__enum_type_infoD0Ev,0,__ZNSt3__119__iostream_categoryD1Ev,0,__ZNKSt3__120__time_get_c_storageIwE7__am_pmEv,0,__ZNSt3__111__stdoutbufIwE5imbueERKNS_6localeE,0,__ZNKSt3__18messagesIcE8do_closeEi,0,__ZNKSt3__15ctypeIwE5do_isEPKwS3_Pt,0,__ZNSt13runtime_errorD2Ev,0,__ZNKSt3__15ctypeIwE10do_toupperEw,0,__ZNKSt3__15ctypeIwE9do_narrowEPKwS3_cPc,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE5imbueERKNS_6localeE,0,__ZNKSt3__110moneypunctIcLb0EE16do_negative_signEv,0,__ZNSt3__17collateIwED1Ev,0,__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE16do_get_monthnameES4_S4_RNS_8ios_baseERjP2tm,0,__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv,0,__ZNKSt8bad_cast4whatEv,0,__ZNSt3__110moneypunctIcLb0EED1Ev,0,__ZNKSt3__18messagesIcE6do_getEiiiRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE,0,__ZNSt3__18numpunctIwED2Ev,0,__ZNKSt3__110moneypunctIwLb1EE13do_pos_formatEv,0,__ZNSt3__15ctypeIwED0Ev,0,__ZNKSt13runtime_error4whatEv,0,_free,0,__ZN10emscripten8internal12operator_newIN7pcrecpp2REEJNSt3__112basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEEEEEPT_DpT0_,0,__ZNSt3__19money_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev,0,__ZNSt3__117__widen_from_utf8ILj32EED0Ev,0,__ZN10__cxxabiv123__fundamental_type_infoD0Ev,0,__ZNK10__cxxabiv116__enum_type_info9can_catchEPKNS_16__shim_type_infoERPv,0,__ZNKSt3__18numpunctIwE16do_thousands_sepEv,0,___ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEFvRKS9_EvPSB_JSD_EE6invokeERKSF_SG_PNS0_11BindingTypeIS9_E3$_0E_,0,__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjP2tmcc,0,__ZNSt3__113basic_istreamIwNS_11char_traitsIwEEED1Ev,0,__ZN10emscripten8internal13getActualTypeIN7pcrecpp2REEEEPKNS0_7_TYPEIDEPT_,0,__ZNKSt3__17codecvtIDsc11__mbstate_tE10do_unshiftERS1_PcS4_RS4_,0,__ZNSt3__110__stdinbufIwED1Ev,0,__ZNKSt3__18numpunctIcE16do_decimal_pointEv,0,__ZNKSt3__110moneypunctIwLb0EE16do_negative_signEv,0,__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,0,__ZNKSt3__120__time_get_c_storageIcE3__xEv,0,__ZNSt3__17collateIwED0Ev,0,__ZNKSt3__110moneypunctIcLb0EE16do_positive_signEv,0,__ZNSt3__18time_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev,0,__ZNKSt3__17codecvtIDsc11__mbstate_tE6do_outERS1_PKDsS5_RS5_PcS7_RS7_,0,__ZNSt11logic_errorD2Ev,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE7seekoffExNS_8ios_base7seekdirEj,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcy,0,__ZNSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev,0,__ZNKSt3__18numpunctIwE16do_decimal_pointEv,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE4syncEv,0,__ZNKSt3__16vectorINS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEENS4_IS6_EEE4sizeEv,0,__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,0,__ZNSt3__16vectorINS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEENS4_IS6_EEE9push_backERKS6_,0,__ZNKSt3__17codecvtIcc11__mbstate_tE11do_encodingEv,0,__ZNKSt3__110moneypunctIcLb0EE11do_groupingEv,0,__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,0,__ZNKSt3__110moneypunctIwLb1EE14do_frac_digitsEv,0,__ZNSt3__17codecvtIDic11__mbstate_tED0Ev,0,__ZNKSt3__110moneypunctIwLb1EE16do_negative_signEv,0,__ZNK10__cxxabiv121__vmi_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,0,__ZNKSt3__120__time_get_c_storageIcE3__XEv,0,__ZNKSt3__15ctypeIwE9do_narrowEwc,0,__ZNSt3__111__stdoutbufIwE4syncEv,0,__ZNSt3__110moneypunctIwLb0EED1Ev,0,__ZNSt3__113basic_istreamIcNS_11char_traitsIcEEED1Ev,0,__ZTv0_n12_NSt3__113basic_ostreamIcNS_11char_traitsIcEEED1Ev,0,__ZNSt3__18time_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev,0,__ZNSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev,0,__ZNKSt3__17collateIwE7do_hashEPKwS3_,0,__ZNSt3__111__stdoutbufIcE5imbueERKNS_6localeE,0,__ZNKSt3__110moneypunctIcLb1EE16do_thousands_sepEv,0,__ZNSt3__18ios_baseD0Ev,0,__ZNKSt3__17codecvtIDsc11__mbstate_tE16do_always_noconvEv,0,__ZNSt3__110moneypunctIcLb1EED0Ev,0,__ZNSt9bad_allocD0Ev,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEED0Ev,0,__ZNKSt3__114error_category10equivalentEiRKNS_15error_conditionE,0,___cxx_global_array_dtor53,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE6xsputnEPKci,0,___cxx_global_array_dtor56,0,__ZNKSt3__15ctypeIwE10do_scan_isEtPKwS3_,0,__ZTv0_n12_NSt3__113basic_ostreamIwNS_11char_traitsIwEEED0Ev,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEED1Ev,0,__ZN10__cxxabiv120__si_class_type_infoD0Ev,0,__ZNKSt3__17collateIwE10do_compareEPKwS3_S3_S3_,0,___ZN10emscripten8internal15FunctionInvokerIPF5MatchRN7pcrecpp2REENSt3__112basic_stringIcNS6_11char_traitsIcEENS6_9allocatorIcEEEENS4_6AnchorEES2_S5_JSC_SD_EE6invokeEPSF_PS4_PNS0_11BindingTypeISC_E3$_0ESD__,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE6xsgetnEPci,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRPv,0,__ZNKSt3__15ctypeIcE10do_tolowerEc,0,__ZNKSt3__110moneypunctIwLb1EE13do_neg_formatEv,0,__ZNKSt3__15ctypeIcE8do_widenEPKcS3_Pc,0,__ZNSt3__17codecvtIcc11__mbstate_tED0Ev,0,__ZNKSt3__110moneypunctIwLb1EE16do_decimal_pointEv,0,__ZNKSt3__120__time_get_c_storageIcE7__weeksEv,0,__ZNKSt3__18numpunctIwE11do_truenameEv,0,__ZTv0_n12_NSt3__113basic_istreamIcNS_11char_traitsIcEEED1Ev,0,__ZNSt3__110__stdinbufIwE9underflowEv,0,___ZN10emscripten8internal15FunctionInvokerIPFbRNSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEjRKS9_EbSC_JjSE_EE6invokeEPSG_PSB_jPNS0_11BindingTypeIS9_E3$_0E_,0,__ZNKSt3__17codecvtIDic11__mbstate_tE9do_lengthERS1_PKcS5_j,0,__ZNSt3__18ios_base7failureD0Ev,0,__ZNSt3__19money_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev,0,__ZNSt3__18ios_base4InitD2Ev,0,__ZNKSt3__15ctypeIwE5do_isEtw,0,__ZNSt3__110moneypunctIwLb1EED0Ev,0,__ZTv0_n12_NSt3__113basic_ostreamIwNS_11char_traitsIwEEED1Ev,0,__ZNKSt3__15ctypeIcE9do_narrowEPKcS3_cPc,0,__ZN10emscripten8internal15raw_constructorI5MatchJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE,0,__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE14do_get_weekdayES4_S4_RNS_8ios_baseERjP2tm,0,__ZNKSt3__17codecvtIDic11__mbstate_tE16do_always_noconvEv,0,__ZN7pcrecpp3Arg12parse_stringEPKciPv,0,___cxx_global_array_dtor105,0,__ZNK10__cxxabiv116__shim_type_info5noop2Ev,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE6setbufEPwi,0,__ZNKSt3__18messagesIwE7do_openERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEERKNS_6localeE,0,__ZN7pcrecpp3Arg10parse_nullEPKciPv,0,__ZNKSt9bad_alloc4whatEv,0,__ZNSt3__111__stdoutbufIcED1Ev,0,__ZNKSt3__110moneypunctIcLb1EE14do_curr_symbolEv,0,__ZNSt3__16locale5__impD0Ev,0,__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,0,__ZNKSt3__119__iostream_category4nameEv,0,__ZNKSt3__110moneypunctIcLb0EE14do_frac_digitsEv,0,__ZNKSt3__17codecvtIDsc11__mbstate_tE9do_lengthERS1_PKcS5_j,0,__ZNKSt3__110moneypunctIwLb1EE11do_groupingEv,0,__ZNSt3__18time_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev,0,___ZN10emscripten8internal7InvokerIPN7pcrecpp2REEJNSt3__112basic_stringIcNS5_11char_traitsIcEENS5_9allocatorIcEEEEEE6invokeEPFS4_SB_EPNS0_11BindingTypeISB_E3$_0E_,0,__ZNSt3__19money_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev,0,__ZNSt8bad_castD0Ev,0,__ZNKSt3__15ctypeIcE9do_narrowEcc,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRf,0,__ZN10emscripten8internal12MemberAccessI5MatchNSt3__16vectorINS3_12basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEENS8_ISA_EEEEE7setWireIS2_EEvRKMS2_SC_RT_PSC_,0,__ZNSt3__112__do_nothingEPv,0,__ZNSt3__19money_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev,0,___cxx_global_array_dtor81,0,__ZNSt3__110moneypunctIcLb0EED0Ev,0,__ZNSt3__17num_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev,0,__ZNKSt3__17codecvtIDic11__mbstate_tE5do_inERS1_PKcS5_RS5_PDiS7_RS7_,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcPKv,0,__ZNKSt3__18numpunctIwE12do_falsenameEv,0,__ZNSt3__17collateIcED0Ev,0,__ZNKSt3__110moneypunctIwLb0EE13do_pos_formatEv,0,__ZNKSt3__110moneypunctIcLb1EE16do_negative_signEv,0,__ZNSt3__111__stdoutbufIcED0Ev,0,__ZNSt3__16locale5facetD2Ev,0,__ZTv0_n12_NSt3__113basic_istreamIwNS_11char_traitsIwEEED1Ev,0,__ZNSt3__112system_errorD0Ev,0,__ZNKSt3__19money_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_bRNS_8ios_baseERjRe,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE8overflowEi,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE9showmanycEv,0,__ZNSt3__110__stdinbufIwE5uflowEv,0,__ZNKSt3__18numpunctIcE11do_truenameEv,0,__ZNKSt3__17codecvtIwc11__mbstate_tE5do_inERS1_PKcS5_RS5_PwS7_RS7_,0,__ZNKSt3__110moneypunctIcLb1EE13do_pos_formatEv,0,__ZNKSt3__19money_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_putES4_bRNS_8ios_baseEwe,0,__ZN10emscripten8internal15FunctionInvokerIPFNS_3valERKNSt3__16vectorINS3_12basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEENS8_ISA_EEEEjES2_SE_JjEE6invokeEPSG_PSC_j,0,__ZNKSt3__19money_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_bRNS_8ios_baseERjRe,0,__ZNSt3__17codecvtIwc11__mbstate_tED0Ev,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjS8_,0,__ZNKSt3__18numpunctIcE16do_thousands_sepEv,0,__ZNSt3__110__stdinbufIwE5imbueERKNS_6localeE,0,__ZNSt3__19money_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev,0,__ZN10emscripten8internal7InvokerIPNSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEJEE6invokeEPFSC_vE,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE9showmanycEv,0,__ZNSt3__19money_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev,0,__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE11do_get_dateES4_S4_RNS_8ios_baseERjP2tm,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE8overflowEj,0,__ZNSt3__18numpunctIwED0Ev,0,__ZNK10__cxxabiv119__pointer_type_info9can_catchEPKNS_16__shim_type_infoERPv,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE5imbueERKNS_6localeE,0,__ZNKSt3__15ctypeIwE10do_tolowerEw,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE4syncEv,0,__ZNSt3__111__stdoutbufIcE4syncEv,0,__ZNSt3__112basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED1Ev,0,__ZNKSt3__17collateIcE10do_compareEPKcS3_S3_S3_,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE7seekposENS_4fposI11__mbstate_tEEj,0,__ZNSt3__110__stdinbufIcE5imbueERKNS_6localeE,0,__ZNKSt3__17collateIwE12do_transformEPKwS3_,0,__ZNKSt3__17codecvtIDic11__mbstate_tE6do_outERS1_PKDiS5_RS5_PcS7_RS7_,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcx,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEce,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcd,0,__ZN10emscripten8internal12MemberAccessI5MatchbE7getWireIS2_EEbRKMS2_bRKT_,0,__ZNKSt3__17codecvtIcc11__mbstate_tE13do_max_lengthEv,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcb,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcm,0,__ZNKSt3__17num_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_RNS_8ios_baseEcl,0,__ZNSt8bad_castD2Ev,0,__ZN10__cxxabiv121__vmi_class_type_infoD0Ev,0,__ZNKSt3__17codecvtIcc11__mbstate_tE10do_unshiftERS1_PcS4_RS4_,0,__ZN10emscripten8internal14raw_destructorIN7pcrecpp2REEEEvPT_,0,__ZNKSt3__110moneypunctIcLb1EE14do_frac_digitsEv,0,__ZNKSt3__17codecvtIcc11__mbstate_tE9do_lengthERS1_PKcS5_j,0,__ZNKSt3__120__time_get_c_storageIcE3__rEv,0,__ZNKSt3__19money_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_bRNS_8ios_baseERjRNS_12basic_stringIcS3_NS_9allocatorIcEEEE,0,__ZNKSt3__15ctypeIwE10do_toupperEPwPKw,0,__ZTv0_n12_NSt3__113basic_ostreamIcNS_11char_traitsIcEEED0Ev,0,__ZNSt3__110__stdinbufIcE9underflowEv,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE7seekposENS_4fposI11__mbstate_tEEj,0,__ZNKSt3__114error_category23default_error_conditionEi,0,__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,0,__ZNKSt3__17codecvtIDsc11__mbstate_tE11do_encodingEv,0,__ZN10emscripten8internal12VectorAccessINSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEE3setERSB_jRKS9_,0,__ZNKSt3__18messagesIwE8do_closeEi,0,__ZNSt3__112system_errorD2Ev,0,__ZNKSt3__17codecvtIwc11__mbstate_tE16do_always_noconvEv,0,__ZNKSt3__110moneypunctIwLb0EE11do_groupingEv,0,__ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv,0,__ZNKSt3__17codecvtIwc11__mbstate_tE10do_unshiftERS1_PcS4_RS4_,0,__ZNKSt3__110moneypunctIcLb0EE16do_decimal_pointEv,0,__ZNSt3__113basic_istreamIcNS_11char_traitsIcEEED0Ev,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRy,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRx,0,__ZNKSt3__120__time_get_c_storageIcE8__monthsEv,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRt,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRPv,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRm,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRl,0,__ZNSt3__111__stdoutbufIwE6xsputnEPKwi,0,__ZN10emscripten8internal14raw_destructorI5MatchEEvPT_,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRb,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRe,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRd,0,__ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRf,0,__ZNKSt3__110moneypunctIcLb0EE16do_thousands_sepEv,0,__ZNKSt3__114error_category10equivalentERKNS_10error_codeEi,0,__ZNKSt3__110moneypunctIcLb0EE13do_neg_formatEv,0,__ZNKSt11logic_error4whatEv,0,__ZNKSt3__119__iostream_category7messageEi,0,__ZN10emscripten8internal12operator_newINSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEJEEEPT_DpT0_,0,__ZNKSt3__110moneypunctIcLb0EE13do_pos_formatEv,0,__ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEED0Ev,0,__ZNKSt3__110moneypunctIwLb0EE16do_decimal_pointEv,0,__ZNKSt3__17codecvtIDic11__mbstate_tE10do_unshiftERS1_PcS4_RS4_,0,__ZNKSt3__17collateIcE12do_transformEPKcS3_,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE6xsgetnEPwi,0,__ZNKSt3__17codecvtIwc11__mbstate_tE13do_max_lengthEv,0,__ZNKSt3__110moneypunctIwLb0EE14do_frac_digitsEv,0,__ZNSt3__18messagesIcED0Ev,0,__ZNKSt3__15ctypeIcE10do_tolowerEPcPKc,0,__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjP2tmcc,0,__ZNKSt3__120__time_get_c_storageIcE7__am_pmEv,0,__ZNKSt3__110moneypunctIcLb0EE14do_curr_symbolEv,0,__ZNKSt3__15ctypeIwE8do_widenEPKcS3_Pw,0,__ZNKSt3__110moneypunctIwLb1EE16do_thousands_sepEv,0,__ZNK10__cxxabiv121__vmi_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,0,__ZNKSt3__17codecvtIwc11__mbstate_tE9do_lengthERS1_PKcS5_j,0,___ZN10emscripten8internal12MemberAccessI5MatchNSt3__112basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEEE7setWireIS2_EEvRKMS2_S9_RT_PNS0_11BindingTypeIS9_E3$_0E_,0,__ZNSt3__18ios_baseD2Ev,0,__ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEED1Ev,0,__ZNSt3__110__stdinbufIcED0Ev,0,__ZNKSt3__17codecvtIwc11__mbstate_tE11do_encodingEv,0,__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE13do_date_orderEv,0,__ZNKSt3__18time_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE11do_get_yearES4_S4_RNS_8ios_baseERjP2tm,0,__ZNSt3__119__iostream_categoryD0Ev,0,__ZNSt3__110moneypunctIwLb1EED1Ev,0,__ZNKSt3__110moneypunctIwLb0EE14do_curr_symbolEv,0,__ZNKSt3__18messagesIcE7do_openERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEERKNS_6localeE,0,__ZNSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev,0,__ZNSt3__110moneypunctIcLb1EED1Ev,0,__ZNSt3__111__stdoutbufIwED0Ev,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE7seekoffExNS_8ios_base7seekdirEj,0,__ZNKSt3__120__time_get_c_storageIcE3__cEv,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE6setbufEPci,0,__ZNKSt3__110moneypunctIwLb0EE16do_positive_signEv,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjS8_,0,__ZNKSt3__120__time_get_c_storageIwE3__XEv,0,__ZNKSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE11do_get_dateES4_S4_RNS_8ios_baseERjP2tm,0,__ZN10emscripten8internal12MemberAccessI5MatchNSt3__16vectorINS3_12basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEENS8_ISA_EEEEE7getWireIS2_EEPSC_RKMS2_SC_RKT_,0,__ZTv0_n12_NSt3__113basic_istreamIwNS_11char_traitsIwEEED0Ev,0,__ZNKSt3__17codecvtIcc11__mbstate_tE6do_outERS1_PKcS5_RS5_PcS7_RS7_,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEED0Ev,0,__ZN10emscripten8internal12MemberAccessI5MatchbE7setWireIS2_EEvRKMS2_bRT_b,0,__ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE9pbackfailEi,0,__ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEED0Ev,0,__ZNSt3__111__stdoutbufIwE8overflowEj,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRy,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRx,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRt,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRm,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRl,0,__ZNKSt3__19money_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_putES4_bRNS_8ios_baseEce,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRe,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRd,0,__ZNSt3__116__narrow_to_utf8ILj32EED0Ev,0,__ZNKSt3__17codecvtIDsc11__mbstate_tE13do_max_lengthEv,0,__ZNSt3__111__stdoutbufIcE6xsputnEPKci,0,__ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRb,0,___cxx_global_array_dtor,0,__ZNSt3__18time_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev,0,__ZN10__cxxabiv117__class_type_infoD0Ev,0,__ZNSt3__18messagesIwED1Ev,0,__ZNSt3__111__stdoutbufIwED1Ev,0,__ZNKSt3__19money_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_bRNS_8ios_baseERjRNS_12basic_stringIwS3_NS_9allocatorIwEEEE,0,__ZN10__cxxabiv116__shim_type_infoD2Ev,0,__ZNKSt3__15ctypeIwE11do_scan_notEtPKwS3_,0,__ZNKSt3__110moneypunctIwLb1EE14do_curr_symbolEv,0,__ZNSt3__18time_putIwNS_19ostreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev,0,__Z9RE__matchRN7pcrecpp2REENSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS0_6AnchorE,0,__ZNKSt3__18messagesIwE6do_getEiiiRKNS_12basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEEE,0,__ZNKSt3__17codecvtIcc11__mbstate_tE5do_inERS1_PKcS5_RS5_PcS7_RS7_,0,__ZNSt3__19money_putIcNS_19ostreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev,0,__ZNKSt3__110moneypunctIcLb1EE16do_positive_signEv,0,__ZNKSt3__17codecvtIDic11__mbstate_tE13do_max_lengthEv,0,__ZNSt3__19money_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev,0,__ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE6xsputnEPKwi,0,__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED1Ev,0,__ZNSt3__15ctypeIcED2Ev,0,__ZNSt13runtime_errorD0Ev,0,__ZNSt3__113basic_istreamIwNS_11char_traitsIwEEED0Ev,0,___cxx_global_array_dtor120,0];
// EMSCRIPTEN_START_FUNCS
function __Z9RE__matchRN7pcrecpp2REENSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS0_6AnchorE(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35;r4=0;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+624|0;r7=r6;r8=r6+8;r9=r6+24;r10=r9;r11=STACKTOP;STACKTOP=STACKTOP+200|0;r12=STACKTOP;STACKTOP=STACKTOP+8|0;r13=STACKTOP;STACKTOP=STACKTOP+8|0;r14=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;r15=r3;if((HEAP8[r15]&1)==0){r16=r1;HEAP32[r16>>2]=HEAP32[r15>>2];HEAP32[r16+4>>2]=HEAP32[r15+4>>2];HEAP32[r16+8>>2]=HEAP32[r15+8>>2]}else{r16=HEAP32[r3+8>>2];r17=HEAP32[r3+4>>2];if(r17>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r17>>>0<11){HEAP8[r1]=r17<<1;r18=r1+1|0}else{r19=r17+16&-16;r20=(r19|0)==0?1:r19;while(1){r21=_malloc(r20);if((r21|0)!=0){r4=18;break}r22=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r22|0)==0){break}FUNCTION_TABLE[r22]()}if(r4==18){HEAP32[r1+8>>2]=r21;HEAP32[r1>>2]=r19|1;HEAP32[r1+4>>2]=r17;r18=r21;break}r20=___cxa_allocate_exception(4);HEAP32[r20>>2]=9376;___cxa_throw(r20,16152,68)}}while(0);_memcpy(r18,r16,r17)|0;HEAP8[r18+r17|0]=0}r17=r1+12|0;r18=r8;HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r8=r17|0;HEAP32[r8>>2]=0;r16=r1+16|0;HEAP32[r16>>2]=0;r21=r1+20|0;HEAP32[r21>>2]=0;while(1){r23=_malloc(12);if((r23|0)!=0){break}r20=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r20|0)==0){r4=29;break}FUNCTION_TABLE[r20]()}if(r4==29){r20=___cxa_allocate_exception(4);HEAP32[r20>>2]=9376;___cxa_throw(r20,16152,68)}HEAP32[r8>>2]=r23;r8=r23+12|0;HEAP32[r21>>2]=r8;HEAP32[r23>>2]=HEAP32[r18>>2];HEAP32[r23+4>>2]=HEAP32[r18+4>>2];HEAP32[r23+8>>2]=HEAP32[r18+8>>2];HEAP32[r16>>2]=r8;r8=r1+24|0;HEAP8[r8]=0;r1=HEAP32[r2+28>>2];if((r1|0)==0){STACKTOP=r6;return}if((_pcre_fullinfo(r1,0,2,r7)|0)!=0){___assert_fail(6576,5704,656,8896)}r1=HEAP32[r7>>2];if((r1|0)<0){STACKTOP=r6;return}if((r1|0)>50){_fwrite(7472,46,1,HEAP32[_stderr>>2]);STACKTOP=r6;return}r7=r9|0;r18=r9+600|0;_memset(r10,0,600)|0;r10=r12|0;r23=0;while(1){HEAP32[r11+(r23<<2)>>2]=r12;r20=r23+1|0;if((r20|0)<50){r23=r20}else{break}}HEAP32[r10>>2]=r9+588;HEAP32[r12+4>>2]=394;r12=r13|0;r10=HEAP8[r15];if((r10&1)==0){r24=r3+1|0}else{r24=HEAP32[r3+8>>2]}HEAP32[r12>>2]=r24;r24=r13+4|0;r15=r10&255;if((r15&1|0)==0){r25=r15>>>1}else{r25=HEAP32[r3+4>>2]}r3=r11|0;r11=r1+1|0;L53:do{if((r11|0)>0){r15=r25;L54:while(1){HEAP32[r24>>2]=r15;if(!__ZNK7pcrecpp2RE7DoMatchERKNS_11StringPieceENS0_6AnchorEPiPKPKNS_3ArgEi(r2,r13,r14,r3,r1)){r26=r18;break L53}HEAP8[r8]=1;_printf(7456,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=HEAP32[r14>>2],r5));STACKTOP=r5;r10=0;while(1){r23=r9+(r10*12&-1)|0;r20=r23;if((HEAP8[r20]&1)==0){r27=r23+1|0}else{r27=HEAP32[r9+(r10*12&-1)+8>>2]}_puts(r27);r22=HEAP32[r16>>2];if((r22|0)==(HEAP32[r21>>2]|0)){__ZNSt3__16vectorINS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEENS4_IS6_EEE21__push_back_slow_pathIRKS6_EEvOT_(r17,r23)}else{do{if((r22|0)==0){r28=0}else{if((HEAP8[r20]&1)==0){r23=r22;HEAP32[r23>>2]=HEAP32[r20>>2];HEAP32[r23+4>>2]=HEAP32[r20+4>>2];HEAP32[r23+8>>2]=HEAP32[r20+8>>2];r28=r22;break}r23=HEAP32[r9+(r10*12&-1)+8>>2];r29=HEAP32[r9+(r10*12&-1)+4>>2];if(r29>>>0>4294967279){r4=94;break L54}if(r29>>>0<11){HEAP8[r22]=r29<<1;r30=r22+1|0;r31=r22}else{r32=r29+16&-16;r33=(r32|0)==0?1:r32;while(1){r34=_malloc(r33);if((r34|0)!=0){break}r35=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r35|0)==0){r4=79;break L54}FUNCTION_TABLE[r35]()}HEAP32[r22+8>>2]=r34;HEAP32[r22>>2]=r32|1;HEAP32[r22+4>>2]=r29;r30=r34;r31=HEAP32[r16>>2]}_memcpy(r30,r23,r29)|0;HEAP8[r30+r29|0]=0;r28=r31}}while(0);HEAP32[r16>>2]=r28+12}r22=r10+1|0;if((r22|0)<(r11|0)){r10=r22}else{break}}r10=HEAP32[r14>>2];HEAP32[r12>>2]=HEAP32[r12>>2]+r10;r15=HEAP32[r24>>2]-r10|0}if(r4==79){r15=___cxa_allocate_exception(4);HEAP32[r15>>2]=9376;___cxa_throw(r15,16152,68)}else if(r4==94){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}}else{r15=r25;while(1){HEAP32[r24>>2]=r15;if(!__ZNK7pcrecpp2RE7DoMatchERKNS_11StringPieceENS0_6AnchorEPiPKPKNS_3ArgEi(r2,r13,r14,r3,r1)){r26=r18;break L53}HEAP8[r8]=1;r19=HEAP32[r14>>2];_printf(7456,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=r19,r5));STACKTOP=r5;HEAP32[r12>>2]=HEAP32[r12>>2]+r19;r15=HEAP32[r24>>2]-r19|0}}}while(0);while(1){r24=r26-12|0;do{if((HEAP8[r24]&1)!=0){r12=HEAP32[r26-12+8>>2];if((r12|0)==0){break}_free(r12)}}while(0);if((r24|0)==(r7|0)){break}else{r26=r24}}STACKTOP=r6;return}function __ZNSt3__16vectorINS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEENS4_IS6_EEE9push_backERKS6_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=r1+4|0;r5=HEAP32[r4>>2];if((r5|0)==(HEAP32[r1+8>>2]|0)){__ZNSt3__16vectorINS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEENS4_IS6_EEE21__push_back_slow_pathIRKS6_EEvOT_(r1,r2);return}do{if((r5|0)!=0){r1=r2;if((HEAP8[r1]&1)==0){r6=r5;HEAP32[r6>>2]=HEAP32[r1>>2];HEAP32[r6+4>>2]=HEAP32[r1+4>>2];HEAP32[r6+8>>2]=HEAP32[r1+8>>2];break}r1=HEAP32[r2+8>>2];r6=HEAP32[r2+4>>2];if(r6>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r6>>>0<11){HEAP8[r5]=r6<<1;r7=r5+1|0}else{r8=r6+16&-16;r9=(r8|0)==0?1:r8;while(1){r10=_malloc(r9);if((r10|0)!=0){r3=20;break}r11=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r11|0)==0){break}FUNCTION_TABLE[r11]()}if(r3==20){HEAP32[r5+8>>2]=r10;HEAP32[r5>>2]=r8|1;HEAP32[r5+4>>2]=r6;r7=r10;break}r9=___cxa_allocate_exception(4);HEAP32[r9>>2]=9376;___cxa_throw(r9,16152,68)}}while(0);_memcpy(r7,r1,r6)|0;HEAP8[r7+r6|0]=0}}while(0);HEAP32[r4>>2]=HEAP32[r4>>2]+12;return}function __ZNKSt3__16vectorINS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEENS4_IS6_EEE4sizeEv(r1){return(HEAP32[r1+4>>2]-HEAP32[r1>>2]|0)/12&-1}function __ZN10emscripten8internal12VectorAccessINSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEE3getERKSB_j(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=HEAP32[r2>>2];if(((HEAP32[r2+4>>2]-r4|0)/12&-1)>>>0<=r3>>>0){HEAP32[r1>>2]=__emval_undefined();return}r2=r4+(r3*12&-1)|0;r5=HEAP8[r2];r6=r5&255;r7=(r6&1|0)==0;if(r7){r8=r6>>>1;r9=r8;r10=_malloc(r8+4|0)}else{r8=HEAP32[r4+(r3*12&-1)+4>>2];r9=r8;r10=_malloc(r8+4|0)}HEAP32[r10>>2]=r9;if((r5&1)==0){r11=r2+1|0}else{r11=HEAP32[r4+(r3*12&-1)+8>>2]}if(r7){r12=r6>>>1}else{r12=HEAP32[r4+(r3*12&-1)+4>>2]}_memcpy(r10+4|0,r11,r12)|0;HEAP32[r1>>2]=__emval_take_value(17536,r10);return}function __ZN10emscripten8internal12VectorAccessINSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEE3setERSB_jRKS9_(r1,r2,r3){__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEaSERKS5_(HEAP32[r1>>2]+(r2*12&-1)|0,r3);return 1}function ___ZN10emscripten8internal15FunctionInvokerIPFbRNSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEjRKS9_EbSC_JjSE_EE6invokeEPSG_PSB_jPNS0_11BindingTypeIS9_E3$_0E_(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+16|0;r7=r6;r8=HEAP32[r1>>2];r1=r4+4|0;r9=HEAP32[r4>>2];if(r9>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r9>>>0<11){HEAP8[r7]=r9<<1;r10=r7+1|0}else{r4=r9+16&-16;r11=(r4|0)==0?1:r4;while(1){r12=_malloc(r11);if((r12|0)!=0){r5=16;break}r13=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r13|0)==0){break}FUNCTION_TABLE[r13]()}if(r5==16){HEAP32[r7+8>>2]=r12;HEAP32[r7>>2]=r4|1;HEAP32[r7+4>>2]=r9;r10=r12;break}r11=___cxa_allocate_exception(4);HEAP32[r11>>2]=9376;___cxa_throw(r11,16152,68)}}while(0);_memcpy(r10,r1,r9)|0;HEAP8[r10+r9|0]=0;r9=FUNCTION_TABLE[r8](r2,r3,r7);if((HEAP8[r7]&1)==0){STACKTOP=r6;return r9}r3=HEAP32[r7+8>>2];if((r3|0)==0){STACKTOP=r6;return r9}_free(r3);STACKTOP=r6;return r9}function __ZN10emscripten8internal15FunctionInvokerIPFNS_3valERKNSt3__16vectorINS3_12basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEENS8_ISA_EEEEjES2_SE_JjEE6invokeEPSG_PSC_j(r1,r2,r3){var r4,r5;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;FUNCTION_TABLE[HEAP32[r1>>2]](r5,r2,r3);r3=r5|0;__emval_incref(HEAP32[r3>>2]);r5=HEAP32[r3>>2];__emval_decref(r5);STACKTOP=r4;return r5}function __ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEKFjvEjPKSB_JEE6invokeERKSD_SF_(r1,r2){var r3,r4,r5,r6;r3=r2+HEAP32[r1+4>>2]|0;r2=r3;r4=HEAP32[r1>>2];if((r4&1|0)==0){r5=r4;r6=FUNCTION_TABLE[r5](r2);return r6}else{r5=HEAP32[HEAP32[r3>>2]+(r4-1)>>2];r6=FUNCTION_TABLE[r5](r2);return r6}}function ___ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEFvRKS9_EvPSB_JSD_EE6invokeERKSF_SG_PNS0_11BindingTypeIS9_E3$_0E_(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r2+HEAP32[r1+4>>2]|0;r2=r7;r8=HEAP32[r1>>2];if((r8&1|0)==0){r9=r8}else{r9=HEAP32[HEAP32[r7>>2]+(r8-1)>>2]}r8=r3+4|0;r7=HEAP32[r3>>2];if(r7>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r7>>>0<11){HEAP8[r6]=r7<<1;r10=r6+1|0}else{r3=r7+16&-16;r1=(r3|0)==0?1:r3;while(1){r11=_malloc(r1);if((r11|0)!=0){r4=19;break}r12=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r12|0)==0){break}FUNCTION_TABLE[r12]()}if(r4==19){HEAP32[r6+8>>2]=r11;HEAP32[r6>>2]=r3|1;HEAP32[r6+4>>2]=r7;r10=r11;break}r1=___cxa_allocate_exception(4);HEAP32[r1>>2]=9376;___cxa_throw(r1,16152,68)}}while(0);_memcpy(r10,r8,r7)|0;HEAP8[r10+r7|0]=0;FUNCTION_TABLE[r9](r2,r6);if((HEAP8[r6]&1)==0){STACKTOP=r5;return}r2=HEAP32[r6+8>>2];if((r2|0)==0){STACKTOP=r5;return}_free(r2);STACKTOP=r5;return}function __ZN10emscripten8internal12operator_newINSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEJEEEPT_DpT0_(){var r1,r2,r3;r1=0;while(1){r2=_malloc(12);if((r2|0)!=0){r1=12;break}r3=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r3|0)==0){break}FUNCTION_TABLE[r3]()}if(r1==12){HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;return r2}r2=___cxa_allocate_exception(4);HEAP32[r2>>2]=9376;___cxa_throw(r2,16152,68)}function __ZN10emscripten8internal7InvokerIPNSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEJEE6invokeEPFSC_vE(r1){return FUNCTION_TABLE[r1]()}function __ZN10emscripten8internal13getActualTypeINSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEEEPKNS0_7_TYPEIDEPT_(r1){if((r1|0)==0){___assert_fail(6424,6320,797,8936)}else{return 17112}}function __ZN10emscripten8internal14raw_destructorINSt3__16vectorINS2_12basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEENS7_IS9_EEEEEEvPT_(r1){var r2,r3,r4,r5,r6,r7,r8,r9;if((r1|0)==0){return}r2=r1|0;r3=HEAP32[r2>>2];do{if((r3|0)!=0){r4=r1+4|0;r5=HEAP32[r4>>2];if((r3|0)==(r5|0)){r6=r3}else{r7=r5;while(1){r5=r7-12|0;HEAP32[r4>>2]=r5;do{if((HEAP8[r5]&1)==0){r8=r5}else{r9=HEAP32[r7-12+8>>2];if((r9|0)==0){r8=r5;break}_free(r9);r8=HEAP32[r4>>2]}}while(0);if((r3|0)==(r8|0)){break}else{r7=r8}}r7=HEAP32[r2>>2];if((r7|0)==0){break}else{r6=r7}}_free(r6)}}while(0);_free(r1);return}function ___ZN10emscripten8internal15FunctionInvokerIPF5MatchRN7pcrecpp2REENSt3__112basic_stringIcNS6_11char_traitsIcEENS6_9allocatorIcEEEENS4_6AnchorEES2_S5_JSC_SD_EE6invokeEPSF_PS4_PNS0_11BindingTypeISC_E3$_0ESD__(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+48|0;r7=r6;r8=r6+32;r9=HEAP32[r1>>2];r1=r3+4|0;r10=HEAP32[r3>>2];if(r10>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r10>>>0<11){HEAP8[r8]=r10<<1;r11=r8+1|0}else{r3=r10+16&-16;r12=(r3|0)==0?1:r3;while(1){r13=_malloc(r12);if((r13|0)!=0){r5=16;break}r14=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r14|0)==0){break}FUNCTION_TABLE[r14]()}if(r5==16){HEAP32[r8+8>>2]=r13;HEAP32[r8>>2]=r3|1;HEAP32[r8+4>>2]=r10;r11=r13;break}r12=___cxa_allocate_exception(4);HEAP32[r12>>2]=9376;___cxa_throw(r12,16152,68)}}while(0);_memcpy(r11,r1,r10)|0;HEAP8[r11+r10|0]=0;FUNCTION_TABLE[r9](r7,r2,r8,r4);while(1){r15=_malloc(28);if((r15|0)!=0){break}r4=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r4|0)==0){r5=26;break}FUNCTION_TABLE[r4]()}if(r5==26){r5=___cxa_allocate_exception(4);HEAP32[r5>>2]=9376;___cxa_throw(r5,16152,68)}r5=r15;r4=r7;HEAP32[r15>>2]=HEAP32[r4>>2];HEAP32[r15+4>>2]=HEAP32[r4+4>>2];HEAP32[r15+8>>2]=HEAP32[r4+8>>2];HEAP32[r4>>2]=0;HEAP32[r4+4>>2]=0;HEAP32[r4+8>>2]=0;r4=r7+12|0;HEAP32[r15+12>>2]=HEAP32[r4>>2];r2=r7+16|0;HEAP32[r15+16>>2]=HEAP32[r2>>2];r9=r7+20|0;HEAP32[r15+20>>2]=HEAP32[r9>>2];HEAP32[r9>>2]=0;HEAP32[r2>>2]=0;HEAP32[r4>>2]=0;HEAP8[r15+24|0]=HEAP8[r7+24|0]&1;if((HEAP8[r8]&1)==0){STACKTOP=r6;return r5}r7=HEAP32[r8+8>>2];if((r7|0)==0){STACKTOP=r6;return r5}_free(r7);STACKTOP=r6;return r5}function __ZN10emscripten8internal12operator_newIN7pcrecpp2REEJNSt3__112basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEEEEEPT_DpT0_(r1){var r2,r3,r4,r5,r6,r7,r8;r2=0;while(1){r3=_malloc(36);if((r3|0)!=0){break}r4=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r4|0)==0){r2=9;break}FUNCTION_TABLE[r4]()}if(r2==9){r2=___cxa_allocate_exception(4);HEAP32[r2>>2]=9376;___cxa_throw(r2,16152,68)}r2=r3;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;HEAP32[r3+16>>2]=0;HEAP32[r3+20>>2]=0;r4=r3;do{if((r4|0)!=(r1|0)){r5=HEAP8[r1];if((r5&1)==0){r6=r1+1|0}else{r6=HEAP32[r1+8>>2]}r7=r5&255;if((r7&1|0)==0){r8=r7>>>1}else{r8=HEAP32[r1+4>>2]}if(10<r8>>>0){__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE21__grow_by_and_replaceEjjjjjjPKc(r4,10,r8-10|0,0,0,0,r8,r6);break}r7=r3+1|0;_memmove(r7,r6,r8,1,0);HEAP8[r7+r8|0]=0;if((HEAP8[r3]&1)==0){HEAP8[r3]=r8<<1;break}else{HEAP32[r3+4>>2]=r8;break}}}while(0);r8=r3+12|0;HEAP32[r8>>2]=HEAP32[21992>>2];HEAP32[r8+4>>2]=HEAP32[21996>>2];HEAP32[r8+8>>2]=HEAP32[22e3>>2];HEAP32[r3+32>>2]=22008;r8=r3+24|0;HEAP32[r8>>2]=0;r6=r3+28|0;HEAP32[r6>>2]=0;r3=__ZN7pcrecpp2RE7CompileENS0_6AnchorE(r2,0);HEAP32[r6>>2]=r3;if((r3|0)==0){return r2}HEAP32[r8>>2]=__ZN7pcrecpp2RE7CompileENS0_6AnchorE(r2,2);return r2}function ___ZN10emscripten8internal7InvokerIPN7pcrecpp2REEJNSt3__112basic_stringIcNS5_11char_traitsIcEENS5_9allocatorIcEEEEEE6invokeEPFS4_SB_EPNS0_11BindingTypeISB_E3$_0E_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=r2+4|0;r7=HEAP32[r2>>2];if(r7>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r7>>>0<11){HEAP8[r5]=r7<<1;r8=r5+1|0}else{r2=r7+16&-16;r9=(r2|0)==0?1:r2;while(1){r10=_malloc(r9);if((r10|0)!=0){r3=16;break}r11=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r11|0)==0){break}FUNCTION_TABLE[r11]()}if(r3==16){HEAP32[r5+8>>2]=r10;HEAP32[r5>>2]=r2|1;HEAP32[r5+4>>2]=r7;r8=r10;break}r9=___cxa_allocate_exception(4);HEAP32[r9>>2]=9376;___cxa_throw(r9,16152,68)}}while(0);_memcpy(r8,r6,r7)|0;HEAP8[r8+r7|0]=0;r7=FUNCTION_TABLE[r1](r5);if((HEAP8[r5]&1)==0){STACKTOP=r4;return r7}r1=HEAP32[r5+8>>2];if((r1|0)==0){STACKTOP=r4;return r7}_free(r1);STACKTOP=r4;return r7}function __ZN10emscripten8internal13getActualTypeIN7pcrecpp2REEEEPKNS0_7_TYPEIDEPT_(r1){if((r1|0)==0){___assert_fail(6424,6320,797,8936)}else{return 17824}}function __ZN10emscripten8internal14raw_destructorIN7pcrecpp2REEEEvPT_(r1){var r2,r3,r4;if((r1|0)==0){return}r2=HEAP32[r1+24>>2];if((r2|0)!=0){_free(r2)}r2=HEAP32[r1+28>>2];if((r2|0)!=0){_free(r2)}r2=HEAP32[r1+32>>2];if(!((r2|0)==22008|(r2|0)==0)){r3=r2;do{if((HEAP8[r3]&1)!=0){r4=HEAP32[r2+8>>2];if((r4|0)==0){break}_free(r4)}}while(0);_free(r3)}r3=r1;do{if((HEAP8[r3]&1)!=0){r2=HEAP32[r1+8>>2];if((r2|0)==0){break}_free(r2)}}while(0);_free(r3);return}function __ZN10emscripten8internal12MemberAccessI5MatchbE7getWireIS2_EEbRKMS2_bRKT_(r1,r2){return(HEAP8[r2+HEAP32[r1>>2]|0]&1)!=0}function __ZN10emscripten8internal12MemberAccessI5MatchbE7setWireIS2_EEvRKMS2_bRT_b(r1,r2,r3){HEAP8[r2+HEAP32[r1>>2]|0]=r3&1;return}function __ZN10emscripten8internal12MemberAccessI5MatchNSt3__16vectorINS3_12basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEENS8_ISA_EEEEE7getWireIS2_EEPSC_RKMS2_SC_RKT_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=0;r4=HEAP32[r1>>2];r1=r2;r2=r1+r4|0;while(1){r5=_malloc(12);if((r5|0)!=0){break}r6=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r6|0)==0){r3=9;break}FUNCTION_TABLE[r6]()}if(r3==9){r6=___cxa_allocate_exception(4);HEAP32[r6>>2]=9376;___cxa_throw(r6,16152,68)}r6=r5;r7=r5;HEAP32[r7>>2]=0;r8=r5+4|0;HEAP32[r8>>2]=0;r9=r5+8|0;HEAP32[r9>>2]=0;r5=HEAP32[r1+(r4+4)>>2];r4=HEAP32[r2>>2];if((r5|0)==(r4|0)){return r6}r2=r5-r4|0;r1=(r2|0)/12&-1;if(r1>>>0>357913941){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}while(1){r10=_malloc(r2);if((r10|0)!=0){break}r11=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r11|0)==0){r3=24;break}FUNCTION_TABLE[r11]()}if(r3==24){r2=___cxa_allocate_exception(4);HEAP32[r2>>2]=9376;___cxa_throw(r2,16152,68)}r2=r10;HEAP32[r8>>2]=r2;HEAP32[r7>>2]=r2;HEAP32[r9>>2]=r2+(r1*12&-1);r1=r4;r4=r2;L23:while(1){do{if((r4|0)!=0){r2=r1;if((HEAP8[r2]&1)==0){r9=r4;HEAP32[r9>>2]=HEAP32[r2>>2];HEAP32[r9+4>>2]=HEAP32[r2+4>>2];HEAP32[r9+8>>2]=HEAP32[r2+8>>2];break}r2=HEAP32[r1+8>>2];r9=HEAP32[r1+4>>2];if(r9>>>0>4294967279){r3=31;break L23}if(r9>>>0<11){HEAP8[r4]=r9<<1;r12=r4+1|0}else{r7=r9+16&-16;r10=(r7|0)==0?1:r7;while(1){r13=_malloc(r10);if((r13|0)!=0){break}r11=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r11|0)==0){r3=44;break L23}FUNCTION_TABLE[r11]()}HEAP32[r4+8>>2]=r13;HEAP32[r4>>2]=r7|1;HEAP32[r4+4>>2]=r9;r12=r13}_memcpy(r12,r2,r9)|0;HEAP8[r12+r9|0]=0}}while(0);r10=HEAP32[r8>>2]+12|0;HEAP32[r8>>2]=r10;r11=r1+12|0;if((r11|0)==(r5|0)){r3=61;break}else{r1=r11;r4=r10}}if(r3==61){return r6}else if(r3==44){r6=___cxa_allocate_exception(4);HEAP32[r6>>2]=9376;___cxa_throw(r6,16152,68)}else if(r3==31){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}}function __ZN10emscripten8internal12MemberAccessI5MatchNSt3__16vectorINS3_12basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEENS8_ISA_EEEEE7setWireIS2_EEvRKMS2_SC_RT_PSC_(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r4=0;r5=HEAP32[r1>>2];r1=r2;r2=r1+r5|0;if((r2|0)==(r3|0)){return}r6=HEAP32[r3>>2];r7=HEAP32[r3+4>>2];r3=r6;r8=(r7-r3|0)/12&-1;r9=r1+(r5+8)|0;r10=HEAP32[r9>>2];r11=r2;r2=HEAP32[r11>>2];r12=r2;if(r8>>>0<=((r10-r12|0)/12&-1)>>>0){r13=r1+(r5+4)|0;r14=(HEAP32[r13>>2]-r12|0)/12&-1;if(r8>>>0>r14>>>0){r15=1;r16=r6+(r14*12&-1)|0}else{r15=0;r16=r7}if((r16|0)==(r6|0)){r17=r2}else{r14=(((r16-12+ -r3|0)>>>0)/12&-1)+1|0;r3=r2;r12=r6;while(1){__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEaSERKS5_(r3,r12);r18=r12+12|0;if((r18|0)==(r16|0)){break}else{r3=r3+12|0;r12=r18}}r17=r2+(r14*12&-1)|0}if(!r15){r15=HEAP32[r13>>2];if((r17|0)==(r15|0)){return}else{r19=r15}while(1){r15=r19-12|0;HEAP32[r13>>2]=r15;do{if((HEAP8[r15]&1)==0){r20=r15}else{r14=HEAP32[r19-12+8>>2];if((r14|0)==0){r20=r15;break}_free(r14);r20=HEAP32[r13>>2]}}while(0);if((r17|0)==(r20|0)){break}else{r19=r20}}return}if((r16|0)==(r7|0)){return}r20=r16;r16=HEAP32[r13>>2];L30:while(1){do{if((r16|0)!=0){r19=r20;if((HEAP8[r19]&1)==0){r17=r16;HEAP32[r17>>2]=HEAP32[r19>>2];HEAP32[r17+4>>2]=HEAP32[r19+4>>2];HEAP32[r17+8>>2]=HEAP32[r19+8>>2];break}r19=HEAP32[r20+8>>2];r17=HEAP32[r20+4>>2];if(r17>>>0>4294967279){r4=17;break L30}if(r17>>>0<11){HEAP8[r16]=r17<<1;r21=r16+1|0}else{r15=r17+16&-16;r14=(r15|0)==0?1:r15;while(1){r22=_malloc(r14);if((r22|0)!=0){break}r12=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r12|0)==0){r4=28;break L30}FUNCTION_TABLE[r12]()}HEAP32[r16+8>>2]=r22;HEAP32[r16>>2]=r15|1;HEAP32[r16+4>>2]=r17;r21=r22}_memcpy(r21,r19,r17)|0;HEAP8[r21+r17|0]=0}}while(0);r14=HEAP32[r13>>2]+12|0;HEAP32[r13>>2]=r14;r12=r20+12|0;if((r12|0)==(r7|0)){r4=89;break}else{r20=r12;r16=r14}}if(r4==17){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}else if(r4==28){r16=___cxa_allocate_exception(4);HEAP32[r16>>2]=9376;___cxa_throw(r16,16152,68)}else if(r4==89){return}}if((r2|0)==0){r23=r10}else{r10=r1+(r5+4)|0;r16=HEAP32[r10>>2];if((r2|0)==(r16|0)){r24=r2;r4=45}else{r20=r16;while(1){r16=r20-12|0;HEAP32[r10>>2]=r16;do{if((HEAP8[r16]&1)==0){r25=r16}else{r13=HEAP32[r20-12+8>>2];if((r13|0)==0){r25=r16;break}_free(r13);r25=HEAP32[r10>>2]}}while(0);if((r2|0)==(r25|0)){break}else{r20=r25}}r25=HEAP32[r11>>2];if((r25|0)!=0){r24=r25;r4=45}}if(r4==45){_free(r24)}HEAP32[r9>>2]=0;HEAP32[r10>>2]=0;HEAP32[r11>>2]=0;r23=0}if(r8>>>0>357913941){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}r10=(r23|0)/12&-1;do{if(r10>>>0>178956969){r26=357913941}else{r23=r10<<1;r24=r23>>>0<r8>>>0?r8:r23;if(r24>>>0<=357913941){r26=r24;break}__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}}while(0);r8=r26*12&-1;r10=(r8|0)==0?1:r8;while(1){r27=_malloc(r10);if((r27|0)!=0){break}r8=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r8|0)==0){r4=60;break}FUNCTION_TABLE[r8]()}if(r4==60){r10=___cxa_allocate_exception(4);HEAP32[r10>>2]=9376;___cxa_throw(r10,16152,68)}r10=r27;r27=r1+(r5+4)|0;HEAP32[r27>>2]=r10;HEAP32[r11>>2]=r10;HEAP32[r9>>2]=r10+(r26*12&-1);if((r6|0)==(r7|0)){return}else{r28=r6;r29=r10}L85:while(1){do{if((r29|0)!=0){r10=r28;if((HEAP8[r10]&1)==0){r6=r29;HEAP32[r6>>2]=HEAP32[r10>>2];HEAP32[r6+4>>2]=HEAP32[r10+4>>2];HEAP32[r6+8>>2]=HEAP32[r10+8>>2];break}r10=HEAP32[r28+8>>2];r6=HEAP32[r28+4>>2];if(r6>>>0>4294967279){r4=68;break L85}if(r6>>>0<11){HEAP8[r29]=r6<<1;r30=r29+1|0}else{r26=r6+16&-16;r9=(r26|0)==0?1:r26;while(1){r31=_malloc(r9);if((r31|0)!=0){break}r11=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r11|0)==0){r4=79;break L85}FUNCTION_TABLE[r11]()}HEAP32[r29+8>>2]=r31;HEAP32[r29>>2]=r26|1;HEAP32[r29+4>>2]=r6;r30=r31}_memcpy(r30,r10,r6)|0;HEAP8[r30+r6|0]=0}}while(0);r9=HEAP32[r27>>2]+12|0;HEAP32[r27>>2]=r9;r17=r28+12|0;if((r17|0)==(r7|0)){r4=92;break}else{r28=r17;r29=r9}}if(r4==79){r29=___cxa_allocate_exception(4);HEAP32[r29>>2]=9376;___cxa_throw(r29,16152,68)}else if(r4==68){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}else if(r4==92){return}}function ___ZN10emscripten8internal12MemberAccessI5MatchNSt3__112basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEEE7getWireIS2_EEPNS0_11BindingTypeIS9_E3$_0ERKMS2_S9_RKT__(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=HEAP32[r1>>2];r1=r2;r2=HEAP8[r1+r3|0];r4=r2&255;r5=(r4&1|0)==0;if(r5){r6=r4>>>1;r7=r6;r8=_malloc(r6+4|0)}else{r6=HEAP32[r1+(r3+4)>>2];r7=r6;r8=_malloc(r6+4|0)}r6=r8;HEAP32[r8>>2]=r7;r7=r8+4|0;if((r2&1)==0){r9=r1+(r3+1)|0}else{r9=HEAP32[r1+(r3+8)>>2]}if(r5){r10=r4>>>1;_memcpy(r7,r9,r10)|0;return r6}else{r10=HEAP32[r1+(r3+4)>>2];_memcpy(r7,r9,r10)|0;return r6}}function ___ZN10emscripten8internal12MemberAccessI5MatchNSt3__112basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEEE7setWireIS2_EEvRKMS2_S9_RT_PNS0_11BindingTypeIS9_E3$_0E_(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r6;r8=HEAP32[r1>>2];r1=r2;r2=r1+r8|0;r9=r2;r10=r3+4|0;r11=HEAP32[r3>>2];if(r11>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r11>>>0<11){HEAP8[r7]=r11<<1;r12=r6+1|0}else{r3=r11+16&-16;r13=(r3|0)==0?1:r3;while(1){r14=_malloc(r13);if((r14|0)!=0){r4=16;break}r15=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r15|0)==0){break}FUNCTION_TABLE[r15]()}if(r4==16){HEAP32[r6+8>>2]=r14;HEAP32[r6>>2]=r3|1;HEAP32[r6+4>>2]=r11;r12=r14;break}r13=___cxa_allocate_exception(4);HEAP32[r13>>2]=9376;___cxa_throw(r13,16152,68)}}while(0);_memcpy(r12,r10,r11)|0;HEAP8[r12+r11|0]=0;if((HEAP8[r2]&1)==0){HEAP8[r1+(r8+1)|0]=0;HEAP8[r2]=0}else{HEAP8[HEAP32[r1+(r8+8)>>2]]=0;HEAP32[r1+(r8+4)>>2]=0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEj(r9);HEAP32[r2>>2]=HEAP32[r7>>2];HEAP32[r2+4>>2]=HEAP32[r7+4>>2];HEAP32[r2+8>>2]=HEAP32[r7+8>>2];STACKTOP=r5;return}function __ZN10emscripten8internal15raw_constructorI5MatchJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE(){var r1,r2,r3;r1=0;while(1){r2=_malloc(28);if((r2|0)!=0){r1=12;break}r3=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r3|0)==0){break}FUNCTION_TABLE[r3]()}if(r1==12){HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;HEAP32[r2+20>>2]=0;HEAP32[r2+24>>2]=0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;HEAP32[r2+20>>2]=0;return r2}r2=___cxa_allocate_exception(4);HEAP32[r2>>2]=9376;___cxa_throw(r2,16152,68)}function __ZN10emscripten8internal14raw_destructorI5MatchEEvPT_(r1){var r2,r3,r4,r5,r6,r7,r8,r9;if((r1|0)==0){return}r2=r1+12|0;r3=HEAP32[r2>>2];do{if((r3|0)!=0){r4=r1+16|0;r5=HEAP32[r4>>2];if((r3|0)==(r5|0)){r6=r3}else{r7=r5;while(1){r5=r7-12|0;HEAP32[r4>>2]=r5;do{if((HEAP8[r5]&1)==0){r8=r5}else{r9=HEAP32[r7-12+8>>2];if((r9|0)==0){r8=r5;break}_free(r9);r8=HEAP32[r4>>2]}}while(0);if((r3|0)==(r8|0)){break}else{r7=r8}}r7=HEAP32[r2>>2];if((r7|0)==0){break}else{r6=r7}}_free(r6)}}while(0);r6=r1;do{if((HEAP8[r6]&1)!=0){r2=HEAP32[r1+8>>2];if((r2|0)==0){break}_free(r2)}}while(0);_free(r6);return}function __ZNSt3__16vectorINS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEENS4_IS6_EEE21__push_back_slow_pathIRKS6_EEvOT_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r3=0;r4=r1+4|0;r5=HEAP32[r4>>2];r6=r1|0;r7=HEAP32[r6>>2];r8=r7;r9=(r5-r8|0)/12&-1;r10=r9+1|0;if(r10>>>0>357913941){__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv()}r11=r1+8|0;r1=(HEAP32[r11>>2]-r8|0)/12&-1;if(r1>>>0>178956969){r12=357913941;r3=5}else{r13=r1<<1;r1=r13>>>0<r10>>>0?r10:r13;if((r1|0)==0){r14=0;r15=0}else{r12=r1;r3=5}}do{if(r3==5){r1=r12*12&-1;r13=(r1|0)==0?1:r1;while(1){r16=_malloc(r13);if((r16|0)!=0){r3=16;break}r1=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r1|0)==0){break}FUNCTION_TABLE[r1]()}if(r3==16){r14=r16;r15=r12;break}r13=___cxa_allocate_exception(4);HEAP32[r13>>2]=9376;___cxa_throw(r13,16152,68)}}while(0);r12=r14+(r9*12&-1)|0;r16=r14+(r15*12&-1)|0;do{if((r12|0)==0){r17=r5}else{r15=r2;if((HEAP8[r15]&1)==0){r13=r12;HEAP32[r13>>2]=HEAP32[r15>>2];HEAP32[r13+4>>2]=HEAP32[r15+4>>2];HEAP32[r13+8>>2]=HEAP32[r15+8>>2];r17=r5;break}r15=HEAP32[r2+8>>2];r13=HEAP32[r2+4>>2];if(r13>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r13>>>0<11){HEAP8[r12]=r13<<1;r18=r12+1|0}else{r1=r13+16&-16;r19=(r1|0)==0?1:r1;while(1){r20=_malloc(r19);if((r20|0)!=0){r3=36;break}r21=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r21|0)==0){break}FUNCTION_TABLE[r21]()}if(r3==36){HEAP32[r14+(r9*12&-1)+8>>2]=r20;HEAP32[r12>>2]=r1|1;HEAP32[r14+(r9*12&-1)+4>>2]=r13;r18=r20;break}r19=___cxa_allocate_exception(4);HEAP32[r19>>2]=9376;___cxa_throw(r19,16152,68)}}while(0);_memcpy(r18,r15,r13)|0;HEAP8[r18+r13|0]=0;r17=HEAP32[r4>>2]}}while(0);r18=r14+(r10*12&-1)|0;do{if((r17|0)==(r7|0)){HEAP32[r6>>2]=r12;HEAP32[r4>>2]=r18;HEAP32[r11>>2]=r16;r22=r7}else{r10=r9-1-(((r17-12+ -r8|0)>>>0)/12&-1)|0;r20=r17;r3=0;r2=r12;while(1){r5=r2-12|0;r19=r20-12|0;if((r5|0)!=0){r21=r17+(~r3*12&-1)|0;r23=r5;r24=r19;HEAP32[r23>>2]=HEAP32[r24>>2];HEAP32[r23+4>>2]=HEAP32[r24+4>>2];HEAP32[r23+8>>2]=HEAP32[r24+8>>2];HEAP32[r21>>2]=0;HEAP32[r21+4>>2]=0;HEAP32[r21+8>>2]=0}if((r19|0)==(r7|0)){break}else{r20=r19;r3=r3+1|0;r2=r5}}r2=HEAP32[r6>>2];r3=HEAP32[r4>>2];HEAP32[r6>>2]=r14+(r10*12&-1);HEAP32[r4>>2]=r18;HEAP32[r11>>2]=r16;if((r2|0)==(r3|0)){r22=r2;break}else{r25=r3}while(1){r3=r25-12|0;do{if((HEAP8[r3]&1)!=0){r20=HEAP32[r25-12+8>>2];if((r20|0)==0){break}_free(r20)}}while(0);if((r2|0)==(r3|0)){r22=r2;break}else{r25=r3}}}}while(0);if((r22|0)==0){return}_free(r22);return}function __GLOBAL__I_a(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10;r1=STACKTOP;STACKTOP=STACKTOP+120|0;r2=r1;r3=r1+24;r4=r1+40;r5=r1+56;r6=r1+72;r7=r1+80;r8=r1+104;__embind_register_value_object(17992,6184,388,612);r9=_malloc(4);if((r9|0)!=0){HEAP32[r9>>2]=0}r10=_malloc(4);if((r10|0)!=0){HEAP32[r10>>2]=0}__embind_register_value_object_field(17992,5832,17536,140,r9,17536,668,r10);r10=_malloc(4);if((r10|0)!=0){HEAP32[r10>>2]=12}r9=_malloc(4);if((r9|0)!=0){HEAP32[r9>>2]=12}__embind_register_value_object_field(17992,5784,17112,710,r10,17112,436,r9);r9=_malloc(4);if((r9|0)!=0){HEAP32[r9>>2]=24}r10=_malloc(4);if((r10|0)!=0){HEAP32[r10>>2]=24}__embind_register_value_object_field(17992,5592,16128,538,r9,16128,718,r10);__embind_finalize_value_object(17992);__embind_register_enum(17832,5272);__embind_register_enum_value(17832,5072,0);__embind_register_enum_value(17832,4928,1);__embind_register_enum_value(17832,7440,2);__embind_register_class(17824,16248,16280,0,242,0,0,7232,554);HEAP32[r8>>2]=2;r10=r8+4|0;HEAP32[r10>>2]=16248;HEAP32[r8+8>>2]=17536;__embind_register_class_constructor(17824,2,r10,426,224);HEAP32[r7>>2]=4;r10=r7+4|0;HEAP32[r10>>2]=17992;HEAP32[r7+8>>2]=17824;HEAP32[r7+12>>2]=17536;HEAP32[r7+16>>2]=17832;r7=_malloc(4);if((r7|0)!=0){HEAP32[r7>>2]=770}__embind_register_class_function(17824,6928,4,r10,346,r7);__embind_register_class(17112,16232,16264,0,4,0,0,6776,110);HEAP32[r6>>2]=1;r7=r6+4|0;HEAP32[r7>>2]=16232;__embind_register_class_constructor(17112,1,r7,498,632);HEAP32[r5>>2]=3;r7=r5+4|0;HEAP32[r7>>2]=16120;HEAP32[r5+8>>2]=16232;HEAP32[r5+12>>2]=17536;r5=_malloc(8);if((r5|0)!=0){r6=r5;HEAP32[r6>>2]=280;HEAP32[r6+4>>2]=0}__embind_register_class_function(17112,6656,3,r7,236,r5);HEAP32[r4>>2]=2;r5=r4+4|0;HEAP32[r5>>2]=__ZTIj;HEAP32[r4+8>>2]=16264;r4=_malloc(8);if((r4|0)!=0){r7=r4;HEAP32[r7>>2]=276;HEAP32[r7+4>>2]=0}__embind_register_class_function(17112,6552,2,r5,84,r4);HEAP32[r3>>2]=3;r4=r3+4|0;HEAP32[r4>>2]=17840;HEAP32[r3+8>>2]=17112;HEAP32[r3+12>>2]=__ZTIj;r3=_malloc(4);if((r3|0)!=0){HEAP32[r3>>2]=172}__embind_register_class_function(17112,6512,3,r4,484,r3);HEAP32[r2>>2]=4;r3=r2+4|0;HEAP32[r3>>2]=16128;HEAP32[r2+8>>2]=17112;HEAP32[r2+12>>2]=__ZTIj;HEAP32[r2+16>>2]=17536;r2=_malloc(4);if((r2|0)==0){__embind_register_class_function(17112,6464,4,r3,370,r2);STACKTOP=r1;return}HEAP32[r2>>2]=578;__embind_register_class_function(17112,6464,4,r3,370,r2);STACKTOP=r1;return}function __pcre_find_bracket(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54;r4=0;r5=(r3|0)<0;r6=r1;L1:while(1){r7=HEAP8[r6];switch(r7<<24>>24){case-123:case-118:case-122:case-117:{r8=r6+3|0;r9=HEAP8[r8];r10=r9&255;r11=r10<<8;r12=r6+4|0;r13=HEAP8[r12];r14=r13&255;r15=r11|r14;r16=(r15|0)==(r3|0);if(r16){r17=r6;r4=14;break L1}r18=r7&255;r19=r18+8720|0;r20=HEAP8[r19];r21=r20&255;r22=r6+r21|0;r6=r22;continue L1;break};case 124:{if(r5){r17=r6;r4=15;break L1}r23=r6+3|0;r6=r23;continue L1;break};case 112:{r24=r6+1|0;r25=HEAP8[r24];r26=r25&255;r27=r26<<8;r28=r6+2|0;r29=HEAP8[r28];r30=r29&255;r31=r27|r30;r32=r6+r31|0;r6=r32;continue L1;break};case 0:{r17=0;r4=16;break L1;break};default:{r33=r7&255;switch(r33|0){case 85:case 86:case 87:case 88:case 89:case 90:case 94:case 95:case 96:{r34=r6+1|0;r35=HEAP8[r34];r36=r35-15&255;r37=(r36&255)<2;r38=r6+2|0;r39=r37?r38:r6;r40=r39;break};case 91:case 92:case 93:case 97:{r41=r6+3|0;r42=HEAP8[r41];r43=r42-15&255;r44=(r43&255)<2;r45=r6+2|0;r46=r44?r45:r6;r40=r46;break};case 149:case 151:case 153:case 155:{r47=r6+1|0;r48=HEAP8[r47];r49=r48&255;r50=r6+r49|0;r40=r50;break};default:{r40=r6}}r51=r33+8720|0;r52=HEAP8[r51];r53=r52&255;r54=r40+r53|0;r6=r54;continue L1}}}if(r4==14){return r17}else if(r4==15){return r17}else if(r4==16){return r17}}function _pcre_compile(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472,r473,r474,r475,r476,r477,r478,r479,r480,r481,r482,r483,r484,r485,r486,r487,r488,r489,r490,r491,r492,r493,r494,r495,r496,r497,r498,r499,r500,r501,r502,r503,r504,r505,r506,r507,r508,r509,r510,r511,r512,r513,r514,r515,r516,r517,r518,r519,r520,r521,r522,r523,r524,r525,r526,r527,r528,r529,r530,r531,r532,r533,r534,r535,r536,r537,r538,r539,r540,r541,r542,r543,r544,r545,r546,r547,r548,r549,r550,r551,r552,r553,r554,r555,r556,r557,r558,r559,r560,r561,r562,r563,r564,r565,r566,r567,r568,r569,r570,r571,r572,r573,r574,r575,r576,r577,r578,r579,r580,r581,r582,r583,r584,r585,r586,r587,r588,r589,r590,r591,r592,r593,r594,r595,r596,r597,r598,r599,r600,r601,r602,r603,r604,r605,r606,r607,r608,r609,r610,r611,r612,r613,r614,r615,r616,r617,r618,r619,r620,r621,r622,r623,r624,r625,r626,r627,r628,r629,r630,r631,r632,r633,r634,r635,r636,r637,r638,r639,r640,r641,r642,r643,r644,r645,r646,r647,r648,r649,r650,r651,r652,r653,r654,r655,r656,r657,r658,r659,r660,r661,r662,r663,r664,r665,r666,r667,r668,r669,r670,r671,r672,r673,r674,r675,r676,r677,r678,r679;r6=0;r7=STACKTOP;STACKTOP=STACKTOP+4568|0;r8=r7;r9=r7+32;r10=r7+40;r11=r7+48;r12=r7+56;r13=r7+64;r14=r7+72;r15=r7+80;r16=r7+88;r17=r7+96;r18=r7+232;r19=r7+4328;r20=r9;r21=r10;r22=r11;r23=r12;r24=r13;r25=r14;r26=r15;r27=r16;r28=r17;r29=r18|0;r30=r19;HEAP32[r9>>2]=1;HEAP32[r14>>2]=0;HEAP32[r16>>2]=r1;r31=(r3|0)==0;if(r31){r32=0;STACKTOP=r7;return r32}HEAP32[r3>>2]=0;r33=(r4|0)==0;L4:do{if(r33){HEAP32[r14>>2]=16;r34=16;r35=848}else{HEAP32[r4>>2]=0;r36=(r5|0)==0;r37=r36?7632:r5;r38=r17|0;HEAP32[r38>>2]=r37;r39=r37+256|0;r40=r17+4|0;HEAP32[r40>>2]=r39;r41=r37+512|0;r42=r17+8|0;HEAP32[r42>>2]=r41;r43=r37+832|0;r44=r17+12|0;HEAP32[r44>>2]=r43;r45=r2&-671054464;r46=(r45|0)==0;do{if(r46){r47=r2&65536;r48=(r47|0)==0;r49=r48?0:1;r50=r17+100|0;HEAP32[r50>>2]=0;r51=0;r52=-1;r53=-1;r54=r2;r55=r1;L9:while(1){r56=r55+r51|0;r57=HEAP8[r56];r58=r57<<24>>24==40;if(!r58){break}r59=r51+1|0;r60=r55+r59|0;r61=HEAP8[r60];r62=r61<<24>>24==42;if(!r62){break}r63=r51+2|0;r64=r55+r63|0;r65=_strncmp(r64,6416,5);r66=(r65|0)==0;L13:do{if(r66){r67=r51+7|0;r68=r54|2048;r69=r67;r70=r52;r71=r53;r72=r68}else{r73=HEAP32[r16>>2];r74=r73+r63|0;r75=_strncmp(r74,7224,4);r76=(r75|0)==0;if(r76){r77=r51+6|0;r78=r54|2048;r69=r77;r70=r52;r71=r53;r72=r78;break}r79=HEAP32[r16>>2];r80=r79+r63|0;r81=_strncmp(r80,6312,4);r82=(r81|0)==0;if(r82){r83=r51+6|0;r84=r54|536870912;r69=r83;r70=r52;r71=r53;r72=r84;break}r85=HEAP32[r16>>2];r86=r85+r63|0;r87=_strncmp(r86,6120,16);r88=(r87|0)==0;if(r88){r89=r51+18|0;r90=r54|131072;r69=r89;r70=r52;r71=r53;r72=r90;break}r91=HEAP32[r16>>2];r92=r91+r63|0;r93=_strncmp(r92,5816,13);r94=(r93|0)==0;if(r94){r95=r51+15|0;r96=r54|67108864;r69=r95;r70=r52;r71=r53;r72=r96;break}r97=HEAP32[r16>>2];r98=r97+r63|0;r99=_strncmp(r98,5752,12);r100=(r99|0)==0;if(r100){r101=r51+14|0;r102=HEAP32[r16>>2];r103=r101;r104=0;r105=r102;while(1){r106=r105+r103|0;r107=HEAP8[r106];r108=r107&255;r109=_isdigit(r108);r110=(r109|0)==0;r111=r104>>>0>429496728;r112=r110|r111;if(r112){break}r113=r104*10&-1;r114=r103+1|0;r115=HEAP32[r16>>2];r116=r115+r103|0;r117=HEAP8[r116];r118=r117&255;r119=r113+r118|0;r120=r119-48|0;r103=r114;r104=r120;r105=r115}r121=r103+1|0;r122=HEAP32[r16>>2];r123=r122+r103|0;r124=HEAP8[r123];r125=r124<<24>>24==41;if(!r125){break L9}r126=r104>>>0<r53>>>0;if(!r126){r69=r121;r70=r52;r71=r53;r72=r54;break}r127=HEAP32[r50>>2];r128=r127|8192;HEAP32[r50>>2]=r128;r69=r121;r70=r52;r71=r104;r72=r54;break}r129=HEAP32[r16>>2];r130=r129+r63|0;r131=_strncmp(r130,5544,16);r132=(r131|0)==0;if(r132){r133=r51+18|0;r134=HEAP32[r16>>2];r135=r133;r136=0;r137=r134;while(1){r138=r137+r135|0;r139=HEAP8[r138];r140=r139&255;r141=_isdigit(r140);r142=(r141|0)==0;r143=r136>>>0>429496728;r144=r142|r143;if(r144){break}r145=r136*10&-1;r146=r135+1|0;r147=HEAP32[r16>>2];r148=r147+r135|0;r149=HEAP8[r148];r150=r149&255;r151=r145+r150|0;r152=r151-48|0;r135=r146;r136=r152;r137=r147}r153=r135+1|0;r154=HEAP32[r16>>2];r155=r154+r135|0;r156=HEAP8[r155];r157=r156<<24>>24==41;if(!r157){break L9}r158=r136>>>0<r52>>>0;if(!r158){r69=r153;r70=r52;r71=r53;r72=r54;break}r159=HEAP32[r50>>2];r160=r159|16384;HEAP32[r50>>2]=r160;r69=r153;r70=r136;r71=r53;r72=r54;break}r161=HEAP32[r16>>2];r162=r161+r63|0;r163=_strncmp(r162,5232,3);r164=(r163|0)==0;do{if(r164){r165=r51+5|0;r166=1048576;r167=r165}else{r168=HEAP32[r16>>2];r169=r168+r63|0;r170=_strncmp(r169,5032,3);r171=(r170|0)==0;if(r171){r172=r51+5|0;r166=2097152;r167=r172;break}r173=HEAP32[r16>>2];r174=r173+r63|0;r175=_strncmp(r174,4856,5);r176=(r175|0)==0;if(r176){r177=r51+7|0;r166=3145728;r167=r177;break}r178=HEAP32[r16>>2];r179=r178+r63|0;r180=_strncmp(r179,7416,4);r181=(r180|0)==0;if(r181){r182=r51+6|0;r166=4194304;r167=r182;break}r183=HEAP32[r16>>2];r184=r183+r63|0;r185=_strncmp(r184,7096,8);r186=(r185|0)==0;if(r186){r187=r51+10|0;r166=5242880;r167=r187;break}r188=HEAP32[r16>>2];r189=r188+r63|0;r190=_strncmp(r189,6896,12);r191=(r190|0)==0;if(r191){r192=8388608}else{r193=HEAP32[r16>>2];r194=r193+r63|0;r195=_strncmp(r194,6736,12);r196=(r195|0)==0;if(r196){r192=16777216}else{break L9}}r197=r51+14|0;r198=r54&-25165825;r199=r198|r192;r69=r197;r70=r52;r71=r53;r72=r199;break L13}}while(0);r200=r54&-7340033;r201=r200|r166;r69=r167;r70=r52;r71=r53;r72=r201}}while(0);r202=HEAP32[r16>>2];r51=r69;r52=r70;r53=r71;r54=r72;r55=r202}r203=r54>>>11;r204=r203&1;r205=(r204|0)==0;if(!r205){r206=(r49|0)==0;if(r206){HEAP32[r14>>2]=32;r207=32;break}else{HEAP32[r14>>2]=78;r34=78;r35=848;break L4}}r208=r54&536870912;r209=(r208|0)==0;if(!r209){HEAP32[r14>>2]=67;r207=67;break}r210=r54&25165824;r211=(r210|0)==25165824;if(r211){HEAP32[r14>>2]=56;r207=56;break}r212=r54&7340032;if((r212|0)==1048576){r213=13;r6=62}else if((r212|0)==5242880){r214=r17+124|0;HEAP32[r214>>2]=2}else if((r212|0)==4194304){r215=r17+124|0;HEAP32[r215>>2]=1}else if((r212|0)==3145728){r216=r17+124|0;HEAP32[r216>>2]=0;r217=r17+128|0;HEAP32[r217>>2]=2;r218=3338>>>8;r219=r218&255;r220=r17+132|0;HEAP8[r220]=r219;r221=10;r222=r17+133|0;HEAP8[r222]=r221}else if((r212|0)==0|(r212|0)==2097152){r213=10;r6=62}else{HEAP32[r14>>2]=56;r207=56;break}if(r6==62){r223=r17+124|0;HEAP32[r223>>2]=0;r224=r17+128|0;HEAP32[r224>>2]=1;r225=r213&255;r226=r17+132|0;HEAP8[r226]=r225}r227=r17+76|0;HEAP32[r227>>2]=0;r228=r17+80|0;HEAP32[r228>>2]=0;r229=r17+68|0;HEAP32[r229>>2]=0;r230=r17+64|0;HEAP32[r230>>2]=0;r231=r17+48|0;HEAP32[r231>>2]=0;r232=r17+52|0;HEAP32[r232>>2]=0;r233=r17+44|0;HEAP32[r233>>2]=0;r234=r17+120|0;HEAP32[r234>>2]=0;r235=r17+84|0;HEAP32[r235>>2]=0;r236=r17+20|0;HEAP32[r236>>2]=r29;r237=r17+32|0;HEAP32[r237>>2]=r29;r238=r17+16|0;HEAP32[r238>>2]=r29;r239=r17+60|0;HEAP32[r239>>2]=4096;r240=r19|0;r241=r17+40|0;HEAP32[r241>>2]=r240;r242=r17+56|0;HEAP32[r242>>2]=20;r243=r17+24|0;HEAP32[r243>>2]=r1;r244=_strlen(r1);r245=r1+r244|0;r246=r17+28|0;HEAP32[r246>>2]=r245;r247=r17+104|0;HEAP32[r247>>2]=0;r248=r17+88|0;HEAP32[r248>>2]=0;r249=r17+92|0;HEAP32[r249>>2]=0;r250=r17+72|0;HEAP32[r250>>2]=0;r251=r17+96|0;HEAP32[r251>>2]=r54;r252=r17+36|0;HEAP32[r252>>2]=0;r253=HEAP32[r16>>2];r254=r253+r51|0;HEAP32[r16>>2]=r254;HEAP32[r15>>2]=r29;HEAP8[r29]=-125;r255=_compile_regex(r54,r15,r16,r14,0,0,0,0,r12,r10,r13,r11,0,r17,r9);r256=HEAP32[r14>>2];r257=(r256|0)==0;if(!r257){r207=r256;break}r258=HEAP32[r9>>2];r259=(r258|0)>65536;if(r259){HEAP32[r14>>2]=20;r207=20;break}r260=HEAP32[r234>>2];r261=(r260|0)==0;do{if(r261){r262=r258}else{r263=HEAP32[r235>>2];r264=(r263|0)==0;if(r264){r262=r258;break}r265=r263<<1;r266=r258+r265|0;HEAP32[r9>>2]=r266;r262=r266}}while(0);r267=HEAP32[r231>>2];r268=HEAP32[r232>>2];r269=Math_imul(r267,r268)|0;r270=r262+r269|0;r271=r270+56|0;r272=_malloc(r271);r273=(r272|0)==0;if(r273){HEAP32[r14>>2]=21;r207=21;break}r274=r272;HEAP32[r274>>2]=1346589253;r275=r272+4|0;r276=r275;HEAP32[r276>>2]=r271;r277=HEAP32[r251>>2];r278=r272+8|0;r279=r278;HEAP32[r279>>2]=r277;r280=HEAP32[r50>>2];r281=r272+12|0;r282=r281;HEAP32[r282>>2]=r280;r283=r272+16|0;r284=r283;HEAP32[r284>>2]=r53;r285=r272+20|0;r286=r285;HEAP32[r286>>2]=r52;r287=r272+24|0;r288=r287;HEAP16[r288>>1]=0;r289=r272+26|0;r290=r289;HEAP16[r290>>1]=0;r291=r272+34|0;r292=r291;HEAP16[r292>>1]=56;r293=HEAP32[r232>>2];r294=r293&65535;r295=r272+36|0;r296=r295;HEAP16[r296>>1]=r294;r297=HEAP32[r231>>2];r298=r297&65535;r299=r272+38|0;r300=r299;HEAP16[r300>>1]=r298;r301=r272+40|0;r302=r301;HEAP16[r302>>1]=0;r303=(r37|0)==7632;r304=r303?0:r37;r305=r272+48|0;r306=r305;HEAP32[r306>>2]=r304;r307=r272+52|0;r308=r307;HEAP32[r308>>2]=0;r309=r272+46|0;r310=r309;HEAP16[r310>>1]=0;r311=r272+44|0;r312=r311;HEAP16[r312>>1]=0;r313=r272+42|0;r314=r313;HEAP16[r314>>1]=0;r315=HEAP32[r230>>2];HEAP32[r229>>2]=r315;HEAP32[r248>>2]=0;HEAP32[r249>>2]=0;HEAP32[r230>>2]=0;HEAP32[r250>>2]=0;r316=HEAP16[r292>>1];r317=r316&65535;r318=r272+r317|0;HEAP32[r233>>2]=r318;r319=HEAP16[r296>>1];r320=r319&65535;r321=HEAP16[r300>>1];r322=r321&65535;r323=Math_imul(r320,r322)|0;r324=r317+r323|0;r325=r272+r324|0;HEAP32[r236>>2]=r325;r326=HEAP32[r238>>2];HEAP32[r237>>2]=r326;r327=r17+108|0;r328=r17+116|0;HEAP32[r252>>2]=0;r329=r247;HEAP32[r329>>2]=0;HEAP32[r329+4>>2]=0;HEAP32[r329+8>>2]=0;HEAP32[r329+12>>2]=0;r330=HEAP32[r231>>2];r331=(r330|0)>0;do{if(r331){r332=HEAP32[r241>>2];HEAP32[r231>>2]=0;r333=r332;r334=r330;r335=0;while(1){r336=(r334|0)>0;if(!r336){break}r337=r333|0;r338=HEAP32[r337>>2];r339=r333+4|0;r340=HEAP32[r339>>2];r341=r333+8|0;r342=HEAP32[r341>>2];r343=HEAP32[r233>>2];r344=r340+2|0;r345=0;r346=r343;r347=r335;while(1){r348=(r345|0)<(r347|0);r349=r346+2|0;if(!r348){r350=r349;break}r351=_memcmp(r338,r349,r340);r352=(r351|0)==0;if(r352){r353=r346+r344|0;r354=HEAP8[r353];r355=r354<<24>>24==0;if(!r355){r6=79;break}}else{r356=r351;r357=(r356|0)<0;if(r357){r6=79;break}}r358=HEAP32[r232>>2];r359=r346+r358|0;r360=r345+1|0;r361=HEAP32[r231>>2];r345=r360;r346=r359;r347=r361}if(r6==79){r6=0;r362=HEAP32[r232>>2];r363=r346+r362|0;r364=HEAP32[r231>>2];r365=r364-r345|0;r366=Math_imul(r365,r362)|0;_memmove(r363,r346,r366,1,0);r350=r349}r367=r342>>>8;r368=r367&255;HEAP8[r346]=r368;r369=r342&255;r370=r346+1|0;HEAP8[r370]=r369;_memcpy(r350,r338,r340)|0;r371=r346+r344|0;HEAP8[r371]=0;r372=HEAP32[r231>>2];r373=r372+1|0;HEAP32[r231>>2]=r373;r374=r334-1|0;r375=r333+12|0;r333=r375;r334=r374;r335=r373}r376=HEAP32[r242>>2];r377=(r376|0)>20;if(!r377){break}r378=HEAP32[r241>>2];r379=r378;_free(r379)}}while(0);r380=r1+r51|0;HEAP32[r16>>2]=r380;HEAP32[r15>>2]=r325;HEAP8[r325]=-125;r381=HEAP32[r279>>2];r382=_compile_regex(r381,r15,r16,r14,0,0,0,0,r12,r10,r13,r11,0,r17,0);r383=HEAP32[r230>>2];r384=r383&65535;r385=r272+30|0;r386=r385;HEAP16[r386>>1]=r384;r387=HEAP32[r227>>2];r388=r387&65535;r389=r272+32|0;r390=r389;HEAP16[r390>>1]=r388;r391=HEAP32[r250>>2];r392=r391&65535;r393=r272+28|0;r394=r393;HEAP16[r394>>1]=r392;r395=HEAP32[r50>>2];r396=r395|1;HEAP32[r282>>2]=r396;r397=HEAP32[r327>>2];r398=(r397|0)==0;if(!r398){HEAP32[r13>>2]=0;HEAP32[r11>>2]=-1}r399=HEAP32[r14>>2];r400=(r399|0)==0;do{if(r400){r401=HEAP32[r16>>2];r402=HEAP8[r401];r403=r402<<24>>24==0;if(r403){break}HEAP32[r14>>2]=22}}while(0);r404=HEAP32[r15>>2];r405=r404+1|0;HEAP32[r15>>2]=r405;HEAP8[r404]=0;r406=r405;r407=r325;r408=r406-r407|0;r409=HEAP32[r9>>2];r410=(r408|0)>(r409|0);if(r410){HEAP32[r14>>2]=23}r411=HEAP32[r237>>2];r412=HEAP32[r238>>2];r413=r411>>>0>r412>>>0;L127:do{if(r413){r414=0;r415=-1;while(1){r416=HEAP32[r14>>2];r417=(r416|0)==0;r418=r417;r419=r414;r420=r415;while(1){if(!r418){break L127}r421=HEAP32[r237>>2];r422=HEAP32[r238>>2];r423=r421>>>0>r422>>>0;if(!r423){break L127}r424=r421-2|0;HEAP32[r237>>2]=r424;r425=HEAP8[r424];r426=r425&255;r427=r426<<8;r428=r421-1|0;r429=HEAP8[r428];r430=r429&255;r431=r427|r430;r432=r324+r431|0;r433=r272+r432|0;r434=HEAP8[r433];r435=r434&255;r436=r435<<8;r437=r431+1|0;r438=r324+r437|0;r439=r272+r438|0;r440=HEAP8[r439];r441=r440&255;r442=r436|r441;r443=(r442|0)==(r420|0);if(r443){r444=r419;r445=r420}else{r446=__pcre_find_bracket(r325,r204,r442);r444=r446;r445=r442}r447=(r444|0)==0;if(!r447){break}HEAP32[r14>>2]=53;r418=0;r419=r444;r420=r445}r448=r444;r449=r448-r407|0;r450=r449>>>8;r451=r450&255;HEAP8[r433]=r451;r452=r449&255;HEAP8[r439]=r452;r414=r444;r415=r445}}}while(0);r453=HEAP32[r239>>2];r454=(r453|0)>4096;if(r454){r455=HEAP32[r238>>2];_free(r455)}HEAP32[r238>>2]=0;r456=HEAP32[r14>>2];r457=(r456|0)==0;do{if(r457){r458=HEAP16[r390>>1];r459=HEAP16[r386>>1];r460=(r458&65535)>(r459&65535);if(!r460){break}HEAP32[r14>>2]=15}}while(0);r461=r54&131072;r462=(r461|0)==0;L147:do{if(r462){r463=r8;r464=r8|0;r465=r8+4|0;r466=r325;while(1){r467=HEAP8[r466];r468=(r467&255)>32;do{if(r468){r469=(r467&255)<98;if(!r469){r470=r467-110&255;r471=(r470&255)<3;if(!r471){r472=r467;break}r473=r466+33|0;r474=HEAP8[r473];r475=(r474&255)>97;r476=(r474&255)<106;r477=r475&r476;L156:do{if(r477){r478=HEAP32[r40>>2];r479=_get_chr_property_list(r466,r204,r478,r464);r480=r474&1;r481=r480^1;r482=r481&255;HEAP32[r465>>2]=r482;r483=_compare_opcodes(r479,r204,r17,r464,r479);r484=(r483|0)==0;if(r484){break}r485=r474&255;switch(r485|0){case 98:case 99:{HEAP8[r473]=106;break L156;break};case 100:case 101:{HEAP8[r473]=107;break L156;break};case 102:case 103:{HEAP8[r473]=108;break L156;break};case 104:case 105:{HEAP8[r473]=109;break L156;break};default:{break L156}}}}while(0);r486=HEAP8[r466];r472=r486;break}r487=(r467&255)>97;r488=(r467&255)>84;do{if(r488){r489=85}else{r490=(r467&255)>71;if(r490){r489=72;break}r491=(r467&255)>58;if(r491){r489=59;break}r492=(r467&255)>45;r493=r492?46:33;r489=r493}}while(0);r494=r489-33&255;r495=r467-r494&255;r496=(r495&255)<41;do{if(r496){r497=HEAP32[r40>>2];r498=_get_chr_property_list(r466,r204,r497,r464);r499=r495<<24>>24==33;if(r499){r500=1;r501=r498;break}else{r502=r498}r503=r495<<24>>24==35;if(r503){r500=1;r501=r502;break}else{r504=r502}r505=r495<<24>>24==37;if(r505){r500=1;r501=r504}else{r506=r504;r6=117}}else{r506=0;r6=117}}while(0);if(r6==117){r6=0;r507=r495<<24>>24==39;r508=r507&1;r500=r508;r501=r506}HEAP32[r465>>2]=r500;r509=(r501|0)==0;L178:do{if(!r509){r510=_compare_opcodes(r501,r204,r17,r464,r501);r511=(r510|0)==0;if(r511){break}r512=r495&255;switch(r512|0){case 33:{r513=HEAP8[r466];r514=r513+9&255;HEAP8[r466]=r514;break L178;break};case 34:{r515=HEAP8[r466];r516=r515+8&255;HEAP8[r466]=r516;break L178;break};case 35:{r517=HEAP8[r466];r518=r517+8&255;HEAP8[r466]=r518;break L178;break};case 36:{r519=HEAP8[r466];r520=r519+7&255;HEAP8[r466]=r520;break L178;break};case 37:{r521=HEAP8[r466];r522=r521+7&255;HEAP8[r466]=r522;break L178;break};case 38:{r523=HEAP8[r466];r524=r523+6&255;HEAP8[r466]=r524;break L178;break};case 39:{r525=HEAP8[r466];r526=r525+6&255;HEAP8[r466]=r526;break L178;break};case 40:{r527=HEAP8[r466];r528=r527+1&255;HEAP8[r466]=r528;break L178;break};default:{break L178}}}}while(0);r529=HEAP8[r466];r472=r529}else{r472=r467}}while(0);r530=r472&255;switch(r530|0){case 85:case 86:case 87:case 88:case 89:case 90:case 94:case 95:case 96:{r531=r466+1|0;r532=HEAP8[r531];r533=r532-15&255;r534=(r533&255)<2;r535=r466+2|0;r536=r534?r535:r466;r537=r536;break};case 91:case 92:case 93:case 97:{r538=r466+3|0;r539=HEAP8[r538];r540=r539-15&255;r541=(r540&255)<2;r542=r466+2|0;r543=r541?r542:r466;r537=r543;break};case 149:case 151:case 153:case 155:{r544=r466+1|0;r545=HEAP8[r544];r546=r545&255;r547=r466+r546|0;r537=r547;break};case 0:{break L147;break};default:{r537=r466}}r548=r530+8720|0;r549=HEAP8[r548];r550=r549&255;r551=r537+r550|0;r466=r551}}}while(0);r552=HEAP32[r328>>2];r553=(r552|0)==0;L198:do{if(r553){r6=156}else{r554=__pcre_find_bracket(r325,r204,-1);r555=r554;while(1){r556=(r555|0)==0;if(r556){r6=156;break L198}r557=r555+1|0;r558=HEAP8[r557];r559=r558&255;r560=r559<<8;r561=r555+2|0;r562=HEAP8[r561];r563=r562&255;r564=r560|r563;r565=(r564|0)==0;if(r565){r566=r555-2|0;r567=HEAP8[r566];r568=r567&255;r569=r568<<8;r570=r555-1|0;r571=HEAP8[r570];r572=r571&255;r573=r569|r572;r574=r573-3|0;r575=r555+r574|0;r576=HEAP8[r575];HEAP8[r575]=0;r577=HEAP32[r279>>2];r578=r577>>>11;r579=r578&1;r580=_find_fixedlength(r555,r579,1,r17);HEAP8[r575]=r576;r581=(r580|0)<0;if(r581){break}r582=HEAP32[r250>>2];r583=(r580|0)>(r582|0);if(r583){HEAP32[r250>>2]=r580}r584=r580>>>8;r585=r584&255;HEAP8[r557]=r585;r586=r580&255;HEAP8[r561]=r586}r587=r555+3|0;r588=__pcre_find_bracket(r587,r204,-1);r555=r588}r589=(r580|0)==-2;if(r589){r590=36}else{r591=(r580|0)==-4;r592=r591?70:25;r590=r592}HEAP32[r14>>2]=r590}}while(0);do{if(r6==156){r593=HEAP32[r14>>2];r594=(r593|0)==0;if(!r594){break}r595=HEAP32[r279>>2];r596=r595&16;r597=(r596|0)==0;L217:do{if(r597){r598=_is_anchored(r325,0,r17,0);r599=(r598|0)==0;if(!r599){r600=r595|16;HEAP32[r279>>2]=r600;break}r601=HEAP32[r10>>2];r602=(r601|0)<0;do{if(r602){r603=_find_firstassertedchar(r325,r10,0);HEAP32[r12>>2]=r603;r604=HEAP32[r10>>2];r605=(r604|0)>-1;if(r605){r606=r604;break}r607=_is_startline(r325,0,r17,0);r608=(r607|0)==0;if(r608){break L217}r609=HEAP32[r282>>2];r610=r609|256;HEAP32[r282>>2]=r610;break L217}else{r606=r601}}while(0);r611=HEAP32[r12>>2];r612=r611&65535;r613=r612&255;HEAP16[r288>>1]=r613;r614=r606&1;r615=(r614|0)==0;do{if(!r615){r616=r613&65535;r617=HEAP32[r40>>2];r618=r617+r616|0;r619=HEAP8[r618];r620=r619&255;r621=(r620|0)==(r616|0);if(r621){break}r622=HEAP32[r282>>2];r623=r622|32;HEAP32[r282>>2]=r623}}while(0);r624=HEAP32[r282>>2];r625=r624|16;HEAP32[r282>>2]=r625}}while(0);r626=HEAP32[r11>>2];r627=(r626|0)>-1;do{if(r627){r628=HEAP32[r279>>2];r629=r628&16;r630=(r629|0)==0;if(!r630){r631=r626&2;r632=(r631|0)==0;if(r632){break}}r633=HEAP32[r13>>2];r634=r633&65535;r635=r634&255;HEAP16[r290>>1]=r635;r636=r626&1;r637=(r636|0)==0;do{if(!r637){r638=r635&65535;r639=HEAP32[r40>>2];r640=r639+r638|0;r641=HEAP8[r640];r642=r641&255;r643=(r642|0)==(r638|0);if(r643){break}r644=HEAP32[r282>>2];r645=r644|128;HEAP32[r282>>2]=r645}}while(0);r646=HEAP32[r282>>2];r647=r646|64;HEAP32[r282>>2]=r647}}while(0);r648=HEAP32[r15>>2];r649=r325;while(1){r650=_could_be_empty_branch(r649,r648,r204,r17,0);r651=(r650|0)==0;if(!r651){r6=184;break}r652=r649+1|0;r653=HEAP8[r652];r654=r653&255;r655=r654<<8;r656=r649+2|0;r657=HEAP8[r656];r658=r657&255;r659=r655|r658;r660=r649+r659|0;r661=HEAP8[r660];r662=r661<<24>>24==119;if(r662){r649=r660}else{break}}if(r6==184){r663=HEAP32[r282>>2];r664=r663|32768;HEAP32[r282>>2]=r664}r665=r272;r32=r665;STACKTOP=r7;return r32}}while(0);_free(r272);r666=HEAP32[r14>>2];r207=r666}else{HEAP32[r14>>2]=17;r207=17}}while(0);r667=HEAP32[r16>>2];r668=r667;r669=r1;r670=r668-r669|0;HEAP32[r4>>2]=r670;r34=r207;r35=848}}while(0);while(1){r671=(r34|0)>0;if(r671){r672=r35}else{r673=r35;break}while(1){r674=r672+1|0;r675=HEAP8[r672];r676=r675<<24>>24==0;if(r676){break}else{r672=r674}}r677=HEAP8[r674];r678=r677<<24>>24==0;if(r678){r673=6616;break}r679=r34-1|0;r34=r679;r35=r674}HEAP32[r3>>2]=r673;r32=0;STACKTOP=r7;return r32}function _compile_regex(r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15){var r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68;r16=0;r17=STACKTOP;STACKTOP=STACKTOP+80|0;r18=r17;r19=r17+8;r20=r17+16;r21=r17+24;r22=r17+32;r23=r17+40;r24=r17+48;r25=r17+56;r26=r17+64;r27=r17+72;HEAP32[r18>>2]=r1;HEAP32[r19>>2]=HEAP32[r3>>2];r1=HEAP32[r2>>2];HEAP32[r20>>2]=r1;HEAP32[r27>>2]=r13;r13=r27+4|0;HEAP32[r13>>2]=r1;HEAP32[r26>>2]=r7+6;if((HEAP8[r1]|0)==-123){r28=HEAPU8[r1+3|0]<<8|HEAPU8[r1+4|0];HEAP16[r21+4>>1]=r28;r29=r14+36|0;HEAP32[r21>>2]=HEAP32[r29>>2];HEAP16[r21+6>>1]=0;HEAP32[r29>>2]=r21;r30=r28}else{r30=0}r28=r1+1|0;HEAP8[r28]=0;HEAP8[HEAP32[r20>>2]+2|0]=0;r21=r7+3|0;r7=HEAP32[r20>>2]+r21|0;HEAP32[r20>>2]=r7;r29=r14+64|0;r31=HEAP32[r29>>2];r32=(r6|0)==0;r6=(r5|0)==0;r5=(r15|0)==0;r33=r14+116|0;r34=r14+72|0;r35=r1;r36=r31;r37=0;r38=-2;r39=-2;r40=0;r41=0;r42=r7;L4:while(1){if(!r32){HEAP32[r29>>2]=r31}if(r6){r43=r37}else{HEAP32[r20>>2]=r42+1;HEAP8[r42]=124;r7=HEAP32[r20>>2];HEAP8[r7]=0;HEAP8[HEAP32[r20>>2]+1|0]=0;HEAP32[r20>>2]=HEAP32[r20>>2]+2;HEAP32[r26>>2]=HEAP32[r26>>2]+3;r43=r7}if((_compile_branch(r18,r20,r19,r4,r22,r24,r23,r25,r27,r8,r14,r5?0:r26)|0)==0){r16=9;break}r7=HEAP32[r29>>2];r44=r7>>>0>r36>>>0?r7:r36;do{if(r5){do{if((HEAP8[r35]|0)==119){r7=HEAP32[r24>>2];do{if((r39|0)>-1){if((r39|0)==(r7|0)){if((r41|0)==(HEAP32[r22>>2]|0)){r45=r38;r46=r39;r47=r40;break}}r48=(r38|0)<0;r49=r48?r39:r38;r50=-1;r51=r48?r41:r40;r16=17}else{r49=r38;r50=r39;r51=r40;r16=17}}while(0);do{if(r16==17){r16=0;if((r7|0)<=-1){r45=r49;r46=r50;r47=r51;break}if((HEAP32[r25>>2]|0)>=0){r45=r49;r46=r50;r47=r51;break}HEAP32[r23>>2]=HEAP32[r22>>2];HEAP32[r25>>2]=r7;r45=r49;r46=r50;r47=r51}}while(0);r7=HEAP32[r25>>2];if(((r45^r7)&-3|0)!=0){r52=-1;r53=r46;r54=r47;r55=r41;break}r52=(r47|0)==(HEAP32[r23>>2]|0)?r45|r7:-1;r53=r46;r54=r47;r55=r41}else{r52=HEAP32[r25>>2];r53=HEAP32[r24>>2];r54=HEAP32[r23>>2];r55=HEAP32[r22>>2]}}while(0);if(r6){r56=r52;r57=r53;r58=r54;r59=r55;break}HEAP8[HEAP32[r20>>2]]=0;r60=_find_fixedlength(r35,HEAP32[r18>>2]>>>11&1,0,r14);if((r60|0)==-3){HEAP32[r33>>2]=1;r56=r52;r57=r53;r58=r54;r59=r55;break}if((r60|0)<0){r16=26;break L4}if((r60|0)>(HEAP32[r34>>2]|0)){HEAP32[r34>>2]=r60}HEAP8[r43]=r60>>>8;HEAP8[r43+1|0]=r60;r56=r52;r57=r53;r58=r54;r59=r55}else{r56=r38;r57=r39;r58=r40;r59=r41}}while(0);r7=HEAP32[r19>>2];if((HEAP8[r7]|0)!=124){r16=33;break}if(r5){HEAP8[HEAP32[r20>>2]]=119;r48=HEAP32[r20>>2];r61=r35;HEAP8[r48+1|0]=(r48-r61|0)>>>8;r48=HEAP32[r20>>2];HEAP8[r48+2|0]=r48-r61;r61=HEAP32[r20>>2];HEAP32[r13>>2]=r61;r48=r61+3|0;HEAP32[r20>>2]=r48;r62=r61;r63=r48}else{r48=HEAP32[r2>>2]+r21|0;HEAP32[r20>>2]=r48;HEAP32[r26>>2]=HEAP32[r26>>2]+3;r62=r35;r63=r48}HEAP32[r19>>2]=r7+1;r35=r62;r36=r44;r37=r43;r38=r56;r39=r57;r40=r58;r41=r59;r42=r63}if(r16==9){HEAP32[r3>>2]=HEAP32[r19>>2];r64=0;STACKTOP=r17;return r64}else if(r16==33){if(r5){r63=HEAP32[r20>>2]-r35|0;r42=r63>>>8&255;r41=r63&255;r63=r35;while(1){r35=r63+1|0;r40=HEAP8[r35];r39=r63+2|0;r38=HEAP8[r39];r43=(r40&255)<<8|r38&255;HEAP8[r35]=r42;HEAP8[r39]=r41;if((r43|0)==0){break}else{r42=r40;r41=r38;r63=r63+ -r43|0}}}HEAP8[HEAP32[r20>>2]]=120;r63=HEAP32[r20>>2];r41=r1;HEAP8[r63+1|0]=(r63-r41|0)>>>8;r63=HEAP32[r20>>2];HEAP8[r63+2|0]=r63-r41;r63=HEAP32[r20>>2]+3|0;HEAP32[r20>>2]=r63;if((r30|0)>0){r30=r14+36|0;r14=HEAP32[r30>>2];if((HEAP16[r14+6>>1]|0)==0){r65=r14;r66=r63}else{_memmove(r1+3|0,r1,r63-r41|0,1,0);HEAP8[r1]=-127;r14=HEAP32[r20>>2]+3|0;HEAP32[r20>>2]=r14;HEAP8[r28]=(r14-r41|0)>>>8;HEAP8[r1+2|0]=HEAP32[r20>>2]-r41;HEAP8[HEAP32[r20>>2]]=120;r1=HEAP32[r20>>2];HEAP8[r1+1|0]=(r1-r41|0)>>>8;r1=HEAP32[r20>>2];HEAP8[r1+2|0]=r1-r41;r41=HEAP32[r20>>2]+3|0;HEAP32[r20>>2]=r41;HEAP32[r26>>2]=HEAP32[r26>>2]+6;r65=HEAP32[r30>>2];r66=r41}HEAP32[r30>>2]=HEAP32[r65>>2];r67=r66}else{r67=r63}HEAP32[r29>>2]=r44;HEAP32[r2>>2]=r67;HEAP32[r3>>2]=HEAP32[r19>>2];HEAP32[r9>>2]=r59;HEAP32[r10>>2]=r57;HEAP32[r11>>2]=r58;HEAP32[r12>>2]=r56;if(r5){r64=1;STACKTOP=r17;return r64}r5=HEAP32[r15>>2];r56=HEAP32[r26>>2];if((2147483627-r5|0)<(r56|0)){HEAP32[r4>>2]=20;r64=0;STACKTOP=r17;return r64}else{HEAP32[r15>>2]=r5+r56;r64=1;STACKTOP=r17;return r64}}else if(r16==26){if((r60|0)==-2){r68=36}else{r68=(r60|0)==-4?70:25}HEAP32[r4>>2]=r68;HEAP32[r3>>2]=HEAP32[r19>>2];r64=0;STACKTOP=r17;return r64}}function _find_fixedlength(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154;r5=0;r6=r1+3|0;r7=(r3|0)==0;r8=r4+20|0;r9=-1;r10=r6;r11=0;L1:while(1){r12=HEAP8[r10];r13=r12&255;switch(r13|0){case 133:case 131:case 129:case 130:case 135:{r14=r12<<24>>24==-123;r15=r14?2:0;r16=r10+r15|0;r17=_find_fixedlength(r16,r2,r3,r4);r18=(r17|0)<0;if(r18){r19=r17;r5=33;break L1}r20=r11+r17|0;r21=r10;while(1){r22=r21+1|0;r23=HEAP8[r22];r24=r23&255;r25=r24<<8;r26=r21+2|0;r27=HEAP8[r26];r28=r27&255;r29=r25|r28;r30=r21+r29|0;r31=HEAP8[r30];r32=r31<<24>>24==119;if(r32){r21=r30}else{break}}r33=r29+3|0;r34=r21+r33|0;r9=r9;r10=r34;r11=r20;continue L1;break};case 119:case 120:case 0:case 158:case 159:{r35=(r9|0)<0;r36=(r9|0)==(r11|0);r37=r35|r36;if(!r37){r19=-1;r5=34;break L1}r38=r12<<24>>24==119;if(!r38){r19=r11;r5=35;break L1}r39=r10+3|0;r9=r11;r10=r39;r11=0;continue L1;break};case 117:{if(r7){r19=-3;r5=36;break L1}r40=HEAP32[r8>>2];r41=r10+1|0;r42=HEAP8[r41];r43=r42&255;r44=r43<<8;r45=r10+2|0;r46=HEAP8[r45];r47=r46&255;r48=r44|r47;r49=r40+r48|0;r50=r49;while(1){r51=r50+1|0;r52=HEAP8[r51];r53=r52&255;r54=r53<<8;r55=r50+2|0;r56=HEAP8[r55];r57=r56&255;r58=r54|r57;r59=r50+r58|0;r60=HEAP8[r59];r61=r60<<24>>24==119;if(r61){r50=r59}else{break}}r62=r10>>>0>r49>>>0;r63=r10>>>0<r59>>>0;r64=r62&r63;if(r64){r19=-1;r5=37;break L1}r65=r48+2|0;r66=r40+r65|0;r67=_find_fixedlength(r66,r2,r3,r4);r68=(r67|0)<0;if(r68){r19=r67;r5=38;break L1}r69=r11+r67|0;r70=r10+3|0;r9=r9;r10=r70;r11=r69;continue L1;break};case 125:case 126:case 127:case 128:{r71=r10;while(1){r72=r71+1|0;r73=HEAP8[r72];r74=r73&255;r75=r74<<8;r76=r71+2|0;r77=HEAP8[r76];r78=r77&255;r79=r75|r78;r80=r71+r79|0;r81=HEAP8[r80];r82=r81<<24>>24==119;if(r82){r71=r80}else{break}}r83=r81&255;r84=r83+8720|0;r85=HEAP8[r84];r86=r85&255;r87=r79+r86|0;r88=r71+r87|0;r9=r9;r10=r88;r11=r11;continue L1;break};case 149:case 151:case 153:case 155:{r89=r10+1|0;r90=HEAP8[r89];r91=r90&255;r92=r13+8720|0;r93=HEAP8[r92];r94=r93&255;r95=r91+r94|0;r96=r10+r95|0;r9=r9;r10=r96;r11=r11;continue L1;break};case 118:case 27:case 28:case 160:case 156:case 141:case 145:case 142:case 144:case 25:case 26:case 24:case 23:case 157:case 4:case 150:case 124:case 143:case 3:case 152:case 1:case 2:case 154:case 5:{r97=r13+8720|0;r98=HEAP8[r97];r99=r98&255;r100=r10+r99|0;r9=r9;r10=r100;r11=r11;continue L1;break};case 29:case 30:case 31:case 32:{r101=r11+1|0;r102=r10+2|0;r9=r9;r10=r102;r11=r101;continue L1;break};case 41:case 54:case 67:case 80:{r103=r10+1|0;r104=HEAP8[r103];r105=r104&255;r106=r105<<8;r107=r10+2|0;r108=HEAP8[r107];r109=r108&255;r110=r106|r109;r111=r11+r110|0;r112=r10+4|0;r9=r9;r10=r112;r11=r111;continue L1;break};case 93:{r113=r10+1|0;r114=HEAP8[r113];r115=r114&255;r116=r115<<8;r117=r10+2|0;r118=HEAP8[r117];r119=r118&255;r120=r116|r119;r121=r11+r120|0;r122=r10+3|0;r123=HEAP8[r122];r124=r123-15&255;r125=(r124&255)<2;r126=r125?r117:r10;r127=r126+4|0;r9=r9;r10=r127;r11=r121;continue L1;break};case 16:case 15:{r128=r10+2|0;r129=r128;break};case 19:case 21:case 18:case 20:case 6:case 7:case 8:case 9:case 10:case 11:case 12:case 13:{r129=r10;break};case 110:case 111:{r130=r10+33|0;r131=HEAP8[r130];r132=r131&255;switch(r132|0){case 104:case 105:case 109:{break};case 98:case 99:case 100:case 101:case 102:case 103:case 106:case 107:case 108:{r19=-1;r5=39;break L1;break};default:{r133=r11+1|0;r9=r9;r10=r130;r11=r133;continue L1}}r134=r10+34|0;r135=HEAP8[r134];r136=r135&255;r137=r136<<8;r138=r10+35|0;r139=HEAP8[r138];r140=r139&255;r141=r137|r140;r142=r10+36|0;r143=HEAP8[r142];r144=r143&255;r145=r144<<8;r146=r10+37|0;r147=HEAP8[r146];r148=r147&255;r149=r145|r148;r150=(r141|0)==(r149|0);if(!r150){r19=-1;r5=40;break L1}r151=r11+r141|0;r152=r10+38|0;r9=r9;r10=r152;r11=r151;continue L1;break};case 17:case 147:case 132:case 148:case 146:case 134:case 22:case 121:case 122:case 123:case 36:case 49:case 38:case 51:case 34:case 47:case 40:case 53:case 62:case 75:case 64:case 77:case 60:case 73:case 66:case 79:case 61:case 74:case 69:case 82:case 70:case 83:case 68:case 81:case 71:case 84:case 63:case 76:case 59:case 72:case 65:case 78:case 35:case 48:case 43:case 56:case 44:case 57:case 42:case 55:case 45:case 58:case 37:case 50:case 113:case 114:case 115:case 116:case 136:case 137:case 138:case 139:case 140:case 161:case 33:case 46:case 88:case 90:case 86:case 92:case 87:case 95:case 96:case 94:case 97:case 89:case 85:case 91:case 39:case 52:{r5=29;break L1;break};case 14:{r19=-2;r5=32;break L1;break};default:{r5=30;break L1}}r153=r11+1|0;r154=r129+1|0;r9=r9;r10=r154;r11=r153}if(r5==29){r19=-1;return r19}else if(r5==30){r19=-4;return r19}else if(r5==32){return r19}else if(r5==33){return r19}else if(r5==34){return r19}else if(r5==35){return r19}else if(r5==36){return r19}else if(r5==37){return r19}else if(r5==38){return r19}else if(r5==39){return r19}else if(r5==40){return r19}}function _is_anchored(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61;r5=0;r6=r4+1|0;r7=r3+80|0;r8=(r4|0)>0;r9=r3+112|0;r10=HEAP8[r1];r11=r10&255;r12=r1;r13=r11;L1:while(1){r14=r13+8720|0;r15=HEAP8[r14];r16=r15&255;r17=r12+r16|0;r18=_first_significant_code(r17,0);r19=HEAP8[r18];switch(r19<<24>>24){case 125:case-121:{r20=_is_anchored(r18,r2,r3,r4);r21=(r20|0)==0;if(r21){r22=0;r5=12;break L1}break};case-127:case-126:{r23=_is_anchored(r18,r2,r3,r6);r24=(r23|0)==0;if(r24){r22=0;r5=14;break L1}break};case-125:case-124:case-120:case-119:{r25=_is_anchored(r18,r2,r3,r4);r26=(r25|0)==0;if(r26){r22=0;r5=15;break L1}break};case-123:case-122:case-118:case-117:{r27=r18+3|0;r28=HEAP8[r27];r29=r28&255;r30=r29<<8;r31=r18+4|0;r32=HEAP8[r31];r33=r32&255;r34=r30|r33;r35=r34>>>0<32;r36=1<<r34;r37=r35?r36:1;r38=r37|r2;r39=_is_anchored(r18,r38,r3,r4);r40=(r39|0)==0;if(r40){r22=0;r5=16;break L1}break};case 85:case 86:case 94:{r41=r18+1|0;r42=HEAP8[r41];r43=r42<<24>>24==13;if(!r43){r22=0;r5=17;break L1}r44=HEAP32[r7>>2];r45=r44&r2;r46=(r45|0)==0;r47=r46^1;r48=r47|r8;if(r48){r22=0;r5=18;break L1}r49=HEAP32[r9>>2];r50=(r49|0)==0;if(!r50){r22=0;r5=19;break L1}break};case 1:case 2:case 27:{break};default:{r22=0;r5=13;break L1}}r51=r12+1|0;r52=HEAP8[r51];r53=r52&255;r54=r53<<8;r55=r12+2|0;r56=HEAP8[r55];r57=r56&255;r58=r54|r57;r59=r12+r58|0;r60=HEAP8[r59];r61=r60<<24>>24==119;if(r61){r12=r59;r13=119}else{r22=1;r5=20;break}}if(r5==12){return r22}else if(r5==13){return r22}else if(r5==14){return r22}else if(r5==15){return r22}else if(r5==16){return r22}else if(r5==17){return r22}else if(r5==18){return r22}else if(r5==19){return r22}else if(r5==20){return r22}}function _find_firstassertedchar(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5;HEAP32[r2>>2]=-1;r7=(r3|0)==0;r8=HEAP8[r1];r9=r8<<24>>24==-123;r10=r1;r11=-1;r12=0;r13=r9;r14=r8;L1:while(1){do{if(r13){r15=5}else{if(r14<<24>>24==-118|r14<<24>>24==-122){r15=5;break}r16=r14<<24>>24==-117;r17=r16?5:3;r15=r17}}while(0);r18=r10+r15|0;r19=_first_significant_code(r18,1);r20=HEAP8[r19];r21=r20&255;L7:do{switch(r21|0){case 131:case 132:case 133:case 138:case 134:case 139:case 125:case 129:case 130:{r22=r20<<24>>24==125;r23=r22&1;r24=_find_firstassertedchar(r19,r6,r23);r25=HEAP32[r6>>2];r26=(r25|0)<0;if(r26){r27=0;r4=21;break L1}r28=(r11|0)<0;if(r28){r29=r25;r30=r24;break L7}r31=(r12|0)==(r24|0);r32=(r11|0)==(r25|0);r33=r31&r32;if(r33){r29=r11;r30=r12}else{r27=0;r4=20;break L1}break};case 41:{r34=r19+2|0;r35=r34;r4=10;break};case 29:case 35:case 36:case 43:{r35=r19;r4=10;break};case 54:{r36=r19+2|0;r37=r36;r4=14;break};case 30:case 48:case 49:case 56:{r37=r19;r4=14;break};default:{r27=0;r4=22;break L1}}}while(0);do{if(r4==10){r4=0;if(r7){r27=0;r4=23;break L1}r38=(r11|0)<0;r39=r35+1|0;r40=HEAP8[r39];r41=r40&255;if(r38){r29=0;r30=r41;break}r42=(r12|0)==(r41|0);if(r42){r29=r11;r30=r12}else{r27=0;r4=24;break L1}}else if(r4==14){r4=0;if(r7){r27=0;r4=25;break L1}r43=(r11|0)<0;r44=r37+1|0;r45=HEAP8[r44];r46=r45&255;if(r43){r29=1;r30=r46;break}r47=(r12|0)==(r46|0);if(r47){r29=r11;r30=r12}else{r27=0;r4=26;break L1}}}while(0);r48=r10+1|0;r49=HEAP8[r48];r50=r49&255;r51=r50<<8;r52=r10+2|0;r53=HEAP8[r52];r54=r53&255;r55=r51|r54;r56=r10+r55|0;r57=HEAP8[r56];r58=r57<<24>>24==119;if(r58){r10=r56;r11=r29;r12=r30;r13=0;r14=119}else{r4=18;break}}if(r4==18){HEAP32[r2>>2]=r29;r27=r30;STACKTOP=r5;return r27}else if(r4==20){STACKTOP=r5;return r27}else if(r4==21){STACKTOP=r5;return r27}else if(r4==22){STACKTOP=r5;return r27}else if(r4==23){STACKTOP=r5;return r27}else if(r4==24){STACKTOP=r5;return r27}else if(r4==25){STACKTOP=r5;return r27}else if(r4==26){STACKTOP=r5;return r27}}function _is_startline(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94;r5=0;r6=r4+1|0;r7=r3+80|0;r8=(r4|0)>0;r9=r3+112|0;r10=HEAP8[r1];r11=r10&255;r12=r1;r13=r11;L1:while(1){r14=r13+8720|0;r15=HEAP8[r14];r16=r15&255;r17=r12+r16|0;r18=_first_significant_code(r17,0);r19=HEAP8[r18];r20=r19&255;r21=r19<<24>>24==-121;if(r21){r22=r18+3|0;r23=HEAP8[r22];r24=r23<<24>>24==118;if(r24){r25=r18+9|0;r26=HEAP8[r25];r27=r25;r28=r26}else{r27=r22;r28=r23}r29=r28&255;r30=r29-141|0;r31=r30>>>0<5;if(r31){r32=0;r5=19;break}r33=_is_startline(r27,r2,r3,r4);r34=(r33|0)==0;if(r34){r32=0;r5=20;break}else{r35=r27}while(1){r36=r35+1|0;r37=HEAP8[r36];r38=r37&255;r39=r38<<8;r40=r35+2|0;r41=HEAP8[r40];r42=r41&255;r43=r39|r42;r44=r35+r43|0;r45=HEAP8[r44];r46=r45<<24>>24==119;if(r46){r35=r44}else{break}}r47=r43+3|0;r48=r35+r47|0;r49=_first_significant_code(r48,0);r50=HEAP8[r49];r51=r50&255;r52=r51;r53=r49}else{r52=r20;r53=r18}switch(r52|0){case 131:case 132:case 136:case 137:{r54=_is_startline(r53,r2,r3,r4);r55=(r54|0)==0;if(r55){r32=0;r5=22;break L1}break};case 133:case 134:case 138:case 139:{r56=r53+3|0;r57=HEAP8[r56];r58=r57&255;r59=r58<<8;r60=r53+4|0;r61=HEAP8[r60];r62=r61&255;r63=r59|r62;r64=r63>>>0<32;r65=1<<r63;r66=r64?r65:1;r67=r66|r2;r68=_is_startline(r53,r67,r3,r4);r69=(r68|0)==0;if(r69){r32=0;r5=23;break L1}break};case 125:{r70=_is_startline(r53,r2,r3,r4);r71=(r70|0)==0;if(r71){r32=0;r5=24;break L1}break};case 129:case 130:{r72=_is_startline(r53,r2,r3,r6);r73=(r72|0)==0;if(r73){r32=0;r5=25;break L1}break};case 85:case 86:case 94:{r74=r53+1|0;r75=HEAP8[r74];r76=r75<<24>>24==12;if(!r76){r32=0;r5=26;break L1}r77=HEAP32[r7>>2];r78=r77&r2;r79=(r78|0)==0;r80=r79^1;r81=r80|r8;if(r81){r32=0;r5=27;break L1}r82=HEAP32[r9>>2];r83=(r82|0)==0;if(!r83){r32=0;r5=28;break L1}break};case 27:case 28:{break};default:{r32=0;r5=21;break L1}}r84=r12+1|0;r85=HEAP8[r84];r86=r85&255;r87=r86<<8;r88=r12+2|0;r89=HEAP8[r88];r90=r89&255;r91=r87|r90;r92=r12+r91|0;r93=HEAP8[r92];r94=r93<<24>>24==119;if(r94){r12=r92;r13=119}else{r32=1;r5=29;break}}if(r5==19){return r32}else if(r5==20){return r32}else if(r5==21){return r32}else if(r5==22){return r32}else if(r5==23){return r32}else if(r5==24){return r32}else if(r5==25){return r32}else if(r5==26){return r32}else if(r5==27){return r32}else if(r5==28){return r32}else if(r5==29){return r32}}function _could_be_empty_branch(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208;r6=0;r7=STACKTOP;STACKTOP=STACKTOP+8|0;r8=r7;r9=HEAP8[r1];r10=r9&255;r11=r10+8720|0;r12=HEAP8[r11];r13=r12&255;r14=r1+r13|0;r15=_first_significant_code(r14,1);r16=r4+20|0;r17=r4+16|0;r18=r8|0;r19=r8+4|0;r20=r4+32|0;r21=r15;L1:while(1){r22=r21>>>0<r2>>>0;if(!r22){r23=1;r6=39;break}r24=HEAP8[r21];L4:do{switch(r24<<24>>24){case 125:{r25=r21;while(1){r26=r25+1|0;r27=HEAP8[r26];r28=r27&255;r29=r28<<8;r30=r25+2|0;r31=HEAP8[r30];r32=r31&255;r33=r29|r32;r34=r25+r33|0;r35=HEAP8[r34];r36=r35<<24>>24==119;if(r36){r25=r34}else{r37=r34;r38=r35;break}}break};case 117:{r39=HEAP32[r16>>2];r40=r21+1|0;r41=HEAP8[r40];r42=r41&255;r43=r42<<8;r44=r21+2|0;r45=HEAP8[r44];r46=r45&255;r47=r43|r46;r48=r39+r47|0;r49=HEAP32[r17>>2];r50=(r49|0)==0;L8:do{if(r50){r51=r48;while(1){r52=r51+1|0;r53=HEAP8[r52];r54=r53&255;r55=r54<<8;r56=r51+2|0;r57=HEAP8[r56];r58=r57&255;r59=r55|r58;r60=r51+r59|0;r61=HEAP8[r60];r62=r61<<24>>24==119;if(r62){r51=r60}else{break}}r63=r21>>>0<r48>>>0;r64=r21>>>0>r60>>>0;r65=r63|r64;if(r65){r66=r5}else{r37=r21;r38=117;break L4}while(1){r67=(r66|0)==0;if(r67){break L8}r68=r66+4|0;r69=HEAP32[r68>>2];r70=(r69|0)==(r48|0);if(r70){r37=r21;r38=117;break L4}r71=r66|0;r72=HEAP32[r71>>2];r66=r72}}else{r73=HEAP32[r20>>2];r74=r40;r75=r49;while(1){r76=r75>>>0<r73>>>0;if(!r76){break}r77=HEAP8[r75];r78=r77&255;r79=r78<<8;r80=r75+1|0;r81=HEAP8[r80];r82=r81&255;r83=r79|r82;r84=r39;r85=r74-r84|0;r86=(r83|0)==(r85|0);if(r86){r23=1;r6=38;break L1}r87=r75+2|0;r75=r87}r88=r47+1|0;r89=r39+r88|0;r90=HEAP8[r89];r91=r90&255;r92=r91<<8;r93=r47+2|0;r94=r39+r93|0;r95=HEAP8[r94];r96=r95&255;r97=r92|r96;r98=(r97|0)==0;if(r98){r23=1;r6=40;break L1}}}while(0);HEAP32[r18>>2]=r5;HEAP32[r19>>2]=r48;r99=r48;while(1){r100=_could_be_empty_branch(r99,r2,r3,r4,r8);r101=(r100|0)==0;if(!r101){r37=r21;r38=117;break L4}r102=r99+1|0;r103=HEAP8[r102];r104=r103&255;r105=r104<<8;r106=r99+2|0;r107=HEAP8[r106];r108=r107&255;r109=r105|r108;r110=r99+r109|0;r111=HEAP8[r110];r112=r111<<24>>24==119;if(r112){r99=r110}else{r23=0;r6=41;break L1}}break};case-110:case-109:case-95:case-108:{r113=r24&255;r114=r113+8720|0;r115=HEAP8[r114];r116=r115&255;r117=r21+r116|0;r118=r117;while(1){r119=r118+1|0;r120=HEAP8[r119];r121=r120&255;r122=r121<<8;r123=r118+2|0;r124=HEAP8[r123];r125=r124&255;r126=r122|r125;r127=r118+r126|0;r128=HEAP8[r127];r129=r128<<24>>24==119;if(r129){r118=r127}else{r37=r127;r38=r128;break}}break};case-120:case-119:case-118:case-117:{r130=r21;while(1){r131=r130+1|0;r132=HEAP8[r131];r133=r132&255;r134=r133<<8;r135=r130+2|0;r136=HEAP8[r135];r137=r136&255;r138=r134|r137;r139=r130+r138|0;r140=HEAP8[r139];r141=r140<<24>>24==119;if(r141){r130=r139}else{r37=r139;r38=r140;break}}break};case-125:case-124:case-123:case-122:case-127:case-126:case-121:{r142=r21+1|0;r143=HEAP8[r142];r144=r143&255;r145=r144<<8;r146=r21+2|0;r147=HEAP8[r146];r148=r147&255;r149=r145|r148;r150=(r149|0)==0;if(r150){r23=1;r6=42;break L1}r151=r24<<24>>24==-121;if(r151){r152=r21+r149|0;r153=HEAP8[r152];r154=r153<<24>>24==119;if(r154){r155=0;r156=r21}else{r37=r152;r38=r153;break L4}}else{r155=0;r156=r21}while(1){r157=(r155|0)==0;if(r157){r158=_could_be_empty_branch(r156,r2,r3,r4,0);r159=(r158|0)==0;r160=r159?r155:1;r161=r160}else{r161=r155}r162=r156+1|0;r163=HEAP8[r162];r164=r163&255;r165=r164<<8;r166=r156+2|0;r167=HEAP8[r166];r168=r167&255;r169=r165|r168;r170=r156+r169|0;r171=HEAP8[r170];r172=r171<<24>>24==119;if(r172){r155=r161;r156=r170}else{break}}r173=(r161|0)==0;if(r173){r23=0;r6=43;break L1}else{r37=r170;r38=r171}break};default:{r174=r24&255;switch(r174|0){case 110:case 111:{r175=r21+33|0;r176=HEAP8[r175];r177=r176&255;switch(r177|0){case 109:case 105:case 104:{break};case 98:case 99:case 102:case 103:case 106:case 108:{r37=r21;r38=r24;break L4;break};default:{r23=0;r6=45;break L1}}r178=r21+34|0;r179=HEAP8[r178];r180=r179&255;r181=r180<<8;r182=r21+35|0;r183=HEAP8[r182];r184=r183&255;r185=r181|r184;r186=(r185|0)==0;if(r186){r37=r21;r38=r24;break L4}else{r23=0;r6=46;break L1}break};case 85:case 86:case 94:case 89:case 90:case 96:{r187=r21+1|0;r188=HEAP8[r187];r189=r188-15&255;r190=(r189&255)<2;r191=r21+2|0;r192=r190?r191:r21;r37=r192;r38=r24;break L4;break};case 91:case 92:case 97:{r193=r21+3|0;r194=HEAP8[r193];r195=r194-15&255;r196=(r195&255)<2;r197=r21+2|0;r198=r196?r197:r21;r37=r198;r38=r24;break L4;break};case 120:case 121:case 122:case 123:case 119:{r6=34;break L1;break};case 149:case 151:case 153:case 155:{r199=r21+1|0;r200=HEAP8[r199];r201=r200&255;r202=r21+r201|0;r37=r202;r38=r24;break L4;break};case 12:case 13:case 14:case 16:case 15:case 17:case 18:case 19:case 20:case 21:case 22:case 6:case 7:case 8:case 9:case 10:case 11:case 29:case 30:case 31:case 32:case 35:case 48:case 36:case 49:case 61:case 74:case 62:case 75:case 43:case 56:case 69:case 82:case 41:case 54:case 67:case 80:case 87:case 88:case 95:case 93:{r23=0;r6=44;break L1;break};default:{r37=r21;r38=r24;break L4}}}}}while(0);r203=r38&255;r204=r203+8720|0;r205=HEAP8[r204];r206=r205&255;r207=r37+r206|0;r208=_first_significant_code(r207,1);r21=r208}if(r6==34){r23=1;STACKTOP=r7;return r23}else if(r6==38){STACKTOP=r7;return r23}else if(r6==39){STACKTOP=r7;return r23}else if(r6==40){STACKTOP=r7;return r23}else if(r6==41){STACKTOP=r7;return r23}else if(r6==42){STACKTOP=r7;return r23}else if(r6==43){STACKTOP=r7;return r23}else if(r6==44){STACKTOP=r7;return r23}else if(r6==45){STACKTOP=r7;return r23}else if(r6==46){STACKTOP=r7;return r23}}function _first_significant_code(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r3=0;r4=(r2|0)==0;r5=r1;L1:while(1){r6=HEAP8[r5];r7=r6&255;switch(r7|0){case 5:case 4:{if(r4){r3=10;break L1}break};case 118:case 141:case 142:case 143:case 144:case 145:{break};case 126:case 127:case 128:{if(r4){r3=11;break L1}else{r8=r5}while(1){r9=r8+1|0;r10=HEAP8[r9];r11=r10&255;r12=r11<<8;r13=r8+2|0;r14=HEAP8[r13];r15=r14&255;r16=r12|r15;r17=r8+r16|0;r18=HEAP8[r17];r19=r18<<24>>24==119;if(r19){r8=r17}else{break}}r20=r18&255;r21=r20+8720|0;r22=HEAP8[r21];r23=r22&255;r24=r16+r23|0;r25=r8+r24|0;r5=r25;continue L1;break};default:{r3=9;break L1}}r26=r7+8720|0;r27=HEAP8[r26];r28=r27&255;r29=r5+r28|0;r5=r29}if(r3==10){return r5}else if(r3==9){return r5}else if(r3==11){return r5}}function _get_chr_property_list(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75;r5=0;r6=HEAP8[r1];r7=r6&255;HEAP32[r4>>2]=r7;r8=r4+4|0;HEAP32[r8>>2]=0;r9=r1+1|0;r10=(r6&255)>32;r11=(r6&255)<98;r12=r10&r11;L1:do{if(r12){r13=(r6&255)>97;r14=(r6&255)>84;do{if(r14){r15=85}else{r16=(r6&255)>71;if(r16){r15=72;break}r17=(r6&255)>58;if(r17){r15=59;break}r18=(r6&255)>45;r19=r18?46:33;r15=r19}}while(0);r20=r15-33&255;r21=r6-r20&255;switch(r21<<24>>24){case 39:case 40:case 45:{r22=r1+3|0;r23=r22;r5=9;break};case 41:{r24=r1+3|0;r25=r21<<24>>24==41;r26=0;r27=r24;break};case 35:case 36:{r26=0;r27=r9;break};default:{r23=r9;r5=9}}if(r5==9){r28=r21<<24>>24!=43;r29=r28&1;r26=r29;r27=r23}HEAP32[r8>>2]=r26;r30=r15&255;switch(r30|0){case 33:{HEAP32[r4>>2]=29;r31=29;r32=r27;break L1;break};case 46:{HEAP32[r4>>2]=30;r31=30;r32=r27;break L1;break};case 59:{HEAP32[r4>>2]=31;r31=31;r32=r27;break L1;break};case 72:{HEAP32[r4>>2]=32;r31=32;r32=r27;break L1;break};case 85:{r33=HEAP8[r27];r34=r33&255;HEAP32[r4>>2]=r34;r35=r27+1|0;r31=r33;r32=r35;break L1;break};default:{r31=r6;r32=r27;break L1}}}else{r31=r6;r32=r9}}while(0);r36=r31&255;switch(r36|0){case 29:case 31:{r37=r32+1|0;r38=HEAP8[r32];r39=r38&255;r40=r4+8|0;HEAP32[r40>>2]=r39;r41=r4+12|0;HEAP32[r41>>2]=-1;r42=r37;return r42;break};case 30:case 32:{r43=r31<<24>>24==30;r44=r43?29:31;HEAP32[r4>>2]=r44;r45=r32+1|0;r46=HEAP8[r32];r47=r46&255;r48=r4+8|0;HEAP32[r48>>2]=r47;r49=r3+r47|0;r50=HEAP8[r49];r51=r50&255;r52=r4+12|0;HEAP32[r52>>2]=r51;r53=r46<<24>>24==r50<<24>>24;if(r53){HEAP32[r52>>2]=-1;r42=r45;return r42}else{r54=r4+16|0;HEAP32[r54>>2]=-1;r42=r45;return r42}break};case 111:case 110:{r55=r32+32|0;r56=HEAP8[r55];r57=r56&255;switch(r57|0){case 98:case 99:case 102:case 103:case 106:case 108:{HEAP32[r8>>2]=1;r58=r32+33|0;r59=r58;break};case 100:case 101:case 107:{r60=r32+33|0;r59=r60;break};case 104:case 105:case 109:{r61=r32+33|0;r62=HEAP8[r61];r63=r62&255;r64=r63<<8;r65=r32+34|0;r66=HEAP8[r65];r67=r66&255;r68=r64|r67;r69=(r68|0)==0;r70=r69&1;HEAP32[r8>>2]=r70;r71=r32+37|0;r59=r71;break};default:{r59=r55}}r72=r59;r73=r32;r74=r72-r73|0;r75=r4+8|0;HEAP32[r75>>2]=r74;r42=r59;return r42;break};case 6:case 7:case 8:case 9:case 10:case 11:case 12:case 13:case 17:case 18:case 19:case 20:case 21:case 22:case 23:case 24:case 25:case 26:{r42=r32;return r42;break};default:{r42=0;return r42}}}function _compare_opcodes(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269;r6=0;r7=STACKTOP;STACKTOP=STACKTOP+32|0;r8=r7;r9=r3+4|0;r10=r8|0;r11=r4+8|0;r12=r8+8|0;r13=r8+4|0;r14=r3+8|0;r15=(r2|0)==0;r16=r3+12|0;r17=r4+4|0;r18=r1;L1:while(1){r19=HEAP8[r18];if(r19<<24>>24==118){r20=r18+6|0;r18=r20;continue}else if(r19<<24>>24==119){r21=r18;while(1){r22=r21+1|0;r23=HEAP8[r22];r24=r23&255;r25=r24<<8;r26=r21+2|0;r27=HEAP8[r26];r28=r27&255;r29=r25|r28;r30=r21+r29|0;r31=HEAP8[r30];r32=r31<<24>>24==119;if(r32){r21=r30}else{r33=r30;r34=r31;break}}}else{r33=r18;r34=r19}r35=r34&255;switch(r35|0){case 0:case 123:{r6=6;break L1;break};case 120:{r36=HEAP32[r17>>2];r37=(r36|0)==0;if(r37){r38=0;r6=83;break L1}r39=r33+1|0;r40=HEAP8[r39];r41=r40&255;r42=r41<<8;r43=r33+2|0;r44=HEAP8[r43];r45=r44&255;r46=r42|r45;r47=-r46|0;r48=r33+r47|0;r49=HEAP8[r48];r50=r49&255;r51=r50-125|0;r52=r51>>>0<6;if(r52){r38=1;r6=82;break L1}r53=r33+3|0;r18=r53;continue L1;break};case 129:case 130:case 131:case 133:{r54=r33+1|0;r55=HEAP8[r54];r56=r55&255;r57=r56<<8;r58=r33+2|0;r59=HEAP8[r58];r60=r59&255;r61=r57|r60;r62=r33+r61|0;r63=r35+8720|0;r64=HEAP8[r63];r65=r64&255;r66=r33+r65|0;r67=r66;r68=r62;while(1){r69=HEAP8[r68];r70=r69<<24>>24==119;if(!r70){r18=r67;continue L1}r71=_compare_opcodes(r67,r2,r3,r4,r5);r72=(r71|0)==0;if(r72){r38=0;r6=84;break L1}r73=r68+3|0;r74=r68+1|0;r75=HEAP8[r74];r76=r75&255;r77=r76<<8;r78=r68+2|0;r79=HEAP8[r78];r80=r79&255;r81=r77|r80;r82=r68+r81|0;r67=r73;r68=r82}break};case 146:case 147:{r83=r33+1|0;r84=HEAP8[r83];if(r84<<24>>24==-125|r84<<24>>24==-123|r84<<24>>24==-127|r84<<24>>24==-126){r85=r83}else{r38=0;r6=85;break L1}while(1){r86=r85+1|0;r87=HEAP8[r86];r88=r87&255;r89=r88<<8;r90=r85+2|0;r91=HEAP8[r90];r92=r91&255;r93=r89|r92;r94=r85+r93|0;r95=HEAP8[r94];r96=r95<<24>>24==119;if(r96){r85=r94}else{break}}r97=r93+3|0;r98=r85+r97|0;r99=_compare_opcodes(r98,r2,r3,r4,r5);r100=(r99|0)==0;if(r100){r38=0;r6=86;break L1}r101=r35+8720|0;r102=HEAP8[r101];r103=r102&255;r104=r33+r103|0;r18=r104;continue L1;break};default:{r105=HEAP32[r9>>2];r106=_get_chr_property_list(r33,r2,r105,r10);r107=(r106|0)==0;if(r107){r38=0;r6=87;break L1}r108=HEAP32[r4>>2];r109=(r108|0)==29;r110=HEAP32[r10>>2];do{if(r109){r111=r11;r112=r10;r113=r110}else{r114=(r110|0)==29;if(r114){r111=r12;r112=r4;r113=r108;break}r115=(r108|0)==110;L27:do{if(r115){r6=29}else{r116=(r110|0)==110;do{if(r116){r117=r108}else{if(r15){r118=(r108|0)==111;if(r118){r6=29;break L27}r119=(r110|0)==111;if(r119){r117=r108;break}}r120=r108>>>0>5;r121=r108>>>0<23;r122=r120&r121;r123=r110>>>0>5;r124=r122&r123;r125=r110>>>0<27;r126=r124&r125;if(!r126){r38=0;r6=92;break L1}r127=r110-6|0;r128=r108-6|0;r129=4408+(r128*21&-1)+r127|0;r130=HEAP8[r129];r131=r130<<24>>24==0;if(r131){r38=0;r6=93;break L1}r132=HEAP32[r13>>2];r133=(r132|0)==0;if(r133){r38=1;r6=94;break L1}else{r18=r106;continue L1}}}while(0);r134=(r117|0)==110;if(r134){r6=29;break}else{r135=r117}if(r15){r136=r135;r137=(r136|0)==111;if(r137){r6=29;break}else{r138=r136}}else{r138=r135}r139=HEAP32[r12>>2];r140=-r139|0;r141=r106+r140|0;r142=r4;r143=r141;r144=r138}}while(0);if(r6==29){r6=0;r145=HEAP32[r11>>2];r146=-r145|0;r147=r5+r146|0;r142=r10;r143=r147;r144=r110}switch(r144|0){case 110:case 111:{r148=(r142|0)==(r10|0);r149=r148?r106:r5;r150=r142+8|0;r151=HEAP32[r150>>2];r152=-r151|0;r153=r149+r152|0;r154=r143+32|0;r155=r153;r156=r154;r6=40;break};case 6:{r157=1;r6=34;break};case 7:{r157=0;r6=34;break};case 8:{r158=1;r6=36;break};case 9:{r158=0;r6=36;break};case 10:{r159=1;r6=38;break};case 11:{r159=0;r6=38;break};default:{r38=0;r6=88;break L1}}if(r6==34){r6=0;r160=HEAP32[r14>>2];r161=r160+64|0;r162=r157;r163=r161;r6=39}else if(r6==36){r6=0;r164=HEAP32[r14>>2];r162=r158;r163=r164;r6=39}else if(r6==38){r6=0;r165=HEAP32[r14>>2];r166=r165+160|0;r162=r159;r163=r166;r6=39}do{if(r6==39){r6=0;r167=r143+32|0;r168=(r162|0)==0;if(r168){r155=r163;r156=r167;r6=40;break}else{r169=r163;r170=r143}while(1){r171=r170+1|0;r172=HEAP8[r170];r173=r172&255;r174=HEAP8[r169];r175=r174&255;r176=~r175;r177=r173&r176;r178=(r177|0)==0;if(!r178){r38=0;r6=89;break L1}r179=r169+1|0;r180=r171>>>0<r167>>>0;if(r180){r169=r179;r170=r171}else{break}}}}while(0);if(r6==40){r6=0;r181=r155;r182=r143;while(1){r183=r182+1|0;r184=HEAP8[r182];r185=HEAP8[r181];r186=r184&r185;r187=r186<<24>>24==0;if(!r187){r38=0;r6=90;break L1}r188=r181+1|0;r189=r183>>>0<r156>>>0;if(r189){r181=r188;r182=r183}else{break}}}r190=HEAP32[r13>>2];r191=(r190|0)==0;if(r191){r38=1;r6=91;break L1}else{r18=r106;continue L1}}}while(0);r192=r112+8|0;r193=(r112|0)==(r10|0);r194=HEAP32[r111>>2];r195=r111;r196=r194;while(1){L68:do{switch(r113|0){case 29:{r197=HEAP32[r192>>2];r198=r192;r199=r197;while(1){r200=(r196|0)==(r199|0);if(r200){r38=0;r6=96;break L1}r201=r198+4|0;r202=HEAP32[r201>>2];r203=(r202|0)==-1;if(r203){break}else{r198=r201;r199=r202}}break};case 31:{r204=HEAP32[r192>>2];r205=r192;r206=r204;while(1){r207=(r196|0)==(r206|0);if(r207){r208=r196;break}r209=r205+4|0;r210=HEAP32[r209>>2];r211=(r210|0)==-1;if(r211){r38=0;r6=97;break L1}else{r205=r209;r206=r210}}r212=(r208|0)==-1;if(r212){r38=0;r6=98;break L1}break};case 7:{r213=r196>>>0<256;if(!r213){break L68}r214=HEAP32[r16>>2];r215=r214+r196|0;r216=HEAP8[r215];r217=r216&4;r218=r217<<24>>24==0;if(!r218){r38=0;r6=99;break L1}break};case 6:{r219=r196>>>0>255;if(r219){r38=0;r6=100;break L1}r220=HEAP32[r16>>2];r221=r220+r196|0;r222=HEAP8[r221];r223=r222&4;r224=r223<<24>>24==0;if(r224){r38=0;r6=101;break L1}break};case 9:{r225=r196>>>0<256;if(!r225){break L68}r226=HEAP32[r16>>2];r227=r226+r196|0;r228=HEAP8[r227];r229=r228&1;r230=r229<<24>>24==0;if(!r230){r38=0;r6=102;break L1}break};case 8:{r231=r196>>>0>255;if(r231){r38=0;r6=103;break L1}r232=HEAP32[r16>>2];r233=r232+r196|0;r234=HEAP8[r233];r235=r234&1;r236=r235<<24>>24==0;if(r236){r38=0;r6=104;break L1}break};case 11:{r237=r196>>>0<255;if(!r237){break L68}r238=HEAP32[r16>>2];r239=r238+r196|0;r240=HEAP8[r239];r241=r240&16;r242=r241<<24>>24==0;if(!r242){r38=0;r6=105;break L1}break};case 10:{r243=r196>>>0>255;if(r243){r38=0;r6=106;break L1}r244=HEAP32[r16>>2];r245=r244+r196|0;r246=HEAP8[r245];r247=r246&16;r248=r247<<24>>24==0;if(r248){r38=0;r6=107;break L1}break};case 19:{if((r196|0)==9|(r196|0)==32|(r196|0)==160|(r196|0)==5760|(r196|0)==6158|(r196|0)==8192|(r196|0)==8193|(r196|0)==8194|(r196|0)==8195|(r196|0)==8196|(r196|0)==8197|(r196|0)==8198|(r196|0)==8199|(r196|0)==8200|(r196|0)==8201|(r196|0)==8202|(r196|0)==8239|(r196|0)==8287|(r196|0)==12288){r38=0;r6=108;break L1}break};case 18:{if(!((r196|0)==9|(r196|0)==32|(r196|0)==160|(r196|0)==5760|(r196|0)==6158|(r196|0)==8192|(r196|0)==8193|(r196|0)==8194|(r196|0)==8195|(r196|0)==8196|(r196|0)==8197|(r196|0)==8198|(r196|0)==8199|(r196|0)==8200|(r196|0)==8201|(r196|0)==8202|(r196|0)==8239|(r196|0)==8287|(r196|0)==12288)){r38=0;r6=109;break L1}break};case 17:case 21:{if((r196|0)==10|(r196|0)==11|(r196|0)==12|(r196|0)==13|(r196|0)==133|(r196|0)==8232|(r196|0)==8233){r38=0;r6=110;break L1}break};case 20:{if(!((r196|0)==10|(r196|0)==11|(r196|0)==12|(r196|0)==13|(r196|0)==133|(r196|0)==8232|(r196|0)==8233)){r38=0;r6=111;break L1}break};case 25:case 23:{if((r196|0)==13|(r196|0)==10|(r196|0)==11|(r196|0)==12|(r196|0)==133|(r196|0)==8232|(r196|0)==8233){r38=0;r6=112;break L1}break};case 111:{r249=r196>>>0>255;if(r249){r38=0;r6=113;break L1}else{r6=77}break};case 110:{r250=r196>>>0>255;if(!r250){r6=77}break};case 24:{break};default:{r38=0;r6=95;break L1}}}while(0);if(r6==77){r6=0;r251=r193?r106:r5;r252=HEAP32[r192>>2];r253=r196>>>3;r254=r253-r252|0;r255=r251+r254|0;r256=HEAP8[r255];r257=r256&255;r258=r196&7;r259=1<<r258;r260=r257&r259;r261=(r260|0)==0;if(!r261){r38=0;r6=114;break L1}}r262=r195+4|0;r263=HEAP32[r262>>2];r264=(r263|0)==-1;if(r264){break}else{r195=r262;r196=r263}}r265=HEAP32[r13>>2];r266=(r265|0)==0;if(r266){r38=1;r6=115;break L1}else{r18=r106;continue L1}}}}if(r6==100){STACKTOP=r7;return r38}else if(r6==101){STACKTOP=r7;return r38}else if(r6==102){STACKTOP=r7;return r38}else if(r6==103){STACKTOP=r7;return r38}else if(r6==104){STACKTOP=r7;return r38}else if(r6==82){STACKTOP=r7;return r38}else if(r6==83){STACKTOP=r7;return r38}else if(r6==84){STACKTOP=r7;return r38}else if(r6==85){STACKTOP=r7;return r38}else if(r6==91){STACKTOP=r7;return r38}else if(r6==92){STACKTOP=r7;return r38}else if(r6==93){STACKTOP=r7;return r38}else if(r6==94){STACKTOP=r7;return r38}else if(r6==6){r267=HEAP32[r17>>2];r268=(r267|0)!=0;r269=r268&1;r38=r269;STACKTOP=r7;return r38}else if(r6==105){STACKTOP=r7;return r38}else if(r6==106){STACKTOP=r7;return r38}else if(r6==107){STACKTOP=r7;return r38}else if(r6==108){STACKTOP=r7;return r38}else if(r6==109){STACKTOP=r7;return r38}else if(r6==113){STACKTOP=r7;return r38}else if(r6==114){STACKTOP=r7;return r38}else if(r6==115){STACKTOP=r7;return r38}else if(r6==86){STACKTOP=r7;return r38}else if(r6==87){STACKTOP=r7;return r38}else if(r6==88){STACKTOP=r7;return r38}else if(r6==89){STACKTOP=r7;return r38}else if(r6==90){STACKTOP=r7;return r38}else if(r6==110){STACKTOP=r7;return r38}else if(r6==111){STACKTOP=r7;return r38}else if(r6==112){STACKTOP=r7;return r38}else if(r6==95){STACKTOP=r7;return r38}else if(r6==96){STACKTOP=r7;return r38}else if(r6==97){STACKTOP=r7;return r38}else if(r6==98){STACKTOP=r7;return r38}else if(r6==99){STACKTOP=r7;return r38}}function _compile_branch(r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12){var r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472,r473,r474,r475,r476,r477,r478,r479,r480,r481,r482,r483,r484,r485,r486,r487,r488,r489,r490,r491,r492,r493,r494,r495,r496,r497,r498,r499,r500,r501,r502,r503,r504,r505,r506,r507,r508,r509,r510,r511,r512,r513,r514,r515,r516,r517,r518,r519,r520,r521,r522,r523,r524,r525,r526,r527,r528,r529,r530,r531,r532,r533,r534,r535,r536,r537,r538,r539,r540,r541,r542,r543,r544,r545,r546,r547,r548,r549,r550,r551,r552,r553,r554,r555,r556,r557,r558,r559,r560,r561,r562,r563,r564,r565,r566,r567,r568,r569,r570,r571,r572,r573,r574,r575,r576,r577,r578,r579,r580,r581,r582,r583,r584,r585,r586,r587,r588,r589,r590,r591,r592,r593,r594,r595,r596,r597,r598,r599,r600,r601,r602,r603,r604,r605,r606,r607,r608,r609,r610,r611,r612,r613,r614,r615,r616,r617,r618,r619,r620,r621,r622,r623,r624,r625,r626,r627,r628,r629,r630,r631,r632,r633,r634,r635,r636,r637,r638,r639,r640,r641,r642,r643,r644,r645,r646,r647,r648,r649,r650,r651,r652,r653,r654,r655,r656,r657,r658,r659,r660,r661,r662,r663,r664,r665,r666,r667,r668,r669,r670,r671,r672,r673,r674,r675,r676,r677,r678,r679,r680,r681,r682,r683,r684,r685,r686,r687,r688,r689,r690,r691,r692,r693,r694,r695,r696,r697,r698,r699,r700,r701,r702,r703,r704,r705,r706,r707,r708,r709,r710,r711,r712,r713,r714,r715,r716,r717,r718,r719,r720,r721,r722,r723,r724,r725,r726,r727,r728,r729,r730,r731,r732,r733,r734,r735,r736,r737,r738,r739,r740,r741,r742,r743,r744,r745,r746,r747,r748,r749,r750,r751,r752,r753,r754,r755,r756,r757,r758,r759,r760,r761,r762,r763,r764,r765,r766,r767,r768,r769,r770,r771,r772,r773,r774,r775,r776,r777,r778,r779,r780,r781,r782,r783,r784,r785,r786,r787,r788,r789,r790,r791,r792,r793,r794,r795,r796,r797,r798,r799,r800,r801,r802,r803,r804,r805,r806,r807,r808,r809,r810,r811,r812,r813,r814,r815,r816,r817,r818,r819,r820,r821,r822,r823,r824,r825,r826,r827,r828,r829,r830,r831,r832,r833,r834,r835,r836,r837,r838,r839,r840,r841,r842,r843,r844,r845,r846,r847,r848,r849,r850,r851,r852,r853,r854,r855,r856,r857,r858,r859,r860,r861,r862,r863,r864,r865,r866,r867,r868,r869,r870,r871,r872,r873,r874,r875,r876,r877,r878,r879,r880,r881,r882,r883,r884,r885,r886,r887,r888,r889,r890,r891,r892,r893,r894,r895,r896,r897,r898,r899,r900,r901,r902,r903,r904,r905,r906,r907,r908,r909,r910,r911,r912,r913,r914,r915,r916,r917,r918,r919,r920,r921,r922,r923,r924,r925,r926,r927,r928,r929,r930,r931,r932,r933,r934,r935,r936,r937,r938,r939,r940,r941,r942,r943,r944,r945,r946,r947,r948,r949,r950,r951,r952,r953,r954,r955,r956,r957,r958,r959,r960,r961,r962,r963,r964,r965,r966,r967,r968,r969,r970,r971,r972,r973,r974,r975,r976,r977,r978,r979,r980,r981,r982,r983,r984,r985,r986,r987,r988,r989,r990,r991,r992,r993,r994,r995,r996,r997,r998,r999,r1000,r1001,r1002,r1003,r1004,r1005,r1006,r1007,r1008,r1009,r1010,r1011,r1012,r1013,r1014,r1015,r1016,r1017,r1018,r1019,r1020,r1021,r1022,r1023,r1024,r1025,r1026,r1027,r1028,r1029,r1030,r1031,r1032,r1033,r1034,r1035,r1036,r1037,r1038,r1039,r1040,r1041,r1042,r1043,r1044,r1045,r1046,r1047,r1048,r1049,r1050,r1051,r1052,r1053,r1054,r1055,r1056,r1057,r1058,r1059,r1060,r1061,r1062,r1063,r1064,r1065,r1066,r1067,r1068,r1069,r1070,r1071,r1072,r1073,r1074,r1075,r1076,r1077,r1078,r1079,r1080,r1081,r1082,r1083,r1084,r1085,r1086,r1087,r1088,r1089,r1090,r1091,r1092,r1093,r1094,r1095,r1096,r1097,r1098,r1099,r1100,r1101,r1102,r1103,r1104,r1105,r1106,r1107,r1108,r1109,r1110,r1111,r1112,r1113,r1114,r1115,r1116,r1117,r1118,r1119,r1120,r1121,r1122,r1123,r1124,r1125,r1126,r1127,r1128,r1129,r1130,r1131,r1132,r1133,r1134,r1135,r1136,r1137,r1138,r1139,r1140,r1141,r1142,r1143,r1144,r1145,r1146,r1147,r1148,r1149,r1150,r1151,r1152,r1153,r1154,r1155,r1156,r1157,r1158,r1159,r1160,r1161,r1162,r1163,r1164,r1165,r1166,r1167,r1168,r1169,r1170,r1171,r1172,r1173,r1174,r1175,r1176,r1177,r1178,r1179,r1180,r1181,r1182,r1183,r1184,r1185,r1186,r1187,r1188,r1189,r1190,r1191,r1192,r1193,r1194,r1195,r1196,r1197,r1198,r1199,r1200,r1201,r1202,r1203,r1204,r1205,r1206,r1207,r1208,r1209,r1210,r1211,r1212,r1213,r1214,r1215,r1216,r1217,r1218,r1219,r1220,r1221,r1222,r1223,r1224,r1225,r1226,r1227,r1228,r1229,r1230,r1231,r1232,r1233,r1234,r1235,r1236,r1237,r1238,r1239,r1240,r1241,r1242,r1243,r1244,r1245,r1246,r1247,r1248,r1249,r1250,r1251,r1252,r1253,r1254,r1255,r1256,r1257,r1258,r1259,r1260,r1261,r1262,r1263,r1264,r1265,r1266,r1267,r1268,r1269,r1270,r1271,r1272,r1273,r1274,r1275,r1276,r1277,r1278,r1279,r1280,r1281,r1282,r1283,r1284,r1285,r1286,r1287,r1288,r1289,r1290,r1291,r1292,r1293,r1294,r1295,r1296,r1297,r1298,r1299,r1300,r1301,r1302,r1303,r1304,r1305,r1306,r1307,r1308,r1309,r1310,r1311,r1312,r1313,r1314,r1315,r1316,r1317,r1318,r1319,r1320,r1321,r1322,r1323,r1324,r1325,r1326,r1327,r1328,r1329,r1330,r1331,r1332,r1333,r1334,r1335,r1336,r1337,r1338,r1339,r1340,r1341,r1342,r1343,r1344,r1345,r1346,r1347,r1348,r1349,r1350,r1351,r1352,r1353,r1354,r1355,r1356,r1357,r1358,r1359,r1360,r1361,r1362,r1363,r1364,r1365,r1366,r1367,r1368,r1369,r1370,r1371,r1372,r1373,r1374,r1375,r1376,r1377,r1378,r1379,r1380,r1381,r1382,r1383,r1384,r1385,r1386,r1387,r1388,r1389,r1390,r1391,r1392,r1393,r1394,r1395,r1396,r1397,r1398,r1399,r1400,r1401,r1402,r1403,r1404,r1405,r1406,r1407,r1408,r1409,r1410,r1411,r1412,r1413,r1414,r1415,r1416,r1417,r1418,r1419,r1420,r1421,r1422,r1423,r1424,r1425,r1426,r1427,r1428,r1429,r1430,r1431,r1432,r1433,r1434,r1435,r1436,r1437,r1438,r1439,r1440,r1441,r1442,r1443,r1444,r1445,r1446,r1447,r1448,r1449,r1450,r1451,r1452,r1453,r1454,r1455,r1456,r1457,r1458,r1459,r1460,r1461,r1462,r1463,r1464,r1465,r1466,r1467,r1468,r1469,r1470,r1471,r1472,r1473,r1474,r1475,r1476,r1477,r1478,r1479,r1480,r1481,r1482,r1483,r1484,r1485,r1486,r1487,r1488,r1489,r1490,r1491,r1492,r1493,r1494,r1495,r1496,r1497,r1498,r1499,r1500,r1501,r1502,r1503,r1504,r1505,r1506,r1507,r1508,r1509,r1510,r1511,r1512,r1513,r1514,r1515,r1516,r1517,r1518,r1519,r1520,r1521,r1522,r1523,r1524,r1525,r1526,r1527,r1528,r1529,r1530,r1531,r1532,r1533,r1534,r1535,r1536,r1537,r1538,r1539,r1540,r1541,r1542,r1543,r1544,r1545,r1546,r1547,r1548,r1549,r1550,r1551,r1552,r1553,r1554,r1555,r1556,r1557,r1558,r1559,r1560,r1561,r1562,r1563,r1564,r1565,r1566,r1567,r1568,r1569,r1570,r1571,r1572,r1573,r1574,r1575,r1576,r1577,r1578,r1579,r1580,r1581,r1582,r1583,r1584,r1585,r1586,r1587,r1588,r1589,r1590,r1591,r1592,r1593,r1594,r1595,r1596,r1597,r1598,r1599,r1600,r1601,r1602,r1603,r1604,r1605,r1606,r1607,r1608,r1609,r1610,r1611,r1612,r1613,r1614,r1615,r1616,r1617,r1618,r1619,r1620,r1621,r1622,r1623,r1624,r1625,r1626,r1627,r1628,r1629,r1630,r1631,r1632,r1633,r1634,r1635,r1636,r1637,r1638,r1639,r1640,r1641,r1642,r1643,r1644,r1645,r1646,r1647,r1648,r1649,r1650,r1651,r1652,r1653,r1654,r1655,r1656,r1657,r1658,r1659,r1660,r1661,r1662,r1663,r1664,r1665,r1666,r1667,r1668,r1669,r1670,r1671,r1672,r1673,r1674,r1675,r1676,r1677,r1678,r1679,r1680,r1681,r1682,r1683,r1684,r1685,r1686,r1687,r1688,r1689,r1690,r1691,r1692,r1693,r1694,r1695,r1696,r1697,r1698,r1699,r1700,r1701,r1702,r1703,r1704,r1705,r1706,r1707,r1708,r1709,r1710,r1711,r1712,r1713,r1714,r1715,r1716,r1717,r1718,r1719,r1720,r1721,r1722,r1723,r1724,r1725,r1726,r1727,r1728,r1729,r1730,r1731,r1732,r1733,r1734,r1735,r1736,r1737,r1738,r1739,r1740,r1741,r1742,r1743,r1744,r1745,r1746,r1747,r1748,r1749,r1750,r1751,r1752,r1753,r1754,r1755,r1756,r1757,r1758,r1759,r1760,r1761,r1762,r1763,r1764,r1765,r1766,r1767,r1768,r1769,r1770,r1771,r1772,r1773,r1774,r1775,r1776,r1777,r1778,r1779,r1780,r1781,r1782,r1783,r1784,r1785,r1786,r1787,r1788,r1789,r1790,r1791,r1792,r1793,r1794,r1795,r1796,r1797,r1798,r1799,r1800,r1801,r1802,r1803,r1804,r1805,r1806,r1807,r1808,r1809,r1810,r1811,r1812,r1813,r1814,r1815,r1816,r1817,r1818,r1819,r1820,r1821,r1822,r1823,r1824,r1825,r1826,r1827,r1828,r1829,r1830,r1831,r1832,r1833,r1834,r1835,r1836,r1837,r1838,r1839,r1840,r1841,r1842,r1843,r1844,r1845,r1846,r1847,r1848,r1849,r1850,r1851,r1852,r1853,r1854,r1855,r1856,r1857,r1858,r1859,r1860,r1861,r1862,r1863,r1864,r1865,r1866,r1867,r1868,r1869,r1870,r1871,r1872,r1873,r1874,r1875,r1876,r1877,r1878,r1879,r1880,r1881,r1882,r1883,r1884,r1885,r1886,r1887,r1888,r1889,r1890,r1891,r1892,r1893,r1894,r1895,r1896,r1897,r1898,r1899,r1900,r1901,r1902,r1903,r1904,r1905,r1906,r1907,r1908,r1909,r1910,r1911,r1912,r1913,r1914,r1915,r1916,r1917,r1918,r1919,r1920,r1921,r1922,r1923,r1924,r1925,r1926,r1927,r1928,r1929,r1930,r1931,r1932,r1933,r1934,r1935,r1936,r1937,r1938,r1939,r1940,r1941,r1942,r1943,r1944,r1945,r1946,r1947,r1948,r1949,r1950,r1951,r1952,r1953,r1954,r1955,r1956,r1957,r1958,r1959,r1960,r1961,r1962,r1963,r1964,r1965,r1966,r1967,r1968,r1969,r1970,r1971,r1972,r1973,r1974,r1975,r1976,r1977,r1978,r1979,r1980,r1981,r1982,r1983,r1984,r1985,r1986,r1987,r1988,r1989,r1990,r1991,r1992,r1993,r1994,r1995,r1996,r1997,r1998,r1999,r2000,r2001,r2002,r2003,r2004,r2005,r2006,r2007,r2008,r2009,r2010,r2011,r2012,r2013,r2014,r2015,r2016,r2017,r2018,r2019,r2020,r2021,r2022,r2023,r2024,r2025,r2026,r2027,r2028,r2029,r2030,r2031,r2032,r2033,r2034,r2035,r2036,r2037,r2038,r2039,r2040,r2041,r2042,r2043,r2044,r2045,r2046,r2047,r2048,r2049,r2050,r2051,r2052,r2053,r2054,r2055,r2056,r2057,r2058,r2059,r2060,r2061,r2062,r2063,r2064,r2065,r2066,r2067,r2068,r2069,r2070,r2071,r2072,r2073,r2074,r2075,r2076,r2077,r2078,r2079,r2080,r2081,r2082,r2083,r2084,r2085,r2086,r2087,r2088,r2089,r2090,r2091,r2092,r2093,r2094,r2095,r2096,r2097,r2098,r2099,r2100,r2101,r2102,r2103,r2104,r2105,r2106,r2107,r2108,r2109,r2110,r2111,r2112,r2113,r2114,r2115,r2116,r2117,r2118,r2119,r2120,r2121,r2122,r2123,r2124,r2125,r2126,r2127,r2128,r2129,r2130,r2131,r2132,r2133,r2134,r2135,r2136,r2137,r2138,r2139,r2140,r2141,r2142,r2143,r2144,r2145,r2146,r2147,r2148,r2149,r2150,r2151,r2152,r2153,r2154,r2155,r2156,r2157,r2158,r2159,r2160,r2161,r2162,r2163,r2164,r2165,r2166,r2167,r2168,r2169,r2170,r2171,r2172,r2173,r2174,r2175,r2176,r2177,r2178,r2179,r2180,r2181,r2182,r2183,r2184,r2185,r2186,r2187,r2188,r2189,r2190,r2191,r2192,r2193,r2194,r2195,r2196,r2197,r2198,r2199,r2200,r2201,r2202,r2203,r2204,r2205,r2206,r2207,r2208,r2209,r2210,r2211,r2212,r2213,r2214,r2215,r2216,r2217,r2218,r2219,r2220,r2221,r2222,r2223,r2224,r2225,r2226,r2227,r2228,r2229,r2230,r2231,r2232,r2233,r2234,r2235,r2236,r2237,r2238,r2239,r2240,r2241,r2242,r2243,r2244,r2245,r2246,r2247,r2248,r2249,r2250,r2251,r2252,r2253,r2254,r2255,r2256,r2257,r2258,r2259,r2260,r2261,r2262,r2263,r2264,r2265,r2266,r2267,r2268,r2269,r2270,r2271,r2272,r2273,r2274,r2275,r2276,r2277,r2278,r2279,r2280,r2281,r2282,r2283,r2284,r2285,r2286,r2287,r2288,r2289,r2290,r2291,r2292,r2293,r2294,r2295,r2296,r2297,r2298,r2299,r2300,r2301,r2302,r2303,r2304,r2305,r2306,r2307,r2308,r2309,r2310,r2311,r2312,r2313,r2314,r2315,r2316,r2317,r2318,r2319,r2320,r2321,r2322,r2323,r2324,r2325,r2326,r2327,r2328,r2329,r2330,r2331,r2332,r2333,r2334,r2335,r2336,r2337,r2338,r2339,r2340,r2341,r2342,r2343,r2344,r2345,r2346,r2347,r2348,r2349,r2350,r2351,r2352,r2353,r2354,r2355,r2356,r2357,r2358,r2359,r2360,r2361,r2362,r2363,r2364,r2365,r2366,r2367,r2368,r2369,r2370,r2371,r2372,r2373,r2374,r2375,r2376;r13=0;r14=STACKTOP;STACKTOP=STACKTOP+176|0;r15=r14;r16=r14+8;r17=r14+16;r18=r14+24;r19=r14+32;r20=r14+64;r21=r14+72;r22=r14+80;r23=r14+88;r24=r14+96;r25=r14+104;r26=r14+112;r27=r14+120;r28=r14+152;r29=r14+160;r30=r14+168;r31=HEAP32[r1>>2];HEAP32[r15>>2]=0;r32=HEAP32[r2>>2];r33=HEAP32[r3>>2];HEAP32[r17>>2]=r33;r34=r31>>>9;r35=r34&1;r36=r35^1;r37=r31&1;r38=(r12|0)==0;r39=r11+32|0;r40=r11+16|0;r41=r11+60|0;r42=r11+96|0;r43=r19|0;r44=r11+8|0;r45=r27|0;r46=r27+1|0;r47=r27+11|0;r48=r11+64|0;r49=r11+100|0;r50=r26|0;r51=r11+20|0;r52=r11+104|0;r53=r11+12|0;r54=r11+124|0;r55=r11+28|0;r56=r11+128|0;r57=r11+132|0;r58=r11+133|0;r59=r11+108|0;r60=r11+36|0;r61=r11+92|0;r62=r11+112|0;r63=r11+68|0;r64=r11+44|0;r65=r11+48|0;r66=r11+52|0;r67=r11+40|0;r68=r11+120|0;r69=r11+56|0;r70=r11+24|0;r71=r11+88|0;r72=r11+80|0;r73=r11+76|0;r74=r11+84|0;r75=(r10|0)<1;r76=r11+72|0;r77=r32;r78=0;r79=r35;r80=r36;r81=0;r82=0;r83=-2;r84=-2;r85=0;r86=0;r87=-2;r88=-2;r89=r37;r90=r31;r91=0;r92=r32;r93=r32;r94=0;r95=0;r96=0;r97=0;r98=0;r99=0;r100=0;r101=0;r102=r33;L1:while(1){r103=HEAP8[r102];r104=r103&255;r105=r103<<24>>24==0;do{if(r105){r106=(r96|0)==0;if(r106){r107=r104;r108=0;break}HEAP32[r17>>2]=r96;r109=HEAP8[r96];r110=r109&255;r107=r110;r108=0}else{r107=r104;r108=r96}}while(0);do{if(r38){r111=HEAP32[r39>>2];r112=HEAP32[r40>>2];r113=HEAP32[r41>>2];r114=r113-100|0;r115=r112+r114|0;r116=r111>>>0>r115>>>0;if(r116){r13=14;break L1}else{r117=r92;r118=r93;r119=r97}}else{r120=HEAP32[r40>>2];r121=HEAP32[r41>>2];r122=r121-100|0;r123=r120+r122|0;r124=r92>>>0>r123>>>0;if(r124){r13=7;break L1}r125=r92>>>0<r93>>>0;r126=r125?r93:r92;r127=HEAP32[r12>>2];r128=2147483627-r127|0;r129=r126;r130=r93;r131=r129-r130|0;r132=(r128|0)<(r131|0);if(r132){r13=9;break L1}r133=r127+r131|0;HEAP32[r12>>2]=r133;r134=(r97|0)==0;if(r134){r117=r32;r118=r32;r119=0;break}r135=r97>>>0>r32>>>0;if(!r135){r117=r126;r118=r126;r119=r97;break}r136=r97;r137=r129-r136|0;_memmove(r32,r97,r137,1,0);r138=r77-r136|0;r139=r126+r138|0;r117=r139;r118=r139;r119=r32}}while(0);r140=(r94|0)==0;r141=(r107|0)==0;r142=r140|r141;L15:do{if(r142){r143=r90&8;r144=(r143|0)==0;L26:do{if(r144){r145=r107}else{r146=r107;while(1){r147=HEAP32[r53>>2];r148=r147+r146|0;r149=HEAP8[r148];r150=r149&1;r151=r150<<24>>24==0;L29:do{if(r151){r152=(r146|0)==35;if(!r152){r145=r146;break L26}while(1){r153=HEAP32[r17>>2];r154=r153+1|0;HEAP32[r17>>2]=r154;r155=HEAP8[r154];r156=r155<<24>>24==0;if(r156){r157=0;break L29}r158=HEAP32[r54>>2];r159=(r158|0)==0;r160=HEAP32[r55>>2];if(!r159){r161=r154>>>0<r160>>>0;if(!r161){continue}r162=__pcre_is_newline(r154,r158,r160,r56,0);r163=(r162|0)==0;if(r163){continue}else{r13=32;break}}r164=HEAP32[r56>>2];r165=-r164|0;r166=r160+r165|0;r167=r154>>>0>r166>>>0;if(r167){continue}r168=HEAP8[r57];r169=r155<<24>>24==r168<<24>>24;if(!r169){continue}r170=(r164|0)==1;if(r170){r171=1;r172=r154;break}r173=r153+2|0;r174=HEAP8[r173];r175=HEAP8[r58];r176=r174<<24>>24==r175<<24>>24;if(r176){r171=r164;r172=r154;break}}if(r13==32){r13=0;r177=HEAP32[r56>>2];r178=HEAP32[r17>>2];r171=r177;r172=r178}r179=r172+r171|0;HEAP32[r17>>2]=r179;r180=HEAP8[r179];r157=r180}else{r181=HEAP32[r17>>2];r182=r181+1|0;HEAP32[r17>>2]=r182;r183=HEAP8[r182];r157=r183}}while(0);r184=r157&255;r146=r184}}}while(0);if((r145|0)==123){r185=HEAP32[r17>>2];r186=r185+1|0;r187=_is_counted_repeat(r186);r188=(r187|0)!=0;r189=r188&1;if(r188){r190=r91;r191=r98;r192=r189}else{r193=r189;r13=40}}else if((r145|0)==42|(r145|0)==43|(r145|0)==63){r190=r91;r191=r98;r192=1}else{r193=0;r13=40}do{if(r13==40){r13=0;r194=(r98|0)==0;if(r194){r190=r91;r191=0;r192=r193;break}r195=(r108|0)==0;if(!r195){r190=r91;r191=r98;r192=r193;break}r196=r91-1|0;r197=(r91|0)<1;r198=r197^1;r199=r38^1;r200=r198|r199;r201=r198?r98:0;if(r200){r190=r196;r191=r201;r192=r193;break}r202=HEAP32[r17>>2];r203=HEAP32[r70>>2];r204=r202;r205=r203;r206=r204-r205|0;r207=r98+2|0;r208=HEAP8[r207];r209=r208&255;r210=r209<<8;r211=r98+3|0;r212=HEAP8[r211];r213=r212&255;r214=r210|r213;r215=r206-r214|0;r216=r215>>>8;r217=r216&255;r218=r98+4|0;HEAP8[r218]=r217;r219=r215&255;r220=r98+5|0;HEAP8[r220]=r219;r190=r196;r191=0;r192=r193}}while(0);r221=r90&16384;r222=(r221|0)!=0;r223=(r192|0)==0;r224=r222&r223;r225=(r108|0)==0;r226=r224&r225;if(r226){r227=HEAP32[r17>>2];r228=r117+1|0;HEAP8[r117]=118;r229=r117+2|0;HEAP8[r228]=-1;r230=HEAP32[r70>>2];r231=r227;r232=r230;r233=r231-r232|0;r234=r233>>>8;r235=r234&255;HEAP8[r229]=r235;r236=HEAP32[r70>>2];r237=r236;r238=r231-r237|0;r239=r238&255;r240=r117+3|0;HEAP8[r240]=r239;r241=r117+4|0;HEAP8[r241]=0;r242=r117+5|0;HEAP8[r242]=0;r243=r117+6|0;r244=r243;r245=r117}else{r244=r117;r245=r191}r246=r145&255;L58:do{switch(r145|0){case 91:{r247=HEAP32[r17>>2];r248=r247+1|0;r249=_strncmp(r248,6544,6);r250=(r249|0)==0;r251=HEAP32[r17>>2];if(r250){r252=r251+7|0;HEAP32[r17>>2]=167;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r83;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r190;r267=r244;r268=r94;r269=r95;r270=r252;r271=r119;r272=r245;r273=r99;r274=r100;r275=r101;break L15}r276=r251+1|0;r277=_strncmp(r276,6504,6);r278=(r277|0)==0;r279=HEAP32[r17>>2];if(r278){r280=r279+7|0;HEAP32[r17>>2]=183;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r83;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r190;r267=r244;r268=r94;r269=r95;r270=r280;r271=r119;r272=r245;r273=r99;r274=r100;r275=r101;break L15}r281=r279+1|0;r282=HEAP8[r281];if(r282<<24>>24==58|r282<<24>>24==46|r282<<24>>24==61){r283=_check_posix_syntax(r279,r18);r284=(r283|0)==0;r285=HEAP32[r17>>2];if(r284){r286=0;r287=r285}else{r13=64;break L1}}else{r286=0;r287=r279}L68:while(1){r288=r287;while(1){r289=r288+1|0;HEAP32[r17>>2]=r289;r290=HEAP8[r289];r291=r290<<24>>24==92;if(!r291){break}r292=r288+2|0;r293=HEAP8[r292];r294=r293<<24>>24==69;if(r294){r295=r292}else{r296=_strncmp(r292,6456,3);r297=(r296|0)==0;if(!r297){r13=70;break L68}r298=HEAP32[r17>>2];r299=r298+3|0;r295=r299}HEAP32[r17>>2]=r295;r288=r295}r300=r290&255;r301=(r286|0)==0;r302=r290<<24>>24==94;r303=r301&r302;if(r303){r286=1;r287=r289}else{r13=73;break}}if(r13==73){r13=0;r304=(r300|0)==93;do{if(r304){r305=HEAP32[r42>>2];r306=r305&33554432;r307=(r306|0)==0;if(r307){r308=r300;break}r309=(r286|0)!=0;r310=r309?13:-99;r311=r244+1|0;HEAP8[r244]=r310;r312=(r83|0)==-2;r313=r312?-1:r83;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r313;r259=r84;r260=r85;r261=r81;r262=r87;r263=r313;r264=r89;r265=r90;r266=r190;r267=r311;r268=r94;r269=r95;r270=r108;r271=r244;r272=r245;r273=r99;r274=r100;r275=r101;break L15}else{r308=r300}}while(0);_memset(r43,0,32)|0;r314=(r308|0)==0;if(r314){r13=187;break L1}else{r315=r308}}else if(r13==70){r13=0;_memset(r43,0,32)|0;r315=92}r316=r90&1;r317=(r316|0)!=0;r318=r90&64;r319=(r318|0)==0;r320=r315;r321=r94;r322=r108;r323=0;r324=0;r325=0;L86:while(1){r326=(r321|0)==0;L88:do{if(r326){r327=(r320|0)==91;if(r327){r328=HEAP32[r17>>2];r329=r328+1|0;r330=HEAP8[r329];if(!(r330<<24>>24==58|r330<<24>>24==46|r330<<24>>24==61)){r331=r320;r13=139;break}r332=_check_posix_syntax(r328,r18);r333=(r332|0)==0;if(r333){r331=r320;r13=139;break}r334=HEAP32[r44>>2];r335=HEAP32[r17>>2];r336=r335+1|0;r337=HEAP8[r336];r338=r337<<24>>24==58;if(!r338){r13=86;break L1}r339=r335+2|0;HEAP32[r17>>2]=r339;r340=HEAP8[r339];r341=r340<<24>>24==94;if(r341){r342=r335+3|0;HEAP32[r17>>2]=r342;r343=1;r344=1;r345=r342}else{r343=r323;r344=0;r345=r339}r346=HEAP32[r18>>2];r347=r346;r348=r345;r349=r347-r348|0;r350=0;r351=304;while(1){r352=(r350|0)==14;if(r352){r13=95;break L1}r353=r350+392|0;r354=HEAP8[r353];r355=r354&255;r356=(r349|0)==(r355|0);if(r356){r357=_strncmp(r345,r351,r349);r358=(r357|0)==0;if(r358){r359=r350;break}}r360=r355+1|0;r361=r351+r360|0;r362=r350+1|0;r350=r362;r351=r361}r363=(r359|0)<0;if(r363){r13=95;break L1}r364=(r359|0)<3;r365=r317&r364;r366=r365?0:r359;r367=r366*3&-1;r368=408+(r367<<2)|0;r369=HEAP32[r368>>2];r370=r334+r369|0;_memcpy(r45,r370,32)|0;r371=r367+1|0;r372=408+(r371<<2)|0;r373=HEAP32[r372>>2];r374=r367+2|0;r375=408+(r374<<2)|0;r376=HEAP32[r375>>2];r377=(r373|0)>-1;L143:do{if(r377){r378=(r376|0)>-1;if(r378){r379=0;while(1){r380=r379>>>0<32;if(!r380){break L143}r381=r379+r373|0;r382=r334+r381|0;r383=HEAP8[r382];r384=r27+r379|0;r385=HEAP8[r384];r386=r385|r383;HEAP8[r384]=r386;r387=r379+1|0;r379=r387}}else{r388=0;while(1){r389=r388>>>0<32;if(!r389){break L143}r390=r388+r373|0;r391=r334+r390|0;r392=HEAP8[r391];r393=~r392;r394=r27+r388|0;r395=HEAP8[r394];r396=r395&r393;HEAP8[r394]=r396;r397=r388+1|0;r388=r397}}}}while(0);r398=(r376|0)<0;r399=-r376|0;r400=r398?r399:r376;if((r400|0)==1){r401=HEAP8[r46];r402=r401&-61;HEAP8[r46]=r402}else if((r400|0)==2){r403=HEAP8[r47];r404=r403&127;HEAP8[r47]=r404}r405=(r344|0)==0;L157:do{if(r405){r406=0;while(1){r407=r406>>>0<32;if(!r407){break L157}r408=r27+r406|0;r409=HEAP8[r408];r410=r19+r406|0;r411=HEAP8[r410];r412=r411|r409;HEAP8[r410]=r412;r413=r406+1|0;r406=r413}}else{r414=0;while(1){r415=r414>>>0<32;if(!r415){break L157}r416=r27+r414|0;r417=HEAP8[r416];r418=~r417;r419=r19+r414|0;r420=HEAP8[r419];r421=r420|r418;HEAP8[r419]=r421;r422=r414+1|0;r414=r422}}}while(0);r423=r346+1|0;HEAP32[r17>>2]=r423;r424=r321;r425=r343;r426=1;r427=2;break}else{r428=r320;r429=(r428|0)==92;if(!r429){r331=r320;r13=139;break}r430=HEAP32[r48>>2];r431=_check_escape(r17,r25,r4,r430,r90,1);r432=HEAP32[r4>>2];r433=(r432|0)==0;if(!r433){break L1}switch(r431|0){case 0:{r434=HEAP32[r25>>2];r331=r434;r13=139;break L88;break};case 12:{r13=115;break L1;break};case 26:{r435=HEAP32[r17>>2];r436=r435+1|0;r437=HEAP8[r436];r438=r437<<24>>24==92;if(!r438){r424=1;r425=r323;r426=r324;r427=r325;break L88}r439=r435+2|0;r440=HEAP8[r439];r441=r440<<24>>24==69;if(!r441){r424=1;r425=r323;r426=r324;r427=r325;break L88}HEAP32[r17>>2]=r439;r424=r321;r425=r323;r426=r324;r427=r325;break L88;break};case 5:{r331=8;r13=139;break L88;break};case 25:{r424=r321;r425=r323;r426=r324;r427=r325;break L88;break};default:{r442=HEAP32[r44>>2];r443=r324+1|0;r444=r325+2|0;switch(r431|0){case 10:{r445=0;while(1){r446=r445>>>0<32;if(!r446){r424=r321;r425=1;r426=r443;r427=r444;break L88}r447=r445+160|0;r448=r442+r447|0;r449=HEAP8[r448];r450=~r449;r451=r19+r445|0;r452=HEAP8[r451];r453=r452|r450;HEAP8[r451]=r453;r454=r445+1|0;r445=r454}break};case 9:{r455=0;while(1){r456=r455>>>0<32;if(!r456){r424=r321;r425=r323;r426=r443;r427=r444;break L88}r457=r442+r455|0;r458=HEAP8[r457];r459=r19+r455|0;r460=HEAP8[r459];r461=r460|r458;HEAP8[r459]=r461;r462=r455+1|0;r455=r462}break};case 7:{r463=0;while(1){r464=r463>>>0<32;if(!r464){r424=r321;r425=r323;r426=r443;r427=r444;break L88}r465=r463+64|0;r466=r442+r465|0;r467=HEAP8[r466];r468=r19+r463|0;r469=HEAP8[r468];r470=r469|r467;HEAP8[r468]=r470;r471=r463+1|0;r463=r471}break};case 8:{r472=0;while(1){r473=r472>>>0<32;if(!r473){r424=r321;r425=1;r426=r443;r427=r444;break L88}r474=r442+r472|0;r475=HEAP8[r474];r476=~r475;r477=r19+r472|0;r478=HEAP8[r477];r479=r478|r476;HEAP8[r477]=r479;r480=r472+1|0;r472=r480}break};case 19:{_add_list_to_class(r43,r20,r90,r11,7552);r424=r321;r425=r323;r426=r443;r427=r444;break L88;break};case 18:{_add_not_list_to_class(r43,r20,r90,r11,7552);r424=r321;r425=r323;r426=r443;r427=r444;break L88;break};case 6:{r481=0;while(1){r482=r481>>>0<32;if(!r482){r424=r321;r425=1;r426=r443;r427=r444;break L88}r483=r481+64|0;r484=r442+r483|0;r485=HEAP8[r484];r486=~r485;r487=r19+r481|0;r488=HEAP8[r487];r489=r488|r486;HEAP8[r487]=r489;r490=r481+1|0;r481=r490}break};case 11:{r491=0;while(1){r492=r491>>>0<32;if(!r492){r424=r321;r425=r323;r426=r443;r427=r444;break L88}r493=r491+160|0;r494=r442+r493|0;r495=HEAP8[r494];r496=r19+r491|0;r497=HEAP8[r496];r498=r497|r495;HEAP8[r496]=r498;r499=r491+1|0;r491=r499}break};case 21:{_add_list_to_class(r43,r20,r90,r11,7520);r424=r321;r425=r323;r426=r443;r427=r444;break L88;break};case 20:{_add_not_list_to_class(r43,r20,r90,r11,7520);r424=r321;r425=r323;r426=r443;r427=r444;break L88;break};default:{if(!r319){r13=137;break L1}r500=HEAP32[r17>>2];r501=HEAP8[r500];r502=r501&255;r331=r502;r13=139;break L88}}}}}}else{r503=(r320|0)==92;if(!r503){r331=r320;r13=139;break}r504=HEAP32[r17>>2];r505=r504+1|0;r506=HEAP8[r505];r507=r506<<24>>24==69;if(!r507){r331=92;r13=139;break}HEAP32[r17>>2]=r505;r424=0;r425=r323;r426=r324;r427=r325}}while(0);L165:do{if(r13==139){r13=0;r508=HEAP32[r17>>2];r509=r321;r510=r508;while(1){r511=r510+1|0;r512=HEAP8[r511];r513=r512<<24>>24==92;if(!r513){break}r514=r510+2|0;r515=HEAP8[r514];r516=r515<<24>>24==69;if(!r516){break}HEAP32[r17>>2]=r514;r509=0;r510=r514}if((r331|0)==13|(r331|0)==10){r517=HEAP32[r49>>2];r518=r517|2048;HEAP32[r49>>2]=r518}r519=(r509|0)==0;L175:do{if(r519){r520=HEAP8[r511];r521=r520<<24>>24==45;if(r521){r522=r510}else{r523=0;break}while(1){r524=r522+2|0;HEAP32[r17>>2]=r524;r525=HEAP8[r524];r526=r525<<24>>24==92;if(!r526){r527=r524;r528=r525;break}r529=r522+3|0;r530=HEAP8[r529];r531=r530<<24>>24==69;if(r531){r522=r524}else{r527=r524;r528=r525;break}}while(1){r532=r528<<24>>24==92;if(!r532){r533=0;r534=r527;r535=r528;r13=154;break}r536=r527+1|0;r537=HEAP8[r536];r538=r537<<24>>24==81;if(!r538){r13=159;break}r539=r527+2|0;HEAP32[r17>>2]=r539;r540=HEAP8[r539];r541=r540<<24>>24==92;if(!r541){r533=1;r534=r539;r535=r540;r13=154;break}r542=r527+3|0;r543=HEAP8[r542];r544=r543<<24>>24==69;if(!r544){r545=1;r546=r540;r13=156;break}r547=r527+4|0;HEAP32[r17>>2]=r547;r548=HEAP8[r547];r527=r547;r528=r548}L186:do{if(r13==154){r13=0;r549=r535<<24>>24==0;do{if(r549){r550=r533}else{r551=r535;r552=r534;r553=r533;r554=(r553|0)==0;if(r554){r555=r553;r556=r552;r557=r551}else{r545=r553;r546=r551;r13=156;break L186}r558=r557<<24>>24==93;if(r558){r550=r555;break}r559=r557&255;HEAP32[r28>>2]=r559;r560=r557<<24>>24==91;if(!r560){r561=r559;r562=r555;break L186}r563=r556+1|0;r564=HEAP8[r563];if(!(r564<<24>>24==58|r564<<24>>24==46|r564<<24>>24==61)){r561=91;r562=r555;break L186}r565=_check_posix_syntax(r556,r18);r566=(r565|0)==0;if(r566){r561=91;r562=r555;break L186}else{r13=167;break L1}}}while(0);HEAP32[r17>>2]=r510;r523=r550;break L175}else if(r13==159){r13=0;r567=r528&255;HEAP32[r28>>2]=r567;r568=HEAP32[r48>>2];r569=_check_escape(r17,r28,r4,r568,r90,1);r570=HEAP32[r4>>2];r571=(r570|0)==0;if(!r571){break L1}if((r569|0)==0){r572=HEAP32[r28>>2];r561=r572;r562=0;break}else if((r569|0)==5){HEAP32[r28>>2]=8;r561=8;r562=0;break}else{r13=162;break L1}}}while(0);if(r13==156){r13=0;r573=r546&255;HEAP32[r28>>2]=r573;r561=r573;r562=r545}r574=r561>>>0<r331>>>0;if(r574){r13=169;break L1}r575=(r561|0)==(r331|0);if(r575){r523=r562;break}r576=(r561|0)==13;if(r576){r577=13;r13=173}else{r578=(r561|0)==10;if(r578){r577=10;r13=173}else{r579=r561}}if(r13==173){r13=0;r580=HEAP32[r49>>2];r581=r580|2048;HEAP32[r49>>2]=r581;r579=r577}r582=_add_to_class(r43,r90,r11,r331,r579);r583=r324+r582|0;r424=r562;r425=r323;r426=r583;r427=2;break L165}else{r523=r509}}while(0);r584=(r325|0)<2;do{if(r584){r585=r325+1|0;r586=(r325|0)==0;if(!r586){r587=r585;break}r588=HEAP32[r17>>2];r589=r588+1|0;r590=HEAP8[r589];r591=r590<<24>>24==93;if(r591){r13=178;break L86}else{r587=1}}else{r587=r325}}while(0);r592=_add_to_class(r43,r90,r11,r331,r331);r593=r324+r592|0;r424=r523;r425=r323;r426=r593;r427=r587}}while(0);r594=HEAP32[r17>>2];r595=r594+1|0;HEAP32[r17>>2]=r595;r596=HEAP8[r595];r597=r596&255;r598=r596<<24>>24==0;if(r598){r599=(r322|0)==0;if(r599){r600=r597;r601=0;break}r602=r322+1|0;HEAP32[r17>>2]=r602;r603=HEAP8[r602];r604=r603&255;r605=r603<<24>>24==0;if(r605){r600=r604;r601=0;break}else{r606=r604;r607=0}}else{r606=r597;r607=r322}r608=(r606|0)==93;r609=(r424|0)==0;r610=r608&r609;if(r610){r600=r606;r601=r607;break}else{r320=r606;r321=r424;r322=r607;r323=r425;r324=r426;r325=r427}}if(r13==178){r13=0;HEAP32[r17>>2]=r589;r611=(r286|0)==0;if(r611){r612=r331&255;HEAP8[r50]=r612;r613=r190;r614=r244;r615=r523;r616=r322;r617=r245;r13=719;break L15}else{r618=(r83|0)==-2;r619=r618?-1:r83;r620=r316+31|0;r621=r620&255;r622=r244+1|0;HEAP8[r244]=r621;r623=r331&255;r624=r244+2|0;HEAP8[r622]=r623;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r619;r259=r84;r260=r82;r261=r81;r262=r84;r263=r619;r264=r89;r265=r90;r266=r190;r267=r624;r268=r523;r269=r95;r270=r322;r271=r244;r272=r245;r273=r99;r274=r100;r275=r101;break L15}}r625=(r600|0)==0;if(r625){r13=187;break L1}r626=(r83|0)==-2;r627=r626?-1:r83;r628=(r286|0)==(r425|0);r629=r628?110:111;r630=r244+1|0;HEAP8[r244]=r629;if(r38){r631=(r286|0)==0;L229:do{if(!r631){r632=0;while(1){r633=r632>>>0<32;if(!r633){break L229}r634=r19+r632|0;r635=HEAP8[r634];r636=~r635;HEAP8[r634]=r636;r637=r632+1|0;r632=r637}}}while(0);_memcpy(r630,r43,32)|0}r638=r244+33|0;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r627;r259=r84;r260=r82;r261=r81;r262=r84;r263=r627;r264=r89;r265=r90;r266=r190;r267=r638;r268=r424;r269=r95;r270=r601;r271=r244;r272=r245;r273=r99;r274=r100;r275=r101;break L15;break};case 94:{r639=r90&2;r640=(r639|0)==0;if(r640){r641=r244+1|0;HEAP8[r244]=27;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r83;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r190;r267=r641;r268=r94;r269=r95;r270=r108;r271=0;r272=r245;r273=r99;r274=r100;r275=r101;break L15}else{r642=(r83|0)==-2;r643=r642?-1:r83;r644=r244+1|0;HEAP8[r244]=28;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r643;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r190;r267=r644;r268=r94;r269=r95;r270=r108;r271=0;r272=r245;r273=r99;r274=r100;r275=r101;break L15}break};case 36:{r645=r90>>>1;r646=r645&1;r647=r646+25|0;r648=r647&255;r649=r244+1|0;HEAP8[r244]=r648;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r83;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r190;r267=r649;r268=r94;r269=r95;r270=r108;r271=0;r272=r245;r273=r99;r274=r100;r275=r101;break L15;break};case 46:{r650=(r83|0)==-2;r651=r650?-1:r83;r652=r90>>>2;r653=r652&1;r654=r653|12;r655=r654&255;r656=r244+1|0;HEAP8[r244]=r655;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r651;r259=r84;r260=r82;r261=r81;r262=r84;r263=r651;r264=r89;r265=r90;r266=r190;r267=r656;r268=r94;r269=r95;r270=r108;r271=r244;r272=r245;r273=r99;r274=r100;r275=r101;break L15;break};case 123:{r657=(r192|0)==0;if(r657){r658=r190;r659=123;r660=r244;r661=r245;r13=718;break L15}r662=HEAP32[r17>>2];r663=r662;r664=0;while(1){r665=r663+1|0;r666=HEAP8[r665];r667=(r666&255)>47;r668=(r666&255)<58;r669=r667&r668;if(!r669){break}r670=r664*10&-1;r671=r666&255;r672=r671-48|0;r673=r670+r672|0;r663=r665;r664=r673}r674=(r664|0)<0;r675=(r664|0)>65535;r676=r674|r675;if(r676){r13=199;break L1}r677=r666<<24>>24==125;do{if(r677){r678=r665;r679=r664}else{r680=r663+2|0;r681=HEAP8[r680];r682=r681<<24>>24==125;if(r682){r678=r680;r679=-1;break}else{r683=0;r684=r680;r685=r681}while(1){r686=(r685&255)>47;r687=(r685&255)<58;r688=r686&r687;if(!r688){break}r689=r683*10&-1;r690=r684+1|0;r691=r685&255;r692=r691-48|0;r693=r689+r692|0;r694=HEAP8[r690];r683=r693;r684=r690;r685=r694}r695=(r683|0)<0;r696=(r683|0)>65535;r697=r695|r696;if(r697){r13=205;break L1}r698=(r683|0)<(r664|0);if(r698){r13=207;break L1}else{r678=r684;r679=r683}}}while(0);r699=HEAP32[r4>>2];r700=(r699|0)==0;HEAP32[r17>>2]=r678;if(r700){r701=r664;r702=r679;r13=212}else{break L1}break};case 0:case 124:case 41:{r13=47;break L1;break};case 93:{r703=HEAP32[r42>>2];r704=r703&33554432;r705=(r704|0)==0;if(r705){r658=r190;r659=93;r660=r244;r661=r245;r13=718;break L15}else{r13=57;break L1}break};case 43:{r701=1;r702=-1;r13=212;break};case 63:{r701=0;r702=1;r13=212;break};case 42:{r701=0;r702=-1;r13=212;break};case 40:{r706=HEAP32[r39>>2];r707=HEAP32[r17>>2];r708=r707+1|0;HEAP32[r17>>2]=r708;r709=HEAP8[r708];L260:do{if(r709<<24>>24==42){r710=r707+2|0;r711=HEAP8[r710];r712=r711<<24>>24==58;do{if(r712){r713=HEAP32[r53>>2];r714=r713}else{r715=r711&255;r716=HEAP32[r53>>2];r717=r716+r715|0;r718=HEAP8[r717];r719=r718&2;r720=r719<<24>>24==0;if(!r720){r714=r716;break}r721=r709<<24>>24==63;if(r721){r13=409;break L260}else{r13=639;break L260}}}while(0);r722=r708;while(1){r723=r722+1|0;HEAP32[r17>>2]=r723;r724=HEAP8[r723];r725=r724&255;r726=r714+r725|0;r727=HEAP8[r726];r728=r727&2;r729=r728<<24>>24==0;if(r729){break}else{r722=r723}}r730=r723;r731=r710;r732=r730-r731|0;r733=r724<<24>>24==58;if(r733){r734=r722+2|0;r735=r734;while(1){HEAP32[r17>>2]=r735;r736=HEAP8[r735];if(r736<<24>>24==0|r736<<24>>24==41){break}r737=r735+1|0;r735=r737}r738=r735;r739=r734;r740=r738-r739|0;r741=r740>>>0>255;if(r741){r13=382;break L1}else{r742=r734;r743=r740;r744=r736}}else{r742=0;r743=0;r744=r724}r745=r744<<24>>24==41;if(r745){r746=0;r747=120}else{r13=384;break L1}while(1){r748=(r746|0)<9;if(!r748){r13=407;break L1}r749=8+(r746*12&-1)|0;r750=HEAP32[r749>>2];r751=(r732|0)==(r750|0);if(r751){r752=_strncmp(r710,r747,r732);r753=(r752|0)==0;if(r753){break}}r754=r750+1|0;r755=r747+r754|0;r756=r746+1|0;r746=r756;r747=r755}r757=(r746|0)==2;r758=(r743|0)==0;do{if(r757){if(!r758){r13=390;break L1}HEAP32[r59>>2]=1;r759=r60;r760=r244;while(1){r761=HEAP32[r759>>2];r762=(r761|0)==0;if(r762){break}r763=r760+1|0;HEAP8[r760]=-96;r764=r761+4|0;r765=HEAP16[r764>>1];r766=(r765&65535)>>>8;r767=r766&255;HEAP8[r763]=r767;r768=HEAP16[r764>>1];r769=r768&255;r770=r760+2|0;HEAP8[r770]=r769;r771=r760+3|0;r772=r761|0;r759=r772;r760=r771}r773=HEAP32[r61>>2];r774=(r773|0)>0;r775=r774?-97:-98;r776=r760+1|0;HEAP8[r760]=r775;r777=r775&255;r778=(r83|0)==-2;if(r778){r779=r777;r780=-1;r781=r776;r13=402}else{r782=r777;r783=r83;r784=r776}}else{if(r758){r785=r746>>>0<2;if(r785){r13=397;break L1}r786=12+(r746*12&-1)|0;r787=HEAP32[r786>>2];r788=r787&255;r789=r244+1|0;HEAP8[r244]=r788;r790=r787&255;r782=r790;r783=r83;r784=r789;break}else{r791=r746-2|0;r792=r791>>>0<4;if(r792){r13=400;break L1}r793=16+(r746*12&-1)|0;r794=HEAP32[r793>>2];r795=r794&255;r796=r244+1|0;HEAP8[r244]=r795;r797=r794&255;r798=r743&255;r799=r244+2|0;HEAP8[r796]=r798;_memcpy(r799,r742,r743)|0;r800=r743+2|0;r801=r244+r800|0;r802=r743+3|0;r803=r244+r802|0;HEAP8[r801]=0;r779=r797;r780=r83;r781=r803;r13=402;break}}}while(0);if(r13==402){r13=0;r782=r779;r783=r780;r784=r781}switch(r782|0){case 154:case 155:{r804=HEAP32[r49>>2];r805=r804|4096;HEAP32[r49>>2]=r805;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r783;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r190;r267=r784;r268=r94;r269=r95;r270=r108;r271=0;r272=r245;r273=r706;r274=r100;r275=r101;break L15;break};case 150:case 151:case 152:case 153:{HEAP32[r62>>2]=1;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r783;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r190;r267=r784;r268=r94;r269=r95;r270=r108;r271=0;r272=r245;r273=r706;r274=r100;r275=r101;break L15;break};default:{r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r783;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r190;r267=r784;r268=r94;r269=r95;r270=r108;r271=0;r272=r245;r273=r706;r274=r100;r275=r101;break L15}}}else if(r709<<24>>24==63){r13=409}else{r13=639}}while(0);if(r13==409){r13=0;r806=r707+2|0;HEAP32[r17>>2]=r806;r807=HEAP8[r806];r808=r807&255;L305:do{switch(r808|0){case 35:{r809=r806;while(1){r810=r809+1|0;HEAP32[r17>>2]=r810;r811=HEAP8[r810];if(r811<<24>>24==0){r13=411;break L1}else if(r811<<24>>24==41){r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r83;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r190;r267=r244;r268=r94;r269=r95;r270=r108;r271=r119;r272=r245;r273=r706;r274=r100;r275=r101;break L15}else{r809=r810}}break};case 124:{r812=1;r13=413;break};case 58:{r812=0;r13=413;break};case 40:{HEAP32[r18>>2]=r806;r813=r707+3|0;r814=HEAP8[r813];r815=r814<<24>>24==63;L310:do{if(r815){r816=r707+4|0;r817=HEAP8[r816];r818=r817<<24>>24==67;L312:do{if(r818){r819=3;while(1){r820=r819+2|0;r821=r707+r820|0;r822=HEAP8[r821];r823=(r822&255)>47;if(!r823){break}r824=(r822&255)<58;if(!r824){r825=r806;break L312}r826=r819+1|0;r819=r826}r827=r822<<24>>24==41;if(!r827){r825=r806;break}r828=r819+3|0;r829=r707+r828|0;HEAP32[r18>>2]=r829;r830=r819+4|0;r831=r707+r830|0;r832=HEAP8[r831];r833=r832<<24>>24==63;if(r833){r825=r829}else{break L310}}else{r825=r806}}while(0);r834=r825+2|0;r835=HEAP8[r834];if(r835<<24>>24==61|r835<<24>>24==33|r835<<24>>24==60){r836=135;r837=r78;r838=r83;r839=r85;r840=r86;r841=r87;r842=r88;r843=r706;r844=0;r845=0;r846=r90;break L58}}}while(0);r847=r244+3|0;HEAP8[r847]=-115;r848=HEAP32[r17>>2];r849=r848+1|0;HEAP32[r17>>2]=r849;r850=HEAP8[r849];L321:do{switch(r850<<24>>24){case 82:{r851=r848+2|0;r852=HEAP8[r851];r853=r852<<24>>24==38;if(!r853){r854=0;r13=432;break L321}r855=r848+3|0;HEAP32[r17>>2]=r855;HEAP8[r847]=-113;r854=-1;r13=432;break};case 60:{r856=r848+2|0;HEAP32[r17>>2]=r856;r854=62;r13=432;break};case 39:{r857=r848+2|0;HEAP32[r17>>2]=r857;r854=39;r13=432;break};case 45:case 43:{r858=r848+2|0;HEAP32[r17>>2]=r858;r859=HEAP8[r849];r860=r859&255;r861=r860;r862=r858;r13=429;break};default:{r863=(r850&255)>47;r864=(r850&255)<58;r865=r863&r864;if(r865){r861=0;r862=r849;r13=429}else{r854=0;r13=432}}}}while(0);L328:do{if(r13==429){r13=0;r866=0;r867=r862;while(1){r868=HEAP8[r867];r869=(r868&255)>47;r870=(r868&255)<58;r871=r869&r870;if(!r871){r872=r867;r873=r866;r874=r861;r875=0;r876=-1;r877=0;break L328}r878=r866*10&-1;r879=r868&255;r880=r879-48|0;r881=r878+r880|0;r882=r867+1|0;HEAP32[r17>>2]=r882;r866=r881;r867=r882}}else if(r13==432){r13=0;r883=HEAP32[r17>>2];r884=HEAP8[r883];r885=(r884&255)>47;r886=(r884&255)<58;r887=r885&r886;if(r887){r13=433;break L1}r888=r884&255;r889=HEAP32[r53>>2];r890=r889+r888|0;r891=HEAP8[r890];r892=r891&16;r893=r892<<24>>24==0;if(r893){r13=435;break L1}else{r894=r883}while(1){r895=r894+1|0;HEAP32[r17>>2]=r895;r896=HEAP8[r895];r897=r896&255;r898=r889+r897|0;r899=HEAP8[r898];r900=r899&16;r901=r900<<24>>24==0;if(r901){break}else{r894=r895}}r902=r895;r903=r883;r904=r902-r903|0;if(r38){r905=r883;r906=r904;r907=r854;r908=-1;r909=0;r910=r895}else{r911=HEAP32[r12>>2];r912=r911+2|0;HEAP32[r12>>2]=r912;r905=r883;r906=r904;r907=r854;r908=-1;r909=0;r910=r895}r913=(r907|0)>0;if(!r913){r872=r910;r873=r909;r874=r908;r875=r907;r876=r906;r877=r905;break}r914=r910+1|0;HEAP32[r17>>2]=r914;r915=HEAP8[r910];r916=r907&255;r917=r915<<24>>24==r916<<24>>24;if(r917){r872=r914;r873=r909;r874=r908;r875=r907;r876=r906;r877=r905}else{r918=r914;r13=442;break L1}}}while(0);r919=r872+1|0;HEAP32[r17>>2]=r919;r920=HEAP8[r872];r921=r920<<24>>24==41;if(!r921){r918=r919;r13=442;break L1}if(!r38){r836=135;r837=r78;r838=r83;r839=r85;r840=r86;r841=r87;r842=r88;r843=r706;r844=0;r845=3;r846=r90;break L58}r922=(r874|0)>-1;if(r922){r923=(r873|0)<1;if(r923){r13=446;break L1}if((r874|0)==45){r924=HEAP32[r48>>2];r925=r924-r873|0;r926=r925+1|0;r927=r926}else if((r874|0)==0){r927=r873}else{r928=HEAP32[r48>>2];r929=r873+r928|0;r927=r929}r930=(r927|0)<1;if(r930){r13=452;break L1}r931=HEAP32[r63>>2];r932=(r927|0)>(r931|0);if(r932){r13=452;break L1}r933=r927>>>8;r934=r933&255;r935=r244+4|0;HEAP8[r935]=r934;r936=r927&255;r937=r244+5|0;HEAP8[r937]=r936;r836=135;r837=r78;r838=r83;r839=r85;r840=r86;r841=r87;r842=r88;r843=r706;r844=0;r845=3;r846=r90;break L58}r938=HEAP32[r64>>2];r939=0;r940=r938;while(1){r941=HEAP32[r65>>2];r942=(r939|0)<(r941|0);if(!r942){r943=r941;break}r944=r940+2|0;r945=_strncmp(r877,r944,r876);r946=(r945|0)==0;if(r946){r13=457;break}r947=HEAP32[r66>>2];r948=r940+r947|0;r949=r939+1|0;r939=r949;r940=r948}if(r13==457){r13=0;r950=HEAP32[r65>>2];r943=r950}r951=(r939|0)<(r943|0);if(r951){r952=HEAP8[r940];r953=r940+1|0;r954=HEAP8[r953];r955=1;r956=r940;r957=r939;r958=r943;while(1){r959=r957+1|0;r960=(r959|0)<(r958|0);if(!r960){r961=r956;break}r962=HEAP32[r66>>2];r963=r956+r962|0;r964=r962+2|0;r965=r956+r964|0;r966=_strncmp(r877,r965,r876);r967=(r966|0)==0;if(!r967){r961=r963;break}r968=r955+1|0;r969=HEAP32[r65>>2];r955=r968;r956=r963;r957=r959;r958=r969}r970=(r955|0)>1;if(r970){r971=r939>>>8;r972=r971&255;r973=r244+4|0;HEAP8[r973]=r972;r974=r939&255;r975=r244+5|0;HEAP8[r975]=r974;r976=r955>>>8;r977=r976&255;r978=r244+6|0;HEAP8[r978]=r977;r979=r955&255;r980=r244+7|0;HEAP8[r980]=r979;r981=HEAP8[r847];r982=r981+1&255;HEAP8[r847]=r982;r836=135;r837=r961;r838=r83;r839=r85;r840=r86;r841=r87;r842=r88;r843=r706;r844=0;r845=5;r846=r90;break L58}else{r983=r244+4|0;HEAP8[r983]=r952;r984=r244+5|0;HEAP8[r984]=r954;r836=135;r837=r961;r838=r83;r839=r85;r840=r86;r841=r87;r842=r88;r843=r706;r844=0;r845=3;r846=r90;break L58}}r985=(r875|0)==0;if(!r985){r13=468;break L1}r986=HEAP8[r877];r987=r986<<24>>24==82;if(r987){r988=1;r989=0}else{r990=(r876|0)==6;if(!r990){r13=477;break L1}r991=_strncmp(r877,6432,6);r992=(r991|0)==0;if(!r992){r13=477;break L1}HEAP8[r847]=-111;r836=135;r837=r940;r838=r83;r839=r85;r840=r86;r841=r87;r842=r88;r843=r706;r844=0;r845=1;r846=r90;break L58}while(1){r993=(r988|0)<(r876|0);if(!r993){break}r994=r877+r988|0;r995=HEAP8[r994];r996=(r995&255)>47;r997=(r995&255)<58;r998=r996&r997;if(!r998){r13=472;break L1}r999=r989*10&-1;r1000=r995&255;r1001=r999+r1000|0;r1002=r1001-48|0;r1003=r988+1|0;r988=r1003;r989=r1002}r1004=(r989|0)==0;r1005=r989&255;r1006=r989>>>8;r1007=r1006&255;r1008=r1004?-1:r1005;r1009=r1004?-1:r1007;HEAP8[r847]=-113;r1010=r244+4|0;HEAP8[r1010]=r1009;r1011=r244+5|0;HEAP8[r1011]=r1008;r836=135;r837=r940;r838=r83;r839=r85;r840=r86;r841=r87;r842=r88;r843=r706;r844=0;r845=3;r846=r90;break L58;break};case 61:{r1012=HEAP32[r61>>2];r1013=r1012+1|0;HEAP32[r61>>2]=r1013;r1014=r707+3|0;HEAP32[r17>>2]=r1014;r836=125;r837=r78;r838=r83;r839=r85;r840=r86;r841=r87;r842=r88;r843=r706;r844=0;r845=0;r846=r90;break L58;break};case 33:{r1015=r707+3|0;HEAP32[r17>>2]=r1015;r1016=HEAP8[r1015];r1017=r1016<<24>>24==41;do{if(r1017){r1018=r707+4|0;r1019=HEAP8[r1018];if(r1019<<24>>24==123){r1020=r707+5|0;r1021=_is_counted_repeat(r1020);r1022=(r1021|0)==0;if(!r1022){break}}else if(r1019<<24>>24==42|r1019<<24>>24==43|r1019<<24>>24==63){break}r1023=r244+1|0;HEAP8[r244]=-99;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r83;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r190;r267=r1023;r268=r94;r269=r95;r270=r108;r271=0;r272=r245;r273=r706;r274=r100;r275=r101;break L15}}while(0);r1024=HEAP32[r61>>2];r1025=r1024+1|0;HEAP32[r61>>2]=r1025;r836=126;r837=r78;r838=r83;r839=r85;r840=r86;r841=r87;r842=r88;r843=r706;r844=0;r845=0;r846=r90;break L58;break};case 60:{r1026=r707+3|0;r1027=HEAP8[r1026];r1028=r1027&255;if((r1028|0)==33){r1029=128}else if((r1028|0)==61){r1029=127}else{r1030=HEAP32[r53>>2];r1031=r1030+r1028|0;r1032=HEAP8[r1031];r1033=r1032&16;r1034=r1033<<24>>24==0;if(r1034){r13=488;break L1}else{r1035=r806;r1036=r807;break L305}}r1037=HEAP32[r61>>2];r1038=r1037+1|0;HEAP32[r61>>2]=r1038;r1039=r707+4|0;HEAP32[r17>>2]=r1039;r836=r1029;r837=r78;r838=r83;r839=r85;r840=r86;r841=r87;r842=r88;r843=r706;r844=0;r845=0;r846=r90;break L58;break};case 62:{r1040=r707+3|0;HEAP32[r17>>2]=r1040;r836=129;r837=r78;r838=r83;r839=r85;r840=r86;r841=r87;r842=r88;r843=r706;r844=0;r845=0;r846=r90;break L58;break};case 67:{r1041=r244+1|0;HEAP8[r244]=118;r1042=HEAP32[r17>>2];r1043=r1042+1|0;HEAP32[r17>>2]=r1043;r1044=0;r1045=r1043;while(1){r1046=HEAP8[r1045];r1047=(r1046&255)>47;if(!r1047){break}r1048=(r1046&255)<58;if(!r1048){r13=496;break L1}r1049=r1044*10&-1;r1050=r1045+1|0;HEAP32[r17>>2]=r1050;r1051=HEAP8[r1045];r1052=r1051&255;r1053=r1049+r1052|0;r1054=r1053-48|0;r1044=r1054;r1045=r1050}r1055=r1046<<24>>24==41;if(!r1055){r13=496;break L1}r1056=(r1044|0)>255;if(r1056){r13=498;break L1}r1057=r1044&255;r1058=r244+2|0;HEAP8[r1041]=r1057;r1059=HEAP32[r17>>2];r1060=HEAP32[r70>>2];r1061=r1059;r1062=r1060;r1063=r1061-r1062|0;r1064=r1063+1|0;r1065=r1064>>>8;r1066=r1065&255;HEAP8[r1058]=r1066;r1067=HEAP32[r17>>2];r1068=HEAP32[r70>>2];r1069=r1067;r1070=r1068;r1071=r1069-r1070|0;r1072=r1071+1|0;r1073=r1072&255;r1074=r244+3|0;HEAP8[r1074]=r1073;r1075=r244+4|0;HEAP8[r1075]=0;r1076=r244+5|0;HEAP8[r1076]=0;r1077=r244+6|0;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r83;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=1;r267=r1077;r268=r94;r269=r95;r270=r108;r271=0;r272=r244;r273=r706;r274=r100;r275=r101;break L15;break};case 80:{r1078=r707+3|0;HEAP32[r17>>2]=r1078;r1079=HEAP8[r1078];r1080=r1079<<24>>24==61;if(r1080){r1081=r83;r1082=r85;r1083=r86;r1084=r87;r1085=r88;r1086=r706;r1087=0;r1088=41;r1089=r1078;r13=538;break L58}if(r1079<<24>>24==60){r1035=r1078;r1036=60}else if(r1079<<24>>24==62){r1081=r83;r1082=r85;r1083=r86;r1084=r87;r1085=r88;r1086=r706;r1087=1;r1088=41;r1089=r1078;r13=538;break L58}else{r13=502;break L1}break};case 39:{r1035=r806;r1036=r807;break};case 38:{r1081=r83;r1082=r85;r1083=r86;r1084=r87;r1085=r88;r1086=r706;r1087=1;r1088=41;r1089=r806;r13=538;break L58;break};case 82:{r1090=r707+3|0;HEAP32[r17>>2]=r1090;r1091=r83;r1092=r85;r1093=r86;r1094=r87;r1095=r88;r1096=r706;r1097=41;r1098=r1090;r13=586;break L58;break};case 45:case 43:case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:{r1091=r83;r1092=r85;r1093=r86;r1094=r87;r1095=r88;r1096=r706;r1097=41;r1098=r806;r13=586;break L58;break};default:{r1099=r83;r1100=r85;r1101=r86;r1102=r87;r1103=r88;r1104=r706;r1105=r806;r1106=r807;r13=620;break L58}}}while(0);if(r13==413){r13=0;r1107=r707+3|0;HEAP32[r17>>2]=r1107;r836=131;r837=r78;r838=r83;r839=r85;r840=r86;r841=r87;r842=r88;r843=r706;r844=r812;r845=0;r846=r90;break L58}r1108=r1036<<24>>24==60;r1109=r1035+1|0;HEAP32[r17>>2]=r1109;r1110=HEAP8[r1109];r1111=(r1110&255)>47;r1112=(r1110&255)<58;r1113=r1111&r1112;if(r1113){r13=505;break L1}r1114=HEAP32[r53>>2];r1115=r1109;r1116=r1110;while(1){r1117=r1116&255;r1118=r1114+r1117|0;r1119=HEAP8[r1118];r1120=r1119&16;r1121=r1120<<24>>24==0;if(r1121){break}r1122=r1115+1|0;HEAP32[r17>>2]=r1122;r1123=HEAP8[r1122];r1115=r1122;r1116=r1123}r1124=r1115;r1125=r1109;r1126=r1124-r1125|0;do{if(!r38){r1127=HEAP32[r48>>2];r1128=r1127+1|0;r1129=r1108?62:39;r1130=r1116<<24>>24==r1129<<24>>24;if(!r1130){r13=510;break L1}r1131=HEAP32[r65>>2];r1132=(r1131|0)>9999;if(r1132){r13=512;break L1}r1133=r1126+3|0;r1134=HEAP32[r66>>2];r1135=(r1133|0)>(r1134|0);if(r1135){HEAP32[r66>>2]=r1133;r1136=(r1126|0)>32;if(r1136){r13=515;break L1}}r1137=HEAP32[r67>>2];r1138=r90&524288;r1139=(r1138|0)==0;r1140=r1137;r1141=0;r1142=r1131;L423:while(1){r1143=(r1141|0)<(r1142|0);if(!r1143){r1144=r1142;break}r1145=r1140+4|0;r1146=HEAP32[r1145>>2];r1147=(r1126|0)==(r1146|0);do{if(r1147){r1148=r1140|0;r1149=HEAP32[r1148>>2];r1150=_strncmp(r1109,r1149,r1126);r1151=(r1150|0)==0;if(!r1151){r13=525;break}r1152=r1140+8|0;r1153=HEAP32[r1152>>2];r1154=(r1153|0)==(r1128|0);if(r1154){r13=521;break L423}if(r1139){r13=523;break L1}HEAP32[r68>>2]=1}else{r13=525}}while(0);if(r13==525){r13=0;r1155=r1140+8|0;r1156=HEAP32[r1155>>2];r1157=(r1156|0)==(r1128|0);if(r1157){r13=526;break L1}}r1158=r1141+1|0;r1159=r1140+12|0;r1160=HEAP32[r65>>2];r1140=r1159;r1141=r1158;r1142=r1160}if(r13==521){r13=0;r1161=HEAP32[r65>>2];r1144=r1161}r1162=(r1141|0)<(r1144|0);if(r1162){break}r1163=HEAP32[r69>>2];r1164=(r1144|0)<(r1163|0);if(r1164){r1165=HEAP32[r67>>2];r1166=r1144;r1167=r1165}else{r1168=r1163<<1;r1169=r1163*24&-1;r1170=_malloc(r1169);r1171=r1170;r1172=(r1170|0)==0;if(r1172){r13=532;break L1}r1173=HEAP32[r67>>2];r1174=r1173;r1175=HEAP32[r69>>2];r1176=r1175*12&-1;_memcpy(r1170,r1174,r1176)|0;r1177=HEAP32[r69>>2];r1178=(r1177|0)>20;if(r1178){r1179=HEAP32[r67>>2];r1180=r1179;_free(r1180)}HEAP32[r67>>2]=r1171;HEAP32[r69>>2]=r1168;r1181=HEAP32[r65>>2];r1166=r1181;r1167=r1171}r1182=r1167+(r1166*12&-1)|0;HEAP32[r1182>>2]=r1109;r1183=HEAP32[r65>>2];r1184=HEAP32[r67>>2];r1185=r1184+(r1183*12&-1)+4|0;HEAP32[r1185>>2]=r1126;r1186=HEAP32[r65>>2];r1187=HEAP32[r67>>2];r1188=r1187+(r1186*12&-1)+8|0;HEAP32[r1188>>2]=r1128;r1189=HEAP32[r65>>2];r1190=r1189+1|0;HEAP32[r65>>2]=r1190}}while(0);r1191=HEAP32[r17>>2];r1192=r1191+1|0;HEAP32[r17>>2]=r1192}else if(r13==639){r13=0;r1193=r90&4096;r1194=(r1193|0)==0;if(!r1194){r836=131;r837=r78;r838=r83;r839=r85;r840=r86;r841=r87;r842=r88;r843=r706;r844=0;r845=0;r846=r90;break L58}}r1195=HEAP32[r48>>2];r1196=r1195+1|0;HEAP32[r48>>2]=r1196;r1197=r1196>>>8;r1198=r1197&255;r1199=r244+3|0;HEAP8[r1199]=r1198;r1200=HEAP32[r48>>2];r1201=r1200&255;r1202=r244+4|0;HEAP8[r1202]=r1201;r836=133;r837=r78;r838=r83;r839=r85;r840=r86;r841=r87;r842=r88;r843=r706;r844=0;r845=2;r846=r90;break};case 92:{r1203=HEAP32[r17>>2];HEAP32[r18>>2]=r1203;r1204=HEAP32[r48>>2];r1205=_check_escape(r17,r25,r4,r1204,r90,0);r1206=HEAP32[r4>>2];r1207=(r1206|0)==0;if(!r1207){break L1}if((r1205|0)==26){r1208=HEAP32[r17>>2];r1209=r1208+1|0;r1210=HEAP8[r1209];r1211=r1210<<24>>24==92;if(!r1211){r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r83;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r190;r267=r244;r268=1;r269=r95;r270=r108;r271=r119;r272=r245;r273=r99;r274=r100;r275=r101;break L15}r1212=r1208+2|0;r1213=HEAP8[r1212];r1214=r1213<<24>>24==69;if(!r1214){r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r83;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r190;r267=r244;r268=1;r269=r95;r270=r108;r271=r119;r272=r245;r273=r99;r274=r100;r275=r101;break L15}HEAP32[r17>>2]=r1212;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r83;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r190;r267=r244;r268=r94;r269=r95;r270=r108;r271=r119;r272=r245;r273=r99;r274=r100;r275=r101;break L15}else if((r1205|0)==0){r1215=HEAP32[r25>>2];r1216=r1215&255;HEAP8[r50]=r1216;r613=r190;r614=r244;r615=r94;r616=r108;r617=r245;r13=719;break L15}else if((r1205|0)==25){r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r83;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r190;r267=r244;r268=r94;r269=r95;r270=r108;r271=r119;r272=r245;r273=r99;r274=r100;r275=r101;break L15}else{r1217=(r83|0)==-2;do{if(r1217){r1218=(r1205|0)>5;if(!r1218){r1219=-2;r13=701;break}r1220=(r1205|0)<23;if(r1220){r1221=-1}else{r1222=-2;r13=686}}else{r1222=r83;r13=686}}while(0);do{if(r13==686){r13=0;r1223=(r1205|0)==27;if(!r1223){r1224=r1222;r1225=(r1205|0)==28;if(!r1225){r1219=r1224;r13=701;break}r1226=HEAP32[r17>>2];r1227=r1226+1|0;r1228=HEAP8[r1227];if(!(r1228<<24>>24==60|r1228<<24>>24==39|r1228<<24>>24==123)){HEAP32[r4>>2]=69;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r1224;r259=r84;r260=r82;r261=r81;r262=r84;r263=r1224;r264=r89;r265=r90;r266=r190;r267=r244;r268=r94;r269=r95;r270=r108;r271=r119;r272=r245;r273=r99;r274=r100;r275=r101;break L15}HEAP32[r17>>2]=r1227;r1229=HEAP8[r1227];r1230=r1229<<24>>24==60;if(r1230){r1081=r1224;r1082=r82;r1083=r81;r1084=r84;r1085=r1224;r1086=r99;r1087=0;r1088=62;r1089=r1227;r13=538;break L58}r1231=r1229<<24>>24==39;r1232=r1231?39:125;r1081=r1224;r1082=r82;r1083=r81;r1084=r84;r1085=r1224;r1086=r99;r1087=0;r1088=r1232;r1089=r1227;r13=538;break L58}r1233=HEAP32[r39>>2];r1234=HEAP32[r17>>2];r1235=r1234+1|0;HEAP32[r17>>2]=r1235;r1236=HEAP8[r1235];r1237=r1236<<24>>24==60;r1238=r1237?62:39;r1239=r1234+2|0;r1240=HEAP8[r1239];do{if(!(r1240<<24>>24==43|r1240<<24>>24==45)){r1241=(r1240&255)>47;r1242=(r1240&255)<58;r1243=r1241&r1242;if(r1243){break}r1244=r1238&255;r1081=r1222;r1082=r82;r1083=r81;r1084=r84;r1085=r1222;r1086=r1233;r1087=1;r1088=r1244;r1089=r1235;r13=538;break L58}}while(0);r1245=r1234+3|0;r1246=r1245;while(1){r1247=HEAP8[r1246];r1248=(r1247&255)>47;r1249=(r1247&255)<58;r1250=r1248&r1249;if(!r1250){break}r1251=r1246+1|0;r1246=r1251}r1252=r1238&255;r1253=r1247<<24>>24==r1252<<24>>24;if(r1253){HEAP32[r17>>2]=r1239;r1254=r1238&255;r1091=r1222;r1092=r82;r1093=r81;r1094=r84;r1095=r1222;r1096=r1233;r1097=r1254;r1098=r1239;r13=586;break L58}else{HEAP32[r4>>2]=57;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r1222;r259=r84;r260=r82;r261=r81;r262=r84;r263=r1222;r264=r89;r265=r90;r266=r190;r267=r244;r268=r94;r269=r95;r270=r108;r271=r119;r272=r245;r273=r1233;r274=r100;r275=r101;break L15}}}while(0);do{if(r13==701){r13=0;r1255=(r1205|0)<0;if(!r1255){r1221=r1219;break}r1256=-r1205|0;r1257=r78;r1258=r1219;r1259=r82;r1260=r81;r1261=r84;r1262=r1219;r1263=r99;r1264=r1256;r13=703;break L58}}while(0);L484:do{switch(r1205|0){case 22:case 15:case 16:{r13=710;break L1;break};case 5:case 4:case 1:{r1265=HEAP32[r76>>2];r1266=(r1265|0)==0;if(!r1266){r1267=0;r13=715;break L484}HEAP32[r76>>2]=1;r13=713;break};default:{r13=713}}}while(0);do{if(r13==713){r13=0;r1268=(r1205|0)>5;r1269=(r1205|0)<23;r1270=r1268&r1269;if(!r1270){r1267=0;r13=715;break}r1271=(r1205|0)==14;if(r1271){r1272=13;r1273=r244}else{r1267=r244;r13=715}}}while(0);if(r13==715){r13=0;r1274=r1205&255;r1272=r1274;r1273=r1267}r1275=r244+1|0;HEAP8[r244]=r1272;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r1221;r259=r84;r260=r82;r261=r81;r262=r84;r263=r1221;r264=r89;r265=r90;r266=r190;r267=r1275;r268=r94;r269=r95;r270=r108;r271=r1273;r272=r245;r273=r99;r274=r100;r275=r101;break L15}break};default:{r658=r190;r659=r246;r660=r244;r661=r245;r13=718;break L15}}}while(0);do{if(r13==212){r13=0;r1276=(r119|0)==0;if(r1276){r13=213;break L1}r1277=(r701|0)==0;r1278=r1277?r87:r84;r1279=r1277?r88:r83;r1280=r1277?r85:r82;r1281=r1277?r86:r81;r1282=(r701|0)==(r702|0);r1283=r1282?0:2;HEAP32[r16>>2]=r119;r1284=HEAP32[r17>>2];if(r144){r1285=r1284}else{r1286=r1284+1|0;r1287=r1286;L499:while(1){r1288=HEAP8[r1287];r1289=r1288&255;r1290=HEAP32[r53>>2];r1291=r1290+r1289|0;r1292=HEAP8[r1291];r1293=r1292&1;r1294=r1293<<24>>24==0;if(!r1294){r1295=r1287+1|0;r1287=r1295;continue}r1296=r1288<<24>>24==35;if(r1296){r1297=r1287}else{break}while(1){r1298=r1297+1|0;r1299=HEAP8[r1298];r1300=r1299<<24>>24==0;if(r1300){r1287=r1298;continue L499}r1301=HEAP32[r54>>2];r1302=(r1301|0)==0;r1303=HEAP32[r55>>2];if(!r1302){r1304=r1298>>>0<r1303>>>0;if(!r1304){r1297=r1298;continue}r1305=__pcre_is_newline(r1298,r1301,r1303,r56,0);r1306=(r1305|0)==0;if(r1306){r1297=r1298;continue}else{r13=223;break}}r1307=HEAP32[r56>>2];r1308=-r1307|0;r1309=r1303+r1308|0;r1310=r1298>>>0>r1309>>>0;if(r1310){r1297=r1298;continue}r1311=HEAP8[r57];r1312=r1299<<24>>24==r1311<<24>>24;if(!r1312){r1297=r1298;continue}r1313=(r1307|0)==1;if(r1313){r1314=1;break}r1315=r1297+2|0;r1316=HEAP8[r1315];r1317=HEAP8[r58];r1318=r1316<<24>>24==r1317<<24>>24;if(r1318){r1314=r1307;break}else{r1297=r1298}}if(r13==223){r13=0;r1319=HEAP32[r56>>2];r1314=r1319}r1320=r1314+1|0;r1321=r1297+r1320|0;r1287=r1321}r1322=r1287-1|0;HEAP32[r17>>2]=r1322;r1285=r1322}r1323=r1285+1|0;r1324=HEAP8[r1323];if(r1324<<24>>24==43){HEAP32[r17>>2]=r1323;r1325=0;r1326=1}else if(r1324<<24>>24==63){HEAP32[r17>>2]=r1323;r1325=r80;r1326=0}else{r1325=r79;r1326=0}r1327=HEAP8[r119];r1328=r1327<<24>>24==117;if(r1328){r1329=r119+3|0;HEAP8[r1329]=HEAP8[r119];HEAP8[r1329+1|0]=HEAP8[r119+1|0];HEAP8[r1329+2|0]=HEAP8[r119+2|0];HEAP8[r119]=-127;r1330=r119+1|0;HEAP8[r1330]=0;r1331=r119+2|0;HEAP8[r1331]=6;r1332=r119+6|0;HEAP8[r1332]=120;r1333=r119+7|0;HEAP8[r1333]=0;r1334=r119+8|0;HEAP8[r1334]=6;r1335=r244+6|0;HEAP32[r15>>2]=9;do{if(r38){r1336=HEAP32[r39>>2];r1337=HEAP32[r40>>2];r1338=r1337+2|0;r1339=r1336>>>0<r1338>>>0;if(r1339){break}r1340=r1336-2|0;r1341=HEAP8[r1340];r1342=r1341&255;r1343=r1342<<8;r1344=r1336-1|0;r1345=HEAP8[r1344];r1346=r1345&255;r1347=r1343|r1346;r1348=HEAP32[r51>>2];r1349=r1330;r1350=r1348;r1351=r1349-r1350|0;r1352=(r1347|0)==(r1351|0);if(!r1352){break}r1353=r1347+3|0;r1354=r1353>>>8;r1355=r1354&255;HEAP8[r1340]=r1355;r1356=r1353&255;r1357=HEAP32[r39>>2];r1358=r1357-1|0;HEAP8[r1358]=r1356}}while(0);r1359=HEAP8[r119];r1360=r1335;r1361=r1359}else{r1360=r244;r1361=r1327}r1362=r1361<<24>>24==29;L531:do{if(r1362){r1363=29;r13=243}else{r1364=r1361<<24>>24==30;if(r1364){r1363=30;r13=243;break}r1365=r1361<<24>>24==31;if(r1365){r1363=31;r13=243;break}r1366=r1361<<24>>24==32;if(r1366){r1363=32;r13=243;break}r1367=(r1361&255)<23;if(r1367){r1368=52;r1369=r1280;r1370=r1278;r1371=r1361;r1372=r1371<<24>>24==16;if(r1372){r1373=r1371;r1374=r1370;r1375=r1369;r1376=r1368}else{r1377=r1371;r1378=r1370;r1379=r1369;r1380=r1368;r1381=r1377<<24>>24==15;if(r1381){r1373=r1377;r1374=r1378;r1375=r1379;r1376=r1380}else{r1382=-1;r1383=-1;r1384=r1377;r1385=r1378;r1386=r1379;r1387=r1380;r13=253;break}}r1388=r119+1|0;r1389=HEAP8[r1388];r1390=r1389&255;r1391=r119+2|0;r1392=HEAP8[r1391];r1382=r1392;r1383=r1390;r1384=r1373;r1385=r1374;r1386=r1375;r1387=r1376;r13=253;break}switch(r1361<<24>>24){case 110:case 111:case 113:case 114:case 115:case 116:{r1393=(r702|0)==0;if(r1393){r1394=r1280;r1395=r1278;r1396=r119;r1397=r99;r1398=0;break L531}do{if(r1277){if((r702|0)==1){r13=283;break}else if((r702|0)!=-1){r13=284;break}r1399=r1325+98|0;r1400=r1399&255;r1401=r1360+1|0;HEAP8[r1360]=r1400;r1402=r1280;r1403=r1278;r1404=r1401;r1405=r99;r1406=-1;r13=358;break L531}else{r1407=r701;r1408=(r1407|0)==1;if(!r1408){r13=284;break}r1409=(r702|0)==-1;if(r1409){r1410=r1325+100|0;r1411=r1410&255;r1412=r1360+1|0;HEAP8[r1360]=r1411;r1402=r1280;r1403=r1278;r1404=r1412;r1405=r99;r1406=-1;r13=358;break L531}else{r1413=(r702|0)==1;r1414=r1277&r1413;if(r1414){r13=283;break}else{r13=284;break}}}}while(0);if(r13==283){r13=0;r1415=r1325+102|0;r1416=r1415&255;r1417=r1360+1|0;HEAP8[r1360]=r1416;r1402=r1280;r1403=r1278;r1404=r1417;r1405=r99;r1406=1;r13=358;break L531}else if(r13==284){r13=0;r1418=r1325+104|0;r1419=r1418&255;r1420=r1360+1|0;HEAP8[r1360]=r1419;r1421=r701>>>8;r1422=r1421&255;HEAP8[r1420]=r1422;r1423=r701&255;r1424=r1360+2|0;HEAP8[r1424]=r1423;r1425=r1360+3|0;r1426=(r702|0)==-1;r1427=r1426?0:r702;r1428=r1427>>>8;r1429=r1428&255;HEAP8[r1425]=r1429;r1430=r1427&255;r1431=r1360+4|0;HEAP8[r1431]=r1430;r1432=r1360+5|0;r1402=r1280;r1403=r1278;r1404=r1432;r1405=r99;r1406=r1427;r13=358;break L531}break};default:{}}r1433=(r1361&255)>124;if(!r1433){r13=357;break L1}r1434=(r1361&255)<136;if(!r1434){r1435=r1361<<24>>24==-99;if(r1435){r1394=r1280;r1395=r1278;r1396=r1360;r1397=r99;r1398=r702;break}else{r13=357;break L1}}r1436=r1360;r1437=r119;r1438=r1436-r1437|0;r1439=r1361<<24>>24==-121;do{if(r1439){r1440=r119+3|0;r1441=HEAP8[r1440];r1442=r1441<<24>>24==-111;if(r1442){r1394=r1280;r1395=r1278;r1396=r1360;r1397=r99;r1398=r702;break L531}else{r1443=r702}}else{r1444=(r1361&255)<129;if(!r1444){r1443=r702;break}r1445=(r701|0)>0;if(r1445){r1394=r1280;r1395=r1278;r1396=r1360;r1397=r99;r1398=r702;break L531}r1446=(r702|0)<0;r1447=(r702|0)>1;r1448=r1446|r1447;r1449=r1448?1:r702;r1443=r1449}}while(0);if(r1277){r1450=(r1443|0)<2;HEAP8[r1360]=0;do{if(r1450){_adjust_recurse(r119,1,0,r11,r99);r1451=r119+1|0;_memmove(r1451,r119,r1438,1,0);r1452=r1360+1|0;r1453=(r1443|0)==0;if(r1453){HEAP8[r119]=-95;r1394=r1280;r1395=r1278;r1396=r1452;r1397=r99;r1398=0;break L531}else{r1454=r1325+146|0;r1455=r1454&255;HEAP8[r119]=r1455;r1456=r1452;r1457=r1451;r1458=r119;r1459=0;break}}else{_adjust_recurse(r119,4,0,r11,r99);r1460=r119+4|0;_memmove(r1460,r119,r1438,1,0);r1461=r1360+4|0;r1462=r1325+146|0;r1463=r1462&255;r1464=r119+1|0;HEAP8[r119]=r1463;r1465=r119+2|0;HEAP8[r1464]=-125;HEAP8[r1465]=0;r1466=r119+3|0;HEAP8[r1466]=0;r1467=r119+4|0;r1456=r1461;r1457=r1467;r1458=0;r1459=r1465}}while(0);r1468=r1443-1|0;r1469=r1280;r1470=r1278;r1471=r1456;r1472=r1457;r1473=r1458;r1474=r1459;r1475=r99;r1476=r1468}else{r1477=(r701|0)>1;L577:do{if(r1477){if(!r38){r1478=r701-1|0;r1479=HEAP32[r15>>2];r1480=Math_imul(r1478,r1479)|0;r1481=r1478;r1482=(r1478|0)<0|0?-1:0;r1483=r1479;r1484=(r1479|0)<0|0?-1:0;r1485=___muldi3(r1481,r1482,r1483,r1484);r1486=tempRet0;r1487=2147483647;r1488=0;r1489=(r1486|0)>(r1488|0)|(r1486|0)==(r1488|0)&r1485>>>0>r1487>>>0;if(r1489){r13=303;break L1}r1490=HEAP32[r12>>2];r1491=2147483627-r1490|0;r1492=(r1491|0)<(r1480|0);if(r1492){r13=303;break L1}r1493=r1490+r1480|0;HEAP32[r12>>2]=r1493;r1494=r1280;r1495=r1278;r1496=r1360;r1497=r99;break}r1498=(r95|0)!=0;r1499=(r1278|0)<0;r1500=r1498&r1499;r1501=r1500?r1279:r1278;r1502=r1500?r1281:r1280;r1503=1;r1504=r1360;r1505=r99;while(1){r1506=(r1503|0)<(r701|0);if(!r1506){r1494=r1502;r1495=r1501;r1496=r1504;r1497=r1505;break L577}r1507=HEAP32[r39>>2];_memcpy(r1504,r119,r1438)|0;r1508=HEAP32[r40>>2];r1509=r1507;r1510=r1505;r1511=r1508;while(1){r1512=HEAP32[r39>>2];r1513=HEAP32[r41>>2];r1514=r1513-100|0;r1515=r1509;r1516=r1510;r1517=r1516-r1515|0;r1518=r1514+r1517|0;r1519=r1511+r1518|0;r1520=r1512>>>0>r1519>>>0;if(!r1520){r1521=r1510;r1522=r1512;break}r1523=r1511;r1524=_expand_workspace(r11);HEAP32[r4>>2]=r1524;r1525=(r1524|0)==0;if(!r1525){break L1}r1526=r1515-r1523|0;r1527=r1516-r1523|0;r1528=HEAP32[r40>>2];r1529=r1528+r1527|0;r1530=r1528+r1526|0;r1509=r1530;r1510=r1529;r1511=r1528}while(1){r1531=r1521>>>0<r1509>>>0;if(!r1531){break}r1532=HEAP8[r1521];r1533=r1532&255;r1534=r1533<<8;r1535=r1521+1|0;r1536=HEAP8[r1535];r1537=r1536&255;r1538=r1534|r1537;r1539=r1538+r1438|0;r1540=r1539>>>8;r1541=r1540&255;HEAP8[r1522]=r1541;r1542=HEAP8[r1535];r1543=r1542&255;r1544=r1543+r1438|0;r1545=r1544&255;r1546=HEAP32[r39>>2];r1547=r1546+1|0;HEAP8[r1547]=r1545;r1548=HEAP32[r39>>2];r1549=r1548+2|0;HEAP32[r39>>2]=r1549;r1550=r1521+2|0;r1521=r1550;r1522=r1549}r1551=r1504+r1438|0;r1552=r1503+1|0;r1503=r1552;r1504=r1551;r1505=r1509}}else{r1494=r1280;r1495=r1278;r1496=r1360;r1497=r99}}while(0);r1553=(r1443|0)>0;r1554=r1443-r701|0;r1555=r1553?r1554:r1443;r1469=r1494;r1470=r1495;r1471=r1496;r1472=r119;r1473=0;r1474=0;r1475=r1497;r1476=r1555}r1556=(r1476|0)>-1;if(!r1556){r1557=r1471-3|0;r1558=r1471-2|0;r1559=HEAP8[r1558];r1560=r1559&255;r1561=r1560<<8;r1562=r1471-1|0;r1563=HEAP8[r1562];r1564=r1563&255;r1565=r1561|r1564;r1566=-3-r1565|0;r1567=r1471+r1566|0;r1568=HEAP8[r1567];r1569=r1568+127&255;r1570=(r1569&255)<2;do{if(r1570){r1571=(r1326|0)==0;if(r1571){r1572=r1325+121|0;r1573=r1572&255;HEAP8[r1557]=r1573;r1402=r1469;r1403=r1470;r1404=r1471;r1405=r1475;r1406=r1476;r13=358;break L531}else{HEAP8[r1567]=-125;r1574=-125;break}}else{r1574=r1568}}while(0);L605:do{if(r38){r1575=r1567;while(1){r1576=_could_be_empty_branch(r1575,r1557,0,r11,0);r1577=(r1576|0)==0;if(!r1577){break}r1578=r1575+1|0;r1579=HEAP8[r1578];r1580=r1579&255;r1581=r1580<<8;r1582=r1575+2|0;r1583=HEAP8[r1582];r1584=r1583&255;r1585=r1581|r1584;r1586=r1575+r1585|0;r1587=HEAP8[r1586];r1588=r1587<<24>>24==119;if(r1588){r1575=r1586}else{r1589=r1574;break L605}}r1590=r1574+5&255;HEAP8[r1567]=r1590;r1589=r1590}else{r1589=r1574}}while(0);r1591=(r1326|0)==0;if(r1591){r1592=r1325+121|0;r1593=r1592&255;HEAP8[r1557]=r1593;r1394=r1469;r1395=r1470;r1396=r1471;r1397=r1475;r1398=r1476;break}if(r1589<<24>>24==-121|r1589<<24>>24==-116){r1594=-r1566|0;HEAP8[r1471]=0;_adjust_recurse(r1567,3,0,r11,r1475);r1595=r1566+3|0;r1596=r1471+r1595|0;_memmove(r1596,r1567,r1594,1,0);r1597=r1471+3|0;r1598=3-r1566|0;HEAP8[r1567]=-124;r1599=r1471+4|0;HEAP8[r1597]=123;r1600=r1598>>>8;r1601=r1600&255;HEAP8[r1599]=r1601;r1602=r1598&255;r1603=r1471+5|0;HEAP8[r1603]=r1602;r1604=r1471+6|0;r1605=r1566+1|0;r1606=r1471+r1605|0;HEAP8[r1606]=r1601;r1607=r1566+2|0;r1608=r1471+r1607|0;HEAP8[r1608]=r1602;r1609=r1604}else{r1610=r1589+1&255;HEAP8[r1567]=r1610;HEAP8[r1557]=123;r1609=r1471}r1611=(r1473|0)==0;if(!r1611){HEAP8[r1473]=-108}r1612=(r701|0)<2;if(r1612){r1394=r1469;r1395=r1470;r1396=r1609;r1397=r1475;r1398=r1476;break}else{r1402=r1469;r1403=r1470;r1404=r1609;r1405=r1475;r1406=r1476;r13=358;break}}r1613=r38^1;r1614=(r1476|0)>0;r1615=r1613&r1614;L622:do{if(r1615){r1616=HEAP32[r15>>2];r1617=r1616+7|0;r1618=Math_imul(r1476,r1617)|0;r1619=r1618-6|0;r1620=r1476;r1621=(r1476|0)<0|0?-1:0;r1622=r1617;r1623=(r1617|0)<0|0?-1:0;r1624=___muldi3(r1620,r1621,r1622,r1623);r1625=tempRet0;r1626=2147483647;r1627=0;r1628=(r1625|0)>(r1627|0)|(r1625|0)==(r1627|0)&r1624>>>0>r1626>>>0;if(r1628){r13=319;break L1}r1629=HEAP32[r12>>2];r1630=2147483627-r1629|0;r1631=(r1630|0)<(r1619|0);if(r1631){r13=319;break L1}r1632=r1629+r1619|0;HEAP32[r12>>2]=r1632;r1633=r1471;r1634=r1474;r1635=r1475}else{r1636=r1325+146|0;r1637=r1636&255;r1638=r1476;r1639=r1471;r1640=r1474;r1641=r1475;while(1){r1642=r1638-1|0;r1643=(r1638|0)>0;if(!r1643){r1633=r1639;r1634=r1640;r1635=r1641;break L622}r1644=HEAP32[r39>>2];r1645=r1639+1|0;HEAP8[r1639]=r1637;r1646=(r1642|0)==0;if(r1646){r1647=r1645;r1648=r1640}else{r1649=r1639+2|0;HEAP8[r1645]=-125;r1650=(r1640|0)==0;if(r1650){r1651=0;r1652=0}else{r1653=r1649;r1654=r1640;r1655=r1653-r1654|0;r1656=r1655&255;r1657=r1655>>>8;r1658=r1657&255;r1651=r1658;r1652=r1656}HEAP8[r1649]=r1651;r1659=r1639+3|0;HEAP8[r1659]=r1652;r1660=r1639+4|0;r1647=r1660;r1648=r1649}_memcpy(r1647,r1472,r1438)|0;r1661=HEAP32[r40>>2];r1662=r1644;r1663=r1641;r1664=r1661;while(1){r1665=HEAP32[r39>>2];r1666=HEAP32[r41>>2];r1667=r1666-100|0;r1668=r1662;r1669=r1663;r1670=r1669-r1668|0;r1671=r1667+r1670|0;r1672=r1664+r1671|0;r1673=r1665>>>0>r1672>>>0;if(!r1673){break}r1674=r1664;r1675=_expand_workspace(r11);HEAP32[r4>>2]=r1675;r1676=(r1675|0)==0;if(!r1676){break L1}r1677=r1668-r1674|0;r1678=r1669-r1674|0;r1679=HEAP32[r40>>2];r1680=r1679+r1678|0;r1681=r1679+r1677|0;r1662=r1681;r1663=r1680;r1664=r1679}r1682=(r1642|0)!=0;r1683=r1682?4:1;r1684=r1663;r1685=r1665;while(1){r1686=r1684>>>0<r1662>>>0;if(!r1686){break}r1687=HEAP8[r1684];r1688=r1687&255;r1689=r1688<<8;r1690=r1684+1|0;r1691=HEAP8[r1690];r1692=r1691&255;r1693=r1689|r1692;r1694=r1693+r1438|0;r1695=r1694+r1683|0;r1696=r1695>>>8;r1697=r1696&255;HEAP8[r1685]=r1697;r1698=HEAP8[r1690];r1699=r1698&255;r1700=r1699+r1438|0;r1701=r1700+r1683|0;r1702=r1701&255;r1703=HEAP32[r39>>2];r1704=r1703+1|0;HEAP8[r1704]=r1702;r1705=HEAP32[r39>>2];r1706=r1705+2|0;HEAP32[r39>>2]=r1706;r1707=r1684+2|0;r1684=r1707;r1685=r1706}r1708=r1647+r1438|0;r1638=r1642;r1639=r1708;r1640=r1648;r1641=r1662}}}while(0);r1709=r1633;r1710=r1634;while(1){r1711=(r1710|0)==0;if(r1711){r1402=r1469;r1403=r1470;r1404=r1709;r1405=r1635;r1406=r1476;r13=358;break L531}r1712=r1709;r1713=r1710;r1714=r1712-r1713|0;r1715=r1714+1|0;r1716=-r1714|0;r1717=r1709+r1716|0;r1718=HEAP8[r1717];r1719=r1718&255;r1720=r1719<<8;r1721=1-r1714|0;r1722=r1709+r1721|0;r1723=HEAP8[r1722];r1724=r1723&255;r1725=r1720|r1724;r1726=(r1725|0)==0;if(r1726){r1727=0}else{r1728=-r1725|0;r1729=r1710+r1728|0;r1727=r1729}r1730=r1709+1|0;HEAP8[r1709]=120;r1731=r1715>>>8;r1732=r1731&255;HEAP8[r1730]=r1732;r1733=r1715&255;r1734=r1709+2|0;HEAP8[r1734]=r1733;r1735=r1709+3|0;r1736=-r1714|0;r1737=r1709+r1736|0;HEAP8[r1737]=r1732;r1738=1-r1714|0;r1739=r1709+r1738|0;HEAP8[r1739]=r1733;r1709=r1735;r1710=r1727}}}while(0);do{if(r13==243){r13=0;r1740=r1363&255;if((r1740|0)==30){r1741=13}else if((r1740|0)==31){r1741=26}else if((r1740|0)==32){r1741=39}else{r1741=0}r1742=r1360-1|0;r1743=HEAP8[r1742];r1744=r1743&255;r1745=(r1363&255)<31;r1746=(r701|0)>1;r1747=r1745&r1746;if(!r1747){r1382=-1;r1383=-1;r1384=r1743;r1385=r1278;r1386=r1280;r1387=r1741;r13=253;break}r1748=HEAP32[r52>>2];r1749=r89|r1748;r1382=-1;r1383=-1;r1384=r1743;r1385=r1749;r1386=r1744;r1387=r1741;r13=253}}while(0);L660:do{if(r13==253){r13=0;r1750=(r702|0)==0;if(r1750){r1394=r1386;r1395=r1385;r1396=r119;r1397=r99;r1398=0;break}r1751=r1325+r1387|0;do{if(r1277){if((r702|0)==-1){r1752=r1751+33|0;r1753=r1752&255;r1754=r119+1|0;HEAP8[r119]=r1753;r1755=r1754;r1756=-1;break}else if((r702|0)==1){r1757=r1751+37|0;r1758=r1757&255;r1759=r119+1|0;HEAP8[r119]=r1758;r1755=r1759;r1756=1;break}else{r1760=r1751+39|0;r1761=r1760&255;r1762=r119+1|0;HEAP8[r119]=r1761;r1763=r702>>>8;r1764=r1763&255;HEAP8[r1762]=r1764;r1765=r702&255;r1766=r119+2|0;HEAP8[r1766]=r1765;r1767=r119+3|0;r1755=r1767;r1756=r702;break}}else{r1768=(r701|0)==1;if(r1768){if((r702|0)==-1){r1769=r1751+35|0;r1770=r1769&255;r1771=r119+1|0;HEAP8[r119]=r1770;r1755=r1771;r1756=-1;break}else if((r702|0)==1){r1394=r1386;r1395=r1385;r1396=r1360;r1397=r99;r1398=1;break L660}else{r1772=r1751+39|0;r1773=r1772&255;r1774=r1360+1|0;HEAP8[r1360]=r1773;r1775=r702+65535|0;r1776=r1775>>>8;r1777=r1776&255;HEAP8[r1774]=r1777;r1778=r702+255|0;r1779=r1778&255;r1780=r1360+2|0;HEAP8[r1780]=r1779;r1781=r1360+3|0;r1755=r1781;r1756=r702;break}}r1782=r1387+41|0;r1783=r1782&255;r1784=r119+1|0;HEAP8[r119]=r1783;r1785=r701>>>8;r1786=r1785&255;HEAP8[r1784]=r1786;r1787=r701&255;r1788=r119+2|0;HEAP8[r1788]=r1787;r1789=r119+3|0;r1790=(r702|0)<0;if(r1790){r1791=r119+4|0;HEAP8[r1789]=r1384;r1792=(r1383|0)>-1;if(r1792){r1793=r1383&255;r1794=r119+5|0;HEAP8[r1791]=r1793;r1795=r119+6|0;HEAP8[r1794]=r1382;r1796=r1795}else{r1796=r1791}r1797=r1751+33|0;r1798=r1797&255;r1799=r1796+1|0;HEAP8[r1796]=r1798;r1755=r1799;r1756=r702;break}if(r1282){r1755=r1789;r1756=r702;break}r1800=r119+4|0;HEAP8[r1789]=r1384;r1801=(r1383|0)>-1;if(r1801){r1802=r1383&255;r1803=r119+5|0;HEAP8[r1800]=r1802;r1804=r119+6|0;HEAP8[r1803]=r1382;r1805=r1804}else{r1805=r1800}r1806=r702-r701|0;r1807=(r1806|0)==1;if(r1807){r1808=r1751+37|0;r1809=r1808&255;r1810=r1805+1|0;HEAP8[r1805]=r1809;r1755=r1810;r1756=1;break}else{r1811=r1751+39|0;r1812=r1811&255;r1813=r1805+1|0;HEAP8[r1805]=r1812;r1814=r1806>>>8;r1815=r1814&255;HEAP8[r1813]=r1815;r1816=r1806&255;r1817=r1805+2|0;HEAP8[r1817]=r1816;r1818=r1805+3|0;r1755=r1818;r1756=r1806;break}}}while(0);r1819=r1755+1|0;HEAP8[r1755]=r1384;r1402=r1386;r1403=r1385;r1404=r1819;r1405=r99;r1406=r1756;r13=358}}while(0);L690:do{if(r13==358){r13=0;r1820=(r1326|0)==0;if(r1820){r1394=r1402;r1395=r1403;r1396=r1404;r1397=r1405;r1398=r1406;break}r1821=HEAP32[r16>>2];r1822=HEAP8[r1821];r1823=r1822&255;switch(r1823|0){case 93:{r1824=r1821+3|0;r1825=HEAP8[r1824];r1826=r1825<<24>>24==16;if(r1826){r1827=6}else{r1828=r1825<<24>>24==15;r1829=r1828?6:4;r1827=r1829}r1830=r1821+r1827|0;HEAP32[r16>>2]=r1830;r1831=r1830;break};case 29:case 30:case 31:case 32:case 41:case 54:case 67:case 80:{r1832=r1823+8720|0;r1833=HEAP8[r1832];r1834=r1833&255;r1835=r1821+r1834|0;HEAP32[r16>>2]=r1835;r1831=r1835;break};case 110:case 111:{r1836=r1821+33|0;HEAP32[r16>>2]=r1836;r1831=r1836;break};default:{r1831=r1821}}r1837=r1404;r1838=r1831;r1839=r1837-r1838|0;r1840=(r1839|0)>0;if(!r1840){r1394=r1402;r1395=r1403;r1396=r1404;r1397=r1405;r1398=r1406;break}r1841=HEAP8[r1831];r1842=(r1841&255)<118;do{if(r1842){r1843=r1841&255;r1844=r1843+576|0;r1845=HEAP8[r1844];r1846=r1845<<24>>24==0;if(r1846){break}HEAP8[r1831]=r1845;r1394=r1402;r1395=r1403;r1396=r1404;r1397=r1405;r1398=r1406;break L690}}while(0);HEAP8[r1404]=0;r1847=HEAP32[r16>>2];_adjust_recurse(r1847,3,0,r11,r1405);r1848=r1847+3|0;_memmove(r1848,r1847,r1839,1,0);r1849=r1404+3|0;r1850=r1839+3|0;HEAP8[r1847]=-127;r1851=r1404+4|0;HEAP8[r1849]=120;r1852=r1850>>>8;r1853=r1852&255;HEAP8[r1851]=r1853;r1854=r1850&255;r1855=r1404+5|0;HEAP8[r1855]=r1854;r1856=r1404+6|0;r1857=HEAP32[r16>>2];r1858=r1857+1|0;HEAP8[r1858]=r1853;r1859=r1857+2|0;HEAP8[r1859]=r1854;r1394=r1402;r1395=r1403;r1396=r1856;r1397=r1405;r1398=r1406}}while(0);r1860=HEAP32[r52>>2];r1861=r1860|r1283;HEAP32[r52>>2]=r1861;r253=r78;r254=r79;r255=r80;r256=r1281;r257=r1394;r258=r1279;r259=r1395;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r190;r267=r1396;r268=r94;r269=r95;r270=r108;r271=0;r272=r245;r273=r1397;r274=r701;r275=r1398;break L15}else if(r13==538){r13=0;r1862=r1089+1|0;HEAP32[r17>>2]=r1862;r1863=HEAP8[r1862];r1864=(r1863&255)>47;r1865=(r1863&255)<58;r1866=r1864&r1865;if(r1866){r13=540;break L1}r1867=HEAP32[r53>>2];r1868=r1862;r1869=r1863;while(1){r1870=r1869&255;r1871=r1867+r1870|0;r1872=HEAP8[r1871];r1873=r1872&16;r1874=r1873<<24>>24==0;if(r1874){break}r1875=r1868+1|0;HEAP32[r17>>2]=r1875;r1876=HEAP8[r1875];r1868=r1875;r1869=r1876}r1877=r1868;r1878=r1862;r1879=r1877-r1878|0;if(r38){r1880=HEAP32[r64>>2];r1881=r1879+2|0;r1882=0;r1883=r1880;while(1){r1884=HEAP32[r65>>2];r1885=(r1882|0)<(r1884|0);if(!r1885){r1886=r1884;break}r1887=r1883+2|0;r1888=_strncmp(r1862,r1887,r1879);r1889=(r1888|0)==0;if(r1889){r1890=r1883+r1881|0;r1891=HEAP8[r1890];r1892=r1891<<24>>24==0;if(r1892){r13=564;break}}r1893=HEAP32[r66>>2];r1894=r1883+r1893|0;r1895=r1882+1|0;r1882=r1895;r1883=r1894}if(r13==564){r13=0;r1896=HEAP32[r65>>2];r1886=r1896}r1897=(r1882|0)<(r1886|0);if(!r1897){r13=567;break L1}r1898=HEAP8[r1883];r1899=r1898&255;r1900=r1899<<8;r1901=r1883+1|0;r1902=HEAP8[r1901];r1903=r1902&255;r1904=r1900|r1903;r1905=(r1087|0)==0;if(r1905){r1906=r1886;r1907=r1904;r1908=r1882;r1909=r1883}else{r1910=r1883;r1911=r1081;r1912=r1082;r1913=r1083;r1914=r1084;r1915=r1085;r1916=r1086;r1917=r1904;r13=603;break}}else{r1918=(r1868|0)==(r1862|0);if(r1918){r13=545;break L1}r1919=r1869<<24>>24==r1088<<24>>24;if(!r1919){r13=547;break L1}r1920=(r1879|0)>32;if(r1920){r13=549;break L1}r1921=HEAP32[r67>>2];r1922=r1921;r1923=0;while(1){r1924=HEAP32[r65>>2];r1925=(r1923|0)<(r1924|0);if(!r1925){r1926=r1924;break}r1927=r1922+4|0;r1928=HEAP32[r1927>>2];r1929=(r1879|0)==(r1928|0);if(r1929){r1930=r1922|0;r1931=HEAP32[r1930>>2];r1932=_strncmp(r1862,r1931,r1879);r1933=(r1932|0)==0;if(r1933){r13=554;break}}r1934=r1923+1|0;r1935=r1922+12|0;r1922=r1935;r1923=r1934}if(r13==554){r13=0;r1936=HEAP32[r65>>2];r1926=r1936}r1937=(r1923|0)<(r1926|0);if(r1937){r1938=r1922+8|0;r1939=HEAP32[r1938>>2];r1940=r1939}else{r1940=0}r1941=(r1087|0)==0;if(!r1941){r1910=r78;r1911=r1081;r1912=r1082;r1913=r1083;r1914=r1084;r1915=r1085;r1916=r1086;r1917=r1940;r13=603;break}r1942=HEAP32[r74>>2];r1943=r1942+1|0;HEAP32[r74>>2]=r1943;r1906=r1926;r1907=r1940;r1908=r1923;r1909=r78}if(!r38){r1257=r1909;r1258=r1081;r1259=r1082;r1260=r1083;r1261=r1084;r1262=r1085;r1263=r1086;r1264=r1907;r13=703;break}r1944=HEAP32[r68>>2];r1945=(r1944|0)==0;if(r1945){r1257=r1909;r1258=r1081;r1259=r1082;r1260=r1083;r1261=r1084;r1262=r1085;r1263=r1086;r1264=r1907;r13=703;break}r1946=HEAP32[r66>>2];r1947=r1909+r1946|0;r1948=r1909+2|0;r1949=r1908;r1950=r1947;r1951=1;r1952=r1906;while(1){r1953=r1949+1|0;r1954=(r1953|0)<(r1952|0);if(!r1954){break}r1955=r1950+2|0;r1956=_strcmp(r1948,r1955);r1957=(r1956|0)==0;if(!r1957){break}r1958=r1951+1|0;r1959=HEAP32[r66>>2];r1960=r1950+r1959|0;r1961=HEAP32[r65>>2];r1949=r1953;r1950=r1960;r1951=r1958;r1952=r1961}r1962=(r1951|0)>1;if(!r1962){r1257=r1909;r1258=r1081;r1259=r1082;r1260=r1083;r1261=r1084;r1262=r1085;r1263=r1086;r1264=r1907;r13=703;break}r1963=(r1081|0)==-2;r1964=r1963?-1:r1081;r1965=r90&1;r1966=r1965+115|0;r1967=r1966&255;r1968=r244+1|0;HEAP8[r244]=r1967;r1969=r1908>>>8;r1970=r1969&255;HEAP8[r1968]=r1970;r1971=r1908&255;r1972=r244+2|0;HEAP8[r1972]=r1971;r1973=r244+3|0;r1974=r1951>>>8;r1975=r1974&255;HEAP8[r1973]=r1975;r1976=r1951&255;r1977=r244+4|0;HEAP8[r1977]=r1976;r1978=r244+5|0;r1979=r1909;while(1){r1980=r1979>>>0<r1950>>>0;if(!r1980){r253=r1979;r254=r79;r255=r80;r256=r81;r257=r82;r258=r1964;r259=r84;r260=r1082;r261=r1083;r262=r1084;r263=r1085;r264=r89;r265=r90;r266=r190;r267=r1978;r268=r94;r269=r95;r270=r108;r271=r244;r272=r245;r273=r1086;r274=r100;r275=r101;break L15}r1981=HEAP8[r1979];r1982=r1981&255;r1983=r1982<<8;r1984=r1979+1|0;r1985=HEAP8[r1984];r1986=r1985&255;r1987=r1983|r1986;r1988=r1987>>>0<32;r1989=1<<r1987;r1990=r1988?r1989:1;r1991=HEAP32[r72>>2];r1992=r1991|r1990;HEAP32[r72>>2]=r1992;r1993=HEAP32[r73>>2];r1994=(r1987|0)>(r1993|0);if(r1994){HEAP32[r73>>2]=r1987;r1995=r60}else{r1995=r60}while(1){r1996=HEAP32[r1995>>2];r1997=(r1996|0)==0;if(r1997){break}r1998=r1996+4|0;r1999=HEAP16[r1998>>1];r2000=r1999&65535;r2001=(r2000|0)==(r1987|0);if(r2001){r13=582;break}r2002=r1996|0;r1995=r2002}if(r13==582){r13=0;r2003=r1996+6|0;HEAP16[r2003>>1]=1}r2004=HEAP32[r66>>2];r2005=r1979+r2004|0;r1979=r2005}}else if(r13==586){r13=0;r2006=HEAP8[r1098];if(r2006<<24>>24==43){r2007=r1098+1|0;HEAP32[r17>>2]=r2007;r2008=HEAP8[r2007];r2009=(r2008&255)>47;r2010=(r2008&255)<58;r2011=r2009&r2010;if(r2011){r2012=0;r2013=r2007}else{r13=588;break L1}}else if(r2006<<24>>24==45){r2014=r1098+1|0;r2015=HEAP8[r2014];r2016=(r2015&255)>47;r2017=(r2015&255)<58;r2018=r2016&r2017;if(!r2018){r1099=r1091;r1100=r1092;r1101=r1093;r1102=r1094;r1103=r1095;r1104=r1096;r1105=r1098;r1106=r2006;r13=620;break}HEAP32[r17>>2]=r2014;r2012=0;r2013=r2014}else{r2012=0;r2013=r1098}while(1){r2019=HEAP8[r2013];r2020=(r2019&255)>47;r2021=(r2019&255)<58;r2022=r2020&r2021;if(!r2022){break}r2023=r2012*10&-1;r2024=r2013+1|0;HEAP32[r17>>2]=r2024;r2025=HEAP8[r2013];r2026=r2025&255;r2027=r2023+r2026|0;r2028=r2027-48|0;r2012=r2028;r2013=r2024}r2029=r2019<<24>>24==r1097<<24>>24;if(!r2029){r13=594;break L1}if(r2006<<24>>24==45){r2030=(r2012|0)==0;if(r2030){r13=597;break L1}r2031=HEAP32[r48>>2];r2032=r2031-r2012|0;r2033=r2032+1|0;r2034=(r2033|0)<1;if(r2034){r13=599;break L1}else{r1910=r78;r1911=r1091;r1912=r1092;r1913=r1093;r1914=r1094;r1915=r1095;r1916=r1096;r1917=r2033;r13=603;break}}else if(r2006<<24>>24==43){r2035=(r2012|0)==0;if(r2035){r13=601;break L1}r2036=HEAP32[r48>>2];r2037=r2012+r2036|0;r1910=r78;r1911=r1091;r1912=r1092;r1913=r1093;r1914=r1094;r1915=r1095;r1916=r1096;r1917=r2037;r13=603;break}else{r1910=r78;r1911=r1091;r1912=r1092;r1913=r1093;r1914=r1094;r1915=r1095;r1916=r1096;r1917=r2012;r13=603;break}}}while(0);do{if(r13==603){r13=0;r2038=HEAP32[r51>>2];L780:do{if(r38){HEAP8[r244]=0;r2039=(r1917|0)==0;if(r2039){r2040=r2038}else{r2041=HEAP32[r51>>2];r2042=__pcre_find_bracket(r2041,0,r1917);r2040=r2042}r2043=(r2040|0)==0;if(r2043){r2044=HEAP32[r63>>2];r2045=(r1917|0)>(r2044|0);if(r2045){r13=608;break L1}r2046=HEAP32[r51>>2];r2047=r2046+r1917|0;r2048=HEAP32[r39>>2];r2049=HEAP32[r40>>2];r2050=HEAP32[r41>>2];r2051=r2050-100|0;r2052=r2049+r2051|0;r2053=r2048>>>0<r2052>>>0;if(r2053){r2054=r2046;r2055=r2048}else{r2056=_expand_workspace(r11);HEAP32[r4>>2]=r2056;r2057=(r2056|0)==0;if(!r2057){break L1}r2058=HEAP32[r51>>2];r2059=HEAP32[r39>>2];r2054=r2058;r2055=r2059}r2060=r244+1|0;r2061=r2060;r2062=r2054;r2063=r2061-r2062|0;r2064=r2063>>>8;r2065=r2064&255;HEAP8[r2055]=r2065;r2066=HEAP32[r51>>2];r2067=r2066;r2068=r2061-r2067|0;r2069=r2068&255;r2070=HEAP32[r39>>2];r2071=r2070+1|0;HEAP8[r2071]=r2069;r2072=HEAP32[r39>>2];r2073=r2072+2|0;HEAP32[r39>>2]=r2073;r2074=r2047;break}else{r2075=r2040+1|0;r2076=HEAP8[r2075];r2077=r2076&255;r2078=r2077<<8;r2079=r2040+2|0;r2080=HEAP8[r2079];r2081=r2080&255;r2082=r2078|r2081;r2083=(r2082|0)==0;r2084=r2083^1;r2085=r75^1;r2086=r2084|r2085;if(r2086){r2074=r2040;break}else{r2087=r9}while(1){r2088=(r2087|0)==0;if(r2088){r13=618;break L1}r2089=r2087+4|0;r2090=HEAP32[r2089>>2];r2091=r2090>>>0<r2040>>>0;if(r2091){r13=618;break L1}r2092=_could_be_empty_branch(r2090,r244,0,r11,0);r2093=(r2092|0)==0;if(r2093){r2074=r2040;break L780}r2094=r2087|0;r2095=HEAP32[r2094>>2];r2087=r2095}}}else{r2074=r2038}}while(0);HEAP8[r244]=117;r2096=HEAP32[r51>>2];r2097=r2074;r2098=r2096;r2099=r2097-r2098|0;r2100=r2099>>>8;r2101=r2100&255;r2102=r244+1|0;HEAP8[r2102]=r2101;r2103=HEAP32[r51>>2];r2104=r2103;r2105=r2097-r2104|0;r2106=r2105&255;r2107=r244+2|0;HEAP8[r2107]=r2106;r2108=r244+3|0;r2109=(r1911|0)==-2;r2110=r2109?-1:r1911;r253=r1910;r254=r79;r255=r80;r256=r81;r257=r82;r258=r2110;r259=r84;r260=r1912;r261=r1913;r262=r1914;r263=r1915;r264=r89;r265=r90;r266=r190;r267=r2108;r268=r94;r269=0;r270=r108;r271=r244;r272=r245;r273=r1916;r274=r100;r275=r101;break L15}else if(r13==620){r13=0;HEAP32[r30>>2]=0;HEAP32[r29>>2]=0;r2111=r29;r2112=r1105;r2113=r1106;while(1){if(r2113<<24>>24==41){break}else if(r2113<<24>>24==58){r13=638;break}r2114=r2112+1|0;HEAP32[r17>>2]=r2114;r2115=HEAP8[r2112];r2116=r2115&255;switch(r2116|0){case 74:{r2117=HEAP32[r2111>>2];r2118=r2117|524288;HEAP32[r2111>>2]=r2118;r2119=HEAP32[r49>>2];r2120=r2119|1024;HEAP32[r49>>2]=r2120;r2121=r2111;break};case 105:{r2122=HEAP32[r2111>>2];r2123=r2122|1;HEAP32[r2111>>2]=r2123;r2121=r2111;break};case 109:{r2124=HEAP32[r2111>>2];r2125=r2124|2;HEAP32[r2111>>2]=r2125;r2121=r2111;break};case 115:{r2126=HEAP32[r2111>>2];r2127=r2126|4;HEAP32[r2111>>2]=r2127;r2121=r2111;break};case 120:{r2128=HEAP32[r2111>>2];r2129=r2128|8;HEAP32[r2111>>2]=r2129;r2121=r2111;break};case 85:{r2130=HEAP32[r2111>>2];r2131=r2130|512;HEAP32[r2111>>2]=r2131;r2121=r2111;break};case 88:{r2132=HEAP32[r2111>>2];r2133=r2132|64;HEAP32[r2111>>2]=r2133;r2121=r2111;break};case 45:{r2121=r30;break};default:{r13=631;break L1}}r2134=HEAP32[r17>>2];r2135=HEAP8[r2134];r2111=r2121;r2112=r2134;r2113=r2135}if(r13==638){r13=0;r2136=HEAP32[r29>>2];r2137=r90|r2136;r2138=HEAP32[r30>>2];r2139=~r2138;r2140=r2137&r2139;r2141=r2112+1|0;HEAP32[r17>>2]=r2141;r836=131;r837=r78;r838=r1099;r839=r1100;r840=r1101;r841=r1102;r842=r1103;r843=r1104;r844=0;r845=0;r846=r2140;break}r2142=HEAP32[r29>>2];r2143=r90|r2142;r2144=HEAP32[r30>>2];r2145=~r2144;r2146=r2143&r2145;r2147=HEAP32[r51>>2];r2148=r2147+3|0;r2149=(r244|0)==(r2148|0);do{if(r2149){if(!r38){r2150=HEAP32[r12>>2];r2151=(r2150|0)==6;if(!r2151){r13=636;break}}HEAP32[r42>>2]=r2146;r2152=r79;r2153=r80;r2154=r89;r2155=r2146}else{r13=636}}while(0);if(r13==636){r13=0;r2156=r2146>>>9;r2157=r2156&1;r2158=r2157^1;r2159=r2146&1;r2152=r2157;r2153=r2158;r2154=r2159;r2155=r2146}HEAP32[r1>>2]=r2155;r253=r78;r254=r2152;r255=r2153;r256=r81;r257=r82;r258=r1099;r259=r84;r260=r1100;r261=r1101;r262=r1102;r263=r1103;r264=r2154;r265=r2155;r266=r190;r267=r244;r268=r94;r269=r95;r270=r108;r271=0;r272=r245;r273=r1104;r274=r100;r275=r101;break L15}else if(r13==703){r13=0;r2160=(r1258|0)==-2;r2161=r2160?-1:r1258;r2162=r90&1;r2163=r2162+113|0;r2164=r2163&255;r2165=r244+1|0;HEAP8[r244]=r2164;r2166=r1264>>>8;r2167=r2166&255;HEAP8[r2165]=r2167;r2168=r1264&255;r2169=r244+2|0;HEAP8[r2169]=r2168;r2170=r244+3|0;r2171=(r1264|0)<32;r2172=1<<r1264;r2173=r2171?r2172:1;r2174=HEAP32[r72>>2];r2175=r2174|r2173;HEAP32[r72>>2]=r2175;r2176=HEAP32[r73>>2];r2177=(r1264|0)>(r2176|0);if(r2177){HEAP32[r73>>2]=r1264;r2178=r60}else{r2178=r60}while(1){r2179=HEAP32[r2178>>2];r2180=(r2179|0)==0;if(r2180){r253=r1257;r254=r79;r255=r80;r256=r81;r257=r82;r258=r2161;r259=r84;r260=r1259;r261=r1260;r262=r1261;r263=r1262;r264=r89;r265=r90;r266=r190;r267=r2170;r268=r94;r269=r95;r270=r108;r271=r244;r272=r245;r273=r1263;r274=r100;r275=r101;break L15}r2181=r2179+4|0;r2182=HEAP16[r2181>>1];r2183=r2182&65535;r2184=(r2183|0)==(r1264|0);if(r2184){break}r2185=r2179|0;r2178=r2185}r2186=r2179+6|0;HEAP16[r2186>>1]=1;r253=r1257;r254=r79;r255=r80;r256=r81;r257=r82;r258=r2161;r259=r84;r260=r1259;r261=r1260;r262=r1261;r263=r1262;r264=r89;r265=r90;r266=r190;r267=r2170;r268=r94;r269=r95;r270=r108;r271=r244;r272=r245;r273=r1263;r274=r100;r275=r101;break L15}}while(0);r2187=HEAP32[r71>>2];r2188=r2187+1|0;HEAP32[r71>>2]=r2188;r2189=(r2188|0)>250;if(r2189){r13=642;break L1}r2190=r836&255;HEAP8[r244]=r2190;HEAP32[r16>>2]=r244;r2191=HEAP32[r52>>2];r2192=HEAP32[r48>>2];HEAP32[r15>>2]=0;r2193=(r836|0)==127;if(r2193){r2194=1}else{r2195=(r836|0)==128;r2196=r2195&1;r2194=r2196}r2197=(r836|0)==135;r2198=r2197&1;r2199=r2198+r10|0;r2200=r38?0:r15;r2201=_compile_regex(r846,r16,r17,r4,r2194,r844,r845,r2199,r22,r24,r21,r23,r9,r11,r2200);r2202=(r2201|0)==0;if(r2202){break L1}r2203=HEAP32[r71>>2];r2204=r2203-1|0;HEAP32[r71>>2]=r2204;r2205=(r836|0)==129;do{if(r2205){r2206=HEAP32[r48>>2];r2207=r2206>>>0>r2192>>>0;if(r2207){break}HEAP8[r244]=-126;r13=649}else{r13=649}}while(0);do{if(r13==649){r13=0;r2208=(r836|0)<129;if(!r2208){break}r2209=HEAP32[r61>>2];r2210=r2209-1|0;HEAP32[r61>>2]=r2210}}while(0);r2211=r2197^1;r2212=r38^1;r2213=r2211|r2212;r2214=r2211?r836:135;do{if(r2213){r2215=r2214}else{r2216=0;r2217=r244;while(1){r2218=r2216+1|0;r2219=r2217+1|0;r2220=HEAP8[r2219];r2221=r2220&255;r2222=r2221<<8;r2223=r2217+2|0;r2224=HEAP8[r2223];r2225=r2224&255;r2226=r2222|r2225;r2227=r2217+r2226|0;r2228=HEAP8[r2227];r2229=r2228<<24>>24==120;if(r2229){break}else{r2216=r2218;r2217=r2227}}r2230=r244+3|0;r2231=HEAP8[r2230];r2232=r2231<<24>>24==-111;if(r2232){r2233=(r2216|0)>0;if(r2233){r13=655;break L1}else{r2215=145;break}}r2234=(r2218|0)>2;if(r2234){r13=657;break L1}r2235=(r2216|0)==0;if(!r2235){r2215=135;break}HEAP32[r23>>2]=-1;HEAP32[r24>>2]=-1;r2215=135}}while(0);r2236=HEAP32[r17>>2];r2237=HEAP8[r2236];r2238=r2237<<24>>24==41;if(!r2238){r13=661;break L1}if(!r38){r2239=HEAP32[r12>>2];r2240=2147483627-r2239|0;r2241=HEAP32[r15>>2];r2242=r2241-6|0;r2243=(r2240|0)<(r2242|0);if(r2243){r13=664;break L1}r2244=r2239+r2242|0;HEAP32[r12>>2]=r2244;r2245=r244+1|0;HEAP8[r2245]=0;r2246=r244+2|0;HEAP8[r2246]=3;r2247=r244+3|0;r2248=r244+4|0;HEAP8[r2247]=120;HEAP8[r2248]=0;r2249=r244+5|0;HEAP8[r2249]=3;r2250=r244+6|0;r253=r837;r254=r79;r255=r80;r256=r81;r257=r82;r258=r838;r259=r84;r260=r839;r261=r840;r262=r841;r263=r842;r264=r89;r265=r90;r266=r190;r267=r2250;r268=r94;r269=r95;r270=r108;r271=r244;r272=r245;r273=r843;r274=r100;r275=r101;break}r2251=HEAP32[r16>>2];r2252=(r2215|0)==145;if(r2252){r253=r837;r254=r79;r255=r80;r256=r81;r257=r82;r258=r838;r259=r84;r260=r839;r261=r840;r262=r841;r263=r842;r264=r89;r265=r90;r266=r190;r267=r2251;r268=r94;r269=r95;r270=r108;r271=r244;r272=r245;r273=r843;r274=r100;r275=r101;break}r2253=(r2215|0)>128;if(!r2253){r2254=(r2215|0)==125;if(!r2254){r253=r837;r254=r79;r255=r80;r256=r81;r257=r82;r258=r838;r259=r84;r260=r82;r261=r81;r262=r84;r263=r838;r264=r89;r265=r90;r266=r190;r267=r2251;r268=r94;r269=0;r270=r108;r271=r244;r272=r245;r273=r843;r274=r100;r275=r101;break}r2255=HEAP32[r23>>2];r2256=(r2255|0)>-1;r2257=HEAP32[r21>>2];r2258=r2256?r2255:r84;r2259=r2256?r2257:r82;r253=r837;r254=r79;r255=r80;r256=r81;r257=r2259;r258=r838;r259=r2258;r260=r82;r261=r81;r262=r84;r263=r838;r264=r89;r265=r90;r266=r190;r267=r2251;r268=r94;r269=0;r270=r108;r271=r244;r272=r245;r273=r843;r274=r100;r275=r101;break}r2260=(r838|0)==-2;r2261=HEAP32[r24>>2];r2262=(r2261|0)>-1;do{if(r2260){r2263=HEAP32[r22>>2];r2264=r2262?1:0;r2265=r2262?r2261:-1;r2266=r2262?r2263:r81;r2267=r2266;r2268=r2265;r2269=-1;r2270=r2264;r13=673}else{if(!r2262){r2267=r81;r2268=r838;r2269=r838;r2270=0;r13=673;break}r2271=HEAP32[r23>>2];r2272=(r2271|0)<0;if(!r2272){r2273=r81;r2274=r838;r2275=r838;r2276=0;r2277=r2271;break}r2278=HEAP32[r22>>2];HEAP32[r21>>2]=r2278;r2279=r2261|r2191;HEAP32[r23>>2]=r2279;r2280=r2279;r2281=r81;r2282=r838;r2283=r838;r2284=0;r13=674}}while(0);if(r13==673){r13=0;r2285=HEAP32[r23>>2];r2280=r2285;r2281=r2267;r2282=r2268;r2283=r2269;r2284=r2270;r13=674}if(r13==674){r13=0;r2286=(r2280|0)>-1;if(r2286){r2273=r2281;r2274=r2282;r2275=r2283;r2276=r2284;r2277=r2280}else{r253=r837;r254=r79;r255=r80;r256=r2281;r257=r82;r258=r2282;r259=r84;r260=r82;r261=r81;r262=r84;r263=r2283;r264=r89;r265=r90;r266=r190;r267=r2251;r268=r94;r269=r2284;r270=r108;r271=r244;r272=r245;r273=r843;r274=r100;r275=r101;break}}r2287=HEAP32[r21>>2];r253=r837;r254=r79;r255=r80;r256=r2273;r257=r2287;r258=r2274;r259=r2277;r260=r82;r261=r81;r262=r84;r263=r2275;r264=r89;r265=r90;r266=r190;r267=r2251;r268=r94;r269=r2276;r270=r108;r271=r244;r272=r245;r273=r843;r274=r100;r275=r101}else{r2288=(r107|0)==92;do{if(r2288){r2289=HEAP32[r17>>2];r2290=r2289+1|0;r2291=HEAP8[r2290];r2292=r2291<<24>>24==69;if(!r2292){break}HEAP32[r17>>2]=r2290;r253=r78;r254=r79;r255=r80;r256=r81;r257=r82;r258=r83;r259=r84;r260=r85;r261=r86;r262=r87;r263=r88;r264=r89;r265=r90;r266=r91;r267=r117;r268=0;r269=r95;r270=r108;r271=r119;r272=r98;r273=r99;r274=r100;r275=r101;break L15}}while(0);r2293=(r98|0)==0;r2294=r38^1;r2295=r2293|r2294;if(!r2295){r2296=HEAP32[r17>>2];r2297=HEAP32[r70>>2];r2298=r2296;r2299=r2297;r2300=r2298-r2299|0;r2301=r98+2|0;r2302=HEAP8[r2301];r2303=r2302&255;r2304=r2303<<8;r2305=r98+3|0;r2306=HEAP8[r2305];r2307=r2306&255;r2308=r2304|r2307;r2309=r2300-r2308|0;r2310=r2309>>>8;r2311=r2310&255;r2312=r98+4|0;HEAP8[r2312]=r2311;r2313=r2309&255;r2314=r98+5|0;HEAP8[r2314]=r2313}r2315=r90&16384;r2316=(r2315|0)==0;r2317=r107&255;if(r2316){r658=r91;r659=r2317;r660=r117;r661=0;r13=718;break}r2318=HEAP32[r17>>2];r2319=r117+1|0;HEAP8[r117]=118;r2320=r117+2|0;HEAP8[r2319]=-1;r2321=HEAP32[r70>>2];r2322=r2318;r2323=r2321;r2324=r2322-r2323|0;r2325=r2324>>>8;r2326=r2325&255;HEAP8[r2320]=r2326;r2327=HEAP32[r70>>2];r2328=r2327;r2329=r2322-r2328|0;r2330=r2329&255;r2331=r117+3|0;HEAP8[r2331]=r2330;r2332=r117+4|0;HEAP8[r2332]=0;r2333=r117+5|0;HEAP8[r2333]=0;r2334=r117+6|0;r2335=r107&255;r658=r91;r659=r2335;r660=r2334;r661=r117;r13=718}}while(0);if(r13==718){r13=0;HEAP8[r50]=r659;r613=r658;r614=r660;r615=r94;r616=r108;r617=r661;r13=719}do{if(r13==719){r13=0;r2336=r90&1;r2337=r2336+29|0;r2338=r2337&255;HEAP8[r614]=r2338;r2339=0;r2340=r614;while(1){r2341=r2340+1|0;r2342=(r2339|0)==0;if(!r2342){break}r2343=r26+r2339|0;r2344=HEAP8[r2343];HEAP8[r2341]=r2344;r2345=r2339+1|0;r2339=r2345;r2340=r2341}r2346=HEAP8[r50];r2347=r2346<<24>>24==13;if(r2347){r2348=13;r13=724}else{r2349=r2346<<24>>24==10;if(r2349){r2348=10;r13=724}else{r2350=r2346}}if(r13==724){r13=0;r2351=HEAP32[r49>>2];r2352=r2351|2048;HEAP32[r49>>2]=r2352;r2350=r2348}r2353=(r83|0)==-2;if(r2353){r2354=r2350&255;r253=r78;r254=r79;r255=r80;r256=r2354;r257=r82;r258=r89;r259=r84;r260=r82;r261=r86;r262=r84;r263=-1;r264=r89;r265=r90;r266=r613;r267=r2341;r268=r615;r269=r95;r270=r616;r271=r614;r272=r617;r273=r99;r274=r100;r275=r101;break}else{r2355=HEAP8[r2340];r2356=r2355&255;r2357=HEAP32[r52>>2];r2358=r89|r2357;r253=r78;r254=r79;r255=r80;r256=r81;r257=r2356;r258=r83;r259=r2358;r260=r82;r261=r81;r262=r84;r263=r83;r264=r89;r265=r90;r266=r613;r267=r2341;r268=r615;r269=r95;r270=r616;r271=r614;r272=r617;r273=r99;r274=r100;r275=r101;break}}}while(0);r2359=HEAP32[r17>>2];r2360=r2359+1|0;HEAP32[r17>>2]=r2360;r78=r253;r79=r254;r80=r255;r81=r256;r82=r257;r83=r258;r84=r259;r85=r260;r86=r261;r87=r262;r88=r263;r89=r264;r90=r265;r91=r266;r92=r267;r93=r118;r94=r268;r95=r269;r96=r270;r97=r271;r98=r272;r99=r273;r100=r274;r101=r275;r102=r2360}do{if(r13==95){HEAP32[r4>>2]=30}else if(r13==115){HEAP32[r4>>2]=71}else if(r13==9){HEAP32[r4>>2]=20}else if(r13==7){HEAP32[r4>>2]=52}else if(r13==162){HEAP32[r4>>2]=83}else if(r13==167){HEAP32[r4>>2]=83}else if(r13==169){HEAP32[r4>>2]=8}else if(r13==187){HEAP32[r4>>2]=6}else if(r13==199){HEAP32[r4>>2]=5;r2361=r665;r13=208}else if(r13==57){HEAP32[r4>>2]=64}else if(r13==14){HEAP32[r4>>2]=52}else if(r13==47){HEAP32[r5>>2]=r81;HEAP32[r6>>2]=r83;HEAP32[r7>>2]=r82;HEAP32[r8>>2]=r84;HEAP32[r2>>2]=r244;r2362=HEAP32[r17>>2];HEAP32[r3>>2]=r2362;if(r38){r2363=1;STACKTOP=r14;return r2363}r2364=HEAP32[r12>>2];r2365=2147483627-r2364|0;r2366=r244;r2367=r118;r2368=r2366-r2367|0;r2369=(r2365|0)<(r2368|0);if(r2369){HEAP32[r4>>2]=20;break}r2370=r2364+r2368|0;HEAP32[r12>>2]=r2370;r2363=1;STACKTOP=r14;return r2363}else if(r13==86){HEAP32[r4>>2]=31}else if(r13==64){r2371=r285+1|0;r2372=HEAP8[r2371];r2373=r2372<<24>>24==58;r2374=r2373?13:31;HEAP32[r4>>2]=r2374}else if(r13==205){HEAP32[r4>>2]=5;r2361=r684;r13=208}else if(r13==207){HEAP32[r4>>2]=4;r2361=r684;r13=208}else if(r13==213){HEAP32[r4>>2]=9}else if(r13==137){HEAP32[r4>>2]=7}else if(r13==303){HEAP32[r4>>2]=20}else if(r13==319){HEAP32[r4>>2]=20}else if(r13==357){HEAP32[r4>>2]=11}else if(r13==382){HEAP32[r4>>2]=75}else if(r13==384){HEAP32[r4>>2]=60}else if(r13==390){HEAP32[r4>>2]=59}else if(r13==397){HEAP32[r4>>2]=66}else if(r13==400){HEAP32[r4>>2]=59}else if(r13==407){HEAP32[r4>>2]=60}else if(r13==411){HEAP32[r4>>2]=18}else if(r13==433){HEAP32[r4>>2]=84}else if(r13==435){HEAP32[r4>>2]=28}else if(r13==442){r2375=r918-1|0;HEAP32[r17>>2]=r2375;HEAP32[r4>>2]=26}else if(r13==446){HEAP32[r4>>2]=35}else if(r13==452){HEAP32[r4>>2]=15}else if(r13==468){HEAP32[r4>>2]=15}else if(r13==472){HEAP32[r4>>2]=15}else if(r13==477){HEAP32[r4>>2]=15}else if(r13==488){HEAP32[r17>>2]=r1026;HEAP32[r4>>2]=24}else if(r13==496){HEAP32[r4>>2]=39}else if(r13==498){HEAP32[r4>>2]=38}else if(r13==502){HEAP32[r4>>2]=41}else if(r13==505){HEAP32[r4>>2]=84}else if(r13==510){HEAP32[r4>>2]=42}else if(r13==512){HEAP32[r4>>2]=49}else if(r13==515){HEAP32[r4>>2]=48}else if(r13==523){HEAP32[r4>>2]=43}else if(r13==526){HEAP32[r4>>2]=65}else if(r13==532){HEAP32[r4>>2]=21}else if(r13==540){HEAP32[r4>>2]=84}else if(r13==545){HEAP32[r4>>2]=62}else if(r13==547){HEAP32[r4>>2]=42}else if(r13==549){HEAP32[r4>>2]=48}else if(r13==567){HEAP32[r4>>2]=15}else if(r13==588){HEAP32[r4>>2]=63}else if(r13==594){HEAP32[r4>>2]=29}else if(r13==597){HEAP32[r4>>2]=58}else if(r13==599){HEAP32[r4>>2]=15}else if(r13==601){HEAP32[r4>>2]=58}else if(r13==608){HEAP32[r4>>2]=15}else if(r13==618){HEAP32[r4>>2]=40}else if(r13==631){HEAP32[r4>>2]=12;HEAP32[r17>>2]=r2112}else if(r13==642){HEAP32[r4>>2]=82}else if(r13==655){HEAP32[r4>>2]=54}else if(r13==657){HEAP32[r4>>2]=27}else if(r13==661){HEAP32[r4>>2]=14}else if(r13==664){HEAP32[r4>>2]=20}else if(r13==710){HEAP32[r4>>2]=45}}while(0);if(r13==208){HEAP32[r17>>2]=r2361}r2376=HEAP32[r17>>2];HEAP32[r3>>2]=r2376;r2363=0;STACKTOP=r14;return r2363}function _is_counted_repeat(r1){var r2,r3,r4,r5,r6,r7,r8;r2=0;r3=HEAP8[r1];if((r3&255)>47&(r3&255)<58){r4=r1}else{r5=0;return r5}while(1){r1=r4+1|0;r6=HEAP8[r1];if((r6&255)<=47){break}if((r6&255)<58){r4=r1}else{r2=4;break}}if(r2==4){return r6<<24>>24==125?1:0}r2=r4+2|0;if(r6<<24>>24!=44){r5=0;return r5}r6=HEAP8[r2];if(r6<<24>>24==125){r5=1;return r5}if((r6&255)>47&(r6&255)<58){r7=r2}else{r5=0;return r5}while(1){r2=r7+1|0;r8=HEAP8[r2];if((r8&255)>47&(r8&255)<58){r7=r2}else{break}}r5=r8<<24>>24==125|0;return r5}function _check_posix_syntax(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=HEAP8[r1+1|0];r5=r1+2|0;L1:while(1){r1=HEAP8[r5];if(r1<<24>>24==92){r6=r5+1|0;if((HEAP8[r6]|0)==93){r7=r6}else{r3=4}}else if(r1<<24>>24==0|r1<<24>>24==93){r8=0;r3=12;break}else{r3=4}do{if(r3==4){r3=0;if(r1<<24>>24==r4<<24>>24){if((HEAP8[r5+1|0]|0)==93){r3=6;break L1}}if(r1<<24>>24!=91){r7=r5;break}r6=HEAP8[r5+1|0];if(!(r6<<24>>24==58|r6<<24>>24==46|r6<<24>>24==61)){r7=r5;break}if((_check_posix_syntax(r5,r2)|0)==0){r7=r5}else{r8=0;r3=14;break L1}}}while(0);r5=r7+1|0}if(r3==6){HEAP32[r2>>2]=r5;r8=1;return r8}else if(r3==14){return r8}else if(r3==12){return r8}}function _check_escape(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332;r7=0;r8=r5>>>11;r9=r8&1;r10=HEAP32[r1>>2];r11=r10+1|0;r12=HEAP8[r11];r13=r12&255;r14=r12<<24>>24==0;L1:do{if(r14){HEAP32[r3>>2]=1;r15=r11;r16=r13;r17=0}else{r18=(r12&255)<48;r19=(r12&255)>122;r20=r18|r19;if(r20){r15=r11;r16=r13;r17=0;break}r21=r13-48|0;r22=696+(r21<<1)|0;r23=HEAP16[r22>>1];r24=r23<<16>>16;r25=r23<<16>>16==0;L5:do{if(r25){switch(r13|0){case 103:{r26=(r6|0)==0;if(!r26){r15=r11;r16=103;r17=0;break L1}r27=r10+2|0;r28=HEAP8[r27];if(r28<<24>>24==60|r28<<24>>24==39){r15=r11;r16=103;r17=27;break L1}else if(r28<<24>>24==123){r29=r10+3|0;r30=r29;while(1){r31=HEAP8[r30];if(r31<<24>>24==0|r31<<24>>24==125){break}else if(r31<<24>>24!=45){r32=(r31&255)>47;if(!r32){r15=r11;r16=103;r17=28;break L1}r33=(r31&255)<58;if(!r33){r34=r31;r7=30;break}}r35=r30+1|0;r30=r35}if(r7==30){r36=r34<<24>>24==125;if(!r36){r15=r11;r16=103;r17=28;break L1}}r37=r10+3|0;r38=HEAP8[r37];r39=r27;r40=1;r41=r38}else{r39=r11;r40=0;r41=r28}r42=r41<<24>>24==45;r43=r39+1|0;r44=r42?1:0;r45=r42?r43:r39;r46=r45;r47=0;while(1){r48=r46+1|0;r49=HEAP8[r48];r50=(r49&255)>47;r51=(r49&255)<58;r52=r50&r51;if(!r52){break}r53=(r47|0)>214748363;if(r53){r54=r46;r55=r49;r7=36;break}r56=r47*10&-1;r57=r49&255;r58=r57-48|0;r59=r56+r58|0;r46=r48;r47=r59}if(r7==36){while(1){r7=0;r60=r54+1|0;r61=(r55&255)>47;r62=(r55&255)<58;r63=r61&r62;if(!r63){break}r64=r54+2|0;r65=HEAP8[r64];r54=r60;r55=r65;r7=36}HEAP32[r3>>2]=61;r15=r54;r16=103;r17=0;break L1}r66=(r40|0)==0;do{if(r66){r67=r46}else{r68=r49<<24>>24==125;if(r68){r67=r48;break}HEAP32[r3>>2]=57;r15=r48;r16=103;r17=0;break L1}}while(0);r69=(r47|0)==0;if(r69){HEAP32[r3>>2]=58;r15=r67;r16=103;r17=0;break L1}r70=(r44|0)==0;do{if(r70){r71=r47}else{r72=(r47|0)>(r4|0);if(r72){HEAP32[r3>>2]=15;r15=r67;r16=103;r17=0;break L1}else{r73=r47-1|0;r74=r4-r73|0;r71=r74;break}}}while(0);r75=-r71|0;r76=r67;r77=103;r78=r75;break L5;break};case 48:{r79=48;r80=r11;r81=r24;break};case 108:case 76:{HEAP32[r3>>2]=37;r15=r11;r16=r13;r17=0;break L1;break};case 99:{r82=r10+2|0;r83=HEAP8[r82];r84=r83&255;r85=r83<<24>>24==0;if(r85){HEAP32[r3>>2]=2;r15=r82;r16=r84;r17=0;break L1}r86=r83<<24>>24<0;if(r86){HEAP32[r3>>2]=68;r15=r82;r16=r84;r17=0;break L1}else{r87=(r83&255)>96;r88=(r83&255)<123;r89=r87&r88;r90=r84-32|0;r91=r89?r90:r84;r92=r91^64;r15=r82;r16=r92;r17=0;break L1}break};case 111:{r93=r10+2|0;r94=HEAP8[r93];r95=r94<<24>>24==123;if(!r95){HEAP32[r3>>2]=81;r15=r11;r16=111;r17=0;break L1}r96=r10+3|0;r97=(r9|0)!=0;r98=r97?1114111:255;r99=r96;r100=0;L59:while(1){r101=(r100|0)==0;r102=r99;while(1){r103=HEAP8[r102];r104=(r103&255)>47;if(!r104){break L59}r105=(r103&255)<56;if(!r105){r7=75;break L59}r106=r102+1|0;r107=r103&255;r108=r103<<24>>24==48;r109=r101&r108;if(r109){r102=r106}else{break}}r110=r100<<3;r111=r110+r107|0;r112=r111-48|0;r113=r112>>>0>r98>>>0;if(r113){r114=r106;r7=72;break}else{r99=r106;r100=r112}}do{if(r7==75){r115=r103<<24>>24==125;if(!r115){break}r116=(r9|0)!=0;r117=r100>>>0>55295;r118=r116&r117;r119=r100>>>0<57344;r120=r118&r119;if(!r120){r15=r102;r16=r100;r17=0;break L1}HEAP32[r3>>2]=73;r15=r102;r16=r100;r17=0;break L1}else if(r7==72){while(1){r7=0;r121=HEAP8[r114];r122=(r121&255)>47;r123=(r121&255)<56;r124=r122&r123;if(!r124){break}r125=r114+1|0;r114=r125;r7=72}HEAP32[r3>>2]=34;r15=r114;r16=r112;r17=0;break L1}}while(0);HEAP32[r3>>2]=80;r15=r102;r16=r100;r17=0;break L1;break};case 117:{r126=r5&33554432;r127=(r126|0)==0;if(r127){HEAP32[r3>>2]=37;r15=r11;r16=117;r17=0;break L1}r128=r10+2|0;r129=HEAP8[r128];r130=r129&255;r131=r130+4152|0;r132=HEAP8[r131];r133=r132&8;r134=r133<<24>>24==0;if(r134){r15=r11;r16=117;r17=0;break L1}r135=r10+3|0;r136=HEAP8[r135];r137=r136&255;r138=r137+4152|0;r139=HEAP8[r138];r140=r139&8;r141=r140<<24>>24==0;if(r141){r15=r11;r16=117;r17=0;break L1}r142=r10+4|0;r143=HEAP8[r142];r144=r143&255;r145=r144+4152|0;r146=HEAP8[r145];r147=r146&8;r148=r147<<24>>24==0;if(r148){r15=r11;r16=117;r17=0;break L1}r149=r10+5|0;r150=HEAP8[r149];r151=r150&255;r152=r151+4152|0;r153=HEAP8[r152];r154=r153&8;r155=r154<<24>>24==0;if(r155){r15=r11;r16=117;r17=0;break L1}else{r156=0;r157=r11;r158=0}while(1){r159=(r156|0)<4;if(!r159){break}r160=r157+1|0;r161=HEAP8[r160];r162=r161&255;r163=(r161&255)>96;r164=r162-32|0;r165=r163?r164:r162;r166=r158<<4;r167=r166+r165|0;r168=r165>>>0<65;r169=r168?48:55;r170=r167-r169|0;r171=r156+1|0;r156=r171;r157=r160;r158=r170}r172=(r9|0)!=0;r173=r172?1114111:255;r174=r158>>>0>r173>>>0;if(r174){HEAP32[r3>>2]=76;r15=r157;r16=r158;r17=0;break L1}r175=(r9|0)!=0;r176=r158>>>0>55295;r177=r175&r176;r178=r158>>>0<57344;r179=r177&r178;if(!r179){r15=r157;r16=r158;r17=0;break L1}HEAP32[r3>>2]=73;r15=r157;r16=r158;r17=0;break L1;break};case 120:{r180=r5&33554432;r181=(r180|0)==0;r182=r10+2|0;r183=HEAP8[r182];if(!r181){r184=r183&255;r185=r184+4152|0;r186=HEAP8[r185];r187=r186&8;r188=r187<<24>>24==0;if(r188){r15=r11;r16=120;r17=0;break L1}r189=r10+3|0;r190=HEAP8[r189];r191=r190&255;r192=r191+4152|0;r193=HEAP8[r192];r194=r193&8;r195=r194<<24>>24==0;if(r195){r15=r11;r16=120;r17=0;break L1}else{r196=0;r197=r11;r198=0}while(1){r199=(r196|0)<2;if(!r199){r15=r197;r16=r198;r17=0;break L1}r200=r197+1|0;r201=HEAP8[r200];r202=r201&255;r203=(r201&255)>96;r204=r202-32|0;r205=r203?r204:r202;r206=r198<<4;r207=r206+r205|0;r208=r205>>>0<65;r209=r208?48:55;r210=r207-r209|0;r211=r196+1|0;r196=r211;r197=r200;r198=r210}}r212=r183<<24>>24==123;if(!r212){r213=0;r214=r11;r215=r24;while(1){r216=r215+1|0;r217=(r215|0)<2;if(!r217){r15=r214;r16=r213;r17=0;break L1}r218=r214+1|0;r219=HEAP8[r218];r220=r219&255;r221=r220+4152|0;r222=HEAP8[r221];r223=r222&8;r224=r223<<24>>24==0;if(r224){r15=r214;r16=r213;r17=0;break L1}r225=(r219&255)>96;r226=r220-32|0;r227=r225?r226:r220;r228=r213<<4;r229=r228+r227|0;r230=r227>>>0<65;r231=r230?48:55;r232=r229-r231|0;r213=r232;r214=r218;r215=r216}}r233=r10+3|0;r234=(r9|0)!=0;r235=r234?1114111:255;r236=r233;r237=0;L104:while(1){r238=(r237|0)==0;r239=r236;while(1){r240=HEAP8[r239];r241=r240&255;r242=r241+4152|0;r243=HEAP8[r242];r244=r243&8;r245=r244<<24>>24==0;if(r245){break L104}r246=r239+1|0;r247=r240<<24>>24==48;r248=r238&r247;if(r248){r239=r246}else{break}}r249=(r240&255)>96;r250=r241-32|0;r251=r249?r250:r241;r252=r237<<4;r253=r252+r251|0;r254=r251>>>0<65;r255=r254?48:55;r256=r253-r255|0;r257=r256>>>0>r235>>>0;if(r257){r258=r246;r7=90;break}else{r236=r246;r237=r256}}if(r7==90){while(1){r7=0;r259=HEAP8[r258];r260=r259&255;r261=r260+4152|0;r262=HEAP8[r261];r263=r262&8;r264=r263<<24>>24==0;if(r264){break}r265=r258+1|0;r258=r265;r7=90}HEAP32[r3>>2]=34;r15=r258;r16=r256;r17=0;break L1}r266=r240<<24>>24==125;if(!r266){HEAP32[r3>>2]=79;r15=r239;r16=r237;r17=0;break L1}r267=(r9|0)!=0;r268=r237>>>0>55295;r269=r267&r268;r270=r237>>>0<57344;r271=r269&r270;if(!r271){r15=r239;r16=r237;r17=0;break L1}HEAP32[r3>>2]=73;r15=r239;r16=r237;r17=0;break L1;break};case 85:{r272=r5&33554432;r273=(r272|0)==0;if(!r273){r15=r11;r16=85;r17=0;break L1}HEAP32[r3>>2]=37;r15=r11;r16=85;r17=0;break L1;break};case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:{r274=(r6|0)==0;do{if(r274){r275=r11;r276=r21;while(1){r277=r275+1|0;r278=HEAP8[r277];r279=(r278&255)>47;r280=(r278&255)<58;r281=r279&r280;if(!r281){r7=56;break}r282=(r276|0)>214748363;if(r282){r283=r275;r284=r278;break}r285=r276*10&-1;r286=r278&255;r287=r286-48|0;r288=r285+r287|0;r275=r277;r276=r288}if(r7==56){r289=(r276|0)>=8;r290=(r276|0)>(r4|0);r291=r289&r290;if(r291){break}r292=-r276|0;r76=r275;r77=r13;r78=r292;break L5}while(1){r293=r283+1|0;r294=(r284&255)>47;r295=(r284&255)<58;r296=r294&r295;if(!r296){break}r297=r283+2|0;r298=HEAP8[r297];r283=r293;r284=r298}HEAP32[r3>>2]=61;r15=r283;r16=r13;r17=0;break L1}}while(0);r299=(r12&255)>55;if(r299){r15=r11;r16=r13;r17=0;break L1}else{r79=r13;r80=r11;r81=r24}break};default:{r300=r5&64;r301=(r300|0)==0;if(r301){r15=r11;r16=r13;r17=0;break L1}HEAP32[r3>>2]=3;r15=r11;r16=r13;r17=0;break L1}}while(1){r302=r79-48|0;r303=r81+1|0;r304=(r81|0)<2;if(!r304){break}r305=r80+1|0;r306=HEAP8[r305];r307=(r306&255)>47;r308=(r306&255)<56;r309=r307&r308;if(!r309){break}r310=r302<<3;r311=r306&255;r312=r310+r311|0;r79=r312;r80=r305;r81=r303}r313=(r9|0)==0;r314=r302>>>0>255;r315=r313&r314;if(!r315){r15=r80;r16=r302;r17=0;break L1}HEAP32[r3>>2]=51;r15=r80;r16=r302;r17=0;break L1}else{r316=r23<<16>>16>0;if(r316){r15=r11;r16=r24;r17=0;break L1}r317=-r24|0;r76=r11;r77=r13;r78=r317}}while(0);r318=(r78|0)==12;if(!r318){r15=r76;r16=r77;r17=r78;break}r319=r76+1|0;r320=HEAP8[r319];r321=r320<<24>>24==123;if(!r321){r15=r76;r16=r77;r17=r78;break}r322=r76+2|0;r323=_is_counted_repeat(r322);r324=(r323|0)==0;if(!r324){r15=r76;r16=r77;r17=r78;break}HEAP32[r3>>2]=37;r15=r76;r16=r77;r17=r78}}while(0);r325=r5&536870912;r326=(r325|0)!=0;r327=(r17|0)>5;r328=r326&r327;r329=(r17|0)<12;r330=r328&r329;r331=r17+23|0;r332=r330?r331:r17;HEAP32[r1>>2]=r15;HEAP32[r2>>2]=r16;return r332}function _add_list_to_class(r1,r2,r3,r4,r5){var r6,r7,r8;r2=0;r6=r5;while(1){r5=HEAP32[r6>>2];if((r5|0)==-1){break}else{r7=0}while(1){r8=r7+1|0;if((HEAP32[r6+(r8<<2)>>2]|0)==(r5+r7+1|0)){r7=r8}else{break}}r2=r2+_add_to_class(r1,r3,r4,r5,HEAP32[r6+(r7<<2)>>2])|0;r6=r6+(r7+1<<2)|0}return}function _add_not_list_to_class(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10;r2=HEAP32[r5>>2];if((r2|0)!=0){_add_to_class(r1,r3,r4,0,r2-1|0)}r2=(r3&2048|0)!=0?1114111:-1;r6=r5;while(1){r5=HEAP32[r6>>2];if((r5|0)==-1){break}else{r7=r6;r8=r5}while(1){r9=r7+4|0;r10=HEAP32[r9>>2];if((r10|0)==(r8+1|0)){r7=r9;r8=r10}else{break}}_add_to_class(r1,r3,r4,HEAP32[r7>>2]+1|0,(r10|0)==-1?r2:r10-1|0);r6=r9}return}function _add_to_class(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12;r6=r5>>>0<256?r5:255;L1:do{if((r2&1|0)==0){r7=r4;r8=0}else{r5=r3+4|0;r9=r4;r10=0;while(1){if(r9>>>0>r6>>>0){r7=r4;r8=r10;break L1}r11=HEAPU8[HEAP32[r5>>2]+r9|0];r12=r1+(r11>>>3)|0;HEAP8[r12]=HEAPU8[r12]|1<<(r11&7);r9=r9+1|0;r10=r10+1|0}}}while(0);while(1){if(r7>>>0>r6>>>0){break}r4=r1+(r7>>>3)|0;HEAP8[r4]=HEAPU8[r4]|1<<(r7&7);r7=r7+1|0;r8=r8+1|0}return r8}function _adjust_recurse(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79;r6=0;r7=r4+32|0;r8=r4+20|0;r9=r1;while(1){r10=HEAP8[r9];if(r10<<24>>24==117){r11=(r9|0)==0;if(r11){r6=20;break}r12=HEAP32[r7>>2];r13=r9+1|0;r14=r5;while(1){r15=r14>>>0<r12>>>0;if(!r15){r16=r12;break}r17=HEAP8[r14];r18=r17&255;r19=r18<<8;r20=r14+1|0;r21=HEAP8[r20];r22=r21&255;r23=r19|r22;r24=HEAP32[r8>>2];r25=r24+r23|0;r26=(r25|0)==(r13|0);if(r26){r6=13;break}r27=r14+2|0;r14=r27}if(r6==13){r6=0;r28=r23+r2|0;r29=r28>>>8;r30=r29&255;HEAP8[r14]=r30;r31=r28&255;HEAP8[r20]=r31;r32=HEAP32[r7>>2];r16=r32}r33=r14>>>0<r16>>>0;do{if(!r33){r34=HEAP8[r13];r35=r34&255;r36=r35<<8;r37=r9+2|0;r38=HEAP8[r37];r39=r38&255;r40=r36|r39;r41=HEAP32[r8>>2];r42=r41+r40|0;r43=r42>>>0<r1>>>0;if(r43){break}r44=r40+r2|0;r45=r44>>>8;r46=r45&255;HEAP8[r13]=r46;r47=r44&255;HEAP8[r37]=r47}}while(0);r48=r9+3|0;r9=r48;continue}else if(r10<<24>>24==112){r49=r9+1|0;r50=HEAP8[r49];r51=r50&255;r52=r51<<8;r53=r9+2|0;r54=HEAP8[r53];r55=r54&255;r56=r52|r55;r57=r9+r56|0;r9=r57;continue}else if(r10<<24>>24==0){r6=21;break}else{r58=r10&255;switch(r58|0){case 97:case 91:case 92:case 93:{r59=r9+3|0;r60=HEAP8[r59];r61=r60-15&255;r62=(r61&255)<2;r63=r9+2|0;r64=r62?r63:r9;r65=r64;break};case 149:case 151:case 153:case 155:{r66=r9+1|0;r67=HEAP8[r66];r68=r67&255;r69=r9+r68|0;r65=r69;break};case 85:case 86:case 87:case 88:case 89:case 90:case 94:case 95:case 96:{r70=r9+1|0;r71=HEAP8[r70];r72=r71-15&255;r73=(r72&255)<2;r74=r9+2|0;r75=r73?r74:r9;r65=r75;break};default:{r65=r9}}r76=r58+8720|0;r77=HEAP8[r76];r78=r77&255;r79=r65+r78|0;r9=r79;continue}}if(r6==20){return}else if(r6==21){return}}function _expand_workspace(r1){var r2,r3,r4,r5,r6,r7;r2=r1+60|0;r3=HEAP32[r2>>2];r4=r3<<1;r5=(r4|0)>409600?409600:r4;if((r3|0)>409599){r6=72;return r6}if((r5-r3|0)<100){r6=72;return r6}r3=_malloc(r5);if((r3|0)==0){r6=21;return r6}r4=r1+16|0;_memcpy(r3,HEAP32[r4>>2],HEAP32[r2>>2])|0;r7=r1+32|0;r1=HEAP32[r4>>2];HEAP32[r7>>2]=r3+(HEAP32[r7>>2]-r1);if((HEAP32[r2>>2]|0)>4096){_free(r1)}HEAP32[r4>>2]=r3;HEAP32[r2>>2]=r5;r6=0;return r6}function _pcre_exec(r1,r2,r3,r4,r5,r6,r7,r8){var r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472,r473,r474,r475,r476,r477,r478,r479,r480,r481,r482,r483,r484,r485,r486,r487,r488,r489,r490,r491,r492,r493,r494,r495,r496,r497,r498,r499,r500,r501,r502,r503,r504,r505,r506,r507,r508,r509,r510,r511,r512,r513,r514,r515,r516,r517,r518,r519,r520,r521,r522,r523,r524,r525,r526,r527,r528,r529,r530,r531,r532,r533,r534,r535,r536,r537,r538,r539,r540,r541,r542,r543,r544,r545,r546,r547,r548,r549,r550,r551,r552,r553,r554,r555,r556,r557,r558,r559,r560,r561,r562,r563,r564,r565,r566,r567,r568,r569,r570,r571,r572,r573,r574,r575,r576,r577,r578;r9=0;r10=STACKTOP;STACKTOP=STACKTOP+184|0;r11=r10;r12=r3+r5|0;r13=r5-1|0;r14=r3+r13|0;r15=r1;r16=(r1|0)==0;r17=(r2|0)==0;r18=r16&r17;r19=(r3|0)==0;r20=r18&r19;r21=(r4|0)==-999;r22=r20&r21;r23=(r5|0)==-999;r24=r22&r23;if(r24){r25=_match(0,0,0,0,0,0,0);r26=r25;STACKTOP=r10;return r26}r27=r6&-502310289;r28=(r27|0)==0;if(!r28){r26=-3;STACKTOP=r10;return r26}r29=(r1|0)==0;r30=(r3|0)==0;r31=r29|r30;if(r31){r26=-2;STACKTOP=r10;return r26}r32=(r7|0)==0;r33=(r8|0)>0;r34=r32&r33;if(r34){r26=-2;STACKTOP=r10;return r26}r35=(r8|0)<0;if(r35){r26=-15;STACKTOP=r10;return r26}r36=(r4|0)<0;if(r36){r26=-32;STACKTOP=r10;return r26}r37=(r5|0)<0;r38=(r5|0)>(r4|0);r39=r37|r38;if(r39){r26=-24;STACKTOP=r10;return r26}r40=r1;r41=HEAP32[r40>>2];r42=(r41|0)==1346589253;if(!r42){r43=(r41|0)==1163019088;r44=r43?-29:-4;r26=r44;STACKTOP=r10;return r26}r45=r15+12|0;r46=HEAP32[r45>>2];r47=r46&1;r48=(r47|0)==0;if(r48){r26=-28;STACKTOP=r10;return r26}r49=r15+8|0;r50=HEAP32[r49>>2];r51=r50>>>11;r52=r51&1;r53=r11+76|0;HEAP32[r53>>2]=r52;r54=r6&134217728;r55=(r54|0)==0;if(r55){r56=r6>>>15;r57=r56&1;r58=r57}else{r58=2}r59=r11+136|0;HEAP32[r59>>2]=r58;r60=r1;r61=r15+34|0;r62=HEAP16[r61>>1];r63=r62&65535;r64=r60+r63|0;r65=r11+48|0;HEAP32[r65>>2]=r64;r66=r15+38|0;r67=HEAP16[r66>>1];r68=r67&65535;r69=r11+32|0;HEAP32[r69>>2]=r68;r70=r15+36|0;r71=HEAP16[r70>>1];r72=r71&65535;r73=r11+36|0;HEAP32[r73>>2]=r72;r74=r11+4|0;HEAP32[r74>>2]=1e7;r75=r11+8|0;HEAP32[r75>>2]=1e7;r76=r11+168|0;HEAP32[r76>>2]=0;r77=r15+48|0;r78=HEAP32[r77>>2];r79=(r2|0)==0;do{if(r79){r80=0;r81=r78;r82=1e7;r83=1e7}else{r84=r2|0;r85=HEAP32[r84>>2];r86=r85&1;r87=(r86|0)==0;if(r87){r88=0}else{r89=r2+4|0;r90=HEAP32[r89>>2];r91=r90;r88=r91}r92=r85&2;r93=(r92|0)==0;if(r93){r94=1e7}else{r95=r2+8|0;r96=HEAP32[r95>>2];HEAP32[r74>>2]=r96;r94=r96}r97=r85&16;r98=(r97|0)==0;if(r98){r99=1e7}else{r100=r2+20|0;r101=HEAP32[r100>>2];HEAP32[r75>>2]=r101;r99=r101}r102=r85&4;r103=(r102|0)==0;if(!r103){r104=r2+12|0;r105=HEAP32[r104>>2];HEAP32[r76>>2]=r105}r106=r85&8;r107=(r106|0)==0;if(r107){r80=r88;r81=r78;r82=r99;r83=r94;break}r108=r2+16|0;r109=HEAP32[r108>>2];r80=r88;r81=r109;r82=r99;r83=r94}}while(0);r110=r46&8192;r111=(r110|0)==0;do{if(!r111){r112=r15+16|0;r113=HEAP32[r112>>2];r114=r113>>>0<r83>>>0;if(!r114){break}HEAP32[r74>>2]=r113}}while(0);r115=r46&16384;r116=(r115|0)==0;do{if(!r116){r117=r15+20|0;r118=HEAP32[r117>>2];r119=r118>>>0<r82>>>0;if(!r119){break}HEAP32[r75>>2]=r118}}while(0);r120=(r81|0)==0;r121=r120?7632:r81;r122=r50|r6;r123=r122&16;r124=r46>>>8;r125=r124&1;r126=r50&262144;r127=Math_imul(r68,r72)|0;r128=r63+r127|0;r129=r60+r128|0;r130=r11+112|0;HEAP32[r130>>2]=r129;r131=r11+116|0;HEAP32[r131>>2]=r3;r132=r11+148|0;HEAP32[r132>>2]=r5;r133=r3+r4|0;r134=r11+120|0;HEAP32[r134>>2]=r133;r135=r50>>>5;r136=r135&1;r137=r11+88|0;HEAP32[r137>>2]=r136;r138=r50>>>29;r139=r138&1;r140=r11+84|0;HEAP32[r140>>2]=r139;r141=r50>>>25;r142=r141&1;r143=r11+80|0;HEAP32[r143>>2]=r142;r144=r11+44|0;HEAP32[r144>>2]=0;r145=r6>>>7;r146=r145&1;r147=r11+68|0;HEAP32[r147>>2]=r146;r148=r6>>>8;r149=r148&1;r150=r11+72|0;HEAP32[r150>>2]=r149;r151=r6>>>10;r152=r151&1;r153=r11+92|0;HEAP32[r153>>2]=r152;r154=r6>>>28;r155=r154&1;r156=r11+96|0;HEAP32[r156>>2]=r155;r157=r11+100|0;HEAP32[r157>>2]=0;r158=r11+176|0;HEAP32[r158>>2]=0;r159=r11+172|0;HEAP32[r159>>2]=0;r160=r11+164|0;HEAP32[r160>>2]=0;r161=r46>>>12;r162=r161&1;r163=r11+108|0;HEAP32[r163>>2]=r162;r164=r11+56|0;HEAP32[r164>>2]=r121;r165=r121+256|0;r166=r11+60|0;HEAP32[r166>>2]=r165;r167=r121+832|0;r168=r11+64|0;HEAP32[r168>>2]=r167;r169=r6&25165824;do{if((r169|0)==0){r170=r50&25165824;r171=(r170|0)==0;if(r171){r172=r11+104|0;HEAP32[r172>>2]=0;break}else{r173=r50>>>23;r174=r173&1;r175=r11+104|0;HEAP32[r175>>2]=r174;break}}else if((r169|0)==8388608){r176=r11+104|0;HEAP32[r176>>2]=1}else if((r169|0)==16777216){r177=r11+104|0;HEAP32[r177>>2]=0}else{r26=-23;STACKTOP=r10;return r26}}while(0);r178=r6&7340032;r179=(r178|0)==0;r180=r179?r50:r6;r181=r180&7340032;if((r181|0)==1048576){r182=13;r9=42}else if((r181|0)==5242880){r183=r11+24|0;HEAP32[r183>>2]=2}else if((r181|0)==4194304){r184=r11+24|0;HEAP32[r184>>2]=1}else if((r181|0)==3145728){r185=r11+24|0;HEAP32[r185>>2]=0;r186=r11+28|0;HEAP32[r186>>2]=2;r187=3338>>>8;r188=r187&255;r189=r11+52|0;HEAP8[r189]=r188;r190=10;r191=r11+53|0;HEAP8[r191]=r190}else if((r181|0)==0|(r181|0)==2097152){r182=10;r9=42}else{r26=-23;STACKTOP=r10;return r26}if(r9==42){r192=r11+24|0;HEAP32[r192>>2]=0;r193=r11+28|0;HEAP32[r193>>2]=1;r194=r182&255;r195=r11+52|0;HEAP8[r195]=r194}r196=(r58|0)==0;do{if(!r196){r197=r46&512;r198=(r197|0)==0;if(r198){break}else{r26=-13}STACKTOP=r10;return r26}}while(0);r199=(r8|0)%3&-1;r200=r8-r199|0;r201=r200<<1;r202=(r201|0)/3&-1;r203=r15+32|0;r204=HEAP16[r203>>1];r205=r204<<16>>16==0;do{if(r205){r9=48}else{r206=r204&65535;r207=(r8|0)/3&-1;r208=(r206|0)<(r207|0);if(r208){r9=48;break}r209=r206*3&-1;r210=r209+3|0;r211=r210<<2;r212=_malloc(r211);r213=r212;r214=r11+12|0;HEAP32[r214>>2]=r213;r215=(r212|0)==0;if(r215){r26=-6}else{r216=r210;r217=1;r218=r213;break}STACKTOP=r10;return r26}}while(0);if(r9==48){r219=r11+12|0;HEAP32[r219>>2]=r7;r216=r200;r217=0;r218=r7}r220=r11+16|0;HEAP32[r220>>2]=r216;r221=r216<<1;r222=(r221|0)/3&-1;r223=r11+20|0;HEAP32[r223>>2]=r222;r224=r11+144|0;HEAP32[r224>>2]=0;r225=r11+12|0;r226=(r218|0)==0;if(!r226){r227=r218+(r216<<2)|0;r228=r15+30|0;r229=HEAP16[r228>>1];r230=r229&65535;r231=r216-r230|0;r232=r218+(r231<<2)|0;r233=(r231|0)<2;r234=r218+8|0;r235=r233?r234:r232;r236=r227;while(1){r237=r236-4|0;r238=r237>>>0<r235>>>0;if(r238){break}HEAP32[r237>>2]=-1;r236=r237}r239=HEAP32[r225>>2];r240=r239+4|0;HEAP32[r240>>2]=-1;r241=HEAP32[r225>>2];HEAP32[r241>>2]=-1}r242=(r123|0)==0;r243=HEAP32[r45>>2];do{if(r242){r244=r243&16;r245=(r244|0)==0;if(r245){r246=(r125|0)!=0;r247=(r80|0)==0;r248=r246|r247;if(r248){r249=0;r250=0;r251=0;r252=0;break}r253=r80+4|0;r254=HEAP32[r253>>2];r255=r254&1;r256=(r255|0)==0;r257=r80+8|0;r258=r256?0:r257;r249=0;r250=r258;r251=0;r252=0;break}else{r259=r15+24|0;r260=HEAP16[r259>>1];r261=r260&255;r262=r243&32;r263=(r262|0)==0;if(r263){r249=1;r250=0;r251=r261;r252=r261;break}r264=r260&255;r265=r264&65535;r266=HEAP32[r166>>2];r267=r266+r265|0;r268=HEAP8[r267];r249=1;r250=0;r251=r261;r252=r268;break}}else{r249=0;r250=0;r251=0;r252=0}}while(0);r269=r243&64;r270=(r269|0)==0;do{if(r270){r271=1;r272=0;r273=0}else{r274=r15+26|0;r275=HEAP16[r274>>1];r276=r275&255;r277=r243&128;r278=(r277|0)==0;if(r278){r271=0;r272=r276;r273=r276;break}r279=r275&255;r280=r279&65535;r281=HEAP32[r166>>2];r282=r281+r280|0;r283=HEAP8[r282];r271=0;r272=r283;r273=r276}}while(0);r284=(r126|0)==0;r285=(r249|0)==0;r286=(r125|0)==0;r287=(r250|0)==0;r288=r11+28|0;r289=r11+24|0;r290=r11+52|0;r291=r11+53|0;r292=r251<<24>>24==r252<<24>>24;r293=(r80|0)==0;r294=r133;r295=r273<<24>>24==r272<<24>>24;r296=r80+4|0;r297=r80+40|0;r298=r11+124|0;r299=r11+132|0;r300=r11|0;r301=r11+152|0;r302=r11+140|0;r303=r11+40|0;r304=r14;r305=0;r306=0;r307=r12;L105:while(1){L107:do{if(r284){r308=r133}else{r309=r307;while(1){r310=HEAP32[r134>>2];r311=r309>>>0<r310>>>0;if(!r311){r308=r309;break L107}r312=HEAP32[r289>>2];r313=(r312|0)==0;do{if(r313){r314=HEAP32[r288>>2];r315=-r314|0;r316=r310+r315|0;r317=r309>>>0>r316>>>0;if(r317){break}r318=HEAP8[r309];r319=HEAP8[r290];r320=r318<<24>>24==r319<<24>>24;if(!r320){break}r321=(r314|0)==1;if(r321){r308=r309;break L107}r322=r309+1|0;r323=HEAP8[r322];r324=HEAP8[r291];r325=r323<<24>>24==r324<<24>>24;if(r325){r308=r309;break L107}}else{r326=__pcre_is_newline(r309,r312,r310,r288,r52);r327=(r326|0)!=0;if(r327){r308=r309;break L107}}}while(0);r328=r309+1|0;r309=r328}}}while(0);r329=HEAP32[r49>>2];r330=r329|r6;r331=r330&67108864;r332=(r331|0)==0;L119:do{if(r332){if(!r285){if(r292){r333=r307;while(1){r334=r333>>>0<r308>>>0;if(!r334){r335=r333;break L119}r336=HEAP8[r333];r337=r336<<24>>24==r252<<24>>24;if(r337){r335=r333;break L119}r338=r333+1|0;r333=r338}}else{r339=r307;while(1){r340=r339>>>0<r308>>>0;if(!r340){r335=r339;break L119}r341=HEAP8[r339];r342=r341<<24>>24!=r251<<24>>24;r343=r341<<24>>24!=r252<<24>>24;r344=r342&r343;if(!r344){r335=r339;break L119}r345=r339+1|0;r339=r345}}}if(r286){if(r287){r335=r307;break}else{r346=r307}while(1){r347=r346>>>0<r308>>>0;if(!r347){r335=r346;break L119}r348=HEAP8[r346];r349=r348&255;r350=r349>>>3;r351=r250+r350|0;r352=HEAP8[r351];r353=r352&255;r354=r349&7;r355=1<<r354;r356=r353&r355;r357=(r356|0)==0;if(!r357){r335=r346;break L119}r358=r346+1|0;r346=r358}}r359=HEAP32[r131>>2];r360=r359+r5|0;r361=r307>>>0>r360>>>0;if(r361){r362=r307}else{r335=r307;break}L140:while(1){r363=r362>>>0<r308>>>0;if(!r363){break}r364=HEAP32[r289>>2];r365=(r364|0)==0;r366=HEAP32[r131>>2];do{if(r365){r367=HEAP32[r288>>2];r368=r366+r367|0;r369=r362>>>0<r368>>>0;if(r369){break}r370=-r367|0;r371=r362+r370|0;r372=HEAP8[r371];r373=HEAP8[r290];r374=r372<<24>>24==r373<<24>>24;if(!r374){break}r375=(r367|0)==1;if(r375){break L140}r376=1-r367|0;r377=r362+r376|0;r378=HEAP8[r377];r379=HEAP8[r291];r380=r378<<24>>24==r379<<24>>24;if(r380){break L140}}else{r381=r362>>>0>r366>>>0;if(!r381){break}r382=__pcre_was_newline(r362,r364,r366,r288,r52);r383=(r382|0)!=0;if(r383){break L140}}}while(0);r384=r362+1|0;r362=r384}r385=r362-1|0;r386=HEAP8[r385];r387=r386<<24>>24==13;if(!r387){r335=r362;break}r388=HEAP32[r289>>2];r389=r388-1|0;r390=r389>>>0<2;r391=r390^1;r392=r363^1;r393=r391|r392;if(r393){r335=r362;break}r394=HEAP8[r362];r395=r394<<24>>24==10;r396=r362+1|0;r397=r395?r396:r362;r335=r397}else{r335=r307}}while(0);r398=HEAP32[r49>>2];r399=r398|r6;r400=r399&67108864;r401=(r400|0)==0;do{if(r401){r402=HEAP32[r59>>2];r403=(r402|0)==0;if(!r403){r404=r304;break}do{if(!r293){r405=HEAP32[r296>>2];r406=r405&2;r407=(r406|0)==0;if(r407){break}r408=r335;r409=r294-r408|0;r410=HEAP32[r297>>2];r411=r409>>>0<r410>>>0;if(r411){r412=r306;r413=r305;r414=0;break L105}}}while(0);if(r271){r404=r304;break}r415=r335;r416=r294-r415|0;r417=(r416|0)<1e3;if(!r417){r404=r304;break}r418=r335+r249|0;r419=r418>>>0>r304>>>0;if(!r419){r404=r304;break}L165:do{if(r295){r420=r418;while(1){r421=r420>>>0<r133>>>0;if(!r421){r422=r420;break L165}r423=r420+1|0;r424=HEAP8[r420];r425=r424<<24>>24==r273<<24>>24;if(r425){r422=r420;break}else{r420=r423}}}else{r426=r418;while(1){r427=r426>>>0<r133>>>0;if(!r427){r422=r426;break L165}r428=HEAP8[r426];r429=r428<<24>>24==r273<<24>>24;if(r429){r422=r426;break L165}r430=r426+1|0;r431=r428<<24>>24==r272<<24>>24;if(r431){r422=r426;break}else{r426=r430}}}}while(0);r432=r422>>>0<r133>>>0;if(r432){r404=r422}else{r412=r306;r413=r305;r414=0;break L105}}else{r404=r304}}while(0);HEAP32[r298>>2]=r335;HEAP32[r299>>2]=r335;HEAP32[r300>>2]=0;HEAP32[r301>>2]=0;HEAP32[r302>>2]=0;HEAP32[r303>>2]=0;r433=HEAP32[r130>>2];r434=_match(r335,r433,r335,2,r11,0,0);r435=HEAP32[r157>>2];r436=(r435|0)!=0;r437=(r306|0)==0;r438=r436&r437;r439=HEAP32[r299>>2];r440=r438?r439:r306;r441=r438?r335:r305;switch(r434|0){case-993:{r442=HEAP32[r303>>2];HEAP32[r144>>2]=r442;r443=r335;break};case-994:{r444=HEAP32[r298>>2];r445=r444>>>0>r335>>>0;if(r445){r443=r444}else{r9=118}break};case 0:case-995:case-992:{r9=118;break};case-996:{r412=r440;r413=r441;r414=0;break L105;break};default:{r446=r434;r9=136;break L105}}if(r9==118){r9=0;HEAP32[r144>>2]=0;r447=r335+1|0;r443=r447}do{if(r284){r9=127}else{r448=HEAP32[r289>>2];r449=(r448|0)==0;r450=HEAP32[r134>>2];if(!r449){r451=r335>>>0<r450>>>0;if(!r451){r9=127;break}r452=__pcre_is_newline(r335,r448,r450,r288,r52);r453=(r452|0)==0;r454=r453^1;r455=r242^1;r456=r454|r455;r457=r443>>>0>r133>>>0;r458=r456|r457;if(r458){r412=r440;r413=r441;r414=0;break L105}else{break}}r459=HEAP32[r288>>2];r460=-r459|0;r461=r450+r460|0;r462=r335>>>0>r461>>>0;if(r462){r9=127;break}r463=HEAP8[r335];r464=HEAP8[r290];r465=r463<<24>>24==r464<<24>>24;if(!r465){r9=127;break}r466=(r459|0)==1;if(r466){r412=r440;r413=r441;r414=0;break L105}r467=r335+1|0;r468=HEAP8[r467];r469=HEAP8[r291];r470=r468<<24>>24==r469<<24>>24;r471=r242^1;r472=r470|r471;r473=r443>>>0>r133>>>0;r474=r472|r473;if(r474){r412=r440;r413=r441;r414=0;break L105}}}while(0);if(r9==127){r9=0;r475=r242^1;r476=r443>>>0>r133>>>0;r477=r475|r476;if(r477){r412=r440;r413=r441;r414=0;break}}r478=r443>>>0>r12>>>0;do{if(r478){r479=r443-1|0;r480=HEAP8[r479];r481=r480<<24>>24==13;r482=r443>>>0<r133>>>0;r483=r481&r482;if(!r483){r484=r443;break}r485=HEAP8[r443];r486=r485<<24>>24==10;if(!r486){r484=r443;break}r487=HEAP32[r45>>2];r488=r487&2048;r489=(r488|0)==0;if(!r489){r484=r443;break}r490=HEAP32[r289>>2];r491=r490-1|0;r492=r491>>>0<2;if(!r492){r493=HEAP32[r288>>2];r494=(r493|0)==2;if(!r494){r484=r443;break}}r495=r443+1|0;r484=r495}else{r484=r443}}while(0);HEAP32[r159>>2]=0;r304=r404;r305=r441;r306=r440;r307=r484}do{if(r9==136){r496=(r446|0)==1;if(!r496){r497=r446;r498=r441;r499=r440;r500=(r497|0)==-999;if(!r500){r412=r499;r413=r498;r414=r497;break}}r501=(r217|0)==0;if(!r501){r502=(r201|0)>11;if(r502){r503=r7+8|0;r504=r503;r505=HEAP32[r225>>2];r506=r505+8|0;r507=r506;r508=r202<<2;r509=r508-8|0;_memcpy(r504,r507,r509)|0}r510=HEAP32[r302>>2];r511=(r510|0)>(r202|0);if(r511){r512=HEAP32[r224>>2];r513=r512|65536;HEAP32[r224>>2]=r513}r514=HEAP32[r225>>2];r515=r514;_free(r515)}r516=HEAP32[r224>>2];r517=r516&65536;r518=(r517|0)==0;r519=HEAP32[r302>>2];r520=(r519|0)<(r202|0);r521=r518|r520;if(r521){r522=(r519|0)/2&-1;r523=r522}else{r523=0}r524=(r519|0)/2&-1;r525=r15+30|0;r526=HEAP16[r525>>1];r527=r526&65535;r528=(r524|0)>(r527|0);r529=r528|r32;L219:do{if(!r529){r530=r527<<1;r531=r530+2|0;r532=(r531|0)>(r8|0);r533=r532?r8:r531;r534=r7+(r519<<2)|0;r535=r7+(r533<<2)|0;r536=r534;while(1){r537=r536>>>0<r535>>>0;if(!r537){break L219}r538=r536+4|0;HEAP32[r536>>2]=-1;r536=r538}}}while(0);r539=(r8|0)<2;if(r539){r540=0}else{r541=HEAP32[r298>>2];r542=HEAP32[r131>>2];r543=r541;r544=r542;r545=r543-r544|0;HEAP32[r7>>2]=r545;r546=r11+128|0;r547=HEAP32[r546>>2];r548=r547;r549=r548-r544|0;r550=r7+4|0;HEAP32[r550>>2]=r549;r540=r523}if(r79){r26=r540;STACKTOP=r10;return r26}r551=r2|0;r552=HEAP32[r551>>2];r553=r552&32;r554=(r553|0)==0;if(r554){r26=r540;STACKTOP=r10;return r26}r555=HEAP32[r159>>2];r556=r2+24|0;r557=HEAP32[r556>>2];HEAP32[r557>>2]=r555;r26=r540;STACKTOP=r10;return r26}}while(0);r558=(r217|0)==0;if(!r558){r559=HEAP32[r225>>2];r560=r559;_free(r560)}if(!((r414|0)==0|(r414|0)==-12)){r26=r414;STACKTOP=r10;return r26}r561=(r413|0)==0;do{if(r561){r562=-1}else{HEAP32[r159>>2]=0;r563=(r8|0)>1;if(!r563){r562=-12;break}r564=r412;r565=r3;r566=r564-r565|0;HEAP32[r7>>2]=r566;r567=r7+4|0;HEAP32[r567>>2]=r4;r568=(r8|0)>2;if(!r568){r562=-12;break}r569=r413;r570=r569-r565|0;r571=r7+8|0;HEAP32[r571>>2]=r570;r562=-12}}while(0);if(r79){r26=r562;STACKTOP=r10;return r26}r572=r2|0;r573=HEAP32[r572>>2];r574=r573&32;r575=(r574|0)==0;if(r575){r26=r562;STACKTOP=r10;return r26}r576=HEAP32[r158>>2];r577=r2+24|0;r578=HEAP32[r577>>2];HEAP32[r578>>2]=r576;r26=r562;STACKTOP=r10;return r26}function _match(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472,r473,r474,r475,r476,r477,r478,r479,r480,r481,r482,r483,r484,r485,r486,r487,r488,r489,r490,r491,r492,r493,r494,r495,r496,r497,r498,r499,r500,r501,r502,r503,r504,r505,r506,r507,r508,r509,r510,r511,r512,r513,r514,r515,r516,r517,r518,r519,r520,r521,r522,r523,r524,r525,r526,r527,r528,r529,r530,r531,r532,r533,r534,r535,r536,r537,r538,r539,r540,r541,r542,r543,r544,r545,r546,r547,r548,r549,r550,r551,r552,r553,r554,r555,r556,r557,r558,r559,r560,r561,r562,r563,r564,r565,r566,r567,r568,r569,r570,r571,r572,r573,r574,r575,r576,r577,r578,r579,r580,r581,r582,r583,r584,r585,r586,r587,r588,r589,r590,r591,r592,r593,r594,r595,r596,r597,r598,r599,r600,r601,r602,r603,r604,r605,r606,r607,r608,r609,r610,r611,r612,r613,r614,r615,r616,r617,r618,r619,r620,r621,r622,r623,r624,r625,r626,r627,r628,r629,r630,r631,r632,r633,r634,r635,r636,r637,r638,r639,r640,r641,r642,r643,r644,r645,r646,r647,r648,r649,r650,r651,r652,r653,r654,r655,r656,r657,r658,r659,r660,r661,r662,r663,r664,r665,r666,r667,r668,r669,r670,r671,r672,r673,r674,r675,r676,r677,r678,r679,r680,r681,r682,r683,r684,r685,r686,r687,r688,r689,r690,r691,r692,r693,r694,r695,r696,r697,r698,r699,r700,r701,r702,r703,r704,r705,r706,r707,r708,r709,r710,r711,r712,r713,r714,r715,r716,r717,r718,r719,r720,r721,r722,r723,r724,r725,r726,r727,r728,r729,r730,r731,r732,r733,r734,r735,r736,r737,r738,r739,r740,r741,r742,r743,r744,r745,r746,r747,r748,r749,r750,r751,r752,r753,r754,r755,r756,r757,r758,r759,r760,r761,r762,r763,r764,r765,r766,r767,r768,r769,r770,r771,r772,r773,r774,r775,r776,r777,r778,r779,r780,r781,r782,r783,r784,r785,r786,r787,r788,r789,r790,r791,r792,r793,r794,r795,r796,r797,r798,r799,r800,r801,r802,r803,r804,r805,r806,r807,r808,r809,r810,r811,r812,r813,r814,r815,r816,r817,r818,r819,r820,r821,r822,r823,r824,r825,r826,r827,r828,r829,r830,r831,r832,r833,r834,r835,r836,r837,r838,r839,r840,r841,r842,r843,r844,r845,r846,r847,r848,r849,r850,r851,r852,r853,r854,r855,r856,r857,r858,r859,r860,r861,r862,r863,r864,r865,r866,r867,r868,r869,r870,r871,r872,r873,r874,r875,r876,r877,r878,r879,r880,r881,r882,r883,r884,r885,r886,r887,r888,r889,r890,r891,r892,r893,r894,r895,r896,r897,r898,r899,r900,r901,r902,r903,r904,r905,r906,r907,r908,r909,r910,r911,r912,r913,r914,r915,r916,r917,r918,r919,r920,r921,r922,r923,r924,r925,r926,r927,r928,r929,r930,r931,r932,r933,r934,r935,r936,r937,r938,r939,r940,r941,r942,r943,r944,r945,r946,r947,r948,r949,r950,r951,r952,r953,r954,r955,r956,r957,r958,r959,r960,r961,r962,r963,r964,r965,r966,r967,r968,r969,r970,r971,r972,r973,r974,r975,r976,r977,r978,r979,r980,r981,r982,r983,r984,r985,r986,r987,r988,r989,r990,r991,r992,r993,r994,r995,r996,r997,r998,r999,r1000,r1001,r1002,r1003,r1004,r1005,r1006,r1007,r1008,r1009,r1010,r1011,r1012,r1013,r1014,r1015,r1016,r1017,r1018,r1019,r1020,r1021,r1022,r1023,r1024,r1025,r1026,r1027,r1028,r1029,r1030,r1031,r1032,r1033,r1034,r1035,r1036,r1037,r1038,r1039,r1040,r1041,r1042,r1043,r1044,r1045,r1046,r1047,r1048,r1049,r1050,r1051,r1052,r1053,r1054,r1055,r1056,r1057,r1058,r1059,r1060,r1061,r1062,r1063,r1064,r1065,r1066,r1067,r1068,r1069,r1070,r1071,r1072,r1073,r1074,r1075,r1076,r1077,r1078,r1079,r1080,r1081,r1082,r1083,r1084,r1085,r1086,r1087,r1088,r1089,r1090,r1091,r1092,r1093,r1094,r1095,r1096,r1097,r1098,r1099,r1100,r1101,r1102,r1103,r1104,r1105,r1106,r1107,r1108,r1109,r1110,r1111,r1112,r1113,r1114,r1115,r1116,r1117,r1118,r1119,r1120,r1121,r1122,r1123,r1124,r1125,r1126,r1127,r1128,r1129,r1130,r1131,r1132,r1133,r1134,r1135,r1136,r1137,r1138,r1139,r1140,r1141,r1142,r1143,r1144,r1145,r1146,r1147,r1148,r1149,r1150,r1151,r1152,r1153,r1154,r1155,r1156,r1157,r1158,r1159,r1160,r1161,r1162,r1163,r1164,r1165,r1166,r1167,r1168,r1169,r1170,r1171,r1172,r1173,r1174,r1175,r1176,r1177,r1178,r1179,r1180,r1181,r1182,r1183,r1184,r1185,r1186,r1187,r1188,r1189,r1190,r1191,r1192,r1193,r1194,r1195,r1196,r1197,r1198,r1199,r1200,r1201,r1202,r1203,r1204,r1205,r1206,r1207,r1208,r1209,r1210,r1211,r1212,r1213,r1214,r1215,r1216,r1217,r1218,r1219,r1220,r1221,r1222,r1223,r1224,r1225,r1226,r1227,r1228,r1229,r1230,r1231,r1232,r1233,r1234,r1235,r1236,r1237,r1238,r1239,r1240,r1241,r1242,r1243,r1244,r1245,r1246,r1247,r1248,r1249,r1250,r1251,r1252,r1253,r1254,r1255,r1256,r1257,r1258,r1259,r1260,r1261,r1262,r1263,r1264,r1265,r1266,r1267,r1268,r1269,r1270,r1271,r1272,r1273,r1274,r1275,r1276,r1277,r1278,r1279,r1280,r1281,r1282,r1283,r1284,r1285,r1286,r1287,r1288,r1289,r1290,r1291,r1292,r1293,r1294,r1295,r1296,r1297,r1298,r1299,r1300,r1301,r1302,r1303,r1304,r1305,r1306,r1307,r1308,r1309,r1310,r1311,r1312,r1313,r1314,r1315,r1316,r1317,r1318,r1319,r1320,r1321,r1322,r1323,r1324,r1325,r1326,r1327,r1328,r1329,r1330,r1331,r1332,r1333,r1334,r1335,r1336,r1337,r1338,r1339,r1340,r1341,r1342,r1343,r1344,r1345,r1346,r1347,r1348,r1349,r1350,r1351,r1352,r1353,r1354,r1355,r1356,r1357,r1358,r1359,r1360,r1361,r1362,r1363,r1364,r1365,r1366,r1367,r1368,r1369,r1370,r1371,r1372,r1373,r1374,r1375,r1376,r1377,r1378,r1379,r1380,r1381,r1382,r1383,r1384,r1385,r1386,r1387,r1388,r1389,r1390,r1391,r1392,r1393,r1394,r1395,r1396,r1397,r1398,r1399,r1400,r1401,r1402,r1403,r1404,r1405,r1406,r1407,r1408,r1409,r1410,r1411,r1412,r1413,r1414,r1415,r1416,r1417,r1418,r1419,r1420,r1421,r1422,r1423,r1424,r1425,r1426,r1427,r1428,r1429,r1430,r1431,r1432,r1433,r1434,r1435,r1436,r1437,r1438,r1439,r1440,r1441,r1442,r1443,r1444,r1445,r1446,r1447,r1448,r1449,r1450,r1451,r1452,r1453,r1454,r1455,r1456,r1457,r1458,r1459,r1460,r1461,r1462,r1463,r1464,r1465,r1466,r1467,r1468,r1469,r1470,r1471,r1472,r1473,r1474,r1475,r1476,r1477,r1478,r1479,r1480,r1481,r1482,r1483,r1484,r1485,r1486,r1487,r1488,r1489,r1490,r1491,r1492,r1493,r1494,r1495,r1496,r1497,r1498,r1499,r1500,r1501,r1502,r1503,r1504,r1505,r1506,r1507,r1508,r1509,r1510,r1511,r1512,r1513,r1514,r1515,r1516,r1517,r1518,r1519,r1520,r1521,r1522,r1523,r1524,r1525,r1526,r1527,r1528,r1529,r1530,r1531,r1532,r1533,r1534,r1535,r1536,r1537,r1538,r1539,r1540,r1541,r1542,r1543,r1544,r1545,r1546,r1547,r1548,r1549,r1550,r1551,r1552,r1553,r1554,r1555,r1556,r1557,r1558,r1559,r1560,r1561,r1562,r1563,r1564,r1565,r1566,r1567,r1568,r1569,r1570,r1571,r1572,r1573,r1574,r1575,r1576,r1577,r1578,r1579,r1580,r1581,r1582,r1583,r1584,r1585,r1586,r1587,r1588,r1589,r1590,r1591,r1592,r1593,r1594,r1595,r1596,r1597,r1598,r1599,r1600,r1601,r1602,r1603,r1604,r1605,r1606,r1607,r1608,r1609,r1610,r1611,r1612,r1613,r1614,r1615,r1616,r1617,r1618,r1619,r1620,r1621,r1622,r1623,r1624,r1625,r1626,r1627,r1628,r1629,r1630,r1631,r1632,r1633,r1634,r1635,r1636,r1637,r1638,r1639,r1640,r1641,r1642,r1643,r1644,r1645,r1646,r1647,r1648,r1649,r1650,r1651,r1652,r1653,r1654,r1655,r1656,r1657,r1658,r1659,r1660,r1661,r1662,r1663,r1664,r1665,r1666,r1667,r1668,r1669,r1670,r1671,r1672,r1673,r1674,r1675,r1676,r1677,r1678,r1679,r1680,r1681,r1682,r1683,r1684,r1685,r1686,r1687,r1688,r1689,r1690,r1691,r1692,r1693,r1694,r1695,r1696,r1697,r1698,r1699,r1700,r1701,r1702,r1703,r1704,r1705,r1706,r1707,r1708,r1709,r1710,r1711,r1712,r1713,r1714,r1715,r1716,r1717,r1718,r1719,r1720,r1721,r1722,r1723,r1724,r1725,r1726,r1727,r1728,r1729,r1730,r1731,r1732,r1733,r1734,r1735,r1736,r1737,r1738,r1739,r1740,r1741,r1742,r1743,r1744,r1745,r1746,r1747,r1748,r1749,r1750,r1751,r1752,r1753,r1754,r1755,r1756,r1757,r1758,r1759,r1760,r1761,r1762,r1763,r1764,r1765,r1766,r1767,r1768,r1769,r1770,r1771,r1772,r1773,r1774,r1775,r1776,r1777,r1778,r1779,r1780,r1781,r1782,r1783,r1784,r1785,r1786,r1787,r1788,r1789,r1790,r1791,r1792,r1793,r1794,r1795,r1796,r1797,r1798,r1799,r1800,r1801,r1802,r1803,r1804,r1805,r1806,r1807,r1808,r1809,r1810,r1811,r1812,r1813,r1814,r1815,r1816,r1817,r1818,r1819,r1820,r1821,r1822,r1823,r1824,r1825,r1826,r1827,r1828,r1829,r1830,r1831,r1832,r1833,r1834,r1835,r1836,r1837,r1838,r1839,r1840,r1841,r1842,r1843,r1844,r1845,r1846,r1847,r1848,r1849,r1850,r1851,r1852,r1853,r1854,r1855,r1856,r1857,r1858,r1859,r1860,r1861,r1862,r1863,r1864,r1865,r1866,r1867,r1868,r1869,r1870,r1871,r1872,r1873,r1874,r1875,r1876,r1877,r1878,r1879,r1880,r1881,r1882,r1883,r1884,r1885,r1886,r1887,r1888,r1889,r1890,r1891,r1892,r1893,r1894,r1895,r1896,r1897,r1898,r1899,r1900,r1901,r1902,r1903,r1904,r1905,r1906,r1907,r1908,r1909,r1910,r1911,r1912,r1913,r1914,r1915,r1916,r1917,r1918,r1919,r1920,r1921,r1922,r1923,r1924,r1925,r1926,r1927,r1928,r1929,r1930,r1931,r1932,r1933,r1934,r1935,r1936,r1937,r1938,r1939,r1940,r1941,r1942,r1943,r1944,r1945,r1946,r1947,r1948,r1949,r1950,r1951,r1952,r1953,r1954,r1955,r1956,r1957,r1958,r1959,r1960,r1961,r1962,r1963,r1964,r1965,r1966,r1967,r1968,r1969,r1970,r1971,r1972,r1973,r1974,r1975,r1976,r1977,r1978,r1979,r1980,r1981,r1982,r1983,r1984,r1985,r1986,r1987,r1988,r1989,r1990,r1991,r1992,r1993,r1994,r1995,r1996,r1997,r1998,r1999,r2000,r2001,r2002,r2003,r2004,r2005,r2006,r2007,r2008,r2009,r2010,r2011,r2012,r2013,r2014,r2015,r2016,r2017,r2018,r2019,r2020,r2021,r2022,r2023,r2024,r2025,r2026,r2027,r2028,r2029,r2030,r2031,r2032,r2033,r2034,r2035,r2036,r2037,r2038,r2039,r2040,r2041,r2042,r2043,r2044,r2045,r2046,r2047,r2048,r2049,r2050,r2051,r2052,r2053,r2054,r2055,r2056,r2057,r2058,r2059,r2060,r2061,r2062,r2063,r2064,r2065,r2066,r2067,r2068,r2069,r2070,r2071,r2072,r2073,r2074,r2075,r2076,r2077,r2078,r2079,r2080,r2081,r2082,r2083,r2084,r2085,r2086,r2087,r2088,r2089,r2090,r2091,r2092,r2093,r2094,r2095,r2096,r2097,r2098,r2099,r2100,r2101,r2102,r2103,r2104,r2105,r2106,r2107,r2108,r2109,r2110,r2111,r2112,r2113,r2114,r2115,r2116,r2117,r2118,r2119,r2120,r2121,r2122,r2123,r2124,r2125,r2126,r2127,r2128,r2129,r2130,r2131,r2132,r2133,r2134,r2135,r2136,r2137,r2138,r2139,r2140,r2141,r2142,r2143,r2144,r2145,r2146,r2147,r2148,r2149,r2150,r2151,r2152,r2153,r2154,r2155,r2156,r2157,r2158,r2159,r2160,r2161,r2162,r2163,r2164,r2165,r2166,r2167,r2168,r2169,r2170,r2171,r2172,r2173,r2174,r2175,r2176,r2177,r2178,r2179,r2180,r2181,r2182,r2183,r2184,r2185,r2186,r2187,r2188,r2189,r2190,r2191,r2192,r2193,r2194,r2195,r2196,r2197,r2198,r2199,r2200,r2201,r2202,r2203,r2204,r2205,r2206,r2207,r2208,r2209,r2210,r2211,r2212,r2213,r2214,r2215,r2216,r2217,r2218,r2219,r2220,r2221,r2222,r2223,r2224,r2225,r2226,r2227,r2228,r2229,r2230,r2231,r2232,r2233,r2234,r2235,r2236,r2237,r2238,r2239,r2240,r2241,r2242,r2243,r2244,r2245,r2246,r2247,r2248,r2249,r2250,r2251,r2252,r2253,r2254,r2255,r2256,r2257,r2258,r2259,r2260,r2261,r2262,r2263,r2264,r2265,r2266,r2267,r2268,r2269,r2270,r2271,r2272,r2273,r2274,r2275,r2276,r2277,r2278,r2279,r2280,r2281,r2282,r2283,r2284,r2285,r2286,r2287,r2288,r2289,r2290,r2291,r2292,r2293,r2294,r2295,r2296,r2297,r2298,r2299,r2300,r2301,r2302,r2303,r2304,r2305,r2306,r2307,r2308,r2309,r2310,r2311,r2312,r2313,r2314,r2315,r2316,r2317,r2318,r2319,r2320,r2321,r2322,r2323,r2324,r2325,r2326,r2327,r2328,r2329,r2330,r2331,r2332,r2333,r2334,r2335,r2336,r2337,r2338,r2339,r2340,r2341,r2342,r2343,r2344,r2345,r2346,r2347,r2348,r2349,r2350,r2351,r2352,r2353,r2354,r2355,r2356,r2357,r2358,r2359,r2360,r2361,r2362,r2363,r2364,r2365,r2366,r2367,r2368,r2369,r2370,r2371,r2372,r2373,r2374,r2375,r2376,r2377,r2378,r2379,r2380,r2381,r2382,r2383,r2384,r2385,r2386,r2387,r2388,r2389,r2390,r2391,r2392,r2393,r2394,r2395,r2396,r2397,r2398,r2399,r2400,r2401,r2402,r2403,r2404,r2405,r2406,r2407,r2408,r2409,r2410,r2411,r2412,r2413,r2414,r2415,r2416,r2417,r2418,r2419,r2420,r2421,r2422,r2423,r2424,r2425,r2426,r2427,r2428,r2429,r2430,r2431,r2432,r2433,r2434,r2435,r2436,r2437,r2438,r2439,r2440,r2441,r2442,r2443,r2444,r2445,r2446,r2447,r2448,r2449,r2450,r2451,r2452,r2453,r2454,r2455,r2456,r2457,r2458,r2459,r2460,r2461,r2462,r2463,r2464,r2465,r2466,r2467,r2468,r2469,r2470,r2471,r2472,r2473,r2474,r2475,r2476,r2477,r2478,r2479,r2480,r2481,r2482,r2483,r2484,r2485,r2486,r2487,r2488,r2489,r2490,r2491,r2492,r2493,r2494,r2495,r2496,r2497,r2498,r2499,r2500,r2501,r2502,r2503,r2504,r2505,r2506,r2507,r2508,r2509,r2510,r2511,r2512,r2513,r2514,r2515,r2516,r2517,r2518,r2519,r2520,r2521,r2522,r2523,r2524,r2525,r2526,r2527,r2528,r2529,r2530,r2531,r2532,r2533,r2534,r2535,r2536,r2537,r2538,r2539,r2540,r2541,r2542,r2543,r2544,r2545,r2546,r2547,r2548,r2549,r2550,r2551,r2552,r2553,r2554,r2555,r2556,r2557,r2558,r2559,r2560,r2561,r2562,r2563,r2564,r2565,r2566,r2567,r2568,r2569,r2570,r2571,r2572,r2573,r2574,r2575,r2576,r2577,r2578,r2579,r2580,r2581,r2582,r2583,r2584,r2585,r2586,r2587,r2588,r2589,r2590,r2591,r2592,r2593,r2594,r2595,r2596,r2597,r2598,r2599,r2600,r2601,r2602,r2603,r2604,r2605,r2606,r2607,r2608,r2609,r2610,r2611,r2612,r2613,r2614,r2615,r2616,r2617,r2618,r2619,r2620,r2621,r2622,r2623,r2624,r2625,r2626,r2627,r2628,r2629,r2630,r2631,r2632,r2633,r2634,r2635,r2636,r2637,r2638,r2639,r2640,r2641,r2642,r2643,r2644,r2645,r2646,r2647,r2648,r2649,r2650,r2651,r2652,r2653,r2654,r2655,r2656,r2657,r2658,r2659,r2660,r2661,r2662,r2663,r2664,r2665,r2666,r2667,r2668,r2669,r2670,r2671,r2672,r2673,r2674,r2675,r2676,r2677,r2678,r2679,r2680,r2681,r2682,r2683,r2684,r2685,r2686,r2687,r2688,r2689,r2690,r2691,r2692,r2693,r2694,r2695,r2696,r2697,r2698,r2699,r2700,r2701,r2702,r2703,r2704,r2705,r2706,r2707,r2708,r2709,r2710,r2711,r2712,r2713,r2714,r2715,r2716,r2717,r2718,r2719,r2720,r2721,r2722,r2723,r2724,r2725,r2726,r2727,r2728,r2729,r2730,r2731,r2732,r2733,r2734,r2735,r2736,r2737,r2738,r2739,r2740,r2741,r2742,r2743,r2744,r2745,r2746,r2747,r2748,r2749,r2750,r2751,r2752,r2753,r2754,r2755,r2756,r2757,r2758,r2759,r2760,r2761,r2762,r2763,r2764,r2765,r2766,r2767,r2768,r2769,r2770,r2771,r2772,r2773,r2774,r2775,r2776,r2777,r2778,r2779,r2780,r2781,r2782,r2783,r2784,r2785,r2786,r2787,r2788,r2789,r2790,r2791,r2792,r2793,r2794,r2795,r2796,r2797,r2798,r2799,r2800,r2801,r2802,r2803,r2804,r2805,r2806,r2807,r2808,r2809,r2810,r2811,r2812,r2813,r2814,r2815,r2816,r2817,r2818,r2819,r2820,r2821,r2822,r2823,r2824,r2825,r2826,r2827,r2828,r2829,r2830,r2831,r2832,r2833,r2834,r2835,r2836,r2837,r2838,r2839,r2840,r2841,r2842,r2843,r2844,r2845,r2846,r2847,r2848,r2849,r2850,r2851,r2852,r2853,r2854,r2855,r2856,r2857,r2858,r2859,r2860,r2861,r2862,r2863,r2864,r2865,r2866,r2867,r2868,r2869,r2870,r2871,r2872,r2873,r2874,r2875,r2876,r2877,r2878,r2879,r2880,r2881,r2882,r2883,r2884,r2885,r2886,r2887,r2888,r2889,r2890,r2891,r2892,r2893,r2894,r2895,r2896,r2897,r2898,r2899,r2900,r2901,r2902,r2903,r2904,r2905,r2906,r2907,r2908,r2909,r2910,r2911,r2912,r2913,r2914,r2915,r2916,r2917,r2918,r2919,r2920,r2921,r2922,r2923,r2924,r2925,r2926,r2927,r2928,r2929,r2930,r2931,r2932,r2933,r2934,r2935,r2936,r2937,r2938,r2939,r2940,r2941,r2942,r2943,r2944,r2945,r2946,r2947,r2948,r2949,r2950,r2951,r2952,r2953,r2954,r2955,r2956,r2957,r2958,r2959,r2960,r2961,r2962,r2963,r2964,r2965,r2966,r2967,r2968,r2969,r2970,r2971,r2972,r2973,r2974,r2975,r2976,r2977,r2978,r2979,r2980,r2981,r2982,r2983,r2984,r2985,r2986,r2987,r2988,r2989,r2990,r2991,r2992,r2993,r2994,r2995,r2996,r2997,r2998,r2999,r3000,r3001,r3002,r3003,r3004,r3005,r3006,r3007,r3008,r3009,r3010,r3011,r3012,r3013,r3014,r3015,r3016,r3017,r3018,r3019,r3020,r3021,r3022,r3023,r3024,r3025,r3026,r3027,r3028,r3029,r3030,r3031,r3032,r3033,r3034,r3035,r3036,r3037,r3038,r3039,r3040,r3041,r3042,r3043,r3044,r3045,r3046,r3047,r3048,r3049,r3050,r3051,r3052,r3053,r3054,r3055,r3056,r3057,r3058,r3059;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+160|0;r10=r9;r11=r9+8;r12=r9+32;r13=r9+152;HEAP32[r10>>2]=r7;r14=(r2|0)==0;if(r14){r15=(r7|0)==0;if(!r15){r16=r10;r17=r1;r18=r16-r17|0;r19=(r18|0)>0;r20=-r18|0;r21=r19?r20:r18;STACKTOP=r9;return r21}r22=r10;r23=_match(r22,0,0,0,0,0,1);r24=r23;STACKTOP=r9;return r24}r25=r5|0;r26=r5+4|0;r27=r5+8|0;r28=r5+152|0;r29=r13+4|0;r30=r13|0;r31=r5+40|0;r32=r5+44|0;r33=r5+172|0;r34=r5+124|0;r35=r5+140|0;r36=r5+128|0;r37=r5+20|0;r38=r5+112|0;r39=r5+12|0;r40=r5+16|0;r41=r5+144|0;r42=r5+116|0;r43=r5+164|0;r44=r5+48|0;r45=r5+36|0;r46=r5+132|0;r47=r11+4|0;r48=r11+16|0;r49=r11+20|0;r50=r11|0;r51=r11+12|0;r52=r12|0;r53=r11+8|0;r54=r5+68|0;r55=r5+120|0;r56=r5+24|0;r57=r5+28|0;r58=r5+52|0;r59=r5+53|0;r60=r5+148|0;r61=r5+72|0;r62=r5+136|0;r63=r5+100|0;r64=r5+88|0;r65=r5+64|0;r66=r5+104|0;r67=r5+80|0;r68=r5+56|0;r69=r5+60|0;r70=r5+108|0;r71=r5+180|0;r72=r1;r73=r2;r74=r3;r75=r4;r76=r6;L8:while(1){r77=HEAP32[r25>>2];r78=r77+1|0;HEAP32[r25>>2]=r78;r79=HEAP32[r26>>2];r80=r77>>>0<r79>>>0;if(!r80){r24=-8;r8=1005;break}r81=HEAP32[r10>>2];r82=HEAP32[r27>>2];r83=r81>>>0<r82>>>0;if(!r83){r24=-21;r8=1017;break}r84=HEAP32[r28>>2];r85=(r84|0)==2;if(r85){HEAP32[r29>>2]=r72;HEAP32[r30>>2]=r76;HEAP32[r28>>2]=0;r86=r72;r87=r73;r88=r74;r89=r75;r90=r13}else{r86=r72;r87=r73;r88=r74;r89=r75;r90=r76}L14:while(1){r91=HEAP8[r87];r92=r91&255;L16:do{switch(r92|0){case 19:{r93=HEAP32[r55>>2];r94=r86>>>0<r93>>>0;if(!r94){r8=428;break L8}r95=r86+1|0;r96=HEAP8[r86];r97=r96&255;if(!((r97|0)==9|(r97|0)==32|(r97|0)==160)){r24=0;r8=992;break L8}r98=r87+1|0;r86=r95;r87=r98;r88=r88;r89=r89;r90=r90;continue L14;break};case 20:{r99=HEAP32[r55>>2];r100=r86>>>0<r99>>>0;if(!r100){r8=435;break L8}r101=HEAP8[r86];r102=r101&255;switch(r102|0){case 10:case 11:case 12:case 13:case 133:{r24=0;r8=995;break L8;break};default:{}}r103=r86+1|0;r104=r87+1|0;r86=r103;r87=r104;r88=r88;r89=r89;r90=r90;continue L14;break};case 29:{r105=HEAP32[r55>>2];r106=r105;r107=r86;r108=r106-r107|0;r109=(r108|0)<1;if(r109){r8=541;break L8}r110=r87+1|0;r111=HEAP8[r110];r112=HEAP8[r86];r113=r111<<24>>24==r112<<24>>24;if(!r113){r24=0;r8=1001;break L8}r114=r86+1|0;r115=r87+2|0;r86=r114;r87=r115;r88=r88;r89=r89;r90=r90;continue L14;break};case 30:{r116=HEAP32[r55>>2];r117=r86>>>0<r116>>>0;if(!r117){r8=548;break L8}r118=r87+1|0;r119=HEAP8[r118];r120=r119&255;r121=HEAP32[r68>>2];r122=r121+r120|0;r123=HEAP8[r122];r124=HEAP8[r86];r125=r124&255;r126=r121+r125|0;r127=HEAP8[r126];r128=r123<<24>>24==r127<<24>>24;if(!r128){r24=0;r8=1031;break L8}r129=r86+1|0;r130=r87+2|0;r86=r129;r87=r130;r88=r88;r89=r89;r90=r90;continue L14;break};case 149:{r8=11;break L8;break};case 111:case 110:{r131=r87+33|0;r132=HEAP8[r131];r133=r132&255;switch(r133|0){case 98:case 99:case 100:case 101:case 102:case 103:case 106:case 107:case 108:{r134=r87+34|0;r135=r133-98|0;r136=r135>>>0<8;r137=r135&1;r138=r136?0:1;r139=r136?r137:0;r140=r135+200|0;r141=HEAP8[r140];r142=r141<<24>>24;r143=r135+216|0;r144=HEAP8[r143];r145=r144<<24>>24;r146=975>>>(r135>>>0);r147=r146&1;r148=(r147|0)==0;r149=r148?r145:2147483647;r150=r134;r151=r139;r152=r138;r153=r142;r154=r149;break};case 104:case 105:case 109:{r155=r132<<24>>24==105;r156=r155&1;r157=r132<<24>>24==109;r158=r157&1;r159=r87+34|0;r160=HEAP8[r159];r161=r160&255;r162=r161<<8;r163=r87+35|0;r164=HEAP8[r163];r165=r164&255;r166=r162|r165;r167=r87+36|0;r168=HEAP8[r167];r169=r168&255;r170=r169<<8;r171=r87+37|0;r172=HEAP8[r171];r173=r172&255;r174=r170|r173;r175=(r174|0)==0;r176=r175?2147483647:r174;r177=r87+38|0;r150=r177;r151=r156;r152=r158;r153=r166;r154=r176;break};default:{r150=r131;r151=0;r152=0;r153=1;r154=1}}r178=1;r179=r86;while(1){r180=(r178|0)>(r153|0);if(r180){break}r181=HEAP32[r55>>2];r182=r179>>>0<r181>>>0;if(!r182){r8=512;break L8}r183=HEAP8[r179];r184=r183&255;r185=r184>>>3;r186=r185+1|0;r187=r87+r186|0;r188=HEAP8[r187];r189=r188&255;r190=r184&7;r191=1<<r190;r192=r189&r191;r193=(r192|0)==0;if(r193){r24=0;r8=1024;break L8}r194=r179+1|0;r195=r178+1|0;r178=r195;r179=r194}r196=(r153|0)==(r154|0);if(r196){r86=r179;r87=r150;r88=r88;r89=r89;r90=r90;continue L14}r197=(r151|0)==0;if(r197){r198=r153;r199=r179}else{r200=r153;r201=r179;r8=520;break L8}while(1){r202=(r198|0)<(r154|0);if(!r202){break}r203=HEAP32[r55>>2];r204=r199>>>0<r203>>>0;if(!r204){r8=531;break}r205=HEAP8[r199];r206=r205&255;r207=r206>>>3;r208=r207+1|0;r209=r87+r208|0;r210=HEAP8[r209];r211=r210&255;r212=r206&7;r213=1<<r212;r214=r211&r213;r215=(r214|0)==0;if(r215){break}r216=r199+1|0;r217=r198+1|0;r198=r217;r199=r216}do{if(r8==531){r8=0;r218=HEAP32[r62>>2];r219=(r218|0)==0;if(r219){break}r220=HEAP32[r46>>2];r221=r199>>>0>r220>>>0;if(!r221){break}HEAP32[r63>>2]=1;r222=(r218|0)>1;if(r222){r24=-12;r8=996;break L8}}}while(0);r223=(r152|0)==0;if(r223){r224=r199;r8=537;break L8}else{r86=r199;r87=r150;r88=r88;r89=r89;r90=r90;continue L14}break};case 18:{r225=HEAP32[r55>>2];r226=r86>>>0<r225>>>0;if(!r226){r8=421;break L8}r227=HEAP8[r86];r228=r227&255;if((r228|0)==9|(r228|0)==32|(r228|0)==160){r24=0;r8=1016;break L8}r229=r86+1|0;r230=r87+1|0;r86=r229;r87=r230;r88=r88;r89=r89;r90=r90;continue L14;break};case 113:case 114:{r231=r91<<24>>24==114;r232=r231&1;r233=r87+1|0;r234=HEAP8[r233];r235=r234&255;r236=r235<<8;r237=r87+2|0;r238=HEAP8[r237];r239=r238&255;r240=r236|r239;r241=r240<<1;r242=r87+3|0;r243=(r241|0)<(r89|0);do{if(r243){r244=HEAP32[r39>>2];r245=r244+(r241<<2)|0;r246=HEAP32[r245>>2];r247=(r246|0)<0;if(r247){break}r248=r241|1;r249=r244+(r248<<2)|0;r250=HEAP32[r249>>2];r251=r250-r246|0;r252=r242;r253=r232;r254=r241;r255=r251;r8=458;break L16}}while(0);r256=HEAP32[r67>>2];r257=(r256|0)==0;r258=r257<<31>>31;r252=r242;r253=r232;r254=r241;r255=r258;r8=458;break};case 11:{r259=HEAP32[r55>>2];r260=r86>>>0<r259>>>0;if(!r260){r8=401;break L8}r261=HEAP8[r86];r262=r261&255;r263=HEAP32[r65>>2];r264=r263+r262|0;r265=HEAP8[r264];r266=r265&16;r267=r266<<24>>24==0;if(r267){r24=0;r8=1021;break L8}r268=r86+1|0;r269=r87+1|0;r86=r268;r87=r269;r88=r88;r89=r89;r90=r90;continue L14;break};case 41:case 54:{r270=r87+1|0;r271=HEAP8[r270];r272=r271&255;r273=r272<<8;r274=r87+2|0;r275=HEAP8[r274];r276=r275&255;r277=r273|r276;r278=r87+3|0;r279=r278;r280=0;r281=0;r282=r277;r283=r277;r8=563;break};case 45:case 58:{r284=1;r8=556;break};case 39:case 52:case 40:case 53:{r284=0;r8=556;break};case 42:case 55:{r285=r87+1|0;r279=r285;r280=0;r281=1;r282=0;r283=2147483647;r8=563;break};case 43:case 56:{r286=r87+1|0;r279=r286;r280=0;r281=1;r282=1;r283=2147483647;r8=563;break};case 44:case 57:{r287=r87+1|0;r279=r287;r280=0;r281=1;r282=0;r283=1;r8=563;break};case 33:case 46:case 34:case 47:case 35:case 48:case 36:case 49:case 37:case 50:case 38:case 51:{r288=r87+1|0;r289=(r91&255)<46;r290=r289?33:46;r291=r92-r290|0;r292=r291&1;r293=r291+200|0;r294=HEAP8[r293];r295=r294<<24>>24;r296=r291+216|0;r297=HEAP8[r296];r298=r297<<24>>24;r299=975>>>(r291>>>0);r300=r299&1;r301=(r300|0)==0;r302=r301?r298:2147483647;r279=r288;r280=r292;r281=0;r282=r295;r283=r302;r8=563;break};case 17:{r303=HEAP32[r55>>2];r304=r86>>>0<r303>>>0;if(!r304){r8=408;break L8}r305=r86+1|0;r306=HEAP8[r86];r307=r306&255;L70:do{switch(r307|0){case 11:case 12:case 133:{r308=HEAP32[r66>>2];r309=(r308|0)==0;if(r309){r310=r305}else{r24=0;r8=1013;break L8}break};case 10:{r310=r305;break};case 13:{r311=r305>>>0<r303>>>0;if(r311){r312=HEAP8[r305];r313=r312<<24>>24==10;r314=r86+2|0;r315=r313?r314:r305;r310=r315;break L70}r316=HEAP32[r62>>2];r317=(r316|0)==0;if(r317){r310=r305;break L70}r318=HEAP32[r46>>2];r319=r305>>>0>r318>>>0;if(!r319){r310=r305;break L70}HEAP32[r63>>2]=1;r320=(r316|0)>1;if(r320){r24=-12;r8=1012;break L8}else{r310=r305}break};default:{r24=0;r8=1046;break L8}}}while(0);r321=r87+1|0;r86=r310;r87=r321;r88=r88;r89=r89;r90=r90;continue L14;break};case 21:{r322=HEAP32[r55>>2];r323=r86>>>0<r322>>>0;if(!r323){r8=442;break L8}r324=r86+1|0;r325=HEAP8[r86];r326=r325&255;switch(r326|0){case 10:case 11:case 12:case 13:case 133:{break};default:{r24=0;r8=1049;break L8}}r327=r87+1|0;r86=r324;r87=r327;r88=r88;r89=r89;r90=r90;continue L14;break};case 115:case 116:{r328=r91<<24>>24==116;r329=r328&1;r330=r87+3|0;r331=HEAP8[r330];r332=r331&255;r333=r332<<8;r334=r87+4|0;r335=HEAP8[r334];r336=r335&255;r337=r333|r336;r338=HEAP32[r44>>2];r339=r87+1|0;r340=HEAP8[r339];r341=r340&255;r342=r341<<8;r343=r87+2|0;r344=HEAP8[r343];r345=r344&255;r346=r342|r345;r347=HEAP32[r45>>2];r348=Math_imul(r346,r347)|0;r349=r338+r348|0;r350=r87+5|0;r351=HEAP32[r67>>2];r352=(r351|0)==0;r353=r352<<31>>31;r354=r349;r355=r337;r356=0;while(1){r357=r355-1|0;r358=(r355|0)>0;if(!r358){r252=r350;r253=r329;r254=r356;r255=r353;r8=458;break L16}r359=HEAP8[r354];r360=r359&255;r361=r360<<8;r362=r354+1|0;r363=HEAP8[r362];r364=r363&255;r365=r361|r364;r366=r365<<1;r367=(r366|0)<(r89|0);if(r367){r368=HEAP32[r39>>2];r369=r368+(r366<<2)|0;r370=HEAP32[r369>>2];r371=(r370|0)>-1;if(r371){break}}r372=r354+r347|0;r354=r372;r355=r357;r356=r366}r373=r366|1;r374=r368+(r373<<2)|0;r375=HEAP32[r374>>2];r376=r375-r370|0;r252=r350;r253=r329;r254=r366;r255=r376;r8=458;break};case 10:{r377=HEAP32[r55>>2];r378=r86>>>0<r377>>>0;if(!r378){r8=394;break L8}r379=HEAP8[r86];r380=r379&255;r381=HEAP32[r65>>2];r382=r381+r380|0;r383=HEAP8[r382];r384=r383&16;r385=r384<<24>>24==0;if(!r385){r24=0;r8=1018;break L8}r386=r86+1|0;r387=r87+1|0;r86=r386;r87=r387;r88=r88;r89=r89;r90=r90;continue L14;break};case 93:{r388=r87+1|0;r389=HEAP8[r388];r390=r389&255;r391=r390<<8;r392=r87+2|0;r393=HEAP8[r392];r394=r393&255;r395=r391|r394;r396=r87+3|0;r397=r396;r398=1;r399=r395;r400=r395;r8=711;break};case 91:case 92:{r401=r87+1|0;r402=HEAP8[r401];r403=r402&255;r404=r403<<8;r405=r87+2|0;r406=HEAP8[r405];r407=r406&255;r408=r404|r407;r409=r91<<24>>24==92;r410=r409&1;r411=r87+3|0;r412=r411;r413=r410;r414=0;r415=r408;r8=710;break};case 94:{r416=r87+1|0;r412=r416;r413=0;r414=1;r415=2147483647;r8=710;break};case 95:{r417=r87+1|0;r418=r417+1|0;r419=HEAP8[r417];r420=r419&255;r421=2147483647;r422=1;r423=1;r424=0;r425=r418;r426=r419;r427=r420;r8=712;break};case 96:{r428=r87+1|0;r412=r428;r413=0;r414=1;r415=1;r8=710;break};case 97:{r429=r87+1|0;r430=HEAP8[r429];r431=r430&255;r432=r431<<8;r433=r87+2|0;r434=HEAP8[r433];r435=r434&255;r436=r432|r435;r437=r87+3|0;r412=r437;r413=0;r414=1;r415=r436;r8=710;break};case 85:case 86:case 87:case 88:case 89:case 90:{r438=r87+1|0;r439=r92-85|0;r440=r439&1;r441=r439+200|0;r442=HEAP8[r441];r443=r442<<24>>24;r444=r439+216|0;r445=HEAP8[r444];r446=r445<<24>>24;r447=975>>>(r439>>>0);r448=r447&1;r449=(r448|0)==0;r450=r449?r446:2147483647;r397=r438;r398=r440;r399=r443;r400=r450;r8=711;break};case 31:case 32:{r451=HEAP32[r55>>2];r452=r86>>>0<r451>>>0;if(!r452){r8=624;break L8}r453=r87+1|0;r454=HEAP8[r453];r455=r454&255;r456=r86+1|0;r457=HEAP8[r86];r458=r454<<24>>24==r457<<24>>24;if(r458){r24=0;r8=1113;break L8}r459=r91<<24>>24==32;if(r459){r460=HEAP32[r69>>2];r461=r460+r455|0;r462=HEAP8[r461];r463=r462<<24>>24==r457<<24>>24;if(r463){r24=0;r8=1114;break L8}}r464=r87+2|0;r86=r456;r87=r464;r88=r88;r89=r89;r90=r90;continue L14;break};case 67:case 80:{r465=r87+1|0;r466=HEAP8[r465];r467=r466&255;r468=r467<<8;r469=r87+2|0;r470=HEAP8[r469];r471=r470&255;r472=r468|r471;r473=r87+3|0;r474=r473;r475=0;r476=0;r477=r472;r478=r472;r8=641;break};case 65:case 78:case 66:case 79:{r479=r87+1|0;r480=HEAP8[r479];r481=r480&255;r482=r481<<8;r483=r87+2|0;r484=HEAP8[r483];r485=r484&255;r486=r482|r485;r487=r91<<24>>24==66;if(r487){r488=1}else{r489=r91<<24>>24==79;r490=r489&1;r488=r490}r491=r87+3|0;r474=r491;r475=r488;r476=0;r477=0;r478=r486;r8=641;break};case 68:case 81:{r492=r87+1|0;r474=r492;r475=0;r476=1;r477=0;r478=2147483647;r8=641;break};case 69:case 82:{r493=r87+1|0;r474=r493;r475=0;r476=1;r477=1;r478=2147483647;r8=641;break};case 70:case 83:{r494=r87+1|0;r474=r494;r475=0;r476=1;r477=0;r478=1;r8=641;break};case 71:case 84:{r495=r87+1|0;r496=HEAP8[r495];r497=r496&255;r498=r497<<8;r499=r87+2|0;r500=HEAP8[r499];r501=r500&255;r502=r498|r501;r503=r87+3|0;r474=r503;r475=0;r476=1;r477=0;r478=r502;r8=641;break};case 59:case 72:case 60:case 73:case 61:case 74:case 62:case 75:case 63:case 76:case 64:case 77:{r504=r87+1|0;r505=(r91&255)>71;r506=r505?72:59;r507=r92-r506|0;r508=r507&1;r509=r507+200|0;r510=HEAP8[r509];r511=r510<<24>>24;r512=r507+216|0;r513=HEAP8[r512];r514=r513<<24>>24;r515=975>>>(r507>>>0);r516=r515&1;r517=(r516|0)==0;r518=r517?r514:2147483647;r474=r504;r475=r508;r476=0;r477=r511;r478=r518;r8=641;break};case 156:{r8=17;break L8;break};case 150:{r8=18;break L8;break};case 151:{r8=19;break L8;break};case 152:{r8=24;break L8;break};case 153:{r519=HEAP32[r31>>2];r520=r519+1|0;HEAP32[r31>>2]=r520;r521=HEAP32[r32>>2];r522=r520>>>0>r521>>>0;r523=HEAP8[r87];r524=r523&255;r525=r524+8720|0;r526=HEAP8[r525];r527=r526&255;r528=r87+1|0;r529=HEAP8[r528];r530=r529&255;r531=r527+r530|0;r532=r87+r531|0;if(r522){r8=27;break L8}else{r86=r86;r87=r532;r88=r88;r89=r89;r90=r90;continue L14}break};case 154:{r8=29;break L8;break};case 155:{r8=31;break L8;break};case 130:{r533=HEAP32[r33>>2];r534=r87;L118:while(1){r535=r534+3|0;r536=HEAP32[r10>>2];r537=r536+1|0;r538=_match(r86,r535,r88,r89,r5,r90,r537);do{if((r538|0)==1){r8=38;break L118}else if((r538|0)==-992){r539=r534+1|0;r540=HEAP8[r539];r541=r540&255;r542=r541<<8;r543=r534+2|0;r544=HEAP8[r543];r545=r544&255;r546=r542|r545;r547=r534+r546|0;r548=HEAP32[r34>>2];r549=r548>>>0<r547>>>0;if(!r549){r24=r538;r8=1154;break L8}r550=HEAP8[r534];r551=r550<<24>>24==119;if(r551){r552=r540;r553=r544;break}r554=HEAP8[r547];r555=r554<<24>>24==119;if(r555){r552=r540;r553=r544}else{r24=r538;r8=1155;break L8}}else if((r538|0)==0){r556=r534+1|0;r557=HEAP8[r556];r558=r534+2|0;r559=HEAP8[r558];r552=r557;r553=r559}else{r24=r538;r8=1153;break L8}}while(0);r560=r552&255;r561=r560<<8;r562=r553&255;r563=r561|r562;r564=r534+r563|0;HEAP32[r33>>2]=r533;r565=HEAP8[r564];r566=r565<<24>>24==119;if(r566){r534=r564}else{r567=r564;r568=r88;r569=r565;break}}if(r8==38){r8=0;r570=HEAP32[r34>>2];r571=HEAP8[r534];r567=r534;r568=r570;r569=r571}if(r569<<24>>24==-126|r569<<24>>24==119){r572=r567}else{r24=0;r8=1156;break L8}while(1){r573=r572+1|0;r574=HEAP8[r573];r575=r574&255;r576=r575<<8;r577=r572+2|0;r578=HEAP8[r577];r579=r578&255;r580=r576|r579;r581=r572+r580|0;r582=HEAP8[r581];r583=r582<<24>>24==119;if(r583){r572=r581}else{break}}r584=HEAP32[r35>>2];r585=HEAP32[r36>>2];r586=r582<<24>>24==120;r587=(r585|0)==(r86|0);r588=r586|r587;if(!r588){r8=48;break L14}r589=r580+3|0;r590=r572+r589|0;r86=r585;r87=r590;r88=r568;r89=r584;r90=r90;continue L14;break};case 133:case 138:{r8=52;break L14;break};case 129:case 131:case 136:{r591=r87;break L14;break};case 134:case 139:{r592=r87;r593=r92;r594=0;r8=82;break};case 132:case 137:{r595=r87;r596=r92;r597=0;r8=98;break};case 135:case 140:{r598=r87+1|0;r599=HEAP8[r598];r600=r599&255;r601=r600<<8;r602=r87+2|0;r603=HEAP8[r602];r604=r603&255;r605=r601|r604;r606=r87+3|0;r607=HEAP8[r606];r608=r607<<24>>24==118;if(r608){r609=r87+9|0;r610=r605-6|0;r611=HEAP8[r609];r612=r609;r613=r610;r614=r611}else{r612=r606;r613=r605;r614=r607}r615=r614&255;L137:do{switch(r615|0){case 143:{r616=HEAP32[r43>>2];r617=(r616|0)==0;if(r617){r8=138;break L137}r618=r612+1|0;r619=HEAP8[r618];r620=r619&255;r621=r620<<8;r622=r612+2|0;r623=HEAP8[r622];r624=r623&255;r625=r621|r624;r626=(r625|0)==65535;if(r626){r627=r612;r628=r89;r629=1;r8=137;break L137}r630=r616+4|0;r631=HEAP32[r630>>2];r632=(r625|0)==(r631|0);r633=r632&1;r634=r612;r635=r89;r636=r633;r8=135;break};case 144:{r637=HEAP32[r43>>2];r638=(r637|0)==0;if(r638){r8=138;break L137}r639=r612+3|0;r640=HEAP8[r639];r641=r640&255;r642=r641<<8;r643=r612+4|0;r644=HEAP8[r643];r645=r644&255;r646=r642|r645;r647=HEAP32[r44>>2];r648=r612+1|0;r649=HEAP8[r648];r650=r649&255;r651=r650<<8;r652=r612+2|0;r653=HEAP8[r652];r654=r653&255;r655=r651|r654;r656=HEAP32[r45>>2];r657=Math_imul(r655,r656)|0;r658=r647+r657|0;r659=r658;r660=r646;r661=0;while(1){r662=r660-1|0;r663=(r660|0)>0;if(!r663){r634=r612;r635=r89;r636=r661;r8=135;break L137}r664=HEAP8[r659];r665=r664&255;r666=r665<<8;r667=r659+1|0;r668=HEAP8[r667];r669=r668&255;r670=r666|r669;r671=r637+4|0;r672=HEAP32[r671>>2];r673=(r670|0)==(r672|0);r674=r673&1;if(r673){r634=r612;r635=r89;r636=r674;r8=135;break L137}r675=r659+r656|0;r659=r675;r660=r662;r661=r674}break};case 141:{r676=r612+1|0;r677=HEAP8[r676];r678=r677&255;r679=r678<<8;r680=r612+2|0;r681=HEAP8[r680];r682=r681&255;r683=r679|r682;r684=r683<<1;r685=(r684|0)<(r89|0);if(!r685){r8=138;break L137}r686=HEAP32[r39>>2];r687=r686+(r684<<2)|0;r688=HEAP32[r687>>2];r689=r688>>>31;r690=r689^1;r634=r612;r635=r89;r636=r690;r8=135;break};case 142:{r691=r612+3|0;r692=HEAP8[r691];r693=r692&255;r694=r693<<8;r695=r612+4|0;r696=HEAP8[r695];r697=r696&255;r698=r694|r697;r699=HEAP32[r44>>2];r700=r612+1|0;r701=HEAP8[r700];r702=r701&255;r703=r702<<8;r704=r612+2|0;r705=HEAP8[r704];r706=r705&255;r707=r703|r706;r708=HEAP32[r45>>2];r709=Math_imul(r707,r708)|0;r710=r699+r709|0;r711=r710;r712=r698;while(1){r713=r712-1|0;r714=(r712|0)>0;if(!r714){r8=138;break L137}r715=HEAP8[r711];r716=r715&255;r717=r716<<8;r718=r711+1|0;r719=HEAP8[r718];r720=r719&255;r721=r717|r720;r722=r721<<1;r723=(r722|0)<(r89|0);if(r723){r724=HEAP32[r39>>2];r725=r724+(r722<<2)|0;r726=HEAP32[r725>>2];r727=r726>>>31;r728=(r727|0)==1;if(!r728){break}}r729=r711+r708|0;r711=r729;r712=r713}r730=r727^1;r627=r612;r628=r89;r629=r730;r8=137;break};case 145:{r8=138;break};default:{HEAP32[r28>>2]=1;r731=HEAP32[r10>>2];r732=r731+1|0;r733=_match(r86,r612,r88,r89,r5,0,r732);if((r733|0)==0|(r733|0)==-992){r8=138;break L137}else if((r733|0)!=1){r24=r733;r8=1175;break L8}r734=HEAP32[r35>>2];r735=(r734|0)>(r89|0);r736=r735?r734:r89;r737=r612+1|0;r738=HEAP8[r737];r739=r738&255;r740=r739<<8;r741=r612+2|0;r742=HEAP8[r741];r743=r742&255;r744=r740|r743;r745=r612+r744|0;r746=r745;while(1){r747=HEAP8[r746];r748=r747<<24>>24==119;if(!r748){break}r749=r746+1|0;r750=HEAP8[r749];r751=r750&255;r752=r751<<8;r753=r746+2|0;r754=HEAP8[r753];r755=r754&255;r756=r752|r755;r757=r746+r756|0;r746=r757}r758=r615+8720|0;r759=HEAP8[r758];r760=r759&255;r761=3-r760|0;r762=r746+r761|0;r627=r762;r628=r736;r629=1;r8=137}}}while(0);if(r8==135){r8=0;r763=(r636|0)==0;if(r763){r764=r613;r765=r634;r766=r635;r767=r636;r8=139}else{r627=r634;r628=r635;r629=r636;r8=137}}else if(r8==138){r8=0;r768=r612+r613|0;r769=r89;r770=r612;r771=r613;r772=r768}if(r8==137){r8=0;r773=r615+8720|0;r774=HEAP8[r773];r775=r774&255;r764=r775;r765=r627;r766=r628;r767=r629;r8=139}if(r8==139){r8=0;r776=r765+r764|0;r777=(r767|0)==0;if(r777){r769=r766;r770=r765;r771=r764;r772=r776}else{r778=r766;r779=r776;r8=141;break L14}}r780=r771-3|0;r781=r770+r780|0;r782=HEAP8[r781];r783=r782<<24>>24==119;if(r783){r778=r769;r779=r772;r8=141;break L14}else{r86=r86;r87=r772;r88=r88;r89=r769;r90=r90;continue L14}break};case 160:{r784=r87+1|0;r785=HEAP8[r784];r786=r785&255;r787=r786<<8;r788=r87+2|0;r789=HEAP8[r788];r790=r789&255;r791=r787|r790;r792=r791<<1;r793=HEAP32[r41>>2];r794=r793&-65536;r795=r794|r791;HEAP32[r41>>2]=r795;r796=HEAP32[r37>>2];r797=(r792|0)<(r796|0);if(r797){r798=HEAP32[r40>>2];r799=r798-r791|0;r800=HEAP32[r39>>2];r801=r800+(r799<<2)|0;r802=HEAP32[r801>>2];r803=r800+(r792<<2)|0;HEAP32[r803>>2]=r802;r804=HEAP32[r42>>2];r805=r86;r806=r804;r807=r805-r806|0;r808=r792|1;r809=HEAP32[r39>>2];r810=r809+(r808<<2)|0;HEAP32[r810>>2]=r807;r811=(r89|0)>(r792|0);r812=r792+2|0;r813=r811?r89:r812;r814=r813}else{r815=r795|65536;HEAP32[r41>>2]=r815;r814=r89}r816=r87+3|0;r86=r86;r87=r816;r88=r88;r89=r814;r90=r90;continue L14;break};case 0:case 158:case 159:{r8=147;break L8;break};case 125:case 127:{r817=HEAP32[r33>>2];r818=HEAP32[r28>>2];r819=(r818|0)==1;if(r819){HEAP32[r28>>2]=0;r820=1}else{r820=0}r821=r87;while(1){r822=r821+3|0;r823=HEAP32[r10>>2];r824=r823+1|0;r825=_match(r86,r822,r88,r89,r5,0,r824);if((r825|0)==1|(r825|0)==-999){r8=157;break}HEAP32[r33>>2]=r817;r826=(r825|0)==-992;do{if(r826){r827=r821+1|0;r828=HEAP8[r827];r829=r828&255;r830=r829<<8;r831=r821+2|0;r832=HEAP8[r831];r833=r832&255;r834=r830|r833;r835=r821+r834|0;r836=HEAP32[r34>>2];r837=r836>>>0<r835>>>0;if(!r837){r24=r825;r8=1180;break L8}r838=HEAP8[r821];r839=r838<<24>>24==119;if(r839){r840=r828;r841=r832;break}r842=HEAP8[r835];r843=r842<<24>>24==119;if(r843){r840=r828;r841=r832}else{r24=r825;r8=1181;break L8}}else{r844=r825;r845=(r844|0)==0;if(!r845){r24=r825;r8=1182;break L8}r846=r821+1|0;r847=HEAP8[r846];r848=r821+2|0;r849=HEAP8[r848];r840=r847;r841=r849}}while(0);r850=r840&255;r851=r850<<8;r852=r841&255;r853=r851|r852;r854=r821+r853|0;r855=HEAP8[r854];r856=r855<<24>>24==119;if(r856){r821=r854}else{r857=r854;r858=r88;r859=r855;break}}if(r8==157){r8=0;r860=HEAP32[r34>>2];r861=HEAP8[r821];r857=r821;r858=r860;r859=r861}r862=r859<<24>>24==120;if(r862){r24=0;r8=1183;break L8}r863=(r820|0)==0;if(r863){r864=r857}else{r24=1;r8=1184;break L8}while(1){r865=r864+1|0;r866=HEAP8[r865];r867=r866&255;r868=r867<<8;r869=r864+2|0;r870=HEAP8[r869];r871=r870&255;r872=r868|r871;r873=r864+r872|0;r874=HEAP8[r873];r875=r874<<24>>24==119;if(r875){r864=r873}else{break}}r876=r872+3|0;r877=r864+r876|0;r878=HEAP32[r35>>2];r86=r86;r87=r877;r88=r858;r89=r878;r90=r90;continue L14;break};case 126:case 128:{r879=HEAP32[r33>>2];r880=HEAP32[r28>>2];r881=(r880|0)==1;if(r881){HEAP32[r28>>2]=0;r882=1}else{r882=0}r883=r87;L201:while(1){r884=r883+3|0;r885=HEAP32[r10>>2];r886=r885+1|0;r887=_match(r86,r884,r88,r89,r5,0,r886);HEAP32[r33>>2]=r879;L203:do{switch(r887|0){case 0:{r888=r883+1|0;r889=HEAP8[r888];r890=r883+2|0;r891=HEAP8[r890];r892=r889;r893=r891;break};case-992:{r894=r883+1|0;r895=HEAP8[r894];r896=r895&255;r897=r896<<8;r898=r883+2|0;r899=HEAP8[r898];r900=r899&255;r901=r897|r900;r902=r883+r901|0;r903=HEAP32[r34>>2];r904=r903>>>0<r902>>>0;if(!r904){r905=r883;r8=177;break L201}r906=HEAP8[r883];r907=r906<<24>>24==119;if(r907){r892=r895;r893=r899;break L203}r908=HEAP8[r902];r909=r908<<24>>24==119;if(r909){r892=r895;r893=r899}else{r905=r883;r8=177;break L201}break};case-996:case-994:case-993:case-995:{r905=r883;r8=177;break L201;break};case 1:case-999:{r24=0;r8=1185;break L8;break};default:{r8=178;break L8}}}while(0);r910=r892&255;r911=r910<<8;r912=r893&255;r913=r911|r912;r914=r883+r913|0;r915=HEAP8[r914];r916=r915<<24>>24==119;if(r916){r883=r914}else{r917=r914;break}}if(r8==177){while(1){r8=0;r918=r905+1|0;r919=HEAP8[r918];r920=r919&255;r921=r920<<8;r922=r905+2|0;r923=HEAP8[r922];r924=r923&255;r925=r921|r924;r926=r905+r925|0;r927=HEAP8[r926];r928=r927<<24>>24==119;if(r928){r905=r926;r8=177}else{r917=r926;break}}}r929=(r882|0)==0;if(!r929){r24=1;r8=1187;break L8}r930=r917+3|0;r86=r86;r87=r930;r88=r88;r89=r89;r90=r90;continue L14;break};case 124:{r931=r87+1|0;r932=HEAP8[r931];r933=r932&255;r934=r933<<8;r935=r87+2|0;r936=HEAP8[r935];r937=r936&255;r938=r934|r937;r939=-r938|0;r940=r86+r939|0;r941=HEAP32[r42>>2];r942=r940>>>0<r941>>>0;if(r942){r24=0;r8=1188;break L8}r943=HEAP32[r46>>2];r944=r940>>>0<r943>>>0;if(r944){HEAP32[r46>>2]=r940}r945=r87+3|0;r86=r940;r87=r945;r88=r88;r89=r89;r90=r90;continue L14;break};case 118:{r946=r87+6|0;r86=r86;r87=r946;r88=r88;r89=r89;r90=r90;continue L14;break};case 117:{r947=HEAP32[r38>>2];r948=r87+1|0;r949=HEAP8[r948];r950=r949&255;r951=r950<<8;r952=r87+2|0;r953=HEAP8[r952];r954=r953&255;r955=r951|r954;r956=r947+r955|0;r957=(r955|0)==0;if(r957){r958=0}else{r959=r955+3|0;r960=r947+r959|0;r961=HEAP8[r960];r962=r961&255;r963=r962<<8;r964=r955+4|0;r965=r947+r964|0;r966=HEAP8[r965];r967=r966&255;r968=r963|r967;r958=r968}r969=r43;while(1){r970=HEAP32[r969>>2];r971=(r970|0)==0;if(r971){break}r972=r970+4|0;r973=HEAP32[r972>>2];r974=(r958|0)==(r973|0);if(r974){r975=r970+20|0;r976=HEAP32[r975>>2];r977=(r86|0)==(r976|0);if(r977){r24=-26;r8=1189;break L8}}r978=r970|0;r969=r978}HEAP32[r47>>2]=r958;r979=HEAP32[r41>>2];HEAP32[r48>>2]=r979;HEAP32[r49>>2]=r86;r980=HEAP32[r43>>2];HEAP32[r50>>2]=r980;HEAP32[r43>>2]=r11;r981=r87+3|0;r982=HEAP32[r40>>2];HEAP32[r51>>2]=r982;r983=(r982|0)<31;if(r983){HEAP32[r53>>2]=r52;r984=r52;r985=r982}else{r986=r982<<2;r987=_malloc(r986);r988=r987;HEAP32[r53>>2]=r988;r989=(r987|0)==0;if(r989){r24=-6;r8=1190;break L8}r990=HEAP32[r51>>2];r984=r988;r985=r990}r991=r984;r992=HEAP32[r39>>2];r993=r992;r994=r985<<2;_memcpy(r991,r993,r994)|0;r995=HEAP8[r956];r996=(r995&255)>135;r997=r956;r998=r995;while(1){if(r996){HEAP32[r28>>2]=2;r999=HEAP8[r997];r1000=r999}else{r1000=r998}r1001=r1000&255;r1002=r1001+8720|0;r1003=HEAP8[r1002];r1004=r1003&255;r1005=r997+r1004|0;r1006=HEAP32[r10>>2];r1007=r1006+1|0;r1008=_match(r86,r1005,r88,r89,r5,r90,r1007);r1009=HEAP32[r39>>2];r1010=r1009;r1011=HEAP32[r53>>2];r1012=r1011;r1013=HEAP32[r51>>2];r1014=r1013<<2;_memcpy(r1010,r1012,r1014)|0;r1015=HEAP32[r48>>2];HEAP32[r41>>2]=r1015;r1016=HEAP32[r50>>2];HEAP32[r43>>2]=r1016;if((r1008|0)==1|(r1008|0)==-999){break}r1017=(r1008|0)>-997;if(!r1017){r8=207;break L8}r1018=(r1008|0)<-991;if(r1018){r24=0;r8=1191;break L8}r1019=(r1008|0)==0;if(!r1019){r8=207;break L8}HEAP32[r43>>2]=r11;r1020=r997+1|0;r1021=HEAP8[r1020];r1022=r1021&255;r1023=r1022<<8;r1024=r997+2|0;r1025=HEAP8[r1024];r1026=r1025&255;r1027=r1023|r1026;r1028=r997+r1027|0;r1029=HEAP8[r1028];r1030=r1029<<24>>24==119;if(r1030){r997=r1028;r998=119}else{r8=210;break L8}}r1031=HEAP32[r53>>2];r1032=(r1031|0)==(r52|0);if(!r1032){r1033=r1031;_free(r1033)}r1034=HEAP32[r36>>2];r1035=HEAP32[r34>>2];r86=r1034;r87=r981;r88=r1035;r89=r89;r90=r90;continue L14;break};case 119:{r1036=r87;while(1){r1037=r1036+1|0;r1038=HEAP8[r1037];r1039=r1038&255;r1040=r1039<<8;r1041=r1036+2|0;r1042=HEAP8[r1041];r1043=r1042&255;r1044=r1040|r1043;r1045=r1036+r1044|0;r1046=HEAP8[r1045];r1047=r1046<<24>>24==119;if(r1047){r1036=r1045}else{r86=r86;r87=r1045;r88=r88;r89=r89;r90=r90;continue L14}}break};case 146:{r1048=r87+1|0;r1049=HEAP32[r10>>2];r1050=r1049+1|0;r1051=_match(r86,r1048,r88,r89,r5,r90,r1050);r1052=(r1051|0)==0;if(r1052){r1053=r1048}else{r24=r1051;r8=1196;break L8}while(1){r1054=r1053+1|0;r1055=HEAP8[r1054];r1056=r1055&255;r1057=r1056<<8;r1058=r1053+2|0;r1059=HEAP8[r1058];r1060=r1059&255;r1061=r1057|r1060;r1062=r1053+r1061|0;r1063=HEAP8[r1062];r1064=r1063<<24>>24==119;if(r1064){r1053=r1062}else{break}}r1065=r1061+3|0;r1066=r1053+r1065|0;r86=r86;r87=r1066;r88=r88;r89=r89;r90=r90;continue L14;break};case 147:{r1067=r87+1|0;r1068=r1067;while(1){r1069=r1068+1|0;r1070=HEAP8[r1069];r1071=r1070&255;r1072=r1071<<8;r1073=r1068+2|0;r1074=HEAP8[r1073];r1075=r1074&255;r1076=r1072|r1075;r1077=r1068+r1076|0;r1078=HEAP8[r1077];r1079=r1078<<24>>24==119;if(r1079){r1068=r1077}else{break}}r1080=r1076+3|0;r1081=r1068+r1080|0;r1082=HEAP32[r10>>2];r1083=r1082+1|0;r1084=_match(r86,r1081,r88,r89,r5,r90,r1083);r1085=(r1084|0)==0;if(r1085){r86=r86;r87=r1067;r88=r88;r89=r89;r90=r90;continue L14}else{r24=r1084;r8=1197;break L8}break};case 161:{r1086=r87+1|0;r1087=r1086;while(1){r1088=r1087+1|0;r1089=HEAP8[r1088];r1090=r1089&255;r1091=r1090<<8;r1092=r1087+2|0;r1093=HEAP8[r1092];r1094=r1093&255;r1095=r1091|r1094;r1096=r1087+r1095|0;r1097=HEAP8[r1096];r1098=r1097<<24>>24==119;if(r1098){r1087=r1096}else{break}}r1099=r1095+3|0;r1100=r1087+r1099|0;r86=r86;r87=r1100;r88=r88;r89=r89;r90=r90;continue L14;break};case 148:{r1101=r87+1|0;r1102=HEAP8[r1101];r1103=r1102&255;r1104=r1102<<24>>24==-122;if(r1104){r592=r1101;r593=r1103;r594=1;r8=82;break L16}r1105=r1102<<24>>24==-117;if(r1105){r592=r1101;r593=139;r594=1;r8=82}else{r595=r1101;r596=r1103;r597=1;r8=98}break};case 120:case 122:case 121:case 123:{r1106=r87+1|0;r1107=HEAP8[r1106];r1108=r1107&255;r1109=r1108<<8;r1110=r87+2|0;r1111=HEAP8[r1110];r1112=r1111&255;r1113=r1109|r1112;r1114=-r1113|0;r1115=r87+r1114|0;r1116=HEAP8[r1115];r1117=(r1116&255)>135;do{if(r1117){r1118=r1116;r8=227}else{r1119=r1116<<24>>24==-127;if(r1119){r1118=-127;r8=227;break}else{r1120=r90;r1121=0;r1122=r1116}r1123=(r1122&255)>124;if(r1123){r1124=r1122;r1125=r1121;r1126=r1120}else{r1127=r89;r1128=r1121;r1129=r1120;break}r1130=(r1124&255)<129;if(r1130){r8=231;break L8}else{r1131=r1124;r1132=r1125;r1133=r1126;r8=230}}}while(0);if(r8==227){r8=0;r1134=r90+4|0;r1135=HEAP32[r1134>>2];r1136=r90|0;r1137=HEAP32[r1136>>2];r1131=r1118;r1132=r1135;r1133=r1137;r8=230}L272:do{if(r8==230){r8=0;r1138=r1131<<24>>24==-126;if(r1138){r8=231;break L8}else{r1139=r1133;r1140=r1132;r1141=r1131}r1142=r1141<<24>>24==-123;do{if(r1142){r1143=r1140;r1144=r1139}else{r1145=r1141;r1146=r1140;r1147=r1139;r1148=r1145<<24>>24==-118;if(r1148){r1143=r1146;r1144=r1147;break}else{r1149=r1147;r1150=r1146;r1151=r1145}r1152=r1151<<24>>24==-122;if(r1152){r1143=r1150;r1144=r1149;break}else{r1153=r1151;r1154=r1150;r1155=r1149}r1156=r1153<<24>>24==-117;if(r1156){r1143=r1154;r1144=r1155}else{r1127=r89;r1128=r1154;r1129=r1155;break L272}}}while(0);r1157=3-r1113|0;r1158=r87+r1157|0;r1159=HEAP8[r1158];r1160=r1159&255;r1161=r1160<<8;r1162=4-r1113|0;r1163=r87+r1162|0;r1164=HEAP8[r1163];r1165=r1164&255;r1166=r1161|r1165;r1167=r1166<<1;r1168=HEAP32[r43>>2];r1169=(r1168|0)==0;if(!r1169){r1170=r1168+4|0;r1171=HEAP32[r1170>>2];r1172=(r1171|0)==(r1166|0);if(r1172){r8=238;break L8}}r1173=HEAP32[r41>>2];r1174=r1173&-65536;r1175=r1174|r1166;HEAP32[r41>>2]=r1175;r1176=HEAP32[r37>>2];r1177=(r1167|0)<(r1176|0);if(!r1177){r1178=r1175|65536;HEAP32[r41>>2]=r1178;r1127=r89;r1128=r1143;r1129=r1144;break}r1179=(r1167|0)>(r89|0);L286:do{if(r1179){r1180=HEAP32[r39>>2];r1181=r1180+(r89<<2)|0;r1182=r1180+(r1167<<2)|0;r1183=r1181;while(1){r1184=r1183>>>0<r1182>>>0;if(!r1184){break L286}r1185=r1183+4|0;HEAP32[r1183>>2]=-1;r1183=r1185}}}while(0);r1186=HEAP32[r40>>2];r1187=r1186-r1166|0;r1188=HEAP32[r39>>2];r1189=r1188+(r1187<<2)|0;r1190=HEAP32[r1189>>2];r1191=r1188+(r1167<<2)|0;HEAP32[r1191>>2]=r1190;r1192=HEAP32[r42>>2];r1193=r86;r1194=r1192;r1195=r1193-r1194|0;r1196=r1167|1;r1197=HEAP32[r39>>2];r1198=r1197+(r1196<<2)|0;HEAP32[r1198>>2]=r1195;r1199=(r89|0)>(r1167|0);r1200=r1167+2|0;r1201=r1199?r89:r1200;r1127=r1201;r1128=r1143;r1129=r1144}}while(0);r1202=HEAP8[r87];r1203=r1202<<24>>24==120;r1204=(r86|0)==(r1128|0);r1205=r1203|r1204;if(!r1205){r8=250;break L14}r1206=HEAP8[r1115];r1207=r1206<<24>>24==-127;r1208=r87+3|0;if(r1207){r8=248;break L8}else{r86=r86;r87=r1208;r88=r88;r89=r1127;r90=r1129;continue L14}break};case 27:{r1209=HEAP32[r54>>2];r1210=(r1209|0)==0;if(r1210){r8=266;break L16}r1211=HEAP32[r42>>2];r1212=(r86|0)==(r1211|0);if(r1212){r24=0;r8=1211;break L8}else{r8=266}break};case 1:{r8=266;break};case 28:{r1213=HEAP32[r54>>2];r1214=(r1213|0)!=0;r1215=HEAP32[r42>>2];r1216=(r86|0)==(r1215|0);r1217=r1214&r1216;if(r1217){r24=0;r8=1213;break L8}r1218=(r86|0)==(r1215|0);do{if(!r1218){r1219=HEAP32[r55>>2];r1220=(r86|0)==(r1219|0);if(r1220){r24=0;r8=1214;break L8}r1221=HEAP32[r56>>2];r1222=(r1221|0)==0;if(!r1222){r1223=r86>>>0>r1215>>>0;if(!r1223){r24=0;r8=1215;break L8}r1224=__pcre_was_newline(r86,r1221,r1215,r57,0);r1225=(r1224|0)==0;if(r1225){r24=0;r8=1216;break L8}else{break}}r1226=HEAP32[r57>>2];r1227=r1215+r1226|0;r1228=r86>>>0<r1227>>>0;if(r1228){r24=0;r8=1217;break L8}r1229=-r1226|0;r1230=r86+r1229|0;r1231=HEAP8[r1230];r1232=HEAP8[r58];r1233=r1231<<24>>24==r1232<<24>>24;if(!r1233){r24=0;r8=1218;break L8}r1234=(r1226|0)==1;if(r1234){break}r1235=1-r1226|0;r1236=r86+r1235|0;r1237=HEAP8[r1236];r1238=HEAP8[r59];r1239=r1237<<24>>24==r1238<<24>>24;if(!r1239){r24=0;r8=1219;break L8}}}while(0);r1240=r87+1|0;r86=r86;r87=r1240;r88=r88;r89=r89;r90=r90;continue L14;break};case 2:{r1241=HEAP32[r42>>2];r1242=HEAP32[r60>>2];r1243=r1241+r1242|0;r1244=(r86|0)==(r1243|0);if(!r1244){r24=0;r8=1220;break L8}r1245=r87+1|0;r86=r86;r87=r1245;r88=r88;r89=r89;r90=r90;continue L14;break};case 3:{r1246=r87+1|0;r88=r86;r86=r86;r87=r1246;r89=r89;r90=r90;continue L14;break};case 26:{r1247=HEAP32[r55>>2];r1248=r86>>>0<r1247>>>0;do{if(r1248){r1249=HEAP32[r56>>2];r1250=(r1249|0)==0;if(!r1250){r1251=__pcre_is_newline(r86,r1249,r1247,r57,0);r1252=(r1251|0)==0;if(r1252){r8=289;break L8}else{break}}r1253=HEAP32[r57>>2];r1254=-r1253|0;r1255=r1247+r1254|0;r1256=r86>>>0>r1255>>>0;if(r1256){r8=289;break L8}r1257=HEAP8[r86];r1258=HEAP8[r58];r1259=r1257<<24>>24==r1258<<24>>24;if(!r1259){r8=289;break L8}r1260=(r1253|0)==1;if(r1260){break}r1261=r86+1|0;r1262=HEAP8[r1261];r1263=HEAP8[r59];r1264=r1262<<24>>24==r1263<<24>>24;if(!r1264){r8=289;break L8}}else{r1265=HEAP32[r61>>2];r1266=(r1265|0)==0;if(!r1266){r24=0;r8=1223;break L8}r1267=HEAP32[r62>>2];r1268=(r1267|0)==0;if(r1268){break}r1269=HEAP32[r46>>2];r1270=r86>>>0>r1269>>>0;if(!r1270){break}HEAP32[r63>>2]=1;r1271=(r1267|0)>1;if(r1271){r24=-12;r8=1224;break L8}}}while(0);r1272=r87+1|0;r86=r86;r87=r1272;r88=r88;r89=r89;r90=r90;continue L14;break};case 25:{r1273=HEAP32[r61>>2];r1274=(r1273|0)==0;if(!r1274){r24=0;r8=1225;break L8}r1275=HEAP32[r64>>2];r1276=(r1275|0)==0;if(r1276){r8=308}else{r8=303}break};case 24:{r8=303;break};case 23:{r8=308;break};case 4:case 5:{r1277=HEAP32[r42>>2];r1278=(r86|0)==(r1277|0);if(r1278){r1279=0}else{r1280=HEAP32[r46>>2];r1281=r86>>>0>r1280>>>0;r1282=r86-1|0;if(!r1281){HEAP32[r46>>2]=r1282}r1283=HEAP8[r1282];r1284=r1283&255;r1285=HEAP32[r65>>2];r1286=r1285+r1284|0;r1287=HEAP8[r1286];r1288=(r1287&255)>>>4;r1289=r1288&1;r1290=r1289&255;r1279=r1290}r1291=HEAP32[r55>>2];r1292=r86>>>0<r1291>>>0;do{if(r1292){r1293=HEAP8[r86];r1294=r1293&255;r1295=HEAP32[r65>>2];r1296=r1295+r1294|0;r1297=HEAP8[r1296];r1298=(r1297&255)>>>4;r1299=r1298&1;r1300=r1299&255;r1301=r1300}else{r1302=HEAP32[r62>>2];r1303=(r1302|0)==0;if(r1303){r1301=0;break}r1304=HEAP32[r46>>2];r1305=r86>>>0>r1304>>>0;if(!r1305){r1301=0;break}HEAP32[r63>>2]=1;r1306=(r1302|0)>1;if(r1306){r24=-12;r8=1231;break L8}else{r1301=0}}}while(0);r1307=r87+1|0;r1308=HEAP8[r87];r1309=r1308<<24>>24==5;r1310=(r1301|0)==(r1279|0);if(r1309){if(r1310){r24=0;r8=1232;break L8}else{r86=r86;r87=r1307;r88=r88;r89=r89;r90=r90;continue L14}}else{if(r1310){r86=r86;r87=r1307;r88=r88;r89=r89;r90=r90;continue L14}else{r24=0;r8=1233;break L8}}break};case 12:{r1311=HEAP32[r56>>2];r1312=(r1311|0)==0;r1313=HEAP32[r55>>2];do{if(r1312){r1314=HEAP32[r57>>2];r1315=-r1314|0;r1316=r1313+r1315|0;r1317=r86>>>0>r1316>>>0;if(r1317){break}r1318=HEAP8[r86];r1319=HEAP8[r58];r1320=r1318<<24>>24==r1319<<24>>24;if(!r1320){break}r1321=(r1314|0)==1;if(r1321){r24=0;r8=1235;break L8}r1322=r86+1|0;r1323=HEAP8[r1322];r1324=HEAP8[r59];r1325=r1323<<24>>24==r1324<<24>>24;if(r1325){r24=0;r8=1236;break L8}}else{r1326=r86>>>0<r1313>>>0;if(!r1326){break}r1327=__pcre_is_newline(r86,r1311,r1313,r57,0);r1328=(r1327|0)==0;if(!r1328){r24=0;r8=1234;break L8}}}while(0);r1329=HEAP32[r62>>2];r1330=(r1329|0)==0;if(r1330){r8=353;break L16}r1331=r86+1|0;r1332=HEAP32[r55>>2];r1333=r1331>>>0<r1332>>>0;if(r1333){r8=353;break L16}r1334=HEAP32[r56>>2];r1335=(r1334|0)==0;if(!r1335){r8=353;break L16}r1336=HEAP32[r57>>2];r1337=(r1336|0)==2;if(!r1337){r8=353;break L16}r1338=HEAP8[r86];r1339=HEAP8[r58];r1340=r1338<<24>>24==r1339<<24>>24;if(!r1340){r8=353;break L16}HEAP32[r63>>2]=1;r1341=(r1329|0)>1;if(r1341){r24=-12;r8=1237;break L8}else{r8=353}break};case 13:{r8=353;break};case 14:{r1342=HEAP32[r55>>2];r1343=r86>>>0<r1342>>>0;if(!r1343){r8=360;break L8}r1344=r86+1|0;r1345=r87+1|0;r86=r1344;r87=r1345;r88=r88;r89=r89;r90=r90;continue L14;break};case 6:{r1346=HEAP32[r55>>2];r1347=r86>>>0<r1346>>>0;if(!r1347){r8=366;break L8}r1348=HEAP8[r86];r1349=r1348&255;r1350=HEAP32[r65>>2];r1351=r1350+r1349|0;r1352=HEAP8[r1351];r1353=r1352&4;r1354=r1353<<24>>24==0;if(!r1354){r24=0;r8=1244;break L8}r1355=r86+1|0;r1356=r87+1|0;r86=r1355;r87=r1356;r88=r88;r89=r89;r90=r90;continue L14;break};case 7:{r1357=HEAP32[r55>>2];r1358=r86>>>0<r1357>>>0;if(!r1358){r8=373;break L8}r1359=HEAP8[r86];r1360=r1359&255;r1361=HEAP32[r65>>2];r1362=r1361+r1360|0;r1363=HEAP8[r1362];r1364=r1363&4;r1365=r1364<<24>>24==0;if(r1365){r24=0;r8=1247;break L8}r1366=r86+1|0;r1367=r87+1|0;r86=r1366;r87=r1367;r88=r88;r89=r89;r90=r90;continue L14;break};case 8:{r1368=HEAP32[r55>>2];r1369=r86>>>0<r1368>>>0;if(!r1369){r8=380;break L8}r1370=HEAP8[r86];r1371=r1370&255;r1372=HEAP32[r65>>2];r1373=r1372+r1371|0;r1374=HEAP8[r1373];r1375=r1374&1;r1376=r1375<<24>>24==0;if(!r1376){r24=0;r8=1250;break L8}r1377=r86+1|0;r1378=r87+1|0;r86=r1377;r87=r1378;r88=r88;r89=r89;r90=r90;continue L14;break};case 9:{r1379=HEAP32[r55>>2];r1380=r86>>>0<r1379>>>0;if(!r1380){r8=387;break L8}r1381=HEAP8[r86];r1382=r1381&255;r1383=HEAP32[r65>>2];r1384=r1383+r1382|0;r1385=HEAP8[r1384];r1386=r1385&1;r1387=r1386<<24>>24==0;if(r1387){r24=0;r8=1050;break L8}r1388=r86+1|0;r1389=r87+1|0;r86=r1388;r87=r1389;r88=r88;r89=r89;r90=r90;continue L14;break};case 157:{r24=0;r8=1008;break L8;break};default:{r8=988;break L8}}}while(0);do{if(r8==458){r8=0;r1390=HEAP8[r252];r1391=r1390&255;switch(r1391|0){case 98:case 99:case 100:case 101:case 102:case 103:{r1392=r252+1|0;r1393=r1391-98|0;r1394=r1393&1;r1395=r1393+200|0;r1396=HEAP8[r1395];r1397=r1396<<24>>24;r1398=r1393+216|0;r1399=HEAP8[r1398];r1400=r1399<<24>>24;r1401=975>>>(r1393>>>0);r1402=r1401&1;r1403=(r1402|0)==0;r1404=r1403?r1400:2147483647;r1405=r1392;r1406=r1394;r1407=r1397;r1408=r1404;break};case 104:case 105:{r1409=r1390<<24>>24==105;r1410=r1409&1;r1411=r252+1|0;r1412=HEAP8[r1411];r1413=r1412&255;r1414=r1413<<8;r1415=r252+2|0;r1416=HEAP8[r1415];r1417=r1416&255;r1418=r1414|r1417;r1419=r252+3|0;r1420=HEAP8[r1419];r1421=r1420&255;r1422=r1421<<8;r1423=r252+4|0;r1424=HEAP8[r1423];r1425=r1424&255;r1426=r1422|r1425;r1427=(r1426|0)==0;r1428=r1427?2147483647:r1426;r1429=r252+5|0;r1405=r1429;r1406=r1410;r1407=r1418;r1408=r1428;break};default:{r1430=_match_ref(r254,r86,r255,r5,r253);r1431=(r1430|0)<0;if(r1431){r8=462;break L8}r1432=r86+r1430|0;r86=r1432;r87=r252;r88=r88;r89=r89;r90=r90;continue L14}}r1433=(r255|0)==0;if(r1433){r86=r86;r87=r1405;r88=r88;r89=r89;r90=r90;continue L14}r1434=(r255|0)<0;r1435=(r1407|0)==0;r1436=r1434&r1435;if(r1436){r86=r86;r87=r1405;r88=r88;r89=r89;r90=r90;continue L14}else{r1437=1;r1438=r86}while(1){r1439=(r1437|0)>(r1407|0);if(r1439){break}r1440=_match_ref(r254,r1438,r255,r5,r253);r1441=(r1440|0)<0;if(r1441){r8=474;break L8}r1442=r1438+r1440|0;r1443=r1437+1|0;r1437=r1443;r1438=r1442}r1444=(r1407|0)==(r1408|0);if(r1444){r86=r1438;r87=r1405;r88=r88;r89=r89;r90=r90;continue L14}else{r8=483;break L8}}else if(r8==556){r8=0;r1445=r87+1|0;r1446=HEAP8[r1445];r1447=r1446&255;r1448=r1447<<8;r1449=r87+2|0;r1450=HEAP8[r1449];r1451=r1450&255;r1452=r1448|r1451;r1453=r91<<24>>24==40;if(r1453){r1454=1}else{r1455=r91<<24>>24==53;r1456=r1455&1;r1454=r1456}r1457=r87+3|0;r279=r1457;r280=r1454;r281=r284;r282=0;r283=r1452;r8=563}else if(r8==710){r8=0;r1458=r412+1|0;r1459=HEAP8[r412];r1460=r1459&255;r1461=r86;r1462=r415;r1463=0;r1464=r414;r1465=r413;r1466=r1458;r1467=r1459;r1468=r1460}else if(r8==711){r8=0;r1469=r397+1|0;r1470=HEAP8[r397];r1471=r1470&255;r1472=(r399|0)>0;if(r1472){r421=r400;r422=r399;r423=0;r424=r398;r425=r1469;r426=r1470;r427=r1471;r8=712}else{r1461=r86;r1462=r400;r1463=r399;r1464=0;r1465=r398;r1466=r1469;r1467=r1470;r1468=r1471}}else if(r8==641){r8=0;r1473=r474+1|0;r1474=HEAP8[r474];r1475=(r91&255)>71;if(!r1475){r1476=1;r1477=r86;while(1){r1478=(r1476|0)>(r477|0);if(r1478){break}r1479=HEAP32[r55>>2];r1480=r1477>>>0<r1479>>>0;if(!r1480){r8=675;break L8}r1481=HEAP8[r1477];r1482=r1474<<24>>24==r1481<<24>>24;if(r1482){r24=0;r8=1127;break L8}r1483=r1477+1|0;r1484=r1476+1|0;r1476=r1484;r1477=r1483}r1485=(r477|0)==(r478|0);if(r1485){r86=r1477;r87=r1473;r88=r88;r89=r89;r90=r90;continue L14}r1486=(r475|0)==0;if(r1486){r1487=r477;r1488=r1477}else{r1489=r477;r1490=r1477;r8=683;break L8}while(1){r1491=(r1487|0)<(r478|0);if(!r1491){break}r1492=HEAP32[r55>>2];r1493=r1488>>>0<r1492>>>0;if(!r1493){r8=694;break}r1494=HEAP8[r1488];r1495=r1474<<24>>24==r1494<<24>>24;if(r1495){break}r1496=r1488+1|0;r1497=r1487+1|0;r1487=r1497;r1488=r1496}do{if(r8==694){r8=0;r1498=HEAP32[r62>>2];r1499=(r1498|0)==0;if(r1499){break}r1500=HEAP32[r46>>2];r1501=r1488>>>0>r1500>>>0;if(!r1501){break}HEAP32[r63>>2]=1;r1502=(r1498|0)>1;if(r1502){r24=-12;r8=1133;break L8}}}while(0);r1503=(r476|0)==0;if(r1503){r1504=r1488;r8=700;break L14}else{r86=r1488;r87=r1473;r88=r88;r89=r89;r90=r90;continue L14}}r1505=r1474&255;r1506=HEAP32[r69>>2];r1507=r1506+r1505|0;r1508=HEAP8[r1507];r1509=1;r1510=r86;while(1){r1511=(r1509|0)>(r477|0);if(r1511){break}r1512=HEAP32[r55>>2];r1513=r1510>>>0<r1512>>>0;if(!r1513){r8=645;break L8}r1514=HEAP8[r1510];r1515=r1474<<24>>24==r1514<<24>>24;r1516=r1508<<24>>24==r1514<<24>>24;r1517=r1515|r1516;if(r1517){r24=0;r8=1117;break L8}r1518=r1510+1|0;r1519=r1509+1|0;r1509=r1519;r1510=r1518}r1520=(r477|0)==(r478|0);if(r1520){r86=r1510;r87=r1473;r88=r88;r89=r89;r90=r90;continue L14}r1521=(r475|0)==0;if(r1521){r1522=r477;r1523=r1510}else{r1524=r477;r1525=r1510;r8=653;break L8}while(1){r1526=(r1522|0)<(r478|0);if(!r1526){break}r1527=HEAP32[r55>>2];r1528=r1523>>>0<r1527>>>0;if(!r1528){r8=664;break}r1529=HEAP8[r1523];r1530=r1474<<24>>24==r1529<<24>>24;r1531=r1508<<24>>24==r1529<<24>>24;r1532=r1530|r1531;if(r1532){break}r1533=r1523+1|0;r1534=r1522+1|0;r1522=r1534;r1523=r1533}do{if(r8==664){r8=0;r1535=HEAP32[r62>>2];r1536=(r1535|0)==0;if(r1536){break}r1537=HEAP32[r46>>2];r1538=r1523>>>0>r1537>>>0;if(!r1538){break}HEAP32[r63>>2]=1;r1539=(r1535|0)>1;if(r1539){r24=-12;r8=1123;break L8}}}while(0);r1540=(r476|0)==0;if(r1540){r1541=r1523;r8=670;break L14}else{r86=r1523;r87=r1473;r88=r88;r89=r89;r90=r90;continue L14}}else if(r8==82){r8=0;r1542=r592+3|0;r1543=HEAP8[r1542];r1544=r1543&255;r1545=r1544<<8;r1546=r592+4|0;r1547=HEAP8[r1546];r1548=r1547&255;r1549=r1545|r1548;r1550=r1549<<1;r1551=HEAP32[r37>>2];r1552=(r1550|0)<(r1551|0);if(!r1552){r595=r592;r596=r593;r597=0;r8=98;break}r1553=HEAP32[r38>>2];r1554=r592;r1555=r1553;r1556=r1554-r1555|0;r1557=HEAP32[r39>>2];r1558=r1557+(r1550<<2)|0;r1559=HEAP32[r1558>>2];r1560=r1550|1;r1561=r1557+(r1560<<2)|0;r1562=HEAP32[r1561>>2];r1563=HEAP32[r40>>2];r1564=r1563-r1549|0;r1565=r1557+(r1564<<2)|0;r1566=HEAP32[r1565>>2];r1567=r593>>>0>135;r1568=r86;r1569=r592;r1570=r88;r1571=r89;r1572=0;L431:while(1){r1573=HEAP32[r41>>2];r1574=r1568;r1575=r1569;L433:while(1){r1576=HEAP32[r42>>2];r1577=r1576;r1578=r1574-r1577|0;r1579=HEAP32[r40>>2];r1580=r1579-r1549|0;r1581=HEAP32[r39>>2];r1582=r1581+(r1580<<2)|0;HEAP32[r1582>>2]=r1578;if(r1567){HEAP32[r28>>2]=2}r1583=HEAP8[r1575];r1584=r1583&255;r1585=r1584+8720|0;r1586=HEAP8[r1585];r1587=r1586&255;r1588=r1575+r1587|0;r1589=HEAP32[r10>>2];r1590=r1589+1|0;r1591=_match(r1568,r1588,r1570,r1571,r5,r90,r1590);do{if((r1591|0)==-998){break L433}else if((r1591|0)==-992){r1592=r1575+1|0;r1593=HEAP8[r1592];r1594=r1593&255;r1595=r1594<<8;r1596=r1575+2|0;r1597=HEAP8[r1596];r1598=r1597&255;r1599=r1595|r1598;r1600=r1575+r1599|0;r1601=HEAP32[r34>>2];r1602=r1601>>>0<r1600>>>0;if(!r1602){r24=r1591;r8=1168;break L8}r1603=HEAP8[r1575];r1604=r1603<<24>>24==119;if(r1604){r1605=r1592;r1606=r1596;break}r1607=HEAP8[r1600];r1608=r1607<<24>>24==119;if(r1608){r1605=r1592;r1606=r1596}else{r24=r1591;r8=1169;break L8}}else if((r1591|0)==0){r1609=r1575+1|0;r1610=r1575+2|0;r1605=r1609;r1606=r1610}else{r24=r1591;r8=1167;break L8}}while(0);HEAP32[r41>>2]=r1573;r1611=HEAP8[r1605];r1612=r1611&255;r1613=r1612<<8;r1614=HEAP8[r1606];r1615=r1614&255;r1616=r1613|r1615;r1617=r1575+r1616|0;r1618=HEAP8[r1617];r1619=r1618<<24>>24==119;if(r1619){r1575=r1617}else{break L431}}r1620=HEAP32[r35>>2];r1621=HEAP32[r36>>2];r1622=HEAP32[r38>>2];r1623=r1622+r1556|0;r1624=HEAP32[r34>>2];r1568=r1621;r1569=r1623;r1570=r1624;r1571=r1620;r1572=1}r1625=(r1572|0)==0;if(r1625){r1626=HEAP32[r39>>2];r1627=r1626+(r1550<<2)|0;HEAP32[r1627>>2]=r1559;r1628=HEAP32[r39>>2];r1629=r1628+(r1560<<2)|0;HEAP32[r1629>>2]=r1562;r1630=HEAP32[r40>>2];r1631=r1630-r1549|0;r1632=HEAP32[r39>>2];r1633=r1632+(r1631<<2)|0;HEAP32[r1633>>2]=r1566}r1634=(r594|0)==0;r1635=r1634^1;r1636=r1625^1;r1637=r1635|r1636;if(!r1637){r24=0;r8=1170;break L8}r1638=r1616+3|0;r1639=r1575+r1638|0;r86=r1568;r87=r1639;r88=r1570;r89=r1571;r90=r90;continue L14}else if(r8==266){r8=0;r1640=HEAP32[r42>>2];r1641=(r86|0)==(r1640|0);if(!r1641){r24=0;r8=1212;break L8}r1642=r87+1|0;r86=r86;r87=r1642;r88=r88;r89=r89;r90=r90;continue L14}else if(r8==303){r8=0;r1643=HEAP32[r55>>2];r1644=r86>>>0<r1643>>>0;if(r1644){r24=0;r8=1226;break L8}r1645=HEAP32[r62>>2];r1646=(r1645|0)==0;do{if(!r1646){r1647=HEAP32[r46>>2];r1648=r86>>>0>r1647>>>0;if(!r1648){break}HEAP32[r63>>2]=1;r1649=(r1645|0)>1;if(r1649){r24=-12;r8=1227;break L8}}}while(0);r1650=r87+1|0;r86=r86;r87=r1650;r88=r88;r89=r89;r90=r90;continue L14}else if(r8==308){r8=0;r1651=HEAP32[r55>>2];r1652=r86>>>0<r1651>>>0;if(r1652){r1653=HEAP32[r56>>2];r1654=(r1653|0)==0;do{if(r1654){r1655=HEAP32[r57>>2];r1656=-r1655|0;r1657=r1651+r1656|0;r1658=r86>>>0>r1657>>>0;if(r1658){r8=317;break L8}r1659=HEAP8[r86];r1660=HEAP8[r58];r1661=r1659<<24>>24==r1660<<24>>24;if(!r1661){r8=317;break L8}r1662=(r1655|0)==1;if(r1662){r1663=r1651;r1664=1;break}r1665=r86+1|0;r1666=HEAP8[r1665];r1667=HEAP8[r59];r1668=r1666<<24>>24==r1667<<24>>24;if(r1668){r1663=r1651;r1664=r1655}else{r8=317;break L8}}else{r1669=__pcre_is_newline(r86,r1653,r1651,r57,0);r1670=(r1669|0)==0;if(r1670){r8=317;break L8}r1671=HEAP32[r55>>2];r1672=HEAP32[r57>>2];r1663=r1671;r1664=r1672}}while(0);r1673=-r1664|0;r1674=r1663+r1673|0;r1675=(r86|0)==(r1674|0);if(!r1675){r8=317;break L8}}r1676=HEAP32[r62>>2];r1677=(r1676|0)==0;do{if(!r1677){r1678=HEAP32[r46>>2];r1679=r86>>>0>r1678>>>0;if(!r1679){break}HEAP32[r63>>2]=1;r1680=(r1676|0)>1;if(r1680){r24=-12;r8=1230;break L8}}}while(0);r1681=r87+1|0;r86=r86;r87=r1681;r88=r88;r89=r89;r90=r90;continue L14}else if(r8==353){r8=0;r1682=HEAP32[r55>>2];r1683=r86>>>0<r1682>>>0;if(!r1683){r8=354;break L8}r1684=r86+1|0;r1685=r87+1|0;r86=r1684;r87=r1685;r88=r88;r89=r89;r90=r90;continue L14}}while(0);L476:do{if(r8==563){r8=0;r1686=r279+1|0;r1687=HEAP8[r279];r1688=(r91&255)>45;if(!r1688){r1689=1;r1690=r86;while(1){r1691=(r1689|0)>(r282|0);if(r1691){break}r1692=HEAP32[r55>>2];r1693=r1690>>>0<r1692>>>0;if(!r1693){r8=596;break L8}r1694=HEAP8[r1690];r1695=r1687<<24>>24==r1694<<24>>24;if(!r1695){r24=0;r8=1103;break L8}r1696=r1690+1|0;r1697=r1689+1|0;r1689=r1697;r1690=r1696}r1698=(r282|0)==(r283|0);if(r1698){r86=r1690;r87=r1686;r88=r88;r89=r89;r90=r90;continue L14}r1699=(r280|0)==0;if(r1699){r1700=r282;r1701=r1690}else{r1702=r282;r1703=r1690;r8=604;break L8}while(1){r1704=(r1700|0)<(r283|0);if(!r1704){break}r1705=HEAP32[r55>>2];r1706=r1701>>>0<r1705>>>0;if(!r1706){r8=615;break}r1707=HEAP8[r1701];r1708=r1687<<24>>24==r1707<<24>>24;if(!r1708){break}r1709=r1701+1|0;r1710=r1700+1|0;r1700=r1710;r1701=r1709}do{if(r8==615){r8=0;r1711=HEAP32[r62>>2];r1712=(r1711|0)==0;if(r1712){break}r1713=HEAP32[r46>>2];r1714=r1701>>>0>r1713>>>0;if(!r1714){break}HEAP32[r63>>2]=1;r1715=(r1711|0)>1;if(r1715){r24=-12;r8=1109;break L8}}}while(0);r1716=(r281|0)==0;if(r1716){r1717=r1701;r8=621;break L14}else{r86=r1701;r87=r1686;r88=r88;r89=r89;r90=r90;continue L14}}r1718=r1687&255;r1719=HEAP32[r69>>2];r1720=r1719+r1718|0;r1721=HEAP8[r1720];r1722=1;r1723=r86;while(1){r1724=(r1722|0)>(r282|0);if(r1724){break}r1725=HEAP32[r55>>2];r1726=r1723>>>0<r1725>>>0;if(!r1726){r8=567;break L8}r1727=HEAP8[r1723];r1728=r1687<<24>>24==r1727<<24>>24;r1729=r1721<<24>>24==r1727<<24>>24;r1730=r1728|r1729;if(!r1730){r24=0;r8=1034;break L8}r1731=r1723+1|0;r1732=r1722+1|0;r1722=r1732;r1723=r1731}r1733=(r282|0)==(r283|0);if(r1733){r86=r1723;r87=r1686;r88=r88;r89=r89;r90=r90;continue L14}r1734=(r280|0)==0;if(r1734){r1735=r282;r1736=r1723}else{r1737=r282;r1738=r1723;r8=575;break L8}while(1){r1739=(r1735|0)<(r283|0);if(!r1739){break}r1740=HEAP32[r55>>2];r1741=r1736>>>0<r1740>>>0;if(!r1741){r8=586;break}r1742=HEAP8[r1736];r1743=r1687<<24>>24==r1742<<24>>24;r1744=r1721<<24>>24==r1742<<24>>24;r1745=r1743|r1744;if(!r1745){break}r1746=r1736+1|0;r1747=r1735+1|0;r1735=r1747;r1736=r1746}do{if(r8==586){r8=0;r1748=HEAP32[r62>>2];r1749=(r1748|0)==0;if(r1749){break}r1750=HEAP32[r46>>2];r1751=r1736>>>0>r1750>>>0;if(!r1751){break}HEAP32[r63>>2]=1;r1752=(r1748|0)>1;if(r1752){r24=-12;r8=1040;break L8}}}while(0);r1753=(r281|0)==0;if(r1753){r1754=r1736;r8=592;break L14}else{r86=r1736;r87=r1686;r88=r88;r89=r89;r90=r90;continue L14}}else if(r8==712){r8=0;switch(r427|0){case 12:{r1755=1;r1756=r86;while(1){r1757=(r1755|0)>(r422|0);if(r1757){r1461=r1756;r1462=r421;r1463=r422;r1464=r423;r1465=r424;r1466=r425;r1467=r426;r1468=r427;break L476}r1758=HEAP32[r55>>2];r1759=r1756>>>0<r1758>>>0;if(!r1759){r8=715;break L8}r1760=HEAP32[r56>>2];r1761=(r1760|0)==0;do{if(r1761){r1762=HEAP32[r57>>2];r1763=-r1762|0;r1764=r1758+r1763|0;r1765=r1756>>>0>r1764>>>0;if(r1765){break}r1766=HEAP8[r1756];r1767=HEAP8[r58];r1768=r1766<<24>>24==r1767<<24>>24;if(!r1768){break}r1769=(r1762|0)==1;if(r1769){r24=0;r8=1057;break L8}r1770=r1756+1|0;r1771=HEAP8[r1770];r1772=HEAP8[r59];r1773=r1771<<24>>24==r1772<<24>>24;if(r1773){r24=0;r8=1058;break L8}}else{r1774=__pcre_is_newline(r1756,r1760,r1758,r57,0);r1775=(r1774|0)==0;if(!r1775){r24=0;r8=1056;break L8}}}while(0);r1776=HEAP32[r62>>2];r1777=(r1776|0)==0;r1778=r1756+1|0;do{if(r1777){r1779=r1778}else{r1780=HEAP32[r55>>2];r1781=r1778>>>0<r1780>>>0;if(r1781){r1779=r1778;break}r1782=HEAP32[r56>>2];r1783=(r1782|0)==0;if(!r1783){r1779=r1778;break}r1784=HEAP32[r57>>2];r1785=(r1784|0)==2;if(!r1785){r1779=r1778;break}r1786=HEAP8[r1756];r1787=HEAP8[r58];r1788=r1786<<24>>24==r1787<<24>>24;if(!r1788){r1779=r1778;break}HEAP32[r63>>2]=1;r1789=(r1776|0)>1;if(r1789){r24=-12;r8=1059;break L8}else{r1779=r1778}}}while(0);r1790=r1755+1|0;r1755=r1790;r1756=r1779}break};case 13:{r1791=HEAP32[r55>>2];r1792=-r422|0;r1793=r1791+r1792|0;r1794=r86>>>0>r1793>>>0;if(r1794){r8=733;break L8}r1795=r86+r422|0;r1461=r1795;r1462=r421;r1463=r422;r1464=r423;r1465=r424;r1466=r425;r1467=r426;r1468=r427;break L476;break};case 14:{r1796=HEAP32[r55>>2];r1797=-r422|0;r1798=r1796+r1797|0;r1799=r86>>>0>r1798>>>0;if(r1799){r8=739;break L8}r1800=r86+r422|0;r1461=r1800;r1462=r421;r1463=r422;r1464=r423;r1465=r424;r1466=r425;r1467=r426;r1468=r427;break L476;break};case 17:{r1801=1;r1802=r86;while(1){r1803=(r1801|0)>(r422|0);if(r1803){r1461=r1802;r1462=r421;r1463=r422;r1464=r423;r1465=r424;r1466=r425;r1467=r426;r1468=r427;break L476}r1804=HEAP32[r55>>2];r1805=r1802>>>0<r1804>>>0;if(!r1805){r8=746;break L8}r1806=r1802+1|0;r1807=HEAP8[r1802];r1808=r1807&255;L542:do{switch(r1808|0){case 13:{r1809=r1806>>>0<r1804>>>0;if(!r1809){r1810=r1806;break L542}r1811=HEAP8[r1806];r1812=r1811<<24>>24==10;r1813=r1802+2|0;r1814=r1812?r1813:r1806;r1810=r1814;break};case 11:case 12:case 133:{r1815=HEAP32[r66>>2];r1816=(r1815|0)==0;if(r1816){r1810=r1806}else{r24=0;r8=1067;break L8}break};case 10:{r1810=r1806;break};default:{r24=0;r8=1066;break L8}}}while(0);r1817=r1801+1|0;r1801=r1817;r1802=r1810}break};case 18:{r1818=1;r1819=r86;while(1){r1820=(r1818|0)>(r422|0);if(r1820){r1461=r1819;r1462=r421;r1463=r422;r1464=r423;r1465=r424;r1466=r425;r1467=r426;r1468=r427;break L476}r1821=HEAP32[r55>>2];r1822=r1819>>>0<r1821>>>0;if(!r1822){r8=757;break L8}r1823=HEAP8[r1819];r1824=r1823&255;if((r1824|0)==9|(r1824|0)==32|(r1824|0)==160){r24=0;r8=1070;break L8}r1825=r1819+1|0;r1826=r1818+1|0;r1818=r1826;r1819=r1825}break};case 19:{r1827=1;r1828=r86;while(1){r1829=(r1827|0)>(r422|0);if(r1829){r1461=r1828;r1462=r421;r1463=r422;r1464=r423;r1465=r424;r1466=r425;r1467=r426;r1468=r427;break L476}r1830=HEAP32[r55>>2];r1831=r1828>>>0<r1830>>>0;if(!r1831){r8=765;break L8}r1832=r1828+1|0;r1833=HEAP8[r1828];r1834=r1833&255;if(!((r1834|0)==9|(r1834|0)==32|(r1834|0)==160)){r24=0;r8=1073;break L8}r1835=r1827+1|0;r1827=r1835;r1828=r1832}break};case 20:{r1836=1;r1837=r86;while(1){r1838=(r1836|0)>(r422|0);if(r1838){r1461=r1837;r1462=r421;r1463=r422;r1464=r423;r1465=r424;r1466=r425;r1467=r426;r1468=r427;break L476}r1839=HEAP32[r55>>2];r1840=r1837>>>0<r1839>>>0;if(!r1840){r8=773;break L8}r1841=HEAP8[r1837];r1842=r1841&255;switch(r1842|0){case 10:case 11:case 12:case 13:case 133:{r24=0;r8=1076;break L8;break};default:{}}r1843=r1837+1|0;r1844=r1836+1|0;r1836=r1844;r1837=r1843}break};case 21:{r1845=1;r1846=r86;while(1){r1847=(r1845|0)>(r422|0);if(r1847){r1461=r1846;r1462=r421;r1463=r422;r1464=r423;r1465=r424;r1466=r425;r1467=r426;r1468=r427;break L476}r1848=HEAP32[r55>>2];r1849=r1846>>>0<r1848>>>0;if(!r1849){r8=781;break L8}r1850=r1846+1|0;r1851=HEAP8[r1846];r1852=r1851&255;switch(r1852|0){case 10:case 11:case 12:case 13:case 133:{break};default:{r24=0;r8=1079;break L8}}r1853=r1845+1|0;r1845=r1853;r1846=r1850}break};case 6:{r1854=1;r1855=r86;while(1){r1856=(r1854|0)>(r422|0);if(r1856){r1461=r1855;r1462=r421;r1463=r422;r1464=r423;r1465=r424;r1466=r425;r1467=r426;r1468=r427;break L476}r1857=HEAP32[r55>>2];r1858=r1855>>>0<r1857>>>0;if(!r1858){r8=789;break L8}r1859=HEAP8[r1855];r1860=r1859&255;r1861=HEAP32[r65>>2];r1862=r1861+r1860|0;r1863=HEAP8[r1862];r1864=r1863&4;r1865=r1864<<24>>24==0;if(!r1865){r24=0;r8=1082;break L8}r1866=r1855+1|0;r1867=r1854+1|0;r1854=r1867;r1855=r1866}break};case 7:{r1868=1;r1869=r86;while(1){r1870=(r1868|0)>(r422|0);if(r1870){r1461=r1869;r1462=r421;r1463=r422;r1464=r423;r1465=r424;r1466=r425;r1467=r426;r1468=r427;break L476}r1871=HEAP32[r55>>2];r1872=r1869>>>0<r1871>>>0;if(!r1872){r8=797;break L8}r1873=HEAP8[r1869];r1874=r1873&255;r1875=HEAP32[r65>>2];r1876=r1875+r1874|0;r1877=HEAP8[r1876];r1878=r1877&4;r1879=r1878<<24>>24==0;if(r1879){r24=0;r8=1085;break L8}r1880=r1869+1|0;r1881=r1868+1|0;r1868=r1881;r1869=r1880}break};case 8:{r1882=1;r1883=r86;while(1){r1884=(r1882|0)>(r422|0);if(r1884){r1461=r1883;r1462=r421;r1463=r422;r1464=r423;r1465=r424;r1466=r425;r1467=r426;r1468=r427;break L476}r1885=HEAP32[r55>>2];r1886=r1883>>>0<r1885>>>0;if(!r1886){r8=805;break L8}r1887=HEAP8[r1883];r1888=r1887&255;r1889=HEAP32[r65>>2];r1890=r1889+r1888|0;r1891=HEAP8[r1890];r1892=r1891&1;r1893=r1892<<24>>24==0;if(!r1893){r24=0;r8=1088;break L8}r1894=r1883+1|0;r1895=r1882+1|0;r1882=r1895;r1883=r1894}break};case 9:{r1896=1;r1897=r86;while(1){r1898=(r1896|0)>(r422|0);if(r1898){r1461=r1897;r1462=r421;r1463=r422;r1464=r423;r1465=r424;r1466=r425;r1467=r426;r1468=r427;break L476}r1899=HEAP32[r55>>2];r1900=r1897>>>0<r1899>>>0;if(!r1900){r8=813;break L8}r1901=HEAP8[r1897];r1902=r1901&255;r1903=HEAP32[r65>>2];r1904=r1903+r1902|0;r1905=HEAP8[r1904];r1906=r1905&1;r1907=r1906<<24>>24==0;if(r1907){r24=0;r8=1091;break L8}r1908=r1897+1|0;r1909=r1896+1|0;r1896=r1909;r1897=r1908}break};case 10:{r1910=1;r1911=r86;while(1){r1912=(r1910|0)>(r422|0);if(r1912){r1461=r1911;r1462=r421;r1463=r422;r1464=r423;r1465=r424;r1466=r425;r1467=r426;r1468=r427;break L476}r1913=HEAP32[r55>>2];r1914=r1911>>>0<r1913>>>0;if(!r1914){r8=821;break L8}r1915=HEAP8[r1911];r1916=r1915&255;r1917=HEAP32[r65>>2];r1918=r1917+r1916|0;r1919=HEAP8[r1918];r1920=r1919&16;r1921=r1920<<24>>24==0;if(!r1921){r24=0;r8=1094;break L8}r1922=r1911+1|0;r1923=r1910+1|0;r1910=r1923;r1911=r1922}break};case 11:{r1924=1;r1925=r86;while(1){r1926=(r1924|0)>(r422|0);if(r1926){r1461=r1925;r1462=r421;r1463=r422;r1464=r423;r1465=r424;r1466=r425;r1467=r426;r1468=r427;break L476}r1927=HEAP32[r55>>2];r1928=r1925>>>0<r1927>>>0;if(!r1928){r8=829;break L8}r1929=HEAP8[r1925];r1930=r1929&255;r1931=HEAP32[r65>>2];r1932=r1931+r1930|0;r1933=HEAP8[r1932];r1934=r1933&16;r1935=r1934<<24>>24==0;if(r1935){r24=0;r8=1253;break L8}r1936=r1925+1|0;r1937=r1924+1|0;r1924=r1937;r1925=r1936}break};default:{r24=-14;r8=1053;break L8}}}else if(r8==98){r8=0;r1938=HEAP32[r38>>2];r1939=r595;r1940=r1938;r1941=r1939-r1940|0;r1942=HEAP32[r41>>2];r1943=r596>>>0>135;r1944=r86;r1945=r595;r1946=r88;r1947=r89;r1948=0;L598:while(1){r1949=r1945;L600:while(1){if(r1943){HEAP32[r28>>2]=2}r1950=HEAP8[r1949];r1951=r1950&255;r1952=r1951+8720|0;r1953=HEAP8[r1952];r1954=r1953&255;r1955=r1949+r1954|0;r1956=HEAP32[r10>>2];r1957=r1956+1|0;r1958=_match(r1944,r1955,r1946,r1947,r5,r90,r1957);do{if((r1958|0)==-998){break L600}else if((r1958|0)==-992){r1959=r1949+1|0;r1960=HEAP8[r1959];r1961=r1960&255;r1962=r1961<<8;r1963=r1949+2|0;r1964=HEAP8[r1963];r1965=r1964&255;r1966=r1962|r1965;r1967=r1949+r1966|0;r1968=HEAP32[r34>>2];r1969=r1968>>>0<r1967>>>0;if(!r1969){r24=r1958;r8=1172;break L8}r1970=HEAP8[r1949];r1971=r1970<<24>>24==119;if(r1971){r1972=r1960;r1973=r1964;break}r1974=HEAP8[r1967];r1975=r1974<<24>>24==119;if(r1975){r1972=r1960;r1973=r1964}else{r24=r1958;r8=1173;break L8}}else if((r1958|0)==0){r1976=r1949+1|0;r1977=HEAP8[r1976];r1978=r1949+2|0;r1979=HEAP8[r1978];r1972=r1977;r1973=r1979}else{r24=r1958;r8=1171;break L8}}while(0);r1980=r1972&255;r1981=r1980<<8;r1982=r1973&255;r1983=r1981|r1982;r1984=r1949+r1983|0;r1985=HEAP8[r1984];r1986=r1985<<24>>24==119;if(!r1986){break L598}HEAP32[r41>>2]=r1942;r1949=r1984}r1987=HEAP32[r35>>2];r1988=HEAP32[r36>>2];r1989=HEAP32[r38>>2];r1990=r1989+r1941|0;r1991=HEAP32[r34>>2];r1944=r1988;r1945=r1990;r1946=r1991;r1947=r1987;r1948=1}r1992=(r1948|0)==0;r1993=(r597|0)==0;r1994=r1992&r1993;if(r1994){r24=0;r8=1174;break L8}r1995=r1983+3|0;r1996=r1949+r1995|0;r86=r1944;r87=r1996;r88=r1946;r89=r1947;r90=r90;continue L14}}while(0);r1997=(r1463|0)==(r1462|0);if(r1997){r86=r1461;r87=r1466;r88=r88;r89=r89;r90=r90;continue}r1998=(r1465|0)==0;if(!r1998){r8=837;break L8}L618:do{switch(r1468|0){case 12:{r1999=r1463;r2000=r1461;while(1){r2001=(r1999|0)<(r1462|0);if(!r2001){r2002=r2000;break L618}r2003=HEAP32[r55>>2];r2004=r2000>>>0<r2003>>>0;if(!r2004){break}r2005=HEAP32[r56>>2];r2006=(r2005|0)==0;do{if(r2006){r2007=HEAP32[r57>>2];r2008=-r2007|0;r2009=r2003+r2008|0;r2010=r2000>>>0>r2009>>>0;if(r2010){break}r2011=HEAP8[r2000];r2012=HEAP8[r58];r2013=r2011<<24>>24==r2012<<24>>24;if(!r2013){break}r2014=(r2007|0)==1;if(r2014){r2002=r2000;break L618}r2015=r2000+1|0;r2016=HEAP8[r2015];r2017=HEAP8[r59];r2018=r2016<<24>>24==r2017<<24>>24;if(r2018){r2002=r2000;break L618}}else{r2019=__pcre_is_newline(r2000,r2005,r2003,r57,0);r2020=(r2019|0)==0;if(!r2020){r2002=r2000;break L618}}}while(0);r2021=HEAP32[r62>>2];r2022=(r2021|0)==0;r2023=r2000+1|0;do{if(r2022){r2024=r2023}else{r2025=HEAP32[r55>>2];r2026=r2023>>>0<r2025>>>0;if(r2026){r2024=r2023;break}r2027=HEAP32[r56>>2];r2028=(r2027|0)==0;if(!r2028){r2024=r2023;break}r2029=HEAP32[r57>>2];r2030=(r2029|0)==2;if(!r2030){r2024=r2023;break}r2031=HEAP8[r2000];r2032=HEAP8[r58];r2033=r2031<<24>>24==r2032<<24>>24;if(!r2033){r2024=r2023;break}HEAP32[r63>>2]=1;r2034=(r2021|0)>1;if(r2034){r24=-12;r8=1277;break L8}else{r2024=r2023}}}while(0);r2035=r1999+1|0;r1999=r2035;r2000=r2024}r2036=HEAP32[r62>>2];r2037=(r2036|0)==0;if(r2037){r2002=r2000;break L618}r2038=HEAP32[r46>>2];r2039=r2000>>>0>r2038>>>0;if(!r2039){r2002=r2000;break L618}HEAP32[r63>>2]=1;r2040=(r2036|0)>1;if(r2040){r24=-12;r8=1276;break L8}else{r2002=r2000}break};case 13:case 14:{r2041=r1462-r1463|0;r2042=HEAP32[r55>>2];r2043=r2042;r2044=r1461;r2045=r2043-r2044|0;r2046=r2041>>>0>r2045>>>0;if(!r2046){r2047=r1461+r2041|0;r2002=r2047;break L618}r2048=HEAP32[r62>>2];r2049=(r2048|0)==0;if(r2049){r2002=r2042;break L618}r2050=HEAP32[r46>>2];r2051=r2042>>>0>r2050>>>0;if(!r2051){r2002=r2042;break L618}HEAP32[r63>>2]=1;r2052=(r2048|0)>1;if(r2052){r24=-12;r8=1278;break L8}else{r2002=r2042}break};case 17:{r2053=r1463;r2054=r1461;while(1){r2055=(r2053|0)<(r1462|0);if(!r2055){r2002=r2054;break L618}r2056=HEAP32[r55>>2];r2057=r2054>>>0<r2056>>>0;if(!r2057){break}r2058=HEAP8[r2054];if(r2058<<24>>24==13){r2059=r2054+1|0;r2060=r2059>>>0<r2056>>>0;if(!r2060){r2002=r2059;break L618}r2061=HEAP8[r2059];r2062=r2061<<24>>24==10;r2063=r2054+2|0;r2064=r2062?r2063:r2059;r2065=r2064}else if(r2058<<24>>24==10){r8=909}else{r2066=HEAP32[r66>>2];r2067=(r2066|0)==0;if(!r2067){r2002=r2054;break L618}if(r2058<<24>>24==11|r2058<<24>>24==12|r2058<<24>>24==-123){r8=909}else{r2002=r2054;break L618}}if(r8==909){r8=0;r2068=r2054+1|0;r2065=r2068}r2069=r2053+1|0;r2053=r2069;r2054=r2065}r2070=HEAP32[r62>>2];r2071=(r2070|0)==0;if(r2071){r2002=r2054;break L618}r2072=HEAP32[r46>>2];r2073=r2054>>>0>r2072>>>0;if(!r2073){r2002=r2054;break L618}HEAP32[r63>>2]=1;r2074=(r2070|0)>1;if(r2074){r24=-12;r8=1279;break L8}else{r2002=r2054}break};case 18:{r2075=r1463;r2076=r1461;while(1){r2077=(r2075|0)<(r1462|0);if(!r2077){r2002=r2076;break L618}r2078=HEAP32[r55>>2];r2079=r2076>>>0<r2078>>>0;if(!r2079){break}r2080=HEAP8[r2076];r2081=r2080&255;if((r2081|0)==9|(r2081|0)==32|(r2081|0)==160){r2002=r2076;break L618}r2082=r2076+1|0;r2083=r2075+1|0;r2075=r2083;r2076=r2082}r2084=HEAP32[r62>>2];r2085=(r2084|0)==0;if(r2085){r2002=r2076;break L618}r2086=HEAP32[r46>>2];r2087=r2076>>>0>r2086>>>0;if(!r2087){r2002=r2076;break L618}HEAP32[r63>>2]=1;r2088=(r2084|0)>1;if(r2088){r24=-12;r8=1280;break L8}else{r2002=r2076}break};case 19:{r2089=r1463;r2090=r1461;while(1){r2091=(r2089|0)<(r1462|0);if(!r2091){r2002=r2090;break L618}r2092=HEAP32[r55>>2];r2093=r2090>>>0<r2092>>>0;if(!r2093){break}r2094=HEAP8[r2090];r2095=r2094&255;if(!((r2095|0)==9|(r2095|0)==32|(r2095|0)==160)){r2002=r2090;break L618}r2096=r2090+1|0;r2097=r2089+1|0;r2089=r2097;r2090=r2096}r2098=HEAP32[r62>>2];r2099=(r2098|0)==0;if(r2099){r2002=r2090;break L618}r2100=HEAP32[r46>>2];r2101=r2090>>>0>r2100>>>0;if(!r2101){r2002=r2090;break L618}HEAP32[r63>>2]=1;r2102=(r2098|0)>1;if(r2102){r24=-12;r8=1281;break L8}else{r2002=r2090}break};case 20:{r2103=r1463;r2104=r1461;while(1){r2105=(r2103|0)<(r1462|0);if(!r2105){r2002=r2104;break L618}r2106=HEAP32[r55>>2];r2107=r2104>>>0<r2106>>>0;if(!r2107){break}r2108=HEAP8[r2104];r2109=r2108&255;switch(r2109|0){case 10:case 11:case 12:case 13:case 133:{r2002=r2104;break L618;break};default:{}}r2110=r2104+1|0;r2111=r2103+1|0;r2103=r2111;r2104=r2110}r2112=HEAP32[r62>>2];r2113=(r2112|0)==0;if(r2113){r2002=r2104;break L618}r2114=HEAP32[r46>>2];r2115=r2104>>>0>r2114>>>0;if(!r2115){r2002=r2104;break L618}HEAP32[r63>>2]=1;r2116=(r2112|0)>1;if(r2116){r24=-12;r8=1282;break L8}else{r2002=r2104}break};case 21:{r2117=r1463;r2118=r1461;while(1){r2119=(r2117|0)<(r1462|0);if(!r2119){r2002=r2118;break L618}r2120=HEAP32[r55>>2];r2121=r2118>>>0<r2120>>>0;if(!r2121){break}r2122=HEAP8[r2118];r2123=r2122&255;switch(r2123|0){case 10:case 11:case 12:case 13:case 133:{break};default:{r2002=r2118;break L618}}r2124=r2118+1|0;r2125=r2117+1|0;r2117=r2125;r2118=r2124}r2126=HEAP32[r62>>2];r2127=(r2126|0)==0;if(r2127){r2002=r2118;break L618}r2128=HEAP32[r46>>2];r2129=r2118>>>0>r2128>>>0;if(!r2129){r2002=r2118;break L618}HEAP32[r63>>2]=1;r2130=(r2126|0)>1;if(r2130){r24=-12;r8=1283;break L8}else{r2002=r2118}break};case 6:{r2131=r1463;r2132=r1461;while(1){r2133=(r2131|0)<(r1462|0);if(!r2133){r2002=r2132;break L618}r2134=HEAP32[r55>>2];r2135=r2132>>>0<r2134>>>0;if(!r2135){break}r2136=HEAP8[r2132];r2137=r2136&255;r2138=HEAP32[r65>>2];r2139=r2138+r2137|0;r2140=HEAP8[r2139];r2141=r2140&4;r2142=r2141<<24>>24==0;if(!r2142){r2002=r2132;break L618}r2143=r2132+1|0;r2144=r2131+1|0;r2131=r2144;r2132=r2143}r2145=HEAP32[r62>>2];r2146=(r2145|0)==0;if(r2146){r2002=r2132;break L618}r2147=HEAP32[r46>>2];r2148=r2132>>>0>r2147>>>0;if(!r2148){r2002=r2132;break L618}HEAP32[r63>>2]=1;r2149=(r2145|0)>1;if(r2149){r24=-12;r8=1284;break L8}else{r2002=r2132}break};case 7:{r2150=r1463;r2151=r1461;while(1){r2152=(r2150|0)<(r1462|0);if(!r2152){r2002=r2151;break L618}r2153=HEAP32[r55>>2];r2154=r2151>>>0<r2153>>>0;if(!r2154){break}r2155=HEAP8[r2151];r2156=r2155&255;r2157=HEAP32[r65>>2];r2158=r2157+r2156|0;r2159=HEAP8[r2158];r2160=r2159&4;r2161=r2160<<24>>24==0;if(r2161){r2002=r2151;break L618}r2162=r2151+1|0;r2163=r2150+1|0;r2150=r2163;r2151=r2162}r2164=HEAP32[r62>>2];r2165=(r2164|0)==0;if(r2165){r2002=r2151;break L618}r2166=HEAP32[r46>>2];r2167=r2151>>>0>r2166>>>0;if(!r2167){r2002=r2151;break L618}HEAP32[r63>>2]=1;r2168=(r2164|0)>1;if(r2168){r24=-12;r8=1285;break L8}else{r2002=r2151}break};case 8:{r2169=r1463;r2170=r1461;while(1){r2171=(r2169|0)<(r1462|0);if(!r2171){r2002=r2170;break L618}r2172=HEAP32[r55>>2];r2173=r2170>>>0<r2172>>>0;if(!r2173){break}r2174=HEAP8[r2170];r2175=r2174&255;r2176=HEAP32[r65>>2];r2177=r2176+r2175|0;r2178=HEAP8[r2177];r2179=r2178&1;r2180=r2179<<24>>24==0;if(!r2180){r2002=r2170;break L618}r2181=r2170+1|0;r2182=r2169+1|0;r2169=r2182;r2170=r2181}r2183=HEAP32[r62>>2];r2184=(r2183|0)==0;if(r2184){r2002=r2170;break L618}r2185=HEAP32[r46>>2];r2186=r2170>>>0>r2185>>>0;if(!r2186){r2002=r2170;break L618}HEAP32[r63>>2]=1;r2187=(r2183|0)>1;if(r2187){r24=-12;r8=1286;break L8}else{r2002=r2170}break};case 9:{r2188=r1463;r2189=r1461;while(1){r2190=(r2188|0)<(r1462|0);if(!r2190){r2002=r2189;break L618}r2191=HEAP32[r55>>2];r2192=r2189>>>0<r2191>>>0;if(!r2192){break}r2193=HEAP8[r2189];r2194=r2193&255;r2195=HEAP32[r65>>2];r2196=r2195+r2194|0;r2197=HEAP8[r2196];r2198=r2197&1;r2199=r2198<<24>>24==0;if(r2199){r2002=r2189;break L618}r2200=r2189+1|0;r2201=r2188+1|0;r2188=r2201;r2189=r2200}r2202=HEAP32[r62>>2];r2203=(r2202|0)==0;if(r2203){r2002=r2189;break L618}r2204=HEAP32[r46>>2];r2205=r2189>>>0>r2204>>>0;if(!r2205){r2002=r2189;break L618}HEAP32[r63>>2]=1;r2206=(r2202|0)>1;if(r2206){r24=-12;r8=1287;break L8}else{r2002=r2189}break};case 10:{r2207=r1463;r2208=r1461;while(1){r2209=(r2207|0)<(r1462|0);if(!r2209){r2002=r2208;break L618}r2210=HEAP32[r55>>2];r2211=r2208>>>0<r2210>>>0;if(!r2211){break}r2212=HEAP8[r2208];r2213=r2212&255;r2214=HEAP32[r65>>2];r2215=r2214+r2213|0;r2216=HEAP8[r2215];r2217=r2216&16;r2218=r2217<<24>>24==0;if(!r2218){r2002=r2208;break L618}r2219=r2208+1|0;r2220=r2207+1|0;r2207=r2220;r2208=r2219}r2221=HEAP32[r62>>2];r2222=(r2221|0)==0;if(r2222){r2002=r2208;break L618}r2223=HEAP32[r46>>2];r2224=r2208>>>0>r2223>>>0;if(!r2224){r2002=r2208;break L618}HEAP32[r63>>2]=1;r2225=(r2221|0)>1;if(r2225){r24=-12;r8=1288;break L8}else{r2002=r2208}break};case 11:{r2226=r1463;r2227=r1461;while(1){r2228=(r2226|0)<(r1462|0);if(!r2228){r2002=r2227;break L618}r2229=HEAP32[r55>>2];r2230=r2227>>>0<r2229>>>0;if(!r2230){break}r2231=HEAP8[r2227];r2232=r2231&255;r2233=HEAP32[r65>>2];r2234=r2233+r2232|0;r2235=HEAP8[r2234];r2236=r2235&16;r2237=r2236<<24>>24==0;if(r2237){r2002=r2227;break L618}r2238=r2227+1|0;r2239=r2226+1|0;r2226=r2239;r2227=r2238}r2240=HEAP32[r62>>2];r2241=(r2240|0)==0;if(r2241){r2002=r2227;break L618}r2242=HEAP32[r46>>2];r2243=r2227>>>0>r2242>>>0;if(!r2243){r2002=r2227;break L618}HEAP32[r63>>2]=1;r2244=(r2240|0)>1;if(r2244){r24=-12;r8=1289;break L8}else{r2002=r2227}break};default:{r24=-14;r8=1275;break L8}}}while(0);r2245=(r1464|0)==0;if(r2245){r8=982;break}else{r86=r2002;r87=r1466;r88=r88;r89=r89;r90=r90}}if(r8==592){while(1){r8=0;r2246=(r1754|0)==(r1723|0);if(r2246){r72=r1723;r73=r1686;r74=r88;r75=r89;r76=r90;continue L8}r2247=HEAP32[r10>>2];r2248=r2247+1|0;r2249=_match(r1754,r1686,r88,r89,r5,r90,r2248);r2250=r1754-1|0;r2251=(r2249|0)==0;if(r2251){r1754=r2250;r8=592}else{r24=r2249;r8=1041;break L8}}}else if(r8==621){while(1){r8=0;r2252=(r1717|0)==(r1690|0);if(r2252){r72=r1690;r73=r1686;r74=r88;r75=r89;r76=r90;continue L8}r2253=HEAP32[r10>>2];r2254=r2253+1|0;r2255=_match(r1717,r1686,r88,r89,r5,r90,r2254);r2256=r1717-1|0;r2257=(r2255|0)==0;if(r2257){r1717=r2256;r8=621}else{r24=r2255;r8=1110;break L8}}}else if(r8==670){while(1){r8=0;r2258=(r1541|0)==(r1510|0);if(r2258){r72=r1510;r73=r1473;r74=r88;r75=r89;r76=r90;continue L8}r2259=HEAP32[r10>>2];r2260=r2259+1|0;r2261=_match(r1541,r1473,r88,r89,r5,r90,r2260);r2262=(r2261|0)==0;if(!r2262){r24=r2261;r8=1124;break L8}r2263=r1541-1|0;r1541=r2263;r8=670}}else if(r8==700){while(1){r8=0;r2264=(r1504|0)==(r1477|0);if(r2264){r72=r1477;r73=r1473;r74=r88;r75=r89;r76=r90;continue L8}r2265=HEAP32[r10>>2];r2266=r2265+1|0;r2267=_match(r1504,r1473,r88,r89,r5,r90,r2266);r2268=(r2267|0)==0;if(!r2268){r24=r2267;r8=1134;break L8}r2269=r1504-1|0;r1504=r2269;r8=700}}else if(r8==48){r8=0;r2270=r582<<24>>24==122;if(r2270){r2271=r580+3|0;r2272=r572+r2271|0;r2273=HEAP32[r10>>2];r2274=r2273+1|0;r2275=_match(r585,r2272,r568,r584,r5,r90,r2274);r2276=(r2275|0)==0;if(r2276){r72=r585;r73=r87;r74=r568;r75=r584;r76=r90;continue}else{r24=r2275;r8=1157;break}}r2277=HEAP32[r10>>2];r2278=r2277+1|0;r2279=_match(r585,r87,r568,r584,r5,r90,r2278);r2280=(r2279|0)==0;if(!r2280){r24=r2279;r8=1158;break}r2281=r580+3|0;r2282=r572+r2281|0;r72=r585;r73=r2282;r74=r568;r75=r584;r76=r90;continue}else if(r8==52){r8=0;r2283=r87+3|0;r2284=HEAP8[r2283];r2285=r2284&255;r2286=r2285<<8;r2287=r87+4|0;r2288=HEAP8[r2287];r2289=r2288&255;r2290=r2286|r2289;r2291=r2290<<1;r2292=HEAP32[r37>>2];r2293=(r2291|0)<(r2292|0);if(r2293){r8=53;break}else{r591=r87}}else if(r8==141){r8=0;r2294=r91<<24>>24==-116;if(r2294){r8=142;break}else{r72=r86;r73=r779;r74=r88;r75=r778;r76=r90;continue}}else if(r8==250){r8=0;if(r1202<<24>>24==123){r8=251;break}else if(r1202<<24>>24==122){r2295=r87+3|0;r2296=HEAP32[r10>>2];r2297=r2296+1|0;r2298=_match(r86,r2295,r88,r1127,r5,r1129,r2297);r2299=(r2298|0)==0;if(!r2299){r24=r2298;r8=1203;break}r2300=HEAP8[r1115];r2301=r2300<<24>>24==-127;if(r2301){r8=254;break}r2302=(r2300&255)>135;if(r2302){r8=257;break}else{r72=r86;r73=r1115;r74=r88;r75=r1127;r76=r1129;continue}}r2303=HEAP32[r10>>2];r2304=r2303+1|0;r2305=_match(r86,r1115,r88,r1127,r5,r1129,r2304);r2306=(r2305|0)==-997;if(r2306){r2307=HEAP32[r71>>2];r2308=(r2307|0)==(r1115|0);if(!r2308){r24=r2305;r8=1207;break}}else{r2309=r2305;r2310=(r2309|0)==0;if(!r2310){r24=r2305;r8=1208;break}}r2311=HEAP8[r1115];r2312=r2311<<24>>24==-127;r2313=r87+3|0;if(r2312){r8=262;break}else{r72=r86;r73=r2313;r74=r88;r75=r1127;r76=r1129;continue}}else if(r8==982){r8=0;r2314=r1467<<24>>24==17;r2315=r2002;while(1){r2316=(r2315|0)==(r1461|0);if(r2316){r72=r1461;r73=r1466;r74=r88;r75=r89;r76=r90;continue L8}r2317=HEAP32[r10>>2];r2318=r2317+1|0;r2319=_match(r2315,r1466,r88,r89,r5,r90,r2318);r2320=(r2319|0)==0;if(!r2320){r24=r2319;r8=1290;break L8}r2321=r2315-1|0;r2322=r2321>>>0>r1461>>>0;r2323=r2314&r2322;if(!r2323){r2315=r2321;continue}r2324=HEAP8[r2321];r2325=r2324<<24>>24==10;if(!r2325){r2315=r2321;continue}r2326=r2315-2|0;r2327=HEAP8[r2326];r2328=r2327<<24>>24==13;r2329=r2328?r2326:r2321;r2315=r2329}}L781:while(1){r2330=(r91&255)>135;r2331=r91<<24>>24==-127;r2332=r2330|r2331;do{if(r2332){HEAP32[r28>>2]=2}else{r2333=HEAP32[r70>>2];r2334=(r2333|0)==0;if(!r2334){break}r2335=r591+1|0;r2336=HEAP8[r2335];r2337=r2336&255;r2338=r2337<<8;r2339=r591+2|0;r2340=HEAP8[r2339];r2341=r2340&255;r2342=r2338|r2341;r2343=r591+r2342|0;r2344=HEAP8[r2343];r2345=r2344<<24>>24==119;if(!r2345){break L781}}}while(0);r2346=HEAP32[r33>>2];r2347=HEAP32[r41>>2];r2348=HEAP8[r591];r2349=r2348&255;r2350=r2349+8720|0;r2351=HEAP8[r2350];r2352=r2351&255;r2353=r591+r2352|0;r2354=HEAP32[r10>>2];r2355=r2354+1|0;r2356=_match(r86,r2353,r88,r89,r5,r90,r2355);r2357=(r2356|0)==-992;do{if(r2357){r2358=r591+1|0;r2359=HEAP8[r2358];r2360=r2359&255;r2361=r2360<<8;r2362=r591+2|0;r2363=HEAP8[r2362];r2364=r2363&255;r2365=r2361|r2364;r2366=r591+r2365|0;r2367=HEAP32[r34>>2];r2368=r2367>>>0<r2366>>>0;if(!r2368){r24=r2356;r8=1163;break L8}r2369=HEAP8[r591];r2370=r2369<<24>>24==119;if(r2370){r2371=r2359;r2372=r2363;break}r2373=HEAP8[r2366];r2374=r2373<<24>>24==119;if(r2374){r2371=r2359;r2372=r2363}else{r8=74;break L8}}else{r2375=r2356;r2376=(r2375|0)==0;if(!r2376){r8=74;break L8}r2377=r591+1|0;r2378=HEAP8[r2377];r2379=r591+2|0;r2380=HEAP8[r2379];r2371=r2378;r2372=r2380}}while(0);r2381=r2371&255;r2382=r2381<<8;r2383=r2372&255;r2384=r2382|r2383;r2385=r591+r2384|0;HEAP32[r33>>2]=r2346;r2386=HEAP8[r2385];r2387=r2386<<24>>24==119;if(!r2387){r24=0;r8=1166;break L8}HEAP32[r41>>2]=r2347;r591=r2385}r2388=HEAP8[r591];r2389=r2388&255;r2390=r2389+8720|0;r2391=HEAP8[r2390];r2392=r2391&255;r2393=r591+r2392|0;r72=r86;r73=r2393;r74=r88;r75=r89;r76=r90}if(r8==428){r2394=HEAP32[r62>>2];r2395=(r2394|0)==0;do{if(!r2395){r2396=HEAP32[r46>>2];r2397=r86>>>0>r2396>>>0;if(!r2397){break}HEAP32[r63>>2]=1;r2398=(r2394|0)>1;if(r2398){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==435){r2399=HEAP32[r62>>2];r2400=(r2399|0)==0;do{if(!r2400){r2401=HEAP32[r46>>2];r2402=r86>>>0>r2401>>>0;if(!r2402){break}HEAP32[r63>>2]=1;r2403=(r2399|0)>1;if(r2403){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==537){while(1){r8=0;r2404=r224>>>0<r179>>>0;if(r2404){r24=0;r8=997;break}r2405=HEAP32[r10>>2];r2406=r2405+1|0;r2407=_match(r224,r150,r88,r89,r5,r90,r2406);r2408=(r2407|0)==0;if(!r2408){r24=r2407;r8=998;break}r2409=r224-1|0;r224=r2409;r8=537}if(r8==997){STACKTOP=r9;return r24}else if(r8==998){STACKTOP=r9;return r24}}else if(r8==541){r2410=HEAP32[r62>>2];r2411=(r2410|0)==0;do{if(!r2411){r2412=HEAP32[r46>>2];r2413=r86>>>0>r2412>>>0;if(!r2413){break}HEAP32[r63>>2]=1;r2414=(r2410|0)>1;if(r2414){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==548){r2415=HEAP32[r62>>2];r2416=(r2415|0)==0;do{if(!r2416){r2417=HEAP32[r46>>2];r2418=r86>>>0>r2417>>>0;if(!r2418){break}HEAP32[r63>>2]=1;r2419=(r2415|0)>1;if(r2419){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==11){r2420=r87+2|0;r2421=r5+176|0;HEAP32[r2421>>2]=r2420;HEAP32[r33>>2]=0;r2422=HEAP8[r87];r2423=r2422&255;r2424=r2423+8720|0;r2425=HEAP8[r2424];r2426=r2425&255;r2427=r87+1|0;r2428=HEAP8[r2427];r2429=r2428&255;r2430=r2426+r2429|0;r2431=r87+r2430|0;r2432=HEAP32[r10>>2];r2433=r2432+1|0;r2434=_match(r86,r2431,r88,r89,r5,r90,r2433);if((r2434|0)==1|(r2434|0)==-999){r8=12}else if((r2434|0)!=-993){r24=r2434;STACKTOP=r9;return r24}do{if(r8==12){r2435=HEAP32[r33>>2];r2436=(r2435|0)==0;if(r2436){HEAP32[r33>>2]=r2420;r24=r2434;STACKTOP=r9;return r24}else{r2437=(r2434|0)==-993;if(r2437){break}else{r24=r2434}STACKTOP=r9;return r24}}}while(0);r2438=HEAP32[r34>>2];r2439=_strcmp(r2420,r2438);r2440=(r2439|0)==0;if(!r2440){r24=r2434;STACKTOP=r9;return r24}HEAP32[r34>>2]=r86;r24=-994;STACKTOP=r9;return r24}else if(r8==421){r2441=HEAP32[r62>>2];r2442=(r2441|0)==0;do{if(!r2442){r2443=HEAP32[r46>>2];r2444=r86>>>0>r2443>>>0;if(!r2444){break}HEAP32[r63>>2]=1;r2445=(r2441|0)>1;if(r2445){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==462){r2446=(r1430|0)==-2;if(r2446){r2447=HEAP32[r55>>2];r2448=r2447}else{r2448=r86}r2449=HEAP32[r62>>2];r2450=(r2449|0)==0;do{if(!r2450){r2451=HEAP32[r55>>2];r2452=r2448>>>0<r2451>>>0;if(r2452){break}r2453=HEAP32[r46>>2];r2454=r2448>>>0>r2453>>>0;if(!r2454){break}HEAP32[r63>>2]=1;r2455=(r2449|0)>1;if(r2455){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==401){r2456=HEAP32[r62>>2];r2457=(r2456|0)==0;do{if(!r2457){r2458=HEAP32[r46>>2];r2459=r86>>>0>r2458>>>0;if(!r2459){break}HEAP32[r63>>2]=1;r2460=(r2456|0)>1;if(r2460){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==512){r2461=HEAP32[r62>>2];r2462=(r2461|0)==0;do{if(!r2462){r2463=HEAP32[r46>>2];r2464=r179>>>0>r2463>>>0;if(!r2464){break}HEAP32[r63>>2]=1;r2465=(r2461|0)>1;if(r2465){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==520){while(1){r8=0;r2466=HEAP32[r10>>2];r2467=r2466+1|0;r2468=_match(r201,r150,r88,r89,r5,r90,r2467);r2469=(r2468|0)==0;if(!r2469){r24=r2468;r8=1025;break}r2470=(r200|0)<(r154|0);if(!r2470){r24=0;r8=1026;break}r2471=HEAP32[r55>>2];r2472=r201>>>0<r2471>>>0;if(!r2472){r8=523;break}r2473=HEAP8[r201];r2474=r2473&255;r2475=r2474>>>3;r2476=r2475+1|0;r2477=r87+r2476|0;r2478=HEAP8[r2477];r2479=r2478&255;r2480=r2474&7;r2481=1<<r2480;r2482=r2479&r2481;r2483=(r2482|0)==0;if(r2483){r24=0;r8=1029;break}r2484=r201+1|0;r2485=r200+1|0;r200=r2485;r201=r2484;r8=520}if(r8==523){r2486=HEAP32[r62>>2];r2487=(r2486|0)==0;do{if(!r2487){r2488=HEAP32[r46>>2];r2489=r201>>>0>r2488>>>0;if(!r2489){break}HEAP32[r63>>2]=1;r2490=(r2486|0)>1;if(r2490){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==1025){STACKTOP=r9;return r24}else if(r8==1026){STACKTOP=r9;return r24}else if(r8==1029){STACKTOP=r9;return r24}}else if(r8==567){r2491=HEAP32[r62>>2];r2492=(r2491|0)==0;do{if(!r2492){r2493=HEAP32[r46>>2];r2494=r1723>>>0>r2493>>>0;if(!r2494){break}HEAP32[r63>>2]=1;r2495=(r2491|0)>1;if(r2495){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==575){while(1){r8=0;r2496=HEAP32[r10>>2];r2497=r2496+1|0;r2498=_match(r1738,r1686,r88,r89,r5,r90,r2497);r2499=(r2498|0)==0;if(!r2499){r24=r2498;r8=1035;break}r2500=(r1737|0)<(r283|0);if(!r2500){r24=0;r8=1036;break}r2501=HEAP32[r55>>2];r2502=r1738>>>0<r2501>>>0;if(!r2502){r8=578;break}r2503=HEAP8[r1738];r2504=r1687<<24>>24==r2503<<24>>24;r2505=r1721<<24>>24==r2503<<24>>24;r2506=r2504|r2505;if(!r2506){r24=0;r8=1039;break}r2507=r1738+1|0;r2508=r1737+1|0;r1737=r2508;r1738=r2507;r8=575}if(r8==578){r2509=HEAP32[r62>>2];r2510=(r2509|0)==0;do{if(!r2510){r2511=HEAP32[r46>>2];r2512=r1738>>>0>r2511>>>0;if(!r2512){break}HEAP32[r63>>2]=1;r2513=(r2509|0)>1;if(r2513){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==1035){STACKTOP=r9;return r24}else if(r8==1036){STACKTOP=r9;return r24}else if(r8==1039){STACKTOP=r9;return r24}}else if(r8==596){r2514=HEAP32[r62>>2];r2515=(r2514|0)==0;do{if(!r2515){r2516=HEAP32[r46>>2];r2517=r1690>>>0>r2516>>>0;if(!r2517){break}HEAP32[r63>>2]=1;r2518=(r2514|0)>1;if(r2518){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==474){r2519=(r1440|0)==-2;if(r2519){r2520=HEAP32[r55>>2];r2521=r2520}else{r2521=r1438}r2522=HEAP32[r62>>2];r2523=(r2522|0)==0;do{if(!r2523){r2524=HEAP32[r55>>2];r2525=r2521>>>0<r2524>>>0;if(r2525){break}r2526=HEAP32[r46>>2];r2527=r2521>>>0>r2526>>>0;if(!r2527){break}HEAP32[r63>>2]=1;r2528=(r2522|0)>1;if(r2528){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==408){r2529=HEAP32[r62>>2];r2530=(r2529|0)==0;do{if(!r2530){r2531=HEAP32[r46>>2];r2532=r86>>>0>r2531>>>0;if(!r2532){break}HEAP32[r63>>2]=1;r2533=(r2529|0)>1;if(r2533){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==442){r2534=HEAP32[r62>>2];r2535=(r2534|0)==0;do{if(!r2535){r2536=HEAP32[r46>>2];r2537=r86>>>0>r2536>>>0;if(!r2537){break}HEAP32[r63>>2]=1;r2538=(r2534|0)>1;if(r2538){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==394){r2539=HEAP32[r62>>2];r2540=(r2539|0)==0;do{if(!r2540){r2541=HEAP32[r46>>2];r2542=r86>>>0>r2541>>>0;if(!r2542){break}HEAP32[r63>>2]=1;r2543=(r2539|0)>1;if(r2543){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==715){r2544=HEAP32[r62>>2];r2545=(r2544|0)==0;do{if(!r2545){r2546=HEAP32[r46>>2];r2547=r1756>>>0>r2546>>>0;if(!r2547){break}HEAP32[r63>>2]=1;r2548=(r2544|0)>1;if(r2548){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==733){r2549=HEAP32[r62>>2];r2550=(r2549|0)==0;do{if(!r2550){r2551=HEAP32[r46>>2];r2552=r86>>>0>r2551>>>0;if(!r2552){break}HEAP32[r63>>2]=1;r2553=(r2549|0)>1;if(r2553){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==739){r2554=HEAP32[r62>>2];r2555=(r2554|0)==0;do{if(!r2555){r2556=HEAP32[r46>>2];r2557=r86>>>0>r2556>>>0;if(!r2557){break}HEAP32[r63>>2]=1;r2558=(r2554|0)>1;if(r2558){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==746){r2559=HEAP32[r62>>2];r2560=(r2559|0)==0;do{if(!r2560){r2561=HEAP32[r46>>2];r2562=r1802>>>0>r2561>>>0;if(!r2562){break}HEAP32[r63>>2]=1;r2563=(r2559|0)>1;if(r2563){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==757){r2564=HEAP32[r62>>2];r2565=(r2564|0)==0;do{if(!r2565){r2566=HEAP32[r46>>2];r2567=r1819>>>0>r2566>>>0;if(!r2567){break}HEAP32[r63>>2]=1;r2568=(r2564|0)>1;if(r2568){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==765){r2569=HEAP32[r62>>2];r2570=(r2569|0)==0;do{if(!r2570){r2571=HEAP32[r46>>2];r2572=r1828>>>0>r2571>>>0;if(!r2572){break}HEAP32[r63>>2]=1;r2573=(r2569|0)>1;if(r2573){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==773){r2574=HEAP32[r62>>2];r2575=(r2574|0)==0;do{if(!r2575){r2576=HEAP32[r46>>2];r2577=r1837>>>0>r2576>>>0;if(!r2577){break}HEAP32[r63>>2]=1;r2578=(r2574|0)>1;if(r2578){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==781){r2579=HEAP32[r62>>2];r2580=(r2579|0)==0;do{if(!r2580){r2581=HEAP32[r46>>2];r2582=r1846>>>0>r2581>>>0;if(!r2582){break}HEAP32[r63>>2]=1;r2583=(r2579|0)>1;if(r2583){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==789){r2584=HEAP32[r62>>2];r2585=(r2584|0)==0;do{if(!r2585){r2586=HEAP32[r46>>2];r2587=r1855>>>0>r2586>>>0;if(!r2587){break}HEAP32[r63>>2]=1;r2588=(r2584|0)>1;if(r2588){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==797){r2589=HEAP32[r62>>2];r2590=(r2589|0)==0;do{if(!r2590){r2591=HEAP32[r46>>2];r2592=r1869>>>0>r2591>>>0;if(!r2592){break}HEAP32[r63>>2]=1;r2593=(r2589|0)>1;if(r2593){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==805){r2594=HEAP32[r62>>2];r2595=(r2594|0)==0;do{if(!r2595){r2596=HEAP32[r46>>2];r2597=r1883>>>0>r2596>>>0;if(!r2597){break}HEAP32[r63>>2]=1;r2598=(r2594|0)>1;if(r2598){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==813){r2599=HEAP32[r62>>2];r2600=(r2599|0)==0;do{if(!r2600){r2601=HEAP32[r46>>2];r2602=r1897>>>0>r2601>>>0;if(!r2602){break}HEAP32[r63>>2]=1;r2603=(r2599|0)>1;if(r2603){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==821){r2604=HEAP32[r62>>2];r2605=(r2604|0)==0;do{if(!r2605){r2606=HEAP32[r46>>2];r2607=r1911>>>0>r2606>>>0;if(!r2607){break}HEAP32[r63>>2]=1;r2608=(r2604|0)>1;if(r2608){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==483){r2609=(r1406|0)==0;if(r2609){r2610=r1407;r2611=r1438;while(1){r2612=(r2610|0)<(r1408|0);if(!r2612){break}r2613=_match_ref(r254,r2611,r255,r5,r253);r2614=(r2613|0)<0;if(r2614){r8=498;break}r2615=r2611+r2613|0;r2616=r2610+1|0;r2610=r2616;r2611=r2615}do{if(r8==498){r2617=(r2613|0)==-2;if(!r2617){break}r2618=HEAP32[r62>>2];r2619=(r2618|0)==0;if(r2619){break}r2620=HEAP32[r55>>2];r2621=HEAP32[r46>>2];r2622=r2620>>>0>r2621>>>0;if(!r2622){break}HEAP32[r63>>2]=1;r2623=(r2618|0)>1;if(r2623){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r2624=-r255|0;r2625=r2611;while(1){r2626=r2625>>>0<r1438>>>0;if(r2626){r24=0;r8=1010;break}r2627=HEAP32[r10>>2];r2628=r2627+1|0;r2629=_match(r2625,r1405,r88,r89,r5,r90,r2628);r2630=(r2629|0)==0;if(!r2630){r24=r2629;r8=1011;break}r2631=r2625+r2624|0;r2625=r2631}if(r8==1010){STACKTOP=r9;return r24}else if(r8==1011){STACKTOP=r9;return r24}}else{r2632=r1407;r2633=r1438}while(1){r2634=HEAP32[r10>>2];r2635=r2634+1|0;r2636=_match(r2633,r1405,r88,r89,r5,r90,r2635);r2637=(r2636|0)==0;if(!r2637){r24=r2636;r8=1097;break}r2638=(r2632|0)<(r1408|0);if(!r2638){r24=0;r8=1098;break}r2639=_match_ref(r254,r2633,r255,r5,r253);r2640=(r2639|0)<0;if(r2640){r8=487;break}r2641=r2633+r2639|0;r2642=r2632+1|0;r2632=r2642;r2633=r2641}if(r8==487){r2643=(r2639|0)==-2;if(r2643){r2644=HEAP32[r55>>2];r2645=r2644}else{r2645=r2633}r2646=HEAP32[r62>>2];r2647=(r2646|0)==0;do{if(!r2647){r2648=HEAP32[r55>>2];r2649=r2645>>>0<r2648>>>0;if(r2649){break}r2650=HEAP32[r46>>2];r2651=r2645>>>0>r2650>>>0;if(!r2651){break}HEAP32[r63>>2]=1;r2652=(r2646|0)>1;if(r2652){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==1097){STACKTOP=r9;return r24}else if(r8==1098){STACKTOP=r9;return r24}}else if(r8==604){while(1){r8=0;r2653=HEAP32[r10>>2];r2654=r2653+1|0;r2655=_match(r1703,r1686,r88,r89,r5,r90,r2654);r2656=(r2655|0)==0;if(!r2656){r24=r2655;r8=1104;break}r2657=(r1702|0)<(r283|0);if(!r2657){r24=0;r8=1105;break}r2658=HEAP32[r55>>2];r2659=r1703>>>0<r2658>>>0;if(!r2659){r8=607;break}r2660=HEAP8[r1703];r2661=r1687<<24>>24==r2660<<24>>24;if(!r2661){r24=0;r8=1108;break}r2662=r1703+1|0;r2663=r1702+1|0;r1702=r2663;r1703=r2662;r8=604}if(r8==607){r2664=HEAP32[r62>>2];r2665=(r2664|0)==0;do{if(!r2665){r2666=HEAP32[r46>>2];r2667=r1703>>>0>r2666>>>0;if(!r2667){break}HEAP32[r63>>2]=1;r2668=(r2664|0)>1;if(r2668){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==1104){STACKTOP=r9;return r24}else if(r8==1105){STACKTOP=r9;return r24}else if(r8==1108){STACKTOP=r9;return r24}}else if(r8==624){r2669=HEAP32[r62>>2];r2670=(r2669|0)==0;do{if(!r2670){r2671=HEAP32[r46>>2];r2672=r86>>>0>r2671>>>0;if(!r2672){break}HEAP32[r63>>2]=1;r2673=(r2669|0)>1;if(r2673){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==645){r2674=HEAP32[r62>>2];r2675=(r2674|0)==0;do{if(!r2675){r2676=HEAP32[r46>>2];r2677=r1510>>>0>r2676>>>0;if(!r2677){break}HEAP32[r63>>2]=1;r2678=(r2674|0)>1;if(r2678){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==653){while(1){r8=0;r2679=HEAP32[r10>>2];r2680=r2679+1|0;r2681=_match(r1525,r1473,r88,r89,r5,r90,r2680);r2682=(r2681|0)==0;if(!r2682){r24=r2681;r8=1118;break}r2683=(r1524|0)<(r478|0);if(!r2683){r24=0;r8=1119;break}r2684=HEAP32[r55>>2];r2685=r1525>>>0<r2684>>>0;if(!r2685){r8=656;break}r2686=HEAP8[r1525];r2687=r1474<<24>>24==r2686<<24>>24;r2688=r1508<<24>>24==r2686<<24>>24;r2689=r2687|r2688;if(r2689){r24=0;r8=1122;break}r2690=r1525+1|0;r2691=r1524+1|0;r1524=r2691;r1525=r2690;r8=653}if(r8==656){r2692=HEAP32[r62>>2];r2693=(r2692|0)==0;do{if(!r2693){r2694=HEAP32[r46>>2];r2695=r1525>>>0>r2694>>>0;if(!r2695){break}HEAP32[r63>>2]=1;r2696=(r2692|0)>1;if(r2696){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==1118){STACKTOP=r9;return r24}else if(r8==1119){STACKTOP=r9;return r24}else if(r8==1122){STACKTOP=r9;return r24}}else if(r8==675){r2697=HEAP32[r62>>2];r2698=(r2697|0)==0;do{if(!r2698){r2699=HEAP32[r46>>2];r2700=r1477>>>0>r2699>>>0;if(!r2700){break}HEAP32[r63>>2]=1;r2701=(r2697|0)>1;if(r2701){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==683){while(1){r8=0;r2702=HEAP32[r10>>2];r2703=r2702+1|0;r2704=_match(r1490,r1473,r88,r89,r5,r90,r2703);r2705=(r2704|0)==0;if(!r2705){r24=r2704;r8=1128;break}r2706=(r1489|0)<(r478|0);if(!r2706){r24=0;r8=1129;break}r2707=HEAP32[r55>>2];r2708=r1490>>>0<r2707>>>0;if(!r2708){r8=686;break}r2709=HEAP8[r1490];r2710=r1474<<24>>24==r2709<<24>>24;if(r2710){r24=0;r8=1132;break}r2711=r1490+1|0;r2712=r1489+1|0;r1489=r2712;r1490=r2711;r8=683}if(r8==686){r2713=HEAP32[r62>>2];r2714=(r2713|0)==0;do{if(!r2714){r2715=HEAP32[r46>>2];r2716=r1490>>>0>r2715>>>0;if(!r2716){break}HEAP32[r63>>2]=1;r2717=(r2713|0)>1;if(r2717){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==1128){STACKTOP=r9;return r24}else if(r8==1129){STACKTOP=r9;return r24}else if(r8==1132){STACKTOP=r9;return r24}}else if(r8==17){r2718=r87+1|0;r2719=HEAP32[r10>>2];r2720=r2719+1|0;r2721=_match(r86,r2718,r88,r89,r5,r90,r2720);r2722=(r2721|0)==0;r2723=r2722?-996:r2721;r24=r2723;STACKTOP=r9;return r24}else if(r8==18){r2724=r87+1|0;r2725=HEAP32[r10>>2];r2726=r2725+1|0;r2727=_match(r86,r2724,r88,r89,r5,r90,r2726);r2728=(r2727|0)==0;r2729=r2728?-995:r2727;r24=r2729;STACKTOP=r9;return r24}else if(r8==19){r2730=r87+2|0;r2731=r5+176|0;HEAP32[r2731>>2]=r2730;HEAP32[r33>>2]=0;r2732=HEAP8[r87];r2733=r2732&255;r2734=r2733+8720|0;r2735=HEAP8[r2734];r2736=r2735&255;r2737=r87+1|0;r2738=HEAP8[r2737];r2739=r2738&255;r2740=r2736+r2739|0;r2741=r87+r2740|0;r2742=HEAP32[r10>>2];r2743=r2742+1|0;r2744=_match(r86,r2741,r88,r89,r5,r90,r2743);if((r2744|0)==1|(r2744|0)==-999){r8=20}else if((r2744|0)!=0){r24=r2744;STACKTOP=r9;return r24}do{if(r8==20){r2745=HEAP32[r33>>2];r2746=(r2745|0)==0;if(r2746){HEAP32[r33>>2]=r2730}r2747=(r2744|0)==0;if(r2747){break}else{r24=r2744}STACKTOP=r9;return r24}}while(0);r24=-995;STACKTOP=r9;return r24}else if(r8==24){r2748=r87+1|0;r2749=HEAP32[r10>>2];r2750=r2749+1|0;r2751=_match(r86,r2748,r88,r89,r5,r90,r2750);r2752=(r2751|0)==0;if(!r2752){r24=r2751;STACKTOP=r9;return r24}HEAP32[r34>>2]=r86;r24=-994;STACKTOP=r9;return r24}else if(r8==27){r2753=HEAP32[r10>>2];r2754=r2753+1|0;r2755=_match(r86,r532,r88,r89,r5,r90,r2754);r2756=(r2755|0)==0;if(!r2756){r24=r2755;STACKTOP=r9;return r24}r2757=r87+2|0;HEAP32[r34>>2]=r2757;r24=-993;STACKTOP=r9;return r24}else if(r8==29){r2758=r87+1|0;r2759=HEAP32[r10>>2];r2760=r2759+1|0;r2761=_match(r86,r2758,r88,r89,r5,r90,r2760);r2762=(r2761|0)==0;if(!r2762){r24=r2761;STACKTOP=r9;return r24}HEAP32[r34>>2]=r87;r24=-992;STACKTOP=r9;return r24}else if(r8==31){r2763=r87+2|0;r2764=r5+176|0;HEAP32[r2764>>2]=r2763;HEAP32[r33>>2]=0;r2765=HEAP8[r87];r2766=r2765&255;r2767=r2766+8720|0;r2768=HEAP8[r2767];r2769=r2768&255;r2770=r87+1|0;r2771=HEAP8[r2770];r2772=r2771&255;r2773=r2769+r2772|0;r2774=r87+r2773|0;r2775=HEAP32[r10>>2];r2776=r2775+1|0;r2777=_match(r86,r2774,r88,r89,r5,r90,r2776);if((r2777|0)==1|(r2777|0)==-999){r8=32}else if((r2777|0)!=0){r24=r2777;STACKTOP=r9;return r24}do{if(r8==32){r2778=HEAP32[r33>>2];r2779=(r2778|0)==0;if(r2779){HEAP32[r33>>2]=r2763}r2780=(r2777|0)==0;if(r2780){break}else{r24=r2777}STACKTOP=r9;return r24}}while(0);HEAP32[r34>>2]=r87;r24=-992;STACKTOP=r9;return r24}else if(r8==53){r2781=HEAP32[r39>>2];r2782=r2781+(r2291<<2)|0;r2783=HEAP32[r2782>>2];r2784=r2291|1;r2785=r2781+(r2784<<2)|0;r2786=HEAP32[r2785>>2];r2787=HEAP32[r40>>2];r2788=r2787-r2290|0;r2789=r2781+(r2788<<2)|0;r2790=HEAP32[r2789>>2];r2791=HEAP32[r41>>2];r2792=HEAP32[r33>>2];r2793=HEAP32[r42>>2];r2794=r86;r2795=r2793;r2796=r2794-r2795|0;HEAP32[r2789>>2]=r2796;r2797=(r91&255)>135;r2798=r87;L1204:while(1){if(r2797){HEAP32[r28>>2]=2}r2799=HEAP8[r2798];r2800=r2799&255;r2801=r2800+8720|0;r2802=HEAP8[r2801];r2803=r2802&255;r2804=r2798+r2803|0;r2805=HEAP32[r10>>2];r2806=r2805+1|0;r2807=_match(r86,r2804,r88,r89,r5,r90,r2806);do{if((r2807|0)==-992){r2808=r2798+1|0;r2809=HEAP8[r2808];r2810=r2809&255;r2811=r2810<<8;r2812=r2798+2|0;r2813=HEAP8[r2812];r2814=r2813&255;r2815=r2811|r2814;r2816=r2798+r2815|0;r2817=HEAP32[r34>>2];r2818=r2817>>>0<r2816>>>0;if(!r2818){r24=r2807;r8=1160;break L1204}r2819=HEAP8[r2798];r2820=r2819<<24>>24==119;if(r2820){r2821=0;r2822=r2808;r2823=r2812;break}r2824=HEAP8[r2816];r2825=r2824<<24>>24==119;if(r2825){r2821=0;r2822=r2808;r2823=r2812}else{r24=r2807;r8=1161;break L1204}}else if((r2807|0)==0){r2826=r2798+1|0;r2827=r2798+2|0;r2821=r2807;r2822=r2826;r2823=r2827}else if((r2807|0)==-997){r2828=-997;r8=62;break L1204}else{r24=r2807;r8=1159;break L1204}}while(0);HEAP32[r41>>2]=r2791;r2829=HEAP8[r2822];r2830=r2829&255;r2831=r2830<<8;r2832=HEAP8[r2823];r2833=r2832&255;r2834=r2831|r2833;r2835=r2798+r2834|0;HEAP32[r33>>2]=r2792;r2836=HEAP8[r2835];r2837=r2836<<24>>24==119;if(r2837){r2798=r2835}else{r2828=r2821;r8=62;break}}if(r8==62){r2838=HEAP32[r39>>2];r2839=r2838+(r2291<<2)|0;HEAP32[r2839>>2]=r2783;r2840=HEAP32[r39>>2];r2841=r2840+(r2784<<2)|0;HEAP32[r2841>>2]=r2786;r2842=HEAP32[r40>>2];r2843=r2842-r2290|0;r2844=HEAP32[r39>>2];r2845=r2844+(r2843<<2)|0;HEAP32[r2845>>2]=r2790;r24=r2828;STACKTOP=r9;return r24}else if(r8==1159){STACKTOP=r9;return r24}else if(r8==1160){STACKTOP=r9;return r24}else if(r8==1161){STACKTOP=r9;return r24}}else if(r8==74){r2846=(r2356|0)==-997;if(!r2846){r24=r2356;STACKTOP=r9;return r24}r2847=HEAP8[r591];r2848=r2847<<24>>24==-127;if(r2848){r2849=r591}else{r2850=r591;r2851=r2847;while(1){r2852=r2851<<24>>24==119;r2853=r2850+1|0;r2854=HEAP8[r2853];r2855=r2854&255;r2856=r2855<<8;r2857=r2850+2|0;r2858=HEAP8[r2857];r2859=r2858&255;r2860=r2856|r2859;if(!r2852){break}r2861=r2850+r2860|0;r2862=HEAP8[r2861];r2850=r2861;r2851=r2862}r2863=-r2860|0;r2864=r2850+r2863|0;r2849=r2864}r2865=HEAP32[r71>>2];r2866=(r2865|0)==(r2849|0);r2867=r2866?0:-997;r24=r2867;STACKTOP=r9;return r24}else if(r8==142){HEAP32[r28>>2]=2;r2868=HEAP32[r10>>2];r2869=r2868+1|0;r2870=_match(r86,r779,r88,r778,r5,r90,r2869);r24=r2870;STACKTOP=r9;return r24}else if(r8==147){r2871=(r86|0)!=(r88|0);r2872=r91<<24>>24==-97;r2873=r2871|r2872;do{if(!r2873){r2874=HEAP32[r43>>2];r2875=(r2874|0)==0;if(!r2875){break}r2876=r5+92|0;r2877=HEAP32[r2876>>2];r2878=(r2877|0)==0;if(!r2878){r24=0;STACKTOP=r9;return r24}r2879=r5+96|0;r2880=HEAP32[r2879>>2];r2881=(r2880|0)==0;if(r2881){break}r2882=HEAP32[r42>>2];r2883=HEAP32[r60>>2];r2884=r2882+r2883|0;r2885=(r88|0)==(r2884|0);if(r2885){r24=0}else{break}STACKTOP=r9;return r24}}while(0);HEAP32[r36>>2]=r86;HEAP32[r35>>2]=r89;HEAP32[r34>>2]=r88;r2886=r91<<24>>24==0;r2887=r2886?1:-999;r24=r2887;STACKTOP=r9;return r24}else if(r8==178){r24=r887;STACKTOP=r9;return r24}else if(r8==207){r2888=HEAP32[r53>>2];r2889=(r2888|0)==(r52|0);if(r2889){r24=r1008;STACKTOP=r9;return r24}r2890=r2888;_free(r2890);r24=r1008;STACKTOP=r9;return r24}else if(r8==210){HEAP32[r43>>2]=r1016;r2891=HEAP32[r53>>2];r2892=(r2891|0)==(r52|0);if(r2892){r24=0;STACKTOP=r9;return r24}r2893=r2891;_free(r2893);r24=0;STACKTOP=r9;return r24}else if(r8==231){HEAP32[r36>>2]=r86;HEAP32[r35>>2]=r89;HEAP32[r34>>2]=r88;r24=1;STACKTOP=r9;return r24}else if(r8==238){HEAP32[r36>>2]=r86;HEAP32[r34>>2]=r88;r24=1;STACKTOP=r9;return r24}else if(r8==248){r2894=HEAP32[r10>>2];r2895=r2894+1|0;r2896=_match(r86,r1208,r88,r1127,r5,r1129,r2895);r2897=(r2896|0)==0;if(!r2897){r24=r2896;STACKTOP=r9;return r24}HEAP32[r71>>2]=r1115;r24=-997;STACKTOP=r9;return r24}else if(r8==251){HEAP32[r34>>2]=r88;HEAP32[r36>>2]=r86;HEAP32[r35>>2]=r1127;r24=-998;STACKTOP=r9;return r24}else if(r8==254){r2898=HEAP32[r10>>2];r2899=r2898+1|0;r2900=_match(r86,r1115,r88,r1127,r5,r1129,r2899);r2901=(r2900|0)==0;if(!r2901){r24=r2900;STACKTOP=r9;return r24}HEAP32[r71>>2]=r1115;r24=-997;STACKTOP=r9;return r24}else if(r8==257){r2902=HEAP32[r10>>2];r2903=r2902+1|0;r2904=_match(r86,r1115,r88,r1127,r5,r1129,r2903);r24=r2904;STACKTOP=r9;return r24}else if(r8==262){r2905=HEAP32[r10>>2];r2906=r2905+1|0;r2907=_match(r86,r2313,r88,r1127,r5,r1129,r2906);r2908=(r2907|0)==0;if(!r2908){r24=r2907;STACKTOP=r9;return r24}HEAP32[r71>>2]=r1115;r24=-997;STACKTOP=r9;return r24}else if(r8==289){r2909=HEAP32[r62>>2];r2910=(r2909|0)==0;do{if(!r2910){r2911=r86+1|0;r2912=HEAP32[r55>>2];r2913=r2911>>>0<r2912>>>0;if(r2913){break}r2914=HEAP32[r56>>2];r2915=(r2914|0)==0;if(!r2915){break}r2916=HEAP32[r57>>2];r2917=(r2916|0)==2;if(!r2917){break}r2918=HEAP8[r86];r2919=HEAP8[r58];r2920=r2918<<24>>24==r2919<<24>>24;if(!r2920){break}HEAP32[r63>>2]=1;r2921=(r2909|0)>1;if(r2921){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==317){r2922=HEAP32[r62>>2];r2923=(r2922|0)==0;do{if(!r2923){r2924=r86+1|0;r2925=HEAP32[r55>>2];r2926=r2924>>>0<r2925>>>0;if(r2926){break}r2927=HEAP32[r56>>2];r2928=(r2927|0)==0;if(!r2928){break}r2929=HEAP32[r57>>2];r2930=(r2929|0)==2;if(!r2930){break}r2931=HEAP8[r86];r2932=HEAP8[r58];r2933=r2931<<24>>24==r2932<<24>>24;if(!r2933){break}HEAP32[r63>>2]=1;r2934=(r2922|0)>1;if(r2934){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==354){r2935=HEAP32[r62>>2];r2936=(r2935|0)==0;do{if(!r2936){r2937=HEAP32[r46>>2];r2938=r86>>>0>r2937>>>0;if(!r2938){break}HEAP32[r63>>2]=1;r2939=(r2935|0)>1;if(r2939){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==360){r2940=HEAP32[r62>>2];r2941=(r2940|0)==0;do{if(!r2941){r2942=HEAP32[r46>>2];r2943=r86>>>0>r2942>>>0;if(!r2943){break}HEAP32[r63>>2]=1;r2944=(r2940|0)>1;if(r2944){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==366){r2945=HEAP32[r62>>2];r2946=(r2945|0)==0;do{if(!r2946){r2947=HEAP32[r46>>2];r2948=r86>>>0>r2947>>>0;if(!r2948){break}HEAP32[r63>>2]=1;r2949=(r2945|0)>1;if(r2949){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==373){r2950=HEAP32[r62>>2];r2951=(r2950|0)==0;do{if(!r2951){r2952=HEAP32[r46>>2];r2953=r86>>>0>r2952>>>0;if(!r2953){break}HEAP32[r63>>2]=1;r2954=(r2950|0)>1;if(r2954){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==380){r2955=HEAP32[r62>>2];r2956=(r2955|0)==0;do{if(!r2956){r2957=HEAP32[r46>>2];r2958=r86>>>0>r2957>>>0;if(!r2958){break}HEAP32[r63>>2]=1;r2959=(r2955|0)>1;if(r2959){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==387){r2960=HEAP32[r62>>2];r2961=(r2960|0)==0;do{if(!r2961){r2962=HEAP32[r46>>2];r2963=r86>>>0>r2962>>>0;if(!r2963){break}HEAP32[r63>>2]=1;r2964=(r2960|0)>1;if(r2964){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==829){r2965=HEAP32[r62>>2];r2966=(r2965|0)==0;do{if(!r2966){r2967=HEAP32[r46>>2];r2968=r1925>>>0>r2967>>>0;if(!r2968){break}HEAP32[r63>>2]=1;r2969=(r2965|0)>1;if(r2969){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==837){r2970=r1467<<24>>24==12;r2971=r1463;r2972=r1461;L1350:while(1){r2973=HEAP32[r10>>2];r2974=r2973+1|0;r2975=_match(r2972,r1466,r88,r89,r5,r90,r2974);r2976=(r2975|0)==0;if(!r2976){r24=r2975;r8=1254;break}r2977=(r2971|0)<(r1462|0);if(!r2977){r24=0;r8=1255;break}r2978=HEAP32[r55>>2];r2979=r2972>>>0<r2978>>>0;if(!r2979){r8=841;break}L1355:do{if(r2970){r2980=HEAP32[r56>>2];r2981=(r2980|0)==0;do{if(r2981){r2982=HEAP32[r57>>2];r2983=-r2982|0;r2984=r2978+r2983|0;r2985=r2972>>>0>r2984>>>0;if(r2985){break}r2986=HEAP8[r2972];r2987=HEAP8[r58];r2988=r2986<<24>>24==r2987<<24>>24;if(!r2988){break}r2989=(r2982|0)==1;if(r2989){r24=0;r8=1259;break L1350}r2990=r2972+1|0;r2991=HEAP8[r2990];r2992=HEAP8[r59];r2993=r2991<<24>>24==r2992<<24>>24;if(r2993){r24=0;r8=1260;break L1350}}else{r2994=__pcre_is_newline(r2972,r2980,r2978,r57,0);r2995=(r2994|0)==0;if(!r2995){r24=0;r8=1258;break L1350}}}while(0);r2996=r2972+1|0;r2997=HEAP8[r2972];r2998=r2996;r2999=r2997;r8=854}else{r3000=r1468;r3001=r2972+1|0;r3002=HEAP8[r2972];r3003=r3002&255;switch(r3000|0){case 12:{r2998=r3001;r2999=r3002;r8=854;break L1355;break};case 17:{switch(r3003|0){case 13:{break};case 11:case 12:case 133:{r3004=HEAP32[r66>>2];r3005=(r3004|0)==0;if(r3005){r3006=r3001;break L1355}else{r24=0;r8=1264;break L1350}break};case 10:{r3006=r3001;break L1355;break};default:{r24=0;r8=1263;break L1350}}r3007=HEAP32[r55>>2];r3008=r3001>>>0<r3007>>>0;if(!r3008){r3006=r3001;break L1355}r3009=HEAP8[r3001];r3010=r3009<<24>>24==10;r3011=r2972+2|0;r3012=r3010?r3011:r3001;r3006=r3012;break L1355;break};case 18:{if((r3003|0)==9|(r3003|0)==32|(r3003|0)==160){r24=0;r8=1265;break L1350}else{r3006=r3001;break L1355}break};case 19:{if((r3003|0)==9|(r3003|0)==32|(r3003|0)==160){r3006=r3001;break L1355}else{r24=0;r8=1266;break L1350}break};case 20:{switch(r3003|0){case 10:case 11:case 12:case 13:case 133:{r24=0;r8=1267;break L1350;break};default:{r3006=r3001;break L1355}}break};case 21:{switch(r3003|0){case 10:case 11:case 12:case 13:case 133:{r3006=r3001;break L1355;break};default:{r24=0;r8=1268;break L1350}}break};case 6:{r3013=HEAP32[r65>>2];r3014=r3013+r3003|0;r3015=HEAP8[r3014];r3016=r3015&4;r3017=r3016<<24>>24==0;if(r3017){r3006=r3001;break L1355}else{r24=0;r8=1269;break L1350}break};case 7:{r3018=HEAP32[r65>>2];r3019=r3018+r3003|0;r3020=HEAP8[r3019];r3021=r3020&4;r3022=r3021<<24>>24==0;if(r3022){r24=0;r8=1270;break L1350}else{r3006=r3001;break L1355}break};case 8:{r3023=HEAP32[r65>>2];r3024=r3023+r3003|0;r3025=HEAP8[r3024];r3026=r3025&1;r3027=r3026<<24>>24==0;if(r3027){r3006=r3001;break L1355}else{r24=0;r8=1271;break L1350}break};case 9:{r3028=HEAP32[r65>>2];r3029=r3028+r3003|0;r3030=HEAP8[r3029];r3031=r3030&1;r3032=r3031<<24>>24==0;if(r3032){r24=0;r8=1272;break L1350}else{r3006=r3001;break L1355}break};case 10:{r3033=HEAP32[r65>>2];r3034=r3033+r3003|0;r3035=HEAP8[r3034];r3036=r3035&16;r3037=r3036<<24>>24==0;if(r3037){r3006=r3001;break L1355}else{r24=0;r8=1273;break L1350}break};case 11:{r3038=HEAP32[r65>>2];r3039=r3038+r3003|0;r3040=HEAP8[r3039];r3041=r3040&16;r3042=r3041<<24>>24==0;if(r3042){r24=0;r8=1274;break L1350}else{r3006=r3001;break L1355}break};case 13:case 14:{r3006=r3001;break L1355;break};default:{r24=-14;r8=1261;break L1350}}}}while(0);do{if(r8==854){r8=0;r3043=HEAP32[r62>>2];r3044=(r3043|0)==0;if(r3044){r3006=r2998;break}r3045=HEAP32[r55>>2];r3046=r2998>>>0<r3045>>>0;if(r3046){r3006=r2998;break}r3047=HEAP32[r56>>2];r3048=(r3047|0)==0;if(!r3048){r3006=r2998;break}r3049=HEAP32[r57>>2];r3050=(r3049|0)==2;if(!r3050){r3006=r2998;break}r3051=HEAP8[r58];r3052=r2999<<24>>24==r3051<<24>>24;if(!r3052){r3006=r2998;break}HEAP32[r63>>2]=1;r3053=(r3043|0)>1;if(r3053){r24=-12;r8=1262;break L1350}else{r3006=r2998}}}while(0);r3054=r2971+1|0;r2971=r3054;r2972=r3006}if(r8==841){r3055=HEAP32[r62>>2];r3056=(r3055|0)==0;do{if(!r3056){r3057=HEAP32[r46>>2];r3058=r2972>>>0>r3057>>>0;if(!r3058){break}HEAP32[r63>>2]=1;r3059=(r3055|0)>1;if(r3059){r24=-12}else{break}STACKTOP=r9;return r24}}while(0);r24=0;STACKTOP=r9;return r24}else if(r8==1254){STACKTOP=r9;return r24}else if(r8==1255){STACKTOP=r9;return r24}else if(r8==1258){STACKTOP=r9;return r24}else if(r8==1259){STACKTOP=r9;return r24}else if(r8==1260){STACKTOP=r9;return r24}else if(r8==1261){STACKTOP=r9;return r24}else if(r8==1262){STACKTOP=r9;return r24}else if(r8==1263){STACKTOP=r9;return r24}else if(r8==1264){STACKTOP=r9;return r24}else if(r8==1265){STACKTOP=r9;return r24}else if(r8==1266){STACKTOP=r9;return r24}else if(r8==1267){STACKTOP=r9;return r24}else if(r8==1268){STACKTOP=r9;return r24}else if(r8==1269){STACKTOP=r9;return r24}else if(r8==1270){STACKTOP=r9;return r24}else if(r8==1271){STACKTOP=r9;return r24}else if(r8==1272){STACKTOP=r9;return r24}else if(r8==1273){STACKTOP=r9;return r24}else if(r8==1274){STACKTOP=r9;return r24}}else if(r8==988){r24=-5;STACKTOP=r9;return r24}else if(r8==992){STACKTOP=r9;return r24}else if(r8==995){STACKTOP=r9;return r24}else if(r8==996){STACKTOP=r9;return r24}else if(r8==1001){STACKTOP=r9;return r24}else if(r8==1005){STACKTOP=r9;return r24}else if(r8==1008){STACKTOP=r9;return r24}else if(r8==1012){STACKTOP=r9;return r24}else if(r8==1013){STACKTOP=r9;return r24}else if(r8==1016){STACKTOP=r9;return r24}else if(r8==1017){STACKTOP=r9;return r24}else if(r8==1018){STACKTOP=r9;return r24}else if(r8==1021){STACKTOP=r9;return r24}else if(r8==1024){STACKTOP=r9;return r24}else if(r8==1031){STACKTOP=r9;return r24}else if(r8==1034){STACKTOP=r9;return r24}else if(r8==1040){STACKTOP=r9;return r24}else if(r8==1041){STACKTOP=r9;return r24}else if(r8==1046){STACKTOP=r9;return r24}else if(r8==1049){STACKTOP=r9;return r24}else if(r8==1050){STACKTOP=r9;return r24}else if(r8==1053){STACKTOP=r9;return r24}else if(r8==1056){STACKTOP=r9;return r24}else if(r8==1057){STACKTOP=r9;return r24}else if(r8==1058){STACKTOP=r9;return r24}else if(r8==1059){STACKTOP=r9;return r24}else if(r8==1066){STACKTOP=r9;return r24}else if(r8==1067){STACKTOP=r9;return r24}else if(r8==1070){STACKTOP=r9;return r24}else if(r8==1073){STACKTOP=r9;return r24}else if(r8==1076){STACKTOP=r9;return r24}else if(r8==1079){STACKTOP=r9;return r24}else if(r8==1082){STACKTOP=r9;return r24}else if(r8==1085){STACKTOP=r9;return r24}else if(r8==1088){STACKTOP=r9;return r24}else if(r8==1091){STACKTOP=r9;return r24}else if(r8==1094){STACKTOP=r9;return r24}else if(r8==1103){STACKTOP=r9;return r24}else if(r8==1109){STACKTOP=r9;return r24}else if(r8==1110){STACKTOP=r9;return r24}else if(r8==1113){STACKTOP=r9;return r24}else if(r8==1114){STACKTOP=r9;return r24}else if(r8==1117){STACKTOP=r9;return r24}else if(r8==1123){STACKTOP=r9;return r24}else if(r8==1124){STACKTOP=r9;return r24}else if(r8==1127){STACKTOP=r9;return r24}else if(r8==1133){STACKTOP=r9;return r24}else if(r8==1134){STACKTOP=r9;return r24}else if(r8==1153){STACKTOP=r9;return r24}else if(r8==1154){STACKTOP=r9;return r24}else if(r8==1155){STACKTOP=r9;return r24}else if(r8==1156){STACKTOP=r9;return r24}else if(r8==1157){STACKTOP=r9;return r24}else if(r8==1158){STACKTOP=r9;return r24}else if(r8==1163){STACKTOP=r9;return r24}else if(r8==1166){STACKTOP=r9;return r24}else if(r8==1167){STACKTOP=r9;return r24}else if(r8==1168){STACKTOP=r9;return r24}else if(r8==1169){STACKTOP=r9;return r24}else if(r8==1170){STACKTOP=r9;return r24}else if(r8==1171){STACKTOP=r9;return r24}else if(r8==1172){STACKTOP=r9;return r24}else if(r8==1173){STACKTOP=r9;return r24}else if(r8==1174){STACKTOP=r9;return r24}else if(r8==1175){STACKTOP=r9;return r24}else if(r8==1180){STACKTOP=r9;return r24}else if(r8==1181){STACKTOP=r9;return r24}else if(r8==1182){STACKTOP=r9;return r24}else if(r8==1183){STACKTOP=r9;return r24}else if(r8==1184){STACKTOP=r9;return r24}else if(r8==1185){STACKTOP=r9;return r24}else if(r8==1187){STACKTOP=r9;return r24}else if(r8==1188){STACKTOP=r9;return r24}else if(r8==1189){STACKTOP=r9;return r24}else if(r8==1190){STACKTOP=r9;return r24}else if(r8==1191){STACKTOP=r9;return r24}else if(r8==1196){STACKTOP=r9;return r24}else if(r8==1197){STACKTOP=r9;return r24}else if(r8==1203){STACKTOP=r9;return r24}else if(r8==1207){STACKTOP=r9;return r24}else if(r8==1208){STACKTOP=r9;return r24}else if(r8==1211){STACKTOP=r9;return r24}else if(r8==1212){STACKTOP=r9;return r24}else if(r8==1213){STACKTOP=r9;return r24}else if(r8==1214){STACKTOP=r9;return r24}else if(r8==1215){STACKTOP=r9;return r24}else if(r8==1216){STACKTOP=r9;return r24}else if(r8==1217){STACKTOP=r9;return r24}else if(r8==1218){STACKTOP=r9;return r24}else if(r8==1219){STACKTOP=r9;return r24}else if(r8==1220){STACKTOP=r9;return r24}else if(r8==1223){STACKTOP=r9;return r24}else if(r8==1224){STACKTOP=r9;return r24}else if(r8==1225){STACKTOP=r9;return r24}else if(r8==1226){STACKTOP=r9;return r24}else if(r8==1227){STACKTOP=r9;return r24}else if(r8==1230){STACKTOP=r9;return r24}else if(r8==1231){STACKTOP=r9;return r24}else if(r8==1232){STACKTOP=r9;return r24}else if(r8==1233){STACKTOP=r9;return r24}else if(r8==1234){STACKTOP=r9;return r24}else if(r8==1235){STACKTOP=r9;return r24}else if(r8==1236){STACKTOP=r9;return r24}else if(r8==1237){STACKTOP=r9;return r24}else if(r8==1244){STACKTOP=r9;return r24}else if(r8==1247){STACKTOP=r9;return r24}else if(r8==1250){STACKTOP=r9;return r24}else if(r8==1253){STACKTOP=r9;return r24}else if(r8==1275){STACKTOP=r9;return r24}else if(r8==1276){STACKTOP=r9;return r24}else if(r8==1277){STACKTOP=r9;return r24}else if(r8==1278){STACKTOP=r9;return r24}else if(r8==1279){STACKTOP=r9;return r24}else if(r8==1280){STACKTOP=r9;return r24}else if(r8==1281){STACKTOP=r9;return r24}else if(r8==1282){STACKTOP=r9;return r24}else if(r8==1283){STACKTOP=r9;return r24}else if(r8==1284){STACKTOP=r9;return r24}else if(r8==1285){STACKTOP=r9;return r24}else if(r8==1286){STACKTOP=r9;return r24}else if(r8==1287){STACKTOP=r9;return r24}else if(r8==1288){STACKTOP=r9;return r24}else if(r8==1289){STACKTOP=r9;return r24}else if(r8==1290){STACKTOP=r9;return r24}}function _match_ref(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14;r6=0;r7=HEAP32[r4+116>>2]+HEAP32[HEAP32[r4+12>>2]+(r1<<2)>>2]|0;if((r3|0)<0){r8=-1;return r8}r1=r4+120|0;L4:do{if((r5|0)==0){r9=r7;r10=r2;r11=r3;while(1){if((r11|0)<=0){r12=r10;break L4}if(r10>>>0>=HEAP32[r1>>2]>>>0){r8=-2;r6=13;break}if((HEAP8[r9]|0)==(HEAP8[r10]|0)){r9=r9+1|0;r10=r10+1|0;r11=r11-1|0}else{r8=-1;r6=15;break}}if(r6==15){return r8}else if(r6==13){return r8}}else{r11=r4+56|0;r10=r7;r9=r2;r13=r3;while(1){if((r13|0)<=0){r12=r9;break L4}if(r9>>>0>=HEAP32[r1>>2]>>>0){r8=-2;r6=18;break}r14=HEAP32[r11>>2];if((HEAP8[r14+HEAPU8[r10]|0]|0)!=(HEAP8[r14+HEAPU8[r9]|0]|0)){r8=-1;r6=14;break}r10=r10+1|0;r9=r9+1|0;r13=r13-1|0}if(r6==18){return r8}else if(r6==14){return r8}}}while(0);r8=r12-r2|0;return r8}function _pcre_fullinfo(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159;r5=0;r6=r1;r7=(r1|0)==0;r8=(r4|0)==0;r9=r7|r8;if(r9){r10=-2;return r10}r11=(r2|0)==0;do{if(r11){r12=0}else{r13=r2|0;r14=HEAP32[r13>>2];r15=r14&1;r16=(r15|0)==0;if(r16){r12=0;break}r17=r2+4|0;r18=HEAP32[r17>>2];r19=r18;r12=r19}}while(0);r20=r1;r21=HEAP32[r20>>2];r22=(r21|0)==1346589253;if(!r22){r23=(r21|0)==1163019088;r24=r23?-29:-4;r10=r24;return r10}r25=r6+12|0;r26=HEAP32[r25>>2];r27=r26&1;r28=(r27|0)==0;if(r28){r10=-28;return r10}switch(r3|0){case 12:{r29=r26>>>9;r30=r29&1;r31=r30^1;r32=r4;HEAP32[r32>>2]=r31;r10=0;return r10;break};case 0:{r33=r6+8|0;r34=HEAP32[r33>>2];r35=r34&671054463;r36=r4;HEAP32[r36>>2]=r35;r10=0;return r10;break};case 1:{r37=r6+4|0;r38=HEAP32[r37>>2];r39=r4;HEAP32[r39>>2]=r38;r10=0;return r10;break};case 10:{r40=(r12|0)==0;if(r40){r41=0}else{r42=r12|0;r43=HEAP32[r42>>2];r41=r43}r44=r4;HEAP32[r44>>2]=r41;r10=0;return r10;break};case 18:{r45=r6+28|0;r46=HEAP16[r45>>1];r47=r46&65535;r48=r4;HEAP32[r48>>2]=r47;r10=0;return r10;break};case 23:{r49=r26&8192;r50=(r49|0)==0;if(r50){r10=-33;return r10}r51=r6+16|0;r52=HEAP32[r51>>2];r53=r4;HEAP32[r53>>2]=r52;r10=0;return r10;break};case 25:{r54=r26>>>15;r55=r54&1;r56=r4;HEAP32[r56>>2]=r55;r10=0;return r10;break};case 24:{r57=r26&16384;r58=(r57|0)==0;if(r58){r10=-33;return r10}r59=r6+20|0;r60=HEAP32[r59>>2];r61=r4;HEAP32[r61>>2]=r60;r10=0;return r10;break};case 13:{r62=r26>>>10;r63=r62&1;r64=r4;HEAP32[r64>>2]=r63;r10=0;return r10;break};case 14:{r65=r26>>>11;r66=r65&1;r67=r4;HEAP32[r67>>2]=r66;r10=0;return r10;break};case 15:{r68=(r12|0)==0;do{if(r68){r69=-1}else{r70=r12+4|0;r71=HEAP32[r70>>2];r72=r71&2;r73=(r72|0)==0;if(r73){r69=-1;break}r74=r12+40|0;r75=HEAP32[r74>>2];r69=r75}}while(0);r76=r4;HEAP32[r76>>2]=r69;r10=0;return r10;break};case 9:{r77=r1;r78=r6+34|0;r79=HEAP16[r78>>1];r80=r79&65535;r81=r77+r80|0;r82=r4;HEAP32[r82>>2]=r81;r10=0;return r10;break};case 21:{r83=r26&64;r84=(r83|0)==0;if(r84){r85=0}else{r86=r6+26|0;r87=HEAP16[r86>>1];r88=r87&65535;r85=r88}r89=r4;HEAP32[r89>>2]=r85;r10=0;return r10;break};case 5:{r90=(r12|0)==0;do{if(r90){r91=0}else{r92=r12+4|0;r93=HEAP32[r92>>2];r94=r93&1;r95=(r94|0)==0;if(r95){r91=0;break}r96=r2+4|0;r97=HEAP32[r96>>2];r98=r97+8|0;r91=r98}}while(0);r99=r4;HEAP32[r99>>2]=r91;r10=0;return r10;break};case 8:{r100=r6+38|0;r101=HEAP16[r100>>1];r102=r101&65535;r103=r4;HEAP32[r103>>2]=r102;r10=0;return r10;break};case 19:{r104=r26&16;r105=(r104|0)==0;if(r105){r106=0}else{r107=r6+24|0;r108=HEAP16[r107>>1];r109=r108&65535;r106=r109}r110=r4;HEAP32[r110>>2]=r106;r10=0;return r10;break};case 4:{r111=r26&16;r112=(r111|0)==0;if(r112){r113=r26>>>8;r114=r113|-2;r115=r114}else{r116=r6+24|0;r117=HEAP16[r116>>1];r118=r117&65535;r115=r118}r119=r4;HEAP32[r119>>2]=r115;r10=0;return r10;break};case 3:{r120=r6+32|0;r121=HEAP16[r120>>1];r122=r121&65535;r123=r4;HEAP32[r123>>2]=r122;r10=0;return r10;break};case 11:{r124=r4;HEAP32[r124>>2]=7632;r10=0;return r10;break};case 7:{r125=r6+36|0;r126=HEAP16[r125>>1];r127=r126&65535;r128=r4;HEAP32[r128>>2]=r127;r10=0;return r10;break};case 17:{r129=r4;HEAP32[r129>>2]=0;r10=0;return r10;break};case 20:{r130=r26&16;r131=(r130|0)==0;if(r131){r132=r26>>>7;r133=r132&2;r134=r133}else{r134=1}r135=r4;HEAP32[r135>>2]=r134;r10=0;return r10;break};case 16:{do{if(r11){r136=0}else{r137=r2|0;r138=HEAP32[r137>>2];r139=r138&64;r140=(r139|0)==0;if(r140){r136=0;break}r141=r2+28|0;r142=HEAP32[r141>>2];r143=(r142|0)!=0;r144=r143&1;r136=r144}}while(0);r145=r4;HEAP32[r145>>2]=r136;r10=0;return r10;break};case 6:{r146=r26&64;r147=(r146|0)==0;if(r147){r148=-1}else{r149=r6+26|0;r150=HEAP16[r149>>1];r151=r150&65535;r148=r151}r152=r4;HEAP32[r152>>2]=r148;r10=0;return r10;break};case 22:{r153=r26>>>6;r154=r153&1;r155=r4;HEAP32[r155>>2]=r154;r10=0;return r10;break};case 2:{r156=r6+30|0;r157=HEAP16[r156>>1];r158=r157&65535;r159=r4;HEAP32[r159>>2]=r158;r10=0;return r10;break};default:{r10=-3;return r10}}}function __pcre_is_newline(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r6=0;r7=HEAP8[r1];r8=r7&255;r9=(r2|0)==2;L1:do{if(r9){if((r8|0)==10){HEAP32[r4>>2]=1;r10=1;break}else if((r8|0)!=13){r10=0;break}r11=r3-1|0;r12=r11>>>0>r1>>>0;if(r12){r13=r1+1|0;r14=HEAP8[r13];r15=r14<<24>>24==10;r16=r15?2:1;r17=r16}else{r17=1}HEAP32[r4>>2]=r17;r10=1}else{switch(r8|0){case 133:{r18=(r5|0)!=0;r19=r18?2:1;HEAP32[r4>>2]=r19;r10=1;break L1;break};case 10:case 11:case 12:{HEAP32[r4>>2]=1;r10=1;break L1;break};case 13:{r20=r3-1|0;r21=r20>>>0>r1>>>0;if(r21){r22=r1+1|0;r23=HEAP8[r22];r24=r23<<24>>24==10;r25=r24?2:1;r26=r25}else{r26=1}HEAP32[r4>>2]=r26;r10=1;break L1;break};default:{r10=0;break L1}}}}while(0);return r10}function __pcre_was_newline(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r6=0;r7=r1-1|0;r8=HEAP8[r7];r9=r8&255;r10=(r2|0)==2;L1:do{if(r10){if((r9|0)==13){HEAP32[r4>>2]=1;r11=1;break}else if((r9|0)!=10){r11=0;break}r12=r7>>>0>r3>>>0;if(r12){r13=r1-2|0;r14=HEAP8[r13];r15=r14<<24>>24==13;r16=r15?2:1;r17=r16}else{r17=1}HEAP32[r4>>2]=r17;r11=1}else{switch(r9|0){case 10:{r18=r7>>>0>r3>>>0;if(r18){r19=r1-2|0;r20=HEAP8[r19];r21=r20<<24>>24==13;r22=r21?2:1;r23=r22}else{r23=1}HEAP32[r4>>2]=r23;r11=1;break L1;break};case 133:{r24=(r5|0)!=0;r25=r24?2:1;HEAP32[r4>>2]=r25;r11=1;break L1;break};case 11:case 12:case 13:{HEAP32[r4>>2]=1;r11=1;break L1;break};default:{r11=0;break L1}}}}while(0);return r11}function __ZN7pcrecpp2RE7CompileENS0_6AnchorE(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=r4+8;r7=r4+16;r8=HEAP32[r1+20>>2];do{if((r2|0)==2){r9=r7;HEAP8[r9]=6;r10=r7+1|0;HEAP8[r10]=HEAP8[5792];HEAP8[r10+1|0]=HEAP8[5793];HEAP8[r10+2|0]=HEAP8[5794];HEAP8[r7+4|0]=0;r11=HEAP8[r1];if((r11&1)==0){r12=r1+1|0}else{r12=HEAP32[r1+8>>2]}r13=r11&255;if((r13&1|0)==0){r14=r13>>>1}else{r14=HEAP32[r1+4>>2]}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKcj(r7,r12,r14);__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKcj(r7,6032,3);if((HEAP8[r9]&1)==0){r15=r10}else{r15=HEAP32[r7+8>>2]}r10=_pcre_compile(r15,r8,r5,r6,0);if((HEAP8[r9]&1)==0){r16=r10;break}r9=HEAP32[r7+8>>2];if((r9|0)==0){r16=r10;break}_free(r9);r16=r10}else{if((HEAP8[r1]&1)==0){r17=r1+1|0}else{r17=HEAP32[r1+8>>2]}r16=_pcre_compile(r17,r8,r5,r6,0)}}while(0);if((r16|0)!=0){STACKTOP=r4;return r16}r6=r1+32|0;if((HEAP32[r6>>2]|0)!=22008){STACKTOP=r4;return r16}while(1){r18=_malloc(12);if((r18|0)!=0){break}r1=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r1|0)==0){r3=31;break}FUNCTION_TABLE[r1]()}if(r3==31){r1=___cxa_allocate_exception(4);HEAP32[r1>>2]=9376;___cxa_throw(r1,16152,68)}r1=r18;r8=HEAP32[r5>>2];r5=_strlen(r8);if(r5>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r5>>>0<11){HEAP8[r18]=r5<<1;r19=r18+1|0}else{r17=r5+16&-16;r7=(r17|0)==0?1:r17;while(1){r20=_malloc(r7);if((r20|0)!=0){r3=50;break}r15=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r15|0)==0){break}FUNCTION_TABLE[r15]()}if(r3==50){HEAP32[r18+8>>2]=r20;HEAP32[r18>>2]=r17|1;HEAP32[r18+4>>2]=r5;r19=r20;break}r7=___cxa_allocate_exception(4);HEAP32[r7>>2]=9376;___cxa_throw(r7,16152,68)}}while(0);_memcpy(r19,r8,r5)|0;HEAP8[r19+r5|0]=0;HEAP32[r6>>2]=r1;STACKTOP=r4;return r16}function __ZNK7pcrecpp2RE7DoMatchERKNS_11StringPieceENS0_6AnchorEPiPKPKNS_3ArgEi(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r6=0;r7=STACKTOP;STACKTOP=STACKTOP+128|0;r8=r7;r9=r7+8;r10=r7+40;if((r5|0)<=-1){___assert_fail(6688,5704,605,8888)}r11=r5*3&-1;r12=r11+3|0;do{if(r12>>>0<22){r13=r10|0;r14=r13;r15=r13}else{r13=_llvm_umul_with_overflow_i32(r12,4);r16=tempRet0?-1:r13;r13=(r16|0)==0?1:r16;while(1){r17=_malloc(r13);if((r17|0)!=0){r6=20;break}r16=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r16|0)==0){break}FUNCTION_TABLE[r16]()}if(r6==20){r14=r17;r15=r10|0;break}r13=___cxa_allocate_exception(4);HEAP32[r13>>2]=9376;___cxa_throw(r13,16152,68)}}while(0);r10=r1+28|0;r17=HEAP32[r10>>2];L16:do{if((r17|0)==0){r18=0}else{_memset(r9,0,32)|0;r6=HEAP32[r1+12>>2];if((r6|0)>0){HEAP32[r9>>2]=2;HEAP32[r9+8>>2]=r6;r19=18}else{r19=16}r6=HEAP32[r1+16>>2];if((r6|0)>0){HEAP32[r9>>2]=r19;HEAP32[r9+20>>2]=r6}r6=r2|0;r13=HEAP32[r6>>2];r16=_pcre_exec(r17,r9,(r13|0)==0?18088:r13,HEAP32[r2+4>>2],0,HEAP32[r1+20>>2]&8192,r14,r12);if((r16|0)<0){r18=0;break}do{if((r16|0)==0){if((r12|0)>-2){if((r11+4|0)>>>0<3){r18=0;break L16}else{break}}else{___assert_fail(6840,5704,569,8920)}}}while(0);HEAP32[r3>>2]=HEAP32[r14+4>>2];if((r5|0)==0|(r4|0)==0){r18=1;break}r16=HEAP32[r10>>2];do{if((r16|0)==0){r20=-1}else{if((_pcre_fullinfo(r16,0,2,r8)|0)==0){r20=HEAP32[r8>>2];break}else{___assert_fail(6576,5704,656,8896)}}}while(0);if((r20|0)<(r5|0)){r18=0;break}else{r21=0}while(1){if((r21|0)>=(r5|0)){r18=1;break L16}r16=r21+1|0;r13=r16<<1;r22=HEAP32[r14+(r13<<2)>>2];r23=HEAP32[r4+(r21<<2)>>2];if(FUNCTION_TABLE[HEAP32[r23+4>>2]](HEAP32[r6>>2]+r22|0,HEAP32[r14+((r13|1)<<2)>>2]-r22|0,HEAP32[r23>>2])){r21=r16}else{r18=0;break}}}}while(0);if((r14|0)==(r15|0)|(r14|0)==0){STACKTOP=r7;return r18}_free(r14);STACKTOP=r7;return r18}function __ZN7pcrecpp3Arg10parse_nullEPKciPv(r1,r2,r3){return(r3|0)==0}function __ZN7pcrecpp3Arg12parse_stringEPKciPv(r1,r2,r3){var r4,r5,r6,r7,r8,r9;if((r3|0)==0){return 1}r4=r3;r5=HEAP8[r3];if((r5&1)==0){r6=10;r7=r5}else{r5=HEAP32[r3>>2];r6=(r5&-2)-1|0;r7=r5&255}if(r6>>>0<r2>>>0){r5=r7&255;if((r5&1|0)==0){r8=r5>>>1}else{r8=HEAP32[r3+4>>2]}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE21__grow_by_and_replaceEjjjjjjPKc(r4,r6,r2-r6|0,r8,0,r8,r2,r1);return 1}if((r7&1)==0){r9=r3+1|0}else{r9=HEAP32[r3+8>>2]}_memmove(r9,r1,r2,1,0);HEAP8[r9+r2|0]=0;if((HEAP8[r3]&1)==0){HEAP8[r3]=r2<<1;return 1}else{HEAP32[r3+4>>2]=r2;return 1}}function __GLOBAL__I_a72(){HEAP32[22024>>2]=0;HEAP32[22028>>2]=404;HEAP32[22008>>2]=0;HEAP32[22012>>2]=0;HEAP32[22016>>2]=0;_atexit(786,22008,___dso_handle);HEAP32[21992>>2]=0;HEAP32[21996>>2]=0;HEAP32[22e3>>2]=0;return}function ___getTypeName(r1){return _strdup(HEAP32[r1+4>>2])}function __GLOBAL__I_a93(){__embind_register_void(16120,5176);__embind_register_bool(16128,6440,1,0);__embind_register_integer(__ZTIc,6224,-128,127);__embind_register_integer(__ZTIa,5864,-128,127);__embind_register_integer(__ZTIh,5800,0,255);__embind_register_integer(__ZTIs,5624,-32768,32767);__embind_register_integer(__ZTIt,5296,0,65535);__embind_register_integer(__ZTIi,5104,-2147483648,2147483647);__embind_register_integer(__ZTIj,4952,0,-1);__embind_register_integer(__ZTIl,4776,-2147483648,2147483647);__embind_register_integer(__ZTIm,7280,0,-1);__embind_register_float(__ZTIf,6952);__embind_register_float(__ZTId,6800);__embind_register_std_string(17536,6672);__embind_register_std_wstring(17512,4,6560);__embind_register_emval(17840,6520);__embind_register_memory_view(17848,6472);return}function __ZNSt3__18ios_base4InitD2Ev(r1){__ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEE5flushEv(21600);__ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEE5flushEv(21688);__ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEE5flushEv(21232);__ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEE5flushEv(21320);return}function __ZNSt3__111__stdoutbufIwED1Ev(r1){var r2;HEAP32[r1>>2]=11128;r2=HEAP32[r1+4>>2];r1=r2+4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)|0)!=0){return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);return}function __ZNSt3__111__stdoutbufIwED0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=11128;r2=HEAP32[r1+4>>2];r3=r2+4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)!=0){r4=r1;_free(r4);return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);r4=r1;_free(r4);return}function __ZNSt3__111__stdoutbufIwE5imbueERKNS_6localeE(r1,r2){var r3;FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+24>>2]](r1);r3=__ZNKSt3__16locale9use_facetERNS0_2idE(HEAP32[r2>>2],21192);r2=r3;HEAP32[r1+36>>2]=r2;HEAP8[r1+44|0]=FUNCTION_TABLE[HEAP32[HEAP32[r3>>2]+28>>2]](r2)&1;return}function __ZNSt3__111__stdoutbufIwE4syncEv(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;r5=r3+8;r6=r1+36|0;r7=r1+40|0;r8=r4|0;r9=r4+8|0;r10=r4;r4=r1+32|0;while(1){r1=HEAP32[r6>>2];r11=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+20>>2]](r1,HEAP32[r7>>2],r8,r9,r5);r1=HEAP32[r5>>2]-r10|0;if((_fwrite(r8,1,r1,HEAP32[r4>>2])|0)!=(r1|0)){r12=-1;r2=6;break}if((r11|0)==2){r12=-1;r2=7;break}else if((r11|0)!=1){r2=4;break}}if(r2==4){r12=((_fflush(HEAP32[r4>>2])|0)!=0)<<31>>31;STACKTOP=r3;return r12}else if(r2==7){STACKTOP=r3;return r12}else if(r2==6){STACKTOP=r3;return r12}}function __ZNSt3__111__stdoutbufIwE6xsputnEPKwi(r1,r2,r3){var r4,r5,r6,r7,r8;r4=0;if((HEAP8[r1+44|0]&1)!=0){r5=_fwrite(r2,4,r3,HEAP32[r1+32>>2]);return r5}r6=r1;if((r3|0)>0){r7=r2;r8=0}else{r5=0;return r5}while(1){if((FUNCTION_TABLE[HEAP32[HEAP32[r6>>2]+52>>2]](r1,HEAP32[r7>>2])|0)==-1){r5=r8;r4=8;break}r2=r8+1|0;if((r2|0)<(r3|0)){r7=r7+4|0;r8=r2}else{r5=r2;r4=7;break}}if(r4==7){return r5}else if(r4==8){return r5}}function __ZNSt3__111__stdoutbufIwE8overflowEj(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=r4+8;r7=r4+16;r8=r4+24;r9=(r2|0)==-1;L1:do{if(!r9){HEAP32[r6>>2]=r2;if((HEAP8[r1+44|0]&1)!=0){if((_fwrite(r6,4,1,HEAP32[r1+32>>2])|0)==1){break}else{r10=-1}STACKTOP=r4;return r10}r11=r5|0;HEAP32[r7>>2]=r11;r12=r6+4|0;r13=r1+36|0;r14=r1+40|0;r15=r5+8|0;r16=r5;r17=r1+32|0;r18=r6;while(1){r19=HEAP32[r13>>2];r20=FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+12>>2]](r19,HEAP32[r14>>2],r18,r12,r8,r11,r15,r7);if((HEAP32[r8>>2]|0)==(r18|0)){r10=-1;r3=13;break}if((r20|0)==3){r3=7;break}r19=(r20|0)==1;if(r20>>>0>=2){r10=-1;r3=18;break}r20=HEAP32[r7>>2]-r16|0;if((_fwrite(r11,1,r20,HEAP32[r17>>2])|0)!=(r20|0)){r10=-1;r3=17;break}if(r19){r18=r19?HEAP32[r8>>2]:r18}else{break L1}}if(r3==17){STACKTOP=r4;return r10}else if(r3==7){if((_fwrite(r18,1,1,HEAP32[r17>>2])|0)==1){break}else{r10=-1}STACKTOP=r4;return r10}else if(r3==13){STACKTOP=r4;return r10}else if(r3==18){STACKTOP=r4;return r10}}}while(0);r10=r9?0:r2;STACKTOP=r4;return r10}function __ZNSt3__110__stdinbufIwED1Ev(r1){var r2;HEAP32[r1>>2]=11128;r2=HEAP32[r1+4>>2];r1=r2+4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)|0)!=0){return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);return}function __ZNSt3__110__stdinbufIwED0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=11128;r2=HEAP32[r1+4>>2];r3=r2+4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)!=0){r4=r1;_free(r4);return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);r4=r1;_free(r4);return}function __ZNSt3__110__stdinbufIwE5imbueERKNS_6localeE(r1,r2){var r3,r4,r5;r3=__ZNKSt3__16locale9use_facetERNS0_2idE(HEAP32[r2>>2],21192);r2=r3;r4=r1+36|0;HEAP32[r4>>2]=r2;r5=r1+44|0;HEAP32[r5>>2]=FUNCTION_TABLE[HEAP32[HEAP32[r3>>2]+24>>2]](r2);r2=HEAP32[r4>>2];HEAP8[r1+53|0]=FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+28>>2]](r2)&1;if((HEAP32[r5>>2]|0)>8){__ZNSt3__121__throw_runtime_errorEPKc(4864)}else{return}}function __ZNSt3__110__stdinbufIwE9underflowEv(r1){return __ZNSt3__110__stdinbufIwE9__getcharEb(r1,0)}function __ZNSt3__110__stdinbufIwE5uflowEv(r1){return __ZNSt3__110__stdinbufIwE9__getcharEb(r1,1)}function __ZNSt3__110__stdinbufIwE9pbackfailEj(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=STACKTOP;STACKTOP=STACKTOP+32|0;r4=r3;r5=r3+8;r6=r3+16;r7=r3+24;r8=r1+52|0;r9=(HEAP8[r8]&1)!=0;if((r2|0)==-1){if(r9){r10=-1;STACKTOP=r3;return r10}r11=HEAP32[r1+48>>2];HEAP8[r8]=(r11|0)!=-1|0;r10=r11;STACKTOP=r3;return r10}r11=r1+48|0;L8:do{if(r9){HEAP32[r6>>2]=HEAP32[r11>>2];r12=HEAP32[r1+36>>2];r13=r4|0;r14=FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+12>>2]](r12,HEAP32[r1+40>>2],r6,r6+4|0,r7,r13,r4+8|0,r5);if((r14|0)==2|(r14|0)==1){r10=-1;STACKTOP=r3;return r10}else if((r14|0)==3){HEAP8[r13]=HEAP32[r11>>2];HEAP32[r5>>2]=r4+1}r14=r1+32|0;while(1){r12=HEAP32[r5>>2];if(r12>>>0<=r13>>>0){break L8}r15=r12-1|0;HEAP32[r5>>2]=r15;if((_ungetc(HEAP8[r15]|0,HEAP32[r14>>2])|0)==-1){r10=-1;break}}STACKTOP=r3;return r10}}while(0);HEAP32[r11>>2]=r2;HEAP8[r8]=1;r10=r2;STACKTOP=r3;return r10}function __ZNSt3__110__stdinbufIwE9__getcharEb(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=r4+8;r7=r4+16;r8=r4+24;r9=r1+52|0;if((HEAP8[r9]&1)!=0){r10=r1+48|0;r11=HEAP32[r10>>2];if(!r2){r12=r11;STACKTOP=r4;return r12}HEAP32[r10>>2]=-1;HEAP8[r9]=0;r12=r11;STACKTOP=r4;return r12}r11=HEAP32[r1+44>>2];r9=(r11|0)>1?r11:1;L8:do{if((r9|0)>0){r11=r1+32|0;r10=0;while(1){r13=_fgetc(HEAP32[r11>>2]);if((r13|0)==-1){r12=-1;break}HEAP8[r5+r10|0]=r13;r13=r10+1|0;if((r13|0)<(r9|0)){r10=r13}else{break L8}}STACKTOP=r4;return r12}}while(0);L15:do{if((HEAP8[r1+53|0]&1)==0){r10=r1+40|0;r11=r1+36|0;r13=r5|0;r14=r6+4|0;r15=r1+32|0;r16=r9;while(1){r17=HEAP32[r10>>2];r18=r17;r19=HEAP32[r18>>2];r20=HEAP32[r18+4>>2];r18=HEAP32[r11>>2];r21=r5+r16|0;r22=FUNCTION_TABLE[HEAP32[HEAP32[r18>>2]+16>>2]](r18,r17,r13,r21,r7,r6,r14,r8);if((r22|0)==3){r3=14;break}else if((r22|0)==2){r12=-1;r3=25;break}else if((r22|0)!=1){r23=r16;break L15}r22=HEAP32[r10>>2];HEAP32[r22>>2]=r19;HEAP32[r22+4>>2]=r20;if((r16|0)==8){r12=-1;r3=31;break}r20=_fgetc(HEAP32[r15>>2]);if((r20|0)==-1){r12=-1;r3=24;break}HEAP8[r21]=r20;r16=r16+1|0}if(r3==14){HEAP32[r6>>2]=HEAP8[r13]|0;r23=r16;break}else if(r3==24){STACKTOP=r4;return r12}else if(r3==31){STACKTOP=r4;return r12}else if(r3==25){STACKTOP=r4;return r12}}else{HEAP32[r6>>2]=HEAP8[r5|0]|0;r23=r9}}while(0);if(r2){r2=HEAP32[r6>>2];HEAP32[r1+48>>2]=r2;r12=r2;STACKTOP=r4;return r12}r2=r1+32|0;r1=r23;while(1){if((r1|0)<=0){break}r23=r1-1|0;if((_ungetc(HEAP8[r5+r23|0]|0,HEAP32[r2>>2])|0)==-1){r12=-1;r3=23;break}else{r1=r23}}if(r3==23){STACKTOP=r4;return r12}r12=HEAP32[r6>>2];STACKTOP=r4;return r12}function __ZNSt3__111__stdoutbufIcED1Ev(r1){var r2;HEAP32[r1>>2]=11200;r2=HEAP32[r1+4>>2];r1=r2+4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)|0)!=0){return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);return}function __ZNSt3__111__stdoutbufIcED0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=11200;r2=HEAP32[r1+4>>2];r3=r2+4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)!=0){r4=r1;_free(r4);return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);r4=r1;_free(r4);return}function __ZNSt3__111__stdoutbufIcE5imbueERKNS_6localeE(r1,r2){var r3;FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+24>>2]](r1);r3=__ZNKSt3__16locale9use_facetERNS0_2idE(HEAP32[r2>>2],21200);r2=r3;HEAP32[r1+36>>2]=r2;HEAP8[r1+44|0]=FUNCTION_TABLE[HEAP32[HEAP32[r3>>2]+28>>2]](r2)&1;return}function __ZNSt3__111__stdoutbufIcE4syncEv(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;r5=r3+8;r6=r1+36|0;r7=r1+40|0;r8=r4|0;r9=r4+8|0;r10=r4;r4=r1+32|0;while(1){r1=HEAP32[r6>>2];r11=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+20>>2]](r1,HEAP32[r7>>2],r8,r9,r5);r1=HEAP32[r5>>2]-r10|0;if((_fwrite(r8,1,r1,HEAP32[r4>>2])|0)!=(r1|0)){r12=-1;r2=8;break}if((r11|0)==2){r12=-1;r2=6;break}else if((r11|0)!=1){r2=4;break}}if(r2==8){STACKTOP=r3;return r12}else if(r2==4){r12=((_fflush(HEAP32[r4>>2])|0)!=0)<<31>>31;STACKTOP=r3;return r12}else if(r2==6){STACKTOP=r3;return r12}}function __ZNSt3__111__stdoutbufIcE6xsputnEPKci(r1,r2,r3){var r4,r5,r6,r7,r8;r4=0;if((HEAP8[r1+44|0]&1)!=0){r5=_fwrite(r2,1,r3,HEAP32[r1+32>>2]);return r5}r6=r1;if((r3|0)>0){r7=r2;r8=0}else{r5=0;return r5}while(1){if((FUNCTION_TABLE[HEAP32[HEAP32[r6>>2]+52>>2]](r1,HEAPU8[r7])|0)==-1){r5=r8;r4=10;break}r2=r8+1|0;if((r2|0)<(r3|0)){r7=r7+1|0;r8=r2}else{r5=r2;r4=7;break}}if(r4==7){return r5}else if(r4==10){return r5}}function __ZNSt3__111__stdoutbufIcE8overflowEi(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=r4+8;r7=r4+16;r8=r4+24;r9=(r2|0)==-1;L1:do{if(!r9){HEAP8[r6]=r2;if((HEAP8[r1+44|0]&1)!=0){if((_fwrite(r6,1,1,HEAP32[r1+32>>2])|0)==1){break}else{r10=-1}STACKTOP=r4;return r10}r11=r5|0;HEAP32[r7>>2]=r11;r12=r6+1|0;r13=r1+36|0;r14=r1+40|0;r15=r5+8|0;r16=r5;r17=r1+32|0;r18=r6;while(1){r19=HEAP32[r13>>2];r20=FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+12>>2]](r19,HEAP32[r14>>2],r18,r12,r8,r11,r15,r7);if((HEAP32[r8>>2]|0)==(r18|0)){r10=-1;r3=13;break}if((r20|0)==3){r3=7;break}r19=(r20|0)==1;if(r20>>>0>=2){r10=-1;r3=14;break}r20=HEAP32[r7>>2]-r16|0;if((_fwrite(r11,1,r20,HEAP32[r17>>2])|0)!=(r20|0)){r10=-1;r3=18;break}if(r19){r18=r19?HEAP32[r8>>2]:r18}else{break L1}}if(r3==14){STACKTOP=r4;return r10}else if(r3==13){STACKTOP=r4;return r10}else if(r3==18){STACKTOP=r4;return r10}else if(r3==7){if((_fwrite(r18,1,1,HEAP32[r17>>2])|0)==1){break}else{r10=-1}STACKTOP=r4;return r10}}}while(0);r10=r9?0:r2;STACKTOP=r4;return r10}function __ZNSt3__110__stdinbufIcED1Ev(r1){var r2;HEAP32[r1>>2]=11200;r2=HEAP32[r1+4>>2];r1=r2+4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)|0)!=0){return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);return}function __ZNSt3__110__stdinbufIcED0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=11200;r2=HEAP32[r1+4>>2];r3=r2+4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)!=0){r4=r1;_free(r4);return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);r4=r1;_free(r4);return}function __ZNSt3__110__stdinbufIcE5imbueERKNS_6localeE(r1,r2){var r3,r4,r5;r3=__ZNKSt3__16locale9use_facetERNS0_2idE(HEAP32[r2>>2],21200);r2=r3;r4=r1+36|0;HEAP32[r4>>2]=r2;r5=r1+44|0;HEAP32[r5>>2]=FUNCTION_TABLE[HEAP32[HEAP32[r3>>2]+24>>2]](r2);r2=HEAP32[r4>>2];HEAP8[r1+53|0]=FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+28>>2]](r2)&1;if((HEAP32[r5>>2]|0)>8){__ZNSt3__121__throw_runtime_errorEPKc(4864)}else{return}}function __ZNSt3__110__stdinbufIcE9underflowEv(r1){return __ZNSt3__110__stdinbufIcE9__getcharEb(r1,0)}function __ZNSt3__110__stdinbufIcE5uflowEv(r1){return __ZNSt3__110__stdinbufIcE9__getcharEb(r1,1)}function __ZNSt3__110__stdinbufIcE9pbackfailEi(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=STACKTOP;STACKTOP=STACKTOP+32|0;r4=r3;r5=r3+8;r6=r3+16;r7=r3+24;r8=r1+52|0;r9=(HEAP8[r8]&1)!=0;if((r2|0)==-1){if(r9){r10=-1;STACKTOP=r3;return r10}r11=HEAP32[r1+48>>2];HEAP8[r8]=(r11|0)!=-1|0;r10=r11;STACKTOP=r3;return r10}r11=r1+48|0;L8:do{if(r9){HEAP8[r6]=HEAP32[r11>>2];r12=HEAP32[r1+36>>2];r13=r4|0;r14=FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+12>>2]](r12,HEAP32[r1+40>>2],r6,r6+1|0,r7,r13,r4+8|0,r5);if((r14|0)==3){HEAP8[r13]=HEAP32[r11>>2];HEAP32[r5>>2]=r4+1}else if((r14|0)==2|(r14|0)==1){r10=-1;STACKTOP=r3;return r10}r14=r1+32|0;while(1){r12=HEAP32[r5>>2];if(r12>>>0<=r13>>>0){break L8}r15=r12-1|0;HEAP32[r5>>2]=r15;if((_ungetc(HEAP8[r15]|0,HEAP32[r14>>2])|0)==-1){r10=-1;break}}STACKTOP=r3;return r10}}while(0);HEAP32[r11>>2]=r2;HEAP8[r8]=1;r10=r2;STACKTOP=r3;return r10}function __ZNSt3__110__stdinbufIcE9__getcharEb(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=r4+8;r7=r4+16;r8=r4+24;r9=r1+52|0;if((HEAP8[r9]&1)!=0){r10=r1+48|0;r11=HEAP32[r10>>2];if(!r2){r12=r11;STACKTOP=r4;return r12}HEAP32[r10>>2]=-1;HEAP8[r9]=0;r12=r11;STACKTOP=r4;return r12}r11=HEAP32[r1+44>>2];r9=(r11|0)>1?r11:1;L8:do{if((r9|0)>0){r11=r1+32|0;r10=0;while(1){r13=_fgetc(HEAP32[r11>>2]);if((r13|0)==-1){r12=-1;break}HEAP8[r5+r10|0]=r13;r13=r10+1|0;if((r13|0)<(r9|0)){r10=r13}else{break L8}}STACKTOP=r4;return r12}}while(0);L15:do{if((HEAP8[r1+53|0]&1)==0){r10=r1+40|0;r11=r1+36|0;r13=r5|0;r14=r6+1|0;r15=r1+32|0;r16=r9;while(1){r17=HEAP32[r10>>2];r18=r17;r19=HEAP32[r18>>2];r20=HEAP32[r18+4>>2];r18=HEAP32[r11>>2];r21=r5+r16|0;r22=FUNCTION_TABLE[HEAP32[HEAP32[r18>>2]+16>>2]](r18,r17,r13,r21,r7,r6,r14,r8);if((r22|0)==3){r3=14;break}else if((r22|0)==2){r12=-1;r3=27;break}else if((r22|0)!=1){r23=r16;break L15}r22=HEAP32[r10>>2];HEAP32[r22>>2]=r19;HEAP32[r22+4>>2]=r20;if((r16|0)==8){r12=-1;r3=26;break}r20=_fgetc(HEAP32[r15>>2]);if((r20|0)==-1){r12=-1;r3=30;break}HEAP8[r21]=r20;r16=r16+1|0}if(r3==30){STACKTOP=r4;return r12}else if(r3==14){HEAP8[r6]=HEAP8[r13];r23=r16;break}else if(r3==27){STACKTOP=r4;return r12}else if(r3==26){STACKTOP=r4;return r12}}else{HEAP8[r6]=HEAP8[r5|0];r23=r9}}while(0);do{if(r2){r9=HEAP8[r6];HEAP32[r1+48>>2]=r9&255;r24=r9}else{r9=r1+32|0;r8=r23;while(1){if((r8|0)<=0){r3=21;break}r7=r8-1|0;if((_ungetc(HEAPU8[r5+r7|0],HEAP32[r9>>2])|0)==-1){r12=-1;r3=29;break}else{r8=r7}}if(r3==21){r24=HEAP8[r6];break}else if(r3==29){STACKTOP=r4;return r12}}}while(0);r12=r24&255;STACKTOP=r4;return r12}function __GLOBAL__I_a129(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47;r1=HEAP32[_stdin>>2];HEAP32[20872>>2]=11200;__ZNSt3__16localeC2Ev(20876);HEAP32[20880>>2]=0;HEAP32[20884>>2]=0;HEAP32[20888>>2]=0;HEAP32[20892>>2]=0;HEAP32[20896>>2]=0;HEAP32[20900>>2]=0;HEAP32[20872>>2]=11968;HEAP32[20904>>2]=r1;HEAP32[20912>>2]=21e3;HEAP32[20920>>2]=-1;HEAP8[20924]=0;r2=HEAP32[20876>>2];r3=r2+4|0;tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+1,tempValue;r4=__ZNKSt3__16locale9use_facetERNS0_2idE(r2,21200);r5=r4;HEAP32[20908>>2]=r5;HEAP32[20916>>2]=FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]+24>>2]](r5);r5=HEAP32[20908>>2];HEAP8[20925]=FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+28>>2]](r5)&1;if((HEAP32[20916>>2]|0)>8){__ZNSt3__121__throw_runtime_errorEPKc(4864)}if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0)}HEAP32[21864>>2]=11420;HEAP32[21872>>2]=11440;HEAP32[21868>>2]=0;HEAP32[21896>>2]=20872;HEAP32[21888>>2]=0;HEAP32[21892>>2]=0;HEAP32[21876>>2]=4098;HEAP32[21884>>2]=0;HEAP32[21880>>2]=6;_memset(21904,0,40)|0;__ZNSt3__16localeC2Ev(21900);HEAP32[21944>>2]=0;HEAP32[21948>>2]=-1;r2=HEAP32[_stdout>>2];HEAP32[20776>>2]=11200;__ZNSt3__16localeC2Ev(20780);HEAP32[20784>>2]=0;HEAP32[20788>>2]=0;HEAP32[20792>>2]=0;HEAP32[20796>>2]=0;HEAP32[20800>>2]=0;HEAP32[20804>>2]=0;HEAP32[20776>>2]=11568;HEAP32[20808>>2]=r2;r3=HEAP32[20780>>2];r5=r3+4|0;tempValue=HEAP32[r5>>2],HEAP32[r5>>2]=tempValue+1,tempValue;r4=__ZNKSt3__16locale9use_facetERNS0_2idE(r3,21200);r6=r4;if(((tempValue=HEAP32[r5>>2],HEAP32[r5>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r3>>2]+8>>2]](r3|0)}HEAP32[20812>>2]=r6;HEAP32[20816>>2]=21008;HEAP8[20820]=FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]+28>>2]](r6)&1;HEAP32[21600>>2]=11324;HEAP32[21604>>2]=11344;HEAP32[21628>>2]=20776;HEAP32[21620>>2]=0;HEAP32[21624>>2]=0;HEAP32[21608>>2]=4098;HEAP32[21616>>2]=0;HEAP32[21612>>2]=6;_memset(21636,0,40)|0;__ZNSt3__16localeC2Ev(21632);HEAP32[21676>>2]=0;HEAP32[21680>>2]=-1;r6=HEAP32[_stderr>>2];HEAP32[20824>>2]=11200;__ZNSt3__16localeC2Ev(20828);HEAP32[20832>>2]=0;HEAP32[20836>>2]=0;HEAP32[20840>>2]=0;HEAP32[20844>>2]=0;HEAP32[20848>>2]=0;HEAP32[20852>>2]=0;HEAP32[20824>>2]=11568;HEAP32[20856>>2]=r6;r4=HEAP32[20828>>2];r3=r4+4|0;tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+1,tempValue;r5=__ZNKSt3__16locale9use_facetERNS0_2idE(r4,21200);r7=r5;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]+8>>2]](r4|0)}HEAP32[20860>>2]=r7;HEAP32[20864>>2]=21016;HEAP8[20868]=FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+28>>2]](r7)&1;HEAP32[21776>>2]=11324;HEAP32[21780>>2]=11344;HEAP32[21804>>2]=20824;HEAP32[21796>>2]=0;HEAP32[21800>>2]=0;HEAP32[21784>>2]=4098;HEAP32[21792>>2]=0;HEAP32[21788>>2]=6;_memset(21812,0,40)|0;__ZNSt3__16localeC2Ev(21808);HEAP32[21852>>2]=0;HEAP32[21856>>2]=-1;r7=HEAP32[HEAP32[HEAP32[21776>>2]-12>>2]+21800>>2];HEAP32[21688>>2]=11324;HEAP32[21692>>2]=11344;HEAP32[21716>>2]=r7;HEAP32[21708>>2]=(r7|0)==0;HEAP32[21712>>2]=0;HEAP32[21696>>2]=4098;HEAP32[21704>>2]=0;HEAP32[21700>>2]=6;_memset(21724,0,40)|0;__ZNSt3__16localeC2Ev(21720);HEAP32[21764>>2]=0;HEAP32[21768>>2]=-1;HEAP32[HEAP32[HEAP32[21864>>2]-12>>2]+21936>>2]=21600;r7=HEAP32[HEAP32[21776>>2]-12>>2]+21780|0;HEAP32[r7>>2]=HEAP32[r7>>2]|8192;HEAP32[HEAP32[HEAP32[21776>>2]-12>>2]+21848>>2]=21600;HEAP32[20720>>2]=11128;__ZNSt3__16localeC2Ev(20724);HEAP32[20728>>2]=0;HEAP32[20732>>2]=0;HEAP32[20736>>2]=0;HEAP32[20740>>2]=0;HEAP32[20744>>2]=0;HEAP32[20748>>2]=0;HEAP32[20720>>2]=11896;HEAP32[20752>>2]=r1;HEAP32[20760>>2]=21024;HEAP32[20768>>2]=-1;HEAP8[20772]=0;r1=HEAP32[20724>>2];r7=r1+4|0;tempValue=HEAP32[r7>>2],HEAP32[r7>>2]=tempValue+1,tempValue;r5=__ZNKSt3__16locale9use_facetERNS0_2idE(r1,21192);r4=r5;HEAP32[20756>>2]=r4;HEAP32[20764>>2]=FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+24>>2]](r4);r4=HEAP32[20756>>2];HEAP8[20773]=FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]+28>>2]](r4)&1;if((HEAP32[20764>>2]|0)>8){__ZNSt3__121__throw_runtime_errorEPKc(4864)}if(((tempValue=HEAP32[r7>>2],HEAP32[r7>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+8>>2]](r1|0)}HEAP32[21512>>2]=11372;HEAP32[21520>>2]=11392;HEAP32[21516>>2]=0;HEAP32[21544>>2]=20720;HEAP32[21536>>2]=0;HEAP32[21540>>2]=0;HEAP32[21524>>2]=4098;HEAP32[21532>>2]=0;HEAP32[21528>>2]=6;_memset(21552,0,40)|0;__ZNSt3__16localeC2Ev(21548);HEAP32[21592>>2]=0;HEAP32[21596>>2]=-1;HEAP32[20624>>2]=11128;__ZNSt3__16localeC2Ev(20628);HEAP32[20632>>2]=0;HEAP32[20636>>2]=0;HEAP32[20640>>2]=0;HEAP32[20644>>2]=0;HEAP32[20648>>2]=0;HEAP32[20652>>2]=0;HEAP32[20624>>2]=11496;HEAP32[20656>>2]=r2;r2=HEAP32[20628>>2];r1=r2+4|0;tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+1,tempValue;r7=__ZNKSt3__16locale9use_facetERNS0_2idE(r2,21192);r4=r7;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0)}HEAP32[20660>>2]=r4;HEAP32[20664>>2]=21032;HEAP8[20668]=FUNCTION_TABLE[HEAP32[HEAP32[r7>>2]+28>>2]](r4)&1;HEAP32[21232>>2]=11276;HEAP32[21236>>2]=11296;HEAP32[21260>>2]=20624;HEAP32[21252>>2]=0;HEAP32[21256>>2]=0;HEAP32[21240>>2]=4098;HEAP32[21248>>2]=0;HEAP32[21244>>2]=6;_memset(21268,0,40)|0;__ZNSt3__16localeC2Ev(21264);HEAP32[21308>>2]=0;HEAP32[21312>>2]=-1;HEAP32[20672>>2]=11128;__ZNSt3__16localeC2Ev(20676);HEAP32[20680>>2]=0;HEAP32[20684>>2]=0;HEAP32[20688>>2]=0;HEAP32[20692>>2]=0;HEAP32[20696>>2]=0;HEAP32[20700>>2]=0;HEAP32[20672>>2]=11496;HEAP32[20704>>2]=r6;r6=HEAP32[20676>>2];r4=r6+4|0;tempValue=HEAP32[r4>>2],HEAP32[r4>>2]=tempValue+1,tempValue;r7=__ZNKSt3__16locale9use_facetERNS0_2idE(r6,21192);r2=r7;if(((tempValue=HEAP32[r4>>2],HEAP32[r4>>2]=tempValue+ -1,tempValue)|0)!=0){HEAP32[20708>>2]=r2;HEAP32[20712>>2]=21040;r8=r7;r9=HEAP32[r8>>2];r10=r9+28|0;r11=HEAP32[r10>>2];r12=FUNCTION_TABLE[r11](r2);r13=r12&1;HEAP8[20716]=r13;HEAP32[21408>>2]=11276;HEAP32[21412>>2]=11296;HEAP32[21436>>2]=20672;HEAP32[21428>>2]=0;HEAP32[21432>>2]=0;HEAP32[21416>>2]=4098;HEAP32[21424>>2]=0;HEAP32[21420>>2]=6;_memset(21444,0,40)|0;__ZNSt3__16localeC2Ev(21440);HEAP32[21484>>2]=0;HEAP32[21488>>2]=-1;r14=HEAP32[21408>>2];r15=r14-12|0;r16=r15;r17=HEAP32[r16>>2];r18=r17+24|0;r19=r18+21408|0;r20=r19;r21=HEAP32[r20>>2];HEAP32[21320>>2]=11276;HEAP32[21324>>2]=11296;HEAP32[21348>>2]=r21;r22=(r21|0)==0;r23=r22&1;HEAP32[21340>>2]=r23;HEAP32[21344>>2]=0;HEAP32[21328>>2]=4098;HEAP32[21336>>2]=0;HEAP32[21332>>2]=6;_memset(21356,0,40)|0;__ZNSt3__16localeC2Ev(21352);HEAP32[21396>>2]=0;HEAP32[21400>>2]=-1;r24=HEAP32[21512>>2];r25=r24-12|0;r26=r25;r27=HEAP32[r26>>2];r28=r27+72|0;r29=r28+21512|0;r30=r29;HEAP32[r30>>2]=21232;r31=HEAP32[21408>>2];r32=r31-12|0;r33=r32;r34=HEAP32[r33>>2];r35=r34+4|0;r36=r35+21408|0;r37=r36;r38=HEAP32[r37>>2];r39=r38|8192;HEAP32[r37>>2]=r39;r40=HEAP32[21408>>2];r41=r40-12|0;r42=r41;r43=HEAP32[r42>>2];r44=r43+72|0;r45=r44+21408|0;r46=r45;HEAP32[r46>>2]=21232;r47=_atexit(378,21952,___dso_handle);return}FUNCTION_TABLE[HEAP32[HEAP32[r6>>2]+8>>2]](r6|0);HEAP32[20708>>2]=r2;HEAP32[20712>>2]=21040;r8=r7;r9=HEAP32[r8>>2];r10=r9+28|0;r11=HEAP32[r10>>2];r12=FUNCTION_TABLE[r11](r2);r13=r12&1;HEAP8[20716]=r13;HEAP32[21408>>2]=11276;HEAP32[21412>>2]=11296;HEAP32[21436>>2]=20672;HEAP32[21428>>2]=0;HEAP32[21432>>2]=0;HEAP32[21416>>2]=4098;HEAP32[21424>>2]=0;HEAP32[21420>>2]=6;_memset(21444,0,40)|0;__ZNSt3__16localeC2Ev(21440);HEAP32[21484>>2]=0;HEAP32[21488>>2]=-1;r14=HEAP32[21408>>2];r15=r14-12|0;r16=r15;r17=HEAP32[r16>>2];r18=r17+24|0;r19=r18+21408|0;r20=r19;r21=HEAP32[r20>>2];HEAP32[21320>>2]=11276;HEAP32[21324>>2]=11296;HEAP32[21348>>2]=r21;r22=(r21|0)==0;r23=r22&1;HEAP32[21340>>2]=r23;HEAP32[21344>>2]=0;HEAP32[21328>>2]=4098;HEAP32[21336>>2]=0;HEAP32[21332>>2]=6;_memset(21356,0,40)|0;__ZNSt3__16localeC2Ev(21352);HEAP32[21396>>2]=0;HEAP32[21400>>2]=-1;r24=HEAP32[21512>>2];r25=r24-12|0;r26=r25;r27=HEAP32[r26>>2];r28=r27+72|0;r29=r28+21512|0;r30=r29;HEAP32[r30>>2]=21232;r31=HEAP32[21408>>2];r32=r31-12|0;r33=r32;r34=HEAP32[r33>>2];r35=r34+4|0;r36=r35+21408|0;r37=r36;r38=HEAP32[r37>>2];r39=r38|8192;HEAP32[r37>>2]=r39;r40=HEAP32[21408>>2];r41=r40-12|0;r42=r41;r43=HEAP32[r42>>2];r44=r43+72|0;r45=r44+21408|0;r46=r45;HEAP32[r46>>2]=21232;r47=_atexit(378,21952,___dso_handle);return}function __ZNSt11logic_errorD0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=9504;r2=r1+4|0;r3=HEAP32[r2>>2]-4|0;do{if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)-1|0)<0){r4=HEAP32[r2>>2]-12|0;if((r4|0)!=0){_free(r4)}if((r1|0)!=0){break}return}}while(0);_free(r1);return}function __ZNSt11logic_errorD2Ev(r1){var r2;HEAP32[r1>>2]=9504;r2=r1+4|0;r1=HEAP32[r2>>2]-4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)-1|0)>=0){return}r1=HEAP32[r2>>2]-12|0;if((r1|0)==0){return}_free(r1);return}function __ZNKSt11logic_error4whatEv(r1){return HEAP32[r1+4>>2]}function __ZNSt13runtime_errorD0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=9440;r2=r1+4|0;r3=HEAP32[r2>>2]-4|0;do{if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)-1|0)<0){r4=HEAP32[r2>>2]-12|0;if((r4|0)!=0){_free(r4)}if((r1|0)!=0){break}return}}while(0);_free(r1);return}function __ZNSt13runtime_errorD2Ev(r1){var r2;HEAP32[r1>>2]=9440;r2=r1+4|0;r1=HEAP32[r2>>2]-4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)-1|0)>=0){return}r1=HEAP32[r2>>2]-12|0;if((r1|0)==0){return}_free(r1);return}function __ZNKSt13runtime_error4whatEv(r1){return HEAP32[r1+4>>2]}function __ZNSt12length_errorD0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=9504;r2=r1+4|0;r3=HEAP32[r2>>2]-4|0;do{if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)-1|0)<0){r4=HEAP32[r2>>2]-12|0;if((r4|0)!=0){_free(r4)}if((r1|0)!=0){break}return}}while(0);_free(r1);return}function __ZNKSt3__114error_category23default_error_conditionEi(r1,r2,r3){HEAP32[r1>>2]=r3;HEAP32[r1+4>>2]=r2;return}function __ZNKSt3__114error_category10equivalentEiRKNS_15error_conditionE(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+12>>2]](r5,r1,r2);if((HEAP32[r5+4>>2]|0)!=(HEAP32[r3+4>>2]|0)){r6=0;STACKTOP=r4;return r6}r6=(HEAP32[r5>>2]|0)==(HEAP32[r3>>2]|0);STACKTOP=r4;return r6}function __ZNKSt3__114error_category10equivalentERKNS_10error_codeEi(r1,r2,r3){var r4;if((HEAP32[r2+4>>2]|0)!=(r1|0)){r4=0;return r4}r4=(HEAP32[r2>>2]|0)==(r3|0);return r4}function __ZNSt3__112system_errorD0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=9440;r2=r1+4|0;r3=HEAP32[r2>>2]-4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)-1|0)>=0){r4=r1;_free(r4);return}r3=HEAP32[r2>>2]-12|0;if((r3|0)==0){r4=r1;_free(r4);return}_free(r3);r4=r1;_free(r4);return}function __ZNSt3__112system_errorD2Ev(r1){var r2;HEAP32[r1>>2]=9440;r2=r1+4|0;r1=HEAP32[r2>>2]-4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)-1|0)>=0){return}r1=HEAP32[r2>>2]-12|0;if((r1|0)==0){return}_free(r1);return}function __ZNSt3__111__call_onceERVmPvPFvS2_E(r1,r2){var r3,r4,r5;if((HEAP32[r1>>2]|0)==1){while(1){_pthread_cond_wait(20952,20928);if((HEAP32[r1>>2]|0)!=1){break}}}if((HEAP32[r1>>2]|0)!=0){return}HEAP32[r1>>2]=1;r3=r2+4|0;r4=HEAP32[r2>>2]+HEAP32[r3+4>>2]|0;r2=HEAP32[r3>>2];if((r2&1|0)==0){r5=r2}else{r5=HEAP32[HEAP32[r4>>2]+(r2-1)>>2]}FUNCTION_TABLE[r5](r4);HEAP32[r1>>2]=-1;_pthread_cond_broadcast(20952);return}function __ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv(){var r1,r2,r3,r4,r5,r6,r7,r8,r9;r1=0;r2=___cxa_allocate_exception(8);HEAP32[r2>>2]=9504;r3=r2+4|0;r4=r3;if((r3|0)==0){r5=r2;HEAP32[r5>>2]=9472;___cxa_throw(r2,16200,264)}r3=_strlen(5040);r6=r3+1|0;r7=r3+13|0;r8=(r7|0)==0?1:r7;while(1){r9=_malloc(r8);if((r9|0)!=0){r1=18;break}r7=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r7|0)==0){r1=12;break}FUNCTION_TABLE[r7]()}if(r1==18){HEAP32[r9+4>>2]=r3;HEAP32[r9>>2]=r3;r3=r9+12|0;HEAP32[r4>>2]=r3;HEAP32[r9+8>>2]=0;_memcpy(r3,5040,r6)|0;r5=r2;HEAP32[r5>>2]=9472;___cxa_throw(r2,16200,264)}else if(r1==12){r1=___cxa_allocate_exception(4);HEAP32[r1>>2]=9376;___cxa_throw(r1,16152,68)}}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;if(r3>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}if(r3>>>0<11){HEAP8[r1]=r3<<1;r5=r1+1|0;_memcpy(r5,r2,r3)|0;r6=r5+r3|0;HEAP8[r6]=0;return}r7=r3+16&-16;r8=(r7|0)==0?1:r7;while(1){r9=_malloc(r8);if((r9|0)!=0){r4=16;break}r10=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r10|0)==0){r4=13;break}FUNCTION_TABLE[r10]()}if(r4==13){r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=9376;___cxa_throw(r8,16152,68)}else if(r4==16){HEAP32[r1+8>>2]=r9;HEAP32[r1>>2]=r7|1;HEAP32[r1+4>>2]=r3;r5=r9;_memcpy(r5,r2,r3)|0;r6=r5+r3|0;HEAP8[r6]=0;return}}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED1Ev(r1){var r2;if((HEAP8[r1]&1)==0){return}r2=HEAP32[r1+8>>2];if((r2|0)==0){return}_free(r2);return}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEaSERKS5_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;if((r1|0)==(r2|0)){return}r3=HEAP8[r2];if((r3&1)==0){r4=r2+1|0}else{r4=HEAP32[r2+8>>2]}r5=r3&255;if((r5&1|0)==0){r6=r5>>>1}else{r6=HEAP32[r2+4>>2]}r2=r1;r5=r1;r3=HEAP8[r5];if((r3&1)==0){r7=10;r8=r3}else{r3=HEAP32[r1>>2];r7=(r3&-2)-1|0;r8=r3&255}if(r7>>>0<r6>>>0){r3=r8&255;if((r3&1|0)==0){r9=r3>>>1}else{r9=HEAP32[r1+4>>2]}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE21__grow_by_and_replaceEjjjjjjPKc(r1,r7,r6-r7|0,r9,0,r9,r6,r4);return}if((r8&1)==0){r10=r2+1|0}else{r10=HEAP32[r1+8>>2]}_memmove(r10,r4,r6,1,0);HEAP8[r10+r6|0]=0;if((HEAP8[r5]&1)==0){HEAP8[r5]=r6<<1;return}else{HEAP32[r1+4>>2]=r6;return}}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6assignEPKc(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=_strlen(r2);r4=r1;r5=r1;r6=HEAP8[r5];if((r6&1)==0){r7=10;r8=r6}else{r6=HEAP32[r1>>2];r7=(r6&-2)-1|0;r8=r6&255}if(r7>>>0<r3>>>0){r6=r8&255;if((r6&1|0)==0){r9=r6>>>1}else{r9=HEAP32[r1+4>>2]}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE21__grow_by_and_replaceEjjjjjjPKc(r1,r7,r3-r7|0,r9,0,r9,r3,r2);return}if((r8&1)==0){r10=r4+1|0}else{r10=HEAP32[r1+8>>2]}_memmove(r10,r2,r3,1,0);HEAP8[r10+r3|0]=0;if((HEAP8[r5]&1)==0){HEAP8[r5]=r3<<1;return}else{HEAP32[r1+4>>2]=r3;return}}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r3=r1;r4=r1;r5=HEAP8[r4];r6=r5&255;if((r6&1|0)==0){r7=r6>>>1}else{r7=HEAP32[r1+4>>2]}if(r7>>>0>=r2>>>0){if((r5&1)==0){HEAP8[r2+(r3+1)|0]=0;HEAP8[r4]=r2<<1;return}else{HEAP8[HEAP32[r1+8>>2]+r2|0]=0;HEAP32[r1+4>>2]=r2;return}}r6=r2-r7|0;if((r7|0)==(r2|0)){return}if((r5&1)==0){r8=10;r9=r5}else{r5=HEAP32[r1>>2];r8=(r5&-2)-1|0;r9=r5&255}r5=r9&255;if((r5&1|0)==0){r10=r5>>>1}else{r10=HEAP32[r1+4>>2]}if((r8-r10|0)>>>0<r6>>>0){__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEjjjjjj(r1,r8,r6-r8+r10|0,r10,r10,0);r11=HEAP8[r4]}else{r11=r9}if((r11&1)==0){r12=r3+1|0}else{r12=HEAP32[r1+8>>2]}_memset(r12+r10|0,0,r6)|0;r3=r10+r6|0;if((HEAP8[r4]&1)==0){HEAP8[r4]=r3<<1}else{HEAP32[r1+4>>2]=r3}HEAP8[r12+r3|0]=0;return}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEj(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r2=r1;r3=r1;r4=HEAP8[r3];if((r4&1)==0){r5=10;r6=r4}else{r4=HEAP32[r1>>2];r5=(r4&-2)-1|0;r6=r4&255}r4=r6&255;r7=(r4&1|0)==0;if(r7){r8=r4>>>1}else{r8=HEAP32[r1+4>>2]}if(r8>>>0<11){r9=11}else{r9=r8+16&-16}r10=r9-1|0;if((r10|0)==(r5|0)){return}if((r10|0)==10){r11=r2+1|0;r12=HEAP32[r1+8>>2];r13=1;r14=0}else{r15=(r9|0)==0?1:r9;L17:do{if(r10>>>0>r5>>>0){while(1){r16=_malloc(r15);if((r16|0)!=0){r17=r16;break L17}r16=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r16|0)==0){break}FUNCTION_TABLE[r16]()}r16=___cxa_allocate_exception(4);HEAP32[r16>>2]=9376;___cxa_throw(r16,16152,68)}else{while(1){r16=_malloc(r15);if((r16|0)!=0){r17=r16;break L17}r16=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r16|0)==0){break}FUNCTION_TABLE[r16]()}r16=___cxa_allocate_exception(4);HEAP32[r16>>2]=9376;___cxa_throw(r16,16152,68)}}while(0);r15=r6&1;if(r15<<24>>24==0){r18=r2+1|0}else{r18=HEAP32[r1+8>>2]}r11=r17;r12=r18;r13=r15<<24>>24!=0;r14=1}if(r7){r19=r4>>>1}else{r19=HEAP32[r1+4>>2]}_memcpy(r11,r12,r19+1|0)|0;if(!(r13^1|(r12|0)==0)){_free(r12)}if(r14){HEAP32[r1>>2]=r9|1;HEAP32[r1+4>>2]=r8;HEAP32[r1+8>>2]=r11;return}else{HEAP8[r3]=r8<<1;return}}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKcj(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=r1;r5=HEAP8[r4];if((r5&1)==0){r6=10;r7=r5}else{r5=HEAP32[r1>>2];r6=(r5&-2)-1|0;r7=r5&255}r5=r7&255;if((r5&1|0)==0){r8=r5>>>1}else{r8=HEAP32[r1+4>>2]}if((r6-r8|0)>>>0<r3>>>0){__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE21__grow_by_and_replaceEjjjjjjPKc(r1,r6,r3-r6+r8|0,r8,r8,0,r3,r2);return}if((r3|0)==0){return}if((r7&1)==0){r9=r1+1|0}else{r9=HEAP32[r1+8>>2]}_memcpy(r9+r8|0,r2,r3)|0;r2=r8+r3|0;if((HEAP8[r4]&1)==0){HEAP8[r4]=r2<<1}else{HEAP32[r1+4>>2]=r2}HEAP8[r9+r2|0]=0;return}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE21__grow_by_and_replaceEjjjjjjPKc(r1,r2,r3,r4,r5,r6,r7,r8){var r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r9=0;if((-18-r2|0)>>>0<r3>>>0){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}if((HEAP8[r1]&1)==0){r10=r1+1|0}else{r10=HEAP32[r1+8>>2]}do{if(r2>>>0<2147483623){r11=r3+r2|0;r12=r2<<1;r13=r11>>>0<r12>>>0?r12:r11;if(r13>>>0<11){r14=11;break}r14=r13+16&-16}else{r14=-17}}while(0);r3=(r14|0)==0?1:r14;while(1){r15=_malloc(r3);if((r15|0)!=0){break}r13=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r13|0)==0){r9=17;break}FUNCTION_TABLE[r13]()}if(r9==17){r9=___cxa_allocate_exception(4);HEAP32[r9>>2]=9376;___cxa_throw(r9,16152,68)}if((r5|0)!=0){_memcpy(r15,r10,r5)|0}if((r7|0)!=0){_memcpy(r15+r5|0,r8,r7)|0}r8=r4-r6|0;if((r8|0)!=(r5|0)){_memcpy(r15+(r7+r5)|0,r10+(r6+r5)|0,r8-r5|0)|0}if((r2|0)==10|(r10|0)==0){r16=r1+8|0;HEAP32[r16>>2]=r15;r17=r14|1;r18=r1|0;HEAP32[r18>>2]=r17;r19=r8+r7|0;r20=r1+4|0;HEAP32[r20>>2]=r19;r21=r15+r19|0;HEAP8[r21]=0;return}_free(r10);r16=r1+8|0;HEAP32[r16>>2]=r15;r17=r14|1;r18=r1|0;HEAP32[r18>>2]=r17;r19=r8+r7|0;r20=r1+4|0;HEAP32[r20>>2]=r19;r21=r15+r19|0;HEAP8[r21]=0;return}function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEjjjjjj(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r7=0;if((-17-r2|0)>>>0<r3>>>0){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}if((HEAP8[r1]&1)==0){r8=r1+1|0}else{r8=HEAP32[r1+8>>2]}do{if(r2>>>0<2147483623){r9=r3+r2|0;r10=r2<<1;r11=r9>>>0<r10>>>0?r10:r9;if(r11>>>0<11){r12=11;break}r12=r11+16&-16}else{r12=-17}}while(0);r3=(r12|0)==0?1:r12;while(1){r13=_malloc(r3);if((r13|0)!=0){break}r11=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r11|0)==0){r7=17;break}FUNCTION_TABLE[r11]()}if(r7==17){r7=___cxa_allocate_exception(4);HEAP32[r7>>2]=9376;___cxa_throw(r7,16152,68)}if((r5|0)!=0){_memcpy(r13,r8,r5)|0}if((r4|0)!=(r5|0)){_memcpy(r13+(r6+r5)|0,r8+r5|0,r4-r5|0)|0}if((r2|0)==10|(r8|0)==0){r14=r1+8|0;HEAP32[r14>>2]=r13;r15=r12|1;r16=r1|0;HEAP32[r16>>2]=r15;return}_free(r8);r14=r1+8|0;HEAP32[r14>>2]=r13;r15=r12|1;r16=r1|0;HEAP32[r16>>2]=r15;return}function __ZNSt3__112basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED1Ev(r1){var r2;if((HEAP8[r1]&1)==0){return}r2=HEAP32[r1+8>>2];if((r2|0)==0){return}_free(r2);return}function __ZNSt3__112basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE6assignEPKw(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r3=0;r4=r2;while(1){if((HEAP32[r4>>2]|0)==0){break}else{r4=r4+4|0}}r5=r2;r6=r4-r5|0;r4=r6>>2;r7=r1;r8=HEAP8[r7];if((r8&1)==0){r9=1;r10=r8}else{r8=HEAP32[r1>>2];r9=(r8&-2)-1|0;r10=r8&255}if(r9>>>0>=r4>>>0){if((r10&1)==0){r11=r1+4|0}else{r11=HEAP32[r1+8>>2]}r8=(r4|0)==0;do{if(r11-r5>>2>>>0<r4>>>0){if(r8){break}else{r12=r4}while(1){r13=r12-1|0;HEAP32[r11+(r13<<2)>>2]=HEAP32[r2+(r13<<2)>>2];if((r13|0)==0){break}else{r12=r13}}}else{if(r8){break}else{r14=r2;r15=r4;r16=r11}while(1){r13=r15-1|0;HEAP32[r16>>2]=HEAP32[r14>>2];if((r13|0)==0){break}else{r14=r14+4|0;r15=r13;r16=r16+4|0}}}}while(0);HEAP32[r11+(r4<<2)>>2]=0;if((HEAP8[r7]&1)==0){HEAP8[r7]=r6>>>1;return}else{HEAP32[r1+4>>2]=r4;return}}if((1073741806-r9|0)>>>0<(r4-r9|0)>>>0){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}if((r10&1)==0){r17=r1+4|0}else{r17=HEAP32[r1+8>>2]}do{if(r9>>>0<536870887){r10=r9<<1;r6=r4>>>0<r10>>>0?r10:r4;if(r6>>>0<2){r18=2;break}r18=r6+4&-4}else{r18=1073741807}}while(0);r6=r18<<2;r10=(r6|0)==0?1:r6;while(1){r19=_malloc(r10);if((r19|0)!=0){break}r6=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r6|0)==0){r3=33;break}FUNCTION_TABLE[r6]()}if(r3==33){r3=___cxa_allocate_exception(4);HEAP32[r3>>2]=9376;___cxa_throw(r3,16152,68)}r3=r19;if((r4|0)!=0){r19=r2;r2=r4;r10=r3;while(1){r6=r2-1|0;HEAP32[r10>>2]=HEAP32[r19>>2];if((r6|0)==0){break}else{r19=r19+4|0;r2=r6;r10=r10+4|0}}}if(!((r9|0)==1|(r17|0)==0)){_free(r17)}HEAP32[r1+8>>2]=r3;HEAP32[r1>>2]=r18|1;HEAP32[r1+4>>2]=r4;HEAP32[r3+(r4<<2)>>2]=0;return}function __ZNSt3__112basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE7reserveEj(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=r1;r3=HEAP8[r2];if((r3&1)==0){r4=1;r5=r3}else{r3=HEAP32[r1>>2];r4=(r3&-2)-1|0;r5=r3&255}r3=r5&255;r6=(r3&1|0)==0;if(r6){r7=r3>>>1}else{r7=HEAP32[r1+4>>2]}if(r7>>>0<2){r8=2}else{r8=r7+4&-4}r9=r8-1|0;if((r9|0)==(r4|0)){return}if((r9|0)==1){r10=r1+4|0;r11=HEAP32[r1+8>>2];r12=1;r13=0}else{r14=r8<<2;r15=(r14|0)==0?1:r14;L17:do{if(r9>>>0>r4>>>0){while(1){r14=_malloc(r15);if((r14|0)!=0){r16=r14;break L17}r14=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r14|0)==0){break}FUNCTION_TABLE[r14]()}r14=___cxa_allocate_exception(4);HEAP32[r14>>2]=9376;___cxa_throw(r14,16152,68)}else{while(1){r14=_malloc(r15);if((r14|0)!=0){r16=r14;break L17}r14=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r14|0)==0){break}FUNCTION_TABLE[r14]()}r14=___cxa_allocate_exception(4);HEAP32[r14>>2]=9376;___cxa_throw(r14,16152,68)}}while(0);r15=r5&1;if(r15<<24>>24==0){r17=r1+4|0}else{r17=HEAP32[r1+8>>2]}r10=r16;r11=r17;r12=r15<<24>>24!=0;r13=1}r15=r10;if(r6){r18=r3>>>1}else{r18=HEAP32[r1+4>>2]}r3=r18+1|0;if((r3|0)!=0){r18=r11;r6=r3;r3=r15;while(1){r10=r6-1|0;HEAP32[r3>>2]=HEAP32[r18>>2];if((r10|0)==0){break}else{r18=r18+4|0;r6=r10;r3=r3+4|0}}}if(!(r12^1|(r11|0)==0)){_free(r11)}if(r13){HEAP32[r1>>2]=r8|1;HEAP32[r1+4>>2]=r7;HEAP32[r1+8>>2]=r15;return}else{HEAP8[r2]=r7<<1;return}}function __ZNSt3__112basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE9__grow_byEjjjjjj(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r8=0;if((1073741807-r2|0)>>>0<r3>>>0){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}if((HEAP8[r1]&1)==0){r9=r1+4|0}else{r9=HEAP32[r1+8>>2]}do{if(r2>>>0<536870887){r10=r3+r2|0;r11=r2<<1;r12=r10>>>0<r11>>>0?r11:r10;if(r12>>>0<2){r13=2;break}r13=r12+4&-4}else{r13=1073741807}}while(0);r3=r13<<2;r12=(r3|0)==0?1:r3;while(1){r14=_malloc(r12);if((r14|0)!=0){break}r3=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r3|0)==0){r8=17;break}FUNCTION_TABLE[r3]()}if(r8==17){r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=9376;___cxa_throw(r8,16152,68)}r8=r14;if((r5|0)!=0){r14=r9;r12=r5;r3=r8;while(1){r10=r12-1|0;HEAP32[r3>>2]=HEAP32[r14>>2];if((r10|0)==0){break}else{r14=r14+4|0;r12=r10;r3=r3+4|0}}}r3=r4-r6|0;if((r3|0)!=(r5|0)){r4=r9+(r6+r5<<2)|0;r6=r3-r5|0;r3=r8+(r7+r5<<2)|0;while(1){r5=r6-1|0;HEAP32[r3>>2]=HEAP32[r4>>2];if((r5|0)==0){break}else{r4=r4+4|0;r6=r5;r3=r3+4|0}}}if((r2|0)==1|(r9|0)==0){r15=r1+8|0;HEAP32[r15>>2]=r8;r16=r13|1;r17=r1|0;HEAP32[r17>>2]=r16;return}_free(r9);r15=r1+8|0;HEAP32[r15>>2]=r8;r16=r13|1;r17=r1|0;HEAP32[r17>>2]=r16;return}function __ZNSt3__18ios_base5clearEj(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+48|0;r5=r4;r6=r4+16;r7=r4+32;r8=(HEAP32[r1+24>>2]|0)==0;if(r8){HEAP32[r1+16>>2]=r2|1}else{HEAP32[r1+16>>2]=r2}if(((r8&1|r2)&HEAP32[r1+20>>2]|0)==0){STACKTOP=r4;return}r4=___cxa_allocate_exception(16);do{if((HEAP8[22112]|0)==0){if((___cxa_guard_acquire(22112)|0)==0){break}HEAP32[20080>>2]=10968}}while(0);r1=r6;r2=r7;r8=_strlen(6296);if(r8>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r8>>>0<11){HEAP8[r2]=r8<<1;r9=r7+1|0}else{r10=r8+16&-16;r11=(r10|0)==0?1:r10;while(1){r12=_malloc(r11);if((r12|0)!=0){r3=25;break}r13=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r13|0)==0){break}FUNCTION_TABLE[r13]()}if(r3==25){HEAP32[r7+8>>2]=r12;HEAP32[r7>>2]=r10|1;HEAP32[r7+4>>2]=r8;r9=r12;break}r11=___cxa_allocate_exception(4);HEAP32[r11>>2]=9376;___cxa_throw(r11,16152,68)}}while(0);_memcpy(r9,6296,r8)|0;HEAP8[r9+r8|0]=0;r8=r5;r9=HEAPU8[r2];if((r9&1|0)==0){r14=r9>>>1}else{r14=HEAP32[r7+4>>2]}if((r14|0)!=0){__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKcj(r7,6272,2)}FUNCTION_TABLE[HEAP32[HEAP32[20080>>2]+24>>2]](r5,20080,1);r14=HEAP8[r8];if((r14&1)==0){r15=r5+1|0}else{r15=HEAP32[r5+8>>2]}r9=r14&255;if((r9&1|0)==0){r16=r9>>>1}else{r16=HEAP32[r5+4>>2]}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEPKcj(r7,r15,r16);do{if((HEAP8[r8]&1)!=0){r16=HEAP32[r5+8>>2];if((r16|0)==0){break}_free(r16)}}while(0);HEAP32[r1>>2]=HEAP32[r2>>2];HEAP32[r1+4>>2]=HEAP32[r2+4>>2];HEAP32[r1+8>>2]=HEAP32[r2+8>>2];HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;r5=r4;HEAP32[r5>>2]=9440;r8=r4+4|0;r16=r8;do{if((r8|0)!=0){if((HEAP8[r1]&1)==0){r17=r6+1|0}else{r17=HEAP32[r6+8>>2]}r15=_strlen(r17);r9=r15+1|0;r14=r15+13|0;r12=(r14|0)==0?1:r14;while(1){r18=_malloc(r12);if((r18|0)!=0){r3=61;break}r14=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r14|0)==0){break}FUNCTION_TABLE[r14]()}if(r3==61){HEAP32[r18+4>>2]=r15;HEAP32[r18>>2]=r15;r12=r18+12|0;HEAP32[r16>>2]=r12;HEAP32[r18+8>>2]=0;_memcpy(r12,r17,r9)|0;break}r12=___cxa_allocate_exception(4);HEAP32[r12>>2]=9376;___cxa_throw(r12,16152,68)}}while(0);do{if((HEAP8[r1]&1)!=0){r17=HEAP32[r6+8>>2];if((r17|0)==0){break}_free(r17)}}while(0);do{if((HEAP8[r2]&1)!=0){r6=HEAP32[r7+8>>2];if((r6|0)==0){break}_free(r6)}}while(0);HEAP32[r5>>2]=11464;r7=r4+8|0;r2=_bitshift64Shl(20080,0,32);HEAP32[r7>>2]=r2&0|1;HEAP32[r7+4>>2]=tempRet0&-1;HEAP32[r5>>2]=10152;___cxa_throw(r4,16808,64)}function __ZNSt3__18ios_baseD2Ev(r1){var r2,r3,r4,r5;HEAP32[r1>>2]=10128;r2=HEAP32[r1+40>>2];r3=r1+32|0;r4=r1+36|0;if((r2|0)!=0){r5=r2;while(1){r2=r5-1|0;FUNCTION_TABLE[HEAP32[HEAP32[r3>>2]+(r2<<2)>>2]](0,r1,HEAP32[HEAP32[r4>>2]+(r2<<2)>>2]);if((r2|0)==0){break}else{r5=r2}}}r5=HEAP32[r1+28>>2];r2=r5+4|0;if(((tempValue=HEAP32[r2>>2],HEAP32[r2>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+8>>2]](r5)}_free(HEAP32[r3>>2]);_free(HEAP32[r4>>2]);_free(HEAP32[r1+48>>2]);_free(HEAP32[r1+60>>2]);return}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEED0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=11200;r2=HEAP32[r1+4>>2];r3=r2+4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)!=0){r4=r1;_free(r4);return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);r4=r1;_free(r4);return}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEED1Ev(r1){var r2;HEAP32[r1>>2]=11200;r2=HEAP32[r1+4>>2];r1=r2+4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)|0)!=0){return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);return}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE5imbueERKNS_6localeE(r1,r2){return}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE6setbufEPci(r1,r2,r3){return r1}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE7seekoffExNS_8ios_base7seekdirEj(r1,r2,r3,r4,r5,r6){r6=r1;HEAP32[r6>>2]=0;HEAP32[r6+4>>2]=0;r6=r1+8|0;HEAP32[r6>>2]=-1;HEAP32[r6+4>>2]=-1;return}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE7seekposENS_4fposI11__mbstate_tEEj(r1,r2,r3,r4){r4=STACKTOP;r2=r3;r3=STACKTOP;STACKTOP=STACKTOP+16|0;HEAP32[r3>>2]=HEAP32[r2>>2];HEAP32[r3+4>>2]=HEAP32[r2+4>>2];HEAP32[r3+8>>2]=HEAP32[r2+8>>2];HEAP32[r3+12>>2]=HEAP32[r2+12>>2];r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;r2=r1+8|0;HEAP32[r2>>2]=-1;HEAP32[r2+4>>2]=-1;STACKTOP=r4;return}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE4syncEv(r1){return 0}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE9showmanycEv(r1){return 0}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE6xsgetnEPci(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=r1;if((r3|0)<=0){r6=0;return r6}r7=r1+12|0;r8=r1+16|0;r9=r2;r2=0;while(1){r10=HEAP32[r7>>2];if(r10>>>0<HEAP32[r8>>2]>>>0){HEAP32[r7>>2]=r10+1;r11=HEAP8[r10]}else{r10=FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+40>>2]](r1);if((r10|0)==-1){r6=r2;r4=11;break}r11=r10&255}HEAP8[r9]=r11;r10=r2+1|0;if((r10|0)<(r3|0)){r9=r9+1|0;r2=r10}else{r6=r10;r4=9;break}}if(r4==11){return r6}else if(r4==9){return r6}}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE9underflowEv(r1){return-1}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE5uflowEv(r1){var r2,r3;if((FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+36>>2]](r1)|0)==-1){r2=-1;return r2}r3=r1+12|0;r1=HEAP32[r3>>2];HEAP32[r3>>2]=r1+1;r2=HEAPU8[r1];return r2}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE9pbackfailEi(r1,r2){return-1}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE6xsputnEPKci(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=r1;if((r3|0)<=0){r6=0;return r6}r7=r1+24|0;r8=r1+28|0;r9=0;r10=r2;while(1){r2=HEAP32[r7>>2];if(r2>>>0<HEAP32[r8>>2]>>>0){r11=HEAP8[r10];HEAP32[r7>>2]=r2+1;HEAP8[r2]=r11}else{if((FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+52>>2]](r1,HEAPU8[r10])|0)==-1){r6=r9;r4=9;break}}r11=r9+1|0;if((r11|0)<(r3|0)){r9=r11;r10=r10+1|0}else{r6=r11;r4=10;break}}if(r4==10){return r6}else if(r4==9){return r6}}function __ZNSt3__115basic_streambufIcNS_11char_traitsIcEEE8overflowEi(r1,r2){return-1}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEED0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=11128;r2=HEAP32[r1+4>>2];r3=r2+4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)|0)!=0){r4=r1;_free(r4);return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);r4=r1;_free(r4);return}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEED1Ev(r1){var r2;HEAP32[r1>>2]=11128;r2=HEAP32[r1+4>>2];r1=r2+4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)|0)!=0){return}FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2|0);return}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE5imbueERKNS_6localeE(r1,r2){return}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE6setbufEPwi(r1,r2,r3){return r1}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE7seekoffExNS_8ios_base7seekdirEj(r1,r2,r3,r4,r5,r6){r6=r1;HEAP32[r6>>2]=0;HEAP32[r6+4>>2]=0;r6=r1+8|0;HEAP32[r6>>2]=-1;HEAP32[r6+4>>2]=-1;return}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE7seekposENS_4fposI11__mbstate_tEEj(r1,r2,r3,r4){r4=STACKTOP;r2=r3;r3=STACKTOP;STACKTOP=STACKTOP+16|0;HEAP32[r3>>2]=HEAP32[r2>>2];HEAP32[r3+4>>2]=HEAP32[r2+4>>2];HEAP32[r3+8>>2]=HEAP32[r2+8>>2];HEAP32[r3+12>>2]=HEAP32[r2+12>>2];r2=r1;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;r2=r1+8|0;HEAP32[r2>>2]=-1;HEAP32[r2+4>>2]=-1;STACKTOP=r4;return}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE4syncEv(r1){return 0}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE9showmanycEv(r1){return 0}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE6xsgetnEPwi(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=r1;if((r3|0)<=0){r6=0;return r6}r7=r1+12|0;r8=r1+16|0;r9=r2;r2=0;while(1){r10=HEAP32[r7>>2];if(r10>>>0<HEAP32[r8>>2]>>>0){HEAP32[r7>>2]=r10+4;r11=HEAP32[r10>>2]}else{r10=FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+40>>2]](r1);if((r10|0)==-1){r6=r2;r4=9;break}else{r11=r10}}HEAP32[r9>>2]=r11;r10=r2+1|0;if((r10|0)<(r3|0)){r9=r9+4|0;r2=r10}else{r6=r10;r4=8;break}}if(r4==9){return r6}else if(r4==8){return r6}}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE9underflowEv(r1){return-1}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE5uflowEv(r1){var r2,r3;if((FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+36>>2]](r1)|0)==-1){r2=-1;return r2}r3=r1+12|0;r1=HEAP32[r3>>2];HEAP32[r3>>2]=r1+4;r2=HEAP32[r1>>2];return r2}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE9pbackfailEj(r1,r2){return-1}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE6xsputnEPKwi(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=r1;if((r3|0)<=0){r6=0;return r6}r7=r1+24|0;r8=r1+28|0;r9=0;r10=r2;while(1){r2=HEAP32[r7>>2];if(r2>>>0<HEAP32[r8>>2]>>>0){r11=HEAP32[r10>>2];HEAP32[r7>>2]=r2+4;HEAP32[r2>>2]=r11}else{if((FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+52>>2]](r1,HEAP32[r10>>2])|0)==-1){r6=r9;r4=9;break}}r11=r9+1|0;if((r11|0)<(r3|0)){r9=r11;r10=r10+4|0}else{r6=r11;r4=8;break}}if(r4==8){return r6}else if(r4==9){return r6}}function __ZNSt3__115basic_streambufIwNS_11char_traitsIwEEE8overflowEj(r1,r2){return-1}function __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEED0Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+8|0);if((r1|0)==0){return}_free(r1);return}function __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+8|0);return}function __ZTv0_n12_NSt3__113basic_istreamIcNS_11char_traitsIcEEED0Ev(r1){var r2,r3;r2=r1;r3=HEAP32[HEAP32[r1>>2]-12>>2];r1=r2+r3|0;__ZNSt3__18ios_baseD2Ev(r2+(r3+8)|0);if((r1|0)==0){return}_free(r1);return}function __ZTv0_n12_NSt3__113basic_istreamIcNS_11char_traitsIcEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+(HEAP32[HEAP32[r1>>2]-12>>2]+8)|0);return}function __ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEE5flushEv(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;r5=HEAP32[HEAP32[r4>>2]-12>>2];r6=r1;if((HEAP32[r6+(r5+24)>>2]|0)==0){STACKTOP=r2;return}r7=r3|0;HEAP8[r7]=0;HEAP32[r3+4>>2]=r1;do{if((HEAP32[r6+(r5+16)>>2]|0)==0){r1=HEAP32[r6+(r5+72)>>2];if((r1|0)==0){r8=r5}else{__ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEE5flushEv(r1);r8=HEAP32[HEAP32[r4>>2]-12>>2]}HEAP8[r7]=1;r1=HEAP32[r6+(r8+24)>>2];if((FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+24>>2]](r1)|0)!=-1){break}r1=HEAP32[HEAP32[r4>>2]-12>>2];__ZNSt3__18ios_base5clearEj(r6+r1|0,HEAP32[r6+(r1+16)>>2]|1)}}while(0);__ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEE6sentryD2Ev(r3);STACKTOP=r2;return}function __ZNSt3__113basic_istreamIwNS_11char_traitsIwEEED0Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+8|0);if((r1|0)==0){return}_free(r1);return}function __ZNSt3__113basic_istreamIwNS_11char_traitsIwEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+8|0);return}function __ZTv0_n12_NSt3__113basic_istreamIwNS_11char_traitsIwEEED0Ev(r1){var r2,r3;r2=r1;r3=HEAP32[HEAP32[r1>>2]-12>>2];r1=r2+r3|0;__ZNSt3__18ios_baseD2Ev(r2+(r3+8)|0);if((r1|0)==0){return}_free(r1);return}function __ZTv0_n12_NSt3__113basic_istreamIwNS_11char_traitsIwEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+(HEAP32[HEAP32[r1>>2]-12>>2]+8)|0);return}function __ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEE5flushEv(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1;r5=HEAP32[HEAP32[r4>>2]-12>>2];r6=r1;if((HEAP32[r6+(r5+24)>>2]|0)==0){STACKTOP=r2;return}r7=r3|0;HEAP8[r7]=0;HEAP32[r3+4>>2]=r1;do{if((HEAP32[r6+(r5+16)>>2]|0)==0){r1=HEAP32[r6+(r5+72)>>2];if((r1|0)==0){r8=r5}else{__ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEE5flushEv(r1);r8=HEAP32[HEAP32[r4>>2]-12>>2]}HEAP8[r7]=1;r1=HEAP32[r6+(r8+24)>>2];if((FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+24>>2]](r1)|0)!=-1){break}r1=HEAP32[HEAP32[r4>>2]-12>>2];__ZNSt3__18ios_base5clearEj(r6+r1|0,HEAP32[r6+(r1+16)>>2]|1)}}while(0);__ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEE6sentryD2Ev(r3);STACKTOP=r2;return}function __ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEED0Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+4|0);if((r1|0)==0){return}_free(r1);return}function __ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+4|0);return}function __ZTv0_n12_NSt3__113basic_ostreamIcNS_11char_traitsIcEEED0Ev(r1){var r2,r3;r2=r1;r3=HEAP32[HEAP32[r1>>2]-12>>2];r1=r2+r3|0;__ZNSt3__18ios_baseD2Ev(r2+(r3+4)|0);if((r1|0)==0){return}_free(r1);return}function __ZTv0_n12_NSt3__113basic_ostreamIcNS_11char_traitsIcEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+(HEAP32[HEAP32[r1>>2]-12>>2]+4)|0);return}function __ZNSt3__113basic_ostreamIcNS_11char_traitsIcEEE6sentryD2Ev(r1){var r2,r3,r4;r2=r1+4|0;r1=HEAP32[r2>>2];r3=HEAP32[HEAP32[r1>>2]-12>>2];r4=r1;if((HEAP32[r4+(r3+24)>>2]|0)==0){return}if((HEAP32[r4+(r3+16)>>2]|0)!=0){return}if((HEAP32[r4+(r3+4)>>2]&8192|0)==0){return}if(__ZSt18uncaught_exceptionv()){return}r3=HEAP32[r2>>2];r4=HEAP32[r3+(HEAP32[HEAP32[r3>>2]-12>>2]+24)>>2];if((FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]+24>>2]](r4)|0)!=-1){return}r4=HEAP32[r2>>2];r2=HEAP32[HEAP32[r4>>2]-12>>2];r3=r4;__ZNSt3__18ios_base5clearEj(r3+r2|0,HEAP32[r3+(r2+16)>>2]|1);return}function __ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEED0Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+4|0);if((r1|0)==0){return}_free(r1);return}function __ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+4|0);return}function __ZTv0_n12_NSt3__113basic_ostreamIwNS_11char_traitsIwEEED0Ev(r1){var r2,r3;r2=r1;r3=HEAP32[HEAP32[r1>>2]-12>>2];r1=r2+r3|0;__ZNSt3__18ios_baseD2Ev(r2+(r3+4)|0);if((r1|0)==0){return}_free(r1);return}function __ZTv0_n12_NSt3__113basic_ostreamIwNS_11char_traitsIwEEED1Ev(r1){__ZNSt3__18ios_baseD2Ev(r1+(HEAP32[HEAP32[r1>>2]-12>>2]+4)|0);return}function __ZNSt3__113basic_ostreamIwNS_11char_traitsIwEEE6sentryD2Ev(r1){var r2,r3,r4;r2=r1+4|0;r1=HEAP32[r2>>2];r3=HEAP32[HEAP32[r1>>2]-12>>2];r4=r1;if((HEAP32[r4+(r3+24)>>2]|0)==0){return}if((HEAP32[r4+(r3+16)>>2]|0)!=0){return}if((HEAP32[r4+(r3+4)>>2]&8192|0)==0){return}if(__ZSt18uncaught_exceptionv()){return}r3=HEAP32[r2>>2];r4=HEAP32[r3+(HEAP32[HEAP32[r3>>2]-12>>2]+24)>>2];if((FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]+24>>2]](r4)|0)!=-1){return}r4=HEAP32[r2>>2];r2=HEAP32[HEAP32[r4>>2]-12>>2];r3=r4;__ZNSt3__18ios_base5clearEj(r3+r2|0,HEAP32[r3+(r2+16)>>2]|1);return}function __ZNKSt3__119__iostream_category4nameEv(r1){return 6712}function __ZNKSt3__119__iostream_category7messageEi(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r2=0;if((r3|0)==1){__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(r1,7040,35);return}r4=_strerror(r3);r3=_strlen(r4);if(r3>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r3>>>0<11){HEAP8[r1]=r3<<1;r5=r1+1|0}else{r6=r3+16&-16;r7=(r6|0)==0?1:r6;while(1){r8=_malloc(r7);if((r8|0)!=0){r2=17;break}r9=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r9|0)==0){break}FUNCTION_TABLE[r9]()}if(r2==17){HEAP32[r1+8>>2]=r8;HEAP32[r1>>2]=r6|1;HEAP32[r1+4>>2]=r3;r5=r8;break}r7=___cxa_allocate_exception(4);HEAP32[r7>>2]=9376;___cxa_throw(r7,16152,68)}}while(0);_memcpy(r5,r4,r3)|0;HEAP8[r5+r3|0]=0;return}function __ZNSt3__119__iostream_categoryD1Ev(r1){return}function __ZNSt3__18ios_base7failureD0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=9440;r2=r1+4|0;r3=HEAP32[r2>>2]-4|0;if(((tempValue=HEAP32[r3>>2],HEAP32[r3>>2]=tempValue+ -1,tempValue)-1|0)>=0){r4=r1;_free(r4);return}r3=HEAP32[r2>>2]-12|0;if((r3|0)==0){r4=r1;_free(r4);return}_free(r3);r4=r1;_free(r4);return}function __ZNSt3__18ios_base7failureD2Ev(r1){var r2;HEAP32[r1>>2]=9440;r2=r1+4|0;r1=HEAP32[r2>>2]-4|0;if(((tempValue=HEAP32[r1>>2],HEAP32[r1>>2]=tempValue+ -1,tempValue)-1|0)>=0){return}r1=HEAP32[r2>>2]-12|0;if((r1|0)==0){return}_free(r1);return}function __ZNSt3__18ios_baseD0Ev(r1){__ZNSt3__18ios_baseD2Ev(r1);if((r1|0)==0){return}_free(r1);return}function __ZNSt3__119__iostream_categoryD0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__17collateIcED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__17collateIcED1Ev(r1){return}function __ZNSt3__16locale5facetD2Ev(r1){return}function __ZNKSt3__17collateIcE10do_compareEPKcS3_S3_S3_(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11;r1=0;L1:do{if((r4|0)==(r5|0)){r6=r2}else{r7=r2;r8=r4;while(1){if((r7|0)==(r3|0)){r9=-1;r1=9;break}r10=HEAP8[r7];r11=HEAP8[r8];if(r10<<24>>24<r11<<24>>24){r9=-1;r1=11;break}if(r11<<24>>24<r10<<24>>24){r9=1;r1=10;break}r10=r7+1|0;r11=r8+1|0;if((r11|0)==(r5|0)){r6=r10;break L1}else{r7=r10;r8=r11}}if(r1==9){return r9}else if(r1==10){return r9}else if(r1==11){return r9}}}while(0);r9=(r6|0)!=(r3|0)|0;return r9}function __ZNKSt3__17collateIcE12do_transformEPKcS3_(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12;r2=0;r5=r3;r6=r4-r5|0;if(r6>>>0>4294967279){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r6>>>0<11){HEAP8[r1]=r6<<1;r7=r1+1|0}else{r8=r6+16&-16;r9=(r8|0)==0?1:r8;while(1){r10=_malloc(r9);if((r10|0)!=0){r2=16;break}r11=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r11|0)==0){break}FUNCTION_TABLE[r11]()}if(r2==16){HEAP32[r1+8>>2]=r10;HEAP32[r1>>2]=r8|1;HEAP32[r1+4>>2]=r6;r7=r10;break}r9=___cxa_allocate_exception(4);HEAP32[r9>>2]=9376;___cxa_throw(r9,16152,68)}}while(0);if((r3|0)==(r4|0)){r12=r7;HEAP8[r12]=0;return}r10=r4+ -r5|0;r5=r7;r6=r3;while(1){HEAP8[r5]=HEAP8[r6];r3=r6+1|0;if((r3|0)==(r4|0)){break}else{r5=r5+1|0;r6=r3}}r12=r7+r10|0;HEAP8[r12]=0;return}function __ZNKSt3__17collateIcE7do_hashEPKcS3_(r1,r2,r3){var r4,r5,r6,r7;if((r2|0)==(r3|0)){r4=0;return r4}else{r5=r2;r6=0}while(1){r2=HEAP8[r5]+(r6<<4)|0;r1=r2&-268435456;r7=(r1>>>24|r1)^r2;r2=r5+1|0;if((r2|0)==(r3|0)){r4=r7;break}else{r5=r2;r6=r7}}return r4}function __ZNSt3__17collateIwED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__17collateIwED1Ev(r1){return}function __ZNKSt3__17collateIwE10do_compareEPKwS3_S3_S3_(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11;r1=0;L1:do{if((r4|0)==(r5|0)){r6=r2}else{r7=r2;r8=r4;while(1){if((r7|0)==(r3|0)){r9=-1;r1=10;break}r10=HEAP32[r7>>2];r11=HEAP32[r8>>2];if((r10|0)<(r11|0)){r9=-1;r1=9;break}if((r11|0)<(r10|0)){r9=1;r1=11;break}r10=r7+4|0;r11=r8+4|0;if((r11|0)==(r5|0)){r6=r10;break L1}else{r7=r10;r8=r11}}if(r1==10){return r9}else if(r1==11){return r9}else if(r1==9){return r9}}}while(0);r9=(r6|0)!=(r3|0)|0;return r9}function __ZNKSt3__17collateIwE12do_transformEPKwS3_(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=0;r5=r3;r6=r4-r5|0;r7=r6>>2;if(r7>>>0>1073741807){__ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv()}do{if(r7>>>0<2){HEAP8[r1]=r6>>>1;r8=r1+4|0}else{r9=r7+4&-4;r10=r9<<2;r11=(r10|0)==0?1:r10;while(1){r12=_malloc(r11);if((r12|0)!=0){r2=16;break}r10=(tempValue=HEAP32[22032>>2],HEAP32[22032>>2]=tempValue+0,tempValue);if((r10|0)==0){break}FUNCTION_TABLE[r10]()}if(r2==16){r11=r12;HEAP32[r1+8>>2]=r11;HEAP32[r1>>2]=r9|1;HEAP32[r1+4>>2]=r7;r8=r11;break}r11=___cxa_allocate_exception(4);HEAP32[r11>>2]=9376;___cxa_throw(r11,16152,68)}}while(0);if((r3|0)==(r4|0)){r13=r8;HEAP32[r13>>2]=0;return}r7=(r4-4+ -r5|0)>>>2;r5=r8;r1=r3;while(1){HEAP32[r5>>2]=HEAP32[r1>>2];r3=r1+4|0;if((r3|0)==(r4|0)){break}else{r5=r5+4|0;r1=r3}}r13=r8+(r7+1<<2)|0;HEAP32[r13>>2]=0;return}function __ZNKSt3__17collateIwE7do_hashEPKwS3_(r1,r2,r3){var r4,r5,r6,r7;if((r2|0)==(r3|0)){r4=0;return r4}else{r5=r2;r6=0}while(1){r2=HEAP32[r5>>2]+(r6<<4)|0;r1=r2&-268435456;r7=(r1>>>24|r1)^r2;r2=r5+4|0;if((r2|0)==(r3|0)){r4=r7;break}else{r5=r2;r6=r7}}return r4}function __ZNSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEED1Ev(r1){return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRb(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r8=STACKTOP;STACKTOP=STACKTOP+88|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+16;r11=r8+32;r12=r8+40;r13=r8+48;r14=r8+56;r15=r8+64;if((HEAP32[r5+4>>2]&1|0)==0){HEAP32[r11>>2]=-1;r16=HEAP32[HEAP32[r2>>2]+16>>2];r17=r3|0;HEAP32[r13>>2]=HEAP32[r17>>2];HEAP32[r14>>2]=HEAP32[r4>>2];FUNCTION_TABLE[r16](r12,r2,r13,r14,r5,r6,r11);r14=HEAP32[r12>>2];HEAP32[r17>>2]=r14;r17=HEAP32[r11>>2];if((r17|0)==0){HEAP8[r7]=0}else if((r17|0)==1){HEAP8[r7]=1}else{HEAP8[r7]=1;HEAP32[r6>>2]=4}HEAP32[r1>>2]=r14;STACKTOP=r8;return}r14=r5+28|0;r5=HEAP32[r14>>2];r17=r5+4|0;tempValue=HEAP32[r17>>2],HEAP32[r17>>2]=tempValue+1,tempValue;if((HEAP32[21504>>2]|0)!=-1){HEAP32[r10>>2]=21504;HEAP32[r10+4>>2]=26;HEAP32[r10+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(21504,r10)}r10=HEAP32[21508>>2]-1|0;r17=HEAP32[r5+8>>2];do{if(HEAP32[r5+12>>2]-r17>>2>>>0>r10>>>0){r11=HEAP32[r17+(r10<<2)>>2];if((r11|0)==0){break}r12=r11;r11=r5+4|0;if(((tempValue=HEAP32[r11>>2],HEAP32[r11>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+8>>2]](r5)}r11=HEAP32[r14>>2];r13=r11+4|0;tempValue=HEAP32[r13>>2],HEAP32[r13>>2]=tempValue+1,tempValue;if((HEAP32[21120>>2]|0)!=-1){HEAP32[r9>>2]=21120;HEAP32[r9+4>>2]=26;HEAP32[r9+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(21120,r9)}r13=HEAP32[21124>>2]-1|0;r2=HEAP32[r11+8>>2];do{if(HEAP32[r11+12>>2]-r2>>2>>>0>r13>>>0){r16=HEAP32[r2+(r13<<2)>>2];if((r16|0)==0){break}r18=r16;r19=r11+4|0;if(((tempValue=HEAP32[r19>>2],HEAP32[r19>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r11>>2]+8>>2]](r11)}r19=r15|0;r20=r16;FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+24>>2]](r19,r18);r16=r15+12|0;FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+28>>2]](r16,r18);HEAP8[r7]=(__ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEPKNS_12basic_stringIcS3_NS_9allocatorIcEEEENS_5ctypeIcEEEET0_RT_SE_SD_SD_RKT1_Rjb(r3,HEAP32[r4>>2],r19,r15+24|0,r12,r6,1)|0)==(r19|0)|0;HEAP32[r1>>2]=HEAP32[r3>>2];do{if((HEAP8[r16]&1)!=0){r19=HEAP32[r15+20>>2];if((r19|0)==0){break}_free(r19)}}while(0);if((HEAP8[r15]&1)==0){STACKTOP=r8;return}r16=HEAP32[r15+8>>2];if((r16|0)==0){STACKTOP=r8;return}_free(r16);STACKTOP=r8;return}}while(0);r12=___cxa_allocate_exception(4);HEAP32[r12>>2]=9408;___cxa_throw(r12,16168,548)}}while(0);r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=9408;___cxa_throw(r8,16168,548)}function __ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEPKNS_12basic_stringIcS3_NS_9allocatorIcEEEENS_5ctypeIcEEEET0_RT_SE_SD_SD_RKT1_Rjb(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+104|0;r10=(r4-r3|0)/12&-1;r11=r9|0;do{if(r10>>>0>100){r12=_malloc(r10);if((r12|0)!=0){r13=r12;r14=r12;break}r12=___cxa_allocate_exception(4);HEAP32[r12>>2]=9376;___cxa_throw(r12,16152,68)}else{r13=r11;r14=0}}while(0);r11=(r3|0)==(r4|0);if(r11){r15=r10;r16=0}else{r12=r10;r10=0;r17=r13;r18=r3;while(1){r19=HEAPU8[r18];if((r19&1|0)==0){r20=r19>>>1}else{r20=HEAP32[r18+4>>2]}if((r20|0)==0){HEAP8[r17]=2;r21=r10+1|0;r22=r12-1|0}else{HEAP8[r17]=1;r21=r10;r22=r12}r19=r18+12|0;if((r19|0)==(r4|0)){r15=r22;r16=r21;break}else{r12=r22;r10=r21;r17=r17+1|0;r18=r19}}}r18=r1|0;r1=r5;r17=0;r21=r16;r16=r15;r15=r2;L18:while(1){r2=HEAP32[r18>>2];do{if((r2|0)==0){r23=0}else{if((HEAP32[r2+12>>2]|0)!=(HEAP32[r2+16>>2]|0)){r23=r2;break}if((FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+36>>2]](r2)|0)==-1){HEAP32[r18>>2]=0;r23=0;break}else{r23=HEAP32[r18>>2];break}}}while(0);r2=(r23|0)==0;if((r15|0)==0){r24=r23;r25=0}else{if((HEAP32[r15+12>>2]|0)==(HEAP32[r15+16>>2]|0)){r10=(FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+36>>2]](r15)|0)==-1;r26=r10?0:r15}else{r26=r15}r24=HEAP32[r18>>2];r25=r26}r27=(r25|0)==0;if(!((r2^r27)&(r16|0)!=0)){break}r2=HEAP32[r24+12>>2];if((r2|0)==(HEAP32[r24+16>>2]|0)){r28=FUNCTION_TABLE[HEAP32[HEAP32[r24>>2]+36>>2]](r24)&255}else{r28=HEAP8[r2]}if(r7){r29=r28}else{r29=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+12>>2]](r5,r28)}r2=r17+1|0;if(r11){r17=r2;r21=r21;r16=r16;r15=r25;continue}L45:do{if(r7){r10=r16;r22=r21;r12=r13;r20=0;r19=r3;while(1){do{if((HEAP8[r12]|0)==1){r30=HEAP8[r19];if((r30&1)==0){r31=r19+1|0}else{r31=HEAP32[r19+8>>2]}if(r29<<24>>24!=(HEAP8[r31+r17|0]|0)){HEAP8[r12]=0;r32=r20;r33=r22;r34=r10-1|0;break}r35=r30&255;if((r35&1|0)==0){r36=r35>>>1}else{r36=HEAP32[r19+4>>2]}if((r36|0)!=(r2|0)){r32=1;r33=r22;r34=r10;break}HEAP8[r12]=2;r32=1;r33=r22+1|0;r34=r10-1|0}else{r32=r20;r33=r22;r34=r10}}while(0);r35=r19+12|0;if((r35|0)==(r4|0)){r37=r34;r38=r33;r39=r32;break L45}r10=r34;r22=r33;r12=r12+1|0;r20=r32;r19=r35}}else{r19=r16;r20=r21;r12=r13;r22=0;r10=r3;while(1){do{if((HEAP8[r12]|0)==1){r35=r10;if((HEAP8[r35]&1)==0){r40=r10+1|0}else{r40=HEAP32[r10+8>>2]}if(r29<<24>>24!=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+12>>2]](r5,HEAP8[r40+r17|0])<<24>>24){HEAP8[r12]=0;r41=r22;r42=r20;r43=r19-1|0;break}r30=HEAPU8[r35];if((r30&1|0)==0){r44=r30>>>1}else{r44=HEAP32[r10+4>>2]}if((r44|0)!=(r2|0)){r41=1;r42=r20;r43=r19;break}HEAP8[r12]=2;r41=1;r42=r20+1|0;r43=r19-1|0}else{r41=r22;r42=r20;r43=r19}}while(0);r30=r10+12|0;if((r30|0)==(r4|0)){r37=r43;r38=r42;r39=r41;break L45}r19=r43;r20=r42;r12=r12+1|0;r22=r41;r10=r30}}}while(0);if(!r39){r17=r2;r21=r38;r16=r37;r15=r25;continue}r10=HEAP32[r18>>2];r22=r10+12|0;r12=HEAP32[r22>>2];if((r12|0)==(HEAP32[r10+16>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r10>>2]+40>>2]](r10)}else{HEAP32[r22>>2]=r12+1}if((r38+r37|0)>>>0<2){r17=r2;r21=r38;r16=r37;r15=r25;continue}else{r45=r38;r46=r13;r47=r3}while(1){do{if((HEAP8[r46]|0)==2){r12=HEAPU8[r47];if((r12&1|0)==0){r48=r12>>>1}else{r48=HEAP32[r47+4>>2]}if((r48|0)==(r2|0)){r49=r45;break}HEAP8[r46]=0;r49=r45-1|0}else{r49=r45}}while(0);r12=r47+12|0;if((r12|0)==(r4|0)){r17=r2;r21=r49;r16=r37;r15=r25;continue L18}else{r45=r49;r46=r46+1|0;r47=r12}}}do{if((r24|0)==0){r50=0}else{if((HEAP32[r24+12>>2]|0)!=(HEAP32[r24+16>>2]|0)){r50=r24;break}if((FUNCTION_TABLE[HEAP32[HEAP32[r24>>2]+36>>2]](r24)|0)==-1){HEAP32[r18>>2]=0;r50=0;break}else{r50=HEAP32[r18>>2];break}}}while(0);r18=(r50|0)==0;do{if(r27){r8=90}else{if((HEAP32[r25+12>>2]|0)!=(HEAP32[r25+16>>2]|0)){if(r18){break}else{r8=92;break}}if((FUNCTION_TABLE[HEAP32[HEAP32[r25>>2]+36>>2]](r25)|0)==-1){r8=90;break}if(!r18){r8=92}}}while(0);if(r8==90){if(r18){r8=92}}if(r8==92){HEAP32[r6>>2]=HEAP32[r6>>2]|2}L120:do{if(r11){r8=97}else{r18=r3;r25=r13;while(1){if((HEAP8[r25]|0)==2){r51=r18;break L120}r27=r18+12|0;if((r27|0)==(r4|0)){r8=97;break L120}r18=r27;r25=r25+1|0}}}while(0);if(r8==97){HEAP32[r6>>2]=HEAP32[r6>>2]|4;r51=r4}if((r14|0)==0){STACKTOP=r9;return r51}_free(r14);STACKTOP=r9;return r51}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRl(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+256|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+56;r12=r8+72;r13=r8+80;r14=r8+240;r15=r8+248;r16=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r17=r10;r18=r11;r19=HEAP32[r5+4>>2]&74;if((r19|0)==8){r20=16}else if((r19|0)==0){r20=0}else if((r19|0)==64){r20=8}else{r20=10}__ZNSt3__19__num_getIcE17__stage2_int_prepERNS_8ios_baseEPcRc(r10,r5,r4,r9);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r11;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,10);if((HEAP8[r18]&1)==0){r19=r5+1|0;r21=r19;r22=r19;r23=r11+8|0}else{r19=r11+8|0;r21=HEAP32[r19>>2];r22=r5+1|0;r23=r19}HEAP32[r12>>2]=r21;r19=r13|0;HEAP32[r14>>2]=r19;HEAP32[r15>>2]=0;r5=r11|0;r24=r11+4|0;r25=HEAP8[r9];r9=r21;r21=r16;r16=r3;L11:while(1){do{if((r21|0)==0){r26=0}else{if((HEAP32[r21+12>>2]|0)!=(HEAP32[r21+16>>2]|0)){r26=r21;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)|0)==-1;r26=r3?0:r21}}while(0);r27=(r26|0)==0;do{if((r16|0)==0){r2=19}else{if((HEAP32[r16+12>>2]|0)!=(HEAP32[r16+16>>2]|0)){if(r27){r28=0;r29=r16;break}else{r30=r9;r31=r16;r32=0;break L11}}if((FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+36>>2]](r16)|0)==-1){r2=19;break}if(r27){r28=0;r29=r16}else{r30=r9;r31=r16;r32=0;break L11}}}while(0);if(r2==19){r2=0;if(r27){r30=r9;r31=0;r32=1;break}else{r28=1;r29=0}}r3=HEAPU8[r18];r33=(r3&1|0)==0;r34=HEAP32[r24>>2];r35=r3>>>1;if((HEAP32[r12>>2]-r9|0)==((r33?r35:r34)|0)){r3=r33?r35:r34;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r3<<1);if((HEAP8[r18]&1)==0){r36=10}else{r36=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r36);if((HEAP8[r18]&1)==0){r37=r22}else{r37=HEAP32[r23>>2]}HEAP32[r12>>2]=r37+r3;r38=r37}else{r38=r9}r3=r26+12|0;r34=HEAP32[r3>>2];r35=r26+16|0;if((r34|0)==(HEAP32[r35>>2]|0)){r39=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)&255}else{r39=HEAP8[r34]}if((__ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r39,r20,r38,r12,r15,r25,r10,r19,r14,r4)|0)!=0){r30=r38;r31=r29;r32=r28;break}r34=HEAP32[r3>>2];if((r34|0)==(HEAP32[r35>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r9=r38;r21=r26;r16=r29;continue}else{HEAP32[r3>>2]=r34+1;r9=r38;r21=r26;r16=r29;continue}}r29=HEAPU8[r17];if((r29&1|0)==0){r40=r29>>>1}else{r40=HEAP32[r10+4>>2]}do{if((r40|0)!=0){r29=HEAP32[r14>>2];if((r29-r13|0)>=160){break}r16=HEAP32[r15>>2];HEAP32[r14>>2]=r29+4;HEAP32[r29>>2]=r16}}while(0);HEAP32[r7>>2]=__ZNSt3__125__num_get_signed_integralIlEET_PKcS3_Rji(r30,HEAP32[r12>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r10,r19,HEAP32[r14>>2],r6);do{if(r27){r41=0}else{if((HEAP32[r26+12>>2]|0)!=(HEAP32[r26+16>>2]|0)){r41=r26;break}r14=(FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)|0)==-1;r41=r14?0:r26}}while(0);r26=(r41|0)==0;do{if(r32){r2=61}else{if((HEAP32[r31+12>>2]|0)==(HEAP32[r31+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)==-1){r2=61;break}}if(!(r26^(r31|0)==0)){r2=63}}}while(0);if(r2==61){if(r26){r2=63}}if(r2==63){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r41;do{if((HEAP8[r18]&1)!=0){r41=HEAP32[r11+8>>2];if((r41|0)==0){break}_free(r41)}}while(0);if((HEAP8[r17]&1)==0){STACKTOP=r8;return}r17=HEAP32[r10+8>>2];if((r17|0)==0){STACKTOP=r8;return}_free(r17);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRx(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+256|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+56;r12=r8+72;r13=r8+80;r14=r8+240;r15=r8+248;r16=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r17=r10;r18=r11;r19=HEAP32[r5+4>>2]&74;if((r19|0)==64){r20=8}else if((r19|0)==8){r20=16}else if((r19|0)==0){r20=0}else{r20=10}__ZNSt3__19__num_getIcE17__stage2_int_prepERNS_8ios_baseEPcRc(r10,r5,r4,r9);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r11;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,10);if((HEAP8[r18]&1)==0){r19=r5+1|0;r21=r19;r22=r19;r23=r11+8|0}else{r19=r11+8|0;r21=HEAP32[r19>>2];r22=r5+1|0;r23=r19}HEAP32[r12>>2]=r21;r19=r13|0;HEAP32[r14>>2]=r19;HEAP32[r15>>2]=0;r5=r11|0;r24=r11+4|0;r25=HEAP8[r9];r9=r21;r21=r16;r16=r3;L11:while(1){do{if((r21|0)==0){r26=0}else{if((HEAP32[r21+12>>2]|0)!=(HEAP32[r21+16>>2]|0)){r26=r21;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)|0)==-1;r26=r3?0:r21}}while(0);r27=(r26|0)==0;do{if((r16|0)==0){r2=19}else{if((HEAP32[r16+12>>2]|0)!=(HEAP32[r16+16>>2]|0)){if(r27){r28=0;r29=r16;break}else{r30=r9;r31=r16;r32=0;break L11}}if((FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+36>>2]](r16)|0)==-1){r2=19;break}if(r27){r28=0;r29=r16}else{r30=r9;r31=r16;r32=0;break L11}}}while(0);if(r2==19){r2=0;if(r27){r30=r9;r31=0;r32=1;break}else{r28=1;r29=0}}r3=HEAPU8[r18];r33=(r3&1|0)==0;r34=HEAP32[r24>>2];r35=r3>>>1;if((HEAP32[r12>>2]-r9|0)==((r33?r35:r34)|0)){r3=r33?r35:r34;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r3<<1);if((HEAP8[r18]&1)==0){r36=10}else{r36=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r36);if((HEAP8[r18]&1)==0){r37=r22}else{r37=HEAP32[r23>>2]}HEAP32[r12>>2]=r37+r3;r38=r37}else{r38=r9}r3=r26+12|0;r34=HEAP32[r3>>2];r35=r26+16|0;if((r34|0)==(HEAP32[r35>>2]|0)){r39=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)&255}else{r39=HEAP8[r34]}if((__ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r39,r20,r38,r12,r15,r25,r10,r19,r14,r4)|0)!=0){r30=r38;r31=r29;r32=r28;break}r34=HEAP32[r3>>2];if((r34|0)==(HEAP32[r35>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r9=r38;r21=r26;r16=r29;continue}else{HEAP32[r3>>2]=r34+1;r9=r38;r21=r26;r16=r29;continue}}r29=HEAPU8[r17];if((r29&1|0)==0){r40=r29>>>1}else{r40=HEAP32[r10+4>>2]}do{if((r40|0)!=0){r29=HEAP32[r14>>2];if((r29-r13|0)>=160){break}r16=HEAP32[r15>>2];HEAP32[r14>>2]=r29+4;HEAP32[r29>>2]=r16}}while(0);r15=__ZNSt3__125__num_get_signed_integralIxEET_PKcS3_Rji(r30,HEAP32[r12>>2],r6,r20);HEAP32[r7>>2]=r15;HEAP32[r7+4>>2]=tempRet0;__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r10,r19,HEAP32[r14>>2],r6);do{if(r27){r41=0}else{if((HEAP32[r26+12>>2]|0)!=(HEAP32[r26+16>>2]|0)){r41=r26;break}r14=(FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)|0)==-1;r41=r14?0:r26}}while(0);r26=(r41|0)==0;do{if(r32){r2=61}else{if((HEAP32[r31+12>>2]|0)==(HEAP32[r31+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)==-1){r2=61;break}}if(!(r26^(r31|0)==0)){r2=63}}}while(0);if(r2==61){if(r26){r2=63}}if(r2==63){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r41;do{if((HEAP8[r18]&1)!=0){r41=HEAP32[r11+8>>2];if((r41|0)==0){break}_free(r41)}}while(0);if((HEAP8[r17]&1)==0){STACKTOP=r8;return}r17=HEAP32[r10+8>>2];if((r17|0)==0){STACKTOP=r8;return}_free(r17);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRt(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+256|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+56;r12=r8+72;r13=r8+80;r14=r8+240;r15=r8+248;r16=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r17=r10;r18=r11;r19=HEAP32[r5+4>>2]&74;if((r19|0)==0){r20=0}else if((r19|0)==8){r20=16}else if((r19|0)==64){r20=8}else{r20=10}__ZNSt3__19__num_getIcE17__stage2_int_prepERNS_8ios_baseEPcRc(r10,r5,r4,r9);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r11;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,10);if((HEAP8[r18]&1)==0){r19=r5+1|0;r21=r19;r22=r19;r23=r11+8|0}else{r19=r11+8|0;r21=HEAP32[r19>>2];r22=r5+1|0;r23=r19}HEAP32[r12>>2]=r21;r19=r13|0;HEAP32[r14>>2]=r19;HEAP32[r15>>2]=0;r5=r11|0;r24=r11+4|0;r25=HEAP8[r9];r9=r21;r21=r16;r16=r3;L11:while(1){do{if((r21|0)==0){r26=0}else{if((HEAP32[r21+12>>2]|0)!=(HEAP32[r21+16>>2]|0)){r26=r21;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)|0)==-1;r26=r3?0:r21}}while(0);r27=(r26|0)==0;do{if((r16|0)==0){r2=19}else{if((HEAP32[r16+12>>2]|0)!=(HEAP32[r16+16>>2]|0)){if(r27){r28=0;r29=r16;break}else{r30=r9;r31=r16;r32=0;break L11}}if((FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+36>>2]](r16)|0)==-1){r2=19;break}if(r27){r28=0;r29=r16}else{r30=r9;r31=r16;r32=0;break L11}}}while(0);if(r2==19){r2=0;if(r27){r30=r9;r31=0;r32=1;break}else{r28=1;r29=0}}r3=HEAPU8[r18];r33=(r3&1|0)==0;r34=HEAP32[r24>>2];r35=r3>>>1;if((HEAP32[r12>>2]-r9|0)==((r33?r35:r34)|0)){r3=r33?r35:r34;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r3<<1);if((HEAP8[r18]&1)==0){r36=10}else{r36=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r36);if((HEAP8[r18]&1)==0){r37=r22}else{r37=HEAP32[r23>>2]}HEAP32[r12>>2]=r37+r3;r38=r37}else{r38=r9}r3=r26+12|0;r34=HEAP32[r3>>2];r35=r26+16|0;if((r34|0)==(HEAP32[r35>>2]|0)){r39=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)&255}else{r39=HEAP8[r34]}if((__ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r39,r20,r38,r12,r15,r25,r10,r19,r14,r4)|0)!=0){r30=r38;r31=r29;r32=r28;break}r34=HEAP32[r3>>2];if((r34|0)==(HEAP32[r35>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r9=r38;r21=r26;r16=r29;continue}else{HEAP32[r3>>2]=r34+1;r9=r38;r21=r26;r16=r29;continue}}r29=HEAPU8[r17];if((r29&1|0)==0){r40=r29>>>1}else{r40=HEAP32[r10+4>>2]}do{if((r40|0)!=0){r29=HEAP32[r14>>2];if((r29-r13|0)>=160){break}r16=HEAP32[r15>>2];HEAP32[r14>>2]=r29+4;HEAP32[r29>>2]=r16}}while(0);HEAP16[r7>>1]=__ZNSt3__127__num_get_unsigned_integralItEET_PKcS3_Rji(r30,HEAP32[r12>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r10,r19,HEAP32[r14>>2],r6);do{if(r27){r41=0}else{if((HEAP32[r26+12>>2]|0)!=(HEAP32[r26+16>>2]|0)){r41=r26;break}r14=(FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)|0)==-1;r41=r14?0:r26}}while(0);r26=(r41|0)==0;do{if(r32){r2=61}else{if((HEAP32[r31+12>>2]|0)==(HEAP32[r31+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)==-1){r2=61;break}}if(!(r26^(r31|0)==0)){r2=63}}}while(0);if(r2==61){if(r26){r2=63}}if(r2==63){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r41;do{if((HEAP8[r18]&1)!=0){r41=HEAP32[r11+8>>2];if((r41|0)==0){break}_free(r41)}}while(0);if((HEAP8[r17]&1)==0){STACKTOP=r8;return}r17=HEAP32[r10+8>>2];if((r17|0)==0){STACKTOP=r8;return}_free(r17);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjS8_(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+256|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+56;r12=r8+72;r13=r8+80;r14=r8+240;r15=r8+248;r16=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r17=r10;r18=r11;r19=HEAP32[r5+4>>2]&74;if((r19|0)==8){r20=16}else if((r19|0)==64){r20=8}else if((r19|0)==0){r20=0}else{r20=10}__ZNSt3__19__num_getIcE17__stage2_int_prepERNS_8ios_baseEPcRc(r10,r5,r4,r9);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r11;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,10);if((HEAP8[r18]&1)==0){r19=r5+1|0;r21=r19;r22=r19;r23=r11+8|0}else{r19=r11+8|0;r21=HEAP32[r19>>2];r22=r5+1|0;r23=r19}HEAP32[r12>>2]=r21;r19=r13|0;HEAP32[r14>>2]=r19;HEAP32[r15>>2]=0;r5=r11|0;r24=r11+4|0;r25=HEAP8[r9];r9=r21;r21=r16;r16=r3;L11:while(1){do{if((r21|0)==0){r26=0}else{if((HEAP32[r21+12>>2]|0)!=(HEAP32[r21+16>>2]|0)){r26=r21;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)|0)==-1;r26=r3?0:r21}}while(0);r27=(r26|0)==0;do{if((r16|0)==0){r2=19}else{if((HEAP32[r16+12>>2]|0)!=(HEAP32[r16+16>>2]|0)){if(r27){r28=0;r29=r16;break}else{r30=r9;r31=r16;r32=0;break L11}}if((FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+36>>2]](r16)|0)==-1){r2=19;break}if(r27){r28=0;r29=r16}else{r30=r9;r31=r16;r32=0;break L11}}}while(0);if(r2==19){r2=0;if(r27){r30=r9;r31=0;r32=1;break}else{r28=1;r29=0}}r3=HEAPU8[r18];r33=(r3&1|0)==0;r34=HEAP32[r24>>2];r35=r3>>>1;if((HEAP32[r12>>2]-r9|0)==((r33?r35:r34)|0)){r3=r33?r35:r34;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r3<<1);if((HEAP8[r18]&1)==0){r36=10}else{r36=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r36);if((HEAP8[r18]&1)==0){r37=r22}else{r37=HEAP32[r23>>2]}HEAP32[r12>>2]=r37+r3;r38=r37}else{r38=r9}r3=r26+12|0;r34=HEAP32[r3>>2];r35=r26+16|0;if((r34|0)==(HEAP32[r35>>2]|0)){r39=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)&255}else{r39=HEAP8[r34]}if((__ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r39,r20,r38,r12,r15,r25,r10,r19,r14,r4)|0)!=0){r30=r38;r31=r29;r32=r28;break}r34=HEAP32[r3>>2];if((r34|0)==(HEAP32[r35>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r9=r38;r21=r26;r16=r29;continue}else{HEAP32[r3>>2]=r34+1;r9=r38;r21=r26;r16=r29;continue}}r29=HEAPU8[r17];if((r29&1|0)==0){r40=r29>>>1}else{r40=HEAP32[r10+4>>2]}do{if((r40|0)!=0){r29=HEAP32[r14>>2];if((r29-r13|0)>=160){break}r16=HEAP32[r15>>2];HEAP32[r14>>2]=r29+4;HEAP32[r29>>2]=r16}}while(0);HEAP32[r7>>2]=__ZNSt3__127__num_get_unsigned_integralIjEET_PKcS3_Rji(r30,HEAP32[r12>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r10,r19,HEAP32[r14>>2],r6);do{if(r27){r41=0}else{if((HEAP32[r26+12>>2]|0)!=(HEAP32[r26+16>>2]|0)){r41=r26;break}r14=(FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)|0)==-1;r41=r14?0:r26}}while(0);r26=(r41|0)==0;do{if(r32){r2=61}else{if((HEAP32[r31+12>>2]|0)==(HEAP32[r31+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)==-1){r2=61;break}}if(!(r26^(r31|0)==0)){r2=63}}}while(0);if(r2==61){if(r26){r2=63}}if(r2==63){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r41;do{if((HEAP8[r18]&1)!=0){r41=HEAP32[r11+8>>2];if((r41|0)==0){break}_free(r41)}}while(0);if((HEAP8[r17]&1)==0){STACKTOP=r8;return}r17=HEAP32[r10+8>>2];if((r17|0)==0){STACKTOP=r8;return}_free(r17);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRm(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+256|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+56;r12=r8+72;r13=r8+80;r14=r8+240;r15=r8+248;r16=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r17=r10;r18=r11;r19=HEAP32[r5+4>>2]&74;if((r19|0)==8){r20=16}else if((r19|0)==0){r20=0}else if((r19|0)==64){r20=8}else{r20=10}__ZNSt3__19__num_getIcE17__stage2_int_prepERNS_8ios_baseEPcRc(r10,r5,r4,r9);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r11;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,10);if((HEAP8[r18]&1)==0){r19=r5+1|0;r21=r19;r22=r19;r23=r11+8|0}else{r19=r11+8|0;r21=HEAP32[r19>>2];r22=r5+1|0;r23=r19}HEAP32[r12>>2]=r21;r19=r13|0;HEAP32[r14>>2]=r19;HEAP32[r15>>2]=0;r5=r11|0;r24=r11+4|0;r25=HEAP8[r9];r9=r21;r21=r16;r16=r3;L11:while(1){do{if((r21|0)==0){r26=0}else{if((HEAP32[r21+12>>2]|0)!=(HEAP32[r21+16>>2]|0)){r26=r21;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)|0)==-1;r26=r3?0:r21}}while(0);r27=(r26|0)==0;do{if((r16|0)==0){r2=19}else{if((HEAP32[r16+12>>2]|0)!=(HEAP32[r16+16>>2]|0)){if(r27){r28=0;r29=r16;break}else{r30=r9;r31=r16;r32=0;break L11}}if((FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+36>>2]](r16)|0)==-1){r2=19;break}if(r27){r28=0;r29=r16}else{r30=r9;r31=r16;r32=0;break L11}}}while(0);if(r2==19){r2=0;if(r27){r30=r9;r31=0;r32=1;break}else{r28=1;r29=0}}r3=HEAPU8[r18];r33=(r3&1|0)==0;r34=HEAP32[r24>>2];r35=r3>>>1;if((HEAP32[r12>>2]-r9|0)==((r33?r35:r34)|0)){r3=r33?r35:r34;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r3<<1);if((HEAP8[r18]&1)==0){r36=10}else{r36=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r36);if((HEAP8[r18]&1)==0){r37=r22}else{r37=HEAP32[r23>>2]}HEAP32[r12>>2]=r37+r3;r38=r37}else{r38=r9}r3=r26+12|0;r34=HEAP32[r3>>2];r35=r26+16|0;if((r34|0)==(HEAP32[r35>>2]|0)){r39=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)&255}else{r39=HEAP8[r34]}if((__ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r39,r20,r38,r12,r15,r25,r10,r19,r14,r4)|0)!=0){r30=r38;r31=r29;r32=r28;break}r34=HEAP32[r3>>2];if((r34|0)==(HEAP32[r35>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r9=r38;r21=r26;r16=r29;continue}else{HEAP32[r3>>2]=r34+1;r9=r38;r21=r26;r16=r29;continue}}r29=HEAPU8[r17];if((r29&1|0)==0){r40=r29>>>1}else{r40=HEAP32[r10+4>>2]}do{if((r40|0)!=0){r29=HEAP32[r14>>2];if((r29-r13|0)>=160){break}r16=HEAP32[r15>>2];HEAP32[r14>>2]=r29+4;HEAP32[r29>>2]=r16}}while(0);HEAP32[r7>>2]=__ZNSt3__127__num_get_unsigned_integralImEET_PKcS3_Rji(r30,HEAP32[r12>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r10,r19,HEAP32[r14>>2],r6);do{if(r27){r41=0}else{if((HEAP32[r26+12>>2]|0)!=(HEAP32[r26+16>>2]|0)){r41=r26;break}r14=(FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)|0)==-1;r41=r14?0:r26}}while(0);r26=(r41|0)==0;do{if(r32){r2=61}else{if((HEAP32[r31+12>>2]|0)==(HEAP32[r31+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)==-1){r2=61;break}}if(!(r26^(r31|0)==0)){r2=63}}}while(0);if(r2==61){if(r26){r2=63}}if(r2==63){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r41;do{if((HEAP8[r18]&1)!=0){r41=HEAP32[r11+8>>2];if((r41|0)==0){break}_free(r41)}}while(0);if((HEAP8[r17]&1)==0){STACKTOP=r8;return}r17=HEAP32[r10+8>>2];if((r17|0)==0){STACKTOP=r8;return}_free(r17);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRy(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+256|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+56;r12=r8+72;r13=r8+80;r14=r8+240;r15=r8+248;r16=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r17=r10;r18=r11;r19=HEAP32[r5+4>>2]&74;if((r19|0)==64){r20=8}else if((r19|0)==8){r20=16}else if((r19|0)==0){r20=0}else{r20=10}__ZNSt3__19__num_getIcE17__stage2_int_prepERNS_8ios_baseEPcRc(r10,r5,r4,r9);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r11;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,10);if((HEAP8[r18]&1)==0){r19=r5+1|0;r21=r19;r22=r19;r23=r11+8|0}else{r19=r11+8|0;r21=HEAP32[r19>>2];r22=r5+1|0;r23=r19}HEAP32[r12>>2]=r21;r19=r13|0;HEAP32[r14>>2]=r19;HEAP32[r15>>2]=0;r5=r11|0;r24=r11+4|0;r25=HEAP8[r9];r9=r21;r21=r16;r16=r3;L11:while(1){do{if((r21|0)==0){r26=0}else{if((HEAP32[r21+12>>2]|0)!=(HEAP32[r21+16>>2]|0)){r26=r21;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)|0)==-1;r26=r3?0:r21}}while(0);r27=(r26|0)==0;do{if((r16|0)==0){r2=19}else{if((HEAP32[r16+12>>2]|0)!=(HEAP32[r16+16>>2]|0)){if(r27){r28=0;r29=r16;break}else{r30=r9;r31=r16;r32=0;break L11}}if((FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+36>>2]](r16)|0)==-1){r2=19;break}if(r27){r28=0;r29=r16}else{r30=r9;r31=r16;r32=0;break L11}}}while(0);if(r2==19){r2=0;if(r27){r30=r9;r31=0;r32=1;break}else{r28=1;r29=0}}r3=HEAPU8[r18];r33=(r3&1|0)==0;r34=HEAP32[r24>>2];r35=r3>>>1;if((HEAP32[r12>>2]-r9|0)==((r33?r35:r34)|0)){r3=r33?r35:r34;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r3<<1);if((HEAP8[r18]&1)==0){r36=10}else{r36=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r11,r36);if((HEAP8[r18]&1)==0){r37=r22}else{r37=HEAP32[r23>>2]}HEAP32[r12>>2]=r37+r3;r38=r37}else{r38=r9}r3=r26+12|0;r34=HEAP32[r3>>2];r35=r26+16|0;if((r34|0)==(HEAP32[r35>>2]|0)){r39=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)&255}else{r39=HEAP8[r34]}if((__ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r39,r20,r38,r12,r15,r25,r10,r19,r14,r4)|0)!=0){r30=r38;r31=r29;r32=r28;break}r34=HEAP32[r3>>2];if((r34|0)==(HEAP32[r35>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r9=r38;r21=r26;r16=r29;continue}else{HEAP32[r3>>2]=r34+1;r9=r38;r21=r26;r16=r29;continue}}r29=HEAPU8[r17];if((r29&1|0)==0){r40=r29>>>1}else{r40=HEAP32[r10+4>>2]}do{if((r40|0)!=0){r29=HEAP32[r14>>2];if((r29-r13|0)>=160){break}r16=HEAP32[r15>>2];HEAP32[r14>>2]=r29+4;HEAP32[r29>>2]=r16}}while(0);r15=__ZNSt3__127__num_get_unsigned_integralIyEET_PKcS3_Rji(r30,HEAP32[r12>>2],r6,r20);HEAP32[r7>>2]=r15;HEAP32[r7+4>>2]=tempRet0;__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r10,r19,HEAP32[r14>>2],r6);do{if(r27){r41=0}else{if((HEAP32[r26+12>>2]|0)!=(HEAP32[r26+16>>2]|0)){r41=r26;break}r14=(FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)|0)==-1;r41=r14?0:r26}}while(0);r26=(r41|0)==0;do{if(r32){r2=61}else{if((HEAP32[r31+12>>2]|0)==(HEAP32[r31+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)==-1){r2=61;break}}if(!(r26^(r31|0)==0)){r2=63}}}while(0);if(r2==61){if(r26){r2=63}}if(r2==63){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r41;do{if((HEAP8[r18]&1)!=0){r41=HEAP32[r11+8>>2];if((r41|0)==0){break}_free(r41)}}while(0);if((HEAP8[r17]&1)==0){STACKTOP=r8;return}r17=HEAP32[r10+8>>2];if((r17|0)==0){STACKTOP=r8;return}_free(r17);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRf(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+280|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+48;r12=r8+64;r13=r8+80;r14=r8+88;r15=r8+248;r16=r8+256;r17=r8+264;r18=r8+272;r19=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r20=r11;r21=r12;__ZNSt3__19__num_getIcE19__stage2_float_prepERNS_8ios_baseEPcRcS5_(r11,r5,r4,r9,r10);HEAP32[r21>>2]=0;HEAP32[r21+4>>2]=0;HEAP32[r21+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r21]&1)==0){r22=r5+1|0;r23=r22;r24=r22;r25=r12+8|0}else{r22=r12+8|0;r23=HEAP32[r22>>2];r24=r5+1|0;r25=r22}HEAP32[r13>>2]=r23;r22=r14|0;HEAP32[r15>>2]=r22;HEAP32[r16>>2]=0;HEAP8[r17]=1;HEAP8[r18]=69;r5=r12|0;r26=r12+4|0;r27=HEAP8[r9];r9=HEAP8[r10];r10=r23;r23=r19;r19=r3;L6:while(1){do{if((r23|0)==0){r28=0}else{if((HEAP32[r23+12>>2]|0)!=(HEAP32[r23+16>>2]|0)){r28=r23;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+36>>2]](r23)|0)==-1;r28=r3?0:r23}}while(0);r29=(r28|0)==0;do{if((r19|0)==0){r2=15}else{if((HEAP32[r19+12>>2]|0)!=(HEAP32[r19+16>>2]|0)){if(r29){r30=0;r31=r19;break}else{r32=r10;r33=r19;r34=0;break L6}}if((FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+36>>2]](r19)|0)==-1){r2=15;break}if(r29){r30=0;r31=r19}else{r32=r10;r33=r19;r34=0;break L6}}}while(0);if(r2==15){r2=0;if(r29){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r21];r35=(r3&1|0)==0;r36=HEAP32[r26>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r21]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r21]&1)==0){r39=r24}else{r39=HEAP32[r25>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r28+12|0;r36=HEAP32[r3>>2];r37=r28+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)&255}else{r41=HEAP8[r36]}if((__ZNSt3__19__num_getIcE19__stage2_float_loopEcRbRcPcRS4_ccRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSE_RjS4_(r41,r17,r18,r40,r13,r27,r9,r11,r22,r15,r16,r4)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+40>>2]](r28);r10=r40;r23=r28;r19=r31;continue}else{HEAP32[r3>>2]=r36+1;r10=r40;r23=r28;r19=r31;continue}}r31=HEAPU8[r20];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){if((HEAP8[r17]&1)==0){break}r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r19=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r19}}while(0);HEAPF32[r7>>2]=__ZNSt3__115__num_get_floatIfEET_PKcS3_Rj(r32,HEAP32[r13>>2],r6);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r22,HEAP32[r15>>2],r6);do{if(r29){r43=0}else{if((HEAP32[r28+12>>2]|0)!=(HEAP32[r28+16>>2]|0)){r43=r28;break}r15=(FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)|0)==-1;r43=r15?0:r28}}while(0);r28=(r43|0)==0;do{if(r34){r2=58}else{if((HEAP32[r33+12>>2]|0)==(HEAP32[r33+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)|0)==-1){r2=58;break}}if(!(r28^(r33|0)==0)){r2=60}}}while(0);if(r2==58){if(r28){r2=60}}if(r2==60){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r21]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r20]&1)==0){STACKTOP=r8;return}r20=HEAP32[r11+8>>2];if((r20|0)==0){STACKTOP=r8;return}_free(r20);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRd(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+280|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+48;r12=r8+64;r13=r8+80;r14=r8+88;r15=r8+248;r16=r8+256;r17=r8+264;r18=r8+272;r19=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r20=r11;r21=r12;__ZNSt3__19__num_getIcE19__stage2_float_prepERNS_8ios_baseEPcRcS5_(r11,r5,r4,r9,r10);HEAP32[r21>>2]=0;HEAP32[r21+4>>2]=0;HEAP32[r21+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r21]&1)==0){r22=r5+1|0;r23=r22;r24=r22;r25=r12+8|0}else{r22=r12+8|0;r23=HEAP32[r22>>2];r24=r5+1|0;r25=r22}HEAP32[r13>>2]=r23;r22=r14|0;HEAP32[r15>>2]=r22;HEAP32[r16>>2]=0;HEAP8[r17]=1;HEAP8[r18]=69;r5=r12|0;r26=r12+4|0;r27=HEAP8[r9];r9=HEAP8[r10];r10=r23;r23=r19;r19=r3;L6:while(1){do{if((r23|0)==0){r28=0}else{if((HEAP32[r23+12>>2]|0)!=(HEAP32[r23+16>>2]|0)){r28=r23;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+36>>2]](r23)|0)==-1;r28=r3?0:r23}}while(0);r29=(r28|0)==0;do{if((r19|0)==0){r2=15}else{if((HEAP32[r19+12>>2]|0)!=(HEAP32[r19+16>>2]|0)){if(r29){r30=0;r31=r19;break}else{r32=r10;r33=r19;r34=0;break L6}}if((FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+36>>2]](r19)|0)==-1){r2=15;break}if(r29){r30=0;r31=r19}else{r32=r10;r33=r19;r34=0;break L6}}}while(0);if(r2==15){r2=0;if(r29){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r21];r35=(r3&1|0)==0;r36=HEAP32[r26>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r21]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r21]&1)==0){r39=r24}else{r39=HEAP32[r25>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r28+12|0;r36=HEAP32[r3>>2];r37=r28+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)&255}else{r41=HEAP8[r36]}if((__ZNSt3__19__num_getIcE19__stage2_float_loopEcRbRcPcRS4_ccRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSE_RjS4_(r41,r17,r18,r40,r13,r27,r9,r11,r22,r15,r16,r4)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+40>>2]](r28);r10=r40;r23=r28;r19=r31;continue}else{HEAP32[r3>>2]=r36+1;r10=r40;r23=r28;r19=r31;continue}}r31=HEAPU8[r20];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){if((HEAP8[r17]&1)==0){break}r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r19=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r19}}while(0);HEAPF64[r7>>3]=__ZNSt3__115__num_get_floatIdEET_PKcS3_Rj(r32,HEAP32[r13>>2],r6);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r22,HEAP32[r15>>2],r6);do{if(r29){r43=0}else{if((HEAP32[r28+12>>2]|0)!=(HEAP32[r28+16>>2]|0)){r43=r28;break}r15=(FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)|0)==-1;r43=r15?0:r28}}while(0);r28=(r43|0)==0;do{if(r34){r2=58}else{if((HEAP32[r33+12>>2]|0)==(HEAP32[r33+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)|0)==-1){r2=58;break}}if(!(r28^(r33|0)==0)){r2=60}}}while(0);if(r2==58){if(r28){r2=60}}if(r2==60){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r21]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r20]&1)==0){STACKTOP=r8;return}r20=HEAP32[r11+8>>2];if((r20|0)==0){STACKTOP=r8;return}_free(r20);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRe(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+280|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+32;r10=r8+40;r11=r8+48;r12=r8+64;r13=r8+80;r14=r8+88;r15=r8+248;r16=r8+256;r17=r8+264;r18=r8+272;r19=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r8|0;r20=r11;r21=r12;__ZNSt3__19__num_getIcE19__stage2_float_prepERNS_8ios_baseEPcRcS5_(r11,r5,r4,r9,r10);HEAP32[r21>>2]=0;HEAP32[r21+4>>2]=0;HEAP32[r21+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r21]&1)==0){r22=r5+1|0;r23=r22;r24=r22;r25=r12+8|0}else{r22=r12+8|0;r23=HEAP32[r22>>2];r24=r5+1|0;r25=r22}HEAP32[r13>>2]=r23;r22=r14|0;HEAP32[r15>>2]=r22;HEAP32[r16>>2]=0;HEAP8[r17]=1;HEAP8[r18]=69;r5=r12|0;r26=r12+4|0;r27=HEAP8[r9];r9=HEAP8[r10];r10=r23;r23=r19;r19=r3;L6:while(1){do{if((r23|0)==0){r28=0}else{if((HEAP32[r23+12>>2]|0)!=(HEAP32[r23+16>>2]|0)){r28=r23;break}r3=(FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+36>>2]](r23)|0)==-1;r28=r3?0:r23}}while(0);r29=(r28|0)==0;do{if((r19|0)==0){r2=15}else{if((HEAP32[r19+12>>2]|0)!=(HEAP32[r19+16>>2]|0)){if(r29){r30=0;r31=r19;break}else{r32=r10;r33=r19;r34=0;break L6}}if((FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+36>>2]](r19)|0)==-1){r2=15;break}if(r29){r30=0;r31=r19}else{r32=r10;r33=r19;r34=0;break L6}}}while(0);if(r2==15){r2=0;if(r29){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r21];r35=(r3&1|0)==0;r36=HEAP32[r26>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r21]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r21]&1)==0){r39=r24}else{r39=HEAP32[r25>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r28+12|0;r36=HEAP32[r3>>2];r37=r28+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)&255}else{r41=HEAP8[r36]}if((__ZNSt3__19__num_getIcE19__stage2_float_loopEcRbRcPcRS4_ccRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSE_RjS4_(r41,r17,r18,r40,r13,r27,r9,r11,r22,r15,r16,r4)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+40>>2]](r28);r10=r40;r23=r28;r19=r31;continue}else{HEAP32[r3>>2]=r36+1;r10=r40;r23=r28;r19=r31;continue}}r31=HEAPU8[r20];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){if((HEAP8[r17]&1)==0){break}r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r19=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r19}}while(0);HEAPF64[r7>>3]=__ZNSt3__115__num_get_floatIeEET_PKcS3_Rj(r32,HEAP32[r13>>2],r6);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r22,HEAP32[r15>>2],r6);do{if(r29){r43=0}else{if((HEAP32[r28+12>>2]|0)!=(HEAP32[r28+16>>2]|0)){r43=r28;break}r15=(FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)|0)==-1;r43=r15?0:r28}}while(0);r28=(r43|0)==0;do{if(r34){r2=58}else{if((HEAP32[r33+12>>2]|0)==(HEAP32[r33+16>>2]|0)){if((FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)|0)==-1){r2=58;break}}if(!(r28^(r33|0)==0)){r2=60}}}while(0);if(r2==58){if(r28){r2=60}}if(r2==60){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r21]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r20]&1)==0){STACKTOP=r8;return}r20=HEAP32[r11+8>>2];if((r20|0)==0){STACKTOP=r8;return}_free(r20);STACKTOP=r8;return}function __ZNKSt3__17num_getIcNS_19istreambuf_iteratorIcNS_11char_traitsIcEEEEE6do_getES4_S4_RNS_8ios_baseERjRPv(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43;r2=0;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+64|0;r10=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r10>>2];r10=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r10>>2];r10=r9;r11=r9+16;r12=r9+48;r13=r12;r14=STACKTOP;STACKTOP=STACKTOP+12|0;STACKTOP=STACKTOP+7&-8;r15=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;r16=STACKTOP;STACKTOP=STACKTOP+160|0;r17=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;r18=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r13>>2]=0;HEAP32[r13+4>>2]=0;HEAP32[r13+8>>2]=0;r19=r14;r20=HEAP32[r5+28>>2];r5=r20+4|0;tempValue=HEAP32[r5>>2],HEAP32[r5>>2]=tempValue+1,tempValue;if((HEAP32[21504>>2]|0)!=-1){HEAP32[r10>>2]=21504;HEAP32[r10+4>>2]=26;HEAP32[r10+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(21504,r10)}r10=HEAP32[21508>>2]-1|0;r5=HEAP32[r20+8>>2];do{if(HEAP32[r20+12>>2]-r5>>2>>>0>r10>>>0){r21=HEAP32[r5+(r10<<2)>>2];if((r21|0)==0){break}r22=r11|0;FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+32>>2]](r21,18e3,18026,r22);r21=r20+4|0;if(((tempValue=HEAP32[r21>>2],HEAP32[r21>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+8>>2]](r20)}HEAP32[r19>>2]=0;HEAP32[r19+4>>2]=0;HEAP32[r19+8>>2]=0;r21=r14;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r14,10);if((HEAP8[r19]&1)==0){r23=r21+1|0;r24=r23;r25=r23;r26=r14+8|0}else{r23=r14+8|0;r24=HEAP32[r23>>2];r25=r21+1|0;r26=r23}HEAP32[r15>>2]=r24;r23=r16|0;HEAP32[r17>>2]=r23;HEAP32[r18>>2]=0;r21=r3|0;r27=r4|0;r28=r14|0;r29=r14+4|0;r30=r24;r31=HEAP32[r21>>2];L16:while(1){do{if((r31|0)==0){r32=0}else{if((HEAP32[r31+12>>2]|0)!=(HEAP32[r31+16>>2]|0)){r32=r31;break}if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)!=-1){r32=r31;break}HEAP32[r21>>2]=0;r32=0}}while(0);r33=(r32|0)==0;r34=HEAP32[r27>>2];do{if((r34|0)==0){r2=26}else{if((HEAP32[r34+12>>2]|0)!=(HEAP32[r34+16>>2]|0)){if(r33){break}else{r35=r30;break L16}}if((FUNCTION_TABLE[HEAP32[HEAP32[r34>>2]+36>>2]](r34)|0)==-1){HEAP32[r27>>2]=0;r2=26;break}else{if(r33){break}else{r35=r30;break L16}}}}while(0);if(r2==26){r2=0;if(r33){r35=r30;break}}r34=HEAPU8[r19];r36=(r34&1|0)==0;r37=HEAP32[r29>>2];r38=r34>>>1;if((HEAP32[r15>>2]-r30|0)==((r36?r38:r37)|0)){r34=r36?r38:r37;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r14,r34<<1);if((HEAP8[r19]&1)==0){r39=10}else{r39=(HEAP32[r28>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r14,r39);if((HEAP8[r19]&1)==0){r40=r25}else{r40=HEAP32[r26>>2]}HEAP32[r15>>2]=r40+r34;r41=r40}else{r41=r30}r34=r32+12|0;r37=HEAP32[r34>>2];r38=r32+16|0;if((r37|0)==(HEAP32[r38>>2]|0)){r42=FUNCTION_TABLE[HEAP32[HEAP32[r32>>2]+36>>2]](r32)&255}else{r42=HEAP8[r37]}if((__ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r42,16,r41,r15,r18,0,r12,r23,r17,r22)|0)!=0){r35=r41;break}r37=HEAP32[r34>>2];if((r37|0)==(HEAP32[r38>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r32>>2]+40>>2]](r32);r30=r41;r31=r32;continue}else{HEAP32[r34>>2]=r37+1;r30=r41;r31=r32;continue}}HEAP8[r35+3|0]=0;do{if((HEAP8[22104]|0)==0){if((___cxa_guard_acquire(22104)|0)==0){break}HEAP32[20072>>2]=_newlocale(2147483647,6448,0)}}while(0);r31=__ZNSt3__110__sscanf_lEPKcP15__locale_structS1_z(r35,HEAP32[20072>>2],(r8=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r8>>2]=r7,r8));STACKTOP=r8;if((r31|0)!=1){HEAP32[r6>>2]=4}r31=HEAP32[r21>>2];do{if((r31|0)==0){r43=0}else{if((HEAP32[r31+12>>2]|0)!=(HEAP32[r31+16>>2]|0)){r43=r31;break}if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)!=-1){r43=r31;break}HEAP32[r21>>2]=0;r43=0}}while(0);r21=(r43|0)==0;r31=HEAP32[r27>>2];do{if((r31|0)==0){r2=70}else{if((HEAP32[r31+12>>2]|0)!=(HEAP32[r31+16>>2]|0)){if(r21){break}else{r2=72;break}}if((FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)|0)==-1){HEAP32[r27>>2]=0;r2=70;break}else{if(r21){break}else{r2=72;break}}}}while(0);if(r2==70){if(r21){r2=72}}if(r2==72){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r19]&1)!=0){r27=HEAP32[r14+8>>2];if((r27|0)==0){break}_free(r27)}}while(0);if((HEAP8[r13]&1)==0){STACKTOP=r9;return}r21=HEAP32[r12+8>>2];if((r21|0)==0){STACKTOP=r9;return}_free(r21);STACKTOP=r9;return}}while(0);r9=___cxa_allocate_exception(4);HEAP32[r9>>2]=9408;___cxa_throw(r9,16168,548)}function __ZNSt3__19__num_getIcE17__stage2_int_loopEciPcRS2_RjcRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_S2_(r1,r2,r3,r4,r5,r6,r7,r8,r9,r10){var r11,r12,r13,r14,r15,r16;r11=HEAP32[r4>>2];r12=(r11|0)==(r3|0);do{if(r12){r13=(HEAP8[r10+24|0]|0)==r1<<24>>24;if(!r13){if((HEAP8[r10+25|0]|0)!=r1<<24>>24){break}}HEAP32[r4>>2]=r3+1;HEAP8[r3]=r13?43:45;HEAP32[r5>>2]=0;r14=0;return r14}}while(0);r13=HEAPU8[r7];if((r13&1|0)==0){r15=r13>>>1}else{r15=HEAP32[r7+4>>2]}if((r15|0)!=0&r1<<24>>24==r6<<24>>24){r6=HEAP32[r9>>2];if((r6-r8|0)>=160){r14=0;return r14}r8=HEAP32[r5>>2];HEAP32[r9>>2]=r6+4;HEAP32[r6>>2]=r8;HEAP32[r5>>2]=0;r14=0;return r14}r8=r10+26|0;r6=r10;while(1){if((r6|0)==(r8|0)){r16=r8;break}if((HEAP8[r6]|0)==r1<<24>>24){r16=r6;break}else{r6=r6+1|0}}r6=r16-r10|0;if((r6|0)>23){r14=-1;return r14}do{if((r2|0)==16){if((r6|0)<22){break}if(r12){r14=-1;return r14}if((r11-r3|0)>=3){r14=-1;return r14}if((HEAP8[r11-1|0]|0)!=48){r14=-1;return r14}HEAP32[r5>>2]=0;r10=HEAP8[r6+18e3|0];r16=HEAP32[r4>>2];HEAP32[r4>>2]=r16+1;HEAP8[r16]=r10;r14=0;return r14}else if((r2|0)==8|(r2|0)==10){if((r6|0)<(r2|0)){break}else{r14=-1}return r14}}while(0);r2=HEAP8[r6+18e3|0];HEAP32[r4>>2]=r11+1;HEAP8[r11]=r2;HEAP32[r5>>2]=HEAP32[r5>>2]+1;r14=0;return r14}function __ZNSt3__110__sscanf_lEPKcP15__locale_structS1_z(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=r5;HEAP32[r6>>2]=r3;HEAP32[r6+4>>2]=0;r6=_uselocale(r2);r2=_vsscanf(r1,6232,r5|0);if((r6|0)==0){STACKTOP=r4;return r2}_uselocale(r6);STACKTOP=r4;return r2}function __ZNSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED0Ev(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEED1Ev(r1){return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRb(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r8=STACKTOP;STACKTOP=STACKTOP+88|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+16;r11=r8+32;r12=r8+40;r13=r8+48;r14=r8+56;r15=r8+64;if((HEAP32[r5+4>>2]&1|0)==0){HEAP32[r11>>2]=-1;r16=HEAP32[HEAP32[r2>>2]+16>>2];r17=r3|0;HEAP32[r13>>2]=HEAP32[r17>>2];HEAP32[r14>>2]=HEAP32[r4>>2];FUNCTION_TABLE[r16](r12,r2,r13,r14,r5,r6,r11);r14=HEAP32[r12>>2];HEAP32[r17>>2]=r14;r17=HEAP32[r11>>2];if((r17|0)==1){HEAP8[r7]=1}else if((r17|0)==0){HEAP8[r7]=0}else{HEAP8[r7]=1;HEAP32[r6>>2]=4}HEAP32[r1>>2]=r14;STACKTOP=r8;return}r14=r5+28|0;r5=HEAP32[r14>>2];r17=r5+4|0;tempValue=HEAP32[r17>>2],HEAP32[r17>>2]=tempValue+1,tempValue;if((HEAP32[21496>>2]|0)!=-1){HEAP32[r10>>2]=21496;HEAP32[r10+4>>2]=26;HEAP32[r10+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(21496,r10)}r10=HEAP32[21500>>2]-1|0;r17=HEAP32[r5+8>>2];do{if(HEAP32[r5+12>>2]-r17>>2>>>0>r10>>>0){r11=HEAP32[r17+(r10<<2)>>2];if((r11|0)==0){break}r12=r11;r11=r5+4|0;if(((tempValue=HEAP32[r11>>2],HEAP32[r11>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+8>>2]](r5)}r11=HEAP32[r14>>2];r13=r11+4|0;tempValue=HEAP32[r13>>2],HEAP32[r13>>2]=tempValue+1,tempValue;if((HEAP32[21112>>2]|0)!=-1){HEAP32[r9>>2]=21112;HEAP32[r9+4>>2]=26;HEAP32[r9+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(21112,r9)}r13=HEAP32[21116>>2]-1|0;r2=HEAP32[r11+8>>2];do{if(HEAP32[r11+12>>2]-r2>>2>>>0>r13>>>0){r16=HEAP32[r2+(r13<<2)>>2];if((r16|0)==0){break}r18=r16;r19=r11+4|0;if(((tempValue=HEAP32[r19>>2],HEAP32[r19>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r11>>2]+8>>2]](r11)}r19=r15|0;r20=r16;FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+24>>2]](r19,r18);r16=r15+12|0;FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+28>>2]](r16,r18);HEAP8[r7]=(__ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEPKNS_12basic_stringIwS3_NS_9allocatorIwEEEENS_5ctypeIwEEEET0_RT_SE_SD_SD_RKT1_Rjb(r3,HEAP32[r4>>2],r19,r15+24|0,r12,r6,1)|0)==(r19|0)|0;HEAP32[r1>>2]=HEAP32[r3>>2];do{if((HEAP8[r16]&1)!=0){r19=HEAP32[r15+20>>2];if((r19|0)==0){break}_free(r19)}}while(0);if((HEAP8[r15]&1)==0){STACKTOP=r8;return}r16=HEAP32[r15+8>>2];if((r16|0)==0){STACKTOP=r8;return}_free(r16);STACKTOP=r8;return}}while(0);r12=___cxa_allocate_exception(4);HEAP32[r12>>2]=9408;___cxa_throw(r12,16168,548)}}while(0);r8=___cxa_allocate_exception(4);HEAP32[r8>>2]=9408;___cxa_throw(r8,16168,548)}function __ZNSt3__114__scan_keywordINS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEPKNS_12basic_stringIwS3_NS_9allocatorIwEEEENS_5ctypeIwEEEET0_RT_SE_SD_SD_RKT1_Rjb(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+104|0;r10=(r4-r3|0)/12&-1;r11=r9|0;do{if(r10>>>0>100){r12=_malloc(r10);if((r12|0)!=0){r13=r12;r14=r12;break}r12=___cxa_allocate_exception(4);HEAP32[r12>>2]=9376;___cxa_throw(r12,16152,68)}else{r13=r11;r14=0}}while(0);r11=(r3|0)==(r4|0);if(r11){r15=r10;r16=0}else{r12=r10;r10=0;r17=r13;r18=r3;while(1){r19=HEAPU8[r18];if((r19&1|0)==0){r20=r19>>>1}else{r20=HEAP32[r18+4>>2]}if((r20|0)==0){HEAP8[r17]=2;r21=r10+1|0;r22=r12-1|0}else{HEAP8[r17]=1;r21=r10;r22=r12}r19=r18+12|0;if((r19|0)==(r4|0)){r15=r22;r16=r21;break}else{r12=r22;r10=r21;r17=r17+1|0;r18=r19}}}r18=r1|0;r1=r5;r17=0;r21=r16;r16=r15;r15=r2;L18:while(1){r2=HEAP32[r18>>2];do{if((r2|0)==0){r23=0}else{r10=HEAP32[r2+12>>2];if((r10|0)==(HEAP32[r2+16>>2]|0)){r24=FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+36>>2]](r2)}else{r24=HEAP32[r10>>2]}if((r24|0)==-1){HEAP32[r18>>2]=0;r23=0;break}else{r23=HEAP32[r18>>2];break}}}while(0);r2=(r23|0)==0;if((r15|0)==0){r25=r23;r26=0}else{r10=HEAP32[r15+12>>2];if((r10|0)==(HEAP32[r15+16>>2]|0)){r27=FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+36>>2]](r15)}else{r27=HEAP32[r10>>2]}r25=HEAP32[r18>>2];r26=(r27|0)==-1?0:r15}r28=(r26|0)==0;if(!((r2^r28)&(r16|0)!=0)){break}r2=HEAP32[r25+12>>2];if((r2|0)==(HEAP32[r25+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r25>>2]+36>>2]](r25)}else{r29=HEAP32[r2>>2]}if(r7){r30=r29}else{r30=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+28>>2]](r5,r29)}r2=r17+1|0;if(r11){r17=r2;r21=r21;r16=r16;r15=r26;continue}L46:do{if(r7){r10=r16;r22=r21;r12=r13;r20=0;r19=r3;while(1){do{if((HEAP8[r12]|0)==1){r31=HEAP8[r19];if((r31&1)==0){r32=r19+4|0}else{r32=HEAP32[r19+8>>2]}if((r30|0)!=(HEAP32[r32+(r17<<2)>>2]|0)){HEAP8[r12]=0;r33=r20;r34=r22;r35=r10-1|0;break}r36=r31&255;if((r36&1|0)==0){r37=r36>>>1}else{r37=HEAP32[r19+4>>2]}if((r37|0)!=(r2|0)){r33=1;r34=r22;r35=r10;break}HEAP8[r12]=2;r33=1;r34=r22+1|0;r35=r10-1|0}else{r33=r20;r34=r22;r35=r10}}while(0);r36=r19+12|0;if((r36|0)==(r4|0)){r38=r35;r39=r34;r40=r33;break L46}r10=r35;r22=r34;r12=r12+1|0;r20=r33;r19=r36}}else{r19=r16;r20=r21;r12=r13;r22=0;r10=r3;while(1){do{if((HEAP8[r12]|0)==1){r36=r10;if((HEAP8[r36]&1)==0){r41=r10+4|0}else{r41=HEAP32[r10+8>>2]}if((r30|0)!=(FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+28>>2]](r5,HEAP32[r41+(r17<<2)>>2])|0)){HEAP8[r12]=0;r42=r22;r43=r20;r44=r19-1|0;break}r31=HEAPU8[r36];if((r31&1|0)==0){r45=r31>>>1}else{r45=HEAP32[r10+4>>2]}if((r45|0)!=(r2|0)){r42=1;r43=r20;r44=r19;break}HEAP8[r12]=2;r42=1;r43=r20+1|0;r44=r19-1|0}else{r42=r22;r43=r20;r44=r19}}while(0);r31=r10+12|0;if((r31|0)==(r4|0)){r38=r44;r39=r43;r40=r42;break L46}r19=r44;r20=r43;r12=r12+1|0;r22=r42;r10=r31}}}while(0);if(!r40){r17=r2;r21=r39;r16=r38;r15=r26;continue}r10=HEAP32[r18>>2];r22=r10+12|0;r12=HEAP32[r22>>2];if((r12|0)==(HEAP32[r10+16>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r10>>2]+40>>2]](r10)}else{HEAP32[r22>>2]=r12+4}if((r39+r38|0)>>>0<2){r17=r2;r21=r39;r16=r38;r15=r26;continue}else{r46=r39;r47=r13;r48=r3}while(1){do{if((HEAP8[r47]|0)==2){r12=HEAPU8[r48];if((r12&1|0)==0){r49=r12>>>1}else{r49=HEAP32[r48+4>>2]}if((r49|0)==(r2|0)){r50=r46;break}HEAP8[r47]=0;r50=r46-1|0}else{r50=r46}}while(0);r12=r48+12|0;if((r12|0)==(r4|0)){r17=r2;r21=r50;r16=r38;r15=r26;continue L18}else{r46=r50;r47=r47+1|0;r48=r12}}}do{if((r25|0)==0){r51=1}else{r48=HEAP32[r25+12>>2];if((r48|0)==(HEAP32[r25+16>>2]|0)){r52=FUNCTION_TABLE[HEAP32[HEAP32[r25>>2]+36>>2]](r25)}else{r52=HEAP32[r48>>2]}if((r52|0)==-1){HEAP32[r18>>2]=0;r51=1;break}else{r51=(HEAP32[r18>>2]|0)==0;break}}}while(0);do{if(r28){r8=91}else{r18=HEAP32[r26+12>>2];if((r18|0)==(HEAP32[r26+16>>2]|0)){r53=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r53=HEAP32[r18>>2]}if((r53|0)==-1){r8=91;break}if(!r51){r8=93}}}while(0);if(r8==91){if(r51){r8=93}}if(r8==93){HEAP32[r6>>2]=HEAP32[r6>>2]|2}L123:do{if(r11){r8=98}else{r51=r3;r53=r13;while(1){if((HEAP8[r53]|0)==2){r54=r51;break L123}r26=r51+12|0;if((r26|0)==(r4|0)){r8=98;break L123}r51=r26;r53=r53+1|0}}}while(0);if(r8==98){HEAP32[r6>>2]=HEAP32[r6>>2]|4;r54=r4}if((r14|0)==0){STACKTOP=r9;return r54}_free(r14);STACKTOP=r9;return r54}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRl(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+328|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+104;r11=r8+112;r12=r8+128;r13=r8+144;r14=r8+152;r15=r8+312;r16=r8+320;r17=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r18=r12;r19=HEAP32[r5+4>>2]&74;if((r19|0)==0){r20=0}else if((r19|0)==64){r20=8}else if((r19|0)==8){r20=16}else{r20=10}r19=r9|0;__ZNSt3__19__num_getIwE17__stage2_int_prepERNS_8ios_baseEPwRw(r11,r5,r19,r10);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r18]&1)==0){r9=r5+1|0;r21=r9;r22=r9;r23=r12+8|0}else{r9=r12+8|0;r21=HEAP32[r9>>2];r22=r5+1|0;r23=r9}HEAP32[r13>>2]=r21;r9=r14|0;HEAP32[r15>>2]=r9;HEAP32[r16>>2]=0;r5=r12|0;r24=r12+4|0;r25=HEAP32[r10>>2];r10=r21;r21=r17;r17=r3;L11:while(1){if((r21|0)==0){r26=0}else{r3=HEAP32[r21+12>>2];if((r3|0)==(HEAP32[r21+16>>2]|0)){r27=FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)}else{r27=HEAP32[r3>>2]}r26=(r27|0)==-1?0:r21}r28=(r26|0)==0;do{if((r17|0)==0){r2=20}else{r3=HEAP32[r17+12>>2];if((r3|0)==(HEAP32[r17+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r17>>2]+36>>2]](r17)}else{r29=HEAP32[r3>>2]}if((r29|0)==-1){r2=20;break}if(r28){r30=0;r31=r17}else{r32=r10;r33=r17;r34=0;break L11}}}while(0);if(r2==20){r2=0;if(r28){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r18];r35=(r3&1|0)==0;r36=HEAP32[r24>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r18]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r18]&1)==0){r39=r22}else{r39=HEAP32[r23>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r26+12|0;r36=HEAP32[r3>>2];r37=r26+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r41=HEAP32[r36>>2]}if((__ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r41,r20,r40,r13,r16,r25,r11,r9,r15,r19)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r10=r40;r21=r26;r17=r31;continue}else{HEAP32[r3>>2]=r36+4;r10=r40;r21=r26;r17=r31;continue}}r31=HEAPU8[r4];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r17=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r17}}while(0);HEAP32[r7>>2]=__ZNSt3__125__num_get_signed_integralIlEET_PKcS3_Rji(r32,HEAP32[r13>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r9,HEAP32[r15>>2],r6);if(r28){r43=0}else{r28=HEAP32[r26+12>>2];if((r28|0)==(HEAP32[r26+16>>2]|0)){r44=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r44=HEAP32[r28>>2]}r43=(r44|0)==-1?0:r26}r26=(r43|0)==0;do{if(r34){r2=63}else{r44=HEAP32[r33+12>>2];if((r44|0)==(HEAP32[r33+16>>2]|0)){r45=FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)}else{r45=HEAP32[r44>>2]}if((r45|0)==-1){r2=63;break}if(!(r26^(r33|0)==0)){r2=65}}}while(0);if(r2==63){if(r26){r2=65}}if(r2==65){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r18]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRx(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+328|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+104;r11=r8+112;r12=r8+128;r13=r8+144;r14=r8+152;r15=r8+312;r16=r8+320;r17=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r18=r12;r19=HEAP32[r5+4>>2]&74;if((r19|0)==64){r20=8}else if((r19|0)==0){r20=0}else if((r19|0)==8){r20=16}else{r20=10}r19=r9|0;__ZNSt3__19__num_getIwE17__stage2_int_prepERNS_8ios_baseEPwRw(r11,r5,r19,r10);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r18]&1)==0){r9=r5+1|0;r21=r9;r22=r9;r23=r12+8|0}else{r9=r12+8|0;r21=HEAP32[r9>>2];r22=r5+1|0;r23=r9}HEAP32[r13>>2]=r21;r9=r14|0;HEAP32[r15>>2]=r9;HEAP32[r16>>2]=0;r5=r12|0;r24=r12+4|0;r25=HEAP32[r10>>2];r10=r21;r21=r17;r17=r3;L11:while(1){if((r21|0)==0){r26=0}else{r3=HEAP32[r21+12>>2];if((r3|0)==(HEAP32[r21+16>>2]|0)){r27=FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)}else{r27=HEAP32[r3>>2]}r26=(r27|0)==-1?0:r21}r28=(r26|0)==0;do{if((r17|0)==0){r2=20}else{r3=HEAP32[r17+12>>2];if((r3|0)==(HEAP32[r17+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r17>>2]+36>>2]](r17)}else{r29=HEAP32[r3>>2]}if((r29|0)==-1){r2=20;break}if(r28){r30=0;r31=r17}else{r32=r10;r33=r17;r34=0;break L11}}}while(0);if(r2==20){r2=0;if(r28){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r18];r35=(r3&1|0)==0;r36=HEAP32[r24>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r18]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r18]&1)==0){r39=r22}else{r39=HEAP32[r23>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r26+12|0;r36=HEAP32[r3>>2];r37=r26+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r41=HEAP32[r36>>2]}if((__ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r41,r20,r40,r13,r16,r25,r11,r9,r15,r19)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r10=r40;r21=r26;r17=r31;continue}else{HEAP32[r3>>2]=r36+4;r10=r40;r21=r26;r17=r31;continue}}r31=HEAPU8[r4];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r17=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r17}}while(0);r16=__ZNSt3__125__num_get_signed_integralIxEET_PKcS3_Rji(r32,HEAP32[r13>>2],r6,r20);HEAP32[r7>>2]=r16;HEAP32[r7+4>>2]=tempRet0;__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r9,HEAP32[r15>>2],r6);if(r28){r43=0}else{r28=HEAP32[r26+12>>2];if((r28|0)==(HEAP32[r26+16>>2]|0)){r44=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r44=HEAP32[r28>>2]}r43=(r44|0)==-1?0:r26}r26=(r43|0)==0;do{if(r34){r2=63}else{r44=HEAP32[r33+12>>2];if((r44|0)==(HEAP32[r33+16>>2]|0)){r45=FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)}else{r45=HEAP32[r44>>2]}if((r45|0)==-1){r2=63;break}if(!(r26^(r33|0)==0)){r2=65}}}while(0);if(r2==63){if(r26){r2=65}}if(r2==65){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r18]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRt(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+328|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+104;r11=r8+112;r12=r8+128;r13=r8+144;r14=r8+152;r15=r8+312;r16=r8+320;r17=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r18=r12;r19=HEAP32[r5+4>>2]&74;if((r19|0)==0){r20=0}else if((r19|0)==64){r20=8}else if((r19|0)==8){r20=16}else{r20=10}r19=r9|0;__ZNSt3__19__num_getIwE17__stage2_int_prepERNS_8ios_baseEPwRw(r11,r5,r19,r10);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r18]&1)==0){r9=r5+1|0;r21=r9;r22=r9;r23=r12+8|0}else{r9=r12+8|0;r21=HEAP32[r9>>2];r22=r5+1|0;r23=r9}HEAP32[r13>>2]=r21;r9=r14|0;HEAP32[r15>>2]=r9;HEAP32[r16>>2]=0;r5=r12|0;r24=r12+4|0;r25=HEAP32[r10>>2];r10=r21;r21=r17;r17=r3;L11:while(1){if((r21|0)==0){r26=0}else{r3=HEAP32[r21+12>>2];if((r3|0)==(HEAP32[r21+16>>2]|0)){r27=FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)}else{r27=HEAP32[r3>>2]}r26=(r27|0)==-1?0:r21}r28=(r26|0)==0;do{if((r17|0)==0){r2=20}else{r3=HEAP32[r17+12>>2];if((r3|0)==(HEAP32[r17+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r17>>2]+36>>2]](r17)}else{r29=HEAP32[r3>>2]}if((r29|0)==-1){r2=20;break}if(r28){r30=0;r31=r17}else{r32=r10;r33=r17;r34=0;break L11}}}while(0);if(r2==20){r2=0;if(r28){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r18];r35=(r3&1|0)==0;r36=HEAP32[r24>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r18]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r18]&1)==0){r39=r22}else{r39=HEAP32[r23>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r26+12|0;r36=HEAP32[r3>>2];r37=r26+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r41=HEAP32[r36>>2]}if((__ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r41,r20,r40,r13,r16,r25,r11,r9,r15,r19)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r10=r40;r21=r26;r17=r31;continue}else{HEAP32[r3>>2]=r36+4;r10=r40;r21=r26;r17=r31;continue}}r31=HEAPU8[r4];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r17=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r17}}while(0);HEAP16[r7>>1]=__ZNSt3__127__num_get_unsigned_integralItEET_PKcS3_Rji(r32,HEAP32[r13>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r9,HEAP32[r15>>2],r6);if(r28){r43=0}else{r28=HEAP32[r26+12>>2];if((r28|0)==(HEAP32[r26+16>>2]|0)){r44=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r44=HEAP32[r28>>2]}r43=(r44|0)==-1?0:r26}r26=(r43|0)==0;do{if(r34){r2=63}else{r44=HEAP32[r33+12>>2];if((r44|0)==(HEAP32[r33+16>>2]|0)){r45=FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)}else{r45=HEAP32[r44>>2]}if((r45|0)==-1){r2=63;break}if(!(r26^(r33|0)==0)){r2=65}}}while(0);if(r2==63){if(r26){r2=65}}if(r2==65){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r18]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjS8_(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+328|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+104;r11=r8+112;r12=r8+128;r13=r8+144;r14=r8+152;r15=r8+312;r16=r8+320;r17=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r18=r12;r19=HEAP32[r5+4>>2]&74;if((r19|0)==64){r20=8}else if((r19|0)==0){r20=0}else if((r19|0)==8){r20=16}else{r20=10}r19=r9|0;__ZNSt3__19__num_getIwE17__stage2_int_prepERNS_8ios_baseEPwRw(r11,r5,r19,r10);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r18]&1)==0){r9=r5+1|0;r21=r9;r22=r9;r23=r12+8|0}else{r9=r12+8|0;r21=HEAP32[r9>>2];r22=r5+1|0;r23=r9}HEAP32[r13>>2]=r21;r9=r14|0;HEAP32[r15>>2]=r9;HEAP32[r16>>2]=0;r5=r12|0;r24=r12+4|0;r25=HEAP32[r10>>2];r10=r21;r21=r17;r17=r3;L11:while(1){if((r21|0)==0){r26=0}else{r3=HEAP32[r21+12>>2];if((r3|0)==(HEAP32[r21+16>>2]|0)){r27=FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)}else{r27=HEAP32[r3>>2]}r26=(r27|0)==-1?0:r21}r28=(r26|0)==0;do{if((r17|0)==0){r2=20}else{r3=HEAP32[r17+12>>2];if((r3|0)==(HEAP32[r17+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r17>>2]+36>>2]](r17)}else{r29=HEAP32[r3>>2]}if((r29|0)==-1){r2=20;break}if(r28){r30=0;r31=r17}else{r32=r10;r33=r17;r34=0;break L11}}}while(0);if(r2==20){r2=0;if(r28){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r18];r35=(r3&1|0)==0;r36=HEAP32[r24>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r18]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r18]&1)==0){r39=r22}else{r39=HEAP32[r23>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r26+12|0;r36=HEAP32[r3>>2];r37=r26+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r41=HEAP32[r36>>2]}if((__ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r41,r20,r40,r13,r16,r25,r11,r9,r15,r19)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r10=r40;r21=r26;r17=r31;continue}else{HEAP32[r3>>2]=r36+4;r10=r40;r21=r26;r17=r31;continue}}r31=HEAPU8[r4];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r17=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r17}}while(0);HEAP32[r7>>2]=__ZNSt3__127__num_get_unsigned_integralIjEET_PKcS3_Rji(r32,HEAP32[r13>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r9,HEAP32[r15>>2],r6);if(r28){r43=0}else{r28=HEAP32[r26+12>>2];if((r28|0)==(HEAP32[r26+16>>2]|0)){r44=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r44=HEAP32[r28>>2]}r43=(r44|0)==-1?0:r26}r26=(r43|0)==0;do{if(r34){r2=63}else{r44=HEAP32[r33+12>>2];if((r44|0)==(HEAP32[r33+16>>2]|0)){r45=FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)}else{r45=HEAP32[r44>>2]}if((r45|0)==-1){r2=63;break}if(!(r26^(r33|0)==0)){r2=65}}}while(0);if(r2==63){if(r26){r2=65}}if(r2==65){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r18]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRm(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+328|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+104;r11=r8+112;r12=r8+128;r13=r8+144;r14=r8+152;r15=r8+312;r16=r8+320;r17=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r18=r12;r19=HEAP32[r5+4>>2]&74;if((r19|0)==0){r20=0}else if((r19|0)==8){r20=16}else if((r19|0)==64){r20=8}else{r20=10}r19=r9|0;__ZNSt3__19__num_getIwE17__stage2_int_prepERNS_8ios_baseEPwRw(r11,r5,r19,r10);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r18]&1)==0){r9=r5+1|0;r21=r9;r22=r9;r23=r12+8|0}else{r9=r12+8|0;r21=HEAP32[r9>>2];r22=r5+1|0;r23=r9}HEAP32[r13>>2]=r21;r9=r14|0;HEAP32[r15>>2]=r9;HEAP32[r16>>2]=0;r5=r12|0;r24=r12+4|0;r25=HEAP32[r10>>2];r10=r21;r21=r17;r17=r3;L11:while(1){if((r21|0)==0){r26=0}else{r3=HEAP32[r21+12>>2];if((r3|0)==(HEAP32[r21+16>>2]|0)){r27=FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)}else{r27=HEAP32[r3>>2]}r26=(r27|0)==-1?0:r21}r28=(r26|0)==0;do{if((r17|0)==0){r2=20}else{r3=HEAP32[r17+12>>2];if((r3|0)==(HEAP32[r17+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r17>>2]+36>>2]](r17)}else{r29=HEAP32[r3>>2]}if((r29|0)==-1){r2=20;break}if(r28){r30=0;r31=r17}else{r32=r10;r33=r17;r34=0;break L11}}}while(0);if(r2==20){r2=0;if(r28){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r18];r35=(r3&1|0)==0;r36=HEAP32[r24>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r18]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r18]&1)==0){r39=r22}else{r39=HEAP32[r23>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r26+12|0;r36=HEAP32[r3>>2];r37=r26+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r41=HEAP32[r36>>2]}if((__ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r41,r20,r40,r13,r16,r25,r11,r9,r15,r19)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r10=r40;r21=r26;r17=r31;continue}else{HEAP32[r3>>2]=r36+4;r10=r40;r21=r26;r17=r31;continue}}r31=HEAPU8[r4];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r17=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r17}}while(0);HEAP32[r7>>2]=__ZNSt3__127__num_get_unsigned_integralImEET_PKcS3_Rji(r32,HEAP32[r13>>2],r6,r20);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r9,HEAP32[r15>>2],r6);if(r28){r43=0}else{r28=HEAP32[r26+12>>2];if((r28|0)==(HEAP32[r26+16>>2]|0)){r44=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r44=HEAP32[r28>>2]}r43=(r44|0)==-1?0:r26}r26=(r43|0)==0;do{if(r34){r2=63}else{r44=HEAP32[r33+12>>2];if((r44|0)==(HEAP32[r33+16>>2]|0)){r45=FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)}else{r45=HEAP32[r44>>2]}if((r45|0)==-1){r2=63;break}if(!(r26^(r33|0)==0)){r2=65}}}while(0);if(r2==63){if(r26){r2=65}}if(r2==65){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r18]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRy(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+328|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8;r10=r8+104;r11=r8+112;r12=r8+128;r13=r8+144;r14=r8+152;r15=r8+312;r16=r8+320;r17=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r18=r12;r19=HEAP32[r5+4>>2]&74;if((r19|0)==0){r20=0}else if((r19|0)==8){r20=16}else if((r19|0)==64){r20=8}else{r20=10}r19=r9|0;__ZNSt3__19__num_getIwE17__stage2_int_prepERNS_8ios_baseEPwRw(r11,r5,r19,r10);HEAP32[r18>>2]=0;HEAP32[r18+4>>2]=0;HEAP32[r18+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r18]&1)==0){r9=r5+1|0;r21=r9;r22=r9;r23=r12+8|0}else{r9=r12+8|0;r21=HEAP32[r9>>2];r22=r5+1|0;r23=r9}HEAP32[r13>>2]=r21;r9=r14|0;HEAP32[r15>>2]=r9;HEAP32[r16>>2]=0;r5=r12|0;r24=r12+4|0;r25=HEAP32[r10>>2];r10=r21;r21=r17;r17=r3;L11:while(1){if((r21|0)==0){r26=0}else{r3=HEAP32[r21+12>>2];if((r3|0)==(HEAP32[r21+16>>2]|0)){r27=FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+36>>2]](r21)}else{r27=HEAP32[r3>>2]}r26=(r27|0)==-1?0:r21}r28=(r26|0)==0;do{if((r17|0)==0){r2=20}else{r3=HEAP32[r17+12>>2];if((r3|0)==(HEAP32[r17+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r17>>2]+36>>2]](r17)}else{r29=HEAP32[r3>>2]}if((r29|0)==-1){r2=20;break}if(r28){r30=0;r31=r17}else{r32=r10;r33=r17;r34=0;break L11}}}while(0);if(r2==20){r2=0;if(r28){r32=r10;r33=0;r34=1;break}else{r30=1;r31=0}}r3=HEAPU8[r18];r35=(r3&1|0)==0;r36=HEAP32[r24>>2];r37=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r35?r37:r36)|0)){r3=r35?r37:r36;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r18]&1)==0){r38=10}else{r38=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r38);if((HEAP8[r18]&1)==0){r39=r22}else{r39=HEAP32[r23>>2]}HEAP32[r13>>2]=r39+r3;r40=r39}else{r40=r10}r3=r26+12|0;r36=HEAP32[r3>>2];r37=r26+16|0;if((r36|0)==(HEAP32[r37>>2]|0)){r41=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r41=HEAP32[r36>>2]}if((__ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r41,r20,r40,r13,r16,r25,r11,r9,r15,r19)|0)!=0){r32=r40;r33=r31;r34=r30;break}r36=HEAP32[r3>>2];if((r36|0)==(HEAP32[r37>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+40>>2]](r26);r10=r40;r21=r26;r17=r31;continue}else{HEAP32[r3>>2]=r36+4;r10=r40;r21=r26;r17=r31;continue}}r31=HEAPU8[r4];if((r31&1|0)==0){r42=r31>>>1}else{r42=HEAP32[r11+4>>2]}do{if((r42|0)!=0){r31=HEAP32[r15>>2];if((r31-r14|0)>=160){break}r17=HEAP32[r16>>2];HEAP32[r15>>2]=r31+4;HEAP32[r31>>2]=r17}}while(0);r16=__ZNSt3__127__num_get_unsigned_integralIyEET_PKcS3_Rji(r32,HEAP32[r13>>2],r6,r20);HEAP32[r7>>2]=r16;HEAP32[r7+4>>2]=tempRet0;__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r9,HEAP32[r15>>2],r6);if(r28){r43=0}else{r28=HEAP32[r26+12>>2];if((r28|0)==(HEAP32[r26+16>>2]|0)){r44=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+36>>2]](r26)}else{r44=HEAP32[r28>>2]}r43=(r44|0)==-1?0:r26}r26=(r43|0)==0;do{if(r34){r2=63}else{r44=HEAP32[r33+12>>2];if((r44|0)==(HEAP32[r33+16>>2]|0)){r45=FUNCTION_TABLE[HEAP32[HEAP32[r33>>2]+36>>2]](r33)}else{r45=HEAP32[r44>>2]}if((r45|0)==-1){r2=63;break}if(!(r26^(r33|0)==0)){r2=65}}}while(0);if(r2==63){if(r26){r2=65}}if(r2==65){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r43;do{if((HEAP8[r18]&1)!=0){r43=HEAP32[r12+8>>2];if((r43|0)==0){break}_free(r43)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRf(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+376|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+128;r10=r8+136;r11=r8+144;r12=r8+160;r13=r8+176;r14=r8+184;r15=r8+344;r16=r8+352;r17=r8+360;r18=r8+368;r19=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r20=r12;r21=r8|0;__ZNSt3__19__num_getIwE19__stage2_float_prepERNS_8ios_baseEPwRwS5_(r11,r5,r21,r9,r10);HEAP32[r20>>2]=0;HEAP32[r20+4>>2]=0;HEAP32[r20+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r20]&1)==0){r22=r5+1|0;r23=r22;r24=r22;r25=r12+8|0}else{r22=r12+8|0;r23=HEAP32[r22>>2];r24=r5+1|0;r25=r22}HEAP32[r13>>2]=r23;r22=r14|0;HEAP32[r15>>2]=r22;HEAP32[r16>>2]=0;HEAP8[r17]=1;HEAP8[r18]=69;r5=r12|0;r26=r12+4|0;r27=HEAP32[r9>>2];r9=HEAP32[r10>>2];r10=r23;r23=r19;r19=r3;L6:while(1){if((r23|0)==0){r28=0}else{r3=HEAP32[r23+12>>2];if((r3|0)==(HEAP32[r23+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+36>>2]](r23)}else{r29=HEAP32[r3>>2]}r28=(r29|0)==-1?0:r23}r30=(r28|0)==0;do{if((r19|0)==0){r2=16}else{r3=HEAP32[r19+12>>2];if((r3|0)==(HEAP32[r19+16>>2]|0)){r31=FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+36>>2]](r19)}else{r31=HEAP32[r3>>2]}if((r31|0)==-1){r2=16;break}if(r30){r32=0;r33=r19}else{r34=r10;r35=r19;r36=0;break L6}}}while(0);if(r2==16){r2=0;if(r30){r34=r10;r35=0;r36=1;break}else{r32=1;r33=0}}r3=HEAPU8[r20];r37=(r3&1|0)==0;r38=HEAP32[r26>>2];r39=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r37?r39:r38)|0)){r3=r37?r39:r38;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r20]&1)==0){r40=10}else{r40=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r40);if((HEAP8[r20]&1)==0){r41=r24}else{r41=HEAP32[r25>>2]}HEAP32[r13>>2]=r41+r3;r42=r41}else{r42=r10}r3=r28+12|0;r38=HEAP32[r3>>2];r39=r28+16|0;if((r38|0)==(HEAP32[r39>>2]|0)){r43=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)}else{r43=HEAP32[r38>>2]}if((__ZNSt3__19__num_getIwE19__stage2_float_loopEwRbRcPcRS4_wwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSE_RjPw(r43,r17,r18,r42,r13,r27,r9,r11,r22,r15,r16,r21)|0)!=0){r34=r42;r35=r33;r36=r32;break}r38=HEAP32[r3>>2];if((r38|0)==(HEAP32[r39>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+40>>2]](r28);r10=r42;r23=r28;r19=r33;continue}else{HEAP32[r3>>2]=r38+4;r10=r42;r23=r28;r19=r33;continue}}r33=HEAPU8[r4];if((r33&1|0)==0){r44=r33>>>1}else{r44=HEAP32[r11+4>>2]}do{if((r44|0)!=0){if((HEAP8[r17]&1)==0){break}r33=HEAP32[r15>>2];if((r33-r14|0)>=160){break}r19=HEAP32[r16>>2];HEAP32[r15>>2]=r33+4;HEAP32[r33>>2]=r19}}while(0);HEAPF32[r7>>2]=__ZNSt3__115__num_get_floatIfEET_PKcS3_Rj(r34,HEAP32[r13>>2],r6);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r22,HEAP32[r15>>2],r6);if(r30){r45=0}else{r30=HEAP32[r28+12>>2];if((r30|0)==(HEAP32[r28+16>>2]|0)){r46=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)}else{r46=HEAP32[r30>>2]}r45=(r46|0)==-1?0:r28}r28=(r45|0)==0;do{if(r36){r2=60}else{r46=HEAP32[r35+12>>2];if((r46|0)==(HEAP32[r35+16>>2]|0)){r47=FUNCTION_TABLE[HEAP32[HEAP32[r35>>2]+36>>2]](r35)}else{r47=HEAP32[r46>>2]}if((r47|0)==-1){r2=60;break}if(!(r28^(r35|0)==0)){r2=62}}}while(0);if(r2==60){if(r28){r2=62}}if(r2==62){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r45;do{if((HEAP8[r20]&1)!=0){r45=HEAP32[r12+8>>2];if((r45|0)==0){break}_free(r45)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRd(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+376|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+128;r10=r8+136;r11=r8+144;r12=r8+160;r13=r8+176;r14=r8+184;r15=r8+344;r16=r8+352;r17=r8+360;r18=r8+368;r19=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r20=r12;r21=r8|0;__ZNSt3__19__num_getIwE19__stage2_float_prepERNS_8ios_baseEPwRwS5_(r11,r5,r21,r9,r10);HEAP32[r20>>2]=0;HEAP32[r20+4>>2]=0;HEAP32[r20+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r20]&1)==0){r22=r5+1|0;r23=r22;r24=r22;r25=r12+8|0}else{r22=r12+8|0;r23=HEAP32[r22>>2];r24=r5+1|0;r25=r22}HEAP32[r13>>2]=r23;r22=r14|0;HEAP32[r15>>2]=r22;HEAP32[r16>>2]=0;HEAP8[r17]=1;HEAP8[r18]=69;r5=r12|0;r26=r12+4|0;r27=HEAP32[r9>>2];r9=HEAP32[r10>>2];r10=r23;r23=r19;r19=r3;L6:while(1){if((r23|0)==0){r28=0}else{r3=HEAP32[r23+12>>2];if((r3|0)==(HEAP32[r23+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+36>>2]](r23)}else{r29=HEAP32[r3>>2]}r28=(r29|0)==-1?0:r23}r30=(r28|0)==0;do{if((r19|0)==0){r2=16}else{r3=HEAP32[r19+12>>2];if((r3|0)==(HEAP32[r19+16>>2]|0)){r31=FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+36>>2]](r19)}else{r31=HEAP32[r3>>2]}if((r31|0)==-1){r2=16;break}if(r30){r32=0;r33=r19}else{r34=r10;r35=r19;r36=0;break L6}}}while(0);if(r2==16){r2=0;if(r30){r34=r10;r35=0;r36=1;break}else{r32=1;r33=0}}r3=HEAPU8[r20];r37=(r3&1|0)==0;r38=HEAP32[r26>>2];r39=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r37?r39:r38)|0)){r3=r37?r39:r38;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r20]&1)==0){r40=10}else{r40=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r40);if((HEAP8[r20]&1)==0){r41=r24}else{r41=HEAP32[r25>>2]}HEAP32[r13>>2]=r41+r3;r42=r41}else{r42=r10}r3=r28+12|0;r38=HEAP32[r3>>2];r39=r28+16|0;if((r38|0)==(HEAP32[r39>>2]|0)){r43=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)}else{r43=HEAP32[r38>>2]}if((__ZNSt3__19__num_getIwE19__stage2_float_loopEwRbRcPcRS4_wwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSE_RjPw(r43,r17,r18,r42,r13,r27,r9,r11,r22,r15,r16,r21)|0)!=0){r34=r42;r35=r33;r36=r32;break}r38=HEAP32[r3>>2];if((r38|0)==(HEAP32[r39>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+40>>2]](r28);r10=r42;r23=r28;r19=r33;continue}else{HEAP32[r3>>2]=r38+4;r10=r42;r23=r28;r19=r33;continue}}r33=HEAPU8[r4];if((r33&1|0)==0){r44=r33>>>1}else{r44=HEAP32[r11+4>>2]}do{if((r44|0)!=0){if((HEAP8[r17]&1)==0){break}r33=HEAP32[r15>>2];if((r33-r14|0)>=160){break}r19=HEAP32[r16>>2];HEAP32[r15>>2]=r33+4;HEAP32[r33>>2]=r19}}while(0);HEAPF64[r7>>3]=__ZNSt3__115__num_get_floatIdEET_PKcS3_Rj(r34,HEAP32[r13>>2],r6);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r22,HEAP32[r15>>2],r6);if(r30){r45=0}else{r30=HEAP32[r28+12>>2];if((r30|0)==(HEAP32[r28+16>>2]|0)){r46=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)}else{r46=HEAP32[r30>>2]}r45=(r46|0)==-1?0:r28}r28=(r45|0)==0;do{if(r36){r2=60}else{r46=HEAP32[r35+12>>2];if((r46|0)==(HEAP32[r35+16>>2]|0)){r47=FUNCTION_TABLE[HEAP32[HEAP32[r35>>2]+36>>2]](r35)}else{r47=HEAP32[r46>>2]}if((r47|0)==-1){r2=60;break}if(!(r28^(r35|0)==0)){r2=62}}}while(0);if(r2==60){if(r28){r2=62}}if(r2==62){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r45;do{if((HEAP8[r20]&1)!=0){r45=HEAP32[r12+8>>2];if((r45|0)==0){break}_free(r45)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRe(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47;r2=0;r8=STACKTOP;STACKTOP=STACKTOP+376|0;r9=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r9>>2];r9=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r9>>2];r9=r8+128;r10=r8+136;r11=r8+144;r12=r8+160;r13=r8+176;r14=r8+184;r15=r8+344;r16=r8+352;r17=r8+360;r18=r8+368;r19=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r11;r20=r12;r21=r8|0;__ZNSt3__19__num_getIwE19__stage2_float_prepERNS_8ios_baseEPwRwS5_(r11,r5,r21,r9,r10);HEAP32[r20>>2]=0;HEAP32[r20+4>>2]=0;HEAP32[r20+8>>2]=0;r5=r12;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,10);if((HEAP8[r20]&1)==0){r22=r5+1|0;r23=r22;r24=r22;r25=r12+8|0}else{r22=r12+8|0;r23=HEAP32[r22>>2];r24=r5+1|0;r25=r22}HEAP32[r13>>2]=r23;r22=r14|0;HEAP32[r15>>2]=r22;HEAP32[r16>>2]=0;HEAP8[r17]=1;HEAP8[r18]=69;r5=r12|0;r26=r12+4|0;r27=HEAP32[r9>>2];r9=HEAP32[r10>>2];r10=r23;r23=r19;r19=r3;L6:while(1){if((r23|0)==0){r28=0}else{r3=HEAP32[r23+12>>2];if((r3|0)==(HEAP32[r23+16>>2]|0)){r29=FUNCTION_TABLE[HEAP32[HEAP32[r23>>2]+36>>2]](r23)}else{r29=HEAP32[r3>>2]}r28=(r29|0)==-1?0:r23}r30=(r28|0)==0;do{if((r19|0)==0){r2=16}else{r3=HEAP32[r19+12>>2];if((r3|0)==(HEAP32[r19+16>>2]|0)){r31=FUNCTION_TABLE[HEAP32[HEAP32[r19>>2]+36>>2]](r19)}else{r31=HEAP32[r3>>2]}if((r31|0)==-1){r2=16;break}if(r30){r32=0;r33=r19}else{r34=r10;r35=r19;r36=0;break L6}}}while(0);if(r2==16){r2=0;if(r30){r34=r10;r35=0;r36=1;break}else{r32=1;r33=0}}r3=HEAPU8[r20];r37=(r3&1|0)==0;r38=HEAP32[r26>>2];r39=r3>>>1;if((HEAP32[r13>>2]-r10|0)==((r37?r39:r38)|0)){r3=r37?r39:r38;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r3<<1);if((HEAP8[r20]&1)==0){r40=10}else{r40=(HEAP32[r5>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r12,r40);if((HEAP8[r20]&1)==0){r41=r24}else{r41=HEAP32[r25>>2]}HEAP32[r13>>2]=r41+r3;r42=r41}else{r42=r10}r3=r28+12|0;r38=HEAP32[r3>>2];r39=r28+16|0;if((r38|0)==(HEAP32[r39>>2]|0)){r43=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)}else{r43=HEAP32[r38>>2]}if((__ZNSt3__19__num_getIwE19__stage2_float_loopEwRbRcPcRS4_wwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSE_RjPw(r43,r17,r18,r42,r13,r27,r9,r11,r22,r15,r16,r21)|0)!=0){r34=r42;r35=r33;r36=r32;break}r38=HEAP32[r3>>2];if((r38|0)==(HEAP32[r39>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+40>>2]](r28);r10=r42;r23=r28;r19=r33;continue}else{HEAP32[r3>>2]=r38+4;r10=r42;r23=r28;r19=r33;continue}}r33=HEAPU8[r4];if((r33&1|0)==0){r44=r33>>>1}else{r44=HEAP32[r11+4>>2]}do{if((r44|0)!=0){if((HEAP8[r17]&1)==0){break}r33=HEAP32[r15>>2];if((r33-r14|0)>=160){break}r19=HEAP32[r16>>2];HEAP32[r15>>2]=r33+4;HEAP32[r33>>2]=r19}}while(0);HEAPF64[r7>>3]=__ZNSt3__115__num_get_floatIeEET_PKcS3_Rj(r34,HEAP32[r13>>2],r6);__ZNSt3__116__check_groupingERKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjS8_Rj(r11,r22,HEAP32[r15>>2],r6);if(r30){r45=0}else{r30=HEAP32[r28+12>>2];if((r30|0)==(HEAP32[r28+16>>2]|0)){r46=FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+36>>2]](r28)}else{r46=HEAP32[r30>>2]}r45=(r46|0)==-1?0:r28}r28=(r45|0)==0;do{if(r36){r2=60}else{r46=HEAP32[r35+12>>2];if((r46|0)==(HEAP32[r35+16>>2]|0)){r47=FUNCTION_TABLE[HEAP32[HEAP32[r35>>2]+36>>2]](r35)}else{r47=HEAP32[r46>>2]}if((r47|0)==-1){r2=60;break}if(!(r28^(r35|0)==0)){r2=62}}}while(0);if(r2==60){if(r28){r2=62}}if(r2==62){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r45;do{if((HEAP8[r20]&1)!=0){r45=HEAP32[r12+8>>2];if((r45|0)==0){break}_free(r45)}}while(0);if((HEAP8[r4]&1)==0){STACKTOP=r8;return}r4=HEAP32[r11+8>>2];if((r4|0)==0){STACKTOP=r8;return}_free(r4);STACKTOP=r8;return}function __ZNKSt3__17num_getIwNS_19istreambuf_iteratorIwNS_11char_traitsIwEEEEE6do_getES4_S4_RNS_8ios_baseERjRPv(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47;r2=0;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+136|0;r10=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r3>>2]=HEAP32[r10>>2];r10=r4;r4=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r4>>2]=HEAP32[r10>>2];r10=r9;r11=r9+16;r12=r9+120;r13=r12;r14=STACKTOP;STACKTOP=STACKTOP+12|0;STACKTOP=STACKTOP+7&-8;r15=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;r16=STACKTOP;STACKTOP=STACKTOP+160|0;r17=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;r18=STACKTOP;STACKTOP=STACKTOP+4|0;STACKTOP=STACKTOP+7&-8;HEAP32[r13>>2]=0;HEAP32[r13+4>>2]=0;HEAP32[r13+8>>2]=0;r19=r14;r20=HEAP32[r5+28>>2];r5=r20+4|0;tempValue=HEAP32[r5>>2],HEAP32[r5>>2]=tempValue+1,tempValue;if((HEAP32[21496>>2]|0)!=-1){HEAP32[r10>>2]=21496;HEAP32[r10+4>>2]=26;HEAP32[r10+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(21496,r10)}r10=HEAP32[21500>>2]-1|0;r5=HEAP32[r20+8>>2];do{if(HEAP32[r20+12>>2]-r5>>2>>>0>r10>>>0){r21=HEAP32[r5+(r10<<2)>>2];if((r21|0)==0){break}r22=r11|0;FUNCTION_TABLE[HEAP32[HEAP32[r21>>2]+48>>2]](r21,18e3,18026,r22);r21=r20+4|0;if(((tempValue=HEAP32[r21>>2],HEAP32[r21>>2]=tempValue+ -1,tempValue)|0)==0){FUNCTION_TABLE[HEAP32[HEAP32[r20>>2]+8>>2]](r20)}HEAP32[r19>>2]=0;HEAP32[r19+4>>2]=0;HEAP32[r19+8>>2]=0;r21=r14;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r14,10);if((HEAP8[r19]&1)==0){r23=r21+1|0;r24=r23;r25=r23;r26=r14+8|0}else{r23=r14+8|0;r24=HEAP32[r23>>2];r25=r21+1|0;r26=r23}HEAP32[r15>>2]=r24;r23=r16|0;HEAP32[r17>>2]=r23;HEAP32[r18>>2]=0;r21=r3|0;r27=r4|0;r28=r14|0;r29=r14+4|0;r30=r24;r31=HEAP32[r21>>2];L16:while(1){do{if((r31|0)==0){r32=0}else{r33=HEAP32[r31+12>>2];if((r33|0)==(HEAP32[r31+16>>2]|0)){r34=FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)}else{r34=HEAP32[r33>>2]}if((r34|0)!=-1){r32=r31;break}HEAP32[r21>>2]=0;r32=0}}while(0);r33=(r32|0)==0;r35=HEAP32[r27>>2];do{if((r35|0)==0){r2=27}else{r36=HEAP32[r35+12>>2];if((r36|0)==(HEAP32[r35+16>>2]|0)){r37=FUNCTION_TABLE[HEAP32[HEAP32[r35>>2]+36>>2]](r35)}else{r37=HEAP32[r36>>2]}if((r37|0)==-1){HEAP32[r27>>2]=0;r2=27;break}else{if(r33){break}else{r38=r30;break L16}}}}while(0);if(r2==27){r2=0;if(r33){r38=r30;break}}r35=HEAPU8[r19];r36=(r35&1|0)==0;r39=HEAP32[r29>>2];r40=r35>>>1;if((HEAP32[r15>>2]-r30|0)==((r36?r40:r39)|0)){r35=r36?r40:r39;__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r14,r35<<1);if((HEAP8[r19]&1)==0){r41=10}else{r41=(HEAP32[r28>>2]&-2)-1|0}__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(r14,r41);if((HEAP8[r19]&1)==0){r42=r25}else{r42=HEAP32[r26>>2]}HEAP32[r15>>2]=r42+r35;r43=r42}else{r43=r30}r35=r32+12|0;r39=HEAP32[r35>>2];r40=r32+16|0;if((r39|0)==(HEAP32[r40>>2]|0)){r44=FUNCTION_TABLE[HEAP32[HEAP32[r32>>2]+36>>2]](r32)}else{r44=HEAP32[r39>>2]}if((__ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r44,16,r43,r15,r18,0,r12,r23,r17,r22)|0)!=0){r38=r43;break}r39=HEAP32[r35>>2];if((r39|0)==(HEAP32[r40>>2]|0)){FUNCTION_TABLE[HEAP32[HEAP32[r32>>2]+40>>2]](r32);r30=r43;r31=r32;continue}else{HEAP32[r35>>2]=r39+4;r30=r43;r31=r32;continue}}HEAP8[r38+3|0]=0;do{if((HEAP8[22104]|0)==0){if((___cxa_guard_acquire(22104)|0)==0){break}HEAP32[20072>>2]=_newlocale(2147483647,6448,0)}}while(0);r31=__ZNSt3__110__sscanf_lEPKcP15__locale_structS1_z(r38,HEAP32[20072>>2],(r8=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r8>>2]=r7,r8));STACKTOP=r8;if((r31|0)!=1){HEAP32[r6>>2]=4}r31=HEAP32[r21>>2];do{if((r31|0)==0){r45=0}else{r30=HEAP32[r31+12>>2];if((r30|0)==(HEAP32[r31+16>>2]|0)){r46=FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)}else{r46=HEAP32[r30>>2]}if((r46|0)!=-1){r45=r31;break}HEAP32[r21>>2]=0;r45=0}}while(0);r21=(r45|0)==0;r31=HEAP32[r27>>2];do{if((r31|0)==0){r2=71}else{r30=HEAP32[r31+12>>2];if((r30|0)==(HEAP32[r31+16>>2]|0)){r47=FUNCTION_TABLE[HEAP32[HEAP32[r31>>2]+36>>2]](r31)}else{r47=HEAP32[r30>>2]}if((r47|0)==-1){HEAP32[r27>>2]=0;r2=71;break}else{if(r21){break}else{r2=73;break}}}}while(0);if(r2==71){if(r21){r2=73}}if(r2==73){HEAP32[r6>>2]=HEAP32[r6>>2]|2}HEAP32[r1>>2]=r45;do{if((HEAP8[r19]&1)!=0){r27=HEAP32[r14+8>>2];if((r27|0)==0){break}_free(r27)}}while(0);if((HEAP8[r13]&1)==0){STACKTOP=r9;return}r21=HEAP32[r12+8>>2];if((r21|0)==0){STACKTOP=r9;return}_free(r21);STACKTOP=r9;return}}while(0);r9=___cxa_allocate_exception(4);HEAP32[r9>>2]=9408;___cxa_throw(r9,16168,548)}function __ZNSt3__19__num_getIwE17__stage2_int_loopEwiPcRS2_RjwRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSD_Pw(r1,r2,r3,r4,r5,r6,r7,r8,r9,r10){var r11,r12,r13,r14,r15,r16;r11=HEAP32[r4>>2];r12=(r11|0)==(r3|0);do{if(r12){r13=(HEAP32[r10+96>>2]|0)==(r1|0);if(!r13){if((HEAP32[r10+100>>2]|0)!=(r1|0)){break}}HEAP32[r4>>2]=r3+1;HEAP8[r3]=r13?43:45;HEAP32[r5>>2]=0;r14=0;return r14}}while(0);r13=HEAPU8[r7];if((r13&1|0)==0){r15=r13>>>1}else{r15=HEAP32[r7+4>>2]}if((r15|0)!=0&(r1|0)==(r6|0)){r6=HEAP32[r9>>2];if((r6-r8|0)>=160){r14=0;return r14}r8=HEAP32[r5>>2];HEAP32[r9>>2]=r6+4;HEAP32[r6>>2]=r8;HEAP32[r5>>2]=0;r14=0;return r14}r8=r10+104|0;r6=r10;while(1){if((r6|0)==(r8|0)){r16=r8;break}if((HEAP32[r6>>2]|0)==(r1|0)){r16=r6;break}else{r6=r6+4|0}}r6=r16-r10|0;r10=r6>>2;if((r6|0)>92){r14=-1;return r14}do{if((r2|0)==16){if((r6|0)<88){break}if(r12){r14=-1;return r14}if((r11-r3|0)>=3){r14=-1;return r14}if((HEAP8[r11-1|0]|0)!=48){r14=-1;return r14}HEAP32[r5>>2]=0;r16=HEAP8[r10+18e3|0];r1=HEAP32[r4>>2];HEAP32[r4>>2]=r1+1;HEAP8[r1]=r16;r14=0;return r14}else if((r2|0)==8|(r2|0)==10){if((r10|0)<(r2|0)){break}else{r14=-1}return r14}}while(0);r2=HEAP8[r10+18e3|0];HEAP32[r4>>2]=r11+1;HEAP8[r11]=r2;HEAP32[r5>>2]=HEAP32[r5>>2]+1;r14=0;return r14}function __ZNSt3__19__num_getIcE17__stage2_int_prepERNS_8ios_baseEPcRc(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r5=STACKTOP;STACKTOP=STACKTOP+32|0;r6=r5;r7=r5+16;r8=HEAP32[r2+28>>2];r2=r8+4|0;tempValue=HEAP32[r2>>2],HEAP32[r2>>2]=tempValue+1,tempValue;if((HEAP32[21504>>2]|0)!=-1){HEAP32[r7>>2]=21504;HEAP32[r7+4>>2]=26;HEAP32[r7+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(21504,r7)}r7=HEAP32[21508>>2]-1|0;r2=r8+12|0;r9=r8+8|0;r10=HEAP32[r9>>2];do{if(HEAP32[r2>>2]-r10>>2>>>0>r7>>>0){r11=HEAP32[r10+(r7<<2)>>2];if((r11|0)==0){break}FUNCTION_TABLE[HEAP32[HEAP32[r11>>2]+32>>2]](r11,18e3,18026,r3);if((HEAP32[21120>>2]|0)!=-1){HEAP32[r6>>2]=21120;HEAP32[r6+4>>2]=26;HEAP32[r6+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(21120,r6)}r11=HEAP32[21124>>2]-1|0;r12=HEAP32[r9>>2];do{if(HEAP32[r2>>2]-r12>>2>>>0>r11>>>0){r13=HEAP32[r12+(r11<<2)>>2];if((r13|0)==0){break}r14=r13;HEAP8[r4]=FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+16>>2]](r14);FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+20>>2]](r1,r14);r14=r8+4|0;if(((tempValue=HEAP32[r14>>2],HEAP32[r14>>2]=tempValue+ -1,tempValue)|0)!=0){STACKTOP=r5;return}FUNCTION_TABLE[HEAP32[HEAP32[r8>>2]+8>>2]](r8);STACKTOP=r5;return}}while(0);r11=___cxa_allocate_exception(4);HEAP32[r11>>2]=9408;___cxa_throw(r11,16168,548)}}while(0);r5=___cxa_allocate_exception(4);HEAP32[r5>>2]=9408;___cxa_throw(r5,16168,548)}function __ZNSt3__19__num_getIcE19__stage2_float_prepERNS_8ios_baseEPcRcS5_(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r6=STACKTOP;STACKTOP=STACKTOP+32|0;r7=r6;r8=r6+16;r9=HEAP32[r2+28>>2];r2=r9+4|0;tempValue=HEAP32[r2>>2],HEAP32[r2>>2]=tempValue+1,tempValue;if((HEAP32[21504>>2]|0)!=-1){HEAP32[r8>>2]=21504;HEAP32[r8+4>>2]=26;HEAP32[r8+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(21504,r8)}r8=HEAP32[21508>>2]-1|0;r2=r9+12|0;r10=r9+8|0;r11=HEAP32[r10>>2];do{if(HEAP32[r2>>2]-r11>>2>>>0>r8>>>0){r12=HEAP32[r11+(r8<<2)>>2];if((r12|0)==0){break}FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+32>>2]](r12,18e3,18032,r3);if((HEAP32[21120>>2]|0)!=-1){HEAP32[r7>>2]=21120;HEAP32[r7+4>>2]=26;HEAP32[r7+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(21120,r7)}r12=HEAP32[21124>>2]-1|0;r13=HEAP32[r10>>2];do{if(HEAP32[r2>>2]-r13>>2>>>0>r12>>>0){r14=HEAP32[r13+(r12<<2)>>2];if((r14|0)==0){break}r15=r14;r16=r14;HEAP8[r4]=FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+12>>2]](r15);HEAP8[r5]=FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+16>>2]](r15);FUNCTION_TABLE[HEAP32[HEAP32[r14>>2]+20>>2]](r1,r15);r15=r9+4|0;if(((tempValue=HEAP32[r15>>2],HEAP32[r15>>2]=tempValue+ -1,tempValue)|0)!=0){STACKTOP=r6;return}FUNCTION_TABLE[HEAP32[HEAP32[r9>>2]+8>>2]](r9);STACKTOP=r6;return}}while(0);r12=___cxa_allocate_exception(4);HEAP32[r12>>2]=9408;___cxa_throw(r12,16168,548)}}while(0);r6=___cxa_allocate_exception(4);HEAP32[r6>>2]=9408;___cxa_throw(r6,16168,548)}function __ZNSt3__19__num_getIcE19__stage2_float_loopEcRbRcPcRS4_ccRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEPjRSE_RjS4_(r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12){var r13,r14,r15,r16,r17;if(r1<<24>>24==r6<<24>>24){if((HEAP8[r2]&1)==0){r13=-1;return r13}HEAP8[r2]=0;r6=HEAP32[r5>>2];HEAP32[r5>>2]=r6+1;HEAP8[r6]=46;r6=HEAPU8[r8];if((r6&1|0)==0){r14=r6>>>1}else{r14=HEAP32[r8+4>>2]}if((r14|0)==0){r13=0;return r13}r14=HEAP32[r10>>2];if((r14-r9|0)>=160){r13=0;return r13}r6=HEAP32[r11>>2];HEAP32[r10>>2]=r14+4;HEAP32[r14>>2]=r6;r13=0;return r13}do{if(r1<<24>>24==r7<<24>>24){r6=HEAPU8[r8];if((r6&1|0)==0){r15=r6>>>1}else{r15=HEAP32[r8+4>>2]}if((r15|0)==0){break}if((HEAP8[r2]&1)==0){r13=-1;return r13}r6=HEAP32[r10>>2];if((r6-r9|0)>=160){r13=0;return r13}r14=HEAP32[r11>>2];HEAP32[r10>>2]=r6+4;HEAP32[r6>>2]=r14;HEAP32[r11>>2]=0;r13=0;return r13}}while(0);r15=r12+32|0;r7=r12;while(1){if((r7|0)==(r15|0)){r16=r15;break}if((HEAP8[r7]|0)==r1<<24>>24){r16=r7;break}else{r7=r7+1|0}}r7=r16-r12|0;if((r7|0)>31){r13=-1;return r13}r12=HEAP8[r7+18e3|0];if((r7|0)==22|(r7|0)==23){HEAP8[r3]=80;r16=HEAP32[r5>>2];HEAP32[r5>>2]=r16+1;HEAP8[r16]=r12;r13=0;return r13}else if((r7|0)==25|(r7|0)==24){r16=HEAP32[r5>>2];do{if((r16|0)!=(r4|0)){if((HEAP8[r16-1|0]&95|0)==(HEAP8[r3]&127|0)){break}else{r13=-1}return r13}}while(0);HEAP32[r5>>2]=r16+1;HEAP8[r16]=r12;r13=0;return r13}else{r16=HEAP8[r3];do{if((r12&95|0)==(r16<<24>>24|0)){HEAP8[r3]=r16|-128;if((HEAP8[r2]&1)==0){break}HEAP8[r2]=0;r4=HEAPU8[r8];if((r4&1|0)==0){r17=r4>>>1}else{r17=HEAP32[r8+4>>2]}if((r17|0)==0){break}r4=HEAP32[r10>>2];if((r4-r9|0)>=160){break}r1=HEAP32[r11>>2];HEAP32[r10>>2]=r4+4;HEAP32[r4>>2]=r1}}while(0);r10=HEAP32[r5>>2];HEAP32[r5>>2]=r10+1;HEAP8[r10]=r12;if((r7|0)>21){r13=0;return r13}HEAP32[r11>>2]=HEAP32[r11>>2]+1;r13=0;return r13}}function __ZNSt3__19__num_getIwE17__stage2_int_prepERNS_8ios_baseEPwRw(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r5=STACKTOP;STACKTOP=STACKTOP+32|0;r6=r5;r7=r5+16;r8=HEAP32[r2+28>>2];r2=r8+4|0;tempValue=HEAP32[r2>>2],HEAP32[r2>>2]=tempValue+1,tempValue;if((HEAP32[21496>>2]|0)!=-1){HEAP32[r7>>2]=21496;HEAP32[r7+4>>2]=26;HEAP32[r7+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(21496,r7)}r7=HEAP32[21500>>2]-1|0;r2=r8+12|0;r9=r8+8|0;r10=HEAP32[r9>>2];do{if(HEAP32[r2>>2]-r10>>2>>>0>r7>>>0){r11=HEAP32[r10+(r7<<2)>>2];if((r11|0)==0){break}FUNCTION_TABLE[HEAP32[HEAP32[r11>>2]+48>>2]](r11,18e3,18026,r3);if((HEAP32[21112>>2]|0)!=-1){HEAP32[r6>>2]=21112;HEAP32[r6+4>>2]=26;HEAP32[r6+8>>2]=0;__ZNSt3__111__call_onceERVmPvPFvS2_E(21112,r6)}r11=HEAP32[21116>>2]-1|0;r12=HEAP32[r9>>2];do{if(HEAP32[r2>>2]-r12>>2>>>0>r11>>>0){r13=HEAP32[r12+(r11<<2)>>2];if((r13|0)==0){break}r14=r13;HEAP32[r4>>2]=FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+16>>2]](r14);FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+20>>2]](r1,r14);r14=r8+4|0;if(((tempValue=HEAP32[r14>>2],HEAP32[r14>>2]=tempValue+ -1,tempValue)|0)!=0){STACKTOP=r5;return}FUNCTION_TABLE[HEAP32[HEAP32[r8>>2]+8>>2]](r8);STACKTOP=r5;return}}while(0);r11=___cxa_allocate_exception(4);HEAP32[r11>>2]=9408;___cxa_throw(r11,16168,548)}}while(0);r5=___cxa_allocate_exception(4);HEAP32[r5>>2]=9408;___cxa_throw(r5,16168,548)}
// EMSCRIPTEN_END_FUNCS
Module["_pcre_compile"] = _pcre_compile;
Module["_pcre_exec"] = _pcre_exec;
Module["_pcre_fullinfo"] = _pcre_fullinfo;
Module["___getTypeName"] = ___getTypeName;
Module["_malloc"] = _malloc;
Module["_free"] = _free;
Module["_realloc"] = _realloc;
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
/*global Module*/
/*global _malloc, _free, _memcpy*/
/*global FUNCTION_TABLE, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32*/
/*global readLatin1String*/
/*global __emval_register, _emval_handle_array, __emval_decref*/
/*global ___getTypeName*/
/*jslint sub:true*/ /* The symbols 'fromWireType' and 'toWireType' must be accessed via array notation to be closure-safe since craftInvokerFunction crafts functions as strings that can't be closured. */
var InternalError = Module['InternalError'] = extendError(Error, 'InternalError');
var BindingError = Module['BindingError'] = extendError(Error, 'BindingError');
var UnboundTypeError = Module['UnboundTypeError'] = extendError(BindingError, 'UnboundTypeError');
function throwInternalError(message) {
    throw new InternalError(message);
}
function throwBindingError(message) {
    throw new BindingError(message);
}
function throwUnboundTypeError(message, types) {
    var unboundTypes = [];
    var seen = {};
    function visit(type) {
        if (seen[type]) {
            return;
        }
        if (registeredTypes[type]) {
            return;
        }
        if (typeDependencies[type]) {
            typeDependencies[type].forEach(visit);
            return;
        }
        unboundTypes.push(type);
        seen[type] = true;
    }
    types.forEach(visit);
    throw new UnboundTypeError(message + ': ' + unboundTypes.map(getTypeName).join([', ']));
}
// Creates a function overload resolution table to the given method 'methodName' in the given prototype,
// if the overload table doesn't yet exist.
function ensureOverloadTable(proto, methodName, humanName) {
    if (undefined === proto[methodName].overloadTable) {
        var prevFunc = proto[methodName];
        // Inject an overload resolver function that routes to the appropriate overload based on the number of arguments.
        proto[methodName] = function() {
            // TODO This check can be removed in -O3 level "unsafe" optimizations.
            if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
                throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
            }
            return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
        };
        // Move the previous function into the overload table.
        proto[methodName].overloadTable = [];
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
    }            
}
/* Registers a symbol (function, class, enum, ...) as part of the Module JS object so that
   hand-written code is able to access that symbol via 'Module.name'.
   name: The name of the symbol that's being exposed.
   value: The object itself to expose (function, class, ...)
   numArguments: For functions, specifies the number of arguments the function takes in. For other types, unused and undefined.
   To implement support for multiple overloads of a function, an 'overload selector' function is used. That selector function chooses
   the appropriate overload to call from an function overload table. This selector function is only used if multiple overloads are
   actually registered, since it carries a slight performance penalty. */
function exposePublicSymbol(name, value, numArguments) {
    if (Module.hasOwnProperty(name)) {
        if (undefined === numArguments || (undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments])) {
            throwBindingError("Cannot register public name '" + name + "' twice");
        }
        // We are exposing a function with the same name as an existing function. Create an overload table and a function selector
        // that routes between the two.
        ensureOverloadTable(Module, name, name);
        if (Module.hasOwnProperty(numArguments)) {
            throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
        }
        // Add the new function into the overload table.
        Module[name].overloadTable[numArguments] = value;
    }
    else {
        Module[name] = value;
        if (undefined !== numArguments) {
            Module[name].numArguments = numArguments;
        }
    }
}
function replacePublicSymbol(name, value, numArguments) {
    if (!Module.hasOwnProperty(name)) {
        throwInternalError('Replacing nonexistant public symbol');
    }
    // If there's an overload table for this symbol, replace the symbol in the overload table instead.
    if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
        Module[name].overloadTable[numArguments] = value;
    }
    else {
        Module[name] = value;
    }
}
// from https://github.com/imvu/imvujs/blob/master/src/error.js
function extendError(baseErrorType, errorName) {
    var errorClass = createNamedFunction(errorName, function(message) {
        this.name = errorName;
        this.message = message;
        var stack = (new Error(message)).stack;
        if (stack !== undefined) {
            this.stack = this.toString() + '\n' +
                stack.replace(/^Error(:[^\n]*)?\n/, '');
        }
    });
    errorClass.prototype = Object.create(baseErrorType.prototype);
    errorClass.prototype.constructor = errorClass;
    errorClass.prototype.toString = function() {
        if (this.message === undefined) {
            return this.name;
        } else {
            return this.name + ': ' + this.message;
        }
    };
    return errorClass;
}
// from https://github.com/imvu/imvujs/blob/master/src/function.js
function createNamedFunction(name, body) {
    name = makeLegalFunctionName(name);
    /*jshint evil:true*/
    return new Function(
        "body",
        "return function " + name + "() {\n" +
        "    \"use strict\";" +
        "    return body.apply(this, arguments);\n" +
        "};\n"
    )(body);
}
function _embind_repr(v) {
    var t = typeof v;
    if (t === 'object' || t === 'array' || t === 'function') {
        return v.toString();
    } else {
        return '' + v;
    }
}
// typeID -> { toWireType: ..., fromWireType: ... }
var registeredTypes = {};
// typeID -> [callback]
var awaitingDependencies = {};
// typeID -> [dependentTypes]
var typeDependencies = {};
// class typeID -> {pointerType: ..., constPointerType: ...}
var registeredPointers = {};
function registerType(rawType, registeredInstance) {
    var name = registeredInstance.name;
    if (!rawType) {
        throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
    }
    if (registeredTypes.hasOwnProperty(rawType)) {
        throwBindingError("Cannot register type '" + name + "' twice");
    }
    registeredTypes[rawType] = registeredInstance;
    delete typeDependencies[rawType];
    if (awaitingDependencies.hasOwnProperty(rawType)) {
        var callbacks = awaitingDependencies[rawType];
        delete awaitingDependencies[rawType];
        callbacks.forEach(function(cb) {
            cb();
        });
    }
}
function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
    myTypes.forEach(function(type) {
        typeDependencies[type] = dependentTypes;
    });
    function onComplete(typeConverters) {
        var myTypeConverters = getTypeConverters(typeConverters);
        if (myTypeConverters.length !== myTypes.length) {
            throwInternalError('Mismatched type converter count');
        }
        for (var i = 0; i < myTypes.length; ++i) {
            registerType(myTypes[i], myTypeConverters[i]);
        }
    }
    var typeConverters = new Array(dependentTypes.length);
    var unregisteredTypes = [];
    var registered = 0;
    dependentTypes.forEach(function(dt, i) {
        if (registeredTypes.hasOwnProperty(dt)) {
            typeConverters[i] = registeredTypes[dt];
        } else {
            unregisteredTypes.push(dt);
            if (!awaitingDependencies.hasOwnProperty(dt)) {
                awaitingDependencies[dt] = [];
            }
            awaitingDependencies[dt].push(function() {
                typeConverters[i] = registeredTypes[dt];
                ++registered;
                if (registered === unregisteredTypes.length) {
                    onComplete(typeConverters);
                }
            });
        }
    });
    if (0 === unregisteredTypes.length) {
        onComplete(typeConverters);
    }
}
var __charCodes = (function() {
    var codes = new Array(256);
    for (var i = 0; i < 256; ++i) {
        codes[i] = String.fromCharCode(i);
    }
    return codes;
})();
function readLatin1String(ptr) {
    var ret = "";
    var c = ptr;
    while (HEAPU8[c]) {
        ret += __charCodes[HEAPU8[c++]];
    }
    return ret;
}
function getTypeName(type) {
    var ptr = ___getTypeName(type);
    var rv = readLatin1String(ptr);
    _free(ptr);
    return rv;
}
function heap32VectorToArray(count, firstElement) {
    var array = [];
    for (var i = 0; i < count; i++) {
        array.push(HEAP32[(firstElement >> 2) + i]);
    }
    return array;
}
function requireRegisteredType(rawType, humanName) {
    var impl = registeredTypes[rawType];
    if (undefined === impl) {
        throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
    }
    return impl;
}
function __embind_register_void(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        'fromWireType': function() {
            return undefined;
        },
        'toWireType': function(destructors, o) {
            // TODO: assert if anything else is given?
            return undefined;
        },
    });
}
function __embind_register_bool(rawType, name, trueValue, falseValue) {
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        'fromWireType': function(wt) {
            // ambiguous emscripten ABI: sometimes return values are
            // true or false, and sometimes integers (0 or 1)
            return !!wt;
        },
        'toWireType': function(destructors, o) {
            return o ? trueValue : falseValue;
        },
        destructorFunction: null, // This type does not need a destructor
    });
}
// When converting a number from JS to C++ side, the valid range of the number is
// [minRange, maxRange], inclusive.
function __embind_register_integer(primitiveType, name, minRange, maxRange) {
    name = readLatin1String(name);
    if (maxRange === -1) { // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come out as 'i32 -1'. Always treat those as max u32.
        maxRange = 4294967295;
    }
    registerType(primitiveType, {
        name: name,
        minRange: minRange,
        maxRange: maxRange,
        'fromWireType': function(value) {
            return value;
        },
        'toWireType': function(destructors, value) {
            // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
            // avoid the following two if()s and assume value is of proper type.
            if (typeof value !== "number" && typeof value !== "boolean") {
                throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
            }
            if (value < minRange || value > maxRange) {
                throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ', ' + maxRange + ']!');
            }
            return value | 0;
        },
        destructorFunction: null, // This type does not need a destructor
    });
}
function __embind_register_float(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        'fromWireType': function(value) {
            return value;
        },
        'toWireType': function(destructors, value) {
            // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
            // avoid the following if() and assume value is of proper type.
            if (typeof value !== "number" && typeof value !== "boolean") {
                throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
            }
            return value;
        },
        destructorFunction: null, // This type does not need a destructor
    });
}
function __embind_register_std_string(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        'fromWireType': function(value) {
            var length = HEAPU32[value >> 2];
            var a = new Array(length);
            for (var i = 0; i < length; ++i) {
                a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
            }
            _free(value);
            return a.join('');
        },
        'toWireType': function(destructors, value) {
            if (value instanceof ArrayBuffer) {
                value = new Uint8Array(value);
            }
            function getTAElement(ta, index) {
                return ta[index];
            }
            function getStringElement(string, index) {
                return string.charCodeAt(index);
            }
            var getElement;
            if (value instanceof Uint8Array) {
                getElement = getTAElement;
            } else if (value instanceof Int8Array) {
                getElement = getTAElement;
            } else if (typeof value === 'string') {
                getElement = getStringElement;
            } else {
                throwBindingError('Cannot pass non-string to std::string');
            }
            // assumes 4-byte alignment
            var length = value.length;
            var ptr = _malloc(4 + length);
            HEAPU32[ptr >> 2] = length;
            for (var i = 0; i < length; ++i) {
                var charCode = getElement(value, i);
                if (charCode > 255) {
                    _free(ptr);
                    throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
                }
                HEAPU8[ptr + 4 + i] = charCode;
            }
            if (destructors !== null) {
                destructors.push(_free, ptr);
            }
            return ptr;
        },
        destructorFunction: function(ptr) { _free(ptr); },
    });
}
function __embind_register_std_wstring(rawType, charSize, name) {
    name = readLatin1String(name);
    var HEAP, shift;
    if (charSize === 2) {
        HEAP = HEAPU16;
        shift = 1;
    } else if (charSize === 4) {
        HEAP = HEAPU32;
        shift = 2;
    }
    registerType(rawType, {
        name: name,
        'fromWireType': function(value) {
            var length = HEAPU32[value >> 2];
            var a = new Array(length);
            var start = (value + 4) >> shift;
            for (var i = 0; i < length; ++i) {
                a[i] = String.fromCharCode(HEAP[start + i]);
            }
            _free(value);
            return a.join('');
        },
        'toWireType': function(destructors, value) {
            // assumes 4-byte alignment
            var length = value.length;
            var ptr = _malloc(4 + length * charSize);
            HEAPU32[ptr >> 2] = length;
            var start = (ptr + 4) >> shift;
            for (var i = 0; i < length; ++i) {
                HEAP[start + i] = value.charCodeAt(i);
            }
            if (destructors !== null) {
                destructors.push(_free, ptr);
            }
            return ptr;
        },
        destructorFunction: function(ptr) { _free(ptr); },
    });
}
function __embind_register_emval(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        'fromWireType': function(handle) {
            var rv = _emval_handle_array[handle].value;
            __emval_decref(handle);
            return rv;
        },
        'toWireType': function(destructors, value) {
            return __emval_register(value);
        },
        destructorFunction: null, // This type does not need a destructor
    });
}
function __embind_register_memory_view(rawType, name) {
    var typeMapping = [
        Int8Array,
        Uint8Array,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array,        
    ];
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        'fromWireType': function(handle) {
            var type = HEAPU32[handle >> 2];
            var size = HEAPU32[(handle >> 2) + 1]; // in elements
            var data = HEAPU32[(handle >> 2) + 2]; // byte offset into emscripten heap
            var TA = typeMapping[type];
            return new TA(HEAP8.buffer, data, size);
        },
    });
}
function runDestructors(destructors) {
    while (destructors.length) {
        var ptr = destructors.pop();
        var del = destructors.pop();
        del(ptr);
    }
}
// Function implementation of operator new, per
// http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf
// 13.2.2
// ES3
function new_(constructor, argumentList) {
    if (!(constructor instanceof Function)) {
        throw new TypeError('new_ called with constructor type ' + typeof(constructor) + " which is not a function");
    }
    /*
     * Previously, the following line was just:
     function dummy() {};
     * Unfortunately, Chrome was preserving 'dummy' as the object's name, even though at creation, the 'dummy' has the
     * correct constructor name.  Thus, objects created with IMVU.new would show up in the debugger as 'dummy', which
     * isn't very helpful.  Using IMVU.createNamedFunction addresses the issue.  Doublely-unfortunately, there's no way
     * to write a test for this behavior.  -NRD 2013.02.22
     */
    var dummy = createNamedFunction(constructor.name, function(){});
    dummy.prototype = constructor.prototype;
    var obj = new dummy;
    var r = constructor.apply(obj, argumentList);
    return (r instanceof Object) ? r : obj;
}
// The path to interop from JS code to C++ code:
// (hand-written JS code) -> (autogenerated JS invoker) -> (template-generated C++ invoker) -> (target C++ function)
// craftInvokerFunction generates the JS invoker function for each function exposed to JS through embind.
function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
    // humanName: a human-readable string name for the function to be generated.
    // argTypes: An array that contains the embind type objects for all types in the function signature.
    //    argTypes[0] is the type object for the function return value.
    //    argTypes[1] is the type object for function this object/class type, or null if not crafting an invoker for a class method.
    //    argTypes[2...] are the actual function parameters.
    // classType: The embind type object for the class to be bound, or null if this is not a method of a class.
    // cppInvokerFunc: JS Function object to the C++-side function that interops into C++ code.
    // cppTargetFunc: Function pointer (an integer to FUNCTION_TABLE) to the target C++ function the cppInvokerFunc will end up calling.
    var argCount = argTypes.length;
    if (argCount < 2) {
        throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
    }
    var isClassMethodFunc = (argTypes[1] !== null && classType !== null);
    if (!isClassMethodFunc && !FUNCTION_TABLE[cppTargetFunc]) {
        throwBindingError('Global function '+humanName+' is not defined!');
    }
    // Free functions with signature "void function()" do not need an invoker that marshalls between wire types.
// TODO: This omits argument count check - enable only at -O3 or similar.
//    if (ENABLE_UNSAFE_OPTS && argCount == 2 && argTypes[0].name == "void" && !isClassMethodFunc) {
//       return FUNCTION_TABLE[fn];
//    }
    var argsList = "";
    var argsListWired = "";
    for(var i = 0; i < argCount-2; ++i) {
        argsList += (i!==0?", ":"")+"arg"+i;
        argsListWired += (i!==0?", ":"")+"arg"+i+"Wired";
    }
    var invokerFnBody =
        "return function "+makeLegalFunctionName(humanName)+"("+argsList+") {\n" +
        "if (arguments.length !== "+(argCount - 2)+") {\n" +
            "throwBindingError('function "+humanName+" called with ' + arguments.length + ' arguments, expected "+(argCount - 2)+" args!');\n" +
        "}\n";
    // Determine if we need to use a dynamic stack to store the destructors for the function parameters.
    // TODO: Remove this completely once all function invokers are being dynamically generated.
    var needsDestructorStack = false;
    for(var i = 1; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here.
        if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) { // The type does not define a destructor function - must use dynamic stack
            needsDestructorStack = true;
            break;
        }
    }
    if (needsDestructorStack) {
        invokerFnBody +=
            "var destructors = [];\n";
    }
    var dtorStack = needsDestructorStack ? "destructors" : "null";
    var args1 = ["throwBindingError", "classType", "invoker", "fn", "runDestructors", "retType", "classParam"];
    var args2 = [throwBindingError, classType, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
    if (isClassMethodFunc) {
        invokerFnBody += "var thisWired = classParam.toWireType("+dtorStack+", this);\n";
    }
    for(var i = 0; i < argCount-2; ++i) {
        invokerFnBody += "var arg"+i+"Wired = argType"+i+".toWireType("+dtorStack+", arg"+i+"); // "+argTypes[i+2].name+"\n";
        args1.push("argType"+i);
        args2.push(argTypes[i+2]);
    }
    if (isClassMethodFunc) {
        argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
    }
    var returns = (argTypes[0].name !== "void");
    invokerFnBody +=
        (returns?"var rv = ":"") + "invoker(fn"+(argsListWired.length>0?", ":"")+argsListWired+");\n";
    if (needsDestructorStack) {
        invokerFnBody += "runDestructors(destructors);\n";
    } else {
        for(var i = isClassMethodFunc?1:2; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
            var paramName = (i === 1 ? "thisWired" : ("arg"+(i-2)+"Wired"));
            if (argTypes[i].destructorFunction !== null) {
                invokerFnBody += paramName+"_dtor("+paramName+"); // "+argTypes[i].name+"\n";
                args1.push(paramName+"_dtor");
                args2.push(argTypes[i].destructorFunction);
            }
        }
    }
    if (returns) {
        invokerFnBody += "return retType.fromWireType(rv);\n";
    }
    invokerFnBody += "}\n";
    args1.push(invokerFnBody);
    var invokerFunction = new_(Function, args1).apply(null, args2);
    return invokerFunction;
}
function __embind_register_function(name, argCount, rawArgTypesAddr, rawInvoker, fn) {
    var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    name = readLatin1String(name);
    rawInvoker = FUNCTION_TABLE[rawInvoker];
    exposePublicSymbol(name, function() {
        throwUnboundTypeError('Cannot call ' + name + ' due to unbound types', argTypes);
    }, argCount - 1);
    whenDependentTypesAreResolved([], argTypes, function(argTypes) {
        var invokerArgsArray = [argTypes[0] /* return value */, null /* no class 'this'*/].concat(argTypes.slice(1) /* actual params */);
        replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null /* no class 'this'*/, rawInvoker, fn), argCount - 1);
        return [];
    });
}
var tupleRegistrations = {};
function __embind_register_value_array(rawType, name, rawConstructor, rawDestructor) {
    tupleRegistrations[rawType] = {
        name: readLatin1String(name),
        rawConstructor: FUNCTION_TABLE[rawConstructor],
        rawDestructor: FUNCTION_TABLE[rawDestructor],
        elements: [],
    };
}
function __embind_register_value_array_element(
    rawTupleType,
    getterReturnType,
    getter,
    getterContext,
    setterArgumentType,
    setter,
    setterContext
) {
    tupleRegistrations[rawTupleType].elements.push({
        getterReturnType: getterReturnType,
        getter: FUNCTION_TABLE[getter],
        getterContext: getterContext,
        setterArgumentType: setterArgumentType,
        setter: FUNCTION_TABLE[setter],
        setterContext: setterContext,
    });
}
function __embind_finalize_value_array(rawTupleType) {
    var reg = tupleRegistrations[rawTupleType];
    delete tupleRegistrations[rawTupleType];
    var elements = reg.elements;
    var elementsLength = elements.length;
    var elementTypes = elements.map(function(elt) { return elt.getterReturnType; }).
                concat(elements.map(function(elt) { return elt.setterArgumentType; }));
    var rawConstructor = reg.rawConstructor;
    var rawDestructor = reg.rawDestructor;
    whenDependentTypesAreResolved([rawTupleType], elementTypes, function(elementTypes) {
        elements.forEach(function(elt, i) {
            var getterReturnType = elementTypes[i];
            var getter = elt.getter;
            var getterContext = elt.getterContext;
            var setterArgumentType = elementTypes[i + elementsLength];
            var setter = elt.setter;
            var setterContext = elt.setterContext;
            elt.read = function(ptr) {
                return getterReturnType['fromWireType'](getter(getterContext, ptr));
            };
            elt.write = function(ptr, o) {
                var destructors = [];
                setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, o));
                runDestructors(destructors);
            };
        });
        return [{
            name: reg.name,
            'fromWireType': function(ptr) {
                var rv = new Array(elementsLength);
                for (var i = 0; i < elementsLength; ++i) {
                    rv[i] = elements[i].read(ptr);
                }
                rawDestructor(ptr);
                return rv;
            },
            'toWireType': function(destructors, o) {
                if (elementsLength !== o.length) {
                    throw new TypeError("Incorrect number of tuple elements for " + reg.name + ": expected=" + elementsLength + ", actual=" + o.length);
                }
                var ptr = rawConstructor();
                for (var i = 0; i < elementsLength; ++i) {
                    elements[i].write(ptr, o[i]);
                }
                if (destructors !== null) {
                    destructors.push(rawDestructor, ptr);
                }
                return ptr;
            },
            destructorFunction: rawDestructor,
        }];
    });
}
var structRegistrations = {};
function __embind_register_value_object(
    rawType,
    name,
    rawConstructor,
    rawDestructor
) {
    structRegistrations[rawType] = {
        name: readLatin1String(name),
        rawConstructor: FUNCTION_TABLE[rawConstructor],
        rawDestructor: FUNCTION_TABLE[rawDestructor],
        fields: [],
    };
}
function __embind_register_value_object_field(
    structType,
    fieldName,
    getterReturnType,
    getter,
    getterContext,
    setterArgumentType,
    setter,
    setterContext
) {
    structRegistrations[structType].fields.push({
        fieldName: readLatin1String(fieldName),
        getterReturnType: getterReturnType,
        getter: FUNCTION_TABLE[getter],
        getterContext: getterContext,
        setterArgumentType: setterArgumentType,
        setter: FUNCTION_TABLE[setter],
        setterContext: setterContext,
    });
}
function __embind_finalize_value_object(structType) {
    var reg = structRegistrations[structType];
    delete structRegistrations[structType];
    var rawConstructor = reg.rawConstructor;
    var rawDestructor = reg.rawDestructor;
    var fieldRecords = reg.fields;
    var fieldTypes = fieldRecords.map(function(field) { return field.getterReturnType; }).
              concat(fieldRecords.map(function(field) { return field.setterArgumentType; }));
    whenDependentTypesAreResolved([structType], fieldTypes, function(fieldTypes) {
        var fields = {};
        fieldRecords.forEach(function(field, i) {
            var fieldName = field.fieldName;
            var getterReturnType = fieldTypes[i];
            var getter = field.getter;
            var getterContext = field.getterContext;
            var setterArgumentType = fieldTypes[i + fieldRecords.length];
            var setter = field.setter;
            var setterContext = field.setterContext;
            fields[fieldName] = {
                read: function(ptr) {
                    return getterReturnType['fromWireType'](
                        getter(getterContext, ptr));
                },
                write: function(ptr, o) {
                    var destructors = [];
                    setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, o));
                    runDestructors(destructors);
                }
            };
        });
        return [{
            name: reg.name,
            'fromWireType': function(ptr) {
                var rv = {};
                for (var i in fields) {
                    rv[i] = fields[i].read(ptr);
                }
                rawDestructor(ptr);
                return rv;
            },
            'toWireType': function(destructors, o) {
                // todo: Here we have an opportunity for -O3 level "unsafe" optimizations:
                // assume all fields are present without checking.
                for (var fieldName in fields) {
                    if (!(fieldName in o)) {
                        throw new TypeError('Missing field');
                    }
                }
                var ptr = rawConstructor();
                for (fieldName in fields) {
                    fields[fieldName].write(ptr, o[fieldName]);
                }
                if (destructors !== null) {
                    destructors.push(rawDestructor, ptr);
                }
                return ptr;
            },
            destructorFunction: rawDestructor,
        }];
    });
}
var genericPointerToWireType = function(destructors, handle) {
    if (handle === null) {
        if (this.isReference) {
            throwBindingError('null is not a valid ' + this.name);
        }
        if (this.isSmartPointer) {
            var ptr = this.rawConstructor();
            if (destructors !== null) {
                destructors.push(this.rawDestructor, ptr);
            }
            return ptr;
        } else {
            return 0;
        }
    }
    if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
    }
    if (!handle.$$.ptr) {
        throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
    }
    if (!this.isConst && handle.$$.ptrType.isConst) {
        throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    if (this.isSmartPointer) {
        // TODO: this is not strictly true
        // We could support BY_EMVAL conversions from raw pointers to smart pointers
        // because the smart pointer can hold a reference to the handle
        if (undefined === handle.$$.smartPtr) {
            throwBindingError('Passing raw pointer to smart pointer is illegal');
        }
        switch (this.sharingPolicy) {
            case 0: // NONE
                // no upcasting
                if (handle.$$.smartPtrType === this) {
                    ptr = handle.$$.smartPtr;
                } else {
                    throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
                }
                break;
            case 1: // INTRUSIVE
                ptr = handle.$$.smartPtr;
                break;
            case 2: // BY_EMVAL
                if (handle.$$.smartPtrType === this) {
                    ptr = handle.$$.smartPtr;
                } else {
                    var clonedHandle = handle['clone']();
                    ptr = this.rawShare(
                        ptr,
                        __emval_register(function() {
                            clonedHandle['delete']();
                        })
                    );
                    if (destructors !== null) {
                        destructors.push(this.rawDestructor, ptr);
                    }
                }
                break;
            default:
                throwBindingError('Unsupporting sharing policy');
        }
    }
    return ptr;
};
// If we know a pointer type is not going to have SmartPtr logic in it, we can
// special-case optimize it a bit (compare to genericPointerToWireType)
var constNoSmartPtrRawPointerToWireType = function(destructors, handle) {
    if (handle === null) {
        if (this.isReference) {
            throwBindingError('null is not a valid ' + this.name);
        }
        return 0;
    }
    if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
    }
    if (!handle.$$.ptr) {
        throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    return ptr;
};
// An optimized version for non-const method accesses - there we must additionally restrict that
// the pointer is not a const-pointer.
var nonConstNoSmartPtrRawPointerToWireType = function(destructors, handle) {
    if (handle === null) {
        if (this.isReference) {
            throwBindingError('null is not a valid ' + this.name);
        }
        return 0;
    }
    if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
    }
    if (!handle.$$.ptr) {
        throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
    }
    if (handle.$$.ptrType.isConst) {
        throwBindingError('Cannot convert argument of type ' + handle.$$.ptrType.name + ' to parameter type ' + this.name);
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    return ptr;
};
function RegisteredPointer(
    name,
    registeredClass,
    isReference,
    isConst,
    // smart pointer properties
    isSmartPointer,
    pointeeType,
    sharingPolicy,
    rawGetPointee,
    rawConstructor,
    rawShare,
    rawDestructor
) {
    this.name = name;
    this.registeredClass = registeredClass;
    this.isReference = isReference;
    this.isConst = isConst;
    // smart pointer properties
    this.isSmartPointer = isSmartPointer;
    this.pointeeType = pointeeType;
    this.sharingPolicy = sharingPolicy;
    this.rawGetPointee = rawGetPointee;
    this.rawConstructor = rawConstructor;
    this.rawShare = rawShare;
    this.rawDestructor = rawDestructor;
    if (!isSmartPointer && registeredClass.baseClass === undefined) {
        if (isConst) {
            this['toWireType'] = constNoSmartPtrRawPointerToWireType;
            this.destructorFunction = null;
        } else {
            this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType;
            this.destructorFunction = null;
        }
    } else {
        this['toWireType'] = genericPointerToWireType;
        // Here we must leave this.destructorFunction undefined, since whether genericPointerToWireType returns
        // a pointer that needs to be freed up is runtime-dependent, and cannot be evaluated at registration time.
        // TODO: Create an alternative mechanism that allows removing the use of var destructors = []; array in 
        //       craftInvokerFunction altogether.
    }
}
RegisteredPointer.prototype.getPointee = function(ptr) {
    if (this.rawGetPointee) {
        ptr = this.rawGetPointee(ptr);
    }
    return ptr;
};
RegisteredPointer.prototype.destructor = function(ptr) {
    if (this.rawDestructor) {
        this.rawDestructor(ptr);
    }
};
RegisteredPointer.prototype['fromWireType'] = function(ptr) {
    // ptr is a raw pointer (or a raw smartpointer)
    // rawPointer is a maybe-null raw pointer
    var rawPointer = this.getPointee(ptr);
    if (!rawPointer) {
        this.destructor(ptr);
        return null;
    }
    function makeDefaultHandle() {
        if (this.isSmartPointer) {
            return makeClassHandle(this.registeredClass.instancePrototype, {
                ptrType: this.pointeeType,
                ptr: rawPointer,
                smartPtrType: this,
                smartPtr: ptr,
            });
        } else {
            return makeClassHandle(this.registeredClass.instancePrototype, {
                ptrType: this,
                ptr: ptr,
            });
        }
    }
    var actualType = this.registeredClass.getActualType(rawPointer);
    var registeredPointerRecord = registeredPointers[actualType];
    if (!registeredPointerRecord) {
        return makeDefaultHandle.call(this);
    }
    var toType;
    if (this.isConst) {
        toType = registeredPointerRecord.constPointerType;
    } else {
        toType = registeredPointerRecord.pointerType;
    }
    var dp = downcastPointer(
        rawPointer,
        this.registeredClass,
        toType.registeredClass);
    if (dp === null) {
        return makeDefaultHandle.call(this);
    }
    if (this.isSmartPointer) {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
            ptrType: toType,
            ptr: dp,
            smartPtrType: this,
            smartPtr: ptr,
        });
    } else {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
            ptrType: toType,
            ptr: dp,
        });
    }
};
function makeClassHandle(prototype, record) {
    if (!record.ptrType || !record.ptr) {
        throwInternalError('makeClassHandle requires ptr and ptrType');
    }
    var hasSmartPtrType = !!record.smartPtrType;
    var hasSmartPtr = !!record.smartPtr;
    if (hasSmartPtrType !== hasSmartPtr) {
        throwInternalError('Both smartPtrType and smartPtr must be specified');
    }
    record.count = { value: 1 };
    return Object.create(prototype, {
        $$: {
            value: record,
        },
    });
}
// root of all pointer and smart pointer handles in embind
function ClassHandle() {
}
function getInstanceTypeName(handle) {
    return handle.$$.ptrType.registeredClass.name;
}
ClassHandle.prototype['isAliasOf'] = function(other) {
    if (!(this instanceof ClassHandle)) {
        return false;
    }
    if (!(other instanceof ClassHandle)) {
        return false;
    }
    var leftClass = this.$$.ptrType.registeredClass;
    var left = this.$$.ptr;
    var rightClass = other.$$.ptrType.registeredClass;
    var right = other.$$.ptr;
    while (leftClass.baseClass) {
        left = leftClass.upcast(left);
        leftClass = leftClass.baseClass;
    }
    while (rightClass.baseClass) {
        right = rightClass.upcast(right);
        rightClass = rightClass.baseClass;
    }
    return leftClass === rightClass && left === right;
};
function throwInstanceAlreadyDeleted(obj) {
    throwBindingError(getInstanceTypeName(obj) + ' instance already deleted');
}
ClassHandle.prototype['clone'] = function() {
    if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
    }
    var clone = Object.create(Object.getPrototypeOf(this), {
        $$: {
            value: shallowCopy(this.$$),
        }
    });
    clone.$$.count.value += 1;
    return clone;
};
function runDestructor(handle) {
    var $$ = handle.$$;
    if ($$.smartPtr) {
        $$.smartPtrType.rawDestructor($$.smartPtr);
    } else {
        $$.ptrType.registeredClass.rawDestructor($$.ptr);
    }
}
ClassHandle.prototype['delete'] = function ClassHandle_delete() {
    if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
    }
    if (this.$$.deleteScheduled) {
        throwBindingError('Object already scheduled for deletion');
    }
    this.$$.count.value -= 1;
    if (0 === this.$$.count.value) {
        runDestructor(this);
    }
    this.$$.smartPtr = undefined;
    this.$$.ptr = undefined;
};
var deletionQueue = [];
ClassHandle.prototype['isDeleted'] = function isDeleted() {
    return !this.$$.ptr;
};
ClassHandle.prototype['deleteLater'] = function deleteLater() {
    if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
    }
    if (this.$$.deleteScheduled) {
        throwBindingError('Object already scheduled for deletion');
    }
    deletionQueue.push(this);
    if (deletionQueue.length === 1 && delayFunction) {
        delayFunction(flushPendingDeletes);
    }
    this.$$.deleteScheduled = true;
    return this;
};
function flushPendingDeletes() {
    while (deletionQueue.length) {
        var obj = deletionQueue.pop();
        obj.$$.deleteScheduled = false;
        obj['delete']();
    }
}
Module['flushPendingDeletes'] = flushPendingDeletes;
var delayFunction;
Module['setDelayFunction'] = function setDelayFunction(fn) {
    delayFunction = fn;
    if (deletionQueue.length && delayFunction) {
        delayFunction(flushPendingDeletes);
    }
};
function RegisteredClass(
    name,
    constructor,
    instancePrototype,
    rawDestructor,
    baseClass,
    getActualType,
    upcast,
    downcast
) {
    this.name = name;
    this.constructor = constructor;
    this.instancePrototype = instancePrototype;
    this.rawDestructor = rawDestructor;
    this.baseClass = baseClass;
    this.getActualType = getActualType;
    this.upcast = upcast;
    this.downcast = downcast;
}
function shallowCopy(o) {
    var rv = {};
    for (var k in o) {
        rv[k] = o[k];
    }
    return rv;
}
function __embind_register_class(
    rawType,
    rawPointerType,
    rawConstPointerType,
    baseClassRawType,
    getActualType,
    upcast,
    downcast,
    name,
    rawDestructor
) {
    name = readLatin1String(name);
    rawDestructor = FUNCTION_TABLE[rawDestructor];
    getActualType = FUNCTION_TABLE[getActualType];
    upcast = FUNCTION_TABLE[upcast];
    downcast = FUNCTION_TABLE[downcast];
    var legalFunctionName = makeLegalFunctionName(name);
    exposePublicSymbol(legalFunctionName, function() {
        // this code cannot run if baseClassRawType is zero
        throwUnboundTypeError('Cannot construct ' + name + ' due to unbound types', [baseClassRawType]);
    });
    whenDependentTypesAreResolved(
        [rawType, rawPointerType, rawConstPointerType],
        baseClassRawType ? [baseClassRawType] : [],
        function(base) {
            base = base[0];
            var baseClass;
            var basePrototype;
            if (baseClassRawType) {
                baseClass = base.registeredClass;
                basePrototype = baseClass.instancePrototype;
            } else {
                basePrototype = ClassHandle.prototype;
            }
            var constructor = createNamedFunction(legalFunctionName, function() {
                if (Object.getPrototypeOf(this) !== instancePrototype) {
                    throw new BindingError("Use 'new' to construct " + name);
                }
                if (undefined === registeredClass.constructor_body) {
                    throw new BindingError(name + " has no accessible constructor");
                }
                var body = registeredClass.constructor_body[arguments.length];
                if (undefined === body) {
                    throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
                }
                return body.apply(this, arguments);
            });
            var instancePrototype = Object.create(basePrototype, {
                constructor: { value: constructor },
            });
            constructor.prototype = instancePrototype;
            var registeredClass = new RegisteredClass(
                name,
                constructor,
                instancePrototype,
                rawDestructor,
                baseClass,
                getActualType,
                upcast,
                downcast);
            var referenceConverter = new RegisteredPointer(
                name,
                registeredClass,
                true,
                false,
                false);
            var pointerConverter = new RegisteredPointer(
                name + '*',
                registeredClass,
                false,
                false,
                false);
            var constPointerConverter = new RegisteredPointer(
                name + ' const*',
                registeredClass,
                false,
                true,
                false);
            registeredPointers[rawType] = {
                pointerType: pointerConverter,
                constPointerType: constPointerConverter
            };
            replacePublicSymbol(legalFunctionName, constructor);
            return [referenceConverter, pointerConverter, constPointerConverter];
        }
    );
}
function __embind_register_class_constructor(
    rawClassType,
    argCount,
    rawArgTypesAddr,
    invoker,
    rawConstructor
) {
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    invoker = FUNCTION_TABLE[invoker];
    whenDependentTypesAreResolved([], [rawClassType], function(classType) {
        classType = classType[0];
        var humanName = 'constructor ' + classType.name;
        if (undefined === classType.registeredClass.constructor_body) {
            classType.registeredClass.constructor_body = [];
        }
        if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
            throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount-1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
        }
        classType.registeredClass.constructor_body[argCount - 1] = function() {
            throwUnboundTypeError('Cannot construct ' + classType.name + ' due to unbound types', rawArgTypes);
        };
        whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
            classType.registeredClass.constructor_body[argCount - 1] = function() {
                if (arguments.length !== argCount - 1) {
                    throwBindingError(humanName + ' called with ' + arguments.length + ' arguments, expected ' + (argCount-1));
                }
                var destructors = [];
                var args = new Array(argCount);
                args[0] = rawConstructor;
                for (var i = 1; i < argCount; ++i) {
                    args[i] = argTypes[i]['toWireType'](destructors, arguments[i - 1]);
                }
                var ptr = invoker.apply(null, args);
                runDestructors(destructors);
                return argTypes[0]['fromWireType'](ptr);
            };
            return [];
        });
        return [];
    });
}
function downcastPointer(ptr, ptrClass, desiredClass) {
    if (ptrClass === desiredClass) {
        return ptr;
    }
    if (undefined === desiredClass.baseClass) {
        return null; // no conversion
    }
    // O(depth) stack space used
    return desiredClass.downcast(
        downcastPointer(ptr, ptrClass, desiredClass.baseClass));
}
function upcastPointer(ptr, ptrClass, desiredClass) {
    while (ptrClass !== desiredClass) {
        if (!ptrClass.upcast) {
            throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
        }
        ptr = ptrClass.upcast(ptr);
        ptrClass = ptrClass.baseClass;
    }
    return ptr;
}
function validateThis(this_, classType, humanName) {
    if (!(this_ instanceof Object)) {
        throwBindingError(humanName + ' with invalid "this": ' + this_);
    }
    if (!(this_ instanceof classType.registeredClass.constructor)) {
        throwBindingError(humanName + ' incompatible with "this" of type ' + this_.constructor.name);
    }
    if (!this_.$$.ptr) {
        throwBindingError('cannot call emscripten binding method ' + humanName + ' on deleted object');
    }
    // todo: kill this
    return upcastPointer(
        this_.$$.ptr,
        this_.$$.ptrType.registeredClass,
        classType.registeredClass);
}
function __embind_register_class_function(
    rawClassType,
    methodName,
    argCount,
    rawArgTypesAddr, // [ReturnType, ThisType, Args...]
    rawInvoker,
    context
) {
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    methodName = readLatin1String(methodName);
    rawInvoker = FUNCTION_TABLE[rawInvoker];
    whenDependentTypesAreResolved([], [rawClassType], function(classType) {
        classType = classType[0];
        var humanName = classType.name + '.' + methodName;
        var unboundTypesHandler = function() {
            throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
        };
        var proto = classType.registeredClass.instancePrototype;
        var method = proto[methodName];
        if (undefined === method || (undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount-2)) {
            // This is the first overload to be registered, OR we are replacing a function in the base class with a function in the derived class.
            unboundTypesHandler.argCount = argCount-2;
            unboundTypesHandler.className = classType.name;
            proto[methodName] = unboundTypesHandler;
        } else {
            // There was an existing function with the same name registered. Set up a function overload routing table.
            ensureOverloadTable(proto, methodName, humanName);
            proto[methodName].overloadTable[argCount-2] = unboundTypesHandler;
        }
        whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
            var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
            // Replace the initial unbound-handler-stub function with the appropriate member function, now that all types
            // are resolved. If multiple overloads are registered for this function, the function goes into an overload table.
            if (undefined === proto[methodName].overloadTable) {
                proto[methodName] = memberFunction;
            } else {
                proto[methodName].overloadTable[argCount-2] = memberFunction;
            }
            return [];
        });
        return [];
    });
}
function __embind_register_class_class_function(
    rawClassType,
    methodName,
    argCount,
    rawArgTypesAddr,
    rawInvoker,
    fn
) {
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    methodName = readLatin1String(methodName);
    rawInvoker = FUNCTION_TABLE[rawInvoker];
    whenDependentTypesAreResolved([], [rawClassType], function(classType) {
        classType = classType[0];
        var humanName = classType.name + '.' + methodName;
        var unboundTypesHandler = function() {
                throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
            };
        var proto = classType.registeredClass.constructor;
        if (undefined === proto[methodName]) {
            // This is the first function to be registered with this name.
            unboundTypesHandler.argCount = argCount-1;
            proto[methodName] = unboundTypesHandler;
        } else {
            // There was an existing function with the same name registered. Set up a function overload routing table.
            ensureOverloadTable(proto, methodName, humanName);
            proto[methodName].overloadTable[argCount-1] = unboundTypesHandler;
        }
        whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
            // Replace the initial unbound-types-handler stub with the proper function. If multiple overloads are registered,
            // the function handlers go into an overload table.
            var invokerArgsArray = [argTypes[0] /* return value */, null /* no class 'this'*/].concat(argTypes.slice(1) /* actual params */);
            var func = craftInvokerFunction(humanName, invokerArgsArray, null /* no class 'this'*/, rawInvoker, fn);
            if (undefined === proto[methodName].overloadTable) {
                proto[methodName] = func;
            } else {
                proto[methodName].overloadTable[argCount-1] = func;
            }
            return [];
        });
        return [];
    });
}
function __embind_register_class_property(
    classType,
    fieldName,
    getterReturnType,
    getter,
    getterContext,
    setterArgumentType,
    setter,
    setterContext
) {
    fieldName = readLatin1String(fieldName);
    getter = FUNCTION_TABLE[getter];
    whenDependentTypesAreResolved([], [classType], function(classType) {
        classType = classType[0];
        var humanName = classType.name + '.' + fieldName;
        var desc = {
            get: function() {
                throwUnboundTypeError('Cannot access ' + humanName + ' due to unbound types', [getterReturnType, setterArgumentType]);
            },
            enumerable: true,
            configurable: true
        };
        if (setter) {
            desc.set = function() {
                throwUnboundTypeError('Cannot access ' + humanName + ' due to unbound types', [getterReturnType, setterArgumentType]);
            };
        } else {
            desc.set = function(v) {
                throwBindingError(humanName + ' is a read-only property');
            };
        }
        Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
        whenDependentTypesAreResolved(
            [],
            (setter ? [getterReturnType, setterArgumentType] : [getterReturnType]),
        function(types) {
            var getterReturnType = types[0];
            var desc = {
                get: function() {
                    var ptr = validateThis(this, classType, humanName + ' getter');
                    return getterReturnType['fromWireType'](getter(getterContext, ptr));
                },
                enumerable: true
            };
            if (setter) {
                setter = FUNCTION_TABLE[setter];
                var setterArgumentType = types[1];
                desc.set = function(v) {
                    var ptr = validateThis(this, classType, humanName + ' setter');
                    var destructors = [];
                    setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, v));
                    runDestructors(destructors);
                };
            }
            Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
            return [];
        });
        return [];
    });
}
var char_0 = '0'.charCodeAt(0);
var char_9 = '9'.charCodeAt(0);
function makeLegalFunctionName(name) {
    name = name.replace(/[^a-zA-Z0-9_]/g, '$');
    var f = name.charCodeAt(0);
    if (f >= char_0 && f <= char_9) {
        return '_' + name;
    } else {
        return name;
    }
}
function __embind_register_smart_ptr(
    rawType,
    rawPointeeType,
    name,
    sharingPolicy,
    rawGetPointee,
    rawConstructor,
    rawShare,
    rawDestructor
) {
    name = readLatin1String(name);
    rawGetPointee = FUNCTION_TABLE[rawGetPointee];
    rawConstructor = FUNCTION_TABLE[rawConstructor];
    rawShare = FUNCTION_TABLE[rawShare];
    rawDestructor = FUNCTION_TABLE[rawDestructor];
    whenDependentTypesAreResolved([rawType], [rawPointeeType], function(pointeeType) {
        pointeeType = pointeeType[0];
        var registeredPointer = new RegisteredPointer(
            name,
            pointeeType.registeredClass,
            false,
            false,
            // smart pointer properties
            true,
            pointeeType,
            sharingPolicy,
            rawGetPointee,
            rawConstructor,
            rawShare,
            rawDestructor);
        return [registeredPointer];
    });
}
function __embind_register_enum(
    rawType,
    name
) {
    name = readLatin1String(name);
    function constructor() {
    }
    constructor.values = {};
    registerType(rawType, {
        name: name,
        constructor: constructor,
        'fromWireType': function(c) {
            return this.constructor.values[c];
        },
        'toWireType': function(destructors, c) {
            return c.value;
        },
        destructorFunction: null,
    });
    exposePublicSymbol(name, constructor);
}
function __embind_register_enum_value(
    rawEnumType,
    name,
    enumValue
) {
    var enumType = requireRegisteredType(rawEnumType, 'enum');
    name = readLatin1String(name);
    var Enum = enumType.constructor;
    var Value = Object.create(enumType.constructor.prototype, {
        value: {value: enumValue},
        constructor: {value: createNamedFunction(enumType.name + '_' + name, function() {})},
    });
    Enum.values[enumValue] = Value;
    Enum[name] = Value;
}
function __embind_register_constant(name, type, value) {
    name = readLatin1String(name);
    whenDependentTypesAreResolved([], [type], function(type) {
        type = type[0];
        Module[name] = type['fromWireType'](value);
        return [];
    });
}
/*global Module:true, Runtime*/
/*global HEAP32*/
/*global new_*/
/*global createNamedFunction*/
/*global readLatin1String, writeStringToMemory*/
/*global requireRegisteredType, throwBindingError*/
/*jslint sub:true*/ /* The symbols 'fromWireType' and 'toWireType' must be accessed via array notation to be closure-safe since craftInvokerFunction crafts functions as strings that can't be closured. */
var Module = Module || {};
var _emval_handle_array = [{}]; // reserve zero
var _emval_free_list = [];
// Public JS API
/** @expose */
Module.count_emval_handles = function() {
    var count = 0;
    for (var i = 1; i < _emval_handle_array.length; ++i) {
        if (_emval_handle_array[i] !== undefined) {
            ++count;
        }
    }
    return count;
};
/** @expose */
Module.get_first_emval = function() {
    for (var i = 1; i < _emval_handle_array.length; ++i) {
        if (_emval_handle_array[i] !== undefined) {
            return _emval_handle_array[i];
        }
    }
    return null;
};
// Private C++ API
var _emval_symbols = {}; // address -> string
function __emval_register_symbol(address) {
    _emval_symbols[address] = readLatin1String(address);
}
function getStringOrSymbol(address) {
    var symbol = _emval_symbols[address];
    if (symbol === undefined) {
        return readLatin1String(address);
    } else {
        return symbol;
    }
}
function requireHandle(handle) {
    if (!handle) {
        throwBindingError('Cannot use deleted val. handle = ' + handle);
    }
}
function __emval_register(value) {
    var handle = _emval_free_list.length ?
        _emval_free_list.pop() :
        _emval_handle_array.length;
    _emval_handle_array[handle] = {refcount: 1, value: value};
    return handle;
}
function __emval_incref(handle) {
    if (handle) {
        _emval_handle_array[handle].refcount += 1;
    }
}
function __emval_decref(handle) {
    if (handle && 0 === --_emval_handle_array[handle].refcount) {
        _emval_handle_array[handle] = undefined;
        _emval_free_list.push(handle);
    }
}
function __emval_new_array() {
    return __emval_register([]);
}
function __emval_new_object() {
    return __emval_register({});
}
function __emval_undefined() {
    return __emval_register(undefined);
}
function __emval_null() {
    return __emval_register(null);
}
function __emval_new_cstring(v) {
    return __emval_register(getStringOrSymbol(v));
}
function __emval_take_value(type, v) {
    type = requireRegisteredType(type, '_emval_take_value');
    v = type['fromWireType'](v);
    return __emval_register(v);
}
var __newers = {}; // arity -> function
function craftEmvalAllocator(argCount) {
    /*This function returns a new function that looks like this:
    function emval_allocator_3(handle, argTypes, arg0Wired, arg1Wired, arg2Wired) {
        var argType0 = requireRegisteredType(HEAP32[(argTypes >> 2)], "parameter 0");
        var arg0 = argType0.fromWireType(arg0Wired);
        var argType1 = requireRegisteredType(HEAP32[(argTypes >> 2) + 1], "parameter 1");
        var arg1 = argType1.fromWireType(arg1Wired);
        var argType2 = requireRegisteredType(HEAP32[(argTypes >> 2) + 2], "parameter 2");
        var arg2 = argType2.fromWireType(arg2Wired);
        var constructor = _emval_handle_array[handle].value;
        var emval = new constructor(arg0, arg1, arg2);
        return emval;
    } */
    var args1 = ["requireRegisteredType", "HEAP32", "_emval_handle_array", "__emval_register"];
    var args2 = [requireRegisteredType, HEAP32, _emval_handle_array, __emval_register];
    var argsList = "";
    var argsListWired = "";
    for(var i = 0; i < argCount; ++i) {
        argsList += (i!==0?", ":"")+"arg"+i; // 'arg0, arg1, ..., argn'
        argsListWired += ", arg"+i+"Wired"; // ', arg0Wired, arg1Wired, ..., argnWired'
    }
    var invokerFnBody =
        "return function emval_allocator_"+argCount+"(handle, argTypes " + argsListWired + ") {\n";
    for(var i = 0; i < argCount; ++i) {
        invokerFnBody += 
            "var argType"+i+" = requireRegisteredType(HEAP32[(argTypes >> 2) + "+i+"], \"parameter "+i+"\");\n" +
            "var arg"+i+" = argType"+i+".fromWireType(arg"+i+"Wired);\n";
    }
    invokerFnBody +=
        "var constructor = _emval_handle_array[handle].value;\n" +
        "var obj = new constructor("+argsList+");\n" +
        "return __emval_register(obj);\n" +
        "}\n";
    args1.push(invokerFnBody);
    var invokerFunction = new_(Function, args1).apply(null, args2);
    return invokerFunction;
}
function __emval_new(handle, argCount, argTypes) {
    requireHandle(handle);
    var newer = __newers[argCount];
    if (!newer) {
        newer = craftEmvalAllocator(argCount);
        __newers[argCount] = newer;
    }
    if (argCount === 0) {
        return newer(handle, argTypes);
    } else if (argCount === 1) {
        return newer(handle, argTypes, arguments[3]);
    } else if (argCount === 2) {
        return newer(handle, argTypes, arguments[3], arguments[4]);
    } else if (argCount === 3) {
        return newer(handle, argTypes, arguments[3], arguments[4], arguments[5]);
    } else if (argCount === 4) {
        return newer(handle, argTypes, arguments[3], arguments[4], arguments[5], arguments[6]);
    } else {
        // This is a slow path! (.apply and .splice are slow), so a few specializations are present above.
        return newer.apply(null, arguments.splice(1));
    }
}
// appease jshint (technically this code uses eval)
var global = (function(){return Function;})()('return this')();
function __emval_get_global(name) {
    name = getStringOrSymbol(name);
    return __emval_register(global[name]);
}
function __emval_get_module_property(name) {
    name = getStringOrSymbol(name);
    return __emval_register(Module[name]);
}
function __emval_get_property(handle, key) {
    requireHandle(handle);
    return __emval_register(_emval_handle_array[handle].value[_emval_handle_array[key].value]);
}
function __emval_set_property(handle, key, value) {
    requireHandle(handle);
    _emval_handle_array[handle].value[_emval_handle_array[key].value] = _emval_handle_array[value].value;
}
function __emval_as(handle, returnType) {
    requireHandle(handle);
    returnType = requireRegisteredType(returnType, 'emval::as');
    var destructors = [];
    // caller owns destructing
    return returnType['toWireType'](destructors, _emval_handle_array[handle].value);
}
function parseParameters(argCount, argTypes, argWireTypes) {
    var a = new Array(argCount);
    for (var i = 0; i < argCount; ++i) {
        var argType = requireRegisteredType(
            HEAP32[(argTypes >> 2) + i],
            "parameter " + i);
        a[i] = argType['fromWireType'](argWireTypes[i]);
    }
    return a;
}
function __emval_call(handle, argCount, argTypes) {
    requireHandle(handle);
    var types = lookupTypes(argCount, argTypes);
    var args = new Array(argCount);
    for (var i = 0; i < argCount; ++i) {
        args[i] = types[i]['fromWireType'](arguments[3 + i]);
    }
    var fn = _emval_handle_array[handle].value;
    var rv = fn.apply(undefined, args);
    return __emval_register(rv);
}
function lookupTypes(argCount, argTypes, argWireTypes) {
    var a = new Array(argCount);
    for (var i = 0; i < argCount; ++i) {
        a[i] = requireRegisteredType(
            HEAP32[(argTypes >> 2) + i],
            "parameter " + i);
    }
    return a;
}
function __emval_get_method_caller(argCount, argTypes) {
    var types = lookupTypes(argCount, argTypes);
    var retType = types[0];
    var signatureName = retType.name + "_$" + types.slice(1).map(function (t) { return t.name; }).join("_") + "$";
    var args1 = ["addFunction", "createNamedFunction", "requireHandle", "getStringOrSymbol", "_emval_handle_array", "retType"];
    var args2 = [Runtime.addFunction, createNamedFunction, requireHandle, getStringOrSymbol, _emval_handle_array, retType];
    var argsList = ""; // 'arg0, arg1, arg2, ... , argN'
    var argsListWired = ""; // 'arg0Wired, ..., argNWired'
    for (var i = 0; i < argCount - 1; ++i) {
        argsList += (i !== 0 ? ", " : "") + "arg" + i;
        argsListWired += ", arg" + i + "Wired";
        args1.push("argType" + i);
        args2.push(types[1 + i]);
    }
    var invokerFnBody =
        "return addFunction(createNamedFunction('" + signatureName + "', function (handle, name" + argsListWired + ") {\n" +
        "requireHandle(handle);\n" +
        "name = getStringOrSymbol(name);\n";
    for (var i = 0; i < argCount - 1; ++i) {
        invokerFnBody += "var arg" + i + " = argType" + i + ".fromWireType(arg" + i + "Wired);\n";
    }
    invokerFnBody +=
        "var obj = _emval_handle_array[handle].value;\n" +
        "return retType.toWireType(null, obj[name](" + argsList + "));\n" + 
        "}));\n";
    args1.push(invokerFnBody);
    var invokerFunction = new_(Function, args1).apply(null, args2);
    return invokerFunction;
}
function __emval_has_function(handle, name) {
    name = getStringOrSymbol(name);
    return _emval_handle_array[handle].value[name] instanceof Function;
}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}