# Sistema Singenta - React + TypeScript + Vite

Sistema de gestão empresarial com interface moderna e responsiva.

## 🚀 Funcionalidades

- **Layout Responsivo**: Sidebar colapsável e header moderno
- **Autenticação**: Sistema completo de login/registro com Firebase
- **Gestão de Máquinas**: CRUD completo para máquinas e processos
- **Gestão de Usuários**: Administração de usuários e permissões
- **Interface Moderna**: Design profissional com animações suaves

## 🎨 Componentes Principais

### Layout

- **Sidebar**: Navegação lateral com estado colapsável
- **Header**: Barra superior com busca, notificações e perfil do usuário
- **Layout**: Componente wrapper que integra sidebar e header

### Características do Design

- ✅ Design responsivo (mobile-first)
- ✅ Animações suaves e transições
- ✅ Modo escuro (suporte via CSS)
- ✅ Acessibilidade (ARIA labels, navegação por teclado)
- ✅ Gradientes modernos e sombras elegantes

## Deploy das regras Firebase

Para publicar as regras do Firestore e do Storage (impedir acesso anônimo e restringir por autenticação):

```bash
firebase deploy --only firestore:rules,storage
```

Passo a passo completo, pré-requisitos e comandos por recurso: **[FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md)**.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
