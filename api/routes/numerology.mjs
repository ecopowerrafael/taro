import { Router } from 'express'
import { numerologyService } from '../services/numerologyService.mjs'

export const createNumerologyRouter = (pool) => {
  const router = Router()

  /**
   * Rota para obter a prévia da numerologia (gratuita)
   */
  router.post('/preview', async (req, res) => {
    try {
      const { nomeCompleto, dataNascimento } = req.body

      if (!nomeCompleto || !dataNascimento) {
        return res.status(400).json({ error: 'Nome completo e data de nascimento são obrigatórios' })
      }

      const previewData = numerologyService.getPreview(nomeCompleto, dataNascimento)

      res.json({
        ok: true,
        data: previewData
      })
    } catch (err) {
      console.error('[API/Numerologia] Erro ao calcular prévia:', err)
      res.status(500).json({ error: 'Erro interno ao calcular sua numerologia.' })
    }
  })

  return router
}
