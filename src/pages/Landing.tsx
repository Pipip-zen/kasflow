import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MessageSquare, Receipt } from 'lucide-react';

const Landing: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full flex flex-col min-h-[calc(100vh-2rem)] overflow-x-hidden">
            {/* Navbar Minimalist */}
            <header className="flex items-center justify-between py-6 px-4 md:px-8 w-full max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-xl">K</div>
                    <span className="text-xl font-bold tracking-tight text-foreground">KasFlow</span>
                </div>
                <button
                    onClick={() => navigate('/auth')}
                    className="text-sm font-medium text-green-700 hover:text-green-800 transition-colors bg-green-50 px-4 py-2 rounded-full hidden sm:block"
                >
                    Masuk Bendahara
                </button>
            </header>

            <main className="flex-1 w-full flex flex-col items-center">
                {/* Hero Section */}
                <section className="w-full max-w-6xl mx-auto px-4 py-16 md:py-24 lg:py-32 flex flex-col items-center text-center">
                    <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-800 mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-green-600 mr-2"></span>
                        Aplikasi khusus Bendahara
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mb-6">
                        <span className="text-green-600 block mb-2">KasFlow</span>
                        Tagih Kas Tanpa Rasa Nggak Enak
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
                        Aplikasi manajemen kas kolektif pertama di mana <span className="font-semibold text-foreground">hanya bendahara yang butuh akun</span>. Kirim tagihan otomatis via WhatsApp.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4">
                        <button
                            onClick={() => navigate('/auth')}
                            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-green-600/25 flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            Mulai Gratis <ArrowRight className="w-5 h-5" />
                        </button>
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
                            { icon: MessageSquare, title: 'Kirim WA Otomatis', desc: 'KasFlow kirim link tagihan ke WhatsApp semua anggota.' },
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
                <p>© {new Date().getFullYear()} KasFlow. Dibuat untuk meringankan beban bendahara.</p>
            </footer>
        </div>
    );
};

export default Landing;
