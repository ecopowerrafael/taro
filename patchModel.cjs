const fs = require('fs');

// Patch db.mjs
{
  let c = fs.readFileSync('api/db.mjs', 'utf8');
  if(!c.includes('oracleGeminiModel VARCHAR(255) NULL')) {
    c = c.replace(/oracleGeminiKey VARCHAR\(255\) NULL,/, "oracleGeminiKey VARCHAR(255) NULL,\n        oracleGeminiModel VARCHAR(255) NULL,");
    c = c.replace(/try {\s*await pool\.query\('ALTER TABLE platform_credentials ADD COLUMN oracleSystemPrompt TEXT NULL'\)\s*} catch \(e\) \{\}/, "try { await pool.query('ALTER TABLE platform_credentials ADD COLUMN oracleGeminiModel VARCHAR(255) NULL DEFAULT \\'gemini-1.5-flash\\'') } catch (e) {}\n    try { await pool.query('ALTER TABLE platform_credentials ADD COLUMN oracleSystemPrompt TEXT NULL') } catch (e) {}");
    fs.writeFileSync('api/db.mjs', c);
    console.log('patched db.mjs');
  }
}

// Patch credentials.mjs
{
  let c = fs.readFileSync('api/routes/credentials.mjs', 'utf8');
  if(!c.includes('oracleGeminiModel:')) {
    c = c.replace(/oracleGeminiKey: 'oracleGeminiKey',/, "oracleGeminiKey: 'oracleGeminiKey',\n        oracleGeminiModel: 'oracleGeminiModel',");
    c = c.replace(/'oracleGeminiKey',\s*'oracleProkeralaId'/, "'oracleGeminiKey', 'oracleGeminiModel', 'oracleProkeralaId'");
    fs.writeFileSync('api/routes/credentials.mjs', c);
    console.log('patched credentials.mjs');
  }
}

// Patch oracle.mjs
{
  let c = fs.readFileSync('api/routes/oracle.mjs', 'utf8');
  c = c.replace(/SELECT oracleProkeralaId, oracleProkeralaSecret, oracleGeminiKey, oracleSystemPrompt FROM platform_credentials/, "SELECT oracleProkeralaId, oracleProkeralaSecret, oracleGeminiKey, oracleGeminiModel, oracleSystemPrompt FROM platform_credentials");
  const oldUrl = /const geminiUrl \= https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-1\.5-flash:generateContent\?key=\$\{creds\.oracleGeminiKey\}/;
  const newUrl = "const modelName = creds.oracleGeminiModel || 'gemini-1.5-flash';\n      const geminiUrl = https://generativelanguage.googleapis.com/v1beta/models/:generateContent?key=";
  c = c.replace(oldUrl, newUrl);
  
  // also inject debug log for prokerala inside astrology try block
  c = c.replace(/const tokenData = await tokenRes\.json\(\)/, "const tokenData = await tokenRes.json()\n          console.log('[API/Prokerala] Token:', tokenData.access_token ? 'Ok' : tokenData.error || 'Failed')");
  c = c.replace(/const astroData = await astroRes\.json\(\)/, "const astroData = await astroRes.json()\n            console.log('[API/Prokerala] Response:', astroData?.data?.planet_position ? 'Got Planets' : JSON.stringify(astroData).substring(0, 100))");
  
  fs.writeFileSync('api/routes/oracle.mjs', c);
  console.log('patched oracle.mjs');
}

