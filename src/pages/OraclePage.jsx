import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlatformContext } from "../context/platform-context";
import { useNavigate } from 'react-router-dom';
import { SmokeBackground } from '../components/Oracle/SmokeBackground';
import { CityAutocomplete } from '../components/Oracle/CityAutocomplete';
import { StarFieldInput } from '../components/Oracle/StarFieldInput';
import { Loader2 } from 'lucide-react';

export function OraclePage() {
  const { oracleCredentials, profile, setProfile, fetchProfile } = usePlatformContext();
  const navigate = useNavigate();
  const [step, setStep] = useState('intro');
  const [birthLocation, setBirthLocation] = useState(null);
  const [birthDateStr, setBirthDateStr] = useState('');  const [birthTimeStr, setBirthTimeStr] = useState('');  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [oracleAnswer, setOracleAnswer] = useState('');

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

  const handleLocationSubmit = async () => {
    if (!birthLocation) return;
    
    setLoadingAction(true);
    try {
      // Salva no banco de dados local
      await fetch('/api/oracle/save-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          oracle_city: birthLocation.name,
          oracle_lat: birthLocation.lat,
          oracle_lng: birthLocation.lng,
          oracle_birth_date: `${birthDateStr} ${birthTimeStr}`.trim()
        })
      });
      // Atualiza o local state do profile global
      await fetchProfile();
      setStep('payment'); // Próximo passo é decidir se paga ou não
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConsultSubmit = async () => {
    setLoadingAction(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/oracle/deduct-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
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
      await fetchProfile();
      setStep('ritual');
    } catch (e) {
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

  const handleDateChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.substring(0, 8);
    if (val.length > 4) val = val.replace(/^(\d{2})(\d{2})/, "$1/$2/");
    else if (val.length > 2) val = val.replace(/^(\d{2})/, "$1/");
    setBirthDateStr(val);
  };

  const handleTimeChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.substring(0, 4);
    if (val.length > 2) val = val.replace(/^(\d{2})/, "$1:");
    setBirthTimeStr(val);
  };

  const handleNextStep = () => {
    if (step === 'intro') {
      // Se ele já tem salvo no banco, podemos pular a tela de cidade
      if (profile?.oracle_city) {
        setStep('payment');
      } else {
        setStep('birth_city');
      }
    }
  };

  const handleOracleRequest = async (question) => {
    setLoadingAction(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/oracle/consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ question })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao comunicar com o além.');
      }
      
      setOracleAnswer(data.answer);
      setStep('result'); 
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05000A] text-white relative flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-mystic-dark to-black" />
      <SmokeBackground />
      
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
            <img src="/oraculo.png" alt="Oráculo Astria" className="w-32 h-32 mx-auto" />
            <h1 className="text-3xl font-serif text-mystic-gold">Oráculo Astria</h1>
            <p className="text-gray-300">
              Bem-vindo ao ritual. Concentre-se na sua questão e permita que o cosmos revele a verdade oculta.
            </p>
            <button
              onClick={handleNextStep}
              className="bg-mystic-gold text-mystic-dark px-8 py-3 rounded-full font-bold shadow-[0_0_15px_rgba(255,215,0,0.5)] uppercase tracking-wider mt-8 hover:scale-105 transition-transform"
            >
              Continuar a Jornada
            </button>
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
            className="space-y-6 w-full max-w-sm mx-auto"
          >
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
              
              <StarFieldInput 
                isLoading={loadingAction} 
                onSubmit={handleOracleRequest} 
              />
              
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
             
             <div className="prose prose-invert prose-gold max-w-none text-gray-300 font-serif leading-relaxed text-left min-h-[150px] whitespace-pre-wrap">
               {oracleAnswer}
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
      </div>
    </div>
  );
}
