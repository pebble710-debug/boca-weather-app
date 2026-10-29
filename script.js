// Boca Raton, Florida
const LATITUDE = 26.3683;
const LONGITUDE = -80.1289;

const API_URL =
  "https://api.open-meteo.com/v1/forecast" +
  `?latitude=${LATITUDE}&longitude=${LONGITUDE}` +
  "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day" +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
  "&temperature_unit=fahrenheit&wind_speed_unit=mph" +
  "&timezone=America%2FNew_York&forecast_days=5";

// WMO weather codes -> description and icon
const WEATHER_CODES = {
  0: ["Clear Sky", "☀️", "🌙"],
  1: ["Mainly Clear", "🌤️", "🌙"],
  2: ["Partly Cloudy", "⛅", "☁️"],
  3: ["Overcast", "☁️", "☁️"],
  45: ["Fog", "🌫️", "🌫️"],
  48: ["Rime Fog", "🌫️", "🌫️"],
  51: ["Light Drizzle", "🌦️", "🌧️"],
  53: ["Drizzle", "🌦️", "🌧️"],
  55: ["Heavy Drizzle", "🌧️", "🌧️"],
  56: ["Freezing Drizzle", "🌧️", "🌧️"],
  57: ["Freezing Drizzle", "🌧️", "🌧️"],
  61: ["Light Rain", "🌦️", "🌧️"],
  63: ["Rain", "🌧️", "🌧️"],
  65: ["Heavy Rain", "🌧️", "🌧️"],
  66: ["Freezing Rain", "🌧️", "🌧️"],
  67: ["Freezing Rain", "🌧️", "🌧️"],
  71: ["Light Snow", "🌨️", "🌨️"],
  73: ["Snow", "🌨️", "🌨️"],
  75: ["Heavy Snow", "❄️", "❄️"],
  77: ["Snow Grains", "🌨️", "🌨️"],
  80: ["Rain Showers", "🌦️", "🌧️"],
  81: ["Rain Showers", "🌧️", "🌧️"],
  82: ["Violent Showers", "⛈️", "⛈️"],
  85: ["Snow Showers", "🌨️", "🌨️"],
  86: ["Snow Showers", "🌨️", "🌨️"],
  95: ["Thunderstorm", "⛈️", "⛈️"],
  96: ["Thunderstorm & Hail", "⛈️", "⛈️"],
  99: ["Thunderstorm & Hail", "⛈️", "⛈️"],
};

const $ = (id) => document.getElementById(id);

function describe(code, isDay = true) {
  const [text, dayIcon, nightIcon] = WEATHER_CODES[code] || ["Unknown", "🌡️", "🌡️"];
  return { text, icon: isDay ? dayIcon : nightIcon };
}

function renderCurrent(current) {
  const { text, icon } = describe(current.weather_code, current.is_day === 1);
  $("currentIcon").textContent = icon;
  $("temperature").textContent = Math.round(current.temperature_2m);
  $("condition").textContent = text;
  $("feelsLike").textContent = `${Math.round(current.apparent_temperature)}°F`;
  $("humidity").textContent = `${current.relative_humidity_2m}%`;
  $("wind").textContent = `${Math.round(current.wind_speed_10m)} mph`;
}

function renderForecast(daily) {
  const list = $("forecast");
  list.innerHTML = "";

  daily.time.forEach((date, i) => {
    // Parse as local date to avoid timezone shifting the day
    const [y, m, d] = date.split("-").map(Number);
    const dayName = i === 0
      ? "Today"
      : new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
    const { text, icon } = describe(daily.weather_code[i]);

    const li = document.createElement("li");
    li.className = "forecast-day";
    li.innerHTML = `
      <span class="day-name">${dayName}<span class="day-cond">${text}</span></span>
      <span class="day-icon" title="${text}">${icon}</span>
      <span class="day-temps">
        <span class="day-high">${Math.round(daily.temperature_2m_max[i])}°</span>
        <span class="day-low">${Math.round(daily.temperature_2m_min[i])}°</span>
      </span>`;
    list.appendChild(li);
  });
}

async function loadWeather() {
  const btn = $("refreshBtn");
  const status = $("status");
  btn.disabled = true;
  btn.classList.add("spinning");

  try {
    const response = await fetch(API_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    renderCurrent(data.current);
    renderForecast(data.daily);

    status.classList.add("hidden");
    $("currentContent").classList.remove("hidden");
    $("updated").textContent = `Updated ${new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  } catch (err) {
    console.error("Weather fetch failed:", err);
    status.textContent = "Couldn't load weather. Check your connection and try again.";
    status.classList.add("error");
    status.classList.remove("hidden");
    $("currentContent").classList.add("hidden");
  } finally {
    btn.disabled = false;
    btn.classList.remove("spinning");
  }
}

$("refreshBtn").addEventListener("click", loadWeather);
loadWeather();
