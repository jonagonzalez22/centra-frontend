import { useEffect } from 'react';
import { Form } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import { CategoryForm } from '../CategoryForm';
import { useCategoryForm } from '../../hooks/useCategoryForm';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../../interfaces/category.interface';
import './CategoryFormModal.css';

interface CategoryFormModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    category?: Category;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
    open,
    onClose,
    onSuccess,
    category,
}) => {
    const [form] = Form.useForm();
    const { loading, createCategory, updateCategory } = useCategoryForm({ onSuccess });

    const isEditing = !!category;
    const title = isEditing ? 'Editar Categoría' : 'Crear Categoría';

    useEffect(() => {
        if (open) {
            if (category) {
                form.setFieldsValue({
                    name: category.name,
                    description: category.description ?? undefined,
                    is_active: category.is_active,
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, category, form]);

    const handleSubmit = async (values: CreateCategoryDto) => {
        if (isEditing && category) {
            await updateCategory(category.id, values as UpdateCategoryDto);
        } else {
            await createCategory(values);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={title}
            width={560}
            footer={
                <div className="categoryFormModalFooter">
                    <Button
                        variant="default"
                        label="Cancelar"
                        action={handleClose}
                        disabled={loading}
                    />
                    <Button
                        variant="primary"
                        label={isEditing ? 'Actualizar' : 'Crear'}
                        loading={loading}
                        htmlType="button"
                        action={() => {
                            const formEl = document.getElementById('categoryForm') as HTMLFormElement | null;
                            if (formEl) {
                                formEl.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                            }
                        }}
                    />
                </div>
            }
            destroyOnClose={false}
        >
            <CategoryForm
                formId="categoryForm"
                form={form}
                loading={loading}
                onSubmit={handleSubmit}
            />
        </Modal>
    );
};