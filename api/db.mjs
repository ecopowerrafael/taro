import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
]

const getMissingVars = () => requiredEnvVars.filter((key) => !process.env[key])

export const assertDatabaseConfig = () => {
  const missing = getMissingVars()
  if (missing.length > 0) {
    throw new Error(`Variáveis de banco ausentes: ${missing.join(', ')}`)
  }
}

const resolveDatabaseHost = () => {
  const host = (process.env.DB_HOST || '').trim()
  if (host.toLowerCase() === 'localhost') {
    return '127.0.0.1'
  }
  return host
}

export const createPool = () => {
  console.log(`[DB] Criando pool de conexão para ${process.env.DB_HOST} (User: ${process.env.DB_USER})`)
  return mysql.createPool({
    host: resolveDatabaseHost(),
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    queueLimit: 0,
    decimalNumbers: true,
  })
}

export const initializeSchema = async (pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('client', 'consultant', 'admin') NOT NULL DEFAULT 'client',
      birthDate DATE NULL,
      minutesBalance DECIMAL(10,2) NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL
    )
  `)

  // Renomear minutesBalance para balance (Reais) se necessário, 
  // mas para evitar quebra de compatibilidade imediata, vamos apenas tratar como Reais no código.
  // No futuro, uma migração de renomeação seria ideal.

  await pool.query(`
    CREATE TABLE IF NOT EXISTS consultants (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      tagline VARCHAR(255) NULL,
      description TEXT NULL,
      status ENUM('Online', 'Offline', 'Ocupado') NOT NULL DEFAULT 'Offline',
      photo LONGTEXT NULL,
      pricePerMinute DECIMAL(10,2) NOT NULL DEFAULT 0,
      priceThreeQuestions DECIMAL(10,2) NOT NULL DEFAULT 0,
      priceFiveQuestions DECIMAL(10,2) NOT NULL DEFAULT 0,
      baseConsultations INT NOT NULL DEFAULT 0,
      realSessions INT NOT NULL DEFAULT 0,
      ratingAverage DECIMAL(3,2) NOT NULL DEFAULT 0,
      commissionOverride DECIMAL(5,2) NULL,
      createdAt DATE NULL,
      userId VARCHAR(50) NULL,
      CONSTRAINT fk_consultant_user
        FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE SET NULL
    )
  `)

  // Garantir que a coluna userId existe em consultants (para bancos já criados)
  try {
    await pool.query('ALTER TABLE consultants ADD COLUMN userId VARCHAR(50) NULL')
    await pool.query('ALTER TABLE consultants ADD CONSTRAINT fk_consultant_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL')
  } catch (e) {
    // Ignora se a coluna já existir
  }

  // Garantir que a coluna birthDate e minutesBalance existem em users (para bancos já criados)
  try {
    await pool.query('ALTER TABLE users ADD COLUMN birthDate DATE NULL')
    await pool.query('ALTER TABLE users ADD COLUMN minutesBalance DECIMAL(10,2) NOT NULL DEFAULT 0')
  } catch (e) {
    // Ignora se já existirem
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS question_requests (
      id VARCHAR(80) PRIMARY KEY,
      consultantId VARCHAR(50) NOT NULL,
      consultantName VARCHAR(120) NOT NULL,
      customerName VARCHAR(120) NOT NULL,
      customerEmail VARCHAR(190) NOT NULL,
      questionCount INT NOT NULL,
      packagePrice DECIMAL(10,2) NOT NULL DEFAULT 0,
      entries JSON NOT NULL,
      status ENUM('pending', 'answered') NOT NULL DEFAULT 'pending',
      createdAt DATETIME NOT NULL,
      answeredAt DATETIME NULL,
      answerSummary TEXT NULL,
      commissionValue DECIMAL(10,2) NOT NULL DEFAULT 0,
      consultantNetValue DECIMAL(10,2) NOT NULL DEFAULT 0,
      INDEX idx_question_consultant_status (consultantId, status),
      CONSTRAINT fk_question_consultant
        FOREIGN KEY (consultantId) REFERENCES consultants(id)
        ON DELETE CASCADE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS consultant_wallets (
      consultantId VARCHAR(50) PRIMARY KEY,
      availableBalance DECIMAL(10,2) NOT NULL DEFAULT 0,
      pixKey VARCHAR(255) NULL,
      CONSTRAINT fk_wallet_consultant
        FOREIGN KEY (consultantId) REFERENCES consultants(id)
        ON DELETE CASCADE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id VARCHAR(90) PRIMARY KEY,
      consultantId VARCHAR(50) NOT NULL,
      type ENUM('credit', 'debit') NOT NULL,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      commissionValue DECIMAL(10,2) NULL,
      createdAt DATETIME NOT NULL,
      description VARCHAR(255) NOT NULL,
      INDEX idx_wallet_tx_consultant_date (consultantId, createdAt),
      CONSTRAINT fk_wallet_tx_consultant
        FOREIGN KEY (consultantId) REFERENCES consultants(id)
        ON DELETE CASCADE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wallet_withdrawals (
      id VARCHAR(90) PRIMARY KEY,
      consultantId VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL,
      status VARCHAR(30) NOT NULL,
      INDEX idx_wallet_wd_consultant_date (consultantId, createdAt),
      CONSTRAINT fk_wallet_wd_consultant
        FOREIGN KEY (consultantId) REFERENCES consultants(id)
        ON DELETE CASCADE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS platform_credentials (
      id INT PRIMARY KEY,
      mpPublicKey VARCHAR(255) NULL,
      mpAccessToken VARCHAR(255) NULL,
      mpWebhookSecret VARCHAR(255) NULL,
      dailyApiKey VARCHAR(255) NULL,
      dailyDomain VARCHAR(255) NULL,
      dailyRoomName VARCHAR(255) NULL,
      pixKey VARCHAR(255) NULL,
      pixReceiverName VARCHAR(120) NULL,
      pixReceiverCity VARCHAR(120) NULL
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS recharge_requests (
      id VARCHAR(50) PRIMARY KEY,
      userId VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      minutes INT NOT NULL,
      method ENUM('pix', 'card') NOT NULL,
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NULL,
      CONSTRAINT fk_recharge_user
        FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE
    )
  `)

  await pool.query(`
    INSERT IGNORE INTO consultant_wallets (consultantId, availableBalance, pixKey)
    SELECT id, 0, NULL
    FROM consultants
  `)

  await pool.query(`
    INSERT IGNORE INTO platform_credentials (
      id,
      mpPublicKey,
      mpAccessToken,
      mpWebhookSecret,
      dailyApiKey,
      dailyDomain,
      dailyRoomName
    ) VALUES (1, NULL, NULL, NULL, NULL, 'demo.daily.co', 'hello')
  `)

  // Criar admin se não existir
  const [admins] = await pool.query('SELECT id FROM users WHERE role = "admin"')
  if (admins.length === 0) {
    const adminId = 'admin_' + Math.random().toString(36).substr(2, 9)
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await pool.query(
      `
        INSERT INTO users (id, name, email, password, role, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [adminId, 'Admin Astria', 'admin@astria.com.br', hashedPassword, 'admin', new Date()],
    )
    console.log('Usuário admin padrão criado: admin@astria.com.br / admin123')
  }
}
