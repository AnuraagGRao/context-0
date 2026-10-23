export interface Env {
  DB: D1Database;
}

interface Question {
  id: number;
  category: string;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty: string;
}

interface AnswerSubmission {
  questionId: number;
  selectedOption: string;
  timeSpentMs?: number;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle OPTIONS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Health check endpoint
    if (url.pathname === "/health" || url.pathname === "/api/health") {
      try {
        const qCount = await env.DB.prepare("SELECT count(*) as count FROM questions").first<{ count: number }>();
        const catCount = await env.DB.prepare("SELECT count(*) as count FROM categories").first<{ count: number }>();
        return jsonResponse({
          status: "healthy",
          service: "context-0",
          title: "Context0 Adaptive Edge Intelligence",
          platform: "Cloudflare Workers + Cloudflare D1",
          region: "Global Edge (APAC/Singapore D1)",
          latencyTarget: "<15ms",
          totalQuestions: qCount?.count ?? 25,
          totalCategories: catCount?.count ?? 5,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        return jsonResponse({ status: "degraded", error: err.message }, 500);
      }
    }

    // API: Get Categories
    if (url.pathname === "/api/categories" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare(
          `SELECT c.id, c.name, c.description, c.icon, COUNT(q.id) as question_count
           FROM categories c
           LEFT JOIN questions q ON q.category = c.name
           GROUP BY c.id, c.name, c.description, c.icon
           ORDER BY c.id ASC`
        ).all();
        return jsonResponse({ ok: true, categories: results });
      } catch (err: any) {
        return jsonResponse({ ok: false, error: err.message }, 500);
      }
    }

    // API: Start Quiz Session
    if (url.pathname === "/api/quiz/start" && request.method === "POST") {
      try {
        let body: { category?: string; count?: number } = {};
        try {
          body = await request.json();
        } catch {
          // default to empty
        }

        const count = Math.min(Math.max(body.count || 5, 3), 10);
        const category = body.category;

        let query = `SELECT id, category, text, option_a, option_b, option_c, option_d, difficulty FROM questions`;
        const params: any[] = [];

        if (category && category !== "All") {
          query += ` WHERE category = ?`;
          params.push(category);
        }

        query += ` ORDER BY RANDOM() LIMIT ?`;
        params.push(count);

        const { results } = await env.DB.prepare(query).bind(...params).all<Question>();

        return jsonResponse({
          ok: true,
          sessionId: crypto.randomUUID(),
          category: category || "All",
          count: results.length,
          questions: results,
        });
      } catch (err: any) {
        return jsonResponse({ ok: false, error: err.message }, 500);
      }
    }

    // API: Submit Quiz Answers & Grade
    if (url.pathname === "/api/quiz/submit" && request.method === "POST") {
      try {
        const body: {
          username?: string;
          category?: string;
          answers: AnswerSubmission[];
        } = await request.json();

        if (!body.answers || !Array.isArray(body.answers) || body.answers.length === 0) {
          return jsonResponse({ ok: false, error: "Answers array required" }, 400);
        }

        const ids = body.answers.map((a) => a.questionId);
        const placeholders = ids.map(() => "?").join(",");

        const { results: qRows } = await env.DB.prepare(
          `SELECT id, category, text, option_a, option_b, option_c, option_d, correct_option, explanation FROM questions WHERE id IN (${placeholders})`
        )
          .bind(...ids)
          .all<any>();

        const questionMap = new Map<number, any>();
        qRows.forEach((q) => questionMap.set(q.id, q));

        let correctCount = 0;
        let currentStreak = 0;
        let maxStreak = 0;
        let totalScore = 0;

        const results = body.answers.map((ans) => {
          const q = questionMap.get(ans.questionId);
          if (!q) {
            return {
              questionId: ans.questionId,
              isCorrect: false,
              selectedOption: ans.selectedOption,
              correctOption: "",
              explanation: "Question not found",
            };
          }

          const isCorrect = ans.selectedOption.toUpperCase() === q.correct_option.toUpperCase();
          if (isCorrect) {
            correctCount++;
            currentStreak++;
            if (currentStreak > maxStreak) maxStreak = currentStreak;
            // 100 base pts + streak bonus
            totalScore += 100 + currentStreak * 20;
          } else {
            currentStreak = 0;
          }

          return {
            questionId: q.id,
            category: q.category,
            text: q.text,
            options: {
              A: q.option_a,
              B: q.option_b,
              C: q.option_c,
              D: q.option_d,
            },
            selectedOption: ans.selectedOption.toUpperCase(),
            correctOption: q.correct_option.toUpperCase(),
            isCorrect,
            explanation: q.explanation,
          };
        });

        const totalCount = body.answers.length;
        const accuracy = Math.round((correctCount / totalCount) * 100);
        const username = (body.username || "Anonymous").trim().slice(0, 24) || "Anonymous";

        // Save to leaderboard
        await env.DB.prepare(
          `INSERT INTO leaderboard (username, score, accuracy, streak, category)
           VALUES (?, ?, ?, ?, ?)`
        )
          .bind(username, totalScore, accuracy, maxStreak, body.category || "All")
          .run();

        // Get rank
        const rankRow = await env.DB.prepare(
          `SELECT COUNT(*) + 1 as rank FROM leaderboard WHERE score > ?`
        )
          .bind(totalScore)
          .first<{ rank: number }>();

        return jsonResponse({
          ok: true,
          score: totalScore,
          accuracy,
          correctCount,
          totalCount,
          maxStreak,
          rank: rankRow?.rank ?? 1,
          results,
        });
      } catch (err: any) {
        return jsonResponse({ ok: false, error: err.message }, 500);
      }
    }

    // API: Leaderboard
    if (url.pathname === "/api/leaderboard" && request.method === "GET") {
      try {
        const category = url.searchParams.get("category");
        let query = `SELECT id, username, score, accuracy, streak, category, created_at FROM leaderboard`;
        const params: any[] = [];

        if (category && category !== "All") {
          query += ` WHERE category = ?`;
          params.push(category);
        }

        query += ` ORDER BY score DESC, accuracy DESC, id DESC LIMIT 15`;

        const { results } = await env.DB.prepare(query).bind(...params).all();
        return jsonResponse({ ok: true, leaderboard: results });
      } catch (err: any) {
        return jsonResponse({ ok: false, error: err.message }, 500);
      }
    }

    // Render Frontend SPA
    return new Response(renderAppHtml(), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  },
};

function renderAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Context0 // Adaptive Edge Intelligence</title>
  <meta name="description" content="Context0 is an ultra-fast, serverless adaptive quiz platform running on Cloudflare Workers edge compute and Cloudflare D1 distributed SQLite." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #07090e;
      --card-bg: rgba(15, 23, 42, 0.72);
      --card-hover: rgba(30, 41, 59, 0.85);
      --primary: #6366f1;
      --primary-glow: rgba(99, 102, 241, 0.35);
      --accent-cyan: #06b6d4;
      --accent-emerald: #10b981;
      --accent-rose: #f43f5e;
      --accent-amber: #f59e0b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: rgba(255, 255, 255, 0.1);
      --border-focus: rgba(99, 102, 241, 0.6);
      --radius: 16px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      position: relative;
    }

    /* Ambient dynamic glow blobs */
    .ambient-glow {
      position: fixed;
      pointer-events: none;
      border-radius: 50%;
      filter: blur(120px);
      z-index: 0;
      opacity: 0.35;
      animation: floatGlow 18s ease-in-out infinite alternate;
    }
    .glow-1 {
      width: 480px;
      height: 480px;
      background: radial-gradient(circle, #6366f1 0%, transparent 70%);
      top: -100px;
      left: 10%;
    }
    .glow-2 {
      width: 420px;
      height: 420px;
      background: radial-gradient(circle, #06b6d4 0%, transparent 70%);
      bottom: -80px;
      right: 10%;
      animation-duration: 22s;
    }

    @keyframes floatGlow {
      0% { transform: translateY(0px) scale(1); }
      100% { transform: translateY(40px) scale(1.1); }
    }

    /* Subtle background grid */
    .bg-grid {
      position: fixed;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, transparent 80%);
      pointer-events: none;
      z-index: 0;
    }

    header {
      position: relative;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 2rem;
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(12px);
      background: rgba(7, 9, 14, 0.65);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: var(--text);
    }
    .brand-logo {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 1.1rem;
      box-shadow: 0 0 16px var(--primary-glow);
    }
    .brand-name {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .brand-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      background: rgba(6, 182, 212, 0.15);
      color: var(--accent-cyan);
      border: 1px solid rgba(6, 182, 212, 0.3);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .icon-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text);
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 1.1rem;
    }
    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.25);
    }

    main {
      position: relative;
      z-index: 10;
      flex: 1;
      max-width: 960px;
      width: 100%;
      margin: 0 auto;
      padding: 2.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    /* Views */
    .view {
      display: none;
      animation: fadeIn 0.3s ease-out forwards;
    }
    .view.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Home View */
    .hero {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      padding: 0.4rem 0.9rem;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--accent-emerald);
      margin-bottom: 1.25rem;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent-emerald);
      box-shadow: 0 0 8px var(--accent-emerald);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .hero-title {
      font-size: clamp(2rem, 5vw, 3.25rem);
      font-weight: 900;
      letter-spacing: -1px;
      line-height: 1.15;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #ffffff 30%, #cbd5e1 70%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-subtitle {
      font-size: 1.1rem;
      color: var(--text-muted);
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.5;
    }

    /* Category Cards */
    .section-title {
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }
    .category-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      backdrop-filter: blur(16px);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }
    .category-card:hover {
      background: var(--card-hover);
      border-color: var(--border-focus);
      transform: translateY(-3px);
      box-shadow: 0 12px 30px -10px var(--primary-glow);
    }
    .category-card.selected {
      border-color: var(--primary);
      background: rgba(99, 102, 241, 0.15);
      box-shadow: 0 0 24px var(--primary-glow);
    }
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .category-icon {
      font-size: 2rem;
    }
    .category-count {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      color: var(--text-muted);
      background: rgba(255, 255, 255, 0.06);
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }
    .category-name {
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 0.4rem;
    }
    .category-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.4;
      flex-grow: 1;
    }

    .action-panel {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      justify-content: center;
      align-items: center;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white;
      border: none;
      padding: 1rem 2.25rem;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 20px var(--primary-glow);
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px var(--primary-glow);
      background: linear-gradient(135deg, #818cf8, #6366f1);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 1rem 1.75rem;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.25);
    }

    /* Quiz Stage View */
    .quiz-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 2.5rem;
      backdrop-filter: blur(20px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }

    .quiz-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .quiz-progress-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .quiz-streak {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--accent-amber);
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
    }

    .progress-bar-container {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 999px;
      margin-bottom: 2rem;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #6366f1, #06b6d4);
      transition: width 0.3s ease;
    }

    .question-card {
      margin-bottom: 2rem;
    }
    .question-category-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: var(--accent-cyan);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.5rem;
      display: block;
    }
    .question-text {
      font-size: clamp(1.25rem, 3.5vw, 1.75rem);
      font-weight: 700;
      line-height: 1.35;
    }

    .options-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.9rem;
    }
    .option-btn {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.15rem 1.4rem;
      color: var(--text);
      font-size: 1.05rem;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .option-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateX(4px);
    }
    .option-key {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      font-weight: 700;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* Option States */
    .option-btn.selected {
      border-color: var(--primary);
      background: rgba(99, 102, 241, 0.2);
    }
    .option-btn.correct {
      border-color: var(--accent-emerald) !important;
      background: rgba(16, 185, 129, 0.2) !important;
      color: #a7f3d0;
    }
    .option-btn.correct .option-key {
      background: var(--accent-emerald);
      color: #064e3b;
      border-color: var(--accent-emerald);
    }
    .option-btn.wrong {
      border-color: var(--accent-rose) !important;
      background: rgba(244, 63, 94, 0.2) !important;
      color: #fecdd3;
    }
    .option-btn.wrong .option-key {
      background: var(--accent-rose);
      color: #881337;
      border-color: var(--accent-rose);
    }

    /* Explanation popup */
    .explanation-panel {
      margin-top: 1.5rem;
      padding: 1.25rem;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid var(--border);
      display: none;
      animation: fadeIn 0.25s ease-out forwards;
    }
    .explanation-title {
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 0.35rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .explanation-text {
      font-size: 0.95rem;
      color: var(--text-muted);
      line-height: 1.45;
    }

    /* Results Stage */
    .results-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 2.5rem;
      backdrop-filter: blur(20px);
      text-align: center;
    }
    .results-score-badge {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(15, 23, 42, 0.9) 70%);
      border: 2px solid var(--primary);
      box-shadow: 0 0 30px var(--primary-glow);
      margin: 0 auto 1.5rem auto;
    }
    .score-value {
      font-size: 2.75rem;
      font-weight: 900;
      line-height: 1;
      color: #fff;
    }
    .score-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: var(--accent-cyan);
      letter-spacing: 1px;
    }

    .results-stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem;
    }
    .stat-number {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text);
    }
    .stat-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .save-leaderboard-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.25rem;
      margin-bottom: 2rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
      justify-content: center;
    }
    .username-input {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--border);
      color: white;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-family: inherit;
      font-size: 1rem;
      outline: none;
      min-width: 220px;
      transition: border-color 0.2s ease;
    }
    .username-input:focus {
      border-color: var(--primary);
    }

    .debrief-accordion {
      text-align: left;
      margin: 2rem 0;
    }
    .debrief-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .debrief-item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 0.75rem;
    }
    .debrief-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.4rem;
    }
    .debrief-item-q {
      font-weight: 600;
      font-size: 0.95rem;
    }
    .debrief-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }
    .debrief-badge.correct {
      background: rgba(16, 185, 129, 0.2);
      color: var(--accent-emerald);
    }
    .debrief-badge.wrong {
      background: rgba(244, 63, 94, 0.2);
      color: var(--accent-rose);
    }
    .debrief-explanation {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
      line-height: 1.4;
      border-left: 2px solid var(--primary);
      padding-left: 0.75rem;
    }

    /* Leaderboard Modal / View */
    .leaderboard-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
      text-align: left;
    }
    .leaderboard-table th {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: var(--text-muted);
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
    }
    .leaderboard-table td {
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.95rem;
    }
    .rank-cell {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: var(--text-muted);
      width: 50px;
    }
    .rank-1 { color: #f59e0b; }
    .rank-2 { color: #cbd5e1; }
    .rank-3 { color: #d97706; }

    footer {
      position: relative;
      z-index: 10;
      padding: 1.5rem;
      text-align: center;
      border-top: 1px solid var(--border);
      backdrop-filter: blur(10px);
      background: rgba(7, 9, 14, 0.65);
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    footer a {
      color: var(--text);
      text-decoration: none;
      transition: color 0.2s ease;
    }
    footer a:hover {
      color: var(--primary);
    }

    @media (max-width: 640px) {
      header { padding: 1rem 1.25rem; }
      main { padding: 1.5rem 1rem; }
      .quiz-container, .results-container { padding: 1.5rem 1.25rem; }
      .results-stats-row { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="ambient-glow glow-1"></div>
  <div class="ambient-glow glow-2"></div>
  <div class="bg-grid"></div>

  <header>
    <a href="/" class="brand">
      <div class="brand-logo">C0</div>
      <div>
        <div class="brand-name">Context0</div>
      </div>
      <span class="brand-tag">D1 EDGE</span>
    </a>
    <div class="header-actions">
      <button class="icon-btn" id="soundToggleBtn" title="Toggle Sound">🔊</button>
      <button class="icon-btn" id="leaderboardBtn" title="Leaderboard">🏆</button>
    </div>
  </header>

  <main>
    <!-- VIEW 1: HOME & CATEGORY SELECTOR -->
    <section id="viewHome" class="view active">
      <div class="hero">
        <div class="hero-badge">
          <span class="pulse-dot"></span>
          <span>Cloudflare Edge Native • Sub-15ms Latency</span>
        </div>
        <h1 class="hero-title">Adaptive Intelligence at the Edge</h1>
        <p class="hero-subtitle">
          Test your cognitive recall across curated domains with spaced retrieval algorithms powered by Cloudflare Workers & D1 distributed SQLite.
        </p>
      </div>

      <div class="section-title">
        <span>Select Category</span>
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: var(--text-muted);" id="categoryStatus">Loaded</span>
      </div>

      <div class="categories-grid" id="categoriesGrid">
        <!-- Rendered dynamically -->
      </div>

      <div class="action-panel">
        <button class="btn-primary" id="startQuizBtn">
          <span>Launch Quiz Session</span>
          <span>⚡</span>
        </button>
      </div>
    </section>

    <!-- VIEW 2: ACTIVE QUIZ STAGE -->
    <section id="viewQuiz" class="view">
      <div class="quiz-container">
        <div class="quiz-meta">
          <span class="quiz-progress-text" id="quizProgressText">Question 1 of 5</span>
          <div class="quiz-streak" id="streakBadge" style="display: none;">
            <span>🔥</span>
            <span id="streakCount">0 Streak</span>
          </div>
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar-fill" id="progressBarFill"></div>
        </div>

        <div class="question-card">
          <span class="question-category-tag" id="questionCategory">CATEGORY</span>
          <h2 class="question-text" id="questionText">Loading question...</h2>
        </div>

        <div class="options-grid" id="optionsGrid">
          <!-- Rendered dynamically -->
        </div>

        <div class="explanation-panel" id="explanationPanel">
          <div class="explanation-title">
            <span id="explanationIcon">💡</span>
            <span id="explanationStatus">Spaced Retrieval Note</span>
          </div>
          <div class="explanation-text" id="explanationText"></div>
        </div>
      </div>
    </section>

    <!-- VIEW 3: RESULTS & DEBRIEF -->
    <section id="viewResults" class="view">
      <div class="results-container">
        <div class="results-score-badge">
          <div class="score-value" id="finalScoreVal">0</div>
          <div class="score-label">POINTS</div>
        </div>

        <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 0.5rem;" id="resultsTitle">Session Complete</h2>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;" id="resultsSubtitle">Precision evaluation generated from Cloudflare edge compute.</p>

        <div class="results-stats-row">
          <div class="stat-box">
            <div class="stat-number" id="statAccuracy">0%</div>
            <div class="stat-label">ACCURACY</div>
          </div>
          <div class="stat-box">
            <div class="stat-number" id="statCorrect">0 / 5</div>
            <div class="stat-label">CORRECT</div>
          </div>
          <div class="stat-box">
            <div class="stat-number" id="statStreak">0</div>
            <div class="stat-label">MAX STREAK</div>
          </div>
        </div>

        <div class="save-leaderboard-box">
          <span style="font-size: 0.95rem; font-weight: 600;">Record your run:</span>
          <input type="text" id="usernameInput" class="username-input" placeholder="Enter Operator Name" maxlength="20" value="Radi" />
          <button class="btn-primary" id="saveLeaderboardBtn" style="padding: 0.75rem 1.5rem; font-size: 0.95rem;">Save Score</button>
        </div>

        <div class="debrief-accordion">
          <div class="debrief-title">🧠 Spaced Retrieval Debrief</div>
          <div id="debriefList"></div>
        </div>

        <div class="action-panel" style="margin-top: 1.5rem;">
          <button class="btn-primary" id="playAgainBtn">Play Again</button>
          <button class="btn-secondary" id="changeCategoryBtn">Change Category</button>
        </div>
      </div>
    </section>

    <!-- VIEW 4: LEADERBOARD -->
    <section id="viewLeaderboard" class="view">
      <div class="quiz-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div>
            <h2 style="font-size: 1.75rem; font-weight: 800;">Global D1 Leaderboard</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Sub-millisecond persistent edge rankings.</p>
          </div>
          <button class="btn-secondary" id="backFromLeaderboardBtn">← Back</button>
        </div>

        <div style="overflow-x: auto;">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>OPERATOR</th>
                <th>SCORE</th>
                <th>ACCURACY</th>
                <th>STREAK</th>
                <th>DOMAIN</th>
              </tr>
            </thead>
            <tbody id="leaderboardTbody">
              <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading edge rankings...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <p>
      Context0 Edge v2.0 • Zero Container Cold Starts • Powered by Cloudflare Workers & D1 • 
      <a href="https://anuraaggrao.com" target="_blank" rel="noopener">Anuraag G Rao</a>
    </p>
  </footer>

  <script>
    // Audio Synthesis Engine (Zero external dependencies)
    class EdgeAudioEngine {
      constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('c0_muted') === 'true';
      }

      init() {
        if (!this.ctx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioContextClass();
        }
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }

      playTone(freq, type, duration, gainLevel = 0.15) {
        if (this.muted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      }

      playClick() {
        this.playTone(600, 'sine', 0.05, 0.08);
      }

      playCorrect() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          gain.gain.setValueAtTime(0.12, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.35);
        });
      }

      playWrong() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.25);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }

      playFanfare() {
        if (this.muted) return;
        this.init();
        const notes = [523.25, 659.25, 783.99, 1046.5];
        const now = this.ctx.currentTime;
        notes.forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.09);
          gain.gain.setValueAtTime(0.15, now + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.45);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 0.45);
        });
      }
    }

    const audio = new EdgeAudioEngine();

    // App State
    let categories = [];
    let selectedCategory = 'All';
    let currentQuiz = null;
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let streak = 0;
    let maxStreak = 0;
    let isAnswering = false;

    // View Management
    function showView(viewId) {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      const target = document.getElementById(viewId);
      if (target) target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Sound toggle
    const soundBtn = document.getElementById('soundToggleBtn');
    soundBtn.textContent = audio.muted ? '🔇' : '🔊';
    soundBtn.addEventListener('click', () => {
      audio.muted = !audio.muted;
      localStorage.setItem('c0_muted', audio.muted);
      soundBtn.textContent = audio.muted ? '🔇' : '🔊';
      if (!audio.muted) audio.playClick();
    });

    // Fetch Categories
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.ok) {
          categories = data.categories;
          renderCategories();
        }
      } catch (e) {
        console.error('Failed to load categories', e);
      }
    }

    function renderCategories() {
      const container = document.getElementById('categoriesGrid');
      container.innerHTML = '';

      // All categories card
      const allCard = document.createElement('div');
      allCard.className = 'category-card' + (selectedCategory === 'All' ? ' selected' : '');
      allCard.innerHTML = \`
        <div class="category-header">
          <span class="category-icon">⚡</span>
          <span class="category-count">25 Qs</span>
        </div>
        <div class="category-name">Full Spectrum</div>
        <div class="category-desc">Curated multi-domain challenges combining science, history, tech, and geography.</div>
      \`;
      allCard.onclick = () => selectCategory('All', allCard);
      container.appendChild(allCard);

      categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'category-card' + (selectedCategory === cat.name ? ' selected' : '');
        card.innerHTML = \`
          <div class="category-header">
            <span class="category-icon">\${cat.icon}</span>
            <span class="category-count">\${cat.question_count} Qs</span>
          </div>
          <div class="category-name">\${cat.name}</div>
          <div class="category-desc">\${cat.description}</div>
        \`;
        card.onclick = () => selectCategory(cat.name, card);
        container.appendChild(card);
      });
    }

    function selectCategory(name, cardElement) {
      audio.playClick();
      selectedCategory = name;
      document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
      cardElement.classList.add('selected');
    }

    // Start Quiz
    document.getElementById('startQuizBtn').addEventListener('click', async () => {
      audio.playClick();
      const startBtn = document.getElementById('startQuizBtn');
      startBtn.disabled = true;
      startBtn.innerHTML = '<span>Spinning Edge Worker...</span>';

      try {
        const res = await fetch('/api/quiz/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: selectedCategory, count: 5 })
        });
        const data = await res.json();

        if (data.ok && data.questions.length > 0) {
          currentQuiz = data;
          currentQuestionIndex = 0;
          userAnswers = [];
          streak = 0;
          maxStreak = 0;
          showView('viewQuiz');
          renderCurrentQuestion();
        } else {
          alert('No questions available for this domain.');
        }
      } catch (err) {
        alert('Failed to connect to edge worker: ' + err.message);
      } finally {
        startBtn.disabled = false;
        startBtn.innerHTML = '<span>Launch Quiz Session</span><span>⚡</span>';
      }
    });

    function renderCurrentQuestion() {
      isAnswering = false;
      const q = currentQuiz.questions[currentQuestionIndex];
      const total = currentQuiz.questions.length;

      // Update progress
      document.getElementById('quizProgressText').textContent = \`Question \${currentQuestionIndex + 1} of \${total}\`;
      document.getElementById('progressBarFill').style.width = \`\${((currentQuestionIndex) / total) * 100}%\`;

      // Update streak
      const streakBadge = document.getElementById('streakBadge');
      if (streak > 0) {
        streakBadge.style.display = 'inline-flex';
        document.getElementById('streakCount').textContent = \`\${streak} Streak\`;
      } else {
        streakBadge.style.display = 'none';
      }

      document.getElementById('questionCategory').textContent = q.category;
      document.getElementById('questionText').textContent = q.text;

      // Hide explanation panel from previous question
      const expPanel = document.getElementById('explanationPanel');
      expPanel.style.display = 'none';

      const optionsGrid = document.getElementById('optionsGrid');
      optionsGrid.innerHTML = '';

      const choices = [
        { key: 'A', text: q.option_a },
        { key: 'B', text: q.option_b },
        { key: 'C', text: q.option_c },
        { key: 'D', text: q.option_d },
      ];

      choices.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = \`
          <span class="option-key">\${ch.key}</span>
          <span>\${ch.text}</span>
        \`;
        btn.onclick = () => handleAnswerSelect(q.id, ch.key, btn);
        optionsGrid.appendChild(btn);
      });
    }

    async function handleAnswerSelect(questionId, selectedKey, btnElement) {
      if (isAnswering) return;
      isAnswering = true;
      audio.playClick();

      userAnswers.push({
        questionId: questionId,
        selectedOption: selectedKey
      });

      // Highlight selected
      document.querySelectorAll('.option-btn').forEach(b => {
        b.disabled = true;
        b.classList.remove('selected');
      });
      btnElement.classList.add('selected');

      // Next question or submit
      setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuiz.questions.length) {
          renderCurrentQuestion();
        } else {
          submitQuizResults();
        }
      }, 350);
    }

    async function submitQuizResults() {
      document.getElementById('quizProgressText').textContent = 'Grading at Edge...';
      document.getElementById('progressBarFill').style.width = '100%';

      try {
        const username = document.getElementById('usernameInput').value.trim() || 'Radi';
        const res = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username,
            category: currentQuiz.category,
            answers: userAnswers
          })
        });

        const data = await res.json();
        if (data.ok) {
          if (data.accuracy >= 80) {
            audio.playFanfare();
          } else {
            audio.playCorrect();
          }
          displayResults(data);
        } else {
          alert('Grading error: ' + data.error);
        }
      } catch (e) {
        alert('Edge communication failure: ' + e.message);
      }
    }

    function displayResults(data) {
      document.getElementById('finalScoreVal').textContent = data.score;
      document.getElementById('statAccuracy').textContent = data.accuracy + '%';
      document.getElementById('statCorrect').textContent = \`\${data.correctCount} / \${data.totalCount}\`;
      document.getElementById('statStreak').textContent = data.maxStreak;

      const titles = [
        { min: 100, title: 'Flawless Synchronization' },
        { min: 80, title: 'High-Velocity Recall' },
        { min: 60, title: 'Solid Operational Knowledge' },
        { min: 0, title: 'Edge Debrief Ready' },
      ];
      const match = titles.find(t => data.accuracy >= t.min);
      document.getElementById('resultsTitle').textContent = match.title;

      // Render debrief
      const debriefList = document.getElementById('debriefList');
      debriefList.innerHTML = '';

      data.results.forEach((r, idx) => {
        const item = document.createElement('div');
        item.className = 'debrief-item';
        const isRight = r.isCorrect;
        item.innerHTML = \`
          <div class="debrief-item-header">
            <span class="debrief-item-q">\${idx + 1}. \${r.text}</span>
            <span class="debrief-badge \${isRight ? 'correct' : 'wrong'}">
              \${isRight ? 'CORRECT (+' + (100) + ')' : 'MISSED (You picked ' + r.selectedOption + ')'}
            </span>
          </div>
          <div style="font-size: 0.85rem; color: #a5b4fc; margin-bottom: 0.25rem;">
            Answer: Option \${r.correctOption} — \${r.options[r.correctOption]}
          </div>
          <div class="debrief-explanation">
            \${r.explanation}
          </div>
        \`;
        debriefList.appendChild(item);
      });

      showView('viewResults');
    }

    // Save Leaderboard
    document.getElementById('saveLeaderboardBtn').addEventListener('click', async () => {
      audio.playClick();
      const saveBtn = document.getElementById('saveLeaderboardBtn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saved!';
      setTimeout(() => {
        loadLeaderboard();
        showView('viewLeaderboard');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Score';
      }, 400);
    });

    document.getElementById('playAgainBtn').addEventListener('click', () => {
      audio.playClick();
      document.getElementById('startQuizBtn').click();
    });

    document.getElementById('changeCategoryBtn').addEventListener('click', () => {
      audio.playClick();
      showView('viewHome');
    });

    // Leaderboard
    document.getElementById('leaderboardBtn').addEventListener('click', () => {
      audio.playClick();
      loadLeaderboard();
      showView('viewLeaderboard');
    });

    document.getElementById('backFromLeaderboardBtn').addEventListener('click', () => {
      audio.playClick();
      showView('viewHome');
    });

    async function loadLeaderboard() {
      const tbody = document.getElementById('leaderboardTbody');
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Querying Cloudflare D1...</td></tr>';

      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        if (data.ok && data.leaderboard.length > 0) {
          tbody.innerHTML = '';
          data.leaderboard.forEach((row, i) => {
            const tr = document.createElement('tr');
            const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
            const rankIcon = i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : '';
            tr.innerHTML = \`
              <td class="rank-cell \${rankClass}">\${rankIcon}#\${i + 1}</td>
              <td style="font-weight: 700;">\${escapeHtml(row.username)}</td>
              <td style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #a5b4fc;">\${row.score}</td>
              <td style="font-family: 'JetBrains Mono', monospace;">\${row.accuracy}%</td>
              <td style="font-family: 'JetBrains Mono', monospace;">🔥 \${row.streak}</td>
              <td style="font-size: 0.85rem; color: var(--text-muted);">\${row.category}</td>
            \`;
            tbody.appendChild(tr);
          });
        } else {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No scores yet. Complete a quiz run to claim rank #1!</td></tr>';
        }
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--accent-rose); padding: 2rem;">Error querying leaderboard</td></tr>';
      }
    }

    function escapeHtml(str) {
      return (str || '').replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[m]);
    }

    // Keyboard navigation (1-4, A-D)
    window.addEventListener('keydown', (e) => {
      const viewQuiz = document.getElementById('viewQuiz');
      if (viewQuiz.classList.contains('active') && !isAnswering) {
        const key = e.key.toUpperCase();
        const map = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', 'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D' };
        if (map[key]) {
          const btns = document.querySelectorAll('.option-btn');
          const idx = ['A', 'B', 'C', 'D'].indexOf(map[key]);
          if (btns[idx]) btns[idx].click();
        }
      }
    });

    // Initial load
    loadCategories();
  </script>
</body>
</html>`;
}
