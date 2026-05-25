/**
 * RD Logistics | API Manager & Session Handler
 * Localização: /js/api-manager.js
 */

const RD_API = {
    // Gestão de Estado (localStorage)
    storage: {
        get: (key) => {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        },
        set: (key, val) => {
            localStorage.setItem(key, JSON.stringify(val));
        },
        remove: (key) => {
            localStorage.removeItem(key);
        }
    },

    // Limpeza completa pós-transação
    finalizarSessao: () => {
        const chavesParaRemover = ["rd_selecionados", "rd_carrinho_total", "rd_morada_cliente"];
        chavesParaRemover.forEach(chave => localStorage.removeItem(chave));
        console.log("RD_API: Sessão limpa com sucesso.");
    },

    // Inicialização do Mapa (Google Maps API)
    initMap: (elementId, lat, lng) => {
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            console.error("Google Maps não carregado.");
            return null;
        }
        const map = new google.maps.Map(document.getElementById(elementId), {
            zoom: 13,
            center: { lat, lng }
        });
        new google.maps.Marker({
            position: { lat, lng },
            map: map,
            title: "RD Logistics Base"
        });
        return map;
    },

    // Comunicação com Backend Vercel
    processarPagamento: async (total, dadosCliente) => {
        try {
            const response = await fetch('/api/criar-pagamento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    total: total,
                    morada: dadosCliente.morada
                })
            });

            if (!response.ok) throw new Error("Erro na comunicação com a API de Pagamento.");
            
            return await response.json();
        } catch (error) {
            console.error("RD_API Error:", error);
            throw error;
        }
    }
};

// Exportar para uso global se necessário
window.RD_API = RD_API;
