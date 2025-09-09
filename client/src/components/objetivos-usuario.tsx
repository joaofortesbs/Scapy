
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

  // Carregar objetivos do localStorage ao inicializar
  useEffect(() => {
    const savedObjetivos = localStorage.getItem('userObjetivos');
    const savedPeriodo = localStorage.getItem('userPeriodo');
    
    if (savedObjetivos) {
      try {
        const parsedObjetivos = JSON.parse(savedObjetivos);
        setObjetivos(parsedObjetivos);
      } catch (error) {
        console.error('Erro ao carregar objetivos:', error);
      }
    }
    
    if (savedPeriodo) {
      try {
        const parsedPeriodo = parseInt(savedPeriodo);
        setPeriodo(parsedPeriodo);
      } catch (error) {
        console.error('Erro ao carregar período:', error);
      }
    }
  }, []);

  // Salvar objetivos no localStorage sempre que mudarem
  useEffect(() => {
    localStorage.setItem('userObjetivos', JSON.stringify(objetivos));
  }, [objetivos]);

  // Salvar período no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('userPeriodo', periodo.toString());
  }, [periodo]);
  const [novoObjetivo, setNovoObjetivo] = useState('');
  const [editandoObjetivo, setEditandoObjetivo] = useState<string | null>(null);
  const [textoEdicao, setTextoEdicao] = useState('');
  const [editandoPeriodo, setEditandoPeriodo] = useState(false);
  const [novoPeriodo, setNovoPeriodo] = useState(6);
  const [adicionandoObjetivo, setAdicionandoObjetivo] = useState(false);

  const adicionarObjetivo = () => {
    if (novoObjetivo.trim()) {
      const objetivo: Objetivo = {
        id: Date.now().toString(),
        texto: novoObjetivo.trim(),
        concluido: false
      };
      setObjetivos([...objetivos, objetivo]);
      setNovoObjetivo('');
      setAdicionandoObjetivo(false);
    }
  };

  const removerObjetivo = (id: string) => {
    setObjetivos(objetivos.filter(obj => obj.id !== id));
  };

  const alternarConclusao = (id: string) => {
    setObjetivos(objetivos.map(obj => 
      obj.id === id ? { ...obj, concluido: !obj.concluido } : obj
    ));
  };

  const iniciarEdicao = (objetivo: Objetivo) => {
    setEditandoObjetivo(objetivo.id);
    setTextoEdicao(objetivo.texto);
  };

  const salvarEdicao = () => {
    if (textoEdicao.trim()) {
      setObjetivos(objetivos.map(obj => 
        obj.id === editandoObjetivo ? { ...obj, texto: textoEdicao.trim() } : obj
      ));
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
