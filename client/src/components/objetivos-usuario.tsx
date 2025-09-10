
import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Objetivo {
  id: string;
  texto: string;
  concluido: boolean;
}

export default function ObjetivosUsuario() {
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [periodo, setPeriodo] = useState(6);

  // ============================================
  // SISTEMA DE PERSISTÊNCIA SUPER ROBUSTA PARA OBJETIVOS
  // ============================================

  const saveObjetivosToLocalStorage = (objetivosData: Objetivo[]) => {
    try {
      const timestamp = Date.now();
      const robustData = {
        objetivos: objetivosData,
        timestamp,
        version: '2.0',
        totalObjetivos: objetivosData.length,
        concluidos: objetivosData.filter(obj => obj.concluido).length,
        lastModified: new Date().toISOString()
      };
      
      // Salvar em múltiplas chaves para redundância
      localStorage.setItem('scapy_user_objetivos', JSON.stringify(robustData));
      localStorage.setItem('userObjetivos', JSON.stringify(objetivosData)); // Compatibilidade
      
      // Backup em chave específica por data
      const dateKey = new Date().toISOString().split('T')[0];
      localStorage.setItem(`scapy_objetivos_backup_${dateKey}`, JSON.stringify(robustData));
      
      console.log(`💾 [ObjetivosUsuario] ${objetivosData.length} objetivos salvos com timestamp ${timestamp}`);
    } catch (error) {
      console.error('❌ [ObjetivosUsuario] Erro ao salvar objetivos:', error);
    }
  };

  const loadObjetivosFromLocalStorage = () => {
    try {
      // Tentar carregar da chave robusta primeiro
      const robustData = localStorage.getItem('scapy_user_objetivos');
      if (robustData) {
        const parsed = JSON.parse(robustData);
        if (parsed.objetivos && Array.isArray(parsed.objetivos)) {
          console.log(`📖 [ObjetivosUsuario] ${parsed.objetivos.length} objetivos carregados (versão robusta)`);
          return parsed.objetivos;
        }
      }
      
      // Fallback para compatibilidade
      const legacyData = localStorage.getItem('userObjetivos');
      if (legacyData) {
        const parsed = JSON.parse(legacyData);
        if (Array.isArray(parsed)) {
          console.log(`📖 [ObjetivosUsuario] ${parsed.length} objetivos carregados (modo compatibilidade)`);
          return parsed;
        }
      }
    } catch (error) {
      console.error('❌ [ObjetivosUsuario] Erro ao carregar objetivos:', error);
    }
    return [];
  };

  const savePeriodoToLocalStorage = (periodoValue: number) => {
    try {
      const periodoData = {
        periodo: periodoValue,
        timestamp: Date.now(),
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem('scapy_user_periodo', JSON.stringify(periodoData));
      localStorage.setItem('userPeriodo', periodoValue.toString()); // Compatibilidade
      
      console.log(`💾 [ObjetivosUsuario] Período ${periodoValue} meses salvo`);
    } catch (error) {
      console.error('❌ [ObjetivosUsuario] Erro ao salvar período:', error);
    }
  };

  const loadPeriodoFromLocalStorage = () => {
    try {
      // Tentar carregar da chave robusta primeiro
      const robustData = localStorage.getItem('scapy_user_periodo');
      if (robustData) {
        const parsed = JSON.parse(robustData);
        if (parsed.periodo && typeof parsed.periodo === 'number') {
          console.log(`📖 [ObjetivosUsuario] Período ${parsed.periodo} meses carregado (versão robusta)`);
          return parsed.periodo;
        }
      }
      
      // Fallback para compatibilidade
      const legacyData = localStorage.getItem('userPeriodo');
      if (legacyData) {
        const parsed = parseInt(legacyData);
        if (!isNaN(parsed)) {
          console.log(`📖 [ObjetivosUsuario] Período ${parsed} meses carregado (modo compatibilidade)`);
          return parsed;
        }
      }
    } catch (error) {
      console.error('❌ [ObjetivosUsuario] Erro ao carregar período:', error);
    }
    return 6; // Valor padrão
  };

  // Carregar dados ao inicializar
  useEffect(() => {
    const loadedObjetivos = loadObjetivosFromLocalStorage();
    const loadedPeriodo = loadPeriodoFromLocalStorage();
    
    setObjetivos(loadedObjetivos);
    setPeriodo(loadedPeriodo);
    
    console.log(`🚀 [ObjetivosUsuario] Componente inicializado: ${loadedObjetivos.length} objetivos, período ${loadedPeriodo} meses`);
  }, []);

  // Salvar objetivos sempre que mudarem
  useEffect(() => {
    if (objetivos.length >= 0) { // Permitir array vazio
      saveObjetivosToLocalStorage(objetivos);
      
      // Disparar evento customizado super-detalhado para sincronização
      const objetivosEvent = new CustomEvent('objetivosUpdated', {
        detail: {
          objetivos,
          total: objetivos.length,
          concluidos: objetivos.filter(obj => obj.concluido).length,
          timestamp: Date.now(),
          action: 'update'
        }
      });
      window.dispatchEvent(objetivosEvent);
    }
  }, [objetivos]);

  // Salvar período sempre que mudar
  useEffect(() => {
    if (periodo > 0) {
      savePeriodoToLocalStorage(periodo);
      
      // Disparar evento para período
      const periodoEvent = new CustomEvent('periodoUpdated', {
        detail: {
          periodo,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(periodoEvent);
    }
  }, [periodo]);

  // Escutar mudanças do localStorage de outras abas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'scapy_user_objetivos' || e.key === 'userObjetivos') {
        console.log('🔄 [ObjetivosUsuario] Detectada mudança em outra aba, sincronizando objetivos...');
        const newObjetivos = loadObjetivosFromLocalStorage();
        setObjetivos(newObjetivos);
      }
      
      if (e.key === 'scapy_user_periodo' || e.key === 'userPeriodo') {
        console.log('🔄 [ObjetivosUsuario] Detectada mudança em outra aba, sincronizando período...');
        const newPeriodo = loadPeriodoFromLocalStorage();
        setPeriodo(newPeriodo);
      }
    };

    // Listener para eventos customizados (mesma aba)
    const handleCustomObjectivesChange = () => {
      const currentObjetivos = loadObjetivosFromLocalStorage();
      setObjetivos(currentObjetivos);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('objetivosUpdated', handleCustomObjectivesChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('objetivosUpdated', handleCustomObjectivesChange);
    };
  }, []);
  const [novoObjetivo, setNovoObjetivo] = useState('');
  const [editandoObjetivo, setEditandoObjetivo] = useState<string | null>(null);
  const [textoEdicao, setTextoEdicao] = useState('');
  const [editandoPeriodo, setEditandoPeriodo] = useState(false);
  const [novoPeriodo, setNovoPeriodo] = useState(6);
  const [adicionandoObjetivo, setAdicionandoObjetivo] = useState(false);

  const adicionarObjetivo = () => {
    if (novoObjetivo.trim()) {
      const objetivo: Objetivo = {
        id: `objetivo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID mais único
        texto: novoObjetivo.trim(),
        concluido: false
      };
      
      const novosObjetivos = [...objetivos, objetivo];
      setObjetivos(novosObjetivos);
      setNovoObjetivo('');
      setAdicionandoObjetivo(false);
      
      console.log(`➕ [ObjetivosUsuario] Objetivo adicionado: "${objetivo.texto}" (ID: ${objetivo.id})`);
      
      // Disparar evento específico de adição
      const addEvent = new CustomEvent('objetivoAdicionado', {
        detail: {
          objetivo,
          totalObjetivos: novosObjetivos.length,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(addEvent);
    }
  };

  const removerObjetivo = (id: string) => {
    const objetivoRemovido = objetivos.find(obj => obj.id === id);
    const novosObjetivos = objetivos.filter(obj => obj.id !== id);
    
    setObjetivos(novosObjetivos);
    
    if (objetivoRemovido) {
      console.log(`🗑️ [ObjetivosUsuario] Objetivo removido: "${objetivoRemovido.texto}" (ID: ${id})`);
      
      // Disparar evento específico de remoção
      const removeEvent = new CustomEvent('objetivoRemovido', {
        detail: {
          objetivoRemovido,
          totalObjetivos: novosObjetivos.length,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(removeEvent);
    }
  };

  const alternarConclusao = (id: string) => {
    const novosObjetivos = objetivos.map(obj => {
      if (obj.id === id) {
        const objetivoAtualizado = { ...obj, concluido: !obj.concluido };
        console.log(`${objetivoAtualizado.concluido ? '✅' : '⭕'} [ObjetivosUsuario] Objetivo ${objetivoAtualizado.concluido ? 'concluído' : 'desmarcado'}: "${obj.texto}"`);
        
        // Disparar evento específico de toggle
        const toggleEvent = new CustomEvent('objetivoToggled', {
          detail: {
            objetivo: objetivoAtualizado,
            action: objetivoAtualizado.concluido ? 'completed' : 'uncompleted',
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(toggleEvent);
        
        return objetivoAtualizado;
      }
      return obj;
    });
    
    setObjetivos(novosObjetivos);
  };

  const iniciarEdicao = (objetivo: Objetivo) => {
    setEditandoObjetivo(objetivo.id);
    setTextoEdicao(objetivo.texto);
  };

  const salvarEdicao = () => {
    if (textoEdicao.trim() && editandoObjetivo) {
      const objetivoAnterior = objetivos.find(obj => obj.id === editandoObjetivo);
      const novosObjetivos = objetivos.map(obj => {
        if (obj.id === editandoObjetivo) {
          const objetivoEditado = { ...obj, texto: textoEdicao.trim() };
          console.log(`✏️ [ObjetivosUsuario] Objetivo editado: "${obj.texto}" → "${textoEdicao.trim()}"`);
          
          // Disparar evento específico de edição
          const editEvent = new CustomEvent('objetivoEditado', {
            detail: {
              objetivoAnterior: obj,
              objetivoNovo: objetivoEditado,
              timestamp: Date.now()
            }
          });
          window.dispatchEvent(editEvent);
          
          return objetivoEditado;
        }
        return obj;
      });
      
      setObjetivos(novosObjetivos);
    }
    setEditandoObjetivo(null);
    setTextoEdicao('');
  };

  const cancelarEdicao = () => {
    setEditandoObjetivo(null);
    setTextoEdicao('');
  };

  const salvarPeriodo = () => {
    if (novoPeriodo > 0) {
      setPeriodo(novoPeriodo);
    }
    setEditandoPeriodo(false);
  };

  const cancelarEdicaoPeriodo = () => {
    setNovoPeriodo(periodo);
    setEditandoPeriodo(false);
  };

  return (
    <section className="mb-8">
      <Card className="border-border mb-3 rounded-3xl ai-assistant-card-natural-3d" style={{ backgroundColor: '#000515' }}>
        <CardContent className="p-6">
          {/* Header com título e período */}
          <div className="flex items-center justify-start space-x-3 mb-6">
            <Target className="w-6 h-6 text-primary" />
            <div className="text-left">
              <h3 className="text-lg text-foreground font-semibold">Meus Objetivos</h3>
              <div className="flex items-center justify-center space-x-2 mt-1">
                {editandoPeriodo ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={novoPeriodo}
                      onChange={(e) => setNovoPeriodo(parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-center text-sm bg-background border-border"
                      min="1"
                      max="60"
                    />
                    <span className="text-sm text-muted-foreground">meses</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={salvarPeriodo}
                      className="h-6 w-6 p-0 hover:bg-primary/20"
                    >
                      <Check className="w-3 h-3 text-green-400" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelarEdicaoPeriodo}
                      className="h-6 w-6 p-0 hover:bg-primary/20"
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditandoPeriodo(true);
                      setNovoPeriodo(periodo);
                    }}
                    className="flex items-center space-x-1 hover:opacity-80 transition-opacity"
                  >
                    <span className="text-sm text-muted-foreground">
                      para daqui {periodo} {periodo === 1 ? 'mês' : 'meses'}
                    </span>
                    <Edit2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lista de objetivos */}
          <div className="space-y-3">
            {objetivos.map((objetivo) => (
              <div
                key={objetivo.id}
                className="flex items-center space-x-3 p-3 rounded-xl border border-border bg-background/50"
              >
                {/* Checkbox */}
                <button
                  onClick={() => alternarConclusao(objetivo.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    objetivo.concluido
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground hover:border-primary'
                  }`}
                >
                  {objetivo.concluido && <Check className="w-3 h-3 text-primary-foreground" />}
                </button>

                {/* Texto do objetivo */}
                <div className="flex-1">
                  {editandoObjetivo === objetivo.id ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={textoEdicao}
                        onChange={(e) => setTextoEdicao(e.target.value)}
                        className="h-8 text-sm bg-background border-border"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') salvarEdicao();
                          if (e.key === 'Escape') cancelarEdicao();
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={salvarEdicao}
                        className="h-6 w-6 p-0 hover:bg-primary/20"
                      >
                        <Check className="w-3 h-3 text-green-400" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelarEdicao}
                        className="h-6 w-6 p-0 hover:bg-primary/20"
                      >
                        <X className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      className={`text-sm ${
                        objetivo.concluido
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {objetivo.texto}
                    </span>
                  )}
                </div>

                {/* Ações */}
                {editandoObjetivo !== objetivo.id && (
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => iniciarEdicao(objetivo)}
                      className="h-6 w-6 p-0 hover:bg-primary/20"
                    >
                      <Edit2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removerObjetivo(objetivo.id)}
                      className="h-6 w-6 p-0 hover:bg-primary/20"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {/* Formulário para adicionar novo objetivo */}
            {adicionandoObjetivo ? (
              <div className="flex items-center space-x-3 p-3 rounded-xl border border-border bg-background/50">
                <div className="w-5 h-5 rounded border-2 border-muted-foreground" />
                <Input
                  value={novoObjetivo}
                  onChange={(e) => setNovoObjetivo(e.target.value)}
                  placeholder="Digite seu objetivo..."
                  className="flex-1 h-8 text-sm bg-background border-border"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') adicionarObjetivo();
                    if (e.key === 'Escape') {
                      setAdicionandoObjetivo(false);
                      setNovoObjetivo('');
                    }
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={adicionarObjetivo}
                  className="h-6 w-6 p-0 hover:bg-primary/20"
                >
                  <Check className="w-3 h-3 text-green-400" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAdicionandoObjetivo(false);
                    setNovoObjetivo('');
                  }}
                  className="h-6 w-6 p-0 hover:bg-primary/20"
                >
                  <X className="w-3 h-3 text-red-400" />
                </Button>
              </div>
            ) : (
              /* Botão para adicionar objetivo */
              <Button
                variant="ghost"
                onClick={() => setAdicionandoObjetivo(true)}
                className="w-full h-12 border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/10 transition-colors rounded-xl"
              >
                <div className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Adicionar novo objetivo
                  </span>
                </div>
              </Button>
            )}
          </div>

          {/* Progresso */}
          {objetivos.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso:</span>
                <span className="text-primary font-medium">
                  {objetivos.filter(obj => obj.concluido).length} de {objetivos.length} concluídos
                </span>
              </div>
              <div className="mt-2 w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: objetivos.length > 0 
                      ? `${(objetivos.filter(obj => obj.concluido).length / objetivos.length) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
