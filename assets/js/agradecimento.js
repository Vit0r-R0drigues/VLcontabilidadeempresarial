// Efeito de digitação para o texto de boas-vindas
const typingText = document.querySelector('.typing-text');
const text = typingText.textContent;
typingText.textContent = '';

let i = 0;
function typeWriter() {
    if (i < text.length) {
        typingText.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 50);
    }
}

// Iniciar a animação após um delay
setTimeout(typeWriter, 1500);

// Criar partículas flutuantes
function createParticles() {
    const container = document.querySelector('.floating-particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Posição aleatória
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        // Tamanho aleatório
        const size = Math.random() * 10 + 5;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // Animação aleatória
        particle.style.animation = `float ${Math.random() * 3 + 2}s ease-in-out infinite`;
        particle.style.animationDelay = Math.random() * 2 + 's';
        
        container.appendChild(particle);
    }
}

// Iniciar partículas
createParticles();

// Adicionar listener para o botão de retorno
document.querySelector('.home-btn').addEventListener('click', (e) => {
    e.preventDefault();
    document.body.style.opacity = '0';
    setTimeout(() => {
        window.location.href = e.target.href;
    }, 500);
});

// Adicionar efeitos de hover nos passos
document.querySelectorAll('.step').forEach(step => {
    step.addEventListener('mouseenter', () => {
        step.style.transform = 'translateY(-5px) scale(1.02)';
    });
    
    step.addEventListener('mouseleave', () => {
        step.style.transform = 'translateY(0) scale(1)';
    });
});

// Animação suave nos ícones sociais
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        const icon = btn.querySelector('i');
        icon.style.transform = 'scale(1.2) rotate(5deg)';
    });
    
    btn.addEventListener('mouseleave', () => {
        const icon = btn.querySelector('i');
        icon.style.transform = 'scale(1) rotate(0)';
    });
});

// Melhorar a animação das partículas
function updateParticles() {
    document.querySelectorAll('.particle').forEach(particle => {
        const rect = particle.getBoundingClientRect();
        
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
            particle.style.top = Math.random() * 100 + '%';
            particle.style.left = Math.random() * 100 + '%';
        }
    });
}

setInterval(updateParticles, 3000);

// Adicionar efeito de fade ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
}); 