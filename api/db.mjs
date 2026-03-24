import mysql from 'mysql2/promise'

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

export const createPool = () =>
  mysql.createPool({
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

export const initializeSchema = async (pool) => {
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
      createdAt DATE NULL
    )
  `)

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
    CREATE TABLE IF NOT EXISTS app_credentials (
      id TINYINT PRIMARY KEY,
      mpPublicKey VARCHAR(255) NULL,
      mpAccessToken TEXT NULL,
      mpWebhookSecret TEXT NULL,
      dailyApiKey TEXT NULL,
      dailyDomain VARCHAR(255) NULL,
      dailyRoomName VARCHAR(255) NULL
    )
  `)

  await pool.query(`
    INSERT IGNORE INTO consultant_wallets (consultantId, availableBalance, pixKey)
    SELECT id, 0, NULL
    FROM consultants
  `)

  await pool.query(`
    INSERT IGNORE INTO app_credentials (
      id,
      mpPublicKey,
      mpAccessToken,
      mpWebhookSecret,
      dailyApiKey,
      dailyDomain,
      dailyRoomName
    ) VALUES (1, NULL, NULL, NULL, NULL, 'demo.daily.co', 'hello')
  `)
}
