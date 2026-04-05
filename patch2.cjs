const fs = require('fs');
let content = fs.readFileSync('src/pages/OraclePage.jsx', 'utf8');

const regex = /<div\s+className="z-10 relative flex flex-col items-center max-w-lg[\s\S]*?mx-auto\s+p-4\s+text-center">/;

const replace = `<div className="absolute top-0 left-0 w-full max-h-40 overflow-y-auto bg-black/80 text-green-400 font-mono text-[10px] p-2 z-[99] break-words text-left">
        <div className="flex justify-between items-center bg-black sticky top-0 font-bold mb-1">
           <span>Debug API</span>
           <button onClick={() => setDebugLogs([])} className="pointer-events-auto bg-red-800 text-white px-2 rounded">Clear</button>
        </div>
        {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
      </div>
      <div className="z-10 relative flex flex-col items-center max-w-lg mx-auto p-4 text-center">`;

content = content.replace(regex, replace);
fs.writeFileSync('src/pages/OraclePage.jsx', content);
console.log('patched2 done');
