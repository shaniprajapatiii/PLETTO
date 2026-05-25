// comprehensive PLETTO frontend

import { useState, useEffect, useRef, useCallback } from "react";


// DESIGN TOKENS

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Bricolage+Grotesque:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #09090b;
    --bg2: #111114;
    --bg3: #18181c;
    --bg4: #1f1f25;
    --border: rgba(255,255,255,0.06);
    --border2: rgba(255,255,255,0.1);
    --border3: rgba(255,255,255,0.16);
    --text: #f0f0f0;
    --text2: #9a9aaa;
    --text3: #5a5a6e;
    --accent: #7c6ef0;
    --accent2: #a594ff;
    --accent3: #5b50c8;
    --teal: #2dd4bf;
    --amber: #f59e0b;
    --red: #f43f5e;
    --green: #22c55e;
    --mono: 'DM Mono', monospace;
    --sans: 'Bricolage Grotesque', system-ui, sans-serif;
    --radius: 10px;
    --radius2: 16px;
    --radius3: 24px;
    --shadow: 0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.6);
    --sidebar-w: 240px;
    --transition: 0.18s cubic-bezier(0.4,0,0.2,1);
  }

  html, body, #root { height: 100%; width: 100%; overflow: hidden; }

  body {
    font-family: var(--sans);
    background: var(--bg);
    color: var(--text);
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border3); border-radius: 2px; }

  button { cursor: pointer; font-family: var(--sans); border: none; background: none; color: inherit; }
  input, textarea { font-family: var(--sans); outline: none; }

  /* Animations */
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes ripple { from { transform: scale(0); opacity: 0.6; } to { transform: scale(2.5); opacity: 0; } }
  @keyframes glow { 0%,100% { box-shadow: 0 0 12px rgba(124,110,240,0.3); } 50% { box-shadow: 0 0 28px rgba(124,110,240,0.6); } }
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes typewriter { from { width: 0; } to { width: 100%; } }
  @keyframes cursorBlink { 0%,100% { border-right-color: var(--accent); } 50% { border-right-color: transparent; } }
  @keyframes waveIn { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

  .fade-in { animation: fadeIn 0.3s ease forwards; }
  .slide-in { animation: slideIn 0.25s ease forwards; }

  /* Global layout */
  .app-shell {
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background: var(--bg);
  }

  /* ── Sidebar ─────────────────────────────── */
  .sidebar {
    width: var(--sidebar-w);
    min-width: var(--sidebar-w);
    height: 100%;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    background: var(--bg2);
    z-index: 10;
    flex-shrink: 0;
  }

  .sidebar-logo {
    padding: 18px 16px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid var(--border);
  }

  .logo-mark {
    width: 32px; height: 32px;
    background: linear-gradient(135deg, var(--accent), var(--teal));
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: #fff; letter-spacing: -0.5px;
    animation: glow 3s ease-in-out infinite;
    flex-shrink: 0;
  }

  .logo-name {
    font-size: 16px; font-weight: 700; letter-spacing: -0.5px;
    background: linear-gradient(90deg, var(--text), var(--text2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  .sidebar-section { padding: 8px 8px 4px; }
  .sidebar-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
    color: var(--text3); text-transform: uppercase;
    padding: 4px 8px 6px;
  }

  .nav-item {
    display: flex; align-items: center; gap: 9px;
    padding: 7px 10px; border-radius: var(--radius);
    font-size: 13px; font-weight: 400; color: var(--text2);
    cursor: pointer; transition: all var(--transition);
    position: relative; user-select: none;
  }
  .nav-item:hover { background: var(--bg3); color: var(--text); }
  .nav-item.active { background: rgba(124,110,240,0.12); color: var(--accent2); font-weight: 500; }
  .nav-item.active::before {
    content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
    width: 2px; background: var(--accent); border-radius: 1px;
  }

  .nav-icon { font-size: 15px; width: 18px; text-align: center; opacity: 0.8; }
  .nav-badge {
    margin-left: auto; background: var(--accent3);
    color: #fff; font-size: 10px; font-weight: 600;
    padding: 1px 6px; border-radius: 99px; min-width: 18px; text-align: center;
  }
  .nav-badge.red { background: var(--red); }
  .nav-badge.green { background: var(--green); }

  .sidebar-footer {
    margin-top: auto; padding: 10px 8px;
    border-top: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px; cursor: pointer;
  }
  .sidebar-footer:hover { background: var(--bg3); border-radius: var(--radius); }

  .avatar {
    width: 30px; height: 30px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; flex-shrink: 0;
  }

  .user-info { flex: 1; min-width: 0; }
  .user-name { font-size: 13px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-role { font-size: 11px; color: var(--text3); }

  .online-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--green); flex-shrink: 0;
    box-shadow: 0 0 6px var(--green);
  }

  /* ── Main area ─────────────────────────────── */
  .main {
    flex: 1; display: flex; flex-direction: column;
    min-width: 0; overflow: hidden;
  }

  .topbar {
    height: 52px; display: flex; align-items: center; gap: 12px;
    padding: 0 20px; border-bottom: 1px solid var(--border);
    background: var(--bg2); flex-shrink: 0;
  }

  .topbar-title { font-size: 14px; font-weight: 600; color: var(--text); }
  .topbar-sub { font-size: 12px; color: var(--text3); }

  .breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text3); }
  .breadcrumb-sep { opacity: 0.4; }
  .breadcrumb-active { color: var(--text); font-weight: 500; }

  .topbar-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }

  .icon-btn {
    width: 32px; height: 32px; border-radius: var(--radius);
    display: flex; align-items: center; justify-content: center;
    color: var(--text2); font-size: 15px; transition: all var(--transition);
    position: relative;
  }
  .icon-btn:hover { background: var(--bg3); color: var(--text); }

  .presence-cluster { display: flex; align-items: center; }
  .presence-avatar {
    width: 26px; height: 26px; border-radius: 50%;
    border: 2px solid var(--bg2);
    margin-left: -6px; font-size: 10px; font-weight: 600;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: transform var(--transition);
  }
  .presence-avatar:first-child { margin-left: 0; }
  .presence-avatar:hover { transform: scale(1.1); z-index: 2; }

  .presence-count {
    font-size: 11px; color: var(--text3); margin-left: 8px;
  }

  /* ── Content area ─────────────────────────────── */
  .content {
    flex: 1; overflow: auto; padding: 28px 32px;
    animation: fadeIn 0.25s ease;
  }

  /* ── Command palette ─────────────────────────────── */
  .command-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.75);
    display: flex; align-items: flex-start; justify-content: center;
    padding-top: 15vh;
    animation: fadeIn 0.15s ease;
  }

  .command-box {
    width: 580px; max-height: 420px;
    background: var(--bg3);
    border: 1px solid var(--border3);
    border-radius: var(--radius3);
    box-shadow: 0 32px 80px rgba(0,0,0,0.8);
    overflow: hidden; display: flex; flex-direction: column;
    animation: fadeIn 0.2s ease;
  }

  .command-input-row {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 20px; border-bottom: 1px solid var(--border);
  }

  .command-input-icon { color: var(--text3); font-size: 16px; }

  .command-input {
    flex: 1; font-size: 15px; color: var(--text);
    background: none; font-family: var(--sans); font-weight: 400;
  }
  .command-input::placeholder { color: var(--text3); }

  .command-kbd {
    font-size: 10px; color: var(--text3); background: var(--bg4);
    border: 1px solid var(--border2); border-radius: 5px;
    padding: 2px 6px; font-family: var(--mono);
  }

  .command-results { flex: 1; overflow: auto; padding: 8px; }
  .command-group-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--text3); padding: 8px 12px 4px;
  }
  .command-item {
    display: flex; align-items: center; gap: 12px;
    padding: 9px 12px; border-radius: var(--radius); cursor: pointer;
    transition: background var(--transition); font-size: 13px;
  }
  .command-item:hover, .command-item.highlighted {
    background: rgba(124,110,240,0.12); color: var(--accent2);
  }
  .command-item-icon { color: var(--text3); font-size: 14px; width: 16px; text-align: center; }
  .command-item-meta { margin-left: auto; font-size: 11px; color: var(--text3); }

  /* ── Cards & panels ─────────────────────────────── */
  .card {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius2); padding: 20px;
  }

  .card-sm {
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 14px 16px;
  }

  .section-title {
    font-size: 18px; font-weight: 700; letter-spacing: -0.4px;
    color: var(--text); margin-bottom: 4px;
  }
  .section-sub { font-size: 13px; color: var(--text3); margin-bottom: 20px; }

  /* ── Buttons ─────────────────────────────── */
  .btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 16px; border-radius: var(--radius); font-size: 13px;
    font-weight: 500; transition: all var(--transition); cursor: pointer;
    font-family: var(--sans); white-space: nowrap;
  }
  .btn-primary {
    background: var(--accent); color: #fff;
  }
  .btn-primary:hover { background: var(--accent2); }
  .btn-ghost {
    background: transparent; color: var(--text2);
    border: 1px solid var(--border2);
  }
  .btn-ghost:hover { background: var(--bg3); color: var(--text); }
  .btn-danger { background: var(--red); color: #fff; }
  .btn-danger:hover { opacity: 0.85; }
  .btn-sm { padding: 5px 12px; font-size: 12px; }
  .btn-icon { gap: 0; padding: 8px; }

  /* ── Tag/Badge ─────────────────────────────── */
  .tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 500;
  }
  .tag-purple { background: rgba(124,110,240,0.15); color: var(--accent2); }
  .tag-teal { background: rgba(45,212,191,0.12); color: var(--teal); }
  .tag-amber { background: rgba(245,158,11,0.12); color: var(--amber); }
  .tag-red { background: rgba(244,63,94,0.12); color: var(--red); }
  .tag-green { background: rgba(34,197,94,0.12); color: var(--green); }
  .tag-gray { background: var(--bg4); color: var(--text3); }

  /* ── Status dot ─────────────────────────────── */
  .status-dot {
    width: 7px; height: 7px; border-radius: 50%; display: inline-block;
  }
  .status-dot.online { background: var(--green); box-shadow: 0 0 5px var(--green); }
  .status-dot.away { background: var(--amber); box-shadow: 0 0 5px var(--amber); }
  .status-dot.busy { background: var(--red); box-shadow: 0 0 5px var(--red); }

  /* ─── LANDING PAGE ─────────────────────────────── */
  .landing {
    height: 100%; overflow: auto; background: var(--bg);
    font-family: var(--sans);
  }

  .landing-nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; gap: 32px;
    padding: 0 48px; height: 60px;
    background: rgba(9,9,11,0.85); backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
  }
  .landing-nav-links { display: flex; gap: 8px; }
  .landing-nav-link {
    padding: 6px 14px; border-radius: 99px; font-size: 13px;
    color: var(--text2); cursor: pointer; transition: all var(--transition);
  }
  .landing-nav-link:hover { color: var(--text); background: var(--bg3); }
  .landing-nav-actions { margin-left: auto; display: flex; gap: 8px; }

  .hero {
    padding: 100px 48px 80px;
    max-width: 1100px; margin: 0 auto;
    text-align: center;
  }

  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(124,110,240,0.1); border: 1px solid rgba(124,110,240,0.3);
    border-radius: 99px; padding: 5px 14px; font-size: 12px;
    color: var(--accent2); margin-bottom: 32px;
    animation: float 4s ease-in-out infinite;
  }

  .hero-title {
    font-size: clamp(48px, 7vw, 88px);
    font-weight: 700; line-height: 1.05;
    letter-spacing: -2px; margin-bottom: 24px;
    background: linear-gradient(160deg, #fff 30%, rgba(255,255,255,0.45));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  .hero-sub {
    font-size: 18px; color: var(--text2); max-width: 560px;
    margin: 0 auto 40px; line-height: 1.6; font-weight: 300;
  }

  .hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  .btn-hero {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 14px 28px; border-radius: var(--radius2); font-size: 15px;
    font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: var(--sans);
  }
  .btn-hero-primary {
    background: var(--accent); color: #fff;
    box-shadow: 0 0 0 0 var(--accent);
    animation: glow 3s ease-in-out infinite;
  }
  .btn-hero-primary:hover { background: var(--accent2); transform: translateY(-1px); }
  .btn-hero-ghost {
    background: transparent; color: var(--text2);
    border: 1px solid var(--border3);
  }
  .btn-hero-ghost:hover { color: var(--text); background: var(--bg3); }

  /* Demo window */
  .demo-window {
    margin: 72px auto; max-width: 900px;
    background: var(--bg2); border: 1px solid var(--border2);
    border-radius: var(--radius3); overflow: hidden;
    box-shadow: 0 48px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04);
  }
  .demo-titlebar {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 16px; border-bottom: 1px solid var(--border);
    background: var(--bg3);
  }
  .demo-dot { width: 10px; height: 10px; border-radius: 50%; }
  .demo-dot.r { background: #ff5f57; }
  .demo-dot.y { background: #febc2e; }
  .demo-dot.g { background: #28c840; }
  .demo-url-bar {
    flex: 1; background: var(--bg4); border-radius: 6px;
    padding: 4px 12px; font-size: 12px; color: var(--text3);
    font-family: var(--mono); margin: 0 12px;
  }

  /* Features grid */
  .features { padding: 80px 48px; max-width: 1100px; margin: 0 auto; }
  .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .feature-card {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius2); padding: 28px;
    transition: all 0.2s; cursor: default;
  }
  .feature-card:hover { border-color: var(--border3); transform: translateY(-2px); }
  .feature-icon {
    width: 44px; height: 44px; border-radius: var(--radius);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; margin-bottom: 16px;
  }
  .feature-title { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
  .feature-desc { font-size: 13px; color: var(--text2); line-height: 1.6; }

  /* Stats */
  .stats-bar {
    display: flex; justify-content: center; gap: 64px;
    padding: 48px; border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: var(--bg2);
  }
  .stat-item { text-align: center; }
  .stat-value {
    font-size: 36px; font-weight: 700; letter-spacing: -1px;
    background: linear-gradient(90deg, var(--accent2), var(--teal));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .stat-label { font-size: 13px; color: var(--text3); margin-top: 4px; }

  /* Ticker */
  .ticker { overflow: hidden; padding: 14px 0; border-bottom: 1px solid var(--border); }
  .ticker-inner {
    display: flex; gap: 32px; white-space: nowrap;
    animation: marquee 24s linear infinite;
  }
  .ticker-item { font-size: 12px; color: var(--text3); display: flex; align-items: center; gap: 8px; }
  .ticker-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); }

  /* ─── DASHBOARD ─────────────────────────────── */
  .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .stat-card {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius2); padding: 20px;
  }
  .stat-card-label { font-size: 12px; color: var(--text3); margin-bottom: 8px; }
  .stat-card-value { font-size: 28px; font-weight: 700; letter-spacing: -1px; }
  .stat-card-change { font-size: 12px; color: var(--green); margin-top: 4px; }
  .stat-card-change.neg { color: var(--red); }

  /* Activity feed */
  .activity-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 0; border-bottom: 1px solid var(--border);
  }
  .activity-item:last-child { border-bottom: none; }
  .activity-body { flex: 1; }
  .activity-text { font-size: 13px; color: var(--text); }
  .activity-text strong { color: var(--text); font-weight: 600; }
  .activity-meta { font-size: 11px; color: var(--text3); margin-top: 3px; }

  /* Quick actions */
  .quick-action {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px; border-radius: var(--radius); cursor: pointer;
    background: var(--bg3); border: 1px solid var(--border);
    transition: all var(--transition); text-align: left;
  }
  .quick-action:hover { border-color: var(--border3); background: var(--bg4); }
  .quick-action-icon {
    width: 36px; height: 36px; border-radius: var(--radius);
    display: flex; align-items: center; justify-content: center; font-size: 16px;
  }
  .quick-action-title { font-size: 13px; font-weight: 500; }
  .quick-action-desc { font-size: 11px; color: var(--text3); }

  /* ─── DOCUMENT EDITOR ─────────────────────────────── */
  .editor-shell {
    display: flex; height: 100%; flex-direction: column;
  }

  .editor-toolbar {
    display: flex; align-items: center; gap: 4px;
    padding: 8px 16px; border-bottom: 1px solid var(--border);
    background: var(--bg2); flex-shrink: 0; flex-wrap: wrap;
  }

  .toolbar-sep {
    width: 1px; height: 20px; background: var(--border2); margin: 0 4px;
  }

  .toolbar-btn {
    padding: 5px 8px; border-radius: 6px; font-size: 12px;
    color: var(--text2); transition: all var(--transition); cursor: pointer;
    display: flex; align-items: center; gap: 4px;
    font-family: var(--mono);
  }
  .toolbar-btn:hover { background: var(--bg3); color: var(--text); }
  .toolbar-btn.active { background: rgba(124,110,240,0.15); color: var(--accent2); }

  .editor-body { flex: 1; display: flex; overflow: hidden; }

  .editor-main { flex: 1; overflow: auto; padding: 48px; }
  .editor-doc {
    max-width: 720px; margin: 0 auto;
  }

  .editor-h1 {
    font-size: 36px; font-weight: 700; letter-spacing: -1px;
    color: var(--text); margin-bottom: 8px; line-height: 1.2;
  }

  .editor-h2 {
    font-size: 22px; font-weight: 600; letter-spacing: -0.4px;
    color: var(--text); margin: 28px 0 12px;
  }

  .editor-p {
    font-size: 15px; color: var(--text2); line-height: 1.8;
    margin-bottom: 16px;
  }

  .editor-cursor {
    display: inline-block; width: 2px; height: 18px;
    background: var(--accent); vertical-align: middle;
    animation: blink 1s step-end infinite;
    margin-left: 1px;
  }

  /* Multiplayer cursors */
  .mp-cursor {
    position: absolute; pointer-events: none; z-index: 50;
    transition: left 0.05s, top 0.05s;
  }
  .mp-cursor-pointer {
    width: 16px; height: 16px;
  }
  .mp-cursor-label {
    display: inline-flex; align-items: center;
    padding: 2px 8px; border-radius: 99px;
    font-size: 11px; font-weight: 600; color: #fff;
    margin-top: 2px; white-space: nowrap;
  }

  /* Editor sidebar */
  .editor-sidebar {
    width: 280px; border-left: 1px solid var(--border);
    display: flex; flex-direction: column; background: var(--bg2);
  }

  .editor-sidebar-tabs {
    display: flex; border-bottom: 1px solid var(--border);
  }
  .editor-sidebar-tab {
    flex: 1; padding: 10px 8px; text-align: center; font-size: 12px;
    color: var(--text3); cursor: pointer; transition: all var(--transition);
    border-bottom: 2px solid transparent;
  }
  .editor-sidebar-tab.active { color: var(--accent2); border-bottom-color: var(--accent); }

  .editor-sidebar-content { flex: 1; overflow: auto; padding: 16px; }

  /* Comment */
  .comment {
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 12px; margin-bottom: 10px;
    position: relative;
  }
  .comment-author { font-size: 12px; font-weight: 600; margin-bottom: 6px; }
  .comment-text { font-size: 13px; color: var(--text2); line-height: 1.5; }
  .comment-actions { display: flex; gap: 8px; margin-top: 8px; }
  .comment-action { font-size: 11px; color: var(--text3); cursor: pointer; }
  .comment-action:hover { color: var(--text2); }

  /* Version timeline */
  .version-item {
    display: flex; gap: 10px; padding: 10px 0;
    border-bottom: 1px solid var(--border); cursor: pointer;
  }
  .version-item:hover { opacity: 0.8; }
  .version-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--accent); margin-top: 5px; flex-shrink: 0;
  }
  .version-title { font-size: 12px; font-weight: 500; }
  .version-meta { font-size: 11px; color: var(--text3); margin-top: 2px; }

  /* ─── CHAT ─────────────────────────────── */
  .chat-shell { display: flex; height: 100%; }
  .chat-channels {
    width: 220px; border-right: 1px solid var(--border);
    background: var(--bg2); display: flex; flex-direction: column;
  }
  .channel-section { padding: 12px 8px 4px; }
  .channel-section-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--text3); padding: 4px 8px 6px; display: flex; align-items: center; justify-content: space-between;
  }
  .channel-item {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 10px; border-radius: 7px; cursor: pointer;
    font-size: 13px; color: var(--text3); transition: all var(--transition);
  }
  .channel-item:hover { background: var(--bg3); color: var(--text); }
  .channel-item.active { background: rgba(124,110,240,0.12); color: var(--accent2); }
  .channel-unread { margin-left: auto; font-size: 10px; font-weight: 700; }

  .chat-main { flex: 1; display: flex; flex-direction: column; }
  .chat-header {
    padding: 12px 20px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 12px;
  }
  .chat-messages {
    flex: 1; overflow: auto; padding: 16px 20px;
    display: flex; flex-direction: column; gap: 4px;
  }

  .msg-group { display: flex; gap: 12px; padding: 4px 0; }
  .msg-group:hover { background: rgba(255,255,255,0.02); border-radius: 6px; }
  .msg-content { flex: 1; }
  .msg-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 3px; }
  .msg-author { font-size: 14px; font-weight: 600; }
  .msg-time { font-size: 11px; color: var(--text3); }
  .msg-text { font-size: 14px; color: var(--text2); line-height: 1.5; }
  .msg-text code {
    background: var(--bg4); border: 1px solid var(--border2);
    padding: 1px 5px; border-radius: 4px; font-family: var(--mono);
    font-size: 12px; color: var(--teal);
  }

  .typing-indicator {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 20px; font-size: 12px; color: var(--text3);
  }
  .typing-dots span {
    display: inline-block; width: 5px; height: 5px; border-radius: 50%;
    background: var(--text3); animation: bounce 1.2s ease-in-out infinite;
  }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

  .chat-input-area {
    padding: 12px 20px; border-top: 1px solid var(--border);
  }
  .chat-input-box {
    background: var(--bg3); border: 1px solid var(--border2);
    border-radius: var(--radius2); display: flex; align-items: flex-end; gap: 8px;
    padding: 10px 14px; transition: border-color var(--transition);
  }
  .chat-input-box:focus-within { border-color: var(--accent); }
  .chat-input {
    flex: 1; font-size: 14px; background: none; color: var(--text);
    resize: none; font-family: var(--sans); line-height: 1.5; max-height: 120px;
  }
  .chat-input::placeholder { color: var(--text3); }
  .chat-send-btn {
    width: 30px; height: 30px; border-radius: 8px;
    background: var(--accent); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; cursor: pointer; transition: all var(--transition);
    flex-shrink: 0;
  }
  .chat-send-btn:hover { background: var(--accent2); }

  .reaction-bar { display: flex; gap: 4px; margin-top: 4px; }
  .reaction {
    display: inline-flex; align-items: center; gap: 3px;
    background: var(--bg3); border: 1px solid var(--border2);
    border-radius: 99px; padding: 2px 8px; font-size: 12px; cursor: pointer;
    transition: all var(--transition);
  }
  .reaction:hover { border-color: var(--border3); }
  .reaction.active { background: rgba(124,110,240,0.15); border-color: var(--accent3); }

  /* ─── VIDEO CALL ─────────────────────────────── */
  .video-shell {
    background: #000; height: 100%;
    display: flex; flex-direction: column;
  }
  .video-grid {
    flex: 1; display: grid; gap: 3px; padding: 12px;
    grid-template-columns: repeat(2, 1fr);
  }
  .video-tile {
    background: var(--bg3); border-radius: var(--radius2);
    position: relative; overflow: hidden; aspect-ratio: 16/9;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid transparent; transition: border-color 0.2s;
  }
  .video-tile.speaking { border-color: var(--green); }
  .video-tile-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 700;
  }
  .video-tile-name {
    position: absolute; bottom: 10px; left: 10px;
    background: rgba(0,0,0,0.7); padding: 3px 10px;
    border-radius: 99px; font-size: 12px; font-weight: 500;
    display: flex; align-items: center; gap: 6px;
  }
  .video-tile-badge {
    position: absolute; top: 10px; right: 10px;
    display: flex; gap: 6px;
  }
  .video-controls {
    display: flex; align-items: center; justify-content: center; gap: 12px;
    padding: 16px; border-top: 1px solid rgba(255,255,255,0.05);
    background: rgba(0,0,0,0.8);
  }
  .video-ctrl-btn {
    width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; cursor: pointer; transition: all var(--transition);
    background: rgba(255,255,255,0.08); color: var(--text);
  }
  .video-ctrl-btn:hover { background: rgba(255,255,255,0.14); }
  .video-ctrl-btn.muted { background: rgba(244,63,94,0.2); color: var(--red); }
  .video-ctrl-btn.end { background: var(--red); color: #fff; width: 52px; height: 52px; font-size: 22px; }

  /* ─── WHITEBOARD ─────────────────────────────── */
  .whiteboard-shell { height: 100%; position: relative; overflow: hidden; background: #0d0d10; }
  .whiteboard-toolbar {
    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
    background: var(--bg2); border: 1px solid var(--border2);
    border-radius: var(--radius2); padding: 8px;
    display: flex; flex-direction: column; gap: 4px; z-index: 10;
    box-shadow: var(--shadow);
  }
  .wb-tool {
    width: 36px; height: 36px; border-radius: var(--radius); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; color: var(--text2); transition: all var(--transition);
  }
  .wb-tool:hover { background: var(--bg3); color: var(--text); }
  .wb-tool.active { background: rgba(124,110,240,0.15); color: var(--accent2); }

  /* ─── TASKS ─────────────────────────────── */
  .tasks-shell { height: 100%; display: flex; flex-direction: column; }
  .kanban { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 16px; flex: 1; }
  .kanban-col {
    min-width: 280px; background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius2); display: flex; flex-direction: column;
    max-height: 100%;
  }
  .kanban-col-header {
    padding: 14px 16px 12px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  }
  .kanban-col-title { font-size: 13px; font-weight: 600; }
  .kanban-count {
    background: var(--bg4); color: var(--text3); border-radius: 99px;
    padding: 1px 8px; font-size: 11px; font-weight: 500;
  }
  .kanban-col-body { padding: 10px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .task-card {
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 12px; cursor: grab;
    transition: all var(--transition);
  }
  .task-card:hover { border-color: var(--border3); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.4); }
  .task-title { font-size: 13px; font-weight: 500; margin-bottom: 8px; line-height: 1.4; }
  .task-meta { display: flex; align-items: center; gap: 6px; }
  .task-priority { width: 6px; height: 6px; border-radius: 50%; }
  .priority-high { background: var(--red); }
  .priority-med { background: var(--amber); }
  .priority-low { background: var(--green); }

  /* ─── NOTIFICATIONS ─────────────────────────────── */
  .notif-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 16px; border-bottom: 1px solid var(--border);
    cursor: pointer; transition: background var(--transition);
  }
  .notif-item:hover { background: var(--bg3); }
  .notif-item.unread { background: rgba(124,110,240,0.04); }
  .notif-body { flex: 1; }
  .notif-text { font-size: 13px; color: var(--text); line-height: 1.5; }
  .notif-time { font-size: 11px; color: var(--text3); margin-top: 4px; }
  .notif-unread-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--accent); flex-shrink: 0; margin-top: 5px;
  }

  /* ─── AI ASSISTANT ─────────────────────────────── */
  .ai-shell { display: flex; flex-direction: column; height: 100%; }
  .ai-messages { flex: 1; overflow: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
  .ai-msg { display: flex; gap: 12px; max-width: 680px; }
  .ai-msg.user { margin-left: auto; flex-direction: row-reverse; max-width: 520px; }
  .ai-bubble {
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: var(--radius2); padding: 14px 16px;
    font-size: 14px; color: var(--text2); line-height: 1.6;
  }
  .ai-msg.user .ai-bubble {
    background: rgba(124,110,240,0.15); border-color: rgba(124,110,240,0.3);
    color: var(--text);
  }
  .ai-avatar {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 14px;
    margin-top: 4px;
  }
  .ai-input-area { padding: 16px 24px; border-top: 1px solid var(--border); }
  .ai-input-box {
    background: var(--bg3); border: 1px solid var(--border2);
    border-radius: var(--radius2); display: flex; align-items: center; gap: 8px;
    padding: 12px 16px;
  }
  .ai-input-box:focus-within { border-color: var(--accent); }
  .ai-input { flex: 1; font-size: 14px; background: none; color: var(--text); font-family: var(--sans); }
  .ai-input::placeholder { color: var(--text3); }
  .ai-chips { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .ai-chip {
    background: var(--bg3); border: 1px solid var(--border2);
    border-radius: 99px; padding: 5px 14px; font-size: 12px; color: var(--text2);
    cursor: pointer; transition: all var(--transition);
  }
  .ai-chip:hover { border-color: var(--accent3); color: var(--accent2); }

  /* Loading shimmer */
  .shimmer {
    background: linear-gradient(90deg, var(--bg3) 25%, var(--bg4) 50%, var(--bg3) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* Tooltip */
  .tooltip { position: relative; }
  .tooltip-content {
    position: absolute; bottom: calc(100% + 6px); left: 50%;
    transform: translateX(-50%); background: var(--bg4);
    border: 1px solid var(--border2); border-radius: 6px;
    padding: 4px 10px; font-size: 11px; color: var(--text2);
    white-space: nowrap; pointer-events: none; z-index: 100;
    opacity: 0; transition: opacity 0.15s;
  }
  .tooltip:hover .tooltip-content { opacity: 1; }

  /* Scrollbar for main content */
  .content::-webkit-scrollbar { width: 4px; }

  /* Grid helpers */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

  /* Separator */
  .hr { height: 1px; background: var(--border); margin: 24px 0; }
`;

// DATA
const NAV = [
   { id: "landing", icon: "🌐", label: "Landing Page", section: "product" },
   { id: "dashboard", icon: "⚡", label: "Dashboard", section: "workspace", badge: null },
   { id: "document", icon: "📝", label: "Document Editor", section: "workspace" },
   { id: "chat", icon: "💬", label: "Team Chat", section: "workspace", badge: "3" },
   { id: "video", icon: "🎥", label: "Video Call", section: "workspace" },
   { id: "whiteboard", icon: "🎨", label: "Whiteboard", section: "workspace" },
   { id: "tasks", icon: "✅", label: "Tasks", section: "workspace" },
   { id: "ai", icon: "🤖", label: "AI Assistant", section: "workspace" },
   { id: "notifications", icon: "🔔", label: "Notifications", section: "system", badge: "5", badgeColor: "red" },
];

const USERS = [
   { name: "Alex Chen", initials: "AC", color: "#7c6ef0", role: "Engineer", status: "online" },
   { name: "Sara Kim", initials: "SK", color: "#2dd4bf", role: "Designer", status: "online" },
   { name: "Mike R", initials: "MR", color: "#f59e0b", role: "PM", status: "away" },
   { name: "Priya S", initials: "PS", color: "#f43f5e", role: "Engineer", status: "online" },
];

const MESSAGES = [
   { id: 1, author: "Sara Kim", color: "#2dd4bf", text: "Morning! Just pushed the new design tokens to Figma. Should be ready for review 👀", time: "9:12 AM", reactions: [{ emoji: "🔥", count: 3, active: false }, { emoji: "👍", count: 5, active: true }] },
   { id: 2, author: "Alex Chen", color: "#7c6ef0", text: "Awesome! I'll check them out. Also — the CRDT sync is finally working end-to-end. No more conflicts in multi-user editing 🎉", time: "9:15 AM", reactions: [{ emoji: "🎉", count: 7, active: false }] },
   { id: 3, author: "Mike R", color: "#f59e0b", text: "That's huge! Can we demo it in today's standup? Also need to sync on the Q2 roadmap.", time: "9:18 AM", reactions: [] },
   { id: 4, author: "Priya S", color: "#f43f5e", text: "Sure! Also finally fixed the WebSocket reconnection bug. The `exponential backoff` now works correctly. Check PR #342.", time: "9:21 AM", reactions: [{ emoji: "🙏", count: 4, active: false }] },
   { id: 5, author: "Sara Kim", color: "#2dd4bf", text: "Perfect. I'll review it after the meeting. Oh and the landing page animation is 🔥 btw", time: "9:24 AM", reactions: [{ emoji: "💯", count: 2, active: false }] },
];

const TASKS = {
   "Backlog": [
      { id: 1, title: "Implement spatial audio in video calls", priority: "low", assignee: "AC", tag: "feature" },
      { id: 2, title: "Add AI meeting summarization pipeline", priority: "med", assignee: "PS", tag: "ai" },
      { id: 3, title: "Mobile offline sync improvements", priority: "low", assignee: "MR", tag: "mobile" },
   ],
   "In Progress": [
      { id: 4, title: "CRDT document merge conflict resolver", priority: "high", assignee: "AC", tag: "core" },
      { id: 5, title: "Real-time whiteboard sync engine", priority: "high", assignee: "SK", tag: "core" },
      { id: 6, title: "WebSocket gateway cluster scaling", priority: "med", assignee: "PS", tag: "infra" },
   ],
   "Review": [
      { id: 7, title: "PR #342: WebSocket reconnection backoff", priority: "med", assignee: "PS", tag: "fix" },
      { id: 8, title: "Design token system v2", priority: "low", assignee: "SK", tag: "design" },
   ],
   "Done": [
      { id: 9, title: "OAuth2 + SSO integration", priority: "high", assignee: "AC", tag: "auth" },
      { id: 10, title: "Presence engine v1", priority: "high", assignee: "MR", tag: "core" },
   ],
};

const AI_MSGS = [
   { role: "assistant", text: "Hello! I'm Pletto AI — your intelligent workspace assistant. I have context about your team's recent activity, documents, and projects. What would you like to work on?" },
   { role: "user", text: "Summarize our sprint progress and highlight blockers" },
   { role: "assistant", text: "Here's a summary of Sprint 12 (week 3 of 4):\n\n**Completed ✅:** OAuth2/SSO integration, Presence engine v1, WebSocket reconnection fix (PR #342 in review)\n\n**In Progress 🔄:** CRDT conflict resolver (70% — Alex), Whiteboard sync engine (55% — Sara), Gateway cluster scaling (40% — Priya)\n\n**Blockers 🚨:** The CRDT merge resolver has an edge case with concurrent offline edits across 3+ users. Alex flagged this in Slack — needs architectural discussion before closing. Recommend scheduling a 30-min sync today.\n\n**Velocity:** On track for sprint goal. 3 of 6 planned items completed." },
];

// COMPONENTS

function Avatar({ user, size = 30 }) {
   return (
      <div className="avatar" style={{ width: size, height: size, background: user.color + "22", color: user.color, fontSize: size * 0.37 }}>
         {user.initials}
      </div>
   );
}

function TagBadge({ label, type = "gray" }) {
   return <span className={`tag tag-${type}`}>{label}</span>;
}

// ─── LANDING PAGE ───────────────────────────────────────────
function LandingPage({ onEnter }) {
   const [typed, setTyped] = useState("");
   const words = ["collaborate.", "create.", "communicate.", "synchronize.", "innovate."];
   const [wIdx, setWIdx] = useState(0);

   useEffect(() => {
      let i = 0, current = words[wIdx], timeout;
      function type() {
         if (i <= current.length) {
            setTyped(current.slice(0, i));
            i++;
            timeout = setTimeout(type, 55);
         } else {
            timeout = setTimeout(() => {
               setWIdx(w => (w + 1) % words.length);
            }, 1600);
         }
      }
      type();
      return () => clearTimeout(timeout);
   }, [wIdx]);

   const tickerItems = ["Real-time CRDT Sync", "WebSocket Mesh", "AI Collaboration", "Offline First", "E2E Encrypted", "WebRTC SFU", "Multiplayer Cursors", "Distributed Presence"];

   return (
      <div className="landing">
         {/* Nav */}
         <nav className="landing-nav">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
               <div className="logo-mark">P</div>
               <span className="logo-name">pletto</span>
            </div>
            <div className="landing-nav-links">
               {["Product", "Features", "Pricing", "Docs"].map(l => (
                  <span key={l} className="landing-nav-link">{l}</span>
               ))}
            </div>
            <div className="landing-nav-actions">
               <button className="btn btn-ghost btn-sm" onClick={onEnter}>Sign in</button>
               <button className="btn btn-primary btn-sm" onClick={onEnter}>Start free →</button>
            </div>
         </nav>

         {/* Ticker */}
         <div className="ticker">
            <div className="ticker-inner">
               {[...tickerItems, ...tickerItems].map((item, i) => (
                  <span key={i} className="ticker-item">
                     <span className="ticker-dot" />
                     {item}
                  </span>
               ))}
            </div>
         </div>

         {/* Hero */}
         <div className="hero">
            <div className="hero-eyebrow">
               <span style={{ fontSize: 10 }}>✦</span> The multiplayer OS for teams
            </div>
            <h1 className="hero-title">
               Built for teams who<br />
               <span style={{ color: "var(--accent2)" }}>{typed}</span>
               <span style={{ borderRight: "3px solid var(--accent)", animation: "cursorBlink 1s step-end infinite", paddingLeft: 2 }} />
            </h1>
            <p className="hero-sub">
               One platform for docs, chat, video, whiteboard, and AI — all synchronized in real time. No context switching. No friction.
            </p>
            <div className="hero-actions">
               <button className="btn-hero btn-hero-primary" onClick={onEnter}>
                  Start collaborating <span>→</span>
               </button>
               <button className="btn-hero btn-hero-ghost" onClick={onEnter}>
                  Watch demo <span>▶</span>
               </button>
            </div>
         </div>

         {/* Demo window */}
         <div style={{ padding: "0 48px" }}>
            <div className="demo-window">
               <div className="demo-titlebar">
                  <div className="demo-dot r" /><div className="demo-dot y" /><div className="demo-dot g" />
                  <div className="demo-url-bar">app.pletto.io/workspace/nexus/docs/q2-roadmap</div>
                  <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                     {USERS.slice(0, 3).map(u => (
                        <div key={u.name} style={{ width: 20, height: 20, borderRadius: "50%", background: u.color + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, color: u.color }}>{u.initials}</div>
                     ))}
                  </div>
               </div>
               <DemoDocPreview />
            </div>
         </div>

         {/* Stats */}
         <div className="stats-bar" style={{ margin: "72px 0" }}>
            {[["< 50ms", "Sync latency"], ["10M+", "Ops/day"], ["99.99%", "Uptime"], ["256-bit", "Encryption"]].map(([v, l]) => (
               <div key={l} className="stat-item">
                  <div className="stat-value">{v}</div>
                  <div className="stat-label">{l}</div>
               </div>
            ))}
         </div>

         {/* Features */}
         <div className="features">
            <div style={{ textAlign: "center", marginBottom: 48 }}>
               <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, marginBottom: 12 }}>Every tool. One workspace.</h2>
               <p style={{ color: "var(--text2)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
                  Stop switching between 8 different apps. Pletto brings everything into a single synchronized environment.
               </p>
            </div>
            <div className="features-grid">
               {[
                  { icon: "📝", bg: "rgba(124,110,240,0.15)", title: "Collaborative Docs", desc: "Multiplayer editing with live cursors, inline comments, and version history. CRDT-powered conflict resolution." },
                  { icon: "💬", bg: "rgba(45,212,191,0.15)", title: "Real-time Chat", desc: "Channels, DMs, threads, reactions. AI-powered summaries and smart priority notifications." },
                  { icon: "🎥", bg: "rgba(244,63,94,0.12)", title: "Video & Audio", desc: "WebRTC SFU architecture. Spatial audio, live captions, AI transcription, and collaborative notes during calls." },
                  { icon: "🎨", bg: "rgba(245,158,11,0.12)", title: "Infinite Whiteboard", desc: "WebGL-powered canvas with multiplayer object sync, sticky notes, diagrams, and AI diagram generation." },
                  { icon: "✅", bg: "rgba(34,197,94,0.12)", title: "Project Management", desc: "Kanban, timeline, calendar, and graph views. Real-time task updates with presence-aware editing." },
                  { icon: "🤖", bg: "rgba(124,110,240,0.1)", title: "AI Layer", desc: "Context-aware assistant embedded everywhere. Meeting summaries, smart search, workspace memory, and inline suggestions." },
               ].map(f => (
                  <div key={f.title} className="feature-card">
                     <div className="feature-icon" style={{ background: f.bg }}>{f.icon}</div>
                     <div className="feature-title">{f.title}</div>
                     <div className="feature-desc">{f.desc}</div>
                  </div>
               ))}
            </div>
         </div>

         {/* CTA */}
         <div style={{ textAlign: "center", padding: "80px 48px", background: "var(--bg2)", borderTop: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.5, marginBottom: 16 }}>
               Ready to build together?
            </h2>
            <p style={{ color: "var(--text2)", marginBottom: 32, fontSize: 16 }}>Free for teams up to 5. No credit card required.</p>
            <button className="btn-hero btn-hero-primary" onClick={onEnter} style={{ margin: "0 auto" }}>
               Create your workspace →
            </button>
         </div>
      </div>
   );
}

function DemoDocPreview() {
   const [text, setText] = useState("This document outlines the Q2 2025 engineering roadmap for Pletto. Our primary focus this quarter is scaling the real-time synchronization engine to support 10M+ concurrent operations per day, while maintaining sub-50ms latency across all global regions.");
   const cursors = [
      { name: "Sara K", color: "#2dd4bf", x: "42%", y: "68px" },
      { name: "Priya S", color: "#f43f5e", x: "68%", y: "108px" },
   ];

   return (
      <div style={{ padding: "28px 48px 32px", position: "relative", minHeight: 240 }}>
         <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.8, marginBottom: 12, color: "var(--text)" }}>
            Q2 2025 Engineering Roadmap
         </div>
         <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.8, maxWidth: 680 }}>
            {text}
            <span className="editor-cursor" />
         </div>

         {/* Live cursors */}
         {cursors.map(c => (
            <div key={c.name} className="mp-cursor" style={{ left: c.x, top: c.y }}>
               <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="M2 2 L12 7 L7 8 L5 13 Z" fill={c.color} />
               </svg>
               <div className="mp-cursor-label" style={{ background: c.color, fontSize: 10, padding: "1px 6px", marginTop: 2 }}>{c.name}</div>
            </div>
         ))}

         {/* Collaboration bar */}
         <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
            <div style={{ display: "flex" }}>
               {USERS.map(u => (
                  <div key={u.name} className="presence-avatar" style={{ background: u.color + "22", color: u.color, fontSize: 9, fontWeight: 700, width: 24, height: 24, border: "2px solid var(--bg3)" }}>
                     {u.initials}
                  </div>
               ))}
            </div>
            <span style={{ fontSize: 12, color: "var(--text3)" }}>4 people editing</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
               <div style={{ fontSize: 11, color: "var(--green)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="status-dot online" style={{ width: 5, height: 5 }} /> Synced
               </div>
               <div className="tag tag-purple" style={{ fontSize: 10 }}>CRDT active</div>
            </div>
         </div>
      </div>
   );
}

// ─── DASHBOARD ───────────────────────────────────────────────
function Dashboard({ onNav }) {
   const activity = [
      { user: USERS[1], text: "updated the design system tokens in Figma", time: "2m ago" },
      { user: USERS[0], text: "merged PR #342 — WebSocket reconnection fix", time: "15m ago" },
      { user: USERS[2], text: "created a new meeting: Q2 Roadmap Review", time: "1h ago" },
      { user: USERS[3], text: "commented on CRDT Engine — 'edge case found with 3+ concurrent users'", time: "2h ago" },
      { user: USERS[1], text: "published the landing page design v3", time: "3h ago" },
   ];

   return (
      <div className="content">
         <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
               <h1 className="section-title">Good morning, Alex 👋</h1>
               <p className="section-sub">Here's what's happening in your workspace today.</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
               <button className="btn btn-ghost btn-sm" onClick={() => onNav("document")}>+ New Doc</button>
               <button className="btn btn-primary btn-sm" onClick={() => onNav("video")}>🎥 Start Call</button>
            </div>
         </div>

         {/* Stat cards */}
         <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
               { label: "Docs edited today", value: "14", change: "+3 from yesterday", pos: true },
               { label: "Active collaborators", value: "4", change: "All online now", pos: true },
               { label: "Messages today", value: "127", change: "+22%", pos: true },
               { label: "Tasks closed", value: "6", change: "-2 from avg", pos: false },
            ].map(s => (
               <div key={s.label} className="stat-card">
                  <div className="stat-card-label">{s.label}</div>
                  <div className="stat-card-value">{s.value}</div>
                  <div className={`stat-card-change${s.pos ? "" : " neg"}`}>{s.change}</div>
               </div>
            ))}
         </div>

         <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
            {/* Activity */}
            <div className="card">
               <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Team Activity</div>
               {activity.map((a, i) => (
                  <div key={i} className="activity-item">
                     <Avatar user={a.user} size={28} />
                     <div className="activity-body">
                        <div className="activity-text">
                           <strong>{a.user.name}</strong>{" "}{a.text}
                        </div>
                        <div className="activity-meta">{a.time}</div>
                     </div>
                  </div>
               ))}
            </div>

            {/* Right col */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
               {/* Quick actions */}
               <div className="card" style={{ padding: "16px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--text2)" }}>Quick Actions</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                     {[
                        { icon: "📝", title: "New document", desc: "Start writing", page: "document" },
                        { icon: "💬", title: "Open chat", desc: "View messages", page: "chat" },
                        { icon: "✅", title: "View tasks", desc: "See kanban board", page: "tasks" },
                        { icon: "🤖", title: "Ask AI", desc: "Get workspace insights", page: "ai" },
                     ].map(a => (
                        <button key={a.title} className="quick-action" onClick={() => onNav(a.page)}>
                           <div className="quick-action-icon" style={{ background: "var(--bg4)", fontSize: 18 }}>{a.icon}</div>
                           <div>
                              <div className="quick-action-title">{a.title}</div>
                              <div className="quick-action-desc">{a.desc}</div>
                           </div>
                           <span style={{ marginLeft: "auto", color: "var(--text3)", fontSize: 12 }}>→</span>
                        </button>
                     ))}
                  </div>
               </div>

               {/* Team presence */}
               <div className="card" style={{ padding: "16px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--text2)" }}>Team Online</div>
                  {USERS.map(u => (
                     <div key={u.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                        <Avatar user={u} size={28} />
                        <div style={{ flex: 1 }}>
                           <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                           <div style={{ fontSize: 11, color: "var(--text3)" }}>{u.role}</div>
                        </div>
                        <span className={`status-dot ${u.status}`} />
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
}

// ─── DOCUMENT EDITOR ─────────────────────────────────────────
function DocumentEditor() {
   const [activeTab, setActiveTab] = useState("comments");
   const [bold, setBold] = useState(false);
   const [italic, setItalic] = useState(false);

   const comments = [
      { author: USERS[1], color: "#2dd4bf", text: "Should we add the infrastructure cost breakdown here?", time: "10m ago" },
      { author: USERS[2], color: "#f59e0b", text: "Great point on the CRDT section — let's link to the technical spec.", time: "1h ago" },
   ];

   const versions = [
      { title: "Current version", meta: "Alex Chen · just now", color: "#7c6ef0" },
      { title: "Added infra section", meta: "Sara Kim · 2h ago", color: "#2dd4bf" },
      { title: "Initial draft", meta: "Alex Chen · Yesterday", color: "#f59e0b" },
   ];

   return (
      <div className="editor-shell">
         {/* Toolbar */}
         <div className="editor-toolbar">
            <div className="presence-cluster" style={{ marginRight: 8 }}>
               {USERS.map(u => (
                  <div key={u.name} className="presence-avatar" style={{ background: u.color + "22", color: u.color, fontSize: 9, fontWeight: 700, border: "2px solid var(--bg2)" }}>
                     {u.initials}
                  </div>
               ))}
               <span className="presence-count">4 editing</span>
            </div>
            <div className="toolbar-sep" />
            {["B", "I", "U"].map((f, i) => (
               <button key={f} className={`toolbar-btn${(f === "B" && bold) || (f === "I" && italic) ? " active" : ""}`}
                  onClick={() => { if (f === "B") setBold(b => !b); if (f === "I") setItalic(i => !i); }}
                  style={{ fontWeight: f === "B" ? "700" : "400", fontStyle: f === "I" ? "italic" : "normal" }}>
                  {f}
               </button>
            ))}
            <div className="toolbar-sep" />
            {["H1", "H2", "H3"].map(h => <button key={h} className="toolbar-btn">{h}</button>)}
            {["—", "• List", "1. List", "[ ] Task", "Code", "Quote"].map(t => (
               <button key={t} className="toolbar-btn">{t}</button>
            ))}
            <div className="toolbar-sep" />
            <button className="toolbar-btn">@ Mention</button>
            <button className="toolbar-btn">🤖 AI</button>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
               <div style={{ fontSize: 11, color: "var(--green)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="status-dot online" style={{ width: 5, height: 5 }} /> Saved
               </div>
               <button className="btn btn-ghost btn-sm">Share</button>
               <button className="btn btn-primary btn-sm">Publish</button>
            </div>
         </div>

         <div className="editor-body">
            {/* Main editor */}
            <div className="editor-main" style={{ position: "relative" }}>
               {/* Live cursors */}
               <div className="mp-cursor" style={{ left: "38%", top: "165px" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2 L12 7 L7 8 L5 13 Z" fill="#2dd4bf" /></svg>
                  <div className="mp-cursor-label" style={{ background: "#2dd4bf", fontSize: 10, padding: "1px 7px" }}>Sara K</div>
               </div>
               <div className="mp-cursor" style={{ left: "62%", top: "310px" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2 L12 7 L7 8 L5 13 Z" fill="#f43f5e" /></svg>
                  <div className="mp-cursor-label" style={{ background: "#f43f5e", fontSize: 10, padding: "1px 7px" }}>Priya S</div>
               </div>

               <div className="editor-doc">
                  <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                     <TagBadge label="Engineering" type="purple" />
                     <TagBadge label="Q2 2025" type="teal" />
                     <TagBadge label="Draft" type="amber" />
                  </div>
                  <h1 className="editor-h1" style={{ fontWeight: bold ? 700 : 700 }}>
                     Q2 2025 Engineering Roadmap
                  </h1>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, fontSize: 12, color: "var(--text3)" }}>
                     <span>Alex Chen</span>
                     <span>·</span>
                     <span>Updated just now</span>
                     <span>·</span>
                     <span>1,420 words</span>
                  </div>

                  <h2 className="editor-h2">Overview</h2>
                  <p className="editor-p" style={{ fontStyle: italic ? "italic" : "normal" }}>
                     This document outlines the Q2 2025 engineering roadmap for Pletto. Our primary focus this quarter is scaling the real-time synchronization engine to support 10M+ concurrent operations per day, while maintaining sub-50ms latency across all global regions.
                  </p>

                  <h2 className="editor-h2">Core Initiatives</h2>
                  <p className="editor-p">
                     The CRDT-based document engine is the cornerstone of our collaboration platform. We are targeting full offline-first support with automatic conflict resolution for all document types — including structured data, code blocks, and embedded media.
                  </p>

                  <p className="editor-p">
                     Infrastructure scaling will focus on the WebSocket gateway cluster, with horizontal scaling targets of 1M concurrent connections per region. The Kafka-based event streaming layer needs to be upgraded to handle peak load during global meetings.
                     <span className="editor-cursor" />
                  </p>

                  <h2 className="editor-h2">AI Integration Milestones</h2>
                  <p className="editor-p">
                     The AI collaboration layer will receive significant investment this quarter. Key deliverables include real-time meeting transcription with action item extraction, semantic workspace search powered by vector embeddings, and an inline AI editing assistant embedded directly in the document editor.
                  </p>

                  {/* Highlighted selection (simulated) */}
                  <div style={{ background: "rgba(45,212,191,0.12)", borderRadius: 4, padding: "2px 0", display: "inline" }}>
                     <p className="editor-p" style={{ background: "rgba(45,212,191,0.12)", borderRadius: 4, padding: "8px 12px", margin: "0 0 16px", borderLeft: "3px solid var(--teal)" }}>
                        <strong style={{ color: "var(--teal)", fontSize: 11, display: "block", marginBottom: 4 }}>Sara K is editing</strong>
                        Video infrastructure will be upgraded to a full SFU architecture supporting 200+ concurrent participants per room, with adaptive bitrate streaming and sub-100ms media latency.
                     </p>
                  </div>
               </div>
            </div>

            {/* Sidebar */}
            <div className="editor-sidebar">
               <div className="editor-sidebar-tabs">
                  {["comments", "history", "ai"].map(t => (
                     <div key={t} className={`editor-sidebar-tab${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
                        {t === "comments" ? "💬" : t === "history" ? "🕐" : "🤖"} {t.charAt(0).toUpperCase() + t.slice(1)}
                     </div>
                  ))}
               </div>
               <div className="editor-sidebar-content">
                  {activeTab === "comments" && (
                     <>
                        <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginBottom: 12 }}>+ Add comment</button>
                        {comments.map((c, i) => (
                           <div key={i} className="comment">
                              <div className="comment-author" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                 <div className="avatar" style={{ width: 20, height: 20, background: c.color + "22", color: c.color, fontSize: 8 }}>{c.author.initials}</div>
                                 <span style={{ fontSize: 12 }}>{c.author.name}</span>
                                 <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text3)" }}>{c.time}</span>
                              </div>
                              <div className="comment-text">{c.text}</div>
                              <div className="comment-actions">
                                 <span className="comment-action">Reply</span>
                                 <span className="comment-action">Resolve</span>
                              </div>
                           </div>
                        ))}
                     </>
                  )}
                  {activeTab === "history" && (
                     <>
                        <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>Version history</div>
                        {versions.map((v, i) => (
                           <div key={i} className="version-item">
                              <div className="version-dot" style={{ background: v.color }} />
                              <div>
                                 <div className="version-title">{v.title}</div>
                                 <div className="version-meta">{v.meta}</div>
                              </div>
                              {i === 0 && <TagBadge label="current" type="purple" />}
                           </div>
                        ))}
                     </>
                  )}
                  {activeTab === "ai" && (
                     <div>
                        <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>AI suggestions</div>
                        {[
                           { label: "Improve clarity", icon: "✨" },
                           { label: "Add executive summary", icon: "📋" },
                           { label: "Generate timeline", icon: "📅" },
                           { label: "Extract action items", icon: "✅" },
                        ].map(a => (
                           <button key={a.label} className="quick-action" style={{ marginBottom: 8 }}>
                              <span style={{ fontSize: 15 }}>{a.icon}</span>
                              <span style={{ fontSize: 13 }}>{a.label}</span>
                           </button>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}

// ─── CHAT ────────────────────────────────────────────────────
function Chat() {
   const [input, setInput] = useState("");
   const [messages, setMessages] = useState(MESSAGES);
   const [reactions, setReactions] = useState({});
   const messagesEndRef = useRef(null);

   const channels = [
      { name: "general", unread: 0 },
      { name: "engineering", unread: 3, active: true },
      { name: "design", unread: 0 },
      { name: "product", unread: 0 },
      { name: "random", unread: 1 },
   ];

   const dms = USERS.map(u => ({ user: u, unread: 0 }));

   function sendMsg() {
      if (!input.trim()) return;
      setMessages(m => [...m, {
         id: m.length + 1,
         author: "Alex Chen",
         color: "#7c6ef0",
         text: input,
         time: "now",
         reactions: []
      }]);
      setInput("");
   }

   return (
      <div className="chat-shell">
         <div className="chat-channels">
            <div className="channel-section">
               <div className="channel-section-label">
                  Channels
                  <span style={{ fontSize: 14, cursor: "pointer" }}>+</span>
               </div>
               {channels.map(c => (
                  <div key={c.name} className={`channel-item${c.active ? " active" : ""}`}>
                     <span style={{ color: "var(--text3)", fontSize: 13 }}>#</span>
                     {c.name}
                     {c.unread > 0 && <span className="channel-unread" style={{ color: c.active ? "var(--accent2)" : "var(--red)" }}>{c.unread}</span>}
                  </div>
               ))}
            </div>
            <div className="channel-section">
               <div className="channel-section-label">Direct Messages</div>
               {dms.map(d => (
                  <div key={d.user.name} className="channel-item">
                     <div className="avatar" style={{ width: 18, height: 18, background: d.user.color + "22", color: d.user.color, fontSize: 7, flexShrink: 0 }}>{d.user.initials}</div>
                     {d.user.name.split(" ")[0]}
                     <span className={`status-dot ${d.user.status}`} style={{ marginLeft: "auto" }} />
                  </div>
               ))}
            </div>
         </div>

         <div className="chat-main">
            <div className="chat-header">
               <span style={{ fontSize: 15, fontWeight: 600 }}># engineering</span>
               <span style={{ fontSize: 13, color: "var(--text3)" }}>4 members</span>
               <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <button className="icon-btn">🔍</button>
                  <button className="icon-btn">📌</button>
                  <button className="icon-btn">⚙️</button>
               </div>
            </div>

            <div className="chat-messages" ref={messagesEndRef}>
               {messages.map(msg => {
                  const user = USERS.find(u => u.name === msg.author) || { initials: msg.author.slice(0, 2), color: "#7c6ef0", name: msg.author };
                  return (
                     <div key={msg.id} className="msg-group">
                        <div className="avatar" style={{ width: 32, height: 32, background: user.color + "22", color: user.color, fontSize: 11, flexShrink: 0 }}>{user.initials}</div>
                        <div className="msg-content">
                           <div className="msg-header">
                              <span className="msg-author" style={{ color: user.color }}>{msg.author}</span>
                              <span className="msg-time">{msg.time}</span>
                           </div>
                           <div className="msg-text">{msg.text}</div>
                           {msg.reactions.length > 0 && (
                              <div className="reaction-bar">
                                 {msg.reactions.map(r => (
                                    <div key={r.emoji} className={`reaction${r.active ? " active" : ""}`}>
                                       {r.emoji} <span style={{ fontSize: 11 }}>{r.count}</span>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     </div>
                  );
               })}
            </div>

            <div className="typing-indicator">
               <div className="typing-dots">
                  <span /><span /><span />
               </div>
               Sara Kim is typing...
            </div>

            <div className="chat-input-area">
               <div className="chat-input-box">
                  <span style={{ fontSize: 16, color: "var(--text3)" }}>+</span>
                  <textarea
                     className="chat-input"
                     rows={1}
                     placeholder="Message #engineering..."
                     value={input}
                     onChange={e => setInput(e.target.value)}
                     onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  />
                  <span style={{ fontSize: 15, color: "var(--text3)" }}>😊</span>
                  <span style={{ fontSize: 15, color: "var(--text3)" }}>@</span>
                  <button className="chat-send-btn" onClick={sendMsg}>→</button>
               </div>
            </div>
         </div>
      </div>
   );
}

// ─── VIDEO CALL ───────────────────────────────────────────────
function VideoCall() {
   const [muted, setMuted] = useState(false);
   const [camOff, setCamOff] = useState(false);
   const [speaking, setSpeaking] = useState(0);

   useEffect(() => {
      const iv = setInterval(() => {
         setSpeaking(s => (s + 1) % 4);
      }, 2200);
      return () => clearInterval(iv);
   }, []);

   const colors = [
      ["#7c6ef0", "#3d3575"],
      ["#2dd4bf", "#1a7a6e"],
      ["#f59e0b", "#8a6209"],
      ["#f43f5e", "#8a2037"],
   ];

   return (
      <div className="video-shell">
         <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Q2 Roadmap Review</span>
            <div className="tag tag-red" style={{ fontSize: 11 }}>● Live 24:37</div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
               <button className="btn btn-ghost btn-sm">📋 Notes</button>
               <button className="btn btn-ghost btn-sm">🤖 Transcription ON</button>
            </div>
         </div>

         <div className="video-grid">
            {USERS.map((u, i) => (
               <div key={u.name} className={`video-tile${speaking === i ? " speaking" : ""}`}
                  style={{ background: `linear-gradient(135deg, ${colors[i][1]}, #0d0d10)` }}>
                  <div className="video-tile-avatar" style={{ background: u.color + "22", color: u.color }}>
                     {u.initials}
                  </div>
                  <div className="video-tile-name">
                     {speaking === i && <span style={{ color: "var(--green)", fontSize: 10 }}>●</span>}
                     {u.name}
                  </div>
                  <div className="video-tile-badge">
                     {i === 0 && <span style={{ fontSize: 10, background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 99, color: "#fff" }}>You</span>}
                  </div>
               </div>
            ))}
         </div>

         <div className="video-controls">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
               <button className={`video-ctrl-btn${muted ? " muted" : ""}`} onClick={() => setMuted(m => !m)}>
                  {muted ? "🔇" : "🎙️"}
               </button>
               <span style={{ fontSize: 10, color: "var(--text3)" }}>{muted ? "Unmute" : "Mute"}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
               <button className={`video-ctrl-btn${camOff ? " muted" : ""}`} onClick={() => setCamOff(c => !c)}>
                  {camOff ? "📵" : "📷"}
               </button>
               <span style={{ fontSize: 10, color: "var(--text3)" }}>{camOff ? "Start Cam" : "Stop Cam"}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
               <button className="video-ctrl-btn">🖥️</button>
               <span style={{ fontSize: 10, color: "var(--text3)" }}>Share</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
               <button className="video-ctrl-btn">😄</button>
               <span style={{ fontSize: 10, color: "var(--text3)" }}>React</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
               <button className="video-ctrl-btn end">📵</button>
               <span style={{ fontSize: 10, color: "var(--text3)" }}>Leave</span>
            </div>
         </div>
      </div>
   );
}

// ─── WHITEBOARD ───────────────────────────────────────────────
function Whiteboard() {
   const [tool, setTool] = useState("select");
   const tools = [
      { id: "select", icon: "↖", label: "Select" },
      { id: "pen", icon: "✏️", label: "Draw" },
      { id: "shape", icon: "⬜", label: "Shape" },
      { id: "text", icon: "T", label: "Text" },
      { id: "sticky", icon: "🗒", label: "Note" },
      { id: "connector", icon: "→", label: "Connect" },
      { id: "hand", icon: "✋", label: "Pan" },
   ];

   // Sticky notes data
   const stickies = [
      { x: 120, y: 80, color: "#7c6ef0", text: "CRDT sync\nengine v2", by: "AC" },
      { x: 300, y: 140, color: "#2dd4bf", text: "WebRTC SFU\nscaling plan", by: "SK" },
      { x: 500, y: 90, color: "#f59e0b", text: "AI meeting\nsummarizer", by: "MR" },
      { x: 180, y: 280, color: "#f43f5e", text: "Mobile offline\nsync improvements", by: "PS" },
      { x: 420, y: 260, color: "#22c55e", text: "Design system\ntokens v2", by: "SK" },
   ];

   // Shapes
   const shapes = [
      { type: "rect", x: 100, y: 420, w: 140, h: 60, color: "#7c6ef0", label: "Backend" },
      { type: "rect", x: 290, y: 420, w: 140, h: 60, color: "#2dd4bf", label: "Frontend" },
      { type: "rect", x: 480, y: 420, w: 140, h: 60, color: "#f59e0b", label: "AI Layer" },
   ];

   return (
      <div className="whiteboard-shell">
         {/* Grid background */}
         <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06 }}>
            <defs>
               <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeWidth="0.5" />
               </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
         </svg>

         {/* Toolbar */}
         <div className="whiteboard-toolbar">
            {tools.map(t => (
               <div key={t.id} className={`wb-tool${tool === t.id ? " active" : ""}`} onClick={() => setTool(t.id)} title={t.label}>
                  <span style={{ fontFamily: t.id === "select" || t.id === "shape" || t.id === "connector" ? "monospace" : "inherit" }}>{t.icon}</span>
               </div>
            ))}
            <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
            <div className="wb-tool" title="Undo">↩</div>
            <div className="wb-tool" title="Zoom in">+</div>
            <div className="wb-tool" title="Zoom out">−</div>
         </div>

         {/* Canvas */}
         <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: tool === "hand" ? "grab" : "crosshair" }}>
            {/* Connector lines */}
            <line x1="170" y1="450" x2="290" y2="450" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="6 3" markerEnd="url(#arr)" />
            <line x1="430" y1="450" x2="480" y2="450" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="6 3" />
            <defs>
               <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M 0 0 L 6 3 L 0 6 Z" fill="rgba(255,255,255,0.3)" />
               </marker>
            </defs>

            {/* Shapes */}
            {shapes.map((s, i) => (
               <g key={i}>
                  <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="10"
                     fill={s.color + "22"} stroke={s.color + "88"} strokeWidth="1.5" />
                  <text x={s.x + s.w / 2} y={s.y + s.h / 2 + 1} textAnchor="middle" dominantBaseline="central"
                     fill={s.color} fontSize="13" fontWeight="600" fontFamily="Bricolage Grotesque, sans-serif">
                     {s.label}
                  </text>
               </g>
            ))}
         </svg>

         {/* Sticky notes */}
         {stickies.map((s, i) => (
            <div key={i} style={{
               position: "absolute", left: s.x, top: s.y,
               width: 140, background: s.color + "18",
               border: `1px solid ${s.color}44`, borderRadius: 10,
               padding: "12px 14px", cursor: "grab",
               boxShadow: `0 4px 16px rgba(0,0,0,0.4)`,
               transform: `rotate(${(i % 3 - 1) * 1.5}deg)`,
            }}>
               <div style={{ fontSize: 11, fontWeight: 600, color: s.color, whiteSpace: "pre", lineHeight: 1.5, marginBottom: 8 }}>{s.text}</div>
               <div style={{ fontSize: 10, color: "var(--text3)" }}>— {s.by}</div>
            </div>
         ))}

         {/* Multiplayer cursors */}
         <div style={{ position: "absolute", left: "45%", top: "35%", pointerEvents: "none" }}>
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2 L12 7 L7 8 L5 13 Z" fill="#2dd4bf" /></svg>
            <div style={{ background: "#2dd4bf", color: "#fff", fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 99, marginTop: 2, whiteSpace: "nowrap" }}>Sara K</div>
         </div>

         {/* Toolbar top right */}
         <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm">🤖 AI Diagram</button>
            <button className="btn btn-primary btn-sm">Share</button>
         </div>

         {/* Zoom indicator */}
         <div style={{ position: "absolute", bottom: 16, right: 16, background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 8, padding: "4px 12px", fontSize: 12, color: "var(--text2)" }}>
            100%
         </div>
      </div>
   );
}

// ─── TASKS ────────────────────────────────────────────────────
function Tasks() {
   const tagColors = { feature: "purple", ai: "teal", mobile: "amber", core: "red", infra: "gray", fix: "amber", design: "teal", auth: "purple" };
   const priorityClass = { high: "priority-high", med: "priority-med", low: "priority-low" };
   const userColors = { AC: "#7c6ef0", SK: "#2dd4bf", MR: "#f59e0b", PS: "#f43f5e" };

   return (
      <div className="tasks-shell">
         <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 6 }}>
               {["Kanban", "Timeline", "Calendar", "Graph"].map(v => (
                  <button key={v} className={`btn btn-ghost btn-sm${v === "Kanban" ? " btn-primary" : ""}`}>{v}</button>
               ))}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
               <button className="btn btn-ghost btn-sm">🔍 Filter</button>
               <button className="btn btn-ghost btn-sm">↕ Sort</button>
               <button className="btn btn-primary btn-sm">+ New Task</button>
            </div>
         </div>

         <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
            <div className="kanban">
               {Object.entries(TASKS).map(([col, tasks]) => (
                  <div key={col} className="kanban-col">
                     <div className="kanban-col-header">
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: col === "Done" ? "var(--green)" : col === "In Progress" ? "var(--accent)" : col === "Review" ? "var(--amber)" : "var(--text3)" }} />
                        <span className="kanban-col-title">{col}</span>
                        <span className="kanban-count">{tasks.length}</span>
                        <span style={{ marginLeft: "auto", fontSize: 16, cursor: "pointer", color: "var(--text3)" }}>+</span>
                     </div>
                     <div className="kanban-col-body">
                        {tasks.map(task => (
                           <div key={task.id} className="task-card">
                              <div className="task-title">{task.title}</div>
                              <div className="task-meta">
                                 <div className={`task-priority ${priorityClass[task.priority]}`} />
                                 <TagBadge label={task.tag} type={tagColors[task.tag] || "gray"} />
                                 <div style={{ marginLeft: "auto", width: 20, height: 20, borderRadius: "50%", background: (userColors[task.assignee] || "#888") + "22", color: userColors[task.assignee] || "#888", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {task.assignee}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
}

// ─── AI ASSISTANT ─────────────────────────────────────────────
function AIAssistant() {
   const [input, setInput] = useState("");
   const [messages, setMessages] = useState(AI_MSGS);
   const [loading, setLoading] = useState(false);

   const chips = ["Summarize sprint", "Find blockers", "Draft standup", "Explain CRDT", "Meeting notes"];

   function send(text) {
      const msg = text || input;
      if (!msg.trim()) return;
      setMessages(m => [...m, { role: "user", text: msg }]);
      setInput("");
      setLoading(true);
      setTimeout(() => {
         setMessages(m => [...m, { role: "assistant", text: "I'm analyzing your workspace context... Here's what I found based on recent activity, documents, and team discussions. Let me know if you'd like me to dive deeper into any specific area." }]);
         setLoading(false);
      }, 1400);
   }

   return (
      <div className="ai-shell">
         <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--teal))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🤖</div>
            <div>
               <div style={{ fontSize: 14, fontWeight: 600 }}>Pletto AI</div>
               <div style={{ fontSize: 11, color: "var(--green)" }}>● Online · Workspace context loaded</div>
            </div>
         </div>

         <div className="ai-messages">
            {messages.map((m, i) => (
               <div key={i} className={`ai-msg ${m.role}`}>
                  {m.role === "assistant" && (
                     <div className="ai-avatar" style={{ background: "linear-gradient(135deg, var(--accent), var(--teal))" }}>🤖</div>
                  )}
                  <div className="ai-bubble" style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                  {m.role === "user" && (
                     <div className="ai-avatar" style={{ background: "#7c6ef022" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>AC</span>
                     </div>
                  )}
               </div>
            ))}
            {loading && (
               <div className="ai-msg">
                  <div className="ai-avatar" style={{ background: "linear-gradient(135deg, var(--accent), var(--teal))" }}>🤖</div>
                  <div className="ai-bubble" style={{ display: "flex", gap: 5, alignItems: "center" }}>
                     <div className="typing-dots"><span /><span /><span /></div>
                     <span style={{ fontSize: 12, color: "var(--text3)" }}>Analyzing workspace...</span>
                  </div>
               </div>
            )}
         </div>

         <div className="ai-input-area">
            <div className="ai-chips">
               {chips.map(c => (
                  <button key={c} className="ai-chip" onClick={() => send(c)}>{c}</button>
               ))}
            </div>
            <div className="ai-input-box">
               <input
                  className="ai-input"
                  placeholder="Ask about your workspace, docs, meetings..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") send(); }}
               />
               <button className="chat-send-btn" onClick={() => send()}>→</button>
            </div>
         </div>
      </div>
   );
}

// ─── NOTIFICATIONS ────────────────────────────────────────────
function Notifications() {
   const notifs = [
      { user: USERS[1], text: "mentioned you in #engineering — '@Alex can you review PR #342?'", time: "2m ago", unread: true, icon: "💬" },
      { user: USERS[2], text: "invited you to Q2 Roadmap Review meeting — Today at 3 PM", time: "15m ago", unread: true, icon: "🎥" },
      { user: USERS[3], text: "assigned task 'CRDT edge case fix' to you", time: "1h ago", unread: true, icon: "✅" },
      { user: USERS[1], text: "commented on Q2 Roadmap doc — 'Should we add infra costs here?'", time: "2h ago", unread: false, icon: "📝" },
      { user: USERS[2], text: "published Design System v2 — 34 new tokens added", time: "3h ago", unread: false, icon: "🎨" },
      { user: USERS[0], text: "merged PR #341 — 'WebSocket reconnection backoff'", time: "5h ago", unread: false, icon: "⚡" },
      { user: USERS[3], text: "resolved comment on CRDT Engine doc", time: "Yesterday", unread: false, icon: "✓" },
   ];

   return (
      <div className="content">
         <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <h1 className="section-title" style={{ marginBottom: 0 }}>Notifications</h1>
            <TagBadge label="3 unread" type="red" />
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }}>Mark all read</button>
         </div>

         <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {notifs.map((n, i) => (
               <div key={i} className={`notif-item${n.unread ? " unread" : ""}`}>
                  {n.unread && <div className="notif-unread-dot" />}
                  <div className="avatar" style={{ width: 32, height: 32, background: n.user.color + "22", color: n.user.color, fontSize: 11, flexShrink: 0 }}>
                     {n.user.initials}
                  </div>
                  <div className="notif-body">
                     <div className="notif-text">
                        <strong>{n.user.name}</strong> {n.text}
                     </div>
                     <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: 12 }}>{n.icon}</span>
                        <span className="notif-time">{n.time}</span>
                     </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                     <button className="btn btn-ghost btn-sm">View</button>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}

// ─── COMMAND PALETTE ──────────────────────────────────────────
function CommandPalette({ onClose, onNav }) {
   const [q, setQ] = useState("");
   const inputRef = useRef(null);

   useEffect(() => { inputRef.current?.focus(); }, []);

   const items = [
      {
         group: "Navigate", items: [
            { icon: "⚡", label: "Dashboard", meta: "Home", page: "dashboard" },
            { icon: "📝", label: "Document Editor", meta: "New doc", page: "document" },
            { icon: "💬", label: "Team Chat", meta: "#engineering", page: "chat" },
            { icon: "🎥", label: "Start Video Call", meta: "Quick meet", page: "video" },
            { icon: "🎨", label: "Whiteboard", meta: "Canvas", page: "whiteboard" },
            { icon: "✅", label: "Tasks", meta: "Kanban", page: "tasks" },
            { icon: "🤖", label: "AI Assistant", meta: "Ask anything", page: "ai" },
         ]
      },
      {
         group: "Actions", items: [
            { icon: "📄", label: "New Document", meta: "⌘ N" },
            { icon: "📋", label: "Create Task", meta: "⌘ T" },
            { icon: "🔔", label: "View Notifications", meta: "⌘ .', page: 'notifications'" },
            { icon: "🔍", label: "Search Workspace", meta: "⌘ F" },
         ]
      },
   ];

   const filtered = items.map(g => ({
      ...g,
      items: g.items.filter(it => !q || it.label.toLowerCase().includes(q.toLowerCase()))
   })).filter(g => g.items.length > 0);

   return (
      <div className="command-overlay" onClick={onClose}>
         <div className="command-box" onClick={e => e.stopPropagation()}>
            <div className="command-input-row">
               <span className="command-input-icon">🔍</span>
               <input
                  ref={inputRef}
                  className="command-input"
                  placeholder="Search commands, pages, docs..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  onKeyDown={e => { if (e.key === "Escape") onClose(); }}
               />
               <span className="command-kbd">ESC</span>
            </div>
            <div className="command-results">
               {filtered.map(g => (
                  <div key={g.group}>
                     <div className="command-group-label">{g.group}</div>
                     {g.items.map(it => (
                        <div key={it.label} className="command-item" onClick={() => { if (it.page) { onNav(it.page); onClose(); } }}>
                           <span className="command-item-icon">{it.icon}</span>
                           {it.label}
                           <span className="command-item-meta">{it.meta}</span>
                        </div>
                     ))}
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────────────────────
export default function App() {
   const [page, setPage] = useState("landing");
   const [showCmd, setShowCmd] = useState(false);
   const [notifBadge, setNotifBadge] = useState(5);

   useEffect(() => {
      function onKey(e) {
         if ((e.metaKey || e.ctrlKey) && e.key === "k") {
            e.preventDefault();
            setShowCmd(s => !s);
         }
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
   }, []);

   if (page === "landing") {
      return (
         <>
            <style>{styles}</style>
            <LandingPage onEnter={() => setPage("dashboard")} />
            {showCmd && <CommandPalette onClose={() => setShowCmd(false)} onNav={setPage} />}
         </>
      );
   }

   const currentNav = NAV.find(n => n.id === page) || NAV[1];
   const sections = [...new Set(NAV.map(n => n.section))];

   const PAGES = { dashboard: Dashboard, document: DocumentEditor, chat: Chat, video: VideoCall, whiteboard: Whiteboard, tasks: Tasks, ai: AIAssistant, notifications: Notifications };
   const PageComponent = PAGES[page] || Dashboard;

   const fullscreen = ["document", "chat", "video", "whiteboard", "tasks", "ai"].includes(page);

   return (
      <>
         <style>{styles}</style>
         <div className="app-shell">
            {/* Sidebar */}
            <div className="sidebar">
               <div className="sidebar-logo">
                  <div className="logo-mark">P</div>
                  <span className="logo-name">pletto</span>
                  <button className="icon-btn" style={{ marginLeft: "auto", fontSize: 13 }} onClick={() => setShowCmd(true)} title="⌘K">⌘K</button>
               </div>

               <div style={{ flex: 1, overflow: "auto" }}>
                  {sections.map(sec => {
                     const items = NAV.filter(n => n.section === sec);
                     return (
                        <div key={sec} className="sidebar-section">
                           <div className="sidebar-label">{sec}</div>
                           {items.map(item => (
                              <div key={item.id} className={`nav-item${page === item.id ? " active" : ""}`} onClick={() => setPage(item.id)}>
                                 <span className="nav-icon">{item.icon}</span>
                                 {item.label}
                                 {item.badge && (
                                    <span className={`nav-badge${item.badgeColor ? ` ${item.badgeColor}` : ""}`}>{item.badge}</span>
                                 )}
                              </div>
                           ))}
                        </div>
                     );
                  })}
               </div>

               <div className="sidebar-footer">
                  <Avatar user={USERS[0]} size={30} />
                  <div className="user-info">
                     <div className="user-name">{USERS[0].name}</div>
                     <div className="user-role">{USERS[0].role}</div>
                  </div>
                  <div className="online-dot" />
               </div>
            </div>

            {/* Main */}
            <div className="main">
               <div className="topbar">
                  <div className="breadcrumb">
                     <span>nexus-workspace</span>
                     <span className="breadcrumb-sep">›</span>
                     <span className="breadcrumb-active">{currentNav.label}</span>
                  </div>

                  <div className="topbar-actions">
                     <div className="presence-cluster">
                        {USERS.map(u => (
                           <div key={u.name} className="presence-avatar" title={u.name} style={{ background: u.color + "22", color: u.color, fontSize: 9, fontWeight: 700, border: "2px solid var(--bg2)" }}>
                              {u.initials}
                           </div>
                        ))}
                        <span className="presence-count">4 online</span>
                     </div>
                     <button className="icon-btn" onClick={() => setShowCmd(s => !s)} title="Command palette (⌘K)">🔍</button>
                     <button className="icon-btn" onClick={() => setPage("notifications")} style={{ position: "relative" }}>
                        🔔
                        {notifBadge > 0 && (
                           <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "var(--red)", border: "1.5px solid var(--bg2)" }} />
                        )}
                     </button>
                     <button className="icon-btn">⚙️</button>
                  </div>
               </div>

               <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  {fullscreen ? (
                     <PageComponent onNav={setPage} />
                  ) : (
                     <PageComponent onNav={setPage} />
                  )}
               </div>
            </div>
         </div>

         {showCmd && <CommandPalette onClose={() => setShowCmd(false)} onNav={(p) => { setPage(p); setShowCmd(false); }} />}
      </>
   );
}