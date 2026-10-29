// Default location: Boca Raton, Florida
const DEFAULT_LOCATION = {
  name: "Boca Raton",
  region: "Florida, USA",
  latitude: 26.3683,
  longitude: -80.1289,
  timezone: "America/New_York",
};
const LOCATION_KEY = "boca-weather-location";
const HOURS_TO_SHOW = 24;

function buildWeatherUrl(loc) {
  const params = new URLSearchParams({
    latitude: loc.latitude,
    longitude: loc.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day",
    hourly: "temperature_2m,weather_code,precipitation_probability,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    // Times come back in the city's own timezone
    timezone: loc.timezone || "auto",
    forecast_days: 5,
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

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

function formatHour(isoTime) {
  // isoTime is already in the city's local time, e.g. "2026-10-28T21:00"
  const hour = Number(isoTime.slice(11, 13));
  return `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`;
}

function renderHourly(hourly, currentTime) {
  const list = $("hourly");
  list.innerHTML = "";

  // Start at the city's current hour
  const currentHour = currentTime.slice(0, 13) + ":00";
  let start = hourly.time.findIndex((t) => t >= currentHour);
  if (start === -1) start = 0;

  hourly.time.slice(start, start + HOURS_TO_SHOW).forEach((time, offset) => {
    const i = start + offset;
    const { text, icon } = describe(hourly.weather_code[i], hourly.is_day[i] === 1);
    const rain = hourly.precipitation_probability[i];

    const li = document.createElement("li");
    li.className = offset === 0 ? "hour now" : "hour";
    li.innerHTML = `
      <span class="hour-time">${offset === 0 ? "Now" : formatHour(time)}</span>
      <span class="hour-icon" title="${text}">${icon}</span>
      <span class="hour-temp">${Math.round(hourly.temperature_2m[i])}°</span>
      <span class="hour-rain${rain > 0 ? "" : " dry"}" title="Chance of rain">💧${rain == null ? "–" : rain + "%"}</span>`;
    list.appendChild(li);
  });
  list.scrollLeft = 0;
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

// ---------- Location ----------

function isValidLocation(loc) {
  return Boolean(loc) && typeof loc.name === "string" && loc.name.trim() !== "" &&
    Number.isFinite(loc.latitude) && Math.abs(loc.latitude) <= 90 &&
    Number.isFinite(loc.longitude) && Math.abs(loc.longitude) <= 180;
}

function loadSavedLocation() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCATION_KEY));
    if (isValidLocation(saved)) return saved;
  } catch (e) {
    // Missing or unreadable: fall back to Boca Raton
  }
  return DEFAULT_LOCATION;
}

function saveLocation(loc) {
  try {
    if (loc === DEFAULT_LOCATION) localStorage.removeItem(LOCATION_KEY);
    else localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
  } catch (e) {
    // Storage blocked: the location still applies for this visit
  }
}

function isDefaultLocation(loc) {
  return loc.latitude === DEFAULT_LOCATION.latitude && loc.longitude === DEFAULT_LOCATION.longitude;
}

let currentLocation = loadSavedLocation();

function renderLocationHeader() {
  $("locationName").textContent = currentLocation.name;
  $("locationRegion").textContent = currentLocation.region;
  $("homeBtn").classList.toggle("hidden", isDefaultLocation(currentLocation));
  document.title = `${currentLocation.name} Weather`;
}

function setLocation(loc) {
  currentLocation = loc;
  saveLocation(loc);
  renderLocationHeader();
  // Clear the old city's numbers so they never show under the new name
  showWeatherSections(false);
  setStatus(`Loading weather for ${loc.name}…`);
  loadWeather();
}

// ---------- Weather ----------

function setStatus(message, isError = false) {
  const status = $("status");
  status.textContent = message;
  status.classList.toggle("error", isError);
  status.classList.remove("hidden");
}

function showWeatherSections(show) {
  ["currentContent", "hourlyCard", "forecastCard"].forEach((id) => $(id).classList.toggle("hidden", !show));
}

let weatherRequest = 0;

async function loadWeather() {
  const requestId = ++weatherRequest;
  const loc = currentLocation;
  const btn = $("refreshBtn");
  btn.disabled = true;
  btn.classList.add("spinning");

  try {
    const response = await fetch(buildWeatherUrl(loc), { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (requestId !== weatherRequest) return; // A newer location was picked
    if (!data.current || !data.hourly || !data.daily) throw new Error("Incomplete weather data");

    renderCurrent(data.current);
    renderHourly(data.hourly, data.current.time);
    renderForecast(data.daily);

    $("status").classList.add("hidden");
    showWeatherSections(true);
    $("updated").textContent = `Updated ${new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  } catch (err) {
    if (requestId !== weatherRequest) return;
    console.error("Weather fetch failed:", err);
    setStatus(`Couldn't load weather for ${loc.name}. Check your connection and tap Refresh to try again.`, true);
    showWeatherSections(false);
    $("updated").innerHTML = "&nbsp;";
  } finally {
    if (requestId === weatherRequest) {
      btn.disabled = false;
      btn.classList.remove("spinning");
    }
  }
}

// ---------- Search ----------

let searchRequest = 0;
let searchTimer;

function setSearchMessage(message, isError = false) {
  const el = $("searchMessage");
  el.textContent = message;
  el.classList.toggle("error", isError);
}

function openSearch() {
  $("searchPanel").hidden = false;
  $("searchBtn").setAttribute("aria-expanded", "true");
  $("searchInput").focus();
}

function closeSearch() {
  $("searchPanel").hidden = true;
  $("searchBtn").setAttribute("aria-expanded", "false");
  $("searchInput").value = "";
  $("searchResults").innerHTML = "";
  setSearchMessage("");
  searchRequest++; // Ignore any search still in flight
  clearTimeout(searchTimer);
}

function renderResults(results) {
  const list = $("searchResults");
  list.innerHTML = "";

  results.forEach((place) => {
    const region = [place.admin1, place.country].filter(Boolean).join(", ");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "result";

    const name = document.createElement("span");
    name.className = "result-name";
    name.textContent = place.name;
    const sub = document.createElement("span");
    sub.className = "result-region";
    sub.textContent = region;
    btn.append(name, sub);

    btn.addEventListener("click", () => {
      closeSearch();
      setLocation({
        name: place.name,
        region,
        latitude: place.latitude,
        longitude: place.longitude,
        timezone: place.timezone || "auto",
      });
    });

    const li = document.createElement("li");
    li.appendChild(btn);
    list.appendChild(li);
  });
}

async function searchLocations(query) {
  const requestId = ++searchRequest;
  setSearchMessage("Searching…");

  try {
    const params = new URLSearchParams({ name: query, count: 8, language: "en", format: "json" });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (requestId !== searchRequest) return;

    const results = data.results || [];
    if (results.length === 0) {
      $("searchResults").innerHTML = "";
      setSearchMessage(`No places found for "${query}". Check the spelling or try a nearby city.`, true);
      return;
    }
    setSearchMessage("");
    renderResults(results);
  } catch (err) {
    if (requestId !== searchRequest) return;
    console.error("Location search failed:", err);
    $("searchResults").innerHTML = "";
    setSearchMessage("Couldn't search right now. Check your connection and try again.", true);
  }
}

function handleSearchInput(immediate) {
  clearTimeout(searchTimer);
  const query = $("searchInput").value.trim();

  if (query.length < 2) {
    searchRequest++;
    $("searchResults").innerHTML = "";
    setSearchMessage(immediate ? "Enter at least 2 letters of a city name." : "");
    return;
  }
  if (immediate) searchLocations(query);
  else searchTimer = setTimeout(() => searchLocations(query), 300);
}

$("searchBtn").addEventListener("click", () => ($("searchPanel").hidden ? openSearch() : closeSearch()));
$("searchCancel").addEventListener("click", closeSearch);
$("searchInput").addEventListener("input", () => handleSearchInput(false));
$("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  handleSearchInput(true);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("searchPanel").hidden) {
    closeSearch();
    $("searchBtn").focus();
  }
});

$("homeBtn").addEventListener("click", () => setLocation(DEFAULT_LOCATION));
$("refreshBtn").addEventListener("click", loadWeather);

renderLocationHeader();
loadWeather();
