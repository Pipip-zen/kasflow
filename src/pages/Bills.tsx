import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, type Bill, type Group } from '../lib/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Receipt, Plus, Calendar, MoreVertical, Edit, Trash2 } from 'lucide-react';

// Define extended type
type BillExtended = Bill & { total_members: number, paid_count: number, progress: number };

const Bills: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [bills, setBills] = useState<BillExtended[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [open, setOpen] = useState(false);
    const [judul, setJudul] = useState('');
    const [groupId, setGroupId] = useState('');
    const [nominalStr, setNominalStr] = useState('');
    const [deadline, setDeadline] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                setLoading(true);
                const [bData, gData] = await Promise.all([
                    api.getAllBills(user.id),
                    api.getGroups(user.id)
                ]);
                setBills(bData);
                setGroups(gData);
            } catch (error) {
                console.error("Failed to fetch bills data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers
        const val = e.target.value.replace(/\D/g, '');
        if (val) {
            // Format to string with separators
            setNominalStr(new Intl.NumberFormat('id-ID').format(parseInt(val, 10)));
        } else {
            setNominalStr('');
        }
    };

    const handleCreateBill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !judul || !groupId || !nominalStr || !deadline) return;

        const nominalValue = parseInt(nominalStr.replace(/\./g, ''), 10);
        if (isNaN(nominalValue) || nominalValue <= 0) {
            toast.error("Nominal tidak valid.");
            return;
        }

        setIsCreating(true);
        toast.loading("Membuat tagihan baru...", { id: 'create-bill' });

        try {
            const newBill = await api.createBill(groupId, judul, nominalValue, deadline);

            // Re-fetch to get accurate progress stats after cascade
            const refreshedBills = await api.getAllBills(user.id);
            setBills(refreshedBills);

            setOpen(false);
            setJudul('');
            setGroupId('');
            setNominalStr('');
            setDeadline('');

            toast.success("Berhasil membuat tagihan!", { id: 'create-bill' });
            // Navigate straight to detail view
            navigate(`/bills/${newBill.id}`);
        } catch (error) {
            console.error("Failed to create bill:", error);
            toast.error("Gagal membuat tagihan. Pastikan grup memiliki anggota.", { id: 'create-bill' });
        } finally {
            setIsCreating(false);
        }
    };

    const [openEdit, setOpenEdit] = useState(false);
    const [editBillId, setEditBillId] = useState('');
    const [editJudul, setEditJudul] = useState('');
    const [editNominalStr, setEditNominalStr] = useState('');
    const [editDeadline, setEditDeadline] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const openEditModal = (bill: BillExtended) => {
        setEditBillId(bill.id);
        setEditJudul(bill.judul);
        setEditNominalStr(new Intl.NumberFormat('id-ID').format(bill.nominal));
        setEditDeadline(bill.deadline);
        setOpenEdit(true);
    };

    const handleEditNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val) {
            setEditNominalStr(new Intl.NumberFormat('id-ID').format(parseInt(val, 10)));
        } else {
            setEditNominalStr('');
        }
    };

    const submitEditBill = async (e: React.FormEvent) => {
        e.preventDefault();
        const nominalValue = parseInt(editNominalStr.replace(/\./g, ''), 10);
        if (isNaN(nominalValue) || nominalValue <= 0) {
            toast.error("Nominal tidak valid.");
            return;
        }

        setIsEditing(true);
        toast.loading("Menyimpan perubahan...", { id: 'edit-bill-list' });

        try {
            await api.updateBill(editBillId, editJudul, nominalValue, editDeadline);
            // Re-fetch bills
            if (user) {
                const refreshedBills = await api.getAllBills(user.id);
                setBills(refreshedBills);
            }
            setOpenEdit(false);
            toast.success("Perubahan tagihan berhasil disimpan!", { id: 'edit-bill-list' });
        } catch (error) {
            console.error("Failed to edit bill:", error);
            toast.error("Gagal menyimpan perubahan.", { id: 'edit-bill-list' });
        } finally {
            setIsEditing(false);
        }
    };

    // --- Delete logic ---
    const [deleteBillId, setDeleteBillId] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [openDeleteAlert, setOpenDeleteAlert] = useState(false);
    const [pendingDeleteStatus, setPendingDeleteStatus] = useState('');

    const confirmDelete = (billId: string, status: string) => {
        setDeleteBillId(billId);
        setPendingDeleteStatus(status);
        setOpenDeleteAlert(true);
    };

    const executeDelete = async () => {
        if (!deleteBillId) return;

        setIsDeleting(true);
        toast.loading("Menghapus tagihan...", { id: 'delete-bill-list' });

        try {
            await api.deleteBill(deleteBillId);
            setBills(bills.filter(b => b.id !== deleteBillId));
            toast.success("Tagihan berhasil dihapus.", { id: 'delete-bill-list' });
        } catch (error) {
            console.error("Failed to delete bill:", error);
            toast.error("Gagal menghapus tagihan.", { id: 'delete-bill-list' });
        } finally {
            setIsDeleting(false);
            setOpenDeleteAlert(false);
        }
    };

    const getBadgeVariant = (status: string) => {
        switch (status) {
            case 'active': return 'default';
            case 'closed': return 'secondary';
            default: return 'outline';
        }
    };

    const filterBills = (status: string) => {
        if (status === 'all') return bills;
        return bills.filter(b => b.status === status);
    };

    const renderBillCard = (bill: BillExtended) => (
        <Card key={bill.id} className="cursor-pointer hover:shadow-md transition-all relative group" onClick={() => navigate(`/bills/${bill.id}`)}>
            <CardHeader className="pb-3 pr-10">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-1 pr-6">{bill.judul}</CardTitle>
                    <Badge variant={getBadgeVariant(bill.status) as any} className={bill.status === 'active' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : ''}>
                        {bill.status === 'active' ? 'Aktif' : bill.status === 'closed' ? 'Selesai' : 'Draft'}
                    </Badge>
                </div>
                <CardDescription className="flex flex-col gap-1 mt-1">
                    <span className="font-medium text-slate-700">{bill.groups?.nama}</span>
                    <span className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" /> Deadline: {new Date(bill.deadline).toLocaleDateString('id-ID')}
                    </span>
                </CardDescription>

                <div className="absolute top-4 right-4" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuLabel>Aksi Tagihan</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`/bills/${bill.id}`)}>
                                Lihat Detail
                            </DropdownMenuItem>
                            {bill.status === 'draft' && (
                                <DropdownMenuItem onClick={() => openEditModal(bill)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => confirmDelete(bill.id, bill.status)} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Hapus</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-xl font-bold mb-4">{formatCurrency(bill.nominal)}</p>
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress Pembayaran</span>
                        <span className="font-medium">{bill.paid_count} / {bill.total_members} Anggota</span>
                    </div>
                    <Progress value={bill.progress} className="h-2" />
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tagihan</h1>
                    <p className="text-muted-foreground mt-1">
                        Kelola dan pantau semua tagihan kas yang sedang berjalan.
                    </p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Buat Tagihan
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleCreateBill}>
                            <DialogHeader>
                                <DialogTitle>Buat Tagihan Baru</DialogTitle>
                                <DialogDescription>
                                    Tagihan akan berstatus "Draft" saat baru dibuat sehingga Anda bisa mengecek ulang.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="judul">Judul Tagihan</Label>
                                    <Input
                                        id="judul"
                                        placeholder="Contoh: Kas Bulan Maret"
                                        value={judul}
                                        onChange={(e) => setJudul(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="grup">Grup / Kelas</Label>
                                    <Select value={groupId} onValueChange={setGroupId} required>
                                        <SelectTrigger id="grup">
                                            <SelectValue placeholder="Pilih grup" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {groups.map(g => (
                                                <SelectItem key={g.id} value={g.id}>{g.nama}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nominal">Nominal (Rp)</Label>
                                    <Input
                                        id="nominal"
                                        placeholder="Contoh: 15.000"
                                        value={nominalStr}
                                        onChange={handleNominalChange}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="deadline">Tenggat Waktu (Deadline)</Label>
                                    <Input
                                        id="deadline"
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={isCreating || groups.length === 0} className="bg-green-600 hover:bg-green-700">
                                    {isCreating ? 'Menyimpan...' : 'Simpan Draft'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Dialog */}
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={submitEditBill}>
                        <DialogHeader>
                            <DialogTitle>Edit Tagihan</DialogTitle>
                            <DialogDescription>
                                Ubah detail tagihan. Tagihan yang sudah aktif tidak bisa diedit.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-list-judul">Judul Tagihan</Label>
                                <Input
                                    id="edit-list-judul"
                                    value={editJudul}
                                    onChange={(e) => setEditJudul(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-list-nominal">Nominal (Rp)</Label>
                                <Input
                                    id="edit-list-nominal"
                                    value={editNominalStr}
                                    onChange={handleEditNominalChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-list-deadline">Tenggat Waktu</Label>
                                <Input
                                    id="edit-list-deadline"
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

            {/* Delete Alert Dialog */}
            <AlertDialog open={openDeleteAlert} onOpenChange={setOpenDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Tagihan Secara Permanen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Menghapus tagihan juga akan menghapus <strong>seluruh data pembayaran</strong> yang ada di dalamnya.
                            {pendingDeleteStatus === 'active' && <span className="block mt-2 font-bold text-red-600">Peringatan: Tagihan ini sedang aktif!</span>}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Tagihan'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
                </div>
            ) : bills.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-slate-50">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-4">
                        <Receipt className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Belum ada tagihan</h2>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                        Mulai tagih kas ke anggota grup dengan membuat tagihan pertama Anda.
                    </p>
                    <Button onClick={() => setOpen(true)} className="bg-green-600 hover:bg-green-700">
                        <Plus className="mr-2 h-4 w-4" /> Buat Tagihan Sekarang
                    </Button>
                </div>
            ) : (
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="all">Semua</TabsTrigger>
                        <TabsTrigger value="active">Aktif</TabsTrigger>
                        <TabsTrigger value="draft">Draft</TabsTrigger>
                        <TabsTrigger value="closed">Selesai</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-0 border-none p-0 outline-none">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {bills.map(renderBillCard)}
                        </div>
                    </TabsContent>

                    <TabsContent value="active" className="mt-0 border-none p-0 outline-none">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filterBills('active').map(renderBillCard)}
                        </div>
                    </TabsContent>

                    <TabsContent value="draft" className="mt-0 border-none p-0 outline-none">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filterBills('draft').map(renderBillCard)}
                        </div>
                    </TabsContent>

                    <TabsContent value="closed" className="mt-0 border-none p-0 outline-none">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filterBills('closed').map(renderBillCard)}
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default Bills;
