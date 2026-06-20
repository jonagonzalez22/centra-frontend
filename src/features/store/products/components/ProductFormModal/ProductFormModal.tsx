import { useEffect } from 'react';
import { Form } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import { ProductForm } from '../ProductForm';
import { useProductForm, buildInitialValuesFromProduct } from '../../hooks/useProductForm';
import { useProductsContext } from '../../context/ProductsContext';
import type { Product, CreateProductDto } from '../../interfaces/product.interface';
import './ProductFormModal.css';

interface ProductFormModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product?: Product;
}

export const ProductFormModal = ({ open, onClose, onSuccess, product }: ProductFormModalProps) => {
    const [form] = Form.useForm();
    const { categories, categoriesLoading } = useProductsContext();
    const { loading, createProduct, updateProduct } = useProductForm({ onSuccess });

    const isEditing = !!product;
    const title = isEditing ? 'Editar Producto' : 'Crear Producto';

    useEffect(() => {
        if (open) {
            if (product) {
                form.setFieldsValue(buildInitialValuesFromProduct(product));
            } else {
                form.resetFields();
            }
        }
    }, [open, product, form]);

    const handleSubmit = async (values: CreateProductDto) => {
        if (isEditing && product) {
            await updateProduct(product.id, values);
        } else {
            await createProduct(values);
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
            width={720}
            footer={
                <div className="productFormModalFooter">
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
                            const formEl = document.getElementById(
                                'productForm'
                            ) as HTMLFormElement | null;
                            if (formEl) {
                                formEl.dispatchEvent(
                                    new Event('submit', { cancelable: true, bubbles: true })
                                );
                            }
                        }}
                    />
                </div>
            }
            destroyOnClose={false}
        >
            <ProductForm
                formId="productForm"
                form={form}
                loading={loading}
                categories={categories}
                categoriesLoading={categoriesLoading}
                onSubmit={handleSubmit}
                product={product}
            />
        </Modal>
    );
};
