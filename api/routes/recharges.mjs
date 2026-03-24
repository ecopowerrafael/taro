import { Router } from 'express'
import { authenticate, authorizeAdmin } from '../middleware/auth.mjs'

export const createRechargesRouter = (pool) => {
  const router = Router()

  // Solicitar recarga (PIX ou Card)
  router.post('/request', authenticate, async (request, response) => {
    const { amount, minutes, method } = request.body
    const userId = request.user.id

    if (!amount || !minutes || !method) {
      return response.status(400).json({ message: 'Dados incompletos para solicitação.' })
    }

    try {
      const id = 'req_' + Math.random().toString(36).substr(2, 9)
      const createdAt = new Date()

      await pool.query(
        `INSERT INTO recharge_requests (id, userId, amount, minutes, method, status, createdAt)
         VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
        [id, userId, amount, minutes, method, createdAt]
      )

      response.status(201).json({ id, message: 'Solicitação de recarga enviada.' })
    } catch (error) {
      console.error('Erro ao solicitar recarga:', error)
      response.status(500).json({ message: 'Erro ao processar solicitação.' })
    }
  })

  // Listar solicitações pendentes (Admin)
  router.get('/pending', authenticate, authorizeAdmin, async (_request, response) => {
    try {
      const [rows] = await pool.query(
        `SELECT r.*, u.name as userName, u.email as userEmail 
         FROM recharge_requests r
         JOIN users u ON r.userId = u.id
         WHERE r.status = 'pending'
         ORDER BY r.createdAt DESC`
      )
      response.json(rows)
    } catch (error) {
      console.error('Erro ao buscar recargas pendentes:', error)
      response.status(500).json({ message: 'Erro ao buscar recargas.' })
    }
  })

  // Aprovar/Rejeitar recarga (Admin)
  router.post('/:id/action', authenticate, authorizeAdmin, async (request, response) => {
    const { id } = request.params
    const { action } = request.body // 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(action)) {
      return response.status(400).json({ message: 'Ação inválida.' })
    }

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // 1. Buscar a solicitação
      const [requests] = await connection.query('SELECT * FROM recharge_requests WHERE id = ?', [id])
      if (requests.length === 0) {
        await connection.rollback()
        return response.status(404).json({ message: 'Solicitação não encontrada.' })
      }

      const req = requests[0]
      if (req.status !== 'pending') {
        await connection.rollback()
        return response.status(400).json({ message: 'Esta solicitação já foi processada.' })
      }

      // 2. Atualizar status da solicitação
      await connection.query(
        'UPDATE recharge_requests SET status = ?, updatedAt = ? WHERE id = ?',
        [action, new Date(), id]
      )

      // 3. Se aprovado, adicionar saldo ao usuário
      if (action === 'approved') {
        await connection.query(
          'UPDATE users SET minutesBalance = minutesBalance + ? WHERE id = ?',
          [req.amount, req.userId] // Tratando minutesBalance como Reais
        )
      }

      await connection.commit()
      response.json({ message: `Recarga ${action === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso.` })
    } catch (error) {
      await connection.rollback()
      console.error('Erro ao processar ação de recarga:', error)
      response.status(500).json({ message: 'Erro ao processar recarga.' })
    } finally {
      connection.release()
    }
  })

  return router
}
