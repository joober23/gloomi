// ======================================
// GLOOMI — script.js v2.0
// ======================================

/* ============ 1. ESTADO GLOBAL ============ */
let state = {
    coins: 50,
    xp: 0,
    level: 1,
    streak: 0,
    lastLoginDate: null,
    completedProducts: 0,
    totalProducts: 0,
    waterDrunk: 0,
    products: [],      // { id, name, brand, category, notes, inRoutine }
    routineItems: [],  // IDs dos produtos na rotina + estado checked
    checkedToday: {},  // { productId: true/false }
    lumi: {
        color: '#FFB3BA',
        isFemale: false,
        accessory: '',
        mood: 'happy'  // happy, neutral, sleepy
    },
    inventory: [],
    lastPhotoDate: null,
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(),
    achievements: {
        firstStep: false,
        hydrated: false,
        weekStreak: false,
        photographer: false,
        shopaholic: false
    }
};

let tempUserData = {};
let currentUser = null;
let firebaseUser = null;

/* ============ 2. INICIALIZAÇÃO ============ */
window.onload = () => {
    animateSplash();
    updateCoinsUI();
    initFirebaseIntegration();
};

function initFirebaseIntegration() {
    const hintEl = document.getElementById('firebase-status-hint');
    const isConfigured = window.gloomiFirebase && window.gloomiFirebase.isConfigured;

    if (hintEl) {
        if (isConfigured) {
            hintEl.innerHTML = '☁️ <span style="color:#2E7D32;font-weight:700">Firebase Conectado</span> (Google Login & Firestore ativos)';
        } else {
            hintEl.innerHTML = '💡 Firebase em modo local. Insira suas chaves em <code>firebase-config.js</code>';
        }
    }

    // Se o Firebase estiver configurado, escuta mudanças de autenticação
    if (isConfigured && window.gloomiFirebase.auth) {
        window.gloomiFirebase.auth.onAuthStateChanged(user => {
            if (user) {
                firebaseUser = user;
                currentUser = user.uid;
                console.log('[Gloomi Firebase] Usuário detectado na sessão:', user.displayName || user.email);
            }
        });
    }
}

function animateSplash() {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
            showLoginScreen();
        }, 800);
    }, 2800);
}

function showLoginScreen() {
    const loginScreen = document.getElementById('login-screen');
    loginScreen.style.display = 'flex';
    setTimeout(() => { loginScreen.style.opacity = '1'; }, 30);
    fetchRealUV();
    renderCalendar();
}

/* ============ 3. LOGIN COM GOOGLE & LOCAL / ONBOARDING ============ */
async function loginWithGoogle() {
    const btn = document.getElementById('btn-google-login');
    const isConfigured = window.gloomiFirebase && window.gloomiFirebase.isConfigured;

    if (!isConfigured) {
        showToast('💡 Configure suas chaves do Firebase em "firebase-config.js" para ativar o login com Google! Você pode entrar como convidada abaixo.', 'warning');
        const loginInput = document.getElementById('login-name');
        if (loginInput) {
            loginInput.focus();
            loginInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    try {
        if (btn) btn.style.opacity = '0.6';
        showToast('Conectando com o Google... ✦', 'info');

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await window.gloomiFirebase.auth.signInWithPopup(provider);
        const user = result.user;
        firebaseUser = user;
        currentUser = user.uid;

        showToast(`Autenticado com sucesso! Olá, ${user.displayName || 'você'} ✨`, 'success');

        // Carrega ou inicializa no Firestore
        await loadFromFirestoreOrInit(user);

    } catch (err) {
        console.error('[Gloomi Firebase Login Error]:', err);
        if (btn) btn.style.opacity = '1';

        if (err.code === 'auth/popup-closed-by-user') {
            showToast('Login com o Google cancelado.', 'info');
        } else if (err.code === 'auth/operation-not-allowed') {
            showToast('⚠️ Ative o provedor "Google" em Firebase Console > Authentication > Sign-in method.', 'warning');
        } else if (err.code === 'auth/unauthorized-domain') {
            showToast('⚠️ Domínio não autorizado. Adicione seu domínio no console do Firebase.', 'warning');
        } else {
            showToast('Erro ao autenticar com o Google: ' + (err.message || 'Verifique o console.'), 'warning');
        }
    } finally {
        if (btn) btn.style.opacity = '1';
    }
}

async function loadFromFirestoreOrInit(user) {
    const db = window.gloomiFirebase.db;
    const loginScreen = document.getElementById('login-screen');

    if (!db) {
        // Fallback local se o Firestore não estiver ativo
        state.userName = user.displayName || 'Gloomi Lover';
        state.userEmail = user.email;
        state.userPhoto = user.photoURL;
        loginScreen.style.opacity = '0';
        setTimeout(() => {
            loginScreen.style.display = 'none';
            showMainApp();
        }, 600);
        return;
    }

    try {
        const userDocRef = db.collection('users').doc(user.uid);
        const docSnap = await userDocRef.get();

        loginScreen.style.opacity = '0';

        setTimeout(() => {
            loginScreen.style.display = 'none';

            if (docSnap.exists) {
                const cloudData = docSnap.data();
                loadUserState(cloudData);
                // Atualiza dados do Google caso tenham mudado
                state.userName = state.userName || user.displayName || 'Gloomi Lover';
                state.userEmail = user.email;
                state.userPhoto = user.photoURL;
                showMainApp();
                setTimeout(() => showToast(`Dados sincronizados da nuvem! ☁️`, 'success'), 400);
            } else {
                // Primeira vez: inicia onboarding com nome do Google pré-preenchido
                tempUserData.name = user.displayName ? user.displayName.split(' ')[0] : 'Gloomi Lover';
                state.userEmail = user.email;
                state.userPhoto = user.photoURL;
                showOnboardingScreen();
            }
        }, 600);

    } catch (err) {
        console.warn('[Gloomi Firebase] Falha ao ler Firestore, usando sessão local:', err);
        loginScreen.style.opacity = '0';
        setTimeout(() => {
            loginScreen.style.display = 'none';
            state.userName = user.displayName || 'Gloomi Lover';
            state.userEmail = user.email;
            state.userPhoto = user.photoURL;
            showMainApp();
        }, 600);
    }
}

function doLogin() {
    const loginName = document.getElementById('login-name').value.trim();
    if (!loginName) {
        showToast('Por favor, digite seu nome de usuário.', 'warning');
        return;
    }

    currentUser = loginName.toLowerCase();
    const storageKey = 'gloomi_user_' + currentUser;
    const storedUser = localStorage.getItem(storageKey);

    const loginScreen = document.getElementById('login-screen');
    loginScreen.style.opacity = '0';

    setTimeout(() => {
        loginScreen.style.display = 'none';

        if (storedUser) {
            const saved = JSON.parse(storedUser);
            loadUserState(saved);
            showMainApp();
            setTimeout(() => showToast(`Que bom te ver de volta, ${state.userName}! ✨`, 'success'), 500);
        } else {
            tempUserData.name = loginName;
            showOnboardingScreen();
        }
    }, 700);
}

function handleLoginKey(e) {
    if (e.key === 'Enter') doLogin();
}

function loadUserState(saved) {
    Object.assign(state, saved);
    // Garantir estrutura nova para usuários antigos
    if (!state.products) state.products = [];
    if (!state.routineItems) state.routineItems = [];
    if (!state.checkedToday) state.checkedToday = {};
    if (!state.inventory) state.inventory = [];
    if (!state.achievements) state.achievements = {};
    if (!state.xp) state.xp = 0;
    if (!state.level) state.level = 1;
    if (!state.streak) state.streak = 0;
    if (!state.lumi) state.lumi = { color: '#FFB3BA', isFemale: false, accessory: '', mood: 'happy' };

    // Checar streak
    checkDailyStreak();
    updateAllUI();
}

    // Checar streak
    checkDailyStreak();
    updateAllUI();
}

function checkDailyStreak() {
    const today = getTodayString();
    if (state.lastLoginDate === today) return;

    const yesterday = getYesterdayString();
    if (state.lastLoginDate === yesterday) {
        state.streak = (state.streak || 0) + 1;
    } else if (state.lastLoginDate && state.lastLoginDate !== today) {
        state.streak = 1;
    } else if (!state.lastLoginDate) {
        state.streak = 1;
    }
    state.lastLoginDate = today;
    state.checkedToday = {}; // Reset diário
    saveState();
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}
function getYesterdayString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

/* --- ONBOARDING --- */
function showOnboardingScreen() {
    const ob = document.getElementById('onboarding-screen');
    ob.style.display = 'flex';
    setTimeout(() => { ob.style.opacity = '1'; }, 30);
    updateObProgress(1);
}

function updateObProgress(step) {
    const total = 3;
    const fill = document.getElementById('ob-progress-fill');
    const label = document.getElementById('ob-step-label');
    if (fill) fill.style.width = ((step / total) * 100) + '%';
    if (label) label.textContent = `Passo ${step} de ${total}`;
}

function goToOnboardingStep(step) {
    if (step === 2) {
        if (!document.getElementById('ob-skin-type').value ||
            !document.getElementById('ob-skin-condition').value ||
            !document.getElementById('ob-age').value) {
            showToast('Preencha todos os campos para continuar.', 'warning');
            return;
        }
    }
    document.querySelectorAll('[id^="ob-step-"]').forEach(el => {
        el.style.display = 'none';
        el.classList.add('hidden');
    });
    const next = document.getElementById('ob-step-' + step);
    if (next) {
        next.classList.remove('hidden');
        next.style.display = 'flex';
        next.style.animation = 'fadeIn 0.4s ease-out';
    }
    updateObProgress(typeof step === 'number' ? step : 3);
}

function setExperience(hasExperience) {
    tempUserData.hasExperience = hasExperience;
    goToOnboardingStep(hasExperience ? '3a' : '3b');
}

function finishOnboarding(action) {
    const skinType = document.getElementById('ob-skin-type').value;
    const skinCond = document.getElementById('ob-skin-condition').value;
    const age = document.getElementById('ob-age').value;

    state.userName = tempUserData.name;
    state.skinType = skinType;
    state.skinCondition = skinCond;
    state.userAge = age;
    state.streak = 1;
    state.lastLoginDate = getTodayString();

    // Rotina básica para iniciantes
    if (action === 'start_basic') {
        const basicProducts = [
            { id: genId(), name: 'Gel de Limpeza Suave', brand: 'Sugestão Gloomi', category: 'limpeza', notes: 'Use pela manhã e à noite.', inRoutine: true },
            { id: genId(), name: 'Hidratante Facial Leve', brand: 'Sugestão Gloomi', category: 'hidratacao', notes: 'Aplique após lavar o rosto.', inRoutine: true },
            { id: genId(), name: 'Protetor Solar FPS 50', brand: 'Sugestão Gloomi', category: 'protecao', notes: 'Essencial toda manhã.', inRoutine: true },
        ];
        state.products = basicProducts;
    } else if (action === 'add_product') {
        const prodName = document.getElementById('ob-prod-name').value.trim();
        if (prodName) {
            state.products = [{ id: genId(), name: prodName, brand: '', category: 'limpeza', notes: '', inRoutine: true }];
        }
    }

    saveState();

    const ob = document.getElementById('onboarding-screen');
    ob.style.opacity = '0';
    setTimeout(() => {
        ob.style.display = 'none';
        updateAllUI();
        showMainApp();
        addCoins(50);
        setTimeout(() => showToast('Bem-vinda ao Gloomi! Ganhou +50 moedas 🎉', 'success'), 400);
        if (action === 'start_basic') {
            setTimeout(() => showToast('Rotina básica criada pra você! Confira em Minha Rotina.', 'info'), 2000);
        }
    }, 700);
}

/* ============ 4. MAIN APP ============ */
function showMainApp() {
    const mainApp = document.getElementById('main-app');
    mainApp.style.display = 'block';
    updateAllUI();
    applyLumiToAll();
}

function updateAllUI() {
    updateCoinsUI();
    updateUserName(state.userName || 'Você');
    renderRoutine();
    renderProducts();
    renderCalendar();
    updateStreakUI();
    updateXpUI();
    applyLumiToAll();
}

/* ============ 5. NAVEGAÇÃO ============ */
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-link-mob').forEach(b => b.classList.remove('active'));

    const tab = document.getElementById('tab-' + tabId);
    if (tab) tab.classList.add('active');

    document.querySelectorAll(`.nav-link[data-tab="${tabId}"]`).forEach(b => b.classList.add('active'));
    document.querySelectorAll(`.nav-link-mob[data-tab="${tabId}"]`).forEach(b => b.classList.add('active'));

    if (tabId === 'diary') renderCalendar();
    if (tabId === 'shop') renderShop();
    if (tabId === 'profile') renderProfileStats();
    if (tabId === 'routine') renderRoutine();
}

function updateUserName(name) {
    const hName = document.getElementById('header-user-name');
    const wTitle = document.getElementById('welcome-title');
    const userInput = document.getElementById('user-name-input');

    let dn = (name || 'Você').trim().split(' ')[0];
    dn = dn.charAt(0).toUpperCase() + dn.slice(1);

    if (hName) hName.textContent = 'Oi, ' + dn;
    if (wTitle) wTitle.innerHTML = `Olá, <em>${dn}</em>! Seu Lumi<br>está pronto pra te cuidar. ✦`;
    if (userInput && !userInput.dataset.focused) userInput.value = name || dn;
}

/* ============ 6. SISTEMA DE MOEDAS / XP ============ */
function updateCoinsUI() {
    const counters = document.querySelectorAll('.coin-count');
    counters.forEach(el => el.textContent = state.coins);
    const badge = document.querySelector('.coins-badge');
    if (badge) {
        badge.classList.remove('pop');
        void badge.offsetWidth;
        badge.classList.add('pop');
    }
}

function addCoins(amount, showParticles = true) {
    state.coins += amount;
    updateCoinsUI();
    if (showParticles && amount > 0) triggerConfetti();
    saveState();
}

function addXP(amount) {
    state.xp = (state.xp || 0) + amount;
    const xpForNextLevel = state.level * 200;
    if (state.xp >= xpForNextLevel) {
        state.xp -= xpForNextLevel;
        state.level++;
        setTimeout(() => showToast(`🎊 Nível ${state.level} alcançado!`, 'success'), 600);
    }
    updateXpUI();
    saveState();
}

function updateXpUI() {
    const xpFill = document.getElementById('xp-bar');
    const xpLabel = document.getElementById('xp-label');
    const levelLabel = document.getElementById('level-label');
    const xpForNext = (state.level || 1) * 200;
    const pct = Math.min(100, ((state.xp || 0) / xpForNext) * 100);
    if (xpFill) xpFill.style.width = pct + '%';
    if (xpLabel) xpLabel.textContent = `${state.xp || 0} / ${xpForNext} XP`;
    if (levelLabel) levelLabel.textContent = `Nível ${state.level || 1}`;
}

function updateStreakUI() {
    const streakEl = document.getElementById('streak-count');
    if (streakEl) streakEl.textContent = state.streak || 1;
}

/* ============ 7. SISTEMA DE PROGRESSO ============ */
function updateProgress() {
    const items = state.products.filter(p => p.inRoutine);
    const total = items.length;
    const done = items.filter(p => state.checkedToday[p.id]).length;

    document.querySelectorAll('.completed-count').forEach(el => el.textContent = done);
    document.querySelectorAll('.total-count').forEach(el => el.textContent = total);

    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    const bar = document.getElementById('progress-bar-inner');
    const pctEl = document.getElementById('progress-percent');
    if (bar) bar.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';

    // Lumi fica mais feliz conforme progresso
    updateLumiMood(pct);
}

function updateLumiMood(pct) {
    if (pct >= 100) {
        state.lumi.mood = 'happy';
        applyLumiToAll();
        return;
    }
    state.lumi.mood = pct >= 50 ? 'happy' : 'neutral';
    applyLumiToAll();
}

/* ============ 8. ROTINA ============ */
function renderRoutine() {
    const container = document.getElementById('routine-list');
    if (!container) return;
    container.innerHTML = '';

    const routineItems = state.products.filter(p => p.inRoutine);

    if (routineItems.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--text-muted)">
                <div style="font-size:3rem;margin-bottom:12px">🌿</div>
                <p style="font-weight:600">Sua rotina está vazia!</p>
                <p style="font-size:13px;margin-top:6px">Adicione produtos na aba <strong>Produtos</strong> e marque-os para a rotina.</p>
            </div>`;
        updateProgress();
        return;
    }

    routineItems.forEach((product, idx) => {
        const isDone = !!state.checkedToday[product.id];
        const div = document.createElement('div');
        div.className = `routine-item${isDone ? ' completed' : ''}`;
        div.id = 'ri-' + product.id;
        div.innerHTML = `
            <div class="step-number">${idx + 1}</div>
            <div class="routine-item-info">
                <h4>${escHtml(product.name)}</h4>
                <p>${escHtml(product.notes || getCategoryLabel(product.category))}</p>
            </div>
            <button class="check-circle${isDone ? ' active' : ''}" onclick="toggleCheck('${product.id}')" title="Marcar como feito">
                <i class="fa-solid fa-check"></i>
            </button>`;
        container.appendChild(div);
    });

    updateProgress();
}

function toggleCheck(productId) {
    const isDone = !!state.checkedToday[productId];
    state.checkedToday[productId] = !isDone;

    const item = document.getElementById('ri-' + productId);
    const btn = item ? item.querySelector('.check-circle') : null;

    if (!isDone) {
        item?.classList.add('completed');
        btn?.classList.add('active');
        addCoins(25, true);
        addXP(30);
        showToast('Passo concluído! +25 moedas 🌟', 'success');
        checkAchievement('firstStep');
        triggerLumiHappy();
    } else {
        item?.classList.remove('completed');
        btn?.classList.remove('active');
    }

    updateProgress();
    saveState();
}

/* ============ 9. PRODUTOS ============ */
function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    state.products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card animate-fade-in';
        card.innerHTML = `
            <span class="product-tag ${getTagClass(p.category)}">${getCategoryLabel(p.category)}</span>
            <h3>${escHtml(p.name)}</h3>
            ${p.brand ? `<span class="brand">🏷 ${escHtml(p.brand)}</span>` : ''}
            <p>${escHtml(p.notes || 'Produto adicionado à sua coleção.')}</p>
            <div class="product-card-actions">
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;color:var(--text-muted);flex:1">
                    <input type="checkbox" onchange="toggleProductRoutine('${p.id}', this.checked)" 
                           ${p.inRoutine ? 'checked' : ''}
                           style="accent-color:var(--jungle-green);width:16px;height:16px">
                    Na rotina
                </label>
                <button class="product-delete-btn" onclick="deleteProduct('${p.id}')" title="Remover produto">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>`;
        grid.appendChild(card);
    });

    // Card "Adicionar"
    const addCard = document.createElement('div');
    addCard.className = 'add-product-card';
    addCard.onclick = () => openAddProductModal();
    addCard.innerHTML = `
        <div class="add-icon"><i class="fa-solid fa-plus"></i></div>
        <p>Adicionar Produto</p>
        <span style="font-size:12px;color:var(--text-muted)">Clique para cadastrar</span>`;
    grid.appendChild(addCard);
}

function toggleProductRoutine(productId, isIn) {
    const product = state.products.find(p => p.id === productId);
    if (product) {
        product.inRoutine = isIn;
        if (!isIn) delete state.checkedToday[productId];
        renderRoutine();
        saveState();
    }
}

function deleteProduct(productId) {
    state.products = state.products.filter(p => p.id !== productId);
    delete state.checkedToday[productId];
    renderProducts();
    renderRoutine();
    saveState();
    showToast('Produto removido.', 'info');
}

/* --- Modal de Adicionar Produto --- */
function openAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    if (!modal) return;
    document.getElementById('new-prod-name').value = '';
    document.getElementById('new-prod-brand').value = '';
    document.getElementById('new-prod-notes').value = '';
    document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('selected'));
    document.querySelector('.category-chip[data-cat="limpeza"]')?.classList.add('selected');
    openModal(modal);
}

function selectCategory(cat, el) {
    document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
}

function saveNewProduct() {
    const name = document.getElementById('new-prod-name').value.trim();
    const brand = document.getElementById('new-prod-brand').value.trim();
    const notes = document.getElementById('new-prod-notes').value.trim();
    const catEl = document.querySelector('.category-chip.selected');
    const cat = catEl ? catEl.dataset.cat : 'limpeza';

    if (!name) { showToast('Dê um nome ao produto!', 'warning'); return; }

    const newProduct = { id: genId(), name, brand, category: cat, notes, inRoutine: true };
    state.products.push(newProduct);

    closeModal(document.getElementById('add-product-modal'));
    renderProducts();
    renderRoutine();
    saveState();
    showToast(`"${name}" adicionado à sua coleção! ✨`, 'success');
    addCoins(10, false);
}

/* ============ 10. HIDRATAÇÃO ============ */
function drinkWater(glassNum) {
    if (glassNum <= state.waterDrunk) {
        showToast('Você já contou essa água! Continue no próximo copo. 💧', 'info');
        return;
    }
    const newGlasses = glassNum - state.waterDrunk;
    state.waterDrunk = glassNum;
    document.getElementById('water-count').textContent = state.waterDrunk;

    for (let i = 1; i <= 6; i++) {
        const glass = document.getElementById(`glass-${i}`);
        if (glass && i <= state.waterDrunk) glass.classList.add('full');
    }
    const earned = newGlasses * 10;
    addCoins(earned, true);
    addXP(earned);
    showToast(`Hidratação registrada! +${earned} moedas 💧`, 'success');

    if (state.waterDrunk >= 6) checkAchievement('hydrated');
    saveState();
}

/* ============ 11. UV / CLIMA ============ */
async function fetchRealUV() {
    const uvText = document.getElementById('uv-value-text');
    const uvTip = document.getElementById('uv-tip-text');
    if (!uvText || !uvTip) return;

    try {
        // Pega localização do usuário se possível, senão usa SP
        let lat = -23.5505, lon = -46.6333;
        if (navigator.geolocation) {
            await new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    pos => { lat = pos.coords.latitude; lon = pos.coords.longitude; resolve(); },
                    () => resolve(),
                    { timeout: 3000 }
                );
            });
        }
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=uv_index,temperature_2m&timezone=America/Sao_Paulo`);
        const data = await res.json();
        const uv = data.current.uv_index;
        const temp = data.current.temperature_2m;

        let status, color, msg, icon;
        if (uv <= 2) { status = 'Baixo'; color = '#4CAF50'; msg = 'Protetor solar ainda é bem-vindo! ☀️'; icon = '🌤️'; }
        else if (uv <= 5) { status = 'Moderado'; color = '#FFC107'; msg = 'Aplique protetor solar antes de sair. 🌞'; icon = '☀️'; }
        else if (uv <= 7) { status = 'Alto'; color = '#FF9800'; msg = 'Sol forte! Reaplique o protetor a cada 2h. 🧴'; icon = '🌡️'; }
        else { status = 'Muito Alto'; color = '#F44336'; msg = 'Proteja-se! Sombra, óculos e bastante protetor solar. 🚨'; icon = '⚠️'; }

        uvText.innerHTML = `<span style="color:${color};font-weight:700">${status} (${uv})</span> · ${temp ? `${temp}°C` : ''}`;
        uvTip.textContent = msg;
        document.querySelector('.uv-icon').textContent = icon;
    } catch {
        uvText.textContent = 'Indisponível';
        uvTip.textContent = 'Não foi possível carregar dados do clima.';
    }
}

/* ============ 12. AVATAR LUMI ============ */
function applyLumiToAll() {
    const contexts = ['nav', 'dash', 'profile', 'modal'];
    contexts.forEach(prefix => applyLumiToContext(prefix));
}

function applyLumiToContext(prefix) {
    const container = document.getElementById(`${prefix}-lumi-color`);
    if (!container) return;

    // Cor
    container.style.backgroundColor = state.lumi.color;

    // Olhos femininos
    container.querySelectorAll('.lumi-eye').forEach(eye => {
        eye.classList.toggle('fem', state.lumi.isFemale);
    });

    // Boca por humor
    const mouth = container.querySelector('.lumi-mouth');
    if (mouth) {
        mouth.classList.toggle('happy', state.lumi.mood === 'happy');
    }

    // Bochechas cor
    container.querySelectorAll('.lumi-cheek').forEach(c => {
        c.style.background = state.lumi.mood === 'happy' ? '#FF6B6B' : '#FFB3BA';
    });

    // Acessório
    const accDiv = document.getElementById(`${prefix}-lumi-accessory`);
    if (accDiv) {
        accDiv.className = 'lumi-accessory';
        accDiv.innerHTML = '';
        if (state.lumi.accessory) {
            accDiv.classList.add(state.lumi.accessory);
            const emojis = { laco: '🎀', oculos: '🕶️', coroa: '👑', chapeu: '🎩', estrelas: '✨✨' };
            accDiv.textContent = emojis[state.lumi.accessory] || '';
        }
    }
}

function triggerLumiHappy() {
    document.querySelectorAll('.lumi-avatar').forEach(el => {
        el.classList.remove('lumi-happy');
        void el.offsetWidth;
        el.classList.add('lumi-happy');
        setTimeout(() => el.classList.remove('lumi-happy'), 650);
    });
}

const LUMI_CUTE_QUOTES = [
    "O Lumi te ama muito! 💕",
    "Pele hidratada é pele feliz! 🌸",
    "Você está radiante hoje! ✨",
    "Não se esqueça do protetor solar, viu? ☀️",
    "O Lumi mandou um abraço bem quentinho! 🥰",
    "Cada cuidado hoje é amor próprio! 🌿",
    "Beba água e arrase! 💧✨"
];

function petLumi() {
    triggerLumiHappy();
    const randomQuote = LUMI_CUTE_QUOTES[Math.floor(Math.random() * LUMI_CUTE_QUOTES.length)];
    showToast(randomQuote, 'info');
    triggerConfetti();
}

/* --- Customizer Modal --- */
function openCustomizerModal() {
    const modal = document.getElementById('customizer-modal');
    openModal(modal);
    // Sincronizar estado atual no modal
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.color === state.lumi.color);
    });
    const femToggle = document.getElementById('fem-toggle');
    if (femToggle) femToggle.checked = state.lumi.isFemale;
    
    const accSelect = document.getElementById('accessory-select');
    if (accSelect) {
        accSelect.innerHTML = '<option value="">Nenhum</option>';
        state.inventory.forEach(item => {
            const names = { laco: 'Laço Rosa 🎀', oculos: 'Óculos Escuros 🕶️', coroa: 'Coroa Dourada 👑', chapeu: 'Chapéu de Mágico 🎩', estrelas: 'Estrelinhas ✨' };
            accSelect.innerHTML += `<option value="${item}" ${state.lumi.accessory === item ? 'selected' : ''}>${names[item] || item}</option>`;
        });
    }
    applyLumiToContext('modal');
}

function selectColor(hex, el) {
    state.lumi.color = hex;
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    applyLumiToContext('modal');
}

function toggleFeminine(checked) {
    state.lumi.isFemale = checked;
    applyLumiToContext('modal');
}

function equipAccessory(val) {
    state.lumi.accessory = val;
    applyLumiToContext('modal');
}

function saveCustomization() {
    applyLumiToAll();
    closeModal(document.getElementById('customizer-modal'));
    showToast('Lumi atualizado! Ficou lindo(a) 💖', 'success');
    saveState();
}

/* ============ 13. LOJA ============ */
const SHOP_ITEMS = [
    { id: 'laco',    name: 'Laço Rosa',          emoji: '🎀', desc: 'Um detalhe fofo para seu Lumi.', price: 100, badge: 'Novo' },
    { id: 'oculos',  name: 'Óculos Escuros',      emoji: '🕶️', desc: 'Estilo e proteção (virtual).', price: 150, badge: null },
    { id: 'coroa',   name: 'Coroa Dourada',       emoji: '👑', desc: 'Para a realeza do skincare.', price: 300, badge: 'Raro' },
    { id: 'chapeu',  name: 'Chapéu de Mágico',    emoji: '🎩', desc: 'Uma virada mágica no visual.', price: 200, badge: null },
    { id: 'estrelas', name: 'Estrelinhas',        emoji: '✨', desc: 'Brilhe sempre que precisar.', price: 80,  badge: 'Popular' },
];

function renderShop() {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const saldo = document.getElementById('shop-coin-counter');
    if (saldo) saldo.textContent = state.coins;

    SHOP_ITEMS.forEach(item => {
        const owned = state.inventory.includes(item.id);
        const card = document.createElement('div');
        card.className = `shop-card${owned ? ' owned' : ''}`;
        card.innerHTML = `
            ${item.badge ? `<div class="shop-card-badge">${item.badge}</div>` : ''}
            <div class="shop-item-preview">${item.emoji}</div>
            <h3>${item.name}</h3>
            <p>${item.desc}</p>
            <div class="shop-price"><i class="fa-solid fa-coins"></i> ${item.price}</div>
            <button class="btn-primary w-full" style="width:100%;padding:12px" onclick="buyItem('${item.id}', ${item.price})">
                ${owned ? 'Possuído ✓' : 'Comprar'}
            </button>`;
        grid.appendChild(card);
    });
}

function buyItem(itemId, price) {
    if (state.inventory.includes(itemId)) {
        showToast('Você já tem este item!', 'info'); return;
    }
    if (state.coins < price) {
        showToast('Moedas insuficientes! Complete a rotina para ganhar mais. 💪', 'warning'); return;
    }
    state.coins -= price;
    state.inventory.push(itemId);
    updateCoinsUI();
    renderShop();
    showToast(`Item comprado! Equipe no seu Lumi. 🎁`, 'success');
    triggerConfetti();
    checkAchievement('shopaholic');
    saveState();
}

/* ============ 14. DIÁRIO E CALENDÁRIO ============ */
function loadPhoto(event, imgId) {
    const img = document.getElementById(imgId);
    const file = event.target.files[0];
    if (file && img) {
        img.src = URL.createObjectURL(file);
        img.style.display = 'block';
    }
}

function savePhotosToDate() {
    const hasPhoto = ['preview-left', 'preview-front', 'preview-right'].some(id => {
        const img = document.getElementById(id);
        return img && img.src && img.style.display !== 'none';
    });
    if (!hasPhoto) {
        showToast('Adicione pelo menos uma foto para registrar no diário.', 'warning'); return;
    }
    state.lastPhotoDate = new Date().getDate();
    renderCalendar();
    addCoins(50, true);
    addXP(50);
    showToast('Fotos registradas no calendário! +50 moedas 📸', 'success');
    checkAchievement('photographer');
    saveState();
}

function renderCalendar() {
    const calBody = document.getElementById('calendar-body');
    const calMonth = document.getElementById('calendar-month');
    if (!calBody) return;

    const now = new Date(state.calendarYear, state.calendarMonth, 1);
    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    if (calMonth) calMonth.textContent = `${monthNames[state.calendarMonth]} ${state.calendarYear}`;

    const daysInMonth = new Date(state.calendarYear, state.calendarMonth + 1, 0).getDate();
    const startDay = now.getDay(); // 0=Sunday
    const today = new Date();
    const isCurrentMonth = today.getMonth() === state.calendarMonth && today.getFullYear() === state.calendarYear;
    const todayDate = isCurrentMonth ? today.getDate() : -1;
    const interval = parseInt(document.getElementById('photo-interval')?.value || '15');

    calBody.innerHTML = '';
    for (let i = 0; i < startDay; i++) {
        calBody.innerHTML += `<div class="calendar-day empty"></div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
        let cls = 'calendar-day';
        if (d === todayDate) cls += ' today';
        if (state.lastPhotoDate && d === state.lastPhotoDate && isCurrentMonth) cls += ' photo-day';
        if (state.lastPhotoDate && d === state.lastPhotoDate + interval && isCurrentMonth) cls += ' next-photo';
        calBody.innerHTML += `<div class="${cls}" onclick="onCalDayClick(${d})">${d}</div>`;
    }
}

function prevMonth() {
    state.calendarMonth--;
    if (state.calendarMonth < 0) { state.calendarMonth = 11; state.calendarYear--; }
    renderCalendar();
}
function nextMonth() {
    state.calendarMonth++;
    if (state.calendarMonth > 11) { state.calendarMonth = 0; state.calendarYear++; }
    renderCalendar();
}

function onCalDayClick(day) {
    // Futuro: abrir fotos do dia
}

function updateCalendarHighlights() { renderCalendar(); }

/* ============ 15. PERFIL ============ */
function renderProfileStats() {
    const el = id => document.getElementById(id);
    if (el('stat-coins')) el('stat-coins').textContent = state.coins;
    if (el('stat-streak')) el('stat-streak').textContent = state.streak || 1;
    if (el('stat-level')) el('stat-level').textContent = state.level || 1;
    if (el('stat-products')) el('stat-products').textContent = state.products.length;

    const skinSelect = document.getElementById('skin-type');
    if (skinSelect && state.skinType) skinSelect.value = state.skinType;

    const nameInput = document.getElementById('user-name-input');
    if (nameInput) { nameInput.value = state.userName || ''; nameInput.dataset.focused = ''; }

    updateAccountUI();
    renderAchievements();
}

function updateAccountUI() {
    const nameEl = document.getElementById('account-user-name');
    const emailEl = document.getElementById('account-user-email');
    const avatarSlot = document.getElementById('account-avatar-slot');
    const actionBtn = document.getElementById('btn-account-action');

    const isGoogle = Boolean(firebaseUser);
    const displayName = state.userName || (firebaseUser && firebaseUser.displayName) || 'Usuária Gloomi';
    const email = state.userEmail || (firebaseUser && firebaseUser.email) || 'Modo Convidada (Local)';
    const photoURL = state.userPhoto || (firebaseUser && firebaseUser.photoURL);

    if (nameEl) nameEl.textContent = displayName;
    if (emailEl) {
        if (isGoogle) {
            emailEl.innerHTML = `<span class="cloud-sync-pill"><i class="fa-solid fa-cloud"></i> Google: ${escHtml(email)}</span>`;
        } else {
            emailEl.textContent = 'Salvo no navegador (Modo Convidada)';
        }
    }

    if (avatarSlot) {
        if (photoURL) {
            avatarSlot.innerHTML = `<img src="${escHtml(photoURL)}" alt="Avatar" class="account-user-photo" onerror="this.onerror=null;this.replaceWith(document.createElement('div'))">`;
        } else {
            const initial = displayName.charAt(0).toUpperCase() || 'G';
            avatarSlot.innerHTML = `<div class="account-user-placeholder">${initial}</div>`;
        }
    }

    if (actionBtn) {
        if (isGoogle) {
            actionBtn.innerHTML = `<i class="fa-solid fa-arrow-right-from-bracket"></i> Sair`;
            actionBtn.className = 'btn-logout';
        } else {
            actionBtn.innerHTML = `<i class="fa-brands fa-google"></i> Conectar`;
            actionBtn.className = 'btn-logout';
            actionBtn.style.color = '#1E6645';
            actionBtn.style.borderColor = 'rgba(79,174,130,0.3)';
            actionBtn.style.background = 'rgba(79,174,130,0.08)';
        }
    }
}

function handleAccountAction() {
    if (firebaseUser) {
        logout();
    } else {
        loginWithGoogle();
    }
}

function logout() {
    if (window.gloomiFirebase && window.gloomiFirebase.auth) {
        window.gloomiFirebase.auth.signOut().catch(e => console.warn(e));
    }
    firebaseUser = null;
    currentUser = null;

    showToast('Você saiu da conta. Até logo! ✦', 'info');

    const mainApp = document.getElementById('main-app');
    if (mainApp) mainApp.style.display = 'none';

    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
        loginScreen.style.display = 'flex';
        setTimeout(() => { loginScreen.style.opacity = '1'; }, 30);
    }
}

function updateUserNameFromInput(val) {
    state.userName = val;
    updateUserName(val);
    saveState();
}

function saveSkinType(val) {
    state.skinType = val;
    saveState();
}

function renderAchievements() {
    const container = document.getElementById('achievements-container');
    if (!container) return;
    const allAch = [
        { key: 'firstStep', icon: '🌟', label: 'Primeiro Passo', desc: 'Completou um passo da rotina' },
        { key: 'hydrated', icon: '💧', label: 'Hidratação Plena', desc: '6 copos de água em um dia' },
        { key: 'weekStreak', icon: '🔥', label: 'Semana em Chamas', desc: '7 dias seguidos' },
        { key: 'photographer', icon: '📸', label: 'Fotógrafa da Pele', desc: 'Registrou fotos no diário' },
        { key: 'shopaholic', icon: '🛍️', label: 'Shopaholic Lumi', desc: 'Fez a primeira compra na loja' },
    ];
    container.innerHTML = '';
    allAch.forEach(a => {
        const unlocked = state.achievements[a.key];
        const badge = document.createElement('div');
        badge.className = `achievement-badge${unlocked ? ' unlocked' : ''}`;
        badge.title = a.desc;
        badge.innerHTML = `<span class="ach-icon">${unlocked ? a.icon : '🔒'}</span> ${a.label}`;
        container.appendChild(badge);
    });
}

function checkAchievement(key) {
    if (!state.achievements) state.achievements = {};
    if (!state.achievements[key]) {
        state.achievements[key] = true;
        const names = { firstStep: 'Primeiro Passo', hydrated: 'Hidratação Plena', weekStreak: 'Semana em Chamas', photographer: 'Fotógrafa da Pele', shopaholic: 'Shopaholic Lumi' };
        setTimeout(() => showToast(`🏆 Conquista desbloqueada: "${names[key]}"!`, 'success'), 1200);
        addXP(100);
        saveState();
    }
}

/* ============ 16. MODALS GENÉRICOS ============ */
function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.style.display = 'flex';
    setTimeout(() => modalEl.classList.add('open'), 10);
}

function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('open');
    modalEl.style.opacity = '0';
    setTimeout(() => {
        modalEl.style.display = 'none';
        modalEl.style.opacity = '';
    }, 300);
}

/* Compatibilidade com código antigo */
function openModal_legacy() { openCustomizerModal(); }

/* ============ 17. TOASTS ============ */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const icons = { success: '✨', warning: '⚠️', info: '💡', error: '❌' };
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || '💡'}</span><div class="toast-msg">${message}</div>`;
    container.appendChild(toast);
    void toast.offsetHeight;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

/* ============ 18. CONFETTI ============ */
function triggerConfetti() {
    const colors = ['#944654', '#57A470', '#CB93B5', '#FFD700', '#A6F4DC'];
    for (let i = 0; i < 16; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.cssText = `
            left: ${Math.random() * 100}vw;
            top: ${Math.random() * 40 + 10}vh;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            animation-delay: ${Math.random() * 0.5}s;
            animation-duration: ${0.8 + Math.random() * 0.6}s;
            transform: rotate(${Math.random() * 360}deg);
        `;
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 1600);
    }
}

/* ============ 19. SAVE / LOAD & FIRESTORE SYNC ============ */
let firestoreSyncTimeout = null;

function saveState() {
    if (!currentUser) return;

    // 1. Persistência local imediata
    localStorage.setItem('gloomi_user_' + currentUser, JSON.stringify(state));

    // 2. Sincronização na nuvem com Firebase Firestore
    if (firebaseUser && window.gloomiFirebase && window.gloomiFirebase.db) {
        clearTimeout(firestoreSyncTimeout);
        firestoreSyncTimeout = setTimeout(() => {
            syncStateToFirestore();
        }, 600);
    }
}

function syncStateToFirestore() {
    if (!firebaseUser || !window.gloomiFirebase.db) return;

    const dataToSave = {
        ...state,
        lastSyncedAt: new Date().toISOString()
    };

    window.gloomiFirebase.db.collection('users').doc(firebaseUser.uid)
        .set(dataToSave, { merge: true })
        .then(() => {
            console.log('[Gloomi Firebase] Sincronizado com sucesso no Firestore!');
        })
        .catch(err => {
            console.warn('[Gloomi Firebase] Falha ao sincronizar com Firestore:', err);
        });
}

/* ============ 20. UTILITÁRIOS ============ */
function genId() {
    return Math.random().toString(36).substr(2, 9);
}

function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getCategoryLabel(cat) {
    const labels = {
        limpeza: 'Limpeza',
        hidratacao: 'Hidratação',
        protecao: 'Proteção',
        tratamento: 'Tratamento',
        tonico: 'Tônico',
        esfoliante: 'Esfoliante'
    };
    return labels[cat] || cat;
}

function getTagClass(cat) {
    const classes = {
        limpeza: 'tag-limpeza',
        hidratacao: 'tag-hidratacao',
        protecao: 'tag-protecao',
        tratamento: 'tag-tratamento',
        tonico: 'tag-tonico',
        esfoliante: 'tag-esfoliante'
    };
    return classes[cat] || 'tag-limpeza';
}