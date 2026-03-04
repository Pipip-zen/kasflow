import { supabase } from './supabase';
import { api } from './api';

export async function executeFunction(functionName: string, args: any, userId: string) {
    try {
        switch (functionName) {
            case "get_unpaid_members":
                return await handleGetUnpaidMembers(args, userId);
            case "get_payment_summary":
                return await handleGetPaymentSummary(args, userId);
            case "analyze_payment_pattern":
                return await handleAnalyzePaymentPattern(args, userId);
            case "get_late_members":
                return await handleGetLateMembers(args, userId);
            case "send_reminder":
                return await handleSendReminder(args, userId);
            case "create_bill":
                return await handleCreateBill(args, userId);
            case "close_bill":
                return await handleCloseBill(args, userId);
            default:
                return { error: `Function ${functionName} tidak dikenal` };
        }
    } catch (error: any) {
        console.error(`Error executing ${functionName}:`, error);
        return { error: error.message || "Terjadi kesalahan internal" };
    }
}

async function handleGetUnpaidMembers(args: any, userId: string) {
    const { bill_id } = args;

    // Pertama, pastikan kita hanya mengambil data untuk bendahara yang sedang login
    const { data: userGroups } = await supabase
        .from('groups')
        .select('id')
        .eq('bendahara_id', userId);

    const groupIds = userGroups?.map(g => g.id) || [];
    if (groupIds.length === 0) return { members: [] };

    let query = supabase
        .from('payments')
        .select(`
            status,
            members (nama, email),
            bills!inner (id, judul, nominal, deadline, group_id)
        `)
        .eq('status', 'pending')
        .in('bills.group_id', groupIds);

    if (bill_id) {
        query = query.eq('bill_id', bill_id);
    } else {
        query = query.eq('bills.status', 'active');
    }

    const { data, error } = await query;
    if (error) throw error;

    const formattedMembers = (data || []).map((p: any) => ({
        nama: p.members?.nama || 'Unknown',
        email: p.members?.email || '-',
        bill_judul: p.bills?.judul,
        nominal: p.bills?.nominal,
        deadline: p.bills?.deadline
    }));

    return { members: formattedMembers };
}

async function handleGetPaymentSummary(args: any, userId: string) {
    const { group_id } = args;

    let groupQuery = supabase
        .from('groups')
        .select('id')
        .eq('bendahara_id', userId);

    if (group_id) {
        groupQuery = groupQuery.eq('id', group_id);
    }

    const { data: userGroups } = await groupQuery;
    const groupIds = userGroups?.map(g => g.id) || [];
    if (groupIds.length === 0) {
        return { total_terkumpul: 0, total_tagihan: 0, persentase: 0, detail: [] };
    }

    const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select(`
            id,
            judul,
            nominal,
            payments (status)
        `)
        .in('group_id', groupIds);

    if (billsError) throw billsError;

    let totalKeseluruhanTerkumpul = 0;
    let totalKeseluruhanTarget = 0;

    const detail = (bills || []).map((bill: any) => {
        const payments = bill.payments || [];
        const paidCount = payments.filter((p: any) => p.status === 'paid').length;
        const totalCount = payments.length;

        const terkumpul = paidCount * bill.nominal;
        const target = totalCount * bill.nominal;
        const sisa = target - terkumpul;
        const persentase = target > 0 ? Math.round((terkumpul / target) * 100) : 0;

        totalKeseluruhanTerkumpul += terkumpul;
        totalKeseluruhanTarget += target;

        return {
            bill_judul: bill.judul,
            terkumpul,
            target,
            sisa,
            persentase
        };
    });

    const persentaseTotal = totalKeseluruhanTarget > 0
        ? Math.round((totalKeseluruhanTerkumpul / totalKeseluruhanTarget) * 100)
        : 0;

    return {
        total_terkumpul: totalKeseluruhanTerkumpul,
        total_tagihan: totalKeseluruhanTarget,
        persentase: persentaseTotal,
        detail
    };
}

async function handleAnalyzePaymentPattern(args: any, userId: string) {
    const { bill_id } = args;

    // Ambil data groups dari bendahara
    const { data: userGroups } = await supabase
        .from('groups')
        .select('id')
        .eq('bendahara_id', userId);

    const groupIds = userGroups?.map(g => g.id) || [];
    if (groupIds.length === 0) return { error: "Belum ada grup yang dikelola" };

    let query = supabase
        .from('payments')
        .select(`
            id, status, paid_at,
            members!inner(id, nama),
            bills!inner(id, deadline, group_id)
        `)
        .in('bills.group_id', groupIds);

    if (bill_id) {
        query = query.eq('bill_id', bill_id);
    }

    const { data: payments, error } = await query;
    if (error) throw error;

    if (!payments || payments.length === 0) {
        return { insight: "Data belum cukup untuk analisis." };
    }

    let totalDaysDiff = 0;
    let paidCount = 0;
    let lateCount = 0;
    const memberLateMap = new Map<string, { nama: string, lateCount: number, totalBills: number }>();

    payments.forEach((p: any) => {
        const memberId = p.members.id;
        if (!memberLateMap.has(memberId)) {
            memberLateMap.set(memberId, { nama: p.members.nama, lateCount: 0, totalBills: 0 });
        }

        const memberStats = memberLateMap.get(memberId)!;
        memberStats.totalBills++;

        // Hitung selisih hari jika sudah dibayar
        if (p.status === 'paid' && p.paid_at) {
            paidCount++;
            const deadlineDate = new Date(p.bills.deadline).getTime();
            const paidDate = new Date(p.paid_at).getTime();
            const diffDays = Math.round((paidDate - deadlineDate) / (1000 * 3600 * 24));

            totalDaysDiff += diffDays;

            if (diffDays > 0) {
                lateCount++;
                memberStats.lateCount++;
            }
        } else if (p.status === 'pending') {
            const deadlineDate = new Date(p.bills.deadline).getTime();
            const now = new Date().getTime();
            if (now > deadlineDate) {
                lateCount++;
                memberStats.lateCount++;
            }
        }

        memberLateMap.set(memberId, memberStats);
    });

    // Identifikasi late members (telat > 50% tagihan)
    const late_members = Array.from(memberLateMap.values())
        .filter(m => m.lateCount > 0 && (m.lateCount / m.totalBills) >= 0.5)
        .map(m => ({ nama: m.nama, late_rate: Math.round((m.lateCount / m.totalBills) * 100) + '%' }))
        .sort((a, b) => parseInt(b.late_rate) - parseInt(a.late_rate));

    const avgDaysDiff = paidCount > 0 ? Math.round(totalDaysDiff / paidCount) : 0;
    const completionRate = Math.round((paidCount / payments.length) * 100);

    let insightStr = `Tingkat penyelesaian pembayaran adalah ${completionRate}%. `;
    if (avgDaysDiff < 0) {
        insightStr += `Rata-rata anggota membayar ${-avgDaysDiff} hari sebelum deadline.`;
    } else if (avgDaysDiff > 0) {
        insightStr += `Rata-rata anggota membayar ${avgDaysDiff} hari setelah deadline (terlambat).`;
    } else {
        insightStr += `Rata-rata anggota membayar tepat pada hari deadline.`;
    }

    let recommendation = "";
    if (avgDaysDiff > 0 || completionRate < 70) {
        recommendation = "Disarankan untuk mengirim pengingat (reminder) H-3 hingga H-1 sebelum deadline karena banyak yang menunda pembayaran.";
    } else {
        recommendation = "Pola pembayaran grup sudah cukup baik. Jaga komunikasi yang ada.";
    }

    return {
        insight: insightStr,
        late_members: late_members.length > 0 ? late_members : "Tidak ada anggota yang secara konsisten telat",
        prediction: `Berdasarkan pola, ${completionRate}% tagihan kemungkinan akan terbayar lancar.`,
        recommendation
    };
}

async function handleGetLateMembers(args: any, userId: string) {
    const { group_id } = args;

    const { data: userGroups } = await supabase
        .from('groups')
        .select('id')
        .eq('bendahara_id', userId);

    let groupIds = userGroups?.map(g => g.id) || [];

    if (group_id) {
        if (!groupIds.includes(group_id)) return { members: [] }; // Unauthorized
        groupIds = [group_id];
    }

    if (groupIds.length === 0) return { members: [] };

    const { data: payments, error } = await supabase
        .from('payments')
        .select(`
            status,
            members!inner(id, nama, email),
            bills!inner(deadline, group_id)
        `)
        .eq('status', 'pending')
        .in('bills.group_id', groupIds);

    if (error) throw error;

    const now = new Date().getTime();
    const freqMap = new Map<string, { nama: string, email: string, lateCount: number }>();

    (payments || []).forEach((p: any) => {
        const deadlineDate = new Date(p.bills.deadline).getTime();
        // Cek jika status pending dan sudah lewat deadline
        if (now > deadlineDate) {
            const mId = p.members.id;
            if (!freqMap.has(mId)) {
                freqMap.set(mId, {
                    nama: p.members.nama,
                    email: p.members.email || '-',
                    lateCount: 0
                });
            }
            freqMap.get(mId)!.lateCount++;
        }
    });

    const members = Array.from(freqMap.values())
        .sort((a, b) => b.lateCount - a.lateCount);

    return { members };
}

async function handleSendReminder(args: any, userId: string) {
    const { bill_id } = args;

    // Verifikasi kepemilikan
    const { data: billCheck, error: checkError } = await supabase
        .from('bills')
        .select('groups!inner(bendahara_id)')
        .eq('id', bill_id)
        .single();

    if (checkError || !billCheck || (billCheck.groups as any).bendahara_id !== userId) {
        return { error: "Tagihan tidak ditemukan atau akses ditolak" };
    }

    const result = await api.remindBill(bill_id);
    return {
        success: result.success,
        total_sent: result.total_sent,
        message: `Berhasil mengirim ${result.total_sent} email pengingat.`
    };
}

async function handleCreateBill(args: any, userId: string) {
    const { judul, nominal, deadline, group_id } = args;

    // Cek kepemilikan group
    const { data: groupCheck } = await supabase
        .from('groups')
        .select('id')
        .eq('id', group_id)
        .eq('bendahara_id', userId)
        .single();

    if (!groupCheck) {
        return { error: "Group tidak ditemukan atau Anda tidak memiliki akses" };
    }

    const bill = await api.createBill(group_id, judul, nominal, deadline);

    return {
        success: true,
        bill_id: bill.id,
        judul: bill.judul,
        message: `Tagihan '${judul}' berhasil dibuat sebagai draft.`
    };
}

async function handleCloseBill(args: any, userId: string) {
    const { bill_id } = args;

    // Verifikasi
    const { data: billCheck } = await supabase
        .from('bills')
        .select('groups!inner(bendahara_id)')
        .eq('id', bill_id)
        .single();

    if (!billCheck || (billCheck.groups as any).bendahara_id !== userId) {
        return { error: "Tagihan tidak ditemukan atau Anda tidak memiliki akses" };
    }

    await api.updateBillStatus(bill_id, 'closed');

    return {
        success: true,
        message: "Status tagihan berhasil diubah menjadi closed."
    };
}
