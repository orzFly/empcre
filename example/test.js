const PCRE = require('..')

var match = function (re, input, offset) {
  console.log(
    'Matching ' + re + ' against "' + input + '"',
    re.match(input, offset));
  };

var re;

re = new PCRE('h(.*)o');
match(re, '  hello  ');
match(re, 'ho');

re = new PCRE('h(.*)o', 'i');
match(re, 'HIJKLMNO');

re = new PCRE(`
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
  \\]
`, "x")
match(re, "hello - s01e01 - xxx")