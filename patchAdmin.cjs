const fs=require('fs');
let c=fs.readFileSync('src/components/AdminPanel.jsx', 'utf8');

c = c.replace(/oracleGeminiKey: '',/, "oracleGeminiKey: '',\n      oracleGeminiModel: '',");
c = c.replace(/oracleGeminiKey: oracleCredentials\?.oracleGeminiKey \|\| '',/, "oracleGeminiKey: oracleCredentials?.oracleGeminiKey || '',\n          oracleGeminiModel: oracleCredentials?.oracleGeminiModel || '',");
c = c.replace(/oracleGeminiKey: credentialsDraft\.oracleGeminiKey,/, "oracleGeminiKey: credentialsDraft.oracleGeminiKey,\n          oracleGeminiModel: credentialsDraft.oracleGeminiModel,");

const inputJSX = \
                  <label className="grid gap-1.5 text-sm text-amber-100/75">
                    Google Gemini Model
                    <input
                      type="text"
                      value={credentialsDraft.oracleGeminiModel}
                      onChange={(e) => setCredentialsDraft({ ...credentialsDraft, oracleGeminiModel: e.target.value })}
                      placeholder="gemini-1.5-flash ou gemini-pro"
                      className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-sm text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/60"
                    />
                  </label>\;

c = c.replace(/<label className="grid gap-1\.5 text-sm text-amber-100\/75">\s*Google Gemini API Key/, inputJSX + "\n                  <label className=\"grid gap-1.5 text-sm text-amber-100/75\">\n                    Google Gemini API Key");

fs.writeFileSync('src/components/AdminPanel.jsx', c);
console.log('patched admin panel');
