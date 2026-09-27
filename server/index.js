import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT) || 3001;
const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const weatherLabels = {
  0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Freezing fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  56: 'Freezing drizzle', 57: 'Heavy freezing drizzle', 61: 'Light rain', 63: 'Rain',
  65: 'Heavy rain', 66: 'Freezing rain', 67: 'Heavy freezing rain', 71: 'Light snow',
  73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Light showers',
  81: 'Showers', 82: 'Heavy showers', 85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm',
};

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Weather provider returned ${response.status}`);
  return response.json();
}

app.get('/api/weather', async (req, res) => {
  const city = String(req.query.city ?? '').trim();
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
    && req.query.latitude !== undefined && req.query.longitude !== undefined;
  if (!hasCoordinates && (!city || city.length > 100)) {
    return res.status(400).json({ error: 'Enter a city name to see its forecast.' });
  }
  if (hasCoordinates && (Math.abs(latitude) > 90 || Math.abs(longitude) > 180)) {
    return res.status(400).json({ error: 'The supplied location is not valid.' });
  }

  try {
    let place;
    if (hasCoordinates) {
      place = { name: 'Your location', latitude, longitude, country: '' };
    } else {
      const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
      geoUrl.search = new URLSearchParams({ name: city, count: '1', language: 'en', format: 'json' }).toString();
      const places = await fetchJson(geoUrl);
      place = places.results?.[0];
      if (!place) return res.status(404).json({ error: `We couldn't find “${city}”. Try another city.` });
    }

    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
    forecastUrl.search = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
      timezone: 'auto',
      forecast_days: '5',
    }).toString();
    const forecast = await fetchJson(forecastUrl);

    res.set('Cache-Control', 'public, max-age=300');
    res.json({
      location: {
        name: place.name,
        region: place.admin1 || place.country || '',
        country: place.country || '',
        timezone: forecast.timezone,
      },
      current: {
        ...forecast.current,
        description: weatherLabels[forecast.current.weather_code] ?? 'Weather update',
      },
      daily: forecast.daily.time.map((date, index) => ({
        date,
        code: forecast.daily.weather_code[index],
        high: forecast.daily.temperature_2m_max[index],
        low: forecast.daily.temperature_2m_min[index],
        rainChance: forecast.daily.precipitation_probability_max[index],
        sunrise: forecast.daily.sunrise[index],
        sunset: forecast.daily.sunset[index],
        description: weatherLabels[forecast.daily.weather_code[index]] ?? 'Weather update',
      })),
      units: { temperature: forecast.current_units.temperature_2m, wind: forecast.current_units.wind_speed_10m },
    });
  } catch (error) {
    console.error('Weather request failed:', error);
    res.status(502).json({ error: 'Weather data is unavailable right now. Please try again shortly.' });
  }
});

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(projectRoot, 'dist');
  app.use(express.static(dist));
  app.get(/.*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(port, () => console.log(`Weather API ready at http://localhost:${port}`));
