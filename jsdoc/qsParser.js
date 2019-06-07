var color = require('color');

exports.defineTags = function(dict) {
  dict.defineTag('qs', {
    canHaveName: true,
    onTagged: function(doclet, tag) {
      doclet.kind = 'qs';
      doclet.name = tag.value.name;
      doclet.longname = tag.value.name;
    },
  });

  dict.defineTag('style', {
    onTagged: function(doclet) {
      doclet.kind = 'style';
    },
  });

  dict.defineTag('implement', {
    onTagged: function(doclet, tag) {
      doclet.implements = tag.value;
    },
  });

  dict.defineTag('colors', {
    //special colors enum
    onTagged: function(doclet) {
      doclet.kind='colors';
    },
  });
};

function getHex(int) {
  var hex = int.toString(16);
  if (hex.length < 2) {
    hex = '0' + hex;
  }
  return hex;
}

var colorRegex = /(color\('#?[\w]*'\)[^,\S]*),/;
exports.handlers = {
  beforeParse: function(e) {
    var match = e.source.match(colorRegex);
    while (match) {
      var cEval = eval(match[1]);
      var op = cEval.alpha();
      cEval = cEval.rgb();
      var hex = '#' + getHex(cEval.r) + getHex(cEval.g) + getHex(cEval.b);
      e.source = e.source.replace(match[1], '\'' + hex + '-' + op + '\'');
      match = e.source.match(colorRegex);
    }
  },
};
