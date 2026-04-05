const fs = require('fs');
let c = fs.readFileSync('api/routes/oracle.mjs', 'utf8');
const s = c.indexOf('if (tokenData.access_token) {');
const e = c.indexOf('} catch (err) {');
const p = 'if (tokenData.access_token) {\\n' +
'  const formattedDate = parseDateString(user.oracle_birth_date || (user.birthDate && new Date(user.birthDate).toISOString()));\\n' +
'  let pUrl = \https://api.prokerala.com/v2/astrology/planet-position?datetime=\&coordinates=\,\\;\\n' +
'  const astroRes = await fetch(pUrl, { headers: { \\'Authorization\\': \Bearer \\ } });\\n' +
'  const astroData = await astroRes.json();\\n' +
'  prokeralaDebug = { endpoint: pUrl, status: astroRes.status, payload: astroData };\\n' +
'  if (astroData && astroData.data && astroData.data.planet_position) {\\n' +
'    rawPlanets = astroData.data.planet_position;\\n' +
'    const planetsData = rawPlanets.map(p => \\ em \°\).join(\", \");\\n' +
'    astrologyContext = \Planetas no mapa astral de nascimento: \.\;\\n' +
'  }\\n' +
'} else {\\n' +
'  prokeralaDebug = { authError: tokenData };\\n' +
'}\\n' +
'          ';
c = c.slice(0, s) + p + c.slice(e);
fs.writeFileSync('api/routes/oracle.mjs', c);
