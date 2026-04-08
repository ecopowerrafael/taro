import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlatformContext } from "../context/platform-context";
import { useNavigate } from 'react-router-dom';
import { SmokeBackground } from '../components/Oracle/SmokeBackground';
import { CityAutocomplete } from '../components/Oracle/CityAutocomplete';
import { Loader2 } from 'lucide-react';
import Typewriter from 'typewriter-effect';
import { AstrologyChart } from '../components/Oracle/AstrologyChart';
import { AstralReadingPurchaseModal } from '../components/AstralReadingPurchaseModal';
import { buildApiUrl } from '../utils/runtimeConfig';

// Explosion particle component for the button
function ButtonExplosion({ isExploding, children }) {
  if (!isExploding) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{ 
             opacity: 0, 
             scale: 0, 
             x: (Math.random() - 0.5) * 300, 
             y: (Math.random() - 0.5) * 300 
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute w-2 h-2 rounded-full bg-mystic-gold shadow-[0_0_10px_#fff]"
        />
      ))}
      {children}
    </div>
  );
}

// Stars Background for birth_city step
function StarsBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
       {[...Array(50)].map((_, i) => (
         <motion.div
           key={i}
           initial={{ opacity: Math.random(), scale: Math.random() * 0.5 + 0.5 }}
           animate={{ opacity: [0.2, 1, 0.2] }}
           transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }}
           className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_5px_#fff]"
           style={{
             top: `${Math.random() * 100}%`,
             left: `${Math.random() * 100}%`
           }}
         />
       ))}
    </div>
  );
}

export function OraclePage() {
  const { oracleCredentials, profile, refreshProfile, isAuthenticated, authLoading } = usePlatformContext();
  const navigate = useNavigate();
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const debugParam = urlParams?.get('oracleDebug') || urlParams?.get('debug') || '';
  const forceDebugParam = urlParams?.get('forceOracleDebug') || '';
  const localDebugFlag = typeof window !== 'undefined' ? localStorage.getItem('oracle_debug') : '';
  const debugRequested =
    debugParam === '1' ||
    debugParam.toLowerCase() === 'true' ||
    localDebugFlag === '1' ||
    String(localDebugFlag).toLowerCase() === 'true';
  const forceDebugRequested = forceDebugParam === '1' || String(forceDebugParam).toLowerCase() === 'true';
  const debugUserFilter = typeof window !== 'undefined' ? (localStorage.getItem('oracle_debug_user') || '').trim() : '';
  const debugForCurrentUser =
    !debugUserFilter ||
    String(debugUserFilter) === String(profile?.id ?? '') ||
    String(debugUserFilter).toLowerCase() === String(profile?.email ?? '').toLowerCase();
  const showOracleDebug = Boolean((debugRequested && debugForCurrentUser) || forceDebugRequested);
  const [step, setStep] = useState('intro');
  const [showAstralReadingModal, setShowAstralReadingModal] = useState(false);
  const [birthLocation, setBirthLocation] = useState(null);
  const [birthDateStr, setBirthDateStr] = useState('');  
  const [birthTimeStr, setBirthTimeStr] = useState('');  
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [oracleAnswer, setOracleAnswer] = useState('');
  const [oraclePlanets, setOraclePlanets] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartRequestAttempted, setChartRequestAttempted] = useState(false);
  const [chartGenerationFailed, setChartGenerationFailed] = useState(false);
  const [chartApiDebug, setChartApiDebug] = useState(null);
  const [debugLog, setDebugLog] = useState([]);
  const [isExploding, setIsExploding] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  const addDebugLog = (event, payload = null) => {
    if (!showOracleDebug) {
      return;
    }

    setDebugLog((prev) => {
      const next = [
        {
          time: new Date().toISOString(),
          event,
          payload,
        },
        ...prev,
      ];
      return next.slice(0, 30);
    });
  };

  const hasSavedOracleData = Boolean(
    birthLocation?.name &&
    birthLocation?.lat !== null &&
    birthLocation?.lat !== undefined &&
    birthLocation?.lng !== null &&
    birthLocation?.lng !== undefined &&
    birthDateStr?.trim() &&
    birthTimeStr?.trim(),
  );

  const hasGeneratedAstralMap = Array.isArray(oraclePlanets) && oraclePlanets.length > 0;

  // Ao montar, carrega o location salvo se houver
  useEffect(() => {
    if (profile?.oracle_city) {
      setBirthLocation({
        name: profile.oracle_city,
        lat: profile.oracle_lat,
        lng: profile.oracle_lng
      });
      if (profile.oracle_birth_date) {
         const parts = profile.oracle_birth_date.split(' ');
         if (parts[0]) setBirthDateStr(parts[0]);
         if (parts[1]) setBirthTimeStr(parts[1]);
      }
    }
  }, [profile]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    setShowGuestModal(!isAuthenticated);
    if (!isAuthenticated) {
      setStep('intro');
    }
  }, [authLoading, isAuthenticated]);

  const resetChartState = () => {
    setOraclePlanets([]);
    setChartRequestAttempted(false);
    setChartGenerationFailed(false);
    setChartApiDebug(null);
  };

  const fetchChart = async () => {
    setChartLoading(true);
    setChartRequestAttempted(true);
    setChartGenerationFailed(false);
    setErrorMsg('');
    addDebugLog('chart:request:start', {
      step,
      userId: profile?.id,
      email: profile?.email,
      hasSavedOracleData,
      oracle_city: profile?.oracle_city,
      oracle_birth_date: profile?.oracle_birth_date,
      oracle_lat: profile?.oracle_lat,
      oracle_lng: profile?.oracle_lng,
    });

    try {
      const res = await fetch(buildApiUrl('/api/oracle/chart'), {
        headers: { Authorization: `Bearer ${localStorage.getItem('taro_token')}` }
      });

      const data = await res.json().catch(() => ({}));
      setChartApiDebug(data?.debug ?? null);
      addDebugLog('chart:request:response', {
        status: res.status,
        ok: res.ok,
        planetsCount: Array.isArray(data?.planets) ? data.planets.length : 0,
        debug: data?.debug ?? null,
        error: data?.error ?? null,
      });

      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível gerar o mapa astral agora.');
      }

      if (Array.isArray(data.planets) && data.planets.length > 0) {
        setOraclePlanets(data.planets);
        setChartGenerationFailed(false);
        return true;
      }

      setOraclePlanets([]);
      setChartGenerationFailed(true);
      return false;
    } catch (err) {
      console.error('Error fetching astrology chart', err);
      setOraclePlanets([]);
      setChartGenerationFailed(true);
      addDebugLog('chart:request:error', {
        message: err?.message || 'unknown_error',
      });
      return false;
    } finally {
      setChartLoading(false);
    }
  };

  const handleRetryAstralMap = async () => {
    if (!hasSavedOracleData) {
      addDebugLog('chart:retry:no-saved-data', {
        birthLocation,
        birthDateStr,
        birthTimeStr,
      });
      resetChartState();
      setErrorMsg('');
      setStep('birth_city');
      return;
    }

    addDebugLog('chart:retry:with-saved-data');
    await fetchChart();
  };

  const handleLocationSubmit = async () => {
    if (!birthLocation) return;
    setLoadingAction(true);
    setErrorMsg('');
    addDebugLog('location:save:start', {
      birthLocation,
      birthDateStr,
      birthTimeStr,
    });
    try {
      const payload = {
        oracle_city: birthLocation.name,
        oracle_lat: birthLocation.lat,
        oracle_lng: birthLocation.lng,
        oracle_birth_date: `${birthDateStr} ${birthTimeStr}`.trim()
      };
      addDebugLog('location:save:payload', payload);

      const res = await fetch(buildApiUrl('/api/oracle/save-location'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('taro_token')}`
        },
        body: JSON.stringify(payload)
      });

      const rawText = await res.text();
      addDebugLog('location:save:response', {
        status: res.status,
        ok: res.ok,
        raw: rawText.substring(0, 260),
      });
      
      let data = {};
      try { data = JSON.parse(rawText); } catch(err){}

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${rawText.substring(0, 40)}`);
      }

      await refreshProfile();
      resetChartState();
      setStep('ritual');
    } catch (e) {
      console.error('Erro no LocationSubmit:', e);
      addDebugLog('location:save:error', {
        message: e?.message || 'unknown_error',
      });
      setErrorMsg('Erro salvar local: ' + e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  useEffect(() => {
    if (step === 'ritual' && oraclePlanets.length === 0) {
      addDebugLog('chart:auto-fetch:ritual-entered', {
        step,
        hasGeneratedAstralMap,
        planetsCount: oraclePlanets.length,
      });
      fetchChart();
    }
  }, [step]);

  const handleConsultSubmit = async () => {
    setLoadingAction(true);
    setErrorMsg('');
    try {
      const res = await fetch(buildApiUrl('/api/oracle/deduct-balance'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('taro_token')}`
        }
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.code === 'INSUFFICIENT_FUNDS') {
          setErrorMsg('Saldo insuficiente. Por favor, recarregue sua conta antes de continuar.');
          return;
        }
        throw new Error(data.error || 'Erro ao processar pagamento.');
      }
      
      // Pagou ou usou a grátis com sucesso
      await refreshProfile();
      setStep('ritual');
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const isFree = !profile?.oracle_used_free;
  const oraclePrice = Number(oracleCredentials?.oraclePrice || 0);

  const handleDateChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // só números
    if (val.length > 8) val = val.substring(0, 8);
    // máscara DD/MM/YYYY
    if (val.length > 4) {
      val = val.replace(/^(\d{2})(\d{2})/, "$1/$2/");
    } else if (val.length > 2) {
      val = val.replace(/^(\d{2})/, "$1/");
    }
    setBirthDateStr(val);
  };

  const handleTimeChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // só números
    if (val.length > 4) val = val.substring(0, 4);
    // máscara HH:MM
    if (val.length > 2) {
      val = val.replace(/^(\d{2})/, "$1:");
    }
    setBirthTimeStr(val);
  };


  const handleNextStep = () => {
    if (!isAuthenticated) {
      setShowGuestModal(true);
      return;
    }

    if (step === 'intro') {
      setIsExploding(true);
      setTimeout(() => {
        setIsExploding(false);
        setErrorMsg('');
        resetChartState();
        if (profile?.oracle_city) {
          setStep('ritual');
        } else {
          setStep('birth_city');
        }
      }, 500); // Aguarda animação de explosão
    }
  };

  const handleOracleRequest = async (question) => {
    setLoadingAction(true);
    setErrorMsg('');
    // addLog('OracReq', 'start');
    try {
      const res = await fetch(buildApiUrl('/api/oracle/consult'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('taro_token')}`
        },
        body: JSON.stringify({ question })
      });

      const rawText = await res.text();
      // addLog('ReqResSt', res.status);
      // addLog('ReqResTxt', rawText.substring(0, 50));
      
      let data = {};
      try { data = JSON.parse(rawText); } catch(err){}

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${rawText.substring(0, 40)}`);
      }

      setOracleAnswer(data.answer);
        if (data.planets) setOraclePlanets(data.planets); if (data.prokeralaDebug) // addLog('ProkeralaDebug', data.prokeralaDebug);
      setStep('result');
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05000A] text-white relative flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-mystic-dark to-black" />
      <SmokeBackground />

      <AnimatePresence>
        {!authLoading && showGuestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="w-full max-w-md rounded-3xl border border-mystic-gold/30 bg-[linear-gradient(180deg,rgba(33,18,54,0.98),rgba(10,7,18,0.96))] p-6 text-center shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_30px_rgba(197,160,89,0.18)]"
            >
              <img src="/mapa-astral.png" alt="Mapa Astral" className="mx-auto h-20 w-20 object-contain drop-shadow-[0_0_18px_rgba(255,215,0,0.4)]" />
              <h2 className="mt-4 font-display text-3xl text-mystic-goldSoft">Mapa Astral</h2>
              <p className="mt-4 text-sm leading-relaxed text-amber-100/80">
                Para realizar seu mapa astral faça seu cadastro ou login e aceite receber notificações.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => navigate('/cadastro')}
                  className="flex-1 rounded-xl border border-mystic-gold/40 px-4 py-3 font-bold text-mystic-goldSoft transition hover:bg-mystic-gold/10"
                >
                  Cadastro
                </button>
                <button
                  onClick={() => navigate('/entrar')}
                  className="flex-1 rounded-xl bg-mystic-gold px-4 py-3 font-bold text-mystic-dark transition hover:brightness-110"
                >
                  Login
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="z-10 relative flex flex-col items-center max-w-lg mx-auto p-4 text-center">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
          <img src="/mapa-astral.png" alt="Mapa Astral" className="w-32 h-32 mx-auto drop-shadow-[0_0_20px_rgba(255,215,0,0.5)] object-contain" />
          <h1 className="text-3xl font-serif text-mystic-gold">Mapa Astral</h1>
          <p className="text-gray-300 px-4 leading-relaxed">
            Sincronize-se com o Universo. Na Astria, transformamos dados astronômicos em sabedoria ancestral. Descubra os segredos que moldam sua personalidade, seus desafios e sua força oculta. O Cosmo tem uma mensagem para você. Vamos ouvi-la?
            </p>
            <div className="relative inline-block mt-8">
              <ButtonExplosion isExploding={isExploding} />
              <button
                onClick={handleNextStep}
                className="relative z-10 bg-mystic-gold text-mystic-dark px-8 py-3 rounded-full font-bold shadow-[0_0_15px_rgba(255,215,0,0.5)] uppercase tracking-wider hover:scale-105 transition-transform"
              >
                {profile?.oracle_city ? 'Ver meu Mapa Astral' : 'Gerar meu Mapa Astral'}
              </button>
            </div>

            <div className="mt-8 px-6 pb-6 pt-4 bg-black/40 border border-mystic-gold/20 rounded-2xl max-w-sm mx-auto shadow-inner">
              <span className="block text-xs font-serif text-mystic-gold mb-2 font-bold tracking-widest uppercase">"Sua biografia escrita pelo Cosmo"</span>
              <p className="text-[11px] text-gray-400 leading-relaxed text-justify">
                Nosso Oráculo utiliza cálculos reais de órbitas planetárias — os mesmos dados usados para navegação espacial — para garantir que seu mapa seja tecnicamente perfeito. A partir dessa base científica, nossa inteligência interpreta os símbolos e arquétipos ocidentais, revelando o mapa da sua essência.
              </p>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="block mx-auto text-sm text-gray-400 mt-4 hover:text-white"
            >
              Voltar
            </button>
          </motion.div>
        )}

        {step === 'birth_city' && (
          <motion.div 
            key="birth_city"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 w-full max-w-sm mx-auto relative z-10"
          >
            <StarsBackground />
            <p className="text-mystic-gold text-2xl font-serif italic drop-shadow-md mb-8 relative z-20 text-center">
              Onde e quando as estrelas brilharam no seu nascimento?
            </p>
            
            <div className="w-full relative z-20 space-y-4">
               <div className="flex gap-4">
  <div className="flex-1">
    <label className="block text-sm font-medium text-mystic-gold/80 mb-2 text-left">Data de Nascimento</label>
    <input
      type="text"
      value={birthDateStr}
      onChange={handleDateChange}
      placeholder="DD/MM/AAAA"
      className="w-full bg-black/60 border border-mystic-purple/50 rounded-lg px-4 py-4 text-left text-white placeholder-gray-500 focus:outline-none focus:border-mystic-gold focus:ring-1 focus:ring-mystic-gold transition-all"
    />
  </div>
  <div className="flex-1">
    <label className="block text-sm font-medium text-mystic-gold/80 mb-2 text-left">Horário de Nascimento</label>
    <input
      type="text"
      value={birthTimeStr}
      onChange={handleTimeChange}
      placeholder="HH:MM"
      className="w-full bg-black/60 border border-mystic-purple/50 rounded-lg px-4 py-4 text-left text-white placeholder-gray-500 focus:outline-none focus:border-mystic-gold focus:ring-1 focus:ring-mystic-gold transition-all"
    />
  </div>
</div>
               
               <div>
                 <label className="block text-sm font-medium text-mystic-gold/80 mb-2 text-left">Sua cidade natal (Onde você nasceu)</label>
                 <CityAutocomplete onSelect={(location) => setBirthLocation(location)} />
               </div>
            </div>
            
            <div className="mt-8 min-h-[60px] relative z-0">
               {birthLocation && birthDateStr.length >= 10 && birthTimeStr.length >= 5 && (
                 <motion.button
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   onClick={handleLocationSubmit}
                   disabled={loadingAction}
                   className="bg-transparent border-2 border-mystic-gold text-mystic-gold px-8 py-3 rounded-full font-bold shadow-[0_0_15px_rgba(255,215,0,0.3)] uppercase tracking-wider mx-auto flex items-center justify-center gap-2 hover:bg-mystic-gold hover:text-mystic-dark transition-all disabled:opacity-50"
                 >
                   {errorMsg && (
                 <div className="absolute -top-12 w-full text-red-500 bg-red-900/50 p-2 rounded text-sm text-center">
                   {errorMsg}
                 </div>
               )}
               {loadingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                   Sintonizar Cosmos
                 </motion.button>
               )}
            </div>

            <button
              onClick={() => setStep('intro')}
              className="block mx-auto text-sm text-gray-500 hover:text-mystic-gold transition-colors mt-6 relative z-0"
            >
              Voltar
            </button>
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div 
            key="payment"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 max-w-sm w-full mx-auto"
          >
            <h2 className="text-2xl font-serif text-mystic-gold relative z-10">Cruzar o Limiar</h2>
            
            <div className="bg-[#1a0f2e]/80 border border-mystic-purple/50 rounded-xl p-6 shadow-2xl relative z-10">
               {isFree ? (
                 <>
                   <p className="text-green-400 font-bold text-lg mb-2">Primeira Consulta Gratuita</p>
                   <p className="text-gray-300 text-sm mb-6">Você tem direito a pedir orientação às estrelas sem custo. Use sabiamente, Viajante.</p>
                 </>
               ) : (
                 <>
                   <p className="text-amber-400 font-bold text-lg mb-2">Conexão Mística</p>
                   <p className="text-gray-300 text-sm mb-4">Um tributo de <span className="font-bold text-white">R$ {oraclePrice.toFixed(2).replace('.', ',')}</span> é necessário para abrir os caminhos.</p>
                 </>
               )}

               {errorMsg && (
                 <div className="text-red-400 bg-red-900/30 p-3 rounded text-sm mb-4">
                   {errorMsg}
                 </div>
               )}

               <button
                 onClick={handleConsultSubmit}
                 disabled={loadingAction}
                 className="w-full bg-mystic-gold text-mystic-dark px-6 py-3 rounded-full font-bold shadow-[0_0_15px_rgba(255,215,0,0.5)] uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 mt-4"
               >
                 {loadingAction && <Loader2 className="w-5 h-5 animate-spin text-mystic-dark" />}
                 {isFree ? 'Iniciar Gratuitamente' : 'Ofertar e Iniciar'}
               </button>

               {!isFree && errorMsg === 'Saldo insuficiente. Por favor, recarregue sua conta antes de continuar.' && (
                 <button
                   onClick={() => navigate('/recarregar')}
                   className="w-full mt-4 bg-transparent border border-mystic-gold text-mystic-gold px-6 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-mystic-gold/10 transition-colors"
                 >
                   Realizar Recarga
                 </button>
               )}
            </div>

            <button
               onClick={() => setStep('intro')}
               className="block mx-auto text-sm text-gray-500 hover:text-white mt-8 relative z-10"
             >
               Cancelar Preparação
             </button>
          </motion.div>
        )}

        {step === 'ritual' && (
          <motion.div 
            key="ritual"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 w-full max-w-lg mx-auto"
          >
            <p className="text-mystic-gold text-xl italic font-serif drop-shadow-md text-center">
              "As estrelas se alinham para você, {profile?.name?.split(' ')[0] || 'Viajante'}..."
            </p>
            
            <div className="w-full flex flex-col items-center justify-center relative z-10 transition-all mt-4">
              <div className="mb-2 bg-black/40 px-4 py-1 rounded-full text-xs text-gray-400 border border-mystic-gold/20 flex flex-col gap-1 items-center">
                <span>
                  Destino traçado a partir de: <span className="text-mystic-gold font-bold ml-1">{birthLocation?.name}</span>
                </span>
                <span>
                  Nascido em: <span className="text-mystic-gold font-bold ml-1">{birthDateStr}</span>
                </span>
              </div>
              
              {chartLoading ? (
                 <div className="flex flex-col items-center my-6">
                   <Loader2 className="w-8 h-8 animate-spin text-mystic-gold mb-2" />
                   <p className="text-sm text-mystic-gold">Desenhando seu céu natal...</p>
                 </div>
              ) : chartRequestAttempted && chartGenerationFailed && !hasGeneratedAstralMap ? (
                <div className="mt-6 w-full max-w-2xl rounded-2xl border border-mystic-gold/25 bg-[#1a0f2e]/85 p-6 text-center shadow-[0_0_20px_rgba(255,215,0,0.08)]">
                  <p className="text-base leading-relaxed text-amber-100 md:text-lg">
                    Algumas nuvens impediram a leitura dos astros, espere 1 minuto e clique em gerar novamente.
                  </p>
                  <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <button
                      onClick={handleRetryAstralMap}
                      className="inline-flex items-center justify-center rounded-full bg-mystic-gold px-6 py-3 text-sm font-bold uppercase tracking-wider text-mystic-dark transition hover:scale-105"
                    >
                      Tentar novamente
                    </button>
                    {!hasSavedOracleData && (
                      <button
                        onClick={() => {
                          resetChartState();
                          setErrorMsg('');
                          setStep('birth_city');
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-mystic-gold/40 px-6 py-3 text-sm font-bold uppercase tracking-wider text-mystic-gold transition hover:bg-mystic-gold/10"
                      >
                        Preencher dados novamente
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                 <AstrologyChart planets={oraclePlanets} />

               <div className="mt-8 text-center p-6 bg-[#1a0f2e]/80 border border-mystic-gold/30 rounded-2xl w-full max-w-2xl mx-auto shadow-[0_0_20px_rgba(255,215,0,0.1)]">
                 <p className="text-gray-300 font-serif mb-3 text-lg md:text-xl relative z-10">Quer ir mais fundo no que os Astros podem revelar?</p>
                 <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-amber-100/80 md:text-base">
                   Receba por e-mail um PDF com cerca de 20 páginas com uma leitura completa do seu Mapa astral. É uma Jornada de AutoConhecimento que te guiará em muitos aspectos da sua vida.
                 </p>
                 <button
                  onClick={() => setShowAstralReadingModal(true)}
                  className="relative z-10 w-full md:w-auto inline-flex items-center justify-center bg-mystic-gold text-mystic-dark font-bold py-3 md:py-4 px-8 rounded-full shadow-[0_0_15px_rgba(255,215,0,0.5)] hover:scale-105 hover:shadow-[0_0_25px_rgba(255,215,0,0.8)] transition-all uppercase tracking-wider text-sm md:text-base border-2 border-transparent hover:border-white/20"
                 >
                  Solicitar sua Leitura Astral completa por Apenas R$ 49,90
                 </button>
               </div>
               </>
            )}
              {errorMsg && (
                 <div className="mt-4 text-red-400 bg-red-900/30 p-3 rounded text-sm w-full">
                   {errorMsg}
                 </div>
              )}
            </div>

            {!loadingAction && (
              <button
                onClick={() => setStep('intro')}
                className="block mx-auto text-sm text-gray-500 hover:text-white mt-8 transition-colors"
                disabled={loadingAction}
              >
                Abandonar Ritual
              </button>
            )}
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 w-full max-w-lg mx-auto bg-[#1a0f2e]/80 border border-mystic-gold/50 rounded-2xl p-6 shadow-[0_0_40px_rgba(255,215,0,0.1)] backdrop-blur-md"
          >
             <h2 className="text-2xl font-serif text-mystic-gold mb-4 relative z-10 text-center">
               Sua Revelação Astria
             </h2>
             
<AstrologyChart planets={oraclePlanets} />
               <div className="prose prose-invert prose-gold max-w-none text-gray-300 font-serif leading-relaxed text-left min-h-[150px] whitespace-pre-wrap">
                 <Typewriter
                   onInit={(typewriter) => {
                     typewriter
                       .typeString(oracleAnswer)
                       .start();
                   }}
                   options={{
                     delay: 30,
                     cursor: '✧'
                   }}
                 />
             </div>

             <button
               onClick={() => setStep('intro')}
               className="w-full mt-6 bg-transparent border-2 border-mystic-gold text-mystic-gold px-8 py-3 rounded-full font-bold uppercase tracking-wider flex items-center justify-center hover:bg-mystic-gold hover:text-mystic-dark transition-all"
             >
               Finalizar Ritual
             </button>
          </motion.div>
        )}
      </AnimatePresence>
      {showAstralReadingModal && (
        <AstralReadingPurchaseModal onClose={() => setShowAstralReadingModal(false)} />
      )}

      {showOracleDebug && (
        <div className="fixed bottom-3 left-3 right-3 z-[180] max-h-[44vh] overflow-auto rounded-xl border border-amber-400/40 bg-black/90 p-3 text-left text-xs text-amber-100 shadow-[0_0_24px_rgba(0,0,0,0.6)]">
          <p className="font-semibold text-amber-300">DEBUG ORACLE (ativo para diagnóstico)</p>
          <p className="mt-1 text-amber-100/80">
            userId: {String(profile?.id || 'n/a')} | email: {profile?.email || 'n/a'} | step: {step}
          </p>
          {debugUserFilter && !debugForCurrentUser && (
            <p className="text-amber-200/90">
              Filtro ativo ({debugUserFilter}) não corresponde ao usuário atual.
            </p>
          )}
          <p className="text-amber-100/80">
            savedData: {hasSavedOracleData ? 'sim' : 'não'} | planets: {oraclePlanets.length} | chartFail: {chartGenerationFailed ? 'sim' : 'não'}
          </p>

          {chartApiDebug && (
            <pre className="mt-2 whitespace-pre-wrap rounded border border-amber-400/20 bg-black/70 p-2 text-[11px] text-amber-200">
              {JSON.stringify(chartApiDebug, null, 2)}
            </pre>
          )}

          {debugLog.length > 0 && (
            <div className="mt-2 space-y-2">
              {debugLog.map((entry, index) => (
                <div key={`${entry.time}-${index}`} className="rounded border border-amber-400/15 bg-black/60 p-2">
                  <p className="text-[11px] font-semibold text-amber-300">{entry.time} — {entry.event}</p>
                  {entry.payload && (
                    <pre className="mt-1 whitespace-pre-wrap text-[10px] text-amber-100/90">
                      {JSON.stringify(entry.payload, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
