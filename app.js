/**
 * SISTEMA RPPS - WEB APP ENGINE (V1.2 FINAL INTEGRATED)
 * Arquivo: app.js
 * Responsabilidade: Gerir toda a lógica do frontend, roteamento e comunicação com a API.
 */

// ============================================================================
// 1. CONFIGURAÇÃO DA API
// ============================================================================

// URL do seu Web App do Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbzcFEuN4Tjb_EvvkXJlLZsrpoPDA22rrSk6CiZBvslCUAdMrLL3BNcs6BRxDiGkKCm9Vw/exec"; 
const API_TOKEN = "TOKEN_SECRETO_RPPS_2026"; 

// ============================================================================
// 2. CORE: COMUNICAÇÃO E UTILITÁRIOS
// ============================================================================

const core = {
    // Faz a chamada segura para o Google Apps Script via API
    api: async (action, payload = {}) => {
        core.ui.toggleLoading(true);
        try {
            // Usa 'text/plain' para evitar o preflight OPTIONS que o Google bloqueia (CORS hack padrão para GAS)
            const response = await fetch(API_URL, {
                method: "POST",
                redirect: "follow",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({ action, payload, token: API_TOKEN })
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            core.ui.toggleLoading(false);

            if (!data) return null;

            // Se o backend retornar erro explícito
            if (data.success === false) { 
                core.ui.alert('Atenção', data.message || "Erro desconhecido no servidor.", 'erro');
                return null;
            }
            
            return data; 

        } catch (error) {
            core.ui.toggleLoading(false);
            console.error("API Error Detalhado:", error);
            core.ui.alert('Erro de Conexão', "Não foi possível comunicar com o servidor.\n\nVerifique:\n1. Se a URL da API está correta e implantada.\n2. Se sua internet está ativa.", 'erro');
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
            
            if (!modal) return alert(mensagem); // Fallback

            document.getElementById('sys-modal-title').innerText = titulo;
            document.getElementById('sys-modal-desc').innerHTML = mensagem;
            
            const iconBg = document.getElementById('sys-icon-bg');
            const iconI = document.getElementById('sys-icon-i');
            
            // Reset visual
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

            const actions = document.getElementById('sys-modal-actions');
            actions.innerHTML = `<button type="button" onclick="core.ui.closeAlert()" class="btn-primary w-full sm:w-auto bg-slate-800 hover:bg-slate-900">OK</button>`;
            
            modal.classList.remove('hidden');
            setTimeout(() => {
                backdrop.classList.remove('opacity-0');
                panel.classList.remove('opacity-0', 'translate-y-4', 'scale-95');
            }, 10);
        },

        confirm: (titulo, mensagem, callbackSim) => {
            core.ui.alert(titulo, mensagem, 'info'); 
            
            const iconBg = document.getElementById('sys-icon-bg');
            const iconI = document.getElementById('sys-icon-i');
            iconBg.className = "mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10";
            iconI.className = "fa-solid fa-question text-yellow-600 text-lg";

            const actions = document.getElementById('sys-modal-actions');
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
        round: (v) => Math.round(v * 100) / 100,
        dateBR: (d) => {
            if (!d) return '-';
            const dt = new Date(d);
            if (isNaN(dt.getTime())) return String(d).substring(0, 10);
            const userTimezoneOffset = dt.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(dt.getTime() + userTimezoneOffset);
            return adjustedDate.toLocaleDateString('pt-BR');
        },
        comp: (c) => {
            if(!c) return '-';
            const s = String(c).replace(/'/g,"");
            const p = s.split('-');
            if(p.length === 2) return `${p[1]}/${p[0]}`; // YYYY-MM -> MM/YYYY
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
            
            const cnpjInput = document.querySelector('.mask-cnpj');
            if (cnpjInput) {
                cnpjInput.addEventListener('input', (e) => {
                    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})/);
                    e.target.value = !x[2] ? x[1] : x[1] + '.' + x[2] + '.' + x[3] + '/' + x[4] + (x[5] ? '-' + x[5] : '');
                });
            }
            
            const telInput = document.querySelector('.mask-tel');
            if (telInput) {
                telInput.addEventListener('input', (e) => {
                    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
                    e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
                });
            }
        },
        initInputs: () => {
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
        document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

        const target = document.getElementById(`page-${pageId}`);
        if(target) target.classList.remove('hidden');

        const btn = document.getElementById(`btn-${pageId}`);
        if(btn) btn.classList.add('active');

        const titles = {
            'guia-rapido': 'Início', 'dashboard': 'Visão Geral', 'recolhimento': 'Guias de Receita',
            'folha': 'Folha de Pagamento', 'imposto-renda': 'Imposto de Renda', 'prev-municipal': 'Prev. Municipal',
            'margem': 'Margem Consignável', 'consignados': 'Consignados', 'despesas': 'Despesas Adm.',
            'pagamentos': 'Financeiro', 'relatorios': 'Relatórios', 'arquivos': 'GED Digital',
            'importacao': 'Importação', 'config': 'Configurações'
        };
        const titleEl = document.getElementById('page-title');
        if(titleEl) titleEl.innerText = titles[pageId] || 'Sistema RPPS';

        // Lazy Loads
        if(pageId === 'dashboard') dashboard.carregar();
        if(pageId === 'pagamentos') financeiro.carregarPagamentos();
        if(pageId === 'config') config.carregar();
        // Carrega cabeçalho de relatório
        if(pageId === 'relatorios') relatorios.carregarCabecalho();
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
            dashboard.dataCache = res; 
            dashboard.popularFiltros();
            dashboard.atualizarGrafico();
        }
    },
    popularFiltros: () => {
        const anosSet = new Set();
        anosSet.add(new Date().getFullYear());
        const listas = [...(dashboard.dataCache.folhas||[]), ...(dashboard.dataCache.guias||[]), ...(dashboard.dataCache.despesas||[])];
        listas.forEach(item => {
            if (item.competencia && item.competencia.length >= 4) {
                anosSet.add(parseInt(item.competencia.substring(0, 4)));
            }
        });
        const select = document.getElementById('biAno');
        if(select) {
            const atual = select.value;
            select.innerHTML = '';
            Array.from(anosSet).sort((a,b)=>b-a).forEach(ano => {
                select.innerHTML += `<option value="${ano}">${ano}</option>`;
            });
            if(atual) select.value = atual;
        }
    },
    processarSerie: (tipo, anoFiltro) => {
        const meses = Array(12).fill(0);
        if (tipo === 'nenhum' || !dashboard.dataCache) return meses;
        
        const somar = (comp, val) => {
            if(!comp) return;
            const partes = comp.split('-');
            if(partes.length < 2) return;
            if(String(partes[0]) === String(anoFiltro)) {
                const idx = parseInt(partes[1]) - 1;
                if(idx >= 0 && idx <= 11) meses[idx] += (Number(val) || 0);
            }
        };

        const dados = dashboard.dataCache;
        if(tipo === 'folha_bruto') dados.folhas.forEach(f => somar(f.competencia, f.bruto));
        if(tipo === 'guias_total') dados.guias.forEach(g => somar(g.competencia, g.total));
        if(tipo === 'despesas_total') dados.despesas.forEach(d => somar(d.competencia, d.total));
        if(tipo === 'pagamentos_total') {
            dados.guias.forEach(g => { if(g.status === 'PAGO') somar(g.competencia, g.total); });
            dados.despesas.forEach(d => { if(d.status === 'PAGO') somar(d.competencia, d.total); });
        }
        return meses.map(core.fmt.round);
    },
    atualizarGrafico: () => {
        if(!dashboard.dataCache) return;
        const ctx = document.getElementById('chartFinanceiro');
        if(!ctx) return;

        const ano = document.getElementById('biAno').value;
        const tipoA = document.getElementById('biSerieA').value;
        const tipoB = document.getElementById('biSerieB').value;
        const tipoGraf = document.getElementById('biTipoGrafico').value;

        const dadosA = dashboard.processarSerie(tipoA, ano);
        const dadosB = dashboard.processarSerie(tipoB, ano);
        
        const totalA = dadosA.reduce((a,b)=>a+b, 0);
        const totalB = dadosB.reduce((a,b)=>a+b, 0);
        
        document.getElementById('valTotalA').innerText = core.fmt.money(totalA);
        document.getElementById('valTotalB').innerText = core.fmt.money(totalB);
        document.getElementById('valDiferenca').innerText = core.fmt.money(totalA - totalB);

        // Labels dinâmicas
        const elA = document.getElementById('biSerieA');
        const labelA = elA.options[elA.selectedIndex].text;
        document.getElementById('labelTotalA').innerText = "Total " + labelA;
        
        if(dashboard.chart) dashboard.chart.destroy();
        dashboard.chart = new Chart(ctx, {
            type: tipoGraf,
            data: { 
                labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'], 
                datasets: [
                    { label: labelA, data: dadosA, backgroundColor: 'rgba(37, 99, 235, 0.7)', borderColor: 'blue', borderWidth: 1, fill: tipoGraf==='line' },
                    { label: document.getElementById('biSerieB').options[document.getElementById('biSerieB').selectedIndex].text, data: dadosB, backgroundColor: 'rgba(249, 115, 22, 0.7)', borderColor: 'orange', borderWidth: 1, hidden: tipoB === 'nenhum' }
                ] 
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: {position:'bottom'} } }
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
        core.ui.confirm('Confirmar', 'Deseja salvar esta guia?', async () => {
            const dados = {
                id: document.getElementById('idGuiaEdicao').value,
                competencia: f.competencia.value, tipoRecurso: f.tipoRecurso.value, tipoGuia: f.tipoGuia.value,
                basePatronal: f.basePatronal.value, baseSegurado: f.baseSegurado.value,
                valorPatronal: f.valorPatronal.value, valorSegurado: f.valorSegurado.value, observacoes: f.observacoes.value
            };
            const res = await core.api('salvarRecolhimento', dados);
            if(res && res.success) {
                core.ui.alert('Sucesso', res.message, 'sucesso');
                recolhimento.cancelarEdicao();
                recolhimento.carregarHistorico();
            }
        });
    },
    carregarHistorico: async () => {
        const tbody = document.getElementById('listaHistoricoGuias');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Carregando...</td></tr>';
        const lista = await core.api('buscarGuiasRecolhimento');
        tbody.innerHTML = '';
        let total = 0;
        if(lista && lista.length) {
            lista.forEach(r => {
                total += core.fmt.moneyParse(r[9]);
                const tr = document.createElement('tr');
                tr.innerHTML = `<td class="pl-6 py-3">${core.fmt.comp(r[1])}</td><td class="px-4 py-3">${r[4]}</td><td class="px-4 py-3">${r[3]}</td><td class="px-4 py-3 text-right font-bold">${core.fmt.money(r[9])}</td><td class="px-4 py-3 text-center">${r[10]}</td><td class="pr-6 py-3 text-center"><button onclick="recolhimento.prepararEdicao('${r[0]}','${r[1]}','${r[3]}','${r[4]}','${r[5]}','${r[6]}','${r[7]}','${r[8]}','${r[13]}')" class="text-blue-500 mx-1"><i class="fa-solid fa-pencil"></i></button></td>`;
                tbody.appendChild(tr);
            });
            document.getElementById('totalCompetenciaGuia').innerText = core.fmt.money(total);
        } else { tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Nada encontrado.</td></tr>'; }
    },
    prepararEdicao: (id, comp, rec, tipo, bP, bS, vP, vS, obs) => {
        document.getElementById('idGuiaEdicao').value = id;
        document.getElementById('inputCompetenciaGuia').value = String(comp).replace(/'/g,'');
        document.getElementById('selectRecurso').value = rec;
        document.getElementById('basePatronal').value = core.fmt.money(bP);
        document.getElementById('baseSegurado').value = core.fmt.money(bS);
        document.getElementById('valorPatronal').value = core.fmt.money(vP);
        document.getElementById('valorSegurado').value = core.fmt.money(vS);
        document.querySelector('#formRecolhimento select[name="tipoGuia"]').value = tipo;
        document.querySelector('#formRecolhimento textarea').value = obs;
        recolhimento.calcularTotal();
        document.getElementById('btnSalvarGuia').innerText = "Atualizar";
        document.getElementById('btnCancelGuia').classList.remove('hidden');
    },
    cancelarEdicao: () => { 
        document.getElementById('formRecolhimento').reset(); 
        document.getElementById('idGuiaEdicao').value=''; 
        document.getElementById('btnSalvarGuia').innerHTML = '<i class="fa-solid fa-check mr-2"></i> Lançar Guia';
        document.getElementById('btnCancelGuia').classList.add('hidden');
    },
    limparFiltro: () => { document.getElementById('filtroHistoricoGuia').value = ''; recolhimento.carregarHistorico(); },
    renderizarRelatorio: () => { /* Logica de matriz no backend 'gerarRelatorioAvancado' */ }
};

// --- FOLHA ---
const folha = {
    switchView: (v) => {
        document.getElementById('view-folha-operacional').classList.toggle('hidden', v!=='operacional');
        document.getElementById('view-folha-outros-bancos').classList.toggle('hidden', v!=='outros-bancos');
        document.getElementById('view-folha-gerencial').classList.toggle('hidden', v!=='gerencial');
        if(v==='operacional') { folha.carregarNomes(); folha.carregarFolhas(); }
        else if(v==='outros-bancos') { folha.carregarOutrosBancos(); }
    },
    carregarNomes: async () => {
        const list = await core.api('getNomesFolha');
        const sel = document.getElementById('selectTipoFolha');
        if(sel && list) {
            sel.innerHTML = '<option value="">Selecione...</option>';
            list.forEach(r => sel.innerHTML += `<option value="${r}">${r}</option>`);
        }
    },
    calcularLiquido: () => {
        const b = core.fmt.moneyParse(document.getElementById('folhaBruto').value);
        const d = core.fmt.moneyParse(document.getElementById('folhaDescontos').value);
        document.getElementById('displayLiquido').innerText = core.fmt.money(b-d);
    },
    handleSave: async (e) => {
        e.preventDefault();
        const f = e.target;
        core.ui.confirm('Confirmar', 'Salvar folha?', async () => {
             const dados = {
                 id: document.getElementById('idFolhaEdicao').value,
                 competencia: f.competencia.value, tipoFolha: f.tipoFolha.value,
                 valorBruto: f.valorBruto.value, valorDescontos: f.valorDescontos.value, observacoes: f.observacoes.value
             };
             const res = await core.api('salvarFolha', dados);
             if(res && res.success) { core.ui.alert('Sucesso', res.message, 'sucesso'); folha.cancelarEdicao(); folha.carregarFolhas(); }
        });
    },
    carregarFolhas: async () => {
        const tbody = document.getElementById('listaFolhas');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Carregando...</td></tr>';
        const lista = await core.api('buscarFolhas');
        tbody.innerHTML = '';
        if(lista) {
            lista.forEach(r => {
                 const tr = document.createElement('tr');
                 tr.innerHTML = `<td>${core.fmt.comp(r[1])}</td><td>${r[3]}</td><td class="text-right">${core.fmt.money(r[4])}</td><td class="text-right text-red-500">${core.fmt.money(r[5])}</td><td class="text-right font-bold">${core.fmt.money(r[6])}</td><td class="text-center"><button onclick="folha.prepararEdicao('${r[0]}','${r[1]}','${r[3]}','${r[4]}','${r[5]}','${r[7]}')" class="text-amber-500"><i class="fa-solid fa-pencil"></i></button></td></tr>`;
                 tbody.appendChild(tr);
            });
        } else { tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Nada encontrado.</td></tr>'; }
    },
    prepararEdicao: (id, comp, tipo, b, d, obs) => {
        document.getElementById('idFolhaEdicao').value = id;
        document.getElementById('inputCompetenciaFolha').value = String(comp).replace(/'/g,'');
        document.getElementById('selectTipoFolha').value = tipo;
        document.getElementById('folhaBruto').value = core.fmt.money(b);
        document.getElementById('folhaDescontos').value = core.fmt.money(d);
        document.getElementById('inputObsFolha').value = obs;
        folha.calcularLiquido();
        document.getElementById('btnSalvarFolha').innerText = "Atualizar";
        document.getElementById('btnCancelFolha').classList.remove('hidden');
    },
    cancelarEdicao: () => {
        document.getElementById('formFolha').reset();
        document.getElementById('idFolhaEdicao').value='';
        document.getElementById('btnSalvarFolha').innerHTML = '<i class="fa-solid fa-check mr-2"></i> Salvar';
        document.getElementById('btnCancelFolha').classList.add('hidden');
    },
    limparFiltro: () => { document.getElementById('filtroHistoricoFolha').value=''; folha.carregarFolhas(); },
    
    // Outros Bancos
    buscarServidor: (input) => {
        const termo = input.value;
        if(termo.length < 3) return;
        core.api('buscarTodosServidores').then(lista => {
             const div = document.getElementById('listaSugestoesOB');
             div.innerHTML = '';
             div.style.display = 'block';
             lista.filter(s => s[1].toLowerCase().includes(termo.toLowerCase())).forEach(s => {
                 div.innerHTML += `<div class="autocomplete-item" onclick="folha.selServidor('${s[0]}','${s[1]}','${s[2]}')">${s[1]}</div>`;
             });
        });
    },
    selServidor: (id, nome, cpf) => {
        document.getElementById('idServidorOB').value = id;
        document.getElementById('nomeServidorOB').value = nome;
        document.getElementById('cpfServidorOB').value = cpf;
        document.getElementById('buscaServidorOB').value = nome;
        document.getElementById('listaSugestoesOB').style.display = 'none';
        document.getElementById('detalhesServidorOB').classList.remove('hidden');
        document.getElementById('lblNomeOB').innerText = nome;
        document.getElementById('lblCpfOB').innerText = cpf;
    },
    handleSaveOutrosBancos: async (e) => {
        e.preventDefault();
        const dados = {
            id: document.getElementById('idRemessaEdicao').value,
            competencia: document.getElementById('filtroCompOutrosBancos').value,
            idServidor: document.getElementById('idServidorOB').value,
            nomeServidor: document.getElementById('nomeServidorOB').value,
            cpf: document.getElementById('cpfServidorOB').value,
            banco: document.getElementById('selectBancoOB').value,
            valor: document.getElementById('valorOB').value,
            observacoes: document.getElementById('obsOB').value
        };
        const res = await core.api('salvarRemessaOutroBanco', dados);
        if(res.success) { core.ui.alert('Sucesso', res.message, 'sucesso'); folha.carregarOutrosBancos(); folha.cancelarEdicaoOB(); }
    },
    carregarOutrosBancos: async () => {
        const comp = document.getElementById('filtroCompOutrosBancos').value;
        if(!comp) return;
        const lista = await core.api('buscarRemessasOutrosBancos', comp);
        const tbody = document.getElementById('listaOutrosBancos');
        tbody.innerHTML = '';
        if(lista) {
            document.getElementById('contadorRemessas').innerText = `${lista.length} registros`;
            lista.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${r[4]}<br><span class="text-xs">${r[5]}</span></td><td>${r[6]}</td><td class="text-right">${core.fmt.money(r[7])}</td><td class="text-center"><button onclick="folha.prepEdicaoOB('${r[0]}','${r[3]}','${r[4]}','${r[5]}','${r[6]}','${r[7]}','${r[8]}')" class="text-blue-500"><i class="fa-solid fa-pencil"></i></button></td>`;
                tbody.appendChild(tr);
            });
        }
    },
    prepEdicaoOB: (id, idS, nome, cpf, banco, valor, obs) => {
        folha.selServidor(idS, nome, cpf);
        document.getElementById('idRemessaEdicao').value = id;
        document.getElementById('selectBancoOB').value = banco;
        document.getElementById('valorOB').value = core.fmt.money(valor);
        document.getElementById('obsOB').value = obs;
        document.getElementById('btnSalvarOB').innerText = "Atualizar";
        document.getElementById('btnCancelOB').classList.remove('hidden');
    },
    cancelarEdicaoOB: () => {
        document.getElementById('formOutrosBancos').reset();
        document.getElementById('idRemessaEdicao').value = '';
        document.getElementById('detalhesServidorOB').classList.add('hidden');
        document.getElementById('btnSalvarOB').innerHTML = '<i class="fa-solid fa-plus"></i> Adicionar';
        document.getElementById('btnCancelOB').classList.add('hidden');
    }
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
                const tr = document.createElement('tr');
                tr.className = "border-b border-slate-100 hover:bg-slate-50";
                tr.innerHTML = `
                    <td class="pl-4 py-4 text-center"><input type="checkbox" name="selecaoLote" value="${item.id}" onchange="financeiro.atualizarLote()"></td>
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
        // Carrega historico
        core.api('buscarHistoricoPagamentos', id).then(h => {
             const tb = document.getElementById('historicoPagamentosBody');
             tb.innerHTML = '';
             if(h) h.forEach(p => tb.innerHTML += `<tr><td>${core.fmt.dateBR(p.data)}</td><td class="text-right">${core.fmt.money(p.valor)}</td></tr>`);
        });
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
    },
    toggleSelecionarTodos: (el) => {
        document.querySelectorAll('input[name="selecaoLote"]').forEach(cb => cb.checked = el.checked);
        financeiro.atualizarLote();
    },
    atualizarLote: () => {
         const count = document.querySelectorAll('input[name="selecaoLote"]:checked').length;
         const bar = document.getElementById('barraAcaoLote');
         if(bar) {
             if(count > 0) { bar.classList.remove('hidden'); bar.classList.add('flex'); document.getElementById('contadorSelecao').innerText = count; }
             else { bar.classList.add('hidden'); bar.classList.remove('flex'); }
         }
    },
    confirmarPagamentoLote: () => {
         const ids = Array.from(document.querySelectorAll('input[name="selecaoLote"]:checked')).map(cb => cb.value);
         core.ui.confirm('Lote', `Pagar ${ids.length} itens?`, async () => {
              const res = await core.api('processarPagamentoEmLote', ids);
              if(res.success) { core.ui.alert('Sucesso', res.message, 'sucesso'); financeiro.carregarPagamentos(); }
         });
    },
    switchView: (v) => {
        document.getElementById('view-pag-pendentes').classList.toggle('hidden', v!=='pendentes');
        document.getElementById('view-pag-realizados').classList.toggle('hidden', v!=='realizados');
        if(v === 'pendentes') {
            financeiro.carregarPagamentos();
        } else {
            financeiro.carregarHistoricoGeral();
        }
    },
    carregarHistoricoGeral: async () => {
        const tbody = document.getElementById('listaHistoricoGeral');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Carregando...</td></tr>';
        const lista = await core.api('buscarHistoricoGeral', document.getElementById('filtroAnoHistorico').value);
        tbody.innerHTML = '';
        if(lista && lista.length) {
            lista.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${core.fmt.dateBR(p.data)}</td><td>${p.descricao}</td><td class="text-right">${core.fmt.money(p.valor)}</td><td>${p.usuario}</td><td><button onclick="financeiro.estornar('${p.idPagamento}')" class="text-red-500"><i class="fa-solid fa-trash"></i></button></td></tr>`;
                tbody.appendChild(tr);
            });
        } else { tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Nada encontrado.</td></tr>'; }
    },
    estornar: (id) => {
        core.ui.confirm('Estornar', 'Cancelar este pagamento?', async () => {
             const res = await core.api('excluirPagamentoRealizado', id);
             if(res.success) financeiro.carregarHistoricoGeral();
        });
    }
};

// --- CONFIGURAÇÕES ---
const config = {
    carregar: async () => {
        const d = await core.api('buscarConfiguracoes');
        if(d) {
            const f = document.getElementById('formConfig');
            if(f) { f.nome.value=d.nome||''; f.cnpj.value=d.cnpj||''; f.endereco.value=d.endereco||''; f.diretor.value=d.diretor||''; f.telefone.value=d.telefone||''; if(d.urlLogo)f.urlLogo.value=d.urlLogo; }
            config.carregarListas();
        }
    },
    switchView: (v) => {
        ['instituicao','integracoes','cadastros'].forEach(id => document.getElementById(`view-cfg-${id}`).classList.add('hidden'));
        document.getElementById(`view-cfg-${v}`).classList.remove('hidden');
    },
    handleSave: async (e) => {
        e.preventDefault(); const f=e.target;
        const d={nome:f.nome.value, cnpj:f.cnpj.value, endereco:f.endereco.value, diretor:f.diretor.value, telefone:f.telefone.value, urlLogo:f.urlLogo?f.urlLogo.value:'', idTemplateMargem:f.idTemplateMargem?f.idTemplateMargem.value:'', idPastaArquivos:f.idPastaArquivos?f.idPastaArquivos.value:''};
        if((await core.api('salvarConfiguracoes',d))?.success) core.ui.alert('Ok','Salvo','sucesso');
    },
    carregarListas: async () => {
        const load = async (act, elId, tipo) => {
            const l = await core.api(act); const ul = document.getElementById(elId);
            if(ul) { ul.innerHTML=''; (l||[]).forEach(r=>ul.innerHTML+=`<li class="p-2 border-b text-sm flex justify-between">${r} <button onclick="config.removerItem('${tipo}','${r}')" class="text-red-500"><i class="fa-solid fa-trash"></i></button></li>`); }
        };
        load('getRecursos','listaRecursos','Recurso'); load('getNomesFolha','listaNomesFolha','NomeFolha');
        load('getOrigensIR','listaOrigensIR','OrigemIR'); load('getOrigensPrev','listaOrigensPrev','OrigemPrev');
        load('getBancosConsig','listaBancosConsig','BancoConsig'); load('getTiposArquivo','listaTiposArquivo','TipoArquivo');
    },
    removerItem: (t, v) => core.ui.confirm('Del',`Apagar ${v}?`,async()=>{ await core.api(`remove${t}`,v); config.carregarListas(); }),
    criarModelo: async () => { if((await core.api('criarTemplatePadrao'))?.success) core.ui.alert('Ok','Criado!','sucesso'); },
    criarPasta: async () => { if((await core.api('criarPastaSistema'))?.success) core.ui.alert('Ok','Criada!','sucesso'); }
};

// Funções de Adicionar (Botões da tela Config)
recolhimento.addRecurso = async () => { const i=document.getElementById('novoRecurso'); if(i.value){ await core.api('addRecurso',i.value); i.value=''; config.carregarListas(); }};
folha.addNomeFolha = async () => { const i=document.getElementById('novoNomeFolha'); if(i.value){ await core.api('addNomeFolha',i.value); i.value=''; config.carregarListas(); }};
const irrf = {
    switchView: (v) => {
        document.getElementById('view-ir-operacional').classList.toggle('hidden', v!=='operacional');
        document.getElementById('view-ir-gerencial').classList.toggle('hidden', v!=='gerencial');
        if(v==='operacional') { irrf.carregarHistorico(); irrf.carregarOrigens(); } else { irrf.renderizarRelatorio(); }
    },
    carregarOrigens: async () => { const l=await core.api('getOrigensIR'); const s=document.getElementById('selectOrigemIR'); if(s&&l){s.innerHTML='<option value="">Selecione...</option>'; l.forEach(r=>s.innerHTML+=`<option value="${r}">${r}</option>`);} },
    addOrigemIR: async () => { const i=document.getElementById('novaOrigemIR'); if(i.value){ await core.api('addOrigemIR',i.value); i.value=''; config.carregarListas(); } },
    handleSave: (e) => { e.preventDefault(); core.ui.confirm('Salvar','Lançar IR?',async()=>{ const f=e.target; const d={id:document.getElementById('idIRRFEdicao').value, competencia:f.competencia.value, tipoIR:f.tipoIR.value, origem:f.origem.value, valorRetido:f.valorRetido.value, dataRepasse:f.dataRepasse.value, observacoes:f.observacoes.value}; if((await core.api('salvarImpostoRenda',d))?.success){core.ui.alert('Ok','Salvo','sucesso'); irrf.cancelarEdicao(); irrf.carregarHistorico();} }); },
    carregarHistorico: async () => { const tb=document.getElementById('listaHistoricoIR'); const l=await core.api('buscarImpostoRenda'); tb.innerHTML=''; if(l) l.forEach(r=>tb.innerHTML+=`<tr><td class="pl-6">${core.fmt.comp(r[1])}</td><td>${r[3]}</td><td>${r[4]}</td><td class="text-right font-bold text-pink-700">${core.fmt.money(r[5])}</td><td class="text-center">${r[6]?core.fmt.dateBR(r[6]):'-'}</td><td class="text-center"><button onclick="irrf.prepararEdicao('${r[0]}','${r[1]}','${r[3]}','${r[4]}','${r[5]}','${r[6]}','${r[7]}')" class="text-amber-500"><i class="fa-solid fa-pencil"></i></button></td></tr>`); },
    prepararEdicao: (id,c,o,t,v,d,obs) => { document.getElementById('idIRRFEdicao').value=id; document.getElementById('inputCompetenciaIR').value=c.replace(/'/g,''); document.getElementById('selectOrigemIR').value=o; document.getElementById('selectTipoIR').value=t; document.getElementById('valorRetido').value=core.fmt.money(v); document.getElementById('inputDataRepasse').value=d; document.getElementById('inputObsIR').value=obs; document.getElementById('btnSalvarIR').innerText="Atualizar"; document.getElementById('btnCancelIR').classList.remove('hidden'); },
    cancelarEdicao: () => { document.getElementById('formIR').reset(); document.getElementById('idIRRFEdicao').value=''; document.getElementById('btnSalvarIR').innerText='Lançar'; document.getElementById('btnCancelIR').classList.add('hidden'); },
    limparFiltro: () => { document.getElementById('filtroHistoricoIR').value=''; irrf.carregarHistorico(); }, renderizarRelatorio: () => {}
};

const previdencia = {
    switchView: (v) => { document.getElementById('view-prev-operacional').classList.toggle('hidden', v!=='operacional'); document.getElementById('view-prev-gerencial').classList.toggle('hidden', v!=='gerencial'); if(v==='operacional') { previdencia.carregarHistorico(); previdencia.carregarOrigens(); } },
    carregarOrigens: async () => { const l=await core.api('getOrigensPrev'); const s=document.getElementById('selectOrigemPrev'); if(s&&l){s.innerHTML='<option value="">Selecione...</option>'; l.forEach(r=>s.innerHTML+=`<option value="${r}">${r}</option>`);} },
    addOrigemPrev: async () => { const i=document.getElementById('novaOrigemPrev'); if(i.value){ await core.api('addOrigemPrev',i.value); i.value=''; config.carregarListas(); } },
    handleSave: (e) => { e.preventDefault(); core.ui.confirm('Salvar','Lançar?',async()=>{ const f=e.target; const d={id:document.getElementById('idPrevEdicao').value, competencia:f.competencia.value, origem:f.origem.value, valor:f.valor.value, dataRepasse:f.dataRepasse.value, observacoes:f.observacoes.value}; if((await core.api('salvarPrevidencia',d))?.success){core.ui.alert('Ok','Salvo','sucesso'); previdencia.cancelarEdicao(); previdencia.carregarHistorico();} }); },
    carregarHistorico: async () => { const tb=document.getElementById('listaHistoricoPrev'); const l=await core.api('buscarPrevidencia'); tb.innerHTML=''; if(l) l.forEach(r=>tb.innerHTML+=`<tr><td class="pl-6">${core.fmt.comp(r[1])}</td><td>${r[3]}</td><td class="text-right font-bold text-purple-700">${core.fmt.money(r[4])}</td><td class="text-center">${r[5]?core.fmt.dateBR(r[5]):'-'}</td><td class="text-center"><button onclick="previdencia.prepararEdicao('${r[0]}','${r[1]}','${r[3]}','${r[4]}','${r[5]}','${r[6]}')" class="text-amber-500"><i class="fa-solid fa-pencil"></i></button></td></tr>`); },
    prepararEdicao: (id,c,o,v,d,obs) => { document.getElementById('idPrevEdicao').value=id; document.getElementById('inputCompetenciaPrev').value=c.replace(/'/g,''); document.getElementById('selectOrigemPrev').value=o; document.getElementById('valorPrev').value=core.fmt.money(v); document.getElementById('inputDataRepassePrev').value=d; document.getElementById('inputObsPrev').value=obs; document.getElementById('btnSalvarPrev').innerText="Atualizar"; document.getElementById('btnCancelPrev').classList.remove('hidden'); },
    cancelarEdicao: () => { document.getElementById('formPrev').reset(); document.getElementById('idPrevEdicao').value=''; document.getElementById('btnSalvarPrev').innerText='Registrar'; document.getElementById('btnCancelPrev').classList.add('hidden'); },
    limparFiltro: () => { document.getElementById('filtroHistoricoPrev').value=''; previdencia.carregarHistorico(); }, renderizarRelatorio: () => {}
};

const margem = {
    switchView: (v) => { document.getElementById('view-margem-calculadora').classList.toggle('hidden', v!=='calculadora'); document.getElementById('view-margem-cadastro').classList.toggle('hidden', v!=='cadastro'); if(v==='calculadora') margem.carregarHistorico(); else margem.carregarServidores(); },
    handleSalvarServidor: async (e) => { e.preventDefault(); const f=e.target; if((await core.api('salvarServidor',{nome:f.nome.value, cpf:f.cpf.value, matricula:f.matricula.value}))?.success) { core.ui.alert('Ok','Salvo','sucesso'); margem.carregarServidores(); } },
    carregarServidores: async () => { const l=await core.api('buscarTodosServidores'); const tb=document.getElementById('listaServidores'); if(tb&&l){ tb.innerHTML=''; l.forEach(s=>tb.innerHTML+=`<tr class="border-b"><td class="p-3">${s[1]}</td><td>${s[2]}</td><td>${s[3]}</td></tr>`); } },
    buscarPessoaInput: (i) => { if(i.value.length<3)return; core.api('buscarTodosServidores').then(l=>{ const d=document.getElementById('listaSugestoes'); d.innerHTML=''; d.style.display='block'; l.filter(s=>s[1].toLowerCase().includes(i.value.toLowerCase())).forEach(s=>d.innerHTML+=`<div class="autocomplete-item" onclick="margem.selServ('${s[1]}','${s[2]}','${s[3]}')">${s[1]}</div>`); }); },
    selServ: (n,c,m) => { document.getElementById('buscaServidor').value=n; document.getElementById('cpfServidor').value=c; document.getElementById('matriculaServidor').value=m; document.getElementById('listaSugestoes').style.display='none'; },
    calcularMargem: () => { const b=core.fmt.moneyParse(document.getElementById('rendaBruta').value); const d=core.fmt.moneyParse(document.getElementById('descObrigatorios').value); const e=core.fmt.moneyParse(document.getElementById('emprestimosAtuais').value); const p=(document.getElementById('percentualMargem').value||35)/100; const l=b-d; const mt=l*p; const md=Math.max(0,mt-e); document.getElementById('displayRendaLiquida').innerText=core.fmt.money(l); document.getElementById('displayMargemTotal').innerText=core.fmt.money(mt); document.getElementById('displayMargemDisponivel').innerText=core.fmt.money(md); },
    handleSalvarCalculo: async (e) => { e.preventDefault(); const n=document.getElementById('buscaServidor').value; if(!n)return core.ui.alert('Erro','Selecione servidor','erro'); margem.calcularMargem(); const b=core.fmt.moneyParse(document.getElementById('rendaBruta').value); const d=core.fmt.moneyParse(document.getElementById('descObrigatorios').value); const emp=core.fmt.moneyParse(document.getElementById('emprestimosAtuais').value); const l=b-d; const perc=document.getElementById('percentualMargem').value||35; const mt=l*(perc/100); const md=Math.max(0,mt-emp); const dt={nome:n, cpf:document.getElementById('cpfServidor').value, matricula:document.getElementById('matriculaServidor').value, competencia:document.getElementById('compMargem').value, bruto:b, descontos:d, liquido:l, percentual:perc, margemTotal:mt, emprestimos:emp, margemDisponivel:md}; core.ui.confirm('Salvar','Gerar carta?',async()=>{ if((await core.api('salvarCalculoMargem',dt))?.success) { margem.carregarHistorico(); const pdf=await core.api('gerarCartaMargem',dt); if(pdf?.success) window.open(pdf.pdfUrl,'_blank'); } }); },
    carregarHistorico: async () => { const l=await core.api('buscarHistoricoMargem'); const tb=document.getElementById('listaHistoricoMargem'); if(tb&&l){ tb.innerHTML=''; l.forEach(h=>tb.innerHTML+=`<tr class="border-b"><td class="p-3">${core.fmt.dateBR(h[1])}</td><td>${h[3]}</td><td class="text-right">${core.fmt.money(h[8])}</td><td class="text-right font-bold text-emerald-600">${core.fmt.money(h[12])}</td><td class="text-center"><button onclick="margem.reprint('${h[0]}')"><i class="fa-solid fa-print"></i></button></td></tr>`); } },
    reprint: async (id) => { const r=await core.api('regerarPDFMargem',id); if(r?.success) window.open(r.pdfUrl,'_blank'); }
};

const consignados = {
    switchView: (v) => { document.getElementById('view-consig-operacional').classList.toggle('hidden', v!=='operacional'); document.getElementById('view-consig-gerencial').classList.toggle('hidden', v!=='gerencial'); if(v==='operacional') { consignados.carregarHistorico(); consignados.carregarBancos(); } },
    carregarBancos: async () => { const l=await core.api('getBancosConsig'); const s=document.getElementById('selectBancoConsig'); if(s&&l){s.innerHTML='<option value="">Selecione...</option>'; l.forEach(r=>s.innerHTML+=`<option value="${r}">${r}</option>`);} },
    addBancoConsig: async () => { const i=document.getElementById('novoBancoConsig'); if(i.value){ await core.api('addBancoConsig',i.value); i.value=''; config.carregarListas(); } },
    handleSave: (e) => { e.preventDefault(); core.ui.confirm('Salvar','Lançar?',async()=>{ const f=e.target; const d={id:document.getElementById('idConsigEdicao').value, competencia:f.competencia.value, banco:f.banco.value, valor:f.valor.value, dataRepasse:f.dataRepasse.value, observacoes:f.observacoes.value}; if((await core.api('salvarConsignado',d))?.success){core.ui.alert('Ok','Salvo','sucesso'); consignados.cancelarEdicao(); consignados.carregarHistorico();} }); },
    carregarHistorico: async () => { const tb=document.getElementById('listaHistoricoConsig'); const l=await core.api('buscarConsignados'); tb.innerHTML=''; if(l) l.forEach(r=>tb.innerHTML+=`<tr><td class="pl-6">${core.fmt.comp(r[1])}</td><td>${r[3]}</td><td class="text-right font-bold text-teal-700">${core.fmt.money(r[4])}</td><td class="text-center">${r[5]?core.fmt.dateBR(r[5]):'-'}</td><td class="text-center"><button onclick="consignados.prepararEdicao('${r[0]}','${r[1]}','${r[3]}','${r[4]}','${r[5]}','${r[6]}')" class="text-amber-500"><i class="fa-solid fa-pencil"></i></button></td></tr>`); },
    prepararEdicao: (id,c,b,v,d,obs) => { document.getElementById('idConsigEdicao').value=id; document.getElementById('inputCompetenciaConsig').value=c.replace(/'/g,''); document.getElementById('selectBancoConsig').value=b; document.getElementById('valorConsig').value=core.fmt.money(v); document.getElementById('inputDataRepasseConsig').value=d; document.getElementById('inputObsConsig').value=obs; document.getElementById('btnSalvarConsig').innerText="Atualizar"; document.getElementById('btnCancelConsig').classList.remove('hidden'); },
    cancelarEdicao: () => { document.getElementById('formConsig').reset(); document.getElementById('idConsigEdicao').value=''; document.getElementById('btnSalvarConsig').innerText='Lançar'; document.getElementById('btnCancelConsig').classList.add('hidden'); },
    limparFiltro: () => { document.getElementById('filtroHistoricoConsig').value=''; consignados.carregarHistorico(); }, renderizarRelatorio: () => {}
};

const despesas = {
    switchView: (v) => {
        ['operacional','fornecedores','gerencial'].forEach(x => document.getElementById(`view-desp-${x}`).classList.add('hidden'));
        document.getElementById(`view-desp-${v}`).classList.remove('hidden');
        if(v==='operacional') { despesas.carregarFornecedores(); despesas.carregarHistorico(); }
        else if(v==='fornecedores') despesas.carregarFornecedores();
    },
    carregarFornecedores: async () => {
        const l=await core.api('buscarFornecedores');
        const s=document.getElementById('selectFornecedorDesp'); const tb=document.getElementById('listaFornecedores');
        if(s){s.innerHTML='<option value="">Selecione...</option>'; (l||[]).forEach(f=>s.innerHTML+=`<option value="${f[1]}" data-valor="${f[4]}">${f[1]}</option>`);}
        if(tb){tb.innerHTML=''; (l||[]).forEach(f=>tb.innerHTML+=`<tr><td class="p-3">${f[1]}</td><td>${f[3]}</td><td class="text-right">${core.fmt.money(f[4])}</td><td class="text-center"><button class="text-red-500" onclick="despesas.delForn('${f[0]}')"><i class="fa-solid fa-trash"></i></button></td></tr>`);}
    },
    handleSaveFornecedor: async (e) => { e.preventDefault(); const f=e.target; if((await core.api('salvarFornecedor',{id:document.getElementById('idFornecedorEdicao').value, nome:f.nome.value, cnpj:f.cnpj.value, tipoServico:f.tipoServico.value, valorPadrao:f.valorPadrao.value}))?.success) {core.ui.alert('Ok','Salvo','sucesso'); despesas.carregarFornecedores();} },
    delForn: (id) => core.ui.confirm('Del','Apagar?',async()=>{await core.api('excluirFornecedor',id); despesas.carregarFornecedores();}),
    verificarValorPadrao: (s) => { const v=s.options[s.selectedIndex].getAttribute('data-valor'); if(v&&v!=='undefined') document.getElementById('valorDespesa').value=core.fmt.money(v); },
    alternarInputFornecedor: () => { const s=document.getElementById('selectFornecedorDesp'); const i=document.getElementById('inputFornecedorManual'); s.classList.toggle('hidden'); i.classList.toggle('hidden'); },
    handleSave: async (e) => {
        e.preventDefault(); const f=e.target;
        const forn = document.getElementById('selectFornecedorDesp').classList.contains('hidden') ? document.getElementById('inputFornecedorManual').value : document.getElementById('selectFornecedorDesp').value;
        const d={id:document.getElementById('idDespesaEdicao').value, competencia:f.competencia.value, fornecedor:forn, numDoc:f.numDoc.value, valor:f.valor.value, observacoes:f.observacoes.value};
        if((await core.api('salvarDespesa',d))?.success) { core.ui.alert('Ok','Salvo','sucesso'); despesas.carregarHistorico(); }
    },
    carregarHistorico: async () => { const l=await core.api('buscarHistoricoDespesas'); const tb=document.getElementById('listaHistoricoDespesas'); if(tb&&l){ tb.innerHTML=''; l.forEach(r=>tb.innerHTML+=`<tr class="border-b"><td class="p-3">${core.fmt.comp(r[1])}</td><td>${r[3]}</td><td>${r[4]}</td><td class="text-right font-bold">${core.fmt.money(r[5])}</td><td class="text-center">${r[6]}</td><td class="text-center"><button onclick="despesas.del('${r[0]}')" class="text-red-500"><i class="fa-solid fa-trash"></i></button></td></tr>`); } },
    del: (id) => core.ui.confirm('Del','Apagar?',async()=>{await core.api('excluirDespesa',id); despesas.carregarHistorico();}),
    cancelarEdicao: () => { document.getElementById('formDespesa').reset(); document.getElementById('idDespesaEdicao').value=''; },
    cancelarEdicaoForn: () => { document.getElementById('idFornecedorEdicao').value=''; }
};

const importacao = {
    limpar: () => document.getElementById('importDados').value='',
    atualizarGuia: () => { const t=document.getElementById('importTipo').value; const d=document.getElementById('importGuiaContainer'); if(t){d.classList.remove('hidden'); document.getElementById('importListaColunas').innerHTML='<li>Verifique ordem no backend...</li>';} else d.classList.add('hidden'); },
    executar: async () => { const t=document.getElementById('importTipo').value; const d=document.getElementById('importDados').value; if(!t||!d)return core.ui.alert('Erro','Preencha tudo','erro'); core.ui.confirm('Importar','Processar?',async()=>{ const r=await core.api('importarDadosLote',{tipo:t,dados:d}); if(r?.success){core.ui.alert('Ok',r.message,'sucesso'); importacao.limpar();} }); }
};

const arquivos = {
    carregarLista: async () => {
        const l=await core.api('buscarArquivosDigitais',{tipo:'',ano:''});
        const tb=document.getElementById('listaArquivosDigitais');
        if(tb) { tb.innerHTML=''; (l||[]).forEach(r=>tb.innerHTML+=`<tr class="border-b hover:bg-cyan-50/20 arq-row"><td class="p-3 text-xs">${core.fmt.dateBR(r[1])}</td><td>${r[2]}</td><td><div class="font-bold text-sm search-target">${r[2]} ${r[4]||''}</div><div class="text-xs text-slate-500 search-target">${r[5]}</div></td><td class="text-center"><a href="${r[7]}" target="_blank" class="text-blue-500 mx-1"><i class="fa-solid fa-eye"></i></a> <button onclick="arquivos.excluir('${r[0]}','${r[9]}')" class="text-red-500 mx-1"><i class="fa-solid fa-trash"></i></button></td></tr>`); document.getElementById('contadorArquivos').innerText=`${l?l.length:0} arquivos`; }
    },
    handleUpload: async (e) => {
        e.preventDefault(); const f=e.target; const fi=document.getElementById('fileInput'); if(!fi.files.length)return core.ui.alert('Erro','Selecione arquivo','erro');
        const file=fi.files[0]; const reader=new FileReader();
        reader.onload=async function(evt){
            const pl={tipo:f.tipo.value, ano:f.ano.value, numero:f.numero.value, descricao:f.descricao.value, fileName:file.name, mimeType:file.type, fileData:evt.target.result};
            const res=await core.api('uploadArquivoDigital',pl); if(res?.success){core.ui.alert('Ok','Enviado!','sucesso'); arquivos.switchView('lista');}
        }; reader.readAsDataURL(file);
    },
    switchView: (v) => {
        document.getElementById('view-arq-upload').classList.toggle('hidden', v!=='upload');
        document.getElementById('view-arq-lista').classList.toggle('hidden', v!=='lista');
        if(v==='upload') arquivos.addTipoArquivo=async()=>{const i=document.getElementById('novoTipoArquivo'); if(i.value){await core.api('addTipoArquivo',i.value); i.value=''; config.carregarListas(); arquivos.carregarTipos('selectTipoArquivo');}}; // Mock add
        else arquivos.carregarLista();
    },
    carregarTipos: async (eid) => { const l=await core.api('getTiposArquivo'); const s=document.getElementById(eid); if(s&&l){s.innerHTML='<option value="">Selecione...</option>'; l.forEach(t=>s.innerHTML+=`<option value="${t}">${t}</option>`);} },
    excluir: (ir,id) => core.ui.confirm('Excluir','Apagar arquivo?',async()=>{ if((await core.api('excluirArquivoDigital',{idReg:ir, idDrive:id}))?.success) arquivos.carregarLista(); }),
    mostrarNome: (i) => { if(i.files[0]) document.getElementById('fileNameDisplay').innerText=i.files[0].name; },
    filtrarLocalmente: () => { const t=document.getElementById('filtroArqBusca').value.toLowerCase(); document.querySelectorAll('.arq-row').forEach(r=>{r.classList.toggle('hidden', !r.innerText.toLowerCase().includes(t));}); },
    addTipoArquivo: async () => { const i = document.getElementById('novoTipoArquivo'); if(i.value) { await core.api('addTipoArquivo', i.value); i.value=''; config.carregarListas(); } } // Definição correta
};

const relatorios = {
    carregarCabecalho: async () => {
        const c = await core.api('buscarConfiguracoes');
        if(c) { document.querySelectorAll('.nome-instituto-target').forEach(e=>e.innerText=c.nome); document.querySelectorAll('.cnpj-target').forEach(e=>e.innerText=c.cnpj); }
        const f = await core.api('buscarFornecedores');
        const s = document.getElementById('relFornecedor'); if(s&&f){ s.innerHTML='<option value="">Todos</option>'; f.forEach(x=>s.innerHTML+=`<option value="${x[1]}">${x[1]}</option>`); }
    },
    ajustarFiltros: () => {
        const t=document.getElementById('relTipo').value; const bm=document.getElementById('boxRelMes'); const bs=document.getElementById('boxRelStatus'); const bf=document.getElementById('boxRelFornecedor');
        bm.classList.add('hidden'); bs.classList.add('hidden'); bf.classList.add('hidden');
        if(t.includes('consolidado')||t==='confronto'||t.includes('receitas')||t.includes('despesas')) bm.classList.remove('hidden');
        if(t.includes('assessorias')) { bm.classList.remove('hidden'); bf.classList.remove('hidden'); }
        if(t.includes('ir_')||t.includes('consignados')) { bm.classList.remove('hidden'); bs.classList.remove('hidden'); }
    },
    gerar: async () => {
        const p={tipo:document.getElementById('relTipo').value, ano:document.getElementById('relAno').value, mes:document.getElementById('relMes').value, status:document.getElementById('relStatus').value, fornecedor:document.getElementById('relFornecedor').value};
        const tb=document.getElementById('relTbody'); tb.innerHTML='<tr><td class="p-8 text-center">Gerando...</td></tr>';
        const r=await core.api('gerarRelatorioAvancado',p);
        if(r) {
            document.getElementById('relTitulo').innerText=r.titulo; tb.innerHTML='';
            if(r.dados&&r.dados.length) {
                // Renderização Genérica Simples
                r.dados.forEach(d => {
                     let rowHtml = '';
                     if(d.folha!==undefined) rowHtml = `<td>Mês</td><td class="text-right">${core.fmt.money(d.guias+d.prev)}</td><td class="text-right">${core.fmt.money(d.folha+d.despesas)}</td>`;
                     else if(d.valores) { rowHtml = `<td>${d.origem||d.fornecedor}</td>`; d.valores.forEach(v=>rowHtml+=`<td class="text-right">${core.fmt.money(v)}</td>`); }
                     else rowHtml = `<td>${d.competencia||d.data}</td><td>${d.descricao}</td><td class="text-right">${core.fmt.money(d.valor||d.total)}</td>`;
                     tb.innerHTML += `<tr class="border-b text-xs">${rowHtml}</tr>`;
                });
            } else tb.innerHTML='<tr><td class="p-8 text-center">Sem dados.</td></tr>';
        }
    },
    imprimir: () => window.print()
};

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    core.utils.applyMasks(); core.utils.initInputs();
    core.api('buscarConfiguracoes').then(c => {
        if(c) {
            document.getElementById('sidebar-institution-name').innerText = c.nome;
            document.getElementById('sidebar-cnpj').innerText = c.cnpj;
            if(c.urlLogo) { document.getElementById('sidebar-logo').src=c.urlLogo; document.getElementById('sidebar-logo').classList.remove('hidden'); document.getElementById('sidebar-logo-placeholder').classList.add('hidden'); }
        }
    });
    router.navigate('guia-rapido');
    const n=new Date(); const s=n.toLocaleDateString('pt-BR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    const ed=document.getElementById('dataExtensoGuia'); if(ed) ed.innerText=s.charAt(0).toUpperCase()+s.slice(1);
});
