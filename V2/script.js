$(document).ready(function() {
    // Estado global para controlar o que está atualmente visível
    window.currentVisibleSection = null;
    
    // Chave da API do Google Maps - SUBSTITUA PELA SUA CHAVE
    const apiKey = 'AIzaSyBYvQ3-klK4PRfJPpTH0lNlG1z7AaShPVA';
    
    // Carregar o arquivo GeoJSON assim que a página carregar
    let healthFacilities = [];
    
    $.ajax({
        url: "hospitais.geojson",
        dataType: "json",
        success: function(data) {
            healthFacilities = data.features || [];
            console.log("GeoJSON carregado com sucesso:", healthFacilities.length + " instalações encontradas");
        },
        error: function(xhr, status, error) {
            console.error("Erro ao carregar o GeoJSON:", error);
            // Carregar dados de exemplo em caso de erro
            healthFacilities = createSampleData();
            console.log("Usando dados de exemplo:", healthFacilities.length + " instalações de exemplo carregadas");
        }
    });
    
    // Função para criar dados de exemplo caso o GeoJSON não carregue
    function createSampleData() {
        return [
            {
                type: "Feature",
                properties: {
                    name: "Hospital São João",
                    amenity: "hospital",
                    healthcare: "hospital"
                },
                geometry: {
                    type: "Point",
                    coordinates: [-8.6015, 41.1830]
                }
            },
            {
                type: "Feature",
                properties: {
                    name: "Hospital Santo António",
                    amenity: "hospital",
                    healthcare: "hospital"
                },
                geometry: {
                    type: "Point",
                    coordinates: [-8.6245, 41.1466]
                }
            },
            {
                type: "Feature",
                properties: {
                    name: "Hospital Pedro Hispano",
                    amenity: "hospital",
                    healthcare: "hospital"
                },
                geometry: {
                    type: "Point",
                    coordinates: [-8.6634, 41.1822]
                }
            },
            {
                type: "Feature",
                properties: {
                    name: "Farmácia Sá da Bandeira",
                    amenity: "pharmacy",
                    healthcare: "pharmacy"
                },
                geometry: {
                    type: "Point",
                    coordinates: [-8.6098, 41.1469]
                }
            },
            {
                type: "Feature",
                properties: {
                    name: "Farmácia Clérigos",
                    amenity: "pharmacy",
                    healthcare: "pharmacy"
                },
                geometry: {
                    type: "Point",
                    coordinates: [-8.6154, 41.1457]
                }
            }
        ];
    }
    
    // Configurar o evento de clique no botão de localização
    $(document).on('click', '.location-button-custom', function(e) {
        e.preventDefault();
        obterLocalizacaoUsuario();
    });
    
    // Evento de clique no botão de hospitais
    $(document).on('click', '#hospitals-btn', function(e) {
        e.preventDefault();
        
        // Se a seção de hospitais já estiver visível (aberta)
        if (window.currentVisibleSection === 'hospitals') {
            // Muda o ícone para "+"
            $(this).find('i.fas').removeClass('fa-minus-circle').addClass('fa-plus-circle');
            // Fecha a listagem
            $('#hospitals-list-container').slideUp(400, function() {
                $(this).remove();
            });
            // Atualiza o estado
            window.currentVisibleSection = null;
        } else {
            // Resetar todos os ícones para "+"
            $('.option-button-custom i.fas').removeClass('fa-minus-circle').addClass('fa-plus-circle');
            // Mudar apenas este botão para "-"
            $(this).find('i.fas').removeClass('fa-plus-circle').addClass('fa-minus-circle');
            
            // Remover qualquer container existente
            $('#hospitals-list-container, #pharmacies-list-container').remove();
            
            // Verifica se temos a localização do usuário
            if (window.userLatitude && window.userLongitude) {
                mostrarInstalacoesMaisProximas('hospital');
            } else {
                // Se não temos localização, primeiro obtemos ela
                obterLocalizacaoUsuario(function() {
                    mostrarInstalacoesMaisProximas('hospital');
                });
            }
            
            // Atualizar estado
            window.currentVisibleSection = 'hospitals';
        }
    });
    
    // Evento de clique no botão de farmácias
    $(document).on('click', '#pharmacies-btn', function(e) {
        e.preventDefault();
        
        // Se a seção de farmácias já estiver visível (aberta)
        if (window.currentVisibleSection === 'pharmacies') {
            // Muda o ícone para "+"
            $(this).find('i.fas').removeClass('fa-minus-circle').addClass('fa-plus-circle');
            // Fecha a listagem
            $('#pharmacies-list-container').slideUp(400, function() {
                $(this).remove();
            });
            // Atualiza o estado
            window.currentVisibleSection = null;
        } else {
            // Resetar todos os ícones para "+"
            $('.option-button-custom i.fas').removeClass('fa-minus-circle').addClass('fa-plus-circle');
            // Mudar apenas este botão para "-"
            $(this).find('i.fas').removeClass('fa-plus-circle').addClass('fa-minus-circle');
            
            // Remover qualquer container existente
            $('#hospitals-list-container, #pharmacies-list-container').remove();
            
            // Verifica se temos a localização do usuário
            if (window.userLatitude && window.userLongitude) {
                mostrarInstalacoesMaisProximas('pharmacy');
            } else {
                // Se não temos localização, primeiro obtemos ela
                obterLocalizacaoUsuario(function() {
                    mostrarInstalacoesMaisProximas('pharmacy');
                });
            }
            
            // Atualizar estado
            window.currentVisibleSection = 'pharmacies';
        }
    });
    
    // Função para obter a localização do usuário
    function obterLocalizacaoUsuario(callback) {
        if (navigator.geolocation) {
            $("#location-display").text("Obtendo sua localização...");
            
            navigator.geolocation.getCurrentPosition(
                function(posicao) {
                    // Sucesso ao obter a localização
                    let latitude = posicao.coords.latitude;
                    let longitude = posicao.coords.longitude;
                    
                    // Armazenar as coordenadas para uso posterior
                    window.userLatitude = latitude;
                    window.userLongitude = longitude;
                    
                    // Obter o endereço a partir das coordenadas
                    obterEnderecoUsuario(latitude, longitude);
                    
                    // Se foi fornecido um callback, execute-o agora
                    if (typeof callback === 'function') {
                        callback();
                    }
                },
                function(erro) {
                    // Erro ao obter a localização
                    let mensagemErro;
                    
                    switch(erro.code) {
                        case erro.PERMISSION_DENIED:
                            mensagemErro = "Acesso à localização negado.";
                            break;
                        case erro.POSITION_UNAVAILABLE:
                            mensagemErro = "Localização indisponível.";
                            break;
                        case erro.TIMEOUT:
                            mensagemErro = "Tempo esgotado ao obter localização.";
                            break;
                        default:
                            mensagemErro = "Erro desconhecido.";
                    }
                    
                    $("#location-display").text(mensagemErro);
                    alert("Não foi possível obter sua localização: " + mensagemErro);
                },
                { 
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            $("#location-display").text("Geolocalização não suportada");
            alert("Seu navegador não suporta geolocalização.");
        }
    }
    
    // Função para obter o endereço a partir das coordenadas
    function obterEnderecoUsuario(latitude, longitude) {
        // Usando OpenStreetMap Nominatim para geocoding reverso
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
            success: function(resposta) {
                var enderecoCompleto = resposta.display_name || "Endereço não encontrado";
                var enderecoSimplificado = enderecoCompleto;

                // Extrair apenas rua, freguesia e concelho, se disponíveis
                if (resposta.address) {
                    var partes = [];
                    
                    // Rua e número
                    if (resposta.address.road) {
                        var rua = resposta.address.road;
                        if (resposta.address.house_number) {
                            rua += " " + resposta.address.house_number;
                        }
                        partes.push(rua);
                    }
                    
                    // Código Postal
                    if (resposta.address.postcode) {
                        partes.push(resposta.address.postcode);
                    }
                    
                    // Freguesia
                    if (resposta.address.suburb) {
                        partes.push(resposta.address.suburb);
                    } else if (resposta.address.neighbourhood) {
                        partes.push(resposta.address.neighbourhood);
                    }
                    
                    // Concelho
                    if (resposta.address.city) {
                        partes.push(resposta.address.city);
                    } else if (resposta.address.town) {
                        partes.push(resposta.address.town);
                    }
                    
                    // Se temos partes específicas, use-as
                    if (partes.length > 0) {
                        enderecoSimplificado = partes.join(", ");
                    }
                }
                
                // Atualizar o texto de localização
                $("#location-display").text(enderecoSimplificado).addClass('localizacao-obtida');
                $("#list-location-display").text(enderecoSimplificado);
            },
            error: function() {
                $("#location-display").text("Não foi possível obter o endereço");
            }
        });
    }
    
    // NOVA FUNÇÃO: Calcular distância e tempo usando Google Distance Matrix API
    function calcularDistanciaETempoGoogle(originLat, originLng, destLat, destLng) {
        return new Promise((resolve, reject) => {
            // Se a API do Google Maps não estiver disponível, usar o cálculo de Haversine
            if (typeof google === 'undefined' || !google.maps || !google.maps.DistanceMatrixService) {
                console.warn('API do Google Maps não disponível, usando cálculo simples.');
                const distanciaKm = calcularDistanciaHaversine(originLat, originLng, destLat, destLng);
                // Estimativa simples: considerar velocidade média de 30km/h
                const tempoEstimadoMin = Math.round(distanciaKm * 2); // 2 minutos por km (velocidade 30km/h)
                resolve({
                    distancia: distanciaKm,
                    distanciaTexto: distanciaKm.toFixed(1) + " km",
                    duracao: tempoEstimadoMin,
                    duracaoTexto: tempoEstimadoMin + " min",
                    usandoApiFallback: true
                });
                return;
            }
            
            // Configurar origem e destino
            const origin = new google.maps.LatLng(originLat, originLng);
            const destination = new google.maps.LatLng(destLat, destLng);
            
            // Criar o serviço Distance Matrix
            const service = new google.maps.DistanceMatrixService();
            
            // Configurar os parâmetros da requisição
            const request = {
                origins: [origin],
                destinations: [destination],
                travelMode: google.maps.TravelMode.DRIVING, // Modo de viagem (DRIVING, WALKING, etc.)
                unitSystem: google.maps.UnitSystem.METRIC,
                avoidHighways: false,
                avoidTolls: false,
                drivingOptions: {
                    departureTime: new Date(), // Viagem agora
                    trafficModel: google.maps.TrafficModel.BEST_GUESS // Considerar tráfego
                }
            };
            
            // Fazer a requisição à API
            service.getDistanceMatrix(request, function(response, status) {
                if (status === google.maps.DistanceMatrixStatus.OK) {
                    if (response.rows[0].elements[0].status === google.maps.DistanceMatrixElementStatus.OK) {
                        const distancia = response.rows[0].elements[0].distance;
                        const duracao = response.rows[0].elements[0].duration;
                        const duracaoNoTransito = response.rows[0].elements[0].duration_in_traffic;
                        
                        resolve({
                            distancia: distancia.value / 1000, // Converter metros para km
                            distanciaTexto: distancia.text,
                            duracao: Math.round(duracao.value / 60), // Converter segundos para minutos
                            duracaoTexto: duracao.text,
                            duracaoNoTransito: duracaoNoTransito ? Math.round(duracaoNoTransito.value / 60) : null,
                            duracaoNoTransitoTexto: duracaoNoTransito ? duracaoNoTransito.text : null
                        });
                    } else {
                        // Fallback para cálculo de Haversine se não for possível calcular a rota
                        console.warn('Não foi possível calcular a rota, usando cálculo simples.');
                        const distanciaKm = calcularDistanciaHaversine(originLat, originLng, destLat, destLng);
                        const tempoEstimadoMin = Math.round(distanciaKm * 2); // estimativa aproximada
                        resolve({
                            distancia: distanciaKm,
                            distanciaTexto: distanciaKm.toFixed(1) + " km",
                            duracao: tempoEstimadoMin, 
                            duracaoTexto: tempoEstimadoMin + " min",
                            usandoApiFallback: true
                        });
                    }
                } else {
                    console.error('Erro na Distance Matrix API:', status);
                    // Fallback para cálculo simples em caso de erro
                    const distanciaKm = calcularDistanciaHaversine(originLat, originLng, destLat, destLng);
                    const tempoEstimadoMin = Math.round(distanciaKm * 2);
                    resolve({
                        distancia: distanciaKm,
                        distanciaTexto: distanciaKm.toFixed(1) + " km",
                        duracao: tempoEstimadoMin,
                        duracaoTexto: tempoEstimadoMin + " min",
                        usandoApiFallback: true
                    });
                }
            });
        });
    }
    
    // Mantemos a função original como fallback e renomeamos para ser mais específica
    function calcularDistanciaHaversine(lat1, lon1, lat2, lon2) {
        const R = 6371; // Raio da Terra em km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distancia = R * c; // Distância em km
        return distancia;
    }
    
    // Função para mostrar as instalações mais próximas (hospitais ou farmácias)
    async function mostrarInstalacoesMaisProximas(tipo) {
        // Verifica se temos a localização do usuário e os dados das instalações
        if (!window.userLatitude || !window.userLongitude || !healthFacilities.length) {
            alert(`Não foi possível encontrar ${tipo === 'hospital' ? 'hospitais' : 'farmácias'} próximos. Verifique sua localização.`);
            return;
        }
        
        // Filtrar as instalações pelo tipo
        let instalacoesFiltradas = healthFacilities.filter(feature => {
            if (tipo === 'hospital') {
                return feature.properties.amenity === 'hospital' || 
                       feature.properties.healthcare === 'hospital';
            } else if (tipo === 'pharmacy') {
                return feature.properties.amenity === 'pharmacy' || 
                       feature.properties.healthcare === 'pharmacy';
            }
            return false;
        });
        
        // Se não houver instalações do tipo especificado, mostrar mensagem
        if (instalacoesFiltradas.length === 0) {
            alert(`Não foram encontrados ${tipo === 'hospital' ? 'hospitais' : 'farmácias'} nos dados.`);
            // Usar dados de exemplo se não houver dados reais
            instalacoesFiltradas = createSampleData().filter(feature => {
                if (tipo === 'hospital') {
                    return feature.properties.amenity === 'hospital' || feature.properties.healthcare === 'hospital';
                } else if (tipo === 'pharmacy') {
                    return feature.properties.amenity === 'pharmacy' || feature.properties.healthcare === 'pharmacy';
                }
                return false;
            });
        }
        
        // Criar contêiner para a lista com ID específico
        let containerId = tipo === 'hospital' ? 'hospitals-list-container' : 'pharmacies-list-container';
        let containerHTML = `<div id="${containerId}" style="display:none;"><div class="loading-animation"><i class="fas fa-spinner"></i> Calculando distâncias e tempos...</div></div>`;
        
        // IMPORTANTE: Inserir a lista na posição correta
        if (tipo === 'hospital') {
            // Inserir após o botão de hospitais
            $('#hospitals-btn').after(containerHTML);
        } else {
            // Inserir após o botão de farmácias
            $('#pharmacies-btn').after(containerHTML);
        }
        
        // Mostrar container com animação
        $(`#${containerId}`).hide().slideDown(500);
        
        // Array para armazenar promessas de cálculo de distância/tempo
        const promessas = [];
        
        // Para cada instalação, iniciamos o cálculo de distância e tempo
        instalacoesFiltradas.forEach(feature => {
            const coords = feature.geometry.coordinates;
            // Adicionar promessa ao array
            promessas.push(
                calcularDistanciaETempoGoogle(
                    window.userLatitude, 
                    window.userLongitude, 
                    coords[1], // latitude do ponto
                    coords[0]  // longitude do ponto
                ).then(resultado => {
                    // Adicionar resultados ao objeto feature
                    feature.distance = resultado.distancia;
                    feature.distanceText = resultado.distanciaTexto;
                    feature.duration = resultado.duracao;
                    feature.durationText = resultado.duracaoTexto;
                    feature.usedFallback = resultado.usandoApiFallback || false;
                    return feature;
                })
            );
        });
        
        // Aguardar que todos os cálculos sejam concluídos
        try {
            const resultados = await Promise.all(promessas);
            
            // Ordenar por tempo (ou distância se o tempo não estiver disponível)
            resultados.sort((a, b) => {
                if (a.duration && b.duration) {
                    return a.duration - b.duration;
                } else {
                    return a.distance - b.distance;
                }
            });
            
            // Pegar as 5 mais próximas (ou menos se não houver 5)
            const numInstalacoes = Math.min(5, resultados.length);
            const instalacoesMaisProximas = resultados.slice(0, numInstalacoes);
            
            // Limpar o conteúdo de carregamento
            $(`#${containerId}`).empty();
            
            // Adicionar cada instalação à lista HTML
            instalacoesMaisProximas.forEach((feature, index) => {
                const nome = feature.properties.name || `${tipo === 'hospital' ? 'Hospital' : 'Farmácia'} sem nome`;
                const coords = feature.geometry.coordinates;
                
                // Texto para mostrar distância e tempo
                let infoTexto;
                if (feature.usedFallback) {
                    infoTexto = `${feature.distanceText} (aprox. ${feature.durationText})`;
                } else {
                    infoTexto = `${feature.distanceText} (${feature.durationText})`;
                }
                
                // Armazenar as coordenadas como atributos data- para uso no evento de clique
                const itemHTML = `
                    <div class="hospital-item" data-lat="${coords[1]}" data-lon="${coords[0]}" data-name="${nome}">
                        <div class="hospital-name">${nome} <span class="distance-time-info">${infoTexto}</span></div>
                        <div class="add-button">
                            <i class="fas fa-plus"></i>
                        </div>
                    </div>
                `;
                
                $(`#${containerId}`).append(itemHTML);
            });
            
            // Adicionar evento de clique aos itens da lista para abrir o Google Maps
            $('.hospital-item').on("click", function() {
                // Obter as coordenadas do destino e o nome
                const lat = $(this).data('lat');
                const lon = $(this).data('lon');
                const nome = $(this).data('name');
                
                // Abrir o Google Maps com o trajeto da localização do usuário para o destino
                if (window.userLatitude && window.userLongitude) {
                    // Construir a URL do Google Maps com os parâmetros para direções
                    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${window.userLatitude},${window.userLongitude}&destination=${lat},${lon}&travelmode=driving`;
                    
                    // Abrir em uma nova janela/aba
                    window.open(mapsUrl, '_blank');
                } else {
                    // Se não temos a localização do usuário, abrir apenas a localização do destino
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
                    window.open(mapsUrl, '_blank');
                }
            });
            
            // Adicionar evento aos botões de adicionar aos favoritos
            $('.add-button').on("click", function(e) {
                e.stopPropagation(); // Impedir que o clique se propague para o item pai
                const nome = $(this).siblings(".hospital-name").text();
                alert(`${nome} adicionado aos favoritos`);
            });
            
        } catch (erro) {
            console.error("Erro ao calcular distâncias:", erro);
            $(`#${containerId}`).html(`<div class="error-message">Erro ao calcular distâncias e tempos. Por favor, tente novamente.</div>`);
        }
    }
});
