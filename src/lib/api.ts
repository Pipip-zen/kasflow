import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from './email';
import { createPaymentLink } from './mayar';
export interface Group {
    id: string;
    nama: string;
    deskripsi: string | null;
    bendahara_id: string;
    created_at: string;
}

export interface Member {
    id: string;
    group_id: string;
    nama: string;
    email: string | null;
    nomor_wa: string | null;
    created_at: string;
}

export interface Bill {
    id: string;
    group_id: string;
    judul: string;
    nominal: number;
    deadline: string;
    status: 'draft' | 'active' | 'closed';
    created_at: string;
    groups?: { nama: string }; // joined relation
}

export interface Payment {
    id: string;
    bill_id: string;
    member_id: string;
    status: 'pending' | 'paid';
    mayar_payment_id: string | null;
    payment_token: string | null;
    payment_url: string | null;
    paid_at: string | null;
}

export const api = {
    // --------- GROUPS ---------
    getGroups: async (bendaharaId: string) => {
        const { data, error } = await supabase
            .from('groups')
            .select('*')
            .eq('bendahara_id', bendaharaId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Group[];
    },

    getGroupById: async (groupId: string, bendaharaId: string) => {
        const { data, error } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .eq('bendahara_id', bendaharaId)
            .single();
        if (error) throw error;
        return data as Group;
    },

    createGroup: async (bendaharaId: string, nama: string, deskripsi?: string) => {
        const { data, error } = await supabase
            .from('groups')
            .insert({ bendahara_id: bendaharaId, nama, deskripsi })
            .select()
            .single();
        if (error) throw error;
        return data as Group;
    },

    // --------- MEMBERS ---------
    getMembers: async (groupId: string) => {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Member[];
    },

    addMember: async (groupId: string, nama: string, email: string, nomorWa?: string) => {
        const { data, error } = await supabase
            .from('members')
            .insert({ group_id: groupId, nama, email, nomor_wa: nomorWa })
            .select()
            .single();
        if (error) throw error;
        return data as Member;
    },

    deleteMember: async (memberId: string) => {
        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', memberId);
        if (error) throw error;
    },

    // --------- DASHBOARD STATS ---------
    getDashboardStats: async (bendaharaId: string) => {
        // 1. Total Groups
        const { count: totalGroups, error: errGroups } = await supabase
            .from('groups')
            .select('*', { count: 'exact', head: true })
            .eq('bendahara_id', bendaharaId);
        if (errGroups) throw errGroups;

        // 2. To get members / bills / payments, we first need this bendahara's group IDs
        const { data: userGroups, error: errUserGroups } = await supabase
            .from('groups')
            .select('id')
            .eq('bendahara_id', bendaharaId);
        if (errUserGroups) throw errUserGroups;

        const groupIds = userGroups.map(g => g.id);

        if (groupIds.length === 0) {
            return { totalGroups: 0, totalBills: 0, totalMembers: 0, totalCash: 0 };
        }

        // 3. Total Members in all groups
        const { count: totalMembers, error: errMembers } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .in('group_id', groupIds);
        if (errMembers) throw errMembers;

        // 4. Total Active Bills
        const { count: totalBills, error: errBills } = await supabase
            .from('bills')
            .select('*', { count: 'exact', head: true })
            .in('group_id', groupIds)
            .eq('status', 'active');
        if (errBills) throw errBills;

        // 5. Total Cash Collected (payments paid for this bendahara's bills)
        // We join payments with bills to ensure they belong to the bendahara
        const { data: paymentsInfo, error: errPayments } = await supabase
            .from('payments')
            .select(`
        status,
        bills!inner(nominal, group_id)
      `)
            .eq('status', 'paid')
            .in('bills.group_id', groupIds);

        if (errPayments) throw errPayments;

        const totalCash = paymentsInfo.reduce((acc, curr) => {
            // @ts-ignore - Supabase join typings map out as object arrays sometimes
            return acc + (curr.bills?.nominal || 0);
        }, 0);

        return {
            totalGroups: totalGroups || 0,
            totalBills: totalBills || 0,
            totalMembers: totalMembers || 0,
            totalCash,
        };
    },

    getRecentBills: async (bendaharaId: string) => {
        const { data: userGroups } = await supabase
            .from('groups')
            .select('id')
            .eq('bendahara_id', bendaharaId);

        const groupIds = userGroups?.map(g => g.id) || [];
        if (groupIds.length === 0) return [];

        const { data, error } = await supabase
            .from('bills')
            .select(`
        *,
        groups (nama)
      `)
            .in('group_id', groupIds)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        // Process progress - for recent bills, we need to count total members vs paid payments
        // To keep it simple for now, we'll fetch payments stats for these 5 bills
        const billsWithProgress = await Promise.all(
            (data as any[]).map(async (bill) => {
                const { count: totalTarget } = await supabase
                    .from('payments')
                    .select('*', { count: 'exact', head: true })
                    .eq('bill_id', bill.id);

                const { count: paidCount } = await supabase
                    .from('payments')
                    .select('*', { count: 'exact', head: true })
                    .eq('bill_id', bill.id)
                    .eq('status', 'paid');

                return {
                    ...bill,
                    progress: totalTarget && totalTarget > 0 ? Math.round(((paidCount || 0) / (totalTarget || 1)) * 100) : 0
                };
            })
        );

        return billsWithProgress;
    },

    // --------- BILLS ---------
    getAllBills: async (bendaharaId: string) => {
        // get all groups managed by this bendahara
        const { data: userGroups } = await supabase
            .from('groups')
            .select('id')
            .eq('bendahara_id', bendaharaId);

        const groupIds = userGroups?.map(g => g.id) || [];
        if (groupIds.length === 0) return [];

        const { data, error } = await supabase
            .from('bills')
            .select(`
        *,
        groups (nama)
      `)
            .in('group_id', groupIds)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const billsWithProgress = await Promise.all(
            (data as any[]).map(async (bill) => {
                const { count: totalTarget } = await supabase
                    .from('payments')
                    .select('*', { count: 'exact', head: true })
                    .eq('bill_id', bill.id);

                const { count: paidCount } = await supabase
                    .from('payments')
                    .select('*', { count: 'exact', head: true })
                    .eq('bill_id', bill.id)
                    .eq('status', 'paid');

                return {
                    ...bill,
                    total_members: totalTarget || 0,
                    paid_count: paidCount || 0,
                    progress: totalTarget && totalTarget > 0 ? Math.round(((paidCount || 0) / (totalTarget || 1)) * 100) : 0
                };
            })
        );

        return billsWithProgress as (Bill & { total_members: number, paid_count: number, progress: number })[];
    },

    createBill: async (groupId: string, judul: string, nominal: number, deadline: string) => {
        // 1. Insert bill as draft
        const { data: bill, error: billError } = await supabase
            .from('bills')
            .insert({
                group_id: groupId,
                judul,
                nominal,
                deadline,
                status: 'draft'
            })
            .select()
            .single();

        if (billError) throw billError;

        // 2. Fetch all members of this group
        const { data: members, error: memError } = await supabase
            .from('members')
            .select('id')
            .eq('group_id', groupId);

        if (memError) throw memError;

        // 3. Cascade insert pending payments if there are members
        if (members && members.length > 0) {
            const paymentInserts = members.map(m => ({
                bill_id: bill.id,
                member_id: m.id,
                status: 'pending'
            }));

            const { error: payError } = await supabase
                .from('payments')
                .insert(paymentInserts);

            if (payError) throw payError;
        }

        return bill as Bill;
    },

    getBillDetail: async (billId: string) => {
        const { data, error } = await supabase
            .from('bills')
            .select(`
        *,
        groups (nama)
      `)
            .eq('id', billId)
            .single();

        if (error) throw error;

        // progress stats
        const { count: totalTarget } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('bill_id', billId);

        const { count: paidCount } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('bill_id', billId)
            .eq('status', 'paid');

        return {
            ...(data as any),
            total_members: totalTarget || 0,
            paid_count: paidCount || 0,
            progress: totalTarget && totalTarget > 0 ? Math.round(((paidCount || 0) / (totalTarget || 1)) * 100) : 0
        } as Bill & { total_members: number, paid_count: number, progress: number };
    },

    updateBillStatus: async (billId: string, status: 'draft' | 'active' | 'closed') => {
        const { error } = await supabase
            .from('bills')
            .update({ status })
            .eq('id', billId);

        if (error) throw error;
    },

    getBillPayments: async (billId: string) => {
        // Get payments joined with member info
        const { data, error } = await supabase
            .from('payments')
            .select(`
        *,
        members (id, nama, email, nomor_wa)
      `)
            .eq('bill_id', billId);

        if (error) throw error;
        return data as (Payment & { members: Member })[];
    },

    activateBill: async (billId: string) => {
        const { data: bill, error: billError } = await supabase
            .from('bills')
            .select('*, groups(nama)')
            .eq('id', billId)
            .single();

        if (billError || !bill) throw billError || new Error("Bill not found");

        const { data: payments, error: payError } = await supabase
            .from('payments')
            .select('*, members(nama, email, nomor_wa)')
            .eq('bill_id', billId)
            .eq('status', 'pending');

        if (payError) throw payError;

        let totalSent = 0;
        const failedList: string[] = [];
        const appUrl = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, '');

        if (payments && payments.length > 0) {
            for (const p of payments) {
                let paymentToken = p.payment_token;
                const namaMember = (p.members as any)?.nama || 'Anggota';
                const namaGroup = (bill.groups as any)?.nama || 'Grup';

                if (!paymentToken) {
                    paymentToken = uuidv4();

                    // Generate Mayar Link
                    const mayarRes = await createPaymentLink({
                        title: bill.judul,
                        group_name: namaGroup,
                        amount: bill.nominal,
                        customer_name: namaMember,
                        customer_email: (p.members as any)?.email,
                        customer_mobile: (p.members as any)?.nomor_wa,
                        deadline: bill.deadline,
                        payment_token: paymentToken
                    });

                    const updatePayload: any = { payment_token: paymentToken };
                    if (mayarRes) {
                        updatePayload.payment_url = mayarRes.payment_url;
                        updatePayload.mayar_payment_id = mayarRes.mayar_payment_id;
                    } else {
                        console.error(`Gagal membuat payment link Mayar untuk member: ${namaMember}`);
                    }

                    const { error: updateError } = await supabase
                        .from('payments')
                        .update(updatePayload)
                        .eq('id', p.id);

                    if (updateError) {
                        console.error("Supabase Error Update Payments:", updateError);
                    }
                }

                const memberEmail = (p.members as any)?.email;

                if (memberEmail) {
                    const payLink = `${appUrl}/pay/${paymentToken}`;

                    const result = await sendEmail({
                        to: memberEmail,
                        nama: namaMember,
                        judul: bill.judul,
                        grup: namaGroup,
                        nominal: bill.nominal,
                        deadline: bill.deadline,
                        payment_link: payLink
                    });

                    if (result.success) {
                        totalSent++;
                    } else {
                        failedList.push(namaMember);
                    }
                } else {
                    failedList.push(`${namaMember} (No Email)`);
                }
            }
        }

        await supabase.from('bills').update({ status: 'active' }).eq('id', billId);
        return { success: true, total_sent: totalSent, failed: failedList };
    },

    remindBill: async (billId: string) => {
        const { data: bill, error: billError } = await supabase
            .from('bills')
            .select('*, groups(nama)')
            .eq('id', billId)
            .single();

        if (billError || !bill) throw billError || new Error("Bill not found");

        const { data: payments, error: payError } = await supabase
            .from('payments')
            .select('*, members(nama, email, nomor_wa)')
            .eq('bill_id', billId)
            .eq('status', 'pending');

        if (payError) throw payError;

        let totalSent = 0;
        const appUrl = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, '');

        if (payments && payments.length > 0) {
            for (const p of payments) {
                if (!p.payment_token) continue;

                const memberEmail = (p.members as any)?.email;
                const namaMember = (p.members as any)?.nama || 'Anggota';
                const namaGroup = (bill.groups as any)?.nama || 'Grup';

                if (memberEmail) {
                    const payLink = `${appUrl}/pay/${p.payment_token}`;

                    const result = await sendEmail({
                        to: memberEmail,
                        nama: namaMember,
                        judul: bill.judul,
                        grup: namaGroup,
                        nominal: bill.nominal,
                        deadline: bill.deadline,
                        payment_link: payLink
                    });

                    if (result.success) totalSent++;
                }
            }
        }

        return { success: true, total_sent: totalSent };
    },

    getPaymentByToken: async (token: string) => {
        const { data, error } = await supabase
            .from('payments')
            .select(`
                *,
                members (nama),
                bills (judul, nominal, deadline, groups (nama))
            `)
            .eq('payment_token', token)
            .single();

        if (error || !data) throw error || new Error("Token tidak valid");
        return data as (Payment & {
            members: { nama: string },
            bills: { judul: string, nominal: number, deadline: string, groups: { nama: string } }
        });
    }
};
