const fs = require('fs');
let content = fs.readFileSync('src/pages/OraclePage.jsx', 'utf8');

const locRegex = /const handleLocationSubmit[\s\S]*?(?=  const handleConsultSubmit)/;
const locRep = `const handleLocationSubmit = async () => {
    if (!birthLocation) return;
    setLoadingAction(true);
    setErrorMsg('');
    addLog('LocSubmit', 'start');
    try {
      const payload = {
        oracle_city: birthLocation.name,
        oracle_lat: birthLocation.lat,
        oracle_lng: birthLocation.lng,
        oracle_birth_date: \`\${birthDateStr} \${birthTimeStr}\`.trim()
      };
      addLog('Payload', payload);

      const res = await fetch(buildApiUrl('/api/oracle/save-location'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${localStorage.getItem('token')}\`
        },
        body: JSON.stringify(payload)
      });

      const rawText = await res.text();
      addLog('LocResSt', res.status);
      addLog('LocResTxt', rawText.substring(0, 50));
      
      let data = {};
      try { data = JSON.parse(rawText); } catch(err){}

      if (!res.ok) {
        throw new Error(data.error || \`HTTP \${res.status}: \${rawText.substring(0, 40)}\`);
      }

      await fetchProfile();
      setStep('payment');
    } catch (e) {
      console.error('Erro no LocationSubmit:', e);
      addLog('LocErr', e);
      setErrorMsg('Erro salvar local: ' + e.message);
    } finally {
      setLoadingAction(false);
    }
  };

`;
content = content.replace(locRegex, locRep);

const oracRegex = /const handleOracleRequest[\s\S]*?(?=    } catch \(e\))/;
const oracRep = `const handleOracleRequest = async (question) => {
    setLoadingAction(true);
    setErrorMsg('');
    addLog('OracReq', 'start');
    try {
      const res = await fetch(buildApiUrl('/api/oracle/consult'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${localStorage.getItem('token')}\`
        },
        body: JSON.stringify({ question })
      });

      const rawText = await res.text();
      addLog('ReqResSt', res.status);
      addLog('ReqResTxt', rawText.substring(0, 50));
      
      let data = {};
      try { data = JSON.parse(rawText); } catch(err){}

      if (!res.ok) {
        throw new Error(data.error || \`HTTP \${res.status}: \${rawText.substring(0, 40)}\`);
      }

      setOracleAnswer(data.answer);
      if (data.planets) setOraclePlanets(data.planets);
      setStep('result');
`;
content = content.replace(oracRegex, oracRep);

const btnRegex = /{loadingAction && <Loader2 className="w-4 h-4 animate-spin" \/>}/;
const btnRep = `{errorMsg && (
                 <div className="absolute -top-12 w-full text-red-500 bg-red-900/50 p-2 rounded text-sm text-center">
                   {errorMsg}
                 </div>
               )}
               {loadingAction && <Loader2 className="w-4 h-4 animate-spin" />}`;
content = content.replace(btnRegex, btnRep);

const wrapperRegex = /<div className="z-10 relative flex flex-col items-center max-w-lg mx-auto \r?\np-4 text-center">/;
const wrapperRep = `<div className="absolute top-0 left-0 w-full bg-black/80 text-green-400 font-mono text-[10px] p-2 z-[99] pointer-events-none break-words text-left">
        {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
      </div>
      <div className="z-10 relative flex flex-col items-center max-w-lg mx-auto p-4 text-center">`;
content = content.replace(wrapperRegex, wrapperRep);

fs.writeFileSync('src/pages/OraclePage.jsx', content);
console.log('patched');
