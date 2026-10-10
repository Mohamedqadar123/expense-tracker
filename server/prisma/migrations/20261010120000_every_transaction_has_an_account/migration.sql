-- Every transaction now belongs to a real account. This brings existing data
-- in line; it changes no table structure.

-- 1. Older transactions could carry a free-text account name with no matching
--    Account row. Turn each such name into a real account.
INSERT INTO "Account" ("name", "startingBalance", "userId")
SELECT DISTINCT ON (t."userId", lower(btrim(t."account"))) btrim(t."account"), 0, t."userId"
FROM "Transaction" t
WHERE t."account" IS NOT NULL AND btrim(t."account") <> ''
  AND NOT EXISTS (
    SELECT 1 FROM "Account" a
    WHERE a."userId" = t."userId" AND lower(a."name") = lower(btrim(t."account"))
  );

INSERT INTO "Account" ("name", "startingBalance", "userId")
SELECT DISTINCT ON (r."userId", lower(btrim(r."account"))) btrim(r."account"), 0, r."userId"
FROM "RecurringTransaction" r
WHERE r."account" IS NOT NULL AND btrim(r."account") <> ''
  AND NOT EXISTS (
    SELECT 1 FROM "Account" a
    WHERE a."userId" = r."userId" AND lower(a."name") = lower(btrim(r."account"))
  );

-- 2. Give a default "Cash" account to every user who has no account at all,
--    or who has transactions that were never assigned to one.
INSERT INTO "Account" ("name", "startingBalance", "userId")
SELECT 'Cash', 0, u."id"
FROM "User" u
WHERE NOT EXISTS (
    SELECT 1 FROM "Account" a WHERE a."userId" = u."id" AND lower(a."name") = 'cash'
  )
  AND (
    NOT EXISTS (SELECT 1 FROM "Account" a WHERE a."userId" = u."id")
    OR EXISTS (
      SELECT 1 FROM "Transaction" t
      WHERE t."userId" = u."id" AND (t."account" IS NULL OR btrim(t."account") = '')
    )
    OR EXISTS (
      SELECT 1 FROM "RecurringTransaction" r
      WHERE r."userId" = u."id" AND (r."account" IS NULL OR btrim(r."account") = '')
    )
  );

-- 3. Move the unassigned transactions into that Cash account.
UPDATE "Transaction" t
SET "account" = a."name"
FROM "Account" a
WHERE a."userId" = t."userId" AND lower(a."name") = 'cash'
  AND (t."account" IS NULL OR btrim(t."account") = '');

UPDATE "RecurringTransaction" r
SET "account" = a."name"
FROM "Account" a
WHERE a."userId" = r."userId" AND lower(a."name") = 'cash'
  AND (r."account" IS NULL OR btrim(r."account") = '');
