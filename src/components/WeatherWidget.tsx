import React, { useState, useEffect, useCallback } from "react";
import { 
  Cloud, 
  Sun, 
  Moon, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudFog, 
  CloudDrizzle, 
  Thermometer, 
  Wind, 
  Droplets, 
  Search, 
  MapPin, 
  RefreshCw,
  Navigation,
  ChevronDown
} from "lucide-react";
import { Theme } from "../types";

interface WeatherWidgetProps {
  theme: Theme;
}

interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
}

interface ForecastDay {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
}

interface CityInfo {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

// Map WMO codes to human readable strings and icons
const getWeatherInfo = (code: number, isDay: boolean = true) => {
  const codes: Record<number, { text: string; icon: React.ComponentType<any>; color: string }> = {
    0: { text: "Clear Sky", icon: isDay ? Sun : Moon, color: "text-amber-400" },
    1: { text: "Mainly Clear", icon: isDay ? Sun : Moon, color: "text-amber-300/95" },
    2: { text: "Partly Cloudy", icon: Cloud, color: "text-sky-300" },
    3: { text: "Overcast", icon: Cloud, color: "text-slate-400" },
    45: { text: "Foggy", icon: CloudFog, color: "text-gray-400" },
    48: { text: "Depositing Rime Fog", icon: CloudFog, color: "text-gray-300" },
    51: { text: "Light Drizzle", icon: CloudDrizzle, color: "text-blue-300" },
    53: { text: "Moderate Drizzle", icon: CloudDrizzle, color: "text-blue-400" },
    55: { text: "Dense Drizzle", icon: CloudDrizzle, color: "text-blue-500" },
    56: { text: "Light Freezing Drizzle", icon: CloudSnow, color: "text-teal-300" },
    57: { text: "Dense Freezing Drizzle", icon: CloudSnow, color: "text-teal-400" },
    61: { text: "Slight Rain", icon: CloudRain, color: "text-blue-300" },
    63: { text: "Moderate Rain", icon: CloudRain, color: "text-blue-400" },
    65: { text: "Heavy Rain", icon: CloudRain, color: "text-blue-600" },
    66: { text: "Light Freezing Rain", icon: CloudSnow, color: "text-teal-300" },
    67: { text: "Heavy Freezing Rain", icon: CloudSnow, color: "text-teal-500" },
    71: { text: "Slight Snowfall", icon: CloudSnow, color: "text-sky-200" },
    73: { text: "Moderate Snowfall", icon: CloudSnow, color: "text-sky-300" },
    75: { text: "Heavy Snowfall", icon: CloudSnow, color: "text-sky-400" },
    77: { text: "Snow Grains", icon: CloudSnow, color: "text-slate-300" },
    80: { text: "Slight Rain Showers", icon: CloudRain, color: "text-blue-300" },
    81: { text: "Moderate Rain Showers", icon: CloudRain, color: "text-blue-400" },
    82: { text: "Violent Rain Showers", icon: CloudRain, color: "text-blue-600" },
    85: { text: "Slight Snow Showers", icon: CloudSnow, color: "text-sky-200" },
    86: { text: "Heavy Snow Showers", icon: CloudSnow, color: "text-sky-400" },
    95: { text: "Thunderstorm", icon: CloudLightning, color: "text-indigo-400 animate-pulse" },
    96: { text: "Thunderstorm with Hail", icon: CloudLightning, color: "text-purple-400" },
    99: { text: "Heavy Hail Thunderstorm", icon: CloudLightning, color: "text-purple-500" },
  };

  return codes[code] || { text: "Unknown Weather", icon: Cloud, color: "text-slate-400" };
};

export default function WeatherWidget({ theme }: WeatherWidgetProps) {
  const [city, setCity] = useState<CityInfo>(() => {
    const saved = localStorage.getItem("weather_active_city");
    return saved ? JSON.parse(saved) : { name: "London", country: "United Kingdom", latitude: 51.5085, longitude: -0.1257 };
  });

  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityInfo[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searching, setSearching] = useState(false);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Could not load weather details.");
      const data = await res.json();

      if (data.current) {
        setCurrent({
          temp: data.current.temperature_2m,
          feelsLike: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          weatherCode: data.current.weather_code,
          isDay: data.current.is_day === 1,
        });
      }

      if (data.daily) {
        const days: ForecastDay[] = [];
        for (let i = 0; i < Math.min(3, data.daily.time.length); i++) {
          days.push({
            date: data.daily.time[i],
            weatherCode: data.daily.weather_code[i],
            tempMax: data.daily.temperature_2m_max[i],
            tempMin: data.daily.temperature_2m_min[i],
          });
        }
        setForecast(days);
      }
    } catch (err: any) {
      setError(err.message || "Failed to retrieve weather data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync initial weather or whenever city changes
  useEffect(() => {
    fetchWeather(city.latitude, city.longitude);
  }, [city, fetchWeather]);

  // Search cities
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const mappedResults: CityInfo[] = data.results.map((r: any) => ({
          name: r.name,
          country: r.country || "",
          latitude: r.latitude,
          longitude: r.longitude,
        }));
        setSearchResults(mappedResults);
        setShowSearchDropdown(true);
      } else {
        setSearchResults([]);
        setError("No cities found.");
      }
    } catch (err) {
      setError("Geocoding search failed.");
    } finally {
      setSearching(false);
    }
  };

  const selectCity = (selected: CityInfo) => {
    setCity(selected);
    localStorage.setItem("weather_active_city", JSON.stringify(selected));
    setShowSearchDropdown(false);
    setSearchQuery("");
  };

  // Autodetect GPS Location
  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Try reverse geocode if possible or just label it "My Location"
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=auto`
          );
          if (res.ok) {
            const locObj: CityInfo = {
              name: "Current Location",
              country: "Detected GPS",
              latitude,
              longitude,
            };
            setCity(locObj);
            localStorage.setItem("weather_active_city", JSON.stringify(locObj));
          }
        } catch {
          const locObj = { name: "Current Location", country: "GPS", latitude, longitude };
          setCity(locObj);
          localStorage.setItem("weather_active_city", JSON.stringify(locObj));
        }
      },
      (err) => {
        setError("GPS access denied. You can manually search for your city above.");
        setLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const getThemeStyles = () => {
    switch (theme) {
      case "neumorphic":
        return {
          card: "bg-[#1A1A1A] border border-[#2A2A2A] shadow-[inset_1px_1px_5px_rgba(0,0,0,0.8)] rounded-3xl p-4 text-gray-100",
          accentText: "text-[#00E676]",
          dropdown: "bg-[#1C1C1C] border border-[#333] text-gray-200",
          dropdownItemHover: "hover:bg-[#282828] text-white",
          input: "bg-black/50 border border-zinc-800 text-white placeholder-zinc-500 rounded-xl px-3 py-1.5 focus:border-[#00E676]",
          forecastCard: "bg-[#141414] border border-[#232323] p-2.5 rounded-2xl flex flex-col items-center",
        };
      case "financial":
        return {
          card: "bg-[#E6E6D4] border border-[#C5C5B2] shadow-sm rounded-3xl p-4 text-[#3C3C30]",
          accentText: "text-[#556B2F]",
          dropdown: "bg-[#DFDFCB] border border-[#C5C5B2] text-[#3C3C30]",
          dropdownItemHover: "hover:bg-[#D4D4BC] text-[#3C3C30]",
          input: "bg-[#DFDFCB]/40 border border-[#BCBCA6] text-[#3C3C30] placeholder-[#7C7C6A] rounded-xl px-3 py-1.5 focus:border-[#556B2F]",
          forecastCard: "bg-[#DFDFCB]/30 border border-[#BCBCA6]/50 p-2.5 rounded-2xl flex flex-col items-center",
        };
      case "cosmic":
        return {
          card: "backdrop-blur-md bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-[32px] p-5 text-white",
          accentText: "text-cyan-400",
          dropdown: "backdrop-blur-xl bg-slate-950/95 border border-white/10 text-white",
          dropdownItemHover: "hover:bg-cyan-500/10 hover:text-cyan-200 text-slate-300",
          input: "bg-[#05050a]/40 border border-white/10 text-white placeholder-slate-500 rounded-xl px-3 py-1.5 focus:border-cyan-400",
          forecastCard: "backdrop-blur-sm bg-white/5 border border-white/5 p-2.5 rounded-[20px] flex flex-col items-center shadow-inner",
        };
      case "minimalist":
      default:
        return {
          card: "bg-white border border-[#E5E5E5] shadow-sm rounded-3xl p-4 text-gray-800",
          accentText: "text-gray-900",
          dropdown: "bg-white border border-[#E5E5E5] text-gray-800",
          dropdownItemHover: "hover:bg-[#F5F5F7] text-gray-900",
          input: "bg-[#F9F9FB] border border-[#E5E5E5] text-gray-800 placeholder-gray-400 rounded-xl px-3 py-1.5 focus:border-gray-950",
          forecastCard: "bg-[#F9F9FB] border border-[#E5E5E5] p-2.5 rounded-2xl flex flex-col items-center",
        };
    }
  };

  const s = getThemeStyles();

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { weekday: "short" };
    return d.toLocaleDateString("en-US", options);
  };

  return (
    <div className={`${s.card} relative`} id="nexus-weather-forecast-container">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
        
        {/* Left column: Location & Search bar */}
        <div className="flex flex-col justify-between min-w-[220px] space-y-3 relative z-30">
          <div>
            <div className="flex items-center space-x-2">
              <Cloud className={`w-5 h-5 ${s.accentText}`} />
              <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400">Weather Forecast</h3>
            </div>
            
            {/* Active location title */}
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-base font-extrabold tracking-tight" id="weather-active-city-name">{city.name}</span>
              <span className="text-[10px] opacity-60 font-medium truncate max-w-[100px]">{city.country}</span>
            </div>
            
            <p className="text-[9px] text-slate-500 font-mono">
              Lat: {city.latitude.toFixed(2)}, Lon: {city.longitude.toFixed(2)}
            </p>
          </div>

          {/* Search bar & Autolocate */}
          <div className="relative z-40">
            <form onSubmit={handleSearch} className="flex gap-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city..."
                  className={`w-full text-xs pr-7 ${s.input}`}
                  id="weather-city-input"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title="Search location"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAutoLocate}
                className="p-1.5 rounded-xl bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer border border-black/5 dark:border-white/5"
                title="Use current GPS position"
                id="weather-locate-gps"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </form>

            {/* Geocode Dropdown Results */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className={`absolute left-0 right-0 mt-1.5 rounded-xl shadow-2xl py-1 z-50 max-h-52 overflow-y-auto ${s.dropdown}`} id="dropdown-weather-cities">
                <span className="px-3 py-1 block text-[8px] font-bold uppercase tracking-wider text-slate-500">
                  Select Location
                </span>
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectCity(res)}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex justify-between items-center cursor-pointer ${s.dropdownItemHover}`}
                  >
                    <span className="font-semibold">{res.name}</span>
                    <span className="opacity-55 text-[9px]">{res.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center column: Primary weather display */}
        <div className="flex-1 flex items-center justify-center md:border-x md:border-black/5 md:dark:border-white/5 px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-4">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Synchronizing atmospheric arrays...</span>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-xs text-rose-400 font-semibold mb-1">Weather Sync Error</p>
              <button 
                onClick={() => fetchWeather(city.latitude, city.longitude)}
                className="text-[10px] uppercase font-bold text-cyan-400 underline hover:opacity-80"
              >
                Retry Request
              </button>
            </div>
          ) : current ? (
            (() => {
              const info = getWeatherInfo(current.weatherCode, current.isDay);
              const IconComp = info.icon;
              return (
                <div className="flex items-center space-x-5 py-1">
                  {/* Huge Weather Icon */}
                  <div className="p-3 bg-black/10 dark:bg-white/5 rounded-[24px] border border-black/5 dark:border-white/5 shadow-inner">
                    <IconComp className={`w-12 h-12 ${info.color}`} />
                  </div>

                  {/* Temperature details */}
                  <div className="flex flex-col">
                    <div className="flex items-start">
                      <span className="text-3xl font-black font-mono tracking-tighter leading-none" id="weather-current-temp">
                        {Math.round(current.temp)}
                      </span>
                      <span className="text-base font-bold ml-0.5 mt-[-2px] text-cyan-400">°C</span>
                    </div>

                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-300 mt-1">
                      {info.text}
                    </span>

                    <div className="flex items-center space-x-2.5 mt-1.5 text-slate-500 font-mono text-[9px] font-semibold">
                      <span className="flex items-center space-x-0.5">
                        <Thermometer className="w-3 h-3 text-purple-400" />
                        <span>Feels {Math.round(current.feelsLike)}°</span>
                      </span>
                      <span className="flex items-center space-x-0.5">
                        <Droplets className="w-3 h-3 text-blue-400" />
                        <span>{current.humidity}%</span>
                      </span>
                      <span className="flex items-center space-x-0.5">
                        <Wind className="w-3 h-3 text-emerald-400" />
                        <span>{current.windSpeed} km/h</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : null}
        </div>

        {/* Right column: 3-Day Forecast */}
        <div className="flex flex-col justify-center min-w-[240px]">
          <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-2.5 text-center md:text-left">
            Upcoming Daily Forecast
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            {loading ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="h-[75px] bg-black/10 dark:bg-white/5 rounded-2xl animate-pulse" />
              ))
            ) : forecast.map((f, i) => {
              const info = getWeatherInfo(f.weatherCode, true);
              const IconComp = info.icon;
              return (
                <div key={f.date} className={s.forecastCard}>
                  <span className="text-[9px] uppercase font-bold text-slate-400 mb-1 leading-none">
                    {i === 0 ? "Today" : getDayName(f.date)}
                  </span>
                  <IconComp className={`w-5 h-5 my-1 ${info.color}`} />
                  <div className="flex items-baseline space-x-0.5 text-[10px] font-mono leading-none mt-1">
                    <span className="font-bold text-slate-200">{Math.round(f.tempMax)}°</span>
                    <span className="text-[8px] text-slate-500">/</span>
                    <span className="text-slate-500">{Math.round(f.tempMin)}°</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
