<?php

include 'conn.php';

// Consulta para buscar as coordenadas e seus nomes
$sql = "SELECT nome, latitude, longitude FROM coordenadas";
$result = $conn->query($sql);

$coordinates = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $coordinates[] = $row;
    }
}

// Fechar conexão
$conn->close();

// Retorna as coordenadas em formato JSON
echo json_encode($coordinates);
