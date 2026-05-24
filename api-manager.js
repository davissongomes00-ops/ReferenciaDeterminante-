/**
 * RD Logistics API Gateway
 * Centralizes all external integrations
 */
const RD_API = {
    // Stripe: Redirect to secure Payment Link
    processPayment: (totalAmount) => {
        // Substitui pelo teu URL de Checkout real
        const checkoutUrl = "https://buy.stripe.com/SEU_LINK_AQUI"; 
        window.location.href = checkoutUrl;
    },

    // Google Maps: Initialize Map
    initMap: (lat = 40.2033, lng = -8.4103) => {
        const location = { lat: lat, lng: lng };
        const map = new google.maps.Map(document.getElementById("map"), {
            zoom: 15,
            center: location,
        });
        new google.maps.Marker({ position: location, map: map });
    },

    // LocalStorage Sync: Generic data handler
    syncData: (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`[RD API] Data synced: ${key}`);
    }
};
