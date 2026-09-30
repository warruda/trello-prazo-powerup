// Power-Up "Prazo": mostra na frente do card, ao lado da data, quanto falta para a entrega.
// Mesmas faixas das etiquetas do quadro:
//   mais de 24h: sem cor · até 24h: amarelo · até 12h: laranja · até 4h: vermelho
//   até 1h: roxo "🔥" · vencido: preto "⚠️ atrasado há ..."
// Card com a data concluída ou na lista "Feito": verde "🏆 entregue" (verde só para concluído,
// como no Trello). O Power-Up não sabe a hora exata da conclusão, então não diz se foi no prazo.
// Atualiza a cada minuto.
const FEITO = 'Feito 🎉';

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

function selos(t, comTitulo) {
  return Promise.all([t.card('due', 'dueComplete', 'idList'), t.lists('id', 'name')]).then(([card, listas]) => {
    const lista = (listas.find(l => l.id === card.idList) || {}).name;
    const titulo = comTitulo ? { title: 'Prazo' } : {};
    if (card.dueComplete || lista === FEITO) return [Object.assign({ text: '🏆 entregue', color: 'green' }, titulo)];
    if (!card.due) return [];
    return [{ dynamic: () => Object.assign(selo(card.due), titulo, { refresh: 60 }) }];
  });
}

window.TrelloPowerUp.initialize({
  'card-badges': t => selos(t, false),         // frente do card, ao lado da data
  'card-detail-badges': t => selos(t, true),   // dentro do card aberto
});
