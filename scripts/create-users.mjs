import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const SUPABASE_URL = 'https://hwiilzqgnrzzphccbfyl.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3aWlsenFnbnJ6enBoY2NiZnlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk0NDExNiwiZXhwIjoyMDk1NTIwMTE2fQ.GX-9JCVYpQs_C4eefo1tvjd5cbkjKWSJE7Pz6JIaiUA';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

const PASSWORD = 'Tirtam@123';

async function run() {
  console.log('=== Creating Auth Users for Tirtam OS ===\n');

  const { data: employees } = await supabase.from('employees').select('*');
  if (!employees || employees.length === 0) {
    console.log('No employees found. Run the migration first.');
    return;
  }

  for (const emp of employees) {
    console.log(`\nProcessing: ${emp.name} (${emp.email})`);

    if (emp.auth_user_id) {
      console.log(`  Already linked to auth user: ${emp.auth_user_id}`);
      continue;
    }

    // Create auth user with admin API (auto-confirms email)
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: emp.email,
      password: PASSWORD,
      email_confirm: true,
    });

    if (authErr) {
      if (authErr.message.includes('already been registered')) {
        console.log(`  Auth user already exists for ${emp.email}`);
        // Try to find the existing user
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existing = users?.find(u => u.email === emp.email);
        if (existing) {
          console.log(`  Found existing auth user: ${existing.id}`);
          // Update password
          await supabase.auth.admin.updateUserById(existing.id, { password: PASSWORD });
          console.log(`  Password updated to ${PASSWORD}`);
          // Link to employee
          await supabase.from('employees').update({ auth_user_id: existing.id }).eq('id', emp.id);
          console.log(`  Linked employee → auth user`);
        }
      } else {
        console.log(`  Error: ${authErr.message}`);
      }
      continue;
    }

    if (authUser?.user) {
      console.log(`  Created auth user: ${authUser.user.id}`);
      // Link employee to auth user
      const { error: linkErr } = await supabase
        .from('employees')
        .update({ auth_user_id: authUser.user.id })
        .eq('id', emp.id);

      if (linkErr) {
        console.log(`  Error linking: ${linkErr.message}`);
      } else {
        console.log(`  Linked employee → auth user`);
      }
    }
  }

  // Verify
  console.log('\n=== Final State ===');
  const { data: final } = await supabase.from('employees').select('name, email, auth_user_id, is_admin');
  final?.forEach(e => {
    console.log(`  ${e.name} (${e.email}) → auth: ${e.auth_user_id ? 'LINKED' : 'NOT LINKED'} | admin: ${e.is_admin}`);
  });

  console.log(`\n=== All users can now login with password: ${PASSWORD} ===\n`);
}

run().catch(console.error);
