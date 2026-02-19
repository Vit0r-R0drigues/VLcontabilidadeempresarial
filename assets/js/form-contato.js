// Máscara para o telefone
document.getElementById('telefone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 7) {
        value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    }
    
    e.target.value = value;
});

// Envio do formulário
document.getElementById('form-contato').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const btnEnviar = document.getElementById('enviar-btn');
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';

    const formData = new FormData(this);
    formData.append('origem', window.location.pathname);

    fetch('../php/processar_contato.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = 'agradecimento.html';
        } else {
            alert(data.message || 'Erro ao enviar mensagem. Por favor, tente novamente.');
        }
    })
    .catch(error => {
        alert('Erro ao enviar mensagem. Por favor, tente novamente.');
        console.error('Erro:', error);
    })
    .finally(() => {
        btnEnviar.disabled = false;
        btnEnviar.textContent = 'Enviar Mensagem';
    });
}); 