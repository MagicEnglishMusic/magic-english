import { useState, useRef, useCallback, useEffect } from 'react';
import {
  evaluateSpeechAccuracy,
  normalizeEnglishSentence,
  levenshteinDistance,
  SIMILARITY_THRESHOLD,
  numberToWords,
  areHomophones
} from '../utils/speechEvaluation.js';

export {
  evaluateSpeechAccuracy,
  normalizeEnglishSentence,
  levenshteinDistance,
  SIMILARITY_THRESHOLD,
  numberToWords,
  areHomophones
};

/**
 * Sanitiza o texto para comparação fonética/textual (compatibilidade retroativa)
 */
export function sanitizeText(text = '') {
  return normalizeEnglishSentence(text);
}

/**
 * Calcula a similaridade entre o texto esperado e o falado (0 a 100)
 */
export function calculateWordSimilarity(targetText, spokenText) {
  const result = evaluateSpeechAccuracy(targetText, spokenText);
  return result.score;
}

/**
 * Hook de Reconhecimento e Avaliação de Pronúncia Vocal em Inglês
 */
export function useSpeechEvaluator({ onResult = null, timeoutMs = 8000 } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const isSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback((targetSentence) => {
    stopRecording();
    setEvaluation(null);

    if (!isSupported) {
      setEvaluation({
        score: 0,
        transcript: '',
        status: 'unsupported',
        message: 'Use Chrome ou Edge para treinar a pronúncia.',
        isSupported: false
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    let receivedResult = false;

    recognition.onstart = () => {
      setIsRecording(true);
      // Timeout de 8 segundos de silêncio
      timerRef.current = setTimeout(() => {
        if (!receivedResult) {
          stopRecording();
          setEvaluation({
            score: 0,
            transcript: '',
            status: 'low',
            message: 'Não consegui ouvir, tente de novo.',
            isSupported: true
          });
        }
      }, timeoutMs);
    };

    recognition.onresult = (event) => {
      receivedResult = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      stopRecording();

      // Avalia todas as alternativas fornecidas pelo SpeechRecognition
      let bestScore = 0;
      let bestTranscript = '';
      let bestResult = null;

      for (let i = 0; i < event.results.length; i++) {
        const resultList = event.results[i];
        for (let j = 0; j < resultList.length; j++) {
          const altTranscript = resultList[j]?.transcript || '';
          const evalRes = evaluateSpeechAccuracy(targetSentence, altTranscript);
          if (evalRes.score >= bestScore) {
            bestScore = evalRes.score;
            bestTranscript = altTranscript;
            bestResult = evalRes;
          }
        }
      }

      // Se nada capturado nas alternativas
      if (!bestTranscript && event.results[0]?.[0]?.transcript) {
        bestTranscript = event.results[0][0].transcript;
        bestResult = evaluateSpeechAccuracy(targetSentence, bestTranscript);
        bestScore = bestResult.score;
      }

      console.debug('[useSpeechEvaluator]', {
        target: targetSentence,
        normalizedTarget: bestResult?.normTarget,
        spoken: bestTranscript,
        normalizedSpoken: bestResult?.normSpoken,
        score: bestScore,
        passed: bestScore >= SIMILARITY_THRESHOLD
      });

      let status = 'low';
      let message = `Entendi: "${bestTranscript || 'não identificado'}" (${bestScore}%). Tente de novo.`;

      if (bestScore >= SIMILARITY_THRESHOLD) {
        status = 'excellent';
        message = `Excelente! Você pronunciou com ${bestScore}% de precisão.`;
      } else if (bestScore >= 50) {
        status = 'almost';
        message = `Quase lá (${bestScore}%)! Você disse "${bestTranscript}". Tente de novo.`;
      }

      const evalData = {
        score: bestScore,
        transcript: bestTranscript,
        status,
        message,
        isSupported: true
      };

      setEvaluation(evalData);
      if (onResult) {
        onResult(evalData);
      }
    };

    recognition.onerror = (event) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      stopRecording();

      if (event.error === 'not-allowed') {
        setEvaluation({
          score: 0,
          transcript: '',
          status: 'error',
          message: 'Acesso ao microfone negado. Permita o uso do microfone no seu navegador.',
          isSupported: true
        });
      } else if (event.error === 'no-speech') {
        setEvaluation({
          score: 0,
          transcript: '',
          status: 'low',
          message: 'Nenhum áudio detectado. Cante a frase após clicar no botão.',
          isSupported: true
        });
      } else {
        setEvaluation({
          score: 0,
          transcript: '',
          status: 'error',
          message: `Erro na captura (${event.error}). Tente novamente.`,
          isSupported: true
        });
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
    } catch (err) {
      stopRecording();
      setEvaluation({
        score: 0,
        transcript: '',
        status: 'error',
        message: 'Não foi possível iniciar o microfone. Tente novamente.',
        isSupported: true
      });
    }
  }, [isSupported, stopRecording, timeoutMs, onResult]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    evaluation,
    isSupported,
    startRecording,
    stopRecording,
    setEvaluation
  };
}
