/**
 * SISTEMA RPPS - WEB APP ENGINE (V2.1 FIX CRASH)
 * Arquivo: app.js
 * Correção: Ordem de definição de objetos para evitar ReferenceError.
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
            
            // Reset classes
            iconBg.className = "mx-auto flex h-12 w-12 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 transition-colors duration-300";
            iconI.className = "fa-solid text-lg";

            if (tp === 'erro') { iconBg.classList.add('bg-red-100'); iconI.classList.add('fa-triangle-exclamation', 'text-red-600'); }
            else if (tp === 'sucesso') { iconBg.classList.add('bg-green-100'); iconI.classList.add('fa-check', 'text-green-600'); }
            else { iconBg.classList.add('bg-blue-100'); iconI.classList.add('fa-info', 'text-blue-600'); }

            document.getElementById('sys-modal-actions').innerHTML = `<button type="button" onclick="core.ui.closeAlert()" class="btn-primary w-full sm:w-auto bg-slate-800">OK</button>`;
            
            modal.classList.remove('hidden');
            document.getElementById('sys-modal-backdrop').classList.remove('opacity-0');
            document.getElementById('sys-modal-panel').classList.remove('opacity-0', 'translate-y-4', 'scale-95');
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
        closeAlert: () => {
            document.getElementById('sys-modal-backdrop').classList.add('opacity-0');
            document.getElementById('sys-modal-panel').classList.add('opacity-0', 'translate-y-4', 'scale-95');
            setTimeout(() => document.getElementById('sys-modal-alert').classList.add('hidden'), 300);
        }
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

const router = {
    navigate: (pid) => {
        document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        
        const tgt = document.getElementById(`page-${pid}`); if(tgt) tgt.classList.remove('hidden');
        const btn = document.getElementById(`btn-${pid}`); if(btn) btn.classList.add('active');
        
        const titles = { 'guia-rapido':'Início', 'dashboard':'Visão Geral', 'recolhimento':'Receitas', 'folha':'Folha', 'imposto-renda':'IRRF', 'prev-municipal':'Prev. Municipal', 'margem':'Margem', 'consignados':'Consignados', 'despesas':'Despesas', 'pagamentos':'Financeiro', 'relatorios':'Relatórios', 'arquivos':'GED', 'importacao':'Importação', 'config':'Configurações' };
        const tEl = document.getElementById('page-title'); if(tEl) tEl.innerText = titles[pid] || 'Sistema RPPS';

        if(pid==='dashboard') dashboard.carregar();
        if(pid==='pagamentos') financeiro.carregarPagamentos();
        if(pid==='config') config.carregar();
        if(pid==='relatorios') relatorios.carregarCabecalho();
    },
    loadModule: (name) => {
        // Modo Flat: Apenas navega, pois tudo está no index.html
        // Manteve-se o nome da função para compatibilidade com os onclik do HTML
        let targetId = name;
        if(name === 'home') targetId = 'guia-rapido';
        // Mapeamento de módulos para páginas
        if(name === 'operacional') targetId = 'recolhimento'; // Default operacional
        if(name === 'financeiro') targetId = 'pagamentos'; // Default financeiro
        if(name === 'gestao') targetId = 'relatorios'; // Default gestao
        
        router.navigate(targetId);
    }
};

// ============================================================================
// 3. MÓDULOS DE NEGÓCIO (DEFINIÇÃO SEGURA)
// ============================================================================

const dashboard = {
    chart: null, dataCache: null,
    carregar: async () => {
        const res = await core.api('buscarDadosDashboard');
        if(res) { dashboard.dataCache=res; dashboard.popularFiltros(); dashboard.atualizarGrafico(); }
    },
    popularFiltros: () => {
        const s = document.getElementById('biAno'); if(!s || !dashboard.dataCache) return;
        const set = new Set([new Date().getFullYear()]);
        [...(dashboard.dataCache.folhas||[]), ...(dashboard.dataCache.guias||[]), ...(dashboard.dataCache.despesas||[])].forEach(i => { if(i.competencia) set.add(parseInt(i.competencia.substr(0,4))); });
        s.innerHTML=''; Array.from(set).sort((a,b)=>b-a).forEach(a => s.innerHTML+=`<option value="${a}">${a}</option>`);
    },
    atualizarGrafico: () => {
        if(!dashboard.dataCache) return;
        const ctx = document.getElementById('chartFinanceiro'); if(!ctx)return;
        const ano = document.getElementById('biAno').value;
        const dadosA = dashboard.procSerie(document.getElementById('biSerieA').value, ano);
        const dadosB = dashboard.procSerie(document.getElementById('biSerieB').value, ano);
        const tA = dadosA.reduce((a,b)=>a+b,0); const tB = dadosB.reduce((a,b)=>a+b,0);
        document.getElementById('valTotalA').innerText=core.fmt.money(tA); document.getElementById('valTotalB').innerText=core.fmt.money(tB); document.getElementById('valDiferenca').innerText=core.fmt.money(tA-tB);
        if(dashboard.chart) dashboard.chart.destroy();
        dashboard.chart = new Chart(ctx, {
            type: document.getElementById('biTipoGrafico').value,
            data: { labels:['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'], datasets:[{label:'Série A',data:dadosA,backgroundColor:'blue'},{label:'Série B',data:dadosB,backgroundColor:'orange'}] },
            options: { maintainAspectRatio: false }
        });
    },
    procSerie: (t, a) => {
        const m = Array(12).fill(0);
        const somar = (c, v) => { if(c && c.startsWith(a)) m[parseInt(c.split('-')[1])-1] += (Number(v)||0); };
        const d = dashboard.dataCache;
        if(t==='folha_bruto') d.folhas.forEach(f=>somar(f.competencia, f.bruto));
        if(t==='guias_total') d.guias.forEach(g=>somar(g.competencia, g.total));
        if(t==='despesas_total') d.despesas.forEach(x=>somar(x.competencia, x.total));
        if(t==='pagamentos_total') { d.guias.forEach(g=>{if(g.status==='PAGO')somar(g.competencia,g.total)}); d.despesas.forEach(x=>{if(x.status==='PAGO')somar(x.competencia,x.total)}); }
        return m.map(core.fmt.round);
    },
    mudarTipoGrafico: () => dashboard.atualizarGrafico()
};

const recolhimento = {
    switchView: (v) => {
        document.getElementById('view-recolhimento-operacional').classList.toggle('hidden', v!=='operacional');
        document.getElementById('view-recolhimento-gerencial').classList.toggle('hidden', v!=='gerencial');
        if(v==='operacional') { recolhimento.carregarHistorico(); recolhimento.carregarRecursos(); }
        else { recolhimento.renderizarRelatorio(); }
    },
    carregarRecursos: async () => {
        const l = await core.api('getRecursos'); const s = document.getElementById('selectRecurso');
        if(s&&l) { s.innerHTML='<option value="">Selecione...</option>'; l.forEach(r=>s.innerHTML+=`<option value="${r}">${r}</option>`); }
    },
    addRecurso: async () => { const i=document.getElementById('novoRecurso'); if(i.value){ await core.api('addRecurso',i.value); i.value=''; config.carregarListas(); } },
    calcularTotal: () => {
        const v1 = core.fmt.moneyParse(document.getElementById('valorPatronal').value);
        const v2 = core.fmt.moneyParse(document.getElementById('valorSegurado').value);
        document.getElementById('displayTotal').innerText = core.fmt.money(v1+v2);
    },
    handleSave: (e) => {
        e.preventDefault(); const f=e.target;
        core.ui.confirm('Salvar', 'Gravar guia?', async()=>{
            const d = { id:document.getElementById('idGuiaEdicao').value, competencia:f.competencia.value, tipoRecurso:f.tipoRecurso.value, tipoGuia:f.tipoGuia.value, basePatronal:f.basePatronal.value, baseSegurado:f.baseSegurado.value, valorPatronal:f.valorPatronal.value, valorSegurado:f.valorSegurado.value, observacoes:f.observacoes.value };
            if((await core.api('salvarRecolhimento',d))?.success) { core.ui.alert('Ok','Salvo!','sucesso'); recolhimento.cancelarEdicao(); recolhimento.carregarHistorico(); }
        });
    },
    carregarHistorico: async () => {
        const tb = document.getElementById('listaHistoricoGuias'); tb.innerHTML='<tr><td colspan="6" class="text-center p-4">Carregando...</td></tr>';
        const l = await core.api('buscarGuiasRecolhimento'); tb.innerHTML='';
        let tot=0; if(l&&l.length){ l.forEach(r=>{ tot+=core.fmt.moneyParse(r[9]); tb.innerHTML+=`<tr><td class="pl-6 py-3">${core.fmt.comp(r[1])}</td><td>${r[4]}</td><td>${r[3]}</td><td class="text-right font-bold">${core.fmt.money(r[9])}</td><td class="text-center">${r[10]}</td><td class="text-center"><button onclick="recolhimento.prepararEdicao('${r[0]}','${r[1]}','${r[3]}','${r[4]}','${r[5]}','${r[6]}','${r[7]}','${r[8]}','${r[13]}')" class="text-blue-500"><i class="fa-solid fa-pencil"></i></button></td></tr>`; }); document.getElementById('totalCompetenciaGuia').innerText=core.fmt.money(tot); } else tb.innerHTML='<tr><td colspan="6" class="text-center">Nada encontrado.</td></tr>';
    },
    prepararEdicao: (id,c,r,t,bp,bs,vp,vs,obs) => {
        document.getElementById('idGuiaEdicao').value=id; document.getElementById('inputCompetenciaGuia').value=c.replace(/'/g,'');
        document.getElementById('selectRecurso').value=r; document.querySelector('#formRecolhimento select[name="tipoGuia"]').value=t;
        document.getElementById('basePatronal').value=core.fmt.money(bp); document.getElementById('baseSegurado').value=core.fmt.money(bs);
        document.getElementById('valorPatronal').value=core.fmt.money(vp); document.getElementById('valorSegurado').value=core.fmt.money(vs);
        document.querySelector('#formRecolhimento textarea').value=obs;
        recolhimento.calcularTotal(); document.getElementById('btnSalvarGuia').innerText="Atualizar"; document.getElementById('btnCancelGuia').classList.remove('hidden');
    },
    cancelarEdicao: () => { document.getElementById('formRecolhimento').reset(); document.getElementById('idGuiaEdicao').value=''; document.getElementById('btnSalvarGuia').innerHTML='Salvar'; document.getElementById('btnCancelGuia').classList.add('hidden'); },
    limparFiltro: () => { document.getElementById('filtroHistoricoGuia').value=''; recolhimento.carregarHistorico(); },
    renderizarRelatorio: () => { /* Logica de matriz */ }
};

const folha = {
    switchView: (v) => {
        document.getElementById('view-folha-operacional').classList.toggle('hidden', v!=='operacional');
        document.getElementById('view-folha-outros-bancos').classList.toggle('hidden', v!=='outros-bancos');
        document.getElementById('view-folha-gerencial').classList.toggle('hidden', v!=='gerencial');
        if(v==='operacional') { folha.carregarNomes(); folha.carregarFolhas(); }
        else if(v==='outros-bancos') { folha.carregarOutrosBancos(); }
    },
    carregarNomes: async () => { const l=await core.api('getNomesFolha'); const s=document.getElementById('selectTipoFolha'); if(s&&l) { s.innerHTML='<option value="">Selecione...</option>'; l.forEach(r=>s.innerHTML+=`<option value="${r}">${r}</option>`); } },
    addNomeFolha: async () => { const i=document.getElementById('novoNomeFolha'); if(i.value){ await core.api('addNomeFolha',i.value); i.value=''; config.carregarListas(); } },
    calcularLiquido: () => {
        const b = core.fmt.moneyParse(document.getElementById('folhaBruto').value);
        const d = core.fmt.moneyParse(document.getElementById('folhaDescontos').value);
        document.getElementById('displayLiquido').innerText = core.fmt.money(b-d);
    },
    handleSave: (e) => {
        e.preventDefault(); const f=e.target;
        core.ui.confirm('Salvar','Gravar folha?',async()=>{
            const d={id:document.getElementById('idFolhaEdicao').value, competencia:f.competencia.value, tipoFolha:f.tipoFolha.value, valorBruto:f.valorBruto.value, valorDescontos:f.valorDescontos.value, observacoes:f.observacoes.value};
            if((await core.api('salvarFolha',d))?.success) { core.ui.alert('Ok','Salvo','sucesso'); folha.cancelarEdicao(); folha.carregarFolhas(); }
        });
    },
    carregarFolhas: async () => {
        const tb=document.getElementById('listaFolhas'); tb.innerHTML='Loading...';
        const l=await core.api('buscarFolhas'); tb.innerHTML='';
        if(l&&l.length) l.forEach(r => tb.innerHTML+=`<tr><td>${core.fmt.comp(r[1])}</td><td>${r[3]}</td><td class="text-right">${core.fmt.money(r[4])}</td><td class="text-right text-red-500">${core.fmt.money(r[5])}</td><td class="text-right font-bold">${core.fmt.money(r[6])}</td><td class="text-center"><button onclick="folha.prepararEdicao('${r[0]}','${r[1]}','${r[3]}','${r[4]}','${r[5]}','${r[7]}')" class="text-amber-500"><i class="fa-solid fa-pencil"></i></button></td></tr>`);
        else tb.innerHTML='<tr><td colspan="6" class="text-center">Vazio</td></tr>';
    },
    prepararEdicao: (id,c,t,b,d,o) => {
        document.getElementById('idFolhaEdicao').value=id; document.getElementById('inputCompetenciaFolha').value=c.replace(/'/g,'');
        document.getElementById('selectTipoFolha').value=t; document.getElementById('folhaBruto').value=core.fmt.money(b);
        document.getElementById('folhaDescontos').value=core.fmt.money(d); document.getElementById('inputObsFolha').value=o;
        folha.calcularLiquido(); document.getElementById('btnSalvarFolha').innerText="Atualizar"; document.getElementById('btnCancelFolha').classList.remove('hidden');
    },
    cancelarEdicao: () => { document.getElementById('formFolha').reset(); document.getElementById('idFolhaEdicao').value=''; document.getElementById('btnSalvarFolha').innerText='Salvar'; document.getElementById('btnCancelFolha').classList.add('hidden'); },
    limparFiltro: () => { document.getElementById('filtroHistoricoFolha').value=''; folha.carregarFolhas(); },
    
    // Outros Bancos
    buscarServidor: (i) => {
        if(i.value.length<3)return;
        core.api('buscarTodosServidores').then(l=>{
            const d=document.getElementById('listaSugestoesOB'); d.innerHTML=''; d.style.display='block';
            l.filter(s=>s[1].toLowerCase().includes(i.value.toLowerCase())).forEach(s=>d.innerHTML+=`<div class="autocomplete-item" onclick="folha.selServ('${s[0]}','${s[1]}','${s[2]}')">${s[1]}</div>`);
        });
    },
    selServ: (id,n,c) => {
        document.getElementById('idServidorOB').value=id; document.getElementById('nomeServidorOB').value=n; document.getElementById('cpfServidorOB').value=c;
        document.getElementById('buscaServidorOB').value=n; document.getElementById('listaSugestoesOB').style.display='none';
        document.getElementById('detalhesServidorOB').classList.remove('hidden'); document.getElementById('lblNomeOB').innerText=n;
    },
    handleSaveOutrosBancos: async (e) => {
        e.preventDefault();
        const d = { id:document.getElementById('idRemessaEdicao').value, competencia:document.getElementById('filtroCompOutrosBancos').value, idServidor:document.getElementById('idServidorOB').value, nomeServidor:document.getElementById('nomeServidorOB').value, cpf:document.getElementById('cpfServidorOB').value, banco:document.getElementById('selectBancoOB').value, valor:document.getElementById('valorOB').value, observacoes:document.getElementById('obsOB').value };
        if((await core.api('salvarRemessaOutroBanco',d))?.success) { core.ui.alert('Ok','Salvo','sucesso'); folha.carregarOutrosBancos(); folha.cancelarEdicaoOB(); }
    },
    carregarOutrosBancos: async () => {
        const c = document.getElementById('filtroCompOutrosBancos').value; if(!c)return;
        const l = await core.api('buscarRemessasOutrosBancos', c);
        const tb = document.getElementById('listaOutrosBancos'); tb.innerHTML='';
        if(l) {
            document.getElementById('contadorRemessas').innerText=`${l.length} regs`;
            l.forEach(r => tb.innerHTML+=`<tr><td>${r[4]}<br><small>${r[5]}</small></td><td>${r[6]}</td><td class="text-right">${core.fmt.money(r[7])}</td><td class="text-center"><button class="text-blue-500" onclick="folha.prepOB('${r[0]}','${r[3]}','${r[4]}','${r[5]}','${r[6]}','${r[7]}','${r[8]}')"><i class="fa-solid fa-pencil"></i></button></td></tr>`);
        }
    },
    prepOB: (id,ids,n,c,b,v,o) => { folha.selServ(ids,n,c); document.getElementById('idRemessaEdicao').value=id; document.getElementById('selectBancoOB').value=b; document.getElementById('valorOB').value=core.fmt.money(v); document.getElementById('obsOB').value=o; document.getElementById('btnSalvarOB').innerText='Atualizar'; document.getElementById('btnCancelOB').classList.remove('hidden'); },
    cancelarEdicaoOB: () => { document.getElementById('formOutrosBancos').reset(); document.getElementById('idRemessaEdicao').value=''; document.getElementById('detalhesServidorOB').classList.add('hidden'); document.getElementById('btnSalvarOB').innerText='Adicionar'; document.getElementById('btnCancelOB').classList.add('hidden'); },
    importarMesAnterior: () => { core.ui.confirm('Importar','Copiar do mês anterior?',async()=>{ if((await core.api('importarRemessasAnteriores',document.getElementById('filtroCompOutrosBancos').value))?.success) folha.carregarOutrosBancos(); }); }
};

const financeiro = {
    carregarPagamentos: async () => {
        const tb=document.getElementById('listaPagamentos'); tb.innerHTML='<tr><td colspan="8" class="text-center">Carregando...</td></tr>';
        const l=await core.api('buscarPagamentos'); tb.innerHTML='';
        if(l&&l.length) l.forEach(i => {
            tb.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="text-center"><input type="checkbox" name="selecaoLote" value="${i.id}" onchange="financeiro.attLote()"></td><td><span class="status-badge ${i.status==='PAGO'?'status-pago':'status-pendente'}">${i.status}</span></td><td>${core.fmt.comp(i.competencia)}</td><td><b>${i.descricao}</b><br><small>${i.detalhe}</small></td><td class="text-right">${core.fmt.money(i.total)}</td><td class="text-right text-emerald-600">${core.fmt.money(i.pago)}</td><td class="text-right text-red-600 font-bold">${core.fmt.money(i.saldo)}</td><td class="text-center">${i.status!=='PAGO'?`<button onclick="financeiro.modal('${i.id}','${i.total}','${i.saldo}','${i.descricao}')" class="btn-primary py-1 px-2 text-xs">Pagar</button>`:'<i class="fa-solid fa-check text-emerald-500"></i>'}</td></tr>`;
        }); else tb.innerHTML='<tr><td colspan="8" class="text-center">Sem pendências.</td></tr>';
    },
    modal: (id,t,s,n) => {
        document.getElementById('modalIdHidden').value=id; document.getElementById('modalNomeGuia').innerText=n;
        document.getElementById('modalValorTotal').innerText=core.fmt.money(t); document.getElementById('modalSaldoRestante').innerText=core.fmt.money(s);
        document.getElementById('modalValorPago').value=core.fmt.money(s); document.getElementById('modalData').valueAsDate=new Date();
        document.getElementById('modalPagamento').classList.remove('hidden');
        core.api('buscarHistoricoPagamentos', id).then(h => {
             const hb=document.getElementById('historicoPagamentosBody'); hb.innerHTML='';
             if(h) h.forEach(p=>hb.innerHTML+=`<tr><td>${core.fmt.dateBR(p.data)}</td><td class="text-right">${core.fmt.money(p.valor)}</td></tr>`);
        });
    },
    closeModal: () => document.getElementById('modalPagamento').classList.add('hidden'),
    confirmarPagamento: async (e) => {
        e.preventDefault();
        const d={idGuia:document.getElementById('modalIdHidden').value, valorPago:document.getElementById('modalValorPago').value, dataPagamento:document.getElementById('modalData').value};
        financeiro.closeModal();
        if((await core.api('processarPagamento',d))?.success) { core.ui.alert('Ok','Pago!','sucesso'); financeiro.carregarPagamentos(); }
    },
    attLote: () => { const c=document.querySelectorAll('input[name="selecaoLote"]:checked').length; const b=document.getElementById('barraAcaoLote'); if(b && c>0){b.classList.remove('hidden');b.classList.add('flex');document.getElementById('contadorSelecao').innerText=c;} },
    confirmarPagamentoLote: () => {
        const ids=Array.from(document.querySelectorAll('input[name="selecaoLote"]:checked')).map(c=>c.value);
        core.ui.confirm('Lote',`Pagar ${ids.length}?`,async()=>{ if((await core.api('processarPagamentoEmLote',ids))?.success) financeiro.carregarPagamentos(); });
    },
    switchView: (v) => {
        document.getElementById('view-pag-pendentes').classList.toggle('hidden',v!=='pendentes');
        document.getElementById('view-pag-realizados').classList.toggle('hidden',v!=='realizados');
        if(v==='pendentes') financeiro.carregarPagamentos(); else financeiro.carregarHistoricoGeral();
    },
    carregarHistoricoGeral: async () => {
        const tb=document.getElementById('listaHistoricoGeral'); tb.innerHTML='<tr><td colspan="5" class="text-center">Loading...</td></tr>';
        const l=await core.api('buscarHistoricoGeral', document.getElementById('filtroAnoHistorico').value); tb.innerHTML='';
        if(l&&l.length) l.forEach(p=>tb.innerHTML+=`<tr><td>${core.fmt.dateBR(p.data)}</td><td>${p.descricao}</td><td class="text-right">${core.fmt.money(p.valor)}</td><td>${p.usuario}</td><td><button onclick="financeiro.estornar('${p.idPagamento}')" class="text-red-500"><i class="fa-solid fa-trash"></i></button></td></tr>`);
        else tb.innerHTML='<tr><td colspan="5" class="text-center">Vazio.</td></tr>';
    },
    estornar: (id) => core.ui.confirm('Estornar','Cancelar pgto?',async()=>{ if((await core.api('excluirPagamentoRealizado',id))?.success) financeiro.carregarHistoricoGeral(); })
};

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
