---
title: Open-Source AI Standardisation Observatory
emoji: 🏛️
colorFrom: yellow
colorTo: red
sdk: gradio
sdk_version: 5.20.1
app_file: app.py
pinned: false
---

# Open-Source AI Standardisation Observatory

An auditable research engine, evidence database, and interactive network observatory investigating open-source AI participation in global standardisation and European regulatory processes (e.g., CEN-CENELEC JTC 21, ISO/IEC JTC 1/SC 42, NIST AISIC, and the EU AI Act).

---

## Deploying to Hugging Face Spaces (Recommended)

Hugging Face Spaces provides free, instant cloud hosting with custom subdomains (e.g. `https://huggingface.co/spaces/<your-username>/ai-standardisation-observatory`).

### Method 1: Push via Git (Automated Docker Build)

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space).
2. Set a **Space name** (e.g. `ai-standardisation-observatory`).
3. Under **Space SDK**, select **Docker** (Blank template).
4. Set Space hardware to **CPU Basic** (Free).
5. Click **Create Space**.
6. On your computer, inside your extracted project directory, run:
   ```bash
   git init
   git add .
   git commit -m "Deploy to Hugging Face Spaces"
   git branch -M main
   git remote add origin https://huggingface.co/spaces/<YOUR-HF-USERNAME>/<YOUR-SPACE-NAME>
   git push -u origin main --force
   ```
*(When prompted for password, use your Hugging Face [Access Token](https://huggingface.co/settings/tokens) with "Write" permissions).*

Hugging Face will automatically build the included `Dockerfile` and launch your live application on port 7860!

---

### Method 2: Browser Upload (No Git / CLI required)

1. Create a Space on Hugging Face with **Docker** SDK.
2. In your Space, click the **Files** tab.
3. Click **Add file** → **Upload files**.
4. Drag and drop all project files from the unzipped archive.
5. Click **Commit changes to main**. Hugging Face will automatically build and start the app.

---

## Deploying to GitHub Pages (Live in 30 Seconds)

The project includes a pre-compiled `/docs` folder and `.nojekyll` file so it runs live on GitHub Pages with zero build steps or server requirements.

### Quickest Method: Deploy from `/docs` folder (Recommended)

1. Create a repository on [GitHub](https://github.com/new).
2. Push your project code:
   ```bash
   git init
   git add .
   git commit -m "Deploy Open-Source AI Standardisation Observatory"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   git push -u origin main
   ```
3. In your GitHub repository:
   - Go to **Settings** → **Pages** (in the left sidebar).
   - Under **Build and deployment** → **Source**, keep **Deploy from a branch**.
   - Under **Branch**, select **`main`** and choose the **`/docs`** folder from the dropdown.
   - Click **Save**.
4. Your observatory will be live at:
   `https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/`

### Alternative Method: Deploy via GitHub Actions
If you prefer automated CI/CD builds on every commit:
- Under **Settings** → **Pages** → **Source**, select **GitHub Actions**.
- The included `.github/workflows/deploy.yml` workflow will automatically build Vite and deploy the site.

---

## Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

### 3. Run Python Verification Tests
```bash
python3 tests/test_validation.py
python3 tests/test_network.py
# or using pytest
pytest tests/
```

---

## Stage 2: Empirical Analysis & Pipeline Architecture

Stage 2 extends the Open-Source AI Standardisation Observatory with verified network statistics, multi-hop brokerage tracing, longitudinal temporal tracking, data quality audits, and downloadable research outputs.

### Repository Structure

```
open-source-ai-standardisation-observatory/
│
├── index.html                      # Homepage & interactive explorer (Stage 1)
├── docs/                           # Pre-compiled static release for GitHub Pages
│
├── pages/
│   ├── network-analysis.html       # Stage 2: Verified network statistics & centralities
│   ├── brokerage-pathways.html     # Stage 2: Bridge actors, cut vertices & multi-hop chains
│   ├── temporal-analysis.html      # Stage 2: Event frequency & regulatory timelines
│   ├── data-quality.html           # Stage 2: 5-field schema audit & issue log
│   └── research-outputs.html        # Stage 2: Dataset versions, SemVer & reproducibility
│
├── assets/
│   ├── css/
│   │   └── stage2.css              # Stage 2 shared editorial stylesheet
│   └── js/
│       ├── stage2-common.js        # Shared navigation header, banners & data loaders
│       ├── network-analysis.js     # Network statistics & SVG layout controller
│       ├── brokerage-pathways.js   # Articulation point & pathway tracing controller
│       ├── temporal-analysis.js    # Chronological distribution controller
│       ├── data-quality.js         # Schema validator & anomaly auditor
│       └── research-outputs.js     # Artifact previews, downloaders & citations
│
├── data/
│   ├── raw/                        # Source records (evidence_records.csv, entities.json)
│   ├── processed/                  # Validated graph nodes and edges
│   └── outputs/                    # Generated analysis matrices (metrics, pathways, audit)
│
├── analysis/
│   ├── validate_data.py            # Validates CSV schema compliance (RFC 4180)
│   ├── build_network.py            # Builds adjacency matrix and connected components
│   ├── calculate_metrics.py        # Computes degree, betweenness, closeness, density
│   └── analyse_pathways.py         # Traces multi-hop paths and detects cut vertices
│
├── tests/
│   ├── test_validation.py          # Unit tests for schema and data validation (36 tests)
│   └── test_network.py             # Integration tests for graph engine and metrics
│
└── README.md                       # Documentation & deployment guides
```

### Reproducing the Stage 2 Analysis Pipeline

The entire Stage 2 pipeline runs in **Pure Python 3** with zero external black boxes or machine learning dependencies. To execute the analytical pipeline from scratch:

```bash
# 1. Validate raw evidence records and generate schema quality audit
python3 analysis/validate_data.py

# 2. Construct network topology and identify graph partitions
python3 analysis/build_network.py

# 3. Calculate structural graph measures (density, degrees, centralities)
python3 analysis/calculate_metrics.py

# 4. Trace multi-hop standardisation pathways and detect cut vertices
python3 analysis/analyse_pathways.py

# 5. Execute regression and verification test suite
python3 tests/test_validation.py
python3 tests/test_network.py
```

### Stage 2 Analytical Pages Overview

1. **Network Analysis (`pages/network-analysis.html`)**:
   - Verified network statistics, degree distribution, Brandes betweenness centrality, closeness centrality, and clustering coefficients.
   - Cross-sector interfacing density between open-source foundations, SDOs, and public institutions.

2. **Brokerage & Pathways (`pages/brokerage-pathways.html`)**:
   - Articulation point detection (cut vertices) isolating single points of structural failure.
   - Interactive multi-hop pathway tracer detailing every accredited institutional representation step between projects (e.g. PyTorch, ONNX) and European standards bodies (e.g. CEN-CENELEC JTC 21).

3. **Temporal Analysis (`pages/temporal-analysis.html`)**:
   - Evaluates date fidelity ratios across cataloged records.
   - Longitudinal tracking correlating standardisation activity surges with EU AI Act timelines and NIST AISIC working group milestones.

4. **Data Quality & Audit (`pages/data-quality.html`)**:
   - Automated 5-field canonical schema compliance audit.
   - Verbatim passage completeness ratio and evidence directives log.

5. **Research Outputs & Reproducibility (`pages/research-outputs.html`)**:
   - Curated downloadable results (CSV, JSON, JSON-LD) with live interactive previews.
   - Semantic Versioning history (v2.0.0 Stage 2 Gold Ledger) and formal BibTeX / APA citations.

