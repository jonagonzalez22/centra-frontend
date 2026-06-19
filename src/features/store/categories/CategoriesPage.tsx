import { useState } from 'react';
import { useCategories } from './hooks/useCategories';
import { CategoriesList } from './components/CategoriesList';
import { CategoryFormModal } from './components/CategoryFormModal';
import type { Category } from './interfaces/category.interface';

export const CategoriesPage: React.FC = () => {
    const { categories, loading, pagination, refetch, deleteCategory } = useCategories();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);

    const handleNewCategory = () => {
        setSelectedCategory(undefined);
        setModalOpen(true);
    };

    const handleEditCategory = (category: Category) => {
        setSelectedCategory(category);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        refetch({ page: pagination.current });
    };

    const handleDeleteCategory = async (id: string) => {
        await deleteCategory(id);
    };

    return (
        <>
            <CategoriesList
                categories={categories}
                loading={loading}
                pagination={pagination}
                refetch={refetch}
                onNewCategory={handleNewCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
            />
            <CategoryFormModal
                open={modalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
                category={selectedCategory}
            />
        </>
    );
};