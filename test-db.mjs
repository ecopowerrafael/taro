
import 'dotenv/config';
import { createPool } from './api/db.mjs'; 
(async() => { 
  const pool = createPool();
  const [c] = await pool.query('SELECT oracleProkeralaId, oracleProkeralaSecret FROM platform_credentials LIMIT 1'); 
  console.log('Creds ID:', !!c[0].oracleProkeralaId); 
  const [u] = await pool.query('SELECT id, name, oracle_lat, oracle_lng, oracle_birth_date FROM users ORDER BY id DESC LIMIT 1'); 
  console.log('User:', u[0]); 
  process.exit(0); 
})();
