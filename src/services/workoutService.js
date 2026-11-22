import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseAuth';
import { fetchFullExerciseCatalog } from '../data/exerciseCatalog';

// Busca os dados completos do usuário e garante compatibilidade com perfis antigos (sem weightHistory)
export const getUserFitnessData = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;

  const data = snap.data();

  // Migração retroativa segura: se o usuário já tinha perfil mas ainda não tinha weightHistory, inicializa com o peso cadastrado
  if (data.profile && (!Array.isArray(data.weightHistory) || data.weightHistory.length === 0)) {
    const initialWeight = parseFloat(data.profile.currentWeight);
    if (!isNaN(initialWeight) && initialWeight > 0) {
      const fallbackDate = data.updatedAt || new Date().toISOString();
      const seededHistory = [
        {
          id: `seed-${new Date(fallbackDate).getTime()}`,
          weight: initialWeight,
          date: fallbackDate
        }
      ];
      await updateDoc(userRef, { weightHistory: seededHistory });
      return { ...data, weightHistory: seededHistory };
    }
  }

  return data;
};

// Salva o perfil inicial, a primeira grade de treinos e o primeiro registro de peso datado
export const saveInitialPlan = async (uid, profileData, workouts) => {
  const userRef = doc(db, 'users', uid);
  const nowIso = new Date().toISOString();
  const initialWeight = parseFloat(profileData.currentWeight) || 65;

  const payload = {
    profile: {
      ...profileData,
      initialWeight
    },
    weightHistory: [
      {
        id: Date.now(),
        weight: initialWeight,
        date: nowIso
      }
    ],
    workouts,
    completedSessions: [],
    updatedAt: nowIso
  };

  await setDoc(userRef, payload);
  return payload;
};

// Registra uma nova atualização semanal de peso corporal sem apagar o histórico e sem alterar a meta
export const logUserBodyWeight = async (uid, newWeightValue) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;

  const currentData = snap.data();
  const parsedWeight = parseFloat(newWeightValue);
  if (isNaN(parsedWeight) || parsedWeight <= 20 || parsedWeight > 350) {
    throw new Error('Peso inválido.');
  }

  const nowIso = new Date().toISOString();
  const existingHistory = Array.isArray(currentData.weightHistory) ? currentData.weightHistory : [];

  // Recalcula IMC e status mantendo intacta a meta (targetWeight) definida pelo usuário
  const heightM = (parseFloat(currentData.profile?.heightCm) || 175) / 100;
  const bmi = heightM > 0.5 ? parseFloat((parsedWeight / (heightM * heightM)).toFixed(1)) : null;
  let bodyStatusLabel = currentData.profile?.bodyStatusLabel || 'Ideal';
  if (bmi) {
    if (bmi < 18.5) bodyStatusLabel = 'Abaixo do peso';
    else if (bmi < 25) bodyStatusLabel = 'Peso ideal';
    else if (bmi < 30) bodyStatusLabel = 'Acima do peso';
    else bodyStatusLabel = 'Obesidade';
  }

  const newEntry = {
    id: Date.now(),
    weight: parsedWeight,
    date: nowIso
  };

  const updatedHistory = [...existingHistory, newEntry];
  const updatedProfile = {
    ...currentData.profile,
    initialWeight: currentData.profile?.initialWeight || existingHistory[0]?.weight || parsedWeight,
    currentWeight: parsedWeight,
    bmi,
    bodyStatusLabel
  };

  await updateDoc(userRef, {
    profile: updatedProfile,
    weightHistory: updatedHistory,
    updatedAt: nowIso
  });

  return {
    ...currentData,
    profile: updatedProfile,
    weightHistory: updatedHistory,
    updatedAt: nowIso
  };
};

// Atualiza as fichas de treino e grava nova sessão concluída (evitando duplicação por ID)
export const updateUserWorkouts = async (uid, workouts, newSessionLog = null) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const currentData = snap.data();
  const existingSessions = currentData.completedSessions || [];

  let updatedSessions = existingSessions;
  if (newSessionLog) {
    const alreadyExists = existingSessions.some((s) => s.id === newSessionLog.id);
    updatedSessions = alreadyExists ? existingSessions : [...existingSessions, newSessionLog];
  }

  await updateDoc(userRef, {
    workouts,
    completedSessions: updatedSessions,
    updatedAt: new Date().toISOString()
  });
};

// ==========================================
// GERADOR INTELIGENTE DE FICHAS (ROTAÇÃO ABC FLUIDA)
// ==========================================
const GEMINI_API_KEY = '';

const pickFromFullCatalog = (fullCatalog, muscleGroups, equipmentPref, count, defaultSets, defaultReps, keywordFilter = null) => {
  let pool = fullCatalog.filter((ex) => muscleGroups.includes(ex.muscleGroup));
  if (keywordFilter) {
    const filteredByKey = pool.filter((ex) => ex.name.toLowerCase().includes(keywordFilter));
    if (filteredByKey.length > 0) pool = filteredByKey;
  }

  const sorted = [...pool].sort((a, b) => {
    if (equipmentPref === 'misto') return 0;
    const aMatch = a.equipmentType === equipmentPref ? 0 : 1;
    const bMatch = b.equipmentType === equipmentPref ? 0 : 1;
    return aMatch - bMatch;
  });

  return sorted.slice(0, count).map((ex, idx) => ({
    id: `${ex.id}-${idx}`,
    name: ex.name,
    target: ex.target,
    equipmentLabel: ex.equipmentLabel,
    gifUrl: ex.gifUrl,
    images: ex.images,
    plannedSets: defaultSets,
    historicalRecord: 20,
    currentWeight: '20',
    currentReps: defaultReps
  }));
};

export const generateSmartWorkouts = async ({ goal, equipmentPref = 'misto', currentWeight, targetWeight, daysPerWeek }) => {
  const fullCatalog = await fetchFullExerciseCatalog();
  const isHypertrophy = goal === 'hipertrofia';
  const defaultReps = isHypertrophy ? '10' : goal === 'emagrecimento' ? '15' : '12';
  const defaultSets = isHypertrophy ? 4 : 3;

  if (GEMINI_API_KEY) {
    try {
      const compactSample = fullCatalog.slice(0, 120).map((e) => `${e.id}: ${e.name} (${e.muscleGroup} - ${e.equipmentLabel})`).join('\n');
      const prompt = `Crie uma divisão de treino fluida em 3 treinos rotativos (A, B e C) para ${daysPerWeek} dias/semana, objetivo ${goal}, preferência ${equipmentPref}, peso ${currentWeight}kg e meta ${targetWeight}kg. Base de exercícios:\n${compactSample}\nResponda APENAS JSON válido: [{"id":"A","name":"Treino A - ...","group":"...","subtitle":"...","exercises":[{"id":"...","name":"...","target":"...","plannedSets":4,"historicalRecord":20,"currentWeight":"20","currentReps":"10"}]}]`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return JSON.parse(text);
    } catch (e) {
      console.warn('Fallback para gerador local:', e);
    }
  }

  return [
    {
      id: 'A',
      name: 'Treino A - Peito, Ombro e Tríceps',
      group: 'PEITO • OMBRO',
      subtitle: 'Peitoral • Deltoides • Tríceps',
      exercises: [
        ...pickFromFullCatalog(fullCatalog, ['Peito'], equipmentPref, 2, defaultSets, defaultReps),
        ...pickFromFullCatalog(fullCatalog, ['Ombros'], equipmentPref, 2, 3, defaultReps),
        ...pickFromFullCatalog(fullCatalog, ['Braços'], equipmentPref, 1, defaultSets, defaultReps, 'tríceps')
      ]
    },
    {
      id: 'B',
      name: 'Treino B - Costas e Bíceps',
      group: 'COSTAS • BÍCEPS',
      subtitle: 'Dorsais • Lombar • Bíceps',
      exercises: [
        ...pickFromFullCatalog(fullCatalog, ['Costas'], equipmentPref, 3, defaultSets, defaultReps),
        ...pickFromFullCatalog(fullCatalog, ['Braços'], equipmentPref, 2, defaultSets, defaultReps, 'rosca')
      ]
    },
    {
      id: 'C',
      name: 'Treino C - Pernas e Core',
      group: 'PERNAS • CORE',
      subtitle: 'Quadríceps • Posterior • Abdômen',
      exercises: [
        ...pickFromFullCatalog(fullCatalog, ['Pernas'], equipmentPref, 4, defaultSets, defaultReps),
        ...pickFromFullCatalog(fullCatalog, ['Core'], equipmentPref, 1, 3, '15')
      ]
    }
  ];
};