/* Sakura Sushi — núcleo do front-end: modo, dados, autenticação, layout e componentes. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl = n => Number(n || 0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
const dt = i => i ? new Date(i).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : '—';
const dday = i => i ? new Date(i.length === 10 ? i + 'T12:00' : i).toLocaleDateString('pt-BR') : '—';
const dkey = i => { const d = new Date(i); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
const today = () => dkey(Date.now());
const sNum = s => STATUS_FLOW.indexOf(s);
const tagS = s => `<span class="tag s${sNum(s)}">${esc(s)}</span>`;
const icons = () => { try { window.lucide && lucide.createIcons(); } catch (e) {} };
const I = n => `<i data-lucide="${n}"></i>`;

/* ---------- Modo ---------- */
const Mode = {
  get() { return localStorage.getItem('sakura_mode') || SAKURA_CONFIG.DEFAULT_MODE; },
  set(m) { localStorage.setItem('sakura_mode', m); },
  isDemo() { return this.get() === 'demo'; }
};

/* ---------- Dados ---------- */
const KEY = 'sakura_demo_db';
const PATHS = {ingredientes:'estoque', despesas:'financeiro/despesas', movimentacoes:'estoque/movimentacoes'};
const Store = {
  _db() { let d = localStorage.getItem(KEY); if (!d) { d = JSON.stringify(SakuraSeed()); localStorage.setItem(KEY, d); } return JSON.parse(d); },
  _w(db) { localStorage.setItem(KEY, JSON.stringify(db)); },
  reset() { localStorage.removeItem(KEY); },
  async _api(path, opt = {}) {
    const tk = sessionStorage.getItem('sakura_token');
    let r;
    try { r = await fetch(SAKURA_CONFIG.API_URL + '/' + path, {...opt, headers:{'Content-Type':'application/json', ...(tk ? {Authorization:'Bearer ' + tk} : {})}, body: opt.body ? JSON.stringify(opt.body) : undefined}); }
    catch (e) { const er = new Error('Servidor não conectado'); er.offline = true; throw er; }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.erro || 'Erro ' + r.status);
    return j;
  },
  async list(c) { if (Mode.isDemo()) return this._db()[c] || []; return this._api(PATHS[c] || c); },
  async save(c, o) {
    if (!Mode.isDemo()) return this._api((PATHS[c] || c) + (o.id ? '/' + o.id : ''), {method:o.id ? 'PUT' : 'POST', body:o});
    const db = this._db(), a = db[c];
    if (o.id) { const i = a.findIndex(x => x.id == o.id); a[i] = {...a[i], ...o}; }
    else { o.id = Math.max(0, ...a.map(x => x.id)) + 1; a.push(o); }
    this._w(db); return o;
  },
  async del(c, id) {
    if (!Mode.isDemo()) return this._api((PATHS[c] || c) + '/' + id, {method:'DELETE'});
    const db = this._db(); db[c] = db[c].filter(x => x.id != id); this._w(db);
  },
  /* Regras de negócio (no modo API ficam no servidor) */
  async setStatus(id, status) {
    if (!Mode.isDemo()) return this._api('pedidos/' + id + '/status', {method:'PUT', body:{status}});
    const db = this._db(), p = db.pedidos.find(x => x.id == id); if (!p) return;
    p.status = status;
    const concluido = status === 'Entregue' || (p.modalidade !== 'Delivery' && status === 'Pronto');
    if (concluido && !p.estoqueBaixado) { // ficha técnica → baixa de estoque, sem duplicar
      p.estoqueBaixado = true;
      p.itens.forEach(it => { const pr = db.produtos.find(x => x.id == it.produtoId); (pr?.ficha || []).forEach(f => {
        const ing = db.ingredientes.find(x => x.id == f.i); if (ing) { ing.qtd = +Math.max(0, ing.qtd - f.q * it.qtd).toFixed(3); }
      }); });
      db.movimentacoes.push({id:db.movimentacoes.length + 1, ingredienteId:null, tipo:'Saída', qtd:0, motivo:'Baixa automática do pedido #' + p.id, data:new Date().toISOString(), usuario:'Sistema'});
    }
    if (status === 'Entregue' && p.status && p.modalidade === 'Delivery') p.pago = true;
    const e = db.entregas.find(x => x.pedidoId == id);
    if (e) { if (status === 'Saiu para entrega') e.status = 'Saiu para entrega'; if (status === 'Entregue') e.status = 'Entregue'; }
    if (status === 'Pronto' && p.modalidade === 'Delivery' && !e) {}
    this._w(db);
  },
  async createOrder(o) {
    if (!Mode.isDemo()) return this._api('pedidos', {method:'POST', body:o});
    const db = this._db();
    o.id = Math.max(1000, ...db.pedidos.map(x => x.id)) + 1; o.criadoEm = new Date().toISOString(); o.status = 'Pedido recebido'; o.estoqueBaixado = false;
    db.pedidos.push(o);
    if (o.modalidade === 'Delivery') db.entregas.push({id:db.entregas.length + 1, pedidoId:o.id, cliente:o.clienteNome, telefone:o.telefone, endereco:o.endereco, bairro:o.bairro, complemento:o.complemento || '', referencia:o.referencia || '', entregadorId:null, taxa:o.taxa, status:'Aguardando entregador', criadoEm:o.criadoEm});
    this._w(db); return o;
  },
  async assign(entId, funcId) {
    if (!Mode.isDemo()) return this._api('entregas/' + entId, {method:'PUT', body:{entregadorId:funcId}});
    const db = this._db(), e = db.entregas.find(x => x.id == entId); e.entregadorId = funcId; if (e.status === 'Aguardando entregador') e.status = 'Entregador atribuído'; this._w(db);
  },
  async deliveryStatus(entId, st) {
    if (!Mode.isDemo()) return this._api('entregas/' + entId, {method:'PUT', body:{status:st}});
    const db = this._db(), e = db.entregas.find(x => x.id == entId); e.status = st; this._w(db);
    if (st === 'Saiu para entrega') return this.setStatus(e.pedidoId, 'Saiu para entrega');
    if (st === 'Entregue') return this.setStatus(e.pedidoId, 'Entregue');
  },
  async stockMove(ingId, tipo, qtd, motivo) {
    const u = Auth.user();
    if (!Mode.isDemo()) return this._api('estoque/movimentacoes', {method:'POST', body:{ingredienteId:ingId, tipo, qtd, motivo}});
    const db = this._db(), ing = db.ingredientes.find(x => x.id == ingId);
    ing.qtd = +(tipo === 'Entrada' ? ing.qtd + qtd : tipo === 'Saída' ? Math.max(0, ing.qtd - qtd) : qtd).toFixed(3);
    db.movimentacoes.push({id:db.movimentacoes.length + 1, ingredienteId:+ingId, tipo, qtd, motivo, data:new Date().toISOString(), usuario:u?.nome || '—'}); this._w(db);
  }
};

/* ---------- Autenticação ---------- */
const HOME = {admin:'dashboard.html', gerente:'dashboard.html', atendente:'pedidos.html', cozinheiro:'cozinha.html', estoquista:'estoque.html', entregador:'entregas.html'};
const Auth = {
  user() { try { return JSON.parse(sessionStorage.getItem('sakura_user')); } catch (e) { return null; } },
  async login(login, senha) {
    if (!Mode.isDemo()) { const r = await Store._api('auth/login', {method:'POST', body:{login, senha}}); sessionStorage.setItem('sakura_token', r.token); sessionStorage.setItem('sakura_user', JSON.stringify(r.usuario)); return r.usuario; }
    const f = (await Store.list('funcionarios')).find(x => x.email === login && x.senha === senha && x.situacao === 'Ativo');
    if (!f) throw new Error('E-mail ou senha incorretos.');
    const u = {id:f.id, nome:f.nome, cargo:f.cargo, cargoNome:f.cargoNome}; sessionStorage.setItem('sakura_user', JSON.stringify(u)); return u;
  },
  logout() { sessionStorage.clear(); location.href = 'login.html'; }
};

/* ---------- UI ---------- */
function toast(msg, err) { let b = $('#toasts'); if (!b) { b = document.createElement('div'); b.id = 'toasts'; document.body.append(b); } const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg; b.append(t); setTimeout(() => t.remove(), 3500); }
function modal(html, wide) {
  const o = document.createElement('div'); o.className = 'ov'; o.innerHTML = `<div class="modal" role="dialog" aria-modal="true" ${wide ? 'style="width:min(860px,100%)"' : ''}>${html}</div>`;
  const close = () => o.remove(); o.addEventListener('mousedown', e => { if (e.target === o) close(); });
  document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
  document.body.append(o); icons(); return {el:o.firstElementChild, close};
}
function confirmBox(msg, onYes) { const m = modal(`<h2>Confirmar</h2><p>${esc(msg)}</p><div class="mf"><button class="btn ghost" data-x>Voltar</button><button class="btn danger" data-y>Confirmar</button></div>`); $('[data-x]', m.el).onclick = m.close; $('[data-y]', m.el).onclick = async () => { m.close(); await onYes(); }; }
function fieldHtml(f, v) {
  const val = v?.[f.k] ?? f.def ?? ''; const req = f.req ? 'required' : '';
  let inp;
  if (f.t === 'select') inp = `<select name="${f.k}" ${req}>${(f.opts || []).map(o => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(ov)}" ${String(ov) === String(val) ? 'selected' : ''}>${esc(ol)}</option>`; }).join('')}</select>`;
  else if (f.t === 'textarea') inp = `<textarea name="${f.k}" rows="3" ${req}>${esc(val)}</textarea>`;
  else if (f.t === 'checkbox') inp = `<input type="checkbox" name="${f.k}" ${val ? 'checked' : ''} style="width:auto">`;
  else inp = `<input name="${f.k}" type="${f.t || 'text'}" value="${esc(val)}" ${f.step ? `step="${f.step}"` : ''} ${req} ${f.ph ? `placeholder="${esc(f.ph)}"` : ''}>`;
  return `<div class="${f.full ? 'full' : ''}"><label>${esc(f.l)}${f.req ? ' *' : ''}</label>${inp}</div>`;
}
function formModal({title, fields, values, onSave, wide}) {
  const m = modal(`<h2>${esc(title)}</h2><form><div class="fg">${fields.map(f => fieldHtml(f, values)).join('')}</div><div class="mf"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn" type="submit">Salvar</button></div></form>`, wide);
  $('[data-x]', m.el).onclick = m.close;
  $('form', m.el).onsubmit = async e => {
    e.preventDefault(); const o = {...(values || {})};
    fields.forEach(f => { const el = e.target.elements[f.k]; if (!el) return; o[f.k] = f.t === 'checkbox' ? el.checked : f.t === 'number' ? Number(el.value) : el.value.trim(); });
    try { await onSave(o); m.close(); } catch (er) { toast(er.message, true); }
  };
  return m;
}
const emptyState = (ic, msg) => `<div class="empty">${I(ic)}<p>${esc(msg)}</p></div>`;
const loading = () => `<div class="empty"><span class="spin"></span><p>Carregando…</p></div>`;
function table(cols, rows, empty = 'Nada por aqui ainda.') {
  if (!rows.length) return `<div class="tw">${emptyState('inbox', empty)}</div>`;
  return `<div class="tw"><table><thead><tr>${cols.map(c => `<th>${c.h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td class="${c.w ? 'wrap' : ''}">${c.f(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function chart(id, cfg) {
  const c = document.getElementById(id); if (!c) return;
  if (typeof Chart === 'undefined') { c.parentElement.innerHTML = emptyState('chart-bar', 'Gráfico indisponível: a biblioteca Chart.js não carregou (verifique a conexão com a internet).'); icons(); return; }
  Chart.defaults.font.family = 'Inter'; Chart.defaults.color = '#6b726f';
  (c._ch) && c._ch.destroy(); c._ch = new Chart(c, {...cfg, options:{responsive:true, maintainAspectRatio:false, ...(cfg.options || {})}});
}
const PAL = ['#193B35', '#C75C43', '#D5B77A', '#4f8a7b', '#e39a86', '#8c6d2f', '#7aa89c'];
function csvDown(name, head, rows) {
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const b = new Blob(['\ufeff' + [head, ...rows].map(r => r.map(q).join(';')).join('\n')], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); URL.revokeObjectURL(a.href);
}
function printDoc(title, body) {
  const w = window.open('', '_blank', 'width=420,height=640'); if (!w) return toast('Permita pop-ups para imprimir.', true);
  w.document.write(`<html><head><title>${esc(title)}</title><style>body{font-family:Inter,Arial,sans-serif;font-size:13px;padding:18px;max-width:380px}h2{font-family:Georgia,serif;margin:0}hr{border:0;border-top:1px dashed #999}table{width:100%}td:last-child{text-align:right}</style></head><body>${body}<script>window.onload=()=>window.print()<\/script></body></html>`); w.document.close();
}
/* Foto do prato: usa img do cadastro; sem foto, gera ilustração SVG (coloque fotos reais em images/ ou envie pelo cadastro). */
function foto(p) {
  if (p.img) return p.img;
  const c = {Sashimi:['#C75C43','#f1b9a9'], Nigiri:['#D5B77A','#f0e0b8'], 'Hot Roll':['#8c6d2f','#D5B77A'], Combinados:['#C75C43','#D5B77A'], Bebidas:['#4f8a7b','#c9e2da'], Sobremesas:['#e39a86','#fbe4dc'], Entradas:['#8c6d2f','#e9d7a7']}[p.categoria] || ['#E8845F', '#f6d1c4'];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='#193B35'/><circle cx='200' cy='150' r='118' fill='#F5F0E6'/><circle cx='200' cy='150' r='100' fill='none' stroke='#D5B77A' stroke-width='2'/>${[[155, 140], [245, 140], [200, 190]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='36' fill='#252B29'/><circle cx='${x}' cy='${y}' r='27' fill='#fff'/><circle cx='${x}' cy='${y}' r='16' fill='${c[0]}'/><circle cx='${x - 4}' cy='${y - 4}' r='6' fill='${c[1]}'/>`).join('')}</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* ---------- Layout administrativo ---------- */
const MENU = [
  ['dashboard', 'Painel', 'layout-dashboard', ['admin', 'gerente']], ['pedidos', 'Pedidos', 'receipt', ['admin', 'gerente', 'atendente']],
  ['cozinha', 'Cozinha', 'chef-hat', ['admin', 'gerente', 'cozinheiro']], ['entregas', 'Entregas', 'bike', ['admin', 'gerente', 'atendente', 'entregador']],
  ['cardapio', 'Cardápio', 'utensils', ['admin', 'gerente', 'atendente']], ['clientes', 'Clientes', 'users', ['admin', 'gerente', 'atendente']],
  ['estoque', 'Estoque', 'package', ['admin', 'gerente', 'estoquista']], ['fornecedores', 'Fornecedores', 'truck', ['admin', 'gerente', 'estoquista']],
  ['financeiro', 'Financeiro', 'wallet', ['admin', 'gerente']], ['relatorios', 'Relatórios', 'file-bar-chart', ['admin', 'gerente']],
  ['funcionarios', 'Funcionários', 'id-card', ['admin']]
];
const App = {
  async init(page, title, render) {
    const u = Auth.user(); if (!u) return location.replace('login.html');
    const item = MENU.find(m => m[0] === page);
    if (item && !item[3].includes(u.cargo)) return location.replace(HOME[u.cargo] || 'login.html');
    this.page = page; this.render = render; this.user = u;
    document.body.innerHTML = `<div class="shell"><aside class="side" id="side"><a class="brand" href="${HOME[u.cargo]}"><span class="mon">桜</span><span><b>Sakura Sushi</b><small>Gestão do restaurante</small></span></a>
      <nav class="nav">${MENU.filter(m => m[3].includes(u.cargo)).map(m => `<a href="${m[0]}.html" class="${m[0] === page ? 'on' : ''}">${I(m[2])}${m[1]}</a>`).join('')}<a href="index.html" target="_blank">${I('store')}Área do cliente</a></nav>
      <div class="userbox"><b>${esc(u.nome)}</b><span>${esc(u.cargoNome)}</span><button id="out">Sair</button></div></aside>
      <div class="main"><header class="top"><button class="burger" id="bg" aria-label="Menu">${I('menu')}</button><h1>${esc(title)}</h1><button class="modebadge" id="mb"></button></header><div id="bn"></div><main class="view" id="view">${loading()}</main></div></div>`;
    $('#out').onclick = () => Auth.logout(); $('#bg').onclick = () => $('#side').classList.toggle('open');
    this.mode(); $('#mb').onclick = () => confirmBox(Mode.isDemo() ? 'Alternar para o modo PRODUÇÃO? Os dados virão da API/MySQL e será preciso entrar novamente.' : 'Alternar para o modo DEMONSTRAÇÃO? Serão usados dados fictícios do navegador.', async () => { Mode.set(Mode.isDemo() ? 'api' : 'demo'); sessionStorage.clear(); location.href = 'login.html'; });
    icons(); await this.load();
    window.addEventListener('storage', e => { if (e.key === KEY && this.live) this.load(true); });
  },
  mode() {
    const d = Mode.isDemo(); $('#mb').className = 'modebadge ' + (d ? 'demo' : 'api'); $('#mb').innerHTML = d ? I('flask-conical') + 'Modo demonstração' : I('database') + 'Modo produção (MySQL)';
    $('#bn').innerHTML = d ? `<div class="banner">${I('info')}<span>Você está vendo <b>dados fictícios</b> salvos neste navegador. Nada é enviado ao banco de dados.</span><button class="btn sm ghost" id="rs">Restaurar dados de exemplo</button></div>` : '';
    if (d) $('#rs').onclick = () => confirmBox('Apagar as alterações feitas na demonstração e restaurar os dados de exemplo?', () => { Store.reset(); location.reload(); });
    icons();
  },
  async load(silent) {
    const v = $('#view'); if (!silent) v.innerHTML = loading();
    try { await this.render(v); } catch (e) {
      console.error(e);
      v.innerHTML = `<div class="card">${emptyState(e.offline ? 'cloud-off' : 'triangle-alert', e.message)}<p style="text-align:center">${e.offline ? 'A API Node.js não respondeu em <code>' + esc(SAKURA_CONFIG.API_URL) + '</code>. Inicie o servidor ou continue visualizando em modo demonstração.' : ''}</p><div class="mf" style="justify-content:center"><button class="btn ghost" id="rt">Tentar de novo</button>${Mode.isDemo() ? '' : '<button class="btn sec" id="dm">Usar modo demonstração</button>'}</div></div>`;
      $('#rt').onclick = () => this.load(); const dm = $('#dm'); if (dm) dm.onclick = () => { Mode.set('demo'); sessionStorage.clear(); location.href = 'login.html'; };
    }
    icons();
  },
  reload() { return this.load(true); }
};

/* ---------- Página CRUD genérica ---------- */
async function crudPage(v, o) {
  const rows = await Store.list(o.col); const q = (App._q || '').toLowerCase();
  const list = rows.filter(r => !q || o.search.some(k => String(r[k] || '').toLowerCase().includes(q)));
  const canDel = !o.delRoles || o.delRoles.includes(App.user.cargo);
  v.innerHTML = `<div class="bar"><input id="q" type="search" placeholder="Buscar…" value="${esc(App._q || '')}"><span class="sp"></span><button class="btn" id="nw">${I('plus')}${o.novo}</button></div>
    <div id="tb">${table([...o.cols, {h:'Ações', f:r => `<div class="acts"><button class="btn sm ghost" data-e="${r.id}" aria-label="Editar">${I('pencil')}</button>${o.extra ? o.extra(r) : ''}${canDel ? `<button class="btn sm danger" data-d="${r.id}" aria-label="Excluir">${I('trash-2')}</button>` : ''}</div>`}], list, o.vazio)}</div>`;
  $('#q').oninput = e => { App._q = e.target.value; clearTimeout(App._t); App._t = setTimeout(() => { App.reload(); setTimeout(() => { const i = $('#q'); i.focus(); i.setSelectionRange(99, 99); }, 0); }, 250); };
  const open = r => formModal({title:r ? 'Editar' : o.novo, fields:o.fields, values:r, onSave:async x => { await Store.save(o.col, o.pre ? o.pre(x) : x); toast('Salvo com sucesso.'); App.reload(); }});
  $('#nw').onclick = () => open(null);
  $$('[data-e]', v).forEach(b => b.onclick = () => open(rows.find(x => x.id == b.dataset.e)));
  $$('[data-d]', v).forEach(b => b.onclick = () => confirmBox(o.delMsg || 'Excluir este registro?', async () => { try { await Store.del(o.col, b.dataset.d); toast('Excluído.'); App.reload(); } catch (e) { toast(e.message, true); } }));
  if (o.after) o.after(v, rows);
  icons();
}
