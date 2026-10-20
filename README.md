# Gloomi ✦

> Seu assistente pessoal e gamificado de skincare com Liquid Glass Design e nuvem Firebase.

**Gloomi** é uma aplicação web de skincare gamificada com avatar Lumi interativo, rotina diária, sistema de moedas & XP, diário de fotos, loja de acessórios e sincronização na nuvem com **Firebase Authentication (Google Login)** e **Cloud Firestore**, além de backup offline em `localStorage`.

## ✨ Funcionalidades

- 🔐 **Autenticação com Google (Firebase Auth)** — entre com sua conta Google em um clique e acesse sua rotina de qualquer lugar.
- ☁️ **Sincronização em Nuvem (Cloud Firestore)** — todos os produtos, progresso, moedas, itens e customização do Lumi salvos em tempo real na nuvem.
- 🪞 **Avatar Lumi** — personalizável com cores, cílios e acessórios. Piscada animada, humor dinâmico e frases fofas ao interagir!
- 📋 **Rotina Diária** — adicione produtos por categoria e marque os passos concluídos.
- 💧 **Meta de Hidratação** — registre copos d'água e ganhe moedas.
- 🌡️ **Índice UV em tempo real** — via Open-Meteo API com geolocalização.
- 📸 **Diário de Fotos** — registre a evolução da pele com calendário mensal.
- 🏆 **Gamificação** — moedas, XP, níveis e sistema de conquistas.
- 🛍️ **Loja Lumi** — compre acessórios para o avatar com as moedas ganhas.
- 🎨 **Liquid Glass Design System** — estética translúcida inspirada em vidro líquido, bordas iluminadas e paleta Aurora Pastel.
- 📱 **Responsivo** — experiência perfeita tanto no celular quanto no desktop.

## 🛠️ Tecnologias

- HTML5 / CSS3 (Liquid Glass Design System custom)
- JavaScript puro (ES6+)
- Firebase SDK v10 (Authentication & Cloud Firestore)
- Font Awesome 6
- Google Fonts (Darumadrop One + Plus Jakarta Sans)
- Open-Meteo API (índice UV e temperatura)
- LocalStorage (persistência offline instantânea)

## 🔥 Configurando o Firebase (Google Login & Banco de Dados)

1. Acesse o [Firebase Console](https://console.firebase.google.com/) e crie um projeto (ex: `gloomi`).
2. Em **Visão Geral do Projeto**, adicione um App Web (`</>`) e copie o objeto `firebaseConfig`.
3. Abra o arquivo `firebase-config.js` e cole suas chaves no objeto:
   ```javascript
   const firebaseConfig = {
       apiKey: "SUA_API_KEY",
       authDomain: "seu-projeto.firebaseapp.com",
       projectId: "seu-projeto",
       storageBucket: "seu-projeto.appspot.com",
       messagingSenderId: "1234567890",
       appId: "1:1234567890:web:abcdef"
   };
   ```
4. No console do Firebase:
   - Vá em **Authentication** > **Sign-in method** > Ative o provedor **Google**.
   - Vá em **Firestore Database** > **Criar banco de dados** (em modo de teste ou configure as regras de leitura/escrita).
5. Pronto! Ao clicar em **"Entrar com o Google"**, seu login e banco de dados estarão 100% integrados.

> **Dica:** O Gloomi possui modo de fallback gracioso. Caso as credenciais do Firebase ainda não tenham sido configuradas, você pode clicar em **"Continuar como Convidada"** para usar normalmente com armazenamento no navegador (`localStorage`).

---

*Feito com 💖 — Cuide de você todos os dias.*
