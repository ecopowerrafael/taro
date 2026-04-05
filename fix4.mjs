import fs from 'fs';
let code = fs.readFileSync('src/pages/OraclePage.jsx', 'utf8');
code = code.replace(/setStep\('payment'\)/g, "setStep('ritual')");
fs.writeFileSync('src/pages/OraclePage.jsx', code);
console.log('Payment removed!');
