import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, LogOut, Menu, FileText, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from './ui/sheet';

export const DashboardLayout: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate('/auth');
    };

    const navLinks = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { to: '/groups', label: 'Grup', icon: Users, badge: null },
        { to: '/bills', label: 'Tagihan', icon: FileText, badge: null },
        { to: '/chat', label: 'AI Assistant', icon: MessageSquare, badge: 'NEW' },
    ];

    const SidebarContent = () => (
        <div className="flex h-full flex-col bg-background border-r">
            <div className="flex h-16 items-center border-b px-6">
                <div className="flex items-center gap-2 font-bold text-lg text-green-700">
                    <div className="w-8 h-8 rounded bg-green-600 text-white flex items-center justify-center text-xl">
                        K
                    </div>
                    <span>KasFlow</span>
                </div>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid gap-1 px-4">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            onClick={() => setOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-foreground hover:bg-muted ${isActive
                                    ? 'bg-green-50 text-green-700 font-semibold dark:bg-green-900/20 dark:text-green-400'
                                    : 'text-muted-foreground'
                                }`
                            }
                        >
                            <link.icon className="h-5 w-5" />
                            <span className="flex-1">{link.label}</span>
                            {link.badge && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-green-600 text-white rounded-md tracking-wider">
                                    {link.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>
            <div className="mt-auto border-t p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">
                            {user?.user_metadata?.nama || 'Pengguna'}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1 truncate">
                            {user?.email}
                        </span>
                    </div>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        Keluar
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[240px_1fr]">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <div className="flex flex-col">
                {/* Mobile Header */}
                <header className="flex h-16 items-center gap-4 border-b bg-background px-6 lg:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle sidebar</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0 flex flex-col">
                            <SheetTitle className="sr-only">Navigasi Kasflow</SheetTitle>
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                    <div className="flex items-center gap-2 font-bold text-lg text-green-700">
                        <div className="w-8 h-8 rounded bg-green-600 text-white flex items-center justify-center text-xl">K</div>
                        <span>KasFlow</span>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 bg-muted/40 p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
