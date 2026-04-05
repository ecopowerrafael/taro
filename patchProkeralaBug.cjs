
const fs = require('fs');
let c = fs.readFileSync('api/routes/oracle.mjs', 'utf8');

c = c.replace(
  'const tokenData = await tokenRes.json()',
  'const tokenData = await tokenRes.json()\\n            prokeralaDebug = { AuthStep: tokenData };'
);

c = c.replace(
  'prokeralaDebug = { debug: astroData };',
  'prokeralaDebug = { TokenStep: tokenData, AstroStep: astroData };'
);

fs.writeFileSync('api/routes/oracle.mjs', c);
console.log('patched unconditionally');

