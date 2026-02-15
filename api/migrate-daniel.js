import { createClient } from "@supabase/supabase-js";

/**
 * One-time migration endpoint to:
 * 1. Create Daniel's Supabase Auth account
 * 2. Create his profile
 * 3. Add wall_id column to submissions
 * 4. Backfill existing submissions
 * 5. Rename daniel_feedback -> owner_feedback
 * 6. Update RLS policies
 *
 * DELETE THIS FILE after running the migration.
 *
 * POST /api/migrate-daniel
 * Body: { email, password, migration_secret }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, migration_secret } = req.body;

  // Simple protection — set MIGRATION_SECRET in Vercel env vars
  if (
    !migration_secret ||
    migration_secret !== process.env.MIGRATION_SECRET
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: "Missing Supabase config" });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const steps = [];

  try {
    // Step 1: Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) throw new Error(`Auth create failed: ${authError.message}`);
    const userId = authData.user.id;
    steps.push(`Created auth user: ${userId}`);

    // Step 2: Create profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: userId,
          slug: "daniel",
          display_name: "Daniel",
          bio: "",
        },
      ]);

    if (profileError)
      throw new Error(`Profile insert failed: ${profileError.message}`);
    steps.push("Created profile: daniel");

    // Step 3: Add wall_id column (if not exists)
    const { error: alterError } = await supabaseAdmin.rpc("exec_sql", {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'submissions' AND column_name = 'wall_id'
          ) THEN
            ALTER TABLE submissions ADD COLUMN wall_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
          END IF;
        END $$;
      `,
    });
    // rpc may not exist — fall back to raw query approach
    if (alterError) {
      steps.push(`Note: wall_id column may need manual SQL: ${alterError.message}`);
    } else {
      steps.push("Added wall_id column");
    }

    // Step 4: Backfill existing submissions
    const { error: backfillError } = await supabaseAdmin
      .from("submissions")
      .update({ wall_id: userId })
      .is("wall_id", null);

    if (backfillError) {
      steps.push(`Backfill note: ${backfillError.message}`);
    } else {
      steps.push("Backfilled existing submissions with wall_id");
    }

    // Steps 5-7 (column rename + NOT NULL + RLS) require raw SQL.
    // These should be run manually in the Supabase SQL editor.
    steps.push(
      "MANUAL STEPS NEEDED — Run these in the Supabase SQL editor:"
    );
    steps.push(
      `1. ALTER TABLE submissions ALTER COLUMN wall_id SET NOT NULL;`
    );
    steps.push(
      `2. CREATE INDEX IF NOT EXISTS idx_submissions_wall_id ON submissions(wall_id);`
    );
    steps.push(
      `3. ALTER TABLE submissions RENAME COLUMN daniel_feedback TO owner_feedback;`
    );
    steps.push(
      `4. DROP POLICY IF EXISTS "Anyone can update submissions" ON submissions;`
    );
    steps.push(
      `5. DROP POLICY IF EXISTS "Anyone can delete submissions" ON submissions;`
    );
    steps.push(
      `6. CREATE POLICY "Wall owner can update" ON submissions FOR UPDATE USING (wall_id = auth.uid());`
    );
    steps.push(
      `7. CREATE POLICY "Wall owner can delete" ON submissions FOR DELETE USING (wall_id = auth.uid());`
    );

    return res.json({
      success: true,
      user_id: userId,
      steps,
    });
  } catch (e) {
    console.error("Migration error:", e);
    return res.status(500).json({
      error: e.message,
      steps,
    });
  }
}
