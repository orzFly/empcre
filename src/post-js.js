// Until PR #6477 is merged this is needed
// https://github.com/kripken/emscripten/pull/6477

if (typeof exports === 'object' && typeof module === 'object') {
    module['exports'] = Module;
} else if (typeof define === 'function' && define['amd']) {
    define([], function() { return Module; });
} else if (typeof exports === 'object') {
    exports["{{{ EXPORT_NAME }}}"] = Module;
}
