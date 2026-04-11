import fs from 'fs';
let code = fs.readFileSync('src/pages/OraclePage.jsx', 'utf8');

const introRegex = /\{step === 'intro' && \([\s\S]*?Voltar[\s\S]*?<\/button>[\s\S]*?<\/motion\.div>\s*\)\}/;

const replacement = \{step === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <img src="/mapa-astral.png" alt="Mapa Astral" className="w-32 h-32 mx-auto drop-shadow-[0_0_20px_rgba(255,215,0,0.5)] object-contain" />
            <h1 className="text-3xl font-serif text-mystic-gold">Mapa Astral</h1>
            <p className="text-gray-300 px-4 leading-relaxed">
              Sincronize-se com o Universo. Na Astria, transformamos dados astronômicos em sabedoria ancestral. Descubra os segredos que moldam sua personalidade, seus desafios e sua força oculta. O Cosmo tem uma mensagem para você. Vamos ouvi-la?
            </p>
            <div className="relative inline-block mt-6">
              <ButtonExplosion isExploding={isExploding} />
              <button
                onClick={handleNextStep}
                className="relative z-10 bg-mystic-gold text-mystic-dark px-8 py-3 rounded-full font-bold shadow-[0_0_15px_rgba(255,215,0,0.5)] uppercase tracking-wider hover:scale-105 transition-transform"
              >
                Gerar meu Mapa Astral
              </button>
            </div>

            <div className="mt-8 px-6 pb-6 pt-4 bg-black/40 border border-mystic-gold/20 rounded-2xl max-w-md mx-auto shadow-inner">
              <span className="block text-xs font-serif text-mystic-gold mb-2 font-bold tracking-widest uppercase">"Sua biografia escrita pelo Cosmo"</span>
              <p className="text-[11px] text-gray-400 leading-relaxed text-justify">
                Nosso Oráculo utiliza cálculos reais de órbitas planetárias  os mesmos dados usados para navegação espacial  para garantir que seu mapa seja tecnicamente perfeito. A partir dessa base científica, nossa inteligência interpreta os símbolos e arquétipos ocidentais, revelando o mapa da sua essência.
              </p>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="block mx-auto text-sm text-gray-500 hover:text-white mt-4 pb-6 transition-colors"
            >
              Voltar
            </button>
          </motion.div>
        )}\;

code = code.replace(introRegex, replacement);

fs.writeFileSync('src/pages/OraclePage.jsx', code);
console.log('Intro updated!');
