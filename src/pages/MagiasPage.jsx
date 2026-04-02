import { useMemo, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { SpellPurchaseModal } from '../components/SpellPurchaseModal'
import { SacredGeometry } from '../components/SacredGeometry'
import { usePlatformContext } from '../context/platform-context'

export function MagiasPage() {
  const [selectedSpell, setSelectedSpell] = useState(null)
  const { spells } = usePlatformContext()

  const highlightedSpells = useMemo(() => spells.slice(0, 3), [spells])

  return (
    <div className="min-h-screen bg-mystic-black text-white overflow-x-hidden font-lato selection:bg-mystic-gold/30 selection:text-mystic-gold">
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mystic-purple-dark/40 via-mystic-black to-mystic-black" />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />
      <SacredGeometry />

      <PageShell title="Magias" subtitle="Conecte-se às forças do cosmos através de rituais personalizados. Onde a precisão astronômica encontra a magia ancestral para transformar sua realidade.">
        <section className="mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-mystic-purple-light/30 bg-mystic-purple-light/10 backdrop-blur-sm mb-8">
            <Sparkles className="w-4 h-4 text-mystic-gold" />
            <span className="text-xs uppercase tracking-widest text-mystic-purple-light">Alquimia Espiritual</span>
          </div>

          <h1 className="font-playfair text-5xl md:text-6xl leading-[1.1] mb-6 drop-shadow-2xl">
            Rituais sob Medida <br/>
            <span className="text-gradient-gold italic">com Mentores de Elite</span> <br/>
            e Fluxo Unificado
          </h1>

          <p className="text-lg md:text-xl text-mystic-purple-light mb-8 max-w-2xl leading-relaxed font-light">
            Explore nossa seleção de rituais exclusivos, conduzidos por mestres da tradição. Escolha sua linhagem, alinhe sua intenção e ative sua transformação com fluidez imediata.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {spells.length === 0 ? (
            <div className="md:col-span-3 rounded-2xl border border-mystic-gold/25 bg-black/25 p-10 text-center text-amber-100/70">
              Nenhuma magia publicada ainda. Cadastre os produtos na nova guia Magias do admin.
            </div>
          ) : (
            spells.map((spell) => (
              <article key={spell.id} className="group relative overflow-hidden rounded-3xl border border-mystic-purple-light/20 bg-black/25 p-4 transition-all duration-500 hover:-translate-y-2 hover:border-mystic-gold/50">
                <div className="absolute inset-0 bg-gradient-to-b from-mystic-gold/0 via-transparent to-mystic-gold/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative z-10 grid gap-4">
                  <div className="overflow-hidden rounded-2xl border border-mystic-gold/15 bg-black/35">
                    {spell.imageUrl ? (
                      <img src={spell.imageUrl} alt={spell.title} className="h-56 w-full object-cover transition duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-56 items-center justify-center text-sm text-ethereal-silver/40">Imagem não informada</div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-mystic-goldSoft/75">Feita por {spell.consultantName}</p>
                    <h3 className="mt-2 font-playfair text-3xl text-white transition-colors group-hover:text-mystic-gold">{spell.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-mystic-purple-light">{spell.shortDescription || spell.description}</p>
                  </div>

                  <div className="flex items-end justify-between gap-3 border-t border-mystic-gold/15 pt-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-mystic-purple-light/70">Investimento</p>
                      <p className="font-playfair text-3xl text-mystic-gold">R$ {Number(spell.price).toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedSpell(spell)}
                      className="inline-flex items-center gap-2 rounded-full bg-mystic-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-black transition hover:brightness-110"
                    >
                      Ativar Ritual
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="rounded-2xl glass-panel border border-mystic-purple-light/20 p-12 mb-20">
          <h2 className="font-playfair text-4xl text-white mb-8 flex items-center gap-3">
            Como o Ritual <span className="text-gradient-gold italic">funciona</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Escolha', description: 'Selecione a magia disponível na vitrine' },
              { step: '02', title: 'Pague', description: 'Finalize em PIX ou cartão de crédito' },
              { step: '03', title: 'Contato', description: 'O Profissional responsável pelo Ritual entrará em contato para solicitar informações adicionais caso necessário' },
              { step: '04', title: 'Resultado', description: 'O Ritual é feito e você notará o Resultado em poucos dias conforme a demanda solicitada.' },
            ].map((item, idx) => (
              <div key={idx} className="rounded-xl border border-mystic-gold/30 bg-mystic-purple-dark/30 p-6 text-center">
                <p className="font-playfair text-4xl text-mystic-gold mb-3">{item.step}</p>
                <h3 className="font-playfair text-xl text-white mb-3">{item.title}</h3>
                <p className="text-mystic-purple-light text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {highlightedSpells.length > 0 && (
          <section className="text-center">
            <h2 className="font-playfair text-4xl text-white mb-4">Selecione a magia ideal</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-mystic-purple-light">
              A vitrine agora é alimentada diretamente pelo admin, então preço, consultor e descrição sempre refletem o cadastro ativo.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {highlightedSpells.map((spell) => (
                <button
                  key={spell.id}
                  onClick={() => setSelectedSpell(spell)}
                  className="rounded-full border border-mystic-gold/35 bg-black/30 px-5 py-3 text-sm text-amber-100/85 transition hover:bg-mystic-gold/10"
                >
                  {spell.title}
                </button>
              ))}
            </div>
          </section>
        )}
      </PageShell>

      {selectedSpell && <SpellPurchaseModal spell={selectedSpell} onClose={() => setSelectedSpell(null)} />}
    </div>
  )
}
