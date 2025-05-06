$(document).ready(function() {
    // Configurar o evento de clique no botão de localização
    $(document).on('click', '.location-button-custom', function(e) {
        e.preventDefault();
        iniciarProcessoLocalizacao();
    });

    // Função que inicia o processo de obtenção de localização
    function iniciarProcessoLocalizacao() {
        // Verificar se é um dispositivo móvel
        var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Verificar se estamos em HTTPS
        var isSecure = window.location.protocol === 'https:';
        
        // Verifica se o navegador suporta geolocalização
        if (!navigator.geolocation) {
            mostrarErroLocalizacao("Seu navegador não suporta geolocalização.");
            return;
        }
        
        // Se estamos em um dispositivo móvel mas não em HTTPS, mostra um alerta explicativo
        if (isMobile && !isSecure) {
            mostrarDialogoSSL();
            return;
        }
        
        // Atualiza a interface para mostrar que estamos obtendo a localização
        $("#location-display").text("Obtendo sua localização...");
        
        // Configura as opções de geolocalização com base no dispositivo
        var geoOptions = {
            enableHighAccuracy: true,
            timeout: isMobile ? 15000 : 10000,
            maximumAge: 0
        };
        
        // Tenta obter a localização
        navigator.geolocation.getCurrentPosition(
            // Sucesso
            handleLocalizacaoSucesso,
            // Erro
            handleLocalizacaoErro,
            geoOptions
        );
    }
    
    // Função que trata o sucesso na obtenção da localização
    function handleLocalizacaoSucesso(posicao) {
        var latitude = posicao.coords.latitude;
        var longitude = posicao.coords.longitude;
        
        // Armazena as coordenadas para uso em outras funções
        window.userLatitude = latitude;
        window.userLongitude = longitude;
        
        // Obtém o endereço baseado nas coordenadas
        obterEnderecoUsuario(latitude, longitude);
    }
    
    // Função que trata erros na obtenção da localização
    function handleLocalizacaoErro(erro) {
        var mensagemErro = "";
        var instrucaoAdicional = "";
        
        // Determina a mensagem de erro com base no código retornado
        switch(erro.code) {
            case erro.PERMISSION_DENIED:
                mensagemErro = "Acesso à localização negado";
                
                // Instruções específicas para cada plataforma
                if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                    instrucaoAdicional = "Verifique em: Configurações > Privacidade > Serviços de Localização > Safari";
                } else if (/Android/i.test(navigator.userAgent)) {
                    instrucaoAdicional = "Verifique em: Configurações > Apps > Permissões > Localização";
                } else {
                    instrucaoAdicional = "Verifique as permissões de localização no navegador";
                }
                break;
                
            case erro.POSITION_UNAVAILABLE:
                mensagemErro = "Localização indisponível";
                instrucaoAdicional = "Verifique se o GPS está ativado";
                break;
                
            case erro.TIMEOUT:
                mensagemErro = "Tempo esgotado ao obter localização";
                instrucaoAdicional = "Tente novamente em uma área com melhor sinal";
                break;
                
            default:
                mensagemErro = "Erro desconhecido (" + erro.code + ")";
                instrucaoAdicional = "Tente recarregar a página";
        }
        
        // Atualiza a interface com a mensagem de erro
        mostrarErroLocalizacao(mensagemErro, instrucaoAdicional);
    }
    
    // Função para obter o endereço a partir das coordenadas
    function obterEnderecoUsuario(latitude, longitude) {
        // Usa a API Nominatim do OpenStreetMap para geocodificação reversa
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
                // Extrai o endereço da resposta
                var endereco = resposta.display_name || "Endereço não encontrado";
                
                // Atualiza a interface com o endereço
                $("#location-display").text(endereco);
                
                // Atualiza também no cabeçalho da página de resultados, se existir
                $("#list-location-display").text(endereco);
                
                // Indica sucesso visualmente
                $("#location-display").addClass("localizacao-obtida");
                setTimeout(function() {
                    $("#location-display").removeClass("localizacao-obtida");
                }, 1500);
            },
            error: function() {
                mostrarErroLocalizacao("Não foi possível obter o endereço", 
                                    "Serviço de geocodificação indisponível");
            }
        });
    }
    
    // Função para mostrar erros de localização na interface
    function mostrarErroLocalizacao(mensagem, instrucao) {
        $("#location-display").text(mensagem);
        
        // Mostra uma mensagem de alerta se houver instrução adicional
        if (instrucao) {
            setTimeout(function() {
                alert(mensagem + "\n\n" + instrucao);
            }, 300);
        }
    }
    
    // Função que mostra um diálogo explicando o problema de SSL
    function mostrarDialogoSSL() {
        // Atualiza a mensagem na interface
        $("#location-display").text("Problema de segurança");
        
        // Cria o diálogo se não existir
        if ($("#ssl-dialog").length === 0) {
            var dialogHtml = `
                <div data-role="popup" id="ssl-dialog" data-dismissible="false" data-theme="a" class="ui-corner-all">
                    <div data-role="header" data-theme="a">
                        <h1>Problema de Segurança</h1>
                    </div>
                    <div role="main" class="ui-content">
                        <h3>A geolocalização requer HTTPS</h3>
                        <p>Dispositivos móveis exigem uma conexão segura (HTTPS) para acessar sua localização.</p>
                        <p>Opções:</p>
                        <ol>
                            <li>Use um navegador de desktop</li>
                            <li>Hospede o site em um servidor HTTPS</li>
                            <li>Digite seu endereço manualmente</li>
                        </ol>
                        <a href="#" data-rel="back" class="ui-btn ui-corner-all ui-shadow ui-btn-b ui-btn-icon-left ui-icon-check">OK</a>
                    </div>
                </div>
            `;
            
            // Adiciona o diálogo à página
            $("body").append(dialogHtml);
            
            // Inicializa o componente popup
            $("#ssl-dialog").popup();
        }
        
        // Abre o diálogo
        $("#ssl-dialog").popup("open");
    }
});
