# Sakura Sushi — Sistema de Gerenciamento

**Status: Etapa 1 (interface + modo demonstração) concluída.** Etapas 2 a 5 (MySQL, API Node.js/Express, integração e testes) ainda não foram desenvolvidas — as pastas `backend/` e `database/` estão criadas, porém vazias.

## Como ver o sistema agora (sem MySQL, sem Node)
1. Abra `frontend/login.html` no navegador (ou, na pasta `frontend`, rode `npx serve .` ou `python3 -m http.server 5500` e acesse http://localhost:5500/login.html).
2. Entre com uma conta de demonstração (clique em um cargo para preencher):

| Cargo | E-mail | Senha |
|---|---|---|
| Administrador | admin@sakura.com | admin123 |
| Gerente | gerente@sakura.com | gerente123 |
| Atendente | atendente@sakura.com | atend123 |
| Cozinheiro | cozinha@sakura.com | cozinha123 |
| Estoquista | estoque@sakura.com | estoque123 |
| Entregador | entregador@sakura.com | entrega123 |

3. A área pública do cliente é `frontend/index.html`.

Requer internet para carregar fontes (Google Fonts), Lucide e Chart.js (CDN). Sem internet, o sistema continua funcionando; apenas ícones e gráficos ficam indisponíveis, com aviso na tela.

## Modos de funcionamento
- **Demonstração** (padrão): dados fictícios em `localStorage`. Um selo e uma faixa no topo identificam o modo. O botão "Restaurar dados de exemplo" reinicia tudo.
- **Produção**: clique no selo do topo (ou em `frontend/js/config.js` → `DEFAULT_MODE: 'api'`). O front-end passa a chamar a API em `API_URL`. Se a API estiver fora do ar, a tela mostra "Servidor não conectado" e oferece voltar à demonstração; nada fica em branco.

## O que já funciona (modo demonstração)
Login por cargo com redirecionamento e menu por permissão · Painel com indicadores, 4 gráficos e atividades · Pedidos (criar, filtrar, mudar status, cancelar, registrar pagamento, imprimir comanda e comprovante) · Cozinha (cartões por status, sincroniza com Pedidos) · Entregas (atribuir entregador, iniciar, confirmar, problema, histórico) · Cardápio (CRUD, ativar/desativar, foto) · Clientes (CRUD, histórico) · Funcionários (CRUD) · Estoque (entrada, saída, ajuste, histórico, alertas, fichas técnicas e baixa automática sem duplicar) · Fornecedores · Financeiro (receitas, despesas, boletos apenas registrados, filtros, gráficos) · Relatórios (9 tipos, CSV e PDF via impressão) · Área do cliente (cardápio, carrinho, checkout, acompanhamento).

## Limitações conhecidas
- Fotos: sem imagens reais no pacote; os pratos usam uma ilustração SVG gerada. Coloque fotos em `frontend/images/` ou envie pelo cadastro do produto.
- Boleto bancário e PIX dinâmico **não** são emitidos (dependem de integração externa); o sistema só registra.
- Senhas da demonstração ficam em texto no navegador apenas por serem fictícias. No modo produção serão guardadas com bcrypt (Etapa 3).
- Bootstrap 5 não foi usado (não foi necessário).
- Testado: carregamento de todas as telas, login, mudança de status e pedido público (Chromium automatizado, sem internet). Não testado: modo produção, responsividade em aparelhos reais, impressão.

## Próximas etapas
2) `database/db_sakura_sushi.sql` · 3) API Express + bcrypt + JWT + validação · 4) integração · 5) testes. Os contratos que o front-end já espera da API estão em `frontend/js/core.js` (objeto `Store`).
