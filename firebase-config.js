// ============================================================
// GLOOMI — Firebase Configuration & Service
// Projeto: gloomiskincare
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyCK144KRVFEPPbaDFdy55pSbashLJ1RzuM",
    authDomain: "gloomiskincare.firebaseapp.com",
    projectId: "gloomiskincare",
    storageBucket: "gloomiskincare.firebasestorage.app",
    messagingSenderId: "453264497943",
    appId: "1:453264497943:web:92e456e44250337e342b52",
    measurementId: "G-EV226287TP"
};

// Objeto global de estado do Firebase
window.gloomiFirebase = {
    isConfigured: true,
    auth: null,
    db: null,
    analytics: null,
    currentUser: null
};

// Inicialização segura do Firebase
(function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn('[Gloomi Firebase] SDK do Firebase não carregado.');
        return;
    }

    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        window.gloomiFirebase.auth = firebase.auth();
        window.gloomiFirebase.db = firebase.firestore();

        if (typeof firebase.analytics === 'function' && firebaseConfig.measurementId) {
            try {
                window.gloomiFirebase.analytics = firebase.analytics();
            } catch (aErr) {
                console.info('[Gloomi Firebase] Analytics não inicializado (comum em ambiente local file://):', aErr.message);
            }
        }

        console.log('[Gloomi Firebase] Conectado ao projeto "gloomiskincare"! Google Auth e Firestore prontos.');
    } catch (err) {
        console.error('[Gloomi Firebase] Erro ao inicializar Firebase:', err);
    }
})();
