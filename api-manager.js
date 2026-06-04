/**
 * RD Logistics | API Manager
 * Localização: /js/api-manager.js
 * Versão: 2.0
 *
 * Centraliza todas as integrações:
 * - localStorage (carrinho, sessão)
 * - Firebase (pedidos, rastreamento)
 * - Stripe (pagamentos)
 * - WhatsApp (notificações)
 * - Google Maps (mapa + estafeta)
 * - Cloudinary (upload de media)
 */

const RD_API = {

    // ============================================================
    // CONFIGURAÇÃO — altera apenas aqui
    // ============================================================
    config: {
        whatsapp:       "351963155090",
        whatsappCalc:   "351963155090",          // ← substitui pelo número real da calculadora
        stripeKey:      "pk_test_51TeYUtAszT9wxrXCOYTLyPHKZ5lhWGolCRqmNDSSWRcEq0dnWAXdtHRENwLLJXgyjHpTBHGtBG5X0KuuBpfr511M00uBrztdZl",   // ← substitui pela chave pública Stripe
        stripeEndpoint: "/api/criar-pagamento",
        mbwayEndpoint:  "/api/mbway",
        cloudinary: {
            cloudName:    "dh7qssaqy",
            uploadPreset: "rd_logistics"
        },
        firebase: {
            apiKey:            "AIzaSyCz_Yn767Tsqsjp1leUFuN3jb_Kcl0_Euc",
            authDomain:        "rd-logistics-e5688.firebaseapp.com",
            databaseURL:       "https://rd-logistics-e5688-default-rtdb.europe-west1.firebasedatabase.app",
            projectId:         "rd-logistics-e5688",
            storageBucket:     "rd-logistics-e5688.firebasestorage.app",
            messagingSenderId: "1037729646118",
            appId:             "1:1037729646118:web:339ef24a80016c21be08e7"
        },
        mapa: {
            centroPortugal: { lat: 39.6, lng: -8.0 },
            zoomInicial:    7
        }
    },

    // ============================================================
    // STORAGE — localStorage centralizado
    // ============================================================
    storage: {
        get: (key) => {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                console.warn("RD_API.storage.get:", e);
                return null;
            }
        },
        set: (key, val) => {
            try {
                localStorage.setItem(key, JSON.stringify(val));
            } catch (e) {
                console.warn("RD_API.storage.set:", e);
            }
        },
        remove: (key) => localStorage.removeItem(key),

        // Carrinho
        obterCarrinho: ()      => JSON.parse(localStorage.getItem("rd_selecionados")) || [],
        guardarCarrinho: (arr) => localStorage.setItem("rd_selecionados", JSON.stringify(arr)),
        obterTotal: ()         => localStorage.getItem("rd_carrinho_total") || "0.00",
        guardarTotal: (val)    => localStorage.setItem("rd_carrinho_total", val),
        obterMorada: ()        => localStorage.getItem("rd_morada_cliente") || "",
        guardarMorada: (val)   => localStorage.setItem("rd_morada_cliente", val),

        // Limpeza pós-transação
        limparSessao: () => {
            ["rd_selecionados", "rd_carrinho_total", "rd_morada_cliente"].forEach(k => localStorage.removeItem(k));
            console.log("RD_API: Sessão limpa.");
        }
    },

    // ============================================================
    // FIREBASE — pedidos e rastreamento
    // ============================================================
    firebase: {
        _db: null,

        _getDB: async (appName = "rd-main") => {
            const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
            const { getDatabase } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
            const cfg = RD_API.config.firebase;
            const existing = getApps().find(a => a.name === appName);
            const app = existing ? getApp(appName) : initializeApp(cfg, appName);
            return getDatabase(app);
        },

        // Guardar pedido
        guardarPedido: async (pedido) => {
            const { ref, set } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
            const db = await RD_API.firebase._getDB("rd-pedidos");
            await set(ref(db, "pedidos/" + pedido.id), pedido);
        },

        // Atualizar estado de pedido
        atualizarEstadoPedido: async (id, estado) => {
            const { ref, update } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
            const db = await RD_API.firebase._getDB("rd-pedidos");
            await update(ref(db, "pedidos/" + id), { estado });
        },

        // Eliminar pedido
        eliminarPedido: async (id) => {
            const { ref, remove } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
            const db = await RD_API.firebase._getDB("rd-pedidos");
            await remove(ref(db, "pedidos/" + id));
        },

        // Escutar todos os pedidos em tempo real
        escutarPedidos: async (callback) => {
            const { ref, onValue } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
            const db = await RD_API.firebase._getDB("rd-pedidos");
            onValue(ref(db, "pedidos"), (snap) => {
                const data = snap.val();
                callback(data ? Object.values(data).reverse() : []);
            });
        },

        // Rastreamento — iniciar entrega
        iniciarEntrega: async (codigo) => {
            const { ref, set } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
            const db = await RD_API.firebase._getDB("rd-entrega");
            await set(ref(db, "entrega/ativa"), true);
            await set(ref(db, "entrega/codigo"), codigo);
        },

        // Rastreamento — atualizar posição
        atualizarPosicao: async (lat, lng) => {
            const { ref, set } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
            const db = await RD_API.firebase._getDB("rd-entrega");
            await set(ref(db, "entrega/posicao"), { lat, lng, ts: Date.now() });
        },

        // Rastreamento — terminar entrega
        terminarEntrega: async () => {
            const { ref, remove } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
            const db = await RD_API.firebase._getDB("rd-entrega");
            await remove(ref(db, "entrega"));
        },

        // Rastreamento — verificar código e escutar posição
        verificarCodigoEntrega: async (codigoInput, onPosicao, onInvalido) => {
            const { ref, get, onValue } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
            const db = await RD_API.firebase._getDB("rd-entrega");
            const snap = await get(ref(db, "entrega/codigo"));
            const codigoFirebase = snap.val();
            if (!codigoFirebase || codigoFirebase !== codigoInput.toUpperCase()) {
                onInvalido();
                return;
            }
            onValue(ref(db, "entrega/posicao"), (s) => onPosicao(s.val()));
        }
    },

    // ============================================================
    // STRIPE — pagamento com cartão
    // ============================================================
    stripe: {
        _instance: null,
        _cardElement: null,

        init: () => {
            const key = RD_API.config.stripeKey;
            if (typeof Stripe === "undefined" || key.includes("COLOCA_AQUI")) return false;
            RD_API.stripe._instance = Stripe(key);
            const elements = RD_API.stripe._instance.elements();
            RD_API.stripe._cardElement = elements.create("card", {
                style: {
                    base: { color: "#fff", fontFamily: "Urbanist, sans-serif", fontSize: "16px", "::placeholder": { color: "#555" } },
                    invalid: { color: "#FF0000" }
                }
            });
            return true;
        },

        montarCard: (elementId) => {
            if (RD_API.stripe._cardElement) RD_API.stripe._cardElement.mount("#" + elementId);
        },

        processarPagamento: async (total, morada) => {
            const res = await fetch(RD_API.config.stripeEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ total, morada })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const { error } = await RD_API.stripe._instance.confirmCardPayment(data.clientSecret, {
                payment_method: { card: RD_API.stripe._cardElement }
            });
            if (error) throw new Error(error.message);
            return true;
        }
    },

    // ============================================================
    // WHATSAPP — notificações
    // ============================================================
    whatsapp: {
        // Notificação de novo pedido (para ti)
        enviarPedido: (pedido) => {
            const itens = (pedido.itens || [])
                .map(i => "  - " + i.qtd + "x " + i.nome + " (" + (i.preco * i.qtd).toFixed(2) + "€)")
                .join("\n");

            const msg = "*🚚 NOVO PEDIDO RD LOGISTICS*\n"
                + "━━━━━━━━━━━━━━━━━━━━\n"
                + "📦 *Pedido:* " + pedido.id + "\n"
                + "📅 *Data:* " + pedido.data + "\n"
                + "💳 *Pagamento:* " + (pedido.metodo || "—").toUpperCase() + "\n"
                + "━━━━━━━━━━━━━━━━━━━━\n"
                + "🛒 *Materiais:*\n" + itens + "\n"
                + "━━━━━━━━━━━━━━━━━━━━\n"
                + "💰 *TOTAL: " + pedido.total + "€*\n"
                + "📍 *Morada:* " + pedido.morada;

            window.open("https://wa.me/" + RD_API.config.whatsapp + "?text=" + encodeURIComponent(msg), "_blank");
        },

        // Orçamento da calculadora (para o cliente enviar)
        enviarOrcamento: (area, itens, total) => {
            const linhas = itens.map(i => "- " + i.nome + ": " + i.qtd + " " + i.unidade).join("\n");
            const msg = "*MANIFESTO DE ENGENHARIA V3 - RD LOGISTICS*\n"
                + "Área: " + area + "m²\n\n"
                + linhas + "\n\n"
                + "*TOTAL ESTIMADO: " + total + "*";
            window.open("https://wa.me/" + RD_API.config.whatsappCalc + "?text=" + encodeURIComponent(msg), "_blank");
        }
    },

    // ============================================================
    // PEDIDOS — criar e registar
    // ============================================================
    pedidos: {
        criar: async (metodo) => {
            const itens   = RD_API.storage.obterCarrinho();
            const total   = RD_API.storage.obterTotal();
            const morada  = RD_API.storage.obterMorada();
            const agora   = new Date();
            const id      = "PED-" + Date.now();
            const data    = agora.toLocaleDateString("pt-PT") + " " + agora.toLocaleTimeString("pt-PT");

            const pedido = { id, data, morada, itens, total, metodo, estado: "pendente" };

            await RD_API.firebase.guardarPedido(pedido);
            RD_API.whatsapp.enviarPedido(pedido);
            return pedido;
        }
    },

    // ============================================================
    // MAPA — Google Maps com rastreamento
    // ============================================================
    mapa: {
        _instancia: null,
        _markerEstafeta: null,

        init: (elementId) => {
            const cfg = RD_API.config.mapa;
            RD_API.mapa._instancia = new google.maps.Map(document.getElementById(elementId), {
                zoom: cfg.zoomInicial,
                center: cfg.centroPortugal
            });
            return RD_API.mapa._instancia;
        },

        atualizarEstafeta: (coords) => {
            const mapa = RD_API.mapa._instancia;
            if (!mapa) return;
            if (!RD_API.mapa._markerEstafeta) {
                RD_API.mapa._markerEstafeta = new google.maps.Marker({
                    position: coords, map: mapa, title: "Estafeta RD",
                    icon: { url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png", scaledSize: new google.maps.Size(40, 40) }
                });
            } else {
                RD_API.mapa._markerEstafeta.setPosition(coords);
            }
            mapa.setCenter(coords);
        },

        removerEstafeta: () => {
            if (RD_API.mapa._markerEstafeta) {
                RD_API.mapa._markerEstafeta.setMap(null);
                RD_API.mapa._markerEstafeta = null;
            }
        },

        focarEstafeta: () => {
            if (RD_API.mapa._markerEstafeta) {
                RD_API.mapa._instancia.setCenter(RD_API.mapa._markerEstafeta.getPosition());
                RD_API.mapa._instancia.setZoom(16);
            }
        }
    },

    // ============================================================
    // CLOUDINARY — upload de media
    // ============================================================
    cloudinary: {
        upload: (file, onProgress) => {
            return new Promise((resolve, reject) => {
                const isVideo = file.type.startsWith("video/");
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", RD_API.config.cloudinary.uploadPreset);

                const url = "https://api.cloudinary.com/v1_1/"
                    + RD_API.config.cloudinary.cloudName + "/"
                    + (isVideo ? "video" : "image") + "/upload";

                const xhr = new XMLHttpRequest();
                xhr.open("POST", url);

                if (onProgress) {
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
                    };
                }

                xhr.onload = () => {
                    const res = JSON.parse(xhr.responseText);
                    if (res.secure_url) resolve({ url: res.secure_url, tipo: isVideo ? "video" : "imagem" });
                    else reject(new Error("Upload falhou: " + (res.error?.message || "erro desconhecido")));
                };

                xhr.onerror = () => reject(new Error("Erro de rede no upload."));
                xhr.send(formData);
            });
        }
    }
};

// Disponível globalmente
window.RD_API = RD_API;
console.log("✅ RD_API carregado — v2.0");
