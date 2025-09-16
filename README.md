# Namaste Jharkhand (JharTour)

AI-powered travel planning, marketplace, and community safety platform focused on Jharkhand, India.

This repository contains a Next.js + TypeScript frontend and a Python Flask backend providing an AI-driven itinerary generation service, multilingual chat support, a verified local marketplace, and community features like missing-person reporting.

---

**Table of contents**

- Project overview
- Key features
- Architecture & important files
- Local development
- API reference (backend)
- Deployment notes
- Contributing
- License

---

## Project overview

Namaste Jharkhand (also referenced in code as JharTour) helps users plan personalized trips across Jharkhand. The frontend is implemented with Next.js (App Router) and TypeScript; the backend is a Flask service that exposes endpoints to generate itineraries, fetch POIs and options, and power a chatbot.

The itinerary engine supports multi-city routing, train-aware journeys, budget constraints, accessibility and family-friendly options and uses OR-Tools for route optimization where applicable.

## Key features

- AI-powered itinerary generation (multi-day, multi-city)
- Train-aware journey planning (uses local train station data when available)
- Interest-based POI filtering and scoring
- Budget and pace-aware scheduling
- Multilingual chatbot endpoint
- Marketplace and verified providers (frontend components)
- Missing person reporting & basic police/notifications slices in Redux

## Architecture & Important Files

- Frontend (Next.js + TypeScript)
  - `src/app/` – App routes and pages (landing, auth, itinerary, marketplace, dashboard)
  - `src/components/` – Reusable React components (ItineraryDisplay, TravelPlanningForm, TrainItineraryDisplay, Navbar, Footer, Chatbot components)
  - `src/lib/firebase.js` – Firebase helper (authentication/storage)
  - `store/` – Redux Toolkit slices and hooks used across the app

- Backend (Flask + Python)
  - `backend/main.py` – Main Flask application. Contains data models (`POI`, `ItineraryDay`, `TripPlan`, `TrainStation`), `PersonalizationEngine`, `TripPlanningEngine`, route handlers and utility functions.
  - Endpoints include `/api/generate-itinerary`, `/api/available-pois`, `/api/options`, `/chat`, and `/health`.

- Config and scripts
  - `package.json` – Frontend scripts (dev, build, start)
  - `next.config.ts`, `tsconfig.json` – Next.js configuration

## Local development

Prerequisites

- Node.js (v16+ recommended)
- Python 3.8+
- pip

Frontend

1. Install dependencies

```powershell
npm install
```

2. Start development server

```powershell
npm run dev
```

Frontend runs by default on `http://localhost:3000`.

Backend

1. Create and activate a Python virtual environment (optional but recommended)

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
```

2. Install Python dependencies (create `requirements.txt` if missing)

```powershell
pip install -r backend/requirements.txt
```

3. Run the Flask app

```powershell
python backend/main.py
```

Backend listens on `http://localhost:5000` by default.

Notes

- The frontend calls the backend endpoint `http://localhost:5000/api/generate-itinerary` from the itinerary page. Adjust base URLs or proxy settings for production.
- If `backend/requirements.txt` is not present, install packages referenced in `backend/main.py`: `flask`, `flask-cors`, `geopy`, `numpy`, `pandas`, `ortools`, `groq`, and `python-dotenv`.

## API reference (summary)

- `GET /api/available-pois` – Returns POIs available to the planner.
- `GET /api/options` – Returns selectable options (transport profiles, paces, categories).
- `POST /api/generate-itinerary` – Main endpoint. Accepts JSON body with preferences such as `num_days`, `start_date`, `home_city`, `destination_city`, `budget`, `interests`, `transport_mode`, `pace`, `family_trip`, `accessibility_needs`, `base_location`, `must_visit` (POI ids). Returns a `TripPlan` object with `days`, `total_cost`, `total_pois`, and `generated_at`.
- `POST /chat` – Passes messages to the configured Groq client for language-model powered responses.
- `GET /health` – Basic health check endpoint.

Example request payload for `/api/generate-itinerary`:

```json
{
  "num_days": 5,
  "start_date": "2025-01-10",
  "home_city": "Ranchi",
  "destination_city": "Netarhat",
  "budget": 15000,
  "interests": ["culture","nature"],
  "transport_mode": "train",
  "pace": "moderate"
}
```

## Developer notes

- The itinerary engine lives in `backend/main.py`. It relies on:
  - `POIStorage` and `TrainDataStorage` for availability of POIs and train stations
  - `PersonalizationEngine` to filter and score POIs
  - `TripPlanningEngine` for day-by-day scheduling and journey calculation

- Train-aware logic: When `transport_mode` is `train`, planner attempts to find nearest `TrainStation` entries and uses `calculate_journey_details` to compute intercity journeys; falls back to road travel when train info is missing.

- Scheduling logic: The planner builds daily schedules using `optimize_day_route` (OR-Tools TSP/VRP style optimizer) and enforces constraints like `budget`, `pace`, opening hours, and accessibility.

## Tests

- There are no automated tests included yet. Adding unit tests for `TripPlanningEngine` and API handlers is recommended.

## Contributing

1. Fork the repo and create a feature branch.
2. Open a pull request with a clear description and tests where appropriate.

Please add changelog entries for large features and follow the existing code style (TypeScript for frontend, PEP8 for Python).

## License

This project does not include an explicit license file in the repository snapshot. Add a `LICENSE` file (MIT recommended) if you want to make the project open-source.

---

If you want, I can:

- Add `backend/requirements.txt` with the dependencies used in `backend/main.py`.
- Add a minimal `Procfile` or Dockerfile for easier deployment.
- Create basic unit tests for the itinerary engine.

Tell me which follow-up step you'd like next.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
