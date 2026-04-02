class MobileMenu {
    static instance = null;

    constructor() {
        if (MobileMenu.instance) {
            return MobileMenu.instance;
        }

        this.header = document.querySelector('header, .site-header');
        this.menuBtn = document.getElementById('btn-mobile');
        this.navMenu = document.querySelector('header nav, .site-header nav');

        if (!this.header || !this.navMenu) {
            return;
        }

        if (!this.menuBtn) {
            this.createMenuButton();
        }

        this.toggleMenu = this.toggleMenu.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        this.handleLinkClick = this.handleLinkClick.bind(this);
        this.handleEscape = this.handleEscape.bind(this);

        this.init();
        MobileMenu.instance = this;
    }

    createMenuButton() {
        const menuMobile = document.createElement('div');
        menuMobile.className = 'menu-mobile';
        menuMobile.innerHTML = `
            <button class="menu-toggle" aria-label="Abrir menu" aria-expanded="false" id="btn-mobile">
                <span class="menu-toggle-glyph" aria-hidden="true">&#9776;</span>
            </button>
        `;

        this.header.appendChild(menuMobile);
        this.menuBtn = menuMobile.querySelector('#btn-mobile');
    }

    init() {
        if (!this.menuBtn) {
            return;
        }

        this.setButtonGlyph(false);
        this.menuBtn.addEventListener('click', this.toggleMenu);
        document.addEventListener('click', this.handleDocumentClick);
        document.addEventListener('keydown', this.handleEscape);

        this.navMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', this.handleLinkClick);
        });
    }

    toggleMenu(event) {
        if (event) {
            event.stopPropagation();
        }

        const isActive = this.navMenu.classList.toggle('active');
        this.menuBtn.classList.toggle('active', isActive);

        this.setButtonGlyph(isActive);

        this.menuBtn.setAttribute('aria-expanded', String(isActive));
        document.body.style.overflow = isActive ? 'hidden' : '';
    }

    closeMenu() {
        if (!this.navMenu.classList.contains('active')) {
            return;
        }

        this.navMenu.classList.remove('active');
        this.menuBtn?.classList.remove('active');
        this.setButtonGlyph(false);
        this.menuBtn?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    setButtonGlyph(isActive) {
        if (!this.menuBtn) {
            return;
        }

        let glyph = this.menuBtn.querySelector('.menu-toggle-glyph');
        if (!glyph) {
            glyph = document.createElement('span');
            glyph.className = 'menu-toggle-glyph';
            glyph.setAttribute('aria-hidden', 'true');
            this.menuBtn.innerHTML = '';
            this.menuBtn.appendChild(glyph);
        }

        glyph.innerHTML = isActive ? '&times;' : '&#9776;';
    }

    handleDocumentClick(event) {
        if (!this.navMenu.classList.contains('active')) {
            return;
        }

        const clickedInsideMenu = event.target.closest('nav');
        const clickedToggle = event.target.closest('.menu-mobile');

        if (!clickedInsideMenu && !clickedToggle) {
            this.closeMenu();
        }
    }

    handleLinkClick() {
        this.closeMenu();
    }

    handleEscape(event) {
        if (event.key === 'Escape') {
            this.closeMenu();
        }
    }

    destroy() {
        this.closeMenu();

        if (this.menuBtn) {
            this.menuBtn.removeEventListener('click', this.toggleMenu);
        }

        document.removeEventListener('click', this.handleDocumentClick);
        document.removeEventListener('keydown', this.handleEscape);

        this.navMenu?.querySelectorAll('a').forEach((link) => {
            link.removeEventListener('click', this.handleLinkClick);
        });

        MobileMenu.instance = null;
    }
}

function initMobileMenu() {
    if (window.innerWidth <= 768) {
        if (!MobileMenu.instance) {
            new MobileMenu();
        }
    } else if (MobileMenu.instance) {
        MobileMenu.instance.destroy();
    }
}

function setLogoLink() {
    const logoLink = document.querySelector('header .logo a, .site-header .brand');
    if (logoLink) {
        logoLink.setAttribute('href', '/index.html');
    }
}

function markActiveLinks() {
    const currentPage = document.body.dataset.page;
    const menuLinks = document.querySelectorAll('.menu a[data-nav], .header-nav a[data-nav]');

    menuLinks.forEach((link) => {
        const linkPage = link.dataset.nav || '';
        const isActive = currentPage ? currentPage === linkPage : false;
        link.classList.toggle('active', isActive);
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

function enhanceExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
        const relValues = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
        relValues.add('noopener');
        relValues.add('noreferrer');
        link.setAttribute('rel', Array.from(relValues).join(' '));
    });
}

function initHeaderScroll() {
    const header = document.querySelector('header');

    if (!header) {
        return;
    }

    const onScroll = () => {
        header.classList.toggle('scrolled', window.scrollY > 40);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

function initCalculatorHeader() {
    if (!document.querySelector('.calculadora-page')) {
        return;
    }

    const header = document.querySelector('header');
    const calculadora = document.querySelector('.calculadora-container');

    if (!header || !calculadora) {
        return;
    }

    const updateOverlap = () => {
        const headerRect = header.getBoundingClientRect();
        const calcRect = calculadora.getBoundingClientRect();
        header.classList.toggle('transparent', headerRect.bottom > calcRect.top);
    };

    window.addEventListener('scroll', updateOverlap, { passive: true });
    window.addEventListener('resize', updateOverlap);
    updateOverlap();
}

let resizeTimeout = null;

window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(initMobileMenu, 180);
});

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    setLogoLink();
    markActiveLinks();
    enhanceExternalLinks();
    initHeaderScroll();
    initCalculatorHeader();
});
