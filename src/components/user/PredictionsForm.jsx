// src/components/user/PredictionsForm.jsx - Versión con navegación secuencial (partido por partido)
import React, { useState, useEffect } from 'react';
import { getCurrentQuiniela, isQuinielaOpen, getTimeUntilDeadline } from '../../services/quinielaService';
import { getMatchesByWeek } from '../../services/matchesService';
import { getUserPredictionsForQuiniela, savePrediction } from '../../services/predictionsService';
import { formatMatchDate } from '../../services/footballService';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function PredictionsForm() {
  const { currentUser } = useAuth();
  const [currentQuiniela, setCurrentQuiniela] = useState(null);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [firstMatchInfo, setFirstMatchInfo] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Estados para navegación secuencial
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [quickSelectOpen, setQuickSelectOpen] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  // Marcadores comunes para quick select
  const commonScores = [
    { home: 0, away: 0, label: '0-0', emoji: '😴', type: 'draw', desc: 'Sin goles' },
    { home: 1, away: 0, label: '1-0', emoji: '⚽', type: 'home', desc: 'Victoria mínima local' },
    { home: 0, away: 1, label: '0-1', emoji: '🥅', type: 'away', desc: 'Victoria mínima visitante' },
    { home: 1, away: 1, label: '1-1', emoji: '🤝', type: 'draw', desc: 'Empate con goles' },
    { home: 2, away: 0, label: '2-0', emoji: '💪', type: 'home', desc: 'Victoria cómoda local' },
    { home: 0, away: 2, label: '0-2', emoji: '🚀', type: 'away', desc: 'Victoria cómoda visitante' },
    { home: 2, away: 1, label: '2-1', emoji: '🔥', type: 'home', desc: 'Victoria ajustada local' },
    { home: 1, away: 2, label: '1-2', emoji: '⚡', type: 'away', desc: 'Victoria ajustada visitante' },
    { home: 3, away: 0, label: '3-0', emoji: '👑', type: 'home', desc: 'Goleada local' },
    { home: 0, away: 3, label: '0-3', emoji: '💥', type: 'away', desc: 'Goleada visitante' },
    { home: 2, away: 2, label: '2-2', emoji: '🎭', type: 'draw', desc: 'Empate emocionante' },
    { home: 3, away: 1, label: '3-1', emoji: '🎯', type: 'home', desc: 'Victoria contundente' }
  ];

  useEffect(() => {
    loadCurrentQuiniela();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentQuiniela?.deadline) {
        const time = getTimeUntilDeadline(currentQuiniela.deadline);
        setTimeLeft(time);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentQuiniela]);

  const loadCurrentQuiniela = async () => {
    setLoading(true);
    try {
      const quiniela = await getCurrentQuiniela();
      
      if (quiniela) {
        setCurrentQuiniela(quiniela);
        
        const quinielaMatches = await Promise.all(
          quiniela.matches.map(async (matchId) => {
            const matchRef = doc(db, 'matches', matchId);
            const matchSnap = await getDoc(matchRef);
            
            if (matchSnap.exists()) {
              return { id: matchSnap.id, ...matchSnap.data() };
            }
            return null;
          })
        );

        const validMatches = quinielaMatches
          .filter(match => match != null)
          .map(match => ({
            ...match,
            date: match.date?.toDate ? match.date.toDate() : new Date(match.date)
          }))
          .sort((a, b) => a.date - b.date);
          
        setMatches(validMatches);
        
        if (validMatches.length > 0) {
          const firstMatch = validMatches[0];
          setFirstMatchInfo({
            match: firstMatch,
            startsIn: getTimeUntilDate(firstMatch.date)
          });
        }
        
        const userPredictions = await getUserPredictionsForQuiniela(currentUser.uid, quiniela.id);
        setPredictions(userPredictions);
        
        const time = getTimeUntilDeadline(quiniela.deadline);
        setTimeLeft(time);
      }
    } catch (error) {
      console.error('Error loading current quiniela:', error);
    }
    setLoading(false);
  };

  const getTimeUntilDate = (targetDate) => {
    const now = new Date();
    const timeDiff = targetDate.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return { expired: true, text: 'Ya comenzó' };
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return { expired: false, text: `En ${days}d ${hours}h ${minutes}m` };
    } else if (hours > 0) {
      return { expired: false, text: `En ${hours}h ${minutes}m` };
    } else {
      return { expired: false, text: `En ${minutes}m` };
    }
  };

  const handlePredictionChange = (matchId, field, value) => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value
      }
    }));
  };

  const handleQuickSelect = async (homeScore, awayScore) => {
    const currentMatch = matches[currentMatchIndex];
    if (!currentMatch) return;

    // Actualizar predicción
    setPredictions(prev => ({
      ...prev,
      [currentMatch.id]: {
        ...prev[currentMatch.id],
        homeScore: homeScore,
        awayScore: awayScore
      }
    }));

    // Cerrar quick select
    setQuickSelectOpen(false);

      await savePredictionForMatch(currentMatch.id, homeScore, awayScore, true);


  };

  const savePredictionForMatch = async (matchId, homeScoreOverride, awayScoreOverride, autoAdvance = false) => {
    const prediction = predictions[matchId];
    const homeScore = homeScoreOverride !== undefined ? homeScoreOverride : (prediction ? Number(prediction.homeScore) : null);
    const awayScore = awayScoreOverride !== undefined ? awayScoreOverride : (prediction ? Number(prediction.awayScore) : null);
    
    if (homeScore === null || awayScore === null || isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      if (!autoAdvance) {
        alert('Por favor completa ambos marcadores');
      }
      return;
    }

    setSaving(true);
    try {
      await savePrediction({
        userId: currentUser.uid,
        matchId,
        quinielaId: currentQuiniela.id,
        homeScore: homeScore,
        awayScore: awayScore
      });
      
      // Mostrar animación de éxito
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 1000);
      
      // Auto-avanzar al siguiente partido incompleto si está habilitado
      if (autoAdvance) {
        setTimeout(() => {
          goToNextIncomplete();
        }, 5000);
      }
      
    } catch (error) {
      console.error('Error saving prediction:', error);
      if (!autoAdvance) {
        alert('Error al guardar la predicción');
      }
    }
    setSaving(false);
  };

  const goToNextIncomplete = () => {
    const incompleteIndex = matches.findIndex((match, index) => {
      if (index <= currentMatchIndex) return false;
      const prediction = predictions[match.id];
      return !prediction || 
             prediction.homeScore === undefined || prediction.homeScore === null || 
             prediction.awayScore === undefined || prediction.awayScore === null ||
             prediction.homeScore === '' || prediction.awayScore === '' ||
             isNaN(Number(prediction.homeScore)) || isNaN(Number(prediction.awayScore));
    });

    if (incompleteIndex !== -1) {
      setCurrentMatchIndex(incompleteIndex);
    } else if (currentMatchIndex < matches.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentMatchIndex > 0) {
      setCurrentMatchIndex(currentMatchIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentMatchIndex < matches.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
    }
  };

  const saveAllPredictions = async () => {
    const incompletePredictions = matches.filter(match => {
      const prediction = predictions[match.id];
      return !prediction || 
             prediction.homeScore === undefined || prediction.homeScore === null || 
             prediction.awayScore === undefined || prediction.awayScore === null ||
             prediction.homeScore === '' || prediction.awayScore === '' ||
             isNaN(Number(prediction.homeScore)) || isNaN(Number(prediction.awayScore));
    });

    if (incompletePredictions.length > 0) {
      alert(`Faltan ${incompletePredictions.length} predicciones por completar`);
      return;
    }

    setSaving(true);
    setShowCelebration(true);
    
    try {
      const savePromises = matches.map(match => {
        const prediction = predictions[match.id];
        return savePrediction({
          userId: currentUser.uid,
          matchId: match.id,
          quinielaId: currentQuiniela.id,
          homeScore: Number(prediction.homeScore),
          awayScore: Number(prediction.awayScore)
        });
      });

      await Promise.all(savePromises);
      
      setTimeout(() => {
        setShowCelebration(false);
        alert('¡Todas las predicciones guardadas correctamente!');
      }, 2000);
      
      const userPredictions = await getUserPredictionsForQuiniela(currentUser.uid, currentQuiniela.id);
      setPredictions(userPredictions);
    } catch (error) {
      console.error('Error saving all predictions:', error);
      setShowCelebration(false);
      alert('Error al guardar las predicciones');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
        borderRadius: '24px',
        margin: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '6px solid rgba(255, 255, 255, 0.2)',
          borderTop: '6px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          Cargando Quiniela
        </div>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px', margin: 0 }}>
          Preparando tus predicciones...
        </p>
      </div>
    );
  }

  if (!currentQuiniela) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '64px 32px',
        background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(75, 85, 99, 0.1) 100%)',
        borderRadius: '24px',
        margin: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          fontSize: '120px',
          marginBottom: '24px',
          opacity: 0.8,
          filter: 'grayscale(50%)'
        }}>⚽</div>
        <h3 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 16px 0'
        }}>
          No hay quiniela activa
        </h3>
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '18px',
          margin: 0,
          maxWidth: '400px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Espera a que el administrador active la próxima jornada para comenzar a predecir
        </p>
      </div>
    );
  }

  const isOpen = isQuinielaOpen(currentQuiniela);
  const currentMatch = matches[currentMatchIndex];
  
  const completedPredictions = matches.filter(match => {
    const prediction = predictions[match.id];
    return prediction && 
           prediction.homeScore !== undefined && prediction.homeScore !== null && prediction.homeScore !== '' &&
           prediction.awayScore !== undefined && prediction.awayScore !== null && prediction.awayScore !== '' &&
           !isNaN(Number(prediction.homeScore)) && !isNaN(Number(prediction.awayScore));
  }).length;
  
  const totalPredictions = matches.length;
  const progressPercentage = totalPredictions > 0 ? (completedPredictions / totalPredictions) * 100 : 0;
  const currentMatchPrediction = currentMatch ? predictions[currentMatch.id] || {} : {};
  const hasValidCurrentPrediction = currentMatchPrediction.homeScore !== undefined && 
                                   currentMatchPrediction.homeScore !== null && 
                                   currentMatchPrediction.homeScore !== '' &&
                                   currentMatchPrediction.awayScore !== undefined && 
                                   currentMatchPrediction.awayScore !== null && 
                                   currentMatchPrediction.awayScore !== '' &&
                                   !isNaN(Number(currentMatchPrediction.homeScore)) && 
                                   !isNaN(Number(currentMatchPrediction.awayScore));

  return (
    <div style={{ position: 'relative', maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      {/* Celebration Animation */}
      {showCelebration && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{
              fontSize: '120px',
              marginBottom: '20px',
              animation: 'bounce 1s ease infinite'
            }}>🎉</div>
            <h2 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '16px'
            }}>
              ¡Predicciones Guardadas!
            </h2>
            <p style={{ fontSize: '18px', opacity: 0.8 }}>
              Todas tus predicciones han sido guardadas exitosamente
            </p>
          </div>
        </div>
      )}

      {/* Header compacto */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 12px 0'
        }}>
          🏆 {currentQuiniela.title}
        </h1>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'white',
            fontSize: '14px'
          }}>
            <span>⏰</span>
            <span>{timeLeft?.text || 'Calculando...'}</span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'white',
            fontSize: '14px'
          }}>
            <span>✅</span>
            <span>{completedPredictions}/{totalPredictions}</span>
          </div>
        </div>
      </div>

      {!isOpen && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
          border: '2px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ef4444',
            margin: '0 0 8px 0'
          }}>
            Quiniela Cerrada
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0,
            fontSize: '14px'
          }}>
            {timeLeft?.expired 
              ? '⏰ Se agotó el tiempo para hacer predicciones'
              : '👑 El administrador cerró la quiniela'
            }
          </p>
        </div>
      )}

      {/* Indicador de progreso */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
            Partido {currentMatchIndex + 1} de {totalPredictions}
          </span>
          <span style={{ color: 'white', fontSize: '14px' }}>
            {Math.round(progressPercentage)}% completado
          </span>
        </div>
        
        {/* Barra de progreso */}
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressPercentage}%`,
            height: '100%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '4px',
            transition: 'width 0.5s ease'
          }}></div>
        </div>
        
        {/* Mini indicadores de partidos */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '4px',
          marginTop: '12px',
          flexWrap: 'wrap'
        }}>
          {matches.map((match, index) => {
            const prediction = predictions[match.id];
            const isCompleted = prediction && 
                               prediction.homeScore !== undefined && prediction.homeScore !== null && prediction.homeScore !== '' &&
                               prediction.awayScore !== undefined && prediction.awayScore !== null && prediction.awayScore !== '' &&
                               !isNaN(Number(prediction.homeScore)) && !isNaN(Number(prediction.awayScore));
            
            return (
              <button
                key={match.id}
                onClick={() => setCurrentMatchIndex(index)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: 'none',
                  background: index === currentMatchIndex 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                    : isCompleted 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (index !== currentMatchIndex) {
                    e.target.style.transform = 'scale(1.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== currentMatchIndex) {
                    e.target.style.transform = 'scale(1)';
                  }
                }}
              >
                {isCompleted ? '✓' : index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Partido actual */}
      {currentMatch && (
        <div style={{
          background: justCompleted 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '24px',
          border: hasValidCurrentPrediction
            ? '2px solid rgba(16, 185, 129, 0.6)'
            : '2px solid rgba(59, 130, 246, 0.6)',
          transition: 'all 0.5s ease',
          textAlign: 'center'
        }}>
          {/* Info del partido */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap'
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '4px 12px',
                borderRadius: '8px'
              }}>
                {currentMatch.league}
              </span>
              <span style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                padding: '4px 12px',
                borderRadius: '8px'
              }}>
                📅 {formatMatchDate(currentMatch.date)}
              </span>
              {hasValidCurrentPrediction && (
                <span style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.4)'
                }}>
                  ✅ COMPLETADO
                </span>
              )}
            </div>
            
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 8px 0',
              lineHeight: '1.2'
            }}>
              {currentMatch.homeTeam}
              <span style={{ 
                color: 'rgba(255, 255, 255, 0.5)', 
                fontSize: '24px',
                margin: '0 16px'
              }}>
                vs
              </span>
              {currentMatch.awayTeam}
            </h2>
          </div>

          {/* Formulario de predicción */}
          {isOpen && (
            <div style={{ marginBottom: '32px' }}>
              {/* Quick Select Button */}
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => setQuickSelectOpen(!quickSelectOpen)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3) 0%, rgba(126, 34, 206, 0.3) 100%)',
                    border: '2px solid rgba(147, 51, 234, 0.5)',
                    borderRadius: '16px',
                    padding: '12px 24px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginBottom: quickSelectOpen ? '20px' : '0'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(147, 51, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  🎯 Marcadores Populares {quickSelectOpen ? '▲' : '▼'}
                </button>

                {/* Quick Select Grid */}
                {quickSelectOpen && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(31, 41, 55, 0.3) 100%)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    animation: 'slideDown 0.3s ease'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '12px'
                    }}>
                      {commonScores.map((score, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickSelect(score.home, score.away)}
                          style={{
                            background: score.type === 'home' 
                              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.3) 100%)'
                              : score.type === 'away'
                              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)'
                              : 'linear-gradient(135deg, rgba(107, 114, 128, 0.3) 0%, rgba(75, 85, 99, 0.3) 100%)',
                            border: `2px solid ${score.type === 'home' 
                              ? 'rgba(59, 130, 246, 0.5)'
                              : score.type === 'away'
                              ? 'rgba(239, 68, 68, 0.5)'
                              : 'rgba(107, 114, 128, 0.5)'}`,
                            borderRadius: '12px',
                            padding: '16px 8px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-4px) scale(1.05)';
                            e.target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0) scale(1)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ fontSize: '20px', marginBottom: '4px' }}>{score.emoji}</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{score.label}</div>
                          <div style={{ fontSize: '10px', opacity: 0.8, textAlign: 'center' }}>{score.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input manual */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '24px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {currentMatch.homeTeam.split(' ').slice(-1)[0]}
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={currentMatchPrediction.homeScore !== undefined && currentMatchPrediction.homeScore !== null ? currentMatchPrediction.homeScore : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        handlePredictionChange(currentMatch.id, 'homeScore', '');
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 0) {
                          handlePredictionChange(currentMatch.id, 'homeScore', numValue);
                        }
                      }
                    }}
                    style={{
                      width: '80px',
                      height: '80px',
                      textAlign: 'center',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
                      border: '3px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '20px',
                      color: '#1f2937',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.background = 'white';
                      e.target.style.transform = 'scale(1.1)';
                      e.target.style.boxShadow = '0 8px 30px rgba(59, 130, 246, 0.4)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                      e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)';
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                    }}
                  />
                </div>
                
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: 'rgba(255, 255, 255, 0.6)',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}>
                  -
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {currentMatch.awayTeam.split(' ').slice(-1)[0]}
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={currentMatchPrediction.awayScore !== undefined && currentMatchPrediction.awayScore !== null ? currentMatchPrediction.awayScore : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        handlePredictionChange(currentMatch.id, 'awayScore', '');
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 0) {
                          handlePredictionChange(currentMatch.id, 'awayScore', numValue);
                        }
                      }
                    }}
                    style={{
                      width: '80px',
                      height: '80px',
                      textAlign: 'center',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
                      border: '3px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '20px',
                      color: '#1f2937',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.background = 'white';
                      e.target.style.transform = 'scale(1.1)';
                      e.target.style.boxShadow = '0 8px 30px rgba(59, 130, 246, 0.4)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                      e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)';
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                    }}
                  />
                </div>
              </div>

              {/* Botón guardar individual */}
              <button
                onClick={() => savePredictionForMatch(currentMatch.id)}
                disabled={saving || !hasValidCurrentPrediction}
                style={{
                  background: hasValidCurrentPrediction 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, rgba(107, 114, 128, 0.5) 0%, rgba(75, 85, 99, 0.5) 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '16px 32px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: hasValidCurrentPrediction ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  opacity: saving ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => {
                  if (hasValidCurrentPrediction && !saving) {
                    e.target.style.transform = 'translateY(-3px) scale(1.02)';
                    e.target.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasValidCurrentPrediction && !saving) {
                    e.target.style.transform = 'translateY(0) scale(1)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                {saving ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    💾 Guardar y Continuar
                  </>
                )}
              </button>
            </div>
          )}

          {/* Estado visual del partido */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <div style={{
              color: hasValidCurrentPrediction ? '#10b981' : 'rgba(255, 255, 255, 0.4)',
              fontSize: '32px',
              animation: hasValidCurrentPrediction ? 'pulse 2s ease-in-out infinite' : 'none'
            }}>
              {hasValidCurrentPrediction ? '✅' : '⏳'}
            </div>
            <span style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {hasValidCurrentPrediction ? 'Predicción completada' : 'Completa tu predicción'}
            </span>
          </div>
        </div>
      )}

      {/* Navegación */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <button
          onClick={goToPrevious}
          disabled={currentMatchIndex === 0}
          style={{
            background: currentMatchIndex === 0 
              ? 'rgba(107, 114, 128, 0.5)' 
              : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 24px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: currentMatchIndex === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: currentMatchIndex === 0 ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (currentMatchIndex !== 0) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 20px rgba(107, 114, 128, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentMatchIndex !== 0) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          ← Anterior
        </button>

        <div style={{
          color: 'white',
          fontSize: '16px',
          fontWeight: '600',
          textAlign: 'center',
          flex: 1
        }}>
          {currentMatchIndex + 1} de {totalPredictions}
        </div>

        <button
          onClick={goToNext}
          disabled={currentMatchIndex === matches.length - 1}
          style={{
            background: currentMatchIndex === matches.length - 1
              ? 'rgba(107, 114, 128, 0.5)' 
              : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 24px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: currentMatchIndex === matches.length - 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: currentMatchIndex === matches.length - 1 ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (currentMatchIndex !== matches.length - 1) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentMatchIndex !== matches.length - 1) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          Siguiente →
        </button>
      </div>

      {/* Botón finalizar cuando esté todo completo */}
      {isOpen && completedPredictions === totalPredictions && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '24px',
          border: '2px solid rgba(16, 185, 129, 0.4)',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#10b981',
            margin: '0 0 12px 0'
          }}>
            🎉 ¡Todas las predicciones completadas!
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            margin: '0 0 20px 0'
          }}>
            Has completado {totalPredictions} predicciones. ¡Finaliza para confirmar todas!
          </p>
          
          <button
            onClick={saveAllPredictions}
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              opacity: saving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 auto'
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.target.style.transform = 'translateY(-4px) scale(1.05)';
                e.target.style.boxShadow = '0 15px 35px rgba(16, 185, 129, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '3px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Finalizando...
              </>
            ) : (
              <>
                🚀 Finalizar Predicciones
              </>
            )}
          </button>
        </div>
      )}

      {/* CSS */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideDown {
          0% { 
            opacity: 0; 
            transform: translateY(-10px); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-30px); }
          60% { transform: translateY(-15px); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}