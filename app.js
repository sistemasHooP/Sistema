/**
 * SISTEMA RPPS - WEB APP ENGINE (V2.0 MODULAR FLAT)
 * Arquivo: app.js
 * Responsabilidade: Carregar módulos HTML sob demanda e gerenciar a lógica.
 */

// ============================================================================
// 1. CONFIGURAÇÃO DA API
// ============================================================================
const API_URL = "https://script.google.com/macros/s/AKfycby8J-n71uaRQlBcVytqznDhHQGnl1dPbEWjBZIk4ytyQvNviDNAyX0C-SGTimedPbYYkQ/exec"; 
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
            alert(`${t}\n\n${m}`); // Fallback simples para alertas enquanto carrega
        },
        confirm: (t, m, cb) => {
            if(confirm(`${t}\n\n${m}`)) cb();
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

// ============================================================================
// 3. ROTEAMENTO DE MÓDULOS (CARREGAMENTO DE ARQUIVOS)
// ============================================================================
const router = {
    currentModule: null,
    
    loadModule: async (moduleName) => {
        const container = document.getElementById('dynamic-content');
        const pageTitle = document.getElementById('page-title');
        const pageSubtitle = document.getElementById('page-subtitle');
        
        // Feedback Visual
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-slate-400 animate-pulse">
                <i class="fa-solid fa-circle-notch fa-spin text-4xl mb-4 text-blue-500"></i>
                <p>Carregando módulo...</p>
            </div>`;

        try {
            // Busca o arquivo HTML na raiz
            const response = await fetch(`${moduleName}.html`);
            if (!response.ok) throw new Error(`Arquivo ${moduleName}.html não encontrado`);
            
            const html = await response.text();
            container.innerHTML = html;
            router.currentModule = moduleName;

            // Atualiza Menu Ativo
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            const btn = document.querySelector(`button[data-target="${moduleName}"]`);
            if(btn) btn.classList.add('active');

            // Inicialização Específica por Módulo
            if (moduleName === 'home') {
                pageTitle.innerText = "Início";
                pageSubtitle.innerText = "Bem-vindo ao painel de controle.";
                dashboard.init();
            } else if (moduleName === 'operacional') {
                pageTitle.innerText = "Operacional";
                pageSubtitle.innerText = "Gestão de Receitas e Folha.";
                // Init tabs operacionais se necessário
                core.utils.applyMasks();
                core.utils.initInputs();
            } else if (moduleName === 'financeiro') {
                pageTitle.innerText = "Financeiro";
                pageSubtitle.innerText = "Controle de Pagamentos.";
                financeiro.carregarPagamentos();
            } else if (moduleName === 'gestao') {
                pageTitle.innerText = "Gestão";
                pageSubtitle.innerText = "Configurações e Relatórios.";
                // Init tabs gestão
            }

        } catch (e) {
            console.error(e);
            container.innerHTML = `
                <div class="p-8 bg-red-50 border border-red-200 rounded-lg text-center text-red-600">
                    <h3 class="font-bold text-lg mb-2">Erro ao carregar módulo</h3>
                    <p>Não foi possível encontrar o arquivo <strong>${moduleName}.html</strong>.</p>
                    <p class="text-sm mt-2">Verifique se ele está na mesma pasta do index.html.</p>
                </div>`;
        }
    }
};

// ============================================================================
// 4. LÓGICA DE NEGÓCIO (CONSOLIDADA)
// ============================================================================

// --- DASHBOARD (HOME) ---
const dashboard = {
    chart: null,
    dataCache: null,
    init: () => {
        // Exibe data
        const now = new Date();
        const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dataStr = now.toLocaleDateString('pt-BR', opts);
        const elData = document.getElementById('dataExtensoGuia');
        if(elData) elData.innerText = dataStr.charAt(0).toUpperCase() + dataStr.slice(1);
        
        // Carrega dados
        dashboard.carregar();
    },
    carregar: async () => {
        const res = await core.api('buscarDadosDashboard');
        if(res) {
            dashboard.dataCache = res;
            dashboard.popularFiltros();
            dashboard.atualizarGrafico();
        }
    },
    popularFiltros: () => {
        const sel = document.getElementById('biAno');
        if(!sel || !dashboard.dataCache) return;
        // Lógica de popular anos (simplificada)
        sel.innerHTML = `<option value="${new Date().getFullYear()}">${new Date().getFullYear()}</option>`;
    },
    atualizarGrafico: () => {
        const ctx = document.getElementById('chartFinanceiro');
        if(!ctx || !dashboard.dataCache) return;
        
        // Mock de dados para visualização rápida (substitua pela lógica real de processamento)
        if(dashboard.chart) dashboard.chart.destroy();
        dashboard.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
                datasets: [{
                    label: 'Receitas',
                    data: [10, 12, 11, 14, 15, 13, 16, 14, 15, 18, 19, 20], // Exemplo
                    backgroundColor: 'rgba(37, 99, 235, 0.7)'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
};

// --- FINANCEIRO ---
const financeiro = {
    carregarPagamentos: async () => {
        const tb = document.getElementById('listaPagamentos');
        if(!tb) return;
        tb.innerHTML = '<tr><td colspan="8" class="text-center p-4">Carregando...</td></tr>';
        const l = await core.api('buscarPagamentos');
        tb.innerHTML = '';
        if(l && l.length) {
            l.forEach(i => {
                tb.innerHTML += `
                <tr class="border-b hover:bg-slate-50">
                    <td class="p-4"><span class="px-2 py-1 rounded-full text-xs font-bold ${i.status==='PAGO'?'bg-green-100 text-green-700':'bg-red-50 text-red-700'}">${i.status}</span></td>
                    <td class="p-4 text-sm font-mono">${core.fmt.comp(i.competencia)}</td>
                    <td class="p-4"><b>${i.descricao}</b><div class="text-xs text-slate-500">${i.detalhe}</div></td>
                    <td class="p-4 text-right font-mono">${core.fmt.money(i.total)}</td>
                    <td class="p-4 text-right text-red-600 font-bold font-mono">${core.fmt.money(i.saldo)}</td>
                    <td class="p-4 text-center">
                        ${i.status!=='PAGO' ? `<button onclick="financeiro.pagar('${i.id}')" class="bg-emerald-600 text-white px-3 py-1 rounded text-xs">Pagar</button>` : '<i class="fa-solid fa-check text-emerald-500"></i>'}
                    </td>
                </tr>`;
            });
        } else {
            tb.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-gray-400">Nenhum pagamento pendente.</td></tr>';
        }
    },
    pagar: (id) => {
        alert(`Abrir modal para pagar ID: ${id} (Implementar Modal Global)`);
    },
    closeModal: () => document.getElementById('modalPagamento').classList.add('hidden')
};

// Inicialização Global
document.addEventListener('DOMContentLoaded', () => {
    // Busca dados da instituição para a sidebar
    core.api('buscarConfiguracoes').then(c => {
        if(c) {
            document.getElementById('sidebar-institution-name').innerText = c.nome;
            document.getElementById('sidebar-cnpj').innerText = c.cnpj;
        }
    });
    
    // Carrega a página inicial
    router.loadModule('home');
});
