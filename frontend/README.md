# Frontend — Used Bike Price Prediction

This is the React + Vite client for the used-bike price predictor.

## Run

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

## Environment Variables

- `VITE_API_BASE_URL`: Base URL of the FastAPI backend (default fallback in code: `http://127.0.0.1:8000`)
- `VITE_API_KEY`: API key sent as `x-api-key`

Example `.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_API_KEY=dev_12345
```

## Request Contract

The frontend sends this payload to `POST /predict`:

```json
{
	"brand": "Royal Enfield",
	"power": 350,
	"kms_driven": 15000,
	"age": 3,
	"owner_rank": 1
}
```

Current UI bounds are aligned with backend validation:

- `power`: 50 to 2500
- `age`: 0 to 25 (frontend UX limit; backend allows up to 50)
- `kms_driven`: 0 to 150000 (frontend UX limit; backend allows up to 999999)
- `owner_rank`: 1 to 5

## UX Safety Behavior

- Client-side pre-submit validation checks payload ranges before request.
- Prediction requests use a timeout and show a dedicated timeout error message when exceeded.
