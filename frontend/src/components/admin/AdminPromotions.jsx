import { useState } from 'react';
import './Admin.css';

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [editingPromo, setEditingPromo] = useState(null);

  const handleAddNew = () => {
    setEditingPromo({
      title: '',
      description: '',
      discountPercentage: '',
      startDate: '',
      endDate: '',
      applicableProducts: 'all',
      isActive: true
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Apenas simulação de salvamento no frontend, como solicitado
    if (editingPromo.id) {
      setPromotions(promotions.map(p => p.id === editingPromo.id ? editingPromo : p));
    } else {
      setPromotions([...promotions, { ...editingPromo, id: Date.now() }]);
    }
    setEditingPromo(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta promoção?')) {
      setPromotions(promotions.filter(p => p.id !== id));
    }
  };

  return (
    <div className="admin-promotions">
      <div className="admin-hero-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h3>Gerenciar Promoções</h3>
        <button className="admin-btn-primary" onClick={handleAddNew}>+ Nova Promoção</button>
      </div>

      {editingPromo ? (
        <div className="admin-form-card" style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <h4>{editingPromo.id ? 'Editar Promoção' : 'Nova Promoção'}</h4>
          <form onSubmit={handleSave} style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
            
            <div className="form-group" style={{ display: 'grid' }}>
              <label>Título da Promoção (Ex: Black Friday)</label>
              <input type="text" value={editingPromo.title} onChange={e => setEditingPromo({...editingPromo, title: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required />
            </div>

            <div className="form-group" style={{ display: 'grid' }}>
              <label>Descrição Breve</label>
              <textarea value={editingPromo.description} onChange={e => setEditingPromo({...editingPromo, description: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '60px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ display: 'grid' }}>
                <label>Desconto (%)</label>
                <input type="number" value={editingPromo.discountPercentage} onChange={e => setEditingPromo({...editingPromo, discountPercentage: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required />
              </div>
              <div className="form-group" style={{ display: 'grid' }}>
                <label>Data de Início</label>
                <input type="date" value={editingPromo.startDate} onChange={e => setEditingPromo({...editingPromo, startDate: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required />
              </div>
              <div className="form-group" style={{ display: 'grid' }}>
                <label>Data de Término</label>
                <input type="date" value={editingPromo.endDate} onChange={e => setEditingPromo({...editingPromo, endDate: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required />
              </div>
            </div>

            <div className="form-group" style={{ display: 'grid' }}>
              <label>Produtos Aplicáveis</label>
              <select value={editingPromo.applicableProducts} onChange={e => setEditingPromo({...editingPromo, applicableProducts: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <option value="all">Todos os Produtos</option>
                <option value="vibe">Apenas Linha VIBE</option>
                <option value="fragrancia">Apenas Fragrâncias Árabes</option>
                <option value="combo">Apenas Combos</option>
                <option value="specific">Selecionar Manualmente (Em Breve)</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="isActive" checked={editingPromo.isActive} onChange={e => setEditingPromo({...editingPromo, isActive: e.target.checked})} />
              <label htmlFor="isActive" style={{ cursor: 'pointer', fontWeight: '500' }}>Ativar Promoção Imediatamente</label>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <button type="submit" className="admin-btn-primary" style={{ padding: '10px 24px', background: '#111', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar Promoção</button>
              <button type="button" onClick={() => setEditingPromo(null)} style={{ padding: '10px 24px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="admin-promotions-list" style={{ display: 'grid', gap: '16px' }}>
          {promotions.map(promo => (
            <div key={promo.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: promo.isActive ? '4px solid #4CAF50' : '4px solid #ccc' }}>
              <div>
                <h5 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {promo.title} 
                  <span style={{ fontSize: '0.75rem', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>-{promo.discountPercentage}%</span>
                </h5>
                <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>Validade: {promo.startDate} até {promo.endDate}</p>
                <p style={{ margin: '4px 0 0 0', color: promo.isActive ? '#4CAF50' : '#888', fontSize: '0.85rem', fontWeight: '500' }}>
                  {promo.isActive ? 'Ativa' : 'Inativa'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setEditingPromo(promo)} style={{ background: '#f0f0f0', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                <button onClick={() => handleDelete(promo.id)} style={{ background: '#ffeded', color: '#cc0000', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Excluir</button>
              </div>
            </div>
          ))}
          {promotions.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', background: '#f9f9f9', borderRadius: '8px', color: '#777' }}>
              <p>Nenhuma promoção cadastrada ainda.</p>
              <p style={{ fontSize: '0.9rem' }}>Crie campanhas e ofertas especiais para impulsionar suas vendas.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
