-- ─────────────────────────────────────────────────────────────────────────────
-- Fix events whose `isPaid` flag drifted out of sync with their payment config.
--
-- Background: registration used to gate the whole payment UI (QR code, UPI ID,
-- proof upload) and the pay-vs-free decision on the `isPaid` boolean alone. Some
-- events ended up with `isPaid = false` while `paymentType <> 'FREE'` and a real
-- price set — so their QR never showed and people registered for free.
--
-- The app now derives paid-status from the payment method + price. This script
-- brings the stored `isPaid` column in line so organizer analytics / admin views
-- agree with what registrants actually see.
--
-- An event is genuinely paid when it uses a non-FREE payment method AND has a
-- positive price: ticketPrice > 0, or (for IEEE events) a member/non-member price.
--
-- Safe to run multiple times (idempotent): only rows that are actually wrong change.
-- Run the SELECT first to preview; then run the UPDATE.
-- ─────────────────────────────────────────────────────────────────────────────

-- Reusable "is this event actually paid?" expression, kept identical in both
-- statements below:
--     "paymentType" <> 'FREE'
--     AND ( COALESCE("ticketPrice", 0) > 0
--           OR ( "isIeeeEvent"
--                AND ( COALESCE("ieeeMemberPrice", 0) > 0
--                      OR COALESCE("nonIeeeMemberPrice", 0) > 0 ) ) )

-- 1) PREVIEW — rows that will be corrected:
SELECT id,
       title,
       "isPaid"                                    AS current_is_paid,
       (
           "paymentType" <> 'FREE'
           AND (
               COALESCE("ticketPrice", 0) > 0
               OR ("isIeeeEvent"
                   AND (COALESCE("ieeeMemberPrice", 0) > 0
                        OR COALESCE("nonIeeeMemberPrice", 0) > 0))
           )
       )                                           AS corrected_is_paid,
       "paymentType",
       "ticketPrice",
       "isIeeeEvent",
       "ieeeMemberPrice",
       "nonIeeeMemberPrice"
FROM "Event"
WHERE "deletedAt" IS NULL
  AND "isPaid" IS DISTINCT FROM (
        "paymentType" <> 'FREE'
        AND (
            COALESCE("ticketPrice", 0) > 0
            OR ("isIeeeEvent"
                AND (COALESCE("ieeeMemberPrice", 0) > 0
                     OR COALESCE("nonIeeeMemberPrice", 0) > 0))
        )
      );

-- 2) APPLY — set isPaid to the derived value where it disagrees:
UPDATE "Event"
SET "isPaid" = (
        "paymentType" <> 'FREE'
        AND (
            COALESCE("ticketPrice", 0) > 0
            OR ("isIeeeEvent"
                AND (COALESCE("ieeeMemberPrice", 0) > 0
                     OR COALESCE("nonIeeeMemberPrice", 0) > 0))
        )
    )
WHERE "deletedAt" IS NULL
  AND "isPaid" IS DISTINCT FROM (
        "paymentType" <> 'FREE'
        AND (
            COALESCE("ticketPrice", 0) > 0
            OR ("isIeeeEvent"
                AND (COALESCE("ieeeMemberPrice", 0) > 0
                     OR COALESCE("nonIeeeMemberPrice", 0) > 0))
        )
      );
