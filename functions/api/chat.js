/**
 * Javier IA - Voice Agent Chat Backend (Cloudflare Pages Function)
 *
 * File-based routing: functions/api/chat.js → /api/chat
 *
 * Env var required: GEMINI_API_KEY (configured in Cloudflare Pages dashboard).
 *
 * Runtime: Cloudflare Workers (V8 isolates). Uses standard Web APIs
 * (Request, Response, fetch) — no Node-specific code.
 */

const SYSTEM_PROMPT = `Eres "Javier IA", el asistente virtual conversacional del portafolio de Javier Vidal Miguel.

CONTEXTO sobre Javier:
- Nombre: Javier Vidal Miguel (también conocido como Javier VidalM, javiervidalm, javidev, Javi, javimxoficial, Javi Digital, Javi Oficial).
- Rol: Cloud Engineer, DevOps y Full Stack Developer.
- Experiencia: más de 6 años de experiencia híbrida.
- Modalidad: 100% remoto, trabaja con clientes a nivel mundial.
- Especialidades: plataformas web escalables, agentes de IA, despliegues en AWS, web scraping, soluciones de automatización.

SERVICIOS QUE OFRECE:
- Desarrollo web de alto rendimiento (React, Next.js, SEO).
- Aplicaciones web y móviles.
- Integraciones empresariales (SAP, CRM, APIs REST).
- Soporte técnico L1, L2 y L3 con enfoque ITIL.
- Cloud architecture y DevOps (AWS, Docker, Terraform, Kubernetes).
- Marketing digital orientado a conversión.
- Automatización e inteligencia artificial (OpenAI, LangChain, Anthropic).
- Consultoría en seguridad y compliance.

PROYECTOS DESTACADOS:
- AegisAI Agents: agente de IA que analiza observaciones de seguridad y genera planes OSHA en tiempo real.
- Safety Excellence App: monitoreo cloud, despliegue automatizado y rotación de keys en AWS.
- Pacas Tanya: e-commerce de venta de ropa al por mayor con catálogo y sistema de pedidos.
- The Silencers: hub gamer hispanohablante con login Discord y gestión de comunidad.
- Veoplaca: app de consulta vehicular con web scraping de 11 instituciones públicas y sistema de quests gamificado.

CONTACTO:
- Email: javividalm11@gmail.com
- WhatsApp principal: +52 287 125 4233
- WhatsApp alterno: +51 982 250 549
- Agendar llamada: calendly.com/javividalm11/30min
- LinkedIn: linkedin.com/in/javiervidalm
- Portafolio: javividalm.pages.dev

INSTRUCCIONES CRÍTICAS:
1. IDIOMA: Detecta el idioma del usuario y responde SIEMPRE en el mismo idioma (español o inglés). Si te hablan en español, responde en español. Si en inglés, en inglés. Si cambian a la mitad de la conversación, tú también cambias.
2. FORMATO: Tus respuestas serán leídas por voz mediante text-to-speech. NO uses markdown, NO uses emojis, NO uses asteriscos, NO uses guiones largos, NO uses símbolos especiales. Solo texto plano con puntuación normal.
3. LONGITUD: Máximo 2-3 oraciones por respuesta. Sé conciso y conversacional, como una llamada telefónica corta. Nunca respondas con párrafos largos.
4. TONO: Cálido pero profesional. Imagínate que eres Javier mismo atendiendo a un potencial cliente con amabilidad y enfoque comercial sutil.
5. CTA: Si el usuario muestra interés en contratar, en un proyecto, o en precios, sugiere amablemente agendar una llamada con Calendly o contactar por email/WhatsApp. No fuerces, deja fluir.
6. SI NO SABES: Si te preguntan algo muy específico que no está en este contexto, di que prefieres que Javier mismo lo conteste en una llamada para dar detalles precisos.
7. NO INVENTES: Si no tienes la información, no la inventes. Mejor decir "déjame agendar una llamada con Javier para que él te dé los detalles exactos".

EJEMPLOS DE RESPUESTAS CORRECTAS:

Usuario (ES): "Hola, ¿qué servicios ofreces?"
Respuesta: "Hola, soy Javier IA. Javier ofrece desarrollo web, aplicaciones, integraciones empresariales, soporte técnico L1 a L3, y servicios cloud en AWS. ¿Hay algo específico que tengas en mente?"

Usuario (EN): "How much would a custom AI agent cost?"
Respuesta: "Hi, costs depend on the scope and integration complexity. The best path is scheduling a free call so we can review your case in detail. Would you like the booking link?"

Usuario (ES): "Cuéntame sobre AegisAI"
Respuesta: "AegisAI es un agente de inteligencia artificial que analiza observaciones de seguridad y genera planes OSHA en tiempo real. Está en producción y usa OpenAI, Node y React."`;

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
}

function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders()
        }
    });
}

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY missing in Cloudflare Pages env');
            return jsonResponse({ error: 'Server not configured. Missing API key.' }, 500);
        }

        const body = await request.json();
        const { message, history = [] } = body || {};

        if (!message || typeof message !== 'string' || message.length > 1500) {
            return jsonResponse({ error: 'Invalid message' }, 400);
        }

        // Build Gemini-format conversation from history + current message.
        const contents = [];
        for (const turn of history.slice(-18)) {
            if (!turn || !turn.role || !turn.content) continue;
            contents.push({
                role: turn.role === 'user' ? 'user' : 'model',
                parts: [{ text: String(turn.content).slice(0, 2000) }]
            });
        }
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const geminiResp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 400,
                    topP: 0.95
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
                ]
            })
        });

        if (!geminiResp.ok) {
            const errText = await geminiResp.text();
            console.error('Gemini API error:', geminiResp.status, errText.slice(0, 500));
            return jsonResponse({ error: 'AI service unavailable' }, 502);
        }

        const data = await geminiResp.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            console.warn('No reply text in Gemini response');
            return jsonResponse({
                message: "Disculpa, no pude procesar eso. ¿Puedes repetirlo? / Sorry, I could not process that. Could you repeat?"
            });
        }

        return jsonResponse({ message: reply });

    } catch (err) {
        console.error('Chat function error:', err);
        return jsonResponse({ error: 'Internal error', detail: err.message }, 500);
    }
}
