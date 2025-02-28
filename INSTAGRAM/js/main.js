document.addEventListener('DOMContentLoaded', () => {
  // Adicionar índices de animação aos links
  const links = document.querySelectorAll('.link-item');
  links.forEach((link, index) => {
    link.style.setProperty('--i', index + 1);
  });

  // Efeito de hover nos links com ripple
  links.forEach(link => {
    link.addEventListener('mouseenter', (e) => {
      const ripple = document.createElement('div');
      ripple.className = 'ripple';
      
      const rect = link.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      link.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 1000);
    });
  });

  // Animação suave ao clicar nos links
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      link.style.transform = 'scale(0.98)';
      
      setTimeout(() => {
        link.style.transform = '';
        window.location.href = link.href;
      }, 200);
    });
  });

  // Adicionar contador de visitas estilizado
  const visitsCounter = document.createElement('div');
  visitsCounter.className = 'visit-counter';
  const visits = localStorage.getItem('visits') || 0;
  visitsCounter.textContent = `Visitas: ${Number(visits) + 1}`;
  document.body.appendChild(visitsCounter);
  localStorage.setItem('visits', Number(visits) + 1);

  // Criar partículas douradas
  createParticles();

  // Adicionar efeito de hover 3D nos links
  const links = document.querySelectorAll('.link-item');
  links.forEach(link => {
    link.addEventListener('mousemove', e => {
      const rect = link.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const angleX = (y - centerY) / 20;
      const angleY = (centerX - x) / 20;
      
      link.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    link.addEventListener('mouseleave', () => {
      link.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  });

  // Easter egg - Konami Code
  let konamiCode = [];
  const correctCode = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];

  document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);

    if (konamiCode.join(',') === correctCode.join(',')) {
      document.body.style.animation = 'rainbow 2s linear infinite';
    }
  });
});

// Função para criar partículas douradas
function createParticles() {
  const particlesContainer = document.createElement('div');
  particlesContainer.className = 'particles';
  document.body.appendChild(particlesContainer);

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 3 + 1;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    
    particle.style.animationDelay = `${Math.random() * 3}s`;
    particle.style.animationDuration = `${Math.random() * 3 + 2}s`;
    
    particlesContainer.appendChild(particle);
  }
}

// Função para copiar texto com efeito de confete
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    createConfetti();
    showToast('Copiado para a área de transferência! ✨');
  });
}

// Função para criar efeito de confete
function createConfetti() {
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDelay = `${Math.random() * 3}s`;
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 3000);
  }
}

// Função para mostrar toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
} 