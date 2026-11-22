import React from 'react';
import { Dumbbell, Play } from 'lucide-react';

export default function ProgressRing({ activeGroup = 'PERNA', onStart }) {
  // Configurações geométricas do anel SVG
  const size = 280;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Circunferência total
  const circumference = 2 * Math.PI * radius;
  // 3 fatias de 120 graus com espaçamento (gap) entre elas
  const segmentLength = (circumference / 3) - 10;
  const gapLength = (circumference - 3 * segmentLength) / 3;

  const segments = [
    { id: 'SUPERIOR', label: 'SUPERIOR', progress: '0/3', offset: 0 },
    { id: 'PERNA', label: 'PERNA', progress: '1/3', offset: (segmentLength + gapLength) },
    { id: 'CORE', label: 'CORE', progress: '0/3', offset: 2 * (segmentLength + gapLength) },
  ];

  return (
    <div className="relative flex items-center justify-center my-2">
      {/* Gráfico Circular em SVG */}
      <svg width={size} height={size} className="transform -rotate-90">
        {segments.map((seg) => {
          const isActive = seg.id === activeGroup;
          return (
            <circle
              key={seg.id}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={isActive ? '#22c55e' : '#141d26'}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="round"
              className={`transition-all duration-500 ${
                isActive ? 'filter drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]' : ''
              }`}
            />
          );
        })}
      </svg>

      {/* Conteúdo Central do Círculo */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
        <div className="w-9 h-9 rounded-xl bg-neon-green/15 border border-neon-green/30 flex items-center justify-center mb-2">
          <Dumbbell className="w-5 h-5 text-neon-green" />
        </div>

        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          Treino de Hoje
        </span>
        <h2 className="text-3xl font-black tracking-wider text-white mt-0.5 mb-1">
          {activeGroup}
        </h2>
        <span className="text-[10px] text-gray-400 font-medium mb-4">
          Quadríceps • Posterior • Glúteos
        </span>

        <button
          onClick={onStart}
          className="pointer-events-auto flex items-center gap-2 bg-neon-green hover:bg-neon-glow text-black font-extrabold text-sm px-7 py-2.5 rounded-full shadow-lg shadow-neon-green/30 active:scale-95 transition-transform"
        >
          <Play className="w-4 h-4 fill-black" />
          <span>INICIAR</span>
        </button>
      </div>

      {/* Rótulos externos com contadores (Superior / Perna / Core) */}
      <div className="absolute top-10 left-8 text-center pointer-events-none">
        <span className="text-[9px] font-bold text-gray-400 block">0/3</span>
        <span className="text-[9px] font-extrabold text-gray-300">SUPERIOR</span>
      </div>

      <div className="absolute top-10 right-8 text-center pointer-events-none">
        <span className="text-[9px] font-bold text-neon-green block">1/3</span>
        <span className="text-[9px] font-extrabold text-white">PERNA</span>
      </div>

      <div className="absolute bottom-5 text-center pointer-events-none">
        <span className="text-[9px] font-bold text-gray-400 block">0/3</span>
        <span className="text-[9px] font-extrabold text-gray-300">CORE</span>
      </div>
    </div>
  );
}