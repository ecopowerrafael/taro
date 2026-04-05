import fs from 'fs';

let oracle = fs.readFileSync('src/pages/OraclePage.jsx', 'utf8');
oracle = oracle.replace(/import { StarFieldInput } from '..\/components\/Oracle\/StarFieldInput';/g, '');
oracle = oracle.replace(/import { CityAutocomplete } from '..\/components\/Oracle\/CityAutocomplete';/g, '');
oracle = oracle.replace(/<StarFieldInput[\s\S]*?\/>/g, '');

// Fix debug UI
oracle = oracle.replace(/<div className="absolute top-0 left-0 w-full max-h-40 overflow-y-auto bg-black\/80[\s\S]*?<\/div>\s*<\/div>/g, '');
oracle = oracle.replace(/const \[debugLogs, setDebugLogs\] = useState\(\[\]\);/g, '');
oracle = oracle.replace(/const addLog = \(tag, err\) => \{[\s\S]*?\};/g, '');

// Rename UI elements
oracle = oracle.replace(/Consultar<br\/>Oráculo Astria/g, 'Crie seu mapa astral grátis');

// Replace Gemini submit with CTA button to consultores
oracle = oracle.replace(/<h2 className="text-xl font-serif text-mystic-gold mb-4"> Faça sua Pergunta <\/h2>/, '');
oracle = oracle.replace(/Faça sua Pergunta/, 'Seu Mapa Astral');

let inject = '<div className="mt-8 text-center p-6 bg-[#1a0f2e]/80 border border-mystic-gold/30 rounded-2xl"><p className="text-gray-300 font-serif mb-4 text-lg">Quer saber mais sobre o que os Astros podem revelar?</p><button onClick={() => navigate(\"/consultores\")} className="bg-mystic-gold text-mystic-dark font-bold py-3 px-8 rounded-full shadow-[0_0_15px_rgba(255,215,0,0.5)] hover:scale-105 transition-all">Fale com um Consultor Ao vivo</button></div>';

oracle = oracle.replace(/Sua pergunta guia nosso caminho/, inject);

fs.writeFileSync('src/pages/OraclePage.jsx', oracle);

let home = fs.readFileSync('src/pages/ApkHomePage.jsx', 'utf8');
home = home.replace(/oráculo/ig, 'mapa astral').replace(/oraculo/ig, 'mapa-astral');
home = home.replace(/Consultar<br\/>Mapa Astral Astria/g, '<span className="text-shadow-neon text-mystic-gold">Crie seu mapa astral grátis</span>');
home = home.replace(/text-shadow-neon/g, 'drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] neon-text');
fs.writeFileSync('src/pages/ApkHomePage.jsx', home);

let dash = fs.readFileSync('src/components/ClientDashboard.jsx', 'utf8');
dash = dash.replace(/oráculo/ig, 'mapa astral').replace(/oraculo/ig, 'mapa-astral');
dash = dash.replace(/Consultar<br\/>Mapa Astral Astria/g, '<span className="drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] text-mystic-gold">Crie seu mapa astral grátis</span>');
fs.writeFileSync('src/components/ClientDashboard.jsx', dash);

