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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2, XCircle, MessageCircle, PlayCircle, StopCircle, UserX, Edit, Trash2, Mail, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DeleteBillDialog } from '../components/DeleteBillDialog';

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

    const [openConfirmClose, setOpenConfirmClose] = useState(false);
    const [openConfirmActivate, setOpenConfirmActivate] = useState(false);
    const [openConfirmRemind, setOpenConfirmRemind] = useState(false);

    const executeUpdateStatusClosed = async () => {
        if (!bill) return;
        setIsUpdatingStatus(true);
        try {
            await api.updateBillStatus(bill.id, 'closed');
            setBill({ ...bill, status: 'closed' });
            toast.success("Status tagihan berhasil ditutup.");
            setOpenConfirmClose(false);
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("Gagal merubah status tagihan.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const executeActivateTagihan = async () => {
        if (!bill) return;

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
            setOpenConfirmActivate(false);
        } catch (error) {
            console.error("Failed to activate bill", error);
            toast.error("Gagal mengaktifkan tagihan.", { id: 'activate-bill' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const executeRemindTagihan = async () => {
        if (!bill) return;

        setIsUpdatingStatus(true);
        toast.loading("Mengirimkan pengingat Email...", { id: 'remind-bill' });

        try {
            const result = await api.remindBill(bill.id);
            toast.success(`Pengingat Email berhasil terkirim ke ${result.total_sent} anggota.`, { id: 'remind-bill' });
            setOpenConfirmRemind(false);
        } catch (error) {
            console.error("Failed to send reminder", error);
            toast.error("Gagal mengirimkan pengingat Email.", { id: 'remind-bill' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // --- Edit Bill logic ---
    const [openEdit, setOpenEdit] = useState(false);
    const [editJudul, setEditJudul] = useState('');
    const [editNominalStr, setEditNominalStr] = useState('');
    const [editDeadline, setEditDeadline] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Populate edit form when opening
    useEffect(() => {
        if (openEdit && bill) {
            setEditJudul(bill.judul);
            setEditNominalStr(new Intl.NumberFormat('id-ID').format(bill.nominal));
            setEditDeadline(bill.deadline);
        }
    }, [openEdit, bill]);

    const handleEditNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val) {
            setEditNominalStr(new Intl.NumberFormat('id-ID').format(parseInt(val, 10)));
        } else {
            setEditNominalStr('');
        }
    };

    const handleEditBill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bill) return;

        const nominalValue = parseInt(editNominalStr.replace(/\./g, ''), 10);
        if (isNaN(nominalValue) || nominalValue <= 0) {
            toast.error("Nominal tidak valid.");
            return;
        }

        setIsEditing(true);
        toast.loading("Menyimpan perubahan...", { id: 'edit-bill' });

        try {
            await api.updateBill(bill.id, editJudul, nominalValue, editDeadline);
            // Re-fetch detail to be safe
            await fetchDetail();
            setOpenEdit(false);
            toast.success("Perubahan tagihan berhasil disimpan!", { id: 'edit-bill' });
        } catch (error) {
            console.error("Failed to edit bill:", error);
            toast.error("Gagal menyimpan perubahan. Pastikan status tagihan masih Draft.", { id: 'edit-bill' });
        } finally {
            setIsEditing(false);
        }
    };

    // --- Delete Bill logic ---
    const [isDeleting, setIsDeleting] = useState(false);
    const [openDeleteAlert, setOpenDeleteAlert] = useState(false);

    const handleDeleteBill = async () => {
        if (!bill) return;

        setIsDeleting(true);
        toast.loading("Menghapus tagihan...", { id: 'delete-bill' });

        try {
            await api.deleteBill(bill.id);
            toast.success("Tagihan berhasil dihapus.", { id: 'delete-bill' });
            navigate('/bills');
        } catch (error) {
            console.error("Failed to delete bill:", error);
            toast.error("Gagal menghapus tagihan.", { id: 'delete-bill' });
        } finally {
            setIsDeleting(false);
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
        if (!bill) return null;

        let filtered = payments;
        if (filter !== 'all') {
            filtered = payments.filter(p => p.status === filter);
        }

        if (bill.total_members === 0) {
            return (
                <div className="text-center py-10 border border-dashed rounded-lg bg-slate-50 flex flex-col items-center justify-center">
                    <UserX className="w-10 h-10 text-slate-400 mb-3" />
                    <h3 className="text-lg font-medium text-slate-900">Grup Kosong</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                        Grup tagihan ini belum memiliki anggota. Silakan tambahkan anggota di halaman Grup.
                    </p>
                    <Button onClick={() => navigate(`/groups/${bill.group_id}`)} variant="outline">
                        Kelola Grup
                    </Button>
                </div>
            );
        }

        if (filtered.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg bg-slate-50">
                    Tidak ada data dengan filter terkait.
                </div>
            );
        }

        return (
            <div className="overflow-x-auto w-full -mx-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="whitespace-nowrap">Nama Anggota</TableHead>
                            <TableHead className="whitespace-nowrap">Email</TableHead>
                            <TableHead className="whitespace-nowrap">Tgl Bayar</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(payment => (
                            <TableRow key={payment.id}>
                                <TableCell className="font-medium whitespace-nowrap">{payment.members.nama}</TableCell>
                                <TableCell className="text-sm max-w-[130px] truncate">{payment.members.email || '-'}</TableCell>
                                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
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
            </div>
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
        <div className="w-full space-y-4 pb-48 md:pb-8">
            <Button variant="ghost" className="mb-2 -ml-3 text-muted-foreground" onClick={() => navigate('/bills')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Tagihan
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
                        <>
                            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="text-slate-600">
                                        <Edit className="w-4 h-4 mr-2" /> Edit
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <form onSubmit={handleEditBill}>
                                        <DialogHeader>
                                            <DialogTitle>Edit Tagihan</DialogTitle>
                                            <DialogDescription>
                                                Ubah detail tagihan. Tagihan yang sudah aktif tidak bisa diedit.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-judul">Judul Tagihan</Label>
                                                <Input
                                                    id="edit-judul"
                                                    value={editJudul}
                                                    onChange={(e) => setEditJudul(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-nominal">Nominal (Rp)</Label>
                                                <Input
                                                    id="edit-nominal"
                                                    value={editNominalStr}
                                                    onChange={handleEditNominalChange}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-deadline">Tenggat Waktu</Label>
                                                <Input
                                                    id="edit-deadline"
                                                    type="date"
                                                    value={editDeadline}
                                                    onChange={(e) => setEditDeadline(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>Batal</Button>
                                            <Button type="submit" disabled={isEditing} className="bg-green-600 hover:bg-green-700">
                                                {isEditing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            <Button onClick={() => setOpenConfirmActivate(true)} disabled={isUpdatingStatus || bill.total_members === 0} className="bg-blue-600 hover:bg-blue-700">
                                <PlayCircle className="w-4 h-4 mr-2" /> Aktifkan & Kirim Email
                            </Button>
                        </>
                    )}

                    {(bill.status === 'active' || bill.status === 'draft') && (
                        <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50" onClick={() => setOpenConfirmRemind(true)} disabled={isUpdatingStatus || bill.total_members === 0}>
                            <MessageCircle className="w-4 h-4 mr-2" /> Kirim Pengingat Email
                        </Button>
                    )}

                    {bill.status === 'active' && (
                        <Button onClick={() => setOpenConfirmClose(true)} disabled={isUpdatingStatus} variant="secondary">
                            <StopCircle className="w-4 h-4 mr-2" /> Tutup Tagihan
                        </Button>
                    )}

                    <Button onClick={() => setOpenDeleteAlert(true)} variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700 pointer-events-auto">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Progress Section */}
            <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-3">
                        <div>
                            <p className="text-sm font-medium text-green-800 mb-1">Total Kas Terkumpul</p>
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-2xl md:text-3xl font-bold text-slate-900">{formatCurrency(totalTerkumpul)}</span>
                                <span className="text-sm text-slate-500 font-medium">/ {formatCurrency(totalPotensi)}</span>
                            </div>
                        </div>
                        <div className="md:text-right">
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
                    <>
                        {/* Note: The physical dialog component logic is rendered once at the top in Desktop but triggering from multiple places works best if we pull it up or duplicate. Since we are using DialogTrigger wrapping simple buttons, duplicating the Trigger code logic inside the same Dialog wrapper might be complex, so we'll just duplicate the Dialog structure entirely for mobile */}
                        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full text-slate-600">
                                    <Edit className="w-4 h-4 mr-2" /> Edit Tagihan
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <form onSubmit={handleEditBill}>
                                    <DialogHeader>
                                        <DialogTitle>Edit Tagihan</DialogTitle>
                                        <DialogDescription>
                                            Ubah detail tagihan. Tagihan yang sudah aktif tidak bisa diedit.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="m-edit-judul">Judul Tagihan</Label>
                                            <Input
                                                id="m-edit-judul"
                                                value={editJudul}
                                                onChange={(e) => setEditJudul(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="m-edit-nominal">Nominal (Rp)</Label>
                                            <Input
                                                id="m-edit-nominal"
                                                value={editNominalStr}
                                                onChange={handleEditNominalChange}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="m-edit-deadline">Tenggat Waktu</Label>
                                            <Input
                                                id="m-edit-deadline"
                                                type="date"
                                                value={editDeadline}
                                                onChange={(e) => setEditDeadline(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>Batal</Button>
                                        <Button type="submit" disabled={isEditing} className="bg-green-600 hover:bg-green-700">
                                            {isEditing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Button onClick={() => setOpenConfirmActivate(true)} disabled={isUpdatingStatus || bill.total_members === 0} className="bg-blue-600 hover:bg-blue-700 w-full">
                            <PlayCircle className="w-4 h-4 mr-2" /> Aktifkan & Kirim Email
                        </Button>
                    </>
                )}

                {(bill.status === 'active' || bill.status === 'draft') && (
                    <Button variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-50" onClick={() => setOpenConfirmRemind(true)} disabled={isUpdatingStatus || bill.total_members === 0}>
                        <MessageCircle className="w-4 h-4 mr-2" /> Kirim Pengingat Email
                    </Button>
                )}

                {bill.status === 'active' && (
                    <Button onClick={() => setOpenConfirmClose(true)} disabled={isUpdatingStatus} variant="secondary" className="w-full">
                        <StopCircle className="w-4 h-4 mr-2" /> Tutup Tagihan
                    </Button>
                )}

                <Button onClick={() => setOpenDeleteAlert(true)} variant="ghost" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 pointer-events-auto">
                    <Trash2 className="w-4 h-4 mr-2" /> Hapus Tagihan
                </Button>
            </div>

            {/* Dialog Confirmations */}
            <ConfirmDialog
                open={openConfirmActivate}
                onOpenChange={setOpenConfirmActivate}
                title="Aktifkan Tagihan?"
                description="Sistem akan mengirimkan notifikasi Email ke semua anggota secara otomatis. Tagihan yang sudah diaktifkan tidak dapat diedit."
                icon={<Mail className="h-6 w-6 text-green-600" />}
                confirmText="Aktifkan & Kirim Email"
                confirmVariant="default"
                onConfirm={executeActivateTagihan}
                loading={isUpdatingStatus}
            />
            <ConfirmDialog
                open={openConfirmRemind}
                onOpenChange={setOpenConfirmRemind}
                title="Kirim Ulang Notifikasi?"
                description={`Email pengingat akan dikirim ke ${payments.filter(p => p.status === 'pending').length} anggota yang belum melakukan pembayaran.`}
                icon={<Bell className="h-6 w-6 text-amber-500" />}
                confirmText="Kirim Ulang"
                confirmVariant="default"
                onConfirm={executeRemindTagihan}
                loading={isUpdatingStatus}
            />
            <ConfirmDialog
                open={openConfirmClose}
                onOpenChange={setOpenConfirmClose}
                title="Tutup Tagihan?"
                description="Anggota tidak akan bisa membayar lagi via link payment karena statusnya akan diubah menjadi selesai/ditutup."
                confirmText="Tutup Tagihan"
                confirmVariant="destructive"
                onConfirm={executeUpdateStatusClosed}
                loading={isUpdatingStatus}
            />
            <DeleteBillDialog
                open={openDeleteAlert}
                onOpenChange={setOpenDeleteAlert}
                billId={bill.id}
                billJudul={bill.judul}
                billStatus={bill.status}
                onConfirm={handleDeleteBill}
                loading={isDeleting}
            />
        </div>
    );
};

export default BillDetail;
