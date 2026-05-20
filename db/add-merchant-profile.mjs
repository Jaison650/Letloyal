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

// Add profile columns to merchants table (handle duplicates gracefully)
const alterations = [
  [`logo_url`,      `ALTER TABLE merchants ADD COLUMN logo_url VARCHAR(500) DEFAULT NULL`],
  [`banner_url`,    `ALTER TABLE merchants ADD COLUMN banner_url VARCHAR(500) DEFAULT NULL`],
  [`contact_phone`, `ALTER TABLE merchants ADD COLUMN contact_phone VARCHAR(50) DEFAULT NULL`],
  [`website`,       `ALTER TABLE merchants ADD COLUMN website VARCHAR(300) DEFAULT NULL`],
  [`map_url`,       `ALTER TABLE merchants ADD COLUMN map_url VARCHAR(600) DEFAULT NULL`],
  [`working_hours`, `ALTER TABLE merchants ADD COLUMN working_hours JSON DEFAULT NULL`],
];

for (const [col, sql] of alterations) {
  try {
    await conn.query(sql);
    console.log(`  ✓ Added column: ${col}`);
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log(`  – ${col} already exists, skipping`);
    } else {
      throw e;
    }
  }
}

// Seed default working hours for demo merchants that have none
const defaultHours = JSON.stringify({
  mon: { open: '09:00', close: '18:00' },
  tue: { open: '09:00', close: '18:00' },
  wed: { open: '09:00', close: '18:00' },
  thu: { open: '09:00', close: '18:00' },
  fri: { open: '09:00', close: '20:00' },
  sat: { open: '10:00', close: '17:00' },
  sun: null,
});

await conn.query(
  `UPDATE merchants SET working_hours = ? WHERE working_hours IS NULL`,
  [defaultHours],
);

conn.release();
await pool.end();
console.log('\nMerchant profile columns added and default hours seeded.');
