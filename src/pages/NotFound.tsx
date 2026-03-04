import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ShieldAlert } from 'lucide-react';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="text-center max-w-md w-full px-6">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                    <ShieldAlert className="w-12 h-12" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">404</h1>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Halaman Tidak Ditemukan</h2>
                <p className="text-muted-foreground mb-8">
                    Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => navigate(-1)} variant="outline" className="w-full sm:w-auto">
                        Mundur
                    </Button>
                    <Button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                        Ke Dashboard Beranda
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
