import { calculatePositions, detectAspect } from '../astroEngine.mjs';

const MALEFICS = ['Saturn', 'Mars', 'Pluto'];
const CRITICAL_HOUSES = [6, 8, 12];

const DIGNITIES = {
  Mars: { detriment: ['Taurus', 'Libra'], fall: ['Cancer'] },
  Saturn: { detriment: ['Cancer', 'Leo'], fall: ['Aries'] },
  Sun: { detriment: ['Aquarius'], fall: ['Libra'] },
  Moon: { detriment: ['Capricorn'], fall: ['Scorpio'] },
  Mercury: { detriment: ['Sagittarius', 'Pisces'], fall: ['Pisces'] },
  Venus: { detriment: ['Aries', 'Scorpio'], fall: ['Virgo'] },
  Jupiter: { detriment: ['Gemini', 'Virgo'], fall: ['Capricorn'] },
};

const PLANET_LABELS = {
  Sun: 'Sol',
  Moon: 'Lua',
  Mercury: 'Mercúrio',
  Venus: 'Vênus',
  Mars: 'Marte',
  Jupiter: 'Júpiter',
  Saturn: 'Saturno',
  Uranus: 'Urano',
  Neptune: 'Netuno',
  Pluto: 'Plutão',
};

const HOUSE_INTERPRETATIONS = {
  6: "afetando sua rotina, saúde e pequenos desafios diários. Cuidado com o estresse e a autocrítica.",
  8: "em uma zona de crises, transformações profundas e desapegos necessários. Momento de transmutação.",
  12: "no setor do inconsciente, isolamento e encerramentos. Atente-se a padrões ocultos e à sua saúde mental."
};

const ASPECT_INTERPRETATIONS = {
  'Quadratura': "gerando um conflito de vontades e a necessidade de romper bloqueios internos.",
  'Oposição': "trazendo tensões externas e a busca por um equilíbrio difícil entre polaridades."
};

/**
 * Calcula o Score de Criticidade de um planeta em trânsito
 */
function calculateCriticalityScore(planet, natalPlanets) {
  let score = 0;
  const reasons = [];

  // 1. Casa Crítica (6, 8, 12)
  if (CRITICAL_HOUSES.includes(planet.house)) {
    score += 50;
    reasons.push(`Casa ${planet.house}`);
  }

  // 2. Dignidade (Queda ou Detrimento)
  const dignity = DIGNITIES[planet.name];
  if (dignity) {
    if (dignity.fall.includes(planet.sign.name)) {
      score += 30;
      reasons.push('Queda');
    } else if (dignity.detriment.includes(planet.sign.name)) {
      score += 30;
      reasons.push('Detrimento');
    }
  }

  // 3. Aspectos Tensos com planetas natais
  let hasTenseAspect = false;
  for (const np of natalPlanets) {
    const aspect = detectAspect(planet.longitude, np.longitude);
    if (aspect === 'Quadratura' || aspect === 'Oposição') {
      const dist = Math.abs(planet.longitude - np.longitude);
      const orb = dist > 180 ? 360 - dist : dist;
      
      // Bonus para aspectos exatos (< 1°)
      if (orb < 1) {
        score += 25;
      } else {
        score += 20;
      }
      hasTenseAspect = true;
      reasons.push(`${aspect} com ${PLANET_LABELS[np.name] || np.name}`);
      break; // Pontua apenas uma vez para o aspecto mais tenso
    }
  }

  // 4. Maléficos Naturais
  if (MALEFICS.includes(planet.name)) {
    score += 10;
    reasons.push('Maléfico Natural');
  }

  return { score, reasons, hasTenseAspect };
}

export const criticalAstroService = {
  /**
   * Identifica o planeta mais crítico baseado no cache do oráculo diário ou cálculo atual
   */
  getCriticalAstro: async (natalPlanets, ascendantLon, dailyCache = null) => {
    if (!natalPlanets || natalPlanets.length === 0) return null;

    let transitPlanets = [];
    const ascSignIdx = Math.floor(ascendantLon / 30);

    if (dailyCache) {
      try {
        // O cache do oráculo diário já vem processado pelo transitEngine
        // Precisamos apenas garantir o formato esperado para pontuação
        const cachedTransits = typeof dailyCache === 'string' ? JSON.parse(dailyCache) : dailyCache;
        
        transitPlanets = cachedTransits.map(t => ({
          name: t.name,
          longitude: t.longitude,
          house: t.house,
          sign: { name: t.sign }
        }));
      } catch (err) {
        console.error('[CriticalAstro] Erro ao ler dailyCache:', err);
      }
    }

    // Se não tiver cache ou falhar, calcula posições atuais
    if (transitPlanets.length === 0) {
      const now = new Date().toISOString();
      const transitPlanetsRaw = await calculatePositions(now);
      
      transitPlanets = transitPlanetsRaw.map(tp => {
        const planetSignIdx = Math.floor(tp.longitude / 30);
        const house = ((planetSignIdx - ascSignIdx + 12) % 12) + 1;
        return { ...tp, house };
      });
    }

    const scoredPlanets = transitPlanets.map(tp => {
      const { score, reasons, hasTenseAspect } = calculateCriticalityScore(tp, natalPlanets);
      return { ...tp, score, reasons, hasTenseAspect };
    });

    // Ordenar por score e pegar o maior
    const critical = scoredPlanets.sort((a, b) => b.score - a.score)[0];

    if (!critical || critical.score < 20) return null; // Só alerta se houver tensão real

    // Gerar interpretação mística
    let interpretacao = "";
    if (CRITICAL_HOUSES.includes(critical.house)) {
      interpretacao = HOUSE_INTERPRETATIONS[critical.house];
    } else if (critical.hasTenseAspect) {
      // Se não está em casa crítica mas tem aspecto tenso
      interpretacao = "gerando desafios em sua estrutura energética hoje. Atente-se aos impulsos.";
    } else {
      interpretacao = "exigindo maior consciência e cautela em suas ações neste momento.";
    }

    return {
      planeta: PLANET_LABELS[critical.name] || critical.name,
      casa: critical.house,
      score: critical.score,
      interpretacao: `Atenção ao trânsito de ${PLANET_LABELS[critical.name] || critical.name} na sua Casa ${critical.house} hoje. Este astro está ${interpretacao}`,
      reasons: critical.reasons
    };
  }
};
