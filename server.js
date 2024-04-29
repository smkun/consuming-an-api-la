const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const session = require("express-session");
require("dotenv").config();

const API_KEY = process.env.OpenWeatherAPIKey;
const app = express();
const port = 3002;

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

app.get("/", (req, res) => {
  res.render("index");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

app.post("/weather", async (req, res) => {
  const { zipcode, forecast_type } = req.body;
  let url = "";
  if (forecast_type === "five_day") {
    url = `https://api.openweathermap.org/data/2.5/forecast?zip=${zipcode},us&appid=${API_KEY}&units=imperial`;
  } else {
    url = `https://api.openweathermap.org/data/2.5/weather?zip=${zipcode},us&appid=${API_KEY}&units=imperial`;
  }
  try {
    const response = await axios.get(url);
    const data = response.data;
    // Redirect based on type of forecast
    if (forecast_type === "five_day") {
      req.session.weatherData = data;
      res.redirect("/weather/fiveDay");
    } else {
      const { name: city, main: { temp, humidity, pressure }, weather, sys: { sunrise, sunset } } = data;
      const icon = weather[0].icon;
      res.redirect(`/weather/show?city=${encodeURIComponent(city)}&temp=${temp}&desc=${encodeURIComponent(weather[0].description)}&humidity=${humidity}&pressure=${pressure}&sunrise=${sunrise}&sunset=${sunset}&icon=${icon}`);
    }
  } catch (error) {
    res.status(500).send("Failed to retrieve weather data");
  }
});

app.get('/weather/show', (req, res) => {
  const { city, temp, desc, humidity, pressure, sunrise, sunset, icon } = req.query;
  if (!city || !temp || !desc || !humidity || !pressure || !sunrise || !sunset || !icon) {
    return res.status(404).send("Required data is missing");
  }
  res.render('weather/show', { city, temp, desc, humidity, pressure, sunrise, sunset, icon });
});

app.get('/weather/fiveDay', (req, res) => {
  const data = req.session.weatherData;
  if (!data) {
    return res.status(404).send("Weather data not found");
  }
  const today = new Date();
  const fiveDaysLater = new Date(today);
  fiveDaysLater.setDate(today.getDate() + 5);

  const filteredForecast = data.list.filter(forecast => {
    const forecastDate = new Date(forecast.dt * 1000);
    return forecastDate.toDateString() !== fiveDaysLater.toDateString();
  });

  const forecastByDate = {};
  filteredForecast.forEach(forecast => {
    const date = new Date(forecast.dt * 1000).toLocaleDateString();
    if (!forecastByDate[date]) {
      forecastByDate[date] = forecast;
    }
  });

  res.render('weather/fiveDay', { forecastByDate: forecastByDate, city: data.city.name });
});