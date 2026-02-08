import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Hash, Volume2, GripVertical } from 'lucide-react';

const DraggableChannel = ({ channel, id }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-all group ${isDragging
                    ? 'bg-discord-blurple/10 dark:bg-discord-blurple/20 shadow-lg z-50'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            >
                <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>

            {/* Channel Icon */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                {channel.type === 'voice' ? (
                    <Volume2 className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                ) : (
                    <Hash className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                    {channel.name}
                </span>
            </div>

            {/* Topic (if exists) */}
            {channel.topic && (
                <span className="text-xs text-gray-500 dark:text-gray-400 italic truncate max-w-[150px]">
                    {channel.topic}
                </span>
            )}
        </div>
    );
};

export default DraggableChannel;
