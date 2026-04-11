import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculatePositions, detectAspect } from './astroEngine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMBINATIONS_PATH = path.join(__dirname, '..', 'combinações.txt');

/**
 * Tabela de Ativos (Atores - Planetas de Trânsito)
 */
const ACTORS = {
  Sun:     { label: "Sol",     vibe: "sua essência e clareza", action: "Ilumina e traz foco" },
  Moon:    { label: "Lua",     vibe: "suas emoções e intuição", action: "Muda o humor e a sensibilidade" },
  Mercury: { label: "Mercúrio", vibe: "sua comunicação e mente", action: "Afeta conversas e tecnologia" },
  Venus:   { label: "Vênus",   vibe: "seu afeto e valores", action: "Traz harmonia, prazer ou gastos" },
  Mars:    { label: "Marte",   vibe: "sua coragem e impulso", action: "Gera ação ou conflitos" },
  Jupiter: { label: "Júpiter", vibe: "sua expansão e sorte", action: "Amplia tudo o que toca" },
  Saturn:  { label: "Saturno", vibe: "sua estrutura e limites", action: "Traz cobrança e amadurecimento" },
  Uranus:  { label: "Urano",   vibe: "sua liberdade e inovação", action: "Traz surpresas e quebra de padrões" },
  Neptune: { label: "Netuno",  vibe: "sua espiritualidade e sonhos", action: "Aumenta a sensibilidade e a intuição" },
  Pluto:   { label: "Plutão",  vibe: "sua transformação e poder", action: "Provoca renascimentos e limpezas profundas" },
};

/**
 * Tabela de Dinâmicas (Aspectos)
 */
const DYNAMICS = {
  'Conjunção': { label: "Conjunção", conector: "se funde intensamente com", energy: "neutral" },
  'Sextil':    { label: "Sextil",    conector: "abre uma oportunidade para", energy: "positive" },
  'Quadratura': { label: "Quadratura", conector: "gera um desafio necessário com", energy: "challenging" },
  'Trígono':   { label: "Trígono",   conector: "flui em perfeita harmonia com", energy: "positive" },
  'Oposição':  { label: "Oposição",  conector: "pede equilíbrio diante de", energy: "challenging" },
};

/**
 * Tabela de Alvos (Planetas Natais)
 */
const TARGETS = {
  Sun:       { label: "seu propósito e vitalidade", context: "sua essência" },
  Moon:      { label: "seu mundo interior e segurança", context: "suas emoções" },
  Mercury:   { label: "suas ideias e forma de se expressar", context: "sua mente" },
  Venus:     { label: "seus relacionamentos e desejos", context: "seus valores" },
  Mars:      { label: "sua força de vontade e iniciativa", context: "sua ação" },
  Jupiter:   { label: "sua busca por expansão e fé", context: "seu crescimento" },
  Saturn:    { label: "suas responsabilidades e estrutura", context: "sua disciplina" },
  Uranus:    { label: "seu desejo de liberdade", context: "sua originalidade" },
  Neptune:   { label: "seus sonhos e conexão espiritual", context: "sua inspiração" },
  Pluto:     { label: "seu poder de transformação", context: "seu renascimento" },
  Ascendant: { label: "sua imagem e como o mundo te vê", context: "sua personalidade" },
  'Meio do Céu': { label: "sua carreira e imagem pública", context: "seu destino" },
};

/**
 * Carrega a tabela de 50 combinações do arquivo txt.
 */
function loadCombinations() {
  try {
    const content = fs.readFileSync(COMBINATIONS_PATH, 'utf-8');
    const lines = content.split(/\r?\n/).slice(1); // Pula o cabeçalho
    
    const combinations = [];
    for (let line of lines) {
      if (!line.trim()) continue;
      
      const parts = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());
      
      if (parts.length >= 6) {
        combinations.push({
          id: parts[0],
          planetaHoje: parts[1],
          aspecto: parts[2],
          planetaNatal: parts[3],
          categoria: parts[4],
          textoPush: parts[5].replace(/^"|"$/g, '').trim()
        });
      }
    }
    
    return combinations;
  } catch (err) {
    console.error('Erro ao carregar combinações.txt:', err);
    return [];
  }
}

/**
 * Gera uma interpretação baseada na matriz ou no arquivo de combinações.
 */
export function generateInterpretation(transitPlanet, natalPlanet, aspectName) {
  const combinations = loadCombinations();
  const found = combinations.find(c => 
    c.planetaHoje === ACTORS[transitPlanet]?.label && 
    c.aspecto === aspectName && 
    c.planetaNatal === (TARGETS[natalPlanet]?.label || natalPlanet)
  );

  if (found) {
    return {
      title: found.categoria,
      text: found.textoPush,
      isSpecial: true
    };
  }

  // Fallback para lógica de matriz
  const actor = ACTORS[transitPlanet];
  const dynamic = DYNAMICS[aspectName];
  const target = TARGETS[natalPlanet];

  if (!actor || !dynamic || !target) return null;

  return {
    title: dynamic.label,
    text: `${actor.label} ${dynamic.conector} ${target.label}. ${actor.action} afetando ${target.context}.`,
    isSpecial: false
  };
}

/**
 * Calcula os trânsitos do dia para um usuário.
 */
export async function getDailyTransits(natalPlanets) {
  const now = new Date().toISOString();
  const transitPlanets = await calculatePositions(now);
  const activeAspects = [];

  // Planetas que queremos monitorar nos trânsitos (evitar asteroides ou pontos secundários se existirem)
  const mainPlanets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Marte', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Rahu', 'Ketu'];

  for (const tp of transitPlanets) {
    // Apenas processar planetas principais do trânsito
    if (!mainPlanets.includes(tp.name) && tp.name !== 'Mars') continue;

    for (const np of natalPlanets) {
      // Apenas processar planetas principais do natal
      if (!mainPlanets.includes(np.name) && np.name !== 'Mars' && np.name !== 'Ascendant' && np.name !== 'Meio do Céu') continue;

      const aspect = detectAspect(tp.longitude, np.longitude);
      if (aspect) {
        const interpretation = generateInterpretation(tp.name, np.name, aspect);
        if (interpretation) {
          activeAspects.push({
            transitPlanet: tp,
            natalPlanet: np,
            aspect,
            interpretation,
            orb: Math.abs(tp.longitude - np.longitude)
          });
        }
      }
    }
  }

  // Priorização: 
  // 1. Garantir que cada planeta de trânsito (tp) apareça apenas uma vez no Oráculo
  // 2. Escolher para cada tp o aspecto mais exato (menor orbe)
  const uniqueTransits = [];
  const processedPlanets = new Set();

  // Ordenar todos os aspectos detectados pelo orbe (mais exato primeiro)
  const sortedAspects = activeAspects.sort((a, b) => {
    const distA = Math.abs(a.transitPlanet.longitude - a.natalPlanet.longitude);
    const distB = Math.abs(b.transitPlanet.longitude - b.natalPlanet.longitude);
    const orbA = distA > 180 ? 360 - distA : distA;
    const orbB = distB > 180 ? 360 - distB : distB;
    return orbA - orbB;
  });

  for (const aspect of sortedAspects) {
    if (!processedPlanets.has(aspect.transitPlanet.name)) {
      uniqueTransits.push(aspect);
      processedPlanets.add(aspect.transitPlanet.name);
    }
  }

  // Limitar aos 12 mais importantes (embora agora tenhamos no máximo 1 por planeta de trânsito)
  return uniqueTransits.slice(0, 12);
}
