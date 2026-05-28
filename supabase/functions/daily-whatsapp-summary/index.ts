// Supabase Edge Function: Daily WhatsApp Summary via Twilio
// Deploy: supabase functions deploy daily-whatsapp-summary
// Schedule: Set up a cron trigger in Supabase Dashboard → Database → Extensions → pg_cron
//   SELECT cron.schedule('daily-whatsapp', '0 3 * * *', $$ SELECT net.http_post(...) $$);
//   (0 3 * * * = 3:00 UTC = 8:30 AM IST)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Task {
  id: string;
  name: string;
  description: string;
  owner: string;
  department: string;
  priority: string;
  status: string;
  deadline: string;
  notes: string;
}

interface Employee {
  id: string;
  name: string;
}

function generateSummary(tasks: Task[], employees: Employee[]): string {
  const getOwnerName = (id: string) => employees.find(e => e.id === id)?.name || 'Unassigned';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  const active = tasks.filter(t => t.status !== 'Completed');
  const pending = tasks.filter(t => t.status === 'Pending');
  const overdue = tasks.filter(t => t.status !== 'Completed' && new Date(t.deadline) < now);
  const blocked = tasks.filter(t => t.status === 'Blocked');
  const highPriority = active.filter(t => t.priority === 'Critical' || t.priority === 'High');

  const deptGroups = new Map<string, Task[]>();
  active.forEach(t => {
    const list = deptGroups.get(t.department) || [];
    list.push(t);
    deptGroups.set(t.department, list);
  });

  let msg = `🏢 *TIRTAM DAILY OPS SUMMARY*\n📅 ${dateStr}\n\n`;

  msg += `📊 *Quick Stats*\n`;
  msg += `• Total Active: ${active.length}\n`;
  msg += `• Pending: ${pending.length}\n`;
  msg += `• Overdue: ${overdue.length}\n`;
  msg += `• Blocked: ${blocked.length}\n\n`;

  if (overdue.length > 0) {
    msg += `🚨 *OVERDUE TASKS*\n`;
    overdue.forEach(t => {
      const deadline = new Date(t.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      msg += `• ${t.name} → ${getOwnerName(t.owner)} (Due: ${deadline})\n`;
    });
    msg += '\n';
  }

  if (blocked.length > 0) {
    msg += `🔴 *BLOCKED ITEMS*\n`;
    blocked.forEach(t => {
      msg += `• ${t.name} → ${getOwnerName(t.owner)}\n  _${t.notes || 'No notes'}_\n`;
    });
    msg += '\n';
  }

  if (highPriority.length > 0) {
    msg += `⚡ *HIGH PRIORITY*\n`;
    highPriority.slice(0, 5).forEach(t => {
      msg += `• ${t.name} [${t.status}] → ${getOwnerName(t.owner)}\n`;
    });
    msg += '\n';
  }

  msg += `📋 *DEPARTMENT BREAKDOWN*\n`;
  deptGroups.forEach((deptTasks, dept) => {
    msg += `\n*${dept}* (${deptTasks.length} tasks)\n`;
    deptTasks.slice(0, 3).forEach(t => {
      msg += `  • ${t.name} [${t.status}] → ${getOwnerName(t.owner)}\n`;
    });
    if (deptTasks.length > 3) msg += `  _...and ${deptTasks.length - 3} more_\n`;
  });

  msg += `\n💡 *Focus Areas Today:*\n`;
  if (overdue.length > 0) msg += `• Clear ${overdue.length} overdue task(s)\n`;
  if (blocked.length > 0) msg += `• Unblock ${blocked.length} stuck item(s)\n`;
  msg += `• Complete high priority deliverables\n`;
  msg += `\n_Sent by Tirtam Ops Assistant_ 🤖`;

  return msg;
}

async function sendWhatsAppViaTwilio(
  accountSid: string,
  authToken: string,
  fromNumber: string,
  toNumber: string,
  body: string
): Promise<{ success: boolean; error?: string; sid?: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = btoa(`${accountSid}:${authToken}`);

  const params = new URLSearchParams();
  params.append('From', `whatsapp:${fromNumber}`);
  params.append('To', `whatsapp:${toNumber}`);
  params.append('Body', body);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, sid: data.sid };
    }
    return { success: false, error: data.message || 'Twilio API error' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch WhatsApp config
    const { data: config } = await supabase.from('whatsapp_config').select('*').single();
    if (!config || !config.enabled) {
      return new Response(
        JSON.stringify({ message: 'WhatsApp automation is disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (!config.twilio_account_sid || !config.twilio_auth_token || !config.twilio_from_number || !config.phone_number) {
      return new Response(
        JSON.stringify({ message: 'Twilio credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch tasks and employees
    const [tasksRes, employeesRes] = await Promise.all([
      supabase.from('tasks').select('*'),
      supabase.from('employees').select('id, name'),
    ]);

    const tasks = (tasksRes.data || []) as Task[];
    const employees = (employeesRes.data || []) as Employee[];

    // Generate summary
    const summary = generateSummary(tasks, employees);

    // Send via Twilio WhatsApp
    const result = await sendWhatsAppViaTwilio(
      config.twilio_account_sid,
      config.twilio_auth_token,
      config.twilio_from_number,
      config.phone_number,
      summary
    );

    // Update last_sent
    if (result.success) {
      await supabase
        .from('whatsapp_config')
        .update({ last_sent: new Date().toISOString() })
        .eq('id', config.id);
    }

    return new Response(
      JSON.stringify({
        message: result.success ? 'WhatsApp summary sent successfully' : 'Failed to send',
        twilioSid: result.sid,
        error: result.error,
        summary_preview: summary.slice(0, 200) + '...',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: result.success ? 200 : 500 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
