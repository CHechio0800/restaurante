const ENT_ST = ['Aguardando entregador', 'Entregador atribuído', 'Saiu para entrega', 'Entregue', 'Problema na entrega'];
App.init('entregas', 'Entregas', async v => {
  const [ent, fun] = await Promise.all([Store.list('entregas'), Store.list('funcionarios')]);
  const eu = App.user, boys = fun.filter(f => f.cargo === 'entregador' && f.situacao === 'Ativo');
  const fs = App._es || 'abertas';
  let rows = ent.filter(e => fs === 'abertas' ? !['Entregue'].includes(e.status) : fs === 'historico' ? e.status === 'Entregue' : true);
  if (eu.cargo === 'entregador') rows = rows.filter(e => e.entregadorId == eu.id || !e.entregadorId);
  rows.sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
  v.innerHTML = `<div class="bar"><select id="fs"><option value="abertas" ${fs === 'abertas' ? 'selected' : ''}>Pendentes</option><option value="historico" ${fs === 'historico' ? 'selected' : ''}>Histórico (entregues)</option><option value="todas" ${fs === 'todas' ? 'selected' : ''}>Todas</option></select><span class="sp"></span><small style="color:var(--muted)">Mapa: integração prevista para uma versão futura.</small></div>
  ${table([{h:'Pedido', f:e => '#' + e.pedidoId}, {h:'Cliente', f:e => `${esc(e.cliente)}<br><small>${esc(e.telefone)}</small>`}, {h:'Endereço', w:1, f:e => `${esc(e.endereco)}, ${esc(e.bairro)}${e.complemento ? '<br><small>' + esc(e.complemento) + '</small>' : ''}${e.referencia ? '<br><small>Ref.: ' + esc(e.referencia) + '</small>' : ''}`}, {h:'Taxa', f:e => brl(e.taxa)},
  {h:'Entregador', f:e => eu.cargo === 'entregador' ? esc(boys.find(b => b.id == e.entregadorId)?.nome || '—') : `<select data-a="${e.id}" style="width:auto;padding:5px"><option value="">Atribuir…</option>${boys.map(b => `<option value="${b.id}" ${b.id == e.entregadorId ? 'selected' : ''}>${esc(b.nome)}</option>`).join('')}</select>`},
  {h:'Status', f:e => `<span class="tag ${e.status === 'Entregue' ? 'ok' : e.status === 'Problema na entrega' ? 'bad' : 'warn'}">${e.status}</span>`},
  {h:'Ações', f:e => e.status === 'Entregue' ? '' : `<div class="acts">${e.entregadorId && e.status !== 'Saiu para entrega' ? `<button class="btn sm" data-go="${e.id}">Iniciar entrega</button>` : ''}${e.status === 'Saiu para entrega' ? `<button class="btn sm sec" data-ok="${e.id}">Confirmar entrega</button>` : ''}<button class="btn sm ghost" data-pb="${e.id}" title="Problema">${I('triangle-alert')}</button></div>`}], rows, 'Nenhuma entrega nesta lista.')}`;
  const run = async fn => { try { await fn(); App.reload(); } catch (e) { toast(e.message, true); } };
  $('#fs').onchange = e => { App._es = e.target.value; App.reload(); };
  $$('[data-a]', v).forEach(s => s.onchange = () => s.value && run(async () => { await Store.assign(s.dataset.a, +s.value); toast('Entregador atribuído.'); }));
  $$('[data-go]', v).forEach(b => b.onclick = () => run(async () => { await Store.deliveryStatus(b.dataset.go, 'Saiu para entrega'); toast('Entrega iniciada.'); }));
  $$('[data-ok]', v).forEach(b => b.onclick = () => run(async () => { await Store.deliveryStatus(b.dataset.ok, 'Entregue'); toast('Entrega concluída.'); }));
  $$('[data-pb]', v).forEach(b => b.onclick = () => confirmBox('Registrar problema nesta entrega?', () => run(async () => { await Store.deliveryStatus(b.dataset.pb, 'Problema na entrega'); toast('Problema registrado.'); })));
  icons();
});
