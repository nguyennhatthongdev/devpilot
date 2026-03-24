// Inline HTML dashboard — split into render helpers for maintainability
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
    .green { color: #22c55e; } .yellow { color: #eab308; } .red { color: #ef4444; }
    .badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 999px; font-size: 0.75rem; background: #27272a; color: #a1a1aa; margin: 0.125rem; }
    .empty { color: #71717a; padding: 2rem; text-align: center; }
    .review-item { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; cursor: pointer; }
    .review-item:hover { border-color: #555; }
    .review-detail { white-space: pre-wrap; font-family: monospace; font-size: 0.8rem; line-height: 1.5; background: #111; padding: 1rem; border-radius: 8px; margin-top: 1rem; max-height: 500px; overflow-y: auto; }
    .decision-item, .pattern-item { border-bottom: 1px solid #272727; padding: 0.75rem 0; }
    .decision-item:last-child, .pattern-item:last-child { border-bottom: none; }
    .loading { color: #71717a; text-align: center; padding: 3rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #272727; font-size: 0.8rem; }
    th { color: #a1a1aa; font-weight: 600; }
    td.mono { font-family: monospace; }
    .overflow-x { overflow-x: auto; }
    .progress-bg { width: 100%; background: #27272a; border-radius: 999px; height: 6px; }
    .progress-bar { height: 6px; border-radius: 999px; background: #3b82f6; }
    .severity-critical { background: #7f1d1d; color: #fca5a5; padding: 0.25rem 0.5rem; border-radius: 4px; }
    .severity-high { background: #7c2d12; color: #fdba74; padding: 0.25rem 0.5rem; border-radius: 4px; }
    .severity-moderate { background: #713f12; color: #fde047; padding: 0.25rem 0.5rem; border-radius: 4px; }
    .mt-4 { margin-top: 1rem; }
  </style>
</head>
<body>
  <nav>
    <h1>DevPilot</h1>
    <a href="#" data-tab="health" class="active">Health</a>
    <a href="#" data-tab="git">Git</a>
    <a href="#" data-tab="coverage">Coverage</a>
    <a href="#" data-tab="security">Security</a>
    <a href="#" data-tab="context">Context</a>
    <a href="#" data-tab="memory">Memory</a>
    <a href="#" data-tab="reviews">Reviews</a>
    <div style="margin-left:auto;display:flex;gap:0.5rem">
      <a href="/api/export/markdown" download style="padding:0.4rem 0.75rem;background:#27272a;border-radius:6px;color:#a1a1aa;text-decoration:none;font-size:0.75rem">Export MD</a>
      <a href="/api/export/json" download style="padding:0.4rem 0.75rem;background:#27272a;border-radius:6px;color:#a1a1aa;text-decoration:none;font-size:0.75rem">Export JSON</a>
    </div>
  </nav>
  <main>
    <div id="health" class="tab-content active"><div class="loading">Loading...</div></div>
    <div id="git" class="tab-content"><div class="loading">Loading...</div></div>
    <div id="coverage" class="tab-content"><div class="loading">Loading...</div></div>
    <div id="security" class="tab-content"><div class="loading">Loading...</div></div>
    <div id="context" class="tab-content"><div class="loading">Loading...</div></div>
    <div id="memory" class="tab-content"><div class="loading">Loading...</div></div>
    <div id="reviews" class="tab-content"><div class="loading">Loading...</div></div>
  </main>
  <script>
    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        link.classList.add('active');
        document.getElementById(link.dataset.tab).classList.add('active');
      });
    });

    function esc(s) { if (s == null) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
    function sc(s) { return s >= 80 ? 'green' : s >= 60 ? 'yellow' : 'red'; }

    function renderHealthTab(data) {
      const b = data.breakdown;
      let html = '<h2>Project Health</h2>' +
        '<div class="score-card"><div class="score-big ' + sc(data.overallScore) + '">' + data.overallScore + '<span style="font-size:2rem;color:#71717a">/100</span></div>' +
        (data.trend ? '<div class="score-label">Trend: ' + data.trend + '</div>' : '') +
        '<div class="score-label">Scanned: ' + new Date(data.scannedAt).toLocaleString() + '</div></div>' +
        '<div class="grid">' +
        '<div class="card"><h3>Complexity</h3><div class="value ' + sc(b.complexity.score) + '">' + b.complexity.score + '/100</div><div class="detail">Avg: ' + b.complexity.avgCyclomaticComplexity + ' | Over threshold: ' + b.complexity.filesOverThreshold + '</div></div>' +
        '<div class="card"><h3>Duplication</h3><div class="value ' + sc(b.duplication.score) + '">' + b.duplication.score + '/100</div><div class="detail">' + b.duplication.percentage + '% duplicated (' + b.duplication.duplicatedLines + ' lines)</div></div>' +
        '<div class="card"><h3>Dependencies</h3><div class="value ' + sc(b.dependencies.score) + '">' + b.dependencies.score + '/100</div><div class="detail">Total: ' + b.dependencies.total + ' | Outdated: ' + b.dependencies.outdated + '</div></div>' +
        '<div class="card"><h3>File Size</h3><div class="value ' + sc(b.fileSize.score) + '">' + b.fileSize.score + '/100</div><div class="detail">Avg: ' + b.fileSize.avgSize + ' lines | Large: ' + b.fileSize.largeFiles + '</div></div>';

      if (data.testCoverage) {
        var tc = data.testCoverage;
        var avg = ((tc.lines + tc.statements + tc.branches + tc.functions) / 4).toFixed(1);
        html += '<div class="card"><h3>Test Coverage</h3><div class="value ' + sc(parseFloat(avg)) + '">' + avg + '%</div><div class="detail">' + (tc.runner || 'Unknown') + '</div>' +
          ['lines','statements','branches','functions'].map(function(k) {
            return '<div style="margin-top:0.5rem"><div style="display:flex;justify-content:space-between;font-size:0.75rem"><span>' + k + '</span><span class="mono">' + tc[k].toFixed(1) + '%</span></div><div class="progress-bg"><div class="progress-bar" style="width:' + tc[k] + '%"></div></div></div>';
          }).join('') + '</div>';
      }

      if (data.security) {
        var sec = data.security;
        html += '<div class="card"><h3>Security</h3><div class="value">' + sec.total + '</div><div class="detail">Vulnerabilities</div>';
        if (sec.total > 0) {
          ['critical','high','moderate'].forEach(function(sev) {
            if (sec.vulnerabilities[sev] > 0) html += '<div class="severity-' + sev + '" style="margin-top:0.5rem;display:flex;justify-content:space-between"><span>' + sev + '</span><span>' + sec.vulnerabilities[sev] + '</span></div>';
          });
          if (sec.vulnerabilities.low > 0) html += '<div class="detail">Low: ' + sec.vulnerabilities.low + '</div>';
        } else { html += '<div style="color:#22c55e;margin-top:0.5rem">No vulnerabilities</div>'; }
        html += '</div>';
      }

      // Phase 3 analyzer cards
      if (b.styleConsistency) {
        html += '<div class="card"><h3>Style Consistency</h3><div class="value ' + sc(b.styleConsistency.score) + '">' + b.styleConsistency.score + '/100</div><div class="detail">Dominant: ' + b.styleConsistency.dominantStyle + '</div></div>';
      }
      if (b.deadCode) {
        html += '<div class="card"><h3>Dead Code</h3><div class="value ' + sc(b.deadCode.score) + '">' + b.deadCode.score + '/100</div><div class="detail">Unused exports: ' + b.deadCode.unusedExports + '</div></div>';
      }
      if (b.todos) {
        html += '<div class="card"><h3>TODOs</h3><div class="value ' + sc(b.todos.score) + '">' + b.todos.score + '/100</div><div class="detail">Total: ' + b.todos.total + ' (Critical: ' + b.todos.byPriority.critical + ')</div></div>';
      }
      if (b.docCoverage) {
        html += '<div class="card"><h3>Doc Coverage</h3><div class="value ' + sc(b.docCoverage.score) + '">' + b.docCoverage.score + '/100</div><div class="detail">' + b.docCoverage.coverage.toFixed(1) + '% (' + b.docCoverage.documented + '/' + b.docCoverage.publicFunctions + ')</div></div>';
      }
      if (b.importCycles) {
        html += '<div class="card"><h3>Import Cycles</h3><div class="value ' + sc(b.importCycles.score) + '">' + b.importCycles.score + '/100</div><div class="detail">Cycles: ' + b.importCycles.cycleCount + '</div></div>';
      }

      html += '</div>';

      // History chart
      html += '<div class="card mt-4" style="grid-column:1/-1"><h3>Score History</h3><canvas id="historyChart" width="800" height="200" style="width:100%;max-width:800px;margin-top:0.5rem"></canvas></div>';

      // Draw chart after DOM update
      setTimeout(function() {
        fetch('/api/history').then(function(r){return r.json();}).then(function(h){drawHistoryChart(h);}).catch(function(){drawHistoryChart([]);});
      }, 100);

      return html;
    }

    function drawHistoryChart(history) {
      var canvas = document.getElementById('historyChart');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var width = 800, height = 200, padding = 40;
      canvas.width = width; canvas.height = height;

      if (!history || history.length < 2) {
        ctx.fillStyle = '#71717a'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Need 2+ scans for history chart', width/2, height/2);
        return;
      }

      var data = history.slice(0, 30).reverse();
      var scores = data.map(function(h){return h.score;});
      var maxS = 100, minS = Math.max(0, Math.min.apply(null, scores) - 10);
      var xStep = (width - 2*padding) / Math.max(1, data.length - 1);

      // Grid lines
      ctx.strokeStyle = '#27272a'; ctx.lineWidth = 1;
      for (var g = 0; g <= 5; g++) {
        var gy = padding + g * (height - 2*padding) / 5;
        ctx.beginPath(); ctx.moveTo(padding, gy); ctx.lineTo(width - padding, gy); ctx.stroke();
      }

      // Line
      ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.beginPath();
      data.forEach(function(entry, i) {
        var x = padding + i * xStep;
        var y = height - padding - ((entry.score - minS) / (maxS - minS)) * (height - 2*padding);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Points
      data.forEach(function(entry, i) {
        var x = padding + i * xStep;
        var y = height - padding - ((entry.score - minS) / (maxS - minS)) * (height - 2*padding);
        ctx.fillStyle = entry.score >= 80 ? '#22c55e' : entry.score >= 60 ? '#eab308' : '#ef4444';
        ctx.beginPath(); ctx.arc(x, y, 4, 0, 2*Math.PI); ctx.fill();
      });

      // Y-axis labels
      ctx.fillStyle = '#a1a1aa'; ctx.font = '10px monospace'; ctx.textAlign = 'right';
      ctx.fillText('100', padding - 5, padding + 5);
      ctx.fillText(String(minS), padding - 5, height - padding + 5);
    }

    function renderContextTab(data) {
      var langs = Object.entries(data.stats.languages || {}).sort(function(a,b){return b[1].files - a[1].files;}).slice(0,15).map(function(e) { return '<span class="badge">' + esc(e[0]) + ': ' + e[1].files + ' files</span>'; }).join(' ');
      var html = '<h2>Project Context</h2><div class="grid">' +
        '<div class="card"><h3>Statistics</h3><div class="value">' + (data.stats.totalFiles || 0) + ' files</div>' +
        '<div class="detail">Total Lines: ' + (data.stats.totalLines || 0).toLocaleString() + '</div>' +
        '<div class="detail">Code Lines: ' + (data.stats.codeLines || 0).toLocaleString() + '</div></div>' +
        '<div class="card"><h3>Tech Stack</h3><div class="value">' + (data.techStack.language || '-') + '</div><div class="detail">Frameworks: ' + (data.techStack.frameworks?.join(', ') || 'none') + '</div>' +
        (data.techStack.packageManager ? '<div class="detail">Pkg: ' + data.techStack.packageManager + '</div>' : '') + '</div>';

      if (data.git) {
        var g = data.git;
        html += '<div class="card"><h3>Git Repository</h3><div class="value">' + esc(g.currentBranch) + '</div>' +
          '<div class="detail">Commits: ' + g.commits.toLocaleString() + ' | Contributors: ' + g.contributors + '</div>' +
          '<div class="detail">Branches: ' + g.branches + ' | Velocity: ' + g.commitsPerWeek + '/wk</div>' +
          '<div class="detail">First: ' + g.firstCommit + ' | Last: ' + g.lastCommit + '</div></div>';
      }

      html += '</div><div class="card mt-4"><h3>Languages</h3><div style="margin-top:0.5rem">' + langs + '</div></div>';

      if (data.fileStructure?.largestFiles?.length > 0) {
        html += '<div class="card mt-4"><h3>Largest Files</h3><div class="overflow-x"><table><tr><th>File</th><th style="text-align:right">Lines</th><th style="text-align:right">Size</th></tr>' +
          data.fileStructure.largestFiles.slice(0,20).map(function(f) {
            return '<tr><td class="mono">' + esc(f.path) + '</td><td class="mono" style="text-align:right">' + f.lines.toLocaleString() + '</td><td class="mono" style="text-align:right">' + (f.size/1024).toFixed(1) + ' KB</td></tr>';
          }).join('') + '</table></div></div>';
      }

      return html;
    }

    function renderMemoryTab(data) {
      var html = '<h2>Project Memory</h2><div class="card"><h3>Architecture Decisions (' + data.decisions.length + ')</h3>';
      if (data.decisions.length === 0) html += '<div class="empty">No decisions recorded</div>';
      else data.decisions.forEach(function(d) { html += '<div class="decision-item"><strong>' + esc(d.title) + '</strong><div class="detail">' + esc(d.decision) + '</div><div>' + (d.tags||[]).map(function(t){return '<span class="badge">' + esc(t) + '</span>';}).join(' ') + '</div></div>'; });
      html += '</div><div class="card mt-4"><h3>Coding Patterns (' + data.patterns.length + ')</h3>';
      if (data.patterns.length === 0) html += '<div class="empty">No patterns detected</div>';
      else data.patterns.forEach(function(p) { html += '<div class="pattern-item">' + esc(p.pattern) + (p.autoDetected ? ' <span class="badge">auto</span>' : '') + '</div>'; });
      html += '</div>';
      return html;
    }

    function renderReviewsTab(data) {
      var html = '<h2>Code Reviews (' + data.length + ')</h2>';
      if (data.length === 0) { html += '<div class="empty">No reviews yet. Run: devpilot review &lt;file&gt;</div>'; }
      else data.forEach(function(r) {
        html += '<div class="review-item" onclick="this.querySelector(\\'.review-detail\\').style.display=this.querySelector(\\'.review-detail\\').style.display===\\'none\\'?\\'block\\':\\'none\\'">' +
          '<div style="display:flex;justify-content:space-between;align-items:center"><span>' + r.filename.replace('.md','') + '</span><span class="badge ' + sc(r.score) + '">' + r.score + '/100</span></div>' +
          '<div class="review-detail" style="display:none">' + r.content.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div></div>';
      });
      return html;
    }

    function renderGitTab(data) {
      if (!data || !data.git) return '<h2>Git Analysis</h2><div class="empty">No git data available. Run: devpilot scan</div>';
      var g = data.git;
      var html = '<h2>Git Analysis</h2><div class="grid">';
      html += '<div class="card"><h3>Branch</h3><div class="value">' + esc(g.currentBranch) + '</div><div class="detail">Branches: ' + g.branches + '</div></div>';
      html += '<div class="card"><h3>Commits</h3><div class="value">' + g.commits.toLocaleString() + '</div><div class="detail">Contributors: ' + g.contributors + ' | ' + g.commitsPerWeek + '/wk</div></div>';
      html += '<div class="card"><h3>First Commit</h3><div class="value">' + esc(g.firstCommit) + '</div></div>';
      html += '<div class="card"><h3>Last Commit</h3><div class="value">' + esc(g.lastCommit) + '</div></div>';
      html += '</div>';
      return html;
    }

    function renderCoverageTab(data) {
      if (!data || !data.testCoverage) return '<h2>Test Coverage</h2><div class="empty">No coverage data. Run tests with coverage enabled.</div>';
      var tc = data.testCoverage;
      var metrics = [tc.lines, tc.statements, tc.functions];
      if (!tc.branchesUnavailable) metrics.push(tc.branches);
      var avg = (metrics.reduce(function(a,b){return a+b;},0) / metrics.length).toFixed(1);
      var html = '<h2>Test Coverage</h2>';
      html += '<div class="score-card"><div class="score-big ' + sc(parseFloat(avg)) + '">' + avg + '%</div>';
      html += '<div class="score-label">Average Coverage | Runner: ' + (tc.runner || 'Unknown') + '</div></div>';
      html += '<div class="grid">';
      ['lines','statements','branches','functions'].forEach(function(k) {
        html += '<div class="card"><h3>' + k.charAt(0).toUpperCase() + k.slice(1) + '</h3>';
        html += '<div class="value ' + sc(tc[k]) + '">' + tc[k].toFixed(1) + '%</div>';
        html += '<div class="progress-bg" style="margin-top:0.5rem"><div class="progress-bar" style="width:' + tc[k] + '%"></div></div></div>';
      });
      html += '</div>';
      return html;
    }

    function renderSecurityTab(data) {
      if (!data || !data.security) return '<h2>Security</h2><div class="empty">No security scan available.</div>';
      var sec = data.security;
      var total = sec.total;
      var html = '<h2>Security</h2>';
      html += '<div class="score-card"><div class="score-big ' + (total === 0 ? 'green' : total < 5 ? 'yellow' : 'red') + '">' + total + '</div>';
      html += '<div class="score-label">Total Vulnerabilities</div></div>';
      html += '<div class="grid">';
      [['critical','Critical'],['high','High'],['moderate','Moderate'],['low','Low']].forEach(function(pair) {
        var count = sec.vulnerabilities[pair[0]];
        html += '<div class="card"><h3>' + pair[1] + '</h3><div class="value ' + (count > 0 ? 'red' : 'green') + '">' + count + '</div></div>';
      });
      html += '</div>';
      if (sec.packages && sec.packages.length > 0) {
        html += '<div class="card mt-4" style="grid-column:1/-1"><h3>Affected Packages</h3><div class="overflow-x"><table><thead><tr><th>Package</th><th>Severity</th><th>Via</th></tr></thead><tbody>';
        sec.packages.slice(0,20).forEach(function(p) {
          html += '<tr><td class="mono">' + esc(p.name) + '</td><td><span class="severity-' + esc(p.severity) + '">' + esc(p.severity).toUpperCase() + '</span></td><td>' + esc(p.via) + '</td></tr>';
        });
        html += '</tbody></table></div></div>';
      }
      return html;
    }

    async function loadHealth() {
      var data = await fetch('/api/health').then(function(r){return r.json();});
      var el = document.getElementById('health');
      if (data.error) { el.innerHTML = '<div class="empty">' + data.error + '</div>'; return; }
      el.innerHTML = renderHealthTab(data);
    }
    async function loadContext() {
      var data = await fetch('/api/context').then(function(r){return r.json();});
      var el = document.getElementById('context');
      if (data.error) { el.innerHTML = '<div class="empty">' + data.error + '</div>'; return; }
      el.innerHTML = renderContextTab(data);
    }
    async function loadMemory() {
      var data = await fetch('/api/memory').then(function(r){return r.json();});
      document.getElementById('memory').innerHTML = renderMemoryTab(data);
    }
    async function loadReviews() {
      var data = await fetch('/api/reviews').then(function(r){return r.json();});
      document.getElementById('reviews').innerHTML = renderReviewsTab(data);
    }
    async function loadGit() {
      var data = await fetch('/api/context').then(function(r){return r.json();});
      document.getElementById('git').innerHTML = renderGitTab(data);
    }
    async function loadCoverage() {
      var data = await fetch('/api/health').then(function(r){return r.json();});
      document.getElementById('coverage').innerHTML = renderCoverageTab(data);
    }
    async function loadSecurity() {
      var data = await fetch('/api/health').then(function(r){return r.json();});
      document.getElementById('security').innerHTML = renderSecurityTab(data);
    }
    Promise.all([loadHealth(), loadGit(), loadCoverage(), loadSecurity(), loadContext(), loadMemory(), loadReviews()]);
  </script>
</body>
</html>`;
}
