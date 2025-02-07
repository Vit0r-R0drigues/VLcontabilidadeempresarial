// Configurações de cookies
const COOKIE_CONFIG = {
    expiry: 365, // dias
    names: {
        consent: 'vlcont_cookie_consent',
        analytics: 'vlcont_analytics_cookies',
        marketing: 'vlcont_marketing_cookies'
    },
    domain: window.location.hostname
};

// Função para obter um cookie
function getCookie(name) {
    try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return decodeURIComponent(parts.pop().split(';').shift());
        }
        return null;
    } catch (error) {
        console.error('Erro ao obter cookie:', error);
        return null;
    }
}

// Função para definir um cookie
function setCookie(name, value, days) {
    try {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        const sameSite = 'SameSite=Lax';
        const secure = location.protocol === 'https:' ? 'Secure' : '';
        document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;${sameSite};${secure}`;
    } catch (error) {
        console.error('Erro ao definir cookie:', error);
    }
}

// Função para deletar um cookie
function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

// Função para mostrar o banner de cookies
function showCookieBanner() {
    if (!getCookie(COOKIE_CONFIG.names.consent)) {
        const banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.innerHTML = `
            <div class="cookie-content">
                <p>Utilizamos cookies para melhorar sua experiência em nosso site. Ao continuar navegando, você concorda com nossa 
                   <a href="/HTML/politica-de-privacidade.html" target="_blank">Política de Privacidade</a>.</p>
                <div class="cookie-buttons">
                    <button class="cookie-btn settings-btn" onclick="showCookieSettings()">Configurar Preferências</button>
                    <button class="cookie-btn accept-btn" onclick="acceptAllCookies()">Aceitar Todos</button>
                </div>
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
        <h3>Preferências de Cookies</h3>
        <p class="cookie-description">Personalize suas preferências de cookies para melhor atender às suas necessidades.</p>
        
        <div class="cookie-option">
            <div class="cookie-option-text">
                <label>Cookies Essenciais</label>
                <p>Necessários para o funcionamento básico do site. Não podem ser desativados.</p>
            </div>
            <label class="switch">
                <input type="checkbox" checked disabled>
                <span class="slider"></span>
            </label>
        </div>

        <div class="cookie-option">
            <div class="cookie-option-text">
                <label>Cookies Analíticos</label>
                <p>Nos ajudam a entender como você usa o site, melhorando a experiência.</p>
            </div>
            <label class="switch">
                <input type="checkbox" id="analyticsCookies" ${getCookie(COOKIE_CONFIG.names.analytics) === 'true' ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>

        <div class="cookie-option">
            <div class="cookie-option-text">
                <label>Cookies de Marketing</label>
                <p>Usados para personalizar anúncios e conteúdo relevante.</p>
            </div>
            <label class="switch">
                <input type="checkbox" id="marketingCookies" ${getCookie(COOKIE_CONFIG.names.marketing) === 'true' ? 'checked' : ''}>
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

    // Fechar ao clicar fora
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeCookieSettings();
        }
    });
}

// Função para fechar as configurações de cookies
function closeCookieSettings() {
    const overlay = document.querySelector('.cookie-overlay');
    const settings = document.querySelector('.cookie-settings');
    
    if (overlay && settings) {
        overlay.classList.remove('show');
        settings.classList.remove('show');
        
        setTimeout(() => {
            overlay.remove();
            settings.remove();
        }, 500);
    }
}

// Função para aceitar todos os cookies
function acceptAllCookies() {
    setCookie(COOKIE_CONFIG.names.consent, 'true', COOKIE_CONFIG.expiry);
    setCookie(COOKIE_CONFIG.names.analytics, 'true', COOKIE_CONFIG.expiry);
    setCookie(COOKIE_CONFIG.names.marketing, 'true', COOKIE_CONFIG.expiry);
    
    const banner = document.querySelector('.cookie-banner');
    if (banner) {
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 500);
    }

    // Inicializar serviços após aceitação
    initializeServices();
}

// Função para salvar as configurações de cookies
function saveSettings() {
    const analyticsCookies = document.getElementById('analyticsCookies')?.checked || false;
    const marketingCookies = document.getElementById('marketingCookies')?.checked || false;
    
    setCookie(COOKIE_CONFIG.names.consent, 'true', COOKIE_CONFIG.expiry);
    setCookie(COOKIE_CONFIG.names.analytics, analyticsCookies, COOKIE_CONFIG.expiry);
    setCookie(COOKIE_CONFIG.names.marketing, marketingCookies, COOKIE_CONFIG.expiry);
    
    closeCookieSettings();
    
    const banner = document.querySelector('.cookie-banner');
    if (banner) {
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 500);
    }

    // Inicializar serviços com base nas preferências
    initializeServices();
}

// Função para inicializar serviços com base nas preferências de cookies
function initializeServices() {
    const analyticsEnabled = getCookie(COOKIE_CONFIG.names.analytics) === 'true';
    const marketingEnabled = getCookie(COOKIE_CONFIG.names.marketing) === 'true';

    if (analyticsEnabled) {
        // Inicializar serviços analíticos (exemplo: Google Analytics)
        initializeAnalytics();
    }

    if (marketingEnabled) {
        // Inicializar serviços de marketing (exemplo: pixels de remarketing)
        initializeMarketing();
    }
}

// Função para inicializar analytics
function initializeAnalytics() {
    // Implementar inicialização do Google Analytics ou similar
    console.log('Serviços analíticos inicializados');
}

// Função para inicializar marketing
function initializeMarketing() {
    // Implementar inicialização de pixels de marketing
    console.log('Serviços de marketing inicializados');
}

// Inicializar banner de cookies quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    showCookieBanner();
    
    // Se já houver consentimento, inicializar serviços
    if (getCookie(COOKIE_CONFIG.names.consent) === 'true') {
        initializeServices();
    }
});