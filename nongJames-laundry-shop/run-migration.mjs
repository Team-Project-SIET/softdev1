import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'nj_passwordd',
  database: 'nj_laundry'
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    const sqlPath = './drizzle/0000_dear_dreadnoughts.sql';
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by statement-breakpoint
    const statements = sql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt) continue;

      try {
        await client.query(stmt);
        process.stdout.write(`\r✓ Executed ${i + 1}/${statements.length}`);
      } catch (err) {
        console.error(`\n✗ Error executing statement ${i + 1}:`, err.message);
        console.error('Statement:', stmt.substring(0, 100) + '...');
      }
    }

    console.log('\n✓ Migration completed!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
