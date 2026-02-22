import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Loader2, ArrowRight, Sparkles, Rocket, Check, X as XIcon, Shield, CheckCircle2, Users, Zap } from 'lucide-react';
import { authService } from '../services/auth';
import { firebaseAuthService } from '../services/firebaseAuth';
import { FIREBASE_ENABLED } from '../services/firebase';
import { Role } from '../types';

interface RegisterProps {
    onRegisterSuccess: () => void;
    onNavigateToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onNavigateToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Password Security State
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [requirements, setRequirements] = useState({
        length: false,
        upper: false,
        lower: false,
        number: false,
        special: false
    });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const rules = {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[@$!%*?&]/.test(password)
        };

        setRequirements(rules);

        const passedRules = Object.values(rules).filter(Boolean).length;
        setPasswordStrength((passedRules / 5) * 100);
    }, [password]);

    const getStrengthColor = () => {
        if (passwordStrength <= 20) return 'bg-red-500';
        if (passwordStrength <= 40) return 'bg-orange-500';
        if (passwordStrength <= 60) return 'bg-yellow-500';
        if (passwordStrength <= 80) return 'bg-lime-500';
        return 'bg-green-500';
    };

    const getStrengthLabel = () => {
        if (passwordStrength <= 20) return 'Muy débil';
        if (passwordStrength <= 40) return 'Débil';
        if (passwordStrength <= 60) return 'Aceptable';
        if (passwordStrength <= 80) return 'Fuerte';
        return 'Muy fuerte';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (FIREBASE_ENABLED) {
                await firebaseAuthService.register(name, email, password, Role.DEVELOPER);
            } else {
                await authService.register(name, email, password, Role.DEVELOPER);
            }
            onRegisterSuccess();
        } catch (err: any) {
            setError(err?.message || err?.toString() || 'Error al registrarse');
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
                            <Rocket className="w-5 h-5 text-[#a89aff] animate-pulse" />
                            <div className="absolute inset-0 blur-md bg-[#7b68ee] opacity-50 animate-pulse" />
                        </div>
                        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#a89aff] to-white">
                            Comienza tu viaje hoy • 100% Gratis
                        </span>
                    </div>

                    {/* Hero Title with Advanced Animations */}
                    <div className="space-y-6 animate-in slide-in-from-left duration-1000 delay-150">
                        <h1 className="text-6xl lg:text-8xl font-black tracking-tight leading-none">
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 animate-gradient-x drop-shadow-2xl">
                                Únete a
                            </span>
                            <span className="relative inline-block mt-2">
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#7b68ee] via-purple-400 to-pink-400 font-black animate-gradient-x">
                                    GestorTasks AI
                                </span>
                                {/* Glow Effect */}
                                <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-[#7b68ee] via-purple-400 to-pink-400 opacity-30 animate-pulse" />
                                {/* Underline Animation */}
                                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-[#7b68ee] via-purple-400 to-pink-400 rounded-full animate-shimmer" />
                            </span>
                        </h1>
                        <p className="text-xl text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium animate-in fade-in duration-1000 delay-300">
                            Crea tu cuenta en <span className="text-[#a89aff] font-bold">segundos</span> y accede a la plataforma
                            de gestión más avanzada del mercado.
                        </p>
                    </div>

                    {/* Benefits with Icons */}
                    <div className="hidden lg:grid grid-cols-1 gap-4 pt-6">
                        {[
                            { icon: Zap, title: 'Configuración Instantánea', desc: 'Listo para usar en menos de 2 minutos', color: 'from-[#7b68ee] to-purple-600', delay: '0ms' },
                            { icon: Users, title: 'Colaboración en Equipo', desc: 'Invita a tu equipo sin límites', color: 'from-purple-500 to-pink-500', delay: '150ms' },
                            { icon: Shield, title: '100% Seguro', desc: 'Tus datos protegidos con encriptación', color: 'from-pink-500 to-rose-500', delay: '300ms' }
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
                                <Check className="w-5 h-5 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>

                    {/* Trust Indicators */}
                    <div className="hidden lg:flex items-center gap-6 pt-4 animate-in fade-in duration-1000 delay-500">
                        {[
                            { icon: CheckCircle2, text: 'Sin tarjeta de crédito' },
                            { icon: Shield, text: 'Datos encriptados' },
                            { icon: Zap, text: 'Acceso instantáneo' }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-slate-400 group cursor-default">
                                <item.icon className="w-4 h-4 text-[#7b68ee] group-hover:scale-110 transition-transform" />
                                <span className="group-hover:text-slate-300 transition-colors">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Ultra Premium Register Form */}
                <div className="w-full max-w-md xl:max-w-2xl animate-in slide-in-from-right duration-1000">
                    <div className="relative group/card">
                        {/* Animated Border Glow */}
                        <div className="absolute -inset-[1px] bg-gradient-to-r from-[#7b68ee] via-purple-500 to-pink-500 rounded-[2.5rem] opacity-0 group-hover/card:opacity-100 blur-xl transition-opacity duration-1000 animate-gradient-xy" />

                        {/* Main Card */}
                        <div className="relative bg-gradient-to-br from-[#1a1a2e]/90 via-[#16213e]/90 to-[#0f0f1a]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden">

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
                                <div className="text-center mb-10 space-y-3">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7b68ee] to-purple-600 shadow-lg shadow-[#7b68ee]/30 mb-4 animate-bounce-slow">
                                        <Rocket className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                                        Crear cuenta nueva
                                    </h2>
                                    <p className="text-slate-400 text-base">
                                        Completa tus datos y comienza en segundos
                                    </p>
                                </div>

                                {/* Error Message with Animation */}
                                {error && (
                                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl text-sm flex items-center gap-3 animate-in slide-in-from-top duration-300">
                                        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                        <span className="flex-1">{error}</span>
                                    </div>
                                )}

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        {/* Name Input */}
                                        <div className="space-y-3 group/field">
                                            <label className="text-xs font-black text-[#a89aff] ml-1 uppercase tracking-widest flex items-center gap-2">
                                                <User className="w-3 h-3" />
                                                Nombre Completo
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-gradient-to-r from-[#7b68ee]/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-focus-within/field:opacity-100 transition-opacity duration-500" />
                                                <div className="relative group/input">
                                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within/input:text-[#7b68ee] transition-all duration-300 group-focus-within/input:scale-110" />
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="w-full pl-14 pr-5 py-4 bg-black/30 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7b68ee]/50 focus:ring-2 focus:ring-[#7b68ee]/20 focus:bg-black/40 transition-all duration-300 font-medium"
                                                        placeholder="Ej: Sofia Martínez"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Email Input */}
                                        <div className="space-y-3 group/field">
                                            <label className="text-xs font-black text-[#a89aff] ml-1 uppercase tracking-widest flex items-center gap-2">
                                                <Mail className="w-3 h-3" />
                                                Email Profesional
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-focus-within/field:opacity-100 transition-opacity duration-500" />
                                                <div className="relative group/input">
                                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within/input:text-[#7b68ee] transition-all duration-300 group-focus-within/input:scale-110" />
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="w-full pl-14 pr-5 py-4 bg-black/30 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7b68ee]/50 focus:ring-2 focus:ring-[#7b68ee]/20 focus:bg-black/40 transition-all duration-300 font-medium"
                                                        placeholder="sofia@empresa.com"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Password Input */}
                                        <div className="xl:col-span-2 space-y-3 group/field">
                                            <label className="text-xs font-black text-[#a89aff] ml-1 uppercase tracking-widest flex items-center gap-2">
                                                <Lock className="w-3 h-3" />
                                                Contraseña Segura
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-2xl blur-xl opacity-0 group-focus-within/field:opacity-100 transition-opacity duration-500" />
                                                <div className="relative group/input">
                                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within/input:text-[#7b68ee] transition-all duration-300 group-focus-within/input:scale-110" />
                                                    <input
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="w-full pl-14 pr-5 py-4 bg-black/30 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7b68ee]/50 focus:ring-2 focus:ring-[#7b68ee]/20 focus:bg-black/40 transition-all duration-300 font-medium"
                                                        placeholder="••••••••••••"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Password Strength Indicator */}
                                            {password && (
                                                <div className="mt-4 space-y-4 animate-in slide-in-from-top duration-300">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-slate-400 font-bold">Seguridad de contraseña</span>
                                                            <span className={`font-black ${passwordStrength <= 40 ? 'text-red-400' :
                                                                passwordStrength <= 60 ? 'text-yellow-400' :
                                                                    passwordStrength <= 80 ? 'text-lime-400' :
                                                                        'text-green-400'
                                                                }`}>
                                                                {getStrengthLabel()}
                                                            </span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                                            <div
                                                                className={`h-full transition-all duration-500 ${getStrengthColor()} shadow-lg`}
                                                                style={{
                                                                    width: `${passwordStrength}%`,
                                                                    boxShadow: `0 0 20px ${passwordStrength <= 40 ? 'rgba(239, 68, 68, 0.5)' :
                                                                            passwordStrength <= 60 ? 'rgba(234, 179, 8, 0.5)' :
                                                                                passwordStrength <= 80 ? 'rgba(132, 204, 22, 0.5)' :
                                                                                    'rgba(34, 197, 94, 0.5)'
                                                                        }`
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        {[
                                                            { key: 'length', label: 'Mín. 8 caracteres' },
                                                            { key: 'upper', label: 'Mayúscula' },
                                                            { key: 'lower', label: 'Minúscula' },
                                                            { key: 'number', label: 'Número' },
                                                            { key: 'special', label: 'Especial (@$!%*)' }
                                                        ].map((req) => (
                                                            <div
                                                                key={req.key}
                                                                className={`flex items-center gap-2 text-xs transition-all duration-300 ${requirements[req.key as keyof typeof requirements]
                                                                        ? 'text-green-400'
                                                                        : 'text-slate-500'
                                                                    }`}
                                                            >
                                                                <div className={`flex items-center justify-center w-4 h-4 rounded-full transition-all duration-300 ${requirements[req.key as keyof typeof requirements]
                                                                        ? 'bg-green-500/20 border border-green-500/50'
                                                                        : 'border border-slate-600'
                                                                    }`}>
                                                                    {requirements[req.key as keyof typeof requirements] && (
                                                                        <Check className="w-3 h-3 text-green-400" />
                                                                    )}
                                                                </div>
                                                                <span className="font-medium">{req.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submit Button with Advanced Animation */}
                                    <button
                                        type="submit"
                                        disabled={isLoading || passwordStrength < 60}
                                        className={`relative w-full py-5 mt-8 rounded-2xl font-black text-lg shadow-2xl transition-all duration-500 flex items-center justify-center gap-3 group/btn overflow-hidden
                                            ${(isLoading || passwordStrength < 60)
                                                ? 'opacity-50 cursor-not-allowed bg-slate-700'
                                                : 'hover:scale-[1.02] active:scale-[0.98] hover:shadow-[#7b68ee]/50'
                                            }
                                        `}
                                    >
                                        {/* Animated Gradient Background */}
                                        <div className={`absolute inset-0 bg-gradient-to-r from-[#7b68ee] via-purple-600 to-pink-500 transition-opacity duration-300 ${(isLoading || passwordStrength < 60) ? 'opacity-0' : 'opacity-100'}`} />
                                        <div className={`absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-600 to-[#7b68ee] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 ${(isLoading || passwordStrength < 60) ? 'hidden' : ''}`} />

                                        {/* Shimmer Effect */}
                                        <div className={`absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent ${(isLoading || passwordStrength < 60) ? 'hidden' : ''}`} />

                                        {/* Button Content */}
                                        <span className="relative z-10 flex items-center gap-3 text-white">
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                    <span>Creando tu cuenta...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Crear Cuenta Gratis</span>
                                                    <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform duration-300" />
                                                </>
                                            )}
                                        </span>
                                    </button>

                                    {/* Terms Notice */}
                                    <p className="text-xs text-center text-slate-500 mt-4">
                                        Al registrarte, aceptas nuestros{' '}
                                        <a href="#" className="text-[#7b68ee] hover:text-[#a89aff] transition-colors underline">
                                            Términos de Servicio
                                        </a>
                                        {' '}y{' '}
                                        <a href="#" className="text-[#7b68ee] hover:text-[#a89aff] transition-colors underline">
                                            Política de Privacidad
                                        </a>
                                    </p>
                                </form>

                                {/* Footer */}
                                <div className="mt-10 pt-8 border-t border-white/5 text-center space-y-4">
                                    <p className="text-slate-400 text-sm">
                                        ¿Ya tienes cuenta?{' '}
                                        <button
                                            onClick={onNavigateToLogin}
                                            className="text-[#7b68ee] hover:text-[#a89aff] font-bold hover:underline transition-all inline-flex items-center gap-1 group/link"
                                        >
                                            Inicia sesión
                                            <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                                        </button>
                                    </p>

                                    {/* Trust Badges */}
                                    <div className="flex items-center justify-center gap-6 pt-4 opacity-50">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Shield className="w-4 h-4" />
                                            <span>SSL Seguro</span>
                                        </div>
                                        <div className="w-px h-4 bg-slate-700" />
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>GDPR Compliant</span>
                                        </div>
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

export default Register;
