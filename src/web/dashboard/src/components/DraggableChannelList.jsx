import React from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import DraggableCategory from './DraggableCategory';

const DraggableChannelList = ({ categories, onReorder }) => {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px 移動距離才開始拖拽，避免誤觸
            },
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        // Handle category reordering
        if (active.id.startsWith('category-') && over.id.startsWith('category-')) {
            const oldIndex = categories.findIndex((_, idx) => `category-${idx}` === active.id);
            const newIndex = categories.findIndex((_, idx) => `category-${idx}` === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newCategories = arrayMove(categories, oldIndex, newIndex);
                onReorder(newCategories);
            }
        }

        // Handle channel reordering within same category
        else if (active.id.includes('-channel-') && over.id.includes('-channel-')) {
            const activeCategoryId = active.id.split('-channel-')[0];
            const overCategoryId = over.id.split('-channel-')[0];

            // Only handle if within same category
            if (activeCategoryId === overCategoryId) {
                const categoryIndex = parseInt(activeCategoryId.replace('category-', ''));
                const category = categories[categoryIndex];

                const activeChannelIndex = parseInt(active.id.split('-channel-')[1]);
                const overChannelIndex = parseInt(over.id.split('-channel-')[1]);

                const newChannels = arrayMove(category.channels, activeChannelIndex, overChannelIndex);

                const newCategories = [...categories];
                newCategories[categoryIndex] = {
                    ...category,
                    channels: newChannels,
                };

                onReorder(newCategories);
            }
        }
    };

    if (!categories || categories.length === 0) {
        return null;
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={categories.map((_, idx) => `category-${idx}`)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex flex-col gap-3">
                    {categories.map((category, idx) => (
                        <DraggableCategory
                            key={`category-${idx}`}
                            id={`category-${idx}`}
                            category={category}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
};

export default DraggableChannelList;
