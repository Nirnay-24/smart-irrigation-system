# Smart Irrigation System

Final-year engineering project — a web dashboard that monitors soil moisture, temperature, humidity and rainfall across multiple garden zones, and decides when to irrigate using a fuzzy logic controller running on a Raspberry Pi 3B with ESP32 sensor nodes. The dashboard also pulls live weather data and uses an LLM to generate plain-language irrigation recommendations.

Live demo: https://smart-irrigation-system-cc18f.web.app

## What it does

Each garden zone has sensors reporting soil moisture, temperature, humidity, and rain detection. A fuzzy logic system on the Raspberry Pi decides whether to irrigate, based on those readings plus season and rainfall context. Users sign in with Google and see live sensor data for all zones; the system also tracks how much water was saved compared to traditional irrigation timing.

Access is role-based. A fixed list of Gmail addresses (stored in Firestore, not in the client code) gets full control — manual override, switching between Auto/Manual mode, turning valves on or off. Anyone else who signs in gets read-only access to the same dashboard.

## Architecture

- **Hardware**: Raspberry Pi 3B as the controller, two ESP32 boards as sensor/relay nodes, fuzzy logic for the irrigation decision instead of fixed thresholds.
- **Frontend**: Plain HTML/CSS/JS (no framework, no build step) using native ES modules. Firebase Auth handles sign-in, Firestore is the database.
- **AI chatbot & recommendations**: Garden sensor data + current weather gets sent to Groq's API (Llama 3 8B) to generate a short irrigation recommendation. 
- **Weather data**: OpenWeatherMap, used both for the dashboard's weather card and as input to the AI recommendation.

## Project structure

```
index.html              Entry point
css/style.css           All styling
js/
  config.js             API keys (not committed — see setup below)
  firebase-init.js       Firebase app initialization
  auth.js                Google sign-in, role lookup
  firebase.js             Firestore reads/writes
  api.js                   Weather + Groq AI calls
  insights.js              Water-savings calculations
  ui.js                     Rendering functions
  app.js                    Wires everything together
```

## Running it locally

You need a local HTTP server because the project uses ES modules, which browsers block over `file://`.

```bash
git clone https://github.com/Nirnay-24/smart-irrigation-system.git
cd smart-irrigation-system
python -m http.server 8080
```

Then open `http://localhost:8080`.

### API keys

Create `js/config.js` (gitignored, won't be committed) with:

```js
export const firebaseConfig = {
  // your Firebase project config
};
export const OPENWEATHER_API_KEY = 'your key from openweathermap.org/api';
export const GROQ_API_KEY = 'your key from console.groq.com';
export const GARDEN_NAMES = ['Garden1', 'Garden2', 'Garden3', 'Garden4'];
```

Without weather/AI keys the dashboard still runs — weather shows an error and the AI feature shows as disabled. Without `firebaseConfig` nothing will load, since auth and the database depend on it.

### Firebase setup

1. Create a Firestore document at `config/roles` with a `controllers` field — an array of Gmail addresses that should get full control. Anyone else who signs in gets view-only access.
2. Set Firestore security rules so writes to sensor data are restricted to controllers, and the `config/roles` doc itself can't be written from the client (edit it manually in the Firebase console).
3. The Raspberry Pi's Python script writes sensor data using a Firebase service account, which bypasses these client-side rules entirely — that's intentional, the hardware needs unrestricted write access.

## Notes

- Garden1 uses open-channel irrigation; Gardens 2–4 use drip irrigation with different flow rates, which is why the water-savings calculation in `insights.js` weights them differently.
- This was built as a group final-year project. Hardware code (the Raspberry Pi / ESP32 side) lives separately — this repo is the web dashboard only.
