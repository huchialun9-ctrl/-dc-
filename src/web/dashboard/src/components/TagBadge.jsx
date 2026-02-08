import React from 'react';
import { X } from 'lucide-react';

const TagBadge = ({ tag, onRemove, size = 'sm', className = '' }) => {
    const sizeClasses = {
        xs: 'px-2 py-0.5 text-[10px]',
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
    };

    return (
        <div
            className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all hover:shadow-md ${sizeClasses[size]} ${className}`}
            style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
                borderColor: tag.color,
                borderWidth: '1px',
            }}
        >
            <span className="truncate max-w-[100px]">{tag.name}</span>
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(tag.id);
                    }}
                    className="hover:opacity-70 transition-opacity flex-shrink-0"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </div>
    );
};

export default TagBadge;
