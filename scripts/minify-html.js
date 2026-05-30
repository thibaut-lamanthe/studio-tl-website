const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');

const files = [
  path.join('dist', 'index.html'),
  path.join('dist', 'en', 'index.html')
];

const options = {
  collapseWhitespace: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  decodeEntities: true
};

(async () => {
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const minified = await minify(html, options);
    fs.writeFileSync(file, minified);
    console.log('Minified ' + file);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
