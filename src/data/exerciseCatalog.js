// Repositório verificado com 1.323 exercícios e GIFs hospedados diretamente no jsDelivr CDN (sem chave, sem 404)
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0';
const EXERCISES_API_URL = `${CDN_BASE}/api/en/exercises.json`;
const CACHE_KEY = 'fitflow_jsdelivr_gifs_pt_v1';

const BODYPART_MAP = {
  chest: 'Peito',
  back: 'Costas',
  shoulders: 'Ombros',
  arms: 'Braços',
  legs: 'Pernas',
  core: 'Core',
  cardio: 'Cardio'
};

const TARGET_MAP = {
  pectorals: 'Peitoral',
  lats: 'Dorsais',
  'upper back': 'Costas Superior',
  spine: 'Lombar',
  traps: 'Trapézio',
  delts: 'Deltoides (Ombros)',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebraço',
  quads: 'Quadríceps',
  hamstrings: 'Posterior de Coxa',
  glutes: 'Glúteos',
  calves: 'Panturrilhas',
  adductors: 'Adutores (Parte Interna)',
  abductors: 'Abdutores (Glúteo Médio)',
  abs: 'Abdômen',
  cardiovascular: 'Cardio'
};

// Mapeamento exato dos principais aparelhos de academia no Brasil
const EXACT_GYM_MAP = {
  'lever chest press': 'Supino Reto na Máquina',
  'lever incline chest press': 'Supino Inclinado na Máquina',
  'lever decline chest press': 'Supino Declinado na Máquina',
  'smith bench press': 'Supino Reto no Smith',
  'smith incline bench press': 'Supino Inclinado no Smith',
  'smith decline bench press': 'Supino Declinado no Smith',
  'smith close-grip bench press': 'Supino Fechado no Smith',
  'lever seated fly': 'Crucifixo na Máquina (Peck Deck)',
  'lever shoulder press': 'Desenvolvimento na Máquina',
  'lever lateral raise': 'Elevação Lateral na Máquina',
  'lever seated row': 'Remada Sentada na Máquina',
  'lever high row': 'Remada Alta na Máquina',
  'lever t-bar row': 'Remada Cavalinho na Máquina',
  'lever pulldown': 'Puxada Frontal na Máquina',
  'lever biceps curl': 'Rosca Bíceps na Máquina',
  'lever preacher curl': 'Rosca Scott na Máquina',
  'lever triceps extension': 'Tríceps na Máquina',
  'lever leg extension': 'Cadeira Extensora',
  'lever seated leg curl': 'Cadeira Flexora Sentada',
  'lever lying leg curl': 'Mesa Flexora Deitada',
  'lever seated hip abduction': 'Cadeira Abdutora',
  'lever seated hip adduction': 'Cadeira Adutora',
  'hip abduction machine': 'Cadeira Abdutora',
  'hip adduction machine': 'Cadeira Adutora',
  'sled 45° leg press': 'Leg Press 45°',
  'lever horizontal leg press': 'Leg Press Horizontal',
  'lever seated calf raise': 'Panturrilha Sentado na Máquina'
};

function smartTranslateFromOriginal(origEn, googlePt) {
  const lower = (origEn || '').toLowerCase().trim();
  if (EXACT_GYM_MAP[lower]) return EXACT_GYM_MAP[lower];

  if (lower.includes('hip abduction')) {
    return lower.includes('cable') ? 'Abdução de Quadril na Polia' : 'Cadeira Abdutora';
  }
  if (lower.includes('hip adduction')) {
    return lower.includes('cable') ? 'Adução de Quadril na Polia' : 'Cadeira Adutora';
  }
  if ((lower.includes('lever') || lower.includes('machine')) && lower.includes('chest press')) {
    if (lower.includes('incline')) return 'Supino Inclinado na Máquina';
    if (lower.includes('decline')) return 'Supino Declinado na Máquina';
    return 'Supino Reto na Máquina';
  }
  if (lower.includes('smith') && lower.includes('bench press')) {
    if (lower.includes('incline')) return 'Supino Inclinado no Smith';
    if (lower.includes('decline')) return 'Supino Declinado no Smith';
    if (lower.includes('close-grip') || lower.includes('close grip')) return 'Supino Fechado no Smith';
    return 'Supino Reto no Smith';
  }

  let polished = (googlePt || origEn)
    .replace(/chest press/gi, 'Supino')
    .replace(/low-pulley|low pulley/gi, 'na Polia Baixa')
    .replace(/side lateral/gi, 'Elevação Lateral')
    .replace(/abdução de quadril.*alavanca|abdução de quadril sentada/gi, 'Cadeira Abdutora')
    .replace(/adução de quadril.*alavanca|adução de quadril sentada/gi, 'Cadeira Adutora')
    .replace(/prensa de banco|supino reto de banco/gi, 'Supino')
    .replace(/prensa de pernas/gi, 'Leg Press')
    .replace(/prensa de ombros/gi, 'Desenvolvimento na Máquina')
    .replace(/puxar para baixo|puxada para baixo/gi, 'Puxada na Polia')
    .replace(/empurrar para baixo/gi, 'Tríceps Pulley')
    .replace(/onda de bíceps|cacho de bíceps|ondulação/gi, 'Rosca')
    .replace(/mosca|voar/gi, 'Crucifixo')
    .replace(/de alavanca|da alavanca|alavanca/gi, 'na Máquina')
    .replace(/cabo/gi, 'Polia')
    .replace(/haltere/gi, 'Halter')
    .replace(/barra ez/gi, 'Barra W')
    .replace(/levantamento de panturrilha/gi, 'Panturrilha')
    .replace(/extensão de perna/gi, 'Cadeira Extensora')
    .replace(/flexão de perna/gi, 'Mesa / Cadeira Flexora')
    .replace(/^na polia\s+/i, 'Polia: ')
    .replace(/^na máquina\s+/i, 'Máquina: ')
    .trim();

  return polished.charAt(0).toUpperCase() + polished.slice(1);
}

async function translateBatchToPortuguese(namesArray) {
  try {
    const joinedText = namesArray.join('\n');
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(joinedText)}`;
    const res = await fetch(url);
    const data = await res.json();

    const fullTranslated = data[0].map((chunk) => chunk[0]).join('');
    const lines = fullTranslated.split('\n');

    return namesArray.map((orig, idx) => {
      const rawPt = (lines[idx] || orig).trim();
      return smartTranslateFromOriginal(orig, rawPt);
    });
  } catch (e) {
    return namesArray.map((orig) => smartTranslateFromOriginal(orig, orig));
  }
}

function classifyEquipment(equip) {
  const e = (equip || '').toLowerCase();
  if (e === 'machine' || e === 'lever' || e === 'cable' || e === 'smith' || e === 'assisted') {
    return {
      equipmentType: 'maquina',
      equipmentLabel: e === 'cable' ? 'Polia / Máquina' : e === 'smith' ? 'Smith / Máquina' : 'Máquina'
    };
  }
  return {
    equipmentType: 'livre',
    equipmentLabel:
      e === 'barbell'
        ? 'Barra (Livre)'
        : e === 'dumbbell'
        ? 'Halteres (Livre)'
        : e === 'ez-bar'
        ? 'Barra W (Livre)'
        : 'Peso Livre / Corpo'
  };
}

export const fetchFullExerciseCatalog = async () => {
  try {
    // Remove qualquer cache antigo
    [
      'fitflow_exercisedb_gifs_v1',
      'fitflow_exercisedb_gifs_v2',
      'fitflow_exercisedb_gifs_pt_v3',
      'fitflow_exercisedb_gifs_pt_v4',
      'fitflow_exercisedb_gifs_pt_v5',
      'fitflow_exercisedb_gifs_pt_v6',
      'fitflow_open_gifs_pt_v1'
    ].forEach((k) => localStorage.removeItem(k));

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 200) return parsed;
    }
  } catch (e) {}

  const response = await fetch(EXERCISES_API_URL);
  if (!response.ok) {
    throw new Error(`Falha ao carregar catálogo (${response.status})`);
  }

  const jsonPayload = await response.json();
  const rawList = Array.isArray(jsonPayload)
    ? jsonPayload
    : jsonPayload.exercises || jsonPayload.data || Object.values(jsonPayload).find(Array.isArray) || [];

  // Mantém todos os aparelhos reais de academia
  const validEquipments = new Set([
    'machine',
    'lever',
    'cable',
    'smith',
    'barbell',
    'dumbbell',
    'ez-bar',
    'bodyweight',
    'assisted'
  ]);

  const filteredRaw = rawList.filter(
    (item) => (item.gifUrl || item.file) && validEquipments.has((item.equipment || '').toLowerCase())
  );

  const translatedNames = new Array(filteredRaw.length);
  const toTranslateIndices = [];
  const toTranslateTexts = [];

  filteredRaw.forEach((item, idx) => {
    const exact = EXACT_GYM_MAP[item.name?.toLowerCase().trim()];
    if (exact) {
      translatedNames[idx] = exact;
    } else {
      toTranslateIndices.push(idx);
      toTranslateTexts.push(item.name);
    }
  });

  // Traduz em blocos paralelos rápidos de 60 itens
  const chunkSize = 60;
  const batchPromises = [];
  for (let i = 0; i < toTranslateTexts.length; i += chunkSize) {
    const batchTexts = toTranslateTexts.slice(i, i + chunkSize);
    const batchIndices = toTranslateIndices.slice(i, i + chunkSize);
    batchPromises.push(
      translateBatchToPortuguese(batchTexts).then((ptBatch) => {
        ptBatch.forEach((ptName, bIdx) => {
          translatedNames[batchIndices[bIdx]] = ptName;
        });
      })
    );
  }
  await Promise.all(batchPromises);

  const normalized = filteredRaw.map((item, idx) => {
    const muscleGroup = BODYPART_MAP[item.bodyPart?.toLowerCase()] || 'Outros';
    const target = TARGET_MAP[item.target?.toLowerCase()] || item.target || muscleGroup;
    const { equipmentType, equipmentLabel } = classifyEquipment(item.equipment);
    const finalGif = item.gifUrl?.startsWith('http') ? item.gifUrl : `${CDN_BASE}/${item.file}`;

    return {
      id: item.id || `${idx}-${item.name}`,
      name: translatedNames[idx] || item.name,
      originalName: item.name,
      muscleGroup,
      target,
      equipmentType,
      equipmentLabel,
      gifUrl: finalGif,
      images: [finalGif]
    };
  });

  normalized.sort((a, b) => {
    const aPriority = EXACT_GYM_MAP[a.originalName?.toLowerCase().trim()] ? 0 : 1;
    const bPriority = EXACT_GYM_MAP[b.originalName?.toLowerCase().trim()] ? 0 : 1;
    return aPriority - bPriority;
  });

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(normalized));
  } catch (e) {}

  return normalized;
};