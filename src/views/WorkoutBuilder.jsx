import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Check, Trash2, Search, X, Loader2 } from 'lucide-react';
import { fetchFullExerciseCatalog } from '../data/exerciseCatalog';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200';

function AnimatedExercisePreview({ images, gifUrl, alt, size = 48, onClick }) {
  const currentSrc = gifUrl || images?.[0] || FALLBACK_IMG;

  return (
    <div
      onClick={onClick}
      title={onClick ? 'Toque para ampliar o movimento' : undefined}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '10px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid #222f3e'
      }}
    >
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          backgroundColor: 'rgba(0,0,0,0.75)',
          color: '#22c55e',
          fontSize: '7px',
          fontWeight: '900',
          padding: '1px 3px',
          borderRadius: '3px'
        }}
      >
        GIF
      </span>
    </div>
  );
}

export default function WorkoutBuilder({ existingWorkouts = [], onBack, onSaveCustomWorkout }) {
  const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [visibleLimit, setVisibleLimit] = useState(30);

  const [availableLetters, setAvailableLetters] = useState(() => {
    const savedIds = existingWorkouts.map((w) => w.id).filter(Boolean);
    return savedIds.length > 0 ? savedIds : ['A', 'B', 'C'];
  });

  const [workoutLetter, setWorkoutLetter] = useState(() => {
    const savedIds = existingWorkouts.map((w) => w.id).filter(Boolean);
    return savedIds[0] || 'A';
  });

  const initialExisting = existingWorkouts.find((w) => w.id === workoutLetter);
  const [workoutGroup, setWorkoutGroup] = useState(initialExisting?.group || 'SUPERIOR');
  const [selectedExercises, setSelectedExercises] = useState(initialExisting?.exercises || []);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('Todos');
  const [equipFilter, setEquipFilter] = useState('todos');
  const [previewModalExercise, setPreviewModalExercise] = useState(null);

  // Exercício personalizado digitado
  const [customName, setCustomName] = useState('');
  const [customSets, setCustomSets] = useState('4');
  const [customReps, setCustomReps] = useState('10');
  const [customWeight, setCustomWeight] = useState('20');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFullExerciseCatalog()
      .then((list) => setCatalog(list))
      .catch((err) => console.error('Erro ao carregar catálogo:', err))
      .finally(() => setLoadingCatalog(false));
  }, []);

  useEffect(() => {
    setVisibleLimit(30);
  }, [searchTerm, muscleFilter, equipFilter]);

  // Resolve a imagem do exercício (caso fichas antigas no Firestore ainda não tenham o campo gifUrl)
  const resolveExerciseMedia = (ex) => {
    if (ex.gifUrl || ex.images?.[0]) {
      return {
        gifUrl: ex.gifUrl || ex.images[0],
        images: ex.images || [ex.gifUrl],
        equipmentLabel: ex.equipmentLabel || 'Aparelho'
      };
    }
    const foundInCatalog = catalog.find(
      (c) => c.name.toLowerCase() === (ex.name || '').toLowerCase()
    );
    if (foundInCatalog) {
      return {
        gifUrl: foundInCatalog.gifUrl,
        images: foundInCatalog.images,
        equipmentLabel: foundInCatalog.equipmentLabel
      };
    }
    return { gifUrl: FALLBACK_IMG, images: [FALLBACK_IMG], equipmentLabel: 'Exercício' };
  };

  const handleSelectLetter = (letter) => {
    setWorkoutLetter(letter);
    const found = existingWorkouts.find((w) => w.id === letter);
    if (found) {
      setWorkoutGroup(found.group || 'GERAL');
      setSelectedExercises(found.exercises || []);
    } else {
      setWorkoutGroup('GERAL');
      setSelectedExercises([]);
    }
  };

  const handleAddNewWorkoutLetter = () => {
    const nextLetter = alphabet.find((l) => !availableLetters.includes(l));
    if (!nextLetter) return;
    setAvailableLetters((prev) => [...prev, nextLetter]);
    handleSelectLetter(nextLetter);
  };

const addFromCatalog = (item) => {
    const alreadyAdded = selectedExercises.some(
      (ex) => ex.catalogId === item.id || (ex.gifUrl && ex.gifUrl === item.gifUrl)
    );
    if (alreadyAdded) {
      setSelectedExercises((prev) =>
        prev.filter((ex) => ex.catalogId !== item.id && ex.gifUrl !== item.gifUrl)
      );
      return;
    }

    setSelectedExercises((prev) => [
      ...prev,
      {
        id: `${item.id}-${Date.now()}`,
        catalogId: item.id,
        name: item.name,
        target: item.target,
        equipmentLabel: item.equipmentLabel,
        gifUrl: item.gifUrl,
        images: item.images,
        plannedSets: 4,
        historicalRecord: 20,
        currentWeight: '20',
        currentReps: '10'
      }
    ]);
  };

  const handleUpdateSelectedField = (exId, field, value) => {
    setSelectedExercises((prev) =>
      prev.map((ex) => (ex.id === exId ? { ...ex, [field]: value } : ex))
    );
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    setSelectedExercises((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: customName.trim(),
        target: workoutGroup || 'Geral',
        equipmentLabel: 'Personalizado',
        gifUrl: FALLBACK_IMG,
        images: [FALLBACK_IMG],
        plannedSets: parseInt(customSets, 10) || 4,
        historicalRecord: parseFloat(customWeight) || 0,
        currentWeight: customWeight || '0',
        currentReps: customReps || '10'
      }
    ]);
    setCustomName('');
  };

  const removeExercise = (id) => {
    setSelectedExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const handleSave = async () => {
    if (selectedExercises.length === 0) {
      alert('Adicione pelo menos 1 exercício antes de salvar.');
      return;
    }
    setSaving(true);
    try {
      // Garante que todos os exercícios salvos levem a URL do GIF junto
      const enrichedExercises = selectedExercises.map((ex) => {
        const media = resolveExerciseMedia(ex);
        return {
          ...ex,
          gifUrl: media.gifUrl,
          images: media.images,
          equipmentLabel: media.equipmentLabel
        };
      });

      const newWorkoutObj = {
        id: workoutLetter,
        name: `Treino ${workoutLetter} - ${workoutGroup}`,
        group: workoutGroup.toUpperCase(),
        subtitle: enrichedExercises
          .map((e) => e.target)
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 3)
          .join(' • '),
        exercises: enrichedExercises
      };
      await onSaveCustomWorkout(newWorkoutObj);
    } finally {
      setSaving(false);
    }
  };

  const filteredCatalog = catalog.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(term) ||
      (item.originalName && item.originalName.toLowerCase().includes(term)) ||
      item.target.toLowerCase().includes(term);
    const matchesMuscle = muscleFilter === 'Todos' || item.muscleGroup === muscleFilter;
    const matchesEquip = equipFilter === 'todos' || item.equipmentType === equipFilter;
    return matchesSearch && matchesMuscle && matchesEquip;
  });

  const visibleItems = filteredCatalog.slice(0, visibleLimit);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#000000' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#0b1118', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', borderLeft: '1px solid #141d26', borderRight: '1px solid #141d26', paddingBottom: '145px' }}>
        
        {/* Modal Ampliado de Demonstração (abre ao tocar na foto de qualquer exercício) */}
        {previewModalExercise && (
          <div onClick={() => setPreviewModalExercise(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#141d26', border: '1px solid #22c55e', borderRadius: '18px', padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 'bold', textTransform: 'uppercase' }}>{previewModalExercise.equipmentLabel || 'Aparelho'}</span>
                <button onClick={() => setPreviewModalExercise(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X style={{ width: '18px', height: '18px' }} /></button>
              </div>
              <AnimatedExercisePreview
                gifUrl={previewModalExercise.gifUrl}
                images={previewModalExercise.images}
                alt={previewModalExercise.name}
                size={230}
              />
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff', margin: '0 0 4px 0' }}>{previewModalExercise.name}</h3>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>Alvo: {previewModalExercise.target}</span>
              </div>
              <button
                onClick={() => {
                  const isAlreadyAdded = selectedExercises.some(
                    (ex) => ex.catalogId === previewModalExercise.id || (ex.gifUrl && ex.gifUrl === previewModalExercise.gifUrl)
                  );
                  if (!isAlreadyAdded) {
                    addFromCatalog(previewModalExercise);
                  }
                  setPreviewModalExercise(null);
                }}
                style={{ width: '100%', backgroundColor: '#22c55e', color: '#000', fontWeight: '900', fontSize: '12px', padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
              >
                {selectedExercises.some(
                  (ex) => ex.catalogId === previewModalExercise.id || (ex.gifUrl && ex.gifUrl === previewModalExercise.gifUrl)
                )
                  ? 'FECHAR VISUALIZAÇÃO'
                  : 'ADICIONAR AO TREINO'}
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <header style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #141d26', backgroundColor: '#070a0e' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
            <ArrowLeft style={{ width: '18px', height: '18px', color: '#22c55e' }} />
            <span>Voltar</span>
          </button>
          <span style={{ fontSize: '12px', fontWeight: '900', color: '#ffffff' }}>
            MONTAR FICHA ({catalog.length} APARELHOS)
          </span>
          <div style={{ width: '40px' }} />
        </header>

        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
          
          {/* Abas Dinâmicas de Treino */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {availableLetters.map((letter) => {
              const isSelected = workoutLetter === letter;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => handleSelectLetter(letter)}
                  style={{
                    padding: '7px 13px', borderRadius: '10px', fontWeight: '900', fontSize: '11px', cursor: 'pointer',
                    backgroundColor: isSelected ? '#22c55e' : '#141d26',
                    color: isSelected ? '#000000' : '#ffffff',
                    border: isSelected ? 'none' : '1px solid #222f3e'
                  }}
                >
                  Treino {letter}
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleAddNewWorkoutLetter}
              style={{
                padding: '7px 11px', borderRadius: '10px', fontWeight: '800', fontSize: '11px', cursor: 'pointer',
                backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', border: '1px dashed #22c55e',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <Plus style={{ width: '13px', height: '13px' }} />
              <span>Add Treino</span>
            </button>
          </div>

          {/* Foco Muscular */}
          <div>
            <label style={{ fontSize: '9px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              Nome / Foco do Treino {workoutLetter}
            </label>
            <input
              type="text"
              placeholder="Ex: Peito, Ombro e Tríceps"
              value={workoutGroup}
              onChange={(e) => setWorkoutGroup(e.target.value)}
              style={{ width: '100%', backgroundColor: '#141d26', border: '1px solid #222f3e', borderRadius: '10px', padding: '9px 12px', color: '#ffffff', fontSize: '13px', fontWeight: 'bold', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* LISTA DOS EXERCÍCIOS SELECIONADOS (COM FOTO CLICÁVEL E CONTROLE DE SÉRIES/REPS/CARGA) */}
          {selectedExercises.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Selecionados no Treino {workoutLetter} ({selectedExercises.length}):
              </span>

              {selectedExercises.map((ex, idx) => {
                const media = resolveExerciseMedia(ex);
                return (
                  <div
                    key={ex.id}
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.08)',
                      border: '1px solid rgba(34, 197, 94, 0.35)',
                      padding: '9px 10px',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <AnimatedExercisePreview
                        gifUrl={media.gifUrl}
                        images={media.images}
                        alt={ex.name}
                        size={46}
                        onClick={() => setPreviewModalExercise({ ...ex, ...media })}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff', display: 'block', lineHeight: '1.25' }}>
                          {idx + 1}. {ex.name}
                        </span>
                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                          {ex.target} • Toque na foto p/ ver
                        </span>
                      </div>

                      <button onClick={() => removeExercise(ex.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>

                    {/* Ajustes rápidos de Séries, Reps e Carga inicial */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', backgroundColor: '#0b1118', padding: '6px 8px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '9px', color: '#9ca3af' }}>Séries:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={ex.plannedSets}
                          onChange={(e) => handleUpdateSelectedField(ex.id, 'plannedSets', parseInt(e.target.value, 10) || 3)}
                          style={{ width: '34px', backgroundColor: '#141d26', border: '1px solid #222f3e', borderRadius: '5px', color: '#22c55e', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', padding: '2px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '9px', color: '#9ca3af' }}>Reps:</span>
                        <input
                          type="text"
                          value={ex.currentReps}
                          onChange={(e) => handleUpdateSelectedField(ex.id, 'currentReps', e.target.value)}
                          style={{ width: '38px', backgroundColor: '#141d26', border: '1px solid #222f3e', borderRadius: '5px', color: '#ffffff', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', padding: '2px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '9px', color: '#9ca3af' }}>Carga:</span>
                        <input
                          type="number"
                          value={ex.currentWeight}
                          onChange={(e) => handleUpdateSelectedField(ex.id, 'currentWeight', e.target.value)}
                          style={{ width: '40px', backgroundColor: '#141d26', border: '1px solid #222f3e', borderRadius: '5px', color: '#22c55e', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', padding: '2px' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Barra de Pesquisa + Filtro Máquina / Peso Livre */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#141d26', padding: '10px', borderRadius: '14px', border: '1px solid #222f3e' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ width: '14px', height: '14px', color: '#9ca3af', position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Buscar entre +1.200 exercícios (ex: Supino, Abdutora, Leg)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', backgroundColor: '#0b1118', border: '1px solid #222f3e', borderRadius: '8px', padding: '8px 10px 8px 32px', color: '#ffffff', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[
                { id: 'todos', label: 'Todos Tipos' },
                { id: 'maquina', label: 'Máquinas' },
                { id: 'livre', label: 'Peso Livre' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEquipFilter(t.id)}
                  style={{
                    padding: '6px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer',
                    backgroundColor: equipFilter === t.id ? '#22c55e' : '#0b1118',
                    color: equipFilter === t.id ? '#000000' : '#9ca3af',
                    border: equipFilter === t.id ? 'none' : '1px solid #222f3e'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              {['Todos', 'Peito', 'Costas', 'Ombros', 'Braços', 'Pernas', 'Core'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMuscleFilter(m)}
                  style={{
                    padding: '5px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap', cursor: 'pointer',
                    backgroundColor: muscleFilter === m ? 'rgba(34, 197, 94, 0.2)' : '#0b1118',
                    color: muscleFilter === m ? '#22c55e' : '#9ca3af',
                    border: muscleFilter === m ? '1px solid #22c55e' : '1px solid #222f3e'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Lista do Catálogo Completo (Clicar na foto amplia; clicar no card adiciona/remove) */}
          {loadingCatalog ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#22c55e', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Loader2 style={{ width: '16px', height: '16px' }} />
              <span>Carregando base completa de exercícios...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                Mostrando {visibleItems.length} de {filteredCatalog.length} exercícios (toque na foto para ampliar)
              </span>

{visibleItems.map((eq) => {
                const isSelected = selectedExercises.some(
                  (ex) => ex.catalogId === eq.id || (ex.gifUrl && ex.gifUrl === eq.gifUrl)
                );
                return (
                  <div
                    key={eq.id}
                    onClick={() => addFromCatalog(eq)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '8px',
                      backgroundColor: '#141d26', borderRadius: '12px',
                      border: isSelected ? '1px solid #22c55e' : '1px solid #222f3e',
                      cursor: 'pointer'
                    }}
                  >
                    <AnimatedExercisePreview
                      gifUrl={eq.gifUrl}
                      images={eq.images}
                      alt={eq.name}
                      size={50}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewModalExercise(eq);
                      }}
                    />

                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff', margin: '0 0 2px 0' }}>{eq.name}</h4>
                      <span style={{ fontSize: '10px', color: '#9ca3af', display: 'block' }}>{eq.target} • <strong style={{ color: '#22c55e' }}>{eq.equipmentLabel}</strong></span>
                    </div>

                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: isSelected ? '#22c55e' : '#0b1118', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected ? <Check style={{ width: '14px', height: '14px', color: '#000' }} /> : <Plus style={{ width: '14px', height: '14px', color: '#9ca3af' }} />}
                    </div>
                  </div>
                );
              })}

              {visibleItems.length < filteredCatalog.length && (
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + 30)}
                  style={{ width: '100%', backgroundColor: '#141d26', border: '1px solid #22c55e', color: '#22c55e', padding: '10px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Carregar mais 30 exercícios ({filteredCatalog.length - visibleItems.length} restantes)
                </button>
              )}
            </div>
          )}

          {/* Adicionar Exercício Livre Digitado */}
          <form onSubmit={handleAddCustom} style={{ backgroundColor: '#141d26', border: '1px solid #222f3e', borderRadius: '14px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase' }}>Ou crie um exercício personalizado:</span>
            <input
              type="text"
              placeholder="Nome do aparelho ou exercício..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0b1118', border: '1px solid #222f3e', borderRadius: '8px', padding: '8px 10px', color: '#ffffff', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '6px', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>Séries</span>
                <input type="number" value={customSets} onChange={(e) => setCustomSets(e.target.value)} style={{ width: '100%', backgroundColor: '#0b1118', border: '1px solid #222f3e', borderRadius: '6px', padding: '6px', color: '#fff', fontSize: '12px', textAlign: 'center', boxSizing: 'border-box' }} />
              </div>
              <div>
                <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>Reps</span>
                <input type="number" value={customReps} onChange={(e) => setCustomReps(e.target.value)} style={{ width: '100%', backgroundColor: '#0b1118', border: '1px solid #222f3e', borderRadius: '6px', padding: '6px', color: '#fff', fontSize: '12px', textAlign: 'center', boxSizing: 'border-box' }} />
              </div>
              <div>
                <span style={{ fontSize: '8px', color: '#9ca3af', display: 'block' }}>Carga (kg)</span>
                <input type="number" value={customWeight} onChange={(e) => setCustomWeight(e.target.value)} style={{ width: '100%', backgroundColor: '#0b1118', border: '1px solid #222f3e', borderRadius: '6px', padding: '6px', color: '#fff', fontSize: '12px', textAlign: 'center', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" style={{ marginTop: '12px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', padding: '7px 12px', fontWeight: '900', cursor: 'pointer' }}>
                <Plus style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </form>

        </div>

        {/* Rodapé Salvar (posicionado logo acima da barra de navegação) */}
        <div style={{ position: 'fixed', bottom: '64px', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '420px', backgroundColor: 'rgba(7, 10, 14, 0.96)', borderTop: '1px solid #141d26', padding: '10px 20px', zIndex: 45, boxSizing: 'border-box' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ width: '100%', backgroundColor: '#22c55e', color: '#000000', fontWeight: '900', fontSize: '13px', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)' }}
          >
            {saving ? 'SALVANDO NO FIREBASE...' : `SALVAR TREINO ${workoutLetter}`}
          </button>
        </div>

      </div>
    </div>
  );
}