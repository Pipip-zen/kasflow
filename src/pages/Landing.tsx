import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MessageSquare, Receipt, Menu, X, Check, Mail } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
const Landing: React.FC = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="w-full flex flex-col min-h-[calc(100vh-2rem)] overflow-x-hidden relative">
            {/* Background Elements */}
            <div
                className="absolute inset-0 -z-10 bg-slate-50"
                style={{ backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/80 to-white"></div>
            </div>
            <div className="absolute top-20 left-10 w-64 h-64 bg-green-300/30 rounded-full blur-[80px] -z-10 animate-pulse"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-[80px] -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

            {/* Navbar Minimalist */}
            <header className="flex items-center justify-between py-6 px-4 md:px-8 w-full max-w-7xl mx-auto relative z-20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-xl">K</div>
                    <span className="text-xl font-bold tracking-tight text-foreground">KasFlow</span>
                </div>

                {/* Desktop Nav */}
                <div className="hidden sm:flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/auth?mode=login')}
                        className="border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800 rounded-full px-6"
                    >
                        Masuk
                    </Button>
                    <Button
                        onClick={() => navigate('/auth?mode=register')}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6"
                    >
                        Daftar
                    </Button>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="sm:hidden text-slate-600 p-2"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>

                {/* Mobile Nav Dropdown */}
                {isMenuOpen && (
                    <div className="absolute top-full left-4 right-4 bg-white border rounded-xl shadow-lg p-4 flex flex-col gap-3 sm:hidden animate-in slide-in-from-top-2 fade-in">
                        <Button
                            variant="outline"
                            onClick={() => { setIsMenuOpen(false); navigate('/auth?mode=login'); }}
                            className="w-full border-green-600 text-green-700 hover:bg-green-50 justify-center rounded-full"
                        >
                            Masuk
                        </Button>
                        <Button
                            onClick={() => { setIsMenuOpen(false); navigate('/auth?mode=register'); }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white justify-center rounded-full"
                        >
                            Daftar
                        </Button>
                    </div>
                )}
            </header>

            <main className="flex-1 w-full flex flex-col items-center">
                {/* Hero Section */}
                <section className="w-full max-w-7xl mx-auto px-4 py-12 md:py-20 lg:py-28 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

                        {/* Left Column: Text & CTA */}
                        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-3xl mb-6 leading-tight">
                                <span className="text-green-600 block mb-2">KasFlow</span>
                                Tagih Kas Tanpa Ribet
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
                                Aplikasi <span className="font-semibold text-foreground"> manajemen kas </span> kolektif. Kirim tagihan otomatis via Email. Pantau pemasukan kas secara real-time.
                            </p>

                            <div className="flex flex-col w-full sm:w-auto px-4 lg:px-0 mb-8">
                                <button
                                    onClick={() => navigate('/auth?mode=register')}
                                    className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-green-600/25 flex items-center justify-center gap-2 w-full sm:w-auto block"
                                >
                                    Mulai Gratis <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm font-medium text-slate-500">
                                <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Gratis</span>
                                <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Tanpa ribet</span>
                                <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Langsung terkirim</span>
                            </div>
                        </div>

                        {/* Right Column: Visual Mockup */}
                        <div className="hidden lg:block relative w-full h-full min-h-[500px] xl:min-h-[550px]">
                            {/* Card 1: Main Summary */}
                            <Card className="w-full max-w-[360px] mx-auto absolute right-16 xl:right-24 top-16 shadow-2xl border-slate-200/60 bg-white/95 backdrop-blur-sm z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                            <Receipt className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg leading-tight">Iuran Bulanan Maret</h3>
                                            <p className="text-sm text-slate-500 mt-1">Rp 50.000 per anggota</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-md">8/10 sudah bayar</span>
                                        </div>
                                        <div className="relative pt-1">
                                            <div className="flex mb-2 items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-semibold inline-block text-slate-500">
                                                        Deadline: 31 Mar 2026
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-slate-100">
                                                <div style={{ width: "80%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-1000 ease-out"></div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 2: Notification Overlap */}
                            <Card className="absolute -right-4 top-0 shadow-xl border-green-100 bg-white z-20 animate-in zoom-in fade-in delay-500 duration-700">
                                <CardContent className="p-3 pl-4 pr-5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 animate-pulse">
                                        <Mail className="w-5 h-5 fill-current" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-800">Email terkirim!</h4>
                                        <p className="text-xs text-slate-500 font-medium">10 anggota notified</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 3: Member Status Overlap */}
                            <Card className="absolute left-0 xl:left-8 bottom-4 shadow-xl border-slate-200/80 bg-white/95 backdrop-blur z-20 flex flex-col gap-3 p-4 animate-in slide-in-from-left-8 fade-in delay-700 duration-700 min-w-[220px]">
                                <div className="flex items-center gap-3 text-sm">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span className="font-semibold text-slate-700">Budi</span>
                                    <span className="ml-auto font-bold text-slate-800">Rp 50.000</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <span className="font-semibold text-slate-700">Siti</span>
                                    <span className="ml-auto font-bold text-slate-800">Rp 50.000</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-amber-500 animate-spin"></div>
                                    <span className="font-semibold text-slate-700">Andi</span>
                                    <span className="ml-auto font-bold text-amber-500 text-xs bg-amber-50 px-2 py-1 rounded">Menunggu</span>
                                </div>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Problem Section */}
                <section className="w-full bg-slate-50 border-y border-slate-100 py-16 md:py-24">
                    <div className="max-w-5xl mx-auto px-4 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-12">Pusing jadi bendahara?</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: 'Ribet Chat Satu-satu', desc: 'Copy paste pesan ke puluhan anggota tiap minggu.' },
                                { title: 'Catatan Berantakan', desc: 'Buku rekap hilang atau bingung cari riwayat transfer.' },
                                { title: 'Nggak Enak Nagih', desc: 'Sungkan nanyain hutang kas ke teman sendiri.' }
                            ].map((prob, i) => (
                                <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl font-bold mb-6 mx-auto">!</div>
                                    <h3 className="text-xl font-bold mb-3">{prob.title}</h3>
                                    <p className="text-muted-foreground">{prob.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Solution / How it Works */}
                <section className="w-full max-w-5xl mx-auto px-4 py-16 md:py-24">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Solusi Super Simpel</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Cukup 3 langkah mudah, kas terkumpul otomatis.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-green-100 -z-10"></div>

                        {[
                            { icon: Receipt, title: 'Buat Tagihan', desc: 'Bendahara input nominal tagihan Kas bulanan atau mingguan.' },
                            { icon: MessageSquare, title: 'Kirim Email Otomatis', desc: 'KasFlow kirim link tagihan ke Email semua anggota.' },
                            { icon: CheckCircle2, title: 'Pantau Pembayaran', desc: 'Anggota bayar langsung tanpa akun, saldo terupdate.' }
                        ].map((step, i) => (
                            <div key={i} className="flex flex-col items-center text-center relative bg-background">
                                <div className="w-24 h-24 rounded-full bg-green-50 border-4 border-white shadow-sm flex items-center justify-center mb-6 text-green-600">
                                    <step.icon className="w-10 h-10" />
                                </div>
                                <div className="absolute top-0 right-0 md:-right-6 w-8 h-8 rounded-full bg-green-600 text-white font-bold flex items-center justify-center shadow-sm">
                                    {i + 1}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Footer minimal */}
            <footer className="w-full py-8 text-center text-muted-foreground text-sm border-t border-border mt-auto">
                <p>© {new Date().getFullYear()} KasFlow. Reserved By Rafif Nuha.</p>
            </footer>
        </div>
    );
};

export default Landing;
