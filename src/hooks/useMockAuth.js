import { useMemo, useState } from 'react'
import { getZodiacSign } from '../utils/zodiac'

const horoscopeBySign = {
  Áries: 'Hoje é dia de liderança intuitiva e decisões rápidas.',
  Touro: 'Seu poder está na constância e no foco em prosperidade.',
  Gêmeos: 'Conversas estratégicas trarão boas oportunidades.',
  Câncer: 'Escute sua sensibilidade para proteger o que importa.',
  Leão: 'Sua presença magnética abre portas profissionais.',
  Virgem: 'A organização emocional destrava um novo ciclo.',
  Libra: 'Parcerias harmoniosas elevam sua energia.',
  Escorpião: 'Transformações profundas trazem ganhos concretos.',
  Sagitário: 'Expansão espiritual e coragem caminham juntos.',
  Capricórnio: 'Disciplina com propósito gera crescimento sustentável.',
  Aquário: 'Inovação e visão de futuro serão diferenciais.',
  Peixes: 'Sua intuição está afiada para escolhas certeiras.',
}

export function useMockAuth() {
  const [profile, setProfile] = useState(null)
  const [minutesBalance, setMinutesBalance] = useState(35)

  const sign = useMemo(
    () => getZodiacSign(profile?.birthDate) ?? null,
    [profile?.birthDate],
  )

  const dailyHoroscope = sign
    ? horoscopeBySign[sign]
    : 'Finalize seu cadastro para receber seu horóscopo diário.'

  const register = ({ name, email, birthDate }) => {
    const normalized = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      birthDate,
    }
    setProfile(normalized)
  }

  const debitMinutes = (minutes) => {
    setMinutesBalance((prev) => Math.max(0, prev - minutes))
  }

  const creditMinutes = (minutes) => {
    setMinutesBalance((prev) => prev + minutes)
  }

  return {
    profile,
    sign,
    minutesBalance,
    dailyHoroscope,
    register,
    debitMinutes,
    creditMinutes,
  }
}
