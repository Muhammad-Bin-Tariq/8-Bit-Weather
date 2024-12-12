"use strict";

// The apiKey
const apiKey = "0075bad90d54e42bc6a91be407aae675";

const units = "metric"; // Use metric for Celsius
const geminiApi = "AIzaSyBBn1Hk63KcJoZb8EfPXcrDaklrfVnibnc";

let temperatureChart, weatherConditionChart, futureTemperatureChart; // For storing chart instances
let futureTemps = []; // Declare futureTemps globally
let originalFutureTemps; // Backup of original data
let originalWeatherConditions; // Backup of original weather conditions

let weatherConditions = []; // Declare weatherConditions globally
let cityNameForGemini;

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("geminiButton")
    .addEventListener("click", openGeminiModal);

  const cityInputField = document.querySelector("#searchCity");

  cityInputField.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      const cityInputtedByUser = cityInputField.value.trim(); // Get the user input
      if (cityInputtedByUser) {
        // Clear the error message before making the API call
        document.getElementById("error").style.display = "none";
        fetchWeatherData(cityInputtedByUser);
      }
    }
  });

  // Event listeners for dashboard and tables buttons
  document
    .querySelector("#dashboard .btn-pink")
    .addEventListener("click", showWeatherDetails);
  document
    .querySelector("#tables .btn-pink")
    .addEventListener("click", showForecastTable);
});

// Function to populate the forecast table with data

// Fetch weather data function
function fetchWeatherData(city) {
  showLoading();

  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
  const forecastWeatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}`;

  // Fetch current weather data
  fetch(currentWeatherUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("City not found");
      }
      return response.json();
    })
    .then((data) => {
      hideLoading();
      updateWeatherData(data);

      // Fetch forecast data
      return fetch(forecastWeatherUrl);
    })
    .then((forecastResponse) => {
      if (!forecastResponse.ok) {
        throw new Error("Forecast data not found");
      }
      return forecastResponse.json();
    })
    .then((forecastData) => {
      console.log("Forecast Data:", forecastData); // Log forecast data

      // Extract future temperature data (for the next 5 days)
      futureTemps = forecastData.list
        .filter((entry) => entry.dt_txt.includes("12:00:00")) // Get temperatures at noon
        .map((entry) => Math.round(entry.main.temp)); // Get temperatures

      console.log("5-Day Forecast Temperatures:", futureTemps); // Log future temperatures
      originalFutureTemps = [...futureTemps];
      console.log("5-Day Original Forecast Temperatures:", originalFutureTemps);

      // Log weather descriptions for debugging
      weatherConditions = forecastData.list
        .filter((entry) => entry.dt_txt.includes("12:00:00"))
        .map((entry) => entry.weather[0].description); // Get weather descriptions at noon

      console.log("5-Day Forecast Weather Conditions:", weatherConditions); // Log conditions
      originalWeatherConditions = [...weatherConditions]; // Backup of original weather conditions

      // Check if futureTemps and weatherConditions are defined before populating the table
      if (futureTemps.length === 0 || weatherConditions.length === 0) {
        console.error("No future temperatures or weather conditions found.");
        return; // Exit if no valid data
      }

      // Populate the forecast table with the actual forecast data
      populateForecastTable(); // Call without parameters since they're now global

      // Create charts
      createFutureTemperatureChart(futureTemps);
      createWeatherConditionChart(weatherConditions);
      createTemperatureLineChart(futureTemps);

      // Show weather details after successfully fetching data
      showWeatherDetails();
    })
    .catch((error) => {
      console.log("Error fetching weather data:", error);
      document.getElementById("error").style.display = "block";
      hideLoading();
      hideWeatherDetails();
      console.error(error);
    });
}

// Function to show the forecast table
function showForecastTable() {
  document.getElementById("weather-details").style.display = "none"; // Hide weather details
  document.getElementById("gemini-table").style.display = "block"; // Show forecast table
  document.getElementById("gemini-prompt").style.display = "block"; // Show forecast table
  document.getElementById("filters").style.display = "block"; // Show forecast table
  populateForecastTable(); // Populate the table with data
}

// Function to update the weather data in the HTML and create charts
function updateWeatherData(data) {
  // Update date
  console.log(`Data.name${data.name}`);
  cityNameForGemini = data.name;
  console.log(cityNameForGemini);
  const currentDate = new Date().toLocaleDateString();
  document.getElementById("date").innerText = currentDate;

  // Update city and weather data
  document.getElementById(
    "cityName"
  ).innerText = `${data.name}, ${data.sys.country}`;
  document.getElementById("weatherDescription").innerText =
    data.weather[0].description;
  document.getElementById("temperature").innerText = `${Math.round(
    data.main.temp
  )}°C`;
  document.querySelector(
    "#humidity p"
  ).innerText = `Humidity: ${data.main.humidity}%`;
  document.querySelector("#windSpeed p").innerText = `Wind Speed: ${Math.round(
    data.wind.speed
  )} m/s`;

  // Update weather icon and background
  setWeatherIconAndBackground(
    data.weather[0].icon,
    data.weather[0].description
  );

  // Update local time
  const utcDate = new Date(data.dt * 1000);
  const localTimezoneOffset = data.timezone;
  const localTime = new Date(utcDate.getTime() + localTimezoneOffset * 1000);
  const hours = String(localTime.getUTCHours()).padStart(2, "0");
  const minutes = String(localTime.getUTCMinutes()).padStart(2, "0");
  document.querySelector("#time .btn-ct").innerText = `${hours}:${minutes}`;
}

// Function to show loading animation and hide others
function showLoading() {
  document.getElementById("empty-state").style.display = "none";
  document.getElementById("weather-details").style.display = "none";
  document.getElementById("loading-animation").style.display = "block";
  document.getElementById("gemini-table").style.display = "none"; // Hide forecast table when loading
  document.getElementById("filters").style.display = "none";
  document.getElementById("gemini-prompt").style.display = "none";
}

// Function to hide loading animation
function hideLoading() {
  document.getElementById("loading-animation").style.display = "none";
}

// Function to show weather details
function showWeatherDetails() {
  document.getElementById("weather-details").style.display = "block";
  document.getElementById("gemini-table").style.display = "none"; // Hide forecast table
  document.getElementById("filters").style.display = "none";
  document.getElementById("gemini-prompt").style.display = "none";
}

// Function to hide weather details
function hideWeatherDetails() {
  document.getElementById("weather-details").style.display = "none";
}

// Set weather icon and background based on condition
function setWeatherIconAndBackground(iconCode, weatherCondition) {
  const iconElement = document.getElementById("icon");
  const weatherDisplay = document.getElementById("weatherDisplay");

  if (iconCode.endsWith("d")) {
    // It's daytime
    switch (iconCode) {
      case "01d":
        iconElement.innerHTML = `<img src="/assets/images/01.png" alt="Clear sky">`;
        weatherDisplay.style.backgroundImage =
          "url('/assets/images/landscapeMorning.gif')";
        break;
      case "02d":
        iconElement.innerHTML = `<img src="/assets/images/02.png" alt="Few clouds">`;
        weatherDisplay.style.backgroundImage = "url('/assets/images/02D.gif')";
        break;
      case "03d":
        iconElement.innerHTML = `<img src="/assets/images/03.png" alt="Scattered clouds">`;
        weatherDisplay.style.backgroundImage =
          "url('/assets/images/landscapeMorning1.gif')";
        break;
      case "04d":
        iconElement.innerHTML = `<img src="/assets/images/04.png" alt="Broken clouds">`;
        weatherDisplay.style.backgroundImage =
          "url('/assets/images/landscapeEvening.gif')";
        break;
      case "09d":
        iconElement.innerHTML = `<img src="/assets/images/09.png" alt="Shower rain">`;
        weatherDisplay.style.backgroundImage =
          "url('/assets/images/rainDN.gif')";
        break;
      case "10d":
        iconElement.innerHTML = `<img src="/assets/images/10.png" alt="Rain">`;
        weatherDisplay.style.backgroundImage =
          "url('/assets/images/rainD.gif')";
        break;
      case "11d":
        iconElement.innerHTML = `<img src="/assets/images/11.png" alt="Thunderstorm">`;
        weatherDisplay.style.backgroundImage = "url('/assets/images/11DN.gif')";
        break;
      case "13d":
        iconElement.innerHTML = `<img src="/assets/images/13.png" alt="Snow">`;
        weatherDisplay.style.backgroundImage = "url('/assets/images/snow.gif')";
        break;
      case "50d":
        iconElement.innerHTML = `<img src="/assets/images/50.png" alt="Mist">`;
        weatherDisplay.style.backgroundImage = "url('/assets/images/mist.gif')";
        break;
      default:
        iconElement.innerHTML = `<img src="/assets/images/default.png" alt="Weather icon">`;
        break;
    }
  } else {
    // It's nighttime
    switch (iconCode) {
      case "01n":
        iconElement.innerHTML = `<img src="/assets/images/01n.png" alt="Clear sky">`;
        weatherDisplay.style.backgroundImage =
          "url('/assets/images/landscapeNight.gif')";
        break;
      case "02n":
        iconElement.innerHTML = `<img src="/assets/images/02n.png" alt="Few clouds">`;
        weatherDisplay.style.backgroundImage =
          "url('/assets/images/landscapeNight1.gif')";
        break;
      case "03n":
        iconElement.innerHTML = `<img src="/assets/images/03.png" alt="Scattered clouds">`;
        weatherDisplay.style.backgroundImage =
          "url('/assets/images/landscapeNight1.gif')";
        break;
      case "04n":
        iconElement.innerHTML = `<img src="/assets/images/04.png" alt="Broken clouds">`;
        weatherDisplay.style.backgroundImage =
          "url('/assets/images/landscapeNight.gif')";
        break;
      case "09n":
        iconElement.innerHTML = `<img src="/assets/images/09.png" alt="Shower rain">`;
        weatherDisplay.style.backgroundImage =
          "url('/assets/images/rainN.gif')";
        break;
      case "10n":
        iconElement.innerHTML = `<img src="/assets/images/10n.png" alt="Rain">`;
        weatherDisplay.style.backgroundImage =
          "url('/assets/images/rainN.gif')";
        break;
      case "11n":
        iconElement.innerHTML = `<img src="/assets/images/11.png" alt="Thunderstorm">`;
        weatherDisplay.style.backgroundImage = "url('/assets/images/11N.gif')";
        break;
      case "13n":
        iconElement.innerHTML = `<img src="/assets/images/13.png" alt="Snow">`;
        weatherDisplay.style.backgroundImage = "url('/assets/images/snow.gif')";
        break;
      case "50n":
        iconElement.innerHTML = `<img src="/assets/images/50.png" alt="Mist">`;
        weatherDisplay.style.backgroundImage = "url('/assets/images/mist.gif')";
        break;
      default:
        iconElement.innerHTML = `<img src="/assets/images/default.png" alt="Weather icon">`;
        break;
    }
  }
}

// Function to create the future temperature chart (Vertical Bar Chart)
function createFutureTemperatureChart(futureTemps) {
  const ctx = document.getElementById("temperatureChart").getContext("2d");

  if (temperatureChart) {
    temperatureChart.destroy(); // Destroy the existing chart if it exists
  }

  temperatureChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"], // Label for each day
      datasets: [
        {
          label: "Future Temperatures (°C)",
          data: futureTemps,
          backgroundColor: [
            "#FFCE56",
            "#FF6384",
            "#36A2EB",
            "#4BC0C0",
            "#9966FF",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: Math.max(...futureTemps) + 5,
          ticks: {
            color: "#fff", // White text
            font: {
              family: "VT323", // Customize font family
              size: 14, // Customize font size
            },
          },
        },
        x: {
          ticks: {
            color: "#fff", // White text
            font: {
              family: "VT323",
              size: 14,
            },
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#fff", // White text for legend
            font: {
              family: "VT323",
              size: 14,
            },
          },
        },
      },
    },
  });
}

function createWeatherConditionChart(weatherConditions) {
  const conditionCount = {};
  weatherConditions.forEach((condition) => {
    conditionCount[condition] = (conditionCount[condition] || 0) + 1;
  });

  const labels = Object.keys(conditionCount);
  const data = Object.values(conditionCount);

  if (weatherConditionChart) {
    weatherConditionChart.destroy(); // Destroy the existing chart if it exists
  }

  weatherConditionChart = new Chart(
    document.getElementById("weatherConditionChart").getContext("2d"),
    {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: "#fff", // White text for legend
              font: {
                family: "VT323",
                size: 14,
              },
            },
          },
        },
      },
    }
  );
}

// Function to create the temperature line chart
function createTemperatureLineChart(futureTemps) {
  const ctx = document
    .getElementById("futureTemperatureChart")
    .getContext("2d");

  if (futureTemperatureChart) {
    futureTemperatureChart.destroy(); // Destroy the existing chart if it exists
  }

  futureTemperatureChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"], // Label for each day
      datasets: [
        {
          label: "Temperature (°C)",
          data: futureTemps, // Data for the next 5 days
          fill: false,
          borderColor: "lightpink", // Line color (white)
          pointBackgroundColor: "#ffffff", // Points color (white)
          tension: 0.1, // Smooth curve
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: Math.max(...futureTemps) + 5, // Set max value slightly above the max temperature
          ticks: {
            color: "#ffffff", // Y-axis label color (white)
            font: {
              family: "VT323",
              size: 14,
            },
          },
          grid: {
            color: "#ffffff", // Grid line color (white)
          },
        },
        x: {
          ticks: {
            color: "#ffffff", // X-axis label color (white)
            font: {
              family: "VT323",
              size: 14,
            },
          },
          grid: {
            color: "#ffffff", // Grid line color (white)
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#ffffff", // Legend text color (white)
            font: {
              family: "VT323",
              size: 14,
            },
          },
        },
      },
    },
  });
}

console.log("Current Weather URL:", currentWeatherUrl);
console.log("Forecast Weather URL:", forecastWeatherUrl);

// Gemini wala sab kuch

function openGeminiModal() {
  document.getElementById("geminiModal").style.display = "flex";
  // fetchGeminiData();
}

function closeGeminiModal() {
  document.getElementById("geminiModal").style.display = "none";
}

// Close the modal if the user clicks outside of it
window.onclick = function (event) {
  let modal = document.getElementById("geminiModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

async function fetchGeminiData() {
  const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyBBn1Hk63KcJoZb8EfPXcrDaklrfVnibnc`;
  let promptText = document.getElementById("gemini-prompt-text").value;

  // Define future temperature data and city name

  // Check if "Table" is included in the prompt
  if (promptText.toLowerCase().includes("table")) {
    promptText = ` Please explain the upcoming temperatures for ${cityNameForGemini}: ${futureTemps.join(
      ", "
    )}°C.`;
    console.log(`Prompt Text: ${promptText}`);
    console.log(`cityNameForGemini: ${cityNameForGemini}`);
  }

  const requestBody = {
    contents: [{ parts: [{ text: promptText }] }],
  };

  try {
    const response = await fetch(geminiApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Gemini data");
    }

    const data = await response.json();
    displayGeminiData(data);
  } catch (error) {
    console.error("Error fetching Gemini data:", error);
    document.getElementById("gemini-data").innerText = "Failed to load data.";
  }
}

function displayGeminiData(data) {
  const geminiDataContainer = document.getElementById("gemini-data");
  const generatedText =
    data.candidates[0]?.content?.parts[0]?.text || "No data available.";
  geminiDataContainer.innerText = generatedText;
}

// Filters

console.log(`Original: ${originalFutureTemps}`);
function populateForecastTable() {
  console.log("Im here");
  console.log(`Future temperatures: ${futureTemps}`);
  const forecastTable = document.getElementById("gemini-table");
  const tableBody = forecastTable.querySelector("tbody");
  tableBody.innerHTML = ""; // Clear existing rows

  // Create rows for the table using real data
  futureTemps.forEach((temperature, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
          <td>${`Day ${index + 1}`}</td>
          <td>${temperature} °C</td>
          <td>${weatherConditions[index]}</td>
      `;
    tableBody.appendChild(row);
  });
}

// Sorting Functions
function sortTemperaturesAscending() {
  futureTemps = [...originalFutureTemps];
  futureTemps.sort((a, b) => a - b);
  populateForecastTable();
}

function sortTemperaturesDescending() {
  // Clone the original array to avoid modifying it
  futureTemps = [...originalFutureTemps];

  // Sort the array in descending order
  futureTemps.sort((a, b) => b - a);

  console.log("Descending order:", futureTemps); // Logs the sorted array for better readability
  populateForecastTable();
}

// Filtering Function
function filterRainyDays() {
  // Create a new filtered array based on the original weather conditions
  const rainyDays = originalWeatherConditions.filter((condition, index) =>
    condition.includes("Rain")
  );

  // Update futureTemps and weatherConditions to only include rainy days
  futureTemps = futureTemps.filter((_, index) =>
    rainyDays.includes(originalWeatherConditions[index])
  );
  weatherConditions = rainyDays;

  populateForecastTable();
}

// Function to show the day with the highest temperature
function showHighestTemperature() {
  const highestTempDay = originalFutureTemps.reduce(
    (max, item, index) => {
      return item > max.temperature ? { temperature: item, index } : max;
    },
    { temperature: originalFutureTemps[0], index: 0 }
  );

  // Set futureTemps to only the highest temperature day
  futureTemps = [highestTempDay.temperature]; // Only the temperature value
  weatherConditions = [originalWeatherConditions[highestTempDay.index]]; // Get the corresponding weather condition
  populateForecastTable(); // Refresh the table with the highest temperature day
}

// Function to reset futureTemps to the original state
function resetFutureTemps() {
  futureTemps = [...originalFutureTemps]; // Reset to the original future temperatures
  weatherConditions = [...originalWeatherConditions]; // Reset to the original weather conditions
  populateForecastTable(); // Refresh table with original data
}
