// api-manager.js
const RD_API = {
    // 1. Centralização do Estado
    storage: {
        get: (key) => JSON.parse(localStorage.getItem(key)),
        set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
        clearCart: () => {
            localStorage.setItem("rd_selecionados", JSON.stringify([]));
            localStorage.setItem("rd_carrinho_total", "0.00");
        }
    },

    // 2. Inicialização do Mapa (Corrigida para a estrutura do index)
    initMap: (elementId, lat, lng) => {
        const mapOptions = { zoom: 13, center: { lat, lng } };
        const map = new google.maps.Map(document.getElementById(elementId), mapOptions);
        new google.maps.Marker({ position: { lat, lng }, map: map, title: "RD Logistics" });
        return map;
    },

    // 3. Gestão de Pagamento
    processarPagamento: async (total, metodo, dados) => {
        try {
            const res = await fetch('/api/criar-pagamento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ total, metodo, ...dados })
            });
            return await res.json();
        } catch (e) {
            console.error("Erro na comunicação com a API:", e);
            throw e;
        }
    }
};
