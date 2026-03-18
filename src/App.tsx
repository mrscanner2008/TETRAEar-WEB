import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Radio, 
  Shield, 
  ShieldOff, 
  Settings, 
  Play, 
  Square, 
  List, 
  PhoneCall, 
  Users, 
  User, 
  BarChart3, 
  Terminal,
  Volume2,
  Lock,
  Unlock,
  AlertCircle,
  Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { SpectrumAnalyzer } from './components/SpectrumAnalyzer';
import { StatusPanel } from './components/StatusPanel';
import { TetraFrame, Call, SystemStats } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'frames' | 'calls' | 'groups' | 'stats' | 'log'>('frames');
  const [frequency, setFrequency] = useState(425.500);
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [frames, setFrames] = useState<TetraFrame[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    syncRate: 0,
    crcSuccess: 0,
    signalStrength: -95,
    noiseFloor: -110,
    framesPerSecond: 0
  });
  const [usbDevice, setUsbDevice] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectSDR = async () => {
    setIsConnecting(true);
    try {
      const device = await (navigator as any).usb.requestDevice({
        filters: [{ vendorId: 0x0bda, productId: 0x2838 }, { vendorId: 0x0bda, productId: 0x2832 }]
      });
      
      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
      await device.claimInterface(0);
      
      setUsbDevice(device);
      setIsActive(true);
      // Note: In a real implementation, we would start the RTL-SDR driver loop here
    } catch (err) {
      console.error('USB Connection Error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Simulation logic
  useEffect(() => {
    if (!isActive) {
      setStats({
        syncRate: 0,
        crcSuccess: 0,
        signalStrength: -110,
        noiseFloor: -115,
        framesPerSecond: 0
      });
      return;
    }

    const interval = setInterval(() => {
      // Update stats
      setStats(prev => ({
        syncRate: 85 + Math.random() * 10,
        crcSuccess: 98 + Math.random() * 2,
        signalStrength: -75 + Math.random() * 10,
        noiseFloor: -105 + Math.random() * 5,
        framesPerSecond: 12 + Math.random() * 4
      }));

      // Generate new frame
      const newFrame: TetraFrame = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        frequency: frequency,
        burstType: ['Normal', 'Sync', 'Access', 'Control'][Math.floor(Math.random() * 4)] as any,
        channelType: ['MCCH', 'SCCH', 'PDCH', 'TCH'][Math.floor(Math.random() * 4)] as any,
        ssi: 1000 + Math.floor(Math.random() * 9000),
        gssi: 100 + Math.floor(Math.random() * 900),
        payload: '01011010110010101111000011110000',
        crc: Math.random() > 0.05,
        encrypted: isEncrypted,
        decrypted: !isEncrypted || Math.random() > 0.2
      };

      setFrames(prev => [newFrame, ...prev].slice(0, 50));

      // Randomly start/end calls
      if (Math.random() > 0.95 && calls.length < 3) {
        const newCall: Call = {
          id: Math.random().toString(36).substr(2, 9),
          startTime: Date.now(),
          caller: 1000 + Math.floor(Math.random() * 9000),
          target: 1000 + Math.floor(Math.random() * 9000),
          group: 100 + Math.floor(Math.random() * 900),
          type: 'Voice',
          status: 'Active',
          amplitude: new Array(20).fill(0).map(() => Math.random())
        };
        setCalls(prev => [newCall, ...prev]);
      }

      setCalls(prev => prev.map(call => {
        if (call.status === 'Active' && Math.random() > 0.98) {
          return { ...call, status: 'Ended', endTime: Date.now() };
        }
        return call;
      }));

    }, 500);

    return () => clearInterval(interval);
  }, [isActive, frequency, isEncrypted, calls.length]);

  const statsHistory = useMemo(() => {
    return new Array(20).fill(0).map((_, i) => ({
      time: i,
      sync: 80 + Math.random() * 20,
      strength: -80 + Math.random() * 20
    }));
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-green-500/30">
      {/* Header / Status Bar */}
      <header className="border-b border-white/5 bg-[#0a0a0a] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
              <Radio className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight uppercase">TetraEar v2.3</h1>
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Professional Decoder</p>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div className="flex gap-6">
            <StatusItem label="SYNC" value={`${stats.syncRate.toFixed(1)}%`} active={stats.syncRate > 80} />
            <StatusItem label="CRC" value={`${stats.crcSuccess.toFixed(1)}%`} active={stats.crcSuccess > 95} />
            <StatusItem label="RSSI" value={`${stats.signalStrength.toFixed(0)} dBm`} active={stats.signalStrength > -90} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black rounded border border-white/5">
            <span className="text-[10px] font-mono text-white/40 uppercase">FREQ</span>
            <span className="text-sm font-mono text-green-500">{frequency.toFixed(3)} MHz</span>
          </div>
          
          <button 
            onClick={connectSDR}
            disabled={!!usbDevice || isConnecting}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold uppercase transition-all",
              usbDevice 
                ? "bg-blue-500/10 text-blue-500 border border-blue-500/50" 
                : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
            )}
          >
            <Wifi className="w-3 h-3" />
            {isConnecting ? 'Connecting...' : usbDevice ? 'SDR Connected' : 'Connect SDR'}
          </button>

          <button 
            onClick={() => setIsActive(!isActive)}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold uppercase transition-all",
              isActive 
                ? "bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20" 
                : "bg-green-500/10 text-green-500 border border-green-500/50 hover:bg-green-500/20"
            )}
          >
            {isActive ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            {isActive ? 'Stop Capture' : 'Start Capture'}
          </button>
          <button className="p-2 text-white/40 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-6 grid grid-cols-12 gap-6 max-w-[1600px] mx-auto">
        {/* Left Column - Controls & Spectrum */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Spectrum Analyzer Card */}
          <div className="bg-[#0a0a0a] rounded-xl border border-white/5 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" />
                Spectrum Analyzer
              </h2>
              <div className="flex gap-2">
                <button className="text-[10px] font-mono text-white/40 hover:text-white">RESET</button>
                <button className="text-[10px] font-mono text-white/40 hover:text-white">HOLD</button>
              </div>
            </div>
            <SpectrumAnalyzer isActive={isActive} frequency={frequency} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 uppercase font-mono">Gain Control</label>
                <input type="range" className="w-full accent-green-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 uppercase font-mono">Noise Floor</label>
                <div className="text-sm font-mono text-white/80">{stats.noiseFloor.toFixed(1)} dBm</div>
              </div>
            </div>
          </div>

          {/* Diagnostic Status */}
          <StatusPanel 
            syncRate={stats.syncRate} 
            crcSuccess={stats.crcSuccess} 
            signalStrength={stats.signalStrength} 
          />

          {/* Encryption Status Card */}
          <div className="bg-[#0a0a0a] rounded-xl border border-white/5 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                Security & Keys
              </h2>
              <button 
                onClick={() => setIsEncrypted(!isEncrypted)}
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold uppercase border transition-all",
                  isEncrypted ? "border-blue-500/50 text-blue-500" : "border-white/10 text-white/40"
                )}
              >
                {isEncrypted ? 'TEA2 Active' : 'Clear Mode'}
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-black/50 rounded border border-white/5">
                <div className="flex items-center gap-2">
                  {isEncrypted ? <Lock className="w-3 h-3 text-blue-500" /> : <Unlock className="w-3 h-3 text-white/20" />}
                  <span className="text-[11px] font-mono">Static Cipher Key (SCK)</span>
                </div>
                <span className="text-[11px] font-mono text-white/40">ID: 0x01</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-black/50 rounded border border-white/5">
                <div className="flex items-center gap-2">
                  <Wifi className="w-3 h-3 text-white/20" />
                  <span className="text-[11px] font-mono">Air Interface Encryption</span>
                </div>
                <span className="text-[11px] font-mono text-green-500">ENABLED</span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-[#0a0a0a] rounded-xl border border-white/5 p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4">System Health</h2>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={statsHistory}>
                  <defs>
                    <linearGradient id="colorSync" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="sync" stroke="#22c55e" fillOpacity={1} fill="url(#colorSync)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column - Data Tabs */}
        <div className="col-span-12 lg:col-span-8 flex flex-col min-h-[600px]">
          {/* Tabs Navigation */}
          <div className="flex border-b border-white/5 mb-4">
            <TabButton active={activeTab === 'frames'} onClick={() => setActiveTab('frames')} icon={<List className="w-4 h-4" />} label="Frames" />
            <TabButton active={activeTab === 'calls'} onClick={() => setActiveTab('calls')} icon={<PhoneCall className="w-4 h-4" />} label="Calls" />
            <TabButton active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} icon={<Users className="w-4 h-4" />} label="Groups" />
            <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 className="w-4 h-4" />} label="Stats" />
            <TabButton active={activeTab === 'log'} onClick={() => setActiveTab('log')} icon={<Terminal className="w-4 h-4" />} label="System Log" />
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === 'frames' && (
                <motion.div 
                  key="frames"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 overflow-auto"
                >
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0a0a0a] border-b border-white/10">
                      <tr>
                        <th className="p-3 text-[10px] font-bold uppercase text-white/40">Timestamp</th>
                        <th className="p-3 text-[10px] font-bold uppercase text-white/40">Burst</th>
                        <th className="p-3 text-[10px] font-bold uppercase text-white/40">Channel</th>
                        <th className="p-3 text-[10px] font-bold uppercase text-white/40">SSI</th>
                        <th className="p-3 text-[10px] font-bold uppercase text-white/40">GSSI</th>
                        <th className="p-3 text-[10px] font-bold uppercase text-white/40">Status</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-[11px]">
                      {frames.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-white/20 italic">
                            {isActive ? 'Awaiting signal synchronization...' : 'Capture inactive'}
                          </td>
                        </tr>
                      ) : (
                        frames.map((frame) => (
                          <tr key={frame.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                            <td className="p-3 text-white/60">{new Date(frame.timestamp).toLocaleTimeString()}</td>
                            <td className="p-3">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[9px] font-bold",
                                frame.burstType === 'Sync' ? "bg-blue-500/10 text-blue-500" : "bg-white/5 text-white/60"
                              )}>
                                {frame.burstType}
                              </span>
                            </td>
                            <td className="p-3 text-white/80">{frame.channelType}</td>
                            <td className="p-3 text-green-500/80">{frame.ssi}</td>
                            <td className="p-3 text-blue-500/80">{frame.gssi}</td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                {frame.crc ? <span className="text-green-500">OK</span> : <span className="text-red-500">CRC</span>}
                                {frame.encrypted && (
                                  <span className={frame.decrypted ? "text-blue-500" : "text-yellow-500"}>
                                    {frame.decrypted ? 'DEC' : 'ENC'}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </motion.div>
              )}

              {activeTab === 'calls' && (
                <motion.div 
                  key="calls"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 space-y-4"
                >
                  {calls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-white/20">
                      <PhoneCall className="w-12 h-12 mb-4 opacity-10" />
                      <p>No active voice calls detected</p>
                    </div>
                  ) : (
                    calls.map(call => (
                      <div key={call.id} className="bg-black/40 rounded-lg border border-white/5 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            call.status === 'Active' ? "bg-green-500/20 text-green-500 animate-pulse" : "bg-white/5 text-white/20"
                          )}>
                            <Volume2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">Call #{call.id}</span>
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                                call.status === 'Active' ? "bg-green-500 text-black" : "bg-white/10 text-white/40"
                              )}>
                                {call.status}
                              </span>
                            </div>
                            <p className="text-xs text-white/40 font-mono">
                              {call.caller} → {call.target} (Group {call.group})
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex gap-1 items-end h-8">
                            {call.amplitude.map((amp, i) => (
                              <div 
                                key={i} 
                                className="w-1 bg-green-500/50 rounded-full"
                                style={{ height: `${call.status === 'Active' ? amp * 100 : 10}%` }}
                              />
                            ))}
                          </div>
                          <button className="p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
                            <Play className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {activeTab === 'log' && (
                <motion.div 
                  key="log"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 font-mono text-[11px] space-y-1 overflow-auto h-full"
                >
                  <div className="text-white/20">[09:56:34] Initializing TetraEar v2.3...</div>
                  <div className="text-white/20">[09:56:35] Loading TEA2 crypto modules...</div>
                  <div className="text-white/20">[09:56:35] RTL-SDR Device detected: Realtek RTL2832U</div>
                  <div className="text-green-500/60">[09:56:36] DSP Engine initialized successfully.</div>
                  <div className="text-white/20">[09:56:36] Waiting for user input...</div>
                  {isActive && (
                    <>
                      <div className="text-blue-500/60">[{new Date().toLocaleTimeString()}] Frequency set to {frequency.toFixed(3)} MHz</div>
                      <div className="text-green-500/60">[{new Date().toLocaleTimeString()}] Signal locked. Sync: {stats.syncRate.toFixed(1)}%</div>
                      <div className="text-white/60">[{new Date().toLocaleTimeString()}] MCCH detected on slot 1</div>
                      <div className="text-white/60">[{new Date().toLocaleTimeString()}] Decoding system information (D-MLE-SYSINFO)</div>
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'stats' && (
                <motion.div 
                  key="stats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 grid grid-cols-2 gap-6"
                >
                  <div className="bg-black/40 rounded-lg border border-white/5 p-4">
                    <h3 className="text-[10px] font-bold uppercase text-white/40 mb-4">Sync Stability</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={statsHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={[0, 100]} hide />
                          <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }} />
                          <Line type="monotone" dataKey="sync" stroke="#22c55e" dot={false} strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-black/40 rounded-lg border border-white/5 p-4">
                    <h3 className="text-[10px] font-bold uppercase text-white/40 mb-4">Signal Strength (dBm)</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={statsHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={[-120, -40]} hide />
                          <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }} />
                          <Line type="monotone" dataKey="strength" stroke="#3b82f6" dot={false} strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'groups' && (
                <motion.div 
                  key="groups"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6"
                >
                  <div className="grid grid-cols-3 gap-4">
                    {[101, 102, 105, 201, 305, 400].map(id => (
                      <div key={id} className="bg-black/40 rounded-lg border border-white/5 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">GSSI {id}</span>
                          <Users className="w-3 h-3 text-white/20" />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
                          <span>Users: {Math.floor(Math.random() * 20) + 5}</span>
                          <span className="text-green-500/60">ACTIVE</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full" style={{ width: `${Math.random() * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/5 px-6 py-2 flex items-center justify-between text-[10px] font-mono text-white/40">
        <div className="flex gap-6">
          <span>DEVICE: {usbDevice ? usbDevice.productName : 'SIMULATED DEVICE'}</span>
          <span>BUFFER: {isActive ? '12.4 MB' : '0.0 MB'}</span>
          <span>TEMP: {isActive ? '42.5°C' : '--°C'}</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            DSP ENGINE OK
          </span>
          <span>UPTIME: 00:12:45</span>
        </div>
      </footer>
    </div>
  );
}

function StatusItem({ label, value, active }: { label: string, value: string, active: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest leading-none mb-1">{label}</span>
      <span className={cn(
        "text-xs font-mono font-bold leading-none",
        active ? "text-white" : "text-red-500/70"
      )}>
        {value}
      </span>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all relative",
        active ? "text-white" : "text-white/30 hover:text-white/60"
      )}
    >
      {icon}
      {label}
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
        />
      )}
    </button>
  );
}
