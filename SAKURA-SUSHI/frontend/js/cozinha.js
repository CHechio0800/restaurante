App.init('cozinha', 'Cozinha', async v => {
  App.live = true;
  const all = await Store.list('pedidos');
  const cols = [['Recebidos', ['Pedido recebido', 'Confirmado'], 'Em preparação', 'Iniciar preparo'], ['Em preparação', ['Em preparação'], 'Pronto', 'Marcar como pronto'], ['Prontos', ['Pronto'], null, '']];
  v.innerHTML = `<p style="color:var(--muted);margin-top:0">Atualiza automaticamente. Mudanças feitas aqui aparecem no painel de pedidos.</p><div class="kan">${cols.map(c => {
    const l = all.filter(p => c[1].includes(p.status)).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
    return `<div class="col"><h3>${c[0]} <span class="tag">${l.length}</span></h3>${l.length ? l.map(p => { const min = Math.round((Date.now() - new Date(p.criadoEm)) / 6e4);
      return `<div class="tk ${min > 40 && p.status !== 'Pronto' ? 'late' : ''}"><h4><span>#${p.id}</span><span>${new Date(p.criadoEm).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span></h4><small>${esc(p.modalidade)} · espera ${min} min</small><ul>${p.itens.map(i => `<li><b>${i.qtd}x</b> ${esc(i.nome)}</li>`).join('')}</ul>${p.obs ? `<div class="obs">${I('message-square')} ${esc(p.obs)}</div>` : ''}${c[2] ? `<button class="btn sm" data-id="${p.id}" data-to="${c[2]}">${c[3]}</button>` : ''}</div>`; }).join('') : emptyState('chef-hat', 'Nenhum pedido aqui.')}</div>`; }).join('')}</div>`;
  $$('[data-id]', v).forEach(b => b.onclick = async () => { try { await Store.setStatus(b.dataset.id, b.dataset.to); toast('Pedido #' + b.dataset.id + ': ' + b.dataset.to); App.reload(); } catch (e) { toast(e.message, true); } });
  clearInterval(App._iv); App._iv = setInterval(() => App.reload(), 15000);
});
