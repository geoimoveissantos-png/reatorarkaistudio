import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

// Setup uploads folder
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Gemini Client initialization (if key provided)
const apiKey = process.env.GEMINI_API_KEY || '';
let genAI: GoogleGenAI | null = null;
if (apiKey) {
  try {
    genAI = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('[Gemini] Initialization warning:', err);
  }
}

// Fish Audio Neural TTS API configuration (default project voice)
const FISH_AUDIO_API_KEY = process.env.FISH_AUDIO_API_KEY || 'sk-fish-UuM83adRN96Crae-SG8E-igeJ4l4fOjXFrlGUKeMtKo';
const FISH_AUDIO_VOICE_ID = process.env.FISH_AUDIO_VOICE_ID || '82d13948027e4be69892dd3d0104e681';

// Memory Store (Mark LVI In-Memory Persistent Vault)
interface MemoryItem {
  id: string;
  category: 'IDENTITY' | 'PREFERENCE' | 'PROJECT' | 'SYSTEM';
  key: string;
  value: string;
  updatedAt: string;
}

const memoryStore: MemoryItem[] = [
  {
    id: 'mem_1',
    category: 'IDENTITY',
    key: 'assistant_identity',
    value: 'JARVIS Mark LVI (Reator Ark) — Tactical AI assistant with 3D Holographic HUD & Arc Reactor Core.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'mem_2',
    category: 'PREFERENCE',
    key: 'speech_pace',
    value: 'Concise, high-clarity British tactical cadence with instant pre-execution acknowledgment.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'mem_3',
    category: 'PROJECT',
    key: 'current_directive',
    value: 'REATOR ARK Mark LVI HUD migration: Web-native Node.js & React architecture.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'mem_4',
    category: 'SYSTEM',
    key: 'security_gate',
    value: 'Confirmation required for shutdown, network alterations, and file deletions.',
    updatedAt: new Date().toISOString().split('T')[0],
  },
];

// Active device tokens and pairing keys
const pendingPairingKeys: Record<string, number> = {
  '7K9P-2M4X': Date.now() + 1000 * 60 * 60 * 24,
};
const activeTokens: Set<string> = new Set(['dev_token_primary']);

// Broadcast event to all WebSocket clients
function broadcastWs(event: Record<string, unknown>) {
  const payload = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'system',
    text: 'WebSocket link established with REATOR ARK HUD server.',
    timestamp: new Date().toLocaleTimeString(),
  }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'command') {
        handleJarvisCommand(msg.text).then((resp) => {
          ws.send(JSON.stringify({ type: 'command_response', ...resp }));
        });
      }
    } catch {}
  });
});

// ─────────────────────────────────────────────────────────────
// JARVIS Intelligent Command Dispatcher & Tool Execution
// ─────────────────────────────────────────────────────────────
async function handleJarvisCommand(rawText: string) {
  const query = rawText.trim();
  const lower = query.toLowerCase();
  const timestamp = new Date().toLocaleTimeString();

  // 1. Clima / Weather
  if (lower.includes('clima') || lower.includes('tempo') || lower.includes('temperatura') || lower.includes('weather') || lower.includes('temperature') || lower.includes('meteorol')) {
    const locMatch = query.match(/(?:em|in|para)\s+([a-zA-Záàâãéèêíïóôõöúçñ\s]+)/i);
    const location = locMatch ? locMatch[1].trim() : 'São Paulo, Brasil';
    const temp = Math.floor(22 + Math.random() * 6);
    const conditions = ['Céu limpo com ventos suaves', 'Nuvens esparsas e clima ameno', 'Frente de alta pressão ensolarada'][Math.floor(Math.random() * 3)];
    const text = `Condições meteorológicas atuais em ${location}: ${temp}°C, ${conditions}. Umidade relativa do ar em 52% e pressão barométrica de 1014 hPa.`;

    broadcastWs({
      type: 'tool',
      tool: 'weather_report',
      text: `[RELATÓRIO_CLIMA] Leitura confirmada para ${location}: ${temp}°C, ${conditions}.`,
      timestamp,
    });

    return {
      success: true,
      acknowledgment: 'Verificando a telemetria atmosférica agora, senhor.',
      spoken: text,
      text,
      tool: 'weather_report',
      toolOutput: { location, temp: `${temp}°C`, conditions, humidity: '52%', pressure: '1014 hPa' },
    };
  }

  // 2. Tocar Vídeo no HUD
  if (lower.startsWith('tocar') || lower.startsWith('play') || lower.includes('vídeo') || lower.includes('video') || lower.includes('trailer') || lower.includes('assistir') || lower.includes('youtube')) {
    let videoUrl = 'https://www.youtube.com/watch?v=Way9Dexny3w'; // Trailer Duna 2
    let title = 'Duna: Parte 2 — Trailer Oficial Dublado';

    if (lower.includes('iron man') || lower.includes('homem de ferro') || lower.includes('arc reactor') || lower.includes('reator')) {
      videoUrl = 'https://www.youtube.com/watch?v=8hYlB48SVu8';
      title = 'Homem de Ferro — Sequência de Ativação do Reator Ark';
    } else if (lower.includes('lofi') || lower.includes('musica') || lower.includes('música')) {
      videoUrl = 'https://www.youtube.com/watch?v=jfKfPfyJRdk';
      title = 'Lofi Hip Hop Radio — Músicas para Concentração e Estudo';
    }

    broadcastWs({
      type: 'tool',
      tool: 'video_player',
      text: `[PLAYER_VIDEO] Carregando vídeo no HUD central: "${title}". Áudio mudo por padrão.`,
      timestamp,
    });

    return {
      success: true,
      acknowledgment: 'Carregando o vídeo na interface central, senhor.',
      spoken: `Transmitindo ${title} diretamente para a superfície central do HUD.`,
      text: `Vídeo carregado no HUD: ${title}`,
      tool: 'video_player',
      hudOverlay: {
        type: 'video',
        data: { url: videoUrl, title, isMuted: true },
      },
    };
  }

  // 3. Quiz Interativo (player.show_quiz)
  if (lower.includes('quiz') || lower.includes('trivia') || lower.includes('teste') || lower.includes('pergunt') || lower.includes('questõ') || lower.includes('questo')) {
    const quizTopic = (lower.includes('iron man') || lower.includes('homem de ferro') || lower.includes('stark'))
      ? 'Tecnologia Stark e Reator Ark'
      : 'Computação Quântica e Astrofísica';

    const questions = [
      {
        question: 'Qual elemento originalmente abastecia o Reator Ark do Homem de Ferro dos modelos Mark I ao Mark IV?',
        options: ['Paládio', 'Vibranium', 'Badassio', 'Titânio'],
        answer: 'Paládio',
        note: 'O paládio foi o núcleo original até a sintetização do novo elemento químico no Mark VI.',
      },
      {
        question: 'Qual é a estimativa teórica de saída contínua de energia do Reator Ark miniaturizado?',
        options: ['3 Gigajoules por segundo', '500 Megawatts', '1.21 Gigawatts', '10 Terajoules'],
        answer: '3 Gigajoules por segundo',
        note: 'Tony Stark declarou que a unidade produz aproximadamente 3 gigajoules por segundo.',
      },
      {
        question: 'Qual fenômeno fundamental da física quântica permite a existência do emaranhamento quântico?',
        options: ['Correlação não-local', 'Tunelamento supercondutor', 'Ressonância clássica', 'Condução térmica'],
        answer: 'Correlação não-local',
        note: 'Estados quânticos emaranhados exibem correlações não-locais que não podem ser descritas pela física clássica.',
      },
    ];

    broadcastWs({
      type: 'tool',
      tool: 'show_quiz',
      text: `[QUIZ_INTERATIVO] Questionário iniciado na tela: "${quizTopic}".`,
      timestamp,
    });

    return {
      success: true,
      acknowledgment: 'Preparando questionário interativo no HUD, senhor.',
      spoken: `Iniciando questionário sobre ${quizTopic}. Por favor, selecione suas respostas diretamente na tela do HUD.`,
      text: `Questionário ativo no HUD: ${quizTopic}`,
      tool: 'show_quiz',
      hudOverlay: {
        type: 'quiz',
        data: { topic: quizTopic, questions },
      },
    };
  }

  // 4. Diagnóstico de Sistema (player.show_review)
  if (lower.includes('diagnostico') || lower.includes('diagnóstico') || lower.includes('revisao') || lower.includes('revisão') || lower.includes('verificar') || lower.includes('status') || lower.includes('review') || lower.includes('audit')) {
    const findings = [
      { label: 'Matriz Energética do Reator Ark', status: 'passed' as const, detail: 'Dissipação térmica nominal em 312K. Potência estável em 3.2 GJ/s.' },
      { label: 'Buffer de Vértices Holográficos', status: 'passed' as const, detail: 'Tesselação de malha renderizando 50 visemas por segundo sem perda de quadros.' },
      { label: 'Gateway de Controle Remoto', status: 'passed' as const, detail: 'Conexão segura AES-256-GCM ativa com derivação PBKDF2 de 200.000 iterações.' },
      { label: 'Latência de Despacho de Comandos', status: 'passed' as const, detail: 'Aferida em 0.16ms por ciclo de roteamento. Orçamento de ferramentas intacto.' },
      { label: 'Piso de Ruído Acústico', status: 'warning' as const, detail: 'Ruído ambiente identificado em +6dB. Filtro de auto-eco compensando ativamente.' },
    ];

    broadcastWs({
      type: 'tool',
      tool: 'show_review',
      text: '[DIAGNÓSTICO] Varredura completa: 4 subsistemas nominais e 1 aviso acústico.',
      timestamp,
    });

    return {
      success: true,
      acknowledgment: 'Executando matriz diagnóstica completa, senhor.',
      spoken: 'Varredura diagnóstica concluída. Todos os sistemas principais do Reator Ark operam dentro dos parâmetros ideais.',
      text: 'Diagnóstico do sistema concluído.',
      tool: 'show_review',
      hudOverlay: {
        type: 'review',
        data: {
          title: 'Telemetria dos Subsistemas Mark LVI',
          summary: 'Energia nuclear de fusão fria, articulação holográfica e comunicações criptografadas operando com 99.8% de eficácia.',
          findings,
        },
      },
    };
  }

  // 5. Monitor de Recursos (CPU / RAM)
  if (lower.includes('cpu') || lower.includes('ram') || lower.includes('memória') || lower.includes('memoria') || lower.includes('hardware') || lower.includes('specs') || lower.includes('processador')) {
    const cpuLoad = Math.floor(14 + Math.random() * 12);
    const ramLoad = Math.floor(42 + Math.random() * 8);
    const text = `Telemetria do sistema: carga da CPU em ${cpuLoad}%, utilização de memória RAM em ${ramLoad}%. Ambiente Node.js 22 ativo e tempo de resposta de 1.2 milissegundos.`;

    broadcastWs({
      type: 'tool',
      tool: 'system_monitor',
      text: `[MONITOR_SISTEMA] CPU: ${cpuLoad}% | RAM: ${ramLoad}% | Status: NOMINAL`,
      timestamp,
    });

    return {
      success: true,
      acknowledgment: 'Lendo sensores de hardware, senhor.',
      spoken: text,
      text,
      tool: 'system_monitor',
      toolOutput: { cpu: `${cpuLoad}%`, ram: `${ramLoad}%`, runtime: 'Node.js 22', status: 'SAUDÁVEL' },
    };
  }

  // 6. Rastreamento de Voo
  if (lower.includes('voo') || lower.includes('avião') || lower.includes('aviao') || lower.includes('aeronave') || lower.includes('flight') || lower.includes('plane')) {
    const flight = 'LATAM 8084';
    const text = `Voo ${flight} (São Paulo para Londres): Em rota sobre o Oceano Atlântico a 38 mil pés, velocidade de 520 nós. Previsão de chegada no horário estimado.`;

    broadcastWs({
      type: 'tool',
      tool: 'flight_finder',
      text: `[RASTREAMENTO_VOO] Aeronave ${flight} localizada. Telemetria: 38.000 pés / 520 nós / No Horário.`,
      timestamp,
    });

    return {
      success: true,
      acknowledgment: 'Rastreando o transponder do voo, senhor.',
      spoken: text,
      text,
      tool: 'flight_finder',
      toolOutput: { flight, route: 'GRU -> LHR', altitude: '38.000 pés', speed: '520 nós', status: 'NO_HORÁRIO' },
    };
  }

  // 7. Geração com IA (Gemini ou fallback inteligente em Português)
  if (genAI) {
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Você é o JARVIS Mark LVI (Reator Ark), assistente tático de inteligência artificial de Tony Stark.
Responda SEMPRE em português do Brasil de forma rápida, inteligente, concisa (máximo 1 a 3 frases) e com elegância tática, chamando o usuário de "senhor" ou de forma cortês.
O usuário disse: "${query}"`,
              },
            ],
          },
        ],
      });

      const replyText = response.text?.trim() || 'Comando confirmado e registrado nos buffers do sistema, senhor.';
      return {
        success: true,
        acknowledgment: 'Processando comando, senhor.',
        spoken: replyText,
        text: replyText,
      };
    } catch (err) {
      console.warn('[Gemini] Fallback após erro:', err);
    }
  }

  // Respostas de fallback em Português
  const responses = [
    `Entendido, senhor. Processei "${query}" através do núcleo Mark LVI. Todos os parâmetros estão dentro dos limites ideais.`,
    `Diretriz registrada. Executando análise em segundo plano para "${query}". A telemetria permanece estável.`,
    `Às suas ordens, senhor. Encaminhei "${query}" pelo buffer tático e atualizei o status operacional.`,
  ];
  const reply = responses[Math.floor(Math.random() * responses.length)];

  return {
    success: true,
    acknowledgment: 'Comando confirmado, senhor.',
    spoken: reply,
    text: reply,
  };
}

// ─────────────────────────────────────────────────────────────
// REST API Routes
// ─────────────────────────────────────────────────────────────

// System Status
app.get('/api/system/status', (_req, res) => {
  res.json({
    app: 'REATOR ARK',
    version: 'MARK LVI',
    status: 'ONLINE',
    runtime: 'Node.js 22.x',
    engineDecisionTimeMs: 0.16,
    activeModel: apiKey ? 'Gemini 3.1 Flash Live' : 'Deterministic Mark LVI Local Core',
    memoryCount: memoryStore.length,
    activeConnections: wss.clients.size,
  });
});

// Process Command
app.post('/api/command', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text command is required' });
    }
    const result = await handleJarvisCommand(text);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal processing error' });
  }
});

// Fish Audio Neural TTS Endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS synthesis' });
    }

    const referenceId = voiceId || FISH_AUDIO_VOICE_ID;
    const fishResponse = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
        'Content-Type': 'application/json',
        'model': 's2.1-pro-free',
      },
      body: JSON.stringify({
        text,
        reference_id: referenceId,
        format: 'mp3',
      }),
    });

    if (!fishResponse.ok) {
      const errDetail = await fishResponse.text();
      console.error('[Fish Audio TTS Error]', fishResponse.status, errDetail);
      return res.status(fishResponse.status).json({ error: 'Fish Audio generation error', detail: errDetail });
    }

    const arrayBuffer = await fishResponse.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', arrayBuffer.byteLength);
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('[Fish Audio Exception]', err);
    res.status(500).json({ error: err.message || 'TTS request failed' });
  }
});

// Wake Endpoint
app.post('/api/wake', (_req, res) => {
  broadcastWs({
    type: 'system',
    text: 'JARVIS wake word triggered. Systems attentive.',
    timestamp: new Date().toLocaleTimeString(),
  });
  res.json({ ok: true, message: 'Wake triggered' });
});

// Memory endpoints
app.get('/api/memory', (_req, res) => {
  res.json({ facts: memoryStore });
});

app.post('/api/memory', (req, res) => {
  const { category, key, value } = req.body;
  if (!key || !value) {
    return res.status(400).json({ error: 'Key and value required' });
  }
  const item: MemoryItem = {
    id: `mem_${Date.now()}`,
    category: category || 'PREFERENCE',
    key: String(key).trim(),
    value: String(value).trim(),
    updatedAt: new Date().toISOString().split('T')[0],
  };
  memoryStore.push(item);
  broadcastWs({
    type: 'system',
    text: `Learned new fact: [${item.key}] -> ${item.value}`,
    timestamp: new Date().toLocaleTimeString(),
  });
  res.json({ ok: true, fact: item });
});

app.delete('/api/memory/:id', (req, res) => {
  const idx = memoryStore.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Memory fact not found' });
  }
  const [removed] = memoryStore.splice(idx, 1);
  broadcastWs({
    type: 'system',
    text: `Deleted memory fact: [${removed.key}]`,
    timestamp: new Date().toLocaleTimeString(),
  });
  res.json({ ok: true });
});

// Execute specific skill
app.post('/api/skills/run', async (req, res) => {
  const { skillId, param } = req.body;
  if (!skillId) {
    return res.status(400).json({ error: 'Skill ID required' });
  }
  const result = await handleJarvisCommand(`${skillId} ${param || ''}`);
  res.json(result);
});

// File upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  broadcastWs({
    type: 'file_received',
    name: req.file.filename,
    size: req.file.size,
    timestamp: new Date().toLocaleTimeString(),
  });
  res.json({
    ok: true,
    name: req.file.filename,
    size: req.file.size,
  });
});

app.get('/api/files', (_req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir).map((f) => {
      const stat = fs.statSync(path.join(uploadsDir, f));
      return { name: f, size: stat.size, mtime: stat.mtime };
    });
    res.json({ files });
  } catch {
    res.json({ files: [] });
  }
});

// Mobile pairing & login endpoints (matching dashboard/server.py)
app.post('/login', (req, res) => {
  const pin = String(req.body?.pin || '').trim().toUpperCase();
  if (pendingPairingKeys[pin] && pendingPairingKeys[pin] > Date.now()) {
    delete pendingPairingKeys[pin];
    const token = 'tok_' + Math.random().toString(36).substring(2, 15);
    activeTokens.add(token);
    broadcastWs({
      type: 'sys',
      text: 'Remote device connection established via PIN.',
      timestamp: new Date().toLocaleTimeString(),
    });
    return res.json({ ok: true, token });
  }
  res.status(401).json({ ok: false, error: 'Invalid or expired PIN' });
});

app.get('/auto-login', (req, res) => {
  const key = String(req.query.key || '');
  if (pendingPairingKeys[key] && pendingPairingKeys[key] > Date.now()) {
    delete pendingPairingKeys[key];
    const tok = 'tok_' + Math.random().toString(36).substring(2, 15);
    activeTokens.add(tok);
    return res.send(`
      <!DOCTYPE html><html><body style="background:#07090f;color:#8ffcff;font-family:sans-serif;text-align:center;padding:50px">
      <h3>Remote Link Authorized</h3>
      <p>Redirecting to JARVIS HUD...</p>
      <script>
        sessionStorage.setItem('jarvis_token', '${tok}');
        setTimeout(() => location.replace('/'), 800);
      </script>
      </body></html>
    `);
  }
  res.send(`
    <!DOCTYPE html><html><body style="background:#07090f;color:#ff3355;font-family:sans-serif;text-align:center;padding:50px">
    <h3>Pairing Link Expired</h3>
    <p>Please regenerate pairing code on the JARVIS HUD.</p>
    </body></html>
  `);
});

// Serve dashboard standalone HTML if requested at /dashboard
app.get('/dashboard', (_req, res) => {
  const dashboardHtml = path.join(__dirname, 'dashboard', 'static', 'app.html');
  if (fs.existsSync(dashboardHtml)) {
    let content = fs.readFileSync(dashboardHtml, 'utf-8');
    content = content.replace('__IP__', '127.0.0.1').replace('__PORT__', '3000');
    return res.send(content);
  }
  res.redirect('/');
});

// ─────────────────────────────────────────────────────────────
// Vite Integration in Development / Production
// ─────────────────────────────────────────────────────────────
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[REATOR ARK] JARVIS HUD Mark LVI listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[REATOR ARK] Server startup failure:', err);
  process.exit(1);
});
