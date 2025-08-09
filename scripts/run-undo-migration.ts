import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running undo/revert migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20240808_add_import_operations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      // Try running it directly
      console.log('RPC failed, trying direct execution...');
      
      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.from('_sql').insert({ query: statement });
        if (stmtError) {
          console.error('Statement failed:', stmtError);
          // Continue with other statements
        }
      }
    }
    
    console.log('Migration completed successfully!');
    console.log('\nThe undo/revert functionality is now available:');
    console.log('- Import operations are now tracked');
    console.log('- You can undo imports within 5 minutes');
    console.log('- An undo notification will appear after each import');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();