const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

// Retrieve the OpenWeather API key from the environment variables
const API_KEY = process.env.OpenWeatherAPIKey;

// Create an instance of the Express application
const app = express();

// Set the port number for the server
const port = 3002;

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set the directory for the views
app.set('views', __dirname + '/views');

// Parse URL-encoded request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Define a route handler for the root URL ("/")
app.get('/', (req, res) => {
  // Render the "index" view
  res.render('index');
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Define a route handler for the "/weather" POST request
app.post('/weather', async (req, res) => {
  // Extract the zipcode from the request body
  const zipcode = req.body.zipcode;

  try {
    // Make a GET request to the OpenWeather API using the provided zipcode
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?zip=${zipcode},us&appid=${API_KEY}&units=imperial`);
    const weather = response.data;

    // Redirect to the "/weather/show" route with the retrieved weather data as query parameters
    res.redirect(`/weather/show?city=${weather.name}&temp=${weather.main.temp}&desc=${weather.weather[0].description}`);
  } catch (error) {
    // Send an error message if the weather data is not found
    res.send('Weather data not found, please try another zip code.');
  }
});

// Define a route handler for the "/weather/show" GET request
app.get('/weather/show', (req, res) => {
  // Retrieve the query parameters from the request
  const { city, temp, desc } = req.query;

  // Check if any of the required parameters are missing
  if (!city || !temp || !desc) {
    // Return a 404 status code and an error message if required data is missing
    return res.status(404).send("Required data is missing");
  }

  // Render the "weather/show" view and pass the retrieved data to the EJS template
  res.render('weather/show', { city, temp, desc });
});