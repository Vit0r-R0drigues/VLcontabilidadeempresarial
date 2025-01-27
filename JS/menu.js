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