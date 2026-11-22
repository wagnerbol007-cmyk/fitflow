import React, { useState } from 'react';
import { Dumbbell, RefreshCw, Play, Calendar, Flame, Target, Zap, AlertTriangle, Check, CheckCircle2 } from 'lucide-react';
import { evaluateWorkoutCircleStatus } from '../utils/recoveryEngine';

function getLocalDayKey(dateInput) {
  const d = new Date(dateInput);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Dashboard({
  user,
  fitnessData,
  selectedWorkoutIndex,
  onSelectWorkout,
  onStartWorkout,
  onResetPlan
}) {
  const [confirmFatigueModal, setConfirmFatigueModal] = useState(false);

  const workouts = fitnessData?.workouts || [];
  const completedSessions = fitnessData?.completedSessions || [];
  const profile = fitnessData?.profile || {};
  const activeWorkout = workouts[selectedWorkoutIndex] || workouts[0];

  // Avalia o semáforo do treino atualmente selecionado (Verde, Laranja ou Vermelho)
  const workoutStatuses = workouts.map((w) => evaluateWorkoutCircleStatus(w, workouts, completedSessions));
  const circleStatus = workoutStatuses[selectedWorkoutIndex] || {
    level: 'green',
    color: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.35)',
    circleBadge: 'LIVRE PARA TREINAR'
  };

  // Verifica se o usuário já concluiu algum treino HOJE
  const now = new Date();
  const todayKey = getLocalDayKey(now);
  const todaySession = completedSessions.find((s) => getLocalDayKey(s.date) === todayKey);
  const alreadyTrainedToday = Boolean(todaySession);
  const isViewingTodaysCompletedWorkout = alreadyTrainedToday && todaySession.workoutId === activeWorkout?.id;

  // Cálculo da semana atual (Domingo a Sábado)
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const sessionsThisWeek = completedSessions.filter(
    (s) => new Date(s.date).getTime() >= startOfWeek.getTime()
  );

  const daysPerWeek = profile.daysPerWeek || 3;
  const weeklyPercent = Math.min(100, Math.round((sessionsThisWeek.length / daysPerWeek) * 100));

  // Sequência consecutiva de dias treinando (Streak)
  const uniqueDayStrings = Array.from(new Set(completedSessions.map((s) => getLocalDayKey(s.date)))).sort().reverse();
  let streakDays = 0;
  if (uniqueDayStrings.length > 0) {
    const yesterdayStr = getLocalDayKey(Date.now() - 24 * 60 * 60 * 1000);
    if (uniqueDayStrings[0] === todayKey || uniqueDayStrings[0] === yesterdayStr) {
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

  const isFireLit = streakDays >= 2 || weeklyPercent >= 60;

  const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const todayIndex = now.getDay();
  const trainedDaysInCurrentWeek = new Set(sessionsThisWeek.map((s) => new Date(s.date).getDay()));

  const handleStartClick = () => {
    if (alreadyTrainedToday) return;
    if (circleStatus.level === 'red' || circleStatus.level === 'orange') {
      setConfirmFatigueModal(true);
      return;
    }
    onStartWorkout();
  };

  // Parâmetros do anel circular inteiro
  const radius = 106;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ padding: '18px 20px', color: '#ffffff', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      
      {/* MODAL DE CONFIRMAÇÃO SE O TREINO ESTIVER EM DESCANSO (VERMELHO OU LARANJA) */}
      {confirmFatigueModal && (
        <div
          onClick={() => setConfirmFatigueModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#141d26',
              border: `1.5px solid ${circleStatus.color}`,
              borderRadius: '20px',
              padding: '20px',
              width: '100%',
              maxWidth: '350px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: `${circleStatus.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle style={{ width: '20px', height: '20px', color: circleStatus.color }} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff', margin: 0 }}>
                  {circleStatus.level === 'red' ? 'Músculos em Descanso!' : 'Metade do Descanso'}
                </h3>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: circleStatus.color }}>
                  {circleStatus.circleBadge}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#d1d5db', margin: 0, lineHeight: '1.45' }}>
              {circleStatus.level === 'red'
                ? 'Esse treino acabou de ser feito e os músculos estão em descanso. Deseja realmente repetir ele antes da recuperação?'
                : `Esse treino já cumpriu metade do descanso (${circleStatus.hoursRemaining}h restantes). Deseja iniciar mesmo assim?`}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setConfirmFatigueModal(false)}
                style={{ width: '100%', backgroundColor: '#22c55e', color: '#000000', fontWeight: '900', fontSize: '12px', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
              >
                ESCOLHER TREINO LIVRE (VERDE)
              </button>

              <button
                onClick={() => {
                  setConfirmFatigueModal(false);
                  onStartWorkout();
                }}
                style={{
                  width: '100%',
                  backgroundColor: `${circleStatus.color}22`,
                  color: circleStatus.color,
                  fontWeight: '800',
                  fontSize: '11px',
                  padding: '10px',
                  borderRadius: '12px',
                  border: `1px solid ${circleStatus.color}66`,
                  cursor: 'pointer'
                }}
              >
                SIM, TREINAR MESMO ASSIM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho com Sequência e Foguinho */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dumbbell style={{ width: '20px', height: '20px', color: '#22c55e' }} />
          </div>
          <div>
            <span style={{ fontSize: '9px', fontWeight: '800', color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block' }}>
              META: {profile.currentWeight || 65}KG → {profile.targetWeight || 80}KG
            </span>
            <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', margin: 0, letterSpacing: '0.5px' }}>
              FITFLOW
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              backgroundColor: isFireLit ? 'rgba(249, 115, 22, 0.16)' : '#141d26',
              border: isFireLit ? '1px solid #f97316' : '1px solid #222f3e',
              borderRadius: '12px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: isFireLit ? '0 0 12px rgba(249, 115, 22, 0.35)' : 'none'
            }}
          >
            <Flame
              style={{
                width: '14px',
                height: '14px',
                color: isFireLit ? '#f97316' : '#6b7280',
                fill: isFireLit ? '#f97316' : 'transparent'
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: '900', color: isFireLit ? '#fb923c' : '#9ca3af' }}>
              {streakDays}d
            </span>
          </div>

          <button
            onClick={onResetPlan}
            style={{ backgroundColor: '#141d26', border: '1px solid #222f3e', color: '#d1d5db', fontSize: '11px', fontWeight: 'bold', padding: '8px 10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <RefreshCw style={{ width: '12px', height: '12px', color: '#22c55e' }} />
            <span>Nova Ficha</span>
          </button>
        </div>
      </header>

      {/* Abas Treino A | Treino B | Treino C com a cor real do semáforo */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {workouts.map((w, idx) => {
          const isSelected = idx === selectedWorkoutIndex;
          const wStatus = workoutStatuses[idx];

          return (
            <button
              key={w.id || idx}
              onClick={() => onSelectWorkout(idx)}
              style={{
                flex: 1,
                minWidth: '92px',
                padding: '10px 12px',
                borderRadius: '12px',
                fontWeight: '900',
                fontSize: '12px',
                cursor: 'pointer',
                backgroundColor: isSelected ? wStatus.color : '#141d26',
                color: isSelected ? (wStatus.level === 'red' ? '#ffffff' : '#000000') : '#ffffff',
                border: isSelected ? 'none' : `1.5px solid ${wStatus.color}88`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <span>Treino {w.id}</span>
              {!isSelected && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: wStatus.color }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Barra Semanal DOM -> SÁB */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {weekDays.map((day, idx) => {
          const isToday = idx === todayIndex;
          const isTrained = trainedDaysInCurrentWeek.has(idx);

          return (
            <div
              key={day}
              style={{
                backgroundColor: isTrained ? 'rgba(34, 197, 94, 0.16)' : isToday ? 'rgba(34, 197, 94, 0.08)' : '#141d26',
                border: isTrained ? '1.5px solid #22c55e' : isToday ? '1px solid #22c55e' : '1px solid #1e293b',
                borderRadius: '12px',
                padding: '7px 3px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: '800', color: isTrained || isToday ? '#22c55e' : '#9ca3af' }}>
                {day}
              </span>

              {isTrained ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '1px', fontSize: '9px', fontWeight: '900', color: '#22c55e' }}>
                  <Check style={{ width: '10px', height: '10px', strokeWidth: 3 }} />
                  {isFireLit && <Flame style={{ width: '9px', height: '9px', color: '#f97316', fill: '#f97316' }} />}
                </span>
              ) : (
                <span style={{ fontSize: '9px', fontWeight: '900', color: isToday ? '#22c55e' : '#6b7280' }}>
                  {isToday ? 'HOJE' : '•'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* CÍRCULO INTEIRO DO SEMÁFORO (Todo Verde = Livre | Todo Laranja = Metade | Todo Vermelho = Descanso) */}
      {activeWorkout && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
          <div style={{ position: 'relative', width: '246px', height: '246px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            <svg width="246" height="246" style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
              <circle
                cx="123"
                cy="123"
                r={radius}
                fill="none"
                stroke={circleStatus.color}
                strokeWidth="13"
                strokeDasharray={circumference}
                strokeDashoffset={0}
                style={{
                  transition: 'stroke 0.35s ease',
                  filter: `drop-shadow(0 0 10px ${circleStatus.glow})`
                }}
              />
            </svg>

            {/* Conteúdo Central */}
            <div style={{ zIndex: 10, textAlign: 'center', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', fontWeight: '900', color: circleStatus.color, letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '4px' }}>
                {circleStatus.level === 'green'
                  ? `TREINO ${activeWorkout.id} • LIVRE PARA TREINAR`
                  : `TREINO ${activeWorkout.id} • ${circleStatus.circleBadge}`}
              </span>

              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', margin: '0 0 3px 0', lineHeight: '1.15' }}>
                {activeWorkout.group || activeWorkout.name}
              </h2>

              <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 14px 0', maxWidth: '165px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeWorkout.subtitle}
              </p>

              {/* Se já treinou hoje, desativa o botão INICIAR */}
              {alreadyTrainedToday ? (
                <div
                  style={{
                    backgroundColor: isViewingTodaysCompletedWorkout ? 'rgba(239, 68, 68, 0.16)' : 'rgba(34, 197, 94, 0.14)',
                    border: isViewingTodaysCompletedWorkout ? '1px solid #ef4444' : '1px solid #22c55e',
                    color: isViewingTodaysCompletedWorkout ? '#f87171' : '#22c55e',
                    borderRadius: '999px',
                    padding: '9px 15px',
                    fontSize: '10px',
                    fontWeight: '900',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                  <span>{isViewingTodaysCompletedWorkout ? 'CONCLUÍDO HOJE' : 'DISPONÍVEL AMANHÃ'}</span>
                </div>
              ) : (
                <button
                  onClick={handleStartClick}
                  style={{
                    backgroundColor: circleStatus.color,
                    color: circleStatus.level === 'red' ? '#ffffff' : '#000000',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '10px 24px',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: `0 4px 18px ${circleStatus.glow}`,
                    transition: 'all 0.25s'
                  }}
                >
                  <Play style={{ width: '13px', height: '13px', fill: circleStatus.level === 'red' ? '#ffffff' : '#000000' }} />
                  <span>INICIAR</span>
                </button>
              )}
            </div>
          </div>

          {/* Legenda compacta do Semáforo */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '9px', color: '#9ca3af', marginTop: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e' }} /> Livre
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#f97316' }} /> Metade
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444' }} /> Descanso
            </span>
          </div>
        </div>
      )}

      {/* 3 Cards Inferiores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <div style={{ backgroundColor: '#141d26', border: '1px solid #1e293b', borderRadius: '14px', padding: '12px' }}>
          <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <Calendar style={{ width: '11px', height: '11px', color: '#22c55e' }} /> SESSÕES
          </span>
          <strong style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>{completedSessions.length}</strong>
        </div>

        <div
          style={{
            backgroundColor: isFireLit ? 'rgba(249, 115, 22, 0.1)' : '#141d26',
            border: isFireLit ? '1px solid rgba(249, 115, 22, 0.5)' : '1px solid #1e293b',
            borderRadius: '14px',
            padding: '12px'
          }}
        >
          <span style={{ fontSize: '9px', color: isFireLit ? '#fb923c' : '#9ca3af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <Flame style={{ width: '12px', height: '12px', color: '#f97316', fill: isFireLit ? '#f97316' : 'transparent' }} /> META SEM.
          </span>
          <strong style={{ fontSize: '18px', fontWeight: '900', color: isFireLit ? '#fb923c' : '#ffffff' }}>
            {weeklyPercent}%
          </strong>
        </div>

        <div style={{ backgroundColor: '#141d26', border: '1px solid #1e293b', borderRadius: '14px', padding: '12px' }}>
          <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <Target style={{ width: '11px', height: '11px', color: '#38bdf8' }} /> OBJETIVO
          </span>
          <strong style={{ fontSize: '12px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase' }}>
            {profile.goal === 'emagrecimento' ? 'DEFINIÇÃO' : profile.goal === 'condicionamento' ? 'SAÚDE' : 'HIPERTROFIA'}
          </strong>
        </div>
      </div>

      {/* Card Motivacional Inferior */}
      <div style={{ backgroundColor: '#111a18', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Zap style={{ width: '16px', height: '16px', color: '#22c55e', flexShrink: 0 }} />
        <p style={{ fontSize: '11px', fontStyle: 'italic', color: '#d1d5db', margin: 0, lineHeight: '1.4' }}>
          {alreadyTrainedToday
            ? `"Treino de hoje (${todaySession.workoutName}) finalizado! Amanhã o próximo treino já estará pronto para você."`
            : '"Bora bater os recordes de hoje! Cada série concluída salva automaticamente na sua conta."'}
        </p>
      </div>

    </div>
  );
}