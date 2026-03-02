import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// In-memory token store (per session — resets on redeploy)
let tokenStore = {};

app.use(express.json());

// ─── Google OAuth: Start login ───
app.get("/auth/google", (req, res) => {
  const redirectUri = `${getBaseUrl(req)}/auth/callback`;
  const scopes = [
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/youtube.readonly",
  ].join(" ");

  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;

  res.redirect(url);
});

// ─── Google OAuth: Callback ───
app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing code");

  const redirectUri = `${getBaseUrl(req)}/auth/callback`;

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await response.json();

    if (tokens.error) {
      console.error("Token error:", tokens);
      return res.status(400).send(`Auth failed: ${tokens.error_description || tokens.error}`);
    }

    // Store tokens
    tokenStore = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + tokens.expires_in * 1000,
    };

    // Redirect back to the app
    res.redirect("/?connected=true");
  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).send("Authentication failed");
  }
});

// ─── Check auth status ───
app.get("/api/auth/status", (req, res) => {
  res.json({ connected: !!tokenStore.access_token });
});

// ─── Logout ───
app.post("/api/auth/logout", (req, res) => {
  tokenStore = {};
  res.json({ ok: true });
});

// ─── Refresh token if expired ───
async function getValidToken() {
  if (!tokenStore.access_token) return null;

  if (Date.now() > tokenStore.expires_at - 60000 && tokenStore.refresh_token) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: tokenStore.refresh_token,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
      }),
    });
    const data = await response.json();
    if (data.access_token) {
      tokenStore.access_token = data.access_token;
      tokenStore.expires_at = Date.now() + data.expires_in * 1000;
    }
  }

  return tokenStore.access_token;
}

// ─── YouTube Channel Info (Data API v3) ───
app.get("/api/youtube/channel", async (req, res) => {
  const token = await getValidToken();
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Channel API error:", err);
    res.status(500).json({ error: "Failed to fetch channel data" });
  }
});

// ─── YouTube Analytics ───
app.get("/api/youtube/analytics", async (req, res) => {
  const token = await getValidToken();
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  const { startDate, endDate } = req.query;
  const start = startDate || getDateDaysAgo(30);
  const end = endDate || getToday();

  try {
    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${start}&endDate=${end}&metrics=views,estimatedMinutesWatched,subscribersGained,estimatedRevenue,likes,comments,shares&dimensions=day&sort=day`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Analytics API error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ─── Top Videos ───
app.get("/api/youtube/top-videos", async (req, res) => {
  const token = await getValidToken();
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  const start = req.query.startDate || getDateDaysAgo(30);
  const end = req.query.endDate || getToday();

  try {
    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${start}&endDate=${end}&metrics=views,estimatedMinutesWatched,averageViewPercentage&dimensions=video&sort=-views&maxResults=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();

    // Get video titles from Data API
    if (data.rows && data.rows.length > 0) {
      try {
        const videoIds = data.rows.map(r => r[0]).join(",");
        console.log("Fetching titles for video IDs:", videoIds);
        const videosRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const videosData = await videosRes.json();
        console.log("Videos API response:", JSON.stringify(videosData).slice(0, 500));
        const titleMap = {};
        if (videosData.items) {
          videosData.items.forEach(v => { titleMap[v.id] = v.snippet.title; });
        }
        data.titleMap = titleMap;
      } catch (titleErr) {
        console.error("Failed to fetch video titles:", titleErr);
        data.titleMap = {};
      }
    }

    res.json(data);
  } catch (err) {
    console.error("Top videos error:", err);
    res.status(500).json({ error: "Failed to fetch top videos" });
  }
});

// ─── Traffic Sources ───
app.get("/api/youtube/traffic-sources", async (req, res) => {
  const token = await getValidToken();
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  const start = req.query.startDate || getDateDaysAgo(30);
  const end = req.query.endDate || getToday();

  try {
    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${start}&endDate=${end}&metrics=views&dimensions=insightTrafficSourceType&sort=-views`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Traffic sources error:", err);
    res.status(500).json({ error: "Failed to fetch traffic sources" });
  }
});

// ─── Demographics ───
app.get("/api/youtube/demographics", async (req, res) => {
  const token = await getValidToken();
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  const start = req.query.startDate || getDateDaysAgo(30);
  const end = req.query.endDate || getToday();

  try {
    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${start}&endDate=${end}&metrics=viewerPercentage&dimensions=ageGroup,gender`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Demographics error:", err);
    res.status(500).json({ error: "Failed to fetch demographics" });
  }
});

// ─── Individual Video Stats ───
app.get("/api/youtube/video/:videoId", async (req, res) => {
  const token = await getValidToken();
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  const { videoId } = req.params;
  const start = req.query.startDate || getDateDaysAgo(30);
  const end = req.query.endDate || getToday();

  try {
    // Fetch video snippet + statistics from Data API
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const videoData = await videoRes.json();

    // Fetch daily analytics for this video
    const analyticsRes = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${start}&endDate=${end}&filters=video==${videoId}&metrics=views,estimatedMinutesWatched,likes,comments,shares,subscribersGained,averageViewPercentage&dimensions=day&sort=day`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const analyticsData = await analyticsRes.json();

    // Fetch traffic sources for this video
    const trafficRes = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${start}&endDate=${end}&filters=video==${videoId}&metrics=views&dimensions=insightTrafficSourceType&sort=-views`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const trafficData = await trafficRes.json();

    res.json({
      video: videoData.items?.[0] || null,
      analytics: analyticsData,
      trafficSources: trafficData,
    });
  } catch (err) {
    console.error("Video detail error:", err);
    res.status(500).json({ error: "Failed to fetch video details" });
  }
});

// ─── Gemini Chat proxy ───
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not set" });

  try {
    // Convert OpenAI-style messages to Gemini format
    const messages = req.body.messages || [];
    const systemMsg = messages.find(m => m.role === "system")?.content || "";
    const chatMessages = messages.filter(m => m.role !== "system");

    const contents = chatMessages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
          contents,
          generationConfig: {},
        }),
      }
    );
    const data = await response.json();

    if (!response.ok) return res.status(response.status).json(data);

    // Convert Gemini response back to OpenAI-compatible format for frontend
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that.";
    res.json({
      choices: [{ message: { content: text } }],
    });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ error: "Failed to connect to Gemini" });
  }
});

// ─── Helpers ───
function getBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  return `${proto}://${req.headers.host}`;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getDateDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

// Serve static files from Vite build
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
