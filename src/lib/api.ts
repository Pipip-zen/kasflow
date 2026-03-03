import { supabase } from './supabase';

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

    addMember: async (groupId: string, nama: string, nomorWa?: string) => {
        const { data, error } = await supabase
            .from('members')
            .insert({ group_id: groupId, nama, nomor_wa: nomorWa })
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
    }
};
