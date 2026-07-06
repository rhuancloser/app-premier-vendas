import React, { useState, useEffect, useRef } from 'react';
import { Plus, Upload, BookOpen, Zap, BarChart3, Brain, Trash2, Phone, MessageCircle, Copy, CheckCircle, AlertCircle, Download, Send, Settings, Menu, X } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function AppFinalCompleta() {
  const [knowledge, setKnowledge] = useState({
    materiais: [],
    casos: [],
    padroes: {},
    ultimaAtualizacao: new Date().toLocaleDateString()
  });

  const [leads, setLeads] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadRemoteData = async () => {
      try {
        const { data, error } = await supabase.from('app_state').select('key, value');
        if (!error && data) {
          const knowledgeRow = data.find(r => r.key === 'knowledge');
          const leadsRow = data.find(r => r.key === 'leads');
          if (knowledgeRow) {
            setKnowledge(knowledgeRow.value);
          } else {
            const savedK = localStorage.getItem('appFinalKnowledge');
            if (savedK) setKnowledge(JSON.parse(savedK));
          }
          if (leadsRow) {
            setLeads(leadsRow.value);
          } else {
            const savedL = localStorage.getItem('appFinalLeads');
            if (savedL) setLeads(JSON.parse(savedL));
          }
        }
      } catch (e) {
        const savedK = localStorage.getItem('appFinalKnowledge');
        if (savedK) setKnowledge(JSON.parse(savedK));
        const savedL = localStorage.getItem('appFinalLeads');
        if (savedL) setLeads(JSON.parse(savedL));
      }
      setLoadingData(false);
    };
    loadRemoteData();
  }, []);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [newLead, setNewLead] = useState({ nome: '', restaurante: '', telefone: '' });
  const [newMaterial, setNewMaterial] = useState({ titulo: '', conteudo: '', categoria: 'geral', fonte: 'Premier' });
  const [caseNote, setCaseNote] = useState('');

  const messages = [
    { num: 1, titulo: 'Curiosidade', timing: 'DIA 0', msg: 'Oi [NOME]! Percebi que voce preencheu nosso formulario. Rapido: Voce trabalha apenas com iFood ou tambem usa 99Food e Keeta?' },
    { num: 2, titulo: 'Diagnostico', timing: 'DIA 0-2', msg: 'Entendi! E em media, quanto [RESTAURANTE] consegue faturar por mes nessas plataformas?' },
    { num: 3, titulo: 'Ouch Moment', timing: 'DIA 1-3', msg: 'Perfeito. Vou ser honesto: o problema nao e falta de cadastro, e fazer elas realmente venderem. Ha quanto tempo esta nessa situacao?' },
    { num: 4, titulo: 'Prova Social', timing: 'DIA 2-4', msg: 'Mix Acai, Divino Acai, Caribe - todos na mesma situacao. Quando otimizava o perfil deles, os pedidos subiam. O seu caso soa parecido.' },
    { num: 5, titulo: 'Solucao', timing: 'DIA 3-5', msg: 'Entao: 1. ANALISE 2. DIAGNOSTICO 3. IMPLEMENTACAO 4. ACOMPANHAMENTO. Resultado: +40-60% em 60 dias. Faz sentido?' },
    { num: 6, titulo: 'Oferta + Agendamento', timing: 'DIA 4-6', msg: 'Analise SEM CUSTO, sem compromisso. Qual dia essa semana? Segunda, quarta ou sexta?' },
    { num: 7, titulo: 'Encerramento', timing: 'DIA 6-7', msg: '[NOME], tudo bem se quiser explorar essa opcao depois. Tamo aqui pra ajudar!' }
  ];

  const saveKnowledge = (updated) => {
    setKnowledge(updated);
    localStorage.setItem('appFinalKnowledge', JSON.stringify(updated));
    supabase.from('app_state').upsert({ key: 'knowledge', value: updated, updated_at: new Date().toISOString() }).then(() => {});
  };

  const saveLeads = (updated) => {
    setLeads(updated);
    localStorage.setItem('appFinalLeads', JSON.stringify(updated));
    supabase.from('app_state').upsert({ key: 'leads', value: updated, updated_at: new Date().toISOString() }).then(() => {});
  };

  const addLead = () => {
    if (newLead.nome && newLead.restaurante) {
      const lead = {
        id: Date.now(),
        ...newLead,
        dataCriacao: new Date().toLocaleDateString(),
        mensagens: [false, false, false, false, false, false, false],
        cases: [],
        score: 50
      };
      saveLeads([...leads, lead]);
      setNewLead({ nome: '', restaurante: '', telefone: '' });
      setShowNewLeadForm(false);
    }
  };

  const addMaterial = () => {
    if (newMaterial.titulo && newMaterial.conteudo) {
      const updated = {
        ...knowledge,
        materiais: [
          ...knowledge.materiais,
          {
            id: Date.now(),
            ...newMaterial,
            dataCriacao: new Date().toLocaleDateString(),
          }
        ]
      };
      saveKnowledge(updated);
      setNewMaterial({ titulo: '', conteudo: '', categoria: 'geral', fonte: 'Premier' });
      setShowMaterialForm(false);
    }
  };

  const saveCaseNote = (leadId) => {
    if (caseNote) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        const caseData = {
          id: Date.now(),
          nota: caseNote,
          data: new Date().toLocaleDateString(),
          timestamp: new Date().toLocaleTimeString()
        };

        const updatedLead = {
          ...lead,
          cases: [...lead.cases, caseData]
        };

        const palavrasChave = ['pouco pedido', 'visibilidade', 'cardapio', 'preco', 'novo', 'concorrente'];
        const novosPadroes = { ...knowledge.padroes };

        palavrasChave.forEach(palavra => {
          if (caseNote.toLowerCase().includes(palavra)) {
            novosPadroes[palavra] = (novosPadroes[palavra] || 0) + 1;
          }
        });

        const updatedLeads = leads.map(l => l.id === leadId ? updatedLead : l);
        saveLeads(updatedLeads);

        const updatedKnowledge = {
          ...knowledge,
          casos: [...knowledge.casos, { ...caseData, leadId, leadNome: lead.nome }],
          padroes: novosPadroes
        };
        saveKnowledge(updatedKnowledge);

        setCaseNote('');
        setShowCaseForm(false);
      }
    }
  };

  const calculateScore = (lead) => {
    let score = 50;
    if (lead.mensagens.some(m => m)) score += 10;
    score += lead.cases.length * 5;
    return Math.min(score, 100);
  };

  const gerarRecomendacoes = () => {
    const recomendacoes = [];
    const padroes = knowledge.padroes;

    if (padroes['pouco pedido'] && padroes['pouco pedido'] > 2) {
      recomendacoes.push({
        titulo: 'Padrao: Visibilidade',
        descricao: 'Multiplos casos com pouco pedido',
        acao: 'Use Diagnostico Pilar 1 (SEO)'
      });
    }

    if (padroes['cardapio'] && padroes['cardapio'] > 2) {
      recomendacoes.push({
        titulo: 'Padrao: Cardapio',
        descricao: 'Multiplos casos com cardapio',
        acao: 'Use Implantacao Pilar 2 (Cardapio)'
      });
    }

    if (padroes['novo'] && padroes['novo'] > 2) {
      recomendacoes.push({
        titulo: 'Padrao: Clientes Novos',
        descricao: 'Muitos restaurantes novos',
        acao: 'Recomende Implantacao (comecar certo)'
      });
    }

    return recomendacoes;
  };

  const recomendacoes = gerarRecomendacoes();

  const dashboardTab = (
    <div className="pb-24 space-y-4 p-4">
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 rounded-lg">
        <h2 className="font-bold text-2xl">Dashboard IA Completo</h2>
        <p className="text-sm opacity-90">Automacao + Inteligencia + Aprendizado</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-50 border-2 border-blue-300 p-3 rounded text-center">
          <p className="text-2xl font-bold text-blue-900">{leads.length}</p>
          <p className="text-xs text-blue-700">Leads</p>
        </div>
        <div className="bg-purple-50 border-2 border-purple-300 p-3 rounded text-center">
          <p className="text-2xl font-bold text-purple-900">{leads.filter(l => calculateScore(l) >= 60).length}</p>
          <p className="text-xs text-purple-700">Quentes</p>
        </div>
        <div className="bg-emerald-50 border-2 border-emerald-300 p-3 rounded text-center">
          <p className="text-2xl font-bold text-emerald-900">{knowledge.materiais.length}</p>
          <p className="text-xs text-emerald-700">Materiais</p>
        </div>
        <div className="bg-orange-50 border-2 border-orange-300 p-3 rounded text-center">
          <p className="text-2xl font-bold text-orange-900">{knowledge.casos.length}</p>
          <p className="text-xs text-orange-700">Casos</p>
        </div>
      </div>

      {recomendacoes.length > 0 && (
        <div className="bg-white border-2 border-purple-300 p-4 rounded">
          <h3 className="font-bold mb-2">Recomendacoes IA</h3>
          {recomendacoes.map((r, i) => (
            <div key={i} className="bg-purple-50 p-2 rounded mb-2 text-sm border-l-4 border-purple-500">
              <p className="font-bold text-purple-900">{r.titulo}</p>
              <p className="text-xs text-purple-700">{r.descricao}</p>
              <p className="text-xs font-bold text-purple-800 mt-1">{r.acao}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border-2 border-red-300 p-4 rounded">
        <h3 className="font-bold mb-2">Top Leads Quentes</h3>
        {leads.filter(l => calculateScore(l) >= 60).slice(0, 5).map(lead => (
          <div key={lead.id} className="bg-red-50 p-2 rounded mb-2 text-sm border-l-4 border-red-500">
            <div className="flex justify-between">
              <div>
                <p className="font-bold text-red-900">{lead.nome}</p>
                <p className="text-xs text-red-700">{lead.restaurante}</p>
              </div>
              <span className="bg-white text-red-900 font-bold px-2 rounded">{calculateScore(lead)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const leadsTab = (
    <div className="pb-24">
      <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-b-xl">
        <h2 className="text-xl font-bold">Leads & Vendas</h2>
      </div>
      <button
        onClick={() => setShowNewLeadForm(true)}
        className="m-4 w-[calc(100%-2rem)] bg-emerald-500 text-white py-3 rounded-lg font-bold"
      >
        <Plus className="w-4 h-4 inline mr-2" /> Novo Lead
      </button>
      {showNewLeadForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-4 space-y-3">
            <h3 className="font-bold">Adicionar Lead</h3>
            <input type="text" placeholder="Nome" value={newLead.nome} onChange={(e) => setNewLead({...newLead, nome: e.target.value})} className="w-full border rounded p-2 text-sm" />
            <input type="text" placeholder="Restaurante" value={newLead.restaurante} onChange={(e) => setNewLead({...newLead, restaurante: e.target.value})} className="w-full border rounded p-2 text-sm" />
            <input type="tel" placeholder="Telefone" value={newLead.telefone} onChange={(e) => setNewLead({...newLead, telefone: e.target.value})} className="w-full border rounded p-2 text-sm" />
            <div className="flex gap-2">
              <button onClick={() => setShowNewLeadForm(false)} className="flex-1 bg-gray-200 py-2 rounded font-bold">Cancelar</button>
              <button onClick={addLead} className="flex-1 bg-emerald-500 text-white py-2 rounded font-bold">Adicionar</button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-2 p-4">
        {leads.map(lead => (
          <div
            key={lead.id}
            onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
            className="bg-white border-l-4 border-emerald-500 p-3 rounded cursor-pointer hover:bg-emerald-50"
          >
            <div className="flex justify-between mb-1">
              <div>
                <h3 className="font-bold">{lead.nome}</h3>
                <p className="text-xs text-gray-600">{lead.restaurante}</p>
              </div>
              <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2 rounded">{calculateScore(lead)}</span>
            </div>
            {selectedLead?.id === lead.id && (
              <div className="mt-3 space-y-2 bg-emerald-50 p-3 rounded">
                {messages.map(msg => (
                  <div key={msg.num} className={`text-xs p-2 rounded border-l-2 ${lead.mensagens[msg.num - 1] ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300'}`}>
                    <p className="font-bold mb-1">Msg {msg.num}: {msg.titulo} ({msg.timing})</p>
                    <p className="mb-2">{msg.msg}</p>
                    <div className="flex gap-1">
                      <button onClick={() => navigator.clipboard.writeText(msg.msg)} className="flex-1 bg-blue-500 text-white py-1 rounded text-xs font-bold">Copiar</button>
                      {!lead.mensagens[msg.num - 1] && (
                        <button onClick={() => {
                          const updated = lead.mensagens.slice();
                          updated[msg.num - 1] = true;
                          const newLeads = leads.map(l => l.id === lead.id ? {...l, mensagens: updated} : l);
                          saveLeads(newLeads);
                          setSelectedLead({...lead, mensagens: updated});
                        }} className="flex-1 bg-emerald-500 text-white py-1 rounded text-xs font-bold">Enviada</button>
                      )}
                    </div>
                  </div>
                ))}
                {lead.cases.length > 0 && (
                  <div className="bg-purple-50 p-2 rounded mt-2">
                    <p className="text-xs font-bold text-purple-900 mb-1">Casos Documentados ({lead.cases.length}):</p>
                    {lead.cases.map((c, i) => (
                      <div key={i} className="text-xs text-purple-800 mb-1 p-1 bg-white rounded">{c.data}: {c.nota.substring(0, 50)}...</div>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowCaseForm(lead.id)} className="w-full bg-purple-500 text-white py-2 rounded text-xs font-bold">+ Documentar Caso</button>
                {showCaseForm === lead.id && (
                  <div className="bg-white p-2 rounded mt-2 space-y-2">
                    <textarea placeholder="O que aconteceu neste lead?" value={caseNote} onChange={(e) => setCaseNote(e.target.value)} className="w-full border rounded p-1 text-xs h-16" />
                    <button onClick={() => saveCaseNote(lead.id)} className="w-full bg-purple-500 text-white py-1 rounded text-xs font-bold">Salvar & IA Aprende</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const conhecimentoTab = (
    <div className="pb-24">
      <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-b-xl">
        <h2 className="text-xl font-bold">Base de Conhecimento</h2>
      </div>
      <button
        onClick={() => setShowMaterialForm(true)}
        className="m-4 w-[calc(100%-2rem)] bg-blue-500 text-white py-3 rounded-lg font-bold"
      >
        <Plus className="w-4 h-4 inline mr-2" /> Adicionar Material
      </button>
      {showMaterialForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-4 space-y-3 max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold">Alimentar Base de Conhecimento</h3>
            <input type="text" placeholder="Titulo" value={newMaterial.titulo} onChange={(e) => setNewMaterial({...newMaterial, titulo: e.target.value})} className="w-full border rounded p-2 text-sm" />
            <select value={newMaterial.categoria} onChange={(e) => setNewMaterial({...newMaterial, categoria: e.target.value})} className="w-full border rounded p-2 text-sm">
              <option value="geral">Geral</option>
              <option value="seo">SEO Plataforma</option>
              <option value="cardapio">Engenharia Cardapio</option>
              <option value="diagnostico">Diagnostico</option>
              <option value="implantacao">Implantacao</option>
              <option value="gestao">Gestao Continua</option>
            </select>
            <select value={newMaterial.fonte} onChange={(e) => setNewMaterial({...newMaterial, fonte: e.target.value})} className="w-full border rounded p-2 text-sm">
              <option value="Premier">Premier</option>
              <option value="Seu Conhecimento">Seu Conhecimento</option>
              <option value="Atualizacao">Atualizacao</option>
            </select>
            <textarea placeholder="Conteudo (copie/cole de PDFs)" value={newMaterial.conteudo} onChange={(e) => setNewMaterial({...newMaterial, conteudo: e.target.value})} className="w-full border rounded p-2 text-sm h-24" />
            <div className="flex gap-2">
              <button onClick={() => setShowMaterialForm(false)} className="flex-1 bg-gray-200 py-2 rounded font-bold">Cancelar</button>
              <button onClick={addMaterial} className="flex-1 bg-blue-500 text-white py-2 rounded font-bold">Salvar</button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-2 p-4">
        {knowledge.materiais.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum material ainda. Comece alimentando a IA!</p>
        ) : (
          knowledge.materiais.map(mat => (
            <div key={mat.id} className="bg-white border-l-4 border-blue-500 p-3 rounded">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-sm">{mat.titulo}</h3>
                  <p className="text-xs text-gray-600">{mat.categoria} - {mat.fonte}</p>
                </div>
                <button onClick={() => {
                  const updated = {...knowledge, materiais: knowledge.materiais.filter(m => m.id !== mat.id)};
                  saveKnowledge(updated);
                }} className="text-red-500 text-xs">Excluir</button>
              </div>
              <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded line-clamp-2">{mat.conteudo}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const relatorioTab = (
    <div className="pb-24 space-y-4 p-4">
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 rounded-lg">
        <h2 className="font-bold text-lg">Relatorio Semanal</h2>
      </div>
      <div className="space-y-3">
        <div className="bg-blue-50 border-2 border-blue-300 p-3 rounded text-sm">
          <p className="font-bold text-blue-900">Semana de {knowledge.ultimaAtualizacao}</p>
          <p className="text-xs text-blue-700">Leads: {leads.length} | Casos: {knowledge.casos.length} | Padroes: {Object.keys(knowledge.padroes).length}</p>
        </div>
        {Object.keys(knowledge.padroes).length > 0 && (
          <div className="bg-white border-2 border-purple-300 p-3 rounded">
            <p className="text-sm font-bold mb-2">Padroes Identificados</p>
            {Object.entries(knowledge.padroes).sort(([,a],[,b]) => b - a).map(([p, c]) => (
              <div key={p} className="flex justify-between text-xs py-1 border-b border-purple-200 last:border-0">
                <span>{p}</span>
                <span className="font-bold text-purple-700">{c}x</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => {
          const linhas = [];
          linhas.push('RELATORIO SEMANAL');
          linhas.push(new Date().toLocaleDateString());
          linhas.push('');
          linhas.push('RESUMO:');
          linhas.push('- Total de Leads: ' + leads.length);
          linhas.push('- Leads Quentes: ' + leads.filter(l => calculateScore(l) >= 60).length);
          linhas.push('- Casos Documentados: ' + knowledge.casos.length);
          linhas.push('- Materiais na Base: ' + knowledge.materiais.length);
          linhas.push('');
          linhas.push('PADROES:');
          Object.entries(knowledge.padroes).forEach(([p, c]) => linhas.push('- ' + p + ': ' + c + 'x'));
          linhas.push('');
          linhas.push('RECOMENDACOES:');
          recomendacoes.forEach(r => linhas.push('- ' + r.titulo + ': ' + r.acao));
          const relatorio = linhas.join('\n');
          const blob = new Blob([relatorio], {type: 'text/plain'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'relatorio-' + new Date().toLocaleDateString().replace(/\//g, '-') + '.txt';
          a.click();
        }} className="w-full bg-purple-500 text-white py-3 rounded-lg font-bold">
          <Download className="w-4 h-4 inline mr-2" /> Baixar Relatorio
        </button>
      </div>
    </div>
  );

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-bold">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {activeTab === 'dashboard' && dashboardTab}
      {activeTab === 'leads' && leadsTab}
      {activeTab === 'conhecimento' && conhecimentoTab}
      {activeTab === 'relatorio' && relatorioTab}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex gap-1 p-2">
        <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-1 ${activeTab === 'dashboard' ? 'bg-purple-500 text-white' : 'bg-gray-100'}`}>
          <Brain className="w-4 h-4" /> IA
        </button>
        <button onClick={() => setActiveTab('leads')} className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-1 ${activeTab === 'leads' ? 'bg-emerald-500 text-white' : 'bg-gray-100'}`}>
          <Phone className="w-4 h-4" /> Leads
        </button>
        <button onClick={() => setActiveTab('conhecimento')} className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-1 ${activeTab === 'conhecimento' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
          <BookOpen className="w-4 h-4" /> Base
        </button>
        <button onClick={() => setActiveTab('relatorio')} className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-1 ${activeTab === 'relatorio' ? 'bg-pink-500 text-white' : 'bg-gray-100'}`}>
          <BarChart3 className="w-4 h-4" /> Relatorio
        </button>
      </div>
    </div>
  );
}
