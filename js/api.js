// ================================================================
//  API — OpenWeatherMap (weather/forecast) + Groq (AI insights)
// ================================================================
import { OPENWEATHER_API_KEY, GROQ_API_KEY } from './config.js';

const OWM = 'https://api.openweathermap.org/data/2.5';

// ── Weather ────────────────────────────────────────────────────

/** Fetch current weather for a city. Returns data object or { error } */
export const fetchWeather = async (city) => {
    if (!city) return { error: 'City not set. Update it in your profile.' };
    try {
        const res  = await fetch(`${OWM}/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`);
        if (!res.ok) throw new Error((await res.json()).message);
        const d    = await res.json();
        return {
            condition:   d.weather[0].main,
            description: d.weather[0].description,
            temperature: Math.round(d.main.temp),
            humidity:    d.main.humidity,
            icon:        d.weather[0].icon
        };
    } catch (err) { return { error: err.message }; }
};

/** Fetch 6-point forecast for a city. Returns array or { error } */
export const fetchForecast = async (city) => {
    if (!city) return { error: 'City not set.' };
    try {
        const res = await fetch(`${OWM}/forecast?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric&cnt=6`);
        if (!res.ok) throw new Error((await res.json()).message);
        const d   = await res.json();
        return d.list.map(item => ({
            time: new Date(item.dt * 1000),
            temp: Math.round(item.main.temp),
            icon: item.weather[0].icon
        }));
    } catch (err) { return { error: err.message }; }
};

// ── Groq AI ────────────────────────────────────────────────────

/** Get AI irrigation recommendation. Returns string. */
export const fetchAIRecommendation = async (sensorData, gardenName, weather) => {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_key_here') {
        return 'AI feature is disabled. Add your Groq API key to js/config.js to enable recommendations.';
    }

    const prompt = `You are an expert agricultural advisor for a smart irrigation system.
Analyze this data for ${gardenName}:
- Soil Moisture: ${sensorData.soilMoisture ?? 'unknown'}%
- Temperature: ${sensorData.temperature ?? 'unknown'}°C
- Air Humidity: ${sensorData.humidity ?? 'unknown'}%
- Rainfall Now: ${sensorData.rainNow ?? 0}mm
- Season: ${sensorData.season || 'unknown'}
- Irrigation Status: ${sensorData.irrigationStatus || 'Off'}
- Control Mode: ${sensorData.controlMode || 'Auto'}

Current outdoor weather: ${weather.condition}, ${weather.temperature}°C, humidity ${weather.humidity}%.

Provide a concise, actionable single-paragraph recommendation covering irrigation timing, soil health, and any immediate actions needed.`;

    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        if (!res.ok) throw new Error((await res.json()).error?.message || 'Groq API error');
        const result = await res.json();
        return result.choices[0].message.content;
    } catch (err) {
        console.error('Groq error:', err);
        return `Failed to get recommendation: ${err.message}`;
    }
};
