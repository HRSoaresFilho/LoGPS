<?php
include 'conn.php';

// Receber as datas do filtro
$startDate = $_GET['startDate'];
$endDate = $_GET['endDate'];

// Query para buscar os nomes da tabela coordenadas em ordem ascendente pelo ID
$queryNames = "
    SELECT nome
    FROM coordenadas
    ORDER BY id ASC;
";

// Executa a query para obter os nomes
$resultNames = $conn->query($queryNames);

// Verifica se a consulta retornou resultados
if ($resultNames && $resultNames->num_rows > 0) {
    // Array para armazenar os nomes na ordem desejada
    $desiredOrder = [];
    while ($row = $resultNames->fetch_assoc()) {
        $desiredOrder[] = $row['nome'];
    }
} else {
    // Caso não encontre nomes, pode retornar um erro ou uma lista vazia
    $desiredOrder = []; // Pode ser uma lista padrão se necessário
}

// Query para buscar os registros com filtro de datas
$query = "
    SELECT nome, DATE(timestamp) as data, TIME(timestamp) as hora
    FROM registros
    WHERE DATE(timestamp) BETWEEN '$startDate' AND '$endDate'
    ORDER BY FIELD(nome, '" . implode("','", $desiredOrder) . "'), timestamp;
";

// Executa a query
$result = $conn->query($query);

// Array para armazenar os resultados
$records = [];
$names = $desiredOrder; // Mantém a ordem dos nomes

// Organiza os dados para o gráfico
while ($row = $result->fetch_assoc()) {
    $date = $row['data'];
    $name = $row['nome'];
    $time = $row['hora'];

    // Garante que os dados estejam de acordo com as datas
    if (!isset($records[$date])) {
        $records[$date] = ['date' => $date, 'names' => []];
    }
    $records[$date]['names'][$name] = $time;
}

// Reordena os registros conforme a ordem desejada
$ordered_records = array_values($records);

// Retorna os dados em JSON
echo json_encode([
    'records' => $ordered_records,
    'names' => $names // Ordem dos nomes definida
]);
?>