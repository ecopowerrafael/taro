import fs from 'fs';
let code = fs.readFileSync('src/App.jsx', 'utf8');
code = code.replace(/\/Mapa Astral/g, '/mapa-astral');
fs.writeFileSync('src/App.jsx', code);

const file3 = 'src/components/ClientDashboard.jsx';
let code3 = fs.readFileSync(file3, 'utf8');
code3 = code3.replace(/'\/or[aáAÁ]culo'/gi, "'/mapa-astral'");
code3 = code3.replace(/oraculo\.png/gi, 'mapa-astral.png');
code3 = code3.replace(/Consultar<br\/>Or[aáAÁ]culo Astria/gi, '<span className="drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] [text-shadow:_0_0_10px_#ffd700] text-mystic-gold">Crie seu mapa<br/>astral grátis</span>');
fs.writeFileSync(file3, code3);

const file4 = 'src/pages/ApkHomePage.jsx';
let code4 = fs.readFileSync(file4, 'utf8');
code4 = code4.replace(/'\/or[aáAÁ]culo'/gi, "'/mapa-astral'");
fs.writeFileSync(file4, code4);
