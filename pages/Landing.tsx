import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { 
  Truck, ArrowRight, ShieldCheck, 
  Globe, Cpu, Activity,
  Database, Zap, Signal, Lock,
  Target, BarChart3, Radio, Orbit,
  Wrench
} from 'lucide-react';

const NavNode = ({ label, href }: { label: string, href: string }) => (
  <a href={href} className="group flex flex-col items-center">
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover:text-blue-500 transition-colors">{label}</span>
    <motion.div className="h-px w-0 bg-blue-500 mt-1" whileHover={{ width: '100%' }} />
  </a>
);

const InteractiveSector = ({ name, status, load, icon: Icon }: any) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02 }}
    className="p-6 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl hover:border-blue-500/50 hover:bg-slate-900/60 transition-all cursor-crosshair group"
  >
    <div className="flex justify-between items-start mb-6">
      <div className="p-3 bg-white/5 rounded-2xl group-hover:text-blue-400 transition-colors">
        <Icon size={20} />
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-50 animate-pulse' : 'bg-amber-500'}`}></div>
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{status}</span>
      </div>
    </div>
    <h4 className="text-sm font-black text-white uppercase tracking-tighter mb-1">{name}</h4>
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-black text-white tabular-nums">{load}</span>
      <span className="text-[8px] font-black text-slate-500 uppercase">Nodes</span>
    </div>
  </motion.div>
);

export const Landing = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isNavHidden, setIsNavHidden] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Smart Navbar Logic: Hide on scroll down, show on scroll up
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setIsNavHidden(true);
    } else {
      setIsNavHidden(false);
    }
  });
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5
    });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-blue-500/30 overflow-x-hidden"
    >
      {/* Dynamic Command Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px) scale(1.1)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]"></div>
        <motion.div 
          animate={{ 
            x: mousePos.x * 100, 
            y: mousePos.y * 100,
          }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full"
        />
        <motion.div 
          animate={{ 
            x: mousePos.x * -100, 
            y: mousePos.y * -100,
          }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full"
        />
      </div>

      {/* Smart Global Navigation */}
      <motion.nav 
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: "-100%", opacity: 0 }
        }}
        animate={isNavHidden ? "hidden" : "visible"}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 h-24 flex items-center px-8 sm:px-12 bg-slate-950/20 backdrop-blur-lg border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-950 shadow-2xl shadow-white/10 group-hover:rotate-12 transition-transform">
              <Truck size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black text-white tracking-tighter uppercase">
              FleetOps <span className="text-blue-500">Core</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-12">
            <NavNode label="Network" href="#" />
            <NavNode label="Security" href="#" />
            <NavNode label="Telemetry" href="#" />
          </div>

          <Link 
            to="/login" 
            className="px-8 py-3 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            Access Terminal
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-48 pb-32 px-8 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 px-5 py-2 bg-white/5 rounded-full border border-white/10 mb-12 backdrop-blur-xl"
          >
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Operational Readiness v4.2.1</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl lg:text-[10rem] font-black text-white tracking-tighter leading-[0.8] mb-12"
          >
            Sync. <br />
            <span className="text-blue-500">Coordinate.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto font-medium leading-relaxed mb-16 italic"
          >
            The spatial operating system for industrial logistics. Unified telemetry, high-integrity coordination, and predictive asset intelligence.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <Link 
              to="/login" 
              className="group px-14 py-6 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
            >
              Initialize Node <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-14 py-6 bg-transparent text-white border border-white/10 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-white/5 transition-all">
              Watch Recon
            </button>
          </motion.div>
        </div>

        {/* Interactive Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1 }}
          className="max-w-6xl mx-auto mt-32 relative"
        >
          <div 
            className="bg-slate-900/50 rounded-[4rem] border border-white/5 p-1 backdrop-blur-sm shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
            style={{
              transform: `perspective(1000px) rotateX(${mousePos.y * -5}deg) rotateY(${mousePos.x * 5}deg)`
            }}
          >
            <div className="bg-[#020617] rounded-[3.8rem] aspect-video relative overflow-hidden">
               {/* Internal Map Simulation */}
               <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')] bg-cover grayscale" />
               <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent"></div>
               
               {/* Sector Hubs UI Overlay */}
               <div className="absolute inset-0 p-12 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                     <div className="space-y-4">
                        <div className="w-32 h-2 bg-blue-500/20 rounded-full overflow-hidden">
                          <motion.div 
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-1/2 h-full bg-blue-500"
                          />
                        </div>
                        <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Scanning Global Grid...</h5>
                     </div>
                     <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center"><Activity size={20} className="text-white"/></div>
                        <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center"><Signal size={20} className="text-white"/></div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <InteractiveSector name="Site Alpha" status="Active" load="1,240" icon={Orbit} />
                    <InteractiveSector name="Staging B" status="Active" load="842" icon={Target} />
                    <InteractiveSector name="Hub 9" status="Maintenance" load="12" icon={Wrench} />
                    <InteractiveSector name="Coastal X" status="Active" load="4,102" icon={Radio} />
                  </div>
               </div>

               {/* Center Focus Decoration */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-96 h-96 border border-white/5 rounded-full flex items-center justify-center"
                  >
                    <div className="w-80 h-80 border border-blue-500/10 rounded-full flex items-center justify-center">
                       <div className="w-64 h-64 border border-white/5 rounded-full"></div>
                    </div>
                  </motion.div>
               </div>
            </div>
          </div>
          
          {/* Floating UI Badges */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-12 -left-8 p-6 bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl hidden xl:block"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">System: Nominal</span>
            </div>
            <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-emerald-500"></div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute -bottom-8 -right-8 p-6 bg-blue-600 backdrop-blur-3xl rounded-3xl border border-blue-400/30 shadow-2xl hidden xl:block"
          >
             <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Fleet Latency</p>
             <p className="text-2xl font-black text-white tabular-nums tracking-tighter">18ms</p>
          </motion.div>
        </motion.div>
      </main>

      {/* Feature Matrix */}
      <section className="py-40 px-8 sm:px-12 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: Globe, title: "Global Grid", desc: "Military-grade tracking via multi-path satellite constellations." },
              { icon: Lock, title: "Zero Trust", desc: "End-to-end hardware identity verification for every node." },
              { icon: Cpu, title: "Edge Compute", desc: "Real-time predictive diagnostics processed directly on-asset." },
              { icon: Database, title: "Audit Ledger", desc: "Immutable state history for every organizational transaction." }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all">
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
             <div className="flex items-center gap-3">
               <Truck size={24} className="text-blue-500" />
               <span className="text-xl font-black text-white uppercase tracking-tighter">FleetOps</span>
             </div>
             <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">&copy; {new Date().getFullYear()} FLEETOPS GLOBAL CORE. ALL SYSTEMS NOMINAL.</p>
          </div>
          
          <div className="flex gap-10">
            {['Audit', 'Status', 'Protocol', 'Contact'].map(item => (
              <a key={item} href="#" className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #020617;
        }
        ::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #3b82f6;
        }
      `}</style>
    </div>
  );
};