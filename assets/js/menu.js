class MobileMenu {
  static instance = null;

  constructor() {
    if (MobileMenu.instance) {
      return MobileMenu.instance;
    }

    this.menuBtn = document.querySelector('.menu-toggle');
    this.menuItems = document.querySelector('.menu-items');
    this.toggleMenu = this.toggleMenu.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleLinkClick = this.handleLinkClick.bind(this);

    this.init();
    MobileMenu.instance = this;
  }

  init() {
    if (!document.querySelector('.menu-mobile')) {
      this.createMenuStructure();
    }
    this.addEventListeners();
  }

  createMenuStructure() {
    const menuMobile = document.createElement('div');
    menuMobile.className = 'menu-mobile';

    // Use root-relative links to work from any subfolder, including /BLOG/posts.
    menuMobile.innerHTML = `
      <div class="menu-toggle" aria-expanded="false" aria-label="Menu mobile">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </div>
      <div class="menu-items">
        <a href="/index.html"><i class="fi fi-rr-home"></i> Início</a>
        <a href="/BLOG/blogemconstru%C3%A7%C3%A3o.html"><i class="fi fi-rr-book-alt"></i> Blog</a>
        <a href="/HTML/sobre.html"><i class="fi fi-rr-info"></i> Sobre</a>
        <a href="/HTML/servicos.html"><i class="fi fi-rr-briefcase"></i> Serviços</a>
        <a href="/HTML/ferramentas.html"><i class="fi fi-rr-apps"></i> Ferramentas</a>
        <a href="/HTML/contatos.html"><i class="fi fi-rr-phone-call"></i> Contatos</a>
      </div>
    `;

    document.body.appendChild(menuMobile);
    this.menuBtn = menuMobile.querySelector('.menu-toggle');
    this.menuItems = menuMobile.querySelector('.menu-items');
  }

  addEventListeners() {
    if (this.menuBtn && this.menuItems) {
      this.menuBtn.addEventListener('click', this.toggleMenu);
      document.addEventListener('click', this.handleDocumentClick);

      const menuLinks = this.menuItems.querySelectorAll('a');
      menuLinks.forEach((link) => {
        link.addEventListener('click', this.handleLinkClick);
      });
    }
  }

  toggleMenu(e) {
    e.stopPropagation();
    const isActive = this.menuItems.classList.toggle('active');

    this.menuBtn.style.transform = isActive ? 'rotate(90deg)' : 'rotate(0deg)';
    this.menuBtn.setAttribute('aria-expanded', isActive.toString());
    document.body.style.overflow = isActive ? 'hidden' : '';
  }

  handleDocumentClick(e) {
    if (!e.target.closest('.menu-mobile')) {
      this.menuItems.classList.remove('active');
      this.menuBtn.style.transform = 'rotate(0deg)';
      this.menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  handleLinkClick() {
    this.menuItems.classList.remove('active');
    this.menuBtn.style.transform = 'rotate(0deg)';
    this.menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  destroy() {
    if (this.menuBtn) {
      this.menuBtn.removeEventListener('click', this.toggleMenu);
    }
    document.removeEventListener('click', this.handleDocumentClick);

    if (this.menuItems) {
      const menuLinks = this.menuItems.querySelectorAll('a');
      menuLinks.forEach((link) => {
        link.removeEventListener('click', this.handleLinkClick);
      });
    }

    const menuMobile = document.querySelector('.menu-mobile');
    if (menuMobile) menuMobile.remove();
  }
}

// Gerenciamento de redimensionamento
function initMobileMenu() {
  const existingMenu = document.querySelector('.menu-mobile');

  if (window.innerWidth <= 768) {
    if (!existingMenu) {
      new MobileMenu();
    }
  } else if (existingMenu) {
    if (MobileMenu.instance) {
      MobileMenu.instance.destroy();
      MobileMenu.instance = null;
    }
  }
}

// Inicializacao controlada
let resizeTimeout;
const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    initMobileMenu();
  }, 250);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    window.addEventListener('resize', handleResize);
  });
} else {
  initMobileMenu();
  window.addEventListener('resize', handleResize);
}

// Controle do header na pagina da calculadora
if (document.querySelector('.calculadora-page')) {
  const header = document.querySelector('header');
  const calculadora = document.querySelector('.calculadora-container');

  if (header && calculadora) {
    const checkOverlap = () => {
      const headerRect = header.getBoundingClientRect();
      const calculadoraRect = calculadora.getBoundingClientRect();

      header.classList.toggle('transparent', headerRect.bottom > calculadoraRect.top);
    };

    const throttle = (func, limit) => {
      let inThrottle;
      return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => {
            inThrottle = false;
          }, limit);
        }
      };
    };

    const throttledCheck = throttle(checkOverlap, 100);
    window.addEventListener('scroll', throttledCheck);
    checkOverlap();
  }
}

// Controle de scroll do header principal
document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('header');
  if (header) {
    function throttle(fn, delay) {
      let last = 0;
      return (...args) => {
        const now = Date.now();
        if (now - last >= delay) {
          fn.apply(this, args);
          last = now;
        }
      };
    }

    window.addEventListener('scroll', throttle(() => {
      header.classList.toggle('scrolled', window.scrollY > 50);
    }, 100));
  }

  // Marcar link ativo no menu
  const currentPath = window.location.pathname.toLowerCase();
  const menuLinks = document.querySelectorAll('.menu a, .menu-items a');

  menuLinks.forEach((link) => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    const linkPage = href.split('/').pop().replace('.html', '');
    const currentPage = currentPath.split('/').pop().replace('.html', '');

    if (
      linkPage === currentPage ||
      (currentPage === '' && linkPage === 'index') ||
      (currentPage === 'index' && linkPage === 'index')
    ) {
      link.classList.add('active');
    }
  });
});
