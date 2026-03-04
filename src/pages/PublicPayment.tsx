import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type Payment } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { CheckCircle2, ShieldCheck, Wallet } from 'lucide-react';

type PublicPaymentRecord = Payment & {
    members: { nama: string };
    bills: { judul: string; nominal: number; deadline: string; groups: { nama: string } };
};

const PublicPayment: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [payment, setPayment] = useState<PublicPaymentRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError("Token tidak valid.");
            setLoading(false);
            return;
        }

        api.getPaymentByToken(token)
            .then(data => {
                setPayment(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError("Tagihan tidak ditemukan atau token tidak valid.");
                setLoading(false);
            });
    }, [token]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg border-none">
                    <CardHeader className="text-center pb-2">
                        <Skeleton className="h-6 w-32 mx-auto mb-2" />
                        <Skeleton className="h-4 w-48 mx-auto" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !payment) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg border-none text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl text-red-600 font-bold">!</span>
                    </div>
                    <CardTitle className="mb-2">Gagal Memuat Tagihan</CardTitle>
                    <p className="text-muted-foreground mb-6">{error}</p>
                </Card>
            </div>
        );
    }

    const { bills, members } = payment;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8">
            {/* Branding Header */}
            <div className="mb-8 mt-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-800">KasFlow <span className="text-green-600 font-normal shadow-none">Pay</span></span>
            </div>

            <Card className="w-full max-w-md shadow-xl border-none overflow-hidden">
                <div className="bg-slate-900 h-2 w-full"></div>
                <CardHeader className="text-center pb-2 pt-8">
                    <CardDescription className="uppercase tracking-widest text-xs font-semibold text-green-600 mb-1">
                        INVOICE TAGIHAN
                    </CardDescription>
                    <CardTitle className="text-2xl">
                        {bills.judul}
                    </CardTitle>
                    <p className="text-muted-foreground">{bills.groups.nama}</p>
                </CardHeader>

                <CardContent className="pt-6">
                    <div className="flex flex-col gap-5">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center mb-2">
                            <span className="text-sm font-medium text-slate-500 mb-1">Total Tagihan</span>
                            <span className="text-4xl font-extrabold tracking-tight text-slate-900">{formatCurrency(bills.nominal)}</span>
                        </div>

                        <div className="flex justify-between items-center py-3 border-b border-slate-100">
                            <span className="text-muted-foreground text-sm">Nama Anggota</span>
                            <span className="font-semibold text-slate-900">{members.nama}</span>
                        </div>

                        <div className="flex justify-between items-center py-3 border-b border-slate-100">
                            <span className="text-muted-foreground text-sm">Batas Waktu</span>
                            <span className="font-medium text-slate-900">
                                {new Date(bills.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>

                        <div className="flex justify-between items-center py-3">
                            <span className="text-muted-foreground text-sm">Status Pembayaran</span>
                            {payment.status === 'paid' ? (
                                <span className="flex items-center text-green-700 font-bold text-sm bg-green-100 px-3 py-1 rounded-full">
                                    <CheckCircle2 className="w-4 h-4 mr-1" /> LUNAS
                                </span>
                            ) : (
                                <span className="flex items-center text-amber-700 font-bold text-sm bg-amber-100 px-3 py-1 rounded-full">
                                    BELUM DIBAYAR
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="pt-4 pb-8 flex-col gap-4">
                    {payment.status === 'paid' ? (
                        <div className="w-full p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-green-800">
                            <CheckCircle2 className="w-6 h-6 shrink-0 text-green-600" />
                            <div>
                                <p className="font-semibold text-sm mb-1">Pembayaran Diterima</p>
                                <p className="text-xs text-green-700 opacity-90">Terima kasih, pembayaran Anda telah tercatat otomatis di sistem KasFlow.</p>
                            </div>
                        </div>
                    ) : payment.payment_url ? (
                        <Button
                            className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
                            onClick={() => {
                                window.open(payment.payment_url!, '_blank', 'noopener,noreferrer');
                            }}
                        >
                            <Wallet className="w-5 h-5 mr-2" />
                            Bayar Sekarang
                        </Button>
                    ) : (
                        <Button
                            className="w-full py-6 text-base bg-slate-300 hover:bg-slate-300 text-slate-600 cursor-not-allowed shadow-none"
                            disabled
                        >
                            Link pembayaran sedang diproses, coba beberapa saat lagi
                        </Button>
                    )}

                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Pembayaran Aman diverifikasi oleh Mayar.id</span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default PublicPayment;
