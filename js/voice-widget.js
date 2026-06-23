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

    // ----- State -----
    let panel = null;
    let isOpen = false;
    let recognition = null;
    let isCallActive = false;
    let isListening = false;
    let isMuted = false;
    let currentLang = 'es-MX';     // 'es-MX' or 'en-US'
    let history = [];               // [{role: 'user'|'assistant', content: string}]
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

        // Prefer "natural" / "neural" / known male voices
        const malePrefsES = ['Microsoft Jorge Online (Natural)', 'Microsoft Dalia Online (Natural)', 'Google español', 'Jorge', 'Diego', 'Paulina'];
        const malePrefsEN = ['Microsoft Guy Online (Natural)', 'Microsoft Davis Online (Natural)', 'Daniel', 'Alex', 'Google US English'];

        chosenVoiceES = malePrefsES.map(n => voicesES.find(v => v.name.includes(n))).find(Boolean) || voicesES[0] || null;
        chosenVoiceEN = malePrefsEN.map(n => voicesEN.find(v => v.name.includes(n))).find(Boolean) || voicesEN[0] || null;
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
            <p class="javi-intro__text">Hola, soy <strong>Javier IA</strong>. Háblame en <strong>español</strong> o <strong>inglés</strong> y te respondo igual.</p>
            <button class="javi-btn javi-btn--primary" id="javi-start" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;margin-right:0.5rem;">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                </svg>
                Iniciar conversación
            </button>
            <p class="javi-intro__hint">Se necesita acceso a tu micrófono</p>
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
        <a href="#booking">Agendar llamada con Javier</a>
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
    async function startCall() {
        if (!SUPPORTED) { showError(); return; }

        document.getElementById('javi-intro').hidden = true;
        document.getElementById('javi-call').hidden = false;

        try {
            // Request mic permission proactively
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
            setStatus('Sin permiso de micrófono');
            return;
        }

        isCallActive = true;
        history = [];

        // Greet
        const greet = "Hola, soy Javier IA. ¿En qué puedo ayudarte hoy?";
        addTranscript('bot', greet);
        speak(greet, () => {
            if (isCallActive && !isMuted) startListening();
        });
    }

    function endCall() {
        isCallActive = false;
        stopListening();
        if (synth) synth.cancel();
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
            if (transcript) handleUserMessage(transcript);
        };

        recognition.onerror = (event) => {
            if (event.error === 'no-speech') {
                // restart silently
                if (isCallActive && !isMuted) setTimeout(startListening, 300);
            } else if (event.error === 'not-allowed') {
                setStatus('Sin permiso de micrófono');
                endCall();
            } else {
                setStatus('Error: ' + event.error);
                if (isCallActive && !isMuted) setTimeout(startListening, 800);
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
            // already running; ignore
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

        fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                history: history.slice(-18)
            })
        })
        .then(r => {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(data => {
            const reply = data.message || (currentLang.startsWith('es')
                ? 'Disculpa, no pude procesar eso. ¿Puedes repetirlo?'
                : 'Sorry, I could not process that. Could you repeat?');

            history.push({ role: 'assistant', content: reply });

            // Detect lang of model's reply (might have switched)
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
            console.error('[Javier IA] chat failed', err);
            const fallback = currentLang.startsWith('es')
                ? 'Estoy teniendo problemas de conexión. Por favor inténtalo de nuevo, o contáctame por WhatsApp.'
                : 'I am having connection issues. Please try again, or contact me via WhatsApp.';
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

        utter.onend = () => {
            setOrbState(null);
            if (onDone) onDone();
        };
        utter.onerror = () => {
            setOrbState(null);
            if (onDone) onDone();
        };

        activeUtterance = utter;
        synth.speak(utter);
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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
