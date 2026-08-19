# Lab Activity 4: Advanced ES6+ & Fetching Asynchronous Data

Fetches live post data from the [JSONPlaceholder](https://jsonplaceholder.typicode.com/posts) `/posts` endpoint and renders it in the browser, with per-post comments loaded on demand.

## Files

- `index.html` - page structure and controls
- `styles.css` - minimal styling
- `app.js` - data fetching and rendering logic

## ES6+ and async features used

- `fetch` + `async`/`await` with `try`/`catch` for all network calls
- `Promise.all` to load posts and users concurrently
- A `class` (`PostRepository`) with a private field (`#commentsCache`) to memoize per-post comment requests
- Arrow functions, template literals, default parameters
- Destructuring (objects, including rest destructuring `{ userId, ...rest }`)
- Spread operator to merge post data with author info
- Optional chaining (`?.`) and nullish coalescing (`??`)
- Array methods: `map`, `filter`, `reduce`, `slice`
- `Map` for O(1) user lookups and comment caching
- Event delegation and a debounced search input (closures + `setTimeout`)

## Running

Open `index.html` in a browser (or serve the folder with any static server). No build step or dependencies required.

## Pushing to GitHub

```bash
git init
git add .
git commit -m "Lab Activity 4: Advanced ES6+ and fetching asynchronous data"
git branch -M main
git remote add origin https://github.com/<your-username>/LabActivity4-Senajon-ES6Asynch.git
git push -u origin main
```
