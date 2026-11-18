// DADOS FICTÍCIOS — usados somente no MODO DEMONSTRAÇÃO.
window.SakuraSeed = function () {
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const now = Date.now(), DAY = 864e5;
  const iso = ms => new Date(ms).toISOString();

  const categorias = ['Sushi','Sashimi','Temaki','Hot Roll','Uramaki','Hossomaki','Nigiri','Combinados','Entradas','Bebidas','Sobremesas'];
  const ingredientes = [
    [1,'Arroz japonês','Grãos',18,'kg',8,9.5,1,30],[2,'Salmão fresco','Peixes',6.5,'kg',4,68,2,3],
    [3,'Atum','Peixes',3,'kg',2,79,2,4],[4,'Alga nori','Secos',40,'folhas',15,.9,3,200],
    [5,'Cream cheese','Laticínios',2,'kg',3,32,4,12],[6,'Camarão','Frutos do mar',1.2,'kg',2,74,2,2],
    [7,'Pepino japonês','Hortifrúti',4,'kg',2,8,4,5],[8,'Manga','Hortifrúti',2,'kg',1,7,4,4],
    [9,'Shoyu','Molhos',8,'L',3,14,3,180],[10,'Gengibre em conserva','Conservas',3,'kg',1,22,3,-1]
  ].map(a => ({id:a[0],nome:a[1],categoria:a[2],qtd:a[3],unidade:a[4],minimo:a[5],custo:a[6],fornecedorId:a[7],validade:iso(now + a[8]*DAY).slice(0,10)}));

  const fornecedores = [
    {id:1,nome:'Mar Azul Pescados Ltda',cnpj:'12.345.678/0001-90',telefone:'(11) 3333-1010',email:'vendas@marazul.com',endereco:'Rua do Porto, 120 - Santos/SP',produtos:'Salmão, atum, camarão'},
    {id:2,nome:'Oriental Grãos S.A.',cnpj:'98.765.432/0001-10',telefone:'(11) 3333-2020',email:'contato@orientalgraos.com',endereco:'Av. Liberdade, 800 - São Paulo/SP',produtos:'Arroz, alga nori, shoyu'},
    {id:3,nome:'Laticínios Campo Verde',cnpj:'45.678.123/0001-55',telefone:'(14) 3222-3030',email:'pedidos@campoverde.com',endereco:'Estrada Rural km 12 - Botucatu/SP',produtos:'Cream cheese'},
    {id:4,nome:'Hortifruti Sol Nascente',cnpj:'33.222.111/0001-77',telefone:'(14) 3222-4040',email:'sol@hortisol.com',endereco:'CEASA, Box 22 - Bauru/SP',produtos:'Pepino, manga, cebolinha'}
  ];

  const P = (id,nome,cat,desc,preco,ing,min,extra={}) => Object.assign({id,nome,categoria:cat,descricao:desc,preco,ingredientes:ing,preparo:min,disponivel:true,destaque:false,promocao:'',img:'',ficha:[]},extra);
  const produtos = [
    P(1,'Sashimi de Salmão (10 fatias)','Sashimi','Fatias frescas de salmão, cortadas na hora.',48.9,'Salmão, gengibre, shoyu',10,{destaque:true,ficha:[{i:2,q:.2},{i:10,q:.02}]}),
    P(2,'Nigiri de Atum (par)','Nigiri','Arroz levemente adocicado com atum selecionado.',22.9,'Atum, arroz',6,{ficha:[{i:3,q:.04},{i:1,q:.04}]}),
    P(3,'Hot Roll Philadelphia (10 un)','Hot Roll','Salmão e cream cheese empanados e crocantes.',36.9,'Salmão, cream cheese, arroz, nori',15,{destaque:true,promocao:'-10%',ficha:[{i:2,q:.1},{i:5,q:.06},{i:1,q:.2},{i:4,q:1}]}),
    P(4,'Uramaki Califórnia (8 un)','Uramaki','Kani, pepino e manga com gergelim.',31.9,'Kani, pepino, manga, arroz',14,{ficha:[{i:7,q:.05},{i:8,q:.05},{i:1,q:.18},{i:4,q:1}]}),
    P(5,'Temaki de Salmão','Temaki','Cone de alga crocante com salmão e cream cheese.',34.9,'Salmão, cream cheese, arroz, nori',8,{destaque:true,ficha:[{i:2,q:.08},{i:5,q:.03},{i:1,q:.1},{i:4,q:1}]}),
    P(6,'Temaki de Camarão','Temaki','Camarão empanado, cebolinha e cream cheese.',37.9,'Camarão, cream cheese, arroz, nori',9,{ficha:[{i:6,q:.07},{i:5,q:.03},{i:1,q:.1},{i:4,q:1}]}),
    P(7,'Hossomaki de Pepino (8 un)','Hossomaki','Rolinhos finos com pepino japonês.',19.9,'Pepino, arroz, nori',10,{ficha:[{i:7,q:.06},{i:1,q:.12},{i:4,q:1}]}),
    P(8,'Sushi de Salmão (par)','Sushi','Tradicional, com fatia generosa de salmão.',20.9,'Salmão, arroz',6,{ficha:[{i:2,q:.04},{i:1,q:.04}]}),
    P(9,'Combinado Sakura (30 peças)','Combinados','Sushis, sashimis, uramakis e hot rolls para dividir.',129.9,'Salmão, atum, camarão, arroz',25,{destaque:true,promocao:'Mais pedido',ficha:[{i:2,q:.3},{i:3,q:.1},{i:1,q:.5},{i:4,q:3}]}),
    P(10,'Combinado Executivo (16 peças)','Combinados','Seleção individual com os clássicos da casa.',72.9,'Salmão, atum, arroz',18,{ficha:[{i:2,q:.15},{i:1,q:.3},{i:4,q:2}]}),
    P(11,'Gyoza de Carne (6 un)','Entradas','Pastel japonês grelhado com molho agridoce.',24.9,'Carne, repolho, massa',12),
    P(12,'Guioza de Legumes (6 un)','Entradas','Opção vegetariana, grelhada na chapa.',22.9,'Legumes, massa',12),
    P(13,'Chá verde gelado','Bebidas','Chá verde com limão siciliano. 400 ml.',9.9,'Chá verde, limão',2),
    P(14,'Refrigerante lata','Bebidas','350 ml, vários sabores.',6.5,'—',1),
    P(15,'Mochi de Morango (3 un)','Sobremesas','Massa de arroz macia recheada com sorvete.',18.9,'Arroz glutinoso, morango',3,{promocao:'Novo'}),
    P(16,'Harumaki Doce','Sobremesas','Rolinho crocante de banana com doce de leite.',16.9,'Banana, doce de leite',8,{disponivel:false})
  ];

  const bairros = ['Centro','Jardim América','Vila Nova','Bela Vista','Santa Cruz'];
  const clientes = ['Ana Beatriz Souza','Carlos Eduardo Lima','Marina Fujita','Rafael Tanaka','Juliana Prado','Pedro Henrique Alves','Camila Nakamura','Lucas Martins'].map((n,i)=>({
    id:i+1,nome:n,telefone:`(14) 9${8000+i*137}-${1000+i*91}`,email:n.split(' ')[0].toLowerCase()+'@email.com',cpf:i%2?'':`${100+i*7}.${200+i*3}.${300+i}-0${i}`,
    endereco:`Rua das Cerejeiras, ${10+i*12}`,bairro:bairros[i%5],complemento:i%3?'':'Apto 4',referencia:i%2?'Próximo à praça':'',obs:i===0?'Alergia a amendoim':'',cadastro:iso(now-(60-i*5)*DAY).slice(0,10)}));

  const funcs = [
    ['Helena Sakamoto','admin','Administrador',9500,'admin@sakura.com','admin123'],
    ['Ricardo Yamada','gerente','Gerente',6200,'gerente@sakura.com','gerente123'],
    ['Patrícia Gomes','atendente','Atendente',2400,'atendente@sakura.com','atend123'],
    ['Kenji Ota','cozinheiro','Cozinheiro',4200,'cozinha@sakura.com','cozinha123'],
    ['Marcos Vieira','estoquista','Estoquista',2600,'estoque@sakura.com','estoque123'],
    ['Diego Ramos','entregador','Entregador',2100,'entregador@sakura.com','entrega123'],
    ['Tatiane Cruz','entregador','Entregador',2100,'tatiane@sakura.com','entrega123']
  ].map((f,i)=>({id:i+1,nome:f[0],cargo:f[1],cargoNome:f[2],salario:f[3],email:f[4],senha:f[5],cpf:`400.${100+i}.${200+i}-1${i}`,telefone:`(14) 9${7000+i*53}-${2000+i*17}`,endereco:'Rua Kobe, '+(20+i),contratacao:iso(now-(700-i*80)*DAY).slice(0,10),situacao:'Ativo'}));

  const statusFlow = ['Pedido recebido','Confirmado','Em preparação','Pronto','Saiu para entrega','Entregue','Cancelado'];
  const pagtos = ['PIX','Dinheiro','Cartão de débito','Cartão de crédito','Pagamento na entrega'];
  const mods = ['Delivery','Delivery','Retirada','Consumo no local'];
  const pedidos = [], entregas = [];
  const total = 46;
  for (let n = 1; n <= total; n++) {
    const isToday = n > total - 8;
    const when = isToday ? now - Math.floor(rnd()*5*36e5) - 6e4*5 : now - (1 + rnd()*14)*DAY;
    const cli = pick(clientes), modalidade = pick(mods);
    const itens = Array.from({length:1+Math.floor(rnd()*3)},()=>{const p=pick(produtos.filter(x=>x.disponivel));return {produtoId:p.id,nome:p.nome,qtd:1+Math.floor(rnd()*2),preco:p.preco};});
    const subtotal = +itens.reduce((a,i)=>a+i.qtd*i.preco,0).toFixed(2);
    const taxa = modalidade==='Delivery'?7:0, desconto = subtotal>120?10:0;
    let status;
    if (!isToday) status = rnd()<.07 ? 'Cancelado' : 'Entregue';
    else status = statusFlow[Math.min(4, Math.floor(rnd()*5))];
    if (modalidade!=='Delivery' && status==='Saiu para entrega') status='Pronto';
    const pg = pick(pagtos);
    const ped = {id:1000+n,clienteId:cli.id,clienteNome:cli.nome,telefone:cli.telefone,itens,obs:rnd()<.3?'Sem cebolinha, por favor':'',subtotal,desconto,taxa,total:+(subtotal-desconto+taxa).toFixed(2),
      pagamento:pg,pago:status==='Entregue'||(pg!=='Pagamento na entrega'&&status!=='Cancelado'&&rnd()<.8),modalidade,criadoEm:iso(when),status,
      endereco:modalidade==='Delivery'?cli.endereco:'',bairro:modalidade==='Delivery'?cli.bairro:'',estoqueBaixado:status==='Entregue',origem:'Balcão'};
    pedidos.push(ped);
    if (modalidade==='Delivery' && status!=='Cancelado' && status!=='Pedido recebido') {
      const es = status==='Entregue'?'Entregue':status==='Saiu para entrega'?'Saiu para entrega':'Aguardando entregador';
      entregas.push({id:entregas.length+1,pedidoId:ped.id,cliente:cli.nome,telefone:cli.telefone,endereco:cli.endereco,bairro:cli.bairro,complemento:cli.complemento,referencia:cli.referencia,
        entregadorId:es==='Aguardando entregador'?null:(6+(n%2)),taxa,status:es,criadoEm:ped.criadoEm});
    }
  }
  const dsp = [['Aluguel','Aluguel do salão',4800,'Pago',0],['Energia','Conta de energia',1260,'Pago',3],['Água','Conta de água',380,'Pago',3],['Internet','Fibra 500 Mb',199,'Pago',5],
    ['Salários','Folha de pagamento',23100,'Pago',8],['Compras','Pescados - Mar Azul',3150,'Pago',4],['Compras','Grãos e algas - Oriental',1480,'Pendente',-5],
    ['Manutenção','Reparo da câmara fria',650,'Pendente',-2],['Outras despesas','Embalagens delivery',420,'Pago',10]].map((d,i)=>({id:i+1,categoria:d[0],descricao:d[1],valor:d[2],situacao:d[3],
    vencimento:iso(now+d[4]*DAY).slice(0,10),boleto:i===6?'23793.38128 60000.000003 00000.000408 1 84340000148000':'',pagamentoData:d[3]==='Pago'?iso(now-(d[4]+1)*DAY).slice(0,10):''}));
  const movimentacoes = [{id:1,ingredienteId:2,tipo:'Entrada',qtd:10,motivo:'Compra - Mar Azul',data:iso(now-3*DAY),usuario:'Marcos Vieira'},{id:2,ingredienteId:1,tipo:'Saída',qtd:4,motivo:'Consumo da produção',data:iso(now-2*DAY),usuario:'Marcos Vieira'}];
  return {categorias,ingredientes,fornecedores,produtos,clientes,funcionarios:funcs,pedidos,entregas,despesas:dsp,movimentacoes,
    config:{taxaEntrega:7,endereco:'Av. Sakura, 100 - Centro',telefone:'(14) 3000-1000',horario:'Ter a Dom, 18h às 23h'}};
};
window.STATUS_FLOW = ['Pedido recebido','Confirmado','Em preparação','Pronto','Saiu para entrega','Entregue','Cancelado'];
