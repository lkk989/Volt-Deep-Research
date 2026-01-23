import { createTool, createToolkit } from "@voltagent/core";
import { z } from "zod";
import axios from "axios"
import axiosRetry from "axios-retry"
import { voltlogger } from "../config/logger.js"

// Create a dedicated HTTP client with retries for transient network errors
const http = axios.create({ timeout: 10000, headers: { Accept: "text/plain" }, responseType: "text" as const })
// Bind helpers to avoid unintentional `this` issues in some linters/type-checkers
const retryDelay = axiosRetry.exponentialDelay.bind(axiosRetry)
const retryCondition = axiosRetry.isNetworkOrIdempotentRequestError.bind(axiosRetry)
axiosRetry(http, { retries: 3, retryDelay, retryCondition })

// Small helper to format unknown errors reliably
function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Tool to fetch weather data using wttr.in (no API key required).
 */
export const getWeatherTool = createTool({
  name: "get_weather",
  description: "Get the weather for a location",
  parameters: z.object({
    location: z.string().describe("The location to get the weather for (e.g. 'London', 'New York')"),
  }),
  execute: async (args, context) => {
    const { location } = args
    if (context && context.isActive !== true) { throw new Error("Operation cancelled") }
    voltlogger.info(`get_weather: fetching weather for ${location}`)

    try {
      // Use format=3 for a short single-line summary
      const url = `https://wttr.in/${encodeURIComponent(location)}?format=3&lang=en`;

      const response = await http.get<string>(url, {
        timeout: 10000,
        headers: { Accept: "text/plain" },
        responseType: "text",
      })

      const text = (typeof response.data === "string") ? response.data.trim() : String(response.data)

      return {
        success: true,
        location,
        weather: text,
        source: url,
        timestamp: new Date().toISOString(),
      }
    } catch (error: unknown) {
      voltlogger.error(`get_weather failed for ${location}: ${formatError(error)}`)
      return {
        success: false,
        error: `Failed to fetch weather for ${location}: ${formatError(error)}`,
        timestamp: new Date().toISOString(),
      }
    }
  },
});

/**
 * Toolkit containing weather-related tools.
 */
export const getForecastOpenMeteo = createTool({
  name: "get_forecast_open_meteo",
  description: "Get structured forecast (hourly/daily) for a location via Nominatim + Open-Meteo (no API key)",
  parameters: z.object({
    location: z.string().describe("Location name or address"),
    days: z.number().int().min(1).max(16).default(3).describe("How many days to include (max 16)"),
    hourly: z.boolean().default(true),
    daily: z.boolean().default(true),
  }),
  execute: async (args, context) => {
    const { location, days, hourly, daily } = args
    if (context && context.isActive !== true) { throw new Error("Operation cancelled") }
    voltlogger.info(`get_forecast_open_meteo: geocoding ${location}`)

    try {
      // Geocode via Nominatim (OpenStreetMap)
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=jsonv2&limit=1`
      interface NominatimResult { lat: string; lon: string; display_name?: string }

      const geoResp = await http.get<NominatimResult[]>(nominatimUrl, { headers: { 'User-Agent': 'Mastervolt-Deep-Research/1.0 (+https://github.com/ssdeanx/Mastervolt-Deep-Research)' }, responseType: 'json' })
      const geo = Array.isArray(geoResp.data) && geoResp.data.length > 0 ? geoResp.data[0] : undefined

      if (typeof geo?.lat !== 'string' || geo.lat.trim() === '' || typeof geo?.lon !== 'string' || geo.lon.trim() === '') {
        return { success: false, error: `Geocoding failed for '${location}'`, timestamp: new Date().toISOString() }
      }

      const lat = Number(geo.lat)
      const lon = Number(geo.lon)
      const placeName = geo.display_name ?? location

      voltlogger.info(`get_forecast_open_meteo: fetching forecast for ${placeName} (${lat},${lon})`)

      const params = new URLSearchParams()
      params.set('latitude', String(lat))
      params.set('longitude', String(lon))
      params.set('timezone', 'auto')
      params.set('forecast_days', String(days))
      params.set('current_weather', 'true')
      if (hourly) { params.set('hourly', 'temperature_2m,precipitation,windspeed_10m') }
      if (daily) { params.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum') }

      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?${params.toString()}`
      const weatherResp = await http.get<unknown>(openMeteoUrl, { responseType: 'json' })

      return {
        success: true,
        location: placeName,
        latitude: lat,
        longitude: lon,
        source: openMeteoUrl,
        data: weatherResp.data,
        timestamp: new Date().toISOString(),
      }
    } catch (error: unknown) {
      voltlogger.error(`get_forecast_open_meteo failed for ${location}: ${formatError(error)}`)
      return { success: false, error: `Failed to fetch forecast for ${location}: ${formatError(error)}`, timestamp: new Date().toISOString() }
    }
  },
})

export const weatherToolkit = createToolkit({
  tools: [getWeatherTool, getForecastOpenMeteo],
  name: "weather_toolkit",
  description: "Tools for fetching weather information (wttr.in summary + Open-Meteo structured forecasts)",
});
