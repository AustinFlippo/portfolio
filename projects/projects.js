import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const container = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');
const title = document.querySelector('.projects-title');
const status = document.querySelector('#filter-status');
let query = '';
let selectedYear = null;

try {
  const projects = await fetchJSON(new URL('../lib/projects.json', import.meta.url));
  // Keep each year's color stable when a search removes another year.
  const years = [...new Set(projects.map((project) => project.year))].sort((a, b) => b - a);
  const colors = d3.scaleOrdinal(years, d3.schemeTableau10);

  searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    updateView();
  });

  document.querySelector('#reset-filters').addEventListener('click', () => {
    query = '';
    selectedYear = null;
    searchInput.value = '';
    updateView();
  });

  // Both controls use this function, so neither overwrites the other filter.
  function updateView() {
    const searchMatches = projects.filter((project) =>
      Object.values(project).join('\n').toLowerCase().includes(query.trim().toLowerCase()),
    );
    // Fix: filter searchMatches, rather than starting again from all projects.
    const visibleProjects = searchMatches.filter((project) =>
      selectedYear === null || project.year === selectedYear,
    );
    renderProjects(visibleProjects, container, 'h2');
    if (visibleProjects.length === 0) container.textContent = 'No projects match your filters.';
    title.textContent = `Projects (${visibleProjects.length})`;
    status.textContent = `Showing ${visibleProjects.length} of ${projects.length} projects.`
      + (selectedYear === null ? '' : ` Selected year: ${selectedYear}.`);
    // Keep the search results in the pie so another year can still be selected.
    renderPieChart(searchMatches);
  }

  function toggleYear(year) {
    // Store the year itself; slice indices may change after searching.
    selectedYear = selectedYear === year ? null : year;
    updateView();
  }

  function renderPieChart(projectsGiven) {
    const data = d3.rollups(projectsGiven, (group) => group.length, (project) => project.year)
      .sort(([a], [b]) => b - a)
      .map(([year, count]) => ({ label: year, value: count }));
    const slices = d3.pie().sort(null).value((d) => d.value)(data);
    const arc = d3.arc().innerRadius(0).outerRadius(48);
    const svg = d3.select('#projects-plot');
    const legend = d3.select('.legend');
    svg.selectAll('*').remove();
    legend.selectAll('*').remove();

    if (data.length === 0) {
      svg.append('text').attr('text-anchor', 'middle').attr('y', 2)
        .attr('class', 'chart-empty').text('No matching projects');
      return;
    }

    svg.selectAll('path').data(slices).join('path')
      .attr('d', arc)
      .attr('fill', (d) => colors(d.data.label))
      .classed('selected', (d) => d.data.label === selectedYear)
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (d) => `${d.data.label}: ${d.data.value} projects`)
      .attr('aria-pressed', (d) => d.data.label === selectedYear)
      .on('click', (event, d) => toggleYear(d.data.label))
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleYear(d.data.label);
          // Rendering replaces paths; restore keyboard focus to the same year.
          svg.selectAll('path').filter((slice) => slice.data.label === d.data.label).node()?.focus();
        }
      })
      .append('title').text((d) => `${d.data.label}: ${d.data.value} projects`);

    const items = legend.selectAll('li').data(data).join('li')
      .style('--color', (d) => colors(d.label))
      .classed('selected', (d) => d.label === selectedYear);
    const buttons = items.append('button')
      .attr('type', 'button')
      .attr('aria-pressed', (d) => d.label === selectedYear)
      .on('click', (event, d) => {
        toggleYear(d.label);
        legend.selectAll('button').filter((item) => item.label === d.label).node()?.focus();
      });
    buttons.append('span').attr('class', 'swatch').attr('aria-hidden', 'true');
    buttons.append('span').text((d) => `${d.label} (${d.value})`);
  }

  updateView();
} catch (error) {
  container.textContent = 'Projects could not load. Please refresh to try again.';
  console.error(error);
}
