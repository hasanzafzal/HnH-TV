import React, { useEffect, useState } from 'react';
import '../styles/toast.css';

/**
 * Toast notification component.
 * Props:
 *   message  – text to display
 *   type     – 'success' | 'warning' | 'info'  (default 'success')
 *   onClose  – callback fired when the toast hides
 *   duration – ms to stay visible (default 5000)
 */
const Toast = ({ message, type = 'success', onClose, duration = 5000 }) => {
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        // Trigger enter animation on mount
        const enterTimer = setTimeout(() => setVisible(true), 10);

        // Start exit animation before duration ends
        const leaveTimer = setTimeout(() => {
            setLeaving(true);
        }, duration - 400);

        // Call onClose after full duration
        const closeTimer = setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
        }, duration);

        return () => {
            clearTimeout(enterTimer);
            clearTimeout(leaveTimer);
            clearTimeout(closeTimer);
        };
    }, [duration, onClose]);

    const icons = {
        success: '✅',
        warning: '⚠️',
        info: 'ℹ️',
    };

    return (
        <div className={`toast toast--${type} ${visible ? 'toast--visible' : ''} ${leaving ? 'toast--leaving' : ''}`}>
            <span className="toast__icon">{icons[type] || icons.success}</span>
            <span className="toast__message">{message}</span>
            <button className="toast__close" onClick={() => { setLeaving(true); setTimeout(onClose, 400); }}>✕</button>
            <div className="toast__progress" style={{ animationDuration: `${duration}ms` }} />
        </div>
    );
};

export default Toast;
