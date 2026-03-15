/**
 * Script para a pagina de contatos
 *
 * Converte o envio do formulario em uma mensagem direta no WhatsApp.
 */

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('whatsappForm');
    if (!form) {
        return;
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const nome = document.getElementById('nome').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const email = document.getElementById('email').value.trim();
        const mensagem = document.getElementById('mensagem').value.trim();

        const linhas = [
            'Ola! Gostaria de falar com a VL Contabilidade Empresarial.',
            nome ? `Nome: ${nome}` : '',
            telefone ? `Telefone: ${telefone}` : '',
            email ? `Email: ${email}` : '',
            mensagem ? `Mensagem: ${mensagem}` : ''
        ].filter(Boolean);

        const texto = encodeURIComponent(linhas.join('\n'));
        const telefoneDestino = (form.dataset.whatsapp || '').replace(/\D/g, '');

        if (!telefoneDestino) {
            console.warn('Numero de WhatsApp nao configurado no formulario.');
            return;
        }

        const url = `https://wa.me/${telefoneDestino}?text=${texto}`;
        window.location.href = url;
    });
});
