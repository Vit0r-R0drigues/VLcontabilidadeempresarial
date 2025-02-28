// Animações suaves ao scroll
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.animate-on-scroll');
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight - 100) {
            element.classList.add('animate');
        }
    });
};

// Ajuste dinâmico da altura do iframe do formulário
const adjustFormHeight = () => {
    const formWrapper = document.querySelector('.google-form-wrapper');
    const iframe = formWrapper.querySelector('iframe');
    
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const height = Math.min(entry.contentRect.height, window.innerHeight * 0.8);
            iframe.style.height = `${height}px`;
        }
    });

    resizeObserver.observe(formWrapper);
};

// Menu mobile aprimorado
const initMobileMenu = () => {
    const menuButton = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');
    const header = document.querySelector('header');

    menuButton.addEventListener('click', () => {
        menu.classList.toggle('active');
        menuButton.classList.toggle('active');
        header.classList.toggle('menu-open');
    });

    // Fechar menu ao clicar em um link
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            menuButton.classList.remove('active');
            header.classList.remove('menu-open');
        });
    });
};

// Efeito de digitação para textos
const typeWriter = (element, text, speed = 50) => {
    let i = 0;
    element.innerHTML = '';
    
    const type = () => {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    };
    
    type();
};

// Animação dos cards de serviços
const initServiceCards = () => {
    const cards = document.querySelectorAll('.servico-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
};

// Ajuste responsivo do header
const initResponsiveHeader = () => {
    let lastScroll = 0;
    const header = document.querySelector('header');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > lastScroll && currentScroll > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }

        lastScroll = currentScroll;
    });
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Adicionar classes para animação
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('animate-on-scroll');
    });

    // Inicializar todas as funcionalidades
    initMobileMenu();
    initServiceCards();
    initResponsiveHeader();
    adjustFormHeight();

    // Animação de texto na home
    const homeTitle = document.querySelector('.home1 h1');
    if (homeTitle) {
        typeWriter(homeTitle, homeTitle.textContent);
    }

    // Observador de scroll para animações
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll();
});

// Otimização para dispositivos móveis
const optimizeMobile = () => {
    if (window.innerWidth <= 768) {
        // Ajustes específicos para mobile
        document.querySelectorAll('.parallax').forEach(element => {
            element.style.transform = 'none';
        });
    }
};

window.addEventListener('resize', optimizeMobile);
optimizeMobile(); 