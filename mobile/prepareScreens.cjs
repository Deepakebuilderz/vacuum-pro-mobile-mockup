const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Package the current prototype (including local edits) when Metro starts.
module.exports = function prepareScreens() {
  const root = path.resolve(__dirname, '..');
  const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
  const pages = {};
  for (const name of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
    pages[name] = read(name)
      .replace('<script src="app.js"></script>', '<script src="session.js"></script><script src="app.js"></script><script src="catalog-ui.js"></script>');
  }
  const files = {
    'styles.css': read('styles.css'),
    'app.js': read('app.js'),
    'finder.js': read('finder.js'),
    'pages.js': 'const pages = ' + JSON.stringify(pages) + ';',
  };
  for (const name of ['shell.html', 'session.js', 'catalog-ui.js', 'host.js']) {
    files[name] = fs.readFileSync(path.join(__dirname, 'screens', name), 'utf8');
  }
  const images = {};
  const names = ['logo.png', 'storefront-hero.jpg', 'oreck.png', 'hoover.png',
    ...fs.readdirSync(path.join(root, 'catalog-images')).filter(name => /\.(png|jpe?g|webp)$/i.test(name)).map(name => 'catalog-images/' + name)];
  for (const name of names) images[name] = fs.readFileSync(path.join(root, name)).toString('base64');
  const version = crypto.createHash('sha256').update(JSON.stringify([files, images])).digest('hex').slice(0, 16);
  const output = path.join(__dirname, 'generated', 'screens.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const text = JSON.stringify({ version, files, images });
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== text) fs.writeFileSync(output, text);
};
