/**
 * Adiciona uma saudação personalizada baseada na hora do dia.
 */
function setPersonalizedGreeting() {
    // Tenta encontrar o elemento onde a saudação será exibida.
    const greetingElement = document.getElementById('personalized-greeting');

    // Se o elemento não existir na página, interrompe a execução.
    if (!greetingElement) {
        return;
    }

    const currentHour = new Date().getHours();
    let greeting = 'Olá!';

    if (currentHour >= 5 && currentHour < 12) {
        greeting = 'Bom dia!';
    } else if (currentHour >= 12 && currentHour < 18) {
        greeting = 'Boa tarde!';
    } else {
        greeting = 'Boa noite!';
    }

    greetingElement.textContent = greeting;
}

// Executa a função quando o conteúdo da página for carregado.
document.addEventListener('DOMContentLoaded', setPersonalizedGreeting);