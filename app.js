// app.js

$(document).ready(function() {
    // Variáveis globais
    let minhaLatitude;
    let minhaLongitude;
    let hospitaisProximos = [];
    let farmaciasProximas = [];
    let favoritos = obterFavoritosSalvos();
    
    // URL base para os arquivos GeoJSON
    const hospitaisURL = "https://data.humdata.org/dataset/bcebeb98-af93-43c9-a3be-25d1f3df095a/resource/8729407c-10bf-4148-98fe-0386d239c1a4/download_metadata?format=json";
    const farmaciasURL = "https://data.humdata.org/dataset/bcebeb98-af93-43c9-a3be-25d1f3df095a/resource/8729407c-10bf-4148-98fe-0386d239c1a4/download_metadata?format=json";
    
    // Recomendado fazer o download do arquivo, descompactar e hospedar localmente
    // para melhor desempenho. Neste exemplo, vamos usar arquivos locais.
    const hospitaisLocalURL = "data/hospitais.geojson";
    const farmaciasLocalURL = "data/farmacias.geojson";
    
    // Inicialização quando a página home é exibida
$(document).on("pageshow", "#home", function() {
    inicializarAplicacao();
});

// Função de inicialização principal
function inicializarAplicacao() {
    // Obter localização do usuário (primeira vez)
    solicitarLocalizacao();
    
    // Não é necessário configurar o evento de clique aqui se já está definido fora
}
    
    // Inicialização quando a página de favoritos é exibida
    $(document).on("pageshow", "#favoritos", function() {
        atualizarListaFavoritos();
    });
    
        
        // Configurar o botão de atualização de localização
        $("#atualizar-localizacao").on("click", function() {
            solicitarLocalizacao();
        });
    }
    
    // Obtém a localização atual do usuário
    function obterLocalizacaoAtual() {
        if (navigator.geolocation) {
            $("#endereco-atual").text("Obtendo sua localização...");
            
            navigator.geolocation.getCurrentPosition(
                function(posicao) {
                    // Sucesso na obtenção da localização
                    minhaLatitude = posicao.coords.latitude;
                    minhaLongitude = posicao.coords.longitude;
                    
                    // Obter e exibir o endereço baseado nas coordenadas
                    obterEnderecoDoUsuario(minhaLatitude, minhaLongitude);
                    
                    // Buscar hospitais e farmácias próximos
                    buscarHospitaisProximos(minhaLatitude, minhaLongitude);
                    buscarFarmaciasProximas(minhaLatitude, minhaLongitude);
                },
                function(erro) {
                    // Erro na obtenção da localização
                    let mensagemErro;
                    
                    switch(erro.code) {
                        case erro.PERMISSION_DENIED:
                            mensagemErro = "Acesso à localização negado pelo usuário.";
                            break;
                        case erro.POSITION_UNAVAILABLE:
                            mensagemErro = "Localização indisponível.";
                            break;
                        case erro.TIMEOUT:
                            mensagemErro = "Tempo esgotado ao obter localização.";
                            break;
                        default:
                            mensagemErro = "Erro desconhecido ao obter localização.";
                    }
                    
                    $("#endereco-atual").text(mensagemErro);
                    alert("Não foi possível obter sua localização: " + mensagemErro);
                },
                { 
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            $("#endereco-atual").text("Geolocalização não suportada por este navegador.");
            alert("Seu navegador não suporta geolocalização.");
        }
    }
    
    // Obtém o endereço do usuário com base nas coordenadas
    function obterEnderecoDoUsuario(latitude, longitude) {
        // Usando o Nominatim OpenStreetMap para geocodificação reversa
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
                let endereco = resposta.display_name || "Endereço não encontrado";
                $("#endereco-atual").text(endereco);
            },
            error: function() {
                $("#endereco-atual").text("Não foi possível obter o endereço da localização");
            }
        });
    }
    
    // Busca os hospitais próximos da localização do usuário
    function buscarHospitaisProximos(latitude, longitude) {
        // Carrega o arquivo GeoJSON dos hospitais - usando arquivo local para esse exemplo
        $.getJSON(hospitaisLocalURL, function(dados) {
            // Filtra os dados para ter apenas hospitais
            let hospitais = [];
            
            dados.features.forEach(function(feature) {
                // Verifica se é um hospital (não uma farmácia ou clínica)
                // Filtra pela tag "amenity" = "hospital" ou "healthcare" que contém "hospital"
                if (feature.properties.amenity === 'hospital' || 
                    (feature.properties.healthcare && 
                     feature.properties.healthcare.indexOf('hospital') !== -1)) {
                    
                    // Extrai as coordenadas
                    // Nota: no GeoJSON, a ordem é [longitude, latitude]
                    const lng = feature.geometry.coordinates[0];
                    const lat = feature.geometry.coordinates[1];
                    
                    // Calcula a distância
                    const distancia = calcularDistancia(
                        latitude, 
                        longitude,
                        lat,
                        lng
                    );
                    
                    // Adiciona à lista de hospitais
                    hospitais.push({
                        id: feature.id || "hospital_" + hospitais.length,
                        nome: feature.properties.name || "Hospital sem nome",
                        endereco: feature.properties["addr:full"] || 
                                 (feature.properties["addr:street"] ? 
                                  (feature.properties["addr:street"] + 
                                   (feature.properties["addr:housenumber"] ? 
                                    ", " + feature.properties["addr:housenumber"] : "")) : 
                                  "Endereço não disponível"),
                        latitude: lat,
                        longitude: lng,
                        distancia: distancia
                    });
                }
            });
            
            // Ordena por distância e pega os 5 primeiros
            hospitais.sort(function(a, b) {
                return a.distancia - b.distancia;
            });
            
            hospitaisProximos = hospitais.slice(0, 5);
            
            // Atualiza a interface
            atualizarListaHospitais();
        })
        .fail(function() {
            $("#lista-hospitais").html("<li>Erro ao carregar dados dos hospitais.</li>");
            $("#lista-hospitais").listview("refresh");
        });
    }
    
    // Atualiza a lista de hospitais na interface
    function atualizarListaHospitais() {
        // Limpa a lista existente
        $("#lista-hospitais").empty();
        
        if (hospitaisProximos.length === 0) {
            $("#lista-hospitais").html("<li>Não foram encontrados hospitais próximos.</li>");
        } else {
            // Para cada hospital encontrado, adiciona à lista
            hospitaisProximos.forEach(function(hospital, index) {
                const itemHtml = `
                    <li>
                        <h3>${hospital.nome}</h3>
                        <span class="distancia">${hospital.distancia.toFixed(1)} km</span>
                        <p class="detalhes">${hospital.endereco}</p>
                        <button class="botao-trajeto" data-lat="${hospital.latitude}" 
                                data-lng="${hospital.longitude}" 
                                data-nome="${hospital.nome}">
                            Iniciar Trajeto
                        </button>
                        <button class="botao-favorito" data-index="${index}" data-tipo="hospital">
                            ${estaNosFavoritos(hospital.id, 'hospital') ? '★' : '☆'}
                        </button>
                    </li>
                `;
                
                $("#lista-hospitais").append(itemHtml);
            });
            
            // Adiciona eventos aos botões
            $(".botao-trajeto").on("click", iniciarTrajeto);
            $(".botao-favorito").on("click", alternarFavorito);
        }
        
        // Atualiza o estilo da lista para o jQuery Mobile
        $("#lista-hospitais").listview().listview("refresh");
    }
    
    // Busca as farmácias próximas da localização do usuário
    function buscarFarmaciasProximas(latitude, longitude) {
        // Carrega o arquivo GeoJSON das farmácias - usando arquivo local para esse exemplo
        $.getJSON(farmaciasLocalURL, function(dados) {
            // Filtra os dados para ter apenas farmácias
            let farmacias = [];
            
            dados.features.forEach(function(feature) {
                // Verifica se é uma farmácia
                // Filtra pela tag "amenity" = "pharmacy"
                if (feature.properties.amenity === 'pharmacy') {
                    
                    // Extrai as coordenadas
                    // Nota: no GeoJSON, a ordem é [longitude, latitude]
                    const lng = feature.geometry.coordinates[0];
                    const lat = feature.geometry.coordinates[1];
                    
                    // Calcula a distância
                    const distancia = calcularDistancia(
                        latitude, 
                        longitude,
                        lat,
                        lng
                    );
                    
                    // Adiciona à lista de farmácias
                    farmacias.push({
                        id: feature.id || "farmacia_" + farmacias.length,
                        nome: feature.properties.name || "Farmácia sem nome",
                        endereco: feature.properties["addr:full"] || 
                                 (feature.properties["addr:street"] ? 
                                  (feature.properties["addr:street"] + 
                                   (feature.properties["addr:housenumber"] ? 
                                    ", " + feature.properties["addr:housenumber"] : "")) : 
                                  "Endereço não disponível"),
                        latitude: lat,
                        longitude: lng,
                        distancia: distancia
                    });
                }
            });
            
            // Ordena por distância e pega os 5 primeiros
            farmacias.sort(function(a, b) {
                return a.distancia - b.distancia;
            });
            
            farmaciasProximas = farmacias.slice(0, 5);
            
            // Atualiza a interface
            atualizarListaFarmacias();
        })
        .fail(function() {
            $("#lista-farmacias").html("<li>Erro ao carregar dados das farmácias.</li>");
            $("#lista-farmacias").listview("refresh");
        });
    }
    
    // Atualiza a lista de farmácias na interface
    function atualizarListaFarmacias() {
        // Limpa a lista existente
        $("#lista-farmacias").empty();
        
        if (farmaciasProximas.length === 0) {
            $("#lista-farmacias").html("<li>Não foram encontradas farmácias próximas.</li>");
        } else {
            // Para cada farmácia encontrada, adiciona à lista
            farmaciasProximas.forEach(function(farmacia, index) {
                const itemHtml = `
                    <li>
                        <h3>${farmacia.nome}</h3>
                        <span class="distancia">${farmacia.distancia.toFixed(1)} km</span>
                        <p class="detalhes">${farmacia.endereco}</p>
                        <button class="botao-trajeto" data-lat="${farmacia.latitude}" 
                                data-lng="${farmacia.longitude}" 
                                data-nome="${farmacia.nome}">
                            Iniciar Trajeto
                        </button>
                        <button class="botao-favorito" data-index="${index}" data-tipo="farmacia">
                            ${estaNosFavoritos(farmacia.id, 'farmacia') ? '★' : '☆'}
                        </button>
                    </li>
                `;
                
                $("#lista-farmacias").append(itemHtml);
            });
            
            // Adiciona eventos aos botões
            $(".botao-trajeto").on("click", iniciarTrajeto);
            $(".botao-favorito").on("click", alternarFavorito);
        }
        
        // Atualiza o estilo da lista para o jQuery Mobile
        $("#lista-farmacias").listview().listview("refresh");
    }
    
    // Calcula a distância entre dois pontos (fórmula de Haversine)
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
    
    // Inicia o trajeto no Google Maps
    function iniciarTrajeto() {
        const lat = $(this).data("lat");
        const lng = $(this).data("lng");
        const nome = $(this).data("nome");
        
        // Cria a URL para o Google Maps com as coordenadas e abre em uma nova aba
        const url = `https://www.google.com/maps/dir/?api=1&origin=${minhaLatitude},${minhaLongitude}&destination=${lat},${lng}&destination_place_id=${nome.replace(/\s+/g, '+')}&travelmode=driving`;
        window.open(url, "_blank");
    }
    
    // Funções para gerenciar favoritos
    function obterFavoritosSalvos() {
        const favoritosJSON = localStorage.getItem("favoritosSaude");
        return favoritosJSON ? JSON.parse(favoritosJSON) : [];
    }
    
    function salvarFavoritos() {
        localStorage.setItem("favoritosSaude", JSON.stringify(favoritos));
    }
    
    function estaNosFavoritos(id, tipo) {
        return favoritos.some(function(fav) {
            return fav.id === id && fav.tipo === tipo;
        });
    }
    
    function alternarFavorito() {
        const index = $(this).data("index");
        const tipo = $(this).data("tipo");
        let local;
        
        // Obtém os dados do local selecionado
        if (tipo === "hospital") {
            local = hospitaisProximos[index];
        } else {
            local = farmaciasProximas[index];
        }
        
        // Verifica se já está nos favoritos
        const favIndex = favoritos.findIndex(function(fav) {
            return fav.id === local.id && fav.tipo === tipo;
        });
        
        if (favIndex === -1) {
            // Adiciona aos favoritos
            favoritos.push({
                id: local.id,
                tipo: tipo,
                nome: local.nome,
                endereco: local.endereco,
                latitude: local.latitude,
                longitude: local.longitude
            });
            
            $(this).text("★");
        } else {
            // Remove dos favoritos
            favoritos.splice(favIndex, 1);
            $(this).text("☆");
        }
        
        // Salva os favoritos
        salvarFavoritos();
    }
    
    function atualizarListaFavoritos() {
        // Limpa a lista existente
        $("#lista-favoritos").empty();
        
        if (favoritos.length === 0) {
            $("#lista-favoritos").html("<li class='sem-favoritos'>Você ainda não adicionou favoritos.</li>");
        } else {
            // Para cada favorito, adiciona à lista
            favoritos.forEach(function(favorito, index) {
                // Calcula a distância se a localização do usuário estiver disponível
                let distanciaHtml = "";
                if (minhaLatitude && minhaLongitude) {
                    const distancia = calcularDistancia(
                        minhaLatitude, 
                        minhaLongitude,
                        favorito.latitude,
                        favorito.longitude
                    );
                    distanciaHtml = `<span class="distancia">${distancia.toFixed(1)} km</span>`;
                }
                
                // Tipo do local (hospital ou farmácia)
                const tipoTexto = favorito.tipo === "hospital" ? "Hospital" : "Farmácia";
                
                // Adiciona à lista
                const itemHtml = `
                    <li>
                        <h3>${favorito.nome}</h3>
                        ${distanciaHtml}
                        <p class="tipo-local">${tipoTexto}</p>
                        <p class="detalhes">${favorito.endereco || ""}</p>
                        <button class="botao-trajeto" data-lat="${favorito.latitude}" 
                                data-lng="${favorito.longitude}" 
                                data-nome="${favorito.nome}">
                            Iniciar Trajeto
                        </button>
                        <button class="botao-remover-favorito" data-index="${index}">
                            Remover dos Favoritos
                        </button>
                        </li>
                `;
                
                $("#lista-favoritos").append(itemHtml);
            });
            
            // Adiciona eventos aos botões
            $(".botao-trajeto").on("click", iniciarTrajeto);
            $(".botao-remover-favorito").on("click", removerFavorito);
        }
        
        // Atualiza o estilo da lista para o jQuery Mobile
        $("#lista-favoritos").listview().listview("refresh");
    }
    
    function removerFavorito() {
        const index = $(this).data("index");
        
        // Remove o favorito
        favoritos.splice(index, 1);
        
        // Salva os favoritos
        salvarFavoritos();
        
        // Atualiza a lista
        atualizarListaFavoritos();
    }
});
