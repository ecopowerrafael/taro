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
      status ENUM('Online', 'Offline', 'Ocupado', 'Pendente') NOT NULL DEFAULT 'Pendente',
      photo LONGTEXT NULL,
      pricePerMinute DECIMAL(10,2) NOT NULL DEFAULT 0,
      priceThreeQuestions DECIMAL(10,2) NOT NULL DEFAULT 0,
      priceFiveQuestions DECIMAL(10,2) NOT NULL DEFAULT 0,
      baseConsultations INT NOT NULL DEFAULT 0,
      realSessions INT NOT NULL DEFAULT 0,
      ratingAverage DECIMAL(3,2) NOT NULL DEFAULT 0,
      isPremium TINYINT(1) NOT NULL DEFAULT 0,
      commissionOverride DECIMAL(5,2) NULL,
      createdAt DATE NULL,
      userId VARCHAR(50) NULL,
      CONSTRAINT fk_consultant_user
        FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE SET NULL
    )
  `)

  // Garantir que status Pendente seja aceito em bancos já criados
  try {
    await pool.query("ALTER TABLE consultants MODIFY COLUMN status ENUM('Online', 'Offline', 'Ocupado', 'Pendente') NOT NULL DEFAULT 'Pendente'")
  } catch (e) {}

  // Garantir que a coluna userId existe em consultants (para bancos já criados)
  try {
    await pool.query('ALTER TABLE consultants ADD COLUMN userId VARCHAR(50) NULL')
    await pool.query('ALTER TABLE consultants ADD CONSTRAINT fk_consultant_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL')
  } catch (e) {
    // Ignora se a coluna já existir
  }

  try {
    await pool.query('ALTER TABLE consultants ADD COLUMN isPremium TINYINT(1) NOT NULL DEFAULT 0')
  } catch (e) {}

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
      pixBeneficiaryName VARCHAR(160) NULL,
      CONSTRAINT fk_wallet_consultant
        FOREIGN KEY (consultantId) REFERENCES consultants(id)
        ON DELETE CASCADE
    )
  `)

  try {
    await pool.query('ALTER TABLE consultant_wallets ADD COLUMN pixBeneficiaryName VARCHAR(160) NULL')
  } catch (e) {}

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
      pixKey VARCHAR(255) NULL,
      pixBeneficiaryName VARCHAR(160) NULL,
      INDEX idx_wallet_wd_consultant_date (consultantId, createdAt),
      CONSTRAINT fk_wallet_wd_consultant
        FOREIGN KEY (consultantId) REFERENCES consultants(id)
        ON DELETE CASCADE
    )
  `)

  try {
    await pool.query('ALTER TABLE wallet_withdrawals ADD COLUMN pixKey VARCHAR(255) NULL')
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE wallet_withdrawals ADD COLUMN pixBeneficiaryName VARCHAR(160) NULL')
  } catch (e) {}

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
      pixReceiverCity VARCHAR(120) NULL,
      stripePublicKey VARCHAR(255) NULL,
      stripeSecretKey VARCHAR(255) NULL,
      globalCommission DECIMAL(5,2) NOT NULL DEFAULT 30,
      smtpHost VARCHAR(255) NULL,
      smtpPort INT NULL,
      smtpUser VARCHAR(255) NULL,
      smtpPass VARCHAR(255) NULL,
      smtpFrom VARCHAR(255) NULL
    )
  `)

  // Garantir colunas de SMTP para bancos antigos
  try { await pool.query('ALTER TABLE platform_credentials ADD COLUMN smtpHost VARCHAR(255) NULL') } catch (e) {}
  try { await pool.query('ALTER TABLE platform_credentials ADD COLUMN smtpPort INT NULL') } catch (e) {}
  try { await pool.query('ALTER TABLE platform_credentials ADD COLUMN smtpUser VARCHAR(255) NULL') } catch (e) {}
  try { await pool.query('ALTER TABLE platform_credentials ADD COLUMN smtpPass VARCHAR(255) NULL') } catch (e) {}
  try { await pool.query('ALTER TABLE platform_credentials ADD COLUMN smtpFrom VARCHAR(255) NULL') } catch (e) {}

  await pool.query(`
    CREATE TABLE IF NOT EXISTS video_sessions (
      id VARCHAR(50) PRIMARY KEY,
      userId VARCHAR(50) NOT NULL,
      consultantId VARCHAR(50) NOT NULL,
      status ENUM('waiting', 'active', 'finished', 'cancelled') NOT NULL DEFAULT 'waiting',
      roomUrl VARCHAR(255) NULL,
      createdAt DATETIME NOT NULL,
      startedAt DATETIME NULL,
      finishedAt DATETIME NULL,
      durationSeconds INT NOT NULL DEFAULT 0,
      consultantEarnings DECIMAL(10,2) NOT NULL DEFAULT 0,
      consultantNotes TEXT NULL,
      CONSTRAINT fk_vs_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_vs_consultant FOREIGN KEY (consultantId) REFERENCES consultants(id) ON DELETE CASCADE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      userId VARCHAR(50) NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh VARCHAR(255) NOT NULL,
      auth VARCHAR(255) NOT NULL,
      userAgent VARCHAR(255) NULL,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      failureCount INT NOT NULL DEFAULT 0,
      lastSuccessAt DATETIME NULL,
      lastFailureAt DATETIME NULL,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL,
      UNIQUE KEY uniq_push_subscription_endpoint (endpoint(255)),
      INDEX idx_push_subscriptions_user_active (userId, isActive),
      CONSTRAINT fk_push_subscription_user
        FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE
    )
  `)

  // Adicionar colunas de duração e earnings se não existirem (para bancos antigos)
  try {
    await pool.query('ALTER TABLE video_sessions ADD COLUMN durationSeconds INT NOT NULL DEFAULT 0')
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE video_sessions ADD COLUMN consultantEarnings DECIMAL(10,2) NOT NULL DEFAULT 0')
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE video_sessions ADD COLUMN consultantNotes TEXT NULL')
  } catch (e) {}

  // Garantir colunas de PIX para bancos antigos
  try {
    await pool.query('ALTER TABLE platform_credentials ADD COLUMN pixKey VARCHAR(255) NULL')
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE platform_credentials ADD COLUMN pixReceiverName VARCHAR(120) NULL')
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE platform_credentials ADD COLUMN pixReceiverCity VARCHAR(120) NULL')
  } catch (e) {}

  // Garantir colunas de Stripe para bancos antigos
  try {
    await pool.query('ALTER TABLE platform_credentials ADD COLUMN stripePublicKey VARCHAR(255) NULL')
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE platform_credentials ADD COLUMN stripeSecretKey VARCHAR(255) NULL')
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE platform_credentials ADD COLUMN globalCommission DECIMAL(5,2) NOT NULL DEFAULT 30')
  } catch (e) {}

  await pool.query(`
    CREATE TABLE IF NOT EXISTS recharge_requests (
      id VARCHAR(50) PRIMARY KEY,
      userId VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      minutes INT NOT NULL,
      method ENUM('pix', 'card') NOT NULL,
      status ENUM('pending', 'processing', 'approved', 'completed', 'rejected') NOT NULL DEFAULT 'pending',
      stripePaymentIntentId VARCHAR(80) NULL,
      stripeChargeId VARCHAR(80) NULL,
      stripeBalanceTransactionId VARCHAR(80) NULL,
      stripeFeeAmount DECIMAL(10,2) NULL,
      stripeNetAmount DECIMAL(10,2) NULL,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NULL,
      CONSTRAINT fk_recharge_user
        FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE
    )
  `)

  try {
    await pool.query("ALTER TABLE recharge_requests MODIFY COLUMN status ENUM('pending', 'processing', 'approved', 'completed', 'rejected') NOT NULL DEFAULT 'pending'")
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE recharge_requests ADD COLUMN stripePaymentIntentId VARCHAR(80) NULL')
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE recharge_requests ADD COLUMN stripeChargeId VARCHAR(80) NULL')
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE recharge_requests ADD COLUMN stripeBalanceTransactionId VARCHAR(80) NULL')
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE recharge_requests ADD COLUMN stripeFeeAmount DECIMAL(10,2) NULL')
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE recharge_requests ADD COLUMN stripeNetAmount DECIMAL(10,2) NULL')
  } catch (e) {}

  await pool.query(`
    CREATE TABLE IF NOT EXISTS recharge_packages (
      id VARCHAR(20) PRIMARY KEY,
      minutes INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      promoPrice DECIMAL(10,2) NULL,
      isFeatured TINYINT(1) NOT NULL DEFAULT 0,
      sortOrder INT NOT NULL DEFAULT 0,
      updatedAt DATETIME NULL
    )
  `)

  await pool.query(`
    INSERT IGNORE INTO recharge_packages (id, minutes, price, promoPrice, isFeatured, sortOrder, updatedAt)
    VALUES
      ('p1', 10, 50, NULL, 0, 1, NOW()),
      ('p2', 30, 135, 119, 1, 2, NOW()),
      ('p3', 60, 240, NULL, 0, 3, NOW())
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
      dailyRoomName,
      globalCommission
    ) VALUES (1, NULL, NULL, NULL, NULL, 'demo.daily.co', 'hello', 30)
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS spells (
      id VARCHAR(80) PRIMARY KEY,
      title VARCHAR(180) NOT NULL,
      shortDescription VARCHAR(280) NULL,
      description TEXT NOT NULL,
      imageUrl LONGTEXT NULL,
      consultantId VARCHAR(50) NOT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      sortOrder INT NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL,
      INDEX idx_spells_active_order (isActive, sortOrder),
      CONSTRAINT fk_spells_consultant
        FOREIGN KEY (consultantId) REFERENCES consultants(id)
        ON DELETE RESTRICT
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS spell_orders (
      id VARCHAR(90) PRIMARY KEY,
      userId VARCHAR(50) NOT NULL,
      spellId VARCHAR(80) NULL,
      consultantId VARCHAR(50) NOT NULL,
      spellTitle VARCHAR(180) NOT NULL,
      consultantName VARCHAR(120) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      method ENUM('pix', 'card') NOT NULL,
      status ENUM('pending', 'processing', 'approved', 'completed', 'rejected') NOT NULL DEFAULT 'pending',
      commissionRate DECIMAL(5,2) NOT NULL DEFAULT 30,
      commissionValue DECIMAL(10,2) NOT NULL DEFAULT 0,
      consultantNetValue DECIMAL(10,2) NOT NULL DEFAULT 0,
      stripePaymentIntentId VARCHAR(80) NULL,
      stripeChargeId VARCHAR(80) NULL,
      stripeBalanceTransactionId VARCHAR(80) NULL,
      stripeFeeAmount DECIMAL(10,2) NULL,
      stripeNetAmount DECIMAL(10,2) NULL,
      paidAt DATETIME NULL,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL,
      INDEX idx_spell_orders_status (status, method, createdAt),
      INDEX idx_spell_orders_user (userId, createdAt),
      CONSTRAINT fk_spell_orders_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_spell_orders_spell FOREIGN KEY (spellId) REFERENCES spells(id) ON DELETE SET NULL,
      CONSTRAINT fk_spell_orders_consultant FOREIGN KEY (consultantId) REFERENCES consultants(id) ON DELETE RESTRICT
    )
  `)

  // Tabela de avaliações dos consultores
  await pool.query(`
    CREATE TABLE IF NOT EXISTS consultant_reviews (
      id VARCHAR(80) PRIMARY KEY,
      consultantId VARCHAR(50) NOT NULL,
      userId VARCHAR(50) NULL,
      displayName VARCHAR(120) NULL,
      sessionType ENUM('video', 'question') NOT NULL,
      referenceId VARCHAR(80) NOT NULL,
      rating TINYINT NOT NULL,
      comment TEXT NULL,
      createdAt DATETIME NOT NULL,
      INDEX idx_review_consultant (consultantId),
      CONSTRAINT fk_review_consultant FOREIGN KEY (consultantId) REFERENCES consultants(id) ON DELETE CASCADE
    )
  `)
  // Tolerante para bancos existentes com FK no userId
  try {
    await pool.query('ALTER TABLE consultant_reviews MODIFY COLUMN userId VARCHAR(50) NULL')
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE consultant_reviews ADD COLUMN displayName VARCHAR(120) NULL')
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE consultant_reviews ADD UNIQUE KEY uk_review_reference (referenceId, userId)')
  } catch (e) {}

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
