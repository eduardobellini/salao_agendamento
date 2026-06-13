/*
 * SETUP — siga estes passos antes de usar esta função:
 *
 * 1. Crie um projeto no Google Cloud Console (console.cloud.google.com)
 *    • Ative a API "Google Calendar API"
 *    • Crie uma Conta de Serviço (IAM & Admin → Service Accounts)
 *    • Gere uma chave JSON para a conta de serviço
 *
 * 2. Compartilhe a agenda do salão com a conta de serviço:
 *    • No Google Agenda, abra as configurações da agenda
 *    • Em "Compartilhar com pessoas específicas", adicione o e-mail da
 *      conta de serviço (formato: nome@projeto.iam.gserviceaccount.com)
 *    • Permissão: "Fazer alterações nos eventos"
 *
 * 3. Copie o ID da agenda:
 *    • Configurações da agenda → Integrar agenda → "ID da agenda"
 *    • Geralmente é um e-mail (ex: salaoxyz@gmail.com) ou uma string longa
 *
 * 4. Configure os secrets no Supabase:
 *    supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='<conteúdo do JSON da chave>'
 *    supabase secrets set GOOGLE_CALENDAR_ID='<ID da agenda>'
 *
 * 5. Faça o deploy da função:
 *    supabase functions deploy google-calendar
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function b64url(buf: ArrayBuffer): string {
  let s = ''
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function b64urlStr(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function buildJWT(email: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header  = b64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = b64urlStr(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const input = `${header}.${payload}`

  const pemBody  = privateKeyPem.replace(/-----[A-Z ]+-----/g, '').replace(/\s/g, '')
  const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    'pkcs8', keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  )
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input))
  return `${input}.${b64url(sig)}`
}

async function getAccessToken(jwt: string): Promise<string> {
  const res  = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const json = await res.json()
  if (!json.access_token) throw new Error(`Falha OAuth: ${JSON.stringify(json)}`)
  return json.access_token
}

const pad = (n: number) => String(n).padStart(2, '0')

// Monta a string "wall-clock" (sem fuso) para uma data/hora local de São Paulo,
// somando `addMin` minutos. Usa aritmética em UTC para NÃO depender do fuso do
// servidor (o runtime do Edge roda em UTC) — assim o horário enviado ao Google
// é exatamente o que o cliente escolheu.
function localDateTime(Y: number, M: number, D: number, h: number, m: number, addMin = 0): string {
  const d = new Date(Date.UTC(Y, M - 1, D, h, m))
  d.setUTCMinutes(d.getUTCMinutes() + addMin)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`
}

// (11) 99999-9999
function formatPhone(raw: string): string {
  const d = (raw ?? '').replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return raw
}

// 105 -> "1h45" | 45 -> "45min"
function formatDuracao(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  return m === 0 ? `${h}h` : `${h}h${pad(m)}`
}

function formatBRL(valor: number): string {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

async function getToken(): Promise<string> {
  const saJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
  if (!saJson) throw new Error('Secret GOOGLE_SERVICE_ACCOUNT_JSON não configurado')
  const sa  = JSON.parse(saJson)
  const jwt = await buildJWT(sa.client_email, sa.private_key)
  return getAccessToken(jwt)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const body       = await req.json()
    const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID')
    if (!calendarId) throw new Error('Secret GOOGLE_CALENDAR_ID não configurado')

    // ── Deletar evento ────────────────────────────────────────────────────────
    if (body.action === 'delete') {
      const { gcalEventId } = body
      if (!gcalEventId) return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })

      const token  = await getToken()
      const gcRes  = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(gcalEventId)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
      )
      if (!gcRes.ok && gcRes.status !== 410) {
        const txt = await gcRes.text()
        throw new Error(`Google Calendar delete: ${txt}`)
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // ── Criar evento ──────────────────────────────────────────────────────────
    const {
      agendamentoId,      // para salvar o ID do evento de volta no banco
      servicos,           // [{ nome, duracaoMin }]
      servicoNome,        // compatibilidade com a versão antiga (serviço único)
      duracaoMin,
      precoTotal,
      funcionariaNome,
      clienteNome,
      clientePhone,
      data,
      hora,
    } = body

    // Normaliza a lista de serviços (aceita o formato novo e o antigo)
    const listaServicos: { nome: string; duracaoMin?: number }[] =
      Array.isArray(servicos) && servicos.length > 0
        ? servicos
        : servicoNome
          ? [{ nome: servicoNome, duracaoMin }]
          : []

    const nomesServicos = listaServicos.map(s => s.nome).join(', ')
    const duracaoTotal  = Number(duracaoMin) ||
      listaServicos.reduce((acc, s) => acc + (Number(s.duracaoMin) || 0), 0)

    const token = await getToken()

    const [Y, M, D] = (data as string).split('-').map(Number)
    const [h, m]    = (hora as string).split(':').map(Number)

    // Lista de serviços formatada para a descrição
    const linhasServicos = listaServicos
      .map(s => `   • ${s.nome}`)
      .join('\n')

    const descricao = [
      `👤 Cliente: ${clienteNome}`,
      `📱 WhatsApp: ${formatPhone(clientePhone)}`,
      `💇 Profissional: ${funcionariaNome}`,
      ``,
      `${listaServicos.length > 1 ? '✂️ Serviços:' : '✂️ Serviço:'}`,
      linhasServicos,
      ``,
      `⏱️ Duração total: ${formatDuracao(duracaoTotal)}`,
      ...(precoTotal != null ? [`💰 Total estimado: ${formatBRL(Number(precoTotal))}`] : []),
    ].join('\n')

    const event = {
      summary: `${clienteNome} — ${nomesServicos}`,
      description: descricao,
      start: { dateTime: localDateTime(Y, M, D, h, m),               timeZone: 'America/Sao_Paulo' },
      end:   { dateTime: localDateTime(Y, M, D, h, m, duracaoTotal), timeZone: 'America/Sao_Paulo' },
    }

    const gcRes  = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      },
    )
    const gcJson = await gcRes.json()
    if (!gcRes.ok) throw new Error(`Google Calendar: ${JSON.stringify(gcJson)}`)

    // Salva o ID do evento no agendamento usando a chave de serviço
    // (ignora o RLS, que só permite updates de cancelamento pelo cliente).
    if (agendamentoId && gcJson.id) {
      const sbUrl = Deno.env.get('SUPABASE_URL')
      const sbKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (sbUrl && sbKey) {
        const upd = await fetch(
          `${sbUrl}/rest/v1/agendamentos?id=eq.${agendamentoId}`,
          {
            method: 'PATCH',
            headers: {
              apikey: sbKey,
              Authorization: `Bearer ${sbKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ gcal_event_id: gcJson.id }),
          },
        )
        if (!upd.ok) console.error('Falha ao salvar gcal_event_id:', await upd.text())
      }
    }

    return new Response(JSON.stringify({ ok: true, eventId: gcJson.id }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('google-calendar error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
