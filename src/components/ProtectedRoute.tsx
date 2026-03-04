import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getUserStatus } from '../lib/auth';

export const ProtectedRoute: React.FC = () => {
    const [status, setStatus] = useState<'unauthenticated' | 'unverified' | 'verified' | 'loading'>('loading');

    useEffect(() => {
        let isMounted = true;
        getUserStatus().then((s) => {
            if (isMounted) setStatus(s);
        });
        return () => { isMounted = false; };
    }, []);

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (status === 'unauthenticated') {
        return <Navigate to="/auth" replace />;
    }

    if (status === 'unverified') {
        return <Navigate to="/verify-email" replace />;
    }

    return <Outlet />;
};
