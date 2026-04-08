/**
 * astroEngine.mjs
 * Motor astrológico local usando a biblioteca astronomia (VSOP87 / Meeus).
 * Substitui a API Prokerala — custo zero, sem latência de rede, precisão equivalente.
 *
 * Sistema: Sidereal com Ayanamsa Lahiri (igual ao Prokerala ayanamsa=1)
 * Casas:   Whole Sign (tradicional védico / Jyotish)
 */

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const astro = require('astronomia')
const {
  julian,
  solar,
  moonposition,
  sidereal,
  nutation,
  planetposition,
  base,
} = astro

// ── Dados VSOP87 ──────────────────────────────────────────────────────────────
const loadVsop = (name) => {
  const d = require(`astronomia/data/${name}`)
  return d.default || d
}
const vsopEarth   = loadVsop('vsop87Bearth')
const vsopMercury = loadVsop('vsop87Bmercury')
const vsopVenus   = loadVsop('vsop87Bvenus')
const vsopMars    = loadVsop('vsop87Bmars')
const vsopJupiter = loadVsop('vsop87Bjupiter')
const vsopSaturn  = loadVsop('vsop87Bsaturn')
const vsopUranus  = loadVsop('vsop87Buranus')
const vsopNeptune = loadVsop('vsop87Bneptune')

// Instâncias Planet (criadas uma vez, reutilizadas em cada cálculo)
const earth   = new planetposition.Planet(vsopEarth)
const mercury = new planetposition.Planet(vsopMercury)
const venus   = new planetposition.Planet(vsopVenus)
const mars    = new planetposition.Planet(vsopMars)
const jupiter = new planetposition.Planet(vsopJupiter)
const saturn  = new planetposition.Planet(vsopSaturn)
const uranus  = new planetposition.Planet(vsopUranus)
const neptune = new planetposition.Planet(vsopNeptune)

// ── Constantes ────────────────────────────────────────────────────────────────
const TWO_PI = 2 * Math.PI
const DEG = 180 / Math.PI   // rad → degrees
const RAD = Math.PI / 180   // degrees → rad

const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
]

// ── Helpers matemáticos ───────────────────────────────────────────────────────
/** Módulo positivo */
function pmod(x, m) {
  return ((x % m) + m) % m
}

/** Normaliza longitude [0, 360) */
function norm360(deg) {
  return pmod(deg, 360)
}

// ── Ayanamsa Lahiri ───────────────────────────────────────────────────────────
/**
 * Calcula o Ayanamsa Lahiri (Chitrapaksha) em graus tropicais para um JDE.
 * Base: 23°51'11" em J2000.0 + 50.2389"/ano
 * Isso é equivalente ao Prokerala ayanamsa=1
 */
function lahiriAyanamsa(jde) {
  const T_years = (jde - 2451545.0) / 365.25
  return 23.8531 + 0.013956 * T_years
}

/** Converte longitude tropical em sidereal subtraindo o ayanamsa */
function toSidereal(tropicalDeg, ayanamsaDeg) {
  return norm360(tropicalDeg - ayanamsaDeg)
}

// ── Conversão heliocêntrica → geocêntrica ────────────────────────────────────
/**
 * Retorna a longitude eclíptica geocêntrica TROPICAL em graus [0,360).
 * Usa coordenadas retangulares heliocêntricas do planeta e da Terra.
 * O campo _ra do Planet.position() é a longitude eclíptica heliocêntrica (rad).
 */
function helioToGeoLon(planet, jde) {
  const ePos = earth.position(jde)
  const pPos = planet.position(jde)

  const xe = ePos.range * Math.cos(ePos._dec) * Math.cos(ePos._ra)
  const ye = ePos.range * Math.cos(ePos._dec) * Math.sin(ePos._ra)

  const xp = pPos.range * Math.cos(pPos._dec) * Math.cos(pPos._ra)
  const yp = pPos.range * Math.cos(pPos._dec) * Math.sin(pPos._ra)

  return norm360(Math.atan2(yp - ye, xp - xe) * DEG)
}

// ── Retrogradação ─────────────────────────────────────────────────────────────
/**
 * Verifica retrogradação comparando a longitude 12 horas antes e depois.
 * Retorna true se o planeta estiver se movendo para trás (decrescente).
 */
function isRetrograde(getLon, jde) {
  const before = getLon(jde - 0.5)
  const after  = getLon(jde + 0.5)
  let diff = after - before
  // Normaliza a diferença para [-180, 180]
  if (diff > 180)  diff -= 360
  if (diff < -180) diff += 360
  return diff < 0
}

// ── Ascendente ────────────────────────────────────────────────────────────────
/**
 * Calcula a longitude tropical do Ascendente em graus [0,360).
 * Fórmula: Meeus "Astronomical Algorithms" Cap. 14
 * RAMC = Local Apparent Sidereal Time convertido para ângulo horário
 */
function calcAscendant(jde, latDeg, lngDeg) {
  // Tempo Sidéreo Aparente de Greenwich → normalizado [0, 2π)
  const GAST   = pmod(sidereal.apparent(jde), TWO_PI)
  // Tempo Sidéreo Local = GAST + longitude  
  const LAST   = pmod(GAST + lngDeg * RAD, TWO_PI)
  const latRad = latDeg * RAD
  const eps    = nutation.meanObliquity(jde) // obliquidade em radianos

  // Longitude do Meio-do-Céu (MC) tropical
  const mcLon = norm360(Math.atan2(Math.sin(LAST), Math.cos(eps) * Math.cos(LAST)) * DEG)

  // Longitude do Ascendente
  const y = -Math.cos(LAST)
  const x = Math.sin(eps) * Math.tan(latRad) + Math.cos(eps) * Math.sin(LAST)
  let ascLon = norm360(Math.atan2(y, x) * DEG)

  // Correção de quadrante: Ascendente deve estar ~90° à frente do MC
  const diff = norm360(ascLon - mcLon)
  if (diff < 90 || diff > 270) {
    ascLon = norm360(ascLon + 180)
  }

  return ascLon
}

// ── Auxiliares de signo / nakshatra ───────────────────────────────────────────
function signName(sidDeg)      { return SIGN_NAMES[Math.floor(sidDeg / 30)] }
function nakshatraName(sidDeg) { return NAKSHATRA_NAMES[Math.floor(sidDeg / (360 / 27))] }
function normDegree(sidDeg)    { return sidDeg % 30 }

/** Casa Whole Sign: diferença de signos entre o planeta e o Ascendente */
function wholeSignHouse(sidLon, ascSidLon) {
  const ascIdx     = Math.floor(ascSidLon / 30)
  const planetIdx  = Math.floor(sidLon / 30)
  return pmod(planetIdx - ascIdx, 12) + 1
}

/** Monta o objeto planeta no formato compatível com o restante do sistema */
function makePlanet(name, sidLon, house, retrograde) {
  const normDeg = normDegree(sidLon)
  return {
    name,
    longitude:    sidLon,            // longitude sidereal 0-360 (campo usado pelo frontend)
    degree:       sidLon,            // alias para compatibilidade
    normDegree:   normDeg,
    sign:         { name: signName(sidLon) },
    nakshatra:    { name: nakshatraName(sidLon) },
    house,
    position:     house,             // alias usado pelo AstrologyChart.jsx
    isRetrograde: retrograde,
    is_retrograde: retrograde,       // alias no formato snake_case
  }
}

// ── Nodo Lunar (Rahu) ─────────────────────────────────────────────────────────
/**
 * Nodo Médio Ascendente da Lua (Rahu) em graus tropicais.
 * Fórmula de Meeus Cap. 22, precisa a ~1' arco.
 */
function meanAscendingNode(jde) {
  const T = base.J2000Century(jde)
  const Omega = norm360(
    125.0445479
    - 1934.1362608 * T
    +    0.0020754 * T * T
    +    T * T * T / 467441
    -    T * T * T * T / 60616000
  )
  return Omega  // graus tropicais
}

// ── Função principal ──────────────────────────────────────────────────────────
/**
 * Calcula o mapa natal completo.
 *
 * @param {string} birthDateIso - Data/hora de nascimento em ISO 8601 UTC (ex: "1990-05-15T12:00:00Z")
 * @param {number|null} lat - Latitude de nascimento em graus decimais
 * @param {number|null} lng - Longitude de nascimento em graus decimais
 * @returns {Array} Array de objetos planeta no formato esperado pelo sistema
 */
export async function calculateChart(birthDateIso, lat, lng) {
  const dt = new Date(birthDateIso)
  if (isNaN(dt.getTime())) {
    throw new Error(`Data de nascimento inválida: ${birthDateIso}`)
  }

  // Dia fracionário em UTC para o cálculo do JDE
  const year    = dt.getUTCFullYear()
  const month   = dt.getUTCMonth() + 1
  const dayFrac = dt.getUTCDate() + dt.getUTCHours() / 24 + dt.getUTCMinutes() / 1440

  const jde = julian.CalendarGregorianToJD(year, month, dayFrac)
  const T   = base.J2000Century(jde)
  const ayanamsa = lahiriAyanamsa(jde)

  // ── Sol ──────────────────────────────────────────────────────────────────
  const sunTropical  = norm360(solar.apparentLongitude(T) * DEG)
  const sunSidereal  = toSidereal(sunTropical, ayanamsa)

  // ── Lua ──────────────────────────────────────────────────────────────────
  const moonTropical = norm360(moonposition.position(jde)._ra * DEG)
  const moonSidereal = toSidereal(moonTropical, ayanamsa)

  // ── Planetas via VSOP87 (heliocêntrico → geocêntrico) ────────────────────
  const getGeoLon = (planet) => (j) => helioToGeoLon(planet, j)

  const mercuryTropical = helioToGeoLon(mercury, jde)
  const venusTropical   = helioToGeoLon(venus,   jde)
  const marsTropical    = helioToGeoLon(mars,     jde)
  const jupiterTropical = helioToGeoLon(jupiter,  jde)
  const saturnTropical  = helioToGeoLon(saturn,   jde)
  const uranusTropical  = helioToGeoLon(uranus,   jde)
  const neptuneTropical = helioToGeoLon(neptune,  jde)

  const mercurySidereal = toSidereal(mercuryTropical, ayanamsa)
  const venusSidereal   = toSidereal(venusTropical,   ayanamsa)
  const marsSidereal    = toSidereal(marsTropical,     ayanamsa)
  const jupiterSidereal = toSidereal(jupiterTropical,  ayanamsa)
  const saturnSidereal  = toSidereal(saturnTropical,   ayanamsa)
  const uranusSidereal  = toSidereal(uranusTropical,   ayanamsa)
  const neptuneSidereal = toSidereal(neptuneTropical,  ayanamsa)

  // ── Rahu / Ketu ──────────────────────────────────────────────────────────
  const rahuTropical  = meanAscendingNode(jde)
  const rahuSidereal  = toSidereal(rahuTropical, ayanamsa)
  const ketuSidereal  = norm360(rahuSidereal + 180)

  // ── Ascendente ────────────────────────────────────────────────────────────
  const hasCoords     = lat != null && lng != null && !isNaN(lat) && !isNaN(lng)
  const ascTropical   = hasCoords ? calcAscendant(jde, Number(lat), Number(lng)) : 0
  const ascSidereal   = toSidereal(ascTropical, ayanamsa)

  // ── Retrogradação ─────────────────────────────────────────────────────────
  const retMercury = isRetrograde(getGeoLon(mercury), jde)
  const retVenus   = isRetrograde(getGeoLon(venus),   jde)
  const retMars    = isRetrograde(getGeoLon(mars),     jde)
  const retJupiter = isRetrograde(getGeoLon(jupiter),  jde)
  const retSaturn  = isRetrograde(getGeoLon(saturn),   jde)
  const retUranus  = isRetrograde(getGeoLon(uranus),   jde)
  const retNeptune = isRetrograde(getGeoLon(neptune),  jde)

  // ── Monta o array final ───────────────────────────────────────────────────
  const house = (sidLon) => hasCoords ? wholeSignHouse(sidLon, ascSidereal) : null

  const planets = [
    makePlanet('Sun',     sunSidereal,     house(sunSidereal),     false),
    makePlanet('Moon',    moonSidereal,    house(moonSidereal),    false),
    makePlanet('Mercury', mercurySidereal, house(mercurySidereal), retMercury),
    makePlanet('Venus',   venusSidereal,   house(venusSidereal),   retVenus),
    makePlanet('Mars',    marsSidereal,    house(marsSidereal),    retMars),
    makePlanet('Jupiter', jupiterSidereal, house(jupiterSidereal), retJupiter),
    makePlanet('Saturn',  saturnSidereal,  house(saturnSidereal),  retSaturn),
    makePlanet('Uranus',  uranusSidereal,  house(uranusSidereal),  retUranus),
    makePlanet('Neptune', neptuneSidereal, house(neptuneSidereal), retNeptune),
    makePlanet('Rahu',    rahuSidereal,    house(rahuSidereal),    true),  // Rahu é sempre retrógrado
    makePlanet('Ketu',    ketuSidereal,    house(ketuSidereal),    true),  // Ketu é sempre retrógrado
  ]

  if (hasCoords) {
    planets.push(makePlanet('Ascendant', ascSidereal, 1, false))
  }

  return planets
}
