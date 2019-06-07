var env = require('jsdoc/env');
var fs = require('fs-extra');
var path = require('path');
var template = require('jsdoc/template');

var outdir = path.normalize(env.opts.destination);

exports.publish = function(taffyData, opts) {
  var data = taffyData;
  data.sort('longname');
  var classes = data({kind: 'qs'}).get();
  var styles = data({kind: 'style'}).get();
  var enums = data({kind: 'member', isEnum: true}).get();
  var colors = data({kind: 'colors'}).get();

  var i;

  var names = {};

  var nav = {
    classes: [],
    enums: [],
    styles: [],
  };
  var content = {
    classes: [],
    enums: [],
    styles: [],
  };

  fs.ensureDirSync(outdir);

  var templatePath = path.normalize(opts.template);
  var view = new template.Template( path.join(templatePath, 'tmpl') );

  for (i=0;i<enums.length;i++) {
    nav.enums.push(enums[i].name);
    content.enums.push(view.render('enum.tmpl', enums[i]));
    names[enums[i].name] = true;
  }

  for (i=0;i<classes.length;i++) {
    var style = classes[i];
    if (style.params) {
      for (var p=0;p<style.params.length;p++) {
        if (style.params.type) {
          for (var n=0;n<style.params[p].type.names.length;n++) {
            if (names[style.params[p].type.names[n]] === true) {
              style.params[p].type.names[n] = {
                link: true,
                name: style.params[p].type.names[n],
              };
            }
          }
        }
      }
    }
    nav.classes.push(classes[i].name);
    content.classes.push(view.render('content.tmpl', classes[i]));
  }

  for (i=0;i<styles.length;i++) {
    nav.styles.push(styles[i].name);
    content.styles.push(view.render('content.tmpl', styles[i]));
  }

  var outpath = path.join(outdir, 'index.html');
  var html = view.render('home.tmpl', {nav: nav, content: content});

  fs.writeFileSync(outpath, html, 'utf8');

  outpath = path.join(outdir, 'colors.html');
  html = view.render('colors.tmpl', colors);

  fs.writeFileSync(outpath, html, 'utf8');

  // copy the template's static files to outdir
  var fromDir = path.join(templatePath, 'static');
  var staticFiles = readdirSync(fromDir);

  staticFiles.forEach(function(fileName) {
    var toDir = path.dirname( fileName.replace(fromDir, outdir) );
    fs.ensureDirSync(toDir);
    fs.copySync(fileName, toDir + '/' + fileName.split('/').slice(-1)[0]);
  });
};

function readdirSync(fromDir) {
  var files = [];
  var list = fs.readdirSync(fromDir);

  list.forEach(function(entry) {
    var fullPath = fromDir + '/' + entry;
    var stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files = files.concat(readdirSync(fullPath));
    } else {
      files.push(fullPath);
    }
  });

  return files;
}
