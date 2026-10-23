import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

async function loadLatestProjects() {
  const container = document.querySelector('.projects');
  try {
    const projects = await fetchJSON(new URL('./lib/projects.json', import.meta.url));
    renderProjects(projects.slice(0, 3), container, 'h3');
  } catch (error) {
    container.textContent = 'Projects could not load. Please refresh to try again.';
    console.error(error);
  }
}

async function loadGitHubStats() {
  const container = document.querySelector('#profile-stats');
  try {
    const data = await fetchGitHubData('AustinFlippo');
    const stats = [
      ['Public repos', data.public_repos],
      ['Public gists', data.public_gists],
      ['Followers', data.followers],
      ['Following', data.following],
    ];
    const list = document.createElement('dl');
    for (const [label, value] of stats) {
      const group = document.createElement('div');
      const term = document.createElement('dt');
      const count = document.createElement('dd');
      term.textContent = label;
      count.textContent = value;
      group.append(term, count);
      list.append(group);
    }
    container.replaceChildren(list);
  } catch (error) {
    container.textContent = 'GitHub stats are temporarily unavailable. Please try again later.';
    console.error(error);
  }
}

// A GitHub API failure should not prevent the local project list from loading.
loadLatestProjects();
loadGitHubStats();
