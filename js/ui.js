// ================================================================
//  UI — All rendering and DOM patching functions
// ================================================================

// ── Overview Dashboard ─────────────────────────────────────────

export const renderOverview = (gardensData) => `
    <div class="page-header">
        <h2 class="page-title">Overview</h2>
        <p class="page-subtitle">Live status across all 4 garden zones</p>
    </div>
    <div class="overview-grid">
        ${['Garden1','Garden2','Garden3','Garden4'].map(name => {
            const d    = gardensData[name] || {};
            const isOn = d.irrigationStatus === 'On';
            return `
            <div class="garden-card" data-garden="${name}">
                <div class="garden-card-header">
                    <div class="garden-card-name">
                        <span class="garden-icon"><i class="fas fa-seedling"></i></span>
                        <h3>${name.replace('Garden', 'Garden ')}</h3>
                    </div>
                    <div class="status-pill ${isOn ? 'pill-on' : 'pill-off'}">
                        <span class="status-dot"></span>
                        ${isOn ? 'IRRIGATING' : 'IDLE'}
                    </div>
                </div>
                <div class="sensor-grid">
                    <div class="sensor-item">
                        <span class="sensor-label"><i class="fas fa-tint"></i> Moisture</span>
                        <span id="ov-soil-${name}" class="sensor-val val-blue">${d.soilMoisture ?? '--'}%</span>
                    </div>
                    <div class="sensor-item">
                        <span class="sensor-label"><i class="fas fa-thermometer-half"></i> Temp</span>
                        <span id="ov-temp-${name}" class="sensor-val val-red">${d.temperature ?? '--'}°C</span>
                    </div>
                    <div class="sensor-item">
                        <span class="sensor-label"><i class="fas fa-wind"></i> Humidity</span>
                        <span id="ov-hum-${name}" class="sensor-val val-cyan">${d.humidity ?? '--'}%</span>
                    </div>
                    <div class="sensor-item">
                        <span class="sensor-label"><i class="fas fa-cloud-rain"></i> Rain</span>
                        <span id="ov-rain-${name}" class="sensor-val val-teal">${d.rainNow ?? '--'}mm</span>
                    </div>
                </div>
                <div class="garden-card-footer">
                    <span class="mode-chip">${d.controlMode || 'Auto'}</span>
                    <span class="card-cta">View Details <i class="fas fa-arrow-right"></i></span>
                </div>
            </div>`;
        }).join('')}
    </div>

    <div class="forecast-section">
        <div class="section-title">
            <i class="fas fa-cloud-sun"></i>
            <span>Weather Forecast</span>
        </div>
        <div id="forecastContent" class="loading-text">
            <i class="fas fa-spinner fa-spin"></i> Loading forecast...
        </div>
    </div>
`;

// ── Garden Dashboard ───────────────────────────────────────────

export const renderGardenDashboard = (gardenName, data, isController) => {
    const isOn     = data.irrigationStatus === 'On';
    const isManual = data.controlMode === 'Manual';
    const dis      = !isController ? 'disabled' : '';
    const dimmed   = !isController ? 'btn-dimmed' : '';

    const gardenType = gardenName === 'Garden1' ? 'Open Channel' : 'Drip Irrigation';

    return `
    <div class="page-header">
        <div>
            <h2 class="page-title">${gardenName.replace('Garden','Garden ')}</h2>
            <p class="page-subtitle">${gardenType} · Real-time monitoring &amp; control</p>
        </div>
        <div class="status-pill-lg ${isOn ? 'pill-on' : 'pill-off'}">
            <span class="status-dot"></span>
            ${isOn ? 'IRRIGATING' : 'IDLE'}
        </div>
    </div>

    <div class="dash-grid-top">

        <!-- Sensor Data -->
        <div class="dash-card">
            <div class="card-header">
                <i class="fas fa-tachometer-alt icon-blue"></i>
                <h3>Live Sensor Data</h3>
            </div>
            <div class="sensor-list">
                <div class="sensor-row">
                    <span>Soil Moisture</span>
                    <span id="s-soil" class="sv val-blue">${data.soilMoisture ?? '--'}%</span>
                </div>
                <div class="sensor-row">
                    <span>Temperature</span>
                    <span id="s-temp" class="sv val-red">${data.temperature ?? '--'}°C</span>
                </div>
                <div class="sensor-row">
                    <span>Air Humidity</span>
                    <span id="s-hum" class="sv val-cyan">${data.humidity ?? '--'}%</span>
                </div>
                <div class="sensor-row">
                    <span>Rain Now</span>
                    <span id="s-rain" class="sv val-teal">${data.rainNow ?? '--'} mm</span>
                </div>
                <div class="sensor-row">
                    <span>Season</span>
                    <span id="s-season" class="sv">${data.season || '--'}</span>
                </div>
                <div class="sensor-row">
                    <span>Valve Status</span>
                    <span id="s-status" class="sv ${isOn ? 'val-green' : 'val-muted'}">${data.irrigationStatus || 'Off'}</span>
                </div>
            </div>
        </div>

        <!-- Weather -->
        <div id="weatherCard" class="dash-card">
            <div class="card-header">
                <i class="fas fa-cloud-sun icon-yellow"></i>
                <h3>Weather</h3>
            </div>
            <div class="loading-text"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
        </div>

        <!-- System Controls -->
        <div class="dash-card">
            <div class="card-header">
                <i class="fas fa-sliders-h icon-purple"></i>
                <h3>System Controls</h3>
            </div>
            ${!isController ? `
            <div class="viewer-notice">
                <i class="fas fa-eye"></i>
                View-only — controls are disabled for your account
            </div>` : ''}
            <div class="ctrl-section">
                <p class="ctrl-label">Irrigation Mode</p>
                <div class="mode-row">
                    <button id="autoModeBtn" ${dis}
                        class="mode-btn ${data.controlMode === 'Auto' ? 'mode-auto-active' : ''} ${dimmed}">
                        <i class="fas fa-robot"></i> Auto
                    </button>
                    <button id="manualModeBtn" ${dis}
                        class="mode-btn ${data.controlMode === 'Manual' ? 'mode-manual-active' : ''} ${dimmed}">
                        <i class="fas fa-hand"></i> Manual
                    </button>
                </div>
            </div>
            <div class="ctrl-section">
                <p class="ctrl-label">Manual Valve</p>
                <div class="valve-row">
                    <button id="manualOnBtn" ${!isManual || !isController ? 'disabled' : ''}
                        class="valve-btn btn-on ${!isManual || !isController ? 'btn-dimmed' : ''}">
                        <i class="fas fa-tint"></i> ON
                    </button>
                    <button id="manualOffBtn" ${!isManual || !isController ? 'disabled' : ''}
                        class="valve-btn btn-off ${!isManual || !isController ? 'btn-dimmed' : ''}">
                        <i class="fas fa-tint-slash"></i> OFF
                    </button>
                </div>
            </div>
        </div>

    </div>

    <div class="dash-grid-bottom">

        <!-- Irrigation Insights Card (replaces AI Insights) -->
        <div id="gardenInsightsCard" class="dash-card insights-preview-card">
            <div class="card-header">
                <i class="fas fa-chart-bar icon-teal"></i>
                <h3>Irrigation Insights</h3>
            </div>
            <div class="loading-text"><i class="fas fa-spinner fa-spin"></i> Calculating savings...</div>
        </div>

        <!-- History -->
        <div class="dash-card">
            <div class="card-header">
                <i class="fas fa-history icon-gray"></i>
                <h3>Irrigation History</h3>
            </div>
            <div id="historyContainer" class="history-list custom-scrollbar">
                <div class="loading-text"><i class="fas fa-spinner fa-spin"></i> Loading history...</div>
            </div>
        </div>

    </div>`;
};

// ── Garden Insights Preview Card (injected after fetch) ────────

export const renderGardenInsightsPreview = (insight, navigateToInsights) => {
    const card = document.getElementById('gardenInsightsCard');
    if (!card) return;

    if (!insight || insight.noData) {
        card.querySelector('.loading-text').outerHTML = `
            <p class="empty-text" style="text-align:center; padding: 1rem 0;">
                <i class="fas fa-database" style="font-size:1.5rem; color:var(--muted); display:block; margin-bottom:0.5rem;"></i>
                No irrigation history yet.<br>Run the system to see water savings.
            </p>
            <button class="btn-insights-nav" id="goToInsightsBtn">
                <i class="fas fa-chart-bar"></i> View Irrigation Insights
            </button>`;
    } else {
        card.querySelector('.loading-text').outerHTML = `
            <div class="insights-preview-stats">
                <div class="ip-stat">
                    <span class="ip-label">Smart Usage</span>
                    <span class="ip-val val-blue">${insight.smartWaterL.toFixed(3)} L</span>
                </div>
                <div class="ip-stat">
                    <span class="ip-label">Traditional</span>
                    <span class="ip-val val-red">${insight.traditionalWaterL.toFixed(3)} L</span>
                </div>
                <div class="ip-stat">
                    <span class="ip-label">Water Saved</span>
                    <span class="ip-val val-green">${insight.waterSavedL.toFixed(3)} L</span>
                </div>
                <div class="ip-stat ip-stat-big">
                    <span class="ip-label">Saving</span>
                    <span class="ip-val val-teal ip-big">${insight.savingPct}%</span>
                </div>
            </div>
            <div class="ip-saving-bar-wrap">
                <div class="ip-saving-bar-label">
                    <span>0%</span><span>Water Saved</span><span>100%</span>
                </div>
                <div class="ip-bar-track">
                    <div class="ip-bar-fill" style="width:${Math.min(insight.savingPct, 100)}%"></div>
                </div>
            </div>
            <button class="btn-insights-nav" id="goToInsightsBtn">
                <i class="fas fa-chart-bar"></i> View Full Irrigation Insights
            </button>`;
    }

    document.getElementById('goToInsightsBtn')?.addEventListener('click', navigateToInsights);
};

// ── Irrigation Insights Full Page ──────────────────────────────

export const renderIrrigationInsights = (allInsights, total) => {
    const noDataAtAll = !total;

    return `
    <div class="page-header">
        <div>
            <h2 class="page-title">Irrigation Insights</h2>
            <p class="page-subtitle">Water savings analysis across all garden zones</p>
        </div>
    </div>

    ${noDataAtAll ? `
    <div class="dash-card" style="text-align:center; padding:3rem;">
        <i class="fas fa-database" style="font-size:3rem; color:var(--muted); display:block; margin-bottom:1rem;"></i>
        <p style="color:var(--text-2); font-size:1rem;">No irrigation history found yet.</p>
        <p style="color:var(--text-3); font-size:0.85rem; margin-top:0.5rem;">Run the system to start seeing water savings data.</p>
    </div>` : `

    <!-- Hero Stats -->
    <div class="insights-hero-grid">
        <div class="hero-stat-card hero-teal">
            <div class="hero-icon"><i class="fas fa-tint"></i></div>
            <div class="hero-val">${total.totalSmartWaterL} L</div>
            <div class="hero-label">Total Smart Water Used</div>
        </div>
        <div class="hero-stat-card hero-red">
            <div class="hero-icon"><i class="fas fa-faucet"></i></div>
            <div class="hero-val">${total.totalTraditionalWaterL} L</div>
            <div class="hero-label">Traditional Equivalent</div>
        </div>
        <div class="hero-stat-card hero-green">
            <div class="hero-icon"><i class="fas fa-leaf"></i></div>
            <div class="hero-val">${total.totalWaterSavedL} L</div>
            <div class="hero-label">Total Water Saved</div>
        </div>
        <div class="hero-stat-card hero-gold">
            <div class="hero-icon"><i class="fas fa-percentage"></i></div>
            <div class="hero-val">${total.avgSavingPct}%</div>
            <div class="hero-label">Average Saving</div>
        </div>
    </div>

    <!-- Overall saving bar -->
    <div class="dash-card overall-bar-card">
        <div class="card-header">
            <i class="fas fa-chart-pie icon-teal"></i>
            <h3>Overall Water Saving</h3>
        </div>
        <div class="overall-bar-wrap">
            <div class="overall-bar-labels">
                <span class="obl-smart">Smart (${total.totalSmartWaterL} L)</span>
                <span class="obl-saved">Saved (${total.totalWaterSavedL} L)</span>
            </div>
            <div class="overall-bar-track">
                <div class="overall-bar-smart" style="width:${total.totalTraditionalWaterL > 0 ? (total.totalSmartWaterL / total.totalTraditionalWaterL * 100).toFixed(1) : 0}%">
                    <span>Smart</span>
                </div>
                <div class="overall-bar-saved" style="width:${total.avgSavingPct}%">
                    <span>Saved ${total.avgSavingPct}%</span>
                </div>
            </div>
        </div>
        <p class="overall-bar-note">
            <i class="fas fa-info-circle"></i>
            Based on ${total.totalCycles} irrigation cycles recorded across all gardens.
            Time saved: <strong>${total.totalTimeSavedMin} minutes</strong> of unnecessary watering avoided.
        </p>
    </div>

    <!-- Per Garden Breakdown -->
    <div class="section-title" style="margin: 1.5rem 0 1rem;">
        <i class="fas fa-seedling"></i>
        <span>Per Garden Breakdown</span>
    </div>
    <div class="garden-insights-grid">
        ${allInsights.map(ins => {
            if (!ins) return '';
            const isChannel = ins.gardenName === 'Garden1';
            const typeIcon  = isChannel ? 'fa-water' : 'fa-tint';
            const typeColor = isChannel ? 'val-blue' : 'val-cyan';
            return `
            <div class="garden-insight-card ${ins.noData ? 'gi-no-data' : ''}">
                <div class="gi-header">
                    <div class="gi-title">
                        <i class="fas fa-seedling"></i>
                        <span>${ins.gardenName.replace('Garden','Garden ')}</span>
                    </div>
                    <span class="gi-type-badge ${isChannel ? 'badge-channel' : 'badge-drip'}">
                        <i class="fas ${typeIcon}"></i> ${ins.config.type}
                    </span>
                </div>

                ${ins.noData ? `
                <p class="gi-no-data-text">No history data yet</p>` : `

                <div class="gi-stats">
                    <div class="gi-stat">
                        <span class="gi-stat-label">Smart Usage</span>
                        <span class="gi-stat-val val-blue">${ins.smartWaterL.toFixed(3)} L</span>
                    </div>
                    <div class="gi-stat">
                        <span class="gi-stat-label">Traditional</span>
                        <span class="gi-stat-val val-red">${ins.traditionalWaterL.toFixed(3)} L</span>
                    </div>
                    <div class="gi-stat">
                        <span class="gi-stat-label">Water Saved</span>
                        <span class="gi-stat-val val-green">${ins.waterSavedL.toFixed(3)} L</span>
                    </div>
                    <div class="gi-stat">
                        <span class="gi-stat-label">Time Saved</span>
                        <span class="gi-stat-val val-teal">${ins.timeSavedMin.toFixed(1)} min</span>
                    </div>
                    <div class="gi-stat">
                        <span class="gi-stat-label">Cycles</span>
                        <span class="gi-stat-val">${ins.cycles}</span>
                    </div>
                    <div class="gi-stat gi-stat-saving">
                        <span class="gi-stat-label">Saving</span>
                        <span class="gi-stat-val gi-pct">${ins.savingPct}%</span>
                    </div>
                </div>

                <!-- Mini bar -->
                <div class="gi-bar-wrap">
                    <div class="gi-bar-track">
                        <div class="gi-bar-smart" style="width:${ins.traditionalWaterL > 0 ? (ins.smartWaterL/ins.traditionalWaterL*100).toFixed(1) : 0}%" title="Smart: ${ins.smartWaterL} L"></div>
                        <div class="gi-bar-saved" style="width:${ins.savingPct}%" title="Saved: ${ins.waterSavedL} L"></div>
                    </div>
                    <div class="gi-bar-legend">
                        <span><span class="dot dot-blue"></span>Smart</span>
                        <span><span class="dot dot-green"></span>Saved</span>
                    </div>
                </div>`}

                <div class="gi-flow-info">
                    <i class="fas fa-info-circle"></i>
                    Flow rate: ${ins.config.flowRate} LPM · Traditional baseline: ${ins.config.traditionalTime} min/cycle
                </div>
            </div>`;
        }).join('')}
    </div>

    <!-- Projected Annual Savings -->
    <div class="dash-card projected-card" style="margin-top: 1.25rem;">
        <div class="card-header">
            <i class="fas fa-calendar-alt icon-yellow"></i>
            <h3>Projected Annual Savings</h3>
            <span class="projected-badge">Estimated</span>
        </div>
        <p class="projected-note">
            Based on your actual irrigation data, extrapolated over 365 days of operation.
        </p>
        <div class="projected-stats">
            <div class="projected-stat">
                <span class="ps-label">Annual Smart Usage</span>
                <span class="ps-val val-blue">${total.projectedSmartAnnual} L / year</span>
            </div>
            <div class="projected-stat">
                <span class="ps-label">Annual Traditional Usage</span>
                <span class="ps-val val-red">${total.projectedTraditionalAnnual} L / year</span>
            </div>
            <div class="projected-stat projected-highlight">
                <span class="ps-label">💧 Projected Water Saved</span>
                <span class="ps-val val-green">${total.projectedSavedAnnual} L / year</span>
            </div>
        </div>
        <p class="projected-disclaimer">
            <i class="fas fa-exclamation-triangle"></i>
            Projection assumes consistent daily usage patterns. Actual savings may vary by season.
        </p>
    </div>

    `}`;
};

// ── Weather rendering ──────────────────────────────────────────

export const renderWeatherCard = (weather, cardId = 'weatherCard') => {
    const card = document.getElementById(cardId);
    if (!card) return;
    if (weather.error) {
        const loading = card.querySelector('.loading-text');
        if (loading) {
            loading.className = 'error-text';
            loading.innerHTML = weather.error;
        }
        return;
    }
    const loading = card.querySelector('.loading-text');
    if (loading) loading.outerHTML = `
        <div class="weather-body">
            <div class="weather-main">
                <img src="https://openweathermap.org/img/wn/${weather.icon}@2x.png"
                     alt="${weather.condition}" class="weather-img">
                <div>
                    <p class="weather-condition">${weather.condition}</p>
                    <p class="weather-desc">${weather.description}</p>
                </div>
            </div>
            <div class="weather-stats">
                <div class="weather-stat">
                    <span class="ws-label">Temperature</span>
                    <span class="ws-val val-red">${weather.temperature}°C</span>
                </div>
                <div class="weather-stat">
                    <span class="ws-label">Humidity</span>
                    <span class="ws-val val-cyan">${weather.humidity}%</span>
                </div>
            </div>
        </div>`;
};

export const renderForecast = (current, forecast, containerId = 'forecastContent') => {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!current || current.error) {
        el.innerHTML = `<p class="error-text">${current?.error || 'Could not load forecast'}</p>`;
        return;
    }
    const items = [
        { time: 'Now', temp: current.temperature, icon: current.icon, now: true },
        ...(Array.isArray(forecast) ? forecast : []).map(f => ({
            time: f.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            temp: f.temp, icon: f.icon, now: false
        }))
    ];
    el.innerHTML = `<div class="forecast-strip">
        ${items.map(item => `
        <div class="forecast-tile ${item.now ? 'forecast-now' : ''}">
            <span class="fc-time">${item.time}</span>
            <img src="https://openweathermap.org/img/wn/${item.icon}@2x.png" alt="weather" class="fc-icon">
            <span class="fc-temp">${item.temp}°C</span>
        </div>`).join('')}
    </div>`;
};

// ── History rendering ──────────────────────────────────────────

export const renderHistory = (history, containerId = 'historyContainer') => {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!history) {
        el.innerHTML = `<p class="error-text">Could not load history. Firebase may be building an index — wait a moment and refresh.</p>`;
        return;
    }
    if (history.length === 0) {
        el.innerHTML = `<p class="empty-text">No irrigation events recorded yet.</p>`;
        return;
    }
    el.innerHTML = history.map(entry => {
        const ts = entry.timestamp?.toDate
            ? new Date(entry.timestamp.toDate()).toLocaleString()
            : (entry.timestamp || '—');
        const sd      = entry.sensorData || {};
        const isOnEvt = String(entry.type || '').toLowerCase().includes('on');
        return `
        <div class="history-entry">
            <div class="h-entry-top">
                <span class="h-type ${isOnEvt ? 'h-on' : 'h-off'}">${entry.type || 'Event'}</span>
                <span class="h-ts">${ts}</span>
            </div>
            <div class="h-sensors">
                <span><i class="fas fa-tint val-blue"></i> ${sd.soilMoisture ?? '--'}%</span>
                <span><i class="fas fa-thermometer-half val-red"></i> ${sd.temperature ?? '--'}°C</span>
                <span><i class="fas fa-wind val-cyan"></i> ${sd.humidity ?? '--'}%</span>
            </div>
        </div>`;
    }).join('');
};

// ── Live patch functions ───────────────────────────────────────

export const patchOverview = (gardenName, data) => {
    const s = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    s(`ov-soil-${gardenName}`, `${data.soilMoisture ?? '--'}%`);
    s(`ov-temp-${gardenName}`, `${data.temperature  ?? '--'}°C`);
    s(`ov-hum-${gardenName}`,  `${data.humidity     ?? '--'}%`);
    s(`ov-rain-${gardenName}`, `${data.rainNow      ?? '--'}mm`);
};

export const patchGardenSensors = (data, isController) => {
    const s = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    s('s-soil',   `${data.soilMoisture ?? '--'}%`);
    s('s-temp',   `${data.temperature  ?? '--'}°C`);
    s('s-hum',    `${data.humidity     ?? '--'}%`);
    s('s-rain',   `${data.rainNow      ?? '--'} mm`);
    s('s-season',  data.season || '--');

    const statusEl = document.getElementById('s-status');
    if (statusEl) {
        statusEl.textContent = data.irrigationStatus || 'Off';
        statusEl.className   = `sv ${data.irrigationStatus === 'On' ? 'val-green' : 'val-muted'}`;
    }

    if (!isController) return;

    const isManual = data.controlMode === 'Manual';
    const autoBtn  = document.getElementById('autoModeBtn');
    const manBtn   = document.getElementById('manualModeBtn');
    const onBtn    = document.getElementById('manualOnBtn');
    const offBtn   = document.getElementById('manualOffBtn');

    if (autoBtn) autoBtn.className  = `mode-btn ${data.controlMode === 'Auto'   ? 'mode-auto-active'   : ''}`;
    if (manBtn)  manBtn.className   = `mode-btn ${data.controlMode === 'Manual' ? 'mode-manual-active' : ''}`;
    if (onBtn)  { onBtn.disabled  = !isManual; onBtn.className  = `valve-btn btn-on  ${!isManual ? 'btn-dimmed' : ''}`; }
    if (offBtn) { offBtn.disabled = !isManual; offBtn.className = `valve-btn btn-off ${!isManual ? 'btn-dimmed' : ''}`; }
};
