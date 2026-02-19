// Script legado para formularios locais.
// Mantido sem dependencia de backend PHP.
document.addEventListener('DOMContentLoaded', () => {
    const telefoneInput = document.getElementById('telefone');
    const contatoForm = document.getElementById('form-contato');

    if (telefoneInput) {
        telefoneInput.addEventListener('input', (event) => {
            let value = event.target.value.replace(/\D/g, '').slice(0, 11);

            if (value.length > 7) {
                value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
            }

            event.target.value = value;
        });
    }

    if (contatoForm) {
        contatoForm.addEventListener('submit', (event) => {
            event.preventDefault();
            alert('Este formulario foi descontinuado. Use a pagina de contato oficial.');
        });
    }
});
