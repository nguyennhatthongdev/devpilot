// Inline HTML dashboard — avoids separate Next.js build for MVP
export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevPilot Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #e5e5e5; }
    nav { border-bottom: 1px solid #333; padding: 1rem 2rem; display: flex; align-items: center; gap: 2rem; }
    nav h1 { font-size: 1.5rem; font-weight: bold; }
    nav a { color: #a1a1aa; text-decoration: none; font-size: 0.875rem; }
    nav a:hover, nav a.active { color: #fff; }
    main { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    h2 { font-size: 1.5rem; margin-bottom: 1rem; }
    .score-card { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 2rem; margin-bottom: 1.5rem; }
    .score-big { font-size: 4rem; font-weight: bold; }
    .score-label { color: #a1a1aa; font-size: 0.875rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
    .card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 1.25rem; }
    .card h3 { font-size: 0.875rem; color: #a1a1aa; margin-bottom: 0.5rem; }
    .card .value { font-size: 1.5rem; font-weight: bold; }
    .card .detail { font-size: 0.75rem; color: #71717a; margin-top: 0.25rem; }
    .green { color: #22c55e; }
    .yellow { color: #eab308; }
    .red { color: #ef4444; }
    .badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 999px; font-size: 0.75rem; background: #27272a; color: #a1a1aa; margin: 0.125rem; }
    .empty { color: #71717a; padding: 2rem; text-align: center; }
    .review-item { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; cursor: pointer; }
    .review-item:hover { border-color: #555; }
    .review-detail { white-space: pre-wrap; font-family: monospace; font-size: 0.8rem; line-height: 1.5; background: #111; padding: 1rem; border-radius: 8px; margin-top: 1rem; max-height: 500px; overflow-y: auto; }
    .decision-item, .pattern-item { border-bottom: 1px solid #272727; padding: 0.75rem 0; }
    .decision-item:last-child, .pattern-item:last-child { border-bottom: none; }
    .loading { color: #71717a; text-align: center; padding: 3rem; }
  </style>
</head>
<body>
  <nav>
    <h1>DevPilot</h1>
    <a href="#" data-tab="health" class="active">Health</a>
    <a href="#" data-tab="context">Context</a>
    <a href="#" data-tab="memory">Memory</a>
    <a href="#" data-tab="reviews">Reviews</a>
  </nav>
  <main>
    <div id="health" class="tab-content active"><div class="loading">Loading...</div></div>
    <div id="context" class="tab-content"><div class="loading">Loading...</div></div>
    <div id="memory" class="tab-content"><div class="loading">Loading...</div></div>
    <div id="reviews" class="tab-content"><div class="loading">Loading...</div></div>
  </main>
  <script>
    // Tab navigation
    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        link.classList.add('active');
        document.getElementById(link.dataset.tab).classList.add('active');
      });
    });

    function scoreColor(s) { return s >= 80 ? 'green' : s >= 60 ? 'yellow' : 'red'; }

    async function loadHealth() {
      const data = await fetch('/api/health').then(r => r.json());
      const el = document.getElementById('health');
      if (data.error) { el.innerHTML = '<div class="empty">' + data.error + '</div>'; return; }
      const b = data.breakdown;
      el.innerHTML = '<h2>Project Health</h2>' +
        '<div class="score-card"><div class="score-big ' + scoreColor(data.overallScore) + '">' + data.overallScore + '<span style="font-size:2rem;color:#71717a">/100</span></div>' +
        (data.trend ? '<div class="score-label">Trend: ' + data.trend + '</div>' : '') +
        '<div class="score-label">Scanned: ' + new Date(data.scannedAt).toLocaleString() + '</div></div>' +
        '<div class="grid">' +
        '<div class="card"><h3>Complexity</h3><div class="value ' + scoreColor(b.complexity.score) + '">' + b.complexity.score + '/100</div><div class="detail">Avg: ' + b.complexity.avgCyclomaticComplexity + ' | Over threshold: ' + b.complexity.filesOverThreshold + '</div></div>' +
        '<div class="card"><h3>Duplication</h3><div class="value ' + scoreColor(b.duplication.score) + '">' + b.duplication.score + '/100</div><div class="detail">' + b.duplication.percentage + '% duplicated (' + b.duplication.duplicatedLines + ' lines)</div></div>' +
        '<div class="card"><h3>Dependencies</h3><div class="value ' + scoreColor(b.dependencies.score) + '">' + b.dependencies.score + '/100</div><div class="detail">Total: ' + b.dependencies.total + ' | Outdated: ' + b.dependencies.outdated + '</div></div>' +
        '<div class="card"><h3>File Size</h3><div class="value ' + scoreColor(b.fileSize.score) + '">' + b.fileSize.score + '/100</div><div class="detail">Avg: ' + b.fileSize.avgSize + ' lines | Large: ' + b.fileSize.largeFiles + '</div></div>' +
        '</div>';
    }

    async function loadContext() {
      const data = await fetch('/api/context').then(r => r.json());
      const el = document.getElementById('context');
      if (data.error) { el.innerHTML = '<div class="empty">' + data.error + '</div>'; return; }
      const langs = Object.entries(data.stats.languages || {}).map(([l,s]) => '<span class="badge">' + l + ': ' + s.files + ' files</span>').join(' ');
      el.innerHTML = '<h2>Project Context</h2>' +
        '<div class="grid">' +
        '<div class="card"><h3>Tech Stack</h3><div class="value">' + (data.techStack.language || '-') + '</div><div class="detail">Frameworks: ' + (data.techStack.frameworks?.join(', ') || 'none') + '</div>' +
        (data.techStack.packageManager ? '<div class="detail">Pkg: ' + data.techStack.packageManager + '</div>' : '') + '</div>' +
        '<div class="card"><h3>Statistics</h3><div class="value">' + (data.stats.totalFiles || 0) + ' files</div><div class="detail">' + (data.stats.totalLines || 0).toLocaleString() + ' lines of code</div></div>' +
        '</div><div class="card" style="margin-top:1rem"><h3>Languages</h3><div style="margin-top:0.5rem">' + langs + '</div></div>';
    }

    async function loadMemory() {
      const data = await fetch('/api/memory').then(r => r.json());
      const el = document.getElementById('memory');
      let html = '<h2>Project Memory</h2>';
      html += '<div class="card"><h3>Architecture Decisions (' + data.decisions.length + ')</h3>';
      if (data.decisions.length === 0) html += '<div class="empty">No decisions recorded</div>';
      else data.decisions.forEach(d => { html += '<div class="decision-item"><strong>' + d.title + '</strong><div class="detail">' + d.decision + '</div><div>' + (d.tags||[]).map(t => '<span class="badge">' + t + '</span>').join(' ') + '</div></div>'; });
      html += '</div><div class="card" style="margin-top:1rem"><h3>Coding Patterns (' + data.patterns.length + ')</h3>';
      if (data.patterns.length === 0) html += '<div class="empty">No patterns detected</div>';
      else data.patterns.forEach(p => { html += '<div class="pattern-item">' + p.pattern + (p.autoDetected ? ' <span class="badge">auto</span>' : '') + '</div>'; });
      html += '</div>';
      el.innerHTML = html;
    }

    async function loadReviews() {
      const data = await fetch('/api/reviews').then(r => r.json());
      const el = document.getElementById('reviews');
      let html = '<h2>Code Reviews (' + data.length + ')</h2>';
      if (data.length === 0) { html += '<div class="empty">No reviews yet. Run: devpilot review &lt;file&gt;</div>'; }
      else data.forEach((r, i) => {
        html += '<div class="review-item" onclick="this.querySelector(\\'.review-detail\\').style.display=this.querySelector(\\'.review-detail\\').style.display===\\'none\\'?\\'block\\':\\'none\\'">' +
          '<div style="display:flex;justify-content:space-between;align-items:center"><span>' + r.filename.replace('.md','') + '</span><span class="badge ' + scoreColor(r.score) + '">' + r.score + '/100</span></div>' +
          '<div class="review-detail" style="display:none">' + r.content.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div></div>';
      });
      el.innerHTML = html;
    }

    // Load all data on page load
    Promise.all([loadHealth(), loadContext(), loadMemory(), loadReviews()]);
  </script>
</body>
</html>`;
}
