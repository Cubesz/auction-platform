# Interview Auctions

A farm equipment auction application built with **React (Vite)** and **TypeScript**. 

## Engineering Highlights & Trade-offs

### 1. Robust API Contracts (Zod)
I implemented `zod` for strict runtime validation on the Express backend. Using `.safeParse()` ensures the server never crashes from malformed inputs and provides explicit, actionable `400 Bad Request` messages back to the client.

### 2. Performance & Frontend State
* **Debounced Search:** Implemented a custom `useDebounce` hook on the search input to prevent unnecessary API spam and database race conditions during rapid typing.
* **Optimistic UI Updates:** The React frontend updates local state immediately upon a successful `201` response, avoiding heavy full-page reloads.
* **Timezone Safety:** The frontend converts local HTML `datetime-local` inputs into strict UTC ISO strings before transmission, preventing cross-timezone corruption.

### 3. Edge Case Handling & UX Polish
* **Dynamic Fallbacks:** If a user omits an image during listing creation, a `placehold.co` image with the listing's URL-encoded title is used.
* **Efficient Sorting:** Satisfied the reverse-chronological bid history requirement at the insertion level (O(1) `unshift`) instead of sorting calculations (O(nlogn)).
* **Validation:** Used React-driven form validation with `noValidate` attributes to ensure clean, consistent error messaging rather than relying on inconsistent browser-native tooltips.

### 4. Architectural Trade-off: Persistence
To maximize time spent on product features and API boundaries, I deliberately maintained the in-memory array data store. In a production environment, this would be migrated to a relational database (e.g., PostgreSQL, MySQL) with an ORM, and I would introduce a Redis caching layer or Optimistic Concurrency Control (versioning) to handle simultaneous bid race conditions safely.

---

## Completed Tasks

1. **Bug Fix (Bidding):** Implemented boundary checks and type validation to prevent invalid bids.
2. **Search & Filter:** Built debounced, case-insensitive server-side filtering.
3. **Bid History:** Tracked chronological bid records and exposed them via RESTful endpoints.
4. **Create Listing:** Built a robust form with comprehensive validation and defaults (e.g., `currentBid` initializing to `startingPrice`).

---

## Setup

### Frontend

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173`.

### Backend — TypeScript

**TypeScript (Express)**
```bash
cd server/typescript
npm install
npm run dev
```

Runs at `http://localhost:3001`.