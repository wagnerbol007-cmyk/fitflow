import React, { useState } from 'react';
import { Dumbbell, RefreshCw, Play, Calendar, Flame, Target, Zap, AlertTriangle } from 'lucide-react';
import { evaluateWorkoutCircleStatus } from '../utils/recoveryEngine';

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

  // Avalia a cor do círculo para o treino selecionado (Verde, Laranja ou Vermelho)
  const circleStatus = activeWorkout
    ? evaluateWorkoutCircleStatus(activeWorkout, workouts, completedSessions)
    : { level: 'green', color: '#22c55e', glow: 'rgba(34, 197, 94, 0.35)', circleBadge: 'DISPONÍVEL', recoveryPercent: 100 };

  // Calcula progresso semanal e preenchimento do arco circular SVG
  const daysPerWeek = profile.daysPerWeek || 3;
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const sessionsThisWeek = completedSessions.filter((s) => new Date(s.date).getTime() >= oneWeekAgo).length;
  const weeklyPercent = Math.min(100, Math.round((sessionsThisWeek / daysPerWeek) * 100));

  // Parâmetros do arco SVG central
  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const arcPercent = weeklyPercent > 0 ? weeklyPercent : 67;
  const strokeDashoffset = circumference - (arcPercent / 100) * circumference;

  // Dias da semana para a barra DOM -> SÁB
  const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const todayIndex = new Date().getDay();

  // Verifica quais dias da semana atual tiveram treino concluído
  const trainedDaysSet = new Set(
    completedSessions
      .filter((s) => new Date(s.date).getTime() >= oneWeekAgo)
      .map((s) => new Date(s.date).getDay())
  );

  const handleStartClick = () => {
    // Se o círculo estiver Laranja (em recuperação) ou Vermelho (não treine), pergunta antes
    if (circleStatus.level === 'red' || circleStatus.level === 'orange') {
      setConfirmFatigueModal(true);
      return;
    }
    onStartWorkout();
  };

  return (
    <div style={{ padding: '18px 20px', color: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* MODAL DE CONFIRMAÇÃO QUANDO O CÍRCULO ESTÁ LARANJA OU VERMELHO */}
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
                  {circleStatus.level === 'red' ? 'Por favor, não treine ainda!' : 'Músculo em Recuperação'}
                </h3>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: circleStatus.color }}>
                  {circleStatus.circleBadge}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#d1d5db', margin: 0, lineHeight: '1.45' }}>
              {circleStatus.level === 'red'
                ? `Você acabou de treinar ${activeWorkout?.group || 'esse grupo muscular'}. O descanso evita lesões e garante o crescimento muscular. Deseja realmente iniciar esse treino agora?`
                : `Esse grupo muscular ainda está em fase de recuperação (${circleStatus.hoursRemaining}h restantes). Deseja realmente fazer esse treino hoje?`}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setConfirmFatigueModal(false)}
                style={{ width: '100%', backgroundColor: '#22c55e', color: '#000000', fontWeight: '900', fontSize: '12px', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
              >
                VOLTAR E ESCOLHER OUTRO TREINO
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
                SIM, QUERO TREINAR MESMO ASSIM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho Original */}
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

        <button
          onClick={onResetPlan}
          style={{ backgroundColor: '#141d26', border: '1px solid #222f3e', color: '#d1d5db', fontSize: '11px', fontWeight: 'bold', padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw style={{ width: '13px', height: '13px', color: '#22c55e' }} />
          <span>Nova Ficha</span>
        </button>
      </header>

      {/* Abas Treino A | Treino B | Treino C com indicador sutil da cor de recuperação */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {workouts.map((w, idx) => {
          const isSelected = idx === selectedWorkoutIndex;
          const wStatus = evaluateWorkoutCircleStatus(w, workouts, completedSessions);

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
                color: isSelected ? '#000000' : '#ffffff',
                border: isSelected ? 'none' : `1px solid ${wStatus.level === 'green' ? '#222f3e' : `${wStatus.color}66`}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <span>Treino {w.id}</span>
              {!isSelected && wStatus.level !== 'green' && (
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: wStatus.color }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Barra Semanal DOM -> SÁB */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {weekDays.map((day, idx) => {
          const isToday = idx === todayIndex;
          const isTrained = trainedDaysSet.has(idx);
          return (
            <div
              key={day}
              style={{
                backgroundColor: isToday ? 'rgba(34, 197, 94, 0.1)' : '#141d26',
                border: isToday ? '1px solid #22c55e' : '1px solid #1e293b',
                borderRadius: '12px',
                padding: '8px 4px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: '800', color: isToday ? '#22c55e' : '#9ca3af' }}>{day}</span>
              <span style={{ fontSize: '9px', fontWeight: '900', color: isToday ? '#22c55e' : isTrained ? '#4ade80' : '#6b7280' }}>
                {isToday ? 'HOJE' : isTrained ? '✓' : '•'}
              </span>
            </div>
          );
        })}
      </div>

      {/* CÍRCULO CENTRAL DINÂMICO (Muda de cor: Verde = Disponível | Laranja = Recuperação | Vermelho = Não Treine) */}
      {activeWorkout && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '6px 0' }}>
          <div style={{ position: 'relative', width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Anel SVG */}
            <svg width="240" height="240" style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="transparent"
                stroke="#18222f"
                strokeWidth="12"
              />
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="transparent"
                stroke={circleStatus.color}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke 0.35s ease, stroke-dashoffset 0.5s ease',
                  filter: `drop-shadow(0 0 8px ${circleStatus.glow})`
                }}
              />
            </svg>

            {/* Conteúdo Central Dentro do Círculo */}
            <div style={{ zIndex: 10, textAlign: 'center', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', fontWeight: '900', color: circleStatus.color, letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '4px' }}>
                {circleStatus.level === 'green'
                  ? `TREINO ${activeWorkout.id} • ${(activeWorkout.exercises || []).length} APARELHOS`
                  : circleStatus.circleBadge}
              </span>

              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', margin: '0 0 3px 0', lineHeight: '1.15' }}>
                {activeWorkout.group || activeWorkout.name}
              </h2>

              <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 14px 0', maxWidth: '165px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeWorkout.subtitle}
              </p>

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
            </div>
          </div>
        </div>
      )}

      {/* 3 Cards Inferiores Originais: SESSÕES | META SEM. | OBJETIVO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <div style={{ backgroundColor: '#141d26', border: '1px solid #1e293b', borderRadius: '14px', padding: '12px' }}>
          <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <Calendar style={{ width: '11px', height: '11px', color: '#22c55e' }} /> SESSÕES
          </span>
          <strong style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>{completedSessions.length}</strong>
        </div>

        <div style={{ backgroundColor: '#141d26', border: '1px solid #1e293b', borderRadius: '14px', padding: '12px' }}>
          <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <Flame style={{ width: '11px', height: '11px', color: '#f97316' }} /> META SEM.
          </span>
          <strong style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>{weeklyPercent}%</strong>
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

      {/* Card Motivacional Inferior Original */}
      <div style={{ backgroundColor: '#111a18', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Zap style={{ width: '16px', height: '16px', color: '#22c55e', flexShrink: 0 }} />
        <p style={{ fontSize: '11px', fontStyle: 'italic', color: '#d1d5db', margin: 0, lineHeight: '1.4' }}>
          "Bora bater os recordes de hoje! Cada série concluída salva automaticamente na sua conta."
        </p>
      </div>

    </div>
  );
}