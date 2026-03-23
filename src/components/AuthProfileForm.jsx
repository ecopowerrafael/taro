import { useState } from 'react'
import { UserRoundPlus } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { ZodiacIcon } from './ZodiacIcon'

export function AuthProfileForm({ profile, sign, onRegister }) {
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    email: profile?.email ?? '',
    birthDate: profile?.birthDate ?? '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onRegister(form)
  }

  return (
    <GlassCard
      title="Cadastro e Perfil"
      subtitle="Crie sua conta para iniciar consultas de Tarot ao vivo."
    >
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-left text-sm text-amber-100/80">
          Nome
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 transition focus:ring-2"
          />
        </label>
        <label className="grid gap-2 text-left text-sm text-amber-100/80">
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 transition focus:ring-2"
          />
        </label>
        <label className="grid gap-2 text-left text-sm text-amber-100/80 md:col-span-2">
          Data de Nascimento
          <input
            name="birthDate"
            type="date"
            value={form.birthDate}
            onChange={handleChange}
            required
            className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 transition focus:ring-2"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-mystic-gold/70 bg-gradient-to-r from-mystic-gold/90 to-amber-500/80 px-4 py-2 font-medium text-black transition hover:brightness-110 md:col-span-2"
        >
          <UserRoundPlus size={18} />
          Salvar Perfil
        </button>
      </form>

      <div className="mt-5 flex items-center gap-3 rounded-lg border border-mystic-gold/30 bg-black/25 p-3">
        <ZodiacIcon sign={sign} className="h-12 w-12" />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-100/60">Signo Atual</p>
          <p className="font-display text-2xl text-mystic-goldSoft">{sign ?? 'Não identificado'}</p>
        </div>
      </div>
    </GlassCard>
  )
}
