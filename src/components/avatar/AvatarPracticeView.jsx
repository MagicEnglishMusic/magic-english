import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Clock, 
  RotateCcw, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Flame,
  VolumeX,
  Play,
  Square
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import {
  avatarPracticeService,
  DEFAULT_AVATAR_SETTINGS,
  TEACHER_PRESETS,
  PARTIAL_PHRASE_RETRY_MESSAGE,
  validateSpeech,
  requestAzureTTS,
  requestAzureBilingualTTS,
  pickRandomAvatarPhrase,
  concatAudioBuffers
} from '../../services/avatarPracticeService';
import { fetchDriveAudioArrayBuffer } from '../../utils/googleDriveHelper';
import { THEME_PRESETS } from '../admin/AvatarSettingsView';

// Helpers para conversão de áudio da síntese de voz (WAV / PCM)
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function processAudioToBuffer(headCtx, audioBytes, sampleRateHint = 24000) {
  const bytes = new Uint8Array(audioBytes);
  const isWav = bytes.length >= 4 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;

  if (isWav) {
    return await headCtx.decodeAudioData(audioBytes.slice(0));
  }

  const int16Array = new Int16Array(audioBytes);
  const audioBuffer = headCtx.createBuffer(1, int16Array.length, sampleRateHint);
  const channelData = audioBuffer.getChannelData(0);
  for (let i = 0; i < int16Array.length; i++) {
    channelData[i] = int16Array[i] / 32768.0;
  }
  return audioBuffer;
}

export default function AvatarPracticeView({ onGainXp = () => {} }) {
  const { user } = useAuth();
  const { addXp } = useGamification();

  // Estados principais
  const [settings, setSettings] = useState(DEFAULT_AVATAR_SETTINGS);
  const [phrasesQueue, setPhrasesQueue] = useState([]);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isModuleCompleted, setIsModuleCompleted] = useState(false);
  const [activeSongName, setActiveSongName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Preparando sua professora virtual 3D...');
  const [isAvatarReady, setIsAvatarReady] = useState(false);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [subtitles, setSubtitles] = useState('');

  // Sessão e Timer
  const [sessionStatus, setSessionStatus] = useState({
    isLocked: false,
    timeRemainingSeconds: 900,
    cooldownRemainingSeconds: 0
  });

  // Microfone e Reconhecimento de Voz (STT)
  const [isListening, setIsListening] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'retry', message: '', score: 0 }
  const [completedPhrasesCount, setCompletedPhrasesCount] = useState(0);

  // Refs
  const avatarContainerRef = useRef(null);
  const headRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const hasAnnouncedFarewellRef = useRef(false);

  const studentName = user?.name || user?.user_metadata?.full_name || 'Aluno';
  const currentPhrase = phrasesQueue[currentPhraseIndex] || null;

  // Flag para identificar retomada de sessão
  const isResumingRef = useRef(false);
  const lastResumePhraseRef = useRef(null);
  const lastSuccessPhraseRef = useRef(null);
  const lastRetryPhraseRef = useRef(null);

  // 1. Inicializar Dados e Configurações (com Restauração de Sessão)
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const loadedSettings = await avatarPracticeService.getSettings();
        if (!isMounted) return;
        setSettings(loadedSettings);

        // Status de sessão diária com as configurações reais do Admin
        const status = avatarPracticeService.getDailySessionStatus(
          user?.id,
          loadedSettings
        );
        setSessionStatus(status);

        // Se o aluno JÁ ESTÁ em período de cooldown (tempo esgotado nas últimas 24h)
        // REGRA ABSOLUTA: SILÊNCIO TOTAL - Não carregar frases, não disparar áudios
        if (status.isLocked) {
          setIsLoading(false);
          return;
        }

        // Carregar repertório estrito de frases primeiro
        const { completedSongs, phrases } = await avatarPracticeService.getStudentEligiblePhrases(user?.id);
        if (!isMounted) return;

        if (phrases.length > 0) {
          setPhrasesQueue(phrases);
          
          // Exibe título da música única ou a soma do repertório acumulado
          if (completedSongs.length > 1) {
            setActiveSongName(`${completedSongs.length} músicas dominadas (${phrases.length} frases acumuladas)`);
          } else {
            const singleTitle = completedSongs[0]?.title || 'Magic English - Aprenda Inglês com Música';
            setActiveSongName(singleTitle);
          }
        }

        // Recuperar sessão salva do aluno (para retomar exatamente de onde parou)
        const savedSession = avatarPracticeService.getSavedSession(user?.id);
        const today = new Date().toDateString();
        const isSameDaySession = savedSession && savedSession.sessionDate === today;

        if (isSameDaySession) {
          if (typeof savedSession.currentPhraseIndex === 'number') {
            const safeIndex = (phrases.length > 0 && savedSession.currentPhraseIndex >= phrases.length)
              ? 0
              : savedSession.currentPhraseIndex;
            setCurrentPhraseIndex(safeIndex);
            if (safeIndex > 0) isResumingRef.current = true;
          }
          if (Array.isArray(savedSession.usedPhraseIds)) {
            setCompletedPhrasesCount(savedSession.usedPhraseIds.length);
          }
          if (typeof savedSession.activeRemainingSeconds === 'number' && savedSession.activeRemainingSeconds > 0) {
            setSessionStatus((prev) => ({
              ...prev,
              timeRemainingSeconds: savedSession.activeRemainingSeconds
            }));
          }
        }

        // Iniciar ou restaurar sessão
        avatarPracticeService.startDailySession(user?.id, loadedSettings.sessionDurationMinutes);

      } catch (err) {
        console.error('Erro na inicialização da prática:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [user]);

  // Função centralizada para término de sessão (executa despedida rigorosamente UMA ÚNICA VEZ)
  const handleTimeFinished = () => {
    if (hasAnnouncedFarewellRef.current) return;
    hasAnnouncedFarewellRef.current = true;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    avatarPracticeService.completeDailySession(user?.id);

    // Fala de despedida dinâmica da professora com template do admin executada rigorosamente UMA VEZ
    const pickedFarewell = pickRandomAvatarPhrase(
      settings.farewellMessage,
      DEFAULT_AVATAR_SETTINGS.farewellMessage
    );
    const farewell = pickedFarewell
      .replace(/\{nome_aluno\}/gi, studentName)
      .replace(/\{titulo_musica\}/gi, activeSongName || 'Magic English');
    speakText(farewell, null, 'pt', null, null, {
      rawTemplate: pickedFarewell,
      category: 'despedidas'
    });

    setSessionStatus((prev) => ({
      ...prev,
      isLocked: true,
      timeRemainingSeconds: 0,
      cooldownRemainingSeconds: (settings.cooldownHours || 24) * 3600
    }));
  };

  // 2. Cronômetro de Tempo Ativo (NÃO corre solto)
  // O cronômetro SÓ debita se o aluno estiver falando no microfone ou a Avatar estiver falando
  useEffect(() => {
    if (sessionStatus.isLocked || isLoading) return;

    // Prática ativa: Avatar falando OU aluno gravando áudio no microfone
    const isActivePractice = (avatarSpeaking || isListening) && !sessionStatus.isLocked;

    if (isActivePractice && sessionStatus.timeRemainingSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setSessionStatus((prev) => {
          if (prev.timeRemainingSeconds <= 1) {
            handleTimeFinished();
            return {
              ...prev,
              timeRemainingSeconds: 0
            };
          }
          // Debita e persiste o segundo de prática ativa
          const nextSec = prev.timeRemainingSeconds - 1;
          avatarPracticeService.decrementActiveSessionTime(user?.id, 1);
          return {
            ...prev,
            timeRemainingSeconds: nextSec
          };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [avatarSpeaking, isListening, sessionStatus.isLocked, sessionStatus.timeRemainingSeconds, isLoading, user]);

  // 2.1 Pausa Imediata ao Minimizar / Trocar de Aba (document.visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        // Pausa áudios e fala imediatamente
        if (headRef.current) {
          try {
            headRef.current.stopSpeaking();
          } catch (_) {}
        }
        if (recognitionRef.current && isListening) {
          try {
            recognitionRef.current.stop();
          } catch (_) {}
          setIsListening(false);
        }
        setAvatarSpeaking(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isListening]);

  // 3. Inicializar TalkingHead (WebGL / Three.js 3D) - Com Destruição Estrita de Canvas Anteriores
  useEffect(() => {
    // SILÊNCIO TOTAL: Se estiver em cooldown, sequer inicializa a fala
    if (!avatarContainerRef.current || sessionStatus.isLocked) return;
    let headInstance = null;
    let isCancelled = false;

    // Destrói imediatamente qualquer instância anterior ativa e limpa o DOM
    if (headRef.current) {
      try {
        headRef.current.stopSpeaking();
        headRef.current.stop();
        headRef.current.dispose();
      } catch (_) {}
      headRef.current = null;
    }
    if (avatarContainerRef.current) {
      const existingCanvases = avatarContainerRef.current.querySelectorAll('canvas');
      existingCanvases.forEach((c) => c.remove());
    }

    async function initTalkingHead() {
      try {
        setIsAvatarReady(false);
        setLoadingMessage('Renderizando o(a) Professor(a) 3D em tempo real...');
        
        const pristineBoneTransforms = new Map();

        // 1. Import dinâmico da classe TalkingHead, do Three.js e do GLTFLoader
        const { TalkingHead } = await import(
          /* @vite-ignore */ 'https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.7/modules/talkinghead.mjs'
        );
        const { GLTFLoader } = await import(
          /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js'
        );
        const THREE = await import(
          /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js/+esm'
        );
        if (isCancelled || !avatarContainerRef.current) return;

        // 2. Interceptador universal no GLTFLoader para modelos Mixamo / Tripo3D
        if (!GLTFLoader.prototype._talkingHeadMixamoPatched) {
          GLTFLoader.prototype._talkingHeadMixamoPatched = true;
          const origParse = GLTFLoader.prototype.parse;
          GLTFLoader.prototype.parse = function (data, path, onLoad, onError) {
            const wrappedOnLoad = (gltf) => {
              try {
                // A) Limpar prefixos 'mixamorig:' de todos os ossos e nós
                gltf.scene.traverse((node) => {
                  if (node.name && node.name.includes('mixamorig')) {
                    node.name = node.name.replace(/^mixamorig:?/i, '').replace(/^:+/, '');
                  }
                });

                // Salva a anatomia 100% original e pura do arquivo GLB antes do TalkingHead alterar
                gltf.scene.traverse((node) => {
                  if (node.isBone) {
                    pristineBoneTransforms.set(node.name, {
                      quaternion: node.quaternion.clone(),
                      position: node.position.clone(),
                      scale: node.scale.clone()
                    });
                  }
                });

                // B) Criar nós LeftEye e RightEye anexados à cabeça se não existirem
                const headNode = gltf.scene.getObjectByName('Head');
                if (headNode) {
                  if (!gltf.scene.getObjectByName('LeftEye')) {
                    const leftEye = new THREE.Object3D();
                    leftEye.name = 'LeftEye';
                    leftEye.position.set(-0.04, 0.08, 0.08);
                    headNode.add(leftEye);
                  }
                  if (!gltf.scene.getObjectByName('RightEye')) {
                    const rightEye = new THREE.Object3D();
                    rightEye.name = 'RightEye';
                    rightEye.position.set(0.04, 0.08, 0.08);
                    headNode.add(rightEye);
                  }
                }

                // C) Garantir blendshapes / morph targets sintéticos para lipsync e piscar
                let hasMorphs = false;
                gltf.scene.traverse((child) => {
                  if (child.morphTargetInfluences && child.morphTargetInfluences.length && child.morphTargetDictionary) {
                    hasMorphs = true;
                  }
                });

                if (!hasMorphs) {
                  gltf.scene.traverse((child) => {
                    if ((child.isSkinnedMesh || child.isMesh) && child.geometry) {
                      const geom = child.geometry;
                      if (!geom.morphAttributes) geom.morphAttributes = {};
                      if (!geom.morphAttributes.position) {
                        const pos = geom.attributes.position;
                        const count = pos.count;
                        const mouthOpen = new Float32Array(count * 3);
                        const blink = new Float32Array(count * 3);
                        for (let i = 0; i < count; i++) {
                          const y = pos.getY(i);
                          const z = pos.getZ(i);
                          const x = pos.getX(i);
                          // Boca (abertura labial sincronizada com a voz)
                          if (y > 0.60 && y < 0.78 && z > 0.02 && Math.abs(x) < 0.12) {
                            mouthOpen[i * 3 + 1] = -0.025;
                          }
                          // Olhos (piscar natural)
                          if (y > 0.76 && y < 0.88 && z > 0.04 && Math.abs(x) < 0.15) {
                            blink[i * 3 + 1] = -0.012;
                          }
                        }
                        const BufferAttr = pos.constructor;
                        geom.morphAttributes.position = [
                          new BufferAttr(mouthOpen, 3),
                          new BufferAttr(blink, 3)
                        ];
                        child.morphTargetDictionary = {
                          mouthOpen: 0,
                          viseme_aa: 0,
                          viseme_E: 0,
                          viseme_I: 0,
                          viseme_O: 0,
                          viseme_U: 0,
                          jawOpen: 0,
                          eyeBlinkLeft: 1,
                          eyeBlinkRight: 1
                        };
                        child.morphTargetInfluences = [0, 0];
                      }
                    }
                  });
                }
              } catch (patchErr) {
                console.warn('Aviso no patch do GLTF:', patchErr);
              }
              onLoad(gltf);
            };
            return origParse.call(this, data, path, wrappedOnLoad, onError);
          };
        }

        // Limpeza preventiva de segurança antes de injetar o novo canvas
        const canvasesBefore = avatarContainerRef.current.querySelectorAll('canvas');
        canvasesBefore.forEach((c) => c.remove());

        // Validação estrita do professor: garante sincronia atômica entre ID, modelo 3D e vozes neurais
        const teacher = TEACHER_PRESETS.find(t => t.id === settings.teacherPresetId) 
          || TEACHER_PRESETS.find(t => t.modelUrl === settings.modelUrl) 
          || TEACHER_PRESETS[0];
        
        // Sanitização: Se houver URL antiga quebrada de CDN gravada no banco, usa o arquivo local oficial
        let effectiveModelUrl = teacher.modelUrl || settings.modelUrl;
        if (!effectiveModelUrl || effectiveModelUrl.includes('cdn.jsdelivr.net') || effectiveModelUrl.includes('models.readyplayer.me')) {
          effectiveModelUrl = teacher.modelUrl;
        }

        // TalkingHead: O módulo oficial 'en' fornece o motor fonético universal para os visemas Oculus/ARKit.
        // O CDN upstream não possui 'lipsync-pt.mjs' (retorna HTTP 404). Por isso, registramos apenas ['en'].
        headInstance = new TalkingHead(avatarContainerRef.current, {
          lipsyncModules: ['en'],
          cameraView: 'upper',
          cameraDistance: teacher.cameraDistance !== undefined ? teacher.cameraDistance : 0.6,
          cameraX: 0,
          cameraY: teacher.cameraY !== undefined ? teacher.cameraY : 0.05,
          cameraRotateEnable: true,
          cameraZoomEnable: true,
          cameraPanEnable: false,
          lightAmbientIntensity: 2.2,
          lightDirectIntensity: 28
        });

        headRef.current = headInstance;

        // Carregar modelo 3D
        setLoadingMessage(`Carregando ${teacher.name} em 3D...`);
        await headInstance.showAvatar({
          url: effectiveModelUrl,
          body: teacher.gender || 'M',
          baseline: teacher.baseline || undefined,
          avatarMood: 'neutral',
          lipsyncLang: 'en'
        });

        if (isCancelled) return;

        // Restaura a anatomia original do modelo 3D e neutraliza o sistema de poses do TalkingHead
        if (teacher.id === 'lucas' || teacher.isMixamo) {
          // 1. Restaura cada osso para a sua rotação, posição e escala original do arquivo 3D
          headInstance.armature.traverse((node) => {
            if (node.isBone && pristineBoneTransforms.has(node.name)) {
              const orig = pristineBoneTransforms.get(node.name);
              node.quaternion.copy(orig.quaternion);
              node.position.copy(orig.position);
              node.scale.copy(orig.scale);
            }
          });
          // 2. Esvazia os templates de pose para impedir que o TalkingHead volte a torcer o corpo
          headInstance.poseBase.props = {};
          headInstance.poseTarget.props = {};
          headInstance.poseDelta.props = {};
          headInstance.posePropNames = [];
          if (headInstance.poseTemplates) {
            Object.keys(headInstance.poseTemplates).forEach((k) => {
              headInstance.poseTemplates[k].props = {};
            });
          }
        }

        // B) Força o recálculo de tela e o enquadramento imediato (elimina a necessidade de minimizar a tela)
        headInstance.onResize();
        headInstance.setView('upper', {
          cameraDistance: teacher.cameraDistance !== undefined ? teacher.cameraDistance : 0.6,
          cameraY: teacher.cameraY !== undefined ? teacher.cameraY : 0.05
        });

        // C) Limites de zoom nos controles
        if (headInstance.controls) {
          headInstance.controls.minDistance = 0.5;
          headInstance.controls.maxDistance = 8.0;
          headInstance.controls.enableDamping = true;
          headInstance.controls.dampingFactor = 0.05;
        }

        setIsAvatarReady(true);

        // SILÊNCIO ABSOLUTO se estiver em cooldown
        if (sessionStatus.isLocked) return;

        // Saudação inicial com template configurado no painel Admin (Apenas se NÃO estiver em cooldown)
        setTimeout(() => {
          if (isCancelled || sessionStatus.isLocked || hasAnnouncedFarewellRef.current) return;
          
          if (isResumingRef.current) {
            const rawResume = pickRandomAvatarPhrase(
              settings.resumeMessage,
              DEFAULT_AVATAR_SETTINGS.resumeMessage || 'Olá novamente, {nome_aluno}! Vamos continuar de onde paramos!',
              lastResumePhraseRef.current
            );
            lastResumePhraseRef.current = rawResume;
            const resumeText = rawResume
              .replace(/\{nome_aluno\}/gi, studentName)
              .replace(/\{titulo_musica\}/gi, activeSongName || 'Magic English');
            speakText(resumeText, null, 'pt', null, null, {
              rawTemplate: rawResume,
              category: 'retomadas'
            });
          } else {
            const rawWelcome = pickRandomAvatarPhrase(
              settings.welcomeMessage,
              DEFAULT_AVATAR_SETTINGS.welcomeMessage
            );
            const welcomeText = rawWelcome
              .replace(/\{nome_aluno\}/gi, studentName)
              .replace(/\{titulo_musica\}/gi, activeSongName || 'Magic English');
            speakText(welcomeText, null, null, null, null, {
              rawTemplate: rawWelcome,
              category: 'saudacoes'
            });
          }
        }, 1200);

      } catch (err) {
        console.error('Falha ao inicializar TalkingHead:', err);
        setLoadingMessage(`Erro ao carregar avatar: ${err.message || err}`);
      }
    }

    initTalkingHead();

    return () => {
      isCancelled = true;
      if (headInstance) {
        try {
          headInstance.stopSpeaking();
          headInstance.stop();
          headInstance.dispose();
        } catch (_) {}
      }
      if (avatarContainerRef.current) {
        const remaining = avatarContainerRef.current.querySelectorAll('canvas');
        remaining.forEach((c) => c.remove());
      }
      headRef.current = null;
    };
  }, [sessionStatus.isLocked, settings.modelUrl, settings.teacherPresetId]);

  // 4. Função para o Avatar Falar (Drive-First + Cache Compartilhado + Composição de Cláusulas + Lipsync 3D)
  const speakText = async (
    text,
    directAudioUrl = null,
    explicitLang = null,
    bilingualPhraseEn = null,
    onFinished = null,
    messageMeta = null
  ) => {
    if (!text || !headRef.current) return;
    const head = headRef.current;

    // Detecta se a frase é predominantemente em Português ou Inglês
    const isPortuguese = explicitLang ? explicitLang === 'pt' : (
      /[áàâãéèêíïóôõöúçñ]/i.test(text) ||
      /\b(olá|vamos|muito|bem|treino|tempo|continuar|parabéns|praticar|você|hoje|quase|escutem|escute|repita|frase|inteira|aluno|novamente|que|bom|gostei|ótimo|ótima|pronta|pronto|maravilha|uau|estou|caminho|certo|não|descanse|excelente)\b/i.test(text)
    );
    const speechLang = isPortuguese ? 'pt' : 'en';
    const fullSpokenText = bilingualPhraseEn ? `${text} ${bilingualPhraseEn}` : text;

    try {
      setAvatarSpeaking(true);
      setSubtitles(fullSpokenText);

      if (head.audioCtx.state === 'suspended') {
        await head.audioCtx.resume();
      }

      let audioBuffer = null;

      // 4.1 REQUISITO CUSTO ZERO (Versos de Músicas ou URL direta do Google Drive):
      if (directAudioUrl) {
        try {
          const driveRes = await fetchDriveAudioArrayBuffer(directAudioUrl);
          if (driveRes.ok && driveRes.arrayBuffer) {
            audioBuffer = await head.audioCtx.decodeAudioData(driveRes.arrayBuffer.slice(0));
          } else {
            const res = await fetch(directAudioUrl);
            if (res.ok) {
              const arrayBuf = await res.arrayBuffer();
              audioBuffer = await head.audioCtx.decodeAudioData(arrayBuf);
            }
          }
        } catch (fetchErr) {
          console.warn('Falha ao reproduzir áudio direto do Google Drive:', fetchErr);
        }
      }

      // 4.2 REQUISITO CUSTO ZERO (Mensagens Dinâmicas da Professora Avatar — Catálogo Drive-First + Composição):
      if (!audioBuffer && !directAudioUrl && !bilingualPhraseEn) {
        try {
          const resolved = await avatarPracticeService.resolveStudentMessageAudioSegments({
            text,
            rawTemplate: messageMeta?.rawTemplate || null,
            category: messageMeta?.category || 'geral',
            studentName,
            songTitle: activeSongName || 'Magic English',
            userId: user?.id || 'guest',
            settings,
            explicitLang: speechLang
          });

          if (resolved?.segments && resolved.segments.length > 0) {
            const decodedBuffers = [];
            for (const seg of resolved.segments) {
              const audioArrayBuffer = base64ToArrayBuffer(seg.base64Audio);
              let sampleRate = 24000;
              const rateMatch = (seg.mimeType || '').match(/rate=(\d+)/);
              if (rateMatch) sampleRate = parseInt(rateMatch[1], 10);
              const decoded = await processAudioToBuffer(head.audioCtx, audioArrayBuffer, sampleRate);
              if (decoded) decodedBuffers.push(decoded);
            }
            if (decodedBuffers.length > 0) {
              audioBuffer = concatAudioBuffers(head.audioCtx, decodedBuffers, 0.04);
            }
          }
        } catch (resolveErr) {
          console.warn('Aviso na resolução Drive-First da mensagem da Avatar:', resolveErr);
        }
      }

      // 4.3 Fallback final para síntese direta caso nenhum buffer tenha sido obtido
      if (!audioBuffer) {
        let ttsResult = null;
        const activeTeacher = TEACHER_PRESETS.find(t => t.id === settings.teacherPresetId) 
          || TEACHER_PRESETS.find(t => t.modelUrl === settings.modelUrl) 
          || TEACHER_PRESETS[0];

        if (bilingualPhraseEn) {
          ttsResult = await requestAzureBilingualTTS(text, bilingualPhraseEn, null, {
            voicePt: activeTeacher.voicePt,
            voiceEn: activeTeacher.voiceEn
          });
        } else {
          const voiceOverride = speechLang === 'pt' ? activeTeacher.voicePt : activeTeacher.voiceEn;
          ttsResult = await requestAzureTTS(text, speechLang, null, voiceOverride);
        }

        const audioArrayBuffer = base64ToArrayBuffer(ttsResult.base64Audio);
        let sampleRate = 24000;
        const rateMatch = (ttsResult.mimeType || '').match(/rate=(\d+)/);
        if (rateMatch) sampleRate = parseInt(rateMatch[1], 10);

        audioBuffer = await processAudioToBuffer(head.audioCtx, audioArrayBuffer, sampleRate);
      }

      // Fator de velocidade configurado pelo Admin (0.85x a 1.50x)
      const speechSpeed = Math.min(Math.max(Number(settings.ttsSpeed) || 1.0, 0.85), 1.50);

      // Duração real do áudio em milissegundos
      const totalAudioDurationMs = (audioBuffer.duration || 1) * 1000;

      // Cálculo cirúrgico e robusto de palavras e durações para o TalkingHead
      // Garante que a boca do 3D NUNCA fique estática
      const words = fullSpokenText.trim().split(/\s+/).filter(Boolean);
      const totalChars = words.reduce((acc, w) => acc + Math.max(w.length, 1), 0);
      
      let currentTime = 0;
      const wtimes = [];
      const wdurations = [];

      words.forEach((word) => {
        const wordClean = word.replace(/[^\p{L}\p{N}'-]/gu, '') || word;
        const wordWeight = Math.max(wordClean.length, 1) / (totalChars || 1);
        const wordDuration = Math.max(wordWeight * totalAudioDurationMs, 80); // Mínimo de 80ms para disparar visema visível

        wtimes.push(Math.round(currentTime));
        wdurations.push(Math.round(wordDuration));
        currentTime += wordDuration;
      });

      // Disparar o áudio com a sincronia labial ativa no TalkingHead
      head.speakAudio(
        {
          audio: audioBuffer,
          words: words.map(w => w.replace(/[^\p{L}\p{N}'-]/gu, '') || w),
          wtimes: wtimes,
          wdurations: wdurations
        },
        {
          lipsyncLang: 'en'
        },
        (sub) => setSubtitles(sub)
      );

      head.speakMarker(() => {
        setAvatarSpeaking(false);
        setSubtitles('');
        if (typeof onFinished === 'function') {
          try { onFinished(); } catch (_) {}
        }
      });

    } catch (err) {
      console.warn('Síntese Azure temporariamente indisponível. Usando síntese local nativa (Web Speech API)...', err);
      
      // Fallback estrito no idioma correspondente (NUNCA usar voz inglesa para falar português!)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = isPortuguese ? 'pt-BR' : 'en-US';
        utterance.rate = Math.min(Math.max(Number(settings.ttsSpeed) || 1.0, 0.85), 1.50);

        const voices = window.speechSynthesis.getVoices();
        if (isPortuguese) {
          const ptVoice = voices.find(v => v.lang.startsWith('pt') || v.lang.includes('BR'));
          if (ptVoice) utterance.voice = ptVoice;
        } else {
          const enVoice = voices.find(v => v.lang.startsWith('en'));
          if (enVoice) utterance.voice = enVoice;
        }

        utterance.onend = () => {
          setAvatarSpeaking(false);
          setSubtitles('');
          if (typeof onFinished === 'function') {
            try { onFinished(); } catch (_) {}
          }
        };
        utterance.onerror = () => {
          setAvatarSpeaking(false);
          setSubtitles('');
          if (typeof onFinished === 'function') {
            try { onFinished(); } catch (_) {}
          }
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setAvatarSpeaking(false);
        if (typeof onFinished === 'function') {
          try { onFinished(); } catch (_) {}
        }
      }
    }
  };

  // 5. Reproduzir a Frase Atual (prioriza áudio já gerado do Google Drive)
  const handlePlayCurrentPhrase = () => {
    if (!currentPhrase) return;
    speakText(currentPhrase.english, currentPhrase.audioUrl, 'en');
  };

  // 6. Microfone e Reconhecimento de Voz (STT)
  const handleToggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz direto. Experimente o Google Chrome ou Microsoft Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setUserTranscript('');
      setFeedback(null);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserTranscript(transcript);
      evaluatePronunciation(transcript);
    };

    recognition.onerror = (event) => {
      console.warn('Erro no microfone:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // 7. Avaliação Rigorosa de Pronúncia da Frase (Word Coverage & Trava de Frase Incompleta)
  const evaluatePronunciation = (spokenText) => {
    if (!currentPhrase) return;

    // Chamada ao algoritmo estrito de cobertura
    const result = validateSpeech(spokenText, currentPhrase.english, settings.toleranceMode || 'medium');

    if (result.passed) {
      // SUCESSO!
      setFeedback({
        type: 'success',
        score: result.score,
        message: result.reason
      });

      // Gamificação e XP
      addXp(15, 'Prática com Professora Virtual');
      onGainXp(15);

      // Marca frase utilizada hoje
      avatarPracticeService.markPhraseUsedToday(user?.id, currentPhrase.id);
      setCompletedPhrasesCount((prev) => prev + 1);

      // Elogio carinhoso da professora (sorteio aleatório sem repetição imediata)
      const rawSuccess = pickRandomAvatarPhrase(
        settings.successMessage,
        DEFAULT_AVATAR_SETTINGS.successMessage,
        lastSuccessPhraseRef.current
      );
      lastSuccessPhraseRef.current = rawSuccess;

      // Substitui a tag APENAS se estiver presente na frase da janela do Admin
      const successSpeech = rawSuccess
        .replace(/\{nome_aluno\}/gi, studentName)
        .replace(/\{titulo_musica\}/gi, activeSongName || 'Magic English');
      speakText(successSpeech, null, null, null, null, {
        rawTemplate: rawSuccess,
        category: 'elogios'
      });

      // Avança para a próxima frase após breve pausa
      setTimeout(() => {
        handleNextPhrase();
      }, 3500);

    } else {
      // REPROVAÇÃO / TENTATIVA (Frase incompleta ou pronúncia imprecisa)
      const isPartial = result.reason?.includes('incompleta');
      
      setFeedback({
        type: 'retry',
        score: result.score,
        message: result.reason
      });

      if (isPartial) {
        // Encorajamento específico para frase incompleta (Custo Zero: PT do cache Drive-First + EN direto do Google Drive)
        speakText(
          PARTIAL_PHRASE_RETRY_MESSAGE,
          null,
          'pt',
          null,
          () => {
            setTimeout(() => {
              speakText(currentPhrase.english, currentPhrase.audioUrl, 'en');
            }, 400);
          },
          {
            rawTemplate: PARTIAL_PHRASE_RETRY_MESSAGE,
            category: 'encorajamentos'
          }
        );
      } else {
        const rawRetry = pickRandomAvatarPhrase(
          settings.retryMessage,
          DEFAULT_AVATAR_SETTINGS.retryMessage,
          lastRetryPhraseRef.current
        );
        lastRetryPhraseRef.current = rawRetry;

        const retrySpeech = rawRetry
          .replace(/\{nome_aluno\}/gi, studentName)
          .replace(/\{titulo_musica\}/gi, activeSongName || 'Magic English');
        
        // Encorajamento de erro (Custo Zero: PT do cache Drive-First + EN direto do Google Drive)
        speakText(
          retrySpeech,
          null,
          'pt',
          null,
          () => {
            setTimeout(() => {
              speakText(currentPhrase.english, currentPhrase.audioUrl, 'en');
            }, 400);
          },
          {
            rawTemplate: rawRetry,
            category: 'encorajamentos'
          }
        );
      }
    }
  };

  // 8. Avançar para a Próxima Frase, Concluir Módulo ou Acionar Trava de 24h
  const handleNextPhrase = () => {
    setFeedback(null);
    setUserTranscript('');
    if (currentPhraseIndex + 1 < phrasesQueue.length) {
      // Avança para a próxima frase da fila acumulada
      const nextIdx = currentPhraseIndex + 1;
      setCurrentPhraseIndex(nextIdx);
      avatarPracticeService.saveSessionProgress(user?.id, {
        currentPhraseIndex: nextIdx,
        activeRemainingSeconds: sessionStatus.timeRemainingSeconds
      });
    } else {
      // O ALUNO COMPLETOU TODAS AS FRASES DO REPERTÓRIO ACUMULADO!
      if (headRef.current) {
        try { headRef.current.stopSpeaking(); } catch (_) {}
      }
      // Se a trava diária (cooldown de 24h) estiver ligada no Admin:
      if (settings.cooldownEnabled) {
        // Reseta o ponteiro para 0 para que amanhã comece um novo ciclo do início
        avatarPracticeService.saveSessionProgress(user?.id, {
          currentPhraseIndex: 0,
          activeRemainingSeconds: 0
        });
        // Dispara o término oficial da sessão e aciona o bloqueio de 24h
        handleTimeFinished();
      } else {
        // Trava diária desligada: exibe a tela de comemoração com o botão de Estudar Novamente
        setIsModuleCompleted(true);
        avatarPracticeService.saveSessionProgress(user?.id, {
          currentPhraseIndex: 0,
          activeRemainingSeconds: sessionStatus.timeRemainingSeconds
        });
      }
    }
  };

  // Reiniciar módulo para estudar novamente (Custo Zero no Drive)
  const handleRestartModule = () => {
    setIsModuleCompleted(false);
    setCurrentPhraseIndex(0);
    setFeedback(null);
    setUserTranscript('');
    avatarPracticeService.saveSessionProgress(user?.id, {
      currentPhraseIndex: 0,
      activeRemainingSeconds: sessionStatus.timeRemainingSeconds
    });
  };

  // Formatar tempo em MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Formatar cooldown em Horas e Minutos
  const formatCooldown = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}min`;
  };

  // ==========================================
  // TELA DE BLOQUEIO / 24H COOLDOWN
  // ==========================================
  if (sessionStatus.isLocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[80vh] text-center max-w-xl mx-auto animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 shadow-xl shadow-purple-900/20">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>

        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-3">
          Missão Diária Concluída
        </span>

        <h2 className="text-2xl font-black text-white mb-2">
          Excelente treino de hoje, {studentName}!
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          {currentPhraseIndex >= phrasesQueue.length - 1
            ? `Incrível! Você dominou todas as ${phrasesQueue.length} frases do seu repertório acumulado hoje. Sua próxima prática estará liberada em:`
            : `Você completou seu tempo diário de prática ativa com a Professora Virtual. Seu progresso foi salvo exatamente de onde você parou. A próxima sessão estará liberada em:`}
        </p>

        <div className="px-6 py-4 rounded-2xl bg-[#121422] border border-purple-500/30 text-purple-300 font-mono text-2xl font-extrabold tracking-widest shadow-inner mb-6">
          {formatCooldown(sessionStatus.cooldownRemainingSeconds || 86400)}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Aproveite o tempo para revisar suas <strong className="text-slate-200">Magic Songs</strong> e ganhar mais XP!</span>
        </div>
      </div>
    );
  }

  // ==========================================
  // TELA DE MÓDULO CONCLUÍDO COM SUCESSO
  // ==========================================
  if (isModuleCompleted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[80vh] text-center max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-xl shadow-emerald-900/20">
          <Award className="w-10 h-10 animate-bounce" />
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3 flex items-center gap-1.5 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Módulo Concluído com Sucesso</span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
          Parabéns, {studentName}!
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-md">
          O seu módulo foi concluído com sucesso! Você praticou e fixou todas as <strong className="text-white font-bold">{phrasesQueue.length} frases</strong> de <span className="text-purple-300 font-semibold">{activeSongName || 'Magic English'}</span> com a Professora Virtual.
        </p>
        {/* Card de Resumo de Estatísticas */}
        <div className="w-full grid grid-cols-2 gap-3 mb-8">
          <div className="p-4 rounded-2xl bg-[#121422] border border-purple-500/20 text-center shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Frases Concluídas</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{phrasesQueue.length} / {phrasesQueue.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#121422] border border-purple-500/20 text-center shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Domínio do Repertório</p>
            <p className="text-2xl font-black text-purple-300 mt-1">100%</p>
          </div>
        </div>
        {/* Botão de Estudar Novamente */}
        <button
          type="button"
          onClick={handleRestartModule}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-purple-600/30 hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-3"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Estudar Novamente com a Avatar</span>
        </button>
        <p className="text-xs text-slate-500 mt-4">
          Áudios gravados no Drive disponíveis para treino ilimitado.
        </p>
      </div>
    );
  }

  // ==========================================
  // TELA PRINCIPAL DE CONVERSAÇÃO COM O AVATAR
  // ==========================================
  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Barra de Topo: Título, Música Ativa, Cronômetro e XP */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0e111d] border border-purple-500/20 rounded-2xl p-4 md:px-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-[2px] shadow-md shadow-purple-600/30 flex-shrink-0">
            <div className="w-full h-full bg-[#0c0e17] rounded-[9px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black text-white tracking-tight">
                Pratique seu Inglês
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Professora IA 3D
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Repertório fixado da música: <span className="text-purple-300 font-bold">{activeSongName || 'Repertório do Curso'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Cronômetro Regressivo Diário */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141829] border border-cyan-500/30 text-cyan-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-400/80 leading-none">Tempo Diário</p>
              <p className="text-xs font-mono font-extrabold">{formatTime(sessionStatus.timeRemainingSeconds)}</p>
            </div>
          </div>

          {/* Contador de Frases Concluídas */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141829] border border-amber-500/30 text-amber-300">
            <Flame className="w-4 h-4 text-amber-400" />
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-400/80 leading-none">Dominadas</p>
              <p className="text-xs font-mono font-extrabold">{completedPhrasesCount} frases</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Principal: Palco 3D do Avatar + Painel Interativo de Conversação */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Coluna 1: Palco 3D da Avatar com Trava Rígida Anti-Loop de Resize */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div 
            className="relative w-full rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl flex items-center justify-center bg-[#0b0d18]"
            style={{
              height: '540px',
              maxHeight: '540px',
              minHeight: '540px',
              backgroundImage: `url(${settings.backgroundUrl || (THEME_PRESETS.find(t => t.id === settings.backgroundTheme)?.url || THEME_PRESETS[0].url)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              overflow: 'hidden' // IMPRESCINDÍVEL: trava o loop de resize do Three.js
            }}
          >
            {/* Camada de Blur Suave do Fundo e Overlay Escuro */}
            <div 
              className="absolute inset-0 pointer-events-none bg-black/40"
              style={{
                backdropFilter: (settings.backgroundBlur || 0) > 0 ? `blur(${settings.backgroundBlur}px)` : 'none',
                WebkitBackdropFilter: (settings.backgroundBlur || 0) > 0 ? `blur(${settings.backgroundBlur}px)` : 'none'
              }}
            />

            {/* Container Real do Canvas 3D do TalkingHead */}
            <div 
              ref={avatarContainerRef} 
              className="w-full h-full absolute inset-0 [&>canvas]:!w-full [&>canvas]:!h-full [&>canvas]:!block [&>canvas]:!absolute [&>canvas]:!inset-0"
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                inset: 0,
                overflow: 'hidden'
              }}
            >
              {/* Loading Overlay */}
              {(!isAvatarReady || isLoading) && (
                <div className="absolute inset-0 bg-[#0b0d18]/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-purple-200">{loadingMessage}</p>
                  <p className="text-xs text-slate-400">Preparando WebGL e áudio neural...</p>
                </div>
              )}
            </div>
          </div>

          {/* Barra Inferior do Palco: Legendas em Tempo Real */}
          <div className="bg-[#121526]/90 backdrop-blur-md border border-purple-500/30 rounded-2xl p-3 text-center min-h-[50px] flex items-center justify-center shadow-lg">
            {avatarSpeaking ? (
              <div className="flex items-center gap-2 text-purple-200 text-sm font-medium animate-pulse">
                <Volume2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>"{subtitles || 'Falando...'}"</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                A Professora está pronta. Ouça a frase e clique no microfone para responder.
              </p>
            )}
          </div>
        </div>

        {/* Coluna 2: Card de Prática, Frase Atual e Microfone */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          {/* Card da Frase Alvo */}
          <div className="bg-[#0e111d] border border-purple-500/20 rounded-3xl p-6 flex flex-col justify-between flex-1 shadow-xl space-y-6">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
                  Frase de Fixação {currentPhraseIndex + 1} de {phrasesQueue.length || 1}
                </span>
                
                <button
                  type="button"
                  onClick={handlePlayCurrentPhrase}
                  disabled={avatarSpeaking || !isAvatarReady}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                  title="Ouvir Professora Novamente"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Ouvir</span>
                </button>
              </div>

              {/* Frase em Inglês */}
              <div className="p-4 rounded-2xl bg-[#141829] border border-purple-500/20 space-y-2">
                <p className="text-lg md:text-xl font-black text-white leading-snug">
                  {currentPhrase?.english || 'Carregando frases da sua aula...'}
                </p>
                {currentPhrase?.portuguese && (
                  <p className="text-xs text-purple-300/80 font-medium italic">
                    "{currentPhrase.portuguese}"
                  </p>
                )}
              </div>

              {/* Feedback da Fala do Aluno */}
              {userTranscript && (
                <div className="p-3 rounded-xl bg-[#101322] border border-slate-700/40 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Você falou:</p>
                  <p className="text-sm font-semibold text-slate-200">"{userTranscript}"</p>
                </div>
              )}

              {/* Card de Resultado da Avaliação */}
              {feedback && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in duration-200 ${
                  feedback.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <p className="text-xs font-black uppercase tracking-wide">
                      {feedback.type === 'success' ? 'Pronúncia Aprovada (+15 XP)' : 'Tente Novamente'}
                    </p>
                    <p className="text-xs leading-relaxed opacity-90">{feedback.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Ação Principal: Botão de Microfone */}
            <div className="space-y-3 pt-4 border-t border-purple-500/10">
              <button
                type="button"
                onClick={handleToggleListening}
                disabled={avatarSpeaking || !isAvatarReady}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-3 transition-all shadow-xl cursor-pointer disabled:opacity-40 ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-red-600/40'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/40 hover:scale-[1.01]'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5 animate-bounce" />
                    <span>Ouvindo sua voz... Clique para Concluir</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>Pressione para Repetir a Frase</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Clique no microfone e fale claramente</span>
                <button
                  type="button"
                  onClick={handleNextPhrase}
                  className="text-purple-400 hover:text-purple-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Pular Frase</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
