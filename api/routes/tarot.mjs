import { Router } from 'express'
import { TAROT_INTERPRETATIONS, MINOR_ARCANA_TEMPLATE } from '../data/tarot_interpretations.mjs'
import { authenticate } from '../middleware/auth.mjs'
import { criticalAstroService } from '../services/criticalAstroService.mjs'
import { calculateChart } from '../astroEngine.mjs'

export const createTarotRouter = (pool) => {
  const router = Router()

  // Lista de IDs de todas as 78 cartas
  const MAJOR_ARCANA_IDS = [
    'major_arcana_fool', 'major_arcana_magician', 'major_arcana_priestess', 'major_arcana_empress',
    'major_arcana_emperor', 'major_arcana_hierophant', 'major_arcana_lovers', 'major_arcana_chariot',
    'major_arcana_strength', 'major_arcana_hermit', 'major_arcana_fortune', 'major_arcana_justice',
    'major_arcana_hanged', 'major_arcana_death', 'major_arcana_temperance', 'major_arcana_devil',
    'major_arcana_tower', 'major_arcana_star', 'major_arcana_moon', 'major_arcana_sun',
    'major_arcana_judgement', 'major_arcana_world'
  ]

  const SUITS = ['cups', 'swords', 'wands', 'pentacles']
  const RANKS = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'page', 'knight', 'queen', 'king']

  const MINOR_ARCANA_IDS = []
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      MINOR_ARCANA_IDS.push(`minor_arcana_${suit}_${rank}`)
    })
  })

  const ALL_CARD_IDS = [...MAJOR_ARCANA_IDS, ...MINOR_ARCANA_IDS]

  router.post('/tirar-carta', authenticate, async (req, res) => {
    try {
      const { tema } = req.body // 'Amor', 'Dinheiro', 'Saúde', 'Família'
      const userId = req.user.id
      // ...existing code...
      // Função para obter o ciclo diário baseado em 08:00 local (igual frontend)
      function getCycleKey(date = new Date()) {
        const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)) // local time
        if (local.getHours() < 8) {
          local.setDate(local.getDate() - 1)
        }
        return local.toISOString().split('T')[0]
      }
      const cycleKey = getCycleKey()

      // Buscar última tiragem do usuário
      const [uRows] = await pool.query(
        'SELECT oracle_birth_date, birthDate, oracle_lat, oracle_lng, oracle_chart_cache, oracle_daily_card_cycle, oracle_daily_card_id, oracle_daily_card_tema, oracle_daily_card_nome, oracle_daily_card_texto, oracle_daily_card_face_img, oracle_daily_card_at, oracle_daily_cache, oracle_daily_cached_at FROM users WHERE id = ?',
        [userId]
      )
      const user = uRows[0]
      console.log('[TAROT] Usuário carregado:', user)
      let criticalAstro = null
      let hasChart = false

      // Se já tirou carta neste ciclo, retorna a mesma (independente do tema)
      if (user && user.oracle_daily_card_cycle === cycleKey && user.oracle_daily_card_id) {
        // Buscar dados astrais se possível
        let criticalAstro = null
        let hasChart = false
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
              criticalAstro = await criticalAstroService.getCriticalAstro(rawPlanets, ascendant.longitude)
            }
          } catch (err) {
            console.error('[API/Tarot] Erro ao calcular astro crítico (ciclo):', err)
          }
        }
        console.log('[TAROT] Carta do ciclo já existente, retornando:', {
          id: user.oracle_daily_card_id,
          nome: user.oracle_daily_card_nome,
          face_img: user.oracle_daily_card_face_img,
          texto: user.oracle_daily_card_texto,
          tema: user.oracle_daily_card_tema,
          hasChart,
          criticalAstro
        })
        return res.json({
          id: user.oracle_daily_card_id,
          nome: user.oracle_daily_card_nome,
          face_img: user.oracle_daily_card_face_img,
          texto: user.oracle_daily_card_texto,
          tema: user.oracle_daily_card_tema,
          criticalAstro,
          hasChart
        })
      }

      // Se não enviou tema, não sorteia carta nova
      if (!tema) {
        console.warn('[TAROT] Tentativa de sortear carta sem tema!')
        return res.status(400).json({ error: 'Tema é obrigatório para sortear nova carta' })
      }

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
              criticalAstro = await criticalAstroService.getCriticalAstro(rawPlanets, ascendant.longitude)
            }
          } catch (err) {
            console.error('[API/Tarot] Erro ao calcular astro crítico:', err)
          }
        }
      }

      // Sorteio aleatório
      const randomIndex = Math.floor(Math.random() * ALL_CARD_IDS.length)
      const selectedCardId = ALL_CARD_IDS[randomIndex]

      let interpretacao = ''
      let cardName = ''
      let faceImg = `/cartas/${selectedCardId}.png`

      if (selectedCardId.startsWith('major_arcana_')) {
        const cardData = TAROT_INTERPRETATIONS[selectedCardId]
        interpretacao = cardData?.[tema] || 'Interpretação não encontrada.'
        cardName = cardData?.nome || selectedCardId.replace(/_/g, ' ')
      } else {
        const parts = selectedCardId.split('_')
        const rank = parts[parts.length - 1]
        const suit = parts[2] // cups, swords, wands, pentacles
        const template = MINOR_ARCANA_TEMPLATE[rank]
        interpretacao = template?.[tema] || 'Interpretação não encontrada.'
        const suitMap = {
          'cups': 'Copas',
          'swords': 'Espadas',
          'wands': 'Paus',
          'pentacles': 'Ouros'
        }
        cardName = `${template?.nome || rank} de ${suitMap[suit] || suit}`
      }

      console.log('[TAROT] Nova carta sorteada:', { selectedCardId, cardName, interpretacao, tema })

      // Salvar tiragem do ciclo no usuário
      await pool.query(
        `UPDATE users SET oracle_daily_card_cycle = ?, oracle_daily_card_id = ?, oracle_daily_card_tema = ?, oracle_daily_card_nome = ?, oracle_daily_card_texto = ?, oracle_daily_card_face_img = ?, oracle_daily_card_at = NOW() WHERE id = ?`,
        [cycleKey, selectedCardId, tema, cardName, interpretacao, faceImg, userId]
      )

      res.json({
        id: selectedCardId,
        nome: cardName,
        face_img: faceImg,
        texto: interpretacao,
        criticalAstro,
        hasChart
      })
    } catch (err) {
      console.error('[API/Tarot] Erro ao tirar carta:', err)
      res.status(500).json({ error: 'Erro interno ao processar sua jogada.', details: err?.message, stack: err?.stack })
    }
  })

  return router
  return router
}
