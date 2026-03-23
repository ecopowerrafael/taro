import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { PageShell } from '../components/PageShell'

export function SejaConsultorPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    headline: '',
    about: '',
    pricePerMinute: '',
    priceThreeQuestions: '',
    priceFiveQuestions: '',
    profilePhoto: null,
  })
  const [submitted, setSubmitted] = useState(false)

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    updateField('profilePhoto', file)
  }

  const photoPreviewUrl = useMemo(
    () => (form.profilePhoto ? URL.createObjectURL(form.profilePhoto) : ''),
    [form.profilePhoto],
  )

  useEffect(
    () => () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl)
      }
    },
    [photoPreviewUrl],
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <PageShell
      title="Faça parte do nosso time de consultores"
      subtitle="Cadastro de Consultor"
    >
      <GlassCard
        title="Cadastro de Consultor"
        subtitle="Complete o formulário abaixo para se registrar como consultor astral em nossa plataforma."
      >
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-amber-100/80">
            Nome Completo
            <input
              required
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
            />
          </label>
          <label className="grid gap-2 text-sm text-amber-100/80">
            E-mail
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
            />
          </label>
          <label className="grid gap-2 text-sm text-amber-100/80 md:col-span-2">
            Senha (mínimo 6 caracteres)
            <input
              type="password"
              minLength={6}
              required
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
            />
          </label>
          <label className="grid gap-2 text-sm text-amber-100/80 md:col-span-2">
            Foto de Perfil
            <div className="rounded-lg border border-dashed border-mystic-gold/50 bg-black/25 p-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-mystic-gold/40 bg-mystic-gold/10 px-3 py-2 text-sm text-mystic-goldSoft transition hover:bg-mystic-gold/20">
                <Camera size={16} />
                📸 Clique para selecionar uma foto
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              <p className="mt-2 text-xs text-amber-100/65">Recomendado: 300x300 pixels, máximo 5MB</p>
              {form.profilePhoto && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={photoPreviewUrl}
                    alt="Pré-visualização da foto de perfil"
                    className="h-16 w-16 rounded-full border-2 border-mystic-gold/70 object-cover"
                  />
                  <p className="text-xs text-emerald-200">{form.profilePhoto.name}</p>
                </div>
              )}
            </div>
          </label>
          <label className="grid gap-2 text-sm text-amber-100/80 md:col-span-2">
            Breve Descrição (card de listagem)
            <input
              required
              placeholder="Ex: Tarólogo especializado em vidas passadas"
              value={form.headline}
              onChange={(event) => updateField('headline', event.target.value)}
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
            />
          </label>
          <label className="grid gap-2 text-sm text-amber-100/80 md:col-span-2">
            Sobre Você
            <textarea
              required
              rows={5}
              placeholder="Conte um pouco sobre sua experiência, especialidades e abordagem..."
              value={form.about}
              onChange={(event) => updateField('about', event.target.value)}
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
            />
          </label>
          <label className="grid gap-2 text-sm text-amber-100/80 md:col-span-2">
            Preço por Minuto (R$)
            <input
              type="number"
              min="1"
              step="0.5"
              required
              placeholder="Definir seu valor por minuto"
              value={form.pricePerMinute}
              onChange={(event) => updateField('pricePerMinute', event.target.value)}
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
            />
          </label>
          <label className="grid gap-2 text-sm text-amber-100/80">
            Preço para responder 3 perguntas (R$)
            <input
              type="number"
              min="1"
              step="0.5"
              required
              placeholder="Valor do pacote de 3 perguntas"
              value={form.priceThreeQuestions}
              onChange={(event) => updateField('priceThreeQuestions', event.target.value)}
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
            />
          </label>
          <label className="grid gap-2 text-sm text-amber-100/80">
            Preço para responder 5 perguntas (R$)
            <input
              type="number"
              min="1"
              step="0.5"
              required
              placeholder="Valor do pacote de 5 perguntas"
              value={form.priceFiveQuestions}
              onChange={(event) => updateField('priceFiveQuestions', event.target.value)}
              className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none ring-mystic-gold/60 focus:ring-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg border border-mystic-gold/80 bg-gradient-to-r from-mystic-gold/90 to-amber-500/85 px-4 py-2 font-medium text-black transition hover:brightness-110 md:col-span-2"
          >
            Enviar Cadastro
          </button>
        </form>
        {submitted && (
          <p className="mt-4 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Candidatura recebida. Nossa equipe fará contato em breve.
          </p>
        )}
        <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
          Lembre-se que 30% do valor será cobrado de comissão para manutenção e divulgação do
          aplicativo.
        </p>
        <p className="mt-4 text-sm text-amber-100/80">
          Já tem cadastro?{' '}
          <Link to="/entrar" className="text-mystic-goldSoft hover:text-mystic-gold">
            Faça login aqui
          </Link>
        </p>
      </GlassCard>
    </PageShell>
  )
}
