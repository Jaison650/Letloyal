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

// Create offer_rules table
await conn.query(`
  CREATE TABLE IF NOT EXISTS offer_rules (
    id          VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    campaign_id VARCHAR(36) NOT NULL,
    merchant_id VARCHAR(36) NOT NULL,
    rules       JSON        NOT NULL,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_campaign (campaign_id),
    INDEX idx_merchant (merchant_id)
  )
`);

// Seed default rules for every existing campaign that doesn't have one yet
const [campaigns] = await conn.query(
  `SELECT c.id AS campaign_id, c.merchant_id, c.campaign_type, c.reward_threshold, c.reward_description
     FROM campaigns c
    WHERE NOT EXISTS (SELECT 1 FROM offer_rules r WHERE r.campaign_id COLLATE utf8mb4_unicode_ci = c.id COLLATE utf8mb4_unicode_ci)`
);

const defaultRules = (campaignType, threshold) => ({
  items: [
    campaignType === 'visit_based'
      ? `Earn 1 stamp per qualifying visit. ${threshold} stamps required to unlock reward.`
      : `Points are awarded per €1 spent. ${threshold} points required to unlock reward.`,
    'One loyalty account per customer. Valid phone number required.',
    'Rewards must be redeemed in-store within 90 days of unlocking.',
    'Cannot be combined with other discounts or promotional offers.',
    'Reward has no cash alternative and is non-transferable.',
    'Management reserves the right to modify or withdraw this offer at any time.',
  ],
  expiry_days: 90,
  one_per_visit: true,
  transferable: false,
});

for (const c of campaigns) {
  await conn.query(
    `INSERT INTO offer_rules (campaign_id, merchant_id, rules) VALUES (?, ?, ?)`,
    [c.campaign_id, c.merchant_id, JSON.stringify(defaultRules(c.campaign_type, c.reward_threshold))]
  );
  console.log(`  ✓ Rules seeded for campaign ${c.campaign_id}`);
}

conn.release();
await pool.end();
console.log(`\noffer_rules table created, ${campaigns.length} campaign(s) seeded with default rules.`);
