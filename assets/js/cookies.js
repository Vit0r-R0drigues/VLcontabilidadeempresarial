// Configuracao de cookies
const COOKIE_CONFIG = {
    expiryDays: 365,
    names: {
        consent: 'vlcont_cookie_consent',
        analytics: 'vlcont_analytics_cookies',
        marketing: 'vlcont_marketing_cookies'
    }
};

function getCookie(name) {
    const prefix = `${name}=`;
    const parts = document.cookie.split(';');
    for (const rawPart of parts) {
        const part = rawPart.trim();
        if (part.startsWith(prefix)) {
            return decodeURIComponent(part.substring(prefix.length));
        }
    }
    return null;
}

function setCookie(name, value, days = COOKIE_CONFIG.expiryDays) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

function hideCookieBanner() {
    const banner = document.querySelector('.cookie-banner');
    if (!banner) return;
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 300);
}

function closeCookieSettings() {
    const overlay = document.querySelector('.cookie-overlay');
    const settings = document.querySelector('.cookie-settings');

    if (overlay) overlay.classList.remove('show');
    if (settings) settings.classList.remove('show');

    setTimeout(() => {
        if (overlay) overlay.remove();
        if (settings) settings.remove();
    }, 300);
}

function showCookieBanner() {
    if (getCookie(COOKIE_CONFIG.names.consent) === 'true') return;
    if (document.querySelector('.cookie-banner')) return;

    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
        <div class="cookie-content">
            <p>
                Utilizamos cookies para melhorar sua experiencia.
                Leia nossa <a href="/HTML/politica-de-privacidade.html" target="_blank" rel="noopener noreferrer">Politica de Privacidade</a>.
            </p>
            <div class="cookie-buttons">
                <button type="button" class="cookie-btn settings-btn" onclick="showCookieSettings()">Configurar Preferencias</button>
                <button type="button" class="cookie-btn accept-btn" onclick="acceptAllCookies()">Aceitar Todos</button>
            </div>
        </div>
    `;

    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('show'));
}

function showCookieSettings() {
    if (document.querySelector('.cookie-overlay') || document.querySelector('.cookie-settings')) return;

    const analyticsChecked = getCookie(COOKIE_CONFIG.names.analytics) === 'true';
    const marketingChecked = getCookie(COOKIE_CONFIG.names.marketing) === 'true';

    const overlay = document.createElement('div');
    overlay.className = 'cookie-overlay';

    const settings = document.createElement('div');
    settings.className = 'cookie-settings';
    settings.innerHTML = `
        <h3>Preferencias de Cookies</h3>
        <p class="cookie-description">Escolha quais cookies deseja permitir.</p>
        <div class="cookie-option">
            <div class="cookie-option-text">
                <label>Cookies Essenciais</label>
                <p>Necessarios para o funcionamento do site. Nao podem ser desativados.</p>
            </div>
            <label class="switch">
                <input type="checkbox" checked disabled>
                <span class="slider"></span>
            </label>
        </div>
        <div class="cookie-option">
            <div class="cookie-option-text">
                <label>Cookies Analiticos</label>
                <p>Ajudam a medir desempenho e melhorar a experiencia.</p>
            </div>
            <label class="switch">
                <input type="checkbox" id="analyticsCookies" ${analyticsChecked ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
        <div class="cookie-option">
            <div class="cookie-option-text">
                <label>Cookies de Marketing</label>
                <p>Usados para personalizacao de campanhas.</p>
            </div>
            <label class="switch">
                <input type="checkbox" id="marketingCookies" ${marketingChecked ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
        <div class="cookie-buttons">
            <button type="button" class="cookie-btn settings-btn" onclick="closeCookieSettings()">Cancelar</button>
            <button type="button" class="cookie-btn accept-btn" onclick="saveSettings()">Salvar Preferencias</button>
        </div>
    `;

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeCookieSettings();
        }
    });

    document.body.appendChild(overlay);
    document.body.appendChild(settings);

    requestAnimationFrame(() => {
        overlay.classList.add('show');
        settings.classList.add('show');
    });
}

function acceptAllCookies() {
    setCookie(COOKIE_CONFIG.names.consent, 'true');
    setCookie(COOKIE_CONFIG.names.analytics, 'true');
    setCookie(COOKIE_CONFIG.names.marketing, 'true');
    closeCookieSettings();
    hideCookieBanner();
    initializeServices();
}

function saveSettings() {
    const analyticsEnabled = document.getElementById('analyticsCookies')?.checked ?? false;
    const marketingEnabled = document.getElementById('marketingCookies')?.checked ?? false;

    setCookie(COOKIE_CONFIG.names.consent, 'true');
    setCookie(COOKIE_CONFIG.names.analytics, String(analyticsEnabled));
    setCookie(COOKIE_CONFIG.names.marketing, String(marketingEnabled));

    closeCookieSettings();
    hideCookieBanner();
    initializeServices();
}

function initializeAnalytics() {
    // Placeholder para inicializacao de analytics.
}

function initializeMarketing() {
    // Placeholder para inicializacao de marketing/pixels.
}

function initializeServices() {
    const analyticsEnabled = getCookie(COOKIE_CONFIG.names.analytics) === 'true';
    const marketingEnabled = getCookie(COOKIE_CONFIG.names.marketing) === 'true';

    if (analyticsEnabled) initializeAnalytics();
    if (marketingEnabled) initializeMarketing();
}

document.addEventListener('DOMContentLoaded', () => {
    showCookieBanner();
    if (getCookie(COOKIE_CONFIG.names.consent) === 'true') {
        initializeServices();
    }
});
