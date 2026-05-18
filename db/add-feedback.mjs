import mysql from 'mysql2/promise';
const conn = await mysql.createConnection({
  host: 'shortline.proxy.rlwy.net', port: 51051,
  user: 'root', password: 'dEPtmYwAhyXRuRUTtAXCFpMRMRORABMk', database: 'railway'
});
// Create feedback table
await conn.query(`
  CREATE TABLE IF NOT EXISTS feedback (
    id           VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
    merchant_id  VARCHAR(36)  NOT NULL,
    customer_id  VARCHAR(36)  NULL,
    message      TEXT         NOT NULL,
    rating       TINYINT      NULL,
    is_anonymous BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);
console.log('feedback table created');
await conn.end();
