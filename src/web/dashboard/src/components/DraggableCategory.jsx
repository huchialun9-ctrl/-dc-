import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import DraggableChannel from './DraggableChannel';

const DraggableCategory = ({ category, id, onChannelReorder }) => {
    const [isExpanded, setIsExpanded] = useState(true);

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
            className={`bg-gray-50 dark:bg-gray-800 rounded-xl border transition-all ${isDragging
                    ? 'border-discord-blurple shadow-2xl z-50 scale-105'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
        >
            {/* Category Header */}
            <div className="flex items-center gap-2 p-4">
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing flex-shrink-0 hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded transition-colors"
                >
                    <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>

                {/* Expand/Collapse Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 flex-1 text-left"
                >
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                    <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">
                        {category.name}
                    </span>
                </button>

                {/* Channel Count */}
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    {category.channels?.length || 0} channels
                </span>
            </div>

            {/* Channels List */}
            {isExpanded && category.channels && category.channels.length > 0 && (
                <div className="px-4 pb-4">
                    <SortableContext
                        items={category.channels.map((ch, idx) => `${id}-channel-${idx}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col gap-1">
                            {category.channels.map((channel, idx) => (
                                <DraggableChannel
                                    key={`${id}-channel-${idx}`}
                                    id={`${id}-channel-${idx}`}
                                    channel={channel}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </div>
            )}
        </div>
    );
};

export default DraggableCategory;
