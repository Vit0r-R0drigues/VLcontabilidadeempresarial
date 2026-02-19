# VL Contabilidade Empresarial - Website

Este é o repositório oficial do website da VL Contabilidade Empresarial, um escritório de contabilidade digital especializado em soluções empresariais completas.

## 📚 Estrutura do Projeto

```
VLcontabilidadeempresarial/
├── ESTILOS/
│   ├── style.css         # Estilos principais
│   ├── mediaquery.css    # Estilos responsivos
│   └── cookies.css       # Estilos do banner de cookies
├── JS/
│   ├── menu.js          # Funcionalidades do menu
│   └── cookies.js       # Gerenciamento de cookies
├── HTML/
│   ├── sobre.html       # Página Sobre
│   ├── servicos.html    # Página de Serviços
│   ├── contatos.html    # Página de Contatos
│   └── ferramentas.html # Página de Ferramentas
├── IMAGENS/
│   └── [arquivos de imagem]
└── index.html           # Página principal
```

## 🚀 Funcionalidades

### Sistema de Cookies
- Banner de consentimento de cookies
- Configurações personalizáveis
- Opções para cookies analíticos e de marketing
- Design responsivo e acessível

### SEO
- Meta tags otimizadas
- Structured Data (Schema.org)
- Open Graph tags para compartilhamento em redes sociais
- Descrições e títulos otimizados para mecanismos de busca

### Responsividade
- Design adaptativo para todos os dispositivos
- Breakpoints otimizados
- Imagens responsivas
- Menu mobile-friendly

## 🛠️ Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla)
- Flaticon UI Icons
- Schema.org

## 📱 Compatibilidade

O site é compatível com os seguintes navegadores:
- Google Chrome (última versão)
- Mozilla Firefox (última versão)
- Safari (última versão)
- Microsoft Edge (última versão)
- Opera (última versão)

## 🔒 Política de Privacidade e Cookies

O site implementa as seguintes políticas:
- Consentimento LGPD para cookies
- Cookies essenciais para funcionamento
- Cookies opcionais para análise e marketing
- Política de privacidade transparente

## 📊 Analytics e Monitoramento

O site utiliza:
- Cookies de análise (opcional)
- Monitoramento de performance
- Rastreamento de conversão
- Análise de comportamento do usuário

## 🔧 Manutenção

Para manter o site:
1. Atualize regularmente as dependências
2. Verifique a compatibilidade cross-browser
3. Monitore o desempenho
4. Mantenha o conteúdo atualizado

### Verificação de links locais

Antes de publicar, execute a checagem de links locais para evitar referências quebradas em `href/src`:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\check-links.ps1
```

Se o script encontrar links inválidos, ele retorna código `1` e lista arquivo/linha.

### Testes automatizados das calculadoras

Execute os testes de regressão das fórmulas (IRRF, férias e rescisão) antes de deploy:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\run-calculadoras-tests.ps1
```

Você também pode rodar diretamente:

```powershell
python .\tools\test_calculadoras_formulas.py
```

### Variáveis de ambiente

Use o arquivo `.env.example` como base para criar o seu `.env` local.
O arquivo `.env` está no `.gitignore` e não deve ser versionado.

## 📝 SEO Checklist

- [x] Meta tags otimizadas
- [x] Structured Data implementado
- [x] URLs amigáveis
- [x] Conteúdo otimizado
- [x] Imagens otimizadas
- [x] Site responsivo
- [x] Performance otimizada

## 🤝 Contribuição

Para contribuir com o projeto:
1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📫 Contato

- Email: contato@vlcontabilidadeempresarial.com.br
- WhatsApp: (11) 91653-9680
- Instagram: [@vl_contabilidade_empresarial](https://www.instagram.com/vl_contabilidade_empresarial/)
- YouTube: [@contabilidadeempresarial](https://www.youtube.com/@contabilidadeempresarial)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
