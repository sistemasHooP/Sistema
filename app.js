/**
 * SISTEMA RPPS - ENGINE V3.3 (FIX MATH & SEARCH)
 * Arquivo: app.js
 * Correções: Cálculo preciso da folha e busca local de servidores.
 */

// ============================================================================
// 1. CONFIGURAÇÃO DA API
// ============================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzcFEuN4Tjb_EvvkXJlLZsrpoPDA22rrSk6CiZBvslCUAdMrLL3BNcs6BRxDiGkKCm9Vw/exec"; 
const API_TOKEN = "TOKEN_SECRETO_RPPS_2026"; 

// ============================================================================
// 2. CORE: COMUNICAÇÃO E UTILITÁRIOS
// ============================================================================
const core = {
    api: async (action, payload = {}, silent = false) => {
        if(!silent) core.ui.toggleLoading(true);
        try {
            const response = await fetch(API_URL, {
                method: "POST", redirect: "follow",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action, payload, token: API_TOKEN })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if(!silent) core.ui.toggleLoading(false);
            
            if (!data) return null;
            if (data.success === false) { 
                core.ui.alert('Atenção', data.message || "Erro remoto.", 'erro');
                return null;
            }
            return data; 
        } catch (error) {
            if(!silent) core.ui.toggleLoading(false);
            console.error("API Error:", error);
            if (action !== 'buscarConfiguracoes') { 
                 core.ui.alert('Erro de Conexão', "Falha ao contactar servidor.\nVerifique a internet.", 'erro');
            }
            return null;
        }
    },
    ui: {
        toggleLoading: (s) => {
            const el = document.getElementById('loading');
            if(el) el.classList.toggle('hidden', !s);
        },
        alert: (t, m, tp='info') => {
            const modal = document.getElementById('sys-modal-alert');
            if(!modal) return alert(`${t}\n\n${m}`);
            
            document.getElementById('sys-modal-title').innerText = t;
            document.getElementById('sys-modal-desc').innerHTML = m;
            
            const iconBg = document.getElementById('sys-icon-bg');
            const iconI = document.getElementById('sys-icon-i');
            
            iconBg.className = "mx-auto flex h-12 w-12 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 transition-colors " + (tp==='erro'?'bg-red-100':tp==='sucesso'?'bg-green-100':'bg-blue-100');
            iconI.className = "fa-solid text-lg " + (tp==='erro'?'fa-triangle-exclamation text-red-600':tp==='sucesso'?'fa-check text-green-600':'fa-info text-blue-600');
            document.getElementById('sys-modal-actions').innerHTML = `<button onclick="core.ui.closeAlert()" class="btn-primary w-full sm:w-auto bg-slate-800 text-white px-4 py-2 rounded">OK</button>`;
            
            modal.classList.remove('hidden');
            document.getElementById('sys-modal-backdrop').classList.remove('opacity-0');
            document.getElementById('sys-modal-panel').classList.remove('opacity-0', 'translate-y-4', 'scale-95');
        },
        confirm: (t, m, cb) => {
            core.ui.alert(t, m);
            document.getElementById('sys-icon-bg').className = "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10";
            document.getElementById('sys-icon-i').className = "fa-solid fa-question text-yellow-600 text-lg";
            
            const acts = document.getElementById('sys-modal-actions');
            acts.innerHTML = `
                <button id="btnConfSim" class="bg-blue-600 text-white px-4 py-2 rounded mr-2 hover:bg-blue-700 transition">Sim</button>
                <button onclick="core.ui.closeAlert()" class="bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition">Não</button>
            `;
            document.getElementById('btnConfSim').onclick = () => { core.ui.closeAlert(); cb(); };
        },
        closeAlert: () => {
            document.getElementById('sys-modal-backdrop').classList.add('opacity-0');
            document.getElementById('sys-modal-panel').classList.add('opacity-0', 'translate-y-4', 'scale-95');
            setTimeout(() => document.getElementById('sys-modal-alert').classList.add('hidden'), 300);
        }
    },
    fmt: {
        money: (v) => (Number(v)||0).toLocaleString("pt-BR", {style:"currency", currency:"BRL"}),
        
        // CORREÇÃO: Parsing baseado na máscara (remove tudo que não é dígito e divide por 100)
        moneyParse: (v) => { 
            if (typeof v === 'number') return v;
            if (!v) return 0;
            // Remove tudo exceto números e sinal de menos
            let s = String(v).replace(/[^\d-]/g, '');
            return (parseFloat(s) / 100) || 0;
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
            if(p.length === 2) return `${p[1]}/${p[0]}`; 
            return s;
        },

        toISOMonth: (val) => {
            if(!val) return "";
            let s = String(val).replace(/'/g, "").trim();
            if(s.match(/^\d{4}-\d{2}$/)) return s;
            if(s.includes('/') || s.includes('-')) {
                const date = new Date(s);
                if(!isNaN(date.getTime())) {
                     const y = date.getFullYear();
                     const m = String(date.getMonth() + 1).padStart(2, '0');
                     return `${y}-${m}`;
                }
            }
            return s.substring(0, 7); 
        }
    },
    utils: {
        applyMasks: () => {
            document.querySelectorAll('.mask-money').forEach(i => i.addEventListener('input', e => {
                let v = e.target.value.replace(/\D/g, "");
                v = (Number(v) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                e.target.value = v;
            }));
        },
        initInputs: () => {
            const h = new Date().toISOString().substring(0,7);
            const a = new Date().getFullYear();
            document.querySelectorAll('input[type="month"]').forEach(i => { if(!i.value) i.value=h; });
            document.querySelectorAll('select[id*="Ano"]').forEach(s => { if(!s.value) s.value=a; });
        }
    }
};

// ============================================================================
// 3. ROTEAMENTO
// ============================================================================
const router = {
    loadModule: async (moduleName) => {
        const container = document.getElementById('dynamic-content');
        container.innerHTML = `<div class="flex flex-col items-center justify-center h-64 text-slate-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin text-4xl mb-4 text-blue-500"></i><p>Carregando ${moduleName}...</p></div>`;

        try {
            const response = await fetch(`${moduleName}.html`);
            if (!response.ok) throw new Error(`Arquivo ${moduleName}.html não encontrado`);
            
            const html = await response.text();
            container.innerHTML = html;

            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            const btn = document.querySelector(`button[data-target="${moduleName}"]`);
            if(btn) btn.classList.add('active');
            
            const titles = { 'home':'Início', 'folha':'Folha de Pagamento', 'recolhimento':'Receitas', 'financeiro':'Financeiro', 'gestao':'Gestão' };
            const pageTitle = document.getElementById('page-title');
            if(pageTitle) pageTitle.innerText = titles[moduleName] || 'Sistema RPPS';

            if (moduleName === 'home') dashboard.init();
            if (moduleName === 'folha') {
                folha.switchView('operacional');
                core.utils.applyMasks();
                core.utils.initInputs();
            }
        } catch (e) {
            console.warn(e);
            container.innerHTML = `
                <div class="p-8 bg-white border border-slate-200 rounded-lg text-center shadow-sm">
                    <div class="inline-block p-4 rounded-full bg-slate-100 mb-4"><i class="fa-solid fa-hammer text-slate-400 text-2xl"></i></div>
                    <h3 class="font-bold text-lg text-slate-700">Módulo em Construção</h3>
                    <p class="text-sm text-slate-500 mt-2">O arquivo <strong>${moduleName}.html</strong> ainda não foi criado.</p>
                </div>`;
        }
    }
};

// ============================================================================
// 4. MÓDULOS DE NEGÓCIO (CORRIGIDOS)
// ============================================================================

// --- DASHBOARD (HOME) ---
const dashboard = {
    chart: null, dataCache: null,
    init: () => {
        const now = new Date();
        const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dataStr = now.toLocaleDateString('pt-BR', opts);
        const elData = document.getElementById('dataExtensoGuia');
        if(elData) elData.innerText = dataStr.charAt(0).toUpperCase() + dataStr.slice(1);
        dashboard.carregar();
    },
    carregar: async () => {
        const res = await core.api('buscarDadosDashboard');
        if(res) { dashboard.dataCache = res; dashboard.popularFiltros(); dashboard.atualizarGrafico(); }
    },
    popularFiltros: () => {
        const s = document.getElementById('biAno'); if(!s) return;
        const y = new Date().getFullYear();
        const set = new Set([y]);
        if(dashboard.dataCache && dashboard.dataCache.folhas) {
            dashboard.dataCache.folhas.forEach(f => { if(f.competencia) set.add(parseInt(f.competencia.substr(0,4))); });
        }
        s.innerHTML = '';
        Array.from(set).sort((a,b)=>b-a).forEach(a => s.innerHTML+=`<option value="${a}">${a}</option>`);
    },
    atualizarGrafico: () => {
        const ctx = document.getElementById('chartFinanceiro');
        if(!ctx || !dashboard.dataCache) return;
        const ano = document.getElementById('biAno').value;
        const labels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const dadosFolha = Array(12).fill(0);
        if(dashboard.dataCache.folhas) {
             dashboard.dataCache.folhas.forEach(f => {
                 if(f.competencia.startsWith(ano)) dadosFolha[parseInt(f.competencia.split('-')[1])-1] += f.liquido;
             });
        }
        if(dashboard.chart) dashboard.chart.destroy();
        dashboard.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Folha Líquida', data: dadosFolha, backgroundColor: 'rgba(59, 130, 246, 0.7)', borderRadius: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }
};

// --- FOLHA DE PAGAMENTO ---
const folha = {
    servidoresCache: [], // CORREÇÃO: Cache local para busca instantânea

    switchView: (v) => {
        ['operacional', 'outros-bancos', 'gerencial'].forEach(id => {
            const el = document.getElementById(`view-folha-${id}`);
            if(el) el.classList.add('hidden');
            const btn = document.getElementById(`tab-folha-${id}`);
            if(btn) btn.className = "px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 transition whitespace-nowrap";
        });
        
        const activeEl = document.getElementById(`view-folha-${v}`);
        if(activeEl) activeEl.classList.remove('hidden');
        
        const activeBtn = document.getElementById(`tab-folha-${v}`);
        if(activeBtn) activeBtn.className = "px-4 py-2 rounded-lg text-sm font-bold transition bg-yellow-50 text-yellow-800 shadow-sm border border-yellow-100 whitespace-nowrap";

        if(v === 'operacional') {
             folha.carregarNomes();
             folha.carregarFolhas();
        } else if (v === 'outros-bancos') {
             folha.carregarOutrosBancos();
             // CORREÇÃO: Carrega cache de servidores UMA VEZ
             if(folha.servidoresCache.length === 0) folha.carregarCacheServidores();
             
             const inp = document.getElementById('filtroCompOutrosBancos');
             if(inp && !inp.value) inp.value = new Date().toISOString().substring(0,7);
        } else {
             folha.renderizarRelatorio();
        }
    },

    carregarNomes: async () => {
        const list = await core.api('getNomesFolha');
        const sel = document.getElementById('selectTipoFolha');
        if(sel && list) {
            const val = sel.value;
            sel.innerHTML = '<option value="">Selecione...</option>';
            list.forEach(r => sel.innerHTML += `<option value="${r}">${r}</option>`);
            if(val) sel.value = val;
        }
    },

    // CORREÇÃO: Usa o novo parser seguro
    calcularLiquido: () => {
        const b = core.fmt.moneyParse(document.getElementById('folhaBruto').value);
        const d = core.fmt.moneyParse(document.getElementById('folhaDescontos').value);
        const liq = b - d;
        const el = document.getElementById('displayLiquido');
        if(el) {
            el.innerText = core.fmt.money(liq);
            el.className = liq < 0 ? "text-2xl font-black text-red-600" : "text-2xl font-black text-slate-800";
        }
    },

    handleSave: (e) => {
        e.preventDefault(); const f=e.target;
        core.ui.confirm('Salvar', 'Gravar folha de pagamento?', async () => {
            const d = {
                id: document.getElementById('idFolhaEdicao').value,
                competencia: f.competencia.value, tipoFolha: f.tipoFolha.value,
                valorBruto: f.valorBruto.value, valorDescontos: f.valorDescontos.value, observacoes: f.observacoes.value
            };
            if((await core.api('salvarFolha', d))?.success) { 
                core.ui.alert('Ok', 'Salvo com sucesso!', 'sucesso'); 
                folha.cancelarEdicao(); 
                folha.carregarFolhas(); 
            }
        });
    },

    carregarFolhas: async () => {
        const tb = document.getElementById('listaFolhas');
        if(!tb) return;
        tb.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-gray-400 italic">Carregando...</td></tr>';
        
        const filtro = document.getElementById('filtroHistoricoFolha') ? document.getElementById('filtroHistoricoFolha').value : '';
        const list = await core.api('buscarFolhas');
        
        tb.innerHTML = '';
        let tB=0, tD=0, tL=0;
        
        if(list && list.length) {
            let contador = 0;
            list.forEach(r => {
                const compRow = String(r[1]).replace(/'/g, "");
                if(filtro && core.fmt.toISOMonth(compRow) !== filtro) return;

                contador++;
                const b=core.fmt.moneyParse(r[4]); const d=core.fmt.moneyParse(r[5]); const l=core.fmt.moneyParse(r[6]);
                tB+=b; tD+=d; tL+=l;
                
                const obs = String(r[7]||'').replace(/'/g, "\\'").replace(/\n/g, " ");

                tb.innerHTML += `
                <tr class="hover:bg-yellow-50/30 border-b border-gray-100 transition">
                    <td class="pl-8 py-4 font-bold text-slate-700">${core.fmt.comp(r[1])}</td>
                    <td class="px-4 py-4"><span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-[10px] font-bold uppercase">${r[3]}</span></td>
                    <td class="px-4 py-4 text-right text-gray-600 font-mono">${core.fmt.money(b)}</td>
                    <td class="px-4 py-4 text-right text-red-500 font-mono">-${core.fmt.money(d)}</td>
                    <td class="px-4 py-4 text-right font-black text-slate-800 bg-slate-50/30 font-mono">${core.fmt.money(l)}</td>
                    <td class="pr-8 py-4 text-center">
                        <button onclick="folha.prepararEdicao('${r[0]}','${compRow}','${r[3]}','${core.fmt.money(b)}','${core.fmt.money(d)}','${obs}')" class="text-amber-600 hover:bg-amber-50 p-2 rounded mr-1"><i class="fa-solid fa-pencil"></i></button>
                        <button onclick="folha.excluir('${r[0]}')" class="text-red-500 hover:bg-red-50 p-2 rounded"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
            });
            if(contador === 0) tb.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-gray-400">Nenhum registro para o filtro.</td></tr>';
        } else {
            tb.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-gray-400">Vazio.</td></tr>';
        }
        
        if(document.getElementById('totalCompFolhaBruto')) {
            document.getElementById('totalCompFolhaBruto').innerText = core.fmt.money(tB);
            document.getElementById('totalCompFolhaDesc').innerText = core.fmt.money(tD);
            document.getElementById('totalCompFolhaLiq').innerText = core.fmt.money(tL);
        }
    },

    prepararEdicao: (id, c, t, b, d, o) => {
        document.getElementById('idFolhaEdicao').value = id;
        document.getElementById('inputCompetenciaFolha').value = core.fmt.toISOMonth(c);
        document.getElementById('selectTipoFolha').value = t;
        document.getElementById('folhaBruto').value = b; // Já vem formatado
        document.getElementById('folhaDescontos').value = d; // Já vem formatado
        document.getElementById('inputObsFolha').value = o;
        folha.calcularLiquido();
        document.getElementById('btnSalvarFolha').innerHTML = '<i class="fa-solid fa-save mr-2"></i> Atualizar';
        document.getElementById('btnCancelFolha').classList.remove('hidden');
        document.querySelector('.card-dashboard').scrollIntoView({ behavior: 'smooth' });
    },

    cancelarEdicao: () => {
        document.getElementById('formFolha').reset();
        document.getElementById('idFolhaEdicao').value = '';
        folha.calcularLiquido(); 
        document.getElementById('btnSalvarFolha').innerHTML = '<i class="fa-solid fa-check mr-2"></i> Salvar Lançamento';
        document.getElementById('btnCancelFolha').classList.add('hidden');
        core.utils.initInputs(); 
    },

    excluir: (id) => {
        core.ui.confirm('Excluir', 'Apagar registro permanentemente?', async () => {
             if((await core.api('excluirFolha', id))?.success) folha.carregarFolhas();
        });
    },

    limparFiltro: () => {
        document.getElementById('filtroHistoricoFolha').value = '';
        folha.carregarFolhas();
    },

    // --- ABA OUTROS BANCOS ---
    
    // CORREÇÃO: Carrega cache de servidores (Silent Mode)
    carregarCacheServidores: async () => {
        const lista = await core.api('buscarTodosServidores', {}, true); // true = silent loading
        if (lista) folha.servidoresCache = lista;
    },

    // CORREÇÃO: Busca local instantânea
    buscarServidor: (input) => {
        const termo = input.value.toLowerCase();
        const div = document.getElementById('listaSugestoesOB');
        
        if(termo.length < 2) {
            div.style.display = 'none';
            return;
        }

        div.innerHTML = '';
        const resultados = folha.servidoresCache.filter(s => s[1].toLowerCase().includes(termo));

        if (resultados.length > 0) {
            div.style.display = 'block';
            resultados.slice(0, 10).forEach(s => { // Limita a 10 sugestões
                 div.innerHTML += `<div class="autocomplete-item p-2 hover:bg-slate-50 cursor-pointer border-b text-sm" onclick="folha.selServ('${s[0]}','${s[1]}','${s[2]}')"><strong>${s[1]}</strong><br><span class="text-xs text-gray-500">${s[2]}</span></div>`;
            });
        } else {
            div.style.display = 'none';
        }
    },

    selServ: (id, nome, cpf) => {
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
        const d = {
            id: document.getElementById('idRemessaEdicao').value,
            competencia: document.getElementById('filtroCompOutrosBancos').value,
            idServidor: document.getElementById('idServidorOB').value,
            nomeServidor: document.getElementById('nomeServidorOB').value,
            cpf: document.getElementById('cpfServidorOB').value,
            banco: document.getElementById('selectBancoOB').value,
            valor: document.getElementById('valorOB').value,
            observacoes: document.getElementById('obsOB').value
        };
        if(!d.competencia) return core.ui.alert('Erro', 'Selecione a competência de trabalho.', 'erro');
        if(!d.idServidor) return core.ui.alert('Erro', 'Busque um servidor.', 'erro');

        if((await core.api('salvarRemessaOutroBanco', d))?.success) { 
            core.ui.alert('Ok', 'Salvo', 'sucesso'); 
            folha.carregarOutrosBancos(); 
            folha.cancelarEdicaoOB(); 
        }
    },

    carregarOutrosBancos: async () => {
        const comp = document.getElementById('filtroCompOutrosBancos').value;
        if(!comp) return;
        
        // CORREÇÃO CRÍTICA PARA KPIS: Normalização de Datas
        const folhas = await core.api('buscarFolhas', {}, true); // Silent
        let totLiqGeral = 0;
        if(folhas) {
            folhas.forEach(f => {
                if(core.fmt.toISOMonth(f[1]) === comp) {
                    totLiqGeral += core.fmt.moneyParse(f[6]);
                }
            });
        }
        document.getElementById('kpiFolhaLiquida').innerText = core.fmt.money(totLiqGeral);

        const lista = await core.api('buscarRemessasOutrosBancos', comp);
        const tb = document.getElementById('listaOutrosBancos');
        tb.innerHTML = '';
        let totOutros = 0;
        
        if(lista && lista.length) {
            document.getElementById('contadorRemessas').innerText = `${lista.length} registros`;
            lista.forEach(r => {
                const val = core.fmt.moneyParse(r[7]);
                totOutros += val;
                
                const nomeSafe = String(r[4]).replace(/'/g, "\\'");
                const obsSafe = String(r[8]||'').replace(/'/g, "\\'");

                tb.innerHTML += `
                <tr class="border-b border-slate-100 hover:bg-slate-50">
                    <td class="pl-5 py-3"><div class="font-bold text-slate-700 text-xs">${r[4]}</div><div class="text-[10px] text-slate-400 font-mono">${r[5]}</div></td>
                    <td class="px-4 py-3 text-xs text-slate-600">${r[6]}</td>
                    <td class="px-4 py-3 text-right font-mono text-xs font-bold text-indigo-700">${core.fmt.money(val)}</td>
                    <td class="pr-5 py-3 text-center">
                        <button onclick="folha.prepOB('${r[0]}','${r[3]}','${nomeSafe}','${r[5]}','${r[6]}','${core.fmt.money(val)}','${obsSafe}')" class="text-blue-500 mr-2"><i class="fa-solid fa-pencil"></i></button>
                        <button onclick="folha.delOB('${r[0]}')" class="text-red-500"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
            });
        } else {
            document.getElementById('contadorRemessas').innerText = "0 registros";
            tb.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-400">Nenhuma remessa nesta competência.</td></tr>';
        }
        document.getElementById('kpiOutrosBancos').innerText = core.fmt.money(totOutros);
        document.getElementById('kpiBancoPrincipal').innerText = core.fmt.money(totLiqGeral - totOutros);
    },

    prepOB: (id, ids, n, c, b, v, o) => {
        folha.selServ(ids, n, c);
        document.getElementById('idRemessaEdicao').value = id;
        document.getElementById('selectBancoOB').value = b;
        document.getElementById('valorOB').value = v; // Já vem formatado
        document.getElementById('obsOB').value = o;
        document.getElementById('btnSalvarOB').innerHTML = '<i class="fa-solid fa-save"></i> Atualizar';
        document.getElementById('btnCancelOB').classList.remove('hidden');
    },

    cancelarEdicaoOB: () => {
        document.getElementById('formOutrosBancos').reset();
        document.getElementById('idRemessaEdicao').value = '';
        document.getElementById('detalhesServidorOB').classList.add('hidden');
        document.getElementById('btnSalvarOB').innerHTML = '<i class="fa-solid fa-plus"></i> Adicionar';
        document.getElementById('btnCancelOB').classList.add('hidden');
    },

    delOB: (id) => core.ui.confirm('Excluir', 'Remover esta remessa?', async()=>{ if((await core.api('excluirRemessaOutroBanco', id))?.success) folha.carregarOutrosBancos(); }),

    importarMesAnterior: () => {
        core.ui.confirm('Importar', 'Copiar remessas do mês passado?', async()=>{
            if((await core.api('importarRemessasAnteriores', document.getElementById('filtroCompOutrosBancos').value))?.success) folha.carregarOutrosBancos();
        });
    },

    // --- RELATÓRIOS ---
    renderizarRelatorio: () => {
        const tb = document.getElementById('tabelaRelatorioAnual');
        tb.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-slate-400">Gerando matriz...</td></tr>';
        
        const sel = document.getElementById('filtroAnoFolha');
        if(sel.options.length === 0) {
             const y = new Date().getFullYear();
             for(let i=y+1; i>=y-5; i--) sel.innerHTML += `<option value="${i}">${i}</option>`;
             sel.value = y;
        }

        const ano = sel.value;
        core.api('buscarFolhas').then(list => {
            if(!list) return;
            const m = Array.from({length:12}, (_,i)=>({nome: new Date(0,i).toLocaleString('pt-BR',{month:'long'}), b:0, d:0}));
            
            list.forEach(r => {
                const comp = String(r[1]).replace(/'/g,"");
                if(comp.startsWith(ano)) {
                    const idx = parseInt(comp.split('-')[1]) - 1;
                    if(idx>=0 && idx<=11) {
                        m[idx].b += core.fmt.moneyParse(r[4]);
                        m[idx].d += core.fmt.moneyParse(r[5]);
                    }
                }
            });

            tb.innerHTML = '';
            let tB=0, tD=0;
            m.forEach(mes => {
                const l = mes.b - mes.d;
                tB+=mes.b; tD+=mes.d;
                tb.innerHTML += `<tr class="hover:bg-slate-50"><td class="p-3 font-bold text-slate-700 capitalize">${mes.nome}</td><td class="p-3 text-right text-slate-600">${core.fmt.money(mes.b)}</td><td class="p-3 text-right text-red-500">${core.fmt.money(mes.d)}</td><td class="p-3 text-right font-bold bg-slate-50">${core.fmt.money(l)}</td></tr>`;
            });
            document.getElementById('totalAnoBruto').innerText = core.fmt.money(tB);
            document.getElementById('totalAnoDesc').innerText = '-' + core.fmt.money(tD);
            document.getElementById('totalAnoLiq').innerText = core.fmt.money(tB-tD);
        });
    },
    processarDadosRelatorio: () => folha.renderizarRelatorio()
};

// --- PLACEHOLDERS PARA OUTROS MÓDULOS (Evita erros de referência) ---
const recolhimento = { switchView:()=>{}, carregarHistorico:()=>{} };
const financeiro = { closeModal:()=>{}, carregarPagamentos:()=>{}, confirmarPagamento:()=>{} };
const config = { carregar:()=>{} };
const arquivos = {};
const irrf = {};
const previdencia = {};
const margem = {};
const consignados = {};
const despesas = {};
const importacao = {};
const relatorios = { carregarCabecalho:()=>{} };

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    core.utils.applyMasks();
    core.utils.initInputs();
    
    core.api('buscarConfiguracoes').then(c => {
        if(c) {
            document.getElementById('sidebar-institution-name').innerText = c.nome;
            document.getElementById('sidebar-cnpj').innerText = c.cnpj;
            if(c.urlLogo) {
                const img = document.getElementById('sidebar-logo');
                if(img) { img.src = c.urlLogo; img.classList.remove('hidden'); }
                const ph = document.getElementById('sidebar-logo-placeholder');
                if(ph) ph.classList.add('hidden');
            }
        }
    });

    if(typeof router !== 'undefined') router.loadModule('home');
});
