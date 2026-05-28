const fs = require('fs');
const path = require('path');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const https = require('https');
const http = require('http');

const CHROMIUM_LOCK_FILES = new Set([
  'SingletonLock',
  'SingletonSocket',
  'SingletonCookie',
  'DevToolsActivePort',
]);

/** Remove stale Chromium locks after container crash/restart (Railway volume). */
function clearStaleChromiumLocks(dir) {
  if (!fs.existsSync(dir)) return;

  let cleared = 0;
  const walk = (current) => {
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (CHROMIUM_LOCK_FILES.has(entry.name)) {
        try {
          fs.unlinkSync(full);
          cleared += 1;
          console.log(`Removed stale Chromium lock: ${full}`);
        } catch (err) {
          console.warn(`Could not remove ${full}:`, err.message);
        }
      }
    }
  };

  walk(dir);
  if (cleared > 0) {
    console.log(`Cleared ${cleared} stale Chromium lock file(s) under ${dir}`);
  }
}

// ============================================================
// CONFIG
// ============================================================
const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SESSION_PATH = process.env.WHATSAPP_SESSION_PATH || './whatsapp-session';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing required env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

function buildPuppeteerConfig() {
  const config = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-features=ChromeProcessSingleton',
    ],
  };
  if (process.platform === 'darwin') {
    config.executablePath =
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    config.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  return config;
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

// ============================================================
// WHATSAPP CLIENT
// ============================================================
let whatsappStatus = 'initializing';
let qrCodeData = null;
let connectedNumber = null;

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: SESSION_PATH }),
  puppeteer: buildPuppeteerConfig(),
});

client.on('qr', (qr) => {
  qrCodeData = qr;
  whatsappStatus = 'waiting_for_qr_scan';
  console.log('\n========================================');
  console.log('  SCAN THIS QR CODE WITH WHATSAPP');
  console.log('========================================\n');
  qrcode.generate(qr, { small: true });
  console.log('\nOr open /qr on your bot server (port ' + PORT + ')\n');
});

client.on('ready', () => {
  whatsappStatus = 'connected';
  qrCodeData = null;
  connectedNumber = client.info?.wid?.user || 'unknown';
  console.log(`\nWhatsApp connected! Number: ${connectedNumber}\n`);
});

client.on('authenticated', () => {
  console.log('WhatsApp authenticated');
  whatsappStatus = 'authenticated';
});

client.on('auth_failure', (msg) => {
  console.error('WhatsApp auth failed:', msg);
  whatsappStatus = 'auth_failed';
});

client.on('disconnected', (reason) => {
  console.log('WhatsApp disconnected:', reason);
  whatsappStatus = 'disconnected';
  connectedNumber = null;
});

let shuttingDown = false;
async function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received — shutting down WhatsApp client...`);
  try {
    await client.destroy();
  } catch (err) {
    console.warn('Error during client.destroy():', err.message);
  }
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================================
// LOGO
// ============================================================
const TIRTAM_LOGO_URL = 'https://www.tirtam.com/cdn/shop/files/Pi7-Image-Cropper.png?v=1779194222&width=360';

function fetchImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchImageAsBase64(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ============================================================
// TASK SCANNER + SUMMARY GENERATOR
// ============================================================
async function scanTasksAndGenerateSummary() {
  const [tasksRes, employeesRes] = await Promise.all([
    supabase.from('tasks').select('*'),
    supabase.from('employees').select('id, name'),
  ]);

  const allTasks = tasksRes.data || [];
  const employees = employeesRes.data || [];
  const getOwnerName = (id) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.name.split(' ')[0] : '';
  };

  const hasOwner = (t) => t.owner && t.owner.trim() !== '';
  const tasks = allTasks.filter(hasOwner);
  const unassigned = allTasks.filter(t => !hasOwner(t));

  const now = new Date();

  const pending = tasks.filter(t => t.status === 'Pending');
  const completed = tasks.filter(t => t.status === 'Completed');
  const active = tasks.filter(t => t.status !== 'Completed');

  const highPriority = active.filter(t => t.priority === 'Critical' || t.priority === 'High');
  const mediumPriority = active.filter(t => t.priority === 'Medium');
  const lowPriority = active.filter(t => t.priority === 'Low');

  const formatDueDate = (deadline) => {
    if (!deadline) return 'No date';
    const dl = new Date(deadline);
    if (dl < now && active.some(t => t.deadline === deadline)) return 'Overdue';
    return dl.toLocaleDateString('en-IN', { month: 'long', day: 'numeric' });
  };

  const priorityIcon = (p) => {
    if (p === 'Critical' || p === 'High') return '🔴';
    if (p === 'Medium') return '🟡';
    return '🟢';
  };

  let msg = `⚠️ *Tirtam Daily Operations Summary*\n\n`;
  msg += `📌 Pending Tasks: ${pending.length}\n`;
  msg += `✅ Completed Tasks: ${completed.length}\n`;
  msg += `🔴 High Priority: ${highPriority.length}\n`;
  msg += `🟡 Medium Priority: ${mediumPriority.length}\n`;
  msg += `🟢 Low Priority: ${lowPriority.length}\n`;

  const taskList = active.sort((a, b) => {
    const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
  });

  for (const t of taskList) {
    const icon = priorityIcon(t.priority);
    const ownerName = getOwnerName(t.owner);
    const dueDate = formatDueDate(t.deadline);

    msg += `\n---\n\n`;
    msg += `${icon} *Owner:* ${ownerName}\n`;
    msg += `*Task:* ${t.name}\n`;
    msg += `*Department:* ${t.department}\n`;
    msg += `*Priority:* ${t.priority}\n`;
    msg += `*Due Date:* ${dueDate}\n`;
    msg += `*Status:* ${t.status}`;
  }

  if (unassigned.length > 0) {
    msg += `\n\n---\n\n📋 *Upcoming Tasks (Unassigned):* ${unassigned.length}\n`;
    for (const t of unassigned) {
      msg += `\n• ${t.name} — ${t.department} [${t.priority}]`;
    }
  }

  msg += `\n\n---\n\n_Sent by Tirtam OS_`;

  return {
    summary: msg,
    stats: {
      total: allTasks.length,
      assigned: tasks.length,
      unassigned: unassigned.length,
      pending: pending.length,
      completed: completed.length,
      highPriority: highPriority.length,
      mediumPriority: mediumPriority.length,
      lowPriority: lowPriority.length,
    },
  };
}

async function sendSummaryToGroup(groupName) {
  if (whatsappStatus !== 'connected') {
    return { success: false, error: 'WhatsApp not connected. Scan QR code first.' };
  }

  try {
    const { summary, stats } = await scanTasksAndGenerateSummary();

    const chats = await client.getChats();
    const group = chats.find(c => c.isGroup && c.name.toLowerCase().includes(groupName.toLowerCase()));

    if (!group) {
      const groupNames = chats.filter(c => c.isGroup).map(c => c.name);
      return {
        success: false,
        error: `Group "${groupName}" not found. Available groups: ${groupNames.join(', ')}`,
        availableGroups: groupNames,
      };
    }

    try {
      const logoBase64 = await fetchImageAsBase64(TIRTAM_LOGO_URL);
      const media = new MessageMedia('image/png', logoBase64, 'tirtam-logo.png');
      await group.sendMessage(media, { caption: summary });
    } catch (logoErr) {
      console.warn('Could not attach logo, sending text only:', logoErr.message);
      await group.sendMessage(summary);
    }

    await supabase
      .from('whatsapp_config')
      .update({ last_sent: new Date().toISOString() })
      .neq('id', '');

    console.log(`Summary sent to group "${group.name}" at ${new Date().toISOString()}`);
    return { success: true, groupName: group.name, stats, preview: summary.slice(0, 300) + '...' };
  } catch (err) {
    console.error('Error sending summary:', err);
    return { success: false, error: err.message };
  }
}

// ============================================================
// EXPRESS API SERVER
// ============================================================
const app = express();
app.use(cors());
app.use(express.json());

app.get('/status', (req, res) => {
  res.json({
    whatsapp: whatsappStatus,
    connectedNumber,
    hasQr: !!qrCodeData,
  });
});

app.get('/qr', (req, res) => {
  if (!qrCodeData) {
    if (whatsappStatus === 'connected') {
      res.send(`
        <html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#f8fafc">
          <div style="text-align:center">
            <h2 style="color:#10b981">WhatsApp Connected!</h2>
            <p>Number: ${connectedNumber}</p>
          </div>
        </body></html>
      `);
    } else {
      res.send(`
        <html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#f8fafc">
          <div style="text-align:center">
            <h2>Waiting for QR Code...</h2>
            <p>Status: ${whatsappStatus}</p>
            <script>setTimeout(()=>location.reload(),3000)</script>
          </div>
        </body></html>
      `);
    }
    return;
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData)}`;
  res.send(`
    <html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#f8fafc">
      <div style="text-align:center">
        <h2>Scan with WhatsApp</h2>
        <p style="color:#64748b;margin-bottom:20px">Open WhatsApp > Settings > Linked Devices > Link a Device</p>
        <img src="${qrUrl}" style="border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1)" />
        <p style="color:#94a3b8;margin-top:16px;font-size:13px">This page auto-refreshes every 5 seconds</p>
        <script>setTimeout(()=>location.reload(),5000)</script>
      </div>
    </body></html>
  `);
});

app.post('/send-summary', async (req, res) => {
  const groupName = req.body.groupName || 'Tirtam';
  const result = await sendSummaryToGroup(groupName);
  res.json(result);
});

app.get('/preview-summary', async (req, res) => {
  const { summary, stats } = await scanTasksAndGenerateSummary();
  res.json({ summary, stats });
});

app.get('/groups', async (req, res) => {
  if (whatsappStatus !== 'connected') {
    return res.json({ error: 'WhatsApp not connected', groups: [] });
  }
  const chats = await client.getChats();
  const groups = chats.filter(c => c.isGroup).map(c => ({ name: c.name, id: c.id._serialized }));
  res.json({ groups });
});

// ============================================================
// DAILY CRON JOB
// ============================================================
async function setupCron() {
  const { data: config } = await supabase.from('whatsapp_config').select('*').single();
  const sendTime = config?.send_time || '09:00';
  const [hour, minute] = sendTime.split(':');
  const groupName = config?.group_name || 'Tirtam';

  if (config?.enabled) {
    const cronExpr = `${minute} ${hour} * * *`;
    cron.schedule(cronExpr, async () => {
      console.log(`\n[CRON] Running daily summary at ${new Date().toISOString()}`);
      const result = await sendSummaryToGroup(groupName);
      console.log('[CRON] Result:', result.success ? 'Sent!' : result.error);
    });
    console.log(`Daily cron scheduled at ${sendTime} for group "${groupName}"`);
  } else {
    console.log('WhatsApp automation is disabled. Enable it in the dashboard.');
  }
}

// ============================================================
// START
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== Tirtam WhatsApp Bot ===`);
  console.log(`API server listening on port ${PORT}`);
  console.log(`QR code page: /qr`);
  console.log(`Status: /status\n`);
  console.log('Initializing WhatsApp client...\n');

  clearStaleChromiumLocks(SESSION_PATH);
  client.initialize().catch((err) => {
    console.error('WhatsApp client failed to start:', err.message);
    whatsappStatus = 'error';
  });
  setupCron();
});
