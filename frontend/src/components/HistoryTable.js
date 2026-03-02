import React from 'react';

const HistoryTable = ({ data }) => {
    const getStatusClass = (status) => {
        if (!status) return 'status-pending';
        const s = status.toLowerCase();
        if (s.includes('success') || s === 'delivered' || s === 'sent') return 'status-sent';
        if (s.includes('fail') || s === 'error') return 'status-failed';
        return 'status-pending';
    };

    const formatStatus = (status) => {
        if (!status) return 'Pending';
        const s = status.toLowerCase();
        if (s.includes('success') || s === 'delivered' || s === 'sent') return 'Success';
        if (s.includes('fail') || s === 'error') return 'Failed';
        if (s === 'pending_whatsapp') return 'Pending';
        return status;
    };

    return (
        <div className="glass-card table-container animate-fade-in">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Recipient</th>
                        <th>Photo</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                                No delivery history available yet.
                            </td>
                        </tr>
                    ) : (
                        data.map((item) => (
                            <tr key={item.id}>
                                <td>{new Date(item.timestamp).toLocaleString()}</td>
                                <td>
                                    <span style={{ textTransform: 'capitalize' }}>
                                        {item.details?.delivery_medium || item.action.split('_')[0]}
                                    </span>
                                </td>
                                <td>{item.details?.recipient || 'N/A'}</td>
                                <td>{item.details?.photo_name || 'N/A'}</td>
                                <td>
                                    <span className={`status-badge ${getStatusClass(item.details?.status)}`}>
                                        {formatStatus(item.details?.status)}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default HistoryTable;
