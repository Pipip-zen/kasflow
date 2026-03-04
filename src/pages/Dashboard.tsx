import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api, type Bill } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FileText, Wallet, UsersRound } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalGroups: 0, totalBills: 0, totalCash: 0, totalMembers: 0 });
    const [recentBills, setRecentBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const [dashboardStats, bills] = await Promise.all([
                    api.getDashboardStats(user.id),
                    api.getRecentBills(user.id)
                ]);
                setStats(dashboardStats);
                setRecentBills(bills);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Aktif</Badge>;
            case 'closed': return <Badge variant="secondary" className="bg-slate-100 text-slate-800">Selesai</Badge>;
            default: return <Badge variant="outline" className="text-slate-500">Draft</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="w-full space-y-8">
                <div>
                    <Skeleton className="h-10 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                </div>
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ikhtisar Kas</h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                    Pantau ringkasan tagihan dan kas Anda hari ini.
                </p>
            </div>

            {stats.totalGroups === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 mt-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-4 shadow-sm">
                        <UsersRound className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-slate-800">Selamat Datang di KasFlow!</h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto text-base">
                        Sistem manajemen penagihan kas otomatis Anda. Langkah pertama Anda adalah membuat grup atau kelas baru.
                    </p>
                    <Button onClick={() => navigate('/groups')} size="lg" className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20">
                        Buka Halaman Grup
                    </Button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                        {/* Stat Cards */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Kas Terkumpul</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl md:text-2xl font-bold">{formatCurrency(stats.totalCash)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Dari semua pembayaran lunas</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tagihan Aktif</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalBills}</div>
                                <p className="text-xs text-muted-foreground mt-1">Sedang berjalan</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Grup</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalGroups}</div>
                                <p className="text-xs text-muted-foreground mt-1">Grup yang Anda kelola</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Anggota</CardTitle>
                                <UsersRound className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalMembers}</div>
                                <p className="text-xs text-muted-foreground mt-1">Di semua grup</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid flex-1 items-start gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tagihan Terbaru</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentBills.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                                        Belum ada tagihan. Buat tagihan pertama Anda di halaman Grup.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto w-full">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Judul</TableHead>
                                                    <TableHead>Grup</TableHead>
                                                    <TableHead>Nominal</TableHead>
                                                    <TableHead>Progress</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {recentBills.map((bill: any) => (
                                                    <TableRow key={bill.id}>
                                                        <TableCell className="font-medium whitespace-nowrap">{bill.judul}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{bill.groups?.nama || '-'}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{formatCurrency(bill.nominal)}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2 w-full max-w-[120px]">
                                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-green-500"
                                                                        style={{ width: `${bill.progress || 0}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-muted-foreground font-medium">{bill.progress || 0}%</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(bill.status)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>)}
        </div>
    );
};

export default Dashboard;
