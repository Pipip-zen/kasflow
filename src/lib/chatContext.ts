import { supabase } from './supabase';

export async function getBendaharaContext(userId: string) {
    // Ambil semua groups milik bendahara
    const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('bendahara_id', userId);

    if (groupsError) throw groupsError;

    if (!groups || groups.length === 0) {
        return {
            groups: [],
            bills: []
        };
    }

    const groupIds = groups.map(g => g.id);

    // Ambil semua bills dengan join ke payments dan members
    const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select(`
            id,
            judul,
            nominal,
            deadline,
            status,
            group_id,
            groups (nama),
            payments (
                status,
                paid_at,
                members (nama, email)
            )
        `)
        .in('group_id', groupIds);

    if (billsError) throw billsError;

    const formattedBills = (billsData || []).map((bill: any) => {
        const payments = bill.payments || [];
        const total_anggota = payments.length;

        const paidPayments = payments.filter((p: any) => p.status === 'paid');
        const sudah_bayar = paidPayments.length;
        const total_terkumpul = sudah_bayar * bill.nominal;

        const pendingPayments = payments.filter((p: any) => p.status === 'pending');
        const belum_bayar = pendingPayments.map((p: any) => ({
            nama: p.members?.nama || 'Unknown',
            email: p.members?.email || null,
        }));

        const grupNama = Array.isArray(bill.groups) ? bill.groups[0]?.nama : bill.groups?.nama || 'Unknown Group';

        return {
            id: bill.id,
            judul: bill.judul,
            nominal: bill.nominal,
            deadline: bill.deadline,
            status: bill.status,
            grup: grupNama,
            total_anggota,
            sudah_bayar,
            belum_bayar,
            total_terkumpul
        };
    });

    return {
        groups,
        bills: formattedBills
    };
}
