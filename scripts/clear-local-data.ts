// Run with: npx tsx scripts/clear-local-data.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

async function clearLocalData() {
  const sql = neon(process.env.DATABASE_URL!);
  
  console.log('Deleting case studies...');
  await sql`DELETE FROM case_studies`;
  
  console.log('Deleting architecture docs...');
  await sql`DELETE FROM architecture_docs`;
  
  console.log('Done! All local case studies and architecture docs deleted.');
}

clearLocalData().catch(console.error);
