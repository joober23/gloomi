/* ==========================================
   1. FLUXO DE TELAS E LOGIN
========================================== */
window.onload = () => {
    // Tela de Splash inicial de 3 segundos
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        splash.style.opacity = '0';
        
        setTimeout(() => {
            splash.style.display = 'none';
            const loginScreen = document.getElementById('login-screen');
            loginScreen.style.display = 'flex';
            // Pequeno delay para a transição de opacidade funcionar
            setTimeout(() => { loginScreen.style.opacity = '1'; }, 50);
        }, 600); 
    }, 3000); 
};

function doLogin() {
    const loginScreen = document.getElementById('login-screen');
    loginScreen.style.opacity = '0'; 
    
    setTimeout(() => {
        loginScreen.style.display = 'none';
        const mainApp = document.getElementById('main-app');
        mainApp.style.display = 'block'; 
    }, 600);
}

/* ==========================================
   2. NAVEGAÇÃO ENTRE ABAS
========================================== */
function switchTab(tabId) {
    // Remove classe 'active' de todas as abas e links
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
    
    // Mostra a aba clicada
    document.getElementById('tab-' + tabId).classList.add('active');
    
    // Deixa o botão clicado com a cor principal (se não for o perfil)
    if(tabId !== 'profile') {
        const clickedBtn = document.querySelector(`button[onclick="switchTab('${tabId}')"]`);
        if(clickedBtn) clickedBtn.classList.add('active');
    }
}

/* ==========================================
   3. ATUALIZAR NOME DO USUÁRIO
========================================== */
function updateUserName(name) {
    const headerName = document.getElementById('header-user-name');
    const welcomeTitle = document.getElementById('welcome-title');
    
    if (name.trim() === '') {
        headerName.textContent = 'Meu Perfil';
        welcomeTitle.innerHTML = 'Olá, seu Lumi está pronto<br>para cuidar da sua pele!';
    } else {
        const firstName = name.split(' ')[0];
        headerName.textContent = 'Oi, ' + firstName;
        welcomeTitle.innerHTML = 'Olá ' + firstName + ', seu Lumi está pronto<br>para cuidar da sua pele!';
    }
}

/* ==========================================
   4. ROTINA E BARRA DE PROGRESSO
========================================== */
let totalProducts = 4;
let completedProducts = 0;

function toggleCheck(prodId) {
    const btn = document.querySelector('#' + prodId + ' .check');
    const productCard = document.getElementById(prodId); // Pega o card do produto inteiro
    
    // Sincronizando com a classe '.active' e '.completed' do seu CSS
    if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        productCard.classList.remove('completed');
        completedProducts--;
    } else {
        btn.classList.add('active');
        productCard.classList.add('completed');
        completedProducts++;
    }
    updateProgress();
}

function updateProgress() {
    document.getElementById('completed-count').innerText = completedProducts;
    let percentage = (completedProducts / totalProducts) * 100;
    
    // Atualiza a largura da barra e o texto
    document.getElementById('progress-bar-inner').style.width = percentage + '%';
    document.getElementById('progress-percent').innerText = Math.round(percentage) + '%';
}

/* ==========================================
   5. SISTEMA DE CUSTOMIZAÇÃO DO LUMI
========================================== */
// Estado atual do Lumi
let lumiState = {
    color: '#FFB3BA',
    eyes: 'default',
    isFemale: false,
    mouth: 'default'
};

function openModal() {
    // Usando a classe 'active' para ativar o fadeIn do CSS
    document.getElementById('customizer-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('customizer-modal').classList.remove('active');
}

function selectColor(hex, btnElement) {
    lumiState.color = hex;
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('selected'));
    btnElement.classList.add('selected');
    updateModalPreview();
}

function selectEyes(type, btnElement) {
    lumiState.eyes = type;
    document.querySelectorAll('#eyes-picker button').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    updateModalPreview();
}

function selectMouth(type, btnElement) {
    lumiState.mouth = type;
    document.querySelectorAll('#mouth-picker button').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    updateModalPreview();
}

function toggleFeminine(isChecked) {
    lumiState.isFemale = isChecked;
    updateModalPreview();
}

// Atualiza só a imagem dentro do modal
function updateModalPreview() {
    document.getElementById('modal-lumi-head').style.backgroundColor = lumiState.color;
    
    let eyeSuffix = lumiState.isFemale ? '-fem.png' : '.png';
    document.getElementById('modal-lumi-eyes').src = `eyes-${lumiState.eyes}${eyeSuffix}`;
    document.getElementById('modal-lumi-mouth').src = `mouth-${lumiState.mouth}.png`;
}

// Aplica a customização em todos os Lumis espalhados pelo site
function saveCustomization() {
    let eyeSuffix = lumiState.isFemale ? '-fem.png' : '.png';
    
    document.querySelectorAll('.nav-lumi-head, .home-lumi-head, .stage-lumi-head, .head-mask').forEach(el => {
        el.style.backgroundColor = lumiState.color;
    });
    
    document.querySelectorAll('.nav-lumi-eyes, .home-lumi-eyes, .eyes-layer').forEach(el => {
        el.src = `eyes-${lumiState.eyes}${eyeSuffix}`;
    });
    
    document.querySelectorAll('.nav-lumi-mouth, .home-lumi-mouth, .mouth-layer').forEach(el => {
        el.src = `mouth-${lumiState.mouth}.png`;
    });
    
    closeModal();
}