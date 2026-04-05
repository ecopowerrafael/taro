
const fs = require('fs');
let c = fs.readFileSync('api/routes/oracle.mjs', 'utf8');

const sIdx = c.indexOf('if (tokenData.access_token) {');
const eIdx = c.indexOf('} catch (err) {');

if (sIdx !== -1 && eIdx !== -1) {
  const p = \if (tokenData.access_token) {
    const formattedDate = parseDateString(user.oracle_birth_date || (user.birthDate && new Date(user.birthDate).toISOString()));
    let pUrl = \\\https://api.prokerala.com/v2/astrology/planet-position?datetime=\\\&coordinates=\\\,\\\\\\;
    const astroRes = await fetch(pUrl, { headers: { Authorization: \\\Bearer \\\\\\ } });
    const astroData = await astroRes.json();
    prokeralaDebug = { endpoint: pUrl, status: astroRes.status, payload: astroData };
    if (astroData && astroData.data && astroData.data.planet_position) {
      rawPlanets = astroData.data.planet_position;
      const planetsData = rawPlanets.map(p => \\\\\\ em \\\°\\\).join(', ');
      astrologyContext = \\\Planetas no mapa astral de nascimento: \\\.\\\;
    }
  } else {
    prokeralaDebug = { authError: tokenData };
  }
  \;
  
  const modified = c.slice(0, sIdx) + p + c.slice(eIdx);
  fs.writeFileSync('api/routes/oracle.mjs', modified);
  console.log('patched exactly');
} else {
  console.log('could not find indices');
}

