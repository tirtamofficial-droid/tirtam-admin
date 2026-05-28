import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const SUPABASE_URL = 'https://hwiilzqgnrzzphccbfyl.supabase.co';
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3aWlsenFnbnJ6enBoY2NiZnlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk0NDExNiwiZXhwIjoyMDk1NTIwMTE2fQ.GX-9JCVYpQs_C4eefo1tvjd5cbkjKWSJE7Pz6JIaiUA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  global: { fetch },
  realtime: { transport: WebSocket },
});

const vendorPayments = [
  {
    vendor_name: 'SRIS MP',
    description: 'Sample Products - Crystals & Rudraksha',
    quantity: 54,
    amount: 8455,
    purchase_date: '2026-05-20',
    paid_by: 'Karthik Shetty',
    payment_mode: 'Cash',
    notes: '',
  },
  {
    vendor_name: 'Astro Crystal Mart GJ',
    description: 'Sample - Crystals',
    quantity: 15,
    amount: 4340,
    purchase_date: '2026-05-20',
    paid_by: 'Karthik Shetty',
    payment_mode: 'Cash',
    notes: '',
  },
  {
    vendor_name: 'Japam',
    description: 'Sample - Crystals & Rudraksha',
    quantity: 15,
    amount: 2425,
    purchase_date: '2026-05-20',
    paid_by: 'Karthik Shetty',
    payment_mode: 'Cash',
    notes: '',
  },
];

const otherSpendings = [
  {
    title: 'GoDaddy',
    category: 'Technology',
    amount: 1500,
    spent_date: '2026-05-20',
    paid_by: 'Samarth Rai',
    payment_mode: 'UPI',
    notes: 'Website domain',
  },
  {
    title: 'Startupwala - Advance',
    category: 'Legal & Compliance',
    amount: 5800,
    spent_date: '2026-05-20',
    paid_by: 'Samarth Rai',
    payment_mode: 'UPI',
    notes: 'LLP Registration + DSC',
  },
  {
    title: 'Runway',
    category: 'Technology',
    amount: 4000,
    spent_date: '2026-05-20',
    paid_by: 'Samarth Rai',
    payment_mode: 'UPI',
    notes: 'AI Model',
  },
];

async function seed() {
  console.log('Seeding vendor_payments...');
  const { data: vpData, error: vpError } = await supabase
    .from('vendor_payments')
    .insert(vendorPayments)
    .select();

  if (vpError) {
    console.error('Error inserting vendor_payments:', vpError.message);
    process.exit(1);
  }
  console.log(`  Inserted ${vpData.length} vendor_payments rows:`);
  vpData.forEach((r) => console.log(`    - [${r.id}] ${r.vendor_name} — ₹${r.amount}`));

  console.log('\nSeeding other_spendings...');
  const { data: osData, error: osError } = await supabase
    .from('other_spendings')
    .insert(otherSpendings)
    .select();

  if (osError) {
    console.error('Error inserting other_spendings:', osError.message);
    process.exit(1);
  }
  console.log(`  Inserted ${osData.length} other_spendings rows:`);
  osData.forEach((r) => console.log(`    - [${r.id}] ${r.title} — ₹${r.amount}`));

  const total = vpData.length + osData.length;
  console.log(`\nDone! ${total} rows inserted total.`);
}

seed();
