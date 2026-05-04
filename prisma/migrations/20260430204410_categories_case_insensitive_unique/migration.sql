-- DropIndex
DROP INDEX IF EXISTS "categories_team_id_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "categories_team_id_lower_name_key"
  ON "categories" ("team_id", lower("name"));
