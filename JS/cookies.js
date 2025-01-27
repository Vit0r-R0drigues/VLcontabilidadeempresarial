// Usar constantes para valores reutilizados
const COOKIE_EXPIRY_DAYS = 365;
const COOKIE_NAMES = {
    consent: 'cookieConsent',
    analytics: 'analyticsCookies',
    marketing: 'marketingCookies'
};

// Função para verificar se um cookie existe
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Função para definir um cookie
function setCookie(name, value, days) {
    try {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/`;
    } catch (error) {
        console.error('Erro ao definir cookie:', error);
    }
}

// Função para mostrar o banner de cookies
function showCookieBanner() {
    if (!getCookie('cookieConsent')) {
        const banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.innerHTML = `
            <p>Este site usa cookies para melhorar sua experiência. Ao continuar, você concorda com nossa <a href="/HTML/politica-de-privacidade.html">Política de Privacidade</a>.</p>
            <div class="cookie-buttons">
                <button class="cookie-btn settings-btn" onclick="showCookieSettings()">Configurar</button>
                <button class="cookie-btn accept-btn" onclick="acceptAllCookies()">Aceitar</button>
            </div>
        `;
        document.body.appendChild(banner);
        setTimeout(() => banner.classList.add('show'), 100);
    }
}

// Função para mostrar as configurações de cookies
function showCookieSettings() {
    const overlay = document.createElement('div');
    overlay.className = 'cookie-overlay';
    
    const settings = document.createElement('div');
    settings.className = 'cookie-settings';
    settings.innerHTML = `
        <h3>Configurações de Cookies</h3>
        <div class="cookie-option">
            <label>Cookies Essenciais (Obrigatório)</label>
            <label class="switch">
                <input type="checkbox" checked disabled>
                <span class="slider"></span>
            </label>
        </div>
        <div class="cookie-option">
            <label>Cookies de Análise</label>
            <label class="switch">
                <input type="checkbox" id="analyticsCookies" ${getCookie('analyticsCookies') === 'true' ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
        <div class="cookie-option">
            <label>Cookies de Marketing</label>
            <label class="switch">
                <input type="checkbox" id="marketingCookies" ${getCookie('marketingCookies') === 'true' ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
        <div class="cookie-buttons">
            <button class="cookie-btn settings-btn" onclick="closeCookieSettings()">Cancelar</button>
            <button class="cookie-btn accept-btn" onclick="saveSettings()">Salvar Preferências</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(settings);
    
    setTimeout(() => {
        overlay.classList.add('show');
        settings.classList.add('show');
    }, 100);
}

// Função para fechar as configurações de cookies
function closeCookieSettings() {
    const overlay = document.querySelector('.cookie-overlay');
    const settings = document.querySelector('.cookie-settings');
    
    overlay.classList.remove('show');
    settings.classList.remove('show');
    
    setTimeout(() => {
        overlay.remove();
        settings.remove();
    }, 500);
}

// Função para aceitar todos os cookies
function acceptAllCookies() {
    setCookie('cookieConsent', 'true', 365);
    setCookie('analyticsCookies', 'true', 365);
    setCookie('marketingCookies', 'true', 365);
    
    const banner = document.querySelector('.cookie-banner');
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 500);
}

// Função para salvar as configurações de cookies
function saveSettings() {
    const analyticsCookies = document.getElementById('analyticsCookies').checked;
    const marketingCookies = document.getElementById('marketingCookies').checked;
    
    setCookie('cookieConsent', 'true', 365);
    setCookie('analyticsCookies', analyticsCookies, 365);
    setCookie('marketingCookies', marketingCookies, 365);
    
    closeCookieSettings();
    
    const banner = document.querySelector('.cookie-banner');
    if (banner) {
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 500);
    }
}

// Inicializar o banner de cookies quando a página carregar
document.addEventListener('DOMContentLoaded', showCookieBanner); 