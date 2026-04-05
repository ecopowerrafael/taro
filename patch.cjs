const fs = require('fs');
let c=fs.readFileSync('api/db.mjs','utf8'); 
c=c.replace(/try \{\s*await pool\.query\('ALTER TABLE users ADD COLUMN oracle_used_free TINYINT\(1\) NOT NULL DEFAULT 0'\)\s*\} catch \(e\) \{\}/, 
"try {\n      await pool.query('ALTER TABLE users ADD COLUMN oracle_birth_date VARCHAR(50) NULL')\n    } catch (e) {}\n    try {\n      await pool.query('ALTER TABLE users ADD COLUMN oracle_used_free TINYINT(1) NOT NULL DEFAULT 0')\n    } catch (e) {}");
fs.writeFileSync('api/db.mjs',c);
console.log('patched db');
