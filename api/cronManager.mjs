import { sendPushToUsers } from './push.mjs';
import { calculateChart } from './astroEngine.mjs';
import { getDailyTransits } from './transitEngine.mjs';

/**
 * Inicia o gerenciador de tarefas agendadas.
 */
export function startCronManager(pool, firebaseAdmin, webpush, pushEnabled) {
  console.log('[Cron] Gerenciador de tarefas agendadas iniciado.');

  // Verifica a cada 1 minuto se é 03:00 AM
  setInterval(async () => {
    const now = new Date();
    // Horário de Brasília (GMT-3) - Ajuste conforme necessário
    const hour = now.getHours();
    const minute = now.getMinutes();

    if (hour === 3 && minute === 0) {
      console.log('[Cron] Iniciando processamento diário de trânsitos (03:00 AM)...');
      await processDailyTransits(pool, firebaseAdmin, webpush, pushEnabled);
    }
  }, 60000);
}

/**
 * Processa os trânsitos de todos os usuários e envia notificações push.
 */
async function processDailyTransits(pool, firebaseAdmin, webpush, pushEnabled) {
  try {
    // Buscar todos os usuários que têm dados de nascimento salvos
    const [users] = await pool.query(`
      SELECT id, name, oracle_birth_date, oracle_lat, oracle_lng, oracle_chart_cache 
      FROM users 
      WHERE oracle_birth_date IS NOT NULL 
        AND oracle_lat IS NOT NULL 
        AND oracle_lng IS NOT NULL
    `);

    console.log(`[Cron] Processando ${users.length} usuários.`);

    for (const user of users) {
      try {
        let natalPlanets;
        if (user.oracle_chart_cache) {
          natalPlanets = JSON.parse(user.oracle_chart_cache);
        } else {
          // Fallback: Calcular se não estiver em cache (improvável se já usou o oráculo)
          natalPlanets = await calculateChart(user.oracle_birth_date, user.oracle_lat, user.oracle_lng);
        }

        const transits = await getDailyTransits(natalPlanets);

        if (transits.length > 0) {
          // Pegar o trânsito com orbe mais estreito (já ordenado em getDailyTransits)
          const bestTransit = transits[0];

          await sendPushToUsers({
            pool,
            webpush,
            firebaseAdmin,
            userIds: [user.id],
            payload: {
              title: `✨ Oráculo Astria: ${bestTransit.interpretation.title}`,
              body: bestTransit.interpretation.text,
              url: `/oraculo-diario?tab=diario&transitId=${bestTransit.transitPlanet.name}_${bestTransit.natalPlanet.name}`,
              nativeRoute: `/oraculo-diario?tab=diario&transitId=${bestTransit.transitPlanet.name}_${bestTransit.natalPlanet.name}`,
              type: 'astral_transit',
            },
          });
        }
      } catch (err) {
        console.error(`[Cron] Erro ao processar trânsito para usuário ${user.id}:`, err);
      }
    }
    console.log('[Cron] Processamento diário concluído.');
  } catch (error) {
    console.error('[Cron] Erro fatal no processamento diário:', error);
  }
}
