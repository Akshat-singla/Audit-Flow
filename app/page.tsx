'use client';

import Navigation from '@/components/Navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const Hero3D = dynamic(() => import('@/components/Hero3D'), { ssr: false });

export default function HomePage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ zoom: '110%' }}>
            <Navigation />

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-4">
                {mounted && <Hero3D />}

                <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="mb-8">
                            <span className="px-3 py-1.5 border border-gray-700 text-gray-300 text-xs font-medium rounded-full tracking-wide">
                                #1 SMART CONTRACT DEPLOYMENT PLATFORM
                            </span>
                        </div>

                        <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                            Deploy & Audit
                            <br />
                            Smart Contracts
                            <br />
                            with Confidence.
                        </h1>

                        <p className="text-gray-400 text-base mb-8 max-w-md leading-relaxed">
                            Where Security Meets Simplicity in Blockchain Development.
                        </p>

                        <div className="flex flex-wrap gap-4 mb-12">
                            <Link
                                href="/deploy"
                                className="px-6 py-3 bg-white hover:bg-gray-100 text-black font-medium rounded-lg transition-all inline-flex items-center gap-2"
                            >
                                Get Started For Free
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8">
                            <div>
                                <div className="text-3xl font-bold text-indigo-400">10K+</div>
                                <div className="text-sm text-gray-500">Audits</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-indigo-400">50+</div>
                                <div className="text-sm text-gray-500">Networks</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-indigo-400">99.9%</div>
                                <div className="text-sm text-gray-500">Accuracy</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Content - Rotating Circle */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative flex items-center justify-center h-[600px]"
                    >
                        {/* Grid Background */}
                        <div className="absolute inset-0">
                            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="0.5" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#hero-grid)" />
                            </svg>
                        </div>

                        {/* Star Dots */}
                        <div className="absolute inset-0">
                            {[...Array(25)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 3}s`,
                                        animationDuration: `${2 + Math.random() * 2}s`
                                    }}
                                />
                            ))}
                        </div>

                        {/* Gradient Background - Red to Blue */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-red-600/40 via-purple-600/40 to-blue-600/40 rounded-full blur-3xl" />
                        </div>

                        {/* Rotating Earth */}
                        <div className="relative w-[500px] h-[500px] animate-spin-wheel z-10">
                            <div className="relative w-full h-full">
                                <Image
                                    src="/images/earth.png"
                                    alt="Rotating Earth"
                                    width={500}
                                    height={500}
                                    className="w-full h-full object-contain drop-shadow-2xl"
                                    priority
                                />

                                {/* Ambient glow */}
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-transparent to-purple-500/20 blur-3xl -z-10 rounded-full"></div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid Section */}
            <section className="relative py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 tracking-tight">
                            Complete Smart Contract Development Suite
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
                                title: 'Military-grade encryption',
                                desc: 'Advanced cryptographic protection for your contracts'
                            },
                            {
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
                                title: 'Decentralized network',
                                desc: 'Distributed architecture for maximum security'
                            },
                            {
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
                                title: 'Bulletproof cybersecurity',
                                desc: 'Industry-leading protection standards'
                            },
                            {
                                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                                title: 'Real-time threat monitoring',
                                desc: '24/7 security monitoring and alerts'
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 bg-black border border-gray-800 rounded-xl"
                            >
                                <div className="text-gray-400 mb-6 group-hover:text-white transition-colors">{item.icon}</div>
                                <h3 className="text-lg font-semibold mb-3 tracking-tight">{item.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3D Pyramid Section */}
            <section className="relative py-16 px-6 overflow-hidden">
                {/* 3D Pyramid Visual */}
                <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-40">
                    <div className="relative w-full h-full" style={{ perspective: '1000px' }}>
                        <div className="absolute inset-0" style={{
                            transform: 'rotateX(60deg) rotateZ(45deg)',
                            transformStyle: 'preserve-3d'
                        }}>
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 opacity-30"
                                style={{
                                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                                    transform: 'translateZ(0px)'
                                }} />
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 opacity-20"
                                style={{
                                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                                    transform: 'translateZ(-50px)'
                                }} />
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="px-3 py-1.5 border border-gray-700 text-gray-300 text-xs font-medium rounded-full tracking-wide mb-6 inline-block">
                            AI-POWERED SECURITY
                        </span>
                        <h2 className="text-4xl font-bold mb-6 tracking-tight leading-tight">
                            Detect Vulnerabilities
                            <br />
                            Before Deployment.
                        </h2>
                        <p className="text-gray-400 text-base mb-8 leading-relaxed">
                            Audit Flow leverages powerful AI and blockchain technology to provide industry-leading security analysis for your smart contracts.
                        </p>
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">AI Security Analysis</h3>
                                <p className="text-gray-500 text-sm">Advanced AI algorithms detect vulnerabilities and security issues before deployment.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Detailed Reports</h3>
                                <p className="text-gray-500 text-sm">Get comprehensive security reports with actionable recommendations.</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative h-[600px] flex items-center justify-center"
                    >
                        <div className="relative w-full h-full">
                            {/* Enhanced 3D Pyramid with glow effects */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    <Image
                                        src="/images/pyramid.png"
                                        alt="3D Pyramid"
                                        width={600}
                                        height={600}
                                        className="object-contain w-full h-full drop-shadow-2xl"
                                        priority
                                    />
                                    {/* Glowing base */}
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-4 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent blur-sm"></div>
                                    {/* Ambient glow */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 via-transparent to-purple-500/20 blur-3xl -z-10"></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Cube Section */}
            <section className="relative py-16 px-6 overflow-hidden">
                {/* 3D Cube Visual */}
                <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-[300px] h-[300px] opacity-50">
                    <div className="relative w-full h-full" style={{
                        perspective: '1000px',
                        transformStyle: 'preserve-3d',
                        transform: 'rotateX(20deg) rotateY(30deg)'
                    }}>
                        {/* Cube faces */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/30"
                            style={{ transform: 'translateZ(150px)' }} />
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/30"
                            style={{ transform: 'rotateY(90deg) translateZ(150px)' }} />
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/30 to-indigo-600/30 border border-pink-500/30"
                            style={{ transform: 'rotateY(180deg) translateZ(150px)' }} />
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/30"
                            style={{ transform: 'rotateY(-90deg) translateZ(150px)' }} />
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/30"
                            style={{ transform: 'rotateX(90deg) translateZ(150px)' }} />
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/30 to-indigo-600/30 border border-pink-500/30"
                            style={{ transform: 'rotateX(-90deg) translateZ(150px)' }} />
                    </div>
                </div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative h-[600px] flex items-center justify-center"
                    >
                        <div className="relative w-full h-full">
                            <Image
                                src="/images/buildeiingbox.png"
                                alt="3D Building Box"
                                width={600}
                                height={600}
                                className="object-contain w-full h-full"
                                priority
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="px-3 py-1.5 border border-gray-700 text-gray-300 text-xs font-medium rounded-full tracking-wide mb-6 inline-block">
                            COMPLETE WORKFLOW
                        </span>
                        <h2 className="text-4xl font-bold mb-6 tracking-tight leading-tight">
                            From Code to
                            <br />
                            Deployment in Minutes.
                        </h2>
                        <p className="text-gray-400 text-base mb-8 leading-relaxed">
                            With Audit Flow's streamlined workflow, you can write, compile, audit, and deploy your smart contracts seamlessly.
                        </p>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Multi-chain deployment</h3>
                                <p className="text-gray-500 text-sm">Deploy to 50+ networks including Ethereum, Polygon, BSC, and more.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Real-time monitoring</h3>
                                <p className="text-gray-500 text-sm">Track contract events and interactions in real-time with our monitoring tools.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works */}
            <section className="relative py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-300 mb-4 inline-block">
                            How It Works
                        </span>
                        <h2 className="text-4xl font-bold">
                            Secure Deployment Process
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { num: '1', title: 'Write Smart Contract', desc: 'Use our Monaco editor with full Solidity support and autocomplete' },
                            { num: '2', title: 'AI Security Analysis', desc: 'Detect vulnerabilities and security issues before deployment' },
                            { num: '3', title: 'Compile & Verify', desc: 'Automatic compilation with detailed error messages' },
                            { num: '4', title: 'Configure Parameters', desc: 'Set constructor arguments with an intuitive interface' },
                            { num: '5', title: 'Deploy to Network', desc: 'Deploy to 50+ networks with multi-chain support' },
                            { num: '6', title: 'Monitor & Interact', desc: 'Real-time event tracking and contract interaction' }
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 bg-black border border-gray-800 rounded-xl"
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white font-bold text-xl mb-4">
                                    {step.num}
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                                <p className="text-gray-500 text-sm">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials - Bento Style */}
            <section className="relative py-16 px-6">
                {/* Large 3D Sphere Bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-40">
                    <div className="relative w-full h-full">
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-600 via-purple-600 to-transparent rounded-full blur-3xl" />
                    </div>
                </div>

                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-300 mb-4 inline-block">
                            Trusted by Developers
                        </span>
                        <h2 className="text-4xl font-bold">
                            What Developers Say
                            <br />
                            <span className="text-indigo-400">About Audit Flow</span>
                        </h2>
                    </div>

                    {/* Bento Grid Layout - Symmetrical Rectangle */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Row 1 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0 }}
                            className="p-6 bg-black border border-gray-800 rounded-xl"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Sarah Chen" className="w-12 h-12 rounded-full" />
                                <div>
                                    <div className="font-semibold">Sarah Chen</div>
                                    <div className="text-xs text-gray-500">CEO, Imagine Agency</div>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                "Audit Flow's blockchain solutions have given us an impenetrable shield against cyber threats."
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="p-6 bg-black border border-gray-800 rounded-xl"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Steven" alt="Steven Richard" className="w-12 h-12 rounded-full" />
                                <div>
                                    <div className="font-bold">Steven Richard</div>
                                    <div className="text-xs text-gray-400">Creative Director, Purple Pixel Studio</div>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                "After a series of breaches last year, we knew we had to reinforce our cybersecurity measures. Audit Flow's real-time anomaly detection and 24/7 security operations center enabled us to achieve proactive threat detection response."
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="p-6 bg-black border border-gray-800 rounded-xl"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Christopher" alt="Christopher Adam" className="w-12 h-12 rounded-full" />
                                <div>
                                    <div className="font-bold">Christopher Adam</div>
                                    <div className="text-xs text-gray-400">CTO, DataSystems LLC</div>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                "Audit Flow is our go-to partner for cutting-edge blockchain security solutions. Highly recommended!"
                            </p>
                        </motion.div>

                        {/* Row 2 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="p-6 bg-black border border-gray-800 rounded-xl"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Benjamin" alt="Benjamin Paul" className="w-12 h-12 rounded-full" />
                                <div>
                                    <div className="font-bold">Benjamin Paul</div>
                                    <div className="text-xs text-gray-400">CTO, NetPropel</div>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                "Audit Flow enabled us to reduce security breaches by 75% with their real-time anomaly detection. Their team of security analysts also identified vulnerabilities we weren't aware of."
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="p-6 bg-black border border-gray-800 rounded-xl"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Christina" alt="Christina Blair" className="w-12 h-12 rounded-full" />
                                <div>
                                    <div className="font-bold">Christina Blair</div>
                                    <div className="text-xs text-gray-400">Co-Founder & CEO, CodeWrights</div>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                "Audit Flow's AI-powered threat detection gives us 360 degree protection we can count on."
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                            className="p-6 bg-black border border-gray-800 rounded-xl"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Matthew" alt="Matthew Lee" className="w-12 h-12 rounded-full" />
                                <div>
                                    <div className="font-bold">Matthew Lee</div>
                                    <div className="text-xs text-gray-400">CFO, Vista Media Group</div>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                "Thanks to Audit Flow, we can focus on our core business instead of worrying about security."
                            </p>
                        </motion.div>

                        {/* Row 3 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 }}
                            className="p-6 bg-black border border-gray-800 rounded-xl"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aaron" alt="Aaron Matthew" className="w-12 h-12 rounded-full" />
                                <div>
                                    <div className="font-bold">Aaron Matthew</div>
                                    <div className="text-xs text-gray-400">CFO, NumberNerds</div>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                "Audit Flow's robust encryption helps us meet the strictest industry compliance standards."
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.7 }}
                            className="p-6 bg-black border border-gray-800 rounded-xl"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Michael" alt="Michael Joseph" className="w-12 h-12 rounded-full" />
                                <div>
                                    <div className="font-bold">Michael Joseph</div>
                                    <div className="text-xs text-gray-400">Director of Engineering, LogicLogix</div>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                "I'd give Audit Flow's blockchain security an A+ rating for effectiveness and reliability."
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.8 }}
                            className="p-6 bg-black border border-gray-800 rounded-xl"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Gary" alt="Gary Christopher" className="w-12 h-12 rounded-full" />
                                <div>
                                    <div className="font-bold">Gary Christopher</div>
                                    <div className="text-xs text-gray-400">CTO, ContractCore LLC</div>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                "As the CTO of a major financial services firm, data security is my top priority. We reviewed numerous blockchain security solutions, but Audit Flow's offering stood head and shoulders above the rest. Their blockchain solutions have given us an impenetrable shield against cyber threats."
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="relative py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="px-3 py-1.5 border border-gray-700 text-gray-300 text-xs font-medium rounded-full tracking-wide mb-6 inline-block">
                            GOT QUESTIONS?
                        </span>
                        <h2 className="text-4xl font-bold tracking-tight">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            { q: 'What blockchain networks does Audit Flow support?', a: 'Audit Flow supports 50+ networks including Ethereum, Polygon, BSC, Avalanche, Arbitrum, Optimism, and custom EVM-compatible networks.' },
                            { q: 'How does the AI security analysis work?', a: 'Our AI analyzes your Solidity code for common vulnerabilities like reentrancy attacks, integer overflows, access control issues, and more. You get a detailed report before deployment.' },
                            { q: 'Can I interact with my deployed contracts?', a: 'Yes! Audit Flow provides a built-in contract interaction interface. Call read/write functions, monitor events in real-time, and export event data.' },
                            { q: 'Do you support constructor arguments?', a: 'Absolutely. Audit Flow automatically detects constructor parameters and provides a user-friendly interface to input values before deployment.' }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl hover:border-indigo-500/50 transition-all cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">{item.q}</span>
                                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative py-16 px-6">
                {/* Large gradient glow at bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[400px]">
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl" />
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <h2 className="text-6xl font-bold mb-6">
                        Start Securing Your
                        <br />
                        <span className="text-indigo-400">Smart Contracts Today</span>
                    </h2>
                    <p className="text-xl text-gray-400 mb-10">
                        Join thousands of developers who trust Audit Flow
                    </p>
                    <Link
                        href="/deploy"
                        className="inline-block px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-lg transition-all"
                    >
                        Get Started Now
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-12 px-6 border-t border-gray-900">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg" />
                        <span className="font-semibold">Audit Flow</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                        © 2025 Audit Flow. Secure smart contract deployment.
                    </p>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes spin-wheel {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                .animate-spin-wheel {
                    animation: spin-wheel 20s linear infinite;
                }
            `}</style>
        </div>
    );
}
