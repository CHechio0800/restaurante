App.init('dashboard', 'Painel', async v => {
  const [ped, prod, ing, cli, fun] = await Promise.all(['pedidos', 'produtos', 'ingredientes', 'clientes', 'funcionarios'].map(c => Store.list(c)));
  const ok = ped.filter(p => p.status !== 'Cancelado'), mes = today().slice(0, 7);
  const fat = l => l.reduce((a, p) => a + p.total, 0);
  const hoje = ok.filter(p => dkey(p.criadoEm) === today()), doMes = ok.filter(p => dkey(p.criadoEm).startsWith(mes));
  const cnt = s => ped.filter(p => p.status === s).length;
  const pend = ped.filter(p => ['Pedido recebido', 'Confirmado'].includes(p.status)).length;
  const prep = cnt('Em preparação'), conc = cnt('Entregue');
  const ticket = ok.length ? fat(ok) / ok.length : 0;
  const rank = {}; ok.forEach(p => p.itens.forEach(i => rank[i.nome] = (rank[i.nome] || 0) + i.qtd));
  const top = Object.entries(rank).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const K = (ic, l, val, dark) => `<div class="card kpi ${dark ? 'dark' : ''}"><span class="ic">${I(ic)}</span><div><small>${l}</small><strong>${val}</strong></div></div>`;
  const low = ing.filter(i => i.qtd <= i.minimo), venc = ing.filter(i => (new Date(i.validade) - Date.now()) / 864e5 <= 5);
  v.innerHTML = `<div class="grid g4">${K('banknote', 'Faturamento do dia', brl(fat(hoje)), 1)}${K('calendar-days', 'Faturamento mensal', brl(fat(doMes)), 1)}${K('receipt', 'Pedidos (total)', ped.length)}${K('receipt-text', 'Ticket médio', brl(ticket))}
  ${K('hourglass', 'Pendentes', pend)}${K('flame', 'Em preparação', prep)}${K('circle-check', 'Concluídos', conc)}${K('star', 'Mais vendido', top[0] ? esc(top[0][0].split('(')[0]) : '—')}</div>
  <div class="grid g2" style="margin-top:18px"><div class="card"><h3>Vendas por dia (14 dias)</h3><div class="chartbox"><canvas id="c1"></canvas></div></div><div class="card"><h3>Faturamento mensal</h3><div class="chartbox"><canvas id="c2"></canvas></div></div>
  <div class="card"><h3>Pedidos por modalidade</h3><div class="chartbox"><canvas id="c3"></canvas></div></div><div class="card"><h3>Produtos mais vendidos</h3><div class="chartbox"><canvas id="c4"></canvas></div></div></div>
  <div class="grid g3" style="margin-top:18px"><div class="card"><h3>Últimos pedidos</h3><ul class="list">${[...ped].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 5).map(p => `<li><span>#${p.id} ${esc(p.clienteNome)}<br><small>${dt(p.criadoEm)}</small></span><span>${brl(p.total)}<br>${tagS(p.status)}</span></li>`).join('')}</ul></div>
  <div class="card"><h3>Últimos pagamentos</h3><ul class="list">${ok.filter(p => p.pago).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 5).map(p => `<li><span>#${p.id}<br><small>${esc(p.pagamento)}</small></span><b>${brl(p.total)}</b></li>`).join('')}</ul></div>
  <div class="card"><h3>Alertas de estoque</h3><ul class="list">${low.map(i => `<li><span>${esc(i.nome)}<br><small>mínimo ${i.minimo} ${i.unidade}</small></span><span class="tag bad">${i.qtd} ${i.unidade}</span></li>`).join('')}${venc.map(i => `<li><span>${esc(i.nome)}<br><small>validade ${dday(i.validade)}</small></span><span class="tag warn">Vence em breve</span></li>`).join('')}${low.length + venc.length ? '' : '<li>Tudo em ordem.</li>'}</ul></div>
  <div class="card"><h3>Novos clientes</h3><ul class="list">${[...cli].sort((a, b) => b.cadastro.localeCompare(a.cadastro)).slice(0, 4).map(c => `<li><span>${esc(c.nome)}</span><small>${dday(c.cadastro)}</small></li>`).join('')}</ul></div>
  <div class="card"><h3>Equipe</h3><ul class="list">${fun.slice(0, 5).map(f => `<li><span>${esc(f.nome)}</span><small>${esc(f.cargoNome)} · ${esc(f.situacao)}</small></li>`).join('')}</ul></div></div>`;
  const days = Array.from({length:14}, (_, i) => dkey(Date.now() - (13 - i) * 864e5));
  const byDay = d => fat(ok.filter(p => dkey(p.criadoEm) === d));
  chart('c1', {type:'line', data:{labels:days.map(d => d.slice(8) + '/' + d.slice(5, 7)), datasets:[{label:'R$', data:days.map(byDay), borderColor:'#C75C43', backgroundColor:'rgba(199,92,67,.12)', fill:true, tension:.35}]}, options:{plugins:{legend:{display:false}}}});
  const meses = {}; ok.forEach(p => { const k = dkey(p.criadoEm).slice(0, 7); meses[k] = (meses[k] || 0) + p.total; });
  const dsp = await Store.list('despesas'), dm = {}; dsp.forEach(d => { const k = d.vencimento.slice(0, 7); dm[k] = (dm[k] || 0) + d.valor; });
  const ks = [...new Set([...Object.keys(meses), ...Object.keys(dm)])].sort();
  chart('c2', {type:'bar', data:{labels:ks, datasets:[{label:'Faturamento', data:ks.map(k => meses[k] || 0), backgroundColor:'#193B35'}, {label:'Despesas', data:ks.map(k => dm[k] || 0), backgroundColor:'#D5B77A'}]}});
  const mo = {}; ok.forEach(p => mo[p.modalidade] = (mo[p.modalidade] || 0) + 1);
  chart('c3', {type:'doughnut', data:{labels:Object.keys(mo), datasets:[{data:Object.values(mo), backgroundColor:PAL}]}});
  chart('c4', {type:'bar', data:{labels:top.map(t => t[0].split('(')[0]), datasets:[{label:'Unidades', data:top.map(t => t[1]), backgroundColor:'#C75C43'}]}, options:{indexAxis:'y', plugins:{legend:{display:false}}}});
});
