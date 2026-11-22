import React, { useState } from 'react';
import { Dumbbell, Flame, Activity, Sparkles, ArrowRight, Wrench, Ruler } from 'lucide-react';
import { generateSmartWorkouts, saveInitialPlan } from '../services/workoutService';

export default function OnboardingScreen({ user, onComplete, onChooseManual }) {
  const [goal, setGoal] = useState('hipertrofia');
  const [equipmentPref, setEquipmentPref] = useState('misto'); // 'maquina' | 'livre' | 'misto'
  const [heightCm, setHeightCm] = useState('175');
  const [currentWeight, setCurrentWeight] = useState('65');
  const [targetWeight, setTargetWeight] = useState('80');
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [loading, setLoading] = useState(false);

  const goals = [
    { id: 'hipertrofia', title: 'Ganhar Massa (Hipertrofia)', desc: 'Foco em carga progressiva e volume muscular', icon: Dumbbell },
    { id: 'emagrecimento', title: 'Perder Peso / Definição', desc: 'Mais repetições, ritmo alto e gasto calórico', icon: Flame },
    { id: 'condicionamento', title: 'Condicionamento e Saúde', desc: 'Equilíbrio de força, resistência e mobilidade', icon: Activity }
  ];

  const calculateStatus = () => {
    const h = (parseFloat(heightCm) || 0) / 100;
    const w = parseFloat(currentWeight) || 0;
    if (h <= 0.5 || w <= 20) return null;

    const bmi = w / (h * h);
    const minIdeal = (18.5 * h * h).toFixed(1);
    const maxIdeal = (24.9 * h * h).toFixed(1);

    if (bmi < 18.5) return { bmi: bmi.toFixed(1), label: 'Abaixo do peso', color: '#38bdf8', range: `${minIdeal}kg - ${maxIdeal}kg` };
    if (bmi < 25) return { bmi: bmi.toFixed(1), label: 'Peso ideal', color: '#22c55e', range: `${minIdeal}kg - ${maxIdeal}kg` };
    if (bmi < 30) return { bmi: bmi.toFixed(1), label: 'Acima do peso', color: '#f59e0b', range: `${minIdeal}kg - ${maxIdeal}kg` };
    return { bmi: bmi.toFixed(1), label: 'Obesidade', color: '#ef4444', range: `${minIdeal}kg - ${maxIdeal}kg` };
  };

  const bodyStatus = calculateStatus();

  const getProfilePayload = () => ({
    goal,
    equipmentPref,
    heightCm: parseFloat(heightCm) || 175,
    currentWeight: parseFloat(currentWeight) || 70,
    targetWeight: parseFloat(targetWeight) || 75,
    bmi: bodyStatus ? parseFloat(bodyStatus.bmi) : null,
    bodyStatusLabel: bodyStatus ? bodyStatus.label : 'Não informado',
    daysPerWeek
  });

  const handleGenerateAndSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const profile = getProfilePayload();
      const generatedWorkouts = await generateSmartWorkouts(profile);
      const savedData = await saveInitialPlan(user.uid, profile, generatedWorkouts);
      onComplete(savedData);
    } catch (error) {
      console.error('Erro ao salvar plano inicial:', error);
      alert('Erro ao conectar com o Firestore. Verifique se o banco foi criado no modo de teste.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#000000' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#0b1118', minHeight: '100vh', padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '1px solid #141d26', borderRight: '1px solid #141d26' }}>
        
        <form onSubmit={handleGenerateAndSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Cabeçalho */}
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', margin: '0 0 2px 0' }}>
              Bora montar seu plano, {user.displayName?.split(' ')[0] || 'Atleta'}!
            </h1>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
              Personalize medidas, estilo de treino e escolha entre IA ou ficha manual.
            </p>
          </div>

          {/* 1. Objetivo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase' }}>1. Objetivo principal</label>
            {goals.map((item) => {
              const Icon = item.icon;
              const isSelected = goal === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setGoal(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
                    backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.12)' : '#141d26',
                    border: isSelected ? '1px solid #22c55e' : '1px solid #222f3e',
                    borderRadius: '12px', cursor: 'pointer'
                  }}
                >
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: isSelected ? '#22c55e' : '#0b1118', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: '15px', height: '15px', color: isSelected ? '#000000' : '#22c55e' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff', margin: 0 }}>{item.title}</h4>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>{item.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Preferência de Equipamentos */}
          <div>
            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>2. Preferência de aparelhos</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[
                { id: 'maquina', label: 'Mais Máquinas' },
                { id: 'misto', label: 'Misto (Ideal)' },
                { id: 'livre', label: 'Mais Peso Livre' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setEquipmentPref(opt.id)}
                  style={{
                    padding: '8px 6px', borderRadius: '10px', fontWeight: '800', fontSize: '11px', cursor: 'pointer',
                    backgroundColor: equipmentPref === opt.id ? '#22c55e' : '#141d26',
                    color: equipmentPref === opt.id ? '#000000' : '#ffffff',
                    border: equipmentPref === opt.id ? 'none' : '1px solid #222f3e'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Medidas */}
          <div>
            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>3. Suas Medidas</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div style={{ backgroundColor: '#141d26', border: '1px solid #222f3e', borderRadius: '10px', padding: '7px 10px' }}>
                <span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Ruler style={{ width: '9px', height: '9px', color: '#22c55e' }} /> Altura (cm)
                </span>
                <input type="number" required min="100" max="250" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#ffffff', fontSize: '15px', fontWeight: '900', outline: 'none' }} />
              </div>

              <div style={{ backgroundColor: '#141d26', border: '1px solid #222f3e', borderRadius: '10px', padding: '7px 10px' }}>
                <span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>Peso Atual</span>
                <input type="number" step="0.1" required value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#ffffff', fontSize: '15px', fontWeight: '900', outline: 'none' }} />
              </div>

              <div style={{ backgroundColor: '#141d26', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: '10px', padding: '7px 10px' }}>
                <span style={{ fontSize: '8px', color: '#22c55e', fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>Peso Meta</span>
                <input type="number" step="0.1" required value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#22c55e', fontSize: '15px', fontWeight: '900', outline: 'none' }} />
              </div>
            </div>

            {bodyStatus && (
              <div style={{ marginTop: '6px', backgroundColor: '#141d26', border: `1px solid ${bodyStatus.color}44`, borderRadius: '10px', padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>Status Atual (IMC {bodyStatus.bmi})</span>
                  <span style={{ fontSize: '11px', fontWeight: '900', color: bodyStatus.color }}>{bodyStatus.label}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>Faixa Ideal p/ {heightCm}cm</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>{bodyStatus.range}</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Frequência Semanal */}
          <div>
            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>4. Dias na semana (Rotação ABC)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setDaysPerWeek(num)}
                  style={{
                    padding: '8px', borderRadius: '10px', fontWeight: '900', fontSize: '12px', cursor: 'pointer',
                    backgroundColor: daysPerWeek === num ? '#22c55e' : '#141d26',
                    color: daysPerWeek === num ? '#000000' : '#ffffff',
                    border: daysPerWeek === num ? 'none' : '1px solid #222f3e'
                  }}
                >
                  {num}x / sem
                </button>
              ))}
            </div>
          </div>

          {/* Botões Finais */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', backgroundColor: '#22c55e', color: '#000000', fontWeight: '900', fontSize: '13px', padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(34, 197, 94, 0.35)' }}
            >
              <Sparkles style={{ width: '16px', height: '16px' }} />
              <span>{loading ? 'GERANDO SUA FICHA...' : 'CRIAR TREINO COM IA'}</span>
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => onChooseManual(getProfilePayload())}
              style={{ width: '100%', backgroundColor: '#141d26', color: '#ffffff', fontWeight: '800', fontSize: '12px', padding: '11px', borderRadius: '12px', border: '1px solid #222f3e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Wrench style={{ width: '15px', height: '15px', color: '#22c55e' }} />
              <span>MONTAR MEU PRÓPRIO TREINO</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}