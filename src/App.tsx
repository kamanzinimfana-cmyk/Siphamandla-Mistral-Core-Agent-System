import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  ShieldAlert, 
  Globe, 
  History, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Settings,
  X,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  GripHorizontal
} from 'lucide-react';
import { AgentOrchestrator } from './agents/orchestrator';
import { MockBrowser } from './browser/mockBrowser';
import { SimpleMemory } from './memory/simpleMemory';

interface LogEntry {
  timestamp: number;
  message: string;
  data?: any;
}

interface Config {
  apiKey: string;
  blueAgentId: string;
  redAgentId: string;
}

export default function App() {
  const [task, setTask] = useState('Find a login page and prepare to log in');
  const [url, setUrl] = useState('https://example.com');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [config, setConfig] = useState<Config>(() => {
    const saved = localStorage.getItem('mistral_agent_config');
    return saved ? JSON.parse(saved) : { apiKey: '', blueAgentId: '', redAgentId: '' };
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('mistral_agent_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const runAgent = async () => {
    if (!config.apiKey || !config.blueAgentId || !config.redAgentId) {
      setError('Configuration missing. Please check your settings.');
      setShowSettings(true);
      return;
    }

    setIsRunning(true);
    setLogs([]);
    setResult(null);
    setError(null);

    try {
      const browser = new MockBrowser();
      const memory = new SimpleMemory();
      const orchestrator = new AgentOrchestrator(browser, memory);
      
      const res = await orchestrator.execute(task, config, url);
      setResult(res);
      setLogs(res.logs);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center p-4">
      <motion.div 
        drag
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          height: isMinimized ? 'auto' : '600px',
          width: isMinimized ? '320px' : '400px'
        }}
        className="pointer-events-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative"
      >
        {/* Drag Handle & Header */}
        <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing group">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-md">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">Mistral Agent</h1>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">Floating UI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-md transition-colors ${showSettings ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 rounded-md transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripHorizontal className="w-4 h-4 text-slate-700" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {showSettings ? (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 p-5 space-y-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings className="w-3 h-3" />
                  System Settings
                </h2>
                <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Mistral API Key</label>
                  <div className="relative">
                    <input 
                      type={showApiKey ? "text" : "password"}
                      value={config.apiKey}
                      onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      placeholder="sk-..."
                    />
                    <button 
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                    >
                      {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Blue Agent ID</label>
                  <input 
                    type="text"
                    value={config.blueAgentId}
                    onChange={(e) => setConfig({...config, blueAgentId: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    placeholder="ag_..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Red Agent ID</label>
                  <input 
                    type="text"
                    value={config.redAgentId}
                    onChange={(e) => setConfig({...config, redAgentId: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    placeholder="ag_..."
                  />
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
                  >
                    Save Configuration
                  </button>
                </div>

                <p className="text-[10px] text-slate-600 text-center leading-relaxed">
                  Keys are stored locally in your browser's storage and never sent to our servers.
                </p>
              </div>
            </motion.div>
          ) : !isMinimized ? (
            <motion.div 
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Controls */}
              <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/30">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Task</label>
                  <textarea 
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all min-h-[60px] resize-none"
                    placeholder="Describe the task..."
                  />
                </div>

                <button
                  onClick={runAgent}
                  disabled={isRunning}
                  className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    isRunning 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 active:scale-[0.98]'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Run Agent
                    </>
                  )}
                </button>
              </div>

              {/* Logs */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-3 bg-slate-950/50"
              >
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <p className="leading-tight">{error}</p>
                  </div>
                )}

                {logs.length === 0 && !isRunning && !error && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-2 opacity-50">
                    <Terminal className="w-8 h-8" />
                    <p>Ready for input</p>
                  </div>
                )}

                {logs.map((log, i) => (
                  <div key={log.timestamp + i} className="flex gap-2">
                    <span className="text-slate-700 shrink-0 select-none">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <div className="space-y-1">
                      <p className={`
                        ${log.message.includes('BLUE') ? 'text-blue-400' : ''}
                        ${log.message.includes('RED') ? 'text-red-400' : ''}
                        ${log.message.includes('complete') ? 'text-green-400' : ''}
                        ${!log.message.includes('BLUE') && !log.message.includes('RED') && !log.message.includes('complete') ? 'text-slate-400' : ''}
                      `}>
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))}

                {result && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider">Completed</h3>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {result.output}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="minimized"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isRunning ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`} />
                <span className="text-[10px] font-mono text-slate-400">
                  {isRunning ? 'AGENT_ACTIVE' : 'IDLE'}
                </span>
              </div>
              {isRunning && (
                <button 
                  onClick={() => setIsMinimized(false)}
                  className="text-[10px] font-bold text-blue-400 hover:underline"
                >
                  VIEW LOGS
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
