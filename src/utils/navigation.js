export const publicNavLinks = [
  { to: '/', label: 'Home' },
  { to: '/consultores', label: 'Consultores' },
  { to: '/magias', label: 'Magias' },
  { to: '/como-funciona', label: 'Como Funciona' },
  { to: '/seja-consultor', label: 'Para Profissionais' },
]

export function buildHeaderLinks({ isAuthenticated, isConsultant, isAdmin }) {
  const links = [...publicNavLinks]

  if (!isAuthenticated) {
    links.push({ to: '/cadastro', label: 'Cadastro' })
    links.push({ to: '/entrar', label: 'Entrar' })
    return links
  }

  links.push({ to: '/perfil', label: 'Perfil' })

  if (isConsultant || isAdmin) {
    links.push({ to: '/area-consultor', label: 'Consultor' })
  }

  if (isAdmin) {
    links.push({ to: '/admin', label: 'Admin' })
  }

  return links
}