import { CircleDollarSign, Star } from 'lucide-react'
import { motion as Motion } from 'framer-motion'
import { GlassCard } from './GlassCard'

const statusStyles = {
  Online: 'border-emerald-400/70 bg-emerald-500/15 text-emerald-300',
  Ocupado: 'border-amber-400/70 bg-amber-500/10 text-amber-300',
  Offline: 'border-zinc-400/70 bg-zinc-500/10 text-zinc-300',
}

export function ConsultantMarketplace({
  consultants,
  statusFilter,
  onStatusFilterChange,
  onChooseService,
}) {
  const filteredConsultants =
    statusFilter === 'Todos'
      ? consultants
      : consultants.filter((consultant) => consultant.status === statusFilter)

  return (
    <GlassCard
      title="Marketplace de Consultores"
      subtitle="Escolha um especialista e prepare a chamada em tempo real."
      action={
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          className="rounded-lg border border-mystic-gold/60 bg-black/25 px-3 py-2 text-sm text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
        >
          <option>Todos</option>
          <option>Online</option>
          <option>Ocupado</option>
          <option>Offline</option>
        </select>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {filteredConsultants.map((consultant) => (
          <Motion.article
            key={consultant.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            whileHover={{ y: -4 }}
            className={`flex flex-col gap-3 rounded-xl border bg-black/25 p-4 backdrop-blur-md ${
              consultant.status === 'Online'
                ? 'border-stardust-gold/55 shadow-[0_0_0_1px_rgba(197,160,89,0.35),0_10px_30px_rgba(197,160,89,0.25)] animate-gold-pulse'
                : 'border-stardust-gold/30 shadow-[0_10px_28px_rgba(0,0,0,0.32)]'
            }`}
          >
            <div className="flex items-start gap-3">
              <img
                src={consultant.photo}
                alt={`Foto de ${consultant.name}`}
                className="h-16 w-16 rounded-full border-2 border-mystic-gold/80 object-cover"
              />
              <div className="flex-1">
                <h3 className="font-display text-2xl text-mystic-goldSoft">{consultant.name}</h3>
                <p className="text-sm text-amber-50/85">{consultant.tagline}</p>
              </div>
              <span
                className={`rounded-full border px-2 py-1 text-xs ${
                  statusStyles[consultant.status] ?? statusStyles.Offline
                }`}
              >
                {consultant.status}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-amber-100/75">{consultant.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-ethereal-silver/80">
              <span>
                Consultas totais:{' '}
                {(consultant.baseConsultations ?? 0) + (consultant.realSessions ?? 0)}
              </span>
              <span className="inline-flex items-center gap-1 text-stardust-gold">
                <Star size={12} fill="currentColor" />
                {consultant.ratingAverage?.toFixed(1) ?? '0.0'}
              </span>
            </div>
            <div className="mt-auto grid gap-2">
              <button
                disabled={consultant.status !== 'Online'}
                onClick={() => onChooseService(consultant, 'video')}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-mystic-gold/60 px-3 py-2 text-xs text-amber-50 transition enabled:hover:bg-mystic-gold/15 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <CircleDollarSign size={14} />
                Atendimento por vídeo • R$ {consultant.pricePerMinute.toFixed(2)}/min
              </button>
              <button
                disabled={consultant.status !== 'Online'}
                onClick={() => onChooseService(consultant, '3-questions')}
                className="rounded-lg border border-mystic-gold/60 px-3 py-2 text-xs text-amber-50 transition enabled:hover:bg-mystic-gold/15 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Pacote 3 perguntas • R$ {consultant.priceThreeQuestions.toFixed(2)}
              </button>
              <button
                disabled={consultant.status !== 'Online'}
                onClick={() => onChooseService(consultant, '5-questions')}
                className="rounded-lg border border-mystic-gold/60 px-3 py-2 text-xs text-amber-50 transition enabled:hover:bg-mystic-gold/15 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Pacote 5 perguntas • R$ {consultant.priceFiveQuestions.toFixed(2)}
              </button>
            </div>
          </Motion.article>
        ))}
      </div>
    </GlassCard>
  )
}
