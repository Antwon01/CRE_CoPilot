# 🏗️ CRE CoPilot

A small full-stack demo that simulates a **Consumer Real Estate Analytics Copilot**.  
It includes:

- **Backend (Python)** – Generates mock dimensional data and writes a JSON feed (`cre_copilot_demo.json`).
- **Frontend (React + Vite + Tailwind)** – Reads that JSON, interprets prompts, and renders charts/tables.

---

## ⚙️ 1. Clone the repository

```bash
git clone https://github.com/Antwon01/CRE_CoPilot.git
cd CRE_CoPilot
```

---

## 🐍 2. Backend setup (Python)

### Create and activate a virtual environment

#### macOS / Linux
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

#### Windows
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
```

### Install dependencies
```bash
pip install -r requirements.txt
```

### Generate mock data
```bash
python generate_cre_copilot_data_large.py
```

➡️ This script writes thousands of sample records to  
`backend/data/mock_dim_out/` and a combined dataset file:

```
backend/data/cre_copilot_demo.json
```

Keep this file — it’s what the frontend uses to populate charts.

---

## 💻 3. Frontend setup (Node + Vite + React)

### Install dependencies
```bash
cd ../frontend
npm install
```

### Run the development server
```bash
npm run dev
```

Vite will print something like:
```
VITE v5.x  ready in <1 s
Local:   http://localhost:5173/
```

Open that URL in your browser.

### Upload your generated data

In the running app, click **“Upload JSON”** and choose:
```
backend/data/cre_copilot_demo.json
```

You’ll see charts, tables, and SQL templates appear instantly.

---

## 📦 4. Optional: production build
```bash
npm run build
```
Static files will be output to `frontend/dist/`.

---

## 🔒 5. Environment and ignores
The `.gitignore` already excludes:
- `frontend/node_modules/`, `frontend/dist/`
- `backend/.venv/`, `backend/data/`
- `.env`, `.DS_Store`

Never commit your virtual-env or generated data.

---

## 🧩 6. Common issues

| Problem | Fix |
|----------|-----|
| `vite: Node 18 required` | Use Node ≥ 18.20 LTS (`nvm use 18` or install via [nodejs.org](https://nodejs.org)) |
| `Module not found @/components/ui/*` | You’re missing the UI folder; re-copy the minimal UI components in `src/components/ui/` |
| `Permission denied (publickey)` when pushing | Re-add your SSH key to GitHub: [GitHub → Settings → SSH Keys](https://github.com/settings/keys) |

---

## 🧠 7. Project structure

```
CRE_CoPilot/
├── backend/
│   ├── generate_cre_copilot_data_large.py
│   ├── requirements.txt
│   └── data/
│       ├── mock_dim_out/
│       └── cre_copilot_demo.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/ui/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## 🧹 8. Helpful commands

### Backend
```bash
# activate env
source backend/.venv/bin/activate
# regenerate data
python backend/generate_cre_copilot_data_large.py
```

### Frontend
```bash
npm run dev     # start local server
npm run build   # production bundle
```

---

## 🏁 9. License
MIT © 2025 Antwon01
