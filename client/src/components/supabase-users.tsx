
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface User {
  id: number;
  name: string;
  created_at?: string;
}

export function SupabaseUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Buscar usuários
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/supabase/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      } else {
        setMessage('Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setMessage('Erro na conexão');
    }
  };

  // Criar usuário
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/supabase/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newUserName }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Usuário criado com sucesso!');
        setNewUserName('');
        fetchUsers(); // Recarregar lista
      } else {
        setMessage(data.message || 'Erro ao criar usuário');
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      setMessage('Erro na conexão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-sm border-cyan-400/20">
      <CardHeader>
        <CardTitle className="text-cyan-400 text-center">
          Gerenciamento de Usuários - Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário para criar usuário */}
        <form onSubmit={createUser} className="flex gap-2">
          <Input
            type="text"
            placeholder="Nome do usuário..."
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            className="flex-1 bg-slate-800/50 border-cyan-400/30 text-white"
          />
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            {loading ? 'Criando...' : 'Criar'}
          </Button>
        </form>

        {/* Mensagem de status */}
        {message && (
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-sm">
            {message}
          </div>
        )}

        {/* Lista de usuários */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium">Usuários ({users.length})</h3>
            <Button 
              onClick={fetchUsers}
              variant="outline"
              size="sm"
              className="border-cyan-400/30 text-cyan-400"
            >
              Atualizar
            </Button>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {users.length === 0 ? (
              <div className="text-slate-400 text-center py-4">
                Nenhum usuário encontrado
              </div>
            ) : (
              users.map((user) => (
                <div 
                  key={user.id} 
                  className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{user.name}</span>
                    <span className="text-slate-400 text-xs">ID: {user.id}</span>
                  </div>
                  {user.created_at && (
                    <div className="text-slate-500 text-xs mt-1">
                      Criado em: {new Date(user.created_at).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
