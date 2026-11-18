(function () {
  const u = Auth.user(); if (u) return location.replace(HOME[u.cargo]);
  const d = Mode.isDemo();
  $('#mb').className = 'modebadge ' + (d ? 'demo' : 'api'); $('#mb').innerHTML = d ? 'Modo demonstração' : 'Modo produção (MySQL)';
  $('#mb').onclick = () => { Mode.set(d ? 'api' : 'demo'); location.reload(); };
  if (!d) $('#du').style.display = 'none';
  icons();
  $$('#du code').forEach(c => c.onclick = () => { $('#u').value = c.dataset.u; $('#p').value = c.dataset.p; });
  $('#eye').onclick = () => { const p = $('#p'); p.type = p.type === 'password' ? 'text' : 'password'; };
  $('#rec').onclick = e => { e.preventDefault(); modal(`<h2>Recuperar senha</h2><p>${d ? 'No modo demonstração não há envio de e-mail. Use uma das contas de exemplo.' : 'Peça ao administrador para redefinir sua senha. O envio automático por e-mail será implementado em uma etapa futura.'}</p><div class="mf"><button class="btn" onclick="this.closest('.ov').remove()">Entendi</button></div>`); };
  $('#f').onsubmit = async e => {
    e.preventDefault(); $('#er').textContent = '';
    if (!$('#u').value || !$('#p').value) return $('#er').textContent = 'Informe e-mail e senha.';
    try { const usr = await Auth.login($('#u').value.trim(), $('#p').value); location.href = HOME[usr.cargo]; }
    catch (er) { $('#er').textContent = er.message + (er.offline ? ' Inicie a API ou volte ao modo demonstração (selo acima).' : ''); }
  };
})();
