import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Plus, Minus, Trophy, Clock, Play, Pause, RotateCcw, X, Info, Bell } from 'lucide-react';

function formatDuration(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Gera um bipe duplo limpo via Web Audio API quando o descanso acaba
function playRestFinishedBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    [0, 0.22].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime + delay); // Nota Lá5 aguda e nítida
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.18);
    });
  } catch (e) {}
}

// Dispara notificação no celular/navegador + vibração
function triggerRestNotification(workoutName) {
  playRestFinishedBeep();

  if (navigator.vibrate) {
    navigator.vibrate([300, 150, 300]);
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('Descanso Finalizado! 💪', {
        body: `Hora da próxima série no ${workoutName || 'seu treino'}!`,
        icon: '/favicon.ico',
        tag: 'fitflow-rest-timer'
      });
    } catch (e) {}
  }
}

export default function ActiveWorkout({
  workout,
  elapsedSeconds = 0,
  onMinimize,
  onSaveProgress,
  onFinish
}) {
  const [exercises, setExercises] = useState(() =>
    (workout?.exercises || []).map((ex) => ({
      ...ex,
      completedSets: ex.completedSets || 0,
      plannedSets: ex.plannedSets || 4,
      currentWeight: ex.currentWeight || '20',
      currentReps: ex.currentReps || '10',
      historicalRecord: ex.historicalRecord || parseFloat(ex.currentWeight) || 20
    }))
  );

  const [expandedGifExercise, setExpandedGifExercise] = useState(null);

  // Timer de descanso baseado em Timestamp Real (não atrasa em segundo plano)
  const [restSeconds, setRestSeconds] = useState(60);
  const [restEndTime, setRestEndTime] = useState(null); // Timestamp em ms de quando o descanso termina
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [saving, setSaving] = useState(false);
  const notifiedRef = useRef(false);

  const isResting = restEndTime !== null;

  // Solicita permissão de notificação ao entrar no treino ou clicar no sino
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Recalcula o tempo restante usando o relógio real do aparelho (Date.now())
  useEffect(() => {
    if (!restEndTime) return;

    const updateRemaining = () => {
      const diffMs = restEndTime - Date.now();
      const remaining = Math.max(0, Math.ceil(diffMs / 1000));
      setRestSeconds(remaining);

      if (remaining === 0 && !notifiedRef.current) {
        notifiedRef.current = true;
        setRestEndTime(null);
        triggerRestNotification(workout?.name);
      }
    };

    updateRemaining();
    const timer = setInterval(updateRemaining, 500);
    document.addEventListener('visibilitychange', updateRemaining);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', updateRemaining);
    };
  }, [restEndTime, workout?.name]);

  const startRestCountdown = (secondsToRun) => {
    notifiedRef.current = false;
    setRestSeconds(secondsToRun);
    setRestEndTime(Date.now() + secondsToRun * 1000);
  };

  const adjustRestTime = (delta) => {
    if (restEndTime) {
      const newEnd = Math.max(Date.now(), restEndTime + delta * 1000);
      const newRemaining = Math.max(0, Math.ceil((newEnd - Date.now()) / 1000));
      setRestSeconds(newRemaining);
      setRestEndTime(newRemaining > 0 ? newEnd : null);
    } else {
      setRestSeconds((prev) => Math.max(0, prev + delta));
    }
  };

  const toggleRestPause = () => {
    if (restEndTime) {
      // Pausar: congela os segundos atuais
      const remaining = Math.max(0, Math.ceil((restEndTime - Date.now()) / 1000));
      setRestSeconds(remaining);
      setRestEndTime(null);
    } else {
      // Retomar a partir dos segundos atuais
      const secs = restSeconds > 0 ? restSeconds : 60;
      startRestCountdown(secs);
    }
  };

  const handleCompleteSet = (exId) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        const nextSets = ex.completedSets < ex.plannedSets ? ex.completedSets + 1 : 0;
        if (nextSets > ex.completedSets) {
          startRestCountdown(60);
        }
        return { ...ex, completedSets: nextSets };
      })
    );
  };

  const handleUpdateField = (exId, field, value) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === exId ? { ...ex, [field]: value } : ex))
    );
  };

  const handleFinishSession = async () => {
    setSaving(true);
    try {
      const updatedExercises = exercises.map((ex) => {
        const w = parseFloat(ex.currentWeight) || 0;
        const newRecord = w > (ex.historicalRecord || 0) ? w : ex.historicalRecord;
        return {
          ...ex,
          completedSets: 0,
          historicalRecord: newRecord
        };
      });

      const sessionLog = {
        id: Date.now(),
        date: new Date().toISOString(),
        workoutId: workout.id,
        workoutName: workout.name,
        durationSeconds: elapsedSeconds,
        exercisesSummary: exercises.map((ex) => ({
          name: ex.name,
          setsDone: ex.completedSets,
          plannedSets: ex.plannedSets,
          weight: parseFloat(ex.currentWeight) || 0,
          reps: ex.currentReps
        }))
      };

      await onSaveProgress(updatedExercises, sessionLog);
      onFinish();
    } catch (err) {
      console.error('Erro ao finalizar treino:', err);
      alert('Erro ao salvar treino no Firebase.');
    } finally {
      setSaving(false);
    }
  };

  const totalSetsPlanned = exercises.reduce((acc, e) => acc + e.plannedSets, 0);
  const totalSetsDone = exercises.reduce((acc, e) => acc + e.completedSets, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0b1118', paddingBottom: '90px' }}>
      
      {/* Modal de GIF Ampliado ao clicar na foto */}
      {expandedGifExercise && (
        <div
          onClick={() => setExpandedGifExercise(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#141d26', border: '1px solid #22c55e', borderRadius: '20px', padding: '18px', width: '100%', maxWidth: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#22c55e', textTransform: 'uppercase' }}>
                {expandedGifExercise.equipmentLabel || 'Execução'}
              </span>
              <button onClick={() => setExpandedGifExercise(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <img
              src={expandedGifExercise.gifUrl || expandedGifExercise.images?.[0] || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300'}
              alt={expandedGifExercise.name}
              style={{ width: '240px', height: '240px', borderRadius: '14px', objectFit: 'cover', backgroundColor: '#ffffff' }}
            />

            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff', margin: '0 0 6px 0' }}>{expandedGifExercise.name}</h3>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, lineHeight: '1.4' }}>
                Foco: <strong style={{ color: '#ffffff' }}>{expandedGifExercise.target}</strong>. Mantenha o abdômen contraído, controle a fase excêntrica (volta) em 2 segundos e evite trancos na articulação.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho Fixo com Cronômetro de Duração e Botão Minimizar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: '#070a0e', borderBottom: '1px solid #141d26', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onMinimize}
          title="Minimizar treino e voltar ao menu"
          style={{ backgroundColor: '#141d26', border: '1px solid #222f3e', color: '#ffffff', borderRadius: '10px', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
        >
          <ChevronDown style={{ width: '16px', height: '16px', color: '#22c55e' }} />
          <span>Minimizar</span>
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: '900', textTransform: 'uppercase', display: 'block' }}>
            {workout.group || 'TREINO ATIVO'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '2px' }}>
            <Clock style={{ width: '13px', height: '13px', color: '#22c55e' }} />
            <span style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
              {formatDuration(elapsedSeconds)}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '10px', color: '#9ca3af', display: 'block' }}>Séries</span>
          <strong style={{ fontSize: '13px', color: '#22c55e' }}>{totalSetsDone}/{totalSetsPlanned}</strong>
        </div>
      </header>

      {/* Timer de Descanso com Alerta e Notificação em Segundo Plano */}
      <div style={{ margin: '12px 18px 0', backgroundColor: '#141d26', border: isResting ? '1px solid #22c55e' : '1px solid #222f3e', borderRadius: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={requestNotificationPermission}
            title={notifPermission === 'granted' ? 'Notificações ativadas' : 'Clique para ativar notificações'}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Bell style={{ width: '14px', height: '14px', color: notifPermission === 'granted' ? '#22c55e' : '#facc15' }} />
          </button>
          <div>
            <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>
              {isResting ? 'Descansando...' : 'Descanso'}
            </span>
            <strong style={{ fontSize: '15px', color: isResting ? '#22c55e' : '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
              00:{String(restSeconds).padStart(2, '0')}
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={() => adjustRestTime(-15)} style={{ backgroundColor: '#0b1118', border: '1px solid #222f3e', color: '#9ca3af', fontSize: '10px', padding: '4px 7px', borderRadius: '6px', cursor: 'pointer' }}>-15s</button>
          <button onClick={() => adjustRestTime(15)} style={{ backgroundColor: '#0b1118', border: '1px solid #222f3e', color: '#9ca3af', fontSize: '10px', padding: '4px 7px', borderRadius: '6px', cursor: 'pointer' }}>+15s</button>
          <button onClick={toggleRestPause} style={{ backgroundColor: '#22c55e', border: 'none', color: '#000', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {isResting ? <Pause style={{ width: '12px', height: '12px' }} /> : <Play style={{ width: '12px', height: '12px' }} />}
          </button>
          <button onClick={() => { setRestEndTime(null); setRestSeconds(60); }} style={{ backgroundColor: '#0b1118', border: '1px solid #222f3e', color: '#9ca3af', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}>
            <RotateCcw style={{ width: '12px', height: '12px' }} />
          </button>
        </div>
      </div>

      {/* Lista de Exercícios com Foto/GIF Clicável e Legenda */}
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {exercises.map((ex, idx) => {
          const isFinished = ex.completedSets >= ex.plannedSets;
          const currentW = parseFloat(ex.currentWeight) || 0;
          const isNewPR = currentW > (ex.historicalRecord || 0);
          const thumbSrc = ex.gifUrl || ex.images?.[0] || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200';

          return (
            <div
              key={ex.id}
              style={{
                backgroundColor: '#141d26',
                border: isFinished ? '1px solid #22c55e' : '1px solid #222f3e',
                borderRadius: '16px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div
                  onClick={() => setExpandedGifExercise(ex)}
                  title="Toque na imagem para ampliar o movimento"
                  style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                >
                  <img
                    src={thumbSrc}
                    alt={ex.name}
                    style={{ width: '62px', height: '62px', borderRadius: '12px', objectFit: 'cover', backgroundColor: '#ffffff', border: '1px solid #222f3e' }}
                  />
                  <span style={{ position: 'absolute', bottom: '3px', right: '3px', backgroundColor: 'rgba(0,0,0,0.75)', color: '#22c55e', fontSize: '8px', fontWeight: 'bold', padding: '1px 4px', borderRadius: '4px' }}>
                    GIF
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '900', color: '#ffffff', margin: 0 }}>
                      {idx + 1}. {ex.name}
                    </h3>
                    {isNewPR && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: 'rgba(250, 204, 21, 0.15)', color: '#facc15', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '6px' }}>
                        <Trophy style={{ width: '10px', height: '10px' }} /> PR
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '10px', color: '#9ca3af', margin: '3px 0 0 0', lineHeight: '1.35', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Info style={{ width: '11px', height: '11px', color: '#22c55e', flexShrink: 0 }} />
                    <span>Alvo: <strong style={{ color: '#e5e7eb' }}>{ex.target}</strong> • Toque na foto para ver a execução</span>
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center', backgroundColor: '#0b1118', padding: '8px 10px', borderRadius: '12px' }}>
                <div>
                  <span style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', display: 'block' }}>Carga (kg)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <button onClick={() => handleUpdateField(ex.id, 'currentWeight', String(Math.max(0, currentW - 2)))} style={{ background: '#141d26', border: 'none', color: '#9ca3af', borderRadius: '4px', padding: '3px', cursor: 'pointer' }}>
                      <Minus style={{ width: '11px', height: '11px' }} />
                    </button>
                    <input
                      type="number"
                      value={ex.currentWeight}
                      onChange={(e) => handleUpdateField(ex.id, 'currentWeight', e.target.value)}
                      style={{ width: '38px', background: 'transparent', border: 'none', color: '#ffffff', fontSize: '14px', fontWeight: '900', textAlign: 'center', outline: 'none' }}
                    />
                    <button onClick={() => handleUpdateField(ex.id, 'currentWeight', String(currentW + 2))} style={{ background: '#141d26', border: 'none', color: '#22c55e', borderRadius: '4px', padding: '3px', cursor: 'pointer' }}>
                      <Plus style={{ width: '11px', height: '11px' }} />
                    </button>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', display: 'block' }}>Reps</span>
                  <input
                    type="text"
                    value={ex.currentReps}
                    onChange={(e) => handleUpdateField(ex.id, 'currentReps', e.target.value)}
                    style={{ width: '48px', background: '#141d26', border: '1px solid #222f3e', borderRadius: '6px', color: '#ffffff', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', padding: '3px', marginTop: '2px', outline: 'none' }}
                  />
                </div>

                <button
                  onClick={() => handleCompleteSet(ex.id)}
                  style={{
                    backgroundColor: isFinished ? '#22c55e' : '#141d26',
                    border: isFinished ? 'none' : '1px solid #22c55e',
                    color: isFinished ? '#000000' : '#22c55e',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    fontWeight: '900',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Check style={{ width: '14px', height: '14px' }} />
                  <span>{ex.completedSets}/{ex.plannedSets}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão Finalizar Treino */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '420px', backgroundColor: 'rgba(7, 10, 14, 0.96)', borderTop: '1px solid #141d26', padding: '12px 18px', zIndex: 40, boxSizing: 'border-box' }}>
        <button
          onClick={handleFinishSession}
          disabled={saving}
          style={{ width: '100%', backgroundColor: '#22c55e', color: '#000000', fontWeight: '900', fontSize: '13px', padding: '13px', borderRadius: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(34, 197, 94, 0.35)' }}
        >
          {saving ? 'REGISTRANDO TREINO...' : `FINALIZAR TREINO (${formatDuration(elapsedSeconds)})`}
        </button>
      </div>

    </div>
  );
}