export const publicNavLinks = [
  { to: '/', labelKey: 'nav.home', label: 'Home' },
  { to: '/carta-do-dia', labelKey: 'nav.daily_card', label: 'Carta do Dia' },
  { to: '/numerologia', labelKey: 'nav.numerology', label: 'Numerologia' },
  { to: '/mapa-astral', labelKey: 'nav.birth_chart', label: 'Mapa Astral' },
  { to: '/consultores', labelKey: 'nav.consultants', label: 'Consultores' },
  { to: '/magias', labelKey: 'nav.spells', label: 'Magias' },
  { to: '/como-funciona', labelKey: 'nav.how_it_works', label: 'Como Funciona' },
  { to: '/seja-consultor', labelKey: 'nav.for_professionals', label: 'Para Profissionais' },
]

export function buildHeaderLinks({ isAuthenticated, isConsultant, isAdmin, t }) {
  const links = publicNavLinks.map(link => ({
    ...link,
    label: t ? t(link.labelKey, link.label) : link.label
  }))

  if (!isAuthenticated) {
    links.push({ to: '/cadastro', labelKey: 'nav.register', label: t ? t('nav.register', 'Cadastro') : 'Cadastro' })
    links.push({ to: '/entrar', labelKey: 'nav.login', label: t ? t('nav.login', 'Entrar') : 'Entrar' })
    return links
  }

  links.push({ to: '/perfil', labelKey: 'nav.profile', label: t ? t('nav.profile', 'Perfil') : 'Perfil' })

  if (isConsultant || isAdmin) {
    links.push({ to: '/area-consultor', labelKey: 'nav.consultant_area', label: t ? t('nav.consultant_area', 'Consultor') : 'Consultor' })
  }

  if (isAdmin) {
    links.push({ to: '/admin', labelKey: 'nav.admin', label: t ? t('nav.admin', 'Admin') : 'Admin' })
  }

  return links
}
