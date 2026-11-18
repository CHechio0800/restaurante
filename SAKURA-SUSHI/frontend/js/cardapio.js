const CATS = ['Sushi', 'Sashimi', 'Temaki', 'Hot Roll', 'Uramaki', 'Hossomaki', 'Nigiri', 'Combinados', 'Entradas', 'Bebidas', 'Sobremesas'];
App.init('cardapio', 'Cardápio', async v => {
  const prod = await Store.list('produtos'), fc = App._fc || '', q = (App._cq || '').toLowerCase();
  const list = prod.filter(p => (!fc || p.categoria === fc) && (!q || p.nome.toLowerCase().includes(q)));
  v.innerHTML = `<div class="bar"><input id="q" type="search" placeholder="Buscar produto" value="${esc(App._cq || '')}"><select id="fc"><option value="">Todas as categorias</option>${CATS.map(c => `<option ${c === fc ? 'selected' : ''}>${c}</option>`).join('')}</select><span class="sp"></span><button class="btn" id="nw">${I('plus')}Novo produto</button></div>
  ${list.length ? `<div class="grid g3">${list.map(p => `<div class="card pc" style="${p.disponivel ? '' : 'opacity:.65'}"><img class="ph" src="${esc(foto(p))}" alt="${esc(p.nome)}" loading="lazy"><div class="bd">${p.promocao ? `<span class="promo">${esc(p.promocao)}</span>` : ''}<h3 style="margin:0">${esc(p.nome)}</h3><small>${esc(p.categoria)} · ${p.preparo} min${p.destaque ? ' · ★ destaque' : ''}</small><p>${esc(p.descricao)}</p><p><b>Ingredientes:</b> ${esc(p.ingredientes)}</p><div class="ft"><span class="pr">${brl(p.preco)}</span><div class="acts"><button class="btn sm ghost" data-t="${p.id}">${p.disponivel ? 'Desativar' : 'Ativar'}</button><button class="btn sm ghost" data-e="${p.id}" aria-label="Editar">${I('pencil')}</button><button class="btn sm danger" data-d="${p.id}" aria-label="Excluir">${I('trash-2')}</button></div></div></div></div>`).join('')}</div>` : emptyState('utensils', 'Nenhum produto encontrado.')}`;
  $('#q').oninput = e => { App._cq = e.target.value; clearTimeout(App._t); App._t = setTimeout(() => App.reload().then(() => { const i = $('#q'); i.focus(); i.setSelectionRange(99, 99); }), 250); };
  $('#fc').onchange = e => { App._fc = e.target.value; App.reload(); };
  const open = p => {
    let img = p?.img || '';
    const m = formModal({title:p ? 'Editar produto' : 'Novo produto', values:p, wide:true, fields:[{k:'nome', l:'Nome', req:1, full:1}, {k:'categoria', l:'Categoria', t:'select', opts:CATS}, {k:'preco', l:'Preço (R$)', t:'number', step:'0.01', req:1}, {k:'descricao', l:'Descrição', t:'textarea', full:1}, {k:'ingredientes', l:'Ingredientes', full:1}, {k:'preparo', l:'Tempo de preparo (min)', t:'number'}, {k:'promocao', l:'Promoção / selo (opcional)', ph:'-10%'}, {k:'disponivel', l:'Disponível', t:'checkbox', def:true}, {k:'destaque', l:'Em destaque', t:'checkbox'}],
      onSave:async o => { o.img = img; await Store.save('produtos', o); toast('Produto salvo.'); App.reload(); }});
    const up = document.createElement('div'); up.className = 'full'; up.innerHTML = `<label>Fotografia (JPG/PNG até 2 MB)</label><input type="file" accept="image/jpeg,image/png,image/webp"><small style="color:var(--muted)">${Mode.isDemo() ? 'Na demonstração a imagem fica salva no navegador.' : 'No modo produção a imagem é enviada ao servidor (pasta uploads).'}</small>`;
    $('.fg', m.el).append(up);
    $('input[type=file]', up).onchange = e => { const f = e.target.files[0]; if (!f) return; if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 2e6) { e.target.value = ''; return toast('Use JPG, PNG ou WEBP de até 2 MB.', true); } const r = new FileReader(); r.onload = () => { img = r.result; toast('Imagem anexada. Clique em Salvar.'); }; r.readAsDataURL(f); };
  };
  $('#nw').onclick = () => open(null);
  $$('[data-e]', v).forEach(b => b.onclick = () => open(prod.find(p => p.id == b.dataset.e)));
  $$('[data-t]', v).forEach(b => b.onclick = async () => { const p = prod.find(x => x.id == b.dataset.t); try { await Store.save('produtos', {id:p.id, disponivel:!p.disponivel}); toast(p.disponivel ? 'Produto desativado.' : 'Produto ativado.'); App.reload(); } catch (e) { toast(e.message, true); } });
  $$('[data-d]', v).forEach(b => b.onclick = () => confirmBox('Excluir este produto do cardápio?', async () => { try { await Store.del('produtos', b.dataset.d); toast('Produto excluído.'); App.reload(); } catch (e) { toast(e.message, true); } }));
  icons();
});
