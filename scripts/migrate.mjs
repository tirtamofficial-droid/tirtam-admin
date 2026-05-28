import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const SUPABASE_URL = 'https://hwiilzqgnrzzphccbfyl.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3aWlsenFnbnJ6enBoY2NiZnlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk0NDExNiwiZXhwIjoyMDk1NTIwMTE2fQ.GX-9JCVYpQs_C4eefo1tvjd5cbkjKWSJE7Pz6JIaiUA';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

async function run() {
  console.log('=== Tirtam OS Database Migration ===\n');

  // Step 1: Fetch existing employees
  console.log('1. Fetching employees...');
  const { data: employees, error: empErr } = await supabase
    .from('employees')
    .select('id, name, email, is_admin');

  if (empErr) {
    console.log('   Error:', empErr.message);
    console.log('   Make sure the SQL schema has been run in Supabase SQL Editor first.');
    return;
  }

  console.log(`   Found ${employees.length} employees:`);
  employees.forEach(e => console.log(`   - ${e.name} (${e.id}) ${e.is_admin ? '[ADMIN]' : ''}`));

  // Step 2: Check if tasks already exist
  const { data: existingTasks } = await supabase.from('tasks').select('id').limit(1);
  if (existingTasks && existingTasks.length > 0) {
    console.log('\n   Tasks already exist. Skipping seed.');
    console.log('\n=== Done! ===\n');
    return;
  }

  // Step 3: Map employees - distribute tasks among available team
  const empIds = employees.map(e => e.id);
  const empNames = employees.map(e => e.name);
  const pick = (i) => empIds[i % empIds.length];
  const pickName = (i) => empNames[i % empNames.length];

  // Step 4: Seed tasks
  console.log('\n2. Seeding tasks...');
  const now = new Date();
  const d = (days) => new Date(now.getTime() + days * 86400000).toISOString();
  const past = (days) => new Date(now.getTime() - days * 86400000).toISOString();

  const tasks = [
    { name: 'Finalize product packaging design v2', description: 'Complete the revised packaging design with new brand guidelines', owner: pick(0), department: 'Packaging & Product', priority: 'High', status: 'In Progress', deadline: d(3), notes: 'Vendor needs final files by Friday', tags: ['packaging', 'design', 'urgent'] },
    { name: 'Setup payment gateway integration', description: 'Integrate Razorpay payment gateway on the website', owner: pick(1), department: 'Technology', priority: 'Critical', status: 'In Progress', deadline: d(2), notes: 'API keys received. Need to test sandbox first.', tags: ['payments', 'integration', 'website'] },
    { name: 'Launch Instagram brand campaign', description: 'Plan and execute Q2 brand awareness campaign on Instagram', owner: pick(2), department: 'Marketing & Branding', priority: 'High', status: 'Not started', deadline: d(7), notes: 'Budget approved. Need content calendar.', tags: ['instagram', 'campaign', 'social-media'] },
    { name: 'GST registration renewal', description: 'Renew GST registration and update compliance documents', owner: pick(0), department: 'Legal & Finance', priority: 'Critical', status: 'Blocked', deadline: past(2), notes: 'Blocked: Waiting for CA to send updated documents', tags: ['legal', 'gst', 'compliance'] },
    { name: 'Warehouse space negotiation', description: 'Negotiate terms for the new warehouse in Pune', owner: pick(1), department: 'Operations & Logistics', priority: 'Medium', status: 'In Progress', deadline: d(10), notes: 'Site visit done. Waiting for revised quote.', tags: ['warehouse', 'logistics', 'pune'] },
    { name: 'Onboard packaging vendor (Mumbai)', description: 'Complete vendor onboarding and quality assessment', owner: pick(2), department: 'Vendor & Procurement', priority: 'High', status: 'Review', deadline: d(1), notes: 'Sample quality approved. Finalizing contract.', tags: ['vendor', 'packaging', 'mumbai'] },
    { name: 'Website performance optimization', description: 'Improve page load speed to under 2 seconds', owner: pick(0), department: 'Technology', priority: 'Medium', status: 'Not started', deadline: d(14), notes: 'Lighthouse audit shows 45 score. Target 90+.', tags: ['performance', 'website', 'optimization'] },
    { name: 'Create brand style guide', description: 'Document comprehensive brand guidelines for all channels', owner: pick(1), department: 'Marketing & Branding', priority: 'Medium', status: 'In Progress', deadline: d(12), notes: 'Colors and typography done. Working on templates.', tags: ['brand', 'design', 'documentation'] },
    { name: 'Courier partner evaluation', description: 'Evaluate and shortlist 3 courier partners for pan-India delivery', owner: pick(2), department: 'Operations & Logistics', priority: 'High', status: 'Not started', deadline: d(5), notes: 'RFQ sent to 5 partners. Deadline for response: this week.', tags: ['courier', 'logistics', 'delivery'] },
    { name: 'Product quality testing batch #3', description: 'Send batch #3 for third-party quality testing', owner: pick(0), department: 'Packaging & Product', priority: 'Critical', status: 'Not started', deadline: d(1), notes: 'Lab confirmed slot for Tuesday', tags: ['quality', 'testing', 'product'] },
    { name: 'Draft vendor payment terms template', description: 'Create standardized payment terms for all new vendors', owner: pick(1), department: 'Legal & Finance', priority: 'Low', status: 'Not started', deadline: d(20), notes: '', tags: ['legal', 'vendor', 'templates'] },
    { name: 'Setup CRM for lead tracking', description: 'Configure basic CRM to track inbound leads and customer enquiries', owner: pick(2), department: 'Technology', priority: 'Medium', status: 'Not started', deadline: d(15), notes: 'Evaluating HubSpot free vs Zoho', tags: ['crm', 'leads', 'sales'] },
    { name: 'Inventory count & reconciliation', description: 'Perform monthly inventory count and reconcile with records', owner: pick(0), department: 'Operations & Logistics', priority: 'High', status: 'Completed', deadline: past(1), notes: 'Completed. Minor discrepancy in SKU-045 noted.', tags: ['inventory', 'monthly', 'audit'] },
    { name: 'Social media content calendar - June', description: 'Plan content calendar for all social platforms for June', owner: pick(1), department: 'Marketing & Branding', priority: 'Medium', status: 'Not started', deadline: d(8), notes: 'Align with product launch schedule', tags: ['content', 'social-media', 'planning'] },
    { name: 'Raw material procurement - Q3', description: 'Procure raw materials for Q3 production run', owner: pick(2), department: 'Vendor & Procurement', priority: 'High', status: 'Not started', deadline: d(18), notes: 'Need to lock prices before monsoon season', tags: ['procurement', 'raw-materials', 'q3'] },
    { name: 'Employee onboarding documentation', description: 'Create onboarding docs and checklist for new hires', owner: pick(0), department: 'Operations & Logistics', priority: 'Low', status: 'Not started', deadline: d(25), notes: '', tags: ['hr', 'documentation', 'onboarding'] },
    { name: 'Mobile app wireframes', description: 'Design wireframes for the Tirtam mobile app', owner: pick(1), department: 'Technology', priority: 'Low', status: 'Not started', deadline: d(30), notes: 'Phase 2 project. Low priority for now.', tags: ['mobile', 'design', 'app'] },
    { name: 'Packaging compliance certification', description: 'Obtain FSSAI compliance certification for new packaging', owner: pick(2), department: 'Packaging & Product', priority: 'Critical', status: 'Blocked', deadline: past(3), notes: 'Blocked: Waiting for lab report from batch #2', tags: ['compliance', 'fssai', 'packaging'] },
    { name: 'Google Ads campaign setup', description: 'Setup and launch Google Ads campaign for D2C website', owner: pick(0), department: 'Marketing & Branding', priority: 'High', status: 'Review', deadline: d(4), notes: 'Campaign draft ready. Need founder approval on budget.', tags: ['google-ads', 'digital', 'advertising'] },
    { name: 'Logistics cost optimization report', description: 'Analyze and report on logistics cost reduction opportunities', owner: pick(1), department: 'Operations & Logistics', priority: 'Medium', status: 'Completed', deadline: past(5), notes: 'Report submitted. Identified 15% savings potential.', tags: ['logistics', 'cost', 'report'] },
  ];

  const { data: insertedTasks, error: taskErr } = await supabase.from('tasks').insert(tasks).select();

  if (taskErr) {
    console.log('   Error inserting tasks:', taskErr.message);
    console.log('   Details:', JSON.stringify(taskErr));
    return;
  }
  console.log(`   Inserted ${insertedTasks.length} tasks`);

  // Step 5: Seed activities
  console.log('\n3. Seeding activities...');
  const ago = (mins) => new Date(now.getTime() - mins * 60000).toISOString();

  const taskByName = {};
  insertedTasks.forEach(t => { taskByName[t.name] = t; });

  const activities = [
    { user_id: pick(0), user_name: pickName(0), action: 'completed', task_id: taskByName['Inventory count & reconciliation']?.id, task_name: 'Inventory count & reconciliation', details: 'completed "Inventory count & reconciliation"', department: 'Operations & Logistics', created_at: ago(15) },
    { user_id: pick(1), user_name: pickName(1), action: 'created', task_id: taskByName['Raw material procurement - Q3']?.id, task_name: 'Raw material procurement - Q3', details: 'created task "Raw material procurement - Q3"', department: 'Vendor & Procurement', created_at: ago(45) },
    { user_id: pick(2), user_name: pickName(2), action: 'moved', task_id: taskByName['Setup payment gateway integration']?.id, task_name: 'Setup payment gateway integration', details: 'moved "Setup payment gateway integration" to In Progress', department: 'Technology', created_at: ago(90) },
    { user_id: pick(0), user_name: pickName(0), action: 'updated', task_id: taskByName['Google Ads campaign setup']?.id, task_name: 'Google Ads campaign setup', details: 'moved "Google Ads campaign setup" to Review', department: 'Marketing & Branding', created_at: ago(120) },
    { user_id: pick(1), user_name: pickName(1), action: 'completed', task_id: taskByName['Logistics cost optimization report']?.id, task_name: 'Logistics cost optimization report', details: 'completed "Logistics cost optimization report"', department: 'Operations & Logistics', created_at: ago(180) },
  ].filter(a => a.task_id);

  if (activities.length > 0) {
    const { error: actErr } = await supabase.from('activities').insert(activities);
    if (actErr) {
      console.log('   Error inserting activities:', actErr.message);
    } else {
      console.log(`   Inserted ${activities.length} activities`);
    }
  }

  console.log('\n=== Migration complete! ===');
  console.log(`Database seeded with 20 tasks for your ${employees.length} team members.\n`);
}

run().catch(console.error);
