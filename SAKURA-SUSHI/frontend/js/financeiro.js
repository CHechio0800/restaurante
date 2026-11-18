const DCAT = ['Compras', 'Salários', 'Aluguel', 'Energia', 'Água', 'Internet', 'Manutenção', 'Outras despesas'];
App.init('financeiro', 'Financeiro', async v => {
  const [ped, dsp] = await Promise.all([Store.list('pedidos'), Store.list('despesas')]);
  const de = App._de || dkey(Date.now() - 29 * 864e5), ate = App._ate || today();
  const inR = d => d >= de && d <= ate;
  const vendas = ped.filter(p => p.status !== 'Cancelado' && inR(dkey(p.criadoEm)));
  const receb = vendas.filter(p => p.pago), pend = vendas.filter(p => !p.pago);
  const ds = dsp.filter(d => inR(d.vencimento));
  const S = l => l.reduce((a, x) => a + (x.total ?? x.valor), 0);
  const bruto = S(vendas), desp = S(ds), pagas = S(ds.filter(d => d.situacao === 'Pago')), apagar = S(ds.filter(d => d.situacao !== 'Pago'));
  const K = (ic, l, val, d) => `<div class="card kpi ${d ? 'dark' : ''}"><span class="ic">${I(ic)}</span><div><small>${l}</small><strong>${val}</strong></div></div>`;
  v.innerHTML = `<div class="bar"><label style="margin:0">De</label><input type="date" id="de" value="${de}"><label style="margin:0">até</label><input type="date" id="ate" value="${ate}"><span class="sp"></span><button class="btn" id="nd">${I('plus')}Registrar despesa</button></div>
  <div class="grid g4">${K('trending-up', 'Faturamento bruto', brl(bruto), 1)}${K('trending-down', 'Despesas', brl(desp), 1)}${K('scale', 'Resultado (lucro estimado)', brl(bruto - desp), 1)}${K('hand-coins', 'Recebimentos pendentes', brl(S(pend)))}${K('circle-check', 'Contas pagas', brl(pagas))}${K('calendar-clock', 'Contas a pagar', brl(apagar))}</div>
  <p style="color:var(--muted);font-size:.85rem">Faturamento = vendas não canceladas; despesas = contas com vencimento no período; resultado = faturamento − despesas (estimativa, sem custo de mercadoria vendida).</p>
  <div class="grid g2"><div class="card"><h3>Receitas por forma de pagamento</h3><div class="chartbox"><canvas id="c1"></canvas></div></div><div class="card"><h3>Despesas por categoria</h3><div class="chartbox"><canvas id="c2"></canvas></div></div></div>
  <h3 style="margin:26px 0 12px">Despesas e contas</h3>${table([{h:'Vencimento', f:d => dday(d.vencimento)}, {h:'Categoria', f:d => esc(d.categoria)}, {h:'Descrição', w:1, f:d => esc(d.descricao) + (d.boleto ? `<br><small>Boleto: ${esc(d.boleto)}</small>` : '')}, {h:'Valor', f:d => brl(d.valor)}, {h:'Situação', f:d => `<span class="tag ${d.situacao === 'Pago' ? 'ok' : new Date(d.vencimento) < Date.now() ? 'bad' : 'warn'}">${d.situacao === 'Pago' ? 'Pago' : new Date(d.vencimento) < Date.now() ? 'Vencida' : 'A pagar'}</span>`}, {h:'Ações', f:d => `<div class="acts">${d.situacao !== 'Pago' ? `<button class="btn sm sec" data-pg="${d.id}">Marcar paga</button>` : ''}<button class="btn sm ghost" data-ed="${d.id}">${I('pencil')}</button><button class="btn sm danger" data-d="${d.id}">${I('trash-2')}</button></div>`}], ds, 'Nenhuma despesa no período.')}
  <h3 style="margin:26px 0 12px">Pagamentos recebidos</h3>${table([{h:'Pedido', f:p => '#' + p.id}, {h:'Data', f:p => dt(p.criadoEm)}, {h:'Forma', f:p => esc(p.pagamento)}, {h:'Valor', f:p => brl(p.total)}], receb.slice(-15).reverse(), 'Nenhum pagamento recebido no período.')}
  <p style="color:var(--muted);font-size:.85rem">Boletos: aqui você apenas <b>registra</b> contas (código de barras, vencimento, valor e situação). A emissão de boletos reais e cobranças PIX dinâmicas depende de integração com banco/provedor e não está implementada. PIX é registrado manualmente.</p>`;
  $('#de').onchange = e => { App._de = e.target.value; App.reload(); }; $('#ate').onchange = e => { App._ate = e.target.value; App.reload(); };
  const pg = {}; receb.forEach(p => pg[p.pagamento] = (pg[p.pagamento] || 0) + p.total); const dc = {}; ds.forEach(d => dc[d.categoria] = (dc[d.categoria] || 0) + d.valor);
  chart('c1', {type:'doughnut', data:{labels:Object.keys(pg), datasets:[{data:Object.values(pg), backgroundColor:PAL}]}}); chart('c2', {type:'bar', data:{labels:Object.keys(dc), datasets:[{label:'R$', data:Object.values(dc), backgroundColor:'#C75C43'}]}, options:{plugins:{legend:{display:false}}}});
  const F = [{k:'categoria', l:'Categoria', t:'select', opts:DCAT}, {k:'valor', l:'Valor (R$)', t:'number', step:'0.01', req:1}, {k:'descricao', l:'Descrição', req:1, full:1}, {k:'vencimento', l:'Vencimento', t:'date', req:1, def:today()}, {k:'situacao', l:'Situação', t:'select', opts:['Pendente', 'Pago']}, {k:'boleto', l:'Código de barras do boleto (opcional)', full:1}];
  const sv = o => Store.save('despesas', o).then(() => { toast('Despesa salva.'); App.reload(); });
  $('#nd').onclick = () => formModal({title:'Registrar despesa', fields:F, onSave:sv});
  $$('[data-ed]', v).forEach(b => b.onclick = () => formModal({title:'Editar despesa', fields:F, values:dsp.find(d => d.id == b.dataset.ed), onSave:sv}));
  $$('[data-pg]', v).forEach(b => b.onclick = async () => { await Store.save('despesas', {id:+b.dataset.pg, situacao:'Pago', pagamentoData:today()}); toast('Conta marcada como paga.'); App.reload(); });
  $$('[data-d]', v).forEach(b => b.onclick = () => confirmBox('Excluir esta despesa?', async () => { await Store.del('despesas', b.dataset.d); toast('Despesa excluída.'); App.reload(); }));
  icons();
});
