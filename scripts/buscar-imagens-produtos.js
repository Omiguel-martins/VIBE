/**
 * ============================================================
 *  buscar-imagens-produtos.js
 *  Script para buscar imagens de perfumes na web e atualizar
 *  o campo image_url na tabela products do Supabase (Vibe).
 * ============================================================
 *
 *  Como usar:
 *    1. Instale as dependências:
 *       cd scripts && npm install @supabase/supabase-js cheerio
 *
 *    2. Execute (requer Node.js 18+ para fetch nativo):
 *       node buscar-imagens-produtos.js
 *       node buscar-imagens-produtos.js --limit=20        (processa só 20 produtos)
 *       node buscar-imagens-produtos.js --dry-run         (busca mas NÃO salva no Supabase)
 *       node buscar-imagens-produtos.js --gender=feminino (só produtos femininos)
 *       node buscar-imagens-produtos.js --gender=masculino
 *       node buscar-imagens-produtos.js --force           (reprocessa quem já tem imagem)
 *
 *  Fontes de imagem utilizadas (em ordem de prioridade):
 *    1. Fragrantica BR/COM
 *    2. Perfume.com.br
 *    3. Bing Image Search
 *    4. Google Images
 *    5. Lojas BR (Beleza.com.br, Sephora BR)
 *    6. DuckDuckGo
 * ============================================================
 */

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { writeFileSync, existsSync, readFileSync } from 'fs';

// ──────────────────────────────────────────────
//  CONFIGURAÇÕES - Supabase Vibe
// ──────────────────────────────────────────────
const SUPABASE_URL = 'https://xjbljfnmgcydwwxvbxwj.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqYmxqZm5tZ2N5ZHd3eHZieHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDYwMjMsImV4cCI6MjEwMzQyMjAyM30.nE-uxvpJQqghOrMUqYQRE-RNyrK9OMCodN8CXrywWVM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ──────────────────────────────────────────────
//  PARÂMETROS CLI
// ──────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT_ARG = args.find((a) => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : null;
const GENDER_ARG = args.find((a) => a.startsWith('--gender='));
const GENDER_FILTER = GENDER_ARG ? GENDER_ARG.split('=')[1].toLowerCase() : null;
const FORCE_RERUN = args.includes('--force');

// Cache local para não repetir buscas em caso de interrupção
const CACHE_FILE = './image_cache.json';
let cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {};

// ──────────────────────────────────────────────
//  UTILITÁRIOS
// ──────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function saveCache() {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
  'Cache-Control': 'no-cache',
};

async function fetchPage(url, timeout = 12000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function validateImageUrl(url) {
  if (!url) return false;
  if (!url.startsWith('http')) return false;

  // Extensão na URL é sinal forte de que é imagem válida
  const hasImgExt = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);

  // Tenta HEAD primeiro (mais rápido)
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { method: 'HEAD', headers: HEADERS, signal: controller.signal });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.startsWith('image/')) return true;
    // HEAD bloqueado (405) mas URL tem extensão de imagem — confiamos
    if ((res.status === 405 || res.status === 403) && hasImgExt) return true;
  } catch { /* continua para GET */ }

  // Fallback: GET parcial (lê só os primeiros bytes para checar)
  if (hasImgExt) {
    try {
      const controller2 = new AbortController();
      setTimeout(() => controller2.abort(), 8000);
      const res2 = await fetch(url, {
        method: 'GET',
        headers: { ...HEADERS, Range: 'bytes=0-1023' },
        signal: controller2.signal,
      });
      const ct2 = res2.headers.get('content-type') || '';
      return (res2.ok || res2.status === 206) && (ct2.startsWith('image/') || hasImgExt);
    } catch { /* falhou */ }
  }

  return false;
}

// ──────────────────────────────────────────────
//  ESTRATÉGIAS DE BUSCA
// ──────────────────────────────────────────────

async function searchFragrantica(productName) {
  const query = encodeURIComponent(productName);

  // Tenta versão BR
  const url1 = `https://www.fragrantica.com.br/search/?query=${query}`;
  const html1 = await fetchPage(url1);
  if (html1) {
    const $ = cheerio.load(html1);
    const sel = ['img.perfume-image', '.cell img[src*="perfume"]', '[itemprop="image"]'];
    for (const s of sel) {
      const src = $(s).first().attr('src') || $(s).first().attr('data-src');
      if (src && src.startsWith('http')) return src;
    }
  }

  // Versão .com
  const url2 = `https://www.fragrantica.com/search/?query=${query}`;
  const html2 = await fetchPage(url2);
  if (html2) {
    const $2 = cheerio.load(html2);
    const sel2 = ['img.perfume-image', '.cell img', '[itemprop="image"]', '.small-pic img'];
    for (const s of sel2) {
      const el = $2(s).first();
      const src = el.attr('src') || el.attr('data-src');
      if (src && src.startsWith('http')) return src;
    }

    // Extrai de scripts JSON-LD
    const scripts = $2('script[type="application/ld+json"]').map((_, el) => $2(el).html()).get();
    for (const sc of scripts) {
      try {
        const d = JSON.parse(sc || '{}');
        if (d.image) return Array.isArray(d.image) ? d.image[0] : d.image;
      } catch { /* continua */ }
    }
  }

  return null;
}

async function searchPerfumeBR(productName) {
  const query = encodeURIComponent(productName);
  const urls = [
    `https://www.perfume.com.br/busca?q=${query}`,
    `https://www.netfarma.com.br/busca?term=${query}`,
  ];

  for (const url of urls) {
    const html = await fetchPage(url);
    if (!html) continue;

    const $ = cheerio.load(html);
    const selectors = [
      '.product-image img',
      '.shelf-item__image img',
      '[data-product-img]',
      '.product-thumb img',
      'figure img',
      '.product img',
      'img[src*="produto"]',
    ];

    for (const sel of selectors) {
      const el = $(sel).first();
      const src = el.attr('src') || el.attr('data-src') || el.attr('data-lazy-src');
      if (src && src.startsWith('http') && !src.includes('placeholder') && !src.includes('logo')) {
        return src;
      }
    }
  }
  return null;
}

async function searchBingImages(productName) {
  const query = encodeURIComponent(`${productName} perfume frasco comprar`);
  const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1&tsc=ImageHoverTitle`;
  const html = await fetchPage(url);
  if (!html) return null;

  const $ = cheerio.load(html);

  // Bing armazena metadata em atributo m
  const items = $('[m]');
  for (let i = 0; i < Math.min(items.length, 8); i++) {
    try {
      const m = JSON.parse($(items[i]).attr('m') || '{}');
      if (m.murl && m.murl.startsWith('http') && !m.murl.includes('bing.com')) return m.murl;
    } catch { continue; }
  }

  // Extrai URLs de imagem direto dos scripts
  const scripts = $('script').map((_, el) => $(el).html()).get();
  for (const script of scripts) {
    if (!script) continue;
    const matches = [...script.matchAll(/"murl":"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)];
    if (matches.length > 0) return decodeURIComponent(matches[0][1]);
  }

  return null;
}

async function searchGoogleImages(productName) {
  const query = encodeURIComponent(`${productName} perfume frasco site oficial`);
  const url = `https://www.google.com/search?q=${query}&tbm=isch&hl=pt-BR&safe=off`;
  const html = await fetchPage(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const scripts = $('script').map((_, el) => $(el).html()).get();

  for (const script of scripts) {
    if (!script) continue;
    const matches = [...script.matchAll(/"(https?:\/\/(?!encrypted-tbn)[^"]+\.(?:jpg|jpeg|png|webp))"/gi)];
    for (const m of matches) {
      const imgUrl = m[1];
      if (imgUrl.length > 50 && !imgUrl.includes('google.com') && !imgUrl.includes('gstatic.com/images/branding')) {
        return imgUrl;
      }
    }
  }
  return null;
}

async function searchLojasBrasil(productName) {
  const sources = [
    `https://www.beleza.com.br/busca?termo=${encodeURIComponent(productName)}`,
    `https://www.sephora.com.br/search?q=${encodeURIComponent(productName)}`,
    `https://www.oboticario.com.br/busca?q=${encodeURIComponent(productName)}`,
    `https://www.americanas.com.br/busca/${encodeURIComponent(productName + ' perfume')}`,
  ];

  for (const url of sources) {
    await sleep(300);
    const html = await fetchPage(url);
    if (!html) continue;

    const $ = cheerio.load(html);
    const selectors = [
      'img[src*="produto"]', 'img[src*="product"]',
      '.product-card img', '.product img',
      'article img', '.card img',
      '[data-testid="product-image"] img',
    ];

    for (const sel of selectors) {
      const el = $(sel).first();
      const src = el.attr('src') || el.attr('data-src');
      if (src && src.startsWith('http') && !src.includes('placeholder') && !src.includes('logo')) {
        return src;
      }
    }
  }
  return null;
}

async function searchDuckDuckGo(productName) {
  // DDG API pública de instant answers
  const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(productName + ' perfume')}&format=json&ia=images&iax=images&no_html=1&no_redirect=1`;
  const apiResponse = await fetchPage(apiUrl);
  if (apiResponse) {
    try {
      const data = JSON.parse(apiResponse);
      if (data.Image && data.Image.startsWith('http')) return data.Image;
      if (data.Results?.[0]?.Icon?.URL) return data.Results[0].Icon.URL;
    } catch { /* continua */ }
  }

  // Fallback: HTML search
  const query = encodeURIComponent(`${productName} perfume frasco`);
  const html = await fetchPage(`https://html.duckduckgo.com/html/?q=${query}`);
  if (!html) return null;

  const $ = cheerio.load(html);
  const imgEl = $('img.result__icon__img, img[src^="http"]').first();
  const src = imgEl.attr('src');
  return src && src.startsWith('http') ? src : null;
}

// ──────────────────────────────────────────────
//  BUSCA PRINCIPAL COM FALLBACK
// ──────────────────────────────────────────────
async function findImageForProduct(name) {
  if (cache[name] !== undefined) {
    const cached = cache[name];
    if (cached) {
      console.log(`  ↩  Cache: ${cached.substring(0, 80)}`);
      return cached;
    } else {
      console.log(`  ↩  Cache: nenhuma imagem (pulando)`);
      return null;
    }
  }

  const strategies = [
    { label: 'Fragrantica', fn: () => searchFragrantica(name) },
    { label: 'PerfumeBR', fn: () => searchPerfumeBR(name) },
    { label: 'Bing', fn: () => searchBingImages(name) },
    { label: 'Google', fn: () => searchGoogleImages(name) },
    { label: 'LojasBrasil', fn: () => searchLojasBrasil(name) },
    { label: 'DuckDuckGo', fn: () => searchDuckDuckGo(name) },
  ];

  for (const strategy of strategies) {
    try {
      await sleep(400 + Math.random() * 600);
      const url = await strategy.fn();
      if (url) {
        const valid = await validateImageUrl(url);
        if (valid) {
          console.log(`  ✅ [${strategy.label}] ${url.substring(0, 80)}...`);
          cache[name] = url;
          saveCache();
          return url;
        } else {
          console.log(`  ⚠️  [${strategy.label}] URL não acessível`);
        }
      }
    } catch (err) {
      console.log(`  ❌ [${strategy.label}] ${err.message}`);
    }
  }

  console.log(`  ⛔ Sem imagem para: "${name}"`);
  cache[name] = null;
  saveCache();
  return null;
}

// ──────────────────────────────────────────────
//  ATUALIZAÇÃO NO SUPABASE
// ──────────────────────────────────────────────
async function updateProductImage(id, imageUrl) {
  if (DRY_RUN) {
    console.log(`  🔵 [DRY-RUN] Atualizaria id=${id}`);
    return true;
  }
  const { error } = await supabase.from('products').update({ image_url: imageUrl }).eq('id', id);
  if (error) {
    console.error(`  ❌ Supabase error: ${error.message}`);
    return false;
  }
  return true;
}

// ──────────────────────────────────────────────
//  RELATÓRIO
// ──────────────────────────────────────────────
function printReport(results) {
  const found = results.filter((r) => r.found);
  const notFound = results.filter((r) => !r.found);

  console.log('\n' + '═'.repeat(60));
  console.log('📊 RELATÓRIO FINAL');
  console.log('═'.repeat(60));
  console.log(`✅ Com imagem:    ${found.length}/${results.length}`);
  console.log(`❌ Sem imagem:    ${notFound.length}/${results.length}`);

  if (notFound.length > 0) {
    console.log('\n🔴 Produtos SEM imagem (adicionar manualmente):');
    notFound.forEach((r) => console.log(`   - ${r.name}`));
  }

  const report = {
    executado_em: new Date().toISOString(),
    total: results.length,
    encontrados: found.length,
    nao_encontrados: notFound.length,
    dry_run: DRY_RUN,
    sem_imagem: notFound.map((r) => r.name),
    com_imagem: found.map((r) => ({ name: r.name, url: r.imageUrl })),
  };

  writeFileSync('./relatorio_imagens.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Relatório salvo em: relatorio_imagens.json');
  console.log('📄 Cache salvo em:     image_cache.json');
}

// ──────────────────────────────────────────────
//  MAIN
// ──────────────────────────────────────────────
async function main() {
  console.log('🚀 Busca de imagens para produtos Vibe');
  console.log('─'.repeat(60));
  if (DRY_RUN) console.log('⚠️  MODO DRY-RUN ativo — nenhuma alteração no Supabase.\n');

  let query = supabase.from('products').select('id, name, image_url, gender');

  if (!FORCE_RERUN) {
    // Por padrão, processa apenas os que ainda não têm imagem
    query = query.is('image_url', null);
  }

  if (GENDER_FILTER) {
    query = query.ilike('gender', `%${GENDER_FILTER}%`);
  }

  if (LIMIT) {
    query = query.limit(LIMIT);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error('❌ Erro ao buscar produtos do Supabase:', error.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('✅ Nenhum produto precisa de imagem! Todos já estão atualizados.');
    return;
  }

  console.log(`📦 ${products.length} produto(s) para processar${GENDER_FILTER ? ` [${GENDER_FILTER}]` : ''}\n`);

  const results = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const progress = `[${String(i + 1).padStart(String(products.length).length)}/${products.length}]`;

    console.log(`\n${progress} 🔍 "${product.name}"`);

    const imageUrl = await findImageForProduct(product.name);

    if (imageUrl) {
      const ok = await updateProductImage(product.id, imageUrl);
      results.push({ name: product.name, found: ok, imageUrl });
    } else {
      results.push({ name: product.name, found: false, imageUrl: null });
    }

    // Pausa de 3s a cada 10 produtos
    if ((i + 1) % 10 === 0 && i < products.length - 1) {
      console.log('\n⏳ Pausa de 3s...\n');
      await sleep(3000);
    }
  }

  printReport(results);
}

main().catch((err) => {
  console.error('💥 Erro fatal:', err);
  process.exit(1);
});
