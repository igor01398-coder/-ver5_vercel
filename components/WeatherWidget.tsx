
import React from 'react';
import { Cloud, CloudRain, Sun, CloudLightning, CloudFog, CloudSun, Loader2 } from 'lucide-react';

interface WeatherWidgetProps {
  temp: number | null;
  weatherCode: number | null;
  loading: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ temp, weatherCode, loading }) => {
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

  if (!loading && weatherCode === null) return null;

  return (
    <div className="backdrop-blur bg-white/90 border border-slate-200 px-1.5 sm:px-2 py-1 rounded-full shadow-sm flex items-center gap-1 transition-all hover:bg-white cursor-help shrink-0" title="Local Weather Conditions">
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
