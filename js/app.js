// ================================================================
//  app.js — Main entry point, wires all modules together
// ================================================================
import { onAuthChange, checkRole, signInWithGoogle, signOutUser } from './auth.js';
import { loadProfile, saveProfile, subscribeGarden, subscribeHistory, setControlMode, setManualControl, fetchGardenHistory } from './firebase.js';
import { fetchWeather, fetchForecast, fetchAIRecommendation } from './api.js';
import {
    renderOverview, renderGardenDashboard, renderGardenInsightsPreview,
    renderIrrigationInsights, renderWeatherCard, renderForecast,
    renderHistory, patchOverview, patchGardenSensors
} from './ui.js';
import { calculateGardenInsights, calculateTotalInsights } from './insights.js';
import { initAssistant, updateAssistantContext } from './assistant.js';
import { renderAnalyticsPage } from './analytics.js';
import { renderIntelligencePage } from './intelligence.js';
import { GARDEN_NAMES } from './config.js';

// ── App State ─────────────────────────────────────────────────
let currentView    = 'overview';
let profileData    = { name: '', city: '', email: '', phone: '', avatar: '' };
let sensorData     = {};
let isController   = false;
let currentUid     = null;
let weatherCache   = null;
let gardenUnsubs   = [];
let historyUnsub   = null;
let gardenInsights = {}; // cached per garden { Garden1: insightObj, ... }

// ── DOM helpers ───────────────────────────────────────────────
const $   = id  => document.getElementById(id);
const qs  = sel => document.querySelector(sel);
const qsa = sel => document.querySelectorAll(sel);

// ── Element refs ──────────────────────────────────────────────
const loginScreen  = $('loginScreen');
const mainApp      = $('mainApp');
const viewerBanner = $('viewerBanner');
const mainContent  = $('mainContent');
const profileModal = $('profileModal');

// ── Auth ──────────────────────────────────────────────────────
$('googleSignInBtn').addEventListener('click', signInWithGoogle);
$('signOutBtn').addEventListener('click', signOutUser);

onAuthChange(async (user) => {
    if (user) {
        currentUid   = user.uid;
        const role   = await checkRole(user.email);
        isController = (role === 'controller');

        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        viewerBanner.classList.toggle('hidden', isController);

        const badge = $('roleBadge');
        if (badge) {
            badge.textContent = isController ? '🎛️ Controller' : '👁️ Viewer';
            badge.className   = `role-badge ${isController ? 'badge-ctrl' : 'badge-view'}`;
        }

        profileData = await loadProfile(user);
        syncSidebarProfile();
        if (!document.getElementById('aiAssistantWidget')) initAssistant();
        startGardenListeners();
        renderView();

    } else {
        currentUid     = null;
        sensorData     = {};
        gardenInsights = {};
        stopAllListeners();
        mainApp.classList.add('hidden');
        viewerBanner.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    }
});

// ── Garden Firestore listeners ────────────────────────────────
const startGardenListeners = () => {
    stopAllListeners();
    GARDEN_NAMES.forEach(name => {
        const unsub = subscribeGarden(name, (data) => {
            sensorData[name] = data;
            handleSensorUpdate(name, data);
        });
        gardenUnsubs.push(unsub);
    });
};

const stopAllListeners = () => {
    gardenUnsubs.forEach(fn => fn());
    gardenUnsubs = [];
    stopHistoryListener();
};

const stopHistoryListener = () => {
    if (historyUnsub) { historyUnsub(); historyUnsub = null; }
};

const handleSensorUpdate = (gardenName, data) => {
    if (currentView === 'overview') {
        patchOverview(gardenName, data);
    } else if (currentView === gardenName) {
        patchGardenSensors(data, isController);
    }
    updateAssistantContext(currentView, sensorData);
};

// ── Navigation ────────────────────────────────────────────────
$('overviewLink').addEventListener('click',  e => { e.preventDefault(); navigate('overview'); });
$('insightsLink').addEventListener('click',  e => { e.preventDefault(); navigate('insights'); });
$('analyticsLink').addEventListener('click',      e => { e.preventDefault(); navigate('analytics'); });
$('intelligenceLink').addEventListener('click',   e => { e.preventDefault(); navigate('intelligence'); });
qsa('.garden-link').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); navigate(link.dataset.garden); });
});

const navigate = (view) => {
    currentView = view;
    renderView();
};

const renderView = () => {
    stopHistoryListener();

    // Highlight active nav
    qsa('.nav-link').forEach(l => l.classList.remove('active'));
    if (currentView === 'overview') {
        $('overviewLink')?.classList.add('active');
    } else if (currentView === 'insights') {
        $('insightsLink')?.classList.add('active');
    } else if (currentView === 'analytics') {
        $('analyticsLink')?.classList.add('active');
    } else if (currentView === 'intelligence') {
        $('intelligenceLink')?.classList.add('active');
    } else {
        qs(`.garden-link[data-garden="${currentView}"]`)?.classList.add('active');
    }

    // Keep assistant context in sync when navigating
    updateAssistantContext(currentView, sensorData);

    if (currentView === 'overview') {
        mainContent.innerHTML = renderOverview(sensorData);
        qsa('[data-garden]').forEach(card => {
            card.addEventListener('click', () => navigate(card.dataset.garden));
        });
        if (profileData.city) {
            Promise.all([
                fetchWeather(profileData.city),
                fetchForecast(profileData.city)
            ]).then(([current, forecast]) => {
                weatherCache = current;
                renderForecast(current, forecast, 'forecastContent');
            });
        }

    } else if (currentView === 'insights') {
        // Show loading state first
        mainContent.innerHTML = `
            <div class="page-header">
                <div>
                    <h2 class="page-title">Irrigation Insights</h2>
                    <p class="page-subtitle">Water savings analysis across all garden zones</p>
                </div>
            </div>
            <div class="dash-card" style="text-align:center; padding:3rem;">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem; color:var(--accent);"></i>
                <p style="color:var(--text-2); margin-top:1rem;">Fetching irrigation history...</p>
            </div>`;

        // Fetch all histories and compute insights
        Promise.all(GARDEN_NAMES.map(name => fetchGardenHistory(name)))
            .then(histories => {
                const allInsights = histories.map((h, i) =>
                    calculateGardenInsights(GARDEN_NAMES[i], h)
                );
                // Cache them
                allInsights.forEach((ins, i) => {
                    if (ins) gardenInsights[GARDEN_NAMES[i]] = ins;
                });
                const total = calculateTotalInsights(allInsights);
                mainContent.innerHTML = renderIrrigationInsights(allInsights, total);
            })
            .catch(err => {
                mainContent.innerHTML = `
                    <div class="page-header"><h2 class="page-title">Irrigation Insights</h2></div>
                    <div class="dash-card" style="text-align:center; padding:2rem;">
                        <p class="error-text">Failed to load insights: ${err.message}</p>
                    </div>`;
            });

    } else if (currentView === 'analytics') {
        renderAnalyticsPage(mainContent);

    } else if (currentView === 'intelligence') {
        renderIntelligencePage(mainContent);

    } else {
        const data = sensorData[currentView] || {};
        mainContent.innerHTML = renderGardenDashboard(currentView, data, isController);
        bindGardenControls(currentView);
        loadWeatherForGarden();

        // Load insights for this garden (use cache if available)
        if (gardenInsights[currentView]) {
            renderGardenInsightsPreview(gardenInsights[currentView], () => navigate('insights'));
        } else {
            fetchGardenHistory(currentView).then(history => {
                const insight = calculateGardenInsights(currentView, history);
                gardenInsights[currentView] = insight;
                renderGardenInsightsPreview(insight, () => navigate('insights'));
            });
        }
    }
};

// ── Garden dashboard control bindings ─────────────────────────
const bindGardenControls = (gardenName) => {
    historyUnsub = subscribeHistory(gardenName, (entries) => {
        renderHistory(entries, 'historyContainer');
    });

    if (!isController) return;

    $('autoModeBtn')?.addEventListener('click',   () => setControlMode(gardenName, 'Auto'));
    $('manualModeBtn')?.addEventListener('click',  () => setControlMode(gardenName, 'Manual'));
    $('manualOnBtn')?.addEventListener('click',    () => setManualControl(gardenName, true));
    $('manualOffBtn')?.addEventListener('click',   () => setManualControl(gardenName, false));
};

const loadWeatherForGarden = () => {
    if (!profileData.city) return;
    if (weatherCache) { renderWeatherCard(weatherCache); return; }
    fetchWeather(profileData.city).then(w => {
        weatherCache = w;
        renderWeatherCard(w);
    });
};

// ── Profile Modal ─────────────────────────────────────────────
$('profileTrigger').addEventListener('click',  openModal);
$('closeModalBtn').addEventListener('click',   closeModal);
$('cancelModalBtn').addEventListener('click',  closeModal);
$('modalBackdrop').addEventListener('click',   closeModal);
$('saveProfileBtn').addEventListener('click',  handleSaveProfile);

$('avatarUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        $('modalAvatarPreview').src = ev.target.result;
        profileData.avatar = ev.target.result;
    };
    reader.readAsDataURL(file);
});

function openModal() {
    $('profileName').value  = profileData.name  || '';
    $('profileCity').value  = profileData.city  || '';
    $('profileEmail').value = profileData.email || '';
    $('profilePhone').value = profileData.phone || '';
    $('modalAvatarPreview').src = profileData.avatar || 'https://placehold.co/100x100/0e1c2a/00d4b4?text=U';
    profileModal.classList.remove('hidden');
}

function closeModal() {
    profileModal.classList.add('hidden');
}

async function handleSaveProfile() {
    if (!currentUid) return;
    const oldCity      = profileData.city;
    profileData.name   = $('profileName').value;
    profileData.city   = $('profileCity').value;
    profileData.email  = $('profileEmail').value;
    profileData.phone  = $('profilePhone').value;
    if (oldCity !== profileData.city) weatherCache = null;
    await saveProfile(currentUid, profileData);
    syncSidebarProfile();
    closeModal();
}

const syncSidebarProfile = () => {
    $('userName').textContent = profileData.name || 'User';
    $('userCity').textContent = profileData.city || 'Set your city';
    if (profileData.avatar) $('userAvatar').src = profileData.avatar;
};
