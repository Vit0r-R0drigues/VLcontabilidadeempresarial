document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('whatsappForm');
    const submitButton = form ? form.querySelector('.whatsapp-submit') : null;

    if (!form) {
        return;
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const telefoneDestino = (form.dataset.whatsapp || '').replace(/\D/g, '');
        if (!telefoneDestino) {
            return;
        }

        if (submitButton) {
            submitButton.classList.add('is-submitting');
            submitButton.setAttribute('aria-busy', 'true');
        }

        const campos = {
            nome: document.getElementById('nome')?.value.trim() || '',
            telefone: document.getElementById('telefone')?.value.trim() || '',
            email: document.getElementById('email')?.value.trim() || '',
            empresa: document.getElementById('empresa')?.value.trim() || '',
            objetivo: document.getElementById('objetivo')?.value.trim() || '',
            momento: document.getElementById('momento')?.value.trim() || '',
            mensagem: document.getElementById('mensagem')?.value.trim() || ''
        };

        const linhas = [
            'Ola! Quero falar com a VL Contabilidade Empresarial.',
            campos.nome ? `Nome: ${campos.nome}` : '',
            campos.telefone ? `Telefone: ${campos.telefone}` : '',
            campos.email ? `Email: ${campos.email}` : '',
            campos.empresa ? `Empresa ou atividade: ${campos.empresa}` : '',
            campos.objetivo ? `Objetivo principal: ${campos.objetivo}` : '',
            campos.momento ? `Momento atual: ${campos.momento}` : '',
            campos.mensagem ? `Contexto: ${campos.mensagem}` : '',
            '',
            'Gostaria de entender o melhor proximo passo com a VL.'
        ].filter(Boolean);

        const url = `https://wa.me/${telefoneDestino}?text=${encodeURIComponent(linhas.join('\n'))}`;
        window.setTimeout(() => {
            window.location.href = url;
        }, 120);
    });
});
