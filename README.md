# Evangelho Pleno — Gestão de Células

App de gestão de células da igreja. **Banco de dados é o Google Sheets do seu Drive** — o backend lê/escreve direto nas abas via Service Account.

## Arquitetura

```
apps/
├── api/   Node + Express + TypeScript + googleapis + JWT + bcrypt + zod
└── web/   Vite + React 18 + TypeScript + Tailwind + Radix + RHF/Zod + Recharts + Framer + Leaflet
```

Permissões:

- **Admin** (coluna `permissão` = `Admin`) — vê e edita tudo, entra em qualquer célula.
- **Lider** (coluna `permissão` = `Lider`) — só vê/edita membros da sua própria célula.

## 1. Planilhas no Google Drive

O app usa **três planilhas separadas** (uma por recurso). Cada uma tem seu próprio ID e aba, configurados no `.env`.

### `Usuarios`

| nome | celula | e-mail | senha | permissão |
|------|--------|--------|-------|-----------|

- `senha`: pode começar em texto puro (ex.: `admin123`). Na primeira vez que o usuário loga, o backend grava um hash bcrypt (`$2a$10$...`) por cima da célula — a partir daí, a senha só é alterável pelo botão "Alterar senha" dentro do app.
- `permissão`: `Admin` ou `Lider` (case-insensitive).

### `DADOS` (Células)

| Foto Perfil | Nome da Celula | Lider | Cor da rede | Status | Cidade | Bairro | Endereço | Latitude | Longitude | Tipo de Celula |

Só células com `Status = Ativa` aparecem no dropdown de login e no mapa.

### `Respostas ao formulário 1` (Membros)

| Carimbo de data/hora | Nome Completo | Telefone | Data de nascimento | Endereço | Bairro | Abrigo | Batismo nas águas | Encontro com Deus | Escola de Discípulos | Célula | Endereço e Bairro |

Planilha alimentada por um Google Form. O app usa o número da linha como identificador.

## 2. Service Account (pra API acessar as planilhas)

1. Criar projeto em [console.cloud.google.com](https://console.cloud.google.com/)
2. Habilitar **Google Sheets API**
3. Criar **Service Account** → aba *Keys* → *Add Key* → JSON → baixar
4. Em **cada uma das 3 planilhas**, **Compartilhar** → colar o e-mail `...@...iam.gserviceaccount.com` da SA → permissão **Editor** → desmarcar "Notificar" → **Enviar**

## 3. Variáveis de ambiente

Copie o exemplo:

```bash
cp .env.example .env
```

Preencha:

- `JWT_SECRET` — 48+ bytes aleatórios
- `SHEETS_USUARIOS_ID` / `SHEETS_USUARIOS_TAB` — ID da planilha de usuários + nome da aba
- `SHEETS_CELULAS_ID` / `SHEETS_CELULAS_TAB` — idem pra células (aba padrão: `DADOS`)
- `SHEETS_MEMBROS_ID` / `SHEETS_MEMBROS_TAB` — idem pra membros (aba padrão: `Respostas ao formulário 1`)
- `GOOGLE_APPLICATION_CREDENTIALS=./apps/api/credentials.json` — aponta para o JSON da SA **OU** `GOOGLE_SERVICE_ACCOUNT_JSON` com o JSON inteiro em uma linha

## 4. Rodar

```bash
npm install
npm run dev
```

- API: http://localhost:4000
- Web: http://localhost:5173

## 5. Fluxo de senha

1. Admin cria a linha na aba `Usuarios` com `senha` em texto puro (ex.: `admin123`)
2. Usuário faz login → backend valida e regrava a célula com o hash bcrypt
3. Pra trocar: no app, botão **Alterar senha** na sidebar → pede senha atual + nova → grava o novo hash na planilha

Pra gerar um hash manualmente:

```bash
npm run hash -w apps/api -- "minha-senha"
```

## 6. O que o app mostra

- **Login** — e-mail + senha + célula (dropdown só de células ativas)
- **Dashboard** — KPIs, funil de discipulado, faixa etária, "quem falta" batismo/encontro/escola, crescimento 12 meses, top bairros, e (só admin) células por status + top 10 células
- **Membros** — tabela filtrada pela célula do líder (admin vê todos), edição direto na planilha
- **Minha célula** — editar endereço/coordenadas da própria célula; só admin pode mudar `Status`
- **Mapa** — Leaflet com pins das células ativas que têm latitude/longitude

## 7. Estrutura

```
apps/api/src/
├── config.ts               Env + 3 SheetRefs (usuarios/celulas/membros)
├── server.ts               Express + helmet + CORS + rate-limit
├── lib/
│   ├── sheets.ts           googleapis, readSheet({id,tab}), updateRow (escapa nomes com espaço)
│   ├── password.ts         bcrypt + detecção plain/hash
│   ├── async-handler.ts    wrapper pra propagar erros async no Express 4
│   └── cache.ts            TTL em memória (15–30s)
├── middleware/auth.ts      requireAuth, canAccessCell
├── services/               users, cells (com isActive), members
├── routes/                 auth, cells, members, public
├── scripts/                hash-password, inspect-sheets
└── types/domain.ts         Mapeamento de colunas das 3 planilhas

apps/web/src/
├── main.tsx, App.tsx       Bootstrap + rotas protegidas
├── components/
│   ├── layout/AppLayout    Sidebar + trocar senha + sair
│   ├── Logo, Field, CellSelect, MemberEditDialog, ChangePasswordDialog
├── pages/                  Login, Dashboard, Members, Cell, Map
├── lib/
│   ├── api.ts              axios + interceptor de token
│   ├── auth-store.ts       zustand persist
│   └── analytics.ts        funil, faixa etária, crescimento, bairros, etc.
└── index.css               Tokens preto/branco/cinza
```

## 8. Segurança — limites atuais

- Qualquer um listado em `Usuarios` consegue logar (não há flag `ativo`). Pra desligar alguém, delete a linha.
- JWT vale 8h, sem refresh.
- Sem trilha de auditoria — se precisar saber quem editou o quê, adicione colunas `editado_em`/`editado_por` nos handlers `PATCH`.
- Google Sheets tem rate limit (~100 req/100s). O TTLCache de 15–30s já alivia.
