# maps-request-analysis-helper

A web tool for analyzing iOS console logs to extract and visualize API requests. Built to speed up debugging mobile app API traffic.

## What it does

- Parses iOS console logs and extracts API requests
- Groups requests by endpoint and HTTP method
- Shows request/response bodies for each endpoint
- Generates TypeScript interfaces from API samples
- Exports requests as cURL commands
- Saves analysis history in localStorage

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Zod for validation
