// ============================================================
// GLOOMI — Firebase Configuration & Service
// ============================================================
// 
// Para conectar o Gloomi ao seu projeto Firebase:
// 1. Acesse https://console.firebase.google.com/
// 2. Crie ou selecione seu projeto "Gloomi"
// 3. Em "Visão geral do projeto", adicione um App da Web (ícone </>)
// 4. Ative a Autenticação:
//    - Authentication > Método de login > Ativar "Google"
// 5. Ative o Banco de Dados:
//    - Firestore Database > Criar banco de dados (modo de teste ou produção)
// 6. Cole as credenciais do seu projeto abaixo:

const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "seu-projeto-gloomi.firebaseapp.com",
    projectId: "seu-projeto-gloomi",
    storageBucket: "seu-projeto-gloomi.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:0000000000000000"
};

// Objeto global de estado do Firebase
window.gloomiFirebase = {
    isConfigured: false,
    auth: null,
    db: null,
    currentUser: null
};

// Verifica se a configuração foi preenchida com credenciais reais
function checkFirebaseConfig() {
    return Boolean(
        firebaseConfig.apiKey &&
        firebaseConfig.apiKey !== "SUA_API_KEY_AQUI" &&
        firebaseConfig.projectId &&
        firebaseConfig.projectId !== "seu-projeto-gloomi"
    );
}

// Inicialização segura do Firebase
(function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn('[Gloomi Firebase] SDK do Firebase não carregado.');
        return;
    }

    const configured = checkFirebaseConfig();
    window.gloomiFirebase.isConfigured = configured;

    if (!configured) {
        console.info('[Gloomi Firebase] Credenciais padrão detectadas. Modo de demonstração / local ativo até que as chaves sejam adicionadas em firebase-config.js.');
        return;
    }

    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        window.gloomiFirebase.auth = firebase.auth();
        window.gloomiFirebase.db = firebase.firestore();
        console.log('[Gloomi Firebase] Inicializado com sucesso! Google Auth e Firestore prontos.');
    } catch (err) {
        console.error('[Gloomi Firebase] Erro ao inicializar Firebase:', err);
    }
})();
