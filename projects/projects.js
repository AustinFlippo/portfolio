import { fetchJSON, renderProjects } from '../global.js';

const container = document.querySelector('.projects');

try {
  const projects = await fetchJSON(new URL('../lib/projects.json', import.meta.url));
  document.querySelector('.projects-title').textContent = `Projects (${projects.length})`;
  renderProjects(projects, container, 'h2');
} catch (error) {
  container.textContent = 'Projects could not load. Please refresh to try again.';
  console.error(error);
}
