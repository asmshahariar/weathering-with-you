class WeatheringWithYou {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.startApp();
        this.previousWeather = {};
    }

    initializeElements() {
        this.profiles = {
            friend1: document.querySelector('.profile-section.left'),
            friend2: document.querySelector('.profile-section.right')
        };

        this.heartIcon = document.querySelector('.heart-container i');
        this.progressBar = document.querySelector('.progress');
        this.daysApart = document.querySelector('.days');
        this.heartbeats = document.querySelector('.heartbeats');
        this.countdown = document.querySelector('.countdown');
    }

    setupEventListeners() {
        window.addEventListener('load', () => this.updateAllData());
        setInterval(() => this.updateAllData(), 300000);
        
        // Add click handlers for manual message sending
        document.querySelectorAll('.send-message-btn').forEach(btn => {
            btn.addEventListener('click', () => this.sendWhatsAppMessage(btn.dataset.friend));
        });
        
        // Keep the tab active
        setInterval(() => {
            fetch('/ping').catch(() => {});
        }, 280000); // Ping every 4.6 minutes
    }

    async startApp() {
        await this.updateAllData();
        this.startHeartAnimation();
    }

    // Add this method to the WeatheringWithYou class
    async getRealWeather(lat, lon) {
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min`
            );
            const data = await response.json();
            
            // Convert weather code to description
            const weatherCode = data.current.weather_code;
            const description = this.getWeatherDescription(weatherCode);
    
            return {
                temp: Math.round(data.current.temperature_2m),
                temp_min: Math.round(data.daily.temperature_2m_min[0]),
                temp_max: Math.round(data.daily.temperature_2m_max[0]),
                humidity: data.current.relative_humidity_2m,
                wind_speed: Math.round(data.current.wind_speed_10m),
                description: description,
                sunrise: data.daily.sunrise[0].split('T')[1].slice(0, 5),
                sunset: data.daily.sunset[0].split('T')[1].slice(0, 5)
            };
        } catch (error) {
            console.error('Error fetching weather:', error);
            return friend.mockWeather; // Fallback to mock data
        }
    }

    getWeatherDescription(code) {
        const weatherCodes = {
            0: 'Clear sky',
            1: 'Mostly clear',
            2: 'Partly cloudy',
            3: 'Cloudy',
            45: 'Foggy',
            51: 'Light drizzle',
            53: 'Drizzle',
            55: 'Heavy drizzle',
            61: 'Light rain',
            63: 'Rain',
            65: 'Heavy rain',
            80: 'Light showers',
            81: 'Showers',
            82: 'Heavy showers'
        };
        return weatherCodes[code] || 'Partly cloudy';
    }

    // Update the updateAllData method
    async updateAllData() {
        const friend1Weather = await this.getRealWeather(CONFIG.FRIEND1.coordinates.lat, CONFIG.FRIEND1.coordinates.lon);
        const friend2Weather = await this.getRealWeather(CONFIG.FRIEND2.coordinates.lat, CONFIG.FRIEND2.coordinates.lon);
        
        // Update CONFIG with real weather
        CONFIG.FRIEND1.mockWeather = friend1Weather;
        CONFIG.FRIEND2.mockWeather = friend2Weather;
        
        this.updateWeather(CONFIG.FRIEND1, '.profile-section.left');
        this.updateWeather(CONFIG.FRIEND2, '.profile-section.right');
        this.updateTimeInfo();
        this.updateProgressBar();
        await this.checkAndSendAutoMessage();
    }

    updateWeather(friend, selector) {
        const container = document.querySelector(selector);
        const weather = friend.mockWeather;
        
        const tempVariation = Math.random() * 2 - 1;
        const currentTemp = Math.round(weather.temp + tempVariation);
        
        container.querySelector('.current-temp').textContent = `${currentTemp}°C`;
        container.querySelector('.min-max').textContent = 
            `${weather.temp_min}°C / ${weather.temp_max}°C`;
        container.querySelector('.description').textContent = weather.description;
        container.querySelector('.humidity').textContent = `Humidity: ${weather.humidity}%`;
        container.querySelector('.wind').textContent = `Wind: ${weather.wind_speed} km/h`;
        container.querySelector('.sunrise').textContent = `Sunrise: ${weather.sunrise}`;
        container.querySelector('.sunset').textContent = `Sunset: ${weather.sunset}`;

        // Check if weather has changed
        if (this.previousWeather[friend.name] !== weather.description) {
            this.previousWeather[friend.name] = weather.description;
            this.updateMusicPlayer(container, weather);
        }
    }

    async checkAndSendAutoMessage() {
        const now = new Date();
        const hour = now.getHours();
        
        // Only send messages during call hours
        if (hour >= CONFIG.CALL_HOURS.start && hour <= CONFIG.CALL_HOURS.end) {
            const friend2Weather = CONFIG.FRIEND2.mockWeather;
            if (this.shouldSendMessage(friend2Weather)) {
                await this.sendWhatsAppMessage('friend2');
            }
        }
    }

    shouldSendMessage(weather) {
        // Add logic to determine if message should be sent
        const now = new Date();
        const lastSent = this.lastMessageSent || 0;
        const hoursSinceLastMessage = (now - lastSent) / (1000 * 60 * 60);
        
        return hoursSinceLastMessage >= 3; // Send message every 3 hours
    }

    async sendWhatsAppMessage(friendKey) {
        const friend = CONFIG[friendKey.toUpperCase()];
        const weather = friend.mockWeather;
        const weatherMessage = WEATHER_MESSAGES[weather.description]?.message || 
                             WEATHER_MESSAGES['Mostly sunny'].message;
        const songLink = WEATHER_MESSAGES[weather.description]?.song;
        const quote = DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)];

        const message = `${weatherMessage}\n\n${quote}\n\nListen to this song with me: ${songLink}`;
        const whatsappURL = `https://wa.me/${friend.phone}?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappURL, '_blank');
        this.lastMessageSent = new Date();
    }

    updateMusicPlayer(container, weather) {
        const musicPlayer = container.querySelector('.music-player');
        if (musicPlayer) {
            const songLink = WEATHER_MESSAGES[weather.description]?.song;
            musicPlayer.src = songLink;
        }
    }

    startHeartAnimation() {
        this.heartIcon.classList.add('beating');
    }

    updateTimeInfo() {
        const separationDate = new Date(CONFIG.SEPARATION_DATE);
        const meetingDate = new Date(CONFIG.MEETING_DATE);
        const now = new Date();

        // Calculate exact days apart
        const daysApart = Math.floor((now - separationDate) / (1000 * 60 * 60 * 24));
        this.daysApart.textContent = daysApart === 1 ? '1 day' : `${daysApart} days`;

        // Calculate heartbeats more precisely
        const minutesApart = Math.floor((now - separationDate) / (1000 * 60));
        const heartbeatsCount = minutesApart * 80; // 80 beats per minute
        this.heartbeats.textContent = `${heartbeatsCount.toLocaleString()} heartbeats`;

        // Calculate days until next meeting
        const daysUntilMeeting = Math.ceil((meetingDate - now) / (1000 * 60 * 60 * 24));
        this.countdown.textContent = daysUntilMeeting === 1 ? '1 day' : `${daysUntilMeeting} days`;
    }

    updateProgressBar() {
        const separationDate = new Date(CONFIG.SEPARATION_DATE);
        const meetingDate = new Date(CONFIG.MEETING_DATE);
        const now = new Date();

        const totalDuration = meetingDate - separationDate;
        const elapsed = now - separationDate;
        const progress = (elapsed / totalDuration) * 100;

        this.progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
}

const app = new WeatheringWithYou();