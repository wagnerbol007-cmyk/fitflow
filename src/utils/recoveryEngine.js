const MUSCLE_RECOVERY_HOURS = {
  Pernas: 72,
  Costas: 60,
  Peito: 48,
  Ombros: 48,
  Bíceps: 36,
  Tríceps: 36,
  Core: 24,
  Geral: 48
};

function getLocalDayKey(dateInput) {
  const d = new Date(dateInput);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function extractSpecificMuscles(workout) {
  const text = `${workout?.group || ''} ${workout?.name || ''} ${(workout?.exercises || [])
    .map((e) => e.name || '')
    .join(' ')}`.toLowerCase();

  const detected = new Set();

  if (text.includes('peito') || text.includes('peitoral') || text.includes('supino') || text.includes('crucifixo') || text.includes('peck')) {
    detected.add('Peito');
  }
  if (text.includes('costas') || text.includes('dorsal') || text.includes('puxada') || text.includes('remada') || text.includes('pulldown') || text.includes('serrote')) {
    detected.add('Costas');
  }
  if (text.includes('perna') || text.includes('quadríceps') || text.includes('posterior') || text.includes('glúteo') || text.includes('leg') || text.includes('agachamento') || text.includes('abdutora') || text.includes('adutora') || text.includes('extensora') || text.includes('flexora') || text.includes('panturrilha')) {
    detected.add('Pernas');
  }
  if (text.includes('ombro') || text.includes('deltoide') || text.includes('desenvolvimento') || text.includes('elevação lateral') || text.includes('elevação frontal')) {
    detected.add('Ombros');
  }
  if (text.includes('bíceps') || text.includes('biceps') || text.includes('rosca')) {
    detected.add('Bíceps');
  }
  if (text.includes('tríceps') || text.includes('triceps') || text.includes('pulley') || text.includes('testa') || text.includes('francês') || text.includes('corda') || text.includes('mergulho')) {
    detected.add('Tríceps');
  }
  if (text.includes('core') || text.includes('abdômen') || text.includes('abdominal') || text.includes('prancha') || text.includes('joelhos')) {
    detected.add('Core');
  }

  return detected.size > 0 ? Array.from(detected) : [`Ficha_${workout?.id || 'Geral'}`];
}

export function evaluateWorkoutCircleStatus(workout, workouts = [], completedSessions = []) {
  const now = Date.now();
  const sortedSessions = [...completedSessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const groups = extractSpecificMuscles(workout);

  const lastSession = sortedSessions[0];
  const wasJustTrained = lastSession && lastSession.workoutId === workout?.id;

  let worstState = {
    level: 'green',
    color: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.35)',
    circleBadge: 'MÚSCULOS LIVRES PARA TREINO',
    hoursRemaining: 0,
    recoveryPercent: 100
  };

  groups.forEach((group) => {
    const requiredHours = MUSCLE_RECOVERY_HOURS[group] || 48;

    const lastSessionIndex = sortedSessions.findIndex((sess) => {
      const wObj = workouts.find((w) => w.id === sess.workoutId) || {
        id: sess.workoutId,
        name: sess.workoutName,
        exercises: sess.exercisesSummary
      };
      return extractSpecificMuscles(wObj).includes(group);
    });

    if (lastSessionIndex === -1) return;

    const lastSess = sortedSessions[lastSessionIndex];
    const hoursElapsed = (now - new Date(lastSess.date).getTime()) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, Math.ceil(requiredHours - hoursElapsed));
    const recoveryPercent = Math.min(100, Math.round((hoursElapsed / requiredHours) * 100));

    // 1. Acabou de ser feito ou menos de metade do descanso cumprido -> Vermelho (Descanse!)
    if ((wasJustTrained && hoursElapsed < requiredHours) || (hoursElapsed < requiredHours * 0.5 && hoursRemaining > 0)) {
      if (hoursRemaining >= worstState.hoursRemaining) {
        worstState = {
          level: 'red',
          color: '#ef4444',
          glow: 'rgba(239, 68, 68, 0.45)',
          circleBadge: `MÚSCULOS EM DESCANSO (${hoursRemaining}h)`,
          hoursRemaining,
          recoveryPercent
        };
      }
    }
    // 2. Passou da metade, mas ainda em repouso -> Laranja (Recuperando)
    else if (hoursElapsed < requiredHours && hoursRemaining > 0) {
      if (worstState.level !== 'red' && hoursRemaining >= worstState.hoursRemaining) {
        worstState = {
          level: 'orange',
          color: '#f97316',
          glow: 'rgba(249, 115, 22, 0.45)',
          circleBadge: `MÚSCULOS EM RECUPERAÇÃO (${hoursRemaining}h)`,
          hoursRemaining,
          recoveryPercent
        };
      }
    }
  });

  return worstState;
}

export function getRecommendedNextWorkoutIndex(workouts = [], completedSessions = []) {
  if (!workouts.length) return 0;
  if (!completedSessions.length) return 0;

  const sortedSessions = [...completedSessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestSession = sortedSessions[0];
  const todayKey = getLocalDayKey(new Date());

  if (latestSession && getLocalDayKey(latestSession.date) === todayKey) {
    const todayIdx = workouts.findIndex((w) => w.id === latestSession.workoutId);
    if (todayIdx >= 0) return todayIdx;
  }

  const lastIdx = workouts.findIndex((w) => w.id === latestSession?.workoutId);
  if (lastIdx >= 0) {
    for (let offset = 1; offset <= workouts.length; offset++) {
      const candidateIdx = (lastIdx + offset) % workouts.length;
      const status = evaluateWorkoutCircleStatus(workouts[candidateIdx], workouts, completedSessions);
      if (status.level === 'green') return candidateIdx;
    }
    return (lastIdx + 1) % workouts.length;
  }

  return 0;
}