$(document).ready(function() {
    // Estado global para controlar o que está atualmente visível
    window.currentVisibleSection = null;
    
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
    
    // Função para calcular a distância entre dois pontos (fórmula de Haversine)
    function calcularDistancia(lat1, lon1, lat2, lon2) {
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
    function mostrarInstalacoesMaisProximas(tipo) {
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
        
        // Calcular a distância de cada instalação até a localização do usuário
        instalacoesFiltradas.forEach(feature => {
            const coords = feature.geometry.coordinates;
            feature.distance = calcularDistancia(
                window.userLatitude, 
                window.userLongitude, 
                coords[1], // latitude do ponto
                coords[0]  // longitude do ponto
            );
        });
        
        // Ordenar por distância
        instalacoesFiltradas.sort((a, b) => a.distance - b.distance);
        
        // Pegar as 5 mais próximas (ou menos se não houver 5)
        const numInstalacoes = Math.min(5, instalacoesFiltradas.length);
        const instalacoesMaisProximas = instalacoesFiltradas.slice(0, numInstalacoes);
        
        // Criar contêiner para a lista com ID específico
        let containerId = tipo === 'hospital' ? 'hospitals-list-container' : 'pharmacies-list-container';
        let listaHTML = `<div id="${containerId}" style="display:none;">`;
        
        // Adicionar cada instalação à lista HTML
        instalacoesMaisProximas.forEach((feature, index) => {
            const nome = feature.properties.name || `${tipo === 'hospital' ? 'Hospital' : 'Farmácia'} sem nome`;
            const distancia = feature.distance.toFixed(1);
            const coords = feature.geometry.coordinates;
            
            // Armazenar as coordenadas como atributos data- para uso no evento de clique
            listaHTML += `
                <div class="hospital-item" data-lat="${coords[1]}" data-lon="${coords[0]}" data-name="${nome}">
                    <div class="hospital-name">${nome} (${distancia} km)</div>
                    <div class="add-button">
                        <i class="fas fa-plus"></i>
                    </div>
                </div>
            `;
        });
        
        // Fechar a div do container
        listaHTML += `</div>`;
        
        // IMPORTANTE: Inserir a lista na posição correta
        if (tipo === 'hospital') {
            // Inserir após o botão de hospitais
            $('#hospitals-btn').after(listaHTML);
        } else {
            // Inserir após o botão de farmácias
            $('#pharmacies-btn').after(listaHTML);
        }
        
        // Mostrar com animação
        $(`#${containerId}`).hide().slideDown(500);
        
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
    }
});
