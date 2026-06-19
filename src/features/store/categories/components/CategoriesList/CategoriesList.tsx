import { Button } from '@/components/Button';
import { PlusOutlined } from '@ant-design/icons';
import { CanDo } from '@/components/auth/CanDo';
import { CategoriesSearchBar } from '../CategoriesSearchBar';
import { CategoriesTable } from '../CategoriesTable';
import type { Category, CategoriesFilters } from '../../interfaces/category.interface';
import './CategoriesList.css';

interface CategoriesListProps {
    categories: Category[];
    loading: boolean;
    pagination: { current: number; total: number; pageSize: number };
    refetch: (filters?: CategoriesFilters) => void;
    onNewCategory: () => void;
    onEditCategory: (category: Category) => void;
    onDeleteCategory: (id: string) => Promise<void>;
}

export const CategoriesList: React.FC<CategoriesListProps> = ({
    categories,
    loading,
    pagination,
    refetch,
    onNewCategory,
    onEditCategory,
    onDeleteCategory,
}) => {
    const handleTableChange = (pag: { current?: number; pageSize?: number }) => {
        refetch({ page: pag.current, per_page: pag.pageSize });
    };

    return (
        <div className="categoriesList">
            <div className="categoriesListHeader">
                <CanDo permission="categories.create">
                    <Button icon={<PlusOutlined />} label="Nueva Categoría" action={onNewCategory} />
                </CanDo>
            </div>

            <CategoriesSearchBar loading={loading} refetch={refetch} />

            <CategoriesTable
                categories={categories}
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
                onEdit={onEditCategory}
                onDelete={onDeleteCategory}
            />
        </div>
    );
};