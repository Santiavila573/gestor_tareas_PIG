import React, { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, ArrowRight, LayoutDashboard, Sparkles, CheckCircle2, Zap, Shield, TrendingUp } from 'lucide-react';
import { authService } from '../services/auth';
import { firebaseAuthService } from '../services/firebaseAuth';
import { FIREBASE_ENABLED } from '../services/firebase';
import SecurityCaptcha from './SecurityCaptcha';

interface LoginProps {
    onLoginSuccess: () => void;
    onNavigateToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigateToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
    const [error, setError] = useState('');
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (FIREBASE_ENABLED) {
                await firebaseAuthService.login(email, password);
            } else {
                await authService.login(email, password);
            }
            onLoginSuccess();
        } catch (err: any) {
            setError(err?.message || err?.toString() || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0f0f1a] overflow-hidden relative font-jakarta">

            {/* Ultra Premium Animated Background */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                {/* Gradient Orbs with Advanced Animations */}
                <div
                    className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[120px] animate-float"
                    style={{
                        background: 'radial-gradient(circle, rgba(123,104,238,0.6) 0%, rgba(138,43,226,0.3) 50%, transparent 100%)',
                        top: '10%',
                        left: '5%',
                        animation: 'float 20s ease-in-out infinite, pulse 8s ease-in-out infinite'
                    }}
                />
                <div
                    className="absolute w-[500px] h-[500px] rounded-full opacity-25 blur-[100px] animate-float-delayed"
                    style={{
                        background: 'radial-gradient(circle, rgba(168,154,255,0.5) 0%, rgba(147,51,234,0.3) 50%, transparent 100%)',
                        top: '60%',
                        right: '10%',
                        animation: 'float 25s ease-in-out infinite reverse, pulse 10s ease-in-out infinite'
                    }}
                />
                <div
                    className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-[90px]"
                    style={{
                        background: 'radial-gradient(circle, rgba(236,72,153,0.4) 0%, rgba(219,39,119,0.2) 50%, transparent 100%)',
                        bottom: '15%',
                        left: '30%',
                        animation: 'float 18s ease-in-out infinite, pulse 12s ease-in-out infinite'
                    }}
                />

                {/* Animated Grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(rgba(123,104,238,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(123,104,238,0.3) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                    animation: 'grid-move 20s linear infinite'
                }} />

                {/* Noise Texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />

                {/* Floating Particles */}
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-[#7b68ee] rounded-full opacity-40"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animation: `particle-float ${15 + Math.random() * 10}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}

                {/* Mouse Follow Gradient */}
                <div
                    className="absolute w-[800px] h-[800px] rounded-full opacity-10 blur-[150px] pointer-events-none transition-all duration-1000 ease-out"
                    style={{
                        background: 'radial-gradient(circle, rgba(123,104,238,0.8) 0%, transparent 70%)',
                        left: mousePosition.x - 400,
                        top: mousePosition.y - 400,
                    }}
                />
            </div>

            {/* Main Container */}
            <div className="relative z-10 container mx-auto flex flex-col lg:flex-row items-center justify-center min-h-screen px-4 gap-12 lg:gap-24 py-12">

                {/* Left Side: Brand & Value Prop */}
                <div className="flex-1 text-center lg:text-left space-y-10 max-w-2xl">
                    {/* Animated Badge */}
                    <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-[#7b68ee]/10 to-purple-500/10 border border-[#7b68ee]/30 backdrop-blur-xl shadow-lg shadow-[#7b68ee]/10 animate-in slide-in-from-left duration-700 hover:scale-105 transition-transform">
                        <div className="relative">
                            <Sparkles className="w-5 h-5 text-[#a89aff] animate-pulse" />
                            <div className="absolute inset-0 blur-md bg-[#7b68ee] opacity-50 animate-pulse" />
                        </div>
                        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#a89aff] to-white">
                            Potenciado con IA de Última Generación
                        </span>
                    </div>

                    {/* Hero Title with Advanced Animations */}
                    <div className="space-y-6 animate-in slide-in-from-left duration-1000 delay-150">
                        <h1 className="text-6xl lg:text-8xl font-black tracking-tight leading-none">
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 animate-gradient-x drop-shadow-2xl">
                                GestorTasks
                            </span>
                            <span className="relative inline-block mt-2">
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#7b68ee] via-purple-400 to-pink-400 font-black animate-gradient-x">
                                    AI
                                </span>
                                {/* Glow Effect */}
                                <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-[#7b68ee] via-purple-400 to-pink-400 opacity-30 animate-pulse" />
                                {/* Underline Animation */}
                                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-[#7b68ee] via-purple-400 to-pink-400 rounded-full animate-shimmer" />
                            </span>
                        </h1>
                        <p className="text-xl text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium animate-in fade-in duration-1000 delay-300">
                            Gestión de tareas inteligente que <span className="text-[#a89aff] font-bold">evoluciona contigo</span>.
                            Maximiza la productividad con asistencia de IA en tiempo real.
                        </p>
                    </div>

                    {/* Feature Cards with Stagger Animation */}
                    <div className="hidden lg:grid grid-cols-1 gap-4 pt-6">
                        {[
                            { icon: LayoutDashboard, title: 'Dashboard Intuitivo', desc: 'Vista 360° de tus proyectos', color: 'from-[#7b68ee] to-purple-600', delay: '0ms' },
                            { icon: Zap, title: 'Smart Sprints', desc: 'Planificación automática con IA', color: 'from-purple-500 to-pink-500', delay: '150ms' },
                            { icon: Shield, title: 'Seguridad Enterprise', desc: 'Encriptación de grado militar', color: 'from-pink-500 to-rose-500', delay: '300ms' }
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:bg-white/[0.05] hover:border-[#7b68ee]/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#7b68ee]/10"
                                style={{ animationDelay: feature.delay }}
                            >
                                <div className={`relative p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                    <div className="absolute inset-0 blur-xl bg-gradient-to-br from-[#7b68ee] to-purple-600 opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-white text-base group-hover:text-[#a89aff] transition-colors">{feature.title}</h3>
                                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">{feature.desc}</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-[#7b68ee] group-hover:translate-x-1 transition-all" />
                            </div>
                        ))}
                    </div>

                    {/* Stats Counter Animation */}
                    <div className="hidden lg:flex items-center gap-8 pt-4 animate-in fade-in duration-1000 delay-500">
                        {[
                            { value: '10K+', label: 'Usuarios Activos' },
                            { value: '99.9%', label: 'Uptime' },
                            { value: '4.9★', label: 'Rating' }
                        ].map((stat, idx) => (
                            <div key={idx} className="text-center group cursor-default">
                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#7b68ee] to-purple-400 group-hover:scale-110 transition-transform">
                                    {stat.value}
                                </div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Ultra Premium Login Form */}
                <div className="w-full max-w-md xl:max-w-2xl animate-in slide-in-from-right duration-1000">
                    <div className="relative group/card">
                        {/* Animated Border Glow */}
                        <div className="absolute -inset-[1px] bg-gradient-to-r from-[#7b68ee] via-purple-500 to-pink-500 rounded-[2.5rem] opacity-0 group-hover/card:opacity-100 blur-xl transition-opacity duration-1000 animate-gradient-xy" />

                        {/* Main Card */}
                        <div className="relative bg-gradient-to-br from-[#1a1a2e]/90 via-[#16213e]/90 to-[#0f0f1a]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl overflow-hidden">

                            {/* Animated Background Pattern */}
                            <div className="absolute inset-0 opacity-5">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(123,104,238,0.3) 1px, transparent 0)`,
                                    backgroundSize: '40px 40px',
                                    animation: 'pattern-move 30s linear infinite'
                                }} />
                            </div>

                            {/* Top Accent Line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#7b68ee] to-transparent animate-shimmer" />

                            <div className="relative z-10">
                                {/* Header */}
                                <div className="text-center mb-4 space-y-1">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7b68ee] to-purple-600 shadow-lg shadow-[#7b68ee]/30 mb-1 animate-bounce-slow">
                                        <Lock className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                                        Bienvenido
                                    </h2>
                                    <p className="text-slate-400 text-[11px]">
                                        Ingresa a tu workspace y comienza a gestionar
                                    </p>
                                </div>

                                {/* Error Message with Animation */}
                                {error && (
                                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl text-xs flex items-center gap-2 animate-in slide-in-from-top duration-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                        <span className="flex-1">{error}</span>
                                    </div>
                                )}

                                {/* Form */}
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-4">
                                            {/* Email Input */}
                                            <div className="space-y-2 group/field">
                                                <label className="text-[10px] font-black text-[#a89aff] ml-1 uppercase tracking-widest flex items-center gap-2">
                                                    <Mail className="w-2.5 h-2.5" />
                                                    Email Profesional
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-[#7b68ee]/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-focus-within/field:opacity-100 transition-opacity duration-500" />
                                                    <div className="relative group/input">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/input:text-[#7b68ee] transition-all duration-300 group-focus-within/input:scale-110" />
                                                        <input
                                                            type="email"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7b68ee]/50 focus:ring-2 focus:ring-[#7b68ee]/20 focus:bg-black/40 transition-all duration-300 text-sm font-medium"
                                                            placeholder="tu@empresa.com"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Password Input */}
                                            <div className="space-y-2 group/field">
                                                <label className="text-[10px] font-black text-[#a89aff] ml-1 uppercase tracking-widest flex items-center gap-2">
                                                    <Lock className="w-2.5 h-2.5" />
                                                    Contraseña Segura
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-focus-within/field:opacity-100 transition-opacity duration-500" />
                                                    <div className="relative group/input">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/input:text-[#7b68ee] transition-all duration-300 group-focus-within/input:scale-110" />
                                                        <input
                                                            type="password"
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7b68ee]/50 focus:ring-2 focus:ring-[#7b68ee]/20 focus:bg-black/40 transition-all duration-300 text-sm font-medium"
                                                            placeholder="••••••••"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Captcha Section - Inside form, below inputs */}
                                        <div className="pt-2 animate-in fade-in slide-in-from-top duration-700 delay-200">
                                            <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3 transition-all hover:bg-white/[0.05] shadow-inner backdrop-blur-sm">
                                                <div className="text-[10px] font-black text-[#a89aff] mb-2 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                                                    <Shield className="w-3 h-3" />
                                                    Verificación de Seguridad
                                                </div>
                                                <SecurityCaptcha onVerify={setIsCaptchaVerified} />
                                            </div>
                                        </div>

                                    {/* Action Buttons */}
                                    <div className="pt-2 space-y-3">
                                        <button
                                            type="submit"
                                            disabled={isLoading || !isCaptchaVerified}
                                            className="relative w-full group overflow-hidden"
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-r from-[#7b68ee] via-purple-600 to-pink-600 transition-all duration-500 ${isLoading || !isCaptchaVerified ? 'opacity-50' : 'group-hover:scale-105 opacity-100'}`} />
                                            <div className="relative flex items-center justify-center gap-2 py-3 px-6 text-white font-bold transition-all">
                                                {isLoading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <span className="text-sm">Iniciar Sesión</span>
                                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </div>
                                        </button>

                                        <div className="flex items-center justify-between gap-4 pt-1">
                                            <div className="h-[1px] flex-1 bg-white/5" />
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">O</span>
                                            <div className="h-[1px] flex-1 bg-white/5" />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={onNavigateToRegister}
                                            className="w-full py-3 px-6 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <Sparkles className="w-4 h-4 text-[#a89aff] group-hover:rotate-12 transition-transform" />
                                            Crear Cuenta Nueva
                                        </button>
                                    </div>

                                    {/* Forgot Password */}
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            className="text-xs text-slate-500 hover:text-[#7b68ee] transition-colors font-bold uppercase tracking-widest"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    </div>
                                </form>

                                    {/* Footer */}
                                    <div className="mt-6 pt-6 border-t border-white/5 text-center">
                                        {/* Trust Badges */}
                                        <div className="flex items-center justify-center gap-6">
                                            {[
                                                { icon: Shield, label: 'Seguro' },
                                                { icon: CheckCircle2, label: 'Verificado' },
                                                { icon: Zap, label: 'Rápido' }
                                            ].map((badge, idx) => (
                                                <div key={idx} className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity cursor-default group">
                                                    <badge.icon className="w-3.5 h-3.5 text-[#7b68ee] group-hover:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{badge.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Animations Styles */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -30px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.5; }
                }
                
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                
                @keyframes gradient-xy {
                    0%, 100% { background-position: 0% 0%; }
                    25% { background-position: 100% 0%; }
                    50% { background-position: 100% 100%; }
                    75% { background-position: 0% 100%; }
                }
                
                @keyframes particle-float {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
                    10% { opacity: 0.4; }
                    90% { opacity: 0.4; }
                    50% { transform: translateY(-100vh) translateX(50px); }
                }
                
                @keyframes grid-move {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(50px); }
                }
                
                @keyframes pattern-move {
                    0% { transform: rotate(0deg) scale(1); }
                    100% { transform: rotate(360deg) scale(1.1); }
                }
                
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 3s ease infinite;
                }
                
                .animate-gradient-xy {
                    background-size: 400% 400%;
                    animation: gradient-xy 8s ease infinite;
                }
                
                .animate-shimmer {
                    background-size: 200% 100%;
                    animation: shimmer 3s linear infinite;
                }
                
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default Login;