export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // API Health check response for automated probes
    if (url.pathname === "/health" || url.pathname === "/api/health") {
      return new Response(
        JSON.stringify(
          {
            status: "maintenance",
            service: "context-0",
            title: "Context0 Adaptive Quiz Platform",
            notice: "Retiring legacy Render container infrastructure; migrating to Cloudflare Edge Native (Workers + D1).",
            dataSafety: "100% backed up in git",
            timestamp: new Date().toISOString(),
          },
          null,
          2
        ),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache",
          },
        }
      );
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Context0 // Planned Maintenance & Edge Evolution</title>
  <meta name="description" content="Context0 is undergoing migration to Cloudflare Edge Native architecture. Retiring container cold starts for sub-15ms edge compute." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Nunito+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #050608;
      --card-bg: rgba(13, 16, 24, 0.78);
      --accent-violet: #a855f7;
      --accent-cyan: #06b6d4;
      --accent-amber: #f59e0b;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --border: rgba(255, 255, 255, 0.12);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Nunito Sans', -apple-system, sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      selection-background-color: rgba(168, 85, 247, 0.3);
    }

    #constellationCanvas {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 0;
      pointer-events: none;
    }

    .ambient-glow {
      position: fixed;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%);
      top: 15%;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1;
      pointer-events: none;
      filter: blur(80px);
    }

    .container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-w: 860px;
      padding: 2.5rem 1.5rem;
      margin: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .main-card {
      background: var(--card-bg);
      border: 1px solid rgba(168, 85, 247, 0.3);
      box-shadow: 0 35px 80px -20px rgba(0, 0, 0, 0.8), 0 0 50px -10px rgba(168, 85, 247, 0.2);
      border-radius: 28px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      padding: 3rem 2.5rem;
      width: 100%;
      max-width: 780px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.8rem;
      transition: border-color 0.3s ease;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.45rem 1rem;
      border-radius: 999px;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fbbf24;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f59e0b;
      box-shadow: 0 0 10px #f59e0b;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.3); }
    }

    .brand-icon {
      font-size: 3.2rem;
      line-height: 1;
      filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.4));
    }

    .title-group h1 {
      font-size: clamp(2rem, 5vw, 2.8rem);
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1.15;
      background: linear-gradient(135deg, #ffffff 40%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }

    .title-group p.sub {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: var(--accent-cyan);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .description {
      color: var(--text-muted);
      font-size: 1.02rem;
      line-height: 1.65;
      max-width: 620px;
    }

    .telemetry-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      width: 100%;
      margin-top: 0.5rem;
    }

    .telemetry-card {
      background: rgba(255, 255, 255, 0.035);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.1rem 0.9rem;
      text-align: center;
      transition: transform 0.2s, border-color 0.2s;
    }

    .telemetry-card:hover {
      border-color: rgba(168, 85, 247, 0.35);
      transform: translateY(-2px);
    }

    .telemetry-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.68rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.4rem;
    }

    .telemetry-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.1rem;
      font-weight: 700;
      color: #ffffff;
    }

    .telemetry-val.highlight {
      color: #38bdf8;
    }

    .telemetry-val.secure {
      color: #4ade80;
    }

    .action-hub {
      width: 100%;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 1.5rem;
      margin-top: 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .action-hub-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .nav-pills {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.6rem;
    }

    .pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: var(--text);
      text-decoration: none;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      font-weight: 600;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .pill-btn:hover {
      background: rgba(168, 85, 247, 0.2);
      border-color: rgba(168, 85, 247, 0.5);
      color: #ffffff;
      transform: translateY(-2px);
    }

    .footer-note {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: #64748b;
      margin-top: 1.5rem;
      text-align: center;
    }

    @media (max-width: 640px) {
      .main-card {
        padding: 2rem 1.4rem;
      }
      .telemetry-grid {
        grid-template-columns: 1fr;
        gap: 0.6rem;
      }
    }
  </style>
</head>
<body>
  <canvas id="constellationCanvas"></canvas>
  <div class="ambient-glow"></div>

  <main class="container">
    <div class="main-card">
      <div class="status-badge">
        <span class="pulse-dot"></span>
        <span>PLANNED EDGE MIGRATION · RETIRING RENDER</span>
      </div>

      <div class="brand-icon">🧠</div>

      <div class="title-group">
        <h1>Context0</h1>
        <p class="sub">Adaptive Knowledge &amp; Spaced Repetition</p>
      </div>

      <p class="description">
        We are retiring legacy multi-region container infrastructure on Render in favor of 
        <strong>Cloudflare Edge Native (Workers + D1)</strong>. The question engine and spaced repetition algorithm will return with sub-15ms edge routing, instant warm starts, and zero servers to babysit.
      </p>

      <div class="telemetry-grid">
        <div class="telemetry-card">
          <div class="telemetry-label">Question Bank</div>
          <div class="telemetry-val secure">100% Intact</div>
        </div>
        <div class="telemetry-card">
          <div class="telemetry-label">Fleet Status</div>
          <div class="telemetry-val highlight">10/10 Online</div>
        </div>
        <div class="telemetry-card">
          <div class="telemetry-label">Target Latency</div>
          <div class="telemetry-val">&lt; 15ms Edge</div>
        </div>
      </div>

      <div class="action-hub">
        <span class="action-hub-title">Explore Active Fleet Ecosystem</span>
        <div class="nav-pills">
          <a href="https://craft.anuraaggrao.com" class="pill-btn">🎨 Craft Studio 3D</a>
          <a href="https://status.anuraaggrao.com" class="pill-btn">⚡ Fleet Sentinel SLA</a>
          <a href="https://fidget.anuraaggrao.com" class="pill-btn">🕹️ Tactile Arcade</a>
          <a href="https://utils.anuraaggrao.com" class="pill-btn">🛠️ Dev Toolkit</a>
          <a href="https://anuraaggrao.com" class="pill-btn">🌐 Main Portal</a>
        </div>
      </div>
    </div>

    <p class="footer-note">
      Engineered by Anuraag G Rao · Monitored live across global Cloudflare edge isolates
    </p>
  </main>

  <!-- Real-time Fleet Telemetry Beacon -->
  <script src="https://analytics.anuraaggrao.com/tracker.js" data-project="quiz" defer></script>

  <!-- Interactive Constellation Canvas Script -->
  <script>
    (function() {
      const canvas = document.getElementById('constellationCanvas');
      const ctx = canvas.getContext('2d');
      let w, h;
      let particles = [];

      function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      }
      window.addEventListener('resize', resize);
      resize();

      const count = Math.min(Math.floor((w * h) / 18000), 65);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 1.5 + 1
        });
      }

      function draw() {
        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(192, 132, 252, 0.4)';
          ctx.fill();

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 110) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = 'rgba(168, 85, 247, ' + (0.18 * (1 - dist / 110)) + ')';
              ctx.stroke();
            }
          }
        }

        requestAnimationFrame(draw);
      }
      draw();
    })();
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  },
};
