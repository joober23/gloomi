        /* 1. ESTADO GLOBAL */
        let state = {
            coins: 50, // Começa com 50 de brinde
            completedProducts: 0,
            totalProducts: 2,
            waterDrunk: 0,
            lumi: {
                color: '#FFB3BA',
                isFemale: false,
                accessory: ''
            },
            inventory: [], // Itens comprados na loja
            lastPhotoDate: null
        };

        const today = new Date(2026, 8, 12); // Usando a data do contexto: Setembro 12, 2026

        /* 2. INICIALIZAÇÃO E TELAS */
        window.onload = () => {
            // Animação da Splash Screen
            setTimeout(() => {
                const splash = document.getElementById('splash-screen');
                splash.style.opacity = '0';
                setTimeout(() => {
                    splash.style.display = 'none';
                    const loginScreen = document.getElementById('login-screen');
                    loginScreen.classList.remove('hidden');
                    loginScreen.classList.add('flex');
                    setTimeout(() => { loginScreen.style.opacity = '1'; }, 50);
                }, 700);
            }, 2500);

            // Iniciar dados na UI
            updateCoinsUI();
            fetchRealUV();
            renderCalendar();
            updateUserName("Usuário"); // Nome default temporário
        };

        let tempUserData = {}; // Guarda os dados temporários do onboarding

        function doLogin() {
            const loginName = document.getElementById('login-name').value.trim();
            if(!loginName) {
                showTip("Por favor, digite seu nome de usuário.", "warning");
                return;
            }

            // Verifica se o usuário existe no LocalStorage
            const storageKey = 'gloomi_user_' + loginName.toLowerCase();
            const storedUser = localStorage.getItem(storageKey);

            const loginScreen = document.getElementById('login-screen');
            loginScreen.style.opacity = '0';

            setTimeout(() => {
                loginScreen.style.display = 'none';

                if (storedUser) {
                    // Usuário existente - Pula questionário
                    const userData = JSON.parse(storedUser);
                    
                    // Sincroniza dados salvos com a interface
                    updateUserName(userData.name);
                    const skinSelect = document.getElementById('skin-type');
                    if(skinSelect) skinSelect.value = userData.skinType || 'mista';
                    
                    // Exibe o App
                    showMainApp();
                    showTip(`Que bom te ver de volta, ${userData.name}!`, "success");
                } else {
                    // Novo usuário - Vai para o Onboarding
                    tempUserData.name = loginName;
                    showOnboarding();
                }
            }, 700);
        }

        function showOnboarding() {
            const obScreen = document.getElementById('onboarding-screen');
            obScreen.classList.remove('hidden');
            obScreen.classList.add('flex');
            setTimeout(() => { obScreen.style.opacity = '1'; }, 50);
        }

        function goToOnboardingStep(step) {
            // Validação simples do Passo 1 antes de avançar
            if(step === 2) {
                if(!document.getElementById('ob-skin-type').value || 
                   !document.getElementById('ob-skin-condition').value || 
                   !document.getElementById('ob-age').value) {
                    showTip("Preencha todos os campos para continuar.", "warning");
                    return;
                }
            }

            document.getElementById('ob-step-1').classList.add('hidden');
            document.getElementById('ob-step-2').classList.add('hidden');
            document.getElementById('ob-step-3a').classList.add('hidden');
            document.getElementById('ob-step-3b').classList.add('hidden');
            document.getElementById('ob-step-3a').classList.remove('flex');
            document.getElementById('ob-step-3b').classList.remove('flex');

            const nextStep = document.getElementById('ob-step-' + step);
            nextStep.classList.remove('hidden');
            nextStep.classList.add('flex');
        }

        function setExperience(hasExperience) {
            tempUserData.hasExperience = hasExperience;
            if (hasExperience) {
                goToOnboardingStep('3a');
            } else {
                goToOnboardingStep('3b');
            }
        }

        function finishOnboarding(action) {
            // Coleta os dados respondidos
            tempUserData.skinType = document.getElementById('ob-skin-type').value;
            tempUserData.skinCondition = document.getElementById('ob-skin-condition').value;
            tempUserData.age = document.getElementById('ob-age').value;

            // Tratamento de ações opcionais
            if (action === 'add_product') {
                const prodName = document.getElementById('ob-prod-name').value.trim();
                if(prodName) {
                    setTimeout(() => showTip(`Produto "${prodName}" adicionado à sua rotina!`, "success"), 1500);
                }
            } else if (action === 'start_basic') {
                setTimeout(() => showTip("Rotina básica gerada para você! Pode acessá-la na aba Produtos.", "success"), 1500);
            }

            // Salva no LocalStorage permanentemente
            const storageKey = 'gloomi_user_' + tempUserData.name.toLowerCase();
            localStorage.setItem(storageKey, JSON.stringify(tempUserData));

            // Sincroniza e entra no App
            document.getElementById('skin-type').value = tempUserData.skinType;
            updateUserName(tempUserData.name);

            const obScreen = document.getElementById('onboarding-screen');
            obScreen.style.opacity = '0';
            
            setTimeout(() => {
                obScreen.classList.add('hidden');
                obScreen.classList.remove('flex');
                showMainApp();
                showTip("Perfil criado com sucesso! Ganhou +50 moedas.", "success");
                addCoins(50); // Recompensa por terminar o cadastro
            }, 700);
        }

        function showMainApp() {
            const mainApp = document.getElementById('main-app');
            mainApp.classList.remove('hidden');
            mainApp.classList.add('block');
            document.getElementById('tab-routine').classList.add('active');
        }

        /* 3. NAVEGAÇÃO */
        function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.nav-link-mob').forEach(btn => btn.classList.remove('text-[#944654]'));
            
            const targetTab = document.getElementById('tab-' + tabId);
            if(targetTab) targetTab.classList.add('active');
            
            // Desktop nav active state
            const deskBtns = document.querySelectorAll(`.nav-link[onclick="switchTab('${tabId}')"]`);
            deskBtns.forEach(b => b.classList.add('active'));

            // Mobile nav active state (poor man's color change)
            const mobBtns = document.querySelectorAll(`.nav-link-mob[onclick="switchTab('${tabId}')"]`);
            mobBtns.forEach(b => {
                b.classList.remove('text-[#8F7C83]');
                b.classList.add('text-[#944654]');
            });

            // Se for aba diário, re-renderizar calendário para ajustar tamanhos se necessário
            if(tabId === 'diary') renderCalendar();
        }

        function updateUserName(name) {
            const headerName = document.getElementById('header-user-name');
            const welcomeTitle = document.getElementById('welcome-title');
            
            let displayName = name.trim() === '' ? 'Usuário' : name.split(' ')[0];
            displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

            if(headerName) headerName.textContent = 'Oi, ' + displayName;
            if(welcomeTitle) welcomeTitle.innerHTML = `Olá ${displayName}, seu Lumi está pronto<br>para cuidar da sua pele!`;
        }

        /* 4. SISTEMA FINANCEIRO E TOASTS */
        function updateCoinsUI() {
            document.getElementById('coin-counter').innerText = state.coins;
            document.getElementById('shop-coin-counter').innerText = state.coins;
        }

        function addCoins(amount) {
            state.coins += amount;
            updateCoinsUI();
        }

        function showTip(message, type = "info") {
            const container = document.getElementById('toast-container');
            if(!container) return;
            const toast = document.createElement('div');
            toast.className = `toast ${type === 'success' ? 'toast-success' : ''}`;
            const icon = type === 'success' ? '✨' : (type === 'warning' ? '⚠️' : '💡');
            toast.innerHTML = `<span class="text-xl">${icon}</span> <div class="font-semibold text-[#33272A]">${message}</div>`;
            container.appendChild(toast);
            
            // Força o reflow para animação rodar
            toast.offsetHeight; 
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }

        /* 5. ROTINA E PROGRESSO */
        function toggleCheck(productId) {
            const productCard = document.getElementById(productId);
            const btn = productCard.querySelector('.check-circle');
            
            if (!productCard.classList.contains('completed')) {
                btn.classList.add('active');
                productCard.classList.add('completed');
                state.completedProducts++;
                addCoins(25);
                showTip("Passo de skincare concluído! +25 moedas", "success");
            } else {
                btn.classList.remove('active');
                productCard.classList.remove('completed');
                state.completedProducts--;
                // Remover moedas seria punitivo, não faremos.
            }
            updateProgress();
        }

        function updateProgress() {
            document.getElementById('completed-count').innerText = state.completedProducts;
            let percentage = (state.completedProducts / state.totalProducts) * 100;
            document.getElementById('progress-bar-inner').style.width = percentage + '%';
            document.getElementById('progress-percent').innerText = Math.round(percentage) + '%';
        }

        /* 6. HIDRATAÇÃO */
        function drinkWater(glassNumber) {
            if (glassNumber <= state.waterDrunk) {
                showTip("Você já bebeu essa água! Foque no próximo copo.", "info");
                return;
            }
            let newGlasses = glassNumber - state.waterDrunk;
            state.waterDrunk = glassNumber;
            document.getElementById('water-count').innerText = state.waterDrunk;
            
            for (let i = 1; i <= 6; i++) {
                const glass = document.getElementById(`glass-${i}`);
                if (glass && i <= state.waterDrunk) {
                    glass.classList.add('full');
                    glass.innerText = '💧';
                }
            }
            addCoins(newGlasses * 10);
            showTip(`Boa! Você ganhou +${newGlasses * 10} moedas por se hidratar!`, "success");
        }

        /* 7. ÍNDICE UV E CLIMA */
        async function fetchRealUV() {
            try {
                // Usando coordenadas de Itapetininga/SP baseadas no contexto
                const lat = -23.59;
                const lon = -48.05;
                const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=uv_index&timezone=America/Sao_Paulo`);
                const data = await response.json();
                
                const currentUV = data.current.uv_index;
                const uvValueText = document.getElementById('uv-value-text');
                const uvTipText = document.getElementById('uv-tip-text');
                
                let uvStatus = "", uvColor = "", uvMessage = "";
                
                if (currentUV <= 2) {
                    uvStatus = "Baixo"; uvColor = "#4CAF50"; uvMessage = "Tranquilo! Mas o protetor solar ainda é bem-vindo.";
                } else if (currentUV <= 5) {
                    uvStatus = "Moderado"; uvColor = "#FFC107"; uvMessage = "Atenção: Aplique seu protetor solar.";
                } else if (currentUV <= 7) {
                    uvStatus = "Alto"; uvColor = "#FF9800"; uvMessage = "Sol forte! Passe o protetor e evite sol direto.";
                } else {
                    uvStatus = "Muito Alto"; uvColor = "#F44336"; uvMessage = "Perigo! Fique na sombra e passe muito protetor!";
                }
                
                uvValueText.innerHTML = `${uvStatus} (${currentUV})`;
                uvValueText.style.color = uvColor;
                uvTipText.innerText = uvMessage;
            } catch(e) {
                document.getElementById('uv-value-text').innerText = "Indisponível";
                document.getElementById('uv-tip-text').innerText = "Não foi possível carregar os dados do clima.";
            }
        }

        /* 8. AVATAR LUMI E CUSTOMIZAÇÃO */
        function openModal() {
            const modal = document.getElementById('customizer-modal');
            const card = document.getElementById('modal-card');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            // Popular select de acessórios baseado no inventário
            const select = document.getElementById('accessory-select');
            select.innerHTML = '<option value="">Nenhum</option>';
            state.inventory.forEach(item => {
                let name = item === 'laco' ? 'Laço Rosa' : (item === 'oculos' ? 'Óculos' : 'Coroa');
                select.innerHTML += `<option value="${item}" ${state.lumi.accessory === item ? 'selected' : ''}>${name}</option>`;
            });

            setTimeout(() => {
                modal.style.opacity = '1';
                card.style.transform = 'scale(1)';
            }, 10);
        }

        function closeModal() {
            const modal = document.getElementById('customizer-modal');
            const card = document.getElementById('modal-card');
            modal.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        }

        function selectColor(hex, btnElement) {
            state.lumi.color = hex;
            document.querySelectorAll('.color-btn').forEach(btn => {
                btn.style.borderColor = 'white';
                btn.classList.remove('scale-110');
            });
            btnElement.style.borderColor = '#333';
            btnElement.classList.add('scale-110');
            updateLumiPreview('modal');
        }

        function toggleFeminine(isChecked) {
            state.lumi.isFemale = isChecked;
            updateLumiPreview('modal');
        }

        function equipAccessory(val) {
            state.lumi.accessory = val;
            updateLumiPreview('modal');
        }

        function updateLumiPreview(context) {
            // Contexts: 'modal', 'all'
            const classPrefixes = context === 'all' ? ['nav', 'dash', 'profile', 'modal'] : ['modal'];
            
            classPrefixes.forEach(prefix => {
                // Color
                const container = document.getElementById(`${prefix}-lumi-color`);
                if(container) container.style.backgroundColor = state.lumi.color;
                
                // Eyes (Feminine)
                const eyesList = container ? container.querySelectorAll('.lumi-eye') : [];
                eyesList.forEach(eye => {
                    if(state.lumi.isFemale) eye.classList.add('fem');
                    else eye.classList.remove('fem');
                });

                // Accessory
                const accDiv = document.getElementById(`${prefix}-lumi-accessory`);
                if(accDiv) {
                    accDiv.className = 'lumi-accessory'; // reset classes
                    accDiv.innerHTML = '';
                    if(state.lumi.accessory) {
                        accDiv.classList.add(state.lumi.accessory);
                        if(state.lumi.accessory === 'laco') accDiv.innerHTML = '🎀';
                        if(state.lumi.accessory === 'oculos') accDiv.innerHTML = '🕶️';
                        if(state.lumi.accessory === 'coroa') accDiv.innerHTML = '👑';
                    }
                }
            });
        }

        function saveCustomization() {
            updateLumiPreview('all');
            closeModal();
            showTip("Lumi atualizado com sucesso!", "success");
        }

        /* 9. LOJA */
        function buyItem(itemId, price) {
            if(state.inventory.includes(itemId)) {
                showTip("Você já possui este item!", "info");
                return;
            }
            if(state.coins >= price) {
                state.coins -= price;
                state.inventory.push(itemId);
                updateCoinsUI();
                showTip("Compra realizada com sucesso!", "success");
            } else {
                showTip("Moedas insuficientes. Complete a rotina para ganhar mais!", "warning");
            }
        }

        /* 10. DIÁRIO E CALENDÁRIO */
        function loadPhoto(event, imgId) {
            const img = document.getElementById(imgId);
            const file = event.target.files[0];
            if(file) {
                img.src = URL.createObjectURL(file);
                img.classList.remove('hidden');
            }
        }

        function renderCalendar() {
            const calBody = document.getElementById('calendar-body');
            calBody.innerHTML = '';
            
            // Simulação para o mês atual (Setembro 2026 começa na Terça, tem 30 dias)
            // Dia 1 = Terça (índice 2 na semana Domingo=0)
            const daysInMonth = 30;
            const startingDay = 2; 

            // Dias vazios no início
            for(let i=0; i < startingDay; i++) {
                calBody.innerHTML += `<div class="calendar-day empty"></div>`;
            }

            // Preenchendo os dias
            for(let i=1; i <= daysInMonth; i++) {
                let classes = "calendar-day";
                if(i === today.getDate()) classes += " today";
                
                // Lógica de Highlight
                if(state.lastPhotoDate) {
                    const interval = parseInt(document.getElementById('photo-interval').value);
                    if(i === state.lastPhotoDate) {
                        classes += " photo-day";
                    } else if (i === state.lastPhotoDate + interval) {
                        classes += " next-photo";
                    }
                }
                
                calBody.innerHTML += `<div class="${classes}">${i}</div>`;
            }
        }

        function updateCalendarHighlights() {
            if(state.lastPhotoDate) renderCalendar();
        }

        function savePhotosToDate() {
            // Verifica se tem pelo menos uma foto (verificando se o src não está vazio/hidden)
            const p1 = document.getElementById('preview-left').classList.contains('hidden');
            const p2 = document.getElementById('preview-front').classList.contains('hidden');
            const p3 = document.getElementById('preview-right').classList.contains('hidden');
            
            if(p1 && p2 && p3) {
                showTip("Adicione pelo menos uma foto para registrar no diário.", "warning");
                return;
            }

            state.lastPhotoDate = today.getDate(); // Registra no dia atual
            renderCalendar();
            showTip("Fotos registradas com sucesso no calendário!", "success");
            
            // Recompensa extra
            addCoins(50);
            setTimeout(() => showTip("Bônus por registrar evolução: +50 moedas!", "success"), 2000);
        }