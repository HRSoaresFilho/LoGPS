<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LoGPS - Rastreamento por GPS</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <!-- Bootstrap CSS -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> <!-- Chart.js -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script> <!-- jQuery -->
</head>

<body class="container mt-5">
    <h1 class="text-center">Relatório de Registros LoGPS</h1>

    <!-- Filtro de datas -->
    <div class="form-row">
        <div class="form-group col-md-6">
            <label for="startDate">Data de Início:</label>
            <input type="date" class="form-control" id="startDate" value="<?= date('Y-m-01'); ?>">
        </div>
        <div class="form-group col-md-6">
            <label for="endDate">Data Final:</label>
            <input type="date" class="form-control" id="endDate" value="<?= date('Y-m-d'); ?>">
        </div>
    </div>
    <button id="toggleTableButton" class="btn btn-secondary">Mostrar Resultados</button>
    <button id="filterButton" class="btn btn-primary">Filtrar</button>
    <a href="index.html" class="btn btn-outline-success float-right">Início</a>

    <!-- Tabela de Resultados -->
    <h2 class="mt-4" id="resultTitle" style="display: none;">Resultados</h2>
    <div style="overflow-x: auto;">
        <div id="resultTable" style="display: none;"></div>
    </div>

    <!-- Gráfico -->
    <h2 class="mt-4">Gráfico de Registros</h2>
    <canvas id="myChart" width="400" height="200"></canvas>

    <script>
        let myChart = null; // Definir a variável globalmente

        // Converte o tempo no formato HH:MM:SS para segundos
        function timeToSeconds(time) {
            const parts = time.split(':');
            return (+parts[0] * 3600) + (+parts[1] * 60) + (+parts[2]);
        }

        // Converte os segundos de volta para o formato HH:MM:SS
        function secondsToTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return [hours, minutes, secs]
                .map(v => v < 10 ? '0' + v : v) // Adiciona um zero à esquerda se necessário
                .join(':');
        }

        // Função para atualizar a tabela de resultados
        function updateTable(data, names) {
            let table = '<table class="table table-bordered"><thead><tr><th>Data</th>';

            // Cabeçalhos dos nomes
            names.forEach(name => table += `<th>${name}</th>`);
            table += '</tr></thead><tbody>';

            // Preenchimento da tabela
            data.forEach(row => {
                table += `<tr><td>${row.date}</td>`;
                names.forEach(name => table += `<td>${row.names[name] || ''}</td>`);
                table += '</tr>';
            });

            table += '</tbody></table>';
            $('#resultTable').html(table);
        }

        // Função para atualizar o gráfico
        function updateChart(data, names) {
            const datasets = [];

            data.forEach((row) => {
                datasets.push({
                    label: row.date, // Cada linha representa uma data
                    data: names.map(name => row.names[name] ? timeToSeconds(row.names[name]) : null), // Converte tempo em segundos para o gráfico
                    fill: false,
                    borderColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`,
                    borderWidth: 2,
                    pointRadius: 5, // Tamanho dos pontos
                    pointHoverRadius: 8, // Tamanho ao passar o mouse
                    tension: 0.3 // Suaviza a curva
                });
            });

            const ctx = document.getElementById('myChart').getContext('2d');

            // Destroi o gráfico anterior se ele existir
            if (myChart) {
                myChart.destroy();
            }

            myChart = new Chart(ctx, {
                type: 'line', // Gráfico de linha
                data: {
                    labels: names, // Nomes no eixo X
                    datasets: datasets
                },
                options: {
                    scales: {
                        x: {
                            beginAtZero: false, // Eixo X mostra os nomes na ordem correta
                        },
                        y: {
                            type: 'linear', // Define o eixo Y como linear
                            ticks: {
                                callback: function (value) {
                                    return secondsToTime(value); // Converte segundos de volta para o formato HH:MM:SS
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return secondsToTime(context.raw); // Mostra o tempo em formato HH:MM:SS no tooltip
                                }
                            }
                        }
                    }
                }
            });
        }

        // Carrega os dados iniciais
        $(document).ready(function () {
            fetchData($('#startDate').val(), $('#endDate').val());
            // Alterna a exibição da tabela
            $('#toggleTableButton').click(function () {
                $('#resultTitle').toggle();
                $('#resultTable').toggle();

                // Altera o texto do botão
                const buttonText = $('#resultTable').is(':visible') ? 'Esconder Resultados' : 'Mostrar Resultados';
                $(this).text(buttonText);
            });

        });

        // Função para obter dados e atualizar tabela e gráfico
        function fetchData(startDate, endDate) {
            $.ajax({
                url: 'api/get_data.php',
                type: 'GET',
                data: {
                    startDate: startDate,
                    endDate: endDate
                },
                success: function (response) {
                    const result = JSON.parse(response);
                    const data = result.records;
                    const names = result.names; // Pega a ordem correta dos nomes
                    updateTable(data, names);
                    updateChart(data, names);
                }
            });
        }

        // Filtra os dados ao clicar no botão
        $('#filterButton').on('click', function () {
            fetchData($('#startDate').val(), $('#endDate').val());
        });

    </script>
</body>

</html>