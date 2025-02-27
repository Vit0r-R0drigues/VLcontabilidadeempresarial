<?php
require '../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

try {
    $mail = new PHPMailer(true);
    
    //Server settings
    $mail->SMTPDebug = SMTP::DEBUG_SERVER;
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'coontabilidadeempresarial@gmail.com';
    $mail->Password   = 'kohh ncmq cifk hsmy';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->CharSet    = 'UTF-8';

    //Recipients
    $mail->setFrom('coontabilidadeempresarial@gmail.com', 'Teste');
    $mail->addAddress('coontabilidadeempresarial@gmail.com');

    //Content
    $mail->isHTML(true);
    $mail->Subject = 'Teste de Email';
    $mail->Body    = 'Este é um email de teste usando PHPMailer';

    $mail->send();
    echo "Email enviado com sucesso!";
} catch (Exception $e) {
    echo "Erro ao enviar email: {$mail->ErrorInfo}";
} 