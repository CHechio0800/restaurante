const REPS = {vendas_diarias:'Vendas diárias', vendas_mensais:'Vendas mensais', mais_vendidos:'Produtos mais vendidos', cancelados:'Pedidos cancelados', funcionarios:'Desempenho dos funcionários', despesas:'Despesas', lucro:'Lucro estimado', estoque:'Estoque', entregas:'Entregas'};
App.init('relatorios', 'Relatórios', async v => {
  const [ped, dsp, ing, ent, fun] = await Promise.all(['pedidos', 'despesas', 'ingredientes', 'entregas', 'funcionarios'].map(c => Store.list(c)));
  const r = App._rep || 'vendas_diarias', de = App._rde || dkey(Date.now() - 29 * 864e5), ate = App._rate || today(), inR = d => d >= de && d <= ate;
  const pv = ped.filter(p => inR(dkey(p.criadoEm))), ok = pv.filter(p => p.status !== 'Cancelado');
  const grp = (l, key, val) => { const m = {}; l.forEach(x => { const k = key(x); m[k] = (m[k] || 0) + val(x); }); return Object.entries(m).sort(); };
  let head, rows;
  if (r === 'vendas_diarias') { head = ['Dia', 'Pedidos', 'Faturamento']; rows = grp(ok, p => dkey(p.criadoEm), p => p.total).map(([k, t]) => [dday(k), ok.filter(p => dkey(p.criadoEm) === k).length, brl(t)]); }
  else if (r === 'vendas_mensais') { head = ['Mês', 'Pedidos', 'Faturamento']; rows = grp(ok, p => dkey(p.criadoEm).slice(0, 7), p => p.total).map(([k, t]) => [k, ok.filter(p => dkey(p.criadoEm).startsWith(k)).length, brl(t)]); }
  else if (r === 'mais_vendidos') { head = ['Produto', 'Unidades', 'Receita']; const m = {}; ok.forEach(p => p.itens.forEach(i => { m[i.nome] = m[i.nome] || [0, 0]; m[i.nome][0] += i.qtd; m[i.nome][1] += i.qtd * i.preco; })); rows = Object.entries(m).sort((a, b) => b[1][0] - a[1][0]).map(([n, [q, t]]) => [n, q, brl(t)]); }
  else if (r === 'cancelados') { head = ['Pedido', 'Data', 'Cliente', 'Valor']; rows = pv.filter(p => p.status === 'Cancelado').map(p => ['#' + p.id, dt(p.criadoEm), p.clienteNome, brl(p.total)]); }
  else if (r === 'funcionarios') { head = ['Funcionário', 'Cargo', 'Entregas concluídas']; rows = fun.map(f => [f.nome, f.cargoNome, ent.filter(e => e.entregadorId == f.id && e.status === 'Entregue').length]); }
  else if (r === 'despesas') { head = ['Vencimento', 'Categoria', 'Descrição', 'Valor', 'Situação']; rows = dsp.filter(d => inR(d.vencimento)).map(d => [dday(d.vencimento), d.categoria, d.descricao, brl(d.valor), d.situacao]); }
  else if (r === 'lucro') { const f = ok.reduce((a, p) => a + p.total, 0), d = dsp.filter(x => inR(x.vencimento)).reduce((a, x) => a + x.valor, 0); head = ['Indicador', 'Valor']; rows = [['Faturamento bruto', brl(f)], ['Despesas', brl(d)], ['Lucro estimado', brl(f - d)]]; }
  else if (r === 'estoque') { head = ['Ingrediente', 'Quantidade', 'Mínimo', 'Situação', 'Validade']; rows = ing.map(i => [i.nome, i.qtd + ' ' + i.unidade, i.minimo, i.qtd <= i.minimo ? 'Baixo' : 'OK', dday(i.validade)]); }
  else { head = ['Pedido', 'Cliente', 'Bairro', 'Status']; rows = ent.filter(e => inR(dkey(e.criadoEm || Date.now()))).map(e => ['#' + e.pedidoId, e.cliente, e.bairro, e.status]); }
  v.innerHTML = `<div class="bar"><select id="r">${Object.entries(REPS).map(([k, n]) => `<option value="${k}" ${k === r ? 'selected' : ''}>${n}</option>`).join('')}</select><input type="date" id="de" value="${de}"><input type="date" id="ate" value="${ate}"><span class="sp"></span><button class="btn ghost" id="csv">${I('file-spreadsheet')}Exportar CSV</button><button class="btn" id="pdf">${I('file-down')}Exportar PDF</button></div>
  <h2 style="margin-bottom:4px">${REPS[r]}</h2><p style="color:var(--muted);margin-top:0">${dday(de)} a ${dday(ate)} · ${Mode.isDemo() ? 'dados fictícios' : 'dados reais'}</p>${table(head.map((h, i) => ({h, f:x => esc(x[i])})), rows, 'Sem dados para este período.')}`;
  $('#r').onchange = e => { App._rep = e.target.value; App.reload(); }; $('#de').onchange = e => { App._rde = e.target.value; App.reload(); }; $('#ate').onchange = e => { App._rate = e.target.value; App.reload(); };
  $('#csv').onclick = () => csvDown(`${r}_${de}_${ate}.csv`, head, rows); $('#pdf').onclick = () => { toast('Na janela de impressão, escolha “Salvar como PDF”.'); setTimeout(() => window.print(), 600); };
  icons();
});
