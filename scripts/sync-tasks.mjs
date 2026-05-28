import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const SUPABASE_URL = 'https://hwiilzqgnrzzphccbfyl.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3aWlsenFnbnJ6enBoY2NiZnlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk0NDExNiwiZXhwIjoyMDk1NTIwMTE2fQ.GX-9JCVYpQs_C4eefo1tvjd5cbkjKWSJE7Pz6JIaiUA';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

const d = (days) => new Date(Date.now() + days * 86400000).toISOString();

const TASKS = [
  // PACKAGING & PRODUCT
  { name: 'Rigid Box', description: 'Design and finalize rigid box packaging', department: 'Packaging & Product', priority: 'High', status: 'Not started', deadline: d(7), tags: ['packaging'] },
  { name: 'Ribbon', description: 'Source and finalize ribbon for packaging', department: 'Packaging & Product', priority: 'Medium', status: 'Not started', deadline: d(10), tags: ['packaging'] },
  { name: 'Potli', description: 'Design potli bags for product packaging', department: 'Packaging & Product', priority: 'Medium', status: 'Not started', deadline: d(12), tags: ['packaging'] },
  { name: 'Satin Cloth', description: 'Source satin cloth material', department: 'Packaging & Product', priority: 'Medium', status: 'Not started', deadline: d(14), tags: ['packaging', 'material'] },
  { name: 'Gift Boxes', description: 'Finalize gift box designs and vendor', department: 'Packaging & Product', priority: 'High', status: 'Not started', deadline: d(8), tags: ['packaging', 'gift'] },
  { name: 'Delivery Box', description: 'Design shipping/delivery boxes', department: 'Packaging & Product', priority: 'High', status: 'Not started', deadline: d(6), tags: ['packaging', 'delivery'] },
  { name: 'Thank You Card', description: 'Design thank you cards for orders', department: 'Packaging & Product', priority: 'Low', status: 'Not started', deadline: d(15), tags: ['packaging', 'cards'] },
  { name: 'Sankalp Card', description: 'Design Sankalp cards for products', department: 'Packaging & Product', priority: 'Medium', status: 'Not started', deadline: d(15), tags: ['packaging', 'cards'] },
  { name: 'Vibuthi', description: 'Source and package vibuthi', department: 'Packaging & Product', priority: 'High', status: 'Not started', deadline: d(5), tags: ['product'] },
  { name: 'Catalog', description: 'Design product catalog', department: 'Packaging & Product', priority: 'Medium', status: 'Not started', deadline: d(18), tags: ['design', 'catalog'] },
  { name: 'Certificates', description: 'Design authenticity certificates', department: 'Packaging & Product', priority: 'Low', status: 'Not started', deadline: d(20), tags: ['certificates'] },
  { name: 'Coupon Card', description: 'Design discount coupon cards', department: 'Packaging & Product', priority: 'Low', status: 'Not started', deadline: d(20), tags: ['cards', 'marketing'] },
  { name: 'Ritual Guide', description: 'Write and design ritual guide booklet', department: 'Packaging & Product', priority: 'Medium', status: 'Not started', deadline: d(16), tags: ['content', 'guide'] },
  { name: 'Affirmation Card', description: 'Design affirmation cards', department: 'Packaging & Product', priority: 'Low', status: 'Not started', deadline: d(18), tags: ['cards'] },
  { name: 'Mantra Card', description: 'Design mantra cards for products', department: 'Packaging & Product', priority: 'Low', status: 'Not started', deadline: d(18), tags: ['cards'] },
  { name: 'Sticker', description: 'Design brand stickers', department: 'Packaging & Product', priority: 'Low', status: 'Not started', deadline: d(12), tags: ['design', 'branding'] },
  { name: 'Product Finalize', description: 'Finalize all product specifications', department: 'Packaging & Product', priority: 'Critical', status: 'Not started', deadline: d(4), tags: ['product', 'critical'] },
  { name: 'Unboxing Experience', description: 'Design and plan unboxing experience flow', department: 'Packaging & Product', priority: 'High', status: 'Not started', deadline: d(10), tags: ['ux', 'packaging'] },
  { name: 'Photography', description: 'Product photography for website and marketing', department: 'Packaging & Product', priority: 'High', status: 'Not started', deadline: d(9), tags: ['photography', 'marketing'] },

  // TECHNOLOGY
  { name: 'Website', description: 'Build and launch company website', department: 'Technology', priority: 'Critical', status: 'Not started', deadline: d(5), tags: ['website', 'launch'] },
  { name: 'PDP Designs', description: 'Design product detail pages', department: 'Technology', priority: 'High', status: 'Not started', deadline: d(7), tags: ['design', 'website'] },
  { name: 'Delivery Partner', description: 'Integrate delivery partner APIs', department: 'Technology', priority: 'High', status: 'Not started', deadline: d(10), tags: ['integration', 'delivery'] },
  { name: 'Payment Partner', description: 'Setup payment gateway integration', department: 'Technology', priority: 'Critical', status: 'Not started', deadline: d(5), tags: ['payments', 'integration'] },
  { name: 'Label Print Machine', description: 'Setup label printing system', department: 'Technology', priority: 'Medium', status: 'Not started', deadline: d(14), tags: ['hardware', 'printing'] },
  { name: 'Inventory', description: 'Build inventory management system', department: 'Technology', priority: 'High', status: 'Not started', deadline: d(12), tags: ['inventory', 'system'] },
  { name: 'Email Automation', description: 'Setup email automation workflows', department: 'Technology', priority: 'Medium', status: 'Not started', deadline: d(16), tags: ['email', 'automation'] },
  { name: 'WhatsApp Automation', description: 'Setup WhatsApp business automation', department: 'Technology', priority: 'Medium', status: 'Not started', deadline: d(14), tags: ['whatsapp', 'automation'] },
  { name: 'Social Media', description: 'Setup social media management tools', department: 'Technology', priority: 'Medium', status: 'Not started', deadline: d(10), tags: ['social', 'tools'] },
  { name: 'SEO Setup', description: 'Setup SEO for website', department: 'Technology', priority: 'Medium', status: 'Not started', deadline: d(15), tags: ['seo', 'website'] },
  { name: 'Content Management', description: 'Setup CMS for website content', department: 'Technology', priority: 'Medium', status: 'Not started', deadline: d(12), tags: ['cms', 'content'] },
  { name: 'Legal Pages', description: 'Create legal pages for website', department: 'Technology', priority: 'Low', status: 'Not started', deadline: d(18), tags: ['legal', 'website'] },
  { name: 'Customer Support', description: 'Setup customer support system', department: 'Technology', priority: 'Medium', status: 'Not started', deadline: d(14), tags: ['support', 'customer'] },
  { name: 'Expense Tracking', description: 'Build expense tracking module', department: 'Technology', priority: 'Low', status: 'Not started', deadline: d(20), tags: ['finance', 'tracking'] },

  // MARKETING & BRANDING
  { name: 'Giveaway', description: 'Plan and execute launch giveaway campaign', department: 'Marketing & Branding', priority: 'High', status: 'Not started', deadline: d(8), tags: ['campaign', 'launch'] },
  { name: 'YouTube & FB Marketing', description: 'Setup YouTube and Facebook marketing campaigns', department: 'Marketing & Branding', priority: 'High', status: 'Not started', deadline: d(10), tags: ['youtube', 'facebook', 'ads'] },
  { name: 'Influencer Contact', description: 'Reach out to influencers for collaboration', department: 'Marketing & Branding', priority: 'Medium', status: 'Not started', deadline: d(12), tags: ['influencer', 'outreach'] },
  { name: 'Content Creation', description: 'Create content for all marketing channels', department: 'Marketing & Branding', priority: 'High', status: 'Not started', deadline: d(7), tags: ['content', 'creation'] },

  // LEGAL & FINANCE
  { name: 'LLP Registration', description: 'Complete LLP company registration', department: 'Legal & Finance', priority: 'Critical', status: 'Not started', deadline: d(3), tags: ['legal', 'registration'] },
  { name: 'GST', description: 'Complete GST registration', department: 'Legal & Finance', priority: 'Critical', status: 'Not started', deadline: d(5), tags: ['legal', 'gst'] },
  { name: 'Bank Account', description: 'Open business bank account', department: 'Legal & Finance', priority: 'High', status: 'Not started', deadline: d(5), tags: ['finance', 'banking'] },
  { name: 'Pricing Strategy', description: 'Finalize product pricing strategy', department: 'Legal & Finance', priority: 'High', status: 'Not started', deadline: d(7), tags: ['pricing', 'strategy'] },

  // OPERATIONS & LOGISTICS
  { name: 'Employee Management', description: 'Setup employee management processes', department: 'Operations & Logistics', priority: 'Medium', status: 'Not started', deadline: d(14), tags: ['hr', 'operations'] },
  { name: 'Phone Number Setup', description: 'Setup business phone numbers', department: 'Operations & Logistics', priority: 'Medium', status: 'Not started', deadline: d(5), tags: ['telecom', 'setup'] },
  { name: 'Pooja & Energize', description: 'Organize pooja and energize ceremony', department: 'Operations & Logistics', priority: 'High', status: 'Not started', deadline: d(3), tags: ['ceremony', 'spiritual'] },

  // VENDOR & PROCUREMENT
  { name: 'Vibuthi Procurement', description: 'Source and procure vibuthi from vendors', department: 'Vendor & Procurement', priority: 'High', status: 'Not started', deadline: d(6), tags: ['procurement', 'vibuthi'] },
  { name: 'Sage Procurement', description: 'Source and procure sage from vendors', department: 'Vendor & Procurement', priority: 'High', status: 'Not started', deadline: d(6), tags: ['procurement', 'sage'] },
  { name: 'Packaging Vendor', description: 'Finalize packaging vendor partnership', department: 'Vendor & Procurement', priority: 'High', status: 'Not started', deadline: d(7), tags: ['vendor', 'packaging'] },
  { name: 'Printing Vendor', description: 'Finalize printing vendor for cards and labels', department: 'Vendor & Procurement', priority: 'Medium', status: 'Not started', deadline: d(10), tags: ['vendor', 'printing'] },
  { name: 'Delivery Vendor', description: 'Finalize delivery/courier vendor', department: 'Vendor & Procurement', priority: 'High', status: 'Not started', deadline: d(8), tags: ['vendor', 'delivery'] },
];

async function run() {
  console.log('=== Syncing 49 tasks to Supabase ===\n');

  // Get employees
  const { data: employees } = await supabase.from('employees').select('id, name');
  if (!employees?.length) {
    console.log('No employees found in Supabase. Run the migration first.');
    return;
  }
  console.log(`Found ${employees.length} employees: ${employees.map(e => e.name).join(', ')}\n`);

  // Delete old tasks
  console.log('Deleting old tasks...');
  const { error: delErr } = await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) console.log('Delete error:', delErr.message);
  else console.log('Old tasks deleted.\n');

  // Delete old activities
  console.log('Deleting old activities...');
  await supabase.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Old activities deleted.\n');

  // Insert new tasks
  let idx = 0;
  const tasksToInsert = TASKS.map(t => {
    const owner = employees[idx++ % employees.length];
    return {
      name: t.name,
      description: t.description,
      owner: owner.id,
      department: t.department,
      priority: t.priority,
      status: t.status,
      deadline: t.deadline,
      notes: '',
      dependencies: [],
      tags: t.tags,
    };
  });

  console.log(`Inserting ${tasksToInsert.length} tasks...`);
  const { data: inserted, error: insErr } = await supabase
    .from('tasks')
    .insert(tasksToInsert)
    .select('id, name');

  if (insErr) {
    console.log('Insert error:', insErr.message);
    return;
  }

  console.log(`Inserted ${inserted.length} tasks.\n`);

  // Verify
  const { count } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
  console.log(`=== Supabase now has ${count} tasks ===`);
  console.log('\nDone! Refresh Tirtam OS to see the updated tasks.');
}

run().catch(console.error);
