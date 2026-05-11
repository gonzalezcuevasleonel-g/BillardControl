const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: sales, error } = await supabase.from('sales').select('*').limit(1);
  if (error) {
    console.error('Error fetching sales:', error);
  } else {
    console.log('Sales columns:', Object.keys(sales[0] || {}));
  }
}

check();
