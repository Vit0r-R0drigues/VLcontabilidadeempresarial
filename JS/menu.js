class MobileMenu {
  constructor() {
    this.init();
  }

  init() {
    this.createMenuStructure();
    this.addEventListeners();
  }

  createMenuStructure() {
    const menuMobile = document.createElement('div');
    menuMobile.className = 'menu-mobile';
    
    menuMobile.innerHTML = `
      <div class="menu-toggle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </div>
      <div class="menu-items">
        <a href="/">Início</a>
        <a href="/HTML/ferramentas.html">Ferramentas</a>
        <a href="/HTML/calculadora-ferias.html">Calculadora de Férias</a>
        <a href="/HTML/calculadora-rescisao.html">Calculadora de Rescisão</a>
        <a href="/HTML/contatos.html">Contatos</a>
      </div>
    `;

    document.body.appendChild(menuMobile);
  }

  addEventListeners() {
    const menuToggle = document.querySelector('.menu-toggle');
    const menuItems = document.querySelector('.menu-items');

    menuToggle.addEventListener('click', () => {
      menuItems.classList.toggle('active');
      
      // Adiciona animação ao botão
      menuToggle.style.transform = menuItems.classList.contains('active') 
        ? 'rotate(180deg)' 
        : 'rotate(0deg)';
    });

    // Fecha o menu ao clicar fora
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu-mobile')) {
        menuItems.classList.remove('active');
        menuToggle.style.transform = 'rotate(0deg)';
      }
    });
  }
}

// Inicializa o menu mobile apenas em dispositivos móveis
if (window.innerWidth <= 768) {
  new MobileMenu();
}

window.addEventListener('resize', () => {
  if (window.innerWidth <= 768 && !document.querySelector('.menu-mobile')) {
    new MobileMenu();
  }
});

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página da calculadora
    const isCalculadoraPage = document.querySelector('.calculadora-page') !== null;
    
    if (isCalculadoraPage) {
        const header = document.querySelector('header');
        const calculadora = document.querySelector('.calculadora-container');
        
        // Função para verificar sobreposição
        function checkOverlap() {
            const headerRect = header.getBoundingClientRect();
            const calculadoraRect = calculadora.getBoundingClientRect();
            
            // Verificar se o header está sobrepondo a calculadora
            if (headerRect.bottom > calculadoraRect.top) {
                header.classList.add('transparent');
            } else {
                header.classList.remove('transparent');
            }
        }
        
        // Verificar ao rolar a página
        window.addEventListener('scroll', checkOverlap);
        
        // Verificar no carregamento inicial
        checkOverlap();
    }
    
    // Menu mobile
    const menuBtn = document.querySelector('.menu-mobile-btn');
    const nav = document.querySelector('nav');
    const overlay = document.querySelector('.menu-overlay');
    
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('menu-open');
            nav.classList.toggle('active');
            if (overlay) {
                overlay.classList.toggle('active');
            }
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', () => {
            menuBtn.classList.remove('menu-open');
            nav.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
}); 