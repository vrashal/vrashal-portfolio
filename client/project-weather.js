import { getWeatherIconMeteo, getWeatherDescriptionMeteo } from "./meteo.js";

const dot = document.getElementById("cursor-dot");
const ring = document.getElementById("cursor-ring");
let mx = 0,
  my = 0,
  rx = 0,
  ry = 0;
document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
});

(function animC() {
  dot.style.left = mx + "px";
  dot.style.top = my + "px";
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + "px";
  ring.style.top = ry + "px";
  requestAnimationFrame(animC);
})();

const obs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        obs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));

// Weather App Logic
const weatherMockup = document.querySelector(".weather-mockup");

const locationPermissionArea = document.getElementById(
  "location-permission-area",
);

const enableLocationBtn = document.getElementById("enable-location-btn");

// Validate latitude/longitude coordinates
function isValidCoordinates(lat, lon) {
  return (
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

// --- Open-Meteo API Integration ---
async function getWeatherData(lat, lon) {
  try {
    // Validate coordinates before API call
    if (!isValidCoordinates(lat, lon)) {
      throw new Error("Invalid coordinates provided");
    }

    // Open-Meteo API: https://open-meteo.com/en/docs
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m,visibility,uv_index,wind_speed_10m`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Validate API response structure
    if (!data.current_weather) {
      throw new Error("Invalid API response structure");
    }

    updateWeatherUI(data, lat, lon);
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Weather API request timeout");
    } else {
      console.error("Error fetching weather data:", error);
    }
    weatherMockup.style.display = "none";
    locationPermissionArea.style.display = "block";
  }
}

function updateWeatherUI(data, lat, lon) {
  // Open-Meteo returns current_weather and hourly arrays
  const current = data.current_weather;

  // Find the current hour index for hourly data
  const now = new Date();
  const hourString = now.toISOString().slice(0, 13);
  const hourIdx = Array.isArray(data.hourly?.time)
    ? data.hourly.time.findIndex((t) => t && t.startsWith(hourString))
    : -1;
  const idx = hourIdx !== -1 ? hourIdx : 0;
  // Weather icon mapping (Open-Meteo uses weathercode)
  weatherMockup.querySelector(".weather-icon").textContent =
    getWeatherIconMeteo(current.weathercode, now.getHours());
  weatherMockup.querySelector(".weather-temp").innerHTML =
    `${Math.round(current.temperature)}<sup>°C</sup>`;
  // Use a reverse geocoding API to get city/country (optional, fallback to Lat/Lon)
  // Add timeout to prevent hanging requests
  Promise.race([
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
    ).then((r) => {
      if (!r.ok) throw new Error("Geocoding failed");
      return r.json();
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Geocoding timeout")), 5000),
    ),
  ])
    .then((loc) => {
      const locationText =
        loc.address?.city && loc.address?.country_code
          ? `${loc.address.city}, ${loc.address.country_code.toUpperCase()}`
          : `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      const h3 = weatherMockup.querySelector(".weather-info h3");
      if (h3) h3.textContent = locationText;
    })
    .catch((error) => {
      console.debug("Geocoding error:", error.message);
      const h3 = weatherMockup.querySelector(".weather-info h3");
      if (h3) h3.textContent = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    });
  weatherMockup.querySelector(".weather-info p").textContent =
    `${getWeatherDescriptionMeteo(current.weathercode)} • Feels like ${Math.round(current.temperature)}°C`;
  weatherMockup.querySelector(".weather-stat:nth-child(1) .s-val").textContent =
    data.hourly.relative_humidity_2m[idx] !== undefined
      ? `${data.hourly.relative_humidity_2m[idx]}%`
      : "N/A";
  weatherMockup.querySelector(".weather-stat:nth-child(2) .s-val").textContent =
    data.hourly.wind_speed_10m[idx] !== undefined
      ? `${data.hourly.wind_speed_10m[idx]} km/h`
      : "N/A";
  weatherMockup.querySelector(".weather-stat:nth-child(3) .s-val").textContent =
    data.hourly.visibility[idx] !== undefined
      ? `${(data.hourly.visibility[idx] / 1000).toFixed(1)} km`
      : "N/A";
  weatherMockup.querySelector(".weather-stat:nth-child(4) .s-val").textContent =
    data.hourly.uv_index[idx] !== undefined
      ? `${data.hourly.uv_index[idx]}`
      : "N/A";
  weatherMockup.style.display = "flex";
}


function getUserLocation() {
  if (!navigator.geolocation) {
    console.warn("Geolocation is not supported by this browser");
    weatherMockup.style.display = "none";
    locationPermissionArea.style.display = "block";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      // Validate coordinates
      if (isValidCoordinates(latitude, longitude)) {
        locationPermissionArea.style.display = "none";
        getWeatherData(latitude, longitude);
      } else {
        throw new Error("Invalid coordinates received");
      }
    },
    (error) => {
      console.error("Geolocation error:", error);
      // Handle specific error types
      let errorMsg = "Unable to get your location.";
      if (error.code === 1) {
        errorMsg = "Location permission denied.";
      } else if (error.code === 2) {
        errorMsg = "Location unavailable.";
      } else if (error.code === 3) {
        errorMsg = "Location request timed out.";
      }
      console.warn(`Geolocation: ${errorMsg}`);
      weatherMockup.style.display = "none";
      locationPermissionArea.style.display = "block";
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000,
    },
  );
}

enableLocationBtn.addEventListener("click", getUserLocation);

// Initial check for location
getUserLocation();
