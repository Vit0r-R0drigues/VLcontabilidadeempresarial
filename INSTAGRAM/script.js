// script.js

// Contador de visitas
let visitCount = localStorage.getItem('visitCount') ? parseInt(localStorage.getItem('visitCount')) : 0;
visitCount++;
localStorage.setItem('visitCount', visitCount);
document.getElementById('counter').textContent = visitCount;

// Efeito de animação ao carregar a página
window.onload = function() {
    const container = document.querySelector('.container');
    container.style.opacity = 0;
    setTimeout(() => {
        container.style.transition = 'opacity 1s';
        container.style.opacity = 1;
    }, 100);
};

// Mensagem de agradecimento ao clicar no botão "Fale Conosco"
//document.getElementById('contact-button').addEventListener('click', function(event) {
//    event.preventDefault(); // Impede o redirecionamento imediato
 //   alert('Obrigado por entrar em contato! Responderemos em breve.');
//    window.open(this.href, '_blank'); // Abre o link em uma nova aba
//});