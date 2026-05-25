/**
 * RD Logistics API Gateway
 */
const RD_API = {
    // Google Maps: Initialize Map
    // Agora aceita o ID do elemento alvo para evitar conflitos
    initMap: (elementId, lat = 41.1579, lng = -8.6291) => {
        const element = document.getElementById(elementId);
        if (!element) return console.error(`Elemento ${elementId} não encontrado.`);
        
        const location = { lat: lat, lng: lng };
        const map = new google.maps.Map(element, { zoom: 15, center: location });
        new google.maps.Marker({ position: location, map: map, title: "RD Logistics" });
    },

    // Centraliza o sync de dados no localStorage
    syncData: (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    }
};
