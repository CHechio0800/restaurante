(function () {
  const TAXA = 7, INFO = {endereco:'Av. Sakura, 100 - Centro', telefone:'(14) 3000-1000', horario:'Ter a Dom, 18h às 23h'};
  let prods = [], cat = 'Todos', cart = JSON.parse(localStorage.getItem('sakura_cart') || '[]');
  const save = () => { localStorage.setItem('sakura_cart', JSON.stringify(cart)); $('#cn').textContent = cart.reduce((a, i) => a + i.qtd, 0); };
  const card = p => `<article class="card pc"><img class="ph" src="${esc(foto(p))}" alt="${esc(p.nome)}" loading="lazy"><div class="bd">${p.promocao ? `<span class="promo">${esc(p.promocao)}</span>` : ''}<h3 style="margin:0">${esc(p.nome)}</h3><p>${esc(p.descricao)}</p><p><b>Ingredientes:</b> ${esc(p.ingredientes)}</p><div class="ft"><span class="pr">${brl(p.preco)}</span><button class="btn sm" data-add="${p.id}">${I('plus')}Adicionar</button></div></div></article>`;
  function draw() {
    const on = prods.filter(p => p.disponivel);
    $('#dest').innerHTML = on.filter(p => p.destaque || p.promocao).slice(0, 6).map(card).join('') || emptyState('star', 'Sem destaques no momento.');
    const cs = ['Todos', ...new Set(on.map(p => p.categoria))];
    $('#cats').innerHTML = cs.map(c => `<button class="chip ${c === cat ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');
    $('#prods').innerHTML = on.filter(p => cat === 'Todos' || p.categoria === cat).map(card).join('') || emptyState('utensils', 'Nenhum prato nesta categoria.');
    $$('[data-c]').forEach(b => b.onclick = () => { cat = b.dataset.c; draw(); });
    $$('[data-add]').forEach(b => b.onclick = () => { const p = prods.find(x => x.id == b.dataset.add), l = cart.find(i => i.produtoId === p.id); l ? l.qtd++ : cart.push({produtoId:p.id, nome:p.nome, preco:p.preco, qtd:1}); save(); toast(p.nome + ' adicionado.'); });
    $('#hero').src = foto(on[0] || {categoria:'Combinados'}); icons();
  }
  function cartView() {
    const s = cart.reduce((a, i) => a + i.qtd * i.preco, 0), d = $('#dr');
    d.innerHTML = `<div class="bar"><h2 style="flex:1">Seu carrinho</h2><button class="btn sm ghost" id="cx" aria-label="Fechar">${I('x')}</button></div>${cart.length ? cart.map((i, n) => `<div class="ci"><b>${esc(i.nome)}</b><b>${brl(i.qtd * i.preco)}</b><span class="qty"><button data-m="${n}" aria-label="Menos">−</button>${i.qtd}<button data-p="${n}" aria-label="Mais">+</button></span><button class="btn sm ghost" data-r="${n}">Remover</button></div>`).join('') + `<p style="text-align:right;margin:14px 0">Subtotal: <b>${brl(s)}</b></p><button class="btn" id="ck" style="width:100%;justify-content:center">Finalizar pedido</button>` : emptyState('shopping-bag', 'Seu carrinho está vazio. Escolha um prato no cardápio.')}`;
    $('#cx').onclick = () => d.classList.remove('open');
    $$('[data-m]', d).forEach(b => b.onclick = () => { const i = cart[b.dataset.m]; if (--i.qtd < 1) cart.splice(b.dataset.m, 1); save(); cartView(); });
    $$('[data-p]', d).forEach(b => b.onclick = () => { cart[b.dataset.p].qtd++; save(); cartView(); });
    $$('[data-r]', d).forEach(b => b.onclick = () => { cart.splice(b.dataset.r, 1); save(); cartView(); });
    const ck = $('#ck'); if (ck) ck.onclick = checkout; icons();
  }
  function checkout() {
    const s = cart.reduce((a, i) => a + i.qtd * i.preco, 0);
    const m = modal(`<h2>Finalizar pedido</h2><form id="co"><div class="fg"><div class="full"><label>Como você quer receber?</label><select name="mod"><option>Delivery</option><option>Retirada</option><option>Consumo no local</option></select></div><div><label>Nome *</label><input name="nome" required></div><div><label>Telefone *</label><input name="tel" required inputmode="tel"></div><div class="full" data-end><label>Endereço *</label><input name="end"></div><div data-end><label>Bairro</label><input name="bai"></div><div data-end><label>Complemento / referência</label><input name="ref"></div><div class="full"><label>Pagamento</label><select name="pg"><option>PIX</option><option>Dinheiro</option><option>Cartão de débito</option><option>Cartão de crédito</option><option>Pagamento na entrega</option></select></div><div class="full"><label>Observações</label><textarea name="obs" rows="2"></textarea></div></div><p>Subtotal ${brl(s)} · Entrega <span id="tx"></span><br><b>Total: <span id="tt"></span></b></p><small style="color:var(--muted)">PIX e cartão são registrados manualmente pela equipe; nenhuma cobrança online é feita.</small><div class="mf"><button type="button" class="btn ghost" data-x>Voltar</button><button class="btn">Confirmar pedido</button></div></form>`);
    const f = $('#co', m.el), upd = () => { const del = f.mod.value === 'Delivery'; $$('[data-end]', m.el).forEach(e => e.style.display = del ? '' : 'none'); $('#tx', m.el).textContent = del ? brl(TAXA) : 'grátis'; $('#tt', m.el).textContent = brl(s + (del ? TAXA : 0)); };
    f.mod.onchange = upd; upd(); $('[data-x]', m.el).onclick = m.close;
    f.onsubmit = async e => { e.preventDefault(); const del = f.mod.value === 'Delivery'; if (del && !f.end.value.trim()) return toast('Informe o endereço de entrega.', true);
      try { const o = await Store.createOrder({clienteNome:f.nome.value.trim(), telefone:f.tel.value.trim(), itens:cart.map(i => ({...i})), obs:f.obs.value, subtotal:s, desconto:0, taxa:del ? TAXA : 0, total:s + (del ? TAXA : 0), pagamento:f.pg.value, pago:false, modalidade:f.mod.value, endereco:del ? f.end.value.trim() : '', bairro:f.bai.value, complemento:f.ref.value, origem:'Site'});
        cart = []; save(); m.close(); $('#dr').classList.remove('open'); modal(`<h2>Pedido recebido!</h2><p>Seu pedido número <b>#${o.id}</b> foi enviado. Guarde o número e use o telefone informado para acompanhar.</p><div class="mf"><button class="btn" onclick="this.closest('.ov').remove();location.hash='acompanhar'">Acompanhar</button></div>`); $('#tn').value = o.id; $('#tp').value = f.tel.value;
      } catch (er) { toast(er.message, true); } };
  }
  async function track(e) {
    e.preventDefault(); const box = $('#tr'); box.innerHTML = loading();
    try {
      const num = $('#tn').value.replace(/\D/g, ''), tel = $('#tp').value.replace(/\D/g, ''); let p;
      if (Mode.isDemo()) p = (await Store.list('pedidos')).find(x => x.id == num && x.telefone.replace(/\D/g, '') === tel); else p = await Store._api(`pedidos/acompanhar/${num}?telefone=${tel}`);
      if (!p) return box.innerHTML = emptyState('search-x', 'Pedido não encontrado. Confira o número e o telefone.');
      const flow = p.modalidade === 'Delivery' ? STATUS_FLOW.slice(0, 6) : STATUS_FLOW.slice(0, 4), cur = flow.indexOf(p.status);
      box.innerHTML = `<div class="card"><h3>Pedido #${p.id} — ${esc(p.modalidade)}</h3>${p.status === 'Cancelado' ? '<span class="tag bad">Cancelado</span>' : `<div class="steps">${flow.map((s, i) => `<span class="${i < cur || p.status === 'Entregue' ? 'done' : i === cur ? 'now' : ''}">${s}</span>`).join('')}</div>`}<p>${p.itens.map(i => i.qtd + 'x ' + esc(i.nome)).join(', ')}</p><b>Total: ${brl(p.total)}</b></div>`; icons();
    } catch (er) { box.innerHTML = emptyState('cloud-off', er.message); icons(); }
  }
  (async () => {
    $('#modo').textContent = Mode.isDemo() ? 'Modo demonstração: dados fictícios' : 'Modo produção';
    if (Mode.isDemo()) $('#demo').innerHTML = `<div class="banner">${I('info')}Modo demonstração: os pedidos feitos aqui são fictícios e ficam apenas neste navegador.</div>`;
    $('#inf').textContent = `${INFO.endereco} · ${INFO.telefone} · ${INFO.horario}`;
    $('#cb').onclick = () => { cartView(); $('#dr').classList.add('open'); }; $('#tf').onsubmit = track; save();
    $('#prods').innerHTML = loading();
    try { prods = await Store.list('produtos'); draw(); }
    catch (e) { $('#prods').innerHTML = `<div class="card" style="grid-column:1/-1">${emptyState('cloud-off', e.message + '. O cardápio não pôde ser carregado.')}<div class="mf" style="justify-content:center"><button class="btn sec" id="dm">Ver em modo demonstração</button></div></div>`; $('#dm').onclick = () => { Mode.set('demo'); location.reload(); }; }
    icons();
  })();
})();
