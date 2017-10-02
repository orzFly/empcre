Module = require("../dist/empcre.js")
window = global
require("../src/js/empcre.js")

var match = function (re, input, offset) {
        console.log(
            'Matching ' + re + ' against "' + input + '"',
            re.match(input, offset));
    },
    re;

re = new RE('h(.*)o');
match(re, '  hello  ');
match(re, 'ho');

re = new RE('h(.*)o', 'i');
match(re, 'HIJKLMNO');

re = new RE(`
            (?<=[\\.\\[\\] \\-_\\(\\)vV])
                (?:[sS](?<season>\\d{1,3}))?
                [eE][pP]?(?<episode>\\d{1,3})
                (?:(?:[&-]|[eE][pP]?|[&-][eE][pP]?)(?<episodeend>\\d{1,3}))?
                (?:[vV]\\d)?
            (?=[\\.\\[\\] \\-_\\(\\)vV])
            |
            \\[
                (?<episode2>\\d{1,3})
                (?:[&-](?<episodeend2>\\d{1,3}))?
                (?:[vV]\\d)?
                (?:\\s*[eE][nN][dD])?
            \\]`, "x")
match(re, "hello - s01e01 - xxx")