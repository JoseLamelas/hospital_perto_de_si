// Estado global da aplicação
window.appState = {
    currentVisibleSection: null,
    userLocation: {
        latitude: null,
        longitude: null
    },
    favoritos: JSON.parse(localStorage.getItem('favoritos')) || [],
    healthFacilities: []
};

// Configuração da API do Google Maps
const GOOGLE_MAPS_API_KEY = 'AIzaSyCWaR3AnCuwhfRtPyAGS_DUyfVKCBxuWy4';


// ADICIONAR AQUI AS CONFIGURAÇÕES DOS ESTABELECIMENTOS
const FACILITY_CONFIGS = {
    hospitals: {
        radius: 20,        // 20km para hospitais
        maxResults: 5,     // Máximo 5 resultados
        apiLimit: 10       // Máximo 10 para API
    },
    pharmacies: {
        radius: 5,         // 5km para farmácias
        maxResults: 5,     // Máximo 8 resultados
        apiLimit: 15       // Máximo 15 para API
    }
};

// Configurações do jQuery Mobile
$(document).on('mobileinit', function(){
    // Configurações específicas
    $.mobile.defaultPageTransition = 'fade';
    $.mobile.pushStateEnabled = true;
    $.mobile.hashListeningEnabled = true;
});

// Inicialização da aplicação
$(document).ready(function() {
    console.log('Aplicação iniciando...');
    initializeApp();
});

// Função principal de inicialização
function initializeApp() {
    verifyGoogleMapsAPI();
    loadHealthFacilities();
    setupEventHandlers();
    setupNavigation();
    loadFavorites();
}

// Configurar navegação do jQuery Mobile
function setupNavigation() {
    // Atualizar navegação quando mudamos de página
    $(document).on('pagebeforeshow', function(event, data) {
        const pageId = $(event.target).attr('id');
        console.log('Mudança de página:', pageId);
        updateActiveNav(pageId);
        
        // Executar ações específicas da página
        onPageShow(pageId);
    });
    
    // Custom event handler para navegação
    $('.nav-item').on('vclick', function(e) {
        e.preventDefault();
        
        const href = $(this).attr('href');
        console.log('Navegação clicada:', href);
        
        if (href && href !== '#') {
            $.mobile.changePage(href, {
                transition: 'fade',
                changeHash: true
            });
        }
        
        return false;
    });
}

// Ações específicas quando página é mostrada
function onPageShow(pageId) {
    switch(pageId) {
        case 'favorites-page':
            updateFavoritesList();
            break;
        case 'contacts-page':
            // Página de contactos já tem conteúdo estático
            break;
        case 'guide-page':
            // Página de guia já tem conteúdo estático
            break;
        case 'home-page':
            // Página inicial
            break;
    }
}

// Atualizar navegação ativa
function updateActiveNav(pageId) {
    console.log('Atualizando navegação ativa para:', pageId);
    
    // Use delay para garantir que jQuery Mobile processou
    setTimeout(function() {
        // Reset: Remove active de TODOS primeiro
        $('.nav-item-circle').removeClass('active');
        $('.nav-item').removeClass('active');
        
        // Reset CSS de TODOS os botões
        $('.circle-bg').css('background', 'transparent');
        $('.nav-item-circle svg').css('stroke', '#858EA9');
        
        const navMap = {
            'home-page': 'nav-home',
            'favorites-page': 'nav-favorites',
            'guide-page': 'nav-guide',
            'contacts-page': 'nav-contacts'
        };
        
        const navId = navMap[pageId];
        if (navId) {
            // Aplica active apenas no botão correto
            $('#' + navId).addClass('active');
            $('#' + navId + ' .nav-item-circle').addClass('active');
            
            // Aplica CSS apenas no botão correto
            $('#' + navId + ' .circle-bg').css('background', '#0EBE7E');
            $('#' + navId + ' svg').css('stroke', 'white');
            
            console.log('Navegação ativa:', navId);
        }
    }, 100);
 }

 $(document).on('pageshow', function(event) {
    const pageId = $(event.target).attr('id');
    updateActiveNav(pageId);
});

// Verificar se a API do Google Maps foi carregada
function verifyGoogleMapsAPI() {
    if (typeof google === 'undefined' || !google.maps) {
        console.error("ERRO: API do Google Maps não foi carregada!");
        showToast("A API do Google Maps não foi carregada. Algumas funções podem não funcionar.", 'error');
    } else {
        console.log("API do Google Maps carregada com sucesso!");
    }
}

// Carregar dados de instalações de saúde
function loadHealthFacilities() {
    $.ajax({
        url: "hospitais.geojson",
        dataType: "json",
        success: function(data) {
            window.appState.healthFacilities = data.features || [];
            console.log("GeoJSON carregado:", window.appState.healthFacilities.length + " instalações");
        },
        error: function(xhr, status, error) {
            console.error("Erro ao carregar GeoJSON:", error);
            window.appState.healthFacilities = createSampleData();
            console.log("Usando dados de exemplo:", window.appState.healthFacilities.length + " instalações");
            showToast("Dados de demonstração carregados", 'info');
        }
    });
}

// Configurar event handlers
function setupEventHandlers() {
    // Localização
    $(document).on('vclick', '.location-button-custom', function(e) {
        e.preventDefault();
        getUserLocation();
    });
    
    // Hospitais
    $(document).on('vclick', '#hospitals-btn', function(e) {
        e.preventDefault();
        toggleFacilityList('hospitals');
    });
    
    // Farmácias
    $(document).on('vclick', '#pharmacies-btn', function(e) {
        e.preventDefault();
        toggleFacilityList('pharmacies');
    });
    
    // Favoritos
    $(document).on('vclick', '.add-button', function(e) {
        e.preventDefault();
        e.stopPropagation();
        addToFavorites($(this));
    });
    
    $(document).on('vclick', '.remove-favorite-button', function(e) {
        e.preventDefault();
        e.stopPropagation();
        removeFromFavorites($(this));
    });
    
    // Navegação de facilities
    $(document).on('vclick', '.hospital-item', function(e) {
        // Verificar se o clique foi no botão
        if ($(e.target).closest('.add-button, .remove-favorite-button').length) {
            return;
        }
        e.preventDefault();
        openInGoogleMaps($(this));
    });
}

// Obter localização do usuário
function getUserLocation(callback) {
    if (!navigator.geolocation) {
        showToast("O seu browser não suporta geolocalização", 'error');
        return;
    }
    
    $("#location-display").text("A obter a sua localização...");
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const { latitude, longitude } = position.coords;
            
            // Armazenar localização
            window.appState.userLocation.latitude = latitude;
            window.appState.userLocation.longitude = longitude;
            
            // Obter endereço
            getUserAddress(latitude, longitude);
            
            // Executar callback se fornecido
            if (typeof callback === 'function') {
                callback();
            }
        },
        function(error) {
            const errorMessages = {
                [error.PERMISSION_DENIED]: "Acesso à localização negado",
                [error.POSITION_UNAVAILABLE]: "Localização indisponível",
                [error.TIMEOUT]: "Tempo esgotado",
                default: "Erro desconhecido"
            };
            
            const message = errorMessages[error.code] || errorMessages.default;
            $("#location-display").text(message);
            showToast(message, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Obter endereço a partir das coordenadas
function getUserAddress(latitude, longitude) {
    $.ajax({
        url: "https://nominatim.openstreetmap.org/reverse",
        method: "GET",
        data: {
            format: "json",
            lat: latitude,
            lon: longitude,
            zoom: 18,
            addressdetails: 1,
            "accept-language": "pt-PT"
        },
        success: function(response) {
            const address = formatAddress(response);
            $("#location-display").text(address).addClass('localizacao-obtida');
        },
        error: function() {
            $("#location-display").text("Endereço não disponível");
        }
    });
}

// Formatar endereço
function formatAddress(response) {
    if (!response.address) {
        return response.display_name || "Endereço não encontrado";
    }
    
    const parts = [];
    
    // Rua e número
    if (response.address.road) {
        let street = response.address.road;
        if (response.address.house_number) {
            street += " " + response.address.house_number;
        }
        parts.push(street);
    }
    
    // Código postal
    if (response.address.postcode) {
        parts.push(response.address.postcode);
    }
    
    // Freguesia
    if (response.address.suburb || response.address.neighbourhood) {
        parts.push(response.address.suburb || response.address.neighbourhood);
    }
    
    // Concelho
    if (response.address.city || response.address.town) {
        parts.push(response.address.city || response.address.town);
    }
    
    return parts.length > 0 ? parts.join(", ") : response.display_name;
}

// Toggle de lista de instalações
function toggleFacilityList(type) {
    const buttonId = type === 'hospitals' ? '#hospitals-btn' : '#pharmacies-btn';
    const containerId = type === 'hospitals' ? '#hospitals-list-container' : '#pharmacies-list-container';
    const otherContainerId = type === 'hospitals' ? '#pharmacies-list-container' : '#hospitals-list-container';
    
    // Reset todos os ícones para "+"
    $('.option-button-custom i.fas').removeClass('fa-minus-circle').addClass('fa-plus-circle');
    
    // Se já estiver aberto, fechar
    if (window.appState.currentVisibleSection === type) {
        $(containerId).slideUp(400, function() {
            $(this).remove();
        });
        window.appState.currentVisibleSection = null;
        return;
    }
    
    // Atualizar ícone do botão atual
    $(buttonId).find('i.fas').removeClass('fa-plus-circle').addClass('fa-minus-circle');
    
    // Remover qualquer container existente
    $(otherContainerId).remove();
    
    // Verifica localização e mostra instalações
    if (window.appState.userLocation.latitude && window.appState.userLocation.longitude) {
        showNearbyFacilities(type);
    } else {
        getUserLocation(function() {
            showNearbyFacilities(type);
        });
    }
    
    window.appState.currentVisibleSection = type;
}

// Mostrar instalações próximas
async function showNearbyFacilities(type) {
    const config = FACILITY_CONFIGS[type];
    const facilityType = type === 'hospitals' ? 'hospital' : 'pharmacy';
    const containerId = type === 'hospitals' ? 'hospitals-list-container' : 'pharmacies-list-container';
    const buttonId = type === 'hospitals' ? '#hospitals-btn' : '#pharmacies-btn';
    
    // Filtrar instalações por tipo
    let facilities = window.appState.healthFacilities.filter(feature => {
        return feature.properties.amenity === facilityType || 
               feature.properties.healthcare === facilityType;
    });
    
    if (facilities.length === 0) {
        facilities = createSampleData().filter(feature => {
            return feature.properties.amenity === facilityType || 
                   feature.properties.healthcare === facilityType;
        });
    }
    
    // Filtrar por raio específico
    if (window.appState.userLocation.latitude && window.appState.userLocation.longitude) {
        facilities = filterByRadius(
            facilities, 
            window.appState.userLocation.latitude, 
            window.appState.userLocation.longitude, 
            config.radius // Raio específico
        );
        
        if (facilities.length === 0) {
            const facilityName = type === 'hospitals' ? 'hospital' : 'farmácia';
            showToast(`Nenhum ${facilityName} encontrado num raio de ${config.radius}km`, 'info');
            return;
        }
    }
    
    // Limitar resultados para API
    const limitedFacilities = facilities.slice(0, config.apiLimit);
    
    // Criar container
    const containerHTML = `<div id="${containerId}" style="display:none;">
        <div class="loading-animation">
            <i class="fas fa-spinner"></i> A calcular as distâncias...
        </div>
    </div>`;
    
    $(buttonId).after(containerHTML);
    $(`#${containerId}`).slideDown(500);
    
    try {
        // Calcular distâncias precisas
        const facilitiesWithDistance = await calculateDistancesToFacilities(limitedFacilities);
        
        // Ordenar por tempo ou distância
        facilitiesWithDistance.sort((a, b) => {
            return (a.duration || a.distance) - (b.duration || b.distance);
        });
        
        // Mostrar número específico de resultados
        const topFacilities = facilitiesWithDistance.slice(0, config.maxResults);
        displayFacilitiesList(topFacilities, containerId, type);
        
    } catch (error) {
        console.error("Erro ao calcular distâncias:", error);
        
        // Se falhar o cálculo, mostrar mesmo assim sem distâncias
        const headerText = type === 'hospitals' ? 'Hospitais' : 'Farmácias';
        let html = `
            <div class="hospitals-header">
                <i class="fas fa-minus-circle circle-icon"></i>
                <span>${headerText} (até ${config.radius}km)</span>
                <i class="fas fa-minus-circle circle-icon"></i>
            </div>
        `;
        
        // Mostrar número específico de instalações sem cálculo de distância
        limitedFacilities.slice(0, config.maxResults).forEach((facility) => {
            const name = facility.properties.name || `${headerText.slice(0, -1)} sem nome`;
            const coords = facility.geometry.coordinates;
            
            html += `
                <div class="hospital-item" data-lat="${coords[1]}" data-lon="${coords[0]}" data-name="${name}" data-type="${type}">
                    <div class="hospital-name">
                        ${name}
                    </div>
                    <div class="add-button">
                        <i class="fas fa-heart"></i>
                    </div>
                </div>
            `;
        });
        
        $(`#${containerId}`).html(html);
    }
}

// Calcular distâncias para instalações
async function calculateDistancesToFacilities(facilities) {
    const userLat = window.appState.userLocation.latitude;
    const userLng = window.appState.userLocation.longitude;
    
    const promises = facilities.map(async (facility) => {
        const destLat = facility.geometry.coordinates[1];
        const destLng = facility.geometry.coordinates[0];
        
        const result = await calculateDistanceAndTime(userLat, userLng, destLat, destLng);
        
        return {
            ...facility,
            distance: result.distance,
            distanceText: result.distanceText,
            duration: result.duration,
            durationText: result.durationText,
            usedFallback: result.usedFallback
        };
    });
    
    return Promise.all(promises);
}

// Calcular distância e tempo usando Google Distance Matrix API
function calculateDistanceAndTime(originLat, originLng, destLat, destLng) {
    return new Promise((resolve) => {
        // Verificar disponibilidade da API
        if (typeof google === 'undefined' || !google.maps || !google.maps.DistanceMatrixService) {
            // Fallback para cálculo simples
            const distance = calculateHaversineDistance(originLat, originLng, destLat, destLng);
            const duration = Math.round(distance * 2); // Estimativa simples
            
            resolve({
                distance: distance,
                distanceText: distance.toFixed(1) + " km",
                duration: duration,
                durationText: duration + " min",
                usedFallback: true
            });
            return;
        }
        
        try {
            const service = new google.maps.DistanceMatrixService();
            
            service.getDistanceMatrix({
                origins: [{lat: originLat, lng: originLng}],
                destinations: [{lat: destLat, lng: destLng}],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC
            }, function(response, status) {
                if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
                    const element = response.rows[0].elements[0];
                    
                    resolve({
                        distance: element.distance.value / 1000,
                        distanceText: element.distance.text,
                        duration: Math.round(element.duration.value / 60),
                        durationText: element.duration.text,
                        usedFallback: false
                    });
                } else {
                    // Fallback
                    const distance = calculateHaversineDistance(originLat, originLng, destLat, destLng);
                    const duration = Math.round(distance * 2);
                    
                    resolve({
                        distance: distance,
                        distanceText: distance.toFixed(1) + " km",
                        duration: duration,
                        durationText: duration + " min",
                        usedFallback: true
                    });
                }
            });
        } catch (error) {
            // Fallback
            const distance = calculateHaversineDistance(originLat, originLng, destLat, destLng);
            const duration = Math.round(distance * 2);
            
            resolve({
                distance: distance,
                distanceText: distance.toFixed(1) + " km",
                duration: duration,
                durationText: duration + " min",
                usedFallback: true
            });
        }
    });
}

// Cálculo de distância Haversine (fallback)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Filtrar instalações dentro de 20km do usuário
function filterByRadius(facilities, userLat, userLng, radiusKm = 20) {
    return facilities.filter(facility => {
        const distance = calculateHaversineDistance(
            userLat, userLng, 
            facility.geometry.coordinates[1], 
            facility.geometry.coordinates[0]
        );
        return distance <= radiusKm;
    });
}


// Exibir lista de instalações
function displayFacilitiesList(facilities, containerId, type) {
    $(`#${containerId}`).empty();
    
    const config = FACILITY_CONFIGS[type];
    const headerText = type === 'hospitals' ? 'Hospitais' : 'Farmácias';
    
    // Header com informação do raio
    const headerHTML = `
        <div class="hospitals-header">
            <span>${headerText} (até ${config.radius}km)</span>
        </div>
    `;
    $(`#${containerId}`).append(headerHTML);
    
    // Lista de instalações
    facilities.forEach((facility) => {
        const name = facility.properties.name || `${headerText.slice(0, -1)} sem nome`;
        const coords = facility.geometry.coordinates;
        const infoText = facility.usedFallback ? 
            `${facility.distanceText} (aprox. ${facility.durationText})` : 
            `${facility.distanceText} (${facility.durationText})`;
        
        const itemHTML = `
            <div class="hospital-item" data-lat="${coords[1]}" data-lon="${coords[0]}" data-name="${name}" data-type="${type}">
                <div class="hospital-name">
                    ${name}
                    <span class="distance-time-info">${infoText}</span>
                </div>
                <div class="add-button">
                    <i class="fas fa-heart"></i>
                </div>
            </div>
        `;
        
        $(`#${containerId}`).append(itemHTML);
    });
}

// Abrir no Google Maps
function openInGoogleMaps($element) {
    const lat = $element.data('lat');
    const lon = $element.data('lon');
    const name = $element.data('name');
    
    const userLat = window.appState.userLocation.latitude;
    const userLng = window.appState.userLocation.longitude;
    
    let mapsUrl;
    if (userLat && userLng) {
        mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${lat},${lon}&travelmode=driving`;
    } else {
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    }
    
    window.open(mapsUrl, '_blank');
}

// Gestão de favoritos
function addToFavorites($button) {
    const $item = $button.closest('.hospital-item');
    const name = $item.data('name');
    const lat = $item.data('lat');
    const lon = $item.data('lon');
    const type = $item.data('type');
    
    const favorite = {
        name: name,
        lat: lat,
        lon: lon,
        type: type,
        id: `${lat}_${lon}` // ID único baseado em coordenadas
    };
    
    // Verificar se já existe
    const exists = window.appState.favoritos.some(fav => fav.id === favorite.id);
    
    if (!exists) {
        window.appState.favoritos.push(favorite);
        localStorage.setItem('favoritos', JSON.stringify(window.appState.favoritos));
        showToast(`${name} adicionado aos favoritos`, 'success');
        
        // Se estamos na página de favoritos, atualizar a lista
        if ($.mobile.pageContainer.pagecontainer('getActivePage').attr('id') === 'favorites-page') {
            updateFavoritesList();
        }
    } else {
        showToast(`${name} já está nos favoritos`, 'info');
    }
}

function removeFromFavorites($button) {
    const $item = $button.closest('.hospital-item');
    const id = $item.data('id');
    
    window.appState.favoritos = window.appState.favoritos.filter(fav => fav.id !== id);
    localStorage.setItem('favoritos', JSON.stringify(window.appState.favoritos));
    
    showToast('Removido dos favoritos', 'success');
    updateFavoritesList();
}

// Carregar e exibir favoritos
function loadFavorites() {
    // Favoritos são carregados do localStorage na inicialização
    // Nada específico precisa ser feito aqui
}

function updateFavoritesList() {
    const $container = $('#favorites-list-container');
    
    if (window.appState.favoritos.length === 0) {
        $container.html(`
            <div class="no-favorites-message">
                <h3>Ainda não adicionou nenhum favorito</h3>
                <p>Para adicionar favoritos, procure por hospitais ou farmácias na página inicial e toque no botão <i class="fas fa-heart"></i></p>
            </div>
        `);
        return;
    }
    
    let html = '';
    window.appState.favoritos.forEach(favorite => {
        const typeText = favorite.type === 'hospitals' ? '(Hospital)' : '(Farmácia)';
        html += `
            <div class="hospital-item" data-lat="${favorite.lat}" data-lon="${favorite.lon}" data-name="${favorite.name}" data-id="${favorite.id}">
                <div class="hospital-name">
                    ${favorite.name} <span class="facility-type">${typeText}</span>
                </div>
                <div class="remove-favorite-button">
                    <i class="fas fa-times"></i>
                </div>
            </div>
        `;
    });
    
    $container.html(html);
}

// Mostrar notificações
function showToast(message, type = 'info') {
    const toastClass = type === 'error' ? 'error-toast' : 'success-toast';
    const $toast = $(`<div class="${toastClass}">${message}</div>`);
    
    $('body').append($toast);
    
    setTimeout(() => {
        $toast.fadeOut(500, function() {
            $(this).remove();
        });
    }, 3000);
}

// Criar dados de exemplo (fallback)
function createSampleData() {
    return [
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [-8.611, 41.148] // Porto
            },
            properties: {
                name: "Hospital de São João",
                amenity: "hospital"
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [-8.616, 41.150]
            },
            properties: {
                name: "Farmácia Central",
                amenity: "pharmacy"
            }
        },
        // Adicionar mais exemplos...
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [-8.615, 41.147]
            },
            properties: {
                name: "Hospital Santo António",
                amenity: "hospital"
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [-8.612, 41.149]
            },
            properties: {
                name: "Farmácia São João",
                amenity: "pharmacy"
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [-8.610, 41.146]
            },
            properties: {
                name: "Centro Hospitalar do Porto",
                amenity: "hospital"
            }
        }
    ];
}
