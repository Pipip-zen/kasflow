import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, LogOut, Menu, Receipt } from 'lucide-react';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const DashboardLayout: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/auth');
    };

    const navLinks = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/bills', label: 'Tagihan', icon: Receipt },
        { to: '/groups', label: 'Grup', icon: Users },
    ];

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            {/* Top Navbar */}
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-2 font-bold text-lg mr-4 text-green-700">
                    <div className="w-8 h-8 rounded bg-green-600 text-white flex items-center justify-center text-xl">K</div>
                    <span className="hidden md:inline">KasFlow</span>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex flex-row gap-6 text-sm font-medium">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `flex items-center gap-2 transition-colors hover:text-foreground ${isActive ? 'text-foreground font-semibold text-green-700' : 'text-muted-foreground'
                                }`
                            }
                        >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Mobile Navigation (Dropdown) */}
                <div className="md:hidden flex items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Menu</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {navLinks.map((link) => (
                                <DropdownMenuItem key={link.to} onClick={() => navigate(link.to)}>
                                    <link.icon className="mr-2 h-4 w-4" />
                                    {link.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* User Menu */}
                <div className="ml-auto flex items-center gap-4">
                    <span className="text-sm text-muted-foreground hidden sm:block">
                        {user?.user_metadata?.nama || user?.email}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">Keluar</span>
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col p-4 md:p-8">
                <Outlet />
            </main>
        </div>
    );
};
