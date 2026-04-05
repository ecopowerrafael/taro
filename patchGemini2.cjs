
const fs = require('fs');
let c = fs.readFileSync('api/routes/oracle.mjs', 'utf8');

c = c.replace(
  'let activeModel = creds.oracleGeminiModel || \\\'gemini-1.5-flash\\\';',
  'let activeModel = \\\'gemini-2.5-pro\\\';'
);

fs.writeFileSync('api/routes/oracle.mjs', c);
console.log('patched');

