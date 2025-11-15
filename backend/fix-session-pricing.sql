-- Fix session pricing for sessions that used incorrect therapy type default cost
-- This updates sessions to use the therapist's session cost instead

-- Update sessions where the cost doesn't match the therapist's session cost
UPDATE "Session" s
SET cost = u."sessionCost"
FROM "User" u
WHERE s."therapistId" = u.id
  AND u."sessionCost" IS NOT NULL
  AND s.cost != u."sessionCost"
  AND s.status = 'SCHEDULED';

-- Verify the update
SELECT 
  s.id,
  s."scheduledDate",
  s."startTime",
  s."endTime",
  s.cost as "Current Cost",
  u."sessionCost" as "Therapist Cost",
  u."firstName" || ' ' || u."lastName" as "Therapist Name",
  p."firstName" || ' ' || p."lastName" as "Patient Name"
FROM "Session" s
JOIN "User" u ON s."therapistId" = u.id
JOIN "Patient" p ON s."patientId" = p.id
WHERE s.status = 'SCHEDULED'
ORDER BY s."scheduledDate" DESC;
