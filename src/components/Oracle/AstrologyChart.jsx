import React from 'react';
import { motion } from 'framer-motion';

const translationMap = {
  "Aries": "Áries",
  "Taurus": "Touro",
  "Gemini": "Gêmeos",
  "Cancer": "Câncer",
  "Leo": "Leão",
  "Virgo": "Virgem",
  "Libra": "Libra",
  "Scorpio": "Escorpião",
  "Sagittarius": "Sagitário",
  "Capricorn": "Capricórnio",
  "Aquarius": "Aquário",
  "Pisces": "Peixes",
  "Sun": "Sol",
  "Moon": "Lua",
  "Mercury": "Mercúrio",
  "Venus": "Vênus",
  "Mars": "Marte",
  "Jupiter": "Júpiter",
  "Saturn": "Saturno",
  "Uranus": "Urano",
  "Neptune": "Netuno",
  "Pluto": "Plutão",
  "True Node": "Nodo Norte",
  "Descendant": "Descendente",
  "Ascendant": "Ascendente"
};

const planetIcons = {
  "Sun": "☉",
  "Moon": "☽",
  "Mercury": "☿",
  "Venus": "♀",
  "Mars": "♂",
  "Jupiter": "♃",
  "Saturn": "♄",
  "Uranus": "♅",
  "Neptune": "♆",
  "Pluto": "♇",
  "True Node": "☊"
};

const signSymbols = ["♈︎","♉︎","♊︎","♋︎","♌︎","♍︎","♎︎","♏︎","♐︎","♑︎","♒︎","♓︎"];

const t = (term) => translationMap[term] || term;

export function AstrologyChart({ planets }) {
  if (!planets || planets.length === 0) return null;

  return (
    <div className="relative w-full max-w-[300px] aspect-square mx-auto my-8">
      {/* Outer Circle (Zodiac Wheel) */}
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">
        <circle cx="100" cy="100" r="90" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.3" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.3" />
        
        {/* Draw 12 House Lines and Zodiac Signs roughly */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30) * (Math.PI / 180);
          const x2 = 100 + 90 * Math.cos(angle);
          const y2 = 100 + 90 * Math.sin(angle);
          
          // Sign symbol position
          const signAngle = ((i * 30) + 15) * (Math.PI / 180);
          const sx = 100 + 75 * Math.cos(signAngle);
          const sy = 100 + 75 * Math.sin(signAngle);

          return (
            <g key={`house-${i}`}>
              <line x1="100" y1="100" x2={x2} y2={y2} stroke="#D4AF37" strokeWidth="0.5" opacity="0.2" />
              <text x={sx} y={sy} textAnchor="middle" dominantBaseline="central" fill="#D4AF37" fontSize="10" opacity="0.5">
                {signSymbols[i]}
              </text>
            </g>
          );
        })}

        {/* Plot Planets based on degrees (0-360) */}
        {planets.map((planet, idx) => {
          if (!planetIcons[planet.name]) return null;
          
          // Prokerala returns 'degree' 0-360 starting from Aries. Math angle 0 is 3 o'clock.
          const degree = Number(planet.degree);
          const angle = degree * (Math.PI / 180);
          // R varies slightly so text does not overlap as much, or just keep it around 40-50
          const r = 45 + (idx % 3) * 5; 
          const px = 100 + r * Math.cos(angle);
          const py = 100 + r * Math.sin(angle);

          return (
            <g key={planet.name}>
              <circle cx={px} cy={py} r="2" fill="#fff" />
              <text x={px} y={py - 5} textAnchor="middle" fill="#fff" fontSize="10">
                {planetIcons[planet.name]}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute -inset-4 bg-mystic-purple/10 rounded-full blur-xl -z-10 mix-blend-screen pointer-events-none" />
      
      <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
         {planets.slice(0, 5).map(p => (
            <span key={p.name} className="px-2 py-1 bg-black/40 border border-mystic-gold/30 rounded-full text-gray-300">
               <span className="text-mystic-gold mr-1">{planetIcons[p.name] || '✦'}</span>
               {t(p.name)} em {t(p.sign)}
            </span>
         ))}
      </div>
    </div>
  );
}