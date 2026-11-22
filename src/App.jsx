import React, { useState, useEffect } from 'react';
import { Home, BarChart2, Dumbbell, User, LogOut, Play, AlertTriangle, Scale } from 'lucide-react';
import { subscribeToAuthChanges, logoutUser } from './services/firebaseAuth';
import { getUserFitnessData, saveInitialPlan, updateUserWorkouts, logUserBodyWeight } from './services/workoutService';
import AuthScreen from './views/AuthScreen';
import OnboardingScreen from './views/OnboardingScreen';
import Dashboard from './views/Dashboard';
import ActiveWorkout from './views/ActiveWorkout';
import WorkoutBuilder from './views/WorkoutBuilder';
import ProgressView from './views/ProgressView';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function formatDuration(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [fitnessData, setFitnessData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  const [forceOnboarding, setForceOnboarding] = useState(false);
  const [manualBuilderMode, setManualBuilderMode] = useState(false);
  const [pendingProfile, setPendingProfile] = useState(null);

  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState(0);
  const [currentTab, setCurrentTab] = useState('home');

  const [activeSessionIndex, setActiveSessionIndex] = useState(null);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [isWorkoutExpanded, setIsWorkoutExpanded] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [conflictModalOpen, setConflictModalOpen] = useState(false);

  useEffect(() => {
    if (activeSessionIndex === null || !workoutStartTime) return;

    const updateTimer = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - workoutStartTime) / 1000)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    document.addEventListener('visibilitychange', updateTimer);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', updateTimer);
    };
  }, [activeSessionIndex, workoutStartTime]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setDataLoading(true);
        try {
          const data = await getUserFitnessData(currentUser.uid);
          setFitnessData(data);
        } catch (err) {
          console.error('Erro ao buscar dados do Firestore:', err);
        } finally {
          setDataLoading(false);
        }
      } else {
        setFitnessData(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const startFreshWorkout = (indexToStart) => {
    setActiveSessionIndex(indexToStart);
    setWorkoutStartTime(Date.now());
    setElapsedSeconds(0);
    setIsWorkoutExpanded(true);
    setConflictModalOpen(false);
  };

  const handleStartWorkout = () => {
    if (activeSessionIndex === null) {
      startFreshWorkout(selectedWorkoutIndex);
      return;
    }
    if (activeSessionIndex === selectedWorkoutIndex) {
      setIsWorkoutExpanded(true);
      return;
    }
    setConflictModalOpen(true);
  };

  const handleSaveCustomWorkout = async (newWorkoutObj) => {
    if (!user) return;

    if (!fitnessData || !fitnessData.workouts?.length) {
      const profileToUse = pendingProfile || { goal: 'hipertrofia', heightCm: 175, currentWeight: 65, targetWeight: 80, daysPerWeek: 3 };
      const savedData = await saveInitialPlan(user.uid, profileToUse, [newWorkoutObj]);
      setFitnessData(savedData);
      setManualBuilderMode(false);
      setForceOnboarding(false);
      setSelectedWorkoutIndex(0);
      setCurrentTab('home');
      return;
    }

    const existingIndex = fitnessData.workouts.findIndex((w) => w.id === newWorkoutObj.id);
    const updatedWorkouts = existingIndex >= 0
      ? fitnessData.workouts.map((w, i) => (i === existingIndex ? newWorkoutObj : w))
      : [...fitnessData.workouts, newWorkoutObj];

    await updateUserWorkouts(user.uid, updatedWorkouts);
    setFitnessData((prev) => ({ ...prev, workouts: updatedWorkouts }));
    setSelectedWorkoutIndex(existingIndex >= 0 ? existingIndex : updatedWorkouts.length - 1);
    setCurrentTab('home');
  };

  const handleSaveWorkoutProgress = async (updatedExercises, sessionLog) => {
    if (!user || !fitnessData) return;
    const targetIdx = activeSessionIndex !== null ? activeSessionIndex : selectedWorkoutIndex;

    const updatedWorkouts = fitnessData.workouts.map((w, idx) =>
      idx === targetIdx ? { ...w, exercises: updatedExercises } : w
    );

    await updateUserWorkouts(user.uid, updatedWorkouts, sessionLog);

    setFitnessData((prev) => ({
      ...prev,
      workouts: updatedWorkouts,
      completedSessions: [...(prev.completedSessions || []), sessionLog]
    }));
  };

  const handleLogNewWeight = async (newWeightVal) => {
    if (!user) return;
    const updated = await logUserBodyWeight(user.uid, newWeightVal);
    if (updated) {
      setFitnessData(updated);
    }
  };

  const handleFinishAndClearSession = () => {
    setIsWorkoutExpanded(false);
    setActiveSessionIndex(null);
    setWorkoutStartTime(null);
    setElapsedSeconds(0);
    setCurrentTab('progress');
  };

  if (authLoading || dataLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
        Sincronizando FitFLOW...
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  if (manualBuilderMode) {
    return (
      <WorkoutBuilder
        onBack={() => setManualBuilderMode(false)}
        onSaveCustomWorkout={handleSaveCustomWorkout}
      />
    );
  }

  if (!fitnessData || !fitnessData.workouts?.length || forceOnboarding) {
    return (
      <OnboardingScreen
        user={user}
        onComplete={(newData) => {
          setFitnessData(newData);
          setForceOnboarding(false);
          setSelectedWorkoutIndex(0);
        }}
        onChooseManual={(profileData) => {
          setPendingProfile(profileData);
          setManualBuilderMode(true);
        }}
      />
    );
  }

  // Verifica se já passaram 7 dias desde o último registro de peso corporal
  const sortedWeights = [...(fitnessData.weightHistory || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
  const lastWeightDate = sortedWeights.length > 0 ? sortedWeights[sortedWeights.length - 1].date : fitnessData.updatedAt;
  const isWeeklyWeightDue = lastWeightDate ? Date.now() - new Date(lastWeightDate).getTime() >= SEVEN_DAYS_MS : false;

  const runningWorkoutObj = activeSessionIndex !== null ? fitnessData.workouts[activeSessionIndex] : null;
  const requestedWorkoutObj = fitnessData.workouts[selectedWorkoutIndex] || fitnessData.workouts[0];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#000000' }}>
      <main style={{ width: '100%', maxWidth: '420px', backgroundColor: '#0b1118', minHeight: '100vh', position: 'relative', borderLeft: '1px solid #141d26', borderRight: '1px solid #141d26', paddingBottom: runningWorkoutObj ? '130px' : '75px' }}>
        
        {/* MODAL DE CONFLITO DE TREINO ATIVO */}
        {conflictModalOpen && runningWorkoutObj && (
          <div
            onClick={() => setConflictModalOpen(false)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: '#141d26', border: '1px solid #facc15', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(250, 204, 21, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle style={{ width: '20px', height: '20px', color: '#facc15' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff', margin: 0 }}>Treino em Andamento</h3>
                  <span style={{ fontSize: '11px', color: '#facc15', fontWeight: 'bold' }}>
                    {runningWorkoutObj.name} ({formatDuration(elapsedSeconds)})
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#d1d5db', margin: 0, lineHeight: '1.45' }}>
                Você já tem o <strong>{runningWorkoutObj.name}</strong> ativo agora. Deseja continuar ele ou descartar e iniciar o <strong>{requestedWorkoutObj.name}</strong>?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={() => {
                    setConflictModalOpen(false);
                    setIsWorkoutExpanded(true);
                  }}
                  style={{ width: '100%', backgroundColor: '#22c55e', color: '#000000', fontWeight: '900', fontSize: '12px', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
                >
                  CONTINUAR {runningWorkoutObj.name.toUpperCase()}
                </button>

                <button
                  onClick={() => startFreshWorkout(selectedWorkoutIndex)}
                  style={{ width: '100%', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontWeight: '800', fontSize: '12px', padding: '11px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.4)', cursor: 'pointer' }}
                >
                  DESCARTAR E INICIAR {requestedWorkoutObj.name.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        )}

        {isWorkoutExpanded && runningWorkoutObj ? (
          <ActiveWorkout
            key={`${runningWorkoutObj.id}-${workoutStartTime}`}
            workout={runningWorkoutObj}
            elapsedSeconds={elapsedSeconds}
            onMinimize={() => setIsWorkoutExpanded(false)}
            onSaveProgress={handleSaveWorkoutProgress}
            onFinish={handleFinishAndClearSession}
          />
        ) : currentTab === 'workouts' ? (
          <WorkoutBuilder
            existingWorkouts={fitnessData.workouts}
            onBack={() => setCurrentTab('home')}
            onSaveCustomWorkout={handleSaveCustomWorkout}
          />
        ) : currentTab === 'progress' ? (
          <ProgressView
            fitnessData={fitnessData}
            onLogNewWeight={handleLogNewWeight}
          />
        ) : currentTab === 'account' ? (
          <div style={{ padding: '24px', color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>Minha Conta</h2>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Perfil" style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px solid #22c55e' }} />
            ) : (
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#141d26', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User style={{ width: '32px', height: '32px', color: '#22c55e' }} />
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{user.displayName || 'Atleta FitFLOW'}</p>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>{user.email}</span>
            </div>

            {fitnessData?.profile && (
              <div style={{ width: '100%', backgroundColor: '#141d26', border: '1px solid #222f3e', borderRadius: '14px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                <div>
                  <span style={{ fontSize: '9px', color: '#9ca3af', display: 'block' }}>ALTURA</span>
                  <strong style={{ fontSize: '13px', color: '#ffffff' }}>{fitnessData.profile.heightCm || '-'} cm</strong>
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: '#9ca3af', display: 'block' }}>PESO / META</span>
                  <strong style={{ fontSize: '13px', color: '#22c55e' }}>{fitnessData.profile.currentWeight} → {fitnessData.profile.targetWeight}kg</strong>
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: '#9ca3af', display: 'block' }}>STATUS</span>
                  <strong style={{ fontSize: '11px', color: '#facc15' }}>{fitnessData.profile.bodyStatusLabel || 'Ideal'}</strong>
                </div>
              </div>
            )}

            <button
              onClick={logoutUser}
              style={{ marginTop: '16px', width: '100%', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', fontWeight: 'bold', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
              <span>Sair da Conta</span>
            </button>
          </div>
        ) : (
          <>
            {/* Banner de Lembrete Semanal de Peso na Tela Inicial (após 7 dias) */}
            {isWeeklyWeightDue && (
              <div
                onClick={() => setCurrentTab('progress')}
                style={{
                  margin: '14px 20px 0',
                  backgroundColor: 'rgba(34, 197, 94, 0.14)',
                  border: '1px solid #22c55e',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <Scale style={{ width: '18px', height: '18px', color: '#22c55e', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '11px', color: '#ffffff', display: 'block' }}>
                    Está na hora de atualizar seu peso! ⚖️
                  </strong>
                  <span style={{ fontSize: '10px', color: '#d1d5db' }}>
                    Já se passaram 7 dias. Toque para registrar seu peso atual.
                  </span>
                </div>
              </div>
            )}

            <Dashboard
              user={user}
              fitnessData={fitnessData}
              selectedWorkoutIndex={selectedWorkoutIndex}
              onSelectWorkout={setSelectedWorkoutIndex}
              onStartWorkout={handleStartWorkout}
              onResetPlan={() => setForceOnboarding(true)}
            />
          </>
        )}

        {/* BARRA FLUTUANTE DE TREINO EM ANDAMENTO */}
        {!isWorkoutExpanded && runningWorkoutObj && (
          <div
            onClick={() => setIsWorkoutExpanded(true)}
            style={{
              position: 'fixed',
              bottom: '64px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: '420px',
              backgroundColor: '#14261c',
              borderTop: '1px solid #22c55e',
              borderBottom: '1px solid #22c55e',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 48,
              cursor: 'pointer',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
              <div>
                <span style={{ fontSize: '9px', fontWeight: '900', color: '#22c55e', textTransform: 'uppercase', display: 'block' }}>
                  Treino em Andamento • {formatDuration(elapsedSeconds)}
                </span>
                <strong style={{ fontSize: '12px', color: '#ffffff' }}>{runningWorkoutObj.name}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsWorkoutExpanded(true);
              }}
              style={{ backgroundColor: '#22c55e', color: '#000000', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Play style={{ width: '12px', height: '12px' }} />
              <span>Abrir</span>
            </button>
          </div>
        )}

        {/* Barra de Navegação Inferior Fixa */}
        {!isWorkoutExpanded && (
          <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '420px', backgroundColor: 'rgba(7, 10, 14, 0.96)', borderTop: '1px solid #141d26', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50, boxSizing: 'border-box' }}>
            <button onClick={() => setCurrentTab('home')} style={{ background: 'none', border: 'none', color: currentTab === 'home' ? '#22c55e' : '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
              <Home style={{ width: '20px', height: '20px' }} />
              <span style={{ fontSize: '9px', fontWeight: '600' }}>Início</span>
            </button>
            <button onClick={() => setCurrentTab('progress')} style={{ background: 'none', border: 'none', color: currentTab === 'progress' ? '#22c55e' : '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
              <BarChart2 style={{ width: '20px', height: '20px' }} />
              {isWeeklyWeightDue && (
                <span style={{ position: 'absolute', top: '-2px', right: '6px', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              )}
              <span style={{ fontSize: '9px', fontWeight: '600' }}>Progresso</span>
            </button>
            <button onClick={() => setCurrentTab('workouts')} style={{ background: 'none', border: 'none', color: currentTab === 'workouts' ? '#22c55e' : '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
              <Dumbbell style={{ width: '20px', height: '20px' }} />
              <span style={{ fontSize: '9px', fontWeight: '600' }}>Treinos</span>
            </button>
            <button onClick={() => setCurrentTab('account')} style={{ background: 'none', border: 'none', color: currentTab === 'account' ? '#22c55e' : '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
              <User style={{ width: '20px', height: '20px' }} />
              <span style={{ fontSize: '9px', fontWeight: '600' }}>Conta</span>
            </button>
          </nav>
        )}

      </main>
    </div>
  );
}