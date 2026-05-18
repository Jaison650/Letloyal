// db/seed.ts  — run with: npm run seed
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local before anything else (seed runs outside Next.js context)
const envFile = resolve(process.cwd(), '.env.local');
if (existsSync(envFile)) {
  readFileSync(envFile, 'utf-8')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .forEach(l => {
      const eq = l.indexOf('=');
      if (eq === -1) return;
      const key = l.slice(0, eq).trim();
      const val = l.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    });
}

import mysql, { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// ── pool ─────────────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:               process.env.DB_HOST     ?? 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     ?? 'letloyal',
  password:           process.env.DB_PASSWORD ?? '',
  database:           process.env.DB_NAME     ?? 'letloyal',
  waitForConnections: true,
  connectionLimit:    5,
  multipleStatements: false,
});

// ── data ─────────────────────────────────────────────────────────────────────
const MERCHANT_PASS = 'demo1234';
const CUSTOMER_PASS = 'demo0000';

const FIRST_NAMES = [
  'Māris', 'Anna',   'Jānis',  'Ieva',   'Andris', 'Kristīne', 'Tālis', 'Laima',
  'Edgars','Baiba',  'Raivis', 'Santa',  'Oskars', 'Liga',     'Artūrs','Inese',
  'Kārlis','Zane',   'Emīls',  'Dace',
];
const LAST_NAMES = [
  'Kalnins','Ozola',    'Berzins', 'Liepa',    'Viksna',   'Freiberga','Grava',   'Jakobsone',
  'Plavins','Roze',     'Silis',   'Abola',    'Mednis',   'Vitola',   'Krumins', 'Kirsis',
  'Ozolins','Balode',   'Zeltins', 'Straume',
];

type CampaignType = 'visit_based' | 'spend_based';
type City         = 'Riga' | 'Tallinn' | 'Vilnius';

interface MerchantDef {
  slug: string;
  business_name: string;
  category: string;
  tagline: string;
  address: string;
  city: City;
  brand_color: string;
  logo_svg: string;
  campaign_name: string;
  campaign_type: CampaignType;
  reward_threshold: number;
  reward_description: string;
  points_per_euro?: number;
}

const MERCHANTS: MerchantDef[] = [
  {
    slug: 'brewhouse-cafe', business_name: 'BrewHouse Café',
    category: 'café', tagline: 'Specialty coffee, brewed with soul',
    address: 'Elizabetes iela 12', city: 'Riga', brand_color: '#6B3F2A',
    logo_svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" rx="20" fill="#6B3F2A"/><path d="M18 55 Q18 62 27 62 L48 62 Q57 62 57 55 L57 30 L18 30 Z" fill="white" opacity="0.9"/><path d="M57 37 Q70 37 70 45 Q70 52 57 52" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/><path d="M29 30 Q29 22 36 22 Q36 15 43 22" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"/><path d="M38 30 Q38 24 42 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>`,
    campaign_name: 'BrewHouse Rewards', campaign_type: 'visit_based',
    reward_threshold: 10, reward_description: 'Free Signature Flat White',
  },
  {
    slug: 'bella-beauty', business_name: 'Bella Beauty Salon',
    category: 'salon', tagline: 'Where beauty meets expertise',
    address: 'Brīvības iela 45', city: 'Riga', brand_color: '#7B2D8B',
    logo_svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" rx="20" fill="#7B2D8B"/><line x1="22" y1="20" x2="58" y2="60" stroke="white" stroke-width="3" stroke-linecap="round"/><line x1="58" y1="20" x2="22" y2="60" stroke="white" stroke-width="3" stroke-linecap="round"/><circle cx="40" cy="40" r="6" fill="white" opacity="0.3"/><circle cx="22" cy="20" r="5" fill="white"/><circle cx="58" cy="20" r="5" fill="white"/><circle cx="58" cy="60" r="5" fill="white"/><circle cx="22" cy="60" r="5" fill="white"/><circle cx="65" cy="25" r="3" fill="#F3E5F5" opacity="0.9"/></svg>`,
    campaign_name: 'Bella Loyalty', campaign_type: 'visit_based',
    reward_threshold: 8, reward_description: 'Free Express Treatment (worth €25)',
  },
  {
    slug: 'the-fit-club', business_name: 'The Fit Club',
    category: 'gym', tagline: 'Train harder. Recover smarter.',
    address: 'Pärnu mnt 10', city: 'Tallinn', brand_color: '#1A6B2F',
    logo_svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" rx="20" fill="#1A6B2F"/><rect x="8" y="36" width="12" height="8" rx="4" fill="white"/><rect x="60" y="36" width="12" height="8" rx="4" fill="white"/><rect x="18" y="30" width="8" height="20" rx="4" fill="white"/><rect x="54" y="30" width="8" height="20" rx="4" fill="white"/><rect x="25" y="38" width="30" height="4" rx="2" fill="white"/></svg>`,
    campaign_name: 'Fit Club Pass', campaign_type: 'visit_based',
    reward_threshold: 12, reward_description: '1 Free Personal Training Session',
  },
  {
    slug: 'metro-deli', business_name: 'Metro Deli',
    category: 'deli', tagline: 'Fresh. Fast. Legendary sandwiches.',
    address: 'Gedimino pr. 22', city: 'Vilnius', brand_color: '#D4820A',
    logo_svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" rx="20" fill="#D4820A"/><rect x="15" y="28" width="50" height="8" rx="4" fill="white"/><rect x="18" y="38" width="44" height="7" rx="3.5" fill="white" opacity="0.85"/><rect x="15" y="47" width="50" height="8" rx="4" fill="white"/><ellipse cx="40" cy="58" rx="20" ry="4" fill="white" opacity="0.4"/></svg>`,
    campaign_name: 'Metro Points', campaign_type: 'spend_based',
    reward_threshold: 100, reward_description: '€10 off your next order', points_per_euro: 1,
  },
  {
    slug: 'luxe-boutique', business_name: 'Luxe Boutique',
    category: 'boutique', tagline: 'Curated fashion. Timeless style.',
    address: 'Alberta iela 5', city: 'Riga', brand_color: '#C0392B',
    logo_svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" rx="20" fill="#C0392B"/><path d="M25 35 L55 35 L60 65 L20 65 Z" fill="white" opacity="0.9"/><path d="M30 35 Q30 20 40 20 Q50 20 50 35" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/><rect x="36" y="42" width="8" height="12" rx="2" fill="#C0392B" opacity="0.6"/></svg>`,
    campaign_name: 'Luxe Rewards', campaign_type: 'spend_based',
    reward_threshold: 200, reward_description: '€20 Gift Voucher', points_per_euro: 1,
  },
  {
    slug: 'casa-pizzeria', business_name: 'Casa Pizzeria',
    category: 'restaurant', tagline: 'Authentic Neapolitan pizza since 2019',
    address: 'Viru väljak 4', city: 'Tallinn', brand_color: '#E65C00',
    logo_svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" rx="20" fill="#E65C00"/><path d="M40 15 L65 62 L15 62 Z" fill="white" opacity="0.9"/><circle cx="40" cy="42" r="5" fill="#E65C00" opacity="0.7"/><circle cx="30" cy="50" r="4" fill="#E65C00" opacity="0.6"/><circle cx="50" cy="50" r="4" fill="#E65C00" opacity="0.6"/><circle cx="40" cy="55" r="3" fill="#E65C00" opacity="0.5"/></svg>`,
    campaign_name: 'Casa Points', campaign_type: 'spend_based',
    reward_threshold: 80, reward_description: 'Free Margherita Pizza (any size)', points_per_euro: 1,
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────
function makePhone(merchantIdx: number, customerIdx: number, city: City): string {
  // Unique 5-digit suffix per slot (max 120 customers = 6×20)
  const n = String(merchantIdx * 20 + customerIdx).padStart(5, '0');
  if (city === 'Tallinn') return `+37250${n}`;
  if (city === 'Vilnius') return `+37060${n}`;
  return `+37120${n}`;          // Riga
}

// Resolve a single-row SELECT back to an id string
async function fetchId(
  conn: mysql.PoolConnection,
  sql: string,
  params: (string | number | null)[]
): Promise<string> {
  const [rows] = await conn.execute<RowDataPacket[]>(sql, params);
  if (!rows[0]) throw new Error(`fetchId: no row for SQL: ${sql}`);
  return rows[0].id as string;
}

// ── seed ──────────────────────────────────────────────────────────────────────
async function seed(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    console.log('🌱  Seeding LetLoyal demo data…\n');
    await conn.beginTransaction();

    // ── purge ─────────────────────────────────────────────────────────────
    console.log('  Purging existing demo data…');
    for (const sql of [
      `DELETE r FROM redemptions r
         JOIN merchants m ON r.merchant_id = m.id WHERE m.is_demo = 1`,
      `DELETE pt FROM point_transactions pt
         JOIN merchants m ON pt.merchant_id = m.id WHERE m.is_demo = 1`,
      `DELETE e FROM enrollments e
         JOIN merchants m ON e.merchant_id = m.id WHERE m.is_demo = 1`,
      `DELETE c FROM campaigns c
         JOIN merchants m ON c.merchant_id = m.id WHERE m.is_demo = 1`,
      `DELETE FROM customers
         WHERE phone_number LIKE '+37120%'
            OR phone_number LIKE '+37250%'
            OR phone_number LIKE '+37060%'`,
      `DELETE FROM merchants WHERE is_demo = 1`,
    ]) {
      await conn.execute(sql);
    }

    // ── shared hashes (expensive — do once) ───────────────────────────────
    console.log('  Hashing passwords…');
    const merchantHash = await bcrypt.hash(MERCHANT_PASS, 12);
    const customerHash = await bcrypt.hash(CUSTOMER_PASS, 10);

    // ── merchants ─────────────────────────────────────────────────────────
    for (let mi = 0; mi < MERCHANTS.length; mi++) {
      const m = MERCHANTS[mi];
      process.stdout.write(`  → ${m.business_name.padEnd(22)}`);

      // merchant row
      await conn.execute(
        `INSERT INTO merchants
           (id, slug, business_name, category, tagline, address, city,
            logo_svg, brand_color, password_hash, plan_tier, is_demo)
         VALUES (UUID(),?,?,?,?,?,?,?,?,?,'professional',1)`,
        [m.slug, m.business_name, m.category, m.tagline,
          m.address, m.city, m.logo_svg, m.brand_color, merchantHash],
      );
      const merchantId = await fetchId(conn,
        'SELECT id FROM merchants WHERE slug = ?', [m.slug]);

      // campaign row (started 60 days ago)
      await conn.execute(
        `INSERT INTO campaigns
           (id, merchant_id, name, campaign_type, status,
            reward_threshold, reward_description, points_per_euro,
            is_cyclic, start_date, participants_count, redemptions_count)
         VALUES (UUID(),?,?,?,'active',?,?,?,1,
                 DATE_SUB(CURDATE(), INTERVAL 60 DAY),0,0)`,
        [merchantId, m.campaign_name, m.campaign_type,
          m.reward_threshold, m.reward_description, m.points_per_euro ?? null],
      );
      const campaignId = await fetchId(conn,
        'SELECT id FROM campaigns WHERE merchant_id = ?', [merchantId]);

      const T = m.reward_threshold;

      for (let ci = 0; ci < 20; ci++) {
        const phone = makePhone(mi, ci, m.city);

        // customer
        await conn.execute(
          `INSERT INTO customers
             (id, phone_number, password_hash, first_name, last_name,
              phone_verified, status)
           VALUES (UUID(),?,?,?,?,1,'active')`,
          [phone, customerHash, FIRST_NAMES[ci], LAST_NAMES[ci]],
        );
        const customerId = await fetchId(conn,
          'SELECT id FROM customers WHERE phone_number = ?', [phone]);

        // ── progress profile ────────────────────────────────────────────
        // ci 0–1 : completed cycle 1, now in cycle 2 (active)  → 2 validated redemptions
        // ci 2–4 : reward_unlocked (cycle 1)                    → 3 reward_unlocked
        // ci 5–9 : near-threshold (cycle 1)
        // ci 10–19: early progress (cycle 1)
        let visitCount:    number;
        let pointsBalance: number;
        let enrollStatus:  'active' | 'reward_unlocked';
        let cycleNumber:   number;

        if (m.campaign_type === 'visit_based') {
          if (ci < 2) {
            visitCount = 3 + ci * 2;  pointsBalance = visitCount;
            enrollStatus = 'active';   cycleNumber = 2;
          } else if (ci < 5) {
            visitCount = T;            pointsBalance = T;
            enrollStatus = 'reward_unlocked'; cycleNumber = 1;
          } else if (ci < 9) {
            visitCount = Math.max(1, T - 1 - (ci - 5));
            pointsBalance = visitCount;
            enrollStatus = 'active';   cycleNumber = 1;
          } else {
            visitCount = 1 + ((ci - 9) % Math.max(1, T - 4));
            pointsBalance = visitCount;
            enrollStatus = 'active';   cycleNumber = 1;
          }
        } else {
          // spend_based
          if (ci < 2) {
            pointsBalance = 15 + ci * 12;  visitCount = 0;
            enrollStatus = 'active';        cycleNumber = 2;
          } else if (ci < 5) {
            pointsBalance = T;              visitCount = 0;
            enrollStatus = 'reward_unlocked'; cycleNumber = 1;
          } else if (ci < 9) {
            pointsBalance = Math.max(1, T - 5 - (ci - 5) * 8);
            visitCount = 0; enrollStatus = 'active'; cycleNumber = 1;
          } else {
            pointsBalance = Math.max(5, 5 + ((ci - 9) * 7) % Math.max(1, T - 30));
            visitCount = 0; enrollStatus = 'active'; cycleNumber = 1;
          }
        }

        // enrollment
        await conn.execute(
          `INSERT INTO enrollments
             (id, customer_id, campaign_id, merchant_id, status,
              visit_count, points_balance, carry_over_points, cycle_number,
              enrolled_at, last_activity_at)
           VALUES (UUID(),?,?,?,?,?,?,0,?,
                   DATE_SUB(NOW(), INTERVAL ? DAY),
                   DATE_SUB(NOW(), INTERVAL FLOOR(1+RAND()*10) DAY))`,
          [customerId, campaignId, merchantId, enrollStatus,
            visitCount, pointsBalance, cycleNumber,
            50 + ci],          // enrolled spread: 50→69 days ago
        );
        const enrollmentId = await fetchId(conn,
          'SELECT id FROM enrollments WHERE customer_id=? AND campaign_id=?',
          [customerId, campaignId]);

        // ── earn transactions ───────────────────────────────────────────
        if (m.campaign_type === 'visit_based') {
          // One earn record per visit, spread randomly over 60 days
          for (let t = 0; t < visitCount; t++) {
            await conn.execute(
              `INSERT INTO point_transactions
                 (id, enrollment_id, customer_id, campaign_id, merchant_id,
                  transaction_type, points, cycle_number, created_at)
               VALUES (UUID(),?,?,?,?,'earn',1,?,
                       DATE_SUB(NOW(), INTERVAL FLOOR(RAND()*60) DAY))`,
              [enrollmentId, customerId, campaignId, merchantId, cycleNumber],
            );
          }
        } else {
          // Spend transactions (5–25 pts each) summing to pointsBalance
          let remaining = pointsBalance;
          while (remaining > 0) {
            const pts = Math.min(remaining, 5 + Math.floor(Math.random() * 21));
            await conn.execute(
              `INSERT INTO point_transactions
                 (id, enrollment_id, customer_id, campaign_id, merchant_id,
                  transaction_type, points, amount_euros, cycle_number, created_at)
               VALUES (UUID(),?,?,?,?,'earn',?,?,?,
                       DATE_SUB(NOW(), INTERVAL FLOOR(RAND()*60) DAY))`,
              [enrollmentId, customerId, campaignId, merchantId,
                pts, pts, cycleNumber],
            );
            remaining -= pts;
          }
        }

        // ── validated redemption for ci 0 & 1 (their completed cycle 1) ─
        if (ci < 2) {
          await conn.execute(
            `INSERT INTO redemptions
               (id, enrollment_id, customer_id, campaign_id, merchant_id,
                status, otp_code, otp_expires_at, validated_at,
                cycle_number, points_redeemed)
             VALUES (UUID(),?,?,?,?,
                     'validated','000000',
                     DATE_SUB(NOW(), INTERVAL 22 DAY),
                     DATE_SUB(NOW(), INTERVAL 22 DAY),
                     1,?)`,
            [enrollmentId, customerId, campaignId, merchantId, T],
          );
        }
      } // customers

      // Sync denormalised counters (triggers fired correctly, but recalc is cheap insurance)
      await conn.execute(
        `UPDATE campaigns
           SET participants_count = (SELECT COUNT(*) FROM enrollments   WHERE campaign_id = ?),
               redemptions_count  = (SELECT COUNT(*) FROM redemptions   WHERE campaign_id = ? AND status = 'validated')
         WHERE id = ?`,
        [campaignId, campaignId, campaignId],
      );

      console.log('✓');
    } // merchants

    await conn.commit();

    console.log('\n✅  Seed complete!\n');
    console.log('Demo merchant logins (password: demo1234)');
    MERCHANTS.forEach(m => console.log(`  ${m.slug}`));
    console.log('\nCustomer login password: demo0000');
    console.log('Sample customer phone:   +37120000000\n');

  } catch (err) {
    await conn.rollback();
    console.error('\n❌  Seed failed:', err);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
