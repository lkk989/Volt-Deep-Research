import { createTool, createToolkit } from "@voltagent/core";
import { z } from "zod";

/**
 * Tool to fetch weather data using wttr.in (no API key required).
 */
const getWeatherTool = createTool({
  name: "get_weather",
  description: "Get the weather for a location",
  parameters: z.object({
    location: z.string().describe("The location to get the weather for (e.g. 'London', 'New York')"),
  }),
  execute: async ({ location }) => {
    try {
      // wttr.in provides a simple text output. format=3 gives a concise output like "London: ⛅️ +13°C"
      // format=j1 gives JSON output if we wanted more detail, but for now let's stick to simple text or full output.
      // Let's use format=3 for a quick summary, or just the location for full report.
      // Using format=3 for simplicity and reliability without parsing complex HTML/JSON.
      const url = `https://wttr.in/${encodeURIComponent(location)}?format=3`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather request failed: ${response.statusText}`);
      }

      const data = await response.text();

      return {
        location,
        weather: data.trim(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: `Failed to fetch weather for ${location}: ${(error as Error).message}`,
      };
    }
  },
});

/**
 * Toolkit containing weather-related tools.
 */
export const weatherToolkit = createToolkit({
  tools: [getWeatherTool],
  name: "weather_toolkit",
  description: "Tools for fetching weather information using wttr.in",
});
