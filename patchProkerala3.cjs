
const fs = require('fs');
let c = fs.readFileSync('api/routes/oracle.mjs', 'utf8');

c = c.replace('} catch (err) {', '} catch (err) {\\n            prokeralaDebug = { exception: err.message };');
fs.writeFileSync('api/routes/oracle.mjs', c);
console.log('patched catch');

