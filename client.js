// Power-Up "Prazo": mostra na frente do card, ao lado da data, quanto falta para a entrega.
// Mesmas faixas das etiquetas do quadro:
//   mais de 24h: sem cor · até 24h: amarelo · até 12h: laranja · até 4h: vermelho
//   até 1h: roxo "🔥" · vencido: preto "⚠️ atrasado há ..."
// Card com a data concluída ou na lista "Feito": verde "🏆 entregue" (verde só para concluído,
// como no Trello). O Power-Up não sabe a hora exata da conclusão, então não diz se foi no prazo.
// Definition of Ready: card em Sprint Backlog ou Fazendo sem os 5 itens (descrição,
// critérios de aceite, responsável, data, frente Clínica/AWTKD) ganha "🚧 falta: ..." escrito.
// Atualiza a cada minuto.
const FEITO = 'Feito 🎉';
const LISTAS_DOR = ['Sprint Backlog', 'Fazendo'];
const FRENTES = ['Clínica', 'AWTKD'];

function tempo(min) {
  const m = Math.abs(Math.round(min));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), r = m % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h${String(r).padStart(2, '0')}`;
  return `${r} min`;
}

function selo(due) {
  const min = (new Date(due) - Date.now()) / 60000;
  const horas = min / 60;
  if (min <= 0) return { text: `⚠️ atrasado há ${tempo(min)}`, color: 'black' };
  if (horas <= 1) return { text: `🔥 faltam ${tempo(min)}`, color: 'purple' };
  if (horas <= 4) return { text: `faltam ${tempo(min)}`, color: 'red' };
  if (horas <= 12) return { text: `faltam ${tempo(min)}`, color: 'orange' };
  if (horas <= 24) return { text: `faltam ${tempo(min)}`, color: 'yellow' };
  return { text: `faltam ${tempo(min)}`, color: null };
}

// O que falta para o card estar pronto (mesma regra de scripts/trello-dor.mjs no cérebro)
function faltaDor(card) {
  const nome = (card.name || '').trim();
  if (nome.startsWith('📌') || nome.startsWith('📋') || nome.startsWith('═')) return [];
  const falta = [];
  if ((card.desc || '').trim().length < 30) falta.push('descrição');
  const itens = (card.checklists || []).reduce((n, cl) => n + (cl.checkItems || []).length, 0);
  if (!itens) falta.push('critérios');
  if (!(card.members || []).length) falta.push('responsável');
  if (!card.due) falta.push('data');
  if (!(card.labels || []).some(l => FRENTES.includes(l.name))) falta.push('frente');
  return falta;
}

function selos(t, comTitulo) {
  return Promise.all([
    t.card('name', 'desc', 'due', 'dueComplete', 'idList', 'members', 'labels', 'checklists', 'badges'),
    t.lists('id', 'name'),
  ]).then(([card, listas]) => {
    const lista = (listas.find(l => l.id === card.idList) || {}).name;
    const titulo = nome => (comTitulo ? { title: nome } : {});
    if (/^(📌|📋)/.test((card.name || '').trim())) return [];   // cards fixos e modelo não ganham emblema
    if (card.dueComplete || lista === FEITO) return [Object.assign({ text: '🏆 entregue', color: 'green' }, titulo('Prazo'))];
    const saida = [];
    // Combinado "Fazendo no começo": item do checklist marcado com o card ainda na Sprint Backlog
    // é sinal de que o trabalho começou sem o card ser movido.
    if (lista === 'Sprint Backlog' && (card.badges?.checkItemsChecked || 0) > 0)
      saida.push(Object.assign({ text: '▶️ começou? mova para Fazendo', color: 'blue' }, titulo('Fazendo no começo')));
    if (LISTAS_DOR.includes(lista)) {
      const falta = faltaDor(card);
      if (falta.length) saida.push(Object.assign({ text: `🚧 falta: ${falta.join(', ')}`, color: 'lime' }, titulo('Pronto para começar?')));
    }
    if (card.due) saida.push({ dynamic: () => Object.assign(selo(card.due), titulo('Prazo'), { refresh: 60 }) });
    return saida;
  });
}

window.TrelloPowerUp.initialize({
  'card-badges': t => selos(t, false),         // frente do card, ao lado da data
  'card-detail-badges': t => selos(t, true),   // dentro do card aberto
});
