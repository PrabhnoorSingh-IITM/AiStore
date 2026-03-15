import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ENV_PATH = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: ENV_PATH });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { count: toolCount } = await supabase.from('tools').select('*', { count: 'exact', head: true });
  const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
  
  console.log(`\n📊 DB Status:`);
  console.log(`- Tools: ${toolCount}`);
  console.log(`- Categories: ${catCount}`);
}

check().catch(console.error);
