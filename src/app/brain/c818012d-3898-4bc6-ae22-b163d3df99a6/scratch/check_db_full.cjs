
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to find .env file
const envPath = path.join(__dirname, '../../../../../.env');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  const lines = env.split('\n');
  lines.forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/"/g, '');
    if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/"/g, '');
  });
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRows() {
  const { data, error } = await supabase
    .from('table_sessions')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Total rows found in table_sessions:', data.length);
    if (data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
      console.log('Sample row:', data[0]);
    }
  }
}

checkRows();
