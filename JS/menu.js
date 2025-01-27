class MobileMenu {
  constructor() {
    this.menuBtn = document.querySelector('.menu-toggle');
    this.menuItems = document.querySelector('.menu-items');
    this.init();
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
    
    // Detecta se estamos em uma subpasta (HTML/) ou na raiz
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
    this.menuBtn = document.querySelector('.menu-toggle');
    this.menuItems = document.querySelector('.menu-items');
  }

  addEventListeners() {
    if (this.menuBtn && this.menuItems) {
      this.menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.menuItems.classList.toggle('active');
        this.menuBtn.style.transform = this.menuItems.classList.contains('active') 
          ? 'rotate(90deg)' 
          : 'rotate(0deg)';
        document.body.style.overflow = this.menuItems.classList.contains('active') ? 'hidden' : '';
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-mobile')) {
          this.menuItems.classList.remove('active');
          this.menuBtn.style.transform = 'rotate(0deg)';
          document.body.style.overflow = '';
        }
      });

      // Fechar menu ao clicar em um link
      const menuLinks = this.menuItems.querySelectorAll('a');
      menuLinks.forEach(link => {
        link.addEventListener('click', () => {
          this.menuItems.classList.remove('active');
          this.menuBtn.style.transform = 'rotate(0deg)';
          document.body.style.overflow = '';
        });
      });
    }
  }
}

// Inicializa o menu mobile
function initMobileMenu() {
  if (window.innerWidth <= 768) {
    new MobileMenu();
  }
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
  initMobileMenu();
}

// Reinicializa ao redimensionar a janela
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(initMobileMenu, 250);
});

// Verificar se estamos na página da calculadora
if (document.querySelector('.calculadora-page')) {
  const header = document.querySelector('header');
  const calculadora = document.querySelector('.calculadora-container');
  
  if (header && calculadora) {
    function checkOverlap() {
      const headerRect = header.getBoundingClientRect();
      const calculadoraRect = calculadora.getBoundingClientRect();
      
      if (headerRect.bottom > calculadoraRect.top) {
        header.classList.add('transparent');
      } else {
        header.classList.remove('transparent');
      }
    }
    
    window.addEventListener('scroll', checkOverlap);
    checkOverlap();
  }
}

document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.querySelector('.menu-mobile-btn');
    const navMenu = document.querySelector('.nav-menu');
    const menuOverlay = document.querySelector('.menu-overlay');
    const header = document.querySelector('header');

        menuBtn.addEventListener('click', function() {
            this.classList.toggle('menu-open');
        navMenu.classList.toggle('active');
            menuOverlay.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        menuOverlay.addEventListener('click', function() {
            menuBtn.classList.remove('menu-open');
        navMenu.classList.remove('active');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });

        // Fechar menu ao clicar em um link
    const menuLinks = document.querySelectorAll('.nav-menu a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                menuBtn.classList.remove('menu-open');
            navMenu.classList.remove('active');
                menuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

    // Adicionar classe ao header quando rolar a página
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
}); 