import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, type Group, type Member } from '../lib/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Plus, UserX, User, Trash2 } from 'lucide-react';

const GroupDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [group, setGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    const [openAdd, setOpenAdd] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberWa, setNewMemberWa] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (!id || !user) return;

        const fetchDetail = async () => {
            try {
                setLoading(true);
                const [groupData, membersData] = await Promise.all([
                    api.getGroupById(id, user.id),
                    api.getMembers(id)
                ]);
                setGroup(groupData);
                setMembers(membersData);
            } catch (error) {
                console.error("Failed to fetch group details:", error);
                // If not found or not owner, we can kick back
                navigate('/groups', { replace: true });
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id, user, navigate]);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !newMemberName.trim() || !newMemberEmail.trim()) return;

        setIsAdding(true);
        toast.loading("Menambahkan anggota baru...", { id: 'add-member' });
        try {
            const newMember = await api.addMember(id, newMemberName, newMemberEmail.trim(), newMemberWa.trim());
            setMembers([newMember, ...members]);
            setOpenAdd(false);
            setNewMemberName('');
            setNewMemberEmail('');
            setNewMemberWa('');
            toast.success(`Berhasil menambahkan ${newMemberName}!`, { id: 'add-member' });
        } catch (error) {
            console.error("Failed to add member:", error);
            toast.error("Gagal menambahkan anggota. Pastikan Email belum terdaftar di grup ini.", { id: 'add-member' });
        } finally {
            setIsAdding(false);
        }
    };

    const [openConfirmDeleteMember, setOpenConfirmDeleteMember] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<{ id: string, name: string } | null>(null);

    const promptDeleteMember = (id: string, name: string) => {
        setMemberToDelete({ id, name });
        setOpenConfirmDeleteMember(true);
    };

    const executeDeleteMember = async () => {
        if (!memberToDelete) return;
        const { id, name } = memberToDelete;
        toast.loading(`Menghapus ${name}...`, { id: 'del-member' });
        try {
            await api.deleteMember(id);
            setMembers(members.filter(m => m.id !== id));
            toast.success(`${name} berhasil dihapus dari grup.`, { id: 'del-member' });
            setOpenConfirmDeleteMember(false);
        } catch (error) {
            console.error("Failed to delete member:", error);
            toast.error("Gagal menghapus anggota.", { id: 'del-member' });
        }
    };

    const [openConfirmDeleteGroup, setOpenConfirmDeleteGroup] = useState(false);
    const [isDeletingGroup, setIsDeletingGroup] = useState(false);
    const [confirmGroupName, setConfirmGroupName] = useState('');

    const handleDeleteGroup = async () => {
        if (!id || !group) return;
        setIsDeletingGroup(true);
        toast.loading(`Menghapus grup ${group.nama}...`, { id: 'del-group' });
        try {
            await api.deleteGroup(id);
            toast.success(`Grup ${group.nama} berhasil dihapus.`, { id: 'del-group' });
            navigate('/groups', { replace: true });
        } catch (error) {
            console.error("Failed to delete group:", error);
            toast.error("Gagal menghapus grup. Pastikan grup dalam keadaan kosong.", { id: 'del-group' });
        } finally {
            setIsDeletingGroup(false);
            setOpenConfirmDeleteGroup(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full space-y-4">
                <Skeleton className="h-8 w-24 mb-6" />
                <Skeleton className="h-12 w-64 mb-2" />
                <Skeleton className="h-4 w-96 mb-8" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    if (!group) return null;

    return (
        <div className="w-full space-y-6">
            <Button variant="ghost" className="mb-2 -ml-3 text-muted-foreground" onClick={() => navigate('/groups')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Grup
            </Button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{group.nama}</h1>
                    <p className="text-muted-foreground mt-1">
                        {group.deskripsi || 'Tidak ada deskripsi.'}
                    </p>
                </div>
                <Button
                    variant="destructive"
                    onClick={() => setOpenConfirmDeleteGroup(true)}
                    className="flex-shrink-0"
                >
                    <Trash2 className="w-4 h-4 mr-2" /> Hapus Grup
                </Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold mb-4">Anggota Grup</CardTitle>
                            <CardDescription>Kelola anggota yang terdaftar di grup ini ({members.length} anggota)</CardDescription>
                        </div>

                        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <form onSubmit={handleAddMember}>
                                    <DialogHeader>
                                        <DialogTitle>Tambah Anggota Baru</DialogTitle>
                                        <DialogDescription>
                                            Tambahkan nama dan Email anggota ke dalam grup ini.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="mem-name">Nama Anggota <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="mem-name"
                                                placeholder="Contoh: Andi"
                                                value={newMemberName}
                                                onChange={(e) => setNewMemberName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mem-email">Alamat Email <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="mem-email"
                                                type="email"
                                                placeholder="Contoh: andi@gmail.com"
                                                value={newMemberEmail}
                                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">Wajib diisi untk menerima notifikasi tagihan Otomatis.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mem-wa">Nomor WhatsApp (Opsional)</Label>
                                            <Input
                                                id="mem-wa"
                                                placeholder="Contoh: 08123456789"
                                                value={newMemberWa}
                                                onChange={(e) => setNewMemberWa(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>Batal</Button>
                                        <Button type="submit" disabled={isAdding} className="bg-green-600 hover:bg-green-700">
                                            {isAdding ? 'Menyimpan...' : 'Simpan'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {members.length === 0 ? (
                            <div className="text-center py-10 border border-dashed rounded-lg bg-slate-50">
                                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <User className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">Belum ada anggota</h3>
                                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                                    Grup ini masih kosong. Klik tombol 'Tambah' di atas untuk memasukkan anggota pertama.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Alamat Email</TableHead>
                                        <TableHead className="w-[100px] text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell className="font-medium">{member.nama}</TableCell>
                                            <TableCell>{member.email || <span className="text-slate-400 italic">Belum diisi</span>}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => promptDeleteMember(member.id, member.nama)}
                                                    title="Hapus Anggota"
                                                >
                                                    <UserX className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
            <ConfirmDialog
                open={openConfirmDeleteMember}
                onOpenChange={setOpenConfirmDeleteMember}
                title="Hapus Anggota?"
                description={`Hapus anggota '${memberToDelete?.name}' dari grup ini? Semua data pembayarannya akan ikut terhapus.`}
                confirmText="Ya, Hapus"
                confirmVariant="destructive"
                onConfirm={executeDeleteMember}
            />

            <Dialog open={openConfirmDeleteGroup} onOpenChange={setOpenConfirmDeleteGroup}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <Trash2 className="w-5 h-5" /> Hapus Grup?
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Tindakan ini permanen. Semua data tagihan, anggota, dan riwayat di dalam grup <strong>"{group?.nama}"</strong> akan terhapus total.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Label htmlFor="confirm-group-name" className="text-sm font-medium text-slate-700">
                            Ketik nama grup untuk konfirmasi:
                        </Label>
                        <p className="text-xs text-muted-foreground mb-2 font-mono bg-slate-100 p-1.5 rounded inline-block">
                            {group?.nama}
                        </p>
                        <Input
                            id="confirm-group-name"
                            placeholder="Ketik nama grup di sini..."
                            value={confirmGroupName}
                            onChange={(e) => setConfirmGroupName(e.target.value)}
                            className={`mt-1 ${confirmGroupName === group?.nama ? 'border-green-500 focus-visible:ring-green-500' : 'border-red-200 focus-visible:ring-red-500'}`}
                            autoComplete="off"
                        />
                    </div>

                    <DialogFooter className="sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setOpenConfirmDeleteGroup(false);
                                setConfirmGroupName('');
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteGroup}
                            disabled={isDeletingGroup || confirmGroupName !== group?.nama}
                        >
                            {isDeletingGroup ? 'Menghapus...' : 'Ya, Hapus Grup'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default GroupDetail;
