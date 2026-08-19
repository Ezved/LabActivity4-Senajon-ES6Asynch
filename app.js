'use strict';

const API_BASE = 'https://jsonplaceholder.typicode.com';
const PAGE_SIZE = 10;

/**
 * Thin fetch wrapper: normalizes non-2xx responses into thrown errors
 * so every caller can rely on a single try/catch path.
 */
const fetchJSON = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }
  return response.json();
};

class PostRepository {
  #commentsCache = new Map();

  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async getPosts() {
    return fetchJSON(`${this.baseUrl}/posts`);
  }

  async getUsers() {
    const users = await fetchJSON(`${this.baseUrl}/users`);
    return new Map(users.map((user) => [user.id, user]));
  }

  async getComments(postId) {
    if (this.#commentsCache.has(postId)) {
      return this.#commentsCache.get(postId);
    }
    const comments = await fetchJSON(`${this.baseUrl}/posts/${postId}/comments`);
    this.#commentsCache.set(postId, comments);
    return comments;
  }
}

const repo = new PostRepository();

const state = {
  posts: [],
  query: '',
  page: 1,
};

const postList = document.querySelector('#post-list');
const statusEl = document.querySelector('#status');
const statsEl = document.querySelector('#stats');
const searchInput = document.querySelector('#search-input');
const refreshBtn = document.querySelector('#refresh-btn');
const loadMoreBtn = document.querySelector('#load-more-btn');

const setStatus = (message = '', isError = false) => {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
};

const escapeHtml = (text = '') =>
  text.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));

const matchesQuery = ({ title, body }, query) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return title.toLowerCase().includes(needle) || body.toLowerCase().includes(needle);
};

const renderComments = (comments = []) => {
  if (comments.length === 0) return '<p><em>No comments yet.</em></p>';
  const items = comments
    .map(({ name, email, body }) => `
      <li>
        <strong>${escapeHtml(name)}</strong> <span class="post-meta">&lt;${escapeHtml(email)}&gt;</span>
        <p>${escapeHtml(body)}</p>
      </li>
    `)
    .join('');
  return `<ul class="comments-list">${items}</ul>`;
};

const renderPosts = (posts) => {
  postList.innerHTML = posts
    .map(({ id, title, body, author }) => `
      <li class="post-card" data-post-id="${id}">
        <h3>${escapeHtml(title)}</h3>
        <p class="post-meta">by ${escapeHtml(author)} &middot; post #${id}</p>
        <p>${escapeHtml(body)}</p>
        <button type="button" class="toggle-comments-btn" data-post-id="${id}">
          Show Comments
        </button>
        <div class="comments-container" hidden></div>
      </li>
    `)
    .join('');
};

const updateStats = (allPosts, visiblePosts) => {
  const authorCounts = allPosts.reduce((counts, { author }) => {
    counts.set(author, (counts.get(author) ?? 0) + 1);
    return counts;
  }, new Map());

  statsEl.textContent = `Showing ${visiblePosts.length} of ${allPosts.length} posts across ${authorCounts.size} authors.`;
};

const getVisiblePosts = () => {
  const filtered = state.posts.filter((post) => matchesQuery(post, state.query));
  return filtered.slice(0, state.page * PAGE_SIZE);
};

const refreshView = () => {
  const visible = getVisiblePosts();
  renderPosts(visible);
  updateStats(state.posts, visible);
  loadMoreBtn.disabled = visible.length >= state.posts.filter((post) => matchesQuery(post, state.query)).length;
};

const loadInitialData = async () => {
  setStatus('Loading live posts...');
  try {
    const [posts, usersById] = await Promise.all([repo.getPosts(), repo.getUsers()]);

    state.posts = posts.map((post) => {
      const { userId, ...rest } = post;
      return { ...rest, author: usersById.get(userId)?.name ?? 'Unknown author' };
    });
    state.page = 1;

    refreshView();
    setStatus(`Loaded ${state.posts.length} posts.`);
  } catch (error) {
    setStatus(`Could not load posts: ${error.message}`, true);
  }
};

const toggleComments = async (postId, container) => {
  if (!container.hidden) {
    container.hidden = true;
    return;
  }

  container.hidden = false;
  if (container.dataset.loaded === 'true') return;

  container.innerHTML = '<p><em>Loading comments...</em></p>';
  try {
    const comments = await repo.getComments(postId);
    container.innerHTML = renderComments(comments);
    container.dataset.loaded = 'true';
  } catch (error) {
    container.innerHTML = `<p class="error">Failed to load comments: ${error.message}</p>`;
  }
};

postList.addEventListener('click', async (event) => {
  const button = event.target.closest('.toggle-comments-btn');
  if (!button) return;

  const postId = Number(button.dataset.postId);
  const container = button.nextElementSibling;
  button.disabled = true;
  await toggleComments(postId, container);
  button.textContent = container.hidden ? 'Show Comments' : 'Hide Comments';
  button.disabled = false;
});

let debounceHandle;
searchInput.addEventListener('input', (event) => {
  clearTimeout(debounceHandle);
  const { value } = event.target;
  debounceHandle = setTimeout(() => {
    state.query = value;
    state.page = 1;
    refreshView();
  }, 250);
});

refreshBtn.addEventListener('click', loadInitialData);

loadMoreBtn.addEventListener('click', () => {
  state.page += 1;
  refreshView();
});

document.querySelector('#search-form').addEventListener('submit', (event) => event.preventDefault());

loadInitialData();
