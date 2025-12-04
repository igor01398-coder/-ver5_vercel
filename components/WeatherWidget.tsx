
import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, CloudLightning, CloudFog, CloudSun, Thermometer, Loader2 } from 'lucide-react';

export const WeatherWidget: React.FC = () => {
  const [temp, setTemp] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // Yongchun Pi Coordinates
  const LAT = 25.03;
  const LNG = 121.58;

  const fetchWeather = async () => {
    try {
      setLoading(true);
      // Using Open-Meteo (Free, no key required)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}&current=temperature_2m,weather_code&timezone=auto`
      );
      
      if (!response.ok) throw new Error('Weather fetch failed');
      
      const data = await response.json();
      setTemp(data.current.temperature_2m);
      setWeatherCode(data.current.weather_code);
      setError(false);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // Refresh every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // WMO Weather interpretation
  const getWeatherIcon = (code: number) => {
    // Clear sky
    if (code === 0) return <Sun className="w-3 h-3 text-amber-500" />;
    // Mainly clear, partly cloudy, overcast
    if (code >= 1 && code <= 3) return <CloudSun className="w-3 h-3 text-slate-500" />;
    // Fog
    if (code === 45 || code === 48) return <CloudFog className="w-3 h-3 text-slate-400" />;
    // Drizzle & Rain
    if (code >= 51 && code <= 67) return <CloudRain className="w-3 h-3 text-blue-400" />;
    // Snow (Rare in Taipei, but handled)
    if (code >= 71 && code <= 77) return <Cloud className="w-3 h-3 text-slate-300" />;
    // Rain showers
    if (code >= 80 && code <= 82) return <CloudRain className="w-3 h-3 text-blue-500" />;
    // Thunderstorm
    if (code >= 95) return <CloudLightning className="w-3 h-3 text-purple-500" />;
    
    return <Cloud className="w-3 h-3 text-slate-500" />;
  };

  if (error) return null; // Hide widget on error

  return (
    <div className="backdrop-blur bg-white/90 border border-slate-200 px-3 py-1 rounded-full shadow-sm flex items-center gap-2 transition-all hover:bg-white cursor-help" title="Local Weather Conditions">
      {loading ? (
        <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
      ) : (
        <>
          {weatherCode !== null && getWeatherIcon(weatherCode)}
          <span className="text-xs font-mono text-slate-600 font-bold">
             {temp !== null ? `${Math.round(temp)}°C` : '--'}
          </span>
        </>
      )}
    </div>
  );
};
