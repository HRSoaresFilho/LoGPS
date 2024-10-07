const CACHE_NAME = 'gps-tracker-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/app.js', // Corrigir para o script correto
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css', // O link de Bootstrap
];

// Instalando o Service Worker e cacheando os arquivos necessários
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Intercepta as requisições de rede
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Se o recurso está no cache, retorna o cache
                if (response) {
                    return response;
                }
                // Se o recurso não está no cache, faz a requisição de rede
                return fetch(event.request).then(networkResponse => {
                    // Clona a resposta da rede e a adiciona ao cache dinamicamente
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            }).catch(() => {
                // Pode incluir um fallback offline aqui, se desejar
                return caches.match('/index.html');
            })
    );
});

// Atualiza o cache e remove caches antigos
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
