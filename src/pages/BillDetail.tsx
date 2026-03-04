import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, type Bill, type Payment, type Member } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table"
import { ArrowLeft, CheckCircle2, XCircle, MessageCircle, PlayCircle, StopCircle } from 'lucide-react';
import { toast } from 'sonner';

type PaymentWithMember = Payment & { members: Member };
type BillExtended = Bill & { total_members: number, paid_count: number, progress: number };

const BillDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [bill, setBill] = useState<BillExtended | null>(null);
    const [payments, setPayments] = useState<PaymentWithMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    useEffect(() => {
        if (!id || !user) return;
        fetchDetail();
    }, [id, user]);

    const fetchDetail = async () => {
        try {
            setLoading(true);
            const [billData, paymentData] = await Promise.all([
                api.getBillDetail(id!),
                api.getBillPayments(id!)
            ]);
            setBill(billData as BillExtended);
            setPayments(paymentData);
        } catch (error) {
            console.error("Failed to fetch detail:", error);
            navigate('/bills');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (status: 'active' | 'closed') => {
        if (!bill) return;

        // Safety Prompts
        if (status === 'closed' && !window.confirm("Tutup tagihan ini? Anggota tidak akan bisa membayar lagi via link payment.")) return;

        setIsUpdatingStatus(true);
        try {
            await api.updateBillStatus(bill.id, status);
            setBill({ ...bill, status });
            toast.success("Status tagihan berhasil ditutup.");
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("Gagal merubah status tagihan.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleActivateTagihan = async () => {
        if (!bill) return;
        if (!window.confirm("Aktifkan tagihan ini? Sistem akan mengirimkan pesan Email ke semua anggota secara otomatis.")) return;

        setIsUpdatingStatus(true);
        toast.loading("Memproses dan mengirimkan pesan Email...", { id: 'activate-bill' });

        try {
            const result = await api.activateBill(bill.id);
            setBill({ ...bill, status: 'active' });

            // Re-fetch payments to ensure tokens align locally if needed
            const updatedPayments = await api.getBillPayments(bill.id);
            setPayments(updatedPayments);

            toast.success(`Tagihan aktif! Terkirim: ${result.total_sent} pesan Email.`, {
                id: 'activate-bill',
                description: result.failed.length > 0 ? `Gagal mengirim ke: ${result.failed.join(', ')}` : undefined
            });
        } catch (error) {
            console.error("Failed to activate bill", error);
            toast.error("Gagal mengaktifkan tagihan.", { id: 'activate-bill' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleRemindTagihan = async () => {
        if (!bill) return;
        if (!window.confirm("Kirim ulang pengingat Email ke anggota yang BELUM terbayar?")) return;

        setIsUpdatingStatus(true);
        toast.loading("Mengirimkan pengingat Email...", { id: 'remind-bill' });

        try {
            const result = await api.remindBill(bill.id);
            toast.success(`Pengingat Email berhasil terkirim ke ${result.total_sent} anggota.`, { id: 'remind-bill' });
        } catch (error) {
            console.error("Failed to send reminder", error);
            toast.error("Gagal mengirimkan pengingat Email.", { id: 'remind-bill' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getBadgeVariant = (status: string) => {
        switch (status) {
            case 'active': return 'default';
            case 'closed': return 'secondary';
            default: return 'outline';
        }
    };

    const renderTable = (filter: 'all' | 'paid' | 'pending') => {
        let filtered = payments;
        if (filter !== 'all') {
            filtered = payments.filter(p => p.status === filter);
        }

        if (filtered.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg bg-slate-50">
                    Tidak ada data dengan filter terkait.
                </div>
            );
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama Anggota</TableHead>
                        <TableHead>Alamat Email</TableHead>
                        <TableHead>Tanggal Bayar</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filtered.map(payment => (
                        <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.members.nama}</TableCell>
                            <TableCell>{payment.members.email || '-'}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('id-ID') : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                                {payment.status === 'paid' ? (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Sudah
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                        <XCircle className="w-3 h-3 mr-1" /> Belum
                                    </Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    if (loading) {
        return (
            <div className="w-full space-y-6">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (!bill) return null;

    const totalTerkumpul = bill.paid_count * bill.nominal;
    const totalPotensi = bill.total_members * bill.nominal;

    return (
        <div className="w-full space-y-6 pb-12">
            <Button variant="ghost" className="mb-2 -ml-3 text-muted-foreground" onClick={() => navigate('/bills')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali k Daftar Tagihan
            </Button>

            {/* Header Info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-4 p-6 bg-white border rounded-xl shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">{bill.judul}</h1>
                        <Badge variant={getBadgeVariant(bill.status) as any} className={bill.status === 'active' ? 'bg-blue-100 text-blue-800' : ''}>
                            {bill.status.toUpperCase()}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground font-medium text-sm flex items-center gap-2">
                        Grup: <span className="text-slate-800">{bill.groups?.nama}</span>
                        <span className="text-slate-300">|</span>
                        Deadline: <span className="text-slate-800">{new Date(bill.deadline).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </p>
                </div>

                {/* Desktop Action Buttons */}
                <div className="hidden md:flex gap-2">
                    {bill.status === 'draft' && (
                        <Button onClick={handleActivateTagihan} disabled={isUpdatingStatus} className="bg-blue-600 hover:bg-blue-700">
                            <PlayCircle className="w-4 h-4 mr-2" /> Aktifkan & Kirim Email
                        </Button>
                    )}

                    {(bill.status === 'active' || bill.status === 'draft') && (
                        <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50" onClick={handleRemindTagihan} disabled={isUpdatingStatus}>
                            <MessageCircle className="w-4 h-4 mr-2" /> Kirim Pengingat Email
                        </Button>
                    )}

                    {bill.status === 'active' && (
                        <Button onClick={() => handleUpdateStatus('closed')} disabled={isUpdatingStatus} variant="secondary">
                            <StopCircle className="w-4 h-4 mr-2" /> Tutup Tagihan
                        </Button>
                    )}
                </div>
            </div>

            {/* Progress Section */}
            <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-4 gap-4">
                        <div>
                            <p className="text-sm font-medium text-green-800 mb-1">Total Kas Terkumpul</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-900">{formatCurrency(totalTerkumpul)}</span>
                                <span className="text-sm text-slate-500 font-medium">/ {formatCurrency(totalPotensi)}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-600 mb-1">Target Anggota</p>
                            <p className="text-lg font-bold text-slate-900">{bill.paid_count} <span className="text-sm font-normal text-muted-foreground">dari {bill.total_members} Lunas</span></p>
                        </div>
                    </div>
                    <Progress value={bill.progress} className="h-3 bg-green-200/50" />
                </CardContent>
            </Card>

            {/* Table Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Rincian Pembayaran</CardTitle>
                    <CardDescription>
                        Pantau status pembayaran setiap anggota secara real-time.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="all">Semua ({payments.length})</TabsTrigger>
                            <TabsTrigger value="paid" className="text-green-700 data-[state=active]:bg-green-100">Sudah Bayar</TabsTrigger>
                            <TabsTrigger value="pending" className="text-red-700 data-[state=active]:bg-red-100">Belum Bayar</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="mt-0 border-none p-0 outline-none">
                            {renderTable('all')}
                        </TabsContent>

                        <TabsContent value="paid" className="mt-0 border-none p-0 outline-none">
                            {renderTable('paid')}
                        </TabsContent>

                        <TabsContent value="pending" className="mt-0 border-none p-0 outline-none">
                            {renderTable('pending')}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Mobile Action Buttons (Sticky Bottom) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex flex-col gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                {bill.status === 'draft' && (
                    <Button onClick={handleActivateTagihan} disabled={isUpdatingStatus} className="bg-blue-600 hover:bg-blue-700 w-full">
                        <PlayCircle className="w-4 h-4 mr-2" /> Aktifkan & Kirim Email
                    </Button>
                )}

                {(bill.status === 'active' || bill.status === 'draft') && (
                    <Button variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-50" onClick={handleRemindTagihan} disabled={isUpdatingStatus}>
                        <MessageCircle className="w-4 h-4 mr-2" /> Kirim Pengingat Email
                    </Button>
                )}

                {bill.status === 'active' && (
                    <Button onClick={() => handleUpdateStatus('closed')} disabled={isUpdatingStatus} variant="secondary" className="w-full">
                        <StopCircle className="w-4 h-4 mr-2" /> Tutup Tagihan
                    </Button>
                )}
            </div>

        </div>
    );
};

export default BillDetail;
