import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, Calendar, DollarSign, Tag, TrendingUp, TrendingDown, Users, User } from 'lucide-react';

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('alimentacao');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [person, setPerson] = useState('');
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('todos');
  const [filterPerson, setFilterPerson] = useState('todos');
  const [newPersonName, setNewPersonName] = useState('');
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const categories = {
    alimentacao: { name: 'Alimentação', color: 'bg-emerald-500' },
    transporte: { name: 'Transporte', color: 'bg-teal-500' },
    moradia: { name: 'Moradia', color: 'bg-green-500' },
    saude: { name: 'Saúde', color: 'bg-lime-500' },
    lazer: { name: 'Lazer', color: 'bg-cyan-500' },
    educacao: { name: 'Educação', color: 'bg-green-600' },
    outros: { name: 'Outros', color: 'bg-slate-500' }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load people
      const peopleResult = await window.storage.get('people-list');
      if (peopleResult) {
        setPeople(JSON.parse(peopleResult.value));
      }

      // Load expenses
      const keys = await window.storage.list('expense:');
      if (keys && keys.keys) {
        const loadedExpenses = await Promise.all(
          keys.keys.map(async (key) => {
            const result = await window.storage.get(key);
            return result ? JSON.parse(result.value) : null;
          })
        );
        setExpenses(loadedExpenses.filter(e => e !== null).sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        ));
      }
    } catch (error) {
      console.log('Iniciando nova lista');
    } finally {
      setLoading(false);
    }
  };

  const addPerson = async () => {
    if (!newPersonName.trim()) {
      alert('Digite um nome válido');
      return;
    }

    const newPerson = {
      id: Date.now().toString(),
      name: newPersonName.trim()
    };

    const updatedPeople = [...people, newPerson];
    
    try {
      await window.storage.set('people-list', JSON.stringify(updatedPeople));
      setPeople(updatedPeople);
      setNewPersonName('');
      setShowAddPerson(false);
      if (!person) {
        setPerson(newPerson.id);
      }
    } catch (error) {
      alert('Erro ao adicionar pessoa');
    }
  };

  const deletePerson = async (personId) => {
    if (expenses.some(e => e.person === personId)) {
      alert('Não é possível deletar pessoa com despesas registradas');
      return;
    }

    const updatedPeople = people.filter(p => p.id !== personId);
    
    try {
      await window.storage.set('people-list', JSON.stringify(updatedPeople));
      setPeople(updatedPeople);
      if (person === personId) {
        setPerson('');
      }
    } catch (error) {
      alert('Erro ao deletar pessoa');
    }
  };

  const addExpense = async () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0 || !person) {
      alert('Por favor, preencha todos os campos corretamente');
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date,
      person,
      timestamp: Date.now()
    };

    try {
      await window.storage.set(`expense:${newExpense.id}`, JSON.stringify(newExpense));
      setExpenses([newExpense, ...expenses]);
      setDescription('');
      setAmount('');
      setCategory('alimentacao');
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      alert('Erro ao salvar despesa');
    }
  };

  const deleteExpense = async (id) => {
    try {
      await window.storage.delete(`expense:${id}`);
      setExpenses(expenses.filter(e => e.id !== id));
    } catch (error) {
      alert('Erro ao deletar despesa');
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const matchCategory = filterCategory === 'todos' || e.category === filterCategory;
    const matchPerson = filterPerson === 'todos' || e.person === filterPerson;
    return matchCategory && matchPerson;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const expensesByPerson = people.map(p => ({
    person: p,
    total: expenses.filter(e => e.person === p.id).reduce((sum, e) => sum + e.amount, 0),
    count: expenses.filter(e => e.person === p.id).length
  })).filter(item => item.count > 0);

  const expensesByCategory = Object.keys(categories).map(cat => ({
    category: cat,
    total: filteredExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(item => item.total > 0);

  const getPersonName = (personId) => {
    const p = people.find(person => person.id === personId);
    return p ? p.name : 'Desconhecido';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-xl text-emerald-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-800">Controle de Despesas</h1>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Total Gasto</p>
                  <p className="text-2xl font-bold mt-1">
                    R$ {totalExpenses.toFixed(2)}
                  </p>
                </div>
                <TrendingDown className="w-10 h-10 text-emerald-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm">Total de Despesas</p>
                  <p className="text-2xl font-bold mt-1">{filteredExpenses.length}</p>
                </div>
                <Tag className="w-10 h-10 text-teal-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Pessoas Cadastradas</p>
                  <p className="text-2xl font-bold mt-1">{people.length}</p>
                </div>
                <Users className="w-10 h-10 text-green-200" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1 space-y-6">
            {/* Manage People */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Pessoas
              </h2>
              
              {people.length === 0 ? (
                <p className="text-sm text-gray-500 mb-4">Adicione pessoas para começar</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {people.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-gray-800">{p.name}</span>
                      </div>
                      <button
                        onClick={() => deletePerson(p.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Deletar pessoa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!showAddPerson ? (
                <button
                  onClick={() => setShowAddPerson(true)}
                  className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nova Pessoa
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    placeholder="Nome da pessoa"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && addPerson()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addPerson}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition-colors"
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={() => {
                        setShowAddPerson(false);
                        setNewPersonName('');
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Add Expense Form */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Nova Despesa
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pessoa
                  </label>
                  <select
                    value={person}
                    onChange={(e) => setPerson(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma pessoa</option>
                    {people.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Almoço no restaurante"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {Object.entries(categories).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={addExpense}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  disabled={people.length === 0}
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Despesa
                </button>
                {people.length === 0 && (
                  <p className="text-xs text-red-500 text-center">Adicione pelo menos uma pessoa primeiro</p>
                )}
              </div>

              {/* Summary by Person */}
              {expensesByPerson.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Gastos por Pessoa
                  </h3>
                  <div className="space-y-2">
                    {expensesByPerson.map(item => (
                      <div key={item.person.id} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm text-gray-700 font-medium">
                            {item.person.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({item.count} {item.count === 1 ? 'despesa' : 'despesas'})
                          </span>
                        </div>
                        <span className="text-sm font-bold text-emerald-700">
                          R$ {item.total.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary by Category */}
              {expensesByCategory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Gastos por Categoria
                  </h3>
                  <div className="space-y-2">
                    {expensesByCategory.map(item => (
                      <div key={item.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${categories[item.category].color}`} />
                          <span className="text-sm text-gray-600">
                            {categories[item.category].name}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          R$ {item.total.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Expenses List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-gray-800">Histórico de Despesas</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <select
                    value={filterPerson}
                    onChange={(e) => setFilterPerson(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="todos">Todas as pessoas</option>
                    {people.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="todos">Todas as categorias</option>
                    {Object.entries(categories).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Total Filtrado */}
              {filteredExpenses.length > 0 && (
                <div className="mb-4 p-4 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg border-2 border-emerald-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-700" />
                      <span className="text-sm font-medium text-emerald-900">
                        Total {filterPerson !== 'todos' && `de ${getPersonName(filterPerson)}`}
                        {filterCategory !== 'todos' && ` em ${categories[filterCategory].name}`}
                        {filterPerson === 'todos' && filterCategory === 'todos' && 'Geral'}:
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-700">
                      R$ {totalExpenses.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-1">
                    {filteredExpenses.length} {filteredExpenses.length === 1 ? 'despesa' : 'despesas'} 
                    {filterPerson !== 'todos' || filterCategory !== 'todos' ? ' filtrada(s)' : ' no total'}
                  </p>
                </div>
              )}

              <div className="space-y-3 max-h-[700px] overflow-y-auto">
                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Nenhuma despesa registrada</p>
                    <p className="text-sm mt-2">Adicione sua primeira despesa para começar!</p>
                  </div>
                ) : (
                  filteredExpenses.map(expense => (
                    <div
                      key={expense.id}
                      onClick={() => setSelectedExpense(selectedExpense?.id === expense.id ? null : expense)}
                      className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 ${categories[expense.category].color} rounded-lg flex items-center justify-center shadow-sm flex-shrink-0`}>
                            <Tag className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 truncate">{expense.description}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={`px-2 py-1 rounded text-xs ${categories[expense.category].color} text-white`}>
                                {categories[expense.category].name}
                              </span>
                              <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                <User className="w-3 h-3" />
                                {getPersonName(expense.person)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xl font-bold text-emerald-700">
                              R$ {expense.amount.toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteExpense(expense.id);
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Deletar despesa"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {selectedExpense?.id === expense.id && (
                        <div className="mt-4 pt-4 border-t border-emerald-200 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-1">DESCRIÇÃO COMPLETA</p>
                              <p className="text-sm text-gray-800">{expense.description}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-1">VALOR</p>
                              <p className="text-sm text-gray-800 font-bold">R$ {expense.amount.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-1">DATA</p>
                              <div className="flex items-center gap-2 text-sm text-gray-800">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                                {new Date(expense.date).toLocaleDateString('pt-BR', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-1">PESSOA</p>
                              <div className="flex items-center gap-2 text-sm text-gray-800">
                                <User className="w-4 h-4 text-emerald-600" />
                                {getPersonName(expense.person)}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-1">CATEGORIA</p>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded ${categories[expense.category].color}`} />
                                <span className="text-sm text-gray-800">{categories[expense.category].name}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-1">REGISTRADA EM</p>
                              <p className="text-sm text-gray-800">
                                {new Date(expense.timestamp).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 italic text-center mt-2">
                            Clique novamente para fechar os detalhes
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}