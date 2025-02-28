/**
 * Script para a página de contatos
 * 
 * Este script gerencia a interação com o formulário do Google Forms
 * e melhora a experiência do usuário durante o carregamento.
 * 
 * @author VL Contabilidade Empresarial
 * @version 1.0
 */

document.addEventListener('DOMContentLoaded', function() {
    // Referência ao loader do formulário
    const formLoader = document.getElementById('formLoader');
    
    // Função para verificar se o iframe foi carregado
    function checkIframeLoaded() {
        // Obtém o iframe
        const iframe = document.querySelector('.form-container iframe');
        
        // Adiciona evento de carregamento ao iframe
        iframe.addEventListener('load', function() {
            // Esconde o loader quando o iframe estiver carregado
            formLoader.style.display = 'none';
            
            // Registra no console que o formulário foi carregado
            console.log('Formulário carregado com sucesso');
        });
        
        // Define um timeout de segurança para esconder o loader após 10 segundos
        // caso o evento de carregamento não seja disparado
        setTimeout(function() {
            if (formLoader.style.display !== 'none') {
                formLoader.style.display = 'none';
                console.log('Timeout de carregamento do formulário atingido');
            }
        }, 10000);
    }
    
    // Inicia a verificação de carregamento
    checkIframeLoaded();
    
    // Adiciona mensagem ao console para depuração
    console.log('Script de contato inicializado');
}); 