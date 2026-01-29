/**
 * SISTEMA RPPS - ENGINE V3.7 (STABLE MATH & UI)
 * Arquivo: app.js
 */

// ============================================================================
// 1. CONFIGURAÇÃO
// ============================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzcFEuN4Tjb_EvvkXJlLZsrpoPDA22rrSk6CiZBvslCUAdMrLL3BNcs6BRxDiGkKCm9Vw/exec"; 
const API_TOKEN = "TOKEN_SECRETO_RPPS_2026"; 

// ============================================================================
// 2. CORE
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
                if(!silent) core.ui.alert('Atenção', data.message || "Erro remoto.", 'erro');
                return null;
            }
            return data; 
        } catch (error) {
            if(!silent) core.ui.toggleLoading(false);
            console.error("API Error:", error);
            if (!silent) core.ui.alert('Conexão', "Falha ao contactar servidor.\nVerifique a internet.", 'erro');
            return null;
        }
    },
    ui: {
        toggleLoading: (s) => document.getElementById('loading').classList.toggle('hidden', !s),
        alert: (t, m, tp='info') => {
            const el = document.getElementById('sys-modal-alert');
            if(!el) return alert(`${t}\n\n${m}`);
            
            document.getElementById('sys-modal-title').innerText = t;
            document.getElementById('sys-modal-desc').innerHTML = m;
            
            const iconBg = document.getElementById('sys-icon-bg');
            const iconI = document.getElementById('sys-icon-i');
            
            iconBg.className = "mx-auto flex h-12 w-12 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 " + (tp==='erro'?'bg-red-100':tp==='sucesso'?'bg-green-100':'bg-blue-100');
            iconI.className = "fa-solid text-lg " + (tp==='erro'?'fa-triangle-exclamation text-red-600':tp==='sucesso'?'fa-check text-green-600':'fa-info text-blue-600');
            document.getElementById('sys-modal-actions').innerHTML = `<button onclick="core.ui.closeAlert()" class="btn-primary w-full sm:w-auto bg-slate-800 text-white px-4 py-2 rounded">OK</button>`;
            
            el.classList.remove('hidden');
        },
        confirm: (t, m, cb) => {
            core.ui.alert(t, m);
            document.getElementById('sys-modal-actions').innerHTML = `
                <button id="btnConfSim" class="bg-blue-600 text-white px-4 py-2 rounded mr-2 hover:bg-blue-700 transition">Sim</button>
                <button onclick="core.ui.closeAlert()" class="bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition">Não</button>
            `;
            document.getElementById('btnConfSim').onclick = () => { core.ui.closeAlert(); cb(); };
        },
        closeAlert: () => document.getElementById('sys-modal-alert').classList.add('hidden')
    },
    fmt: {
        money: (v) => (Number(v)||0).toLocaleString("pt-BR", {style:"currency", currency:"BRL"}),
        
        // PARA INPUTS (Com máscara): Remove tudo e divide por 100
        inputToFloat: (v) => { 
            if (typeof v === 'number') return v;
            if (!v) return 0;
            let s = String(v).replace(/[^\d-]/g, '');
            return (parseFloat(s) / 100) || 0;
        },

        // PARA BANCO DE DADOS: Remove formatação BR e converte (NÃO divide por 100)
        dbToFloat: (v) => {
            if (typeof v === 'number') return v;
            if (!v) return 0;
            // Remove R$, espaços e pontos de milhar
            let s = String(v).replace(/R\$|\s|\./g, '');
            // Substitui vírgula decimal por ponto
            s = s.replace(',', '.');
            return parseFloat(s) || 0;
        },
        
        round: (v) => Math.round(v * 100) / 100,
        
        dateBR: (d) => {
            if (!d) return '-';
            const dt = new Date(d);
            if (isNaN(dt.getTime())) return String(d).substring(0, 10);
            const offset = dt.getTimezoneOffset() * 60000;
            return new Date(dt.getTime() + offset).toLocaleDateString('pt-BR');
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
// 3. STORE & ROUTER
// ============================================================================
const store = { config: null, servidores: null, listasAuxiliares: {}, cacheData: {}, invalidate: (k) => delete store.cacheData[k] };

const router = {
    loadModule: async (moduleName) => {
        const container = document.getElementById('dynamic-content');
        if (!container.innerHTML.includes('id="page-' + moduleName)) {
            container.innerHTML = `<div class="flex flex-col items-center justify-center h-64 text-slate-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin text-4xl mb-4 text-blue-500"></i><p>Carregando ${moduleName}...</p></div>`;
        }
        try {
            const response = await fetch(`${moduleName}.html`);
            if (!response.ok) throw new Error(`Arquivo ${moduleName}.html não encontrado`);
            const html = await response.text();
            container.innerHTML = html;

            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            const btn = document.querySelector(`button[data-target="${moduleName}"]`);
            if(btn) btn.classList.add('active');
            
            const titles = { 'home':'Início', 'folha':'Folha de Pagamento', 'recolhimento':'Receitas', 'financeiro':'Financeiro', 'gestao':'Gestão' };
            document.getElementById('page-title').innerText = titles[moduleName] || 'Sistema RPPS';

            if (moduleName === 'home') dashboard.init();
            if (moduleName === 'folha') {
                folha.init(); 
                core.utils.applyMasks(); core.utils.initInputs();
            }
        } catch (e) {
            container.innerHTML = `<div class="p-8 text-center text-red-500">Erro ao carregar módulo.</div>`;
        }
    }
};

// ============================================================================
// 4. MÓDULOS DE NEGÓCIO
// ============================================================================

// --- DASHBOARD ---
const dashboard = {
    chart: null, dataCache: null,
    init: () => {
        const now = new Date();
        const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dataStr = now.toLocaleDateString('pt-BR', opts);
        const elData = document.getElementById('dataExtensoGuia');
        if(elData) elData.innerText = dataStr.charAt(0).toUpperCase() + dataStr.slice(1);
        if (store.cacheData['dashboard']) { dashboard.atualizarGrafico(); dashboard.carregar(true); } else { dashboard.carregar(false); }
    },
    carregar: async (silent = false) => {
        const res = await core.api('buscarDadosDashboard', {}, silent);
        if(res) { store.cacheData['dashboard'] = res; dashboard.popularFiltros(); dashboard.atualizarGrafico(); }
    },
    popularFiltros: () => {
        const s = document.getElementById('biAno'); if(!s) return;
        if(s.options.length > 1) return; 
        const y = new Date().getFullYear();
        s.innerHTML = `<option value="${y}">${y}</option><option value="${y-1}">${y-1}</option>`;
    },
    atualizarGrafico: () => { /* Gráfico aqui... */ }
};

// --- FOLHA DE PAGAMENTO ---
const folha = {
    init: () => {
        folha.switchView('operacional');
        if(!store.servidores) folha.carregarCacheServidores();
    },

    switchView: (v) => {
        ['operacional', 'outros-bancos', 'gerencial'].forEach(id => {
            const el = document.getElementById(`view-folha-${id}`);
            if(el) el.classList.add('hidden');
            const btn = document.getElementById(`tab-folha-${id}`);
            if(btn) btn.className = "px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 transition whitespace-nowrap";
        });
        
        const activeEl = document.getElementById(`view-folha-${v}`);
        if(activeEl) activeEl.classList.remove('hidden');
        document.getElementById(`tab-folha-${v}`).className = "px-4 py-2 rounded-lg text-sm font-bold transition bg-yellow-50 text-yellow-800 shadow-sm border border-yellow-100 whitespace-nowrap";

        if(v === 'operacional') {
             folha.carregarNomes();
             folha.carregarFolhas(); 
        } else if (v === 'outros-bancos') {
             folha.carregarOutrosBancos();
             const inp = document.getElementById('filtroCompOutrosBancos');
             if(inp && !inp.value) inp.value = new Date().toISOString().substring(0,7);
        } else {
             folha.renderizarRelatorio();
        }
    },

    carregarNomes: async () => {
        if (store.listasAuxiliares['nomesFolha']) {
            folha.popularSelectTipoFolha(store.listasAuxiliares['nomesFolha']);
            return;
        }
        const list = await core.api('getNomesFolha', {}, true);
        if(list) {
            store.listasAuxiliares['nomesFolha'] = list;
            folha.popularSelectTipoFolha(list);
        }
    },
    popularSelectTipoFolha: (list) => {
        const sel = document.getElementById('selectTipoFolha');
        if(sel) {
            const val = sel.value;
            sel.innerHTML = '<option value="">Selecione...</option>';
            list.forEach(r => sel.innerHTML += `<option value="${r}">${r}</option>`);
            if(val) sel.value = val;
        }
    },

    calcularLiquido: () => {
        const b = core.fmt.inputToFloat(document.getElementById('folhaBruto').value);
        const d = core.fmt.inputToFloat(document.getElementById('folhaDescontos').value);
        const liq = b - d;
        const el = document.getElementById('displayLiquido');
        if(el) {
            el.innerText = core.fmt.money(liq);
            el.className = liq < 0 ? "text-2xl font-black text-red-600" : "text-2xl font-black text-slate-800";
        }
    },

    handleSave: async (e) => {
        e.preventDefault(); const f=e.target;
        
        const brutoRaw = f.valorBruto.value;
        const descRaw = f.valorDescontos.value;
        const comp = f.competencia.value;
        const tipo = f.tipoFolha.value;
        const obs = f.observacoes.value;
        const idEdicao = document.getElementById('idFolhaEdicao').value;

        if(!confirm('Deseja salvar esta folha?')) return;

        // UI Otimista
        const tb = document.getElementById('listaFolhas');
        const bVal = core.fmt.inputToFloat(brutoRaw);
        const dVal = core.fmt.inputToFloat(descRaw);
        const lVal = bVal - dVal;
        
        const tempRow = document.createElement('tr');
        tempRow.className = "bg-green-50 animate-pulse border-b";
        tempRow.innerHTML = `
            <td class="pl-8 py-4 font-bold text-slate-700">${core.fmt.comp(comp)}</td>
            <td class="px-4 py-4"><span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-[10px] font-bold uppercase">${tipo}</span></td>
            <td class="px-4 py-4 text-right text-gray-600 font-mono">${core.fmt.money(bVal)}</td>
            <td class="px-4 py-4 text-right text-red-500 font-mono">-${core.fmt.money(dVal)}</td>
            <td class="px-4 py-4 text-right font-black text-slate-800 font-mono">${core.fmt.money(lVal)}</td>
            <td class="pr-8 py-4 text-center text-xs text-gray-400">Salvando...</td>
        `;
        if(tb.firstChild) tb.insertBefore(tempRow, tb.firstChild);
        
        folha.cancelarEdicao();

        const d = {
            id: idEdicao,
            competencia: comp, tipoFolha: tipo,
            valorBruto: brutoRaw, valorDescontos: descRaw, observacoes: obs
        };

        // Salva e Recarrega em Background (silent = true)
        const res = await core.api('salvarFolha', d, true); 
        
        if(res?.success) {
            store.invalidate('folhas');
            // Recarrega em SILÊNCIO (true) para não travar a tela
            folha.carregarFolhas(true, true); 
        } else {
            tempRow.remove();
            core.ui.alert('Erro', res?.message || 'Falha ao salvar', 'erro');
        }
    },

    // Arg 2 (silent) adicionado para evitar spinner branco
    carregarFolhas: async (forceRefresh = false, silent = false) => {
        const tb = document.getElementById('listaFolhas');
        if(!tb) return;
        
        let list = store.cacheData['folhas'];

        if (!list || forceRefresh) {
            if(!forceRefresh && !silent) tb.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-gray-400 italic">Carregando...</td></tr>';
            // Chama API. Se silent=true, não mostra spinner
            list = await core.api('buscarFolhas', {}, silent); 
            if (list) store.cacheData['folhas'] = list;
        }
        
        folha.renderizarTabelaFolhas(list);
    },

    renderizarTabelaFolhas: (list) => {
        const tb = document.getElementById('listaFolhas');
        tb.innerHTML = '';
        const filtro = document.getElementById('filtroHistoricoFolha') ? document.getElementById('filtroHistoricoFolha').value : '';
        let tB=0, tD=0, tL=0;
        let contador = 0;

        if(list && list.length) {
            list.forEach(r => {
                const compRow = String(r[1]).replace(/'/g, "");
                if(filtro && core.fmt.toISOMonth(compRow) !== filtro) return;

                contador++;
                // USE dbToFloat HERE for values from Database
                const b=core.fmt.dbToFloat(r[4]); 
                const d=core.fmt.dbToFloat(r[5]); 
                const l=core.fmt.dbToFloat(r[6]);
                
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
        }
        if(contador === 0) tb.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-gray-400">Nenhum registro encontrado.</td></tr>';
        
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
        document.getElementById('folhaBruto').value = b; 
        document.getElementById('folhaDescontos').value = d;
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
             if((await core.api('excluirFolha', id))?.success) {
                 store.invalidate('folhas');
                 folha.carregarFolhas(true);
             }
        });
    },

    limparFiltro: () => {
        document.getElementById('filtroHistoricoFolha').value = '';
        folha.carregarFolhas(true); 
    },

    // --- ABA OUTROS BANCOS ---
    carregarCacheServidores: async () => {
        if(store.servidores) return; 
        const lista = await core.api('buscarTodosServidores', {}, true); 
        if (lista) store.servidores = lista;
    },

    buscarServidor: (input) => {
        const termo = input.value.toLowerCase();
        const div = document.getElementById('listaSugestoesOB');
        if(termo.length < 2) { div.style.display = 'none'; return; }

        if (!store.servidores) {
            div.innerHTML = '<div class="p-2 text-xs text-gray-400">Carregando base... (Tente em 2s)</div>';
            div.style.display = 'block';
            folha.carregarCacheServidores(); 
            return;
        }

        div.innerHTML = '';
        const resultados = store.servidores.filter(s => s[1].toLowerCase().includes(termo));
        if (resultados.length > 0) {
            div.style.display = 'block';
            resultados.slice(0, 10).forEach(s => {
                 div.innerHTML += `<div class="autocomplete-item p-2 hover:bg-slate-50 cursor-pointer border-b text-sm" onclick="folha.selServ('${s[0]}','${s[1]}','${s[2]}')"><strong>${s[1]}</strong><br><span class="text-xs text-gray-500">${s[2]}</span></div>`;
            });
        } else { div.style.display = 'none'; }
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
        const d = { id: document.getElementById('idRemessaEdicao').value, competencia: document.getElementById('filtroCompOutrosBancos').value, idServidor: document.getElementById('idServidorOB').value, nomeServidor: document.getElementById('nomeServidorOB').value, cpf: document.getElementById('cpfServidorOB').value, banco: document.getElementById('selectBancoOB').value, valor: document.getElementById('valorOB').value, observacoes: document.getElementById('obsOB').value };
        if(!d.competencia) return core.ui.alert('Erro', 'Selecione a competência.', 'erro');
        if(!d.idServidor) return core.ui.alert('Erro', 'Busque um servidor.', 'erro');
        if((await core.api('salvarRemessaOutroBanco', d))?.success) { core.ui.alert('Ok', 'Salvo', 'sucesso'); folha.carregarOutrosBancos(); folha.cancelarEdicaoOB(); }
    },
    carregarOutrosBancos: async () => {
        const comp = document.getElementById('filtroCompOutrosBancos').value;
        if(!comp) return;
        
        if (!store.cacheData['folhas']) await folha.carregarFolhas(true, true);
        let totLiqGeral = 0;
        if(store.cacheData['folhas']) {
            store.cacheData['folhas'].forEach(f => {
                if(core.fmt.toISOMonth(f[1]) === comp) totLiqGeral += core.fmt.dbToFloat(f[6]); 
            });
        }
        document.getElementById('kpiFolhaLiquida').innerText = core.fmt.money(totLiqGeral);

        const lista = await core.api('buscarRemessasOutrosBancos', comp, true); 
        const tb = document.getElementById('listaOutrosBancos');
        tb.innerHTML = '';
        let totOutros = 0;
        
        if(lista && lista.length) {
            document.getElementById('contadorRemessas').innerText = `${lista.length} registros`;
            lista.forEach(r => {
                const val = core.fmt.dbToFloat(r[7]); 
                totOutros += val;
                const nomeSafe = String(r[4]).replace(/'/g, "\\'");
                const obsSafe = String(r[8]||'').replace(/'/g, "\\'");
                tb.innerHTML += `
                <tr class="border-b border-slate-100 hover:bg-slate-50">
                    <td class="pl-5 py-3"><div class="font-bold text-slate-700 text-xs">${r[4]}</div><div class="text-[10px] text-slate-400 font-mono">${r[5]}</div></td>
                    <td class="px-4 py-3 text-xs text-slate-600">${r[6]}</td>
                    <td class="px-4 py-3 text-right font-mono text-xs font-bold text-indigo-700">${core.fmt.money(val)}</td>
                    <td class="pr-5 py-3 text-center"><button onclick="folha.prepOB('${r[0]}','${r[3]}','${nomeSafe}','${r[5]}','${r[6]}','${core.fmt.money(val)}','${obsSafe}')" class="text-blue-500 mr-2"><i class="fa-solid fa-pencil"></i></button><button onclick="folha.delOB('${r[0]}')" class="text-red-500"><i class="fa-solid fa-trash"></i></button></td>
                </tr>`;
            });
        } else {
            document.getElementById('contadorRemessas').innerText = "0 registros";
            tb.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-400">Nenhuma remessa nesta competência.</td></tr>';
        }
        document.getElementById('kpiOutrosBancos').innerText = core.fmt.money(totOutros);
        document.getElementById('kpiBancoPrincipal').innerText = core.fmt.money(totLiqGeral - totOutros);
    },
    prepOB: (id, ids, n, c, b, v, o) => { folha.selServ(ids, n, c); document.getElementById('idRemessaEdicao').value = id; document.getElementById('selectBancoOB').value = b; document.getElementById('valorOB').value = v; document.getElementById('obsOB').value = o; document.getElementById('btnSalvarOB').innerHTML = '<i class="fa-solid fa-save"></i> Atualizar'; document.getElementById('btnCancelOB').classList.remove('hidden'); },
    cancelarEdicaoOB: () => { document.getElementById('formOutrosBancos').reset(); document.getElementById('idRemessaEdicao').value = ''; document.getElementById('detalhesServidorOB').classList.add('hidden'); document.getElementById('btnSalvarOB').innerHTML = '<i class="fa-solid fa-plus"></i> Adicionar'; document.getElementById('btnCancelOB').classList.add('hidden'); },
    delOB: (id) => core.ui.confirm('Excluir', 'Remover?', async()=>{ if((await core.api('excluirRemessaOutroBanco', id))?.success) folha.carregarOutrosBancos(); }),
    importarMesAnterior: () => { core.ui.confirm('Importar', 'Copiar do mês passado?', async()=>{ if((await core.api('importarRemessasAnteriores', document.getElementById('filtroCompOutrosBancos').value))?.success) folha.carregarOutrosBancos(); }); },
    
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
        const processar = (list) => {
             const m = Array.from({length:12}, (_,i)=>({nome: new Date(0,i).toLocaleString('pt-BR',{month:'long'}), b:0, d:0}));
             list.forEach(r => {
                const comp = String(r[1]).replace(/'/g,"");
                if(comp.startsWith(ano)) {
                    const idx = parseInt(comp.split('-')[1]) - 1;
                    if(idx>=0 && idx<=11) {
                        m[idx].b += core.fmt.dbToFloat(r[4]);
                        m[idx].d += core.fmt.dbToFloat(r[5]);
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
        };

        if(store.cacheData['folhas']) processar(store.cacheData['folhas']);
        else core.api('buscarFolhas').then(l => { store.cacheData['folhas'] = l; processar(l); });
    }
};

// --- PLACEHOLDERS ---
const financeiro = { init: ()=>{} }; const config = { carregar:()=>{} }; const arquivos = {}; const irrf = {}; const previdencia = {}; const margem = {}; const consignados = {}; const despesas = {}; const importacao = {}; const relatorios = { carregarCabecalho:()=>{} };

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    core.utils.applyMasks();
    core.utils.initInputs();
    
    core.api('buscarConfiguracoes').then(c => {
        if(c) {
            store.config = c;
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
    setTimeout(() => folha.carregarCacheServidores(), 2000);
});
