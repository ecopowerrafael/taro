import { Router } from 'express'
import { numerologyService } from '../services/numerologyService.mjs'
import { authenticate } from '../middleware/auth.mjs'
import { criticalAstroService } from '../services/criticalAstroService.mjs'
import { calculateChart } from '../astroEngine.mjs'

export const createNumerologyRouter = (pool) => {
  const router = Router()

  /**
   * Rota para obter a prévia da numerologia (gratuita)
   */
  router.post('/preview', authenticate, async (req, res) => {
    try {
      const { nomeCompleto, dataNascimento } = req.body
      const userId = req.user.id

      if (!nomeCompleto || !dataNascimento) {
        return res.status(400).json({ error: 'Nome completo e data de nascimento são obrigatórios' })
      }

      const previewData = numerologyService.getPreview(nomeCompleto, dataNascimento)

      // Buscar dados do usuário para o Astro Crítico
      const [uRows] = await pool.query(
        'SELECT oracle_birth_date, birthDate, oracle_lat, oracle_lng, oracle_chart_cache, oracle_daily_cache, oracle_daily_cached_at FROM users WHERE id = ?',
        [userId]
      )
      const user = uRows[0]
      let criticalAstro = null
      let hasChart = false

      if (user) {
        const birthDate = user.oracle_birth_date || user.birthDate
        const lat = user.oracle_lat
        const lng = user.oracle_lng

        if (birthDate && lat != null && lng != null) {
          hasChart = true
          let rawPlanets = []
          try {
            if (user.oracle_chart_cache) {
              rawPlanets = JSON.parse(user.oracle_chart_cache)
            } else {
              rawPlanets = await calculateChart(birthDate, lat, lng)
            }
            
            const ascendant = rawPlanets.find(p => p.name === 'Ascendant')
            if (ascendant) {
              // Verificar se o cache do oráculo diário é de hoje (pós 03:00)
              let dailyCache = null
              const now = new Date()
              const today3am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 3, 0, 0)
              
              if (user.oracle_daily_cache && user.oracle_daily_cached_at) {
                const cachedAt = new Date(user.oracle_daily_cached_at)
                // Se o cache foi gerado após as 3 da manhã de hoje, usamos ele
                if (cachedAt > today3am) {
                  dailyCache = user.oracle_daily_cache
                }
              }

              criticalAstro = await criticalAstroService.getCriticalAstro(rawPlanets, ascendant.longitude, dailyCache)
            }
          } catch (err) {
            console.error('[API/Numerologia] Erro ao calcular astro crítico:', err)
          }
        }
      }

      res.json({
        ok: true,
        data: {
          ...previewData,
          criticalAstro,
          hasChart
        }
      })
    } catch (err) {
      console.error('[API/Numerologia] Erro ao calcular prévia:', err)
      res.status(500).json({ error: 'Erro interno ao calcular sua numerologia.' })
    }
  })

  return router
}
