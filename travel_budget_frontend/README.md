# Travel Budget Frontend

A modern, minimalistic, responsive React app for planning, tracking, and optimizing travel budgets.

## Features
- User authentication (login/register)
- Trip creation and management
- Budget planning and editing (per-category)
- Expense tracking with categorization
- Spending insights, reports, and visualizations
- Currency conversion
- Recommendations for budget control
- Responsive navigation with sidebar and topbar

## Environment
Create a `.env` using `.env.example`:
- `REACT_APP_API_BASE_URL` — backend base URL (required)
- `REACT_APP_SITE_URL` — site URL for email redirects (optional)
- `REACT_APP_DEFAULT_CURRENCY` — default currency (e.g., USD)

## Scripts
- `npm start` — run dev server
- `npm run build` — production build
- `npm test` — run tests

## Notes
- This frontend expects a REST backend that exposes endpoints under `/auth`, `/trips`, `/trips/:id/budget`, `/trips/:id/expenses`, `/trips/:id/reports/summary`, and `/currency`.
- All network configuration is read from environment variables; no secrets are hard-coded.
