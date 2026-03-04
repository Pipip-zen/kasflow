import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const handleEmailConfirmation = async () => {
            try {
                // If it's a standard email confirmation flow, Supabase will provide a code.
                const code = searchParams.get('code');

                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) throw error;

                    toast.success("Email berhasil diverifikasi! Selamat datang di KasFlow 🎉", {
                        duration: 5000,
                        id: 'email-verify-success'
                    });
                    navigate('/dashboard', { replace: true });
                } else {
                    // It might be a token hash flow (older Supabase standard) mapped into URL hash.
                    const hashParams = new URLSearchParams(window.location.hash.slice(1));
                    const accessToken = hashParams.get('access_token');

                    if (accessToken) {
                        toast.success("Email berhasil diverifikasi! Selamat datang di KasFlow 🎉", {
                            duration: 5000,
                            id: 'email-verify-success'
                        });
                        navigate('/dashboard', { replace: true });
                    } else {
                        // Fallback handling: Try checking session as auth state might have just updated
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session?.user?.email_confirmed_at) {
                            navigate('/dashboard', { replace: true });
                        } else {
                            throw new Error("Link verifikasi tidak valid atau sudah kadaluarsa");
                        }
                    }
                }
            } catch (error: any) {
                console.error("Auth Callback Error:", error);
                toast.error(error.message || "Link verifikasi tidak valid atau sudah kadaluarsa", {
                    duration: 5000,
                    id: 'email-verify-error'
                });
                navigate('/auth', { replace: true });
            }
        };

        handleEmailConfirmation();
    }, [navigate, searchParams]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
                <h1 className="text-xl font-bold text-slate-800">Memverifikasi Otentikasi...</h1>
                <p className="text-slate-500 text-sm">Mohon tunggu sebentar, kami sedang memvalidasi sesi Anda dari tautan email.</p>
            </div>
        </div>
    );
};

export default AuthCallback;
