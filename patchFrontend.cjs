
const fs = require('fs');
let c = fs.readFileSync('src/pages/OraclePage.jsx', 'utf8');

c = c.replace('if (data.planets) setOraclePlanets(data.planets);', 'if (data.planets) setOraclePlanets(data.planets); if (data.prokeralaDebug) addLog(\\\'ProkeralaDebug\\\', data.prokeralaDebug);');
fs.writeFileSync('src/pages/OraclePage.jsx', c);

