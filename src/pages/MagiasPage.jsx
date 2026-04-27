import { useTranslation } from 'react-i18next'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { SpellPurchaseModal } from '../components/SpellPurchaseModal'
import { SacredGeometry } from '../components/SacredGeometry'
import { usePlatformContext } from '../context/platform-context'
import { getTranslatedField } from '../utils/i18nHelper'

export function MagiasPage() {
  const { t } = useTranslation()
  const [selectedSpell, setSelectedSpell] = useState(null)
  const { spells } = usePlatformContext()

  const highlightedSpells = useMemo(() => spells.slice(0, 3), [spells])

  return (
    <div className="min-h-screen bg-mystic-black text-white overflow-x-hidden font-lato selection:bg-mystic-gold/30 selection:text-mystic-gold">
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mystic-purple-dark/40 via-mystic-black to-mystic-black" />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />
      <SacredGeometry />

      <PageShell 
        title={t('nav.spells', 'Magias')} 
        subtitle={<span className="text-[11px] leading-tight md:text-sm block">{t('spells.page_subtitle', 'Conecte-se às forças do cosmos através de rituais personalizados.')}</span>}
      >
        <section className="mb-8">
          <h1 className="font-playfair text-[20px] md:text-6xl leading-[1.25] md:leading-[1.1] mb-3 md:mb-6 drop-shadow-2xl">
            {t('spells.hero_title_1', 'Rituais sob Medida')} <span className="text-gradient-gold italic">{t('spells.hero_title_2', 'com Mentores de Elite')}</span> {t('spells.hero_title_3', 'e Fluxo Unificado')}
          </h1>

          <p className="text-[14px] md:text-xl text-mystic-purple-light mb-4 max-w-2xl leading-relaxed font-light">
            {t('spells.hero_desc', 'Explore nossa seleção de rituais exclusivos, conduzidos por mestres da tradição. Escolha sua linhagem, alinhe sua intenção e ative sua transformação com fluidez imediata.')}
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {spells.length === 0 ? (
            <div className="md:col-span-3 rounded-2xl border border-mystic-gold/25 bg-black/25 p-10 text-center text-amber-100/70">
              {t('spells.no_spells', 'Nenhuma magia publicada ainda. Cadastre os produtos na nova guia Magias do admin.')}
            </div>
          ) : (
            spells.map((spell) => (
              <article key={spell.id} className="group relative overflow-hidden rounded-3xl border border-mystic-purple-light/20 bg-black/25 p-4 transition-all duration-500 hover:-translate-y-2 hover:border-mystic-gold/50">
                <div className="absolute inset-0 bg-gradient-to-b from-mystic-gold/0 via-transparent to-mystic-gold/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative z-10 grid gap-4">
                  <div className="overflow-hidden rounded-2xl border border-mystic-gold/15 bg-black/35">
                    {spell.imageUrl ? (
                      <img src={spell.imageUrl} alt={getTranslatedField(spell, 'title')} className="h-56 w-full object-cover transition duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-56 items-center justify-center text-sm text-ethereal-silver/40">Imagem não informada</div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-mystic-goldSoft/75">Feita por {spell.consultantName}</p>
                    <h3 className="mt-2 font-playfair text-3xl text-white transition-colors group-hover:text-mystic-gold">
                      <Link to={`/magias/${spell.id}`} className="transition hover:text-mystic-gold">
                        {getTranslatedField(spell, 'title')}
                      </Link>
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-mystic-purple-light">{getTranslatedField(spell, 'shortDescription') || getTranslatedField(spell, 'description')}</p>
                  </div>

                  <div className="flex items-end justify-between gap-3 border-t border-mystic-gold/15 pt-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-mystic-purple-light/70">{t('spells.investment', 'Investimento')}</p>
                      <p className="mt-1 font-playfair text-2xl text-mystic-gold/88">R$ {Number(spell.price).toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedSpell(spell)}
                      className="group inline-flex items-center gap-3 rounded-full border border-mystic-gold/60 bg-[linear-gradient(135deg,#f6df91_0%,#c79a37_52%,#f8e8ae_100%)] px-6 py-3 text-sm font-bold uppercase tracking-[0.22em] text-black shadow-[0_14px_32px_rgba(197,160,89,0.24)] transition hover:-translate-y-0.5 hover:brightness-110"
                    >
                      {t('spells.activate_ritual', 'Ativar Ritual')}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="rounded-2xl glass-panel border border-mystic-purple-light/20 p-12 mb-20">
          <h2 className="font-playfair text-[20px] md:text-4xl text-white mb-8">
            {t('spells.how_it_works_1', 'Como o Ritual')} <span className="text-gradient-gold italic">{t('spells.how_it_works_2', 'funciona')}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: t('spells.step_1_title', 'Escolha'), description: t('spells.step_1_desc', 'Selecione a magia disponível na vitrine') },
              { step: '02', title: t('spells.step_2_title', 'Pague'), description: t('spells.step_2_desc', 'Finalize em PIX ou cartão de crédito') },
              { step: '03', title: t('spells.step_3_title', 'Contato'), description: t('spells.step_3_desc', 'O Profissional responsável pelo Ritual entrará em contato para solicitar informações adicionais caso necessário') },
              { step: '04', title: t('spells.step_4_title', 'Resultado'), description: t('spells.step_4_desc', 'O Ritual é feito e você notará o Resultado em poucos dias conforme a demanda solicitada.') },
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
            <h2 className="font-playfair text-4xl text-white mb-4">{t('spells.select_ideal', 'Selecione a magia ideal')}</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-mystic-purple-light">
              {t('spells.select_ideal_desc', 'Os rituais e consultas oferecidos são ferramentas de autoconhecimento e auxílio espiritual. O sucesso de cada intervenção depende da ressonância vibracional e do livre-arbítrio dos envolvidos.')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {highlightedSpells.map((spell) => (
                <button
                  key={spell.id}
                  onClick={() => setSelectedSpell(spell)}
                  className="rounded-full border border-mystic-gold/35 bg-black/30 px-5 py-3 text-sm text-amber-100/85 transition hover:bg-mystic-gold/10"
                >
                  {getTranslatedField(spell, 'title')}
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
