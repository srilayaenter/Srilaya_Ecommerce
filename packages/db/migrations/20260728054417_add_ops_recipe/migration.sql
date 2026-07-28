-- CreateTable
CREATE TABLE "OpsRecipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "baseRatios" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpsRecipe_category_idx" ON "OpsRecipe"("category");

-- Row Level Security: the standalone SriLaYa Ops app (web + Android) has no
-- login of its own and talks to this table directly from the client using
-- the public Supabase anon key. That means these policies are the ONLY
-- access control on this table — there is no server-side check behind them.
-- The app's own PIN gate is a client-side speed bump, not real auth, so in
-- practice anyone who extracts the anon key (trivial — it ships in the
-- client bundle) can read and write this table directly via the Supabase
-- REST API. Acceptable for now given the data is low-stakes internal recipe
-- info, not customer/financial data — but tighten this (e.g. route writes
-- through an authenticated API instead of direct anon access) if that
-- changes.
ALTER TABLE "OpsRecipe" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_recipe_anon_select" ON "OpsRecipe"
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "ops_recipe_anon_insert" ON "OpsRecipe"
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "ops_recipe_anon_update" ON "OpsRecipe"
    FOR UPDATE TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "ops_recipe_anon_delete" ON "OpsRecipe"
    FOR DELETE TO anon
    USING (true);
