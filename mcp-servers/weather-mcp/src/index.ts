import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import http from 'http';
import axios from 'axios';
import { Validator } from 'jsonschema';

// Constants
const NWS_API_BASE = 'https://api.weather.gov';
const USER_AGENT = 'weather-app/1.0';
const PORT = process.env.PORT || 3000;

// Interfaces for our weather data
interface AlertFeature {
  properties: {
    event?: string;
    areaDesc?: string;
    severity?: string;
    description?: string;
    instruction?: string;
  };
}

interface ForecastPeriod {
  name: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  detailedForecast: string;
}

interface GetAlertsRequest {
  state: string;
}

interface GetForecastRequest {
  latitude: number;
  longitude: number;
}

// Helper function to make requests to the National Weather Service API
async function makeNWSRequest(url: string): Promise<any> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/geo+json'
      },
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error('Error making NWS request:', error);
    return null;
  }
}

// Format alert data into readable text
function formatAlert(feature: AlertFeature): string {
  const props = feature.properties;
  return `
Event: ${props.event || 'Unknown'}
Area: ${props.areaDesc || 'Unknown'}
Severity: ${props.severity || 'Unknown'}
Description: ${props.description || 'No description available'}
Instructions: ${props.instruction || 'No specific instructions provided'}
`;
}

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const validator = new Validator();

// Middleware to parse JSON requests
app.use(express.json());

// Define schema for get-alerts
const getAlertsSchema = {
  type: 'object',
  properties: {
    state: { type: 'string', pattern: '^[A-Z]{2}$' }
  },
  required: ['state']
};

// Define schema for get-forecast
const getForecastSchema = {
  type: 'object',
  properties: {
    latitude: { type: 'number' },
    longitude: { type: 'number' }
  },
  required: ['latitude', 'longitude']
};

// Endpoint for getting weather alerts
app.post('/api/get-alerts', async (req: Request, res: Response) => {
  // Validate request
  const validation = validator.validate(req.body, getAlertsSchema);
  if (!validation.valid) {
    return res.status(400).json({ 
      error: 'Invalid request', 
      details: validation.errors.map((e: any) => e.message).join(', ') 
    });
  }

  const { state } = req.body as GetAlertsRequest;
  const url = `${NWS_API_BASE}/alerts/active/area/${state}`;
  const data = await makeNWSRequest(url);

  if (!data || !data.features) {
    return res.status(500).json({ error: 'Unable to fetch alerts or no alerts found.' });
  }

  if (data.features.length === 0) {
    return res.json({ result: 'No active alerts for this state.' });
  }

  const alerts = data.features.map(formatAlert);
  res.json({ result: alerts.join('\n---\n') });
});

// Endpoint for getting weather forecast
app.post('/api/get-forecast', async (req: Request, res: Response) => {
  // Validate request
  const validation = validator.validate(req.body, getForecastSchema);
  if (!validation.valid) {
    return res.status(400).json({ 
      error: 'Invalid request', 
      details: validation.errors.map((e: any) => e.message).join(', ') 
    });
  }

  const { latitude, longitude } = req.body as GetForecastRequest;
  
  // First get the forecast grid endpoint
  const pointsUrl = `${NWS_API_BASE}/points/${latitude},${longitude}`;
  const pointsData = await makeNWSRequest(pointsUrl);

  if (!pointsData) {
    return res.status(500).json({ error: 'Unable to fetch forecast data for this location.' });
  }

  // Get the forecast URL from the points response
  const forecastUrl = pointsData.properties.forecast;
  const forecastData = await makeNWSRequest(forecastUrl);

  if (!forecastData) {
    return res.status(500).json({ error: 'Unable to fetch detailed forecast.' });
  }

  // Format the periods into a readable forecast
  const periods = forecastData.properties.periods;
  const forecasts = periods.slice(0, 5).map((period: ForecastPeriod) => `
${period.name}:
Temperature: ${period.temperature}°${period.temperatureUnit}
Wind: ${period.windSpeed} ${period.windDirection}
Forecast: ${period.detailedForecast}
`);

  res.json({ result: forecasts.join('\n---\n') });
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('get-alerts', async (data: GetAlertsRequest, callback: (response: any) => void) => {
    // Validate request
    const validation = validator.validate(data, getAlertsSchema);
    if (!validation.valid) {
      return callback({ 
        error: 'Invalid request', 
        details: validation.errors.map((e: any) => e.message).join(', ') 
      });
    }

    const { state } = data;
    const url = `${NWS_API_BASE}/alerts/active/area/${state}`;
    const apiData = await makeNWSRequest(url);

    if (!apiData || !apiData.features) {
      return callback({ error: 'Unable to fetch alerts or no alerts found.' });
    }

    if (apiData.features.length === 0) {
      return callback({ result: 'No active alerts for this state.' });
    }

    const alerts = apiData.features.map(formatAlert);
    callback({ result: alerts.join('\n---\n') });
  });

  socket.on('get-forecast', async (data: GetForecastRequest, callback: (response: any) => void) => {
    // Validate request
    const validation = validator.validate(data, getForecastSchema);
    if (!validation.valid) {
      return callback({ 
        error: 'Invalid request', 
        details: validation.errors.map((e: any) => e.message).join(', ') 
      });
    }

    const { latitude, longitude } = data;
    
    // First get the forecast grid endpoint
    const pointsUrl = `${NWS_API_BASE}/points/${latitude},${longitude}`;
    const pointsData = await makeNWSRequest(pointsUrl);

    if (!pointsData) {
      return callback({ error: 'Unable to fetch forecast data for this location.' });
    }

    // Get the forecast URL from the points response
    const forecastUrl = pointsData.properties.forecast;
    const forecastData = await makeNWSRequest(forecastUrl);

    if (!forecastData) {
      return callback({ error: 'Unable to fetch detailed forecast.' });
    }

    // Format the periods into a readable forecast
    const periods = forecastData.properties.periods;
    const forecasts = periods.slice(0, 5).map((period: ForecastPeriod) => `
${period.name}:
Temperature: ${period.temperature}°${period.temperatureUnit}
Wind: ${period.windSpeed} ${period.windDirection}
Forecast: ${period.detailedForecast}
`);

    callback({ result: forecasts.join('\n---\n') });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Weather MCP server is running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /api/get-alerts');
  console.log('- POST /api/get-forecast');
  console.log('WebSocket events:');
  console.log('- get-alerts');
  console.log('- get-forecast');
}); 