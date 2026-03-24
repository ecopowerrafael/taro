import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'taro-secret-key-123'

export const authenticate = (request, response, next) => {
  const authHeader = request.headers.authorization
  if (!authHeader) {
    return response.status(401).json({ message: 'Token não fornecido.' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    request.user = decoded
    next()
  } catch (error) {
    return response.status(401).json({ message: 'Token inválido ou expirado.' })
  }
}

export const authorizeAdmin = (request, response, next) => {
  if (request.user?.role !== 'admin') {
    return response.status(403).json({ message: 'Acesso restrito a administradores.' })
  }
  next()
}

export const authorizeConsultant = (request, response, next) => {
  if (request.user?.role !== 'consultant' && request.user?.role !== 'admin') {
    return response.status(403).json({ message: 'Acesso restrito a consultores.' })
  }
  next()
}
