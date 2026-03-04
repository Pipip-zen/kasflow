import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getUserStatus } from '../lib/auth';
import { toast } from 'sonner';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';

const VerifyEmail: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState<string>('');
    const [cooldown, setCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        const initAndValidate = async () => {
            const status = await getUserStatus();

            // Bug 1: Redirect based on user state
            if (status === 'unauthenticated') {
                // Redirect if unauthenticated unless arriving right from register state
                if (!location.state?.email) {
                    navigate('/auth', { replace: true });
                    return;
                }
            }

            if (status === 'verified') {
                // If user is already verified, redirect to dashboard.
                navigate('/dashboard', { replace: true });
                return;
            }

            // Retrieve email from navigation state or fallback to active session
            if (location.state?.email) {
                setEmail(location.state.email);
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.email) {
                    setEmail(user.email);
                }
            }
        };

        initAndValidate();
    }, [location.state, navigate]);

    // Polling interval to check if the user finally clicked the email confirmation link 
    // from another device/browser.
    useEffect(() => {
        const intervalId = setInterval(async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email_confirmed_at) {
                toast.success("Email terverifikasi otomatis!", { id: 'auto-verify' });
                navigate('/dashboard', { replace: true });
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [navigate]);

    // Handle Cooldown Timer tick
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleResend = async () => {
        if (!email || cooldown > 0) return;

        setIsResending(true);
        toast.loading("Mengirim ulang email konfirmasi...", { id: 'resend' });

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) throw error;

            toast.success("Email konfirmasi ulang telah dikirim!", { id: 'resend' });
            setCooldown(60);
        } catch (error: any) {
            console.error("Resend Error:", error);
            toast.error(error.message || "Gagal mengirim ulang email.", { id: 'resend' });
            // add a slight cooldown on error to prevent spam 
            setCooldown(15);
        } finally {
            setIsResending(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth', { replace: true });
    };

    return (
        <div className="flex w-full min-h-[calc(100vh-2rem)] items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/40 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200/30 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2"></div>

            <Card className="w-full max-w-md shadow-2xl border-slate-200/60 z-10">
                <CardHeader className="text-center pt-8">
                    <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-6 shadow-inner animate-bounce delay-75">
                        <Mail className="w-10 h-10 fill-green-600/20 stroke-[1.5px]" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight">Satu Langkah Lagi!</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Email verifikasi sudah dikirim ke <br />
                        <span className="font-semibold text-slate-800 break-all">{email || 'email Anda'}</span>. <br />
                        Klik link di email untuk mengaktifkan akun kamu.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                    <div className="p-4 rounded-xl border border-amber-200/50 bg-amber-50 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                        <ul className="text-sm text-amber-800/90 font-medium space-y-1 list-disc pl-4">
                            <li>Cek folder <span className="font-bold">Spam</span> / Junk jika tidak menemukan email di Kotak Masuk.</li>
                            <li>Pastikan alamat email yang didaftarkan sudah benar.</li>
                        </ul>
                    </div>

                    <Button
                        onClick={handleResend}
                        disabled={cooldown > 0 || isResending}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-sm font-semibold"
                    >
                        {isResending ? (
                            <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Sedang mengirim...</>
                        ) : cooldown > 0 ? (
                            `Tunggu ${cooldown} detik untuk kirim ulang`
                        ) : (
                            <><Mail className="mr-2 h-4 w-4" /> Kirim Ulang Email Verifikasi</>
                        )}
                    </Button>
                </CardContent>

                <CardFooter className="flex justify-center flex-col text-center pb-8 pt-2">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="text-muted-foreground hover:text-slate-900 transition-colors flex items-center justify-center gap-2 text-sm font-medium py-2 px-4 rounded-full hover:bg-slate-100"
                    >
                        <LogOut className="w-4 h-4" /> Ganti Email (Logout)
                    </button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default VerifyEmail;
