<?php

include 'conn.php';

// Receber os dados do POST
$nome = $_POST['nome'];
$latitude = $_POST['latitude'];
$longitude = $_POST['longitude'];
$timestamp = $_POST['timestamp'];
$dateTime = new DateTime($timestamp, new DateTimeZone('UTC'));
$dateTime->setTimezone(new DateTimeZone('America/Sao_Paulo'));
$timestampLocal = $dateTime->format('Y-m-d H:i:s');

// Inserir os dados na tabela de registros
$sql = "INSERT INTO registros (nome, latitude, longitude, timestamp) VALUES ('$nome', '$latitude', '$longitude', '$timestampLocal')";

if ($conn->query($sql) === TRUE) {
    echo "Registro salvo com sucesso!";
} else {
    echo "Erro: " . $sql . "<br>" . $conn->error;
}

// Fechar conexão
$conn->close();
