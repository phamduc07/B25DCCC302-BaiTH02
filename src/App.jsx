import React, { useState } from 'react';
import './App.css';

const CITIES = [
  { id: 'hn', name: 'Hà Nội', lat: 21.0285, lon: 105.8542 },
  { id: 'hp', name: 'Hải Phòng', lat: 20.8449, lon: 106.6881 },
  { id: 'hue', name: 'Huế', lat: 16.4637, lon: 107.5909 },
  { id: 'dn', name: 'Đà Nẵng', lat: 16.0544, lon: 108.2022 },
  { id: 'nt', name: 'Nha Trang', lat: 12.2388, lon: 109.1967 },
  { id: 'dl', name: 'Đà Lạt', lat: 11.9404, lon: 108.4583 },
  { id: 'hcm', name: 'TP. Hồ Chí Minh', lat: 10.8231, lon: 106.6297 },
  { id: 'ct', name: 'Cần Thơ', lat: 10.0452, lon: 105.7469 },
];

const getWeatherInfo = (code) => {
  if (code === 0) return { desc: 'Trời quang, nắng', icon: '☀️', type: 'sunny' };
  if ([1, 2, 3].includes(code)) return { desc: 'Nhiều mây', icon: '⛅', type: 'cloudy' };
  if ([45, 48].includes(code)) return { desc: 'Sương mù', icon: '🌫️', type: 'cloudy' };
  if ([51, 53, 55, 56, 57].includes(code)) return { desc: 'Mưa phùn', icon: '🌦️', type: 'rainy' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { desc: 'Mưa rào', icon: '🌧️', type: 'rainy' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { desc: 'Có tuyết', icon: '❄️', type: 'cold' };
  if ([95, 96, 99].includes(code)) return { desc: 'Dông sét', icon: '⛈️', type: 'thunder' };
  return { desc: 'Có mây nhẹ', icon: '🌤️', type: 'cloudy' };
};

const removeVietnameseTones = (str) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

export default function App() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCelsius, setIsCelsius] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('fav_cities');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (cityId, e) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(cityId)
        ? prev.filter((id) => id !== cityId)
        : [...prev, cityId];
      localStorage.setItem('fav_cities', JSON.stringify(next));
      return next;
    });
  };

  const fetchWeather = async (city) => {
    if (!city) return;
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FHo_Chi_Minh&forecast_days=7`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Không thể tải dữ liệu thời tiết');
      const data = await res.json();
      setWeatherData(data);
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = (city) => {
    setSelectedCity(city);
    fetchWeather(city);
  };

  const formatTemp = (tempC) => {
    if (tempC === null || tempC === undefined) return '--';
    if (isCelsius) return `${Math.round(tempC)}°C`;
    const tempF = (tempC * 9) / 5 + 32;
    return `${Math.round(tempF)}°F`;
  };

  const formatDayName = (dateStr) => {
    const d = new Date(dateStr);
    const dayIndex = d.getDay();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${days[dayIndex]}, ${d.getDate()}/${d.getMonth() + 1}`;
  };

  const filteredCities = CITIES.filter((c) =>
    removeVietnameseTones(c.name).includes(removeVietnameseTones(searchTerm))
  );

  const currentWeatherCode = weatherData?.current?.weather_code;
  const weatherType = currentWeatherCode !== undefined ? getWeatherInfo(currentWeatherCode).type : 'default';

  return (
    <div className={`app-container theme-${weatherType}`}>
      <header className="app-header">
        <h1>Dự Báo Thời Tiết Việt Nam</h1>
        <button className="unit-toggle-btn" onClick={() => setIsCelsius(!isCelsius)}>
          Đổi đơn vị: <strong>{isCelsius ? '°C' : '°F'}</strong>
        </button>
      </header>

      <main className="main-content">
        <section className="city-list-section">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Tìm kiếm thành phố..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="city-list">
            {filteredCities.map((city) => {
              const isSelected = selectedCity?.id === city.id;
              const isFav = favorites.includes(city.id);
              return (
                <div
                  key={city.id}
                  className={`city-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectCity(city)}
                >
                  <span className="city-name">{city.name}</span>
                  <button
                    className={`fav-btn ${isFav ? 'active' : ''}`}
                    onClick={(e) => toggleFavorite(city.id, e)}
                    title="Yêu thích"
                  >
                    ★
                  </button>
                </div>
              );
            })}
            {filteredCities.length === 0 && (
              <p className="no-result">Không tìm thấy thành phố phù hợp.</p>
            )}
          </div>
        </section>

        <section className="weather-display-section">
          {!selectedCity && (
            <div className="state-card placeholder">
              <span className="icon">📍</span>
              <p>Vui lòng chọn một thành phố từ danh sách để xem dự báo thời tiết.</p>
            </div>
          )}

          {loading && (
            <div className="state-card loading">
              <div className="spinner"></div>
              <p>Đang tải dữ liệu thời tiết cho {selectedCity?.name}...</p>
            </div>
          )}

          {error && !loading && (
            <div className="state-card error">
              <span className="icon">⚠️</span>
              <p>{error}</p>
              <button className="retry-btn" onClick={() => fetchWeather(selectedCity)}>
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && weatherData && selectedCity && (
            <div className="weather-details">
              <div className="current-weather-card">
                <div className="current-header">
                  <h2>{selectedCity.name}</h2>
                  <span className="update-time">
                    Cập nhật: {new Date(weatherData.current.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="current-main">
                  <div className="weather-icon-large">
                    {getWeatherInfo(weatherData.current.weather_code).icon}
                  </div>
                  <div>
                    <div className="temperature-large">
                      {formatTemp(weatherData.current.temperature_2m)}
                    </div>
                    <div className="weather-desc">
                      {getWeatherInfo(weatherData.current.weather_code).desc}
                    </div>
                  </div>
                </div>

                <div className="current-meta">
                  <div className="meta-item">
                    <span>Độ ẩm</span>
                    <strong>{weatherData.current.relative_humidity_2m}%</strong>
                  </div>
                  <div className="meta-item">
                    <span>Tốc độ gió</span>
                    <strong>{weatherData.current.wind_speed_10m} km/h</strong>
                  </div>
                </div>
              </div>

              <div className="forecast-container">
                <h3>Dự báo 7 ngày tới</h3>
                <div className="forecast-grid">
                  {weatherData.daily.time.map((dateStr, idx) => {
                    const code = weatherData.daily.weather_code[idx];
                    const info = getWeatherInfo(code);
                    const maxT = weatherData.daily.temperature_2m_max[idx];
                    const minT = weatherData.daily.temperature_2m_min[idx];

                    return (
                      <div key={dateStr} className="forecast-day-card">
                        <div className="day-name">{formatDayName(dateStr)}</div>
                        <div className="day-icon">{info.icon}</div>
                        <div className="day-desc">{info.desc}</div>
                        <div className="day-temps">
                          <span className="max-temp">{formatTemp(maxT)}</span>
                          <span className="temp-divider">/</span>
                          <span className="min-temp">{formatTemp(minT)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}