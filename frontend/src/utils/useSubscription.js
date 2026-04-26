import { useState, useEffect } from 'react';
import apiClient from './api';
import { getUser } from './storage';

/**
 * Returns { subscribed, loading, plan }
 *
 * Logic:
 *   - Admin always passes through.
 *   - No subscription record (404) → subscribed = true  (new user, not yet blocked)
 *   - isActive === false            → subscribed = false (explicitly cancelled)
 *   - Any active plan (free/basic/premium/vip) → subscribed = true
 *
 * The subscription gate only triggers for users whose subscription
 * has been explicitly cancelled (isActive = false).
 * To restrict free-plan users from watching you would change hasPlan below.
 */
export function useSubscription() {
    const user = getUser();
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Admins always bypass the gate
        if (user.role === 'admin') {
            setSubscribed(true);
            setPlan('admin');
            setLoading(false);
            return;
        }

        apiClient
            .get('/subscription')
            .then((res) => {
                const data = res.data.data;
                if (!data) {
                    // Should not normally happen, treat as allowed
                    setSubscribed(true);
                    return;
                }
                setPlan(data.plan);
                // Only block if the subscription has been explicitly cancelled
                setSubscribed(data.isActive !== false);
            })
            .catch((err) => {
                const status = err?.response?.status;
                if (status === 404) {
                    // No subscription record yet → user hasn't cancelled, let them through
                    setSubscribed(true);
                } else {
                    // Network / server error → fail open (don't punish the user for infra issues)
                    setSubscribed(true);
                }
            })
            .finally(() => setLoading(false));
    }, [user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

    return { subscribed, loading, plan };
}
