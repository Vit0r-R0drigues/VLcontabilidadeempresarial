class CookieManager {
    constructor() {
        this.cookieConsent = localStorage.getItem('cookieConsent');
        this.banner = document.getElementById('cookieBanner');
        this.init();
    }

    init() {
        if (!this.cookieConsent) {
            setTimeout(() => {
                this.showBanner();
            }, 1000);
        }
    }

    showBanner() {
        if (this.banner) {
            this.banner.classList.add('show');
        }
    }

    hideBanner() {
        if (this.banner) {
            this.banner.classList.remove('show');
            this.banner.addEventListener('transitionend', () => {
                this.banner.style.display = 'none';
            });
        }
    }

    acceptAllCookies() {
        localStorage.setItem('cookieConsent', 'all');
        localStorage.setItem('analyticsConsent', 'true');
        localStorage.setItem('marketingConsent', 'true');
        this.hideBanner();
        this.showToast('Preferências de cookies salvas! ✨');
    }

    showCookieSettings() {
        const settings = document.createElement('div');
        settings.className = 'cookie-settings-modal';
        settings.innerHTML = `
            <div class="cookie-settings-content">
                <h3>🔐 Configurações de Cookies</h3>
                <div class="cookie-option">
                    <label>
                        <input type="checkbox" checked disabled>
                        Cookies Essenciais
                    </label>
                    <p>Necessários para o funcionamento do site</p>
                </div>
                <div class="cookie-option">
                    <label>
                        <input type="checkbox" id="analyticsConsent" 
                            ${localStorage.getItem('analyticsConsent') === 'true' ? 'checked' : ''}>
                        Cookies Analíticos
                    </label>
                    <p>Nos ajudam a melhorar sua experiência</p>
                </div>
                <div class="cookie-option">
                    <label>
                        <input type="checkbox" id="marketingConsent"
                            ${localStorage.getItem('marketingConsent') === 'true' ? 'checked' : ''}>
                        Cookies de Marketing
                    </label>
                    <p>Permitem oferecermos conteúdo relevante</p>
                </div>
                <div class="cookie-settings-buttons">
                    <button class="cookie-btn settings-btn" onclick="cookieManager.savePreferences()">Salvar Preferências</button>
                </div>
            </div>
        `;
        document.body.appendChild(settings);
    }

    savePreferences() {
        const analytics = document.getElementById('analyticsConsent').checked;
        const marketing = document.getElementById('marketingConsent').checked;

        localStorage.setItem('cookieConsent', 'custom');
        localStorage.setItem('analyticsConsent', analytics);
        localStorage.setItem('marketingConsent', marketing);

        const modal = document.querySelector('.cookie-settings-modal');
        if (modal) {
            modal.remove();
        }
        this.hideBanner();
        this.showToast('Preferências de cookies salvas! ✨');
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'cookie-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }, 100);
    }
}

// Inicializar gerenciador de cookies
const cookieManager = new CookieManager();

// Funções globais para os botões
function acceptAllCookies() {
    cookieManager.acceptAllCookies();
}

function showCookieSettings() {
    cookieManager.showCookieSettings();
} 