import { Router } from 'express'
import { TAROT_INTERPRETATIONS, MINOR_ARCANA_TEMPLATE } from '../data/tarot_interpretations.mjs'

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

  router.post('/tirar-carta', async (req, res) => {
    try {
      const { tema } = req.body // 'Amor', 'Dinheiro', 'Saúde', 'Família'
      
      if (!tema) {
        return res.status(400).json({ error: 'Tema é obrigatório' })
      }

      // Sorteio aleatório
      const randomIndex = Math.floor(Math.random() * ALL_CARD_IDS.length)
      const selectedCardId = ALL_CARD_IDS[randomIndex]

      let interpretacao = ''
      
      if (selectedCardId.startsWith('major_arcana_')) {
        interpretacao = TAROT_INTERPRETATIONS[selectedCardId]?.[tema] || 'Interpretação não encontrada.'
      } else {
        // Extrair o rank para buscar no template
        const parts = selectedCardId.split('_')
        const rank = parts[parts.length - 1]
        interpretacao = MINOR_ARCANA_TEMPLATE[rank]?.[tema] || 'Interpretação não encontrada.'
      }

      res.json({
        id: selectedCardId,
        face_img: `/cartas/${selectedCardId}.png`,
        texto: interpretacao
      })
    } catch (err) {
      console.error('[API/Tarot] Erro ao tirar carta:', err)
      res.status(500).json({ error: 'Erro interno ao processar sua jogada.' })
    }
  })

  return router
}
