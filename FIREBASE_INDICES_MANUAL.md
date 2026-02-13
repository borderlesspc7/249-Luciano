# Criar índices do Firestore manualmente (Console)

1. Acesse: https://console.firebase.google.com  
2. Selecione o projeto (ex.: **fir-73f92**).  
3. No menu lateral: **Firestore Database** → aba **Índices** (ou **Indexes**).  
4. Clique em **Criar índice** / **Add index**.

Para cada índice abaixo, use **Coleção** = nome da coleção e adicione os campos na ordem e direção indicadas. Ao final, clique em **Criar**.

---

## Índice 1 — Dashboard / checklistExecutions por projeto

- **Coleção:** `checklistExecutions`  
- **Campos:**

  | Campo       | Ordenação |
  |------------|-----------|
  | projectId  | Ascendente  |
  | createdAt  | Descendente |

Criar este primeiro resolve o erro do Dashboard.

---

## Índice 2 — checklistExecutions por etapa

- **Coleção:** `checklistExecutions`  
- **Campos:**

  | Campo      | Ordenação |
  |-----------|-----------|
  | stageId   | Ascendente  |
  | createdAt | Descendente |

---

## Índice 3 — assets por projeto

- **Coleção:** `assets`  
- **Campos:**

  | Campo      | Ordenação   |
  |-----------|-------------|
  | projectId | Ascendente  |
  | createdAt | Descendente |

---

## Índice 4 — stages por projeto

- **Coleção:** `stages`  
- **Campos:**

  | Campo      | Ordenação  |
  |-----------|------------|
  | projectId | Ascendente |
  | order     | Ascendente |

---

## Índice 5 — components por equipamento

- **Coleção:** `components`  
- **Campos:**

  | Campo    | Ordenação   |
  |----------|-------------|
  | assetId  | Ascendente  |
  | createdAt| Descendente |

---

## Passo a passo genérico (para cada índice)

1. **Firestore** → **Índices** → **Criar índice**.  
2. Em **Coleção**, digite o nome (ex.: `checklistExecutions`).  
3. Em **Campos do índice**, adicione o primeiro campo (ex.: `projectId`, Ascendente).  
4. **Adicionar campo** e coloque o segundo (ex.: `createdAt`, Descendente).  
5. **Criar**.

Cada índice pode levar alguns minutos para ficar **Ativo**. Enquanto estiver **Criando**, as queries que dependem dele continuarão falhando. O índice 1 é o que desbloqueia o Dashboard.
