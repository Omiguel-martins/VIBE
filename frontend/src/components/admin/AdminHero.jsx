import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './Admin.css';

export default function AdminHero() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState(null);

  useEffect(() => {
    fetchSlides();
  }, []);

  async function fetchSlides() {
    setLoading(true);
    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .order('order_index');
    
    if (error) {
      console.error('Erro ao buscar slides:', error);
      alert('Erro ao carregar slides.');
    } else {
      setSlides(data || []);
    }
    setLoading(false);
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este slide?')) return;
    
    const { error } = await supabase.from('hero_slides').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir slide.');
      console.error(error);
    } else {
      fetchSlides();
    }
  };

  const handleEdit = (slide) => {
    setEditingSlide({ ...slide });
  };

  const handleAddNew = () => {
    setEditingSlide({
      label: '',
      title: '',
      subtitle: '',
      cta_text: '',
      cta_action: '',
      bg_image_url: '',
      bg_color: '#000000',
      text_dark: false,
      accent_color: '#c9a25b',
      order_index: slides.length
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingSlide.title || !editingSlide.label) {
      alert('Preencha os campos obrigatórios (Título e Label).');
      return;
    }

    let error;
    if (editingSlide.id) {
      const { error: updateError } = await supabase
        .from('hero_slides')
        .update(editingSlide)
        .eq('id', editingSlide.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('hero_slides')
        .insert([editingSlide]);
      error = insertError;
    }

    if (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar slide.');
    } else {
      setEditingSlide(null);
      fetchSlides();
    }
  };

  const handleMove = async (index, direction) => {
    if (
      (direction === -1 && index === 0) ||
      (direction === 1 && index === slides.length - 1)
    ) return;

    const currentSlide = slides[index];
    const targetSlide = slides[index + direction];

    // Transação atômica via RPC — garante que ambos os updates ocorrem juntos
    const { error } = await supabase.rpc('swap_slide_order', {
      id_a: currentSlide.id,
      id_b: targetSlide.id,
    });

    if (error) {
      console.error('Erro ao reordenar slides:', error);
      alert('Erro ao reordenar. Tente novamente.');
    } else {
      fetchSlides();
    }
  };


  if (loading) return <div>Carregando slides...</div>;

  return (
    <div className="admin-hero">
      <div className="admin-hero-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h3>Gerenciar Carrossel (Hero)</h3>
        <button className="admin-btn-primary" onClick={handleAddNew}>+ Novo Slide</button>
      </div>

      {editingSlide ? (
        <div className="admin-form-card" style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <h4>{editingSlide.id ? 'Editar Slide' : 'Novo Slide'}</h4>
          <form onSubmit={handleSave} style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
            
            <div className="form-group" style={{ display: 'grid' }}>
              <label>Rótulo Superior (Ex: LINHA VIBE)</label>
              <input type="text" value={editingSlide.label || ''} onChange={e => setEditingSlide({...editingSlide, label: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>

            <div className="form-group" style={{ display: 'grid' }}>
              <label>Título (Use "Enter" para quebrar linha)</label>
              <textarea value={editingSlide.title || ''} onChange={e => setEditingSlide({...editingSlide, title: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px' }} />
            </div>

            <div className="form-group" style={{ display: 'grid' }}>
              <label>Subtítulo / Descrição</label>
              <textarea value={editingSlide.subtitle || ''} onChange={e => setEditingSlide({...editingSlide, subtitle: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ display: 'grid' }}>
                <label>Texto do Botão (CTA)</label>
                <input type="text" value={editingSlide.cta_text || ''} onChange={e => setEditingSlide({...editingSlide, cta_text: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div className="form-group" style={{ display: 'grid' }}>
                <label>Link/Ação do Botão</label>
                <input type="text" placeholder="Ex: vibe ou /produto/nome" value={editingSlide.cta_action || ''} onChange={e => setEditingSlide({...editingSlide, cta_action: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
            </div>

            <div className="form-group" style={{ display: 'grid' }}>
              <label>URL da Imagem de Fundo (opcional)</label>
              <input type="text" placeholder="https://..." value={editingSlide.bg_image_url || ''} onChange={e => setEditingSlide({...editingSlide, bg_image_url: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ display: 'grid' }}>
                <label>Cor / Gradiente de Fundo CSS (Se não houver imagem)</label>
                <input type="text" value={editingSlide.bg_color || ''} onChange={e => setEditingSlide({...editingSlide, bg_color: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div className="form-group" style={{ display: 'grid' }}>
                <label>Cor de Destaque (Accent)</label>
                <input type="color" value={editingSlide.accent_color || '#000000'} onChange={e => setEditingSlide({...editingSlide, accent_color: e.target.value})} style={{ padding: '4px', width: '100%', height: '40px' }} />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="textDark" checked={editingSlide.text_dark} onChange={e => setEditingSlide({...editingSlide, text_dark: e.target.checked})} />
              <label htmlFor="textDark" style={{ cursor: 'pointer' }}>Usar Textos Escuros (para fundos claros)</label>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <button type="submit" className="admin-btn-primary" style={{ padding: '10px 24px', background: '#111', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar Slide</button>
              <button type="button" onClick={() => setEditingSlide(null)} style={{ padding: '10px 24px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="admin-slides-list" style={{ display: 'grid', gap: '16px' }}>
          {slides.map((slide, idx) => (
            <div key={slide.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div>
                <h5 style={{ margin: '0 0 8px 0' }}>{slide.label}</h5>
                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{slide.title}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleMove(idx, -1)} disabled={idx === 0} style={{ cursor: idx === 0 ? 'not-allowed' : 'pointer' }}>↑</button>
                <button onClick={() => handleMove(idx, 1)} disabled={idx === slides.length - 1} style={{ cursor: idx === slides.length - 1 ? 'not-allowed' : 'pointer' }}>↓</button>
                <button onClick={() => handleEdit(slide)} style={{ background: '#f0f0f0', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginLeft: '16px' }}>Editar</button>
                <button onClick={() => handleDelete(slide.id)} style={{ background: '#ffeded', color: '#cc0000', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Excluir</button>
              </div>
            </div>
          ))}
          {slides.length === 0 && <p>Nenhum slide cadastrado.</p>}
        </div>
      )}
    </div>
  );
}
