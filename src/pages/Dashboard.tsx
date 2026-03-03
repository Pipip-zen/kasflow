import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button'; // Assuming we have installed Button later

const Dashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/auth');
    };

    return (
        <div className="w-full max-w-4xl mt-12 mb-auto flex flex-col gap-6">
            <div className="flex justify-between items-center pb-4 border-b border-border">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Dashboard KasFlow</h1>
                    <p className="text-muted-foreground mt-1">
                        Selamat datang, <span className="font-semibold text-primary">{user?.user_metadata?.nama || user?.email || 'Bendahara'}</span>
                    </p>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                    Logout
                </Button>
            </div>

            <div className="p-8 mt-4 rounded-xl border border-border bg-card shadow-sm text-center">
                <h2 className="text-xl font-medium mb-2">Area ini masih dalam pengembangan</h2>
                <p className="text-muted-foreground">
                    Kelola grup dan tagihan Anda segera hadir di sini.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
