// Variáveis globais
var isTracking = false;
var lastPosition = null;
var lastTimestamp = 0;
var targetCoordinates = []; // Coordenadas alvo vindas do servidor
var MIN_TIME_INTERVAL = 1000; // Intervalo mínimo de 1 segundo para atualizações
var registeredLocations = []; // Array para armazenar locais já registrados
var wakeLock = null;

if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    document.getElementById('toggleDarkMode').innerText = 'Desativar Modo Escuro';
}

// Alterna entre os modos escuro e claro
document.getElementById('toggleDarkMode').addEventListener('click', function () {
    const isDarkModeEnabled = document.body.classList.toggle('dark-mode');

    if (isDarkModeEnabled) {
        localStorage.setItem('darkMode', 'enabled');
        this.innerText = 'Desativar Modo Escuro';
    } else {
        localStorage.setItem('darkMode', 'disabled');
        this.innerText = 'Ativar Modo Escuro';
    }
});

document.getElementById('startTracking').addEventListener('click', function () {
    if (!isTracking) {
        isTracking = true;
        loadTargetCoordinates(); // Carregar coordenadas do servidor
        this.innerText = "Rastreamento em andamento...";
        this.classList.remove('btn-primary');
        this.classList.add('btn-success');
        requestWakeLock(); // Requisitar o Wake Lock
    }
});

// Função para solicitar que a tela permaneça ligada
function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            navigator.wakeLock.request('screen').then(lock => {
                wakeLock = lock;
                console.log("Wake Lock ativo. A tela permanecerá ligada.");
                // Listener para liberar o Wake Lock quando a aba for minimizada ou o foco mudar
                wakeLock.addEventListener('release', () => {
                    console.log("Wake Lock liberado.");
                });
            }).catch(err => {
                console.error("Erro ao tentar ativar Wake Lock:", err);
            });
        } catch (err) {
            console.error("Erro ao tentar ativar Wake Lock:", err);
        }
    } else {
        console.warn("Wake Lock API não é suportada pelo seu navegador.");
    }
}

// Função para liberar o Wake Lock quando o rastreamento for parado
function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release().then(() => {
            console.log("Wake Lock liberado.");
        });
    }
}

// Função para carregar as coordenadas alvo do servidor
function loadTargetCoordinates() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "api/get_coordinates.php", true); // Arquivo PHP que retorna as coordenadas
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            targetCoordinates = JSON.parse(xhr.responseText); // Salva as coordenadas no array
            startGPS(); // Iniciar o rastreamento após carregar as coordenadas
        }
    };
    xhr.send();
}

// Função para iniciar o GPS
function startGPS() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            function (position) {
                var latitude = position.coords.latitude;
                var longitude = position.coords.longitude;
                var currentTime = new Date();

                // Exibir a localização atual na tela
                document.getElementById('currentLatitude').innerText = latitude;
                document.getElementById('currentLongitude').innerText = longitude;
                document.getElementById('currentTimestamp').innerText = currentTime.toLocaleTimeString();

                // Verificar se o intervalo mínimo de tempo passou
                if (currentTime.getTime() - lastTimestamp >= MIN_TIME_INTERVAL) {
                    // Verificar se o usuário está perto de alguma coordenada alvo
                    targetCoordinates.forEach(function (target) {
                        if (shouldLogPosition(latitude, longitude, target.latitude, target.longitude) && !registeredLocations.includes(target.nome)) {
                            var timestamp = new Date();

                            // Enviar dados para o servidor e atualizar a lista com o nome do local
                            sendToServer(target.nome, latitude, longitude, timestamp);
                            updateCoordinatesList(target.nome, timestamp);

                            // Adicionar o local ao array de locais registrados
                            registeredLocations.push(target.nome);

                            // Atualizar a última posição e o timestamp do último registro
                            lastPosition = { latitude: latitude, longitude: longitude };
                            lastTimestamp = currentTime.getTime();
                        }
                    });
                }
            },
            function (error) {
                console.error("Erro ao obter localização: " + error.message);
                // Exibir mensagem de erro na tela
                document.getElementById('currentLatitude').innerText = "Erro";
                document.getElementById('currentLongitude').innerText = "Erro";
            },
            {
                enableHighAccuracy: true, // Melhorar a precisão do GPS
                timeout: 5000, // Tempo limite de 5 segundos para obter a posição
                maximumAge: 0 // Não usar cache, sempre obter a posição mais recente
            }
        );
    } else {
        alert("Geolocalização não é suportada pelo seu navegador.");
    }
}

// Função para verificar se a posição atual está perto de alguma coordenada alvo
function shouldLogPosition(newLat, newLon, targetLat, targetLon) {
    var distance = getDistanceFromLatLonInKm(newLat, newLon, targetLat, targetLon);
    return distance < 0.05; // Distância menor que 50 metros
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Raio da Terra em km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distância em km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function sendToServer(nome, lat, lon, timestamp) {
    if (navigator.onLine) {
        // Se estiver online, enviar diretamente ao servidor
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "api/save_coordinates.php", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                console.log("Registro enviado com sucesso!");
            }
        };
        xhr.send("nome=" + nome + "&latitude=" + lat + "&longitude=" + lon + "&timestamp=" + timestamp.toISOString());
    } else {
        // Se estiver offline, salvar os dados no localStorage para enviar depois
        var pendingData = JSON.parse(localStorage.getItem('pendingTrackingData') || '[]');
        pendingData.push({ nome: nome, latitude: lat, longitude: lon, timestamp: timestamp });
        localStorage.setItem('pendingTrackingData', JSON.stringify(pendingData));

        // Registra para sincronizar quando a conexão voltar
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(function (swRegistration) {
                return swRegistration.sync.register('sync-tracking-data');
            });
        }
    }
}

// Função para atualizar a lista de coordenadas exibidas na tela
function updateCoordinatesList(nome, timestamp) {
    var coordinatesList = document.getElementById('coordinatesList');
    var listItem = document.createElement('li');
    listItem.className = 'list-group-item';
    listItem.innerText = `Local: ${nome} - Horário: ${timestamp.toLocaleTimeString()}`;
    coordinatesList.appendChild(listItem);
}
