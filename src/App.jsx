import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ─── DEMO DATA ──────────────────────────────────────────────────────────────
const generateDemoData = () => {
  const days = 30;
  const now = new Date();
  const daily = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    daily.push({
      date: d.toISOString().split("T")[0],
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      views: Math.floor(800 + Math.random() * 1200 + (days - i) * 15),
      watchTimeHours: +(2 + Math.random() * 4 + (days - i) * 0.05).toFixed(1),
      subscribers: Math.floor(5 + Math.random() * 20),
      revenue: +(8 + Math.random() * 25).toFixed(2),
      likes: Math.floor(40 + Math.random() * 120),
      comments: Math.floor(5 + Math.random() * 30),
      shares: Math.floor(3 + Math.random() * 15),
    });
  }
  return daily;
};

const TRAFFIC_SOURCES = [
  { name: "YouTube Search", value: 38, color: "#FF4444" },
  { name: "Suggested Videos", value: 25, color: "#FF7744" },
  { name: "External", value: 18, color: "#FFAA33" },
  { name: "Browse Features", value: 12, color: "#44BBFF" },
  { name: "Direct", value: 7, color: "#88DDAA" },
];

const DEMOGRAPHICS = [
  { age: "13-17", male: 5, female: 3 },
  { age: "18-24", male: 22, female: 18 },
  { age: "25-34", male: 28, female: 20 },
  { age: "35-44", male: 12, female: 10 },
  { age: "45-54", male: 5, female: 4 },
  { age: "55-64", male: 2, female: 1 },
  { age: "65+", male: 1, female: 0.5 },
];

const TOP_VIDEOS = [
  { title: "How to Use AI for Business Growth", views: 12450, watchTime: 1840, ctr: 8.2 },
  { title: "Digital Transformation Guide 2025", views: 9870, watchTime: 1520, ctr: 7.5 },
  { title: "Leadership Skills Workshop Recap", views: 8340, watchTime: 1290, ctr: 6.8 },
  { title: "Future of Corporate Training", views: 7210, watchTime: 1150, ctr: 9.1 },
  { title: "Data Analytics for HR Teams", views: 6580, watchTime: 980, ctr: 5.9 },
];

const CHANNEL_INFO = {
  name: "FutureSkill Channel",
  subscribers: 15420,
  totalViews: 892340,
  totalVideos: 187,
  joinDate: "2019-03-15",
};

// ─── STYLES ─────────────────────────────────────────────────────────────────
const theme = {
  bg: "#0B0F1A",
  surface: "#111827",
  surfaceHover: "#1A2235",
  border: "#1E293B",
  borderLight: "#2D3A52",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  accent: "#FF4444",
  accentSoft: "rgba(255,68,68,0.12)",
  accentGlow: "rgba(255,68,68,0.25)",
  blue: "#3B82F6",
  green: "#22C55E",
  amber: "#F59E0B",
  purple: "#A855F7",
};

// ─── ICONS (inline SVG) ─────────────────────────────────────────────────────
const Icons = {
  youtube: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000"/>
      <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#fff"/>
    </svg>
  ),
  chat: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  report: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  send: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  dollar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  link: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  sparkle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  loader: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:"spin 1s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
};

// ─── METRIC CARD ────────────────────────────────────────────────────────────
const MetricCard = ({ icon, label, value, change, color }) => (
  <div style={{
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    transition: "all 0.2s",
    cursor: "default",
  }}
  onMouseEnter={e => {
    e.currentTarget.style.borderColor = theme.borderLight;
    e.currentTarget.style.transform = "translateY(-2px)";
  }}
  onMouseLeave={e => {
    e.currentTarget.style.borderColor = theme.border;
    e.currentTarget.style.transform = "translateY(0)";
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${color}18`, display: "flex",
        alignItems: "center", justifyContent: "center", color
      }}>{icon}</div>
      <span style={{ color: theme.textMuted, fontSize: 13, fontWeight: 500 }}>{label}</span>
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
      <span style={{ color: theme.text, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{value}</span>
      {change && (
        <span style={{
          fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
          background: change > 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
          color: change > 0 ? "#22C55E" : "#EF4444"
        }}>{change > 0 ? "+" : ""}{change}%</span>
      )}
    </div>
  </div>
);

// ─── CHAT MESSAGE ───────────────────────────────────────────────────────────
const ChatMessage = ({ role, content }) => (
  <div style={{
    display: "flex",
    justifyContent: role === "user" ? "flex-end" : "flex-start",
    marginBottom: 16,
    animation: "fadeSlideUp 0.3s ease",
  }}>
    <div style={{
      maxWidth: "80%",
      padding: "14px 18px",
      borderRadius: role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
      background: role === "user" ? theme.accent : theme.surface,
      border: role === "user" ? "none" : `1px solid ${theme.border}`,
      color: role === "user" ? "#fff" : theme.text,
      fontSize: 14,
      lineHeight: 1.6,
      whiteSpace: "pre-wrap",
    }}>{content}</div>
  </div>
);

// ─── REPORT COMPONENT ───────────────────────────────────────────────────────
const ReportView = ({ data, channelInfo, trafficSources, demographics, topVideos, onClose }) => {
  const reportRef = useRef(null);
  const period = data.length > 0 ? `${data[0].date} to ${data[data.length - 1].date}` : "N/A";
  const totalViews = data.reduce((s, d) => s + d.views, 0);
  const totalWatchTime = data.reduce((s, d) => s + d.watchTimeHours, 0).toFixed(1);
  const totalSubs = data.reduce((s, d) => s + d.subscribers, 0);
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0).toFixed(2);
  const avgViews = (totalViews / data.length).toFixed(0);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>YouTube Analytics Report</title>
      <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 28px; border-bottom: 3px solid #FF4444; padding-bottom: 12px; }
        h2 { font-size: 20px; color: #FF4444; margin-top: 32px; }
        .metric-row { display: flex; gap: 20px; margin: 20px 0; }
        .metric-box { flex: 1; background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: 700; color: #1a1a2e; }
        .metric-label { font-size: 12px; color: #666; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; font-weight: 600; font-size: 13px; }
        td { font-size: 13px; }
        .footer { margin-top: 40px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 16px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
        <h1>📊 YouTube Analytics Report</h1>
        <p><strong>Channel:</strong> ${channelInfo.name} &nbsp;|&nbsp; <strong>Period:</strong> ${period}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>

        <h2>📈 Key Metrics Overview</h2>
        <div class="metric-row">
          <div class="metric-box"><div class="metric-value">${totalViews.toLocaleString()}</div><div class="metric-label">Total Views</div></div>
          <div class="metric-box"><div class="metric-value">${totalWatchTime}h</div><div class="metric-label">Watch Time</div></div>
          <div class="metric-box"><div class="metric-value">+${totalSubs}</div><div class="metric-label">New Subscribers</div></div>
          <div class="metric-box"><div class="metric-value">$${totalRevenue}</div><div class="metric-label">Estimated Revenue</div></div>
        </div>
        <p>Average daily views: <strong>${avgViews}</strong></p>

        <h2>🎬 Top Performing Videos</h2>
        <table>
          <tr><th>#</th><th>Video Title</th><th>Views</th><th>Watch Time (min)</th><th>CTR</th></tr>
          ${topVideos.map((v, i) => `<tr><td>${i + 1}</td><td>${v.title}</td><td>${v.views.toLocaleString()}</td><td>${v.watchTime}</td><td>${v.ctr}%</td></tr>`).join("")}
        </table>

        <h2>🌍 Traffic Sources</h2>
        <table>
          <tr><th>Source</th><th>Percentage</th></tr>
          ${trafficSources.map(s => `<tr><td>${s.name}</td><td>${s.value}%</td></tr>`).join("")}
        </table>

        <h2>👥 Demographics</h2>
        <table>
          <tr><th>Age Group</th><th>Male %</th><th>Female %</th></tr>
          ${demographics.map(d => `<tr><td>${d.age}</td><td>${d.male}%</td><td>${d.female}%</td></tr>`).join("")}
        </table>

        <h2>💡 AI-Generated Insights</h2>
        <ul>
          <li>Your AI-related content performs 40% better than average — consider doubling down on this topic.</li>
          <li>The 25-34 age group is your strongest demographic. Tailor content to their professional development needs.</li>
          <li>YouTube Search drives 38% of traffic — optimize titles and descriptions for SEO.</li>
          <li>CTR of 9.1% on "Future of Corporate Training" suggests strong thumbnail/title performance worth replicating.</li>
          <li>Weekend uploads show 15% lower initial views — consider weekday publishing schedule.</li>
        </ul>

        <div class="footer">
          Report generated by YouTube Analytics AI Assistant &nbsp;|&nbsp; Powered by Gemini API<br/>
          ${new Date().toISOString()}
        </div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}`,
        maxWidth: 700, width: "100%", maxHeight: "85vh", overflow: "auto", padding: 32,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ color: theme.text, fontSize: 22, fontWeight: 700, margin: 0 }}>📊 Analytics Report Preview</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handlePrint} style={{
              background: theme.accent, color: "#fff", border: "none", borderRadius: 10,
              padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 13,
              display: "flex", alignItems: "center", gap: 6
            }}>{Icons.download} Export PDF</button>
            <button onClick={onClose} style={{
              background: theme.surfaceHover, color: theme.textMuted, border: `1px solid ${theme.border}`,
              borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontSize: 13
            }}>Close</button>
          </div>
        </div>

        <div style={{ color: theme.textMuted, fontSize: 13, marginBottom: 20 }}>
          <strong style={{ color: theme.text }}>{channelInfo.name}</strong> — {period}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Views", value: totalViews.toLocaleString() },
            { label: "Watch Time", value: `${totalWatchTime}h` },
            { label: "New Subscribers", value: `+${totalSubs}` },
            { label: "Revenue", value: `$${totalRevenue}` },
          ].map((m, i) => (
            <div key={i} style={{
              background: theme.bg, borderRadius: 12, padding: 16, textAlign: "center",
              border: `1px solid ${theme.border}`
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: theme.text }}>{m.value}</div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>

        <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Top Videos</h3>
        {topVideos.slice(0, 3).map((v, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", padding: "10px 0",
            borderBottom: `1px solid ${theme.border}`, fontSize: 13
          }}>
            <span style={{ color: theme.text }}>{i + 1}. {v.title}</span>
            <span style={{ color: theme.textMuted }}>{v.views.toLocaleString()} views</span>
          </div>
        ))}

        <p style={{ color: theme.textDim, fontSize: 12, marginTop: 24, textAlign: "center" }}>
          Click "Export PDF" to generate a full detailed report in your browser's print dialog.
        </p>
      </div>
    </div>
  );
};

// ─── SETTINGS PAGE ──────────────────────────────────────────────────────────
const SettingsPage = ({ connected, onConnect, onDisconnect, channelName }) => (
  <div style={{ maxWidth: 640, margin: "0 auto" }}>
    <h2 style={{ color: theme.text, fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Settings</h2>
    <p style={{ color: theme.textMuted, fontSize: 14, marginBottom: 32 }}>Configure your YouTube Analytics connection and preferences.</p>

    <div style={{
      background: theme.surface, border: `1px solid ${theme.border}`,
      borderRadius: 16, padding: 24, marginBottom: 20
    }}>
      <h3 style={{ color: theme.text, fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        {Icons.youtube} YouTube Connection
      </h3>

      {connected ? (
        <div>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: 14,
            background: "rgba(34,197,94,0.08)", borderRadius: 10, marginBottom: 16
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
            <span style={{ color: "#22C55E", fontSize: 14, fontWeight: 500 }}>Connected to YouTube Analytics</span>
          </div>
          <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 16 }}>
            Channel: <strong style={{ color: theme.text }}>{channelName}</strong><br/>
            Your YouTube account is connected and syncing real data.
          </p>
          <button onClick={onDisconnect} style={{
            background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 500
          }}>Disconnect</button>
        </div>
      ) : (
        <div>
          <p style={{ color: theme.textMuted, fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>
            To connect your YouTube channel, you need to set up OAuth 2.0 credentials in Google Cloud Console.
          </p>
          <div style={{
            background: theme.bg, borderRadius: 10, padding: 16,
            border: `1px solid ${theme.border}`, marginBottom: 20
          }}>
            <p style={{ color: theme.textMuted, fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: "0.05em" }}>SETUP STEPS:</p>
            {[
              "Go to Google Cloud Console → Create a project",
              "Enable YouTube Analytics API & YouTube Data API v3",
              "Create OAuth 2.0 credentials (Web application)",
              "Add authorized redirect URI for your app",
              "Copy Client ID and paste below",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13, color: theme.text }}>
                <span style={{ color: theme.accent, fontWeight: 600, minWidth: 20 }}>{i + 1}.</span>
                {step}
              </div>
            ))}
          </div>
          <button onClick={onConnect} style={{
            background: theme.accent, color: "#fff", border: "none", borderRadius: 10,
            padding: "12px 24px", cursor: "pointer", fontSize: 14, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8
          }}>
            {Icons.youtube} Connect YouTube Account
          </button>
        </div>
      )}
    </div>

    <div style={{
      background: theme.surface, border: `1px solid ${theme.border}`,
      borderRadius: 16, padding: 24
    }}>
      <h3 style={{ color: theme.text, fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        {Icons.sparkle} AI Configuration
      </h3>
      <p style={{ color: theme.textMuted, fontSize: 13, lineHeight: 1.7 }}>
        This app uses the <strong style={{ color: theme.text }}>Google Gemini API</strong> to power the conversational analytics.
        Gemini analyzes your YouTube data and generates insights, answers questions, and creates reports.
      </p>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: 14,
        background: "rgba(59,130,246,0.08)", borderRadius: 10, marginTop: 16
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: theme.blue }} />
        <span style={{ color: theme.blue, fontSize: 13, fontWeight: 500 }}>Gemini API: Active</span>
      </div>
    </div>
  </div>
);

// ─── VIDEO DETAIL VIEW ─────────────────────────────────────────────────────
const VideoDetailView = ({ videoId, onBack }) => {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/youtube/video/${videoId}`)
      .then(r => r.json())
      .then(d => { setVideoData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [videoId]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300, color: theme.textMuted }}>
      <div style={{ textAlign: "center" }}>{Icons.loader}<p style={{ marginTop: 12, fontSize: 13 }}>Loading video stats...</p></div>
    </div>
  );

  if (!videoData?.video) return (
    <div style={{ textAlign: "center", padding: 40, color: theme.textMuted }}>
      <p>Could not load video data.</p>
      <button onClick={onBack} style={{ marginTop: 16, background: theme.surface, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>Go Back</button>
    </div>
  );

  const v = videoData.video;
  const stats = v.statistics || {};
  const daily = videoData.analytics?.rows?.map(row => {
    const d = new Date(row[0]);
    return { date: row[0], label: `${d.getMonth()+1}/${d.getDate()}`, views: row[1]||0, watchTime: +((row[2]||0)/60).toFixed(1), likes: row[3]||0, comments: row[4]||0, shares: row[5]||0, subs: row[6]||0, avgView: +(row[7]||0).toFixed(1) };
  }) || [];

  const trafficColors = ["#FF4444","#FF7744","#FFAA33","#44BBFF","#88DDAA","#A855F7","#F59E0B","#EC4899"];
  const trafficRows = videoData.trafficSources?.rows || [];
  const trafficTotal = trafficRows.reduce((s,r) => s + r[1], 0);
  const traffic = trafficRows.map((r,i) => ({
    name: r[0].replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase()),
    value: trafficTotal > 0 ? +((r[1]/trafficTotal)*100).toFixed(1) : 0,
    views: r[1], color: trafficColors[i % trafficColors.length]
  }));

  const totalViews = daily.reduce((s,d) => s+d.views, 0);
  const totalLikes = daily.reduce((s,d) => s+d.likes, 0);
  const totalComments = daily.reduce((s,d) => s+d.comments, 0);
  const totalShares = daily.reduce((s,d) => s+d.shares, 0);

  return (
    <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
      <button onClick={onBack} style={{
        background: "transparent", color: theme.textMuted, border: "none", cursor: "pointer",
        fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 20, padding: 0
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Dashboard
      </button>

      <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
        <img src={v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url}
          style={{ width: 280, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} alt="" />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ color: theme.text, fontSize: 20, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{v.snippet?.title}</h1>
          <p style={{ color: theme.textDim, fontSize: 12, marginBottom: 12 }}>
            Published: {v.snippet?.publishedAt?.split("T")[0]} &bull; {stats.viewCount ? parseInt(stats.viewCount).toLocaleString() : "N/A"} total views
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "Likes", val: parseInt(stats.likeCount||0).toLocaleString() },
              { label: "Comments", val: parseInt(stats.commentCount||0).toLocaleString() },
            ].map((m,i) => (
              <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 16px" }}>
                <div style={{ color: theme.textDim, fontSize: 11 }}>{m.label}</div>
                <div style={{ color: theme.text, fontSize: 16, fontWeight: 600 }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        <MetricCard icon={Icons.eye} label="Views (30d)" value={totalViews.toLocaleString()} change={0} color={theme.accent} />
        <MetricCard icon={Icons.clock} label="Avg View %" value={daily.length > 0 ? `${(daily.reduce((s,d)=>s+d.avgView,0)/daily.length).toFixed(1)}%` : "N/A"} change={0} color={theme.blue} />
        <MetricCard icon={Icons.users} label="Likes (30d)" value={totalLikes.toLocaleString()} change={0} color={theme.green} />
        <MetricCard icon={Icons.dollar} label="Shares (30d)" value={totalShares.toLocaleString()} change={0} color={theme.amber} />
      </div>

      {daily.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24 }}>
            <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Daily Views</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={daily}>
                <defs><linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={theme.accent} stopOpacity={0.3}/><stop offset="100%" stopColor={theme.accent} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid stroke={theme.border} strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="label" tick={{fill:theme.textDim,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:theme.textDim,fontSize:10}} axisLine={false} tickLine={false} width={45}/>
                <Tooltip contentStyle={{background:theme.surface,border:`1px solid ${theme.border}`,borderRadius:8,fontSize:12}}/>
                <Area type="monotone" dataKey="views" stroke={theme.accent} fill="url(#vGrad)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24 }}>
            <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Engagement</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={daily}>
                <CartesianGrid stroke={theme.border} strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="label" tick={{fill:theme.textDim,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:theme.textDim,fontSize:10}} axisLine={false} tickLine={false} width={35}/>
                <Tooltip contentStyle={{background:theme.surface,border:`1px solid ${theme.border}`,borderRadius:8,fontSize:12}}/>
                <Bar dataKey="likes" fill={theme.green} radius={[3,3,0,0]} barSize={6} name="Likes"/>
                <Bar dataKey="comments" fill={theme.blue} radius={[3,3,0,0]} barSize={6} name="Comments"/>
                <Bar dataKey="shares" fill={theme.amber} radius={[3,3,0,0]} barSize={6} name="Shares"/>
                <Legend wrapperStyle={{fontSize:11,color:theme.textMuted}}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {traffic.length > 0 && (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Traffic Sources</h3>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <ResponsiveContainer width="100%" height={200} minWidth={200}>
              <PieChart>
                <Pie data={traffic} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {traffic.map((e,i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip contentStyle={{background:theme.surface,border:`1px solid ${theme.border}`,borderRadius:8,fontSize:12}}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start" }}>
              {traffic.map((s,i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: theme.textMuted, minWidth: 140 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }}/>
                  {s.name} ({s.value}%)
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── DATE RANGE PICKER ─────────────────────────────────────────────────────
const DateRangePicker = ({ startDate, endDate, onChange }) => (
  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
    <input type="date" value={startDate} onChange={e => onChange(e.target.value, endDate)}
      style={{ background: theme.surface, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, outline: "none" }} />
    <span style={{ color: theme.textDim, fontSize: 12 }}>to</span>
    <input type="date" value={endDate} onChange={e => onChange(startDate, e.target.value)}
      style={{ background: theme.surface, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, outline: "none" }} />
    {[{label:"7D",days:7},{label:"30D",days:30},{label:"90D",days:90}].map(p => (
      <button key={p.label} onClick={() => { const e = new Date(); const s = new Date(); s.setDate(s.getDate()-p.days); onChange(s.toISOString().split("T")[0], e.toISOString().split("T")[0]); }}
        style={{ background: theme.surface, color: theme.textMuted, border: `1px solid ${theme.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontWeight: 500 }}>
        {p.label}
      </button>
    ))}
  </div>
);

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState(generateDemoData);
  const [channelInfo, setChannelInfo] = useState(CHANNEL_INFO);
  const [trafficSources, setTrafficSources] = useState(TRAFFIC_SOURCES);
  const [demographics, setDemographics] = useState(DEMOGRAPHICS);
  const [topVideos, setTopVideos] = useState(TOP_VIDEOS);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date().toISOString().split("T")[0];
    const s = new Date(); s.setDate(s.getDate() - 30);
    return { start: s.toISOString().split("T")[0], end };
  });
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hi! I'm your YouTube Analytics AI Assistant. I have access to your channel data and can help you understand your performance, identify trends, and generate reports.\n\nTry asking me things like:\n• \"How are my views trending this month?\"\n• \"Which video performed best?\"\n• \"What demographics should I target?\"\n• \"Generate a weekly report\"" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check auth status on load & URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      window.history.replaceState({}, "", "/");
    }
    fetch("/api/auth/status").then(r => r.json()).then(d => {
      setConnected(d.connected);
      if (d.connected) fetchAllYouTubeData();
    }).catch(() => {});
  }, []);

  const fetchAllYouTubeData = async (start, end) => {
    const qs = `startDate=${start || dateRange.start}&endDate=${end || dateRange.end}`;
    try {
      // Fetch channel info
      const chRes = await fetch("/api/youtube/channel");
      const chData = await chRes.json();
      if (chData.items?.[0]) {
        const ch = chData.items[0];
        setChannelInfo({
          name: ch.snippet.title,
          subscribers: parseInt(ch.statistics.subscriberCount) || 0,
          totalViews: parseInt(ch.statistics.viewCount) || 0,
          totalVideos: parseInt(ch.statistics.videoCount) || 0,
          joinDate: ch.snippet.publishedAt?.split("T")[0] || "",
        });
      }

      // Fetch daily analytics
      const anRes = await fetch(`/api/youtube/analytics?${qs}`);
      const anData = await anRes.json();
      if (anData.rows?.length > 0) {
        const daily = anData.rows.map(row => {
          const d = new Date(row[0]);
          return {
            date: row[0],
            label: `${d.getMonth() + 1}/${d.getDate()}`,
            views: row[1] || 0,
            watchTimeHours: +((row[2] || 0) / 60).toFixed(1),
            subscribers: row[3] || 0,
            revenue: +(row[4] || 0).toFixed(2),
            likes: row[5] || 0,
            comments: row[6] || 0,
            shares: row[7] || 0,
          };
        });
        setData(daily);
      }

      // Fetch top videos
      const tvRes = await fetch(`/api/youtube/top-videos?${qs}`);
      const tvData = await tvRes.json();
      if (tvData.rows?.length > 0) {
        setTopVideos(tvData.rows.map(row => ({
          videoId: row[0],
          title: tvData.titleMap?.[row[0]] || row[0],
          views: row[1] || 0,
          watchTime: row[2] || 0,
          ctr: +(row[3] || 0).toFixed(1),
        })));
      }

      // Fetch traffic sources
      const tsRes = await fetch(`/api/youtube/traffic-sources?${qs}`);
      const tsData = await tsRes.json();
      if (tsData.rows?.length > 0) {
        const colors = ["#FF4444", "#FF7744", "#FFAA33", "#44BBFF", "#88DDAA", "#A855F7", "#F59E0B"];
        const total = tsData.rows.reduce((s, r) => s + r[1], 0);
        setTrafficSources(tsData.rows.map((row, i) => ({
          name: row[0].replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          value: total > 0 ? +((row[1] / total) * 100).toFixed(1) : 0,
          color: colors[i % colors.length],
        })));
      }

      // Fetch demographics
      const dmRes = await fetch(`/api/youtube/demographics?${qs}`);
      const dmData = await dmRes.json();
      if (dmData.rows?.length > 0) {
        const demoMap = {};
        dmData.rows.forEach(row => {
          const age = row[0].replace("age", "");
          if (!demoMap[age]) demoMap[age] = { age, male: 0, female: 0 };
          if (row[1] === "male") demoMap[age].male = +(row[2] || 0).toFixed(1);
          else demoMap[age].female = +(row[2] || 0).toFixed(1);
        });
        setDemographics(Object.values(demoMap));
      }
    } catch (err) {
      console.error("Failed to fetch YouTube data:", err);
    }
  };

  const handleConnect = () => {
    window.location.href = "/auth/google";
  };

  const handleDisconnect = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setConnected(false);
    setData(generateDemoData());
    setChannelInfo(CHANNEL_INFO);
    setTrafficSources(TRAFFIC_SOURCES);
    setDemographics(DEMOGRAPHICS);
    setTopVideos(TOP_VIDEOS);
  };

  const handleDateChange = (start, end) => {
    setDateRange({ start, end });
    if (connected) fetchAllYouTubeData(start, end);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildAnalyticsContext = useCallback(() => {
    const totalViews = data.reduce((s, d) => s + d.views, 0);
    const totalWatchTime = data.reduce((s, d) => s + d.watchTimeHours, 0).toFixed(1);
    const totalSubs = data.reduce((s, d) => s + d.subscribers, 0);
    const totalRevenue = data.reduce((s, d) => s + d.revenue, 0).toFixed(2);
    const avgViews = (totalViews / data.length).toFixed(0);
    const last7 = data.slice(-7);
    const prev7 = data.slice(-14, -7);
    const last7Views = last7.reduce((s, d) => s + d.views, 0);
    const prev7Views = prev7.reduce((s, d) => s + d.views, 0);
    const viewsChange = prev7Views > 0 ? (((last7Views - prev7Views) / prev7Views) * 100).toFixed(1) : 0;

    return `
YOUTUBE CHANNEL ANALYTICS DATA:
Channel: ${channelInfo.name}
Total Subscribers: ${channelInfo.subscribers.toLocaleString()}
Total Videos: ${channelInfo.totalVideos}
Period: Last 30 days (${data[0]?.date || "N/A"} to ${data[data.length - 1]?.date || "N/A"})

SUMMARY METRICS (30 days):
- Total Views: ${totalViews.toLocaleString()}
- Total Watch Time: ${totalWatchTime} hours
- New Subscribers: +${totalSubs}
- Estimated Revenue: $${totalRevenue}
- Average Daily Views: ${avgViews}
- Views trend (7d vs prev 7d): ${viewsChange}%

TOP VIDEOS:
${topVideos.map((v, i) => `${i + 1}. "${v.title}" - ${v.views.toLocaleString()} views, ${v.watchTime} min watch time, ${v.ctr}% CTR`).join("\n")}

TRAFFIC SOURCES:
${trafficSources.map(s => `- ${s.name}: ${s.value}%`).join("\n")}

DEMOGRAPHICS:
${demographics.map(d => `- Age ${d.age}: Male ${d.male}%, Female ${d.female}%`).join("\n")}

DAILY DATA (last 7 days):
${last7.map(d => `${d.date}: ${d.views} views, ${d.watchTimeHours}h watch time, +${d.subscribers} subs, $${d.revenue} revenue`).join("\n")}
    `.trim();
  }, [data, channelInfo, topVideos, trafficSources, demographics]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.0-flash",
          max_tokens: 1000,
          messages: [
            { role: "system", content: `You are a YouTube Analytics AI Assistant. You have full access to the channel's analytics data provided below. Answer questions about the data conversationally, provide insights, identify trends, and give actionable recommendations. Be specific with numbers. Keep responses concise but insightful. If the user asks for a report, tell them you've prepared the data and they can click the "Generate Report" button in the Reports tab.\n\n${buildAnalyticsContext()}` },
            ...messages.filter(m => m.role !== "assistant" || messages.indexOf(m) !== 0).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg }
          ].slice(-12),
        }),
      });
      const result = await response.json();
      const text = result.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: text }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Error connecting to AI. Please check your connection and try again." }]);
    }
    setLoading(false);
  };

  const totalViews = data.reduce((s, d) => s + d.views, 0);
  const totalWatchTime = data.reduce((s, d) => s + d.watchTimeHours, 0).toFixed(1);
  const totalSubs = data.reduce((s, d) => s + d.subscribers, 0);
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0).toFixed(2);
  const last7Views = data.slice(-7).reduce((s, d) => s + d.views, 0);
  const prev7Views = data.slice(-14, -7).reduce((s, d) => s + d.views, 0);
  const viewsChange = prev7Views > 0 ? +((last7Views - prev7Views) / prev7Views * 100).toFixed(1) : 0;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Icons.dashboard },
    { id: "chat", label: "Ask AI", icon: Icons.chat },
    { id: "reports", label: "Reports", icon: Icons.report },
    { id: "settings", label: "Settings", icon: Icons.settings },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.bg,
      fontFamily: "'DM Sans', 'SF Pro Display', system-ui, -apple-system, sans-serif",
      display: "flex",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 3px; }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        input:focus, textarea:focus { outline: none; }
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .main-content { padding: 16px !important; }
          .metric-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .chart-grid { grid-template-columns: 1fr !important; }
          .header-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
        }
        @media (max-width: 480px) {
          .metric-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── MOBILE NAV ── */}
      <div style={{
        display: "none", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: theme.surface, borderTop: `1px solid ${theme.border}`,
        padding: "8px 0", justifyContent: "space-around",
      }} className="mobile-nav">
        {navItems.map(item => (
          <button key={item.id} onClick={() => { setPage(item.id); setSelectedVideoId(null); }} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            background: "transparent", border: "none", cursor: "pointer", padding: "4px 12px",
            color: page === item.id ? theme.accent : theme.textMuted, fontSize: 10
          }}>{item.icon}<span>{item.label}</span></button>
        ))}
      </div>
      <style>{`@media (max-width: 768px) { .mobile-nav { display: flex !important; } }`}</style>

      {/* ── SIDEBAR ── */}
      <div className="sidebar" style={{
        width: 220, background: theme.surface, borderRight: `1px solid ${theme.border}`,
        display: "flex", flexDirection: "column", padding: "20px 12px",
        position: "sticky", top: 0, height: "100vh",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "0 12px", marginBottom: 32
        }}>
          {Icons.youtube}
          <div>
            <div style={{ color: theme.text, fontSize: 15, fontWeight: 700 }}>YT Analytics</div>
            <div style={{ color: theme.textDim, fontSize: 11 }}>AI Assistant</div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
              borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13,
              fontWeight: page === item.id ? 600 : 400, transition: "all 0.15s",
              background: page === item.id ? theme.accentSoft : "transparent",
              color: page === item.id ? theme.accent : theme.textMuted,
            }}>{item.icon}{item.label}</button>
          ))}
        </nav>

        <div style={{
          padding: 14, borderRadius: 12,
          background: connected ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
          border: `1px solid ${connected ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: connected ? "#22C55E" : "#EF4444"
            }} />
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: connected ? "#22C55E" : "#EF4444"
            }}>{connected ? "Connected" : "Disconnected"}</span>
          </div>
          <div style={{ fontSize: 11, color: theme.textDim }}>
            {connected ? channelInfo.name : "No channel linked"}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="main-content" style={{ flex: 1, padding: "28px 32px", overflowY: "auto", maxHeight: "100vh", paddingBottom: 80 }}>

        {/* ── VIDEO DETAIL ── */}
        {page === "dashboard" && selectedVideoId && (
          <VideoDetailView videoId={selectedVideoId} onBack={() => setSelectedVideoId(null)} />
        )}

        {/* ── DASHBOARD ── */}
        {page === "dashboard" && connected && !selectedVideoId && (
          <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
            <div className="header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ color: theme.text, fontSize: 26, fontWeight: 700 }}>Dashboard</h1>
                <p style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>{dateRange.start} to {dateRange.end}</p>
              </div>
              <button onClick={() => { setPage("chat"); setTimeout(() => inputRef.current?.focus(), 100); }} style={{
                background: theme.accentSoft, color: theme.accent, border: `1px solid ${theme.accentGlow}`,
                borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontSize: 13,
                fontWeight: 600, display: "flex", alignItems: "center", gap: 6
              }}>{Icons.sparkle} Ask AI about this data</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <DateRangePicker startDate={dateRange.start} endDate={dateRange.end} onChange={handleDateChange} />
            </div>

            <div className="metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
              <MetricCard icon={Icons.eye} label="Total Views" value={totalViews.toLocaleString()} change={viewsChange} color={theme.accent} />
              <MetricCard icon={Icons.clock} label="Watch Time" value={`${totalWatchTime}h`} change={12.3} color={theme.blue} />
              <MetricCard icon={Icons.users} label="New Subscribers" value={`+${totalSubs}`} change={8.7} color={theme.green} />
              <MetricCard icon={Icons.dollar} label="Revenue" value={`$${totalRevenue}`} change={5.2} color={theme.amber} />
            </div>

            <div className="chart-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{
                background: theme.surface, border: `1px solid ${theme.border}`,
                borderRadius: 16, padding: 24
              }}>
                <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Views & Watch Time Trend</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.slice(-14)}>
                    <defs>
                      <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={theme.accent} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={theme.border} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fill: theme.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: theme.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12 }}
                      labelStyle={{ color: theme.textMuted }}
                      itemStyle={{ color: theme.text }}
                    />
                    <Area type="monotone" dataKey="views" stroke={theme.accent} fill="url(#viewsGrad)" strokeWidth={2} />
                    <Line type="monotone" dataKey="watchTimeHours" stroke={theme.blue} strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{
                background: theme.surface, border: `1px solid ${theme.border}`,
                borderRadius: 16, padding: 24
              }}>
                <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Traffic Sources</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={trafficSources} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {trafficSources.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {trafficSources.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: theme.textMuted }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="chart-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{
                background: theme.surface, border: `1px solid ${theme.border}`,
                borderRadius: 16, padding: 24
              }}>
                <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Top Videos</h3>
                {topVideos.map((v, i) => (
                  <div key={i} onClick={() => v.videoId && setSelectedVideoId(v.videoId)} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 0", borderBottom: i < topVideos.length - 1 ? `1px solid ${theme.border}` : "none",
                    cursor: v.videoId ? "pointer" : "default", borderRadius: 8, transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if(v.videoId) e.currentTarget.style.background = theme.surfaceHover; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                      <span style={{ color: theme.textDim, fontSize: 12, fontWeight: 600, minWidth: 20 }}>#{i + 1}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: theme.text, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</div>
                        <div style={{ color: theme.textDim, fontSize: 11, marginTop: 2 }}>{v.views.toLocaleString()} views • {v.ctr}% CTR</div>
                      </div>
                    </div>
                    {v.videoId && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.textDim} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>}
                  </div>
                ))}
              </div>

              <div style={{
                background: theme.surface, border: `1px solid ${theme.border}`,
                borderRadius: 16, padding: 24
              }}>
                <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Demographics</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={demographics} layout="vertical">
                    <CartesianGrid stroke={theme.border} strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fill: theme.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="age" type="category" tick={{ fill: theme.textDim, fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
                    <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="male" fill={theme.blue} radius={[0, 4, 4, 0]} barSize={10} name="Male" />
                    <Bar dataKey="female" fill={theme.purple} radius={[0, 4, 4, 0]} barSize={10} name="Female" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {page === "dashboard" && !connected && !selectedVideoId && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: "70vh", textAlign: "center"
          }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>📊</div>
            <h2 style={{ color: theme.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Connect Your YouTube Channel</h2>
            <p style={{ color: theme.textMuted, fontSize: 14, maxWidth: 400, marginBottom: 24 }}>
              Link your YouTube account to start viewing analytics and chatting with your data.
            </p>
            <button onClick={() => setPage("settings")} style={{
              background: theme.accent, color: "#fff", border: "none", borderRadius: 12,
              padding: "14px 28px", cursor: "pointer", fontSize: 15, fontWeight: 600
            }}>Go to Settings</button>
          </div>
        )}

        {/* ── CHAT ── */}
        {page === "chat" && (
          <div style={{
            display: "flex", flexDirection: "column", height: "calc(100vh - 56px)",
            animation: "fadeSlideUp 0.3s ease"
          }}>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ color: theme.text, fontSize: 26, fontWeight: 700 }}>Ask AI</h1>
              <p style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>Chat with your YouTube Analytics data</p>
            </div>

            <div style={{
              flex: 1, overflowY: "auto", padding: "16px 0",
              display: "flex", flexDirection: "column"
            }}>
              {messages.map((msg, i) => (
                <ChatMessage key={i} role={msg.role} content={msg.content} />
              ))}
              {loading && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "14px 18px", color: theme.textMuted, fontSize: 13,
                  animation: "pulse 1.5s ease infinite"
                }}>
                  {Icons.loader} Analyzing your data...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{
              display: "flex", gap: 10, padding: "16px 0",
              borderTop: `1px solid ${theme.border}`
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask about your YouTube analytics..."
                style={{
                  flex: 1, background: theme.surface, border: `1px solid ${theme.border}`,
                  borderRadius: 14, padding: "14px 18px", color: theme.text, fontSize: 14,
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = theme.accent}
                onBlur={e => e.target.style.borderColor = theme.border}
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
                background: input.trim() ? theme.accent : theme.surfaceHover,
                color: input.trim() ? "#fff" : theme.textDim,
                border: "none", borderRadius: 14, width: 50, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s", opacity: loading ? 0.5 : 1,
              }}>{Icons.send}</button>
            </div>

            {/* Quick suggestions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 8 }}>
              {[
                "How are my views trending?",
                "Which video has the best CTR?",
                "What's my revenue this month?",
                "Summarize my demographics",
              ].map((q, i) => (
                <button key={i} onClick={() => { setInput(q); setTimeout(sendMessage, 50); }} style={{
                  background: theme.surface, border: `1px solid ${theme.border}`,
                  borderRadius: 20, padding: "7px 14px", fontSize: 12,
                  color: theme.textMuted, cursor: "pointer", whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.target.style.borderColor = theme.accent; e.target.style.color = theme.accent; }}
                onMouseLeave={e => { e.target.style.borderColor = theme.border; e.target.style.color = theme.textMuted; }}
                >{q}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── REPORTS ── */}
        {page === "reports" && (
          <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
            <h1 style={{ color: theme.text, fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Reports</h1>
            <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 32 }}>Generate and export analytics reports.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{
                background: theme.surface, border: `1px solid ${theme.border}`,
                borderRadius: 16, padding: 28
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: theme.accentSoft, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  marginBottom: 16, color: theme.accent
                }}>{Icons.report}</div>
                <h3 style={{ color: theme.text, fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Weekly Report</h3>
                <p style={{ color: theme.textMuted, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                  Comprehensive 7-day performance overview with key metrics, top videos, traffic sources, demographics, and AI-generated insights.
                </p>
                <button onClick={() => setShowReport(true)} style={{
                  background: theme.accent, color: "#fff", border: "none", borderRadius: 10,
                  padding: "12px 22px", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 8
                }}>{Icons.download} Generate Weekly Report</button>
              </div>

              <div style={{
                background: theme.surface, border: `1px solid ${theme.border}`,
                borderRadius: 16, padding: 28
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: "rgba(59,130,246,0.12)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  marginBottom: 16, color: theme.blue
                }}>{Icons.sparkle}</div>
                <h3 style={{ color: theme.text, fontSize: 17, fontWeight: 600, marginBottom: 8 }}>On-Demand Report</h3>
                <p style={{ color: theme.textMuted, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                  Ask AI to generate a custom report on any aspect of your channel — specific videos, time periods, growth analysis, or competitor insights.
                </p>
                <button onClick={() => { setPage("chat"); setInput("Generate a detailed performance report focusing on my top videos and what's driving growth."); }} style={{
                  background: theme.blue, color: "#fff", border: "none", borderRadius: 10,
                  padding: "12px 22px", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 8
                }}>{Icons.chat} Ask AI to Generate</button>
              </div>
            </div>

            <div style={{
              marginTop: 24, background: theme.surface, border: `1px solid ${theme.border}`,
              borderRadius: 16, padding: 24
            }}>
              <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Recent Reports</h3>
              {[
                { name: "Weekly Report — Feb 24-Mar 2, 2026", date: "Mar 2, 2026", type: "Weekly" },
                { name: "Weekly Report — Feb 17-23, 2026", date: "Feb 23, 2026", type: "Weekly" },
                { name: "Custom: Top Video Analysis", date: "Feb 20, 2026", type: "On-demand" },
              ].map((r, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 0", borderBottom: i < 2 ? `1px solid ${theme.border}` : "none"
                }}>
                  <div>
                    <div style={{ color: theme.text, fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                    <div style={{ color: theme.textDim, fontSize: 11, marginTop: 3 }}>{r.date} • {r.type}</div>
                  </div>
                  <button onClick={() => setShowReport(true)} style={{
                    background: "transparent", color: theme.textMuted, border: `1px solid ${theme.border}`,
                    borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12,
                    display: "flex", alignItems: "center", gap: 4
                  }}>{Icons.link} View</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {page === "settings" && (
          <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
            <SettingsPage
              connected={connected}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              channelName={channelInfo.name}
            />
          </div>
        )}
      </div>

      {showReport && (
        <ReportView
          data={data}
          channelInfo={channelInfo}
          trafficSources={trafficSources}
          demographics={demographics}
          topVideos={topVideos}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}