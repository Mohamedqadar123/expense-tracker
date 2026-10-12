-- CreateTable
CREATE TABLE "TrialClaim" (
    "id" SERIAL NOT NULL,
    "emailHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrialClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrialClaim_emailHash_key" ON "TrialClaim"("emailHash");

-- Every account that already exists has had its free trial. Fingerprint
-- their emails exactly as canonicalEmail() + trialFingerprint() in
-- src/utils/trialClaims.js do: trim and lowercase, drop "+anything" before
-- the @, and for gmail.com / googlemail.com drop dots and use gmail.com.
WITH parts AS (
    SELECT
        split_part(split_part(lower(trim("email")), '@', 1), '+', 1) AS local,
        split_part(lower(trim("email")), '@', 2) AS domain,
        "createdAt"
    FROM "User"
),
canonical AS (
    SELECT
        CASE WHEN domain IN ('gmail.com', 'googlemail.com')
            THEN replace(local, '.', '') || '@gmail.com'
            ELSE local || '@' || domain
        END AS email,
        "createdAt"
    FROM parts
)
INSERT INTO "TrialClaim" ("emailHash", "createdAt")
SELECT encode(sha256(convert_to(email, 'UTF8')), 'hex'), min("createdAt")
FROM canonical
GROUP BY email;
