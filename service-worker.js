const CACHE_NAME = 'gps-tracker-cache';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/api/get_coordinates.php',
    '/api/save_coordinates.php',
];

// Instalar o Service Worker e cachear os recursos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(URLS_TO_CACHE))
    );
});

// Interceptar requisições e servir do cache se offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

// Sincronizar os dados de rastreamento offline quando a conexão for restabelecida
self.addEventListener('sync', event => {
    if (event.tag === 'sync-tracking-data') {
        event.waitUntil(syncTrackingData());
    }
});

// Função para abrir ou criar o banco IndexedDB
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('trackingDataDB', 1);
        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('trackingData')) {
                db.createObjectStore('trackingData', { autoIncrement: true });
            }
        };
        request.onsuccess = function (event) {
            resolve(event.target.result);
        };
        request.onerror = function (event) {
            reject(event.target.errorCode);
        };
    });
}

// Função para sincronizar os dados armazenados localmente com o servidor
function syncTrackingData() {
    return openDatabase().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['trackingData'], 'readwrite');
            const store = transaction.objectStore('trackingData');
            const allRecords = store.getAll();
            allRecords.onsuccess = function () {
                const storedData = allRecords.result;
                if (storedData.length === 0) {
                    return resolve(); // Sem dados para sincronizar
                }

                // Enviar os dados armazenados para o servidor
                storedData.forEach((data, index) => {
                    fetch('/api/save_coordinates.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `nome=${data.nome}&latitude=${data.latitude}&longitude=${data.longitude}&timestamp=${data.timestamp}`
                    })
                        .then(response => {
                            if (response.ok) {
                                // Remover os dados sincronizados do IndexedDB
                                const deleteTransaction = db.transaction(['trackingData'], 'readwrite');
                                const deleteStore = deleteTransaction.objectStore('trackingData');
                                deleteStore.delete(index);
                            }
                        })
                        .catch(error => console.error('Erro ao sincronizar dados:', error));
                });

                resolve();
            };
        });
    });
}
