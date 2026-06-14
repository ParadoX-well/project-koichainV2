import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setAdmin() {
  const targetEmail = 'koichainid@gmail.com';
  
  console.log(`Mencari user dengan email: ${targetEmail}...`);
  const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
  
  if (fetchError) {
    console.error('Error fetching users:', fetchError.message);
    process.exit(1);
  }

  const user = users.find(u => u.email === targetEmail);
  
  if (!user) {
    console.error('User tidak ditemukan! Pastikan sudah pernah login/daftar.');
    process.exit(1);
  }

  console.log(`User ditemukan dengan ID: ${user.id}. Mengupdate role menjadi admin...`);
  
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', user.id);

  if (updateError) {
    console.error('Gagal mengupdate role:', updateError.message);
    process.exit(1);
  }

  console.log(`✅ BERHASIL! Akun ${targetEmail} sekarang adalah ADMIN.`);
}

setAdmin();
