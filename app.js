$(document).ready(function() {
    // Configurar o evento de clique no botão de localização
    $(document).on('click', '.location-button-custom', function(e) {
        e.preventDefault();
        obterLocalizacaoUsuario();
    });

    // Função para obter a localização do usuário
    function obterLocalizacaoUsuario() {
        if (navigator.geolocation) {
            $("#location-display").text("Obtendo sua localização...");
            
            navigator.geolocation.getCurrentPosition(
                function(posicao) {
                    // Sucesso ao obter a localização
                    let latitude = posicao.coords.latitude;
                    let longitude = posicao.coords.longitude;
                    
                    // Obter o endereço a partir das coordenadas
                    obterEnderecoUsuario(latitude, longitude);
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
                        partes.push(rua);
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
                
                // Atualizar também no cabeçalho da página de resultados, se existir
                $("#location-display").text(enderecoSimplificado);
                $("#list-location-display").text(enderecoSimplificado);
                
                // Armazenar as coordenadas para uso posterior
                window.userLatitude = latitude;
                window.userLongitude = longitude;
            },
            error: function() {
                $("#location-display").text("Não foi possível obter o endereço");
            }
        });
    }
});
