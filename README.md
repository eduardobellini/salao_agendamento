# Mediterrâneo Cabelo — Agendamento Online

Sistema completo de agendamento online para salão de beleza.  
Stack: **React 18 + Vite + Tailwind CSS + Supabase**.

---

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta na [Vercel](https://vercel.com) (gratuita, para o deploy)

---

## 1. Configurar o banco de dados (Supabase)

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto (região: São Paulo).
2. No painel do projeto, vá em **SQL Editor** → **New query**.
3. Cole o conteúdo de `supabase/schema.sql` e execute — cria as tabelas e os dados de exemplo.
4. **Execute também os arquivos de `supabase/migrations/`, em ordem de data.**  
   Eles criam as funções de segurança (RPC) que o app usa. Sem elas o app não funciona.

> A senha inicial da agenda é `agenda123`. Troque já (ver seção 8).

---

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Abra `.env` e preencha com os valores do seu projeto Supabase (**Settings → API**):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

> **Nunca** faça commit do arquivo `.env`, e nunca coloque valores reais no `.env.example`.  
> Lembre-se: **toda variável `VITE_*` acaba embutida no JavaScript público do site.**
> Por isso a senha da agenda não fica aqui — ela mora no banco, com hash.

---

## 3. Instalar dependências e rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

- **Agendar** — fluxo de agendamento para clientes (5 etapas).
- **Meus horários** — cliente consulta e cancela pelo WhatsApp.
- **Agenda** — visão das profissionais, protegida por senha.

---

## 4. Deploy na Vercel

### Via interface web

1. Suba o projeto para um repositório no GitHub.
2. Acesse [vercel.com](https://vercel.com) → **Add New Project** → escolha o repositório.
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Clique em **Deploy**.

A Vercel detecta o Vite automaticamente (`npm run build` → pasta `dist`).  
Cada `git push` gera um novo deploy.

### Via CLI

```bash
npm install -g vercel
vercel --prod
```

---

## 5. Adicionar ou remover funcionárias

Execute no **SQL Editor** do Supabase:

```sql
-- Adicionar
insert into funcionarias (nome, especialidade, initials, cor)
values ('Nova Profissional', 'Especialidade', 'NP', 'pink');

-- Desativar (não aparece mais no app, sem perder histórico)
update funcionarias set ativa = false where nome = 'Nome da Profissional';
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

O campo `duracao_min` é levado a sério: um serviço de 120 min ocupa **dois** slots
da agenda, e horários sem tempo livre suficiente não são oferecidos ao cliente.

---

## 7. Mudar os horários disponíveis

Edite o array `HOURS` em `src/lib/constants.js`:

```js
export const HOURS = [
  '09:00', '10:00', '11:00',            // manhã
  '14:00', '15:00', '16:00', '17:00',   // tarde
]
```

Qualquer slot não listado aqui não será oferecido para agendamento.

---

## 8. Mudar a senha da agenda

No **SQL Editor** do Supabase:

```sql
select definir_senha_agenda('sua-nova-senha');
```

A senha é guardada com hash (bcrypt) e conferida no servidor — ela nunca
aparece no código do site. Não requer novo deploy.

---

## 9. Google Calendar (opcional)

Para que cada agendamento vire um evento no Google Agenda do salão, siga as
instruções no topo de `supabase/functions/google-calendar/index.ts` e faça:

```bash
supabase functions deploy google-calendar
```

Se a função não estiver publicada, o agendamento continua funcionando
normalmente — só não sincroniza com o calendário.

---

## Estrutura de arquivos

```
src/
├── lib/
│   ├── supabase.js        — cliente Supabase singleton
│   └── constants.js       — DAYS, MONTHS, HOURS, cores, textos legais
├── hooks/
│   └── useAgendamento.js  — chamadas às RPCs + hooks de dados
├── components/
│   ├── shared/UI.jsx      — StepIndicator, BtnPrimary, ErrorBox, Modal…
│   ├── cliente/Steps.jsx  — StepServico, StepFuncionaria, StepDataHora, StepDados
│   └── cliente/Resumo.jsx — resumo com edição e checkboxes de termos
├── pages/
│   ├── AgendamentoPage.jsx    — fluxo de 5 etapas
│   ├── MeusAgendamentosPage.jsx — consulta/cancelamento pelo WhatsApp
│   └── AgendaPage.jsx          — agenda do salão, protegida por senha
├── App.jsx
└── main.jsx
supabase/
├── schema.sql       — tabelas, índices e dados de exemplo
├── migrations/      — funções RPC e políticas de segurança
└── functions/google-calendar/  — Edge Function (opcional)
```

---

## Segurança

As tabelas `agendamentos` e `agendamento_servicos` contêm dados pessoais e
**não são acessíveis pela API pública**: RLS está ligado e elas não têm nenhuma
policy. Todo o acesso passa por funções `security definer` que verificam quem
está pedindo.

| Medida | Detalhe |
|---|---|
| `horarios_ocupados()` | Devolve só os horários indisponíveis — nenhum nome ou telefone sai do banco |
| `meus_agendamentos()` | Exige o telefone do cliente |
| `cancelar_agendamento()` | Só cancela se o telefone bater com o do agendamento |
| `agenda_do_dia()` | Exige a senha do salão, conferida no servidor (bcrypt) |
| `criar_agendamento()` | Valida nome, telefone, data e conflito de horário no servidor, em uma transação só |
| Lock por profissional/dia | `pg_advisory_xact_lock` impede que dois pedidos simultâneos gerem atendimentos sobrepostos |
| Índice único parcial | Dois agendamentos confirmados no mesmo slot são impossíveis; cancelar libera o horário |
| Chaves via `.env` | Nunca commitadas |
