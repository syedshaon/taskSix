import pool from "./db.js";

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create the presentations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS presentations (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create the slides table
    await client.query(`
      CREATE TABLE IF NOT EXISTS slides (
        id SERIAL PRIMARY KEY,
        presentation_id INT REFERENCES presentations(id) ON DELETE CASCADE,
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

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

    // Create the slide_elements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS slide_elements (
      id SERIAL PRIMARY KEY,
      slide_id INT NOT NULL,
      type TEXT CHECK (type IN ('text', 'image', 'shape')),
      content TEXT DEFAULT '',
      position JSONB DEFAULT '{"x": 0, "y": 0}',
      size JSONB DEFAULT '{"width": 100, "height": 100}',
      properties JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE
    );

    `);

    // Create a trigger to auto-update the updated_at column on changes
    await client.query(`
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Attach trigger to slide_elements
    await client.query(`
      CREATE TRIGGER trigger_update_timestamp
      BEFORE UPDATE ON slide_elements
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    `);

    await client.query("COMMIT");
    console.log("Database initialized successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Database initialization failed:", err);
  } finally {
    client.release();
  }
}

// Run the initialization
initDb().catch(console.error);
