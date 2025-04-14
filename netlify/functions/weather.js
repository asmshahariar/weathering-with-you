const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Weather check function
    const checkWeather = async (lat, lon) => {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min`
        );
        return await response.json();
    };

    try {
        // Your weather checking logic here
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Weather checked" })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to check weather" })
        };
    }
};