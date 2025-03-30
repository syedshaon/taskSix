import pool from "./db.js";

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("Initializing database...");

    // Create the presentations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS presentations (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Created 'presentations' table.");

    // Create the slides table
    await client.query(`
      CREATE TABLE IF NOT EXISTS slides (
        id SERIAL PRIMARY KEY,
        presentation_id INT REFERENCES presentations(id) ON DELETE CASCADE,
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Created 'slides' table.");

    // Create the users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nickname VARCHAR(255) NOT NULL,
        presentation_id INT REFERENCES presentations(id) ON DELETE CASCADE,
        role TEXT CHECK (role IN ('viewer', 'editor', 'creator')) DEFAULT 'viewer',
        connected BOOLEAN DEFAULT true,
        joined_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Created 'users' table.");

    // Create the slide_elements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS slide_elements (
        id SERIAL PRIMARY KEY,
        slide_id INT NOT NULL REFERENCES slides(id) ON DELETE CASCADE,
        type TEXT CHECK (type IN ('text', 'image', 'shape')),
        content TEXT DEFAULT '',
        position JSONB DEFAULT '{"x": 0, "y": 0}',
        size JSONB DEFAULT '{"width": 100, "height": 100}',
        properties JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Created 'slide_elements' table.");

    // Create function to auto-update 'updated_at'
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log("✅ Created trigger function 'update_updated_at_column'.");

    // Attach trigger to slide_elements
    await client.query(`
      CREATE TRIGGER trigger_auto_update_timestamp
      BEFORE UPDATE ON slide_elements
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log("✅ Attached update trigger to 'slide_elements'.");

    await client.query("COMMIT");
    console.log("🎉 Database initialized successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Database initialization failed:", err);
  } finally {
    client.release();
  }
}

// Run the initialization
initDb().catch(console.error);
