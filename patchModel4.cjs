const fs=require('fs');
let c=fs.readFileSync('api/routes/oracle.mjs','utf8');
c = c.replace(/const modelName = creds\.oracleGeminiModel \|\| 'gemini-pro'/, "let modelName = creds.oracleGeminiModel || 'gemini-pro';\n      if (modelName === 'gemini-1.5-flash') modelName = 'gemini-pro';");
fs.writeFileSync('api/routes/oracle.mjs',c);
console.log('patched');
