const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export async function getWeatherData(latitude, longitude) {
  try {
    const response = await fetch(
      `${BASE_URL}?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();
    
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      windDirection: getWindDirection(data.wind.deg),
      precipitation: data.rain ? data.rain['1h'] || 0 : 0,
      weatherCondition: data.weather[0].main
    };
  } catch (error) {
    console.error('Weather API Error:', error);
    throw error;
  }
}

function getWindDirection(degrees) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}