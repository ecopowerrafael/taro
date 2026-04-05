import { Router } from 'express'
import { authenticate } from '../middleware/auth.mjs'

export const createOracleRouter = (pool) => {
  const router = Router()

  // Salvar localização do nascimento (e se a primeira consulta já foi usada)
  router.post('/save-location', authenticate, async (request, response) => {
    try {
      const { oracle_city, oracle_lat, oracle_lng, oracle_birth_date } = request.body
      const userId = request.user.id

      await pool.query(
        'UPDATE users SET oracle_city = ?, oracle_lat = ?, oracle_lng = ?, oracle_birth_date = ? WHERE id = ?',
        [oracle_city, oracle_lat, oracle_lng, oracle_birth_date, userId]
      )

      response.status(200).json({ success: true })
    } catch (error) {
      console.error('[API/Oracle] Erro ao salvar location:', error)
      response.status(500).json({ error: 'Erro interno.' })
    }
  })

  // Pagar / Debitar saldo da consulta (se não for a primeira grátis)
  router.post('/deduct-balance', authenticate, async (request, response) => {
    try {
      const userId = request.user.id

      // Buscar se já usou a grátis e o balance
      const [uRows] = await pool.query('SELECT oracle_used_free, minutesBalance FROM users WHERE id = ?', [userId])
      if (!uRows.length) return response.status(404).json({ error: 'Usuário não encontrado' })

      const user = uRows[0]

      // Buscar o preço no bd
      const [pRows] = await pool.query('SELECT oraclePrice FROM platform_credentials LIMIT 1')
      const oraclePrice = pRows.length ? pRows[0].oraclePrice : 0

      if (user.oracle_used_free === 0) {
        // Primeira é grátis, só marcar como usada
        await pool.query('UPDATE users SET oracle_used_free = 1 WHERE id = ?', [userId])
        return response.status(200).json({ success: true, message: 'Consulta grátis utilizada.' })
      }

      // Se não é a primeira, precisa debitar o price
      if (oraclePrice > 0) {
         if (user.minutesBalance < oraclePrice) {
            return response.status(400).json({ error: 'Saldo insuficiente.', code: 'INSUFFICIENT_FUNDS' })
         }
         // Debita
         await pool.query('UPDATE users SET minutesBalance = minutesBalance - ? WHERE id = ?', [oraclePrice, userId])
      }

      response.status(200).json({ success: true, message: 'Pago com sucesso.' })

    } catch (error) {
      console.error('[API/Oracle] Erro ao debitar saldo:', error)
      response.status(500).json({ error: 'Erro interno.' })
    }
  })

  // Realizar a consulta no Oráculo (Gemini + Prokerala)
  router.post('/consult', authenticate, async (request, response) => {
    try {
      const { question } = request.body
      if (!question || question.trim().length === 0) {
        return response.status(400).json({ error: 'Nenhuma pergunta enviada.' })
      }

      const userId = request.user.id

      // 1. Buscar os dados do consulente
      const [uRows] = await pool.query('SELECT name, birthDate, oracle_birth_date, oracle_city, oracle_lat, oracle_lng FROM users WHERE id = ?', [userId])
      if (!uRows.length) return response.status(404).json({ error: 'Usuário não encontrado' })
      const user = uRows[0]

      // Lógica de Parse Simples para transformar a string digitada em data do Prokerala
      const parseDateString = (dateStr) => {
        if (!dateStr) return new Date().toISOString()
        // Padrão que espera DD/MM/YYYY HH:MM ou apenas DD/MM/YYYY
        const parts = dateStr.split(/[\sT]+/)
        const datePart = parts[0] || ''
        const timePart = parts[1] || '12:00'
        
        let isoStr = dateStr
        if (datePart.includes('/')) {
           const [day, month, year] = datePart.split('/')
           if (day && month && year) {
             isoStr = `${year}-${month}-${day}T${timePart}:00Z`
           }
        }
        const parsed = new Date(isoStr)
        return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
      }

      // 2. Buscar as credenciais no banco de dados
      const [pRows] = await pool.query('SELECT oracleProkeralaId, oracleProkeralaSecret, oracleGeminiKey, oracleSystemPrompt FROM platform_credentials LIMIT 1')
      const creds = pRows[0] || {}

      if (!creds.oracleGeminiKey) {
        return response.status(400).json({ error: 'Chave da API do Gemini não configurada pelo administrador no painel.' })
      }

      let astrologyContext = 'Dados astrológicos exatos indisponíveis/ignorados.'

      // 3. Integração Prokerala (apenas se tiver credenciais preenchidas e a pessoa tiver salvo Posição GPS + Data de Nascimento)
      if (creds.oracleProkeralaId && creds.oracleProkeralaSecret && user.oracle_lat && user.oracle_lng && (user.oracle_birth_date || user.birthDate)) {
        try {
          // A. Obter Token (Oauth2 client_credentials via fetch raw na porta /token)
          const tokenRes = await fetch('https://api.prokerala.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: creds.oracleProkeralaId,
              client_secret: creds.oracleProkeralaSecret
            })
          })
          const tokenData = await tokenRes.json()

          if (tokenData.access_token) {
            // B. Pegar a Posição dos Planetas usando a string parseada
            const formattedDate = parseDateString(user.oracle_birth_date || (user.birthDate && new Date(user.birthDate).toISOString()))
            const astroRes = await fetch(`https://api.prokerala.com/v2/astrology/planet-position?datetime=${formattedDate}&coordinates=${user.oracle_lat},${user.oracle_lng}`, {
              headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
            })
            
            const astroData = await astroRes.json()
            if (astroData?.data?.planet_position) {
              const planetsData = astroData.data.planet_position.map(p => `${p.name} em ${Number(p.degree).toFixed(1)}°`).join(', ')
              astrologyContext = `Planetas no mapa astral de nascimento: ${planetsData}.`
            }
          }
        } catch (err) {
          console.error('[API/Oracle] Erro ao integrar com Prokerala:', err.message)
          // Falha do Prokerala não derruba a consulta, pois o Gemini segue usando o nome e cidade
        }
      }

      // 4. Integração Gemini 1.5 Flash (Acesso Direto REST para evitar excesso de dependências do SDK)
      const systemInstruction = creds.oracleSystemPrompt || 'Você é o Astria, um oráculo místico. Responda com um tom esotérico e poético. Sempre entregue conselhos embasados nas mensagens das estrelas.'
      const userContext = `Nome do Consulente: ${user.name}. 
      Cidade de Nascimento: ${user.oracle_city || 'Desconhecida'}.
      Data/Hora de Nascimento Fornecida: ${user.oracle_birth_date || 'Desconhecida'}.
      Contexto Astrológico Bruto (Prokerala): ${astrologyContext}.
      Desejo / Pergunta Secreta: "${question}"`

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${creds.oracleGeminiKey}`
      
      const geminiBody = {
        system_instruction: {
          parts: { text: systemInstruction }
        },
        contents: [{
          parts: [{ text: userContext }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 800
        }
      }

      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody)
      })
      
      const geminiData = await geminiRes.json()

      if (geminiData.error) {
        console.error('[API/Oracle] Erro retornado pelo Gemini:', geminiData.error)
        return response.status(500).json({ error: 'Os astros não puderam responder agora. Nossa conexão mística falhou (Erro AI).' })
      }

      const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'O silêncio do cosmos é absoluto. Não houve resposta.'

      response.status(200).json({ answer })
    } catch (error) {
      console.error('[API/Oracle] Erro interno:', error)
      response.status(500).json({ error: 'Erro interno ao realizar ritual.' })
    }
  })

  return router
}
