import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { generateWhatsAppSummary } from '../utils/helpers';
import { MessageSquare, Send, Clock, Copy, Check, Smartphone, Settings, Zap, Wifi, WifiOff, QrCode, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

const BOT_URL = import.meta.env.VITE_WHATSAPP_BOT_URL || 'http://localhost:3001';

interface BotStatus {
  whatsapp: string;
  connectedNumber: string | null;
  hasQr: boolean;
}

export default function WhatsAppPage() {
  const { tasks, employees, whatsappConfig, setWhatsAppConfig } = useStore();
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [botOnline, setBotOnline] = useState(false);
  const [groups, setGroups] = useState<{ name: string; id: string }[]>([]);

  const summary = generateWhatsAppSummary(tasks, employees);

  const checkBotStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BOT_URL}/status`);
      const data = await res.json();
      setBotStatus(data);
      setBotOnline(true);

      if (data.whatsapp === 'connected') {
        const grpRes = await fetch(`${BOT_URL}/groups`);
        const grpData = await grpRes.json();
        if (grpData.groups) setGroups(grpData.groups);
      }
    } catch {
      setBotOnline(false);
      setBotStatus(null);
    }
  }, []);

  useEffect(() => {
    checkBotStatus();
    const interval = setInterval(checkBotStatus, 5000);
    return () => clearInterval(interval);
  }, [checkBotStatus]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendNow = async () => {
    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch(`${BOT_URL}/send-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName: whatsappConfig.groupName }),
      });
      const data = await res.json();
      setSendResult({
        success: data.success,
        message: data.success ? `Summary sent to "${data.groupName}"` : data.error,
      });
    } catch {
      setSendResult({ success: false, message: 'Cannot reach WhatsApp bot server. Make sure it is running on port 3001.' });
    }

    setSending(false);
    setTimeout(() => setSendResult(null), 8000);
  };

  const isConnected = botStatus?.whatsapp === 'connected';
  const needsQr = botStatus?.whatsapp === 'waiting_for_qr_scan';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-[18px] font-semibold text-text-primary flex items-center gap-2">
          <MessageSquare size={20} className="text-green-600" /> WhatsApp Daily Automation
        </h1>
        <p className="text-[13px] text-text-tertiary mt-0.5">
          Free automated task summary via whatsapp-web.js — no Twilio needed
        </p>
      </div>

      {sendResult && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border text-[13px] animate-fade-in ${
          sendResult.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {sendResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {sendResult.message}
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${botOnline ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
            {botOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
          </div>
          <div>
            <p className="text-[11px] text-text-tertiary uppercase font-medium">Bot Server</p>
            <p className={`text-[14px] font-semibold ${botOnline ? 'text-green-600' : 'text-red-500'}`}>
              {botOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isConnected ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
            <Smartphone size={20} />
          </div>
          <div>
            <p className="text-[11px] text-text-tertiary uppercase font-medium">WhatsApp</p>
            <p className={`text-[14px] font-semibold ${isConnected ? 'text-green-600' : 'text-amber-600'}`}>
              {isConnected ? 'Connected' : needsQr ? 'Scan QR' : botOnline ? 'Connecting...' : 'N/A'}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[11px] text-text-tertiary uppercase font-medium">Daily At</p>
            <p className="text-[14px] font-semibold text-text-primary">{whatsappConfig.sendTime} IST</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-[11px] text-text-tertiary uppercase font-medium">Tasks Scanned</p>
            <p className="text-[14px] font-semibold text-text-primary">{tasks.length}</p>
          </div>
        </div>
      </div>

      {/* QR Code Banner */}
      {botOnline && needsQr && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
            <QrCode size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-[14px] font-semibold text-green-800">WhatsApp QR Code Ready</h3>
            <p className="text-[12px] text-green-700 mt-1">
              Open your terminal running the bot, or visit the QR page to scan with WhatsApp.
            </p>
            <p className="text-[11px] text-green-600 mt-1">
              WhatsApp → Settings → Linked Devices → Link a Device → Scan QR
            </p>
          </div>
          <a
            href={`${BOT_URL}/qr`}
            target="_blank"
            rel="noopener"
            className="px-4 py-2 bg-green-600 text-white text-[13px] font-medium rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
          >
            Open QR Page
          </a>
        </div>
      )}

      {/* Bot Offline Banner */}
      {!botOnline && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
          <h3 className="text-[14px] font-semibold text-amber-800 mb-2">WhatsApp Bot is not running</h3>
          <p className="text-[12px] text-amber-700 mb-3">Start the bot server to enable WhatsApp automation:</p>
          <div className="bg-amber-100 rounded-lg p-3 font-mono text-[12px] text-amber-900">
            cd whatsapp-bot && node index.js
          </div>
          <p className="text-[11px] text-amber-600 mt-2">
            The bot will show a QR code in the terminal. Scan it with WhatsApp to connect.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column: Settings + Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="text-[14px] font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Settings size={16} /> Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[13px] text-text-secondary">Enable Daily Summary</label>
                <button
                  onClick={() => setWhatsAppConfig({ enabled: !whatsappConfig.enabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${whatsappConfig.enabled ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${whatsappConfig.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">Send Time (IST)</label>
                <input
                  type="time"
                  value={whatsappConfig.sendTime}
                  onChange={(e) => setWhatsAppConfig({ sendTime: e.target.value })}
                  className="w-full px-3 py-2 text-[13px] border border-border rounded-lg focus:outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">WhatsApp Group Name</label>
                <input
                  type="text"
                  value={whatsappConfig.groupName}
                  onChange={(e) => setWhatsAppConfig({ groupName: e.target.value })}
                  className="w-full px-3 py-2 text-[13px] border border-border rounded-lg focus:outline-none focus:border-primary/50"
                  placeholder="Tirtam"
                />
                {groups.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-text-tertiary mb-1">Available groups:</p>
                    <div className="flex flex-wrap gap-1">
                      {groups.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setWhatsAppConfig({ groupName: g.name })}
                          className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                            whatsappConfig.groupName === g.name
                              ? 'bg-green-50 border-green-300 text-green-700'
                              : 'bg-surface-tertiary border-border text-text-tertiary hover:border-primary/30'
                          }`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={sendNow}
              disabled={sending || !isConnected}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white text-[13px] font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {sending ? 'Sending...' : 'Send Summary Now'}
            </button>
            {!isConnected && (
              <p className="text-[11px] text-text-tertiary text-center">Connect WhatsApp first to send messages</p>
            )}

            <button
              onClick={copyToClipboard}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-text-secondary text-[13px] font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Summary Text'}
            </button>

            <button
              onClick={checkBotStatus}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-text-tertiary text-[12px] font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={14} /> Refresh Status
            </button>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-text-primary">Message Preview</h2>
              <button onClick={() => setShowPreview(!showPreview)} className="text-[11px] text-primary hover:underline">
                {showPreview ? 'Collapse' : 'Expand'}
              </button>
            </div>
            {showPreview && (
              <div className="bg-[#e5ddd5] rounded-xl p-4 max-h-[600px] overflow-y-auto">
                <div className="bg-[#dcf8c6] rounded-xl p-3 shadow-sm max-w-[95%] ml-auto">
                  <img
                    src="https://www.tirtam.com/cdn/shop/files/Pi7-Image-Cropper.png?v=1779194222&width=360"
                    alt="Tirtam"
                    className="w-full rounded-lg mb-2"
                  />
                  <pre className="text-[11px] text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {summary}
                  </pre>
                  <p className="text-[9px] text-gray-500 text-right mt-2">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5">
            <h3 className="text-[13px] font-semibold text-blue-800 mb-3">How it works</h3>
            <ol className="space-y-2 text-[12px] text-blue-700">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
                <span>Run <code className="bg-blue-100 px-1 rounded text-[11px]">cd whatsapp-bot && node index.js</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
                <span>Scan the QR code with your WhatsApp (only needed once)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
                <span>Select your group name from the list above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">4</span>
                <span>Click "Send Summary Now" or enable daily auto-send</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">5</span>
                <span>The bot scans all tasks from database and sends a formatted report to your group</span>
              </li>
            </ol>
            <p className="text-[11px] text-blue-600 mt-3 italic">
              100% free. Uses whatsapp-web.js — no Twilio, no API costs.
              Session persists so you only scan QR once.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
