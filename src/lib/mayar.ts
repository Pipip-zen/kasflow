export interface MayarPaymentData {
    title: string;
    amount: number;
    customer_name: string;
    customer_email?: string;
    payment_token: string;
}

export const createPaymentLink = async (data: MayarPaymentData): Promise<{ payment_url: string; mayar_payment_id: string } | null> => {
    const apiKey = import.meta.env.VITE_MAYAR_API_KEY;

    if (!apiKey) {
        console.warn("Mayar API Key is missing.");
        return null;
    }

    try {
        const payload = {
            name: data.customer_name,
            email: data.customer_email || "no-reply@kasflow.local", // Mayar sometimes requires email, use dummy if absent
            amount: data.amount,
            description: data.title,
            // Pass token as metadata or reference id so webhook can identify it if needed, or just rely on mayar_payment_id
            reference_id: data.payment_token
        };

        const endpoint = import.meta.env.DEV ? '/api/mayar/hl/v1/payment/create' : 'https://api.mayar.id/hl/v1/payment/create';

        const response = await fetch(endpoint, { // NOTE: proxy bypass avoids OPTIONS blocked queries
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.statusCode === 200 || result.status === 'success') {
            // Typically Mayar returns link inside `data.link` and `data.id`
            return {
                payment_url: result.data.link,
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
