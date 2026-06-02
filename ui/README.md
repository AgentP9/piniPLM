# piniPLM UI

Next.js App Router frontend for the FastAPI PLM backend.

## Setup

```bash
cd ui
npm install
```

Set the backend URL if needed:

```bash
export NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Run locally

```bash
cd ui
npm run dev
```

Open `http://localhost:3000`, go to `/select-user`, and choose or paste an `X-User-Id`.
The selected ID is stored in localStorage as `plm_user_id` and is sent on every API request.

Seeded users:

- `11111111-1111-1111-1111-111111111111` — admin
- `22222222-2222-2222-2222-222222222222` — user1
- `33333333-3333-3333-3333-333333333333` — user2

## Commands

```bash
npm run build
npm run test
npm run lint
```
