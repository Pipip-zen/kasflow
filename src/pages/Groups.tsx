import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, type Group } from '../lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Users, Plus, LayoutGrid } from 'lucide-react';

const Groups: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Dialog State
    const [open, setOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchGroups();
    }, [user]);

    const fetchGroups = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await api.getGroups(user.id);
            setGroups(data);
        } catch (error) {
            console.error("Failed to fetch groups:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newGroupName.trim()) return;

        setIsCreating(true);
        toast.loading("Membuat grup baru...", { id: 'create-group' });

        try {
            const newGroup = await api.createGroup(user.id, newGroupName, newGroupDesc);
            setGroups([newGroup, ...groups]); // Optimistic local prepend
            setOpen(false);
            setNewGroupName('');
            setNewGroupDesc('');
            toast.success("Berhasil membuat grup!", { id: 'create-group' });
        } catch (error) {
            console.error("Failed to create group:", error);
            toast.error("Gagal membuat grup. Silakan coba lagi.", { id: 'create-group' });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Grup Anda</h1>
                    <p className="text-muted-foreground mt-1">
                        Kelola anggota dan tagihan untuk setiap grup/kelas di sini.
                    </p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Buat Grup Baru
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleCreateGroup}>
                            <DialogHeader>
                                <DialogTitle>Buat Grup Baru</DialogTitle>
                                <DialogDescription>
                                    Tambahkan grup atau kelas baru untuk mulai menagih kas.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Grup</Label>
                                    <Input
                                        id="name"
                                        placeholder="Contoh: Kelas XII IPA 1"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="desc">Deskripsi (Opsional)</Label>
                                    <Input
                                        id="desc"
                                        placeholder="Contoh: Iuran kas mingguan kelas"
                                        value={newGroupDesc}
                                        onChange={(e) => setNewGroupDesc(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={isCreating} className="bg-green-600 hover:bg-green-700">
                                    {isCreating ? 'Menyimpan...' : 'Simpan Grup'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
                </div>
            ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-slate-50">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-4">
                        <LayoutGrid className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Belum ada grup</h2>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                        Anda belum memiliki grup kas apapun. Buat grup pertama Anda untuk mulai menambahkan anggota dan tagihan.
                    </p>
                    <Button onClick={() => setOpen(true)} className="bg-green-600 hover:bg-green-700">
                        <Plus className="mr-2 h-4 w-4" /> Buat Grup Sekarang
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                        <Card key={group.id} className="hover:shadow-md transition-shadow flex flex-col cursor-pointer" onClick={() => navigate(`/groups/${group.id}`)}>
                            <CardHeader className="pb-3">
                                <CardTitle className="line-clamp-1">{group.nama}</CardTitle>
                                <CardDescription className="line-clamp-2 min-h-[40px]">
                                    {group.deskripsi || 'Tidak ada deskripsi'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="mt-auto pb-4">
                                <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                                    <Users className="w-4 h-4" />
                                    <span>Klik untuk kelola anggota & tagihan</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Groups;
