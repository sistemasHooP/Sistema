/**
 * SISTEMA RPPS - WEB APP ENGINE (V2.2 FOLHA FOCUSED)
 * Arquivo: app.js
 * Atualização: Nova URL da API e lógica refinada para Folha de Pagamento.
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
    api: async (action, payload = {}) => {
        core.ui.toggleLoading(true);
        try {
            const response = await fetch(API_URL, {
                method: "POST", redirect: "follow",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action, payload, token: API_TOKEN })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            core.ui.toggleLoading(false);
            if (!data) return null;
            if (data.success === false) { 
                core.ui.alert('Atenção', data.message || "Erro no servidor.", 'erro');
                return null;
            }
            return data; 
        } catch (error) {
            core.ui.toggleLoading(false);
            console.error("API Error:", error);
            core.ui.alert('Erro de Conexão', "Falha ao contactar o servidor.\nVerifique sua internet.", 'erro');
            return null;
        }
    },
    ui: {
        toggleLoading: (s) => document.getElementById('loading').classList.toggle('hidden', !s),
        alert: (t, m, tp='info') => {
            const el = document.getElementById('sys-modal-alert');
            if(!el) return alert(`${t}\n\n${m}`); // Fallback
            
            document.getElementById('sys-modal-title').innerText = t;
            document.getElementById('sys-modal-desc').innerHTML = m;
            
            const iconBg = document.getElementById('sys-icon-bg');
            const iconI = document.getElementById('sys-icon-i');
            
            // Reset visual
            iconBg.className = "mx-auto flex h-12 w-12 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 transition-colors duration-300";
            iconI.className = "fa-solid text-lg";

            if (tp === 'erro') { iconBg.classList.add('bg-red-100'); iconI.classList.add('fa-triangle-exclamation', 'text-red-600'); }
            else if (tp === 'sucesso') { iconBg.classList.add('bg-green-100'); iconI.classList.add('fa-check', 'text-green-600'); }
            else { iconBg.classList.add('bg-blue-100'); iconI.classList.add('fa-info', 'text-blue-600'); }

            document.getElementById('sys-modal-actions').innerHTML = `<button type="button" onclick="core.ui.closeAlert()" class="btn-primary w-full sm:w-auto bg-slate-800">OK</button>`;
            
            el.classList.remove('hidden');
        },
        confirm: (t, m, cb) => {
            core.ui.alert(t, m);
            document.getElementById('sys-icon-bg').className = "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10";
            document.getElementById('sys-icon-i').className = "fa-solid fa-question text-yellow-600 text-lg";
            
            const acts = document.getElementById('sys-modal-actions');
            acts.innerHTML = '';
            const bS = document.createElement('button'); bS.className="btn-primary bg-blue-600 mr-2"; bS.innerText="Sim"; bS.onclick=()=>{core.ui.closeAlert(); cb();};
            const bN = document.createElement('button'); bN.className="btn-secondary"; bN.innerText="Não"; bN.onclick=core.ui.closeAlert;
            acts.append(bS, bN);
        },
        closeAlert: () => document.getElementById('sys-modal-alert').classList.add('hidden')
    },
    fmt: {
        money: (v) => (Number(v)||0).toLocaleString("pt-BR", {style:"currency", currency:"BRL"}),
        moneyParse: (v) => { if(typeof v==='number')return v; return parseFloat(String(v).replace(/\./g,'').replace(',','.'))||0; },
        dateBR: (d) => { if(!d)return'-'; const dt=new Date(d); return isNaN(dt)?String(d).substr(0,10):new Date(dt.getTime()+dt.getTimezoneOffset()*60000).toLocaleDateString('pt-BR'); },
        comp: (c) => { if(!c)return'-'; const s=String(c).replace(/'/g,""); const p=s.split('-'); return p.length===2?`${p[1]}/${p[0]}`:s; },
        round: (v) => Math.round(v*100)/100
    },
    utils: {
        applyMasks: () => {
            document.querySelectorAll('.mask-money').forEach(i => i.addEventListener('input', e => {
                let v = e.target.value.replace(/\D/g,""); e.target.value = (Number(v)/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
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
        const pageTitle = document.getElementById('page-title');
        
        container.innerHTML = `<div class="flex flex-col items-center justify-center h-64 text-slate-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin text-4xl mb-4 text-blue-500"></i><p>Carregando ${moduleName}...</p></div>`;

        try {
            const response = await fetch(`${moduleName}.html`);
            if (!response.ok) throw new Error(`Módulo ${moduleName} não encontrado`);
            
            const html = await response.text();
            container.innerHTML = html;

            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            const btn = document.querySelector(`button[data-target="${moduleName}"]`);
            if(btn) btn.classList.add('active');

            // Inicialização por Módulo
            if (moduleName === 'home') {
                pageTitle.innerText = "Início";
                dashboard.init();
            } else if (moduleName === 'folha') {
                pageTitle.innerText = "Folha de Pagamento";
                folha.switchView('operacional'); // Inicia na primeira aba
                core.utils.applyMasks();
                core.utils.initInputs();
            } else if (moduleName === 'financeiro') {
                pageTitle.innerText = "Financeiro";
                financeiro.carregarPagamentos();
            } else if (moduleName === 'gestao') {
                pageTitle.innerText = "Gestão";
            }

        } catch (e) {
            console.error(e);
            container.innerHTML = `<div class="p-8 bg-red-50 text-red-600 rounded-lg">Erro ao carregar <strong>${moduleName}.html</strong>.</div>`;
        }
    }
};

// ============================================================================
// 4. MÓDULO FOLHA (LÓGICA)
// ============================================================================
const folha = {
    // Alternância de Abas
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
             // Inicia input de competência se vazio
             const inp = document.getElementById('filtroCompOutrosBancos');
             if(inp && !inp.value) inp.value = new Date().toISOString().substring(0,7);
        } else {
             folha.renderizarRelatorio();
        }
    },

    // --- ABA GERAL ---
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
                // Filtro Local
                const compRow = String(r[1]).replace(/'/g, "");
                if(filtro && compRow !== filtro) return;

                contador++;
                const b=core.fmt.moneyParse(r[4]); const d=core.fmt.moneyParse(r[5]); const l=core.fmt.moneyParse(r[6]);
                tB+=b; tD+=d; tL+=l;
                
                // Escapes
                const obs = String(r[7]||'').replace(/'/g, "\\'").replace(/\n/g, " ");
                const compClean = compRow;

                tb.innerHTML += `
                <tr class="hover:bg-yellow-50/30 border-b border-gray-100 transition">
                    <td class="pl-8 py-4 font-bold text-slate-700">${core.fmt.comp(r[1])}</td>
                    <td class="px-4 py-4"><span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-[10px] font-bold uppercase">${r[3]}</span></td>
                    <td class="px-4 py-4 text-right text-gray-600 font-mono">${core.fmt.money(b)}</td>
                    <td class="px-4 py-4 text-right text-red-500 font-mono">-${core.fmt.money(d)}</td>
                    <td class="px-4 py-4 text-right font-black text-slate-800 bg-slate-50/30 font-mono">${core.fmt.money(l)}</td>
                    <td class="pr-8 py-4 text-center">
                        <button onclick="folha.prepararEdicao('${r[0]}','${compClean}','${r[3]}','${b}','${d}','${obs}')" class="text-amber-600 hover:bg-amber-50 p-2 rounded mr-1"><i class="fa-solid fa-pencil"></i></button>
                        <button onclick="folha.excluir('${r[0]}')" class="text-red-500 hover:bg-red-50 p-2 rounded"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
            });
            if(contador === 0) tb.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-gray-400">Nenhum registro para o filtro.</td></tr>';
        } else {
            tb.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-gray-400">Vazio.</td></tr>';
        }
        
        // Atualiza rodapé
        if(document.getElementById('totalCompFolhaBruto')) {
            document.getElementById('totalCompFolhaBruto').innerText = core.fmt.money(tB);
            document.getElementById('totalCompFolhaDesc').innerText = core.fmt.money(tD);
            document.getElementById('totalCompFolhaLiq').innerText = core.fmt.money(tL);
        }
    },
    prepararEdicao: (id, c, t, b, d, o) => {
        document.getElementById('idFolhaEdicao').value = id;
        document.getElementById('inputCompetenciaFolha').value = c;
        document.getElementById('selectTipoFolha').value = t;
        document.getElementById('folhaBruto').value = core.fmt.money(b);
        document.getElementById('folhaDescontos').value = core.fmt.money(d);
        document.getElementById('inputObsFolha').value = o;
        folha.calcularLiquido();
        document.getElementById('btnSalvarFolha').innerHTML = '<i class="fa-solid fa-save mr-2"></i> Atualizar';
        document.getElementById('btnCancelFolha').classList.remove('hidden');
        document.querySelector('.card-dashboard').scrollIntoView({ behavior: 'smooth' });
    },
    cancelarEdicao: () => {
        document.getElementById('formFolha').reset();
        document.getElementById('idFolhaEdicao').value = '';
        folha.calcularLiquido(); // Reseta display
        document.getElementById('btnSalvarFolha').innerHTML = '<i class="fa-solid fa-check mr-2"></i> Salvar Lançamento';
        document.getElementById('btnCancelFolha').classList.add('hidden');
        core.utils.initInputs(); // Restaura data atual
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
    buscarServidor: (input) => {
        const termo = input.value;
        if(termo.length < 3) return;
        core.api('buscarTodosServidores').then(lista => {
             const div = document.getElementById('listaSugestoesOB');
             div.innerHTML = '';
             div.style.display = 'block';
             lista.filter(s => s[1].toLowerCase().includes(termo.toLowerCase())).forEach(s => {
                 div.innerHTML += `<div class="autocomplete-item p-2 hover:bg-slate-50 cursor-pointer" onclick="folha.selServ('${s[0]}','${s[1]}','${s[2]}')"><strong>${s[1]}</strong><br><span class="text-xs text-gray-500">${s[2]}</span></div>`;
             });
        });
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
        
        // Carrega KPIs primeiro (Total Folha e Total Outros)
        // O backend buscarRemessas devolve apenas a lista. Precisamos de lógica extra para KPI?
        // Sim, vamos usar buscarFolhas para somar o total geral da competência
        
        const folhas = await core.api('buscarFolhas');
        let totLiqGeral = 0;
        if(folhas) {
            folhas.forEach(f => {
                if(String(f[1]).replace(/'/g,"") === comp) totLiqGeral += core.fmt.moneyParse(f[6]);
            });
        }
        document.getElementById('kpiFolhaLiquida').innerText = core.fmt.money(totLiqGeral);

        // Agora carrega as remessas
        const lista = await core.api('buscarRemessasOutrosBancos', comp);
        const tb = document.getElementById('listaOutrosBancos');
        tb.innerHTML = '';
        let totOutros = 0;
        
        if(lista && lista.length) {
            document.getElementById('contadorRemessas').innerText = `${lista.length} registros`;
            lista.forEach(r => {
                const val = core.fmt.moneyParse(r[7]);
                totOutros += val;
                
                // Escapes
                const nomeSafe = String(r[4]).replace(/'/g, "\\'");
                const obsSafe = String(r[8]||'').replace(/'/g, "\\'");

                tb.innerHTML += `
                <tr class="border-b border-slate-100 hover:bg-slate-50">
                    <td class="pl-5 py-3"><div class="font-bold text-slate-700 text-xs">${r[4]}</div><div class="text-[10px] text-slate-400 font-mono">${r[5]}</div></td>
                    <td class="px-4 py-3 text-xs text-slate-600">${r[6]}</td>
                    <td class="px-4 py-3 text-right font-mono text-xs font-bold text-indigo-700">${core.fmt.money(val)}</td>
                    <td class="pr-5 py-3 text-center">
                        <button onclick="folha.prepOB('${r[0]}','${r[3]}','${nomeSafe}','${r[5]}','${r[6]}','${val}','${obsSafe}')" class="text-blue-500 mr-2"><i class="fa-solid fa-pencil"></i></button>
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
        document.getElementById('valorOB').value = core.fmt.money(v);
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
        
        // Carrega anos no select
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
            document.getElementById('totalAnoDesc').innerText = core.fmt.money(tD);
            document.getElementById('totalAnoLiq').innerText = core.fmt.money(tB-tD);
        });
    },
    processarDadosRelatorio: () => folha.renderizarRelatorio()
};

// --- HOME (DASHBOARD) ---
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
        s.innerHTML = `<option value="${y}">${y}</option><option value="${y-1}">${y-1}</option>`;
    },
    atualizarGrafico: () => {
        const ctx = document.getElementById('chartFinanceiro');
        if(!ctx || !dashboard.dataCache) return;
        
        // Simulação de dados (Substituir pela lógica real de processamento do array)
        const labels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        // Aqui você processaria dashboard.dataCache para preencher os arrays
        const dadosMock = [10, 15, 12, 18, 20, 15, 22, 25, 20, 28, 30, 35];

        if(dashboard.chart) dashboard.chart.destroy();
        dashboard.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Receita x Despesa', data: dadosMock, backgroundColor: 'rgba(59, 130, 246, 0.5)', borderColor: 'blue', borderWidth: 1 }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
};

// --- OUTROS MÓDULOS (Stubs para evitar erro ao clicar na Sidebar) ---
const financeiro = { carregarPagamentos: () => {}, closeModal: () => document.getElementById('modalPagamento').classList.add('hidden') };
const config = { carregar: () => {} };
const relatorios = { carregarCabecalho: () => {} };

// Inicialização Global
document.addEventListener('DOMContentLoaded', () => {
    core.utils.applyMasks(); 
    core.utils.initInputs();
    
    // Dados da Sidebar
    core.api('buscarConfiguracoes').then(c => {
        if(c) {
            document.getElementById('sidebar-institution-name').innerText = c.nome;
            document.getElementById('sidebar-cnpj').innerText = c.cnpj;
        }
    });

    // Inicia na Home
    if(typeof router !== 'undefined') router.loadModule('home');
});
