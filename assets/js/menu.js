class MobileMenu {
  static instance = null;

  constructor() {
    if (MobileMenu.instance) {
      return MobileMenu.instance;
    }

    this.menuBtn = document.getElementById('btn-mobile');
    this.navMenu = document.querySelector('header nav, .site-header nav, .header-nav');

    // Se o botao de mobile nao existe no HTML (paginas secundarias), cria ele.
    const header = document.querySelector('header, .site-header');
    if (!this.menuBtn && header) {
      this.createMenuButton(header);
    }

    this.toggleMenu = this.toggleMenu.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleLinkClick = this.handleLinkClick.bind(this);

    this.init();
    MobileMenu.instance = this;
  }

  createMenuButton(parent) {
    const menuMobileDiv = document.createElement('div');
    menuMobileDiv.className = 'menu-mobile';
    menuMobileDiv.innerHTML = `
      <button class="menu-toggle" aria-label="Abrir menu" id="btn-mobile">
        <i class="fi fi-rr-menu-burger"></i>
      </button>
    `;
    parent.appendChild(menuMobileDiv);
    this.menuBtn = menuMobileDiv.querySelector('#btn-mobile');
  }

  init() {
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
        <a href="/index.html"><i class="fi fi-rr-home"></i> InÃ­cio</a>
        <a href="/landingpages/irrf2026.html"><i class="fi fi-rr-book-alt"></i> IRRF 2026</a>
        <a href="/HTML/sobre.html"><i class="fi fi-rr-info"></i> Sobre</a>
        <a href="/HTML/servicos.html"><i class="fi fi-rr-briefcase"></i> ServiÃ§os</a>
        <a href="/HTML/ferramentas.html"><i class="fi fi-rr-apps"></i> Ferramentas</a>
        <a href="/HTML/contatos.html"><i class="fi fi-rr-phone-call"></i> Contatos</a>
      </div>
    `;

    document.body.appendChild(menuMobile);
    this.menuBtn = menuMobile.querySelector('.menu-toggle');
    this.menuItems = menuMobile.querySelector('.menu-items');
  }

  addEventListeners() {
    if (this.menuBtn && this.navMenu) {
      this.menuBtn.addEventListener('click', this.toggleMenu);
      document.addEventListener('click', this.handleDocumentClick);

      // Use navMenu (the existing HTML nav ul) instead of this.menuItems
      // which is only populated by createMenuStructure() â€” a path never taken.
      const menuLinks = this.navMenu.querySelectorAll('a');
      menuLinks.forEach((link) => {
        link.addEventListener('click', this.handleLinkClick);
      });
    }
  }

  toggleMenu(e) {
    e.stopPropagation();
    const isActive = this.navMenu.classList.toggle('active');
    this.menuBtn.classList.toggle('active');

    const icon = this.menuBtn.querySelector('i');
    if (isActive) {
      icon.className = 'fi fi-rr-cross';
      this.navMenu.style.display = 'flex';
      // Pequeno delay para permitir a transiÃ§Ã£o de opacidade/transform
      setTimeout(() => {
        this.navMenu.style.opacity = '1';
        this.navMenu.style.transform = 'translateY(0)';
      }, 10);
    } else {
      icon.className = 'fi fi-rr-menu-burger';
      this.navMenu.style.opacity = '0';
      this.navMenu.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        this.navMenu.style.display = 'none';
      }, 300);
    }
    
    this.menuBtn.setAttribute('aria-expanded', isActive.toString());
    document.body.style.overflow = isActive ? 'hidden' : '';
  }

  handleDocumentClick(e) {
    if (!e.target.closest('.menu-mobile') && !e.target.closest('nav') && this.navMenu.classList.contains('active')) {
      this.toggleMenu(e);
    }
  }

  handleLinkClick() {
    if (this.navMenu.classList.contains('active')) {
      const e = { stopPropagation: () => {} };
      this.toggleMenu(e);
    }
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
  if (window.innerWidth <= 768) {
    if (!MobileMenu.instance) {
      new MobileMenu();
    }
  } else {
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

    // Logo click fix: se a logo nao tem link ou o link esta errado em subpaginas.
    const logo = header.querySelector('.logo, .brand');
    if (logo) {
      const path = window.location.pathname.toLowerCase();
      let prefix = '';
      
      if (path.includes('/blog/posts/')) {
        prefix = '../../';
      } else if (path.includes('/blog/') || path.includes('/html/')) {
        prefix = '../';
      }

      let logoLink = logo.querySelector('a') || (logo.tagName === 'A' ? logo : null);
      
      if (!logoLink && logo.classList.contains('logo')) {
        const img = logo.querySelector('img');
        if (img) {
          const a = document.createElement('a');
          a.href = prefix + 'index.html';
          img.parentNode.insertBefore(a, img);
          a.appendChild(img);
        }
      } else if (logoLink) {
        // Se ja existe, garante que aponta para o lugar certo
        logoLink.href = prefix + 'index.html';
      }
    }
  }

  function getExternalLabel(href) {
    if (!href) return '';
    const normalizedHref = href.toLowerCase();

    if (normalizedHref.includes('instagram.com/vitor_rodri_cont')) return 'Instagram de Vitor Rodrigues';
    if (normalizedHref.includes('instagram.com')) return 'Instagram da VL Contabilidade Empresarial';
    if (normalizedHref.includes('wa.me/')) return 'WhatsApp da VL Contabilidade Empresarial';
    if (normalizedHref.includes('youtube.com')) return 'Canal da VL Contabilidade Empresarial no YouTube';
    if (normalizedHref.includes('google.com/search')) return 'Perfil da VL Contabilidade Empresarial no Google';

    return '';
  }

  function enhanceExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
      const relValues = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      relValues.add('noopener');
      relValues.add('noreferrer');
      link.setAttribute('rel', Array.from(relValues).join(' '));

      const text = (link.textContent || '').trim();
      const hasOnlyIcon = text.length <= 2 && link.querySelector('i');
      const inferredLabel = getExternalLabel(link.getAttribute('href'));

      if (hasOnlyIcon && inferredLabel && !link.getAttribute('aria-label')) {
        link.setAttribute('aria-label', inferredLabel);
      }
    });
  }

  enhanceExternalLinks();

  // Marcar link ativo no menu
  const currentPath = window.location.pathname.toLowerCase();
  const menuLinks = document.querySelectorAll('.menu a, .menu-items a, .header-nav a');

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



