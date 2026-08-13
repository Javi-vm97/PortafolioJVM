/**
 * Javier IA - Voice Widget
 *
 * Self-contained voice agent for the portfolio.
 *  - Uses Web Speech API (free, native browser) for speech-to-text and text-to-speech.
 *  - Calls /api/chat (Netlify Function) for the AI brain (Gemini 2.0 Flash).
 *  - Bilingual ES/EN with automatic detection: starts in Spanish, switches based on
 *    the model's response language each turn.
 *  - Stack-positioned above the WhatsApp FAB.
 *
 * The widget injects its own DOM and styles itself via voice-widget.css.
 */
(function () {
    'use strict';

    // ----- Browser support -----
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const synth = window.speechSynthesis;
    const SUPPORTED = !!(SpeechRecognition && synth);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    // ----- State -----
    let panel = null;
    let isOpen = false;
    let recognition = null;
    let isCallActive = false;
    let isListening = false;
    let isMuted = false;
    let isSpeaking = false;         // TRUE mientras el TTS este reproduciendo
    let lastBotReply = '';          // Ultima respuesta hablada por el bot (para deteccion de eco)
    let currentLang = 'es-MX';     // 'es-MX' or 'en-US'
    let history = [];               // [{role: 'user'|'assistant', content: string}]

    // Tiempo de asentamiento despues de TTS antes de reactivar mic (evita capturar la cola del audio)
    const TTS_SETTLE_MS = 700;
    let voicesES = null;
    let voicesEN = null;
    let chosenVoiceES = null;
    let chosenVoiceEN = null;
    let activeUtterance = null;

    const SPANISH_HINTS = ['el', 'la', 'que', 'de', 'en', 'y', 'es', 'por', 'con', 'te', 'un', 'una', 'los', 'las', 'mi', 'tu', 'su', 'no', 'sí', 'me', 'le', 'lo', 'se', 'al', 'del', 'cómo', 'qué', 'dónde', 'cuándo', 'para', 'pero', 'hola'];
    const ENGLISH_HINTS = ['the', 'and', 'is', 'you', 'to', 'for', 'with', 'are', 'have', 'this', 'that', 'will', 'from', 'your', 'can', 'be', 'we', 'they', 'how', 'what', 'where', 'when', 'why', 'who', 'hello', 'hi'];

    function detectLang(text) {
        if (!text || typeof text !== 'string') return currentLang;
        const tokens = text.toLowerCase().replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean);
        let es = 0, en = 0;
        for (const t of tokens) {
            if (SPANISH_HINTS.includes(t)) es++;
            if (ENGLISH_HINTS.includes(t)) en++;
        }
        if (es === en) return currentLang;
        return es > en ? 'es-MX' : 'en-US';
    }

    function loadVoices() {
        const voices = synth.getVoices();
        if (!voices.length) return;

        voicesES = voices.filter(v => v.lang.startsWith('es'));
        voicesEN = voices.filter(v => v.lang.startsWith('en'));

        // Lista PRIORIZADA de voces MASCULINAS (Windows + iOS/macOS + Android + Google)
        const malePrefsES = [
            // Windows Microsoft Natural voices (masculinas verificadas)
            'Microsoft Jorge Online (Natural)',
            'Microsoft Alvaro Online (Natural)',
            'Microsoft Pablo Online (Natural)',
            'Microsoft Dario Online (Natural)',
            // iOS / macOS (masculinas nativas)
            'Diego',      // es-AR/es-MX masculino
            'Jorge',      // es-ES masculino
            'Juan',       // es-MX masculino
            // Google / Android
            'Google español de Estados Unidos',
            'Google español',
            'es-ES-Standard-B',
            'es-US-Standard-B'
        ];
        const malePrefsEN = [
            'Microsoft Guy Online (Natural)',
            'Microsoft Davis Online (Natural)',
            'Microsoft Tony Online (Natural)',
            'Microsoft Brandon Online (Natural)',
            'Alex',       // US male (macOS/iOS)
            'Daniel',     // UK male
            'Fred',       // US male
            'Aaron',      // US male
            'Arthur',     // UK male
            'Tom',        // US male
            'Google US English'
        ];

        // Buscar priorizado (match exacto primero, luego substring)
        chosenVoiceES = malePrefsES
            .map(n => voicesES.find(v => v.name === n) || voicesES.find(v => v.name.includes(n)))
            .find(Boolean);
        chosenVoiceEN = malePrefsEN
            .map(n => voicesEN.find(v => v.name === n) || voicesEN.find(v => v.name.includes(n)))
            .find(Boolean);

        // Fallback anti-femenino: si no encontramos voz masculina, evita las femeninas conocidas
        const femaleTokensES = ['paulina', 'monica', 'lupe', 'dalia', 'esperanza', 'carmen', 'maria', 'lucia', 'sabina'];
        const femaleTokensEN = ['samantha', 'karen', 'victoria', 'veena', 'zira', 'jessa', 'aria', 'jane', 'mia', 'nora', 'nova', 'susan', 'kate', 'moira', 'fiona', 'tessa'];

        if (!chosenVoiceES) {
            chosenVoiceES = voicesES.find(v => !femaleTokensES.some(t => v.name.toLowerCase().includes(t))) || voicesES[0];
        }
        if (!chosenVoiceEN) {
            chosenVoiceEN = voicesEN.find(v => !femaleTokensEN.some(t => v.name.toLowerCase().includes(t))) || voicesEN[0];
        }

        // Debug: agrega ?debug=voice a la URL para ver que voz se selecciono
        if (window.location.search.includes('debug=voice')) {
            console.log('[Javier IA] ES voices disponibles:', voicesES.map(v => `${v.name} (${v.lang})`));
            console.log('[Javier IA] EN voices disponibles:', voicesEN.map(v => `${v.name} (${v.lang})`));
            console.log('[Javier IA] Voz ES elegida:', chosenVoiceES?.name);
            console.log('[Javier IA] Voz EN elegida:', chosenVoiceEN?.name);
        }
    }

    function getVoiceForLang(lang) {
        return lang.startsWith('es') ? chosenVoiceES : chosenVoiceEN;
    }

    // ===== DOM creation =====
    function createWidget() {
        if (document.getElementById('javi-fab-container')) return;

        const container = document.createElement('div');
        container.id = 'javi-fab-container';
        container.className = 'javi-fab-container';
        container.innerHTML = `
<button class="javi-fab" id="javi-fab" aria-label="Habla con Javier IA" type="button">
    <span class="javi-fab__pulse"></span>
    <span class="javi-fab__pulse javi-fab__pulse--delay"></span>
    <svg class="javi-fab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
    <span class="javi-fab__label" id="javi-fab-label">Habla con Javier IA</span>
</button>

<div class="javi-panel" id="javi-panel" role="dialog" aria-hidden="true" aria-label="Asistente Javier IA">
    <div class="javi-panel__border"></div>
    <div class="javi-panel__header">
        <div class="javi-panel__avatar">
            <span class="javi-panel__avatar-ring"></span>
            <span class="javi-panel__avatar-core">J</span>
        </div>
        <div class="javi-panel__heading">
            <h3 class="javi-panel__title">Javier IA</h3>
            <span class="javi-panel__subtitle"><span class="javi-status-dot"></span> En línea</span>
        </div>
        <button class="javi-lang-toggle" id="javi-lang-toggle" type="button" aria-label="Idioma del asistente">
            <span class="javi-lang-toggle__current">ES</span>
            <span class="javi-lang-toggle__divider">/</span>
            <span class="javi-lang-toggle__other">EN</span>
        </button>
        <button class="javi-panel__close" id="javi-close" type="button" aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
    </div>

    <div class="javi-panel__stage" id="javi-stage">
        <div class="javi-stage__intro" id="javi-intro">
            <div class="javi-orb javi-orb--idle">
                <span class="javi-orb__halo"></span>
                <span class="javi-orb__ring javi-orb__ring--1"></span>
                <span class="javi-orb__ring javi-orb__ring--2"></span>
                <span class="javi-orb__ring javi-orb__ring--3"></span>
                <span class="javi-orb__core">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    </svg>
                </span>
            </div>
            <p class="javi-intro__text">Hola, soy <strong>Javier IA</strong>. Pregúntame por la experiencia, el stack o la disponibilidad profesional de Javier.</p>
            <button class="javi-btn javi-btn--primary" id="javi-start" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;margin-right:0.5rem;">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                </svg>
                Iniciar conversación
            </button>
            <p class="javi-intro__hint">Se necesita acceso a tu micrófono</p>
            <p class="javi-intro__hint javi-intro__hint--ios" id="javi-ios-tip" hidden>💡 <strong>iPhone / iPad</strong>: quita el modo silencio (interruptor lateral) para escuchar la voz.</p>
        </div>

        <div class="javi-stage__call" id="javi-call" hidden>
            <div class="javi-orb javi-orb--active" id="javi-orb-active">
                <span class="javi-orb__halo"></span>
                <span class="javi-orb__ring javi-orb__ring--1"></span>
                <span class="javi-orb__ring javi-orb__ring--2"></span>
                <span class="javi-orb__ring javi-orb__ring--3"></span>
                <span class="javi-orb__core">
                    <span class="javi-wave">
                        <span></span><span></span><span></span><span></span><span></span>
                    </span>
                </span>
            </div>
            <p class="javi-status" id="javi-status">Escuchando…</p>
            <div class="javi-transcript" id="javi-transcript"></div>
            <div class="javi-controls">
                <button class="javi-ctrl" id="javi-mute" type="button" aria-label="Silenciar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    </svg>
                    <span>Silencio</span>
                </button>
                <button class="javi-ctrl javi-ctrl--danger" id="javi-end" type="button" aria-label="Terminar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;">
                        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
                        <line x1="23" y1="1" x2="1" y2="23"/>
                    </svg>
                    <span>Terminar</span>
                </button>
            </div>
        </div>

        <div class="javi-stage__error" id="javi-error" hidden>
            <p class="javi-error__title">Voz no disponible</p>
            <p class="javi-error__msg">Tu navegador no soporta voz en vivo. Usa Chrome o Edge en computador, o contáctame por otros canales desde la sección de contacto.</p>
        </div>
    </div>

    <div class="javi-panel__footer">
        <span>Web Speech · Gemini</span>
        <a href="#contacto">Contactar a Javier</a>
    </div>
</div>
        `;
        document.body.appendChild(container);
        panel = container;

        // Wire events
        document.getElementById('javi-fab').addEventListener('click', open);
        document.getElementById('javi-close').addEventListener('click', close);
        document.getElementById('javi-start').addEventListener('click', startCall);
        document.getElementById('javi-mute').addEventListener('click', toggleMute);
        document.getElementById('javi-end').addEventListener('click', endCall);
        document.getElementById('javi-lang-toggle').addEventListener('click', cycleLanguage);

        if (!SUPPORTED) {
            showError();
        }
    }

    // ===== UI helpers =====
    function open() {
        // Auto-close + hide the WhatsApp widget (FAB included)
        const wa = document.getElementById('waWidget');
        if (wa) {
            wa.classList.remove('open');
            wa.classList.add('wa-widget--hidden');
        }

        document.getElementById('javi-panel').classList.add('javi-panel--open');
        document.getElementById('javi-panel').setAttribute('aria-hidden', 'false');
        isOpen = true;
        if (synth) loadVoices();
    }

    function close() {
        document.getElementById('javi-panel').classList.remove('javi-panel--open');
        document.getElementById('javi-panel').setAttribute('aria-hidden', 'true');
        // Bring back the WhatsApp widget
        const wa = document.getElementById('waWidget');
        if (wa) wa.classList.remove('wa-widget--hidden');
        isOpen = false;
        if (isCallActive) endCall();
    }

    function showError() {
        document.getElementById('javi-intro').hidden = true;
        document.getElementById('javi-call').hidden = true;
        document.getElementById('javi-error').hidden = false;
    }

    function setStatus(text) {
        const el = document.getElementById('javi-status');
        if (el) el.textContent = text;
    }

    function setOrbState(state) {
        const orb = document.getElementById('javi-orb-active');
        if (!orb) return;
        orb.classList.remove('javi-orb--listening', 'javi-orb--thinking', 'javi-orb--speaking');
        if (state) orb.classList.add('javi-orb--' + state);
    }

    function addTranscript(role, text) {
        const wrap = document.getElementById('javi-transcript');
        if (!wrap) return null;
        const line = document.createElement('div');
        line.className = 'javi-line javi-line--' + role;
        const bubble = document.createElement('div');
        bubble.className = 'javi-bubble';
        bubble.textContent = text;
        line.appendChild(bubble);
        wrap.appendChild(line);
        wrap.scrollTop = wrap.scrollHeight;
        return bubble;
    }

    function updateLangBadge() {
        const t = document.getElementById('javi-lang-toggle');
        if (!t) return;
        const isES = currentLang.startsWith('es');
        t.querySelector('.javi-lang-toggle__current').textContent = isES ? 'ES' : 'EN';
        t.querySelector('.javi-lang-toggle__other').textContent = isES ? 'EN' : 'ES';
    }

    function cycleLanguage() {
        currentLang = currentLang.startsWith('es') ? 'en-US' : 'es-MX';
        updateLangBadge();
        if (recognition) recognition.lang = currentLang;
    }

    // ===== Call lifecycle =====
    // IMPORTANTE: NO uses `async` aqui. iOS Safari requiere que synth.speak()
    // ocurra dentro del user-gesture chain sincronico del click. Si hacemos
    // `await` antes de speak, iOS "pierde" el gesto y silencia el TTS.
    function startCall() {
        if (!SUPPORTED) { showError(); return; }

        document.getElementById('javi-intro').hidden = true;
        document.getElementById('javi-call').hidden = false;

        // Warm-up de SpeechSynthesis para iOS Safari:
        // Prime el audio engine con un utterance silencioso dentro del gesto del usuario.
        // Sin esto, iOS a veces no reproduce el primer speak() correctamente.
        if (synth) {
            try {
                if (synth.paused) synth.resume();
                const warmup = new SpeechSynthesisUtterance(' ');
                warmup.volume = 0;
                warmup.rate = 10;
                synth.speak(warmup);
            } catch (e) { /* ignore */ }
        }

        isCallActive = true;
        history = [];

        // Saludo SINCRONICAMENTE dentro del gesto -- garantiza reproducibilidad en iOS.
        const greet = "Hola, soy Javier IA. Puedes preguntarme por la experiencia, las competencias o la disponibilidad profesional de Javier.";
        addTranscript('bot', greet);
        speak(greet, () => {
            // Despues del saludo, pedir mic (getUserMedia es async, ya salio del gesto).
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    if (isCallActive && !isMuted) startListening();
                })
                .catch(() => {
                    setStatus(currentLang.startsWith('es')
                        ? 'Sin permiso de micrófono'
                        : 'Microphone permission needed');
                });
        });
    }

    function endCall() {
        isCallActive = false;
        stopListening();
        if (synth) synth.cancel();
        isSpeaking = false;
        lastBotReply = '';
        // Reset UI
        document.getElementById('javi-call').hidden = true;
        document.getElementById('javi-intro').hidden = false;
        const tr = document.getElementById('javi-transcript');
        if (tr) tr.innerHTML = '';
        setOrbState(null);
        history = [];
    }

    function toggleMute() {
        isMuted = !isMuted;
        const btn = document.getElementById('javi-mute');
        if (btn) btn.classList.toggle('javi-ctrl--active', isMuted);
        if (isMuted) {
            stopListening();
            setStatus('Micrófono en silencio');
        } else if (isCallActive) {
            startListening();
        }
    }

    // ===== Speech recognition =====
    function startListening() {
        if (!isCallActive || isMuted) return;
        if (isListening) return;

        recognition = new SpeechRecognition();
        recognition.lang = currentLang;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isListening = true;
            setOrbState('listening');
            setStatus(currentLang.startsWith('es') ? 'Escuchando…' : 'Listening…');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            if (!transcript) return;

            // Defensa 1: si el TTS esta reproduciendo, esto es eco -- ignorar
            if (isSpeaking) {
                console.warn('[Javier IA] Ignorado (TTS activo):', transcript);
                if (isCallActive && !isMuted) setTimeout(startListening, 200);
                return;
            }

            // Defensa 3: patron de eco -- lo transcrito coincide con lo que dijo el bot
            if (isTtsEcho(transcript)) {
                console.warn('[Javier IA] Ignorado (eco TTS detectado):', transcript);
                if (isCallActive && !isMuted) setTimeout(startListening, 300);
                return;
            }

            handleUserMessage(transcript);
        };

        recognition.onerror = (event) => {
            const isES = currentLang.startsWith('es');
            console.error('[Javier IA] Recognition error:', event.error, event.message || '');

            if (event.error === 'no-speech') {
                // No detecto voz -- reintenta silenciosamente
                if (isCallActive && !isMuted) setTimeout(startListening, isIOS ? 800 : 300);
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setStatus(isES ? 'Permiso de microfono denegado' : 'Microphone permission denied');
                endCall();
            } else if (event.error === 'audio-capture') {
                setStatus(isES ? 'No se detecta microfono' : 'Microphone not detected');
                if (isCallActive && !isMuted) setTimeout(startListening, 1200);
            } else if (event.error === 'network') {
                setStatus(isES ? 'Sin red para reconocer voz' : 'Network error');
                if (isCallActive && !isMuted) setTimeout(startListening, 1500);
            } else if (event.error === 'aborted') {
                // Se cancelo intencionalmente, no reiniciar aqui
            } else {
                setStatus((isES ? 'Error de voz: ' : 'Voice error: ') + event.error);
                if (isCallActive && !isMuted) setTimeout(startListening, isIOS ? 1500 : 800);
            }
        };

        recognition.onend = () => {
            isListening = false;
            // If still in call and not muted, restart unless we are now thinking/speaking
            // (handled by handleUserMessage flow)
        };

        try {
            recognition.start();
        } catch (e) {
            // "already running" u otro error de estado en iOS -- reintenta con delay
            console.warn('[Javier IA] recognition.start() throw:', e.message);
            if (isCallActive && !isMuted) {
                setTimeout(() => { try { recognition.start(); } catch (_) {} }, 500);
            }
        }
    }

    function stopListening() {
        if (recognition) {
            try { recognition.abort(); } catch (e) {}
        }
        isListening = false;
    }

    // ===== Main flow =====
    function handleUserMessage(text) {
        stopListening();
        addTranscript('user', text);
        history.push({ role: 'user', content: text });

        // Update lang detection from user's actual input
        const detected = detectLang(text);
        if (detected !== currentLang) {
            currentLang = detected;
            updateLangBadge();
        }

        setOrbState('thinking');
        setStatus(currentLang.startsWith('es') ? 'Pensando…' : 'Thinking…');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                history: history.slice(-18)
            }),
            signal: controller.signal
        })
        .then(r => {
            clearTimeout(timeoutId);
            if (!r.ok) {
                return r.text().then(body => {
                    throw new Error('HTTP ' + r.status + ' ' + body.slice(0, 200));
                });
            }
            return r.json();
        })
        .then(data => {
            const reply = data.message || (currentLang.startsWith('es')
                ? 'Disculpa, no pude procesar eso. ¿Puedes repetirlo?'
                : 'Sorry, I could not process that. Could you repeat?');

            history.push({ role: 'assistant', content: reply });

            const replyLang = detectLang(reply);
            if (replyLang !== currentLang) {
                currentLang = replyLang;
                updateLangBadge();
            }

            addTranscript('bot', reply);
            speak(reply, () => {
                if (isCallActive && !isMuted) startListening();
            });
        })
        .catch(err => {
            clearTimeout(timeoutId);
            const isTimeout = err.name === 'AbortError';
            const isNetwork = err.message && err.message.toLowerCase().includes('failed to fetch');
            console.error('[Javier IA] chat failed:', {
                name: err.name,
                message: err.message,
                isTimeout,
                isNetwork
            });
            let fallback;
            if (isTimeout) {
                fallback = currentLang.startsWith('es')
                    ? 'La respuesta esta tardando demasiado. Intenta de nuevo o contactame por WhatsApp.'
                    : 'The response is taking too long. Try again or contact me via WhatsApp.';
            } else if (isNetwork) {
                fallback = currentLang.startsWith('es')
                    ? 'No pude conectar. Verifica tu conexion o desactiva bloqueadores de anuncios.'
                    : 'Could not connect. Check your network or disable ad blockers.';
            } else {
                fallback = currentLang.startsWith('es')
                    ? 'Hubo un problema. Por favor intenta de nuevo, o contactame por WhatsApp.'
                    : 'There was an issue. Please try again, or contact me via WhatsApp.';
            }
            addTranscript('bot', fallback);
            speak(fallback, () => {
                if (isCallActive && !isMuted) startListening();
            });
        });
    }

    // ===== Speech synthesis =====
    function speak(text, onDone) {
        if (!synth) { if (onDone) onDone(); return; }
        if (synth.speaking) synth.cancel();

        // Defensa 1: parar cualquier escucha activa mientras hablamos
        stopListening();
        isSpeaking = true;
        lastBotReply = String(text || '').toLowerCase();

        // Pick voice
        if (!chosenVoiceES || !chosenVoiceEN) loadVoices();
        const voice = getVoiceForLang(currentLang);

        const utter = new SpeechSynthesisUtterance(cleanForTTS(text));
        if (voice) utter.voice = voice;
        utter.lang = currentLang;
        utter.rate = 1.02;
        utter.pitch = 1.0;
        utter.volume = 1.0;

        setOrbState('speaking');
        setStatus(currentLang.startsWith('es') ? 'Hablando…' : 'Speaking…');

        const finish = () => {
            setOrbState(null);
            // Defensa 2: delay de asentamiento antes de reactivar el mic
            // (evita que el mic capture la cola del audio TTS)
            setTimeout(() => {
                isSpeaking = false;
                if (onDone) onDone();
            }, TTS_SETTLE_MS);
        };

        utter.onend = finish;
        utter.onerror = finish;

        activeUtterance = utter;
        synth.speak(utter);
    }

    // Defensa 3: deteccion de eco -- si lo transcrito es un fragmento significativo
    // de lo que el bot acaba de decir, es TTS captado por el mic y se debe ignorar.
    function isTtsEcho(userTranscript) {
        if (!userTranscript || !lastBotReply || userTranscript.length < 4) return false;
        const clean = (s) => s.toLowerCase().replace(/[^\p{L}\s]/gu, '').trim();
        const u = clean(userTranscript);
        const b = clean(lastBotReply);
        if (!u || !b) return false;

        // Match directo: el transcript esta contenido en la respuesta del bot
        if (u.length >= 4 && b.includes(u)) return true;

        // Match fuzzy: al menos 60% de las palabras del transcript aparecen en la respuesta bot
        const userWords = u.split(/\s+/).filter(w => w.length > 2);
        if (userWords.length < 2) return false;
        const matched = userWords.filter(w => b.includes(w)).length;
        return (matched / userWords.length) >= 0.6;
    }

    function cleanForTTS(text) {
        return String(text || '')
            .replace(/[*_`~#>]/g, '')
            .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
            .replace(/—/g, ',')
            .trim();
    }

    // ===== Init =====
    function init() {
        createWidget();
        updateLangBadge();
        if (synth) {
            synth.addEventListener('voiceschanged', loadVoices);
            loadVoices();
        }
        // Mostrar el tip de iOS (silent switch) solo si estamos en iPhone/iPad
        if (isIOS) {
            const iosTip = document.getElementById('javi-ios-tip');
            if (iosTip) iosTip.hidden = false;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
