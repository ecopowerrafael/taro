
const fs = require('fs');
let content = fs.readFileSync('api/routes/oracle.mjs', 'utf8');

const target = 'console.log(\'[API/Prokerala] Response:\', astroData?.data?.planet_position ? \'Got Planets\' : JSON.stringify(astroData).substring(0, 100))';
const replacement = target + \\n            if (astroData.errors) {\n              astrologyContext = 'Prokerala Error: ' + JSON.stringify(astroData.errors);\n            }\;

content = content.replace(target, replacement);
fs.writeFileSync('api/routes/oracle.mjs', content);
console.log('patched');

