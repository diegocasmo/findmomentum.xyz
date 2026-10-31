BEGIN;
SET LOCAL lock_timeout = '5s';

-- The default keeps writers deployed before this migration compatible.
ALTER TABLE "tasks"
  ADD COLUMN "color" TEXT NOT NULL DEFAULT '#3b82f6',
  ADD CONSTRAINT "tasks_color_hex_check" CHECK ("color" ~ '^#[0-9a-f]{6}$');

-- Freeze the legacy palette here so later palette changes cannot alter history.
WITH ranked AS (
  SELECT "id",
    row_number() OVER (PARTITION BY "activity_id" ORDER BY "position") - 1 AS ordinal,
    count(*) OVER (PARTITION BY "activity_id") AS task_count
  FROM "tasks"
  WHERE "deleted_at" IS NULL
), colors AS (
  SELECT "id", CASE
    WHEN task_count > 1 AND ordinal = task_count - 1 AND ordinal % 8 = 0
      THEN '#d97706'
    ELSE (ARRAY[
      '#3b82f6', '#d97706', '#8b5cf6', '#059669',
      '#f43f5e', '#0891b2', '#ea580c', '#65a30d'
    ])[1 + (ordinal % 8)::integer]
  END AS color
  FROM ranked
)
UPDATE "tasks" AS task SET "color" = colors.color
FROM colors WHERE task."id" = colors."id" AND task."color" <> colors.color;

COMMIT;
