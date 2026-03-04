export interface MayarPaymentData {
    title: string;
    group_name: string;
    amount: number;
    customer_name: string;
    customer_email?: string;
    customer_mobile?: string;
    deadline: string;
    payment_token: string;
}

export const createPaymentLink = async (data: MayarPaymentData): Promise<{ payment_url: string; mayar_payment_id: string } | null> => {
    const apiKey = import.meta.env.VITE_MAYAR_API_KEY;
    const appUrl = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, '');

    if (!apiKey) {
        console.warn("Mayar API Key is missing.");
        return null;
    }

    try {
        const payload = {
            name: data.customer_name,
            email: data.customer_email || "no-reply@kasflow.local",
            amount: Math.round(data.amount),
            mobile: data.customer_mobile && data.customer_mobile.length >= 10 ? data.customer_mobile : "08000000000",
            redirectUrl: `${appUrl}/pay/${data.payment_token}`,
            description: `Tagihan ${data.title} - ${data.group_name}`,
            expiredAt: new Date(data.deadline).toISOString()
        };

        const endpoint = 'https://api.mayar.club/hl/v1/payment/create';

        const response = await fetch(endpoint, { // NOTE: proxy bypass avoids OPTIONS blocked queries
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("Mayar Response:", result);

        if (result.statusCode === 200 || result.messages === 'success') {
            return {
                payment_url: result.data.link ? result.data.link.replace('web.mayar.club') : null,
                mayar_payment_id: result.data.id
            };
        } else {
            console.error("Mayar API Error:", result);
            return null;
        }
    } catch (error) {
        console.error("Failed executing Mayar link creation:", error);
        return null;
    }
};
