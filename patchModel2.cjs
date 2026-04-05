const fs = require('fs');
let c = fs.readFileSync('api/routes/oracle.mjs', 'utf8');
const oldUrl = /const geminiUrl = \https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-1\.5-flash\:generateContent\?key=\\\$\\{creds\.oracleGeminiKey\\}\/;
const newUrl = "const modelName = creds.oracleGeminiModel || 'gemini-1.5-flash';\\n      const geminiUrl = \https://generativelanguage.googleapis.com/v1beta/models/\:generateContent?key=\\";
c = c.replace(oldUrl, newUrl);
fs.writeFileSync('api/routes/oracle.mjs', c);
console.log('patched url');
