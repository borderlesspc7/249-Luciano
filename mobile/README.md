# 249-Luciano Mobile (React Native / Expo)

App mobile da aplicação 249-Luciano, com suporte a **offline** (indicador de rede e uso do Firebase com cache).

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo Go no celular (para testar) ou Android Studio / Xcode para emulador

**SDK:** O projeto usa **Expo SDK 54** para compatibilidade com a versão atual do Expo Go no celular.

**Assets:** Os ícones mínimos (`icon.png`, `splash-icon.png`, `adaptive-icon.png`) já estão em `assets/`. Você pode substituí-los por ícones e splash de produção quando quiser.

## Configuração

1. **Instalar dependências**

   ```bash
   cd mobile
   npm install --legacy-peer-deps
   ```

   (Use `--legacy-peer-deps` se aparecer conflito de peer dependencies.)

2. **Variáveis de ambiente**

   Copie as chaves do Firebase do projeto web para o app mobile:

   ```bash
   cp .env.example .env
   ```

   Edite `.env` e preencha com os valores do seu projeto Firebase (os mesmos do `.env` da raiz do repositório). Use o prefixo `EXPO_PUBLIC_`:

   - `VITE_FIREBASE_API_KEY` → `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN` → `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - e assim por diante.

3. **Rodar o app**

   ```bash
   npx expo start
   ```

   Escaneie o QR code com o Expo Go (Android/iOS) ou pressione `a` (Android) / `i` (iOS) para abrir no emulador.

## Estrutura

- `app/` – Rotas (Expo Router): login, menu, projetos, etc.
- `components/` – Componentes reutilizáveis (ex.: `OfflineNotice`).
- `contexts/` – Auth e outros contextos.
- `hooks/` – `useAuth`, etc.
- `lib/` – Configuração do Firebase.
- `services/` – Serviços (auth, futuramente projetos, checklists).
- `types/` – Tipos TypeScript.
- `utils/` – Helpers (ex.: mensagens de erro do Firebase).

## Offline

- **Indicador:** Quando não houver internet, aparece um banner “Você está offline” (componente `OfflineNotice`).
- **Firebase:** O SDK web do Firebase (usado aqui) faz cache de leituras quando há rede. Para **persistência offline completa** do Firestore no app (dados disponíveis sem rede), use depois **@react-native-firebase/firestore** com **Expo Dev Client** (build de desenvolvimento). Veja o guia na raiz: `MIGRACAO_REACT_NATIVE.md`.

## Próximos passos

- Migrar telas da web (Dashboard, Projetos, Checklist, etc.) para componentes React Native.
- Implementar persistência offline completa com `@react-native-firebase` (Expo Dev Client).
- Adicionar fila de sincronização para escritas feitas offline.
