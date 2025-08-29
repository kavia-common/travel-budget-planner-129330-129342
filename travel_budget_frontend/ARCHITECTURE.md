# Travel Budget Planning Frontend

This React app implements:
- User authentication (login/register)
- Trip management (CRUD)
- Budget planning per trip (total and per category)
- Expense tracking with categories and currency
- Reports and recommendations (via backend summary)
- Currency conversion support
- Responsive, minimalistic UI with requested colors

Environment variables (use .env file, see .env.example):
- REACT_APP_API_BASE_URL
- REACT_APP_SITE_URL
- REACT_APP_DEFAULT_CURRENCY

Structure:
- src/context/AuthContext.js — session handling, token storage
- src/services/api.js — REST API client using env base URL
- src/pages/* — application pages
- src/components/* — small reusable UI parts
- src/App.js — app shell with routing and navigation
