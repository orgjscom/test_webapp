
(function() {
    'use strict';

    var initialWeatherForecast = {
        key: 'newyork',
        label: 'New York, NY',
        currently: {
            time: 1453489481,
            summary: 'Clear',
            icon: 'partly-cloudy-day',
            temperature: 52.74,
            apparentTemperature: 74.34,
            precipProbability: 0.20,
            humidity: 0.77,
            windBearing: 125,
            windSpeed: 1.52
        },
        daily: {
            data: [
                {icon: 'clear-day', temperatureMax: 55, temperatureMin: 34},
                {icon: 'rain', temperatureMax: 55, temperatureMin: 34},
                {icon: 'snow', temperatureMax: 55, temperatureMin: 34},
                {icon: 'sleet', temperatureMax: 55, temperatureMin: 34},
                {icon: 'fog', temperatureMax: 55, temperatureMin: 34},
                {icon: 'wind', temperatureMax: 55, temperatureMin: 34},
                {icon: 'partly-cloudy-day', temperatureMax: 55, temperatureMin: 34}
            ]
        }
    };

    var app = {
        isLoading: true,
        visibleCards: {},
        selectedCities: [],
        spinner: document.querySelector('.loader'),
        cardTemplate: document.querySelector('.cardTemplate'),
        container: document.querySelector('.main'),
        addDialog: document.querySelector('.dialog-container'),
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    };



    /*****************************************************************************
     *
     * Event listeners for UI elements
     *
     ****************************************************************************/

    document.getElementById('butRefresh').addEventListener('click', function() {
        // Refresh all of the forecasts
        app.updateForecasts();
    });

    document.getElementById('butAdd').addEventListener('click', function() {
        // Open/show the add new city dialog
        app.toggleAddDialog(true);
    });

    document.getElementById('butAddCity').addEventListener('click', function() {
        // Add the newly selected city
        var select = document.getElementById('selectCityToAdd');
        var selected = select.options[select.selectedIndex];
        var key = selected.value;
        var label = selected.textContent;
        app.getForecast(key, label);
        app.selectedCities.push({key: key, label: label});
        app.toggleAddDialog(false);
    });

    document.getElementById('butAddCancel').addEventListener('click', function() {
        // Close the add new city dialog
        app.toggleAddDialog(false);
    });


    /*****************************************************************************
     *
     * Methods to update/refresh the UI
     *
     ****************************************************************************/

        // Toggles the visibility of the add new city dialog.
    app.toggleAddDialog = function(visible) {
        if (visible) {
            app.addDialog.classList.add('dialog-container--visible');
        } else {
            app.addDialog.classList.remove('dialog-container--visible');
        }
    };

    // Updates a weather card with the latest weather forecast. If the card
    // doesn't already exist, it's cloned from the template.
    app.updateForecastCard = function(data) {
        var card = app.visibleCards[data.key];
        if (!card) {
            card = app.cardTemplate.cloneNode(true);
            card.classList.remove('cardTemplate');
            card.querySelector('.location').textContent = data.label;
            card.removeAttribute('hidden');
            app.container.appendChild(card);
            app.visibleCards[data.key] = card;
        }
        card.querySelector('.description').textContent = data.currently.summary;
        card.querySelector('.date').textContent =
            new Date(data.currently.time * 1000);
        card.querySelector('.current .icon').classList.add(data.currently.icon);
        card.querySelector('.current .temperature .value').textContent =
            Math.round(data.currently.temperature);
        card.querySelector('.current .feels-like .value').textContent =
            Math.round(data.currently.apparentTemperature);
        card.querySelector('.current .precip').textContent =
            Math.round(data.currently.precipProbability * 100) + '%';
        card.querySelector('.current .humidity').textContent =
            Math.round(data.currently.humidity * 100) + '%';
        card.querySelector('.current .wind .value').textContent =
            Math.round(data.currently.windSpeed);
        card.querySelector('.current .wind .direction').textContent =
            data.currently.windBearing;
        var nextDays = card.querySelectorAll('.future .oneday');
        var today = new Date();
        today = today.getDay();
        for (var i = 0; i < 7; i++) {
            var nextDay = nextDays[i];
            var daily = data.daily.data[i];
            if (daily && nextDay) {
                nextDay.querySelector('.date').textContent =
                    app.daysOfWeek[(i + today) % 7];
                nextDay.querySelector('.icon').classList.add(daily.icon);
                nextDay.querySelector('.temp-high .value').textContent =
                    Math.round(daily.temperatureMax);
                nextDay.querySelector('.temp-low .value').textContent =
                    Math.round(daily.temperatureMin);
            }
        }
        if (app.isLoading) {
            app.spinner.setAttribute('hidden', true);
            app.container.removeAttribute('hidden');
            app.isLoading = false;
        }
    };


    /*****************************************************************************
     *
     * Methods for dealing with the model
     *
     ****************************************************************************/

        // Gets a forecast for a specific city and update the card with the data
    app.getForecast = function(key, label) {
        var url = 'https://publicdata-weather.firebaseio.com/';
        url += key + '.json';
        if ('caches' in window) {
            caches.match(url).then(function(response) {
                if (response) {
                    response.json().then(function(json) {
                        // Only update if the XHR is still pending, otherwise the XHR

                        app.hasRequestPending = true;
                        // has already returned and provided the latest data.
                        if (app.hasRequestPending) {
                            console.log('updated from cache');
                            json.key = key;
                            json.label = label;
                            app.updateForecastCard(json);
                        }
                    });
                }
            });
        }

        // Make the XHR to get the data, then update the card
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    var response = JSON.parse(request.response);
                    response.key = key;
                    response.label = label;
                    app.hasRequestPending = false;
                    app.updateForecastCard(response);
                }
            }
        };

        request.open('GET', url);
        request.send();
    };

    // Iterate all of the cards and attempt to get the latest forecast data
    app.updateForecasts = function() {
        var keys = Object.keys(app.visibleCards);
        keys.forEach(function(key) {
            app.getForecast(key);
        });
    };

    var fakeForecast = {
        key: 'newyork',
        label: 'New York, NY',
        currently: {
            time: 1453489481,
            summary: 'Clear',
            icon: 'partly-cloudy-day',
            temperature: 30,
            apparentTemperature: 21,
            precipProbability: 0.80,
            humidity: 0.17,
            windBearing: 125,
            windSpeed: 1.52
        },
        daily: {
            data: [
                {icon: 'clear-day', temperatureMax: 36, temperatureMin: 31},
                {icon: 'rain', temperatureMax: 34, temperatureMin: 28},
                {icon: 'snow', temperatureMax: 31, temperatureMin: 17},
                {icon: 'sleet', temperatureMax: 38, temperatureMin: 31},
                {icon: 'fog', temperatureMax: 40, temperatureMin: 36},
                {icon: 'wind', temperatureMax: 35, temperatureMin: 29},
                {icon: 'partly-cloudy-day', temperatureMax: 42, temperatureMin: 40}
            ]
        }
    };
    // Uncomment the line below to test with the provided fake data
    app.updateForecastCard(fakeForecast);

    app.saveSelectedCities = function() {
        var selectedCities = JSON.stringify(app.selectedCities);
        localStorage.selectedCities = selectedCities;
    };

    app.selectedCities = localStorage.selectedCities;
    if (app.selectedCities) {
        app.selectedCities = JSON.parse(app.selectedCities);
        app.selectedCities.forEach(function(city) {
            app.getForecast(city.key, city.label);
        });
    } else {
        app.updateForecastCard(initialWeatherForecast);
        app.selectedCities = [
            {key: initialWeatherForecast.key, label: initialWeatherForecast.label}
        ];
        app.saveSelectedCities();
    }



    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./service-worker.js')
            .then(function() { console.log('Service Worker Registered'); });
    }


})();
