// Based on DSC 106 Labs 6 and 8: https://dsc106.com/labs/lab08/
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

const repository = 'https://github.com/AustinFlippo/portfolio';
const integer = d3.format(',d');
const decimal = d3.format(',.1f');
const percent = d3.format('.1~%');
const fullDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' });
const shortTime = new Intl.DateTimeFormat('en-US', { timeStyle: 'short' });

function loadData() {
  return d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
}

function processCommits(data) {
  return d3.groups(data, (line) => line.commit).map(([id, lines]) => {
    const { author, date, time, timezone, datetime } = lines[0];
    const commit = {
      id,
      url: `${repository}/commit/${id}`,
      author,
      date,
      time,
      timezone,
      datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length,
    };
    Object.defineProperty(commit, 'lines', { value: lines });
    return commit;
  }).sort((a, b) => a.datetime - b.datetime);
}

function renderCommitInfo(data, commits) {
  const fileLengths = d3.rollup(data, (lines) => d3.max(lines, (d) => d.line), (d) => d.file);
  const stats = [
    ['Total LOC', integer(data.length)],
    ['Total commits', integer(commits.length)],
    ['Files', integer(fileLengths.size)],
    ['Mean file length', `${decimal(d3.mean(fileLengths.values()))} lines`],
    ['Maximum depth', integer(d3.max(data, (d) => d.depth))],
  ];

  const entries = d3.select('#stats').append('dl').attr('class', 'stats')
    .selectAll('div').data(stats).join('div');
  entries.append('dt').text(([label]) => label);
  entries.append('dd').text(([, value]) => value);
}

function renderTooltipContent(commit, tooltip) {
  const link = tooltip.querySelector('#commit-link');
  link.href = commit.url;
  link.textContent = commit.id;
  tooltip.querySelector('#commit-date').textContent = fullDate.format(commit.datetime);
  tooltip.querySelector('#commit-tooltip-time').textContent = shortTime.format(commit.datetime);
  tooltip.querySelector('#commit-author').textContent = commit.author;
  tooltip.querySelector('#commit-lines').textContent = integer(commit.totalLines);
}

function updateTooltipPosition(tooltip, x, y) {
  const gap = 10;
  const { width, height } = tooltip.getBoundingClientRect();
  tooltip.style.left = `${Math.max(gap, Math.min(x + gap, innerWidth - width - gap))}px`;
  const top = y + height + gap <= innerHeight ? y + gap : y - height - gap;
  tooltip.style.top = `${Math.max(gap, top)}px`;
}

function renderSelectionCount(selectedCommits) {
  const count = selectedCommits.length;
  d3.select('#selection-count').text(
    count === 0 ? 'No commits selected' : `${integer(count)} commit${count === 1 ? '' : 's'} selected`,
  );
}

function renderLanguageBreakdown(selectedCommits) {
  const lines = selectedCommits.flatMap((commit) => commit.lines);
  const byType = d3.rollup(lines, (group) => group.length, (line) => line.type);
  const entries = d3.select('#language-breakdown')
    .selectAll('div').data(d3.sort(byType, ([, count]) => -count), ([type]) => type)
    .join((enter) => {
      const entry = enter.append('div');
      entry.append('dt');
      entry.append('dd');
      return entry;
    });

  entries.select('dt').text(([type]) => type.toUpperCase());
  entries.select('dd').text(([, count]) =>
    `${integer(count)} ${count === 1 ? 'line' : 'lines'} (${percent(count / lines.length)})`,
  );
}

function renderScatterPlot(commits) {
  const width = 800;
  const height = 480;
  const area = { top: 28, right: width - 42, bottom: height - 52, left: 110 };
  const plotWidth = area.right - area.left;
  const xScale = d3.scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([area.left, area.right])
    .nice();
  const yScale = d3.scaleLinear().domain([0, 24]).range([area.bottom, area.top]);
  const rScale = d3.scaleSqrt().domain(d3.extent(commits, (d) => d.totalLines)).range([2, 30]);
  const hours = d3.range(0, 25, 4);

  const svg = d3.select('#chart').append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'group')
    .attr('aria-labelledby', 'chart-heading chart-description');

  svg.append('g').attr('class', 'gridlines')
    .attr('transform', `translate(${area.left},0)`)
    .call(d3.axisLeft(yScale).tickValues(hours).tickFormat('').tickSize(-plotWidth))
    .selectAll('.tick')
    .classed('daytime', (hour) => hour >= 8 && hour <= 16);

  const xAxis = svg.append('g').attr('class', 'axis x-axis')
    .attr('transform', `translate(0,${area.bottom})`)
    .call(d3.axisBottom(xScale).ticks(6));
  svg.append('g').attr('class', 'axis')
    .attr('transform', `translate(${area.left},0)`)
    .call(d3.axisLeft(yScale).tickValues(hours)
      .tickFormat((hour) => String(hour % 24).padStart(2, '0') + ':00'));

  svg.append('text').attr('class', 'axis-label')
    .attr('x', (area.left + area.right) / 2).attr('y', height - 9)
    .text('Commit date');
  svg.append('text').attr('class', 'axis-label')
    .attr('transform', `translate(22,${(area.top + area.bottom) / 2}) rotate(-90)`)
    .text('Local time of day');

  const tooltip = document.getElementById('commit-tooltip');
  const clearButton = document.getElementById('clear-selection');
  let hideTimer;

  function showTooltip(event, commit) {
    clearTimeout(hideTimer);
    renderTooltipContent(commit, tooltip);
    tooltip.hidden = false;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.type === 'focus' ? bounds.right : event.clientX;
    const y = event.type === 'focus' ? bounds.top : event.clientY;
    updateTooltipPosition(tooltip, x, y);
  }

  function hideTooltip() {
    clearTimeout(hideTimer);
    // Give the pointer time to cross the gap to the commit link.
    hideTimer = setTimeout(() => { tooltip.hidden = true; }, 220);
  }

  tooltip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  tooltip.addEventListener('mouseleave', hideTooltip);

  const dots = svg.append('g').attr('class', 'dots');
  let visibleCommits = commits;
  let circles = dots.selectAll('circle');

  function updateScatterPlot(filteredCommits) {
    visibleCommits = filteredCommits;
    // Clear selections before moving the axis, so hidden commits cannot stay selected.
    brushLayer.call(brush.move, null);
    clearTimeout(hideTimer);
    tooltip.hidden = true;
    let [start, end] = d3.extent(filteredCommits, (d) => d.datetime);
    if (+start === +end) {
      start = new Date(+start - 3600000);
      end = new Date(+end + 3600000);
    }
    xScale.domain([start, end]).nice();
    xAxis.call(d3.axisBottom(xScale).ticks(5));
    circles = dots.selectAll('circle')
      .data(d3.sort(filteredCommits, (d) => -d.totalLines), (d) => d.id).join('circle')
      .attr('cx', (d) => xScale(d.datetime))
      .attr('cy', (d) => yScale(d.hourFrac))
      .attr('r', (d) => rScale(d.totalLines))
      .style('--r', (d) => `${rScale(d.totalLines)}px`)
      .attr('tabindex', 0)
      .attr('role', 'link')
      .attr('aria-label', (d) =>
        `Commit ${d.id}, ${fullDate.format(d.datetime)}, ${shortTime.format(d.datetime)}, ${d.author}, ${integer(d.totalLines)} lines`,
      )
      .on('mouseenter focus', showTooltip)
      .on('mouseleave blur', hideTooltip)
      .on('click', (event, d) => window.open(d.url, '_blank', 'noopener'))
      .on('keydown', (event, d) => {
        if (event.key === 'Enter') window.open(d.url, '_blank', 'noopener');
        if (event.key === 'Escape') tooltip.hidden = true;
      });
  }

  function isCommitSelected(selection, commit) {
    if (!selection) return false;
    const [[x0, y0], [x1, y1]] = selection;
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  }

  function brushed({ selection }) {
    const selectedCommits = visibleCommits.filter((d) => isCommitSelected(selection, d));
    const selected = new Set(selectedCommits);
    circles.classed('selected', (d) => selected.has(d));
    renderSelectionCount(selectedCommits);
    renderLanguageBreakdown(selectedCommits);
    clearButton.disabled = !selection;
  }

  const brush = d3.brush()
    .extent([[area.left, area.top], [area.right, area.bottom]])
    .filter((event) => !event.ctrlKey && !event.button &&
      event.target.matches('.overlay, .selection, .handle'))
    .on('start brush end', brushed);

  // Keep the brush overlay behind the dots so it does not intercept hover.
  const brushLayer = svg.append('g').attr('class', 'commit-brush').call(brush);
  dots.raise();
  clearButton.addEventListener('click', () => brushLayer.call(brush.move, null));
  updateScatterPlot(commits);
  return updateScatterPlot;
}

function setupEvolution(commits, updateScatterPlot) {
  const slider = document.getElementById('commit-progress');
  const time = document.getElementById('commit-time');
  const timeScale = d3.scaleTime().domain(d3.extent(commits, (d) => d.datetime)).range([0, 100]);
  const colors = d3.scaleOrdinal()
    .domain(Array.from(new Set(commits.flatMap((d) => d.lines.map((line) => line.type)))).sort())
    .range(d3.schemeTableau10);
  let commitProgress = 100;
  let commitMaxTime = timeScale.invert(commitProgress);
  let filteredCommits = commits;

  const legend = d3.select('#file-legend').selectAll('li').data(colors.domain()).join('li');
  legend.append('span').attr('class', 'swatch').style('background', (d) => colors(d));
  legend.append('span').text((d) => d.toUpperCase());

  function updateFileDisplay() {
    const files = d3.groups(filteredCommits.flatMap((d) => d.lines), (d) => d.file)
      .map(([name, lines]) => ({ name, lines }))
      .sort((a, b) => b.lines.length - a.lines.length || d3.ascending(a.name, b.name));
    const entries = d3.select('#files').selectAll('div.file')
      .data(files, (d) => d.name).join((enter) => {
        const entry = enter.append('div').attr('class', 'file');
        const label = entry.append('dt');
        label.append('code');
        label.append('small');
        entry.append('dd');
        return entry;
      });
    entries.select('code').text((d) => d.name);
    entries.select('small').text((d) => `${integer(d.lines.length)} lines`);
    entries.select('dd').selectAll('.loc')
      .data((d) => d.lines, (d) => `${d.file}:${d.line}`)
      .join('span').attr('class', 'loc').attr('aria-hidden', 'true')
      .style('--color', (d) => colors(d.type))
      .attr('title', (d) => `${d.file}:${d.line} · ${d.type.toUpperCase()} · ${fullDate.format(d.datetime)}`);
  }

  const steps = d3.select('#scatter-story').selectAll('.step').data(commits, (d) => d.id)
    .join('article').attr('class', 'step');
  steps.append('h3').text((d, i) => `Commit ${i + 1}: ${fullDate.format(d.datetime)}`);
  steps.append('p').text((d, i) => {
    const files = new Set(d.lines.map((line) => line.file));
    return `${i === 0 ? 'The story begins' : 'The portfolio grows'} at ${shortTime.format(d.datetime)}. ` +
      `This commit contributed ${integer(d.totalLines)} surviving ${d.totalLines === 1 ? 'line' : 'lines'} across ${files.size} ${files.size === 1 ? 'file' : 'files'}.`;
  });
  steps.append('a').attr('href', (d) => d.url).attr('target', '_blank')
    .attr('rel', 'noopener noreferrer').text((d) => `View commit ${d.id}`);

  function setCommitMaxTime(datetime) {
    commitMaxTime = datetime;
    commitProgress = timeScale(commitMaxTime);
    slider.value = commitProgress;
    time.dateTime = commitMaxTime.toISOString();
    time.textContent = commitMaxTime.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    slider.setAttribute('aria-valuetext', time.textContent);
    filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
    steps.classed('is-active', (d) => d === filteredCommits.at(-1));
    d3.select('#visible-count').text(`${filteredCommits.length} of ${commits.length} commits shown`);
    d3.select('#file-cutoff').text(`Lines attributed through ${time.textContent}`);
    updateScatterPlot(filteredCommits);
    updateFileDisplay();
  }

  slider.addEventListener('input', () => {
    commitProgress = Number(slider.value);
    setCommitMaxTime(timeScale.invert(commitProgress));
  });
  document.getElementById('show-all-commits').addEventListener('click', () => {
    setCommitMaxTime(commits.at(-1).datetime);
  });
  setCommitMaxTime(commits.at(-1).datetime);

  const scroller = scrollama();
  scroller.setup({ step: '#scatter-story .step', offset: 0.5 })
    .onStepEnter(({ element }) => setCommitMaxTime(element.__data__.datetime));
  window.addEventListener('resize', () => scroller.resize());
}

const status = document.getElementById('meta-status');
try {
  const data = await loadData();
  if (data.length === 0) {
    status.textContent = 'No committed code lines were found in loc.csv.';
  } else {
    const commits = processCommits(data);
    renderCommitInfo(data, commits);
    document.getElementById('commit-section').hidden = false;
    document.getElementById('file-section').hidden = false;
    const updateScatterPlot = renderScatterPlot(commits);
    setupEvolution(commits, updateScatterPlot);
    status.hidden = true;
  }
} catch (error) {
  status.textContent = 'Could not display commit data. Serve the portfolio over HTTP and check that meta/loc.csv is present.';
  console.error(error);
}
