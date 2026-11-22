import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Clock,
  Flame,
  Dumbbell,
  Scale,
  TrendingUp,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function formatTotalHoursMinutes(totalSeconds) {
  const secs = Math.max(0, totalSeconds || 0);
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} min`;
}

function formatSessionClock(totalSeconds) {
  const secs = Math.max(0, totalSeconds || 0);
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const rem = secs % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

function getLocalDayKey(dateInput) {
  const d = new Date(dateInput);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function inferMuscleTag(session) {
  const text = `${session.workoutName || ''} ${(session.exercisesSummary || []).map((e) => e.name).join(' ')}`.toLowerCase();
  if (text.includes('peito') || text.includes('supino') || text.includes('crucifixo')) return 'Peito';
  if (text.includes('costas') || text.includes('puxada') || text.includes('remada')) return 'Costas';
  if (text.includes('perna') || text.includes('leg') || text.includes('agachamento') || text.includes('abdutora') || text.includes('adutora') || text.includes('extensora') || text.includes('flexora')) return 'Pernas';
  if (text.includes('ombro') || text.includes('desenvolvimento') || text.includes('elevação')) return 'Ombros';
  if (text.includes('bíceps') || text.includes('tríceps') || text.includes('rosca') || text.includes('pulley')) return 'Braços';
  return 'Geral';
}

// Gráfico SVG Responsivo Reutilizável (Sem bibliotecas pesadas, zero dados fictícios)
function ResponsiveLineChart({ points, unit = 'kg', accentColor = '#22c55e' }) {
  if (!points || points.length < 2) return null;

  const width = 340;
  const height = 135;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 26;

  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const spread = rawMax - rawMin || 2;
  const minVal = Math.max(0, rawMin - spread * 0.2);
  const maxVal = rawMax + spread * 0.2;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const coords = points.map((pt, idx) => {
    const x = padLeft + (idx / (points.length - 1)) * chartW;
    const y = padTop + chartH - ((pt.value - minVal) / (maxVal - minVal || 1)) * chartH;
    return { ...pt, x, y };
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaPoints = `${coords[0].x},${padTop + chartH} ${polylinePoints} ${coords[coords.length - 1].x},${padTop + chartH}`;

  return (
    <div style={{ width: '100%', overflow: 'hidden', marginTop: '8px' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id={`grad-${unit}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.32" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Linhas de grade horizontais (Máx e Mín) */}
        <line x1={padLeft} y1={padTop} x2={width - padRight} y2={padTop} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
        <line x1={padLeft} y1={padTop + chartH} x2={width - padRight} y2={padTop + chartH} stroke="#1e293b" strokeWidth="1" />

        <text x={padLeft - 6} y={padTop + 4} textAnchor="end" fill="#6b7280" fontSize="9" fontWeight="bold">
          {rawMax.toFixed(1).replace('.0', '')}{unit}
        </text>
        <text x={padLeft - 6} y={padTop + chartH} textAnchor="end" fill="#6b7280" fontSize="9" fontWeight="bold">
          {rawMin.toFixed(1).replace('.0', '')}{unit}
        </text>

        {/* Área sombreada */}
        <polygon points={areaPoints} fill={`url(#grad-${unit})`} />

        {/* Linha principal */}
        <polyline
          fill="none"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylinePoints}
        />

        {/* Pontos e rótulos de data */}
        {coords.map((c, idx) => {
          const showLabel = idx === 0 || idx === coords.length - 1 || (coords.length <= 6);
          return (
            <g key={idx}>
              <circle cx={c.x} cy={c.y} r="3.8" fill="#0b1118" stroke={accentColor} strokeWidth="2.2" />
              {showLabel && (
                <text x={c.x} y={height - 6} textAnchor="middle" fill="#9ca3af" fontSize="8.5" fontWeight="600">
                  {c.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ProgressView({ fitnessData, onLogNewWeight }) {
  const completedSessions = useMemo(() => fitnessData?.completedSessions || [], [fitnessData]);
  const weightHistory = useMemo(() => {
    const list = Array.isArray(fitnessData?.weightHistory) ? [...fitnessData.weightHistory] : [];
    return list.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [fitnessData]);
  const profile = fitnessData?.profile || {};

  // Estados do Modal de Atualização Semanal de Peso
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [newWeightInput, setNewWeightInput] = useState(String(profile.currentWeight || ''));
  const [savingWeight, setSavingWeight] = useState(false);

  // Estado do Seletor de Exercício (Seção 3)
  const [selectedExerciseName, setSelectedExerciseName] = useState('');

  // Estado de Navegação do Calendário Mensal (Seção 4)
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Estados de Filtro e Detalhes do Histórico (Seção 5)
  const [periodFilter, setPeriodFilter] = useState('all'); // '7d' | '30d' | 'all'
  const [muscleFilter, setMuscleFilter] = useState('Todos');
  const [selectedSessionModal, setSelectedSessionModal] = useState(null);

  // =========================================================================
  // 1. CÁLCULOS DO RESUMO GERAL (DADOS REAIS)
  // =========================================================================
  const summaryMetrics = useMemo(() => {
    const totalWorkouts = completedSessions.length;
    const totalSeconds = completedSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

    // Volume total movimentado (kg): soma de (séries efetivas * repetições * carga)
    let totalVolumeKg = 0;
    completedSessions.forEach((sess) => {
      (sess.exercisesSummary || []).forEach((ex) => {
        const sets = ex.setsDone > 0 ? ex.setsDone : ex.plannedSets || 1;
        const reps = parseInt(ex.reps, 10) || 10;
        const weight = parseFloat(ex.weight) || 0;
        totalVolumeKg += sets * reps * weight;
      });
    });

    // Sequência atual de dias consecutivos treinando (considerando hoje ou ontem como ativo)
    const uniqueDayStrings = Array.from(new Set(completedSessions.map((s) => getLocalDayKey(s.date)))).sort().reverse();
    let streakDays = 0;
    if (uniqueDayStrings.length > 0) {
      const todayStr = getLocalDayKey(new Date());
      const yesterdayStr = getLocalDayKey(Date.now() - 24 * 60 * 60 * 1000);

      if (uniqueDayStrings[0] === todayStr || uniqueDayStrings[0] === yesterdayStr) {
        streakDays = 1;
        let expectedPrev = new Date(uniqueDayStrings[0] + 'T12:00:00');
        for (let i = 1; i < uniqueDayStrings.length; i++) {
          expectedPrev = new Date(expectedPrev.getTime() - 24 * 60 * 60 * 1000);
          if (uniqueDayStrings[i] === getLocalDayKey(expectedPrev)) {
            streakDays++;
          } else {
            break;
          }
        }
      }
    }

    return {
      totalWorkouts,
      totalSeconds,
      streakDays,
      totalVolumeKg: Math.round(totalVolumeKg)
    };
  }, [completedSessions]);

  // =========================================================================
  // 2. EVOLUÇÃO DO PESO CORPORAL + LEMBRETE OBRIGATÓRIO DE 7 DIAS
  // =========================================================================
  const weightMetrics = useMemo(() => {
    const initialWeight = parseFloat(profile.initialWeight) || weightHistory[0]?.weight || parseFloat(profile.currentWeight) || 65;
    const currentWeight = weightHistory.length > 0
      ? weightHistory[weightHistory.length - 1].weight
      : parseFloat(profile.currentWeight) || initialWeight;
    const targetWeight = parseFloat(profile.targetWeight) || 80;

    const lastUpdateIso = weightHistory.length > 0
      ? weightHistory[weightHistory.length - 1].date
      : fitnessData?.updatedAt || null;

    const msSinceLastUpdate = lastUpdateIso ? Date.now() - new Date(lastUpdateIso).getTime() : SEVEN_DAYS_MS + 1;
    const isWeeklyUpdateDue = msSinceLastUpdate >= SEVEN_DAYS_MS;
    const daysRemainingForNext = Math.max(0, Math.ceil((SEVEN_DAYS_MS - msSinceLastUpdate) / (24 * 60 * 60 * 1000)));

    // Cálculo de quanto falta e percentual em direção à meta (funciona tanto para ganhar quanto para perder peso)
    const totalDistance = Math.abs(targetWeight - initialWeight);
    const achievedDistance = targetWeight >= initialWeight
      ? Math.max(0, currentWeight - initialWeight)
      : Math.max(0, initialWeight - currentWeight);

    const remainingKg = Math.max(0, Math.abs(targetWeight - currentWeight));
    const goalReached = (targetWeight >= initialWeight && currentWeight >= targetWeight) ||
      (targetWeight < initialWeight && currentWeight <= targetWeight);

    const progressPercent = goalReached
      ? 100
      : totalDistance > 0
      ? Math.min(100, Math.round((achievedDistance / totalDistance) * 100))
      : 0;

    const chartPoints = weightHistory.map((entry) => ({
      value: entry.weight,
      label: new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }));

    return {
      initialWeight,
      currentWeight,
      targetWeight,
      remainingKg: remainingKg.toFixed(1).replace('.0', ''),
      progressPercent,
      goalReached,
      isWeeklyUpdateDue,
      daysRemainingForNext,
      chartPoints
    };
  }, [weightHistory, profile, fitnessData]);

  const handleConfirmNewWeight = async (e) => {
    e.preventDefault();
    const val = parseFloat(newWeightInput);
    if (isNaN(val) || val <= 20 || val > 350) {
      alert('Informe um peso válido em kg.');
      return;
    }
    setSavingWeight(true);
    try {
      await onLogNewWeight(val);
      setWeightModalOpen(false);
    } catch (err) {
      console.error('Erro ao registrar peso:', err);
      alert('Erro ao salvar atualização de peso.');
    } finally {
      setSavingWeight(false);
    }
  };

  // =========================================================================
  // 3. EVOLUÇÃO DE CARGAS POR EXERCÍCIO (DADOS REAIS)
  // =========================================================================
  const exerciseHistoryMap = useMemo(() => {
    const map = new Map();
    const chronologicalSessions = [...completedSessions].sort((a, b) => new Date(a.date) - new Date(b.date));

    chronologicalSessions.forEach((sess) => {
      (sess.exercisesSummary || []).forEach((ex) => {
        if (!ex.name) return;
        const w = parseFloat(ex.weight) || 0;
        const list = map.get(ex.name) || [];
        list.push({
          date: sess.date,
          weight: w,
          reps: ex.reps || '10',
          label: new Date(sess.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        });
        map.set(ex.name, list);
      });
    });

    return map;
  }, [completedSessions]);

  const availableExerciseNames = useMemo(() => Array.from(exerciseHistoryMap.keys()), [exerciseHistoryMap]);
  const activeExerciseName = availableExerciseNames.includes(selectedExerciseName)
    ? selectedExerciseName
    : availableExerciseNames[0] || '';

  const activeExerciseStats = useMemo(() => {
    if (!activeExerciseName) return null;
    const records = exerciseHistoryMap.get(activeExerciseName) || [];
    if (records.length === 0) return null;

    const initialLoad = records[0].weight;
    const currentLoad = records[records.length - 1].weight;
    const maxLoad = Math.max(...records.map((r) => r.weight));
    const diffLoad = currentLoad - initialLoad;

    // Só considera recorde pessoal confiável se houver pelo menos 2 registros comparáveis e evolução real
    const hasReliableComparison = records.length >= 2;
    const isPersonalRecord = hasReliableComparison && currentLoad === maxLoad && currentLoad > initialLoad;

    return {
      records,
      initialLoad,
      currentLoad,
      maxLoad,
      diffLoad,
      hasReliableComparison,
      isPersonalRecord,
      chartPoints: records.map((r) => ({ value: r.weight, label: r.label }))
    };
  }, [activeExerciseName, exerciseHistoryMap]);

  // =========================================================================
  // 4. CALENDÁRIO MENSAL DE TREINOS
  // =========================================================================
  const calendarStats = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthSessions = completedSessions.filter((s) => {
      const d = new Date(s.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const trainedDaysOfMonth = new Set(monthSessions.map((s) => new Date(s.date).getDate()));
    const totalWorkoutsInMonth = monthSessions.length;
    const distinctTrainedDaysCount = trainedDaysOfMonth.size;

    // Frequência semanal média no mês
    const today = new Date();
    const elapsedDaysInMonth =
      year === today.getFullYear() && month === today.getMonth()
        ? Math.max(1, today.getDate())
        : daysInMonth;
    const weeksElapsed = Math.max(1, elapsedDaysInMonth / 7);
    const weeklyFrequency = (totalWorkoutsInMonth / weeksElapsed).toFixed(1).replace('.0', '');

    const monthLabel = calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const cells = [];
    for (let i = 0; i < firstDayWeekday; i++) {
      cells.push({ empty: true, key: `empty-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const isTrained = trainedDaysOfMonth.has(day);
      const isFuture =
        year > today.getFullYear() ||
        (year === today.getFullYear() && month > today.getMonth()) ||
        (year === today.getFullYear() && month === today.getMonth() && day > today.getDate());
      const isToday =
        year === today.getFullYear() && month === today.getMonth() && day === today.getDate();

      cells.push({
        empty: false,
        key: `day-${day}`,
        day,
        isTrained,
        isRestDay: !isTrained && !isFuture,
        isToday
      });
    }

    return {
      monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      cells,
      totalWorkoutsInMonth,
      distinctTrainedDaysCount,
      weeklyFrequency
    };
  }, [calendarDate, completedSessions]);

  // =========================================================================
  // 5. HISTÓRICO DE TREINOS FILTRADO
  // =========================================================================
  const filteredSessions = useMemo(() => {
    const now = Date.now();
    return [...completedSessions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .filter((sess) => {
        const diffDays = (now - new Date(sess.date).getTime()) / (24 * 60 * 60 * 1000);
        if (periodFilter === '7d' && diffDays > 7) return false;
        if (periodFilter === '30d' && diffDays > 30) return false;
        if (muscleFilter !== 'Todos' && inferMuscleTag(sess) !== muscleFilter) return false;
        return true;
      });
  }, [completedSessions, periodFilter, muscleFilter]);

  return (
    <div style={{ padding: '18px 18px 28px', color: '#ffffff', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* MODAL DE ATUALIZAÇÃO SEMANAL DE PESO */}
      {weightModalOpen && (
        <div
          onClick={() => setWeightModalOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleConfirmNewWeight}
            style={{ backgroundColor: '#141d26', border: '1.5px solid #22c55e', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale style={{ width: '18px', height: '18px', color: '#22c55e' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '900', margin: 0 }}>Atualizar Peso Corporal</h3>
              </div>
              <button type="button" onClick={() => setWeightModalOpen(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, lineHeight: '1.4' }}>
              O novo peso será adicionado ao seu histórico semanal sem apagar os registros anteriores. Sua meta de <strong style={{ color: '#22c55e' }}>{weightMetrics.targetWeight} kg</strong> será mantida.
            </p>

            <div style={{ backgroundColor: '#0b1118', border: '1px solid #22c55e', borderRadius: '12px', padding: '10px 14px' }}>
              <span style={{ fontSize: '9px', color: '#22c55e', fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>
                Peso Atual (kg)
              </span>
              <input
                type="number"
                step="0.1"
                required
                autoFocus
                value={newWeightInput}
                onChange={(e) => setNewWeightInput(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#ffffff', fontSize: '22px', fontWeight: '900', outline: 'none', marginTop: '2px' }}
              />
            </div>

            <button
              type="submit"
              disabled={savingWeight}
              style={{ width: '100%', backgroundColor: '#22c55e', color: '#000000', fontWeight: '900', fontSize: '13px', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
            >
              {savingWeight ? 'SALVANDO REGISTRO...' : 'CONFIRMAR NOVO PESO'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL DE DETALHES COMPLETOS DO TREINO */}
      {selectedSessionModal && (
        <div
          onClick={() => setSelectedSessionModal(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#141d26', border: '1px solid #22c55e', borderRadius: '20px', padding: '18px', width: '100%', maxWidth: '360px', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: '900', textTransform: 'uppercase' }}>
                  Detalhes da Sessão
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '900', margin: '2px 0' }}>{selectedSessionModal.workoutName}</h3>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {new Date(selectedSessionModal.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • Duração: {formatSessionClock(selectedSessionModal.durationSeconds)}
                </span>
              </div>
              <button onClick={() => setSelectedSessionModal(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #222f3e', paddingTop: '10px' }}>
              {(selectedSessionModal.exercisesSummary || []).map((ex, i) => (
                <div key={i} style={{ backgroundColor: '#0b1118', border: '1px solid #1e293b', borderRadius: '12px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '12px', color: '#ffffff', display: 'block' }}>{i + 1}. {ex.name}</strong>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                      {ex.setsDone || ex.plannedSets} séries × {ex.reps} repetições
                    </span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '900', color: '#22c55e' }}>{ex.weight} kg</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <header>
        <h1 style={{ fontSize: '19px', fontWeight: '900', margin: '0 0 2px 0' }}>Meu Progresso</h1>
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
          Painel completo da sua evolução física e desempenho nos treinos.
        </p>
      </header>

      {/* ===================================================================== */}
      {/* 1. RESUMO GERAL                                                       */}
      {/* ===================================================================== */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <div style={{ backgroundColor: '#141d26', border: '1px solid #1e293b', borderRadius: '16px', padding: '12px' }}>
          <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
            <CheckCircle2 style={{ width: '12px', height: '12px', color: '#22c55e' }} /> TREINOS CONCLUÍDOS
          </span>
          <strong style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>{summaryMetrics.totalWorkouts}</strong>
        </div>

        <div style={{ backgroundColor: '#141d26', border: '1px solid #1e293b', borderRadius: '16px', padding: '12px' }}>
          <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
            <Clock style={{ width: '12px', height: '12px', color: '#38bdf8' }} /> TEMPO DEDICADO
          </span>
          <strong style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>
            {formatTotalHoursMinutes(summaryMetrics.totalSeconds)}
          </strong>
        </div>

        <div style={{ backgroundColor: '#141d26', border: '1px solid #1e293b', borderRadius: '16px', padding: '12px' }}>
          <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
            <Flame style={{ width: '12px', height: '12px', color: '#f97316' }} /> SEQUÊNCIA ATUAL
          </span>
          <strong style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>
            {summaryMetrics.streakDays} {summaryMetrics.streakDays === 1 ? 'dia' : 'dias'}
          </strong>
        </div>

        <div style={{ backgroundColor: '#141d26', border: '1px solid #1e293b', borderRadius: '16px', padding: '12px' }}>
          <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
            <Dumbbell style={{ width: '12px', height: '12px', color: '#22c55e' }} /> VOLUME MOVIMENTADO
          </span>
          <strong style={{ fontSize: '18px', fontWeight: '900', color: '#22c55e' }}>
            {summaryMetrics.totalVolumeKg.toLocaleString('pt-BR')} kg
          </strong>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. EVOLUÇÃO DO PESO CORPORAL ("Minha Evolução")                       */}
      {/* ===================================================================== */}
      <section style={{ backgroundColor: '#141d26', border: '1px solid #1e293b', borderRadius: '18px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Scale style={{ width: '15px', height: '15px', color: '#22c55e' }} />
            <h2 style={{ fontSize: '14px', fontWeight: '900', margin: 0 }}>Minha Evolução</h2>
          </div>

          <button
            type="button"
            onClick={() => {
              setNewWeightInput(String(weightMetrics.currentWeight));
              setWeightModalOpen(true);
            }}
            style={{ backgroundColor: '#0b1118', border: '1px solid #22c55e', color: '#22c55e', fontSize: '10px', fontWeight: '800', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus style={{ width: '12px', height: '12px' }} />
            <span>Registrar Peso</span>
          </button>
        </div>

        {/* ALERTA OBRIGATÓRIO DE ATUALIZAÇÃO SEMANAL (7 DIAS) */}
        {weightMetrics.isWeeklyUpdateDue ? (
          <div
            onClick={() => {
              setNewWeightInput(String(weightMetrics.currentWeight));
              setWeightModalOpen(true);
            }}
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.14)',
              border: '1px solid #22c55e',
              borderRadius: '12px',
              padding: '10px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <AlertCircle style={{ width: '18px', height: '18px', color: '#22c55e', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '12px', color: '#ffffff', display: 'block', marginBottom: '2px' }}>
                Está na hora de atualizar seu peso! ⚖️
              </strong>
              <p style={{ fontSize: '11px', color: '#d1d5db', margin: 0, lineHeight: '1.35' }}>
                Já se passaram 7 dias desde sua última atualização. Registre seu peso atual para acompanhar sua evolução em direção à sua meta.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '10px', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
            <span>Peso atualizado nesta semana</span>
            <span>Próximo lembrete em {weightMetrics.daysRemainingForNext} {weightMetrics.daysRemainingForNext === 1 ? 'dia' : 'dias'}</span>
          </div>
        )}

        {/* Indicadores: Inicial | Atual | Meta | Falta */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
          <div style={{ backgroundColor: '#0b1118', padding: '8px 4px', borderRadius: '10px' }}>
            <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>INICIAL</span>
            <strong style={{ fontSize: '13px', color: '#ffffff' }}>{weightMetrics.initialWeight}kg</strong>
          </div>
          <div style={{ backgroundColor: '#0b1118', padding: '8px 4px', borderRadius: '10px' }}>
            <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>ATUAL</span>
            <strong style={{ fontSize: '13px', color: '#22c55e' }}>{weightMetrics.currentWeight}kg</strong>
          </div>
          <div style={{ backgroundColor: '#0b1118', padding: '8px 4px', borderRadius: '10px' }}>
            <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>META</span>
            <strong style={{ fontSize: '13px', color: '#ffffff' }}>{weightMetrics.targetWeight}kg</strong>
          </div>
          <div style={{ backgroundColor: '#0b1118', padding: '8px 4px', borderRadius: '10px' }}>
            <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>FALTA</span>
            <strong style={{ fontSize: '13px', color: '#facc15' }}>
              {weightMetrics.goalReached ? '0kg' : `${weightMetrics.remainingKg}kg`}
            </strong>
          </div>
        </div>

        {/* Barra de Percentual em Direção à Meta */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
            <span style={{ color: '#9ca3af' }}>Progresso em direção à meta</span>
            <strong style={{ color: '#22c55e' }}>{weightMetrics.progressPercent}%</strong>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#0b1118', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${weightMetrics.progressPercent}%`, height: '100%', backgroundColor: '#22c55e', borderRadius: '999px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Gráfico de Evolução do Peso (somente com dados reais) */}
        {weightMetrics.chartPoints.length >= 2 ? (
          <ResponsiveLineChart points={weightMetrics.chartPoints} unit="kg" accentColor="#22c55e" />
        ) : (
          <p style={{ fontSize: '11px', color: '#9ca3af', backgroundColor: '#0b1118', padding: '10px', borderRadius: '10px', margin: 0, textAlign: 'center' }}>
            Continue registrando suas atualizações semanais de peso para visualizar o gráfico de evolução ao longo das semanas.
          </p>
        )}
      </section>

      {/* ===================================================================== */}
      {/* 3. EVOLUÇÃO DE CARGAS ("Evolução nos Exercícios")                     */}
      {/* ===================================================================== */}
      <section style={{ backgroundColor: '#141d26', border: '1px solid #1e293b', borderRadius: '18px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp style={{ width: '15px', height: '15px', color: '#22c55e' }} />
            <h2 style={{ fontSize: '14px', fontWeight: '900', margin: 0 }}>Evolução nos Exercícios</h2>
          </div>

          {activeExerciseStats?.isPersonalRecord && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(250, 204, 21, 0.15)', border: '1px solid rgba(250, 204, 21, 0.4)', color: '#facc15', fontSize: '9px', fontWeight: '900', padding: '3px 7px', borderRadius: '999px' }}>
              <Trophy style={{ width: '10px', height: '10px' }} /> RECORDE PESSOAL
            </span>
          )}
        </div>

        {availableExerciseNames.length === 0 ? (
          <p style={{ fontSize: '11px', color: '#9ca3af', backgroundColor: '#0b1118', padding: '12px', borderRadius: '10px', margin: 0, textAlign: 'center' }}>
            Conclua seu primeiro treino para acompanhar a evolução real de carga em cada exercício.
          </p>
        ) : (
          <>
            {/* Seletor de Exercício */}
            <select
              value={activeExerciseName}
              onChange={(e) => setSelectedExerciseName(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0b1118', border: '1px solid #222f3e', borderRadius: '10px', padding: '9px 10px', color: '#ffffff', fontSize: '12px', fontWeight: 'bold', outline: 'none' }}
            >
              {availableExerciseNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {activeExerciseStats && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                  <div style={{ backgroundColor: '#0b1118', padding: '8px 4px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>INICIAL</span>
                    <strong style={{ fontSize: '12px', color: '#ffffff' }}>{activeExerciseStats.initialLoad}kg</strong>
                  </div>
                  <div style={{ backgroundColor: '#0b1118', padding: '8px 4px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>ATUAL</span>
                    <strong style={{ fontSize: '12px', color: '#22c55e' }}>{activeExerciseStats.currentLoad}kg</strong>
                  </div>
                  <div style={{ backgroundColor: '#0b1118', padding: '8px 4px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>MAIOR</span>
                    <strong style={{ fontSize: '12px', color: '#facc15' }}>{activeExerciseStats.maxLoad}kg</strong>
                  </div>
                  <div style={{ backgroundColor: '#0b1118', padding: '8px 4px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>DIFERENÇA</span>
                    <strong style={{ fontSize: '12px', color: activeExerciseStats.diffLoad >= 0 ? '#22c55e' : '#f87171' }}>
                      {activeExerciseStats.diffLoad > 0 ? `+${activeExerciseStats.diffLoad}kg` : `${activeExerciseStats.diffLoad}kg`}
                    </strong>
                  </div>
                </div>

                {activeExerciseStats.hasReliableComparison ? (
                  <ResponsiveLineChart points={activeExerciseStats.chartPoints} unit="kg" accentColor="#22c55e" />
                ) : (
                  <p style={{ fontSize: '11px', color: '#9ca3af', backgroundColor: '#0b1118', padding: '10px', borderRadius: '10px', margin: 0, textAlign: 'center' }}>
                    Primeiro registro salvo ({activeExerciseStats.currentLoad} kg). Conclua mais sessões deste exercício para gerar o gráfico comparativo de evolução.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </section>

      {/* ===================================================================== */}
      {/* 4. CALENDÁRIO DE TREINOS                                              */}
      {/* ===================================================================== */}
      <section style={{ backgroundColor: '#141d26', border: '1px solid #1e293b', borderRadius: '18px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CalendarIcon style={{ width: '15px', height: '15px', color: '#22c55e' }} />
            <h2 style={{ fontSize: '14px', fontWeight: '900', margin: 0 }}>Calendário de Treinos</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
              style={{ backgroundColor: '#0b1118', border: '1px solid #222f3e', color: '#ffffff', borderRadius: '8px', padding: '4px', cursor: 'pointer' }}
            >
              <ChevronLeft style={{ width: '14px', height: '14px' }} />
            </button>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#e5e7eb', minWidth: '105px', textAlign: 'center' }}>
              {calendarStats.monthLabel}
            </span>
            <button
              type="button"
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
              style={{ backgroundColor: '#0b1118', border: '1px solid #222f3e', color: '#ffffff', borderRadius: '8px', padding: '4px', cursor: 'pointer' }}
            >
              <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>

        {/* Métricas do Mês */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center' }}>
          <div style={{ backgroundColor: '#0b1118', padding: '7px 4px', borderRadius: '10px' }}>
            <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>TREINOS NO MÊS</span>
            <strong style={{ fontSize: '13px', color: '#22c55e' }}>{calendarStats.totalWorkoutsInMonth}</strong>
          </div>
          <div style={{ backgroundColor: '#0b1118', padding: '7px 4px', borderRadius: '10px' }}>
            <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>DIAS TREINADOS</span>
            <strong style={{ fontSize: '13px', color: '#ffffff' }}>{calendarStats.distinctTrainedDaysCount}</strong>
          </div>
          <div style={{ backgroundColor: '#0b1118', padding: '7px 4px', borderRadius: '10px' }}>
            <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>FREQ. SEMANAL</span>
            <strong style={{ fontSize: '13px', color: '#38bdf8' }}>{calendarStats.weeklyFrequency}x / sem</strong>
          </div>
        </div>

        {/* Grade de Dias da Semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <span key={i} style={{ fontSize: '9px', fontWeight: '800', color: '#6b7280', paddingBottom: '2px' }}>{d}</span>
          ))}

          {calendarStats.cells.map((cell) => {
            if (cell.empty) {
              return <div key={cell.key} style={{ height: '30px' }} />;
            }
            return (
              <div
                key={cell.key}
                title={cell.isTrained ? 'Dia treinado' : cell.isRestDay ? 'Dia de descanso' : ''}
                style={{
                  height: '30px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: cell.isTrained ? '900' : '600',
                  backgroundColor: cell.isTrained ? '#22c55e' : cell.isRestDay ? '#0b1118' : 'transparent',
                  color: cell.isTrained ? '#000000' : cell.isRestDay ? '#6b7280' : '#4b5563',
                  border: cell.isToday ? '1.5px solid #38bdf8' : '1px solid #1e293b'
                }}
              >
                {cell.day}
              </div>
            );
          })}
        </div>

        {/* Legenda do Calendário */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', fontSize: '9px', color: '#9ca3af' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#22c55e' }} /> Treino concluído
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#0b1118', border: '1px solid #1e293b' }} /> Descanso
          </span>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. HISTÓRICO DE TREINOS (COM FILTROS E DETALHES COMPLETOS)            */}
      {/* ===================================================================== */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter style={{ width: '14px', height: '14px', color: '#22c55e' }} />
            <h2 style={{ fontSize: '14px', fontWeight: '900', margin: 0 }}>Histórico de Treinos</h2>
          </div>
          <span style={{ fontSize: '10px', color: '#9ca3af' }}>{filteredSessions.length} registros</span>
        </div>

        {/* Filtros por Período e Grupo Muscular */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Todo período' },
            { id: '7d', label: 'Últimos 7 dias' },
            { id: '30d', label: 'Últimos 30 dias' }
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriodFilter(p.id)}
              style={{
                padding: '5px 10px',
                borderRadius: '999px',
                fontSize: '10px',
                fontWeight: '800',
                cursor: 'pointer',
                backgroundColor: periodFilter === p.id ? '#22c55e' : '#141d26',
                color: periodFilter === p.id ? '#000000' : '#9ca3af',
                border: periodFilter === p.id ? 'none' : '1px solid #222f3e'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMuscleFilter(m)}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                backgroundColor: muscleFilter === m ? 'rgba(34, 197, 94, 0.18)' : '#141d26',
                color: muscleFilter === m ? '#22c55e' : '#9ca3af',
                border: muscleFilter === m ? '1px solid #22c55e' : '1px solid #1e293b'
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {filteredSessions.length === 0 ? (
          <div style={{ backgroundColor: '#141d26', border: '1px dashed #222f3e', borderRadius: '16px', padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '11px' }}>
            Nenhum treino encontrado para este filtro. Continue registrando seus treinos para acompanhar seu histórico completo!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredSessions.map((sess) => {
              const dateFormatted = new Date(sess.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={sess.id}
                  onClick={() => setSelectedSessionModal(sess)}
                  style={{
                    backgroundColor: '#141d26',
                    border: '1px solid #1e293b',
                    borderRadius: '16px',
                    padding: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: '900', color: '#22c55e', margin: '0 0 2px 0' }}>{sess.workoutName}</h3>
                      <span style={{ fontSize: '10px', color: '#9ca3af' }}>{dateFormatted}</span>
                    </div>
                    <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.35)', padding: '3px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock style={{ width: '10px', height: '10px', color: '#22c55e' }} />
                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#22c55e' }}>
                        {formatSessionClock(sess.durationSeconds || 0)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #1e293b', paddingTop: '7px' }}>
                    {(sess.exercisesSummary || []).slice(0, 3).map((exItem, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                          {exItem.name}
                        </span>
                        <strong style={{ color: '#22c55e' }}>{exItem.weight} kg • {exItem.reps} reps</strong>
                      </div>
                    ))}
                    {(sess.exercisesSummary || []).length > 3 && (
                      <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 'bold', marginTop: '2px' }}>
                        + Ver todos os {(sess.exercisesSummary || []).length} exercícios realizados
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}