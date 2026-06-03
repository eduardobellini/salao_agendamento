export const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// Horários disponíveis — altere aqui para mudar os slots oferecidos
export const HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00',
]

export const COR_MAP = {
  teal:   { bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-400',   dot: 'bg-teal-400'   },
  pink:   { bg: 'bg-pink-100',   text: 'text-pink-700',   border: 'border-pink-400',   dot: 'bg-pink-400'   },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-400', dot: 'bg-purple-400' },
  amber:  { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-400',  dot: 'bg-amber-400'  },
}

const hoje = new Date().toLocaleDateString('pt-BR')

export const PRIVACY_TEXT = `
**Política de Privacidade**

Última atualização: ${hoje}

**1. Dados Coletados**
Coletamos: nome completo, número de WhatsApp, serviço escolhido, profissional preferida, data e horário do agendamento.

**2. Finalidade do Tratamento**
Os dados são utilizados exclusivamente para: (a) confirmar e gerenciar seu agendamento; (b) comunicar-nos sobre seu horário via WhatsApp.

**3. Base Legal (LGPD – Lei 13.709/2018)**
O tratamento se fundamenta na execução de contrato (art. 7º, V) e no legítimo interesse do salão (art. 7º, IX).

**4. Prazo de Guarda**
Os dados são armazenados por até 12 meses após o agendamento para fins de histórico e controle interno, sendo então excluídos de forma segura.

**5. Compartilhamento**
Seus dados não são vendidos nem compartilhados com terceiros, exceto com a profissional responsável pelo seu atendimento.

**6. Seus Direitos**
Você pode solicitar: acesso, correção, exclusão, portabilidade e revogação do consentimento. Entre em contato pelo WhatsApp do salão.

**7. Segurança**
Utilizamos infraestrutura segura (Supabase) com criptografia em trânsito (TLS) e em repouso (AES-256).
`

export const TERMS_TEXT = `
**Termos de Uso**

Última atualização: ${hoje}

**1. Agendamento**
Ao confirmar, você reserva um horário exclusivo com a profissional escolhida. O salão se compromete a respeitar o horário agendado.

**2. Cancelamento e Reagendamento**
Cancelamentos devem ser comunicados com pelo menos 2 horas de antecedência via WhatsApp. Faltas sem aviso prévio podem resultar em cobrança de taxa de 50% do valor do serviço.

**3. Preços**
Os preços exibidos são estimativas. O valor final pode variar conforme avaliação da profissional no momento do atendimento.

**4. Atraso do Cliente**
Atrasos superiores a 15 minutos podem resultar em cancelamento automático do horário, a critério do salão.

**5. Responsabilidade**
O salão não se responsabiliza por reações a produtos não informadas previamente. Informe alergias conhecidas ao efetuar o agendamento.

**6. Menores de Idade**
Clientes menores de 18 anos devem estar acompanhados de responsável legal.

**7. Alterações**
Estes termos podem ser alterados a qualquer momento. A versão vigente estará sempre disponível na plataforma de agendamento.
`
