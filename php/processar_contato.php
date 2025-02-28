<?php
require __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

// Habilitar todos os erros para debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

// Configurações
$config = [
    'email_destino' => 'coontabilidadeempresarial@gmail.com',
    'senha_email' => 'kohh ncmq cifk hsmy', // Use variáveis de ambiente em produção
    'max_tentativas' => 3,
    'tempo_limite' => 300 // 5 minutos
];

// Verificar método da requisição
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(false, 'Método não permitido');
}

// Validar campos obrigatórios
$campos_obrigatorios = ['nome', 'email', 'telefone', 'mensagem'];
foreach ($campos_obrigatorios as $campo) {
    if (empty($_POST[$campo])) {
        enviar_resposta(false, 'Todos os campos são obrigatórios');
    }
}

// Sanitizar e validar dados
$nome = filter_var(trim($_POST['nome']), FILTER_SANITIZE_STRING);
$email = filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL);
$telefone = preg_replace('/[^0-9]/', '', $_POST['telefone']);
$assunto = filter_var(trim($_POST['assunto'] ?? 'Contato via Site'), FILTER_SANITIZE_STRING);
$mensagem = filter_var(trim($_POST['mensagem']), FILTER_SANITIZE_STRING);
$origem = filter_var(trim($_POST['origem'] ?? 'Não especificada'), FILTER_SANITIZE_STRING);

// Validações
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    enviar_resposta(false, 'Email inválido');
}

if (strlen($telefone) < 10 || strlen($telefone) > 11) {
    enviar_resposta(false, 'Telefone inválido');
}

if (strlen($mensagem) < 10) {
    enviar_resposta(false, 'Mensagem muito curta');
}

// Formatar telefone para exibição
$telefone_formatado = strlen($telefone) === 11 
    ? sprintf('(%s) %s-%s', substr($telefone, 0, 2), substr($telefone, 2, 5), substr($telefone, 7))
    : sprintf('(%s) %s-%s', substr($telefone, 0, 2), substr($telefone, 2, 4), substr($telefone, 6));

// Função para enviar email usando PHPMailer
function enviarEmail($nome, $email, $telefone, $assunto, $mensagem, $origem, $config) {
    $mail = new PHPMailer(true);

    try {
        // Configurações do servidor
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = $config['email_destino'];
        $mail->Password = $config['senha_email'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        $mail->CharSet = 'UTF-8';

        // Destinatários
        $mail->setFrom($config['email_destino'], 'Formulário de Contato');
        $mail->addAddress($config['email_destino']);
        $mail->addReplyTo($email, $nome);

        // Conteúdo
        $mail->isHTML(true);
        $mail->Subject = "Novo Contato do Site - " . $assunto;
        
        $corpo_email = "
        <h2>Novo contato recebido do site</h2>
        <p><strong>Nome:</strong> {$nome}</p>
        <p><strong>Email:</strong> {$email}</p>
        <p><strong>Telefone:</strong> {$telefone}</p>
        <p><strong>Assunto:</strong> {$assunto}</p>
        <p><strong>Origem:</strong> {$origem}</p>
        <p><strong>Mensagem:</strong><br>{$mensagem}</p>
        <p><strong>Data/Hora:</strong> " . date('d/m/Y H:i:s') . "</p>";

        $mail->Body = $corpo_email;
        $mail->AltBody = strip_tags($corpo_email);

        return $mail->send();
    } catch (Exception $e) {
        error_log("Erro ao enviar email: {$mail->ErrorInfo}");
        return false;
    }
}

// Enviar email
$sucesso = enviarEmail($nome, $email, $telefone_formatado, $assunto, $mensagem, $origem, $config);

// Registrar no log
$log_mensagem = date('Y-m-d H:i:s') . " - " . 
                ($sucesso ? "Sucesso" : "Falha") . 
                " - Email: {$email} - Origem: {$origem}\n";

if (!is_dir('../logs')) {
    mkdir('../logs', 0755, true);
}
file_put_contents('../logs/contato.log', $log_mensagem, FILE_APPEND);

// Enviar resposta
enviar_resposta($sucesso, $sucesso ? 'Mensagem enviada com sucesso!' : 'Erro ao enviar mensagem.');

function enviar_resposta($sucesso, $mensagem) {
    echo json_encode([
        'success' => $sucesso,
        'message' => $mensagem
    ]);
    exit;
}
?> 