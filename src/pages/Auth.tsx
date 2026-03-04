import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '../components/ui/tabs';

const Auth: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const mode = searchParams.get('mode') === 'register' ? 'register' : 'login';
    const [loading, setLoading] = useState(false);

    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register State
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');

    const navigate = useNavigate();
    const { user } = useAuth();

    // Redirect if already logged in and confirmed
    useEffect(() => {
        if (user) {
            if (!user.email_confirmed_at) {
                navigate('/verify-email', { replace: true, state: { email: user.email } });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        toast.loading("Masuk ke akun...", { id: 'auth' });

        const { error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: loginPassword,
        });

        if (error) {
            toast.error(error.message, { id: 'auth' });
            setLoading(false);
        } else {
            toast.success("Berhasil masuk!", { id: 'auth' });
            navigate('/dashboard');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!regName.trim()) {
            toast.error('Nama harus diisi');
            setLoading(false);
            return;
        }

        toast.loading("Mendaftarkan akun...", { id: 'auth' });

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: regEmail,
            password: regPassword,
            options: {
                data: {
                    nama: regName,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });

        if (authError) {
            toast.error(authError.message, { id: 'auth' });
            setLoading(false);
            return;
        }

        // Insert user strictly into public users table manually as fallback/guarantee.
        if (authData.user) {
            const { error: insertError } = await supabase
                .from('users')
                .upsert({
                    id: authData.user.id,
                    email: regEmail,
                    nama: regName,
                }, { onConflict: 'id' });

            if (insertError) {
                console.error("Failed to insert into public.users table manually: ", insertError);
            }
        }

        toast.success("Berhasil mendaftar! Silakan cek email Anda.", { id: 'auth' });
        navigate('/verify-email', { state: { email: regEmail } });
    };

    return (
        <div className="flex w-full min-h-[calc(100vh-2rem)] items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-green-600 flex items-center justify-center text-white font-bold text-2xl mb-4">
                        K
                    </div>
                    <CardTitle className="text-2xl font-bold">KasFlow</CardTitle>
                    <CardDescription>
                        Akses dashboard khusus bendahara
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Tabs value={mode} onValueChange={(val) => setSearchParams({ mode: val })} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="login">Masuk</TabsTrigger>
                            <TabsTrigger value="register">Daftar</TabsTrigger>
                        </TabsList>

                        {/* LOGIN TAB */}
                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email">Email</Label>
                                    <Input
                                        id="login-email"
                                        type="email"
                                        placeholder="nama@email.com"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-password">Password</Label>
                                    <Input
                                        id="login-password"
                                        type="password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                                    {loading ? 'Memproses...' : 'Masuk Dashboard'}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* REGISTER TAB */}
                        <TabsContent value="register">
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reg-name">Nama Lengkap</Label>
                                    <Input
                                        id="reg-name"
                                        type="text"
                                        placeholder="Budi Santoso"
                                        value={regName}
                                        onChange={(e) => setRegName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-email">Email</Label>
                                    <Input
                                        id="reg-email"
                                        type="email"
                                        placeholder="nama@email.com"
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-password">Password</Label>
                                    <Input
                                        id="reg-password"
                                        type="password"
                                        placeholder="Minimal 6 karakter"
                                        value={regPassword}
                                        onChange={(e) => setRegPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                                    {loading ? 'Memproses...' : 'Daftar Sekarang'}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>

                <CardFooter className="flex justify-center flex-col text-center text-sm text-muted-foreground pt-4 pb-6">
                    <p>Anggota biasa tidak perlu membuat akun.</p>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="text-primary hover:underline mt-2"
                    >
                        ← Kembali ke Beranda
                    </button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Auth;
