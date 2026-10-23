// Resolve from this module so links work locally and under /portfolio/ on GitHub Pages.
const siteRoot = new URL('./', import.meta.url);

const pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/AustinFlippo', title: 'GitHub' },
  { url: 'https://www.linkedin.com/in/atmflippo', title: 'LinkedIn' },
];

// Treat /projects/ and /projects/index.html as the same page.
function pagePath(path) {
  return path.replace(/index\.html$/, '').replace(/\/$/, '');
}

const nav = document.createElement('nav');
nav.setAttribute('aria-label', 'Main navigation');

for (const page of pages) {
  const link = document.createElement('a');
  link.href = new URL(page.url, siteRoot);
  link.textContent = page.title;

  if (link.origin !== location.origin) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  } else if (pagePath(link.pathname) === pagePath(location.pathname)) {
    link.classList.add('current');
    link.setAttribute('aria-current', 'page');
  }

  nav.append(link);
}

document.body.prepend(nav);
document.body.insertAdjacentHTML('afterbegin', `
  <label class="color-scheme">
    Theme:
    <select aria-label="Color scheme">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
`);

const themeSelect = document.querySelector('.color-scheme select');

function setColorScheme(value) {
  document.documentElement.style.setProperty('color-scheme', value);
  themeSelect.value = value;
}

try {
  const savedTheme = localStorage.getItem('colorScheme');
  if (['light dark', 'light', 'dark'].includes(savedTheme)) {
    setColorScheme(savedTheme);
  }
} catch {
  // The switch still works if browser privacy settings disable storage.
}

themeSelect.addEventListener('input', (event) => {
  setColorScheme(event.target.value);
  try {
    localStorage.setItem('colorScheme', event.target.value);
  } catch {
    // Storage is optional; switching themes is not.
  }
});

// Encode spaces and special characters correctly for the visitor's email app.
const contactForm = document.querySelector('form[action^="mailto:"]');
contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const parameters = Array.from(new FormData(contactForm), ([name, value]) =>
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
  );
  location.href = `${contactForm.action}?${parameters.join('&')}`;
});

export async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement) return;
  if (!/^h[1-6]$/.test(headingLevel)) {
    throw new Error('headingLevel must be h1 through h6.');
  }

  containerElement.replaceChildren();
  if (projects.length === 0) {
    containerElement.textContent = 'No projects to display yet.';
    return;
  }

  for (const project of projects) {
    const article = document.createElement('article');
    const heading = document.createElement(headingLevel);
    const link = document.createElement('a');
    link.href = new URL(project.url ?? 'projects/', siteRoot);
    link.textContent = project.title;
    if (link.origin !== location.origin) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    heading.append(link);

    const image = document.createElement('img');
    image.src = new URL(project.image || 'images/project-placeholder.svg', siteRoot);
    image.alt = project.imageAlt || '';
    image.loading = 'lazy';

    const details = document.createElement('div');
    const year = document.createElement('p');
    year.className = 'project-year';
    year.textContent = project.year;
    const description = document.createElement('p');
    description.textContent = project.description;
    details.append(year, description);

    article.append(heading, image, details);
    containerElement.append(article);
  }
}

export function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${encodeURIComponent(username)}`);
}
