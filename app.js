/**
 * SISTEMA RPPS - WEB APP ENGINE (V1.0 MONOLITHIC)
 * Arquivo: app.js
 * Responsabilidade: Gerenciar toda a lógica do frontend, roteamento e comunicação com a API.
 */

// ============================================================================
// 1. CONFIGURAÇÃO DA API (COLE SUA URL AQUI)
// ============================================================================

const API_URL = "https://script.google.com/macros/s/AKfycby8J-n71uaRQlBcVytqznDhHQGnl1dPbEWjBZIk4ytyQvNviDNAyX0C-SGTimedPbYYkQ/exec"; // Ex: https://script.google.com/macros/s/AKfycbx.../exec
const API_TOKEN = "TOKEN_SECRETO_RPPS_2026"; // Deve ser IGUAL ao definido no API.gs

// ============================================================================
// 2. CORE: COMUNICAÇÃO E UTILITÁRIOS
// ============================================================================

const core = {
    // Faz a chamada segura para o Google Apps Script
    api: async (action, payload = {}) => {
        core.ui.toggleLoading(true);
        try {
            // O GAS requer 'no-cors' para simples disparos ou POST padrão text/plain para evitar preflight complexo
            // A melhor prática para GAS WebApp é usar POST com text/plain (o padrão do fetch se não definir Content-Type JSON estrito)
            // e tratar o corpo como string no backend.
            
            const response = await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify({ action, payload, token: API_TOKEN })
            });

            const data = await response.json();
            core.ui.toggleLoading(false);

            if (!data.success && data.message) {
                core.ui.alert('Erro', data.message, 'erro');
                return null;
            }
            return data; // Retorna o objeto (pode ser o array direto ou {success:true, ...})

        } catch (error) {
            core.ui.toggleLoading(false);
            console.error("API Error:", error);
            core.ui.alert('Erro de Conexão', "Não foi possível comunicar com o servidor.\nVerifique sua internet ou a URL da API.", 'erro');
            return null;
        }
    },

    ui: {
        toggleLoading: (show) => {
            const el = document.getElementById('loading');
            if (el) show ? el.classList.remove('hidden') : el.classList.add('hidden');
        },
        
        alert: (titulo, mensagem, tipo = 'info') => {
            const modal = document.getElementById('sys-modal-alert');
            const backdrop = document.getElementById('sys-modal-backdrop');
            const panel = document.getElementById('sys-modal-panel');
            const elTitle = document.getElementById('sys-modal-title');
            const elDesc = document.getElementById('sys-modal-desc');
            const iconBg = document.getElementById('sys-icon-bg');
            const iconI = document.getElementById('sys-icon-i');
            const actions = document.getElementById('sys-modal-actions');

            if (!modal) return alert(mensagem); // Fallback

            elTitle.innerText = titulo;
            elDesc.innerHTML = mensagem;
            
            // Reset classes
            iconBg.className = "mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 transition-colors duration-300";
            iconI.className = "fa-solid text-lg";
            
            if (tipo === 'erro') {
                iconBg.classList.add('bg-red-100');
                iconI.classList.add('fa-triangle-exclamation', 'text-red-600');
            } else if (tipo === 'sucesso') {
                iconBg.classList.add('bg-green-100');
                iconI.classList.add('fa-check', 'text-green-600');
            } else {
                iconBg.classList.add('bg-blue-100');
                iconI.classList.add('fa-info', 'text-blue-600');
            }

            actions.innerHTML = `<button type="button" onclick="core.ui.closeAlert()" class="btn-primary w-full sm:w-auto bg-slate-800 hover:bg-slate-900">OK</button>`;
            
            modal.classList.remove('hidden');
            setTimeout(() => {
                backdrop.classList.remove('opacity-0');
                panel.classList.remove('opacity-0', 'translate-y-4', 'scale-95');
            }, 10);
        },

        confirm: (titulo, mensagem, callbackSim) => {
            core.ui.alert(titulo, mensagem, 'info'); // Reusa estrutura visual
            const actions = document.getElementById('sys-modal-actions');
            const iconBg = document.getElementById('sys-icon-bg');
            const iconI = document.getElementById('sys-icon-i');
            
            // Estilo Amarelo para Atenção
            iconBg.className = "mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10";
            iconI.className = "fa-solid fa-question text-yellow-600 text-lg";

            actions.innerHTML = '';
            
            const btnSim = document.createElement('button');
            btnSim.className = "btn-primary w-full sm:w-auto bg-blue-600 hover:bg-blue-700";
            btnSim.innerText = "Sim, Continuar";
            btnSim.onclick = () => { core.ui.closeAlert(); callbackSim(); };

            const btnNao = document.createElement('button');
            btnNao.className = "btn-secondary w-full sm:w-auto mt-2 sm:mt-0 sm:ml-2";
            btnNao.innerText = "Cancelar";
            btnNao.onclick = core.ui.closeAlert;

            actions.appendChild(btnSim);
            actions.appendChild(btnNao);
        },

        closeAlert: () => {
            const modal = document.getElementById('sys-modal-alert');
            const backdrop = document.getElementById('sys-modal-backdrop');
            const panel = document.getElementById('sys-modal-panel');
            
            backdrop.classList.add('opacity-0');
            panel.classList.add('opacity-0', 'translate-y-4', 'scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    },

    fmt: {
        money: (v) => (Number(v)||0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        moneyParse: (v) => {
            if (!v) return 0;
            if (typeof v === 'number') return v;
            let s = String(v).replace(/\u00A0/g, '').replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
            return parseFloat(s) || 0;
        },
        dateBR: (d) => {
            if (!d) return '-';
            // Se for string ISO (2025-01-01) ou Date
            const dt = new Date(d);
            // Ajuste de timezone simples (considerando que o input vem sem hora ou UTC)
            if (isNaN(dt.getTime())) return String(d); // Retorna original se falhar
            // Hack para garantir dia correto sem lib externa (timezone offset)
            const userTimezoneOffset = dt.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(dt.getTime() + userTimezoneOffset);
            return adjustedDate.toLocaleDateString('pt-BR');
        },
        comp: (c) => {
            if(!c) return '-';
            const s = String(c).replace(/'/g,"");
            const p = s.split('-');
            if(p.length === 2) return `${p[1]}/${p[0]}`;
            return s;
        }
    },

    utils: {
        applyMasks: () => {
            document.querySelectorAll('.mask-money').forEach(input => {
                input.addEventListener('input', (e) => {
                    let v = e.target.value.replace(/\D/g, "");
                    v = (Number(v) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                    e.target.value = v;
                });
            });
            // Adicionar outras máscaras (CNPJ, Tel) se necessário
        },
        initInputs: () => {
             // Seta data atual em todos os inputs de mês/ano
             const hoje = new Date().toISOString().substring(0,7); // YYYY-MM
             const ano = new Date().getFullYear();
             document.querySelectorAll('input[type="month"]').forEach(i => { if(!i.value) i.value = hoje; });
             document.querySelectorAll('select[id*="Ano"]').forEach(s => { if(!s.value) s.value = ano; });
        }
    }
};

// ============================================================================
// 3. ROTEAMENTO (SPA)
// ============================================================================

const router = {
    navigate: (pageId) => {
        // Esconde todas
        document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

        // Mostra alvo
        const target = document.getElementById(`page-${pageId}`);
        if(target) target.classList.remove('hidden');

        // Ativa menu
        const btn = document.getElementById(`btn-${pageId}`);
        if(btn) btn.classList.add('active');

        // Atualiza título
        const titles = {
            'guia-rapido': 'Início', 'dashboard': 'Visão Geral', 'recolhimento': 'Guias de Receita',
            'folha': 'Folha de Pagamento', 'imposto-renda': 'Imposto de Renda', 'prev-municipal': 'Prev. Municipal',
            'margem': 'Margem Consignável', 'consignados': 'Consignados', 'despesas': 'Despesas Adm.',
            'pagamentos': 'Financeiro', 'relatorios': 'Relatórios', 'arquivos': 'GED Digital',
            'importacao': 'Importação', 'config': 'Configurações'
        };
        document.getElementById('page-title').innerText = titles[pageId] || 'Sistema RPPS';

        // Lazy Loads
        if(pageId === 'dashboard') dashboard.carregar();
        if(pageId === 'pagamentos') financeiro.carregarPagamentos();
        if(pageId === 'config') config.carregar();
    }
};

// ============================================================================
// 4. MÓDULOS DE NEGÓCIO
// ============================================================================

// --- DASHBOARD (BI) ---
const dashboard = {
    chart: null,
    dataCache: null,
    carregar: async () => {
        const res = await core.api('buscarDadosDashboard');
        if(res) {
            dashboard.dataCache = res; // A API já devolve normalizado? Se não, normalizar aqui
            // Normalização básica de datas se necessário
            dashboard.popularFiltros();
            dashboard.atualizarGrafico();
        }
    },
    popularFiltros: () => {
        // Lógica simplificada: Assume que o backend já manda datas ISO
        // Popula select de anos baseado no cache...
    },
    atualizarGrafico: () => {
        // Renderiza Chart.js usando dashboard.dataCache
        // (Lógica completa do JS_Dashboard.html adaptada para usar variáveis locais)
        if(!dashboard.dataCache) return;
        
        const ctx = document.getElementById('chartFinanceiro');
        if(!ctx) return;
        
        // ... Lógica de renderização do gráfico ...
        // Simplificado para caber no arquivo, manter lógica visual original
        if(dashboard.chart) dashboard.chart.destroy();
        dashboard.chart = new Chart(ctx, {
            type: document.getElementById('biTipoGrafico').value,
            data: { 
                labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'], 
                datasets: [{ label: 'Série A', data: [0,0,0,0,0,0,0,0,0,0,0,0], backgroundColor: 'blue' }] 
            }
        });
    },
    mudarTipoGrafico: () => dashboard.atualizarGrafico()
};

// --- RECOLHIMENTO ---
const recolhimento = {
    switchView: (v) => {
        document.getElementById('view-recolhimento-operacional').classList.add('hidden');
        document.getElementById('view-recolhimento-gerencial').classList.add('hidden');
        if(v === 'operacional') {
            document.getElementById('view-recolhimento-operacional').classList.remove('hidden');
            recolhimento.carregarHistorico();
            recolhimento.carregarRecursos();
        } else {
            document.getElementById('view-recolhimento-gerencial').classList.remove('hidden');
            recolhimento.renderizarRelatorio();
        }
    },
    carregarRecursos: async () => {
        const list = await core.api('getRecursos');
        const sel = document.getElementById('selectRecurso');
        if(sel && list) {
            sel.innerHTML = '<option value="">Selecione...</option>';
            list.forEach(r => sel.innerHTML += `<option value="${r}">${r}</option>`);
        }
    },
    calcularTotal: () => {
        const v1 = core.fmt.moneyParse(document.getElementById('valorPatronal').value);
        const v2 = core.fmt.moneyParse(document.getElementById('valorSegurado').value);
        document.getElementById('displayTotal').innerText = core.fmt.money(v1+v2);
    },
    handleSave: async (e) => {
        e.preventDefault();
        const f = e.target;
        const dados = {
            id: document.getElementById('idGuiaEdicao').value,
            competencia: f.competencia.value,
            tipoRecurso: f.tipoRecurso.value,
            tipoGuia: f.tipoGuia.value,
            basePatronal: f.basePatronal.value,
            baseSegurado: f.baseSegurado.value,
            valorPatronal: f.valorPatronal.value,
            valorSegurado: f.valorSegurado.value,
            observacoes: f.observacoes.value
        };
        const res = await core.api('salvarRecolhimento', dados);
        if(res && res.success) {
            core.ui.alert('Sucesso', res.message, 'sucesso');
            recolhimento.cancelarEdicao();
            recolhimento.carregarHistorico();
        }
    },
    carregarHistorico: async () => {
        const lista = await core.api('buscarGuiasRecolhimento');
        const tbody = document.getElementById('listaHistoricoGuias');
        tbody.innerHTML = '';
        if(lista) {
            lista.forEach(r => {
                // Renderização da linha
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${core.fmt.comp(r[1])}</td><td>${r[4]}</td><td>${r[3]}</td><td class="text-right font-bold">${core.fmt.money(r[9])}</td><td class="text-center">${r[10]}</td><td class="text-center"><button onclick="recolhimento.prepararEdicao('${r[0]}')" class="text-blue-500"><i class="fa-solid fa-pencil"></i></button></td>`;
                tbody.appendChild(tr);
            });
        }
    },
    prepararEdicao: (id) => { /* Lógica de buscar no cache e preencher form */ },
    cancelarEdicao: () => { document.getElementById('formRecolhimento').reset(); document.getElementById('idGuiaEdicao').value=''; },
    // Adicionar renderizarRelatorio...
};

// --- FOLHA ---
const folha = {
    // Mesma estrutura: switchView, handleSave, carregarFolhas...
    // Adaptar chamadas para core.api('salvarFolha', ...)
    switchView: (v) => {
        document.getElementById('view-folha-operacional').classList.add('hidden');
        document.getElementById('view-folha-outros-bancos').classList.add('hidden');
        document.getElementById('view-folha-gerencial').classList.add('hidden');
        if(v==='operacional') {
             document.getElementById('view-folha-operacional').classList.remove('hidden');
             folha.carregarFolhas();
        } else if (v==='outros-bancos') {
             document.getElementById('view-folha-outros-bancos').classList.remove('hidden');
             folha.carregarOutrosBancos();
        } else {
             document.getElementById('view-folha-gerencial').classList.remove('hidden');
        }
    },
    calcularLiquido: () => {
        const b = core.fmt.moneyParse(document.getElementById('folhaBruto').value);
        const d = core.fmt.moneyParse(document.getElementById('folhaDescontos').value);
        document.getElementById('displayLiquido').innerText = core.fmt.money(b-d);
    },
    carregarFolhas: async () => {
        const lista = await core.api('buscarFolhas');
        const tbody = document.getElementById('listaFolhas');
        tbody.innerHTML = '';
        if(lista) {
            lista.forEach(r => {
                 const tr = document.createElement('tr');
                 tr.innerHTML = `<td>${core.fmt.comp(r[1])}</td><td>${r[3]}</td><td class="text-right">${core.fmt.money(r[4])}</td><td class="text-right text-red-500">${core.fmt.money(r[5])}</td><td class="text-right font-bold">${core.fmt.money(r[6])}</td><td class="text-center">...</td>`;
                 tbody.appendChild(tr);
            });
        }
    }
    // Implementar handleSave, carregarOutrosBancos...
};

// --- FINANCEIRO (PAGAMENTOS) ---
const financeiro = {
    carregarPagamentos: async () => {
        const tbody = document.getElementById('listaPagamentos');
        tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4">Carregando...</td></tr>';
        
        const lista = await core.api('buscarPagamentos');
        tbody.innerHTML = '';
        
        if(lista && lista.length > 0) {
            lista.forEach(item => {
                // Filtros de tela seriam aplicados aqui
                const tr = document.createElement('tr');
                tr.className = "border-b border-slate-100 hover:bg-slate-50";
                tr.innerHTML = `
                    <td class="pl-4 py-4 text-center"><input type="checkbox" value="${item.id}"></td>
                    <td class="pl-2 py-4"><span class="status-badge ${item.status === 'PAGO' ? 'status-pago' : 'status-pendente'}">${item.status}</span></td>
                    <td class="px-4 py-4 font-mono text-sm">${core.fmt.comp(item.competencia)}</td>
                    <td class="px-4 py-4">
                        <div class="font-bold text-slate-700 text-sm">${item.descricao}</div>
                        <div class="text-[10px] text-slate-500 uppercase">${item.detalhe}</div>
                    </td>
                    <td class="px-4 py-4 text-right font-mono">${core.fmt.money(item.total)}</td>
                    <td class="px-4 py-4 text-right text-emerald-600 font-mono">${core.fmt.money(item.pago)}</td>
                    <td class="px-4 py-4 text-right text-red-600 font-bold font-mono">${core.fmt.money(item.saldo)}</td>
                    <td class="pr-6 py-4 text-center">
                        ${item.status !== 'PAGO' ? 
                          `<button onclick="financeiro.abrirModal('${item.id}', '${item.total}', '${item.saldo}', '${item.descricao}')" class="btn-primary py-1 px-3 text-xs">Pagar</button>` : 
                          `<span class="text-emerald-500 text-xs"><i class="fa-solid fa-check"></i></span>`
                        }
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-gray-400">Nenhum pagamento pendente.</td></tr>';
        }
    },
    abrirModal: (id, total, saldo, nome) => {
        document.getElementById('modalIdHidden').value = id;
        document.getElementById('modalNomeGuia').innerText = nome;
        document.getElementById('modalValorTotal').innerText = core.fmt.money(total);
        document.getElementById('modalSaldoRestante').innerText = core.fmt.money(saldo);
        document.getElementById('modalValorPago').value = core.fmt.money(saldo);
        // Reseta data
        document.getElementById('modalData').valueAsDate = new Date();
        
        document.getElementById('modalPagamento').classList.remove('hidden');
    },
    closeModal: () => document.getElementById('modalPagamento').classList.add('hidden'),
    confirmarPagamento: async (e) => {
        e.preventDefault();
        const dados = {
            idGuia: document.getElementById('modalIdHidden').value,
            valorPago: document.getElementById('modalValorPago').value,
            dataPagamento: document.getElementById('modalData').value
        };
        
        core.ui.closeAlert(); // Fecha qualquer alerta anterior
        financeiro.closeModal();
        
        const res = await core.api('processarPagamento', dados);
        if(res && res.success) {
            core.ui.alert('Sucesso', 'Pagamento realizado!', 'sucesso');
            financeiro.carregarPagamentos();
        }
    }
};

// --- CONFIGURAÇÕES ---
const config = {
    carregar: async () => {
        const dados = await core.api('buscarConfiguracoes');
        if(dados) {
            const f = document.getElementById('formConfig');
            if(f) {
                f.nome.value = dados.nome || '';
                f.cnpj.value = dados.cnpj || '';
                f.endereco.value = dados.endereco || '';
                f.diretor.value = dados.diretor || '';
                f.telefone.value = dados.telefone || '';
                if(f.urlLogo) f.urlLogo.value = dados.urlLogo || '';
            }
            // Carrega listas auxiliares
            config.carregarListas();
        }
    },
    switchView: (v) => {
        document.getElementById('view-cfg-instituicao').classList.add('hidden');
        document.getElementById('view-cfg-integracoes').classList.add('hidden');
        document.getElementById('view-cfg-cadastros').classList.add('hidden');
        
        document.getElementById(`view-cfg-${v}`).classList.remove('hidden');
    },
    handleSave: async (e) => {
        e.preventDefault();
        const f = e.target;
        const dados = {
            nome: f.nome.value, cnpj: f.cnpj.value, endereco: f.endereco.value,
            diretor: f.diretor.value, telefone: f.telefone.value, urlLogo: f.urlLogo ? f.urlLogo.value : ''
        };
        const res = await core.api('salvarConfiguracoes', dados);
        if(res.success) core.ui.alert('Salvo', res.message, 'sucesso');
    },
    carregarListas: async () => {
        // Exemplo: Recursos
        const listaRec = await core.api('getRecursos');
        const ul = document.getElementById('listaRecursos');
        if(ul && listaRec) {
            ul.innerHTML = '';
            listaRec.forEach(r => ul.innerHTML += `<li class="p-2 border-b text-sm flex justify-between">${r} <button class="text-red-500"><i class="fa-solid fa-trash"></i></button></li>`);
        }
        // ... Repetir para outras listas
    }
};

// --- GED (ARQUIVOS) ---
const arquivos = {
    carregarLista: async () => {
        const lista = await core.api('buscarArquivosDigitais', { tipo: '', ano: '' });
        const tbody = document.getElementById('listaArquivosDigitais');
        tbody.innerHTML = '';
        if(lista) {
            lista.forEach(r => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-cyan-50/20 border-b transition arq-row";
                tr.innerHTML = `
                    <td class="pl-6 py-4 text-xs font-mono text-slate-500">${core.fmt.dateBR(r[1])}</td>
                    <td class="px-4 py-4"><span class="bg-cyan-50 text-cyan-700 px-2 py-1 rounded text-xs font-bold">${r[2]}</span></td>
                    <td class="px-4 py-4">
                        <div class="font-bold text-slate-700 text-sm search-target">${r[2]} ${r[4]||''} / ${r[3]}</div>
                        <div class="text-xs text-slate-500 line-clamp-1 search-target">${r[5]}</div>
                    </td>
                    <td class="pr-6 py-4 text-center">
                        <a href="${r[7]}" target="_blank" class="text-blue-500 mx-1"><i class="fa-solid fa-eye"></i></a>
                        <button onclick="arquivos.excluir('${r[0]}', '${r[9]}')" class="text-red-500 mx-1"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            document.getElementById('contadorArquivos').innerText = `${lista.length} arquivos`;
        }
    },
    handleUpload: async (e) => {
        e.preventDefault();
        const f = e.target;
        const fileInput = document.getElementById('fileInput');
        if(!fileInput.files.length) return core.ui.alert('Erro', 'Selecione um arquivo.', 'erro');
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = async function(evt) {
            const payload = {
                tipo: f.tipo.value, ano: f.ano.value, numero: f.numero.value, descricao: f.descricao.value,
                fileName: file.name, mimeType: file.type, fileData: evt.target.result
            };
            const res = await core.api('uploadArquivoDigital', payload);
            if(res.success) {
                core.ui.alert('Sucesso', 'Arquivo enviado!', 'sucesso');
                arquivos.switchView('lista');
            }
        };
        reader.readAsDataURL(file);
    },
    switchView: (v) => {
        document.getElementById('view-arq-upload').classList.add('hidden');
        document.getElementById('view-arq-lista').classList.add('hidden');
        if(v === 'upload') {
            document.getElementById('view-arq-upload').classList.remove('hidden');
            // Carregar tipos no select...
        } else {
            document.getElementById('view-arq-lista').classList.remove('hidden');
            arquivos.carregarLista();
        }
    },
    excluir: (idReg, idDrive) => {
        core.ui.confirm('Excluir', 'Deseja apagar este arquivo?', async () => {
             const res = await core.api('excluirArquivoDigital', { idReg, idDrive });
             if(res.success) arquivos.carregarLista();
        });
    },
    mostrarNome: (input) => {
        if(input.files[0]) document.getElementById('fileNameDisplay').innerText = input.files[0].name;
    },
    filtrarLocalmente: () => {
        const termo = document.getElementById('filtroArqBusca').value.toLowerCase();
        document.querySelectorAll('.arq-row').forEach(row => {
            if(row.innerText.toLowerCase().includes(termo)) row.classList.remove('hidden');
            else row.classList.add('hidden');
        });
    }
};

// Outros módulos (Imposto Renda, Previdência, Margem, Despesas, Importação)
// Seguem o mesmo padrão: Objeto encapsulado com métodos switchView, carregar, salvar.
// ... (Para brevidade, replique a lógica dos arquivos JS individuais anteriores usando core.api)

const irrf = { switchView: (v) => { /* ... */ }, handleSave: async (e) => { /* ... */ }, carregarHistorico: async () => { /* ... */ } };
const previdencia = { switchView: (v) => { /* ... */ }, handleSave: async (e) => { /* ... */ }, carregarHistorico: async () => { /* ... */ } };
const margem = { switchView: (v) => { /* ... */ }, handleSalvarCalculo: async (e) => { /* ... */ }, buscarPessoaInput: (i) => { /* ... */ } };
const consignados = { switchView: (v) => { /* ... */ }, handleSave: async (e) => { /* ... */ }, carregarHistorico: async () => { /* ... */ } };
const despesas = { switchView: (v) => { /* ... */ }, handleSave: async (e) => { /* ... */ }, carregarHistorico: async () => { /* ... */ } };
const importacao = { executar: async () => { /* ... */ } };
const relatorios = { ajustarFiltros: () => { /* ... */ }, gerar: async () => { /* ... */ }, imprimir: () => window.print() };


// ============================================================================
// 5. INICIALIZAÇÃO
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    core.utils.applyMasks();
    core.utils.initInputs();
    
    // Dados da Sidebar
    core.api('buscarConfiguracoes').then(cfg => {
        if(cfg) {
            document.getElementById('sidebar-institution-name').innerText = cfg.nome;
            document.getElementById('sidebar-cnpj').innerText = cfg.cnpj;
            if(cfg.urlLogo) {
                document.getElementById('sidebar-logo').src = cfg.urlLogo;
                document.getElementById('sidebar-logo').classList.remove('hidden');
                document.getElementById('sidebar-logo-placeholder').classList.add('hidden');
            }
        }
    });

    // Inicia na Home
    router.navigate('guia-rapido');
    
    // Data na Home
    const now = new Date();
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dataStr = now.toLocaleDateString('pt-BR', opts);
    const dataFinal = dataStr.charAt(0).toUpperCase() + dataStr.slice(1);
    const elData = document.getElementById('dataExtensoGuia');
    if(elData) elData.innerText = dataFinal;
});