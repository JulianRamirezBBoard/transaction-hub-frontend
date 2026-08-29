# Transaction Hub

A banking dashboard that shows a filterable, groupable, paginated transaction
list with per-period running totals and summary statistics.

Built with React 19, TypeScript, Vite, Redux Toolkit (RTK Query), and Tailwind CSS.

There is no backend yet. A fixed 420-row mock dataset (2025-06-18 to 2026-07-23) is
served through an RTK Query endpoint with a simulated network delay.

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer

## Setup

```bash
npm install
npm run dev
```

The dev server runs at http://localhost:5173. No environment variables or
credentials are needed. `npm install` also runs the `prepare` script, which
installs the husky pre-commit hook.

## Scripts

| Command | Action |
|---|---|
| `npm run dev` | Start the dev server with hot module replacement |
| `npm run build` | Run `tsc -b`, then build for production with Vite |
| `npm run preview` | Serve the production build |
| `npm test` | Run the Jest suite (jsdom) |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the repo with Prettier |

Run one test file: `npx jest tests/grouping.test.ts`
Lint one file: `npm run lint -- src/features/transactions/logic.ts`

## Project structure

```
src/
├── main.tsx                     # Entry point. Mounts <App/> in the Redux Provider and StrictMode
├── App.tsx                      # Header and a <main> that wraps an ErrorBoundary
├── index.css                    # Tailwind layers and shared component classes
├── app/                         # store.ts, hooks.ts (typed useAppSelector / useAppDispatch)
├── components/                  # ErrorBoundary, ErrorFallback, DebouncedInput, RadioPillGroup
├── hooks/                       # useDebouncedCallback
└── features/
    ├── api/apiSlice.ts          # RTK Query base API
    └── transactions/
        ├── types.ts             # Shared types and option constants
        ├── dateUtils.ts         # ISO-8601 week / month keys, date-preset resolution
        ├── format.ts            # Currency and amount formatting
        ├── logic.ts             # The pure pipeline
        ├── mockData.ts          # Fixed 420-row dataset
        ├── transactionsApi.ts   # RTK Query endpoint that runs the pipeline
        ├── transactionsSlice.ts # Filter, grouping, and pagination state
        ├── selectors.ts         # State reads; createSelector only for the query-args object
        └── components/          # The UI, one component per concern

tests/
├── helpers.ts                   # makeFilters, makeState, makeTransaction, runPipeline
├── renderWithStore.tsx          # Renders a component against a real store
└── setup.ts                     # Loads @testing-library/jest-dom
```

## Data flow

The list content comes from one pure pipeline in `logic.ts`:

```
resolveFilters → applyFilters → groupTransactions → flattenGroups → paginate → buildPageGroups
```

- Grouping runs over the whole filtered set, before pagination. `buildPageGroups`
  selects the groups for the current page and marks a group `continued` when its
  rows started on an earlier page.
- The slice stores a date preset (`last30`, `last3months`, `ytd`, `custom`), not
  fixed dates. `resolveFilters(filters, now)` derives the bounds at query time.
  `now` is passed in, never read inside a pure function.
- `getTransactions({ filters, grouping, pagination })` returns one page of groups.
  A real backend replaces the `queryFn` body in `transactionsApi.ts`.

## Conventions

- Prettier: no semicolons, single quotes, trailing commas, 100 columns.
- The React Compiler is enabled.
- TypeScript runs in strict mode with project references. `tsconfig.json`
  references `tsconfig.app.json`, `tsconfig.node.json`, and `tsconfig.test.json`.
  `tsconfig.jest.json` is a CommonJS overlay for ts-jest.
- The pre-commit hook runs lint-staged (`eslint --fix`, `prettier --write`),
  then `tsc -b`.
- `package.json` pins the `eslint` peer of `eslint-plugin-jsx-a11y` to the root
  version through an `overrides` entry.
