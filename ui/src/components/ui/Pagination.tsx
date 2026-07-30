import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalItems <= itemsPerPage) {
        return null;
    }

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                        padding: '0.375rem 0.75rem',
                        border: '1px solid var(--border)',
                        background: currentPage === 1 ? 'var(--bg-secondary)' : 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        borderRadius: '6px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 ? 0.5 : 1
                    }}
                >
                    Prev
                </button>
                {pages.map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        style={{
                            padding: '0.375rem 0.75rem',
                            border: '1px solid',
                            borderColor: currentPage === page ? 'var(--blue)' : 'var(--border)',
                            background: currentPage === page ? 'var(--blue)' : 'var(--bg-card)',
                            color: currentPage === page ? '#fff' : 'var(--text-primary)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: currentPage === page ? 600 : 400
                        }}
                    >
                        {page}
                    </button>
                ))}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                        padding: '0.375rem 0.75rem',
                        border: '1px solid var(--border)',
                        background: currentPage === totalPages ? 'var(--bg-secondary)' : 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        borderRadius: '6px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        opacity: currentPage === totalPages ? 0.5 : 1
                    }}
                >
                    Next
                </button>
            </div>
        </div>
    );
};
