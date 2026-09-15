/**
 * Script de Importação em Massa — VIBE Catálogo
 * ------------------------------------------------
 * Executa UMA VEZ para popular o banco com todos os produtos dos JSONs.
 *
 * Pré-requisitos:
 *   1. Node.js >= 18 (usa fetch nativo)
 *   2. npm install @supabase/supabase-js  (dentro da pasta frontend)
 *
 * Como rodar (no terminal, dentro de frontend/src/components):
 *   SUPABASE_SERVICE_KEY="eyJ..." node importar-produtos.mjs
 *
 * A Service Key fica em: Supabase → Project Settings → API → service_role
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const SUPABASE_URL = 'https://xjbljfnmgcydwwxvbxwj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'COLE_AQUI_SUA_SERVICE_KEY';

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Converte "R$140,00" → 140.00
function parsePrice(raw) {
  if (!raw) return 0;
  const clean = raw.replace(/[^\d,]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

// Gera slug simples a partir do nome
function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function importar(filePath, gender) {
  const raw = readFileSync(filePath, 'utf-8');
  const items = JSON.parse(raw);
  console.log(`\n Importando ${items.length} produtos (${gender})...`);

  const records = items.map(item => ({
    name: item.nome,
    description: item.descricao || null,
    price: parsePrice(item.preco),
    category: 'fragrancia',
    gender: gender,
    slug: slugify(item.nome),
    image_url: null,
    gallery_urls: [],
  }));

  const BATCH = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { error } = await supabase.from('products').upsert(batch, { onConflict: 'slug' });
    if (error) {
      console.error(`  Erro no lote ${i}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`  Lote ${i + 1}-${Math.min(i + BATCH, records.length)} OK`);
    }
  }

  console.log(`  Resultado: ${inserted} inseridos, ${errors} com erro.`);
  return inserted;
}

async function main() {
  if (SUPABASE_SERVICE_KEY === 'COLE_AQUI_SUA_SERVICE_KEY') {
    console.error('\nERRO: Defina SUPABASE_SERVICE_KEY antes de rodar.');
    console.error('Exemplo: SUPABASE_SERVICE_KEY="eyJ..." node importar-produtos.mjs\n');
    process.exit(1);
  }

  const feminino = join(__dir, 'produtos-femininos.json');
  const masculino = join(__dir, 'produtos-masculinos.json');

  const total =
    (await importar(feminino, 'feminino')) +
    (await importar(masculino, 'masculino'));

  console.log(`\nImportacao concluida! Total: ${total} produtos adicionados.\n`);
}

main().catch(err => { console.error('Erro fatal:', err); process.exit(1); });
