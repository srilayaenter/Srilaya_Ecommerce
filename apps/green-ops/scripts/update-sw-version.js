const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const swPath = path.join(__dirname, '../www/sw.js');

let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(/const CACHE_NAME = 'srilaya-green-ops-[^']+';/, `const CACHE_NAME = 'srilaya-green-ops-${pkg.version}';`);
fs.writeFileSync(swPath, sw);

console.log(`sw.js cache name set to srilaya-green-ops-${pkg.version}`);
