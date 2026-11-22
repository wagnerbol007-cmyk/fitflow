import React from 'react';
import { Timer, X } from 'lucide-react';

export default function RestTimerBanner({ timeLeft, initialTime, onAdd30, onSubtract15, onSkip }) {
  if (timeLeft === null) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const progressPercent = Math.min(100, Math.max(0, ((initialTime - timeLeft) / initialTime) * 100));

  return (
    <div style={{
      position: 'fixed', top: '14px', left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)', maxWidth: '388px', backgroundColor: '#0f1721',
      border: '1px solid rgba(34, 197, 94, 0.4)', boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 15px rgba(34, 197, 94, 0.25)',
      borderRadius: '16px', padding: '10px 14px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Timer style={{ width: '16px', height: '16px', color: '#22c55e' }} />
          </div>
          <div>
            <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', display: 'block' }}>Descanso Entre Séries</span>
            <span style={{ fontSize: '16px', fontWeight: '900', color: '#22c55e', letterSpacing: '1px' }}>{formattedTime}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={onSubtract15} style={{ backgroundColor: '#141d26', border: '1px solid #222f3e', color: '#f87171', fontSize: '10px', fontWeight: 'bold', padding: '5px 8px', borderRadius: '8px', cursor: 'pointer' }}>
            -15s
          </button>
          <button onClick={onAdd30} style={{ backgroundColor: '#141d26', border: '1px solid #222f3e', color: '#ffffff', fontSize: '10px', fontWeight: 'bold', padding: '5px 8px', borderRadius: '8px', cursor: 'pointer' }}>
            +30s
          </button>
          <button onClick={onSkip} style={{ backgroundColor: '#141d26', border: '1px solid #222f3e', color: '#9ca3af', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height: '3px', backgroundColor: '#141d26', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#22c55e', transition: 'width 0.5s linear' }} />
      </div>
    </div>
  );
}