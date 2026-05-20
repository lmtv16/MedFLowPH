# Frontend

React + TypeScript + Vite SPA: thesis pages and `/workbench`.

## Layout

```
Frontend/
├── package.json
├── package-lock.json
├── index.html
├── vite.config.ts
├── vercel.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── postcss.config.js
├── tailwind.config.ts
├── .env.example
├── .gitignore
├── README.md
├── src/
│   ├── main.tsx, App.tsx, index.css, App.css, vite-env.d.ts
│   ├── api/              # HTTP client to Backend
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── hooks/
│   ├── pages/            # thesis routes
│   │   └── workbench/
│   └── utils/
└── public/
    ├── data/
    ├── results/
    └── output_source/
```

Build artifacts (not committed): `node_modules/`, `dist/`.

## Run locally

```bash
cd MedFlow/MedFlowPH/Frontend
npm install
npm run dev
```

Open http://localhost:5173/workbench (requires Backend on port 8000).

## Build

```bash
npm run build
```

Output: `Frontend/dist/`. For split deploy, set `VITE_API_BASE_URL` (see `.env.example`).
