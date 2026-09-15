import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';

const SUPABASE_STORAGE_URL = 'https://xjbljfnmgcydwwxvbxwj.supabase.co/storage/v1/object/public/products/';

// Comprime e redimensiona uma imagem antes do upload (mantém qualidade visual, reduz peso)
function compressImage(file, maxWidth = 1200, quality = 0.85) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/webp', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminGenderFilter, setAdminGenderFilter] = useState('todos');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: 0,
    category: 'fragrancia',
    gender: 'feminino',
    slug: '',
    image_url: '',
    gallery_urls: [],
    is_active: true
  });

  // Preview states
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // File inputs
  const mainImageInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Files to upload (raw file objects)
  const [mainImageFile, setMainImageFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('category', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', stock: 0, category: 'fragrancia', gender: 'feminino', slug: '', image_url: '', gallery_urls: [], is_active: true });
    setMainImagePreview(null);
    setGalleryPreviews([]);
    setMainImageFile(null);
    setGalleryFiles([]);
    setUploadProgress('');
  };

  const openDrawer = (product = null) => {
    resetForm();
    if (product) {
      setEditingProduct(product.id);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock !== undefined ? product.stock : 0,
        category: product.category,
        gender: product.gender || 'feminino',
        slug: product.slug || '',
        image_url: product.image_url || '',
        gallery_urls: product.gallery_urls || [],
        is_active: product.is_active !== false
      });
      setMainImagePreview(product.image_url && !product.image_url.includes('LINK_') ? product.image_url : null);
      setGalleryPreviews(product.gallery_urls || []);
    } else {
      setEditingProduct(null);
    }
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingProduct(null);
    resetForm();
  };

  // Lida com seleção da imagem principal
  const handleMainImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
  };

  // Lida com seleção das imagens da galeria
  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setGalleryFiles(files);
    setGalleryPreviews(files.map(f => URL.createObjectURL(f)));
  };

  // Faz o upload de um arquivo e retorna a URL pública
  const uploadFile = async (file, folder) => {
    const compressed = await compressImage(file);
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const { error } = await supabase.storage.from('products').upload(filename, compressed, { contentType: 'image/webp', upsert: false });
    if (error) throw error;
    return `${SUPABASE_STORAGE_URL}${filename}`;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setUploadProgress('');

    try {
      let finalImageUrl = formData.image_url;
      let finalGalleryUrls = [...formData.gallery_urls];
      // Sanitiza o slug para uso no Storage (sem acentos ou caracteres especiais)
      const sanitizeForStorage = (str) =>
        str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

      const productSlug = sanitizeForStorage(
        formData.slug || formData.name.toLowerCase().replace(/ - /g, '-').replace(/ /g, '-')
      );


      // Upload da imagem principal (se um novo arquivo foi selecionado)
      if (mainImageFile) {
        setUploadProgress('Enviando imagem principal...');
        finalImageUrl = await uploadFile(mainImageFile, productSlug);
      }

      // Upload das imagens da galeria (se novos arquivos foram selecionados)
      if (galleryFiles.length > 0) {
        setUploadProgress(`Enviando galeria (0/${galleryFiles.length})...`);
        const uploadedGallery = [];
        for (let i = 0; i < galleryFiles.length; i++) {
          const url = await uploadFile(galleryFiles[i], `${productSlug}/gallery`);
          uploadedGallery.push(url);
          setUploadProgress(`Enviando galeria (${i + 1}/${galleryFiles.length})...`);
        }
        // Mantém URLs antigas e adiciona as novas
        finalGalleryUrls = [...finalGalleryUrls, ...uploadedGallery];
      }

      setUploadProgress('Salvando produto...');

      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        category: formData.category,
        gender: formData.gender,
        slug: productSlug,
        image_url: finalImageUrl,
        gallery_urls: finalGalleryUrls,
        is_active: formData.is_active
      };

      let resultError = null;
      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct);
        resultError = error;
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        resultError = error;
      }

      if (resultError) throw resultError;

      alert('Produto salvo com sucesso!');
      closeDrawer();
      fetchProducts();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert(`Erro ao salvar produto: ${err.message}`);
    } finally {
      setSaving(false);
      setUploadProgress('');
    }
  };

  const removeGalleryImage = (index) => {
    const newUrls = formData.gallery_urls.filter((_, i) => i !== index);
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    setFormData({ ...formData, gallery_urls: newUrls });
    setGalleryPreviews(newPreviews);
  };

  // Agrupar e filtrar produtos por gênero e categoria
  const filteredProductsAdmin = products.filter(p => {
    const matchGender = adminGenderFilter === 'todos' || p.gender === adminGenderFilter;
    const matchCategory = adminCategoryFilter === 'todos' || p.category === adminCategoryFilter;
    return matchGender && matchCategory;
  });

  const totalPages = Math.ceil(filteredProductsAdmin.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProductsAdmin.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [bulkCategory, setBulkCategory] = useState('fragrancia');
  const handleBulkVisibility = async (isActive) => {
    if (!window.confirm(`Tem certeza que deseja ${isActive ? 'mostrar' : 'ocultar'} todos os produtos desta categoria?`)) return;
    setLoading(true);
    const { error } = await supabase.from('products').update({ is_active: isActive }).eq('category', bulkCategory);
    if (error) {
      alert(`Erro: ${error.message}`);
      setLoading(false);
    } else {
      alert('Visibilidade atualizada com sucesso!');
      fetchProducts();
    }
  };

  return (
    <div className="admin-catalog">
      <div className="catalog-header" style={{ flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            <h1 className="admin-page-title">Catálogo</h1>
            <p className="admin-page-subtitle">Gerencie os produtos ativos na loja.</p>
          </div>
          <button className="btn-primary" onClick={() => openDrawer()}>+ Novo Produto</button>
        </div>
        
        {/* Ações em Massa */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#f5f5f5', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '600' }}>Ações em Massa:</span>
          <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} className="admin-select" style={{ margin: 0, width: 'auto' }}>
            <option value="vibe">VIBE</option>
            <option value="fragrancia">Fragrâncias</option>
            <option value="bodysplash">Body Splash</option>
            <option value="oleo">Óleo Corporal</option>
            <option value="hidratante">Hidratante</option>
            <option value="combo">Combos</option>
          </select>
          <button className="btn-primary" style={{ background: '#ef4444', border: 'none' }} onClick={() => handleBulkVisibility(false)}>Ocultar Tudo</button>
          <button className="btn-primary" style={{ background: '#10b981', border: 'none' }} onClick={() => handleBulkVisibility(true)}>Mostrar Tudo</button>
        </div>
        
        {/* Filtros Admin */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="gender-tabs" style={{ margin: '0', justifyContent: 'flex-start' }}>
            <button
              className={`gender-tab ${adminGenderFilter === 'todos' ? 'active' : ''}`}
              onClick={() => { setAdminGenderFilter('todos'); setCurrentPage(1); }}
            >
              Todos
            </button>
            <button
              className={`gender-tab ${adminGenderFilter === 'feminino' ? 'active' : ''}`}
              onClick={() => { setAdminGenderFilter('feminino'); setCurrentPage(1); }}
            >
              <span className="tab-icon">♀</span> Para Elas
            </button>
            <button
              className={`gender-tab ${adminGenderFilter === 'masculino' ? 'active' : ''}`}
              onClick={() => { setAdminGenderFilter('masculino'); setCurrentPage(1); }}
            >
              <span className="tab-icon">♂</span> Para Eles
            </button>
          </div>
          <select value={adminCategoryFilter} onChange={(e) => { setAdminCategoryFilter(e.target.value); setCurrentPage(1); }} className="admin-select" style={{ maxWidth: '200px', margin: 0 }}>
            <option value="todos">Todas as Categorias</option>
            <option value="vibe">VIBE</option>
            <option value="fragrancia">Fragrâncias</option>
            <option value="bodysplash">Body Splash</option>
            <option value="oleo">Óleo Corporal</option>
            <option value="hidratante">Hidratante</option>
            <option value="combo">Combos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>Carregando catálogo...</p>
      ) : (
        <div className="catalog-content">
          {paginatedProducts.length === 0 ? (
            <div className="dashboard-empty-state">Nenhum produto encontrado.</div>
          ) : (
            <>
              <div className="admin-product-grid" style={{ marginTop: '20px' }}>
                {paginatedProducts.map(product => (
                  <div key={product.id} className="admin-product-card" onClick={() => openDrawer(product)} style={{ opacity: product.is_active === false ? 0.6 : 1 }}>
                    <div className="admin-product-img">
                      {product.image_url && !product.image_url.includes('LINK_') ? (
                        <img src={product.image_url} alt={product.name} />
                      ) : (
                        <div className="no-img">Sem Imagem</div>
                      )}
                    </div>
                    <div className="admin-product-details">
                      <h4>
                        {product.is_active === false && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginRight: '6px' }}>[OCULTO]</span>}
                        {product.name}
                      </h4>
                      <p>R$ {Number(product.price).toFixed(2).replace('.', ',')} • Estoque: {product.stock !== undefined ? product.stock : 0}</p>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', fontWeight: '600',
                          background: product.gender === 'masculino' ? 'rgba(59,130,246,0.15)' : 'rgba(236,72,153,0.15)',
                          color: product.gender === 'masculino' ? '#60a5fa' : '#f472b6',
                        }}>
                          {product.gender === 'masculino' ? '♂ Para Eles' : '♀ Para Elas'}
                        </span>
                        {product.slug && <small style={{ color: '#666' }}>/produto/{product.slug}</small>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="pagination-container" style={{ marginTop: '40px' }}>
                  <button className="pagination-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Anterior</button>
                  <div className="pagination-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button key={page} className={`pagination-btn number ${currentPage === page ? 'active' : ''}`} onClick={() => handlePageChange(page)}>{page}</button>
                    ))}
                  </div>
                  <button className="pagination-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Próxima</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Editor Drawer */}
      <div className={`admin-drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={closeDrawer}></div>
      <div className={`admin-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="admin-drawer-header">
          <h2>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button className="close-btn" onClick={closeDrawer}>✕</button>
        </div>
        <div className="admin-drawer-content">
          <form onSubmit={handleSave} className="admin-form">

            {/* Visibilidade */}
            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <input type="checkbox" id="isActiveToggle" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
              <label htmlFor="isActiveToggle" style={{ marginBottom: 0, cursor: 'pointer', fontWeight: 'bold' }}>Produto Ativo (Visível para clientes)</label>
            </div>

            {/* Nome */}
            <div className="input-group">
              <label>Nome do Produto</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>

            {/* Preço, Categoria e Gênero */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Preço (R$)</label>
                <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Estoque</label>
                <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required min="0" />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Categoria</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="admin-select">
                  <option value="fragrancia">Fragrância</option>
                  <option value="bodysplash">Body Splash</option>
                  <option value="oleo">Óleo Corporal</option>
                  <option value="hidratante">Hidratante</option>
                  <option value="combo">Combo</option>
                </select>
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Departamento</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="admin-select">
                  <option value="feminino">♀ Para Elas</option>
                  <option value="masculino">♂ Para Eles</option>
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div className="input-group">
              <label>Descrição (Notas Olfativas)</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3" className="admin-textarea" required />
            </div>

            {/* Slug */}
            <div className="input-group">
              <label>Slug (URL Amigável)</label>
              <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="Ex: vibe-boa-menina" />
              <small style={{ color: '#aaa', marginTop: '4px', display: 'block' }}>Deixe em branco para gerar automaticamente.</small>
            </div>

            {/* === UPLOAD DE IMAGEM PRINCIPAL === */}
            <div className="input-group">
              <label>Imagem Principal</label>
              <div className="upload-area" onClick={() => mainImageInputRef.current?.click()}>
                {mainImagePreview ? (
                  <div className="upload-preview-main">
                    <img src={mainImagePreview} alt="preview" />
                    <div className="upload-overlay">
                      <span>Clique para trocar</span>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📷</div>
                    <span>Clique para selecionar uma foto do seu computador</span>
                    <small>Suporta JPG, PNG, WebP • Máx: comprimida automaticamente</small>
                  </div>
                )}
              </div>
              <input
                ref={mainImageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleMainImageSelect}
              />
            </div>

            {/* === UPLOAD DA GALERIA === */}
            <div className="input-group">
              <label>Galeria de Imagens</label>

              {/* Imagens já salvas (da galeria existente) */}
              {formData.gallery_urls.length > 0 && (
                <div className="gallery-preview-grid">
                  {formData.gallery_urls.map((url, index) => (
                    <div key={index} className="gallery-thumb-item">
                      <img src={url} alt={`galeria ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-gallery-btn"
                        onClick={() => removeGalleryImage(index)}
                        title="Remover imagem"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview dos novos arquivos selecionados (ainda não enviados) */}
              {galleryPreviews.length > 0 && (
                <div className="gallery-preview-grid">
                  {galleryPreviews.map((src, index) => (
                    <div key={index} className="gallery-thumb-item new-file">
                      <img src={src} alt={`nova ${index + 1}`} />
                      <span className="new-badge">NOVO</span>
                    </div>
                  ))}
                </div>
              )}

              <button type="button" className="btn-secondary" onClick={() => galleryInputRef.current?.click()}>
                + Adicionar fotos à galeria
              </button>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleGallerySelect}
              />
              <small style={{ color: '#aaa', marginTop: '6px', display: 'block' }}>
                As imagens serão comprimidas e enviadas automaticamente ao salvar.
              </small>
            </div>

            {/* Barra de progresso / status de upload */}
            {uploadProgress && (
              <div className="upload-progress-bar">
                <div className="upload-progress-fill"></div>
                <span>{uploadProgress}</span>
              </div>
            )}

            <button type="submit" className="btn-primary auth-submit" disabled={saving}>
              {saving ? (uploadProgress || 'Salvando...') : 'Salvar Produto'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
