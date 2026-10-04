import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './Admin.css';

export default function AdminHero() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState(null);
  const [uploading, setUploading] = useState(false);

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
    if (!window.confirm('Tem certeza que deseja excluir este banner?')) return;

    const { error } = await supabase.from('hero_slides').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir banner.');
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
      label: 'Banner',
      title: '',
      subtitle: '',
      cta_text: '',
      cta_action: '',
      bg_image_url: '',
      bg_image_mobile_url: '',
      bg_color: '#000000',
      text_dark: false,
      accent_color: '#c9a25b',
      order_index: slides.length,
    });
  };

  // ─── Upload de imagem para o Supabase Storage ────────────────────────────────
  const handleImageUpload = async (e, isMobile = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato não suportado. Use JPG, PNG, WebP ou GIF.');
      return;
    }

    setUploading(true);

    const ext = file.name.split('.').pop();
    const fileName = `banner-${isMobile ? 'mobile-' : ''}${Date.now()}.${ext}`;
    const filePath = `hero/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError);
      alert('Erro ao fazer upload da imagem.');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    if (isMobile) {
      setEditingSlide((prev) => ({ ...prev, bg_image_mobile_url: urlData.publicUrl }));
    } else {
      setEditingSlide((prev) => ({ ...prev, bg_image_url: urlData.publicUrl }));
    }
    setUploading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!editingSlide.bg_image_url) {
      alert('Faça o upload de uma imagem para o banner antes de salvar.');
      return;
    }

    // Campos de texto ficam vazios — a imagem já contém os textos
    const slideToSave = {
      ...editingSlide,
      label: editingSlide.label || 'Banner',
      title: '',
      subtitle: '',
      cta_text: '',
    };

    let error;
    if (slideToSave.id) {
      const { error: updateError } = await supabase
        .from('hero_slides')
        .update(slideToSave)
        .eq('id', slideToSave.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('hero_slides')
        .insert([slideToSave]);
      error = insertError;
    }

    if (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar banner.');
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

  if (loading) return <div>Carregando banners...</div>;

  return (
    <div className="admin-hero">
      <div
        className="admin-hero-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}
      >
        <div>
          <h3 style={{ margin: 0 }}>Gerenciar Banners (Hero)</h3>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.88rem' }}>
            Faça upload de imagens com os textos já inseridos. Toda a imagem vira um botão clicável.
          </p>
        </div>
        <button className="admin-btn-primary" onClick={handleAddNew}>+ Novo Banner</button>
      </div>

      {editingSlide ? (
        <div
          className="admin-form-card"
          style={{ background: '#fff', padding: '28px', borderRadius: '10px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', marginBottom: '24px' }}
        >
          <h4 style={{ marginTop: 0 }}>{editingSlide.id ? 'Editar Banner' : 'Novo Banner'}</h4>
          <form onSubmit={handleSave} style={{ display: 'grid', gap: '20px' }}>

            {/* Upload da Imagem */}
            <div className="form-group" style={{ display: 'grid', gap: '10px' }}>
              <label style={{ fontWeight: '600' }}>
                🖼️ Imagem do Banner <span style={{ color: '#e53e3e' }}>*</span>
              </label>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                Suba a imagem já com os textos, botões e elementos visuais que desejar. Tamanho recomendado: <strong>1920×700px</strong> ou proporção similar.
              </p>

              {editingSlide.bg_image_url && (
                <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                  <img
                    src={editingSlide.bg_image_url}
                    alt="Preview do banner"
                    style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'rgba(0,0,0,0.6)', color: '#fff',
                    padding: '4px 10px', borderRadius: '4px', fontSize: '0.78rem',
                  }}>
                    Preview
                  </div>
                </div>
              )}

              <label
                htmlFor="banner-upload"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '6px',
                  background: uploading ? '#e2e8f0' : '#111', color: '#fff',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontWeight: '600', fontSize: '0.9rem', width: 'fit-content',
                  transition: 'background 0.2s',
                }}
              >
                {uploading ? '⏳ Enviando...' : '📁 Selecionar Imagem'}
              </label>
              <input
                id="banner-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />

              {/* Campo de URL manual como alternativa */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ color: '#999', fontSize: '0.82rem' }}>ou cole uma URL:</span>
                <input
                  type="text"
                  placeholder="https://..."
                  value={editingSlide.bg_image_url || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, bg_image_url: e.target.value })}
                  style={{ flex: 1, padding: '7px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.85rem' }}
                />
              </div>
            </div>
            {/* Upload da Imagem Mobile */}
            <div className="form-group" style={{ display: 'grid', gap: '10px' }}>
              <label style={{ fontWeight: '600' }}>
                📱 Imagem Mobile (Opcional)
              </label>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                Para evitar que a imagem de computador fique cortada no celular, envie uma versão no formato vertical (ex: <strong>1080×1350px</strong>). Se não enviar, será usada a mesma imagem acima.
              </p>

              {editingSlide.bg_image_mobile_url && (
                <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e2e8f0', width: 'fit-content' }}>
                  <img
                    src={editingSlide.bg_image_mobile_url}
                    alt="Preview mobile"
                    style={{ height: '280px', objectFit: 'contain', display: 'block', background: '#f0f0f0' }}
                  />
                </div>
              )}

              <label
                htmlFor="banner-upload-mobile"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '6px',
                  background: uploading ? '#e2e8f0' : '#111', color: '#fff',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontWeight: '600', fontSize: '0.9rem', width: 'fit-content',
                  transition: 'background 0.2s',
                }}
              >
                {uploading ? '⏳ Enviando...' : '📁 Selecionar Imagem Mobile'}
              </label>
              <input
                id="banner-upload-mobile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => handleImageUpload(e, true)}
                disabled={uploading}
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ color: '#999', fontSize: '0.82rem' }}>ou cole uma URL:</span>
                <input
                  type="text"
                  placeholder="https://..."
                  value={editingSlide.bg_image_mobile_url || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, bg_image_mobile_url: e.target.value })}
                  style={{ flex: 1, padding: '7px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.85rem' }}
                />
              </div>
            </div>
            {/* Link de Destino */}
            <div className="form-group" style={{ display: 'grid', gap: '6px' }}>
              <label style={{ fontWeight: '600' }}>🔗 Link / Ação ao clicar no banner</label>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                Ex.: <code>/catalogo</code>, <code>/produto/vibe-invencivel</code>, ou uma categoria como <code>vibe</code>.
              </p>
              <input
                type="text"
                placeholder="Ex: vibe  ou  /produto/nome"
                value={editingSlide.cta_action || ''}
                onChange={(e) => setEditingSlide({ ...editingSlide, cta_action: e.target.value })}
                style={{ padding: '9px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>

            {/* Nome interno (apenas para identificação na lista de banners) */}
            <div className="form-group" style={{ display: 'grid', gap: '6px' }}>
              <label style={{ fontWeight: '600' }}>🏷️ Nome Interno (só para identificação)</label>
              <input
                type="text"
                placeholder="Ex: Banner Linha VIBE — Outubro"
                value={editingSlide.label || ''}
                onChange={(e) => setEditingSlide({ ...editingSlide, label: e.target.value })}
                style={{ padding: '9px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="submit"
                className="admin-btn-primary"
                disabled={uploading}
                style={{ padding: '11px 28px', background: '#111', color: '#fff', border: 'none', borderRadius: '6px', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: '700' }}
              >
                Salvar Banner
              </button>
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                style={{ padding: '11px 28px', background: '#e0e0e0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="admin-slides-list" style={{ display: 'grid', gap: '16px' }}>
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                background: '#fff', padding: '12px 16px',
                borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
              }}
            >
              {/* Thumbnail */}
              {slide.bg_image_url ? (
                <img
                  src={slide.bg_image_url}
                  alt={slide.label}
                  style={{ width: '140px', height: '60px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, background: '#f0f0f0' }}
                />
              ) : (
                <div style={{ width: '140px', height: '60px', borderRadius: '6px', background: slide.bg_color || '#333', flexShrink: 0 }} />
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h5 style={{ margin: '0 0 4px' }}>{slide.label || `Banner ${idx + 1}`}</h5>
                {slide.cta_action && (
                  <p style={{ margin: 0, color: '#666', fontSize: '0.82rem' }}>
                    🔗 {slide.cta_action}
                  </p>
                )}
              </div>

              {/* Ações */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => handleMove(idx, -1)} disabled={idx === 0} style={{ cursor: idx === 0 ? 'not-allowed' : 'pointer', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' }}>↑</button>
                <button onClick={() => handleMove(idx, 1)} disabled={idx === slides.length - 1} style={{ cursor: idx === slides.length - 1 ? 'not-allowed' : 'pointer', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' }}>↓</button>
                <button
                  onClick={() => handleEdit(slide)}
                  style={{ background: '#f0f0f0', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', marginLeft: '8px' }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(slide.id)}
                  style={{ background: '#ffeded', color: '#cc0000', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
          {slides.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999', background: '#fff', borderRadius: '10px' }}>
              <p style={{ fontSize: '2rem', margin: '0 0 8px' }}>🖼️</p>
              <p>Nenhum banner cadastrado. Clique em <strong>+ Novo Banner</strong> para começar.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
