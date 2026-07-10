-- Performance indexes for common admin/referral/analytics access paths.
--
-- Note: on a table that is already large, run these as
--   CREATE INDEX CONCURRENTLY ...
-- manually instead (CONCURRENTLY cannot run inside Prisma's migration
-- transaction) to avoid write locks. For an early-stage dataset the plain
-- statements below are fast and safe.

-- User: referral browses by college; admin lists/segment by role and signup date.
CREATE INDEX "User_college_idx" ON "User"("college");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- Registration: revenue/analytics scans filter on paid status (+ recent window).
CREATE INDEX "Registration_paymentStatus_idx" ON "Registration"("paymentStatus");
CREATE INDEX "Registration_paymentStatus_registeredAt_idx" ON "Registration"("paymentStatus", "registeredAt");
