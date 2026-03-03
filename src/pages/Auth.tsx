import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
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
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register State
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');

    const navigate = useNavigate();
    const { user } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: loginPassword,
        });

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
        } else {
            navigate('/dashboard');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);

        if (!regName.trim()) {
            setErrorMsg('Nama harus diisi');
            setLoading(false);
            return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: regEmail,
            password: regPassword,
            options: {
                data: {
                    nama: regName,
                }
            }
        });

        if (authError) {
            setErrorMsg(authError.message);
            setLoading(false);
            return;
        }

        // Insert user strictly into public users table manually as fallback/guarantee.
        // If auth trigger is configured on DB, this might fail gracefully on unique constraint.
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
                // Don't block the user if the auth actually succeeded
            }
        }

        navigate('/dashboard');
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
                    {errorMsg && (
                        <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200 text-center">
                            {errorMsg}
                        </div>
                    )}

                    <Tabs defaultValue="login" className="w-full">
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
