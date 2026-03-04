import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const hasProcessed = React.useRef(false);

    useEffect(() => {
        if (hasProcessed.current) return;
        hasProcessed.current = true;

        const handleEmailConfirmation = async () => {
            try {
                // Parse both URL formats
                const hashParams = new URLSearchParams(window.location.hash.slice(1));
                const queryParams = new URLSearchParams(window.location.search);

                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');
                const code = queryParams.get('code');
                const error = hashParams.get('error') || queryParams.get('error');
                const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

                // Bug 2: Handle URL error immediately and skip processing
                if (error) {
                    throw new Error(errorDescription || "Link verifikasi tidak valid atau sudah kadaluarsa");
                }

                // Process token exchange
                if (type === 'signup' && accessToken && refreshToken) {
                    // Refresh token flow
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (sessionError) throw sessionError;

                    toast.success("Email berhasil diverifikasi! Selamat datang 🎉", {
                        duration: 5000,
                        id: 'email-verify-success' // Unique ID avoids stacking
                    });
                } else if (code) {
                    // PKCE flow
                    const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
                    if (codeError) throw codeError;

                    toast.success("Email berhasil diverifikasi! Selamat datang 🎉", {
                        duration: 5000,
                        id: 'email-verify-success'
                    });
                } else {
                    // Fallback to checking existing active session status (e.g. from Auto-verification)
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session?.user?.email_confirmed_at) {
                        throw new Error("Sesi verifikasi tidak ditemukan. Silakan login kembali.");
                    }
                }
            } catch (error: any) {
                console.error("Auth Callback Error:", error);
                toast.error("Link verifikasi tidak valid atau sudah kadaluarsa", {
                    duration: 5000,
                    id: 'email-verify-error'
                });
            } finally {
                // Bug 3: Final redirect logic based on session state 
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    navigate('/dashboard', { replace: true });
                } else {
                    navigate('/auth', { replace: true });
                }
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
