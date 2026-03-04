import React, { useState, useEffect } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Check } from 'lucide-react';

interface DeleteBillDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    billId?: string;
    billJudul: string;
    billStatus: string;
    onConfirm: () => void | Promise<void>;
    loading?: boolean;
}

export function DeleteBillDialog({
    open,
    onOpenChange,
    title,
    billJudul,
    billStatus,
    onConfirm,
    loading = false,
}: DeleteBillDialogProps) {
    const [confirmText, setConfirmText] = useState('');

    useEffect(() => {
        if (!open) {
            setConfirmText('');
        }
    }, [open]);

    const isDraft = billStatus === 'draft';
    const isMatch = confirmText === billJudul;
    const isError = confirmText.length > 0 && !isMatch;

    const handleConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!isDraft && !isMatch) return;
        onConfirm();
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title || (billStatus === 'active' ? "Hapus Tagihan Aktif?" : "Hapus Tagihan?")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Tagihan ini akan dihapus permanen beserta seluruh data pembayaran anggota yang terkait.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {!isDraft && (
                    <div className="my-2 space-y-4">
                        {billStatus === 'active' && (
                            <div className="bg-red-50 border border-red-200 p-3 rounded-md text-sm text-red-800">
                                ⚠️ Tagihan ini berstatus <strong>{billStatus.toUpperCase()}</strong>. Menghapus tagihan aktif akan membatalkan semua pembayaran yang sedang berjalan.
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Ketik nama tagihan untuk konfirmasi:</label>
                            <div className="mb-2">
                                <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm text-gray-800">
                                    {billJudul}
                                </code>
                            </div>
                            <div className="relative">
                                <Input
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="Ketik nama tagihan di sini..."
                                    className={`pr-10 ${isMatch ? 'border-green-500 focus-visible:ring-green-500' : isError ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300'}`}
                                />
                                {isMatch && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-green-500">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                            <div className="text-sm h-5">
                                {isMatch && <span className="text-green-600">Nama cocok ✓</span>}
                                {isError && <span className="text-red-500">Nama tidak cocok</span>}
                            </div>
                        </div>
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={loading || (!isDraft && !isMatch)}
                        className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Menghapus...' : 'Hapus Tagihan'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
