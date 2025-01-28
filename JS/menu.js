class MobileMenu {
  constructor() {
    this.menuBtn = null;
    this.menuItems = null;
    this.init();
  }

  init() {
    if (!document.querySelector('.menu-mobile')) {
      this.createMenuStructure();
    }
    this.cacheElements();
    this.addEventListeners();
  }

  createMenuStructure() {
    const menuMobile = document.createElement('div');
    menuMobile.className = 'menu-mobile';

    const path = window.location.pathname;
    const isSubfolder = path.includes('HTML') || path.includes('html');
    const basePath = isSubfolder ? '../' : '';

    menuMobile.innerHTML = `
      <div class="menu-toggle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </div>
      <div class="menu-items">
        <a href="${basePath}index.html"><i class="fi fi-rr-home"></i> Início</a>
        <a href="${basePath}HTML/sobre.html"><i class="fi fi-rr-info"></i> Sobre</a>
        <a href="${basePath}HTML/servicos.html"><i class="fi fi-rr-briefcase"></i> Serviços</a>
        <a href="${basePath}HTML/ferramentas.html"><i class="fi fi-rr-apps"></i> Ferramentas</a>
        <a href="${basePath}HTML/contatos.html"><i class="fi fi-rr-phone-call"></i> Contatos</a>
      </div>
    `;

    document.body.appendChild(menuMobile);
  }

  cacheElements() {
    this.menuBtn = document.querySelector('.menu-toggle');
    this.menuItems = document.querySelector('.menu-items');
  }

  addEventListeners() {
    if (this.menuBtn && this.menuItems) {
      this.menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.menuItems.classList.toggle('active');
        this.menuBtn.classList.toggle('rotated');
        document.body.style.overflow = this.menuItems.classList.contains('active') ? 'hidden' : '';
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-mobile')) {
          this.menuItems.classList.remove('active');
          this.menuBtn.classList.remove('rotated');
          document.body.style.overflow = '';
        }
      });

      const menuLinks = this.menuItems.querySelectorAll('a');
      menuLinks.forEach((link) => {
        link.addEventListener('click', () => {
          this.menuItems.classList.remove('active');
          this.menuBtn.classList.remove('rotated');
          document.body.style.overflow = '';
        });
      });
    }
  }
}

function initMobileMenu() {
  if (window.innerWidth <= 768) {
    if (!document.querySelector('.menu-mobile')) {
      new MobileMenu();
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
  initMobileMenu();
}

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(initMobileMenu, 250);
});

