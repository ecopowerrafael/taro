import { Router } from 'express'
import { authenticate } from '../middleware/auth.mjs'
import { calculateChart } from '../astroEngine.mjs'

export const createOracleRouter = (pool) => {
  const router = Router()

  const parseDateString = (dateStr) => {
    if (!dateStr) return null
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
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }

  const validateOracleBirthData = (user) => {
    const lat = Number(user.oracle_lat)
    const lng = Number(user.oracle_lng)
    const birthRaw = user.oracle_birth_date || user.birthDate || ''
    const birthDateIso = parseDateString(birthRaw)

    if (!birthRaw || !birthDateIso) {
      return {
        ok: false,
        code: 'MISSING_ORACLE_BIRTH_DATA',
        message: 'Data e hora de nascimento inválidas. Preencha novamente para gerar seu mapa astral.',
      }
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return {
        ok: false,
        code: 'INVALID_ORACLE_COORDINATES',
        message: 'Coordenadas de nascimento inválidas. Selecione novamente sua cidade de nascimento.',
        details: { lat: user.oracle_lat, lng: user.oracle_lng }
      }
    }

    if (lat === 0 && lng === 0) {
      return {
        ok: false,
        code: 'INVALID_ORACLE_COORDINATES',
        message: 'Não conseguimos localizar sua cidade com precisão. Selecione novamente a cidade de nascimento.',
        details: { lat, lng }
      }
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return {
        ok: false,
        code: 'INVALID_ORACLE_COORDINATES',
        message: 'Latitude/longitude fora do intervalo permitido. Selecione novamente a cidade de nascimento.',
        details: { lat, lng }
      }
    }

    return {
      ok: true,
      birthDateIso,
      lat,
      lng,
    }
  }

  const buildChartCacheKey = (user) => {
    const effectiveBirthDate = user.oracle_birth_date || user.birthDate || ''
    return JSON.stringify({
      birthDate: effectiveBirthDate,
      lat: user.oracle_lat == null ? null : Number(user.oracle_lat),
      lng: user.oracle_lng == null ? null : Number(user.oracle_lng),
    })
  }

  const parseCachedPlanets = (cacheValue) => {
    if (!cacheValue) {
      return null
    }

    try {
      const parsed = JSON.parse(cacheValue)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  const buildAstrologyContext = (rawPlanets) => {
    if (!Array.isArray(rawPlanets) || rawPlanets.length === 0) {
      return 'Dados astrológicos exatos indisponíveis/ignorados.'
    }

    const planetsData = rawPlanets
      .map((planet) => {
        const sign = planet.sign ? (planet.sign.name || planet.sign || '') : ''
        const degree = typeof planet.normDegree === 'number'
          ? planet.normDegree
          : (typeof planet.degree === 'number' ? planet.degree : 0)
        const nakshatra = planet.nakshatra ? (planet.nakshatra.name || planet.nakshatra || '') : ''
        const house = planet.house ? `Casa ${planet.house}` : ''
        const retrograde = planet.isRetrograde ? ' (Retrógrado)' : ''

        return `${planet.name} em ${sign} ${house} ${Number(degree).toFixed(1)}° ${nakshatra ? `Nakshatra: ${nakshatra}` : ''} ${retrograde}`
          .replace(/\s+/g, ' ')
          .trim()
      })
      .join('; ')

    return `Posições Astrológicas (Swiss Ephemeris Ayanamsa Lahiri): ${planetsData}.`
  }

  const fetchSwissephChart = async (user) => {
    let rawPlanets = []
    let engineDebug = null
    const validation = validateOracleBirthData(user)
    if (!validation.ok) {
      return {
        rawPlanets,
        engineDebug: {
          validationFailed: true,
          code: validation.code,
          details: validation.details || null,
        },
        validationError: validation,
      }
    }

    try {
      rawPlanets = await calculateChart(
        validation.birthDateIso,
        validation.lat,
        validation.lng
      )
      engineDebug = { calculated: true, planetCount: rawPlanets.length }
    } catch (error) {
      engineDebug = { exception: error.message }
    }

    return { rawPlanets, engineDebug, validationError: null }
  }

  const getOracleChart = async (user, userId) => {
    const cacheKey = buildChartCacheKey(user)
    const cachedPlanets = parseCachedPlanets(user.oracle_chart_cache)

    if (cachedPlanets && user.oracle_chart_cache_key === cacheKey) {
      return {
        rawPlanets: cachedPlanets,
        engineDebug: { cached: true, cachedAt: user.oracle_chart_cached_at },
      }
    }

    const { rawPlanets, engineDebug, validationError } = await fetchSwissephChart(user)

    if (Array.isArray(rawPlanets) && rawPlanets.length > 0) {
      await pool.query(
        'UPDATE users SET oracle_chart_cache = ?, oracle_chart_cache_key = ?, oracle_chart_cached_at = NOW() WHERE id = ?',
        [JSON.stringify(rawPlanets), cacheKey, userId]
      )
    }

    return { rawPlanets, engineDebug, validationError }
  }

  // Salvar localização do nascimento (e se a primeira consulta já foi usada)
  router.post('/save-location', authenticate, async (request, response) => {
    try {
      const { oracle_city, oracle_lat, oracle_lng, oracle_birth_date } = request.body
      const userId = request.user.id

      await pool.query(
        'UPDATE users SET oracle_city = ?, oracle_lat = ?, oracle_lng = ?, oracle_birth_date = ?, oracle_chart_cache = NULL, oracle_chart_cache_key = NULL, oracle_chart_cached_at = NULL WHERE id = ?',
        [oracle_city, oracle_lat, oracle_lng, oracle_birth_date, userId]
      )

      response.status(200).json({ success: true })
    } catch (error) {
      console.error('[API/Oracle] Erro ao salvar location:', error)
      response.status(500).json({ error: `Erro salvar BD: ${error.message}` })
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
      response.status(500).json({ error: `Erro debitar: ${error.message}` })
    }
  })

  // Obter APENAS o mapa astral para o frontend renderizar antes de chamar o Gemini
  router.get('/chart', authenticate, async (request, response) => {
    try {
      const userId = request.user.id
      const [uRows] = await pool.query('SELECT birthDate, oracle_birth_date, oracle_lat, oracle_lng, oracle_chart_cache, oracle_chart_cache_key, oracle_chart_cached_at FROM users WHERE id = ?', [userId])
      if (!uRows.length) return response.status(404).json({ error: 'Usuário não encontrado' })
      const user = uRows[0]

      const { rawPlanets, engineDebug, validationError } = await getOracleChart(user, userId)

      if (validationError) {
        return response.status(422).json({
          error: validationError.message,
          code: validationError.code,
          details: validationError.details || null,
          debug: engineDebug,
        })
      }

      if (!Array.isArray(rawPlanets) || rawPlanets.length === 0) {
        return response.status(422).json({
          error: 'Não foi possível gerar seu mapa com os dados atuais. Revise cidade/data de nascimento e tente novamente.',
          code: 'ORACLE_CHART_EMPTY',
          debug: engineDebug,
        })
      }

      return response.status(200).json({ planets: rawPlanets, debug: engineDebug })
    } catch (error) {
      return response.status(500).json({ error: error.message })
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
      const [uRows] = await pool.query('SELECT name, birthDate, oracle_birth_date, oracle_city, oracle_lat, oracle_lng, oracle_chart_cache, oracle_chart_cache_key, oracle_chart_cached_at FROM users WHERE id = ?', [userId])
      if (!uRows.length) return response.status(404).json({ error: 'Usuário não encontrado' })
      const user = uRows[0]

      // 2. Buscar as credenciais no banco de dados
      const [pRows] = await pool.query('SELECT oracleGeminiKey, oracleGeminiModel, oracleSystemPrompt FROM platform_credentials LIMIT 1')
      const creds = pRows[0] || {}

      if (!creds.oracleGeminiKey) {
        return response.status(400).json({ error: 'Chave da API do Gemini não configurada pelo administrador no painel.' })
      }

      let astrologyContext = 'Dados astrológicos exatos indisponíveis/ignorados.'
      const { rawPlanets, engineDebug } = await getOracleChart(user, userId)
      astrologyContext = buildAstrologyContext(rawPlanets)

      // 4. Integração Gemini 1.5 Flash (Acesso Direto REST para evitar excesso de dependências do SDK)
      const systemInstruction = creds.oracleSystemPrompt || 'Você é o Astria, um oráculo místico. Responda com um tom esotérico e poético. Sempre entregue conselhos embasados nas mensagens das estrelas.'
      const userContext = `Nome do Consulente: ${user.name}. 
      Cidade de Nascimento: ${user.oracle_city || 'Desconhecida'}.
      Data/Hora de Nascimento Fornecida: ${user.oracle_birth_date || 'Desconhecida'}.
      Contexto Astrológico Bruto (Swiss Ephemeris): ${astrologyContext}.
      Desejo / Pergunta Secreta: "${question}"`

let activeModel = creds.oracleGeminiModel || 'gemini-2.5-pro';
        try {
          const listRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + creds.oracleGeminiKey);
          const listData = await listRes.json();
          if (listData?.models) {
             const models = listData.models.filter(m => m.supportedGenerationMethods.includes('generateContent') && m.name.includes('gemini'));
             if (models.length > 0 && !models.find(m => m.name === 'models/' + activeModel)) {
                activeModel = models[0].name.replace('models/', '');
             }
          }
        } catch (e) {}
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${creds.oracleGeminiKey}`
      
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
        return response.status(500).json({ error: `Erro AI: ${geminiData.error.message || JSON.stringify(geminiData.error)}` })
      }

      const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'O silêncio do cosmos é absoluto. Não houve resposta.'

        response.status(200).json({ answer, planets: rawPlanets, engineDebug })
    } catch (error) {
      console.error('[API/Oracle] Erro interno:', error)
      response.status(500).json({ error: `Erro Ritual: ${error.message}` })  
    }
  })

  return router
}
