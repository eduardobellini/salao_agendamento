# Salão de Beleza — Agendamento Online

Sistema completo de agendamento online para salão de beleza.  
Stack: **React 18 + Vite + Tailwind CSS + Supabase**.

---

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta na [Vercel](https://vercel.com) (para deploy)

---

## 1. Configurar o banco de dados (Supabase)

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. No painel do projeto, vá em **SQL Editor** → **New query**.
3. Cole o conteúdo de `supabase/schema.sql` e execute.
   - Isso cria as tabelas, habilita RLS e insere os dados de exemplo.

---

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Abra `.env` e preencha com os valores do seu projeto Supabase  
(**Settings → API**):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_AGENDA_PASSWORD=suasenhaaqui
```

> **Nunca** faça commit do arquivo `.env`.  
> O `.env.example` (sem valores reais) pode ser versionado normalmente.

---

## 3. Instalar dependências e rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

- **Aba "Agendar"** — fluxo de agendamento para clientes.
- **Aba "Agenda"** — agenda das profissionais (exige senha).

---

## 4. Deploy na Vercel

### Via CLI

```bash
npm install -g vercel
vercel --prod
```

### Via interface web

1. Acesse [vercel.com](https://vercel.com) → **Add New Project**.
2. Conecte seu repositório GitHub.
3. Em **Environment Variables**, adicione as três variáveis do `.env`.
4. Clique em **Deploy**.

A Vercel detecta automaticamente o Vite e configura o build (`npm run build` → pasta `dist`).

---

## 5. Adicionar ou remover funcionárias

Execute no **SQL Editor** do Supabase:

```sql
-- Adicionar
insert into funcionarias (nome, especialidade, initials, cor)
values ('Nova Profissional', 'Especialidade', 'NP', 'pink');

-- Desativar (não aparece mais no app, sem perder histórico)
update funcionarias set ativa = false where nome = 'Nome da Profissional';

-- Remover permanentemente
delete from funcionarias where nome = 'Nome da Profissional';
```

Cores disponíveis: `teal`, `pink`, `purple`, `amber`.

---

## 6. Adicionar ou remover serviços

```sql
-- Adicionar
insert into servicos (nome, duracao_min, preco, icone)
values ('Progressiva', 90, 150.00, 'wave-sine');

-- Desativar
update servicos set ativo = false where nome = 'Nome do Serviço';
```

Os ícones são do [Tabler Icons](https://tabler.io/icons) — use o nome sem o prefixo `ti-`.  
Exemplos: `scissors`, `palette`, `droplet`, `sparkles`, `hand-finger`.

---

## 7. Mudar os horários disponíveis

Edite o array `HOURS` em `src/lib/constants.js`:

```js
export const HOURS = [
  '09:00', '10:00', '11:00',            // de segunda
  '14:00', '15:00', '16:00', '17:00',   // e tarde
]
```

Qualquer slot não listado aqui não será oferecido para agendamento.

---

## 8. Mudar a senha da agenda

Altere `VITE_AGENDA_PASSWORD` no arquivo `.env` (ou nas variáveis da Vercel).  
Não requer alteração de código.

---

## Estrutura de arquivos

```
src/
├── lib/
│   ├── supabase.js        — cliente Supabase singleton
│   └── constants.js       — DAYS, MONTHS, HOURS, cores, textos legais
├── hooks/
│   └── useAgendamento.js  — hooks de dados + criarAgendamento()
├── components/
│   ├── shared/UI.jsx      — StepIndicator, EditBanner, BtnPrimary, Modal…
│   ├── cliente/Steps.jsx  — StepServico, StepFuncionaria, StepDataHora, StepDados
│   └── cliente/Resumo.jsx — tela de resumo com edição e checkboxes de termos
├── pages/
│   ├── AgendamentoPage.jsx — orquestra o fluxo de 5 etapas
│   └── AgendaPage.jsx      — agenda protegida por senha
├── App.jsx
└── main.jsx
supabase/
└── schema.sql
```

---

## Segurança

| Medida | Detalhe |
|---|---|
| RLS no Supabase | Clientes só podem inserir e ler disponibilidade |
| Unique constraint | Dois agendamentos simultâneos no mesmo slot são impossíveis |
| Chaves via `.env` | Nunca hardcoded no código |
| Senha da agenda | Via variável de ambiente, sem localStorage |
