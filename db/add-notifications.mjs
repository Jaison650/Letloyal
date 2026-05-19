import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
});

const conn = await pool.getConnection();

await conn.query(`
  CREATE TABLE IF NOT EXISTS notifications (
    id             VARCHAR(36)               NOT NULL PRIMARY KEY DEFAULT (UUID()),
    recipient_type ENUM('customer','merchant') NOT NULL,
    recipient_id   VARCHAR(36)               NOT NULL,
    type           VARCHAR(50)               NOT NULL,
    title          VARCHAR(255)              NOT NULL,
    body           TEXT                      NOT NULL,
    action_url     VARCHAR(500)              NULL,
    is_read        BOOLEAN                   NOT NULL DEFAULT FALSE,
    merchant_id    VARCHAR(36)               NULL,
    broadcast_id   VARCHAR(36)               NULL,
    created_at     TIMESTAMP                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recipient (recipient_type, recipient_id, is_read)
  )
`);

await conn.query(`
  CREATE TABLE IF NOT EXISTS broadcasts (
    id          VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
    merchant_id VARCHAR(36)  NOT NULL,
    title       VARCHAR(255) NOT NULL,
    message     TEXT         NOT NULL,
    audience    VARCHAR(50)  NOT NULL DEFAULT 'all',
    sent_count  INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_merchant (merchant_id)
  )
`);

conn.release();
await pool.end();
console.log('notifications + broadcasts tables created');
