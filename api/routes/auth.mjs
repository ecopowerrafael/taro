import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'taro-secret-key-123'

export const createAuthRouter = (pool) => {
  const router = Router()

  // Register
  router.post('/register', async (request, response) => {
    const { name, email, password, birthDate, role = 'client' } = request.body

    if (!name || !email || !password) {
      return response.status(400).json({ message: 'Nome, email e senha são obrigatórios.' })
    }

    try {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
      if (existing.length > 0) {
        return response.status(400).json({ message: 'Email já cadastrado.' })
      }

      const id = 'u_' + Math.random().toString(36).substr(2, 9)
      const hashedPassword = await bcrypt.hash(password, 10)
      const createdAt = new Date()

      await pool.query(
        `INSERT INTO users (id, name, email, password, role, birthDate, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, email, hashedPassword, role, birthDate || null, createdAt]
      )

      const token = jwt.sign({ id, role, email }, JWT_SECRET, { expiresIn: '7d' })

      response.status(201).json({
        token,
        user: { id, name, email, role, birthDate, minutesBalance: 0 }
      })
    } catch (error) {
      console.error('Erro no registro:', error)
      response.status(500).json({ message: 'Erro ao criar conta.' })
    }
  })

  // Register Consultant
  router.post('/register-consultant', async (request, response) => {
    const { name, email, password, tagline, description, photo, pricePerMinute, priceThreeQuestions, priceFiveQuestions } = request.body

    if (!name || !email || !password) {
      return response.status(400).json({ message: 'Nome, email e senha são obrigatórios.' })
    }

    try {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
      if (existing.length > 0) {
        return response.status(400).json({ message: 'Email já cadastrado.' })
      }

      const userId = 'u_' + Math.random().toString(36).substr(2, 9)
      const consultantId = 'c_' + Math.random().toString(36).substr(2, 9)
      const hashedPassword = await bcrypt.hash(password, 10)
      const createdAt = new Date()

      // Inicia transação
      const connection = await pool.getConnection()
      try {
        await connection.beginTransaction()

        await connection.query(
          `INSERT INTO users (id, name, email, password, role, createdAt) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, name, email, hashedPassword, 'consultant', createdAt]
        )

        await connection.query(
          `INSERT INTO consultants (
            id, name, email, tagline, description, photo, 
            pricePerMinute, priceThreeQuestions, priceFiveQuestions, 
            status, createdAt, userId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            consultantId, name, email, tagline || null, description || null, photo || null,
            pricePerMinute || 0, priceThreeQuestions || 0, priceFiveQuestions || 0,
            'Pendente', createdAt, userId
          ]
        )

        // Criar carteira
        await connection.query(
          'INSERT INTO consultant_wallets (consultantId, availableBalance) VALUES (?, 0)',
          [consultantId]
        )

        await connection.commit()
        
        const token = jwt.sign({ id: userId, role: 'consultant', email }, JWT_SECRET, { expiresIn: '7d' })

        response.status(201).json({
          token,
          user: { id: userId, name, email, role: 'consultant', minutesBalance: 0 }
        })
      } catch (err) {
        await connection.rollback()
        throw err
      } finally {
        connection.release()
      }
    } catch (error) {
      console.error('Erro no registro de consultor:', error)
      response.status(500).json({ message: 'Erro ao criar conta de consultor.' })
    }
  })

  // Login
  router.post('/login', async (request, response) => {
    const { email, password } = request.body

    if (!email || !password) {
      return response.status(400).json({ message: 'Email e senha são obrigatórios.' })
    }

    try {
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
      if (users.length === 0) {
        return response.status(401).json({ message: 'Credenciais inválidas.' })
      }

      const user = users[0]
      const valid = await bcrypt.compare(password, user.password)
      if (!valid) {
        return response.status(401).json({ message: 'Credenciais inválidas.' })
      }

      const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' })

      response.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          birthDate: user.birthDate,
          minutesBalance: user.minutesBalance
        }
      })
    } catch (error) {
      console.error('Erro no login:', error)
      response.status(500).json({ message: 'Erro ao entrar.' })
    }
  })

  // Get Profile
  router.get('/profile', async (request, response) => {
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return response.status(401).json({ message: 'Não autorizado.' })
    }

    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id])
      if (users.length === 0) {
        return response.status(404).json({ message: 'Usuário não encontrado.' })
      }

      const user = users[0]
      response.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        birthDate: user.birthDate,
        minutesBalance: user.minutesBalance
      })
    } catch (error) {
      response.status(401).json({ message: 'Token inválido.' })
    }
  })

  // Update Profile
  router.put('/profile', async (request, response) => {
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return response.status(401).json({ message: 'Não autorizado.' })
    }

    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const { name, birthDate } = request.body

      await pool.query(
        'UPDATE users SET name = ?, birthDate = ? WHERE id = ?',
        [name, birthDate, decoded.id]
      )

      response.json({ message: 'Perfil atualizado com sucesso.' })
    } catch (error) {
      response.status(401).json({ message: 'Token inválido.' })
    }
  })

  // Add Minutes (Recharge)
  router.post('/recharge', async (request, response) => {
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return response.status(401).json({ message: 'Não autorizado.' })
    }

    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const { minutes } = request.body

      if (!minutes || minutes <= 0) {
        return response.status(400).json({ message: 'Quantidade de minutos inválida.' })
      }

      await pool.query(
        'UPDATE users SET minutesBalance = minutesBalance + ? WHERE id = ?',
        [minutes, decoded.id]
      )

      const [updated] = await pool.query('SELECT minutesBalance FROM users WHERE id = ?', [decoded.id])

      response.json({ 
        ok: true, 
        message: 'Recarga realizada com sucesso.', 
        minutesBalance: updated[0].minutesBalance 
      })
    } catch (error) {
      console.error('Erro na recarga:', error)
      response.status(401).json({ message: 'Token inválido ou erro no servidor.' })
    }
  })

  return router
}
