import { useEffect, useState } from 'react';

const QUICK_CITIES = ['London', 'Tokyo', 'New York', 'Reykjavik'];

function WeatherIcon({ code, isDay = true, size = 'regular' }) {
  let symbol = '☀';
  if ([1, 2].includes(code)) symbol = isDay ? '⛅' : '☁';
  if ([3, 45, 48].includes(code)) symbol = '☁';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) symbol = '🌧';
  if ([71, 73, 75, 77, 85, 86].includes(code)) symbol = '❄';
  if ([95, 96, 99].includes(code)) symbol = '⛈';
  return <span className={`weather-icon weather-icon-${size}`} aria-hidden="true">{symbol}</span>;
}

function formatTemp(value) {
  return `${Math.round(value)}°`;
}

function formatDay(date, index, timezone) {
  if (index === 0) return 'Today';
  return new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: timezone }).format(new Date(`${date}T12:00:00`));
}

function App() {
  const [query, setQuery] = useState('London');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  async function loadWeather(city) {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load the forecast.');
      setWeather(data);
      setQuery(data.location.name);
      setUpdatedAt(new Date());
    } catch (requestError) {
      setError(requestError.message || 'Could not connect to the weather service.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadWeather('London'); }, []);

  function search(event) {
    event.preventDefault();
    const city = query.trim();
    if (city) loadWeather(city);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Your browser does not support location. Search for a city instead.');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`/api/weather?latitude=${coords.latitude}&longitude=${coords.longitude}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load your local forecast.');
        setWeather(data);
        setQuery(data.location.name);
        setUpdatedAt(new Date());
      } catch (requestError) {
        setError(requestError.message || 'Could not load your local forecast.');
      } finally {
        setLoading(false);
      }
    }, () => {
      setError('Location access was unavailable. You can search for a city instead.');
      setLoading(false);
    }, { timeout: 10000 });
  }

  const current = weather?.current;
  const timezone = weather?.location.timezone || 'UTC';
  const localTime = current?.time
    ? new Intl.DateTimeFormat('en', { weekday: 'long', hour: 'numeric', minute: '2-digit', timeZone: timezone }).format(new Date(current.time))
    : '';

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Weather home"><span className="wordmark-sun">☼</span>weather<span className="wordmark-period">.</span></a>
        <span className="top-note">A good day starts with a look outside.</span>
        <button className="location-button" type="button" onClick={useMyLocation}><span aria-hidden="true">⌖</span> Use my location</button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">YOUR LITTLE WINDOW ON THE WORLD</p>
          <h1>Weather,<br /><em>wherever you are.</em></h1>
          <p className="hero-subtitle">A simple forecast for the place you call today.</p>
        </div>
        <form className="search-form" onSubmit={search} role="search">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <label className="sr-only" htmlFor="city-search">Search for a city</label>
          <input id="city-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try a city name..." autoComplete="off" />
          <button type="submit" disabled={loading}>Search <span aria-hidden="true">→</span></button>
        </form>
      </section>

      <nav className="quick-cities" aria-label="Popular cities">
        <span className="quick-label">A FEW PLACES</span>
        {QUICK_CITIES.map((city) => <button type="button" key={city} onClick={() => loadWeather(city)} disabled={loading}>{city}</button>)}
      </nav>

      {error && <div className="error-message" role="alert"><span aria-hidden="true">!</span>{error}</div>}

      {weather && (
        <section className={`weather-content${loading ? ' is-loading' : ''}`} aria-live="polite" aria-busy={loading}>
          <article className="current-card">
            <div className="current-main">
              <div className="location-line"><span className="location-pin" aria-hidden="true">⌖</span><div><h2>{weather.location.name}</h2><p>{[weather.location.region, weather.location.country].filter(Boolean).join(', ')}</p></div></div>
              <p className="local-time">{localTime}</p>
              <div className="temperature-row"><span className="temperature">{formatTemp(current.temperature_2m)}</span><WeatherIcon code={current.weather_code} isDay={Boolean(current.is_day)} size="hero" /></div>
              <p className="condition">{current.description}</p>
              <p className="feels-like">Feels like {formatTemp(current.apparent_temperature)}</p>
            </div>
            <div className="current-details">
              <div className="detail-heading"><span>RIGHT NOW</span><span className="detail-rule" /></div>
              <div className="detail-item"><span className="detail-icon humidity-icon">≈</span><div><span>Humidity</span><strong>{Math.round(current.relative_humidity_2m)}%</strong></div></div>
              <div className="detail-item"><span className="detail-icon wind-icon">↗</span><div><span>Wind</span><strong>{Math.round(current.wind_speed_10m)} {weather.units.wind}</strong></div></div>
              <div className="detail-item"><span className="detail-icon rain-icon">⌁</span><div><span>Rain today</span><strong>{current.precipitation} mm</strong></div></div>
              <div className="sun-times"><span>☼ Sunrise <strong>{new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', timeZone: timezone }).format(new Date(weather.daily[0].sunrise))}</strong></span><span>☾ Sunset <strong>{new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', timeZone: timezone }).format(new Date(weather.daily[0].sunset))}</strong></span></div>
            </div>
          </article>

          <section className="forecast-section" aria-label="Five-day forecast">
            <div className="forecast-heading"><div><p className="eyebrow">THE NEXT FEW DAYS</p><h2>Coming up</h2></div><span className="forecast-unit">5 DAY FORECAST</span></div>
            <div className="forecast-grid">
              {weather.daily.map((day, index) => (
                <article className={`forecast-day${index === 0 ? ' forecast-today' : ''}`} key={day.date}>
                  <span className="forecast-name">{formatDay(day.date, index, timezone)}</span>
                  <WeatherIcon code={day.code} size="forecast" />
                  <span className="forecast-description">{day.description}</span>
                  <div className="high-low"><strong>{formatTemp(day.high)}</strong><span>{formatTemp(day.low)}</span></div>
                  <span className="rain-chance">↙ {day.rainChance ?? 0}%</span>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}

      {!weather && loading && <div className="loading-state"><span className="loading-sun">☼</span><p>Checking the sky over London...</p></div>}

      <footer className="footer"><span>Made for the everyday forecast.</span><span>Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></span>{updatedAt && <span>Updated {new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(updatedAt)}</span>}</footer>
    </main>
  );
}

export default App;
