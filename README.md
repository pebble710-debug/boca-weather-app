# Boca Weather App

A simple weather app for Boca Raton, Florida (26.3683, -80.1289) with an Apple-inspired glassmorphism design. Built for FAU ISM.

## Features

- Current temperature (°F) and conditions
- Feels-like temperature, humidity, and wind speed
- 5-day forecast with weather icons
- Refresh button
- Light / Dark / Auto appearance switch (Auto follows your device setting; your choice is remembered)
- Live data from the free [Open-Meteo API](https://open-meteo.com/) (no API key needed)

## Files

- `index.html` – page structure
- `style.css` – glassmorphism styling
- `script.js` – fetches and displays weather data
- `theme.js` – Light / Dark / Auto appearance switch
- `netlify.toml` – Netlify config (no build command)

## Run locally

Open `index.html` in a browser.

## Deploy to Netlify

1. In Netlify, choose **Add new site → Import an existing project** and pick this GitHub repo.
2. Leave the build command empty and set the publish directory to `.` (already set in `netlify.toml`).
3. Click **Deploy**.
