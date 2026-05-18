import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: 'shortline.proxy.rlwy.net',
  port: 51051,
  user: 'root',
  password: 'dEPtmYwAhyXRuRUTtAXCFpMRMRORABMk',
  database: 'railway',
  multipleStatements: true,
});

const sql = `
SET NAMES utf8mb4;
SET foreign_key_checks = 0;

CREATE TABLE IF NOT EXISTS merchants (
  id            VARCHAR(36)   NOT NULL PRIMARY KEY DEFAULT (UUID()),
  slug          VARCHAR(50)   NOT NULL UNIQUE,
  business_name VARCHAR(100)  NOT NULL,
  category      VARCHAR(50)   NOT NULL,
  tagline       VARCHAR(200),
  address       VARCHAR(300),
  city          VARCHAR(100),
  logo_svg      LONGTEXT,
  brand_color   VARCHAR(7)    NOT NULL DEFAULT '#028090',
  password_hash VARCHAR(255)  NOT NULL,
  plan_tier     VARCHAR(20)   NOT NULL DEFAULT 'professional',
  is_demo       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS campaigns (
  id                  VARCHAR(36)                        NOT NULL PRIMARY KEY DEFAULT (UUID()),
  merchant_id         VARCHAR(36)                        NOT NULL,
  name                VARCHAR(100)                       NOT NULL,
  campaign_type       ENUM('visit_based','spend_based')  NOT NULL,
  status              ENUM('active','paused','ended')    NOT NULL DEFAULT 'active',
  reward_threshold    INT                                NOT NULL,
  reward_description  VARCHAR(200)                       NOT NULL,
  points_per_euro     DECIMAL(10,4),
  is_cyclic           BOOLEAN                            NOT NULL DEFAULT TRUE,
  start_date          DATE                               NOT NULL DEFAULT (CURRENT_DATE),
  end_date            DATE,
  participants_count  INT                                NOT NULL DEFAULT 0,
  redemptions_count   INT                                NOT NULL DEFAULT 0,
  created_at          TIMESTAMP                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customers (
  id             VARCHAR(36)   NOT NULL PRIMARY KEY DEFAULT (UUID()),
  phone_number   VARCHAR(20)   NOT NULL UNIQUE,
  password_hash  VARCHAR(255)  NOT NULL,
  email          VARCHAR(255),
  first_name     VARCHAR(100),
  last_name      VARCHAR(100),
  phone_verified BOOLEAN       NOT NULL DEFAULT TRUE,
  status         VARCHAR(20)   NOT NULL DEFAULT 'active',
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enrollments (
  id                VARCHAR(36)                                              NOT NULL PRIMARY KEY DEFAULT (UUID()),
  customer_id       VARCHAR(36)                                              NOT NULL,
  campaign_id       VARCHAR(36)                                              NOT NULL,
  merchant_id       VARCHAR(36)                                              NOT NULL,
  status            ENUM('active','reward_unlocked','otp_pending','completed') NOT NULL DEFAULT 'active',
  visit_count       INT                                                      NOT NULL DEFAULT 0,
  points_balance    INT                                                      NOT NULL DEFAULT 0,
  carry_over_points INT                                                      NOT NULL DEFAULT 0,
  cycle_number      INT                                                      NOT NULL DEFAULT 1,
  enrolled_at       TIMESTAMP                                                NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_activity_at  TIMESTAMP                                                NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_campaign (customer_id, campaign_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS point_transactions (
  id               VARCHAR(36)                          NOT NULL PRIMARY KEY DEFAULT (UUID()),
  enrollment_id    VARCHAR(36)                          NOT NULL,
  customer_id      VARCHAR(36)                          NOT NULL,
  campaign_id      VARCHAR(36)                          NOT NULL,
  merchant_id      VARCHAR(36)                          NOT NULL,
  transaction_type ENUM('earn','redeem','adjustment')   NOT NULL,
  points           INT                                  NOT NULL,
  amount_euros     DECIMAL(10,2),
  cycle_number     INT                                  NOT NULL DEFAULT 1,
  created_at       TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
  FOREIGN KEY (customer_id)   REFERENCES customers(id),
  FOREIGN KEY (campaign_id)   REFERENCES campaigns(id),
  FOREIGN KEY (merchant_id)   REFERENCES merchants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS redemptions (
  id                VARCHAR(36)                                      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  enrollment_id     VARCHAR(36)                                      NOT NULL,
  customer_id       VARCHAR(36)                                      NOT NULL,
  campaign_id       VARCHAR(36)                                      NOT NULL,
  merchant_id       VARCHAR(36)                                      NOT NULL,
  status            ENUM('pending_otp','validated','expired','voided') NOT NULL DEFAULT 'pending_otp',
  otp_code          VARCHAR(10)                                      NOT NULL,
  otp_expires_at    TIMESTAMP                                        NOT NULL,
  otp_attempt_count INT                                              NOT NULL DEFAULT 0,
  validated_at      TIMESTAMP                                        NULL,
  cycle_number      INT                                              NOT NULL,
  points_redeemed   INT                                              NOT NULL,
  created_at        TIMESTAMP                                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
  FOREIGN KEY (customer_id)   REFERENCES customers(id),
  FOREIGN KEY (campaign_id)   REFERENCES campaigns(id),
  FOREIGN KEY (merchant_id)   REFERENCES merchants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_merchants_slug         ON merchants(slug);
CREATE INDEX idx_campaigns_merchant     ON campaigns(merchant_id);
CREATE INDEX idx_enrollments_customer   ON enrollments(customer_id);
CREATE INDEX idx_enrollments_campaign   ON enrollments(campaign_id);
CREATE INDEX idx_enrollments_merchant   ON enrollments(merchant_id);
CREATE INDEX idx_txn_customer           ON point_transactions(customer_id);
CREATE INDEX idx_txn_campaign           ON point_transactions(campaign_id);
CREATE INDEX idx_txn_created            ON point_transactions(created_at);
CREATE INDEX idx_redemptions_enrollment ON redemptions(enrollment_id);
CREATE INDEX idx_redemptions_status     ON redemptions(status);

DROP TRIGGER IF EXISTS trg_new_enrollment;
DROP TRIGGER IF EXISTS trg_redemption_complete;

SET foreign_key_checks = 1;
`;

try {
  await conn.query(sql);
  console.log('Tables and indexes created.');

  await conn.query(`
    CREATE TRIGGER trg_new_enrollment
    AFTER INSERT ON enrollments
    FOR EACH ROW
    BEGIN
      UPDATE campaigns SET participants_count = participants_count + 1 WHERE id = NEW.campaign_id;
    END
  `);
  console.log('Trigger trg_new_enrollment created.');

  await conn.query(`
    CREATE TRIGGER trg_redemption_complete
    AFTER UPDATE ON redemptions
    FOR EACH ROW
    BEGIN
      IF NEW.status = 'validated' AND OLD.status != 'validated' THEN
        UPDATE campaigns SET redemptions_count = redemptions_count + 1 WHERE id = NEW.campaign_id;
      END IF;
    END
  `);
  console.log('Trigger trg_redemption_complete created.');

  console.log('Schema complete.');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await conn.end();
}
