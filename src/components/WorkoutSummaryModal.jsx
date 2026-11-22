import React from 'react';
import { Trophy, Share2, Check } from 'lucide-react';

export default function WorkoutSummaryModal({ summaryData, onClose }) {
  const { workoutName, totalVolume, completedSets, completedExercises } = summaryData;

  const getComparison = (kg) => {
    if (kg <= 500) return { emoji: '🏍️', name: 'uma moto esportiva', desc: 'Você empurrou o peso equivalente a uma moto potente!' };
    if (kg <= 1500) return { emoji: '🚗', name: 'um carro popular', desc: 'Isso é como se você tivesse empurrado um carro inteiro do chão!' };
    if (kg <= 3000) return { emoji: '🚙', name: 'uma caminhonete SUV', desc: 'Força bruta! Você movimentou o equivalente a uma SUV pesada!' };
    if (kg <= 5500) return { emoji: '🦏', name: 'dois rinocerontes adultos', desc: 'Nível monstro! Carga equivalente a dois rinocerontes!' };
    return { emoji: '🐘', name: 'um elefante africano', desc: 'Inacreditável! Você ergueu o peso de um elefante africano hoje!' };
  };

  const comparison = getComparison(totalVolume);

  const handleShare = async () => {
    const textToShare = `🔥 Treino Finalizado no FitFLOW!\n\n💪 Sessão: ${workoutName}\n🏋️ Volume Total: ${totalVolume.toLocaleString()} kg (${comparison.emoji} equivalente a ${comparison.name})\n🎯 ${completedExercises} exercícios • ${completedSets} séries concluídas.\n\nDisciplina e foco! ⚡`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Meu Treino FitFLOW', text: textToShare }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(textToShare);
      alert('Resumo copiado para a área de transferência!');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '380px', backgroundColor: '#0b1118', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: '24px', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.9), 0 0 25px rgba(34,197,94,0.25)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
          <Trophy style={{ width: '28px', height: '28px', color: '#22c55e' }} />
        </div>

        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#22c55e', fontWeight: 'bold' }}>Sessão Concluída</span>
        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', margin: '2px 0 8px 0' }}>{workoutName}</h2>
        
        <div style={{ margin: '14px 0', width: '150px', height: '150px', borderRadius: '50%', border: '6px solid #141d26', borderTopColor: '#22c55e', borderRightColor: '#22c55e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#070a0e' }}>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase' }}>Carga Total</span>
          <span style={{ fontSize: '24px', fontWeight: '900', color: '#22c55e', lineHeight: 1 }}>{totalVolume.toLocaleString()}</span>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>kg levantados</span>
        </div>

        <div style={{ width: '100%', backgroundColor: '#141d26', border: '1px solid #222f3e', borderRadius: '14px', padding: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
          <span style={{ fontSize: '28px' }}>{comparison.emoji}</span>
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#ffffff', margin: '0 0 2px 0' }}>Equivalente a {comparison.name}!</h4>
            <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0, lineHeight: 1.3 }}>{comparison.desc}</p>
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
          <button onClick={handleShare} style={{ flex: 1, backgroundColor: '#141d26', border: '1px solid #222f3e', color: '#ffffff', fontWeight: 'bold', fontSize: '12px', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Share2 style={{ width: '15px', height: '15px', color: '#22c55e' }} />
            <span>Compartilhar</span>
          </button>
          <button onClick={onClose} style={{ flex: 1.4, backgroundColor: '#22c55e', color: '#000000', fontWeight: '900', fontSize: '12px', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Check style={{ width: '16px', height: '16px', strokeWidth: 3 }} />
            <span>Voltar ao Início</span>
          </button>
        </div>
      </div>
    </div>
  );
}