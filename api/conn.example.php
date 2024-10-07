<?php

$host = 'host';
$user = 'username';
$pwd = 'password';
$db = 'database';

// Conexão com o banco de dados
$conn = new mysqli($host, $user, $pwd, $db);

if ($conn->connect_error) {
    die("Conexão falhou: " . $conn->connect_error);
}
