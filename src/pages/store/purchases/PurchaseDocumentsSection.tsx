import { useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
    Button as AntButton,
    DatePicker,
    Empty,
    Form,
    Input,
    InputNumber,
    Popconfirm,
    Select,
    Tooltip,
    message,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import ActionButton from '@/components/ActionButton/ActionButton';
import { CanDo } from '@/components/auth/CanDo';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import Table from '@/components/Table/Table';
import { formatCurrencyWithCents, formatDateShort } from '@/utils/formatters';
import { formatMoneyInput, normalizeMoneyInput, parseMoneyInput } from '@/utils/moneyInput';
import {
    PurchasesService,
    type PurchaseDocument,
    type PurchaseDocumentPayload,
    type PurchaseDocumentType,
    type PurchaseStatus,
} from '@/features/store/purchases/purchases.service';

interface Props {
    purchaseId: string;
    status: PurchaseStatus;
    initialDocuments?: PurchaseDocument[];
}
interface FormValues {
    type: PurchaseDocumentType;
    number: string;
    issued_at: Dayjs;
    total_amount?: string;
    notes?: string;
}
const labels: Record<PurchaseDocumentType, string> = {
    invoice: 'Factura',
    delivery_note: 'Remito',
    credit_note: 'Nota de crédito',
    debit_note: 'Nota de débito',
    other: 'Otro',
};
const amountRequiredTypes: PurchaseDocumentType[] = ['invoice', 'credit_note', 'debit_note'];
const editableStatuses: PurchaseStatus[] = ['ordered', 'partially_received', 'received', 'closed'];
const isPositiveAmount = (amount: string) => {
    const normalized = amount.trim().replace(',', '.');

    return /^\d+(?:\.\d{1,2})?$/.test(normalized) && !/^0+(?:\.0{1,2})?$/.test(normalized);
};

const errorMessage = (error: unknown, fallback: string) => {
    const response = error as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } };
    };
    return (
        Object.values(response.response?.data?.errors ?? {})[0]?.[0] ||
        response.response?.data?.message ||
        fallback
    );
};

export const PurchaseDocumentsSection = ({ purchaseId, status, initialDocuments = [] }: Props) => {
    const [documents, setDocuments] = useState(initialDocuments);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<PurchaseDocument | null>(null);
    const [saving, setSaving] = useState(false);
    const [documentType, setDocumentType] = useState<PurchaseDocumentType>('invoice');
    const [form] = Form.useForm<FormValues>();
    const canManage = editableStatuses.includes(status);

    const startCreate = () => {
        setEditing(null);
        setDocumentType('invoice');
        form.resetFields();
        form.setFieldsValue({ type: 'invoice', issued_at: dayjs() });
        setOpen(true);
    };
    const startEdit = (document: PurchaseDocument) => {
        setEditing(document);
        setDocumentType(document.type);
        form.setFieldsValue({
            type: document.type,
            number: document.number,
            issued_at: dayjs(document.issued_at),
            total_amount: document.total_amount ?? undefined,
            notes: document.notes ?? undefined,
        });
        setOpen(true);
    };
    const close = () => {
        if (saving) return;
        setOpen(false);
    };
    const submit = async (values: FormValues) => {
        const amount = values.total_amount?.trim();
        if (amountRequiredTypes.includes(documentType) && !amount) {
            form.setFields([{ name: 'total_amount', errors: ['Ingresá el importe total.'] }]);
            return;
        }
        if (amount && !isPositiveAmount(amount)) {
            form.setFields([
                {
                    name: 'total_amount',
                    errors: ['Ingresá un importe mayor a cero con hasta 2 decimales.'],
                },
            ]);
            return;
        }
        setSaving(true);
        const payload: PurchaseDocumentPayload = {
            type: documentType,
            number: values.number.trim(),
            issued_at: values.issued_at.format('YYYY-MM-DD'),
            total_amount: amount ? normalizeMoneyInput(amount) : null,
            notes: values.notes?.trim() || null,
        };
        try {
            const saved = editing
                ? await PurchasesService.updateDocument(purchaseId, editing.id, payload)
                : await PurchasesService.createDocument(purchaseId, payload);
            setDocuments((current) =>
                editing
                    ? current.map((item) => (item.id === saved.id ? saved : item))
                    : [saved, ...current]
            );
            setOpen(false);
            message.success(editing ? 'Documento actualizado.' : 'Documento registrado.');
        } catch (error) {
            message.error(errorMessage(error, 'No se pudo guardar el documento.'));
        } finally {
            setSaving(false);
        }
    };
    const remove = async (document: PurchaseDocument) => {
        try {
            await PurchasesService.deleteDocument(purchaseId, document.id);
            setDocuments((current) => current.filter((item) => item.id !== document.id));
            message.success('Documento eliminado.');
        } catch (error) {
            message.error(errorMessage(error, 'No se pudo eliminar el documento.'));
        }
    };
    const columns = [
        {
            title: 'Tipo',
            key: 'type',
            render: (_: unknown, record?: Record<string, unknown>) =>
                labels[(record as unknown as PurchaseDocument).type],
        },
        {
            title: 'Número',
            key: 'number',
            render: (_: unknown, record?: Record<string, unknown>) =>
                (record as unknown as PurchaseDocument).number,
        },
        {
            title: 'Fecha de emisión',
            key: 'issued_at',
            render: (_: unknown, record?: Record<string, unknown>) =>
                formatDateShort((record as unknown as PurchaseDocument).issued_at),
        },
        {
            title: 'Importe',
            key: 'total_amount',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const amount = (record as unknown as PurchaseDocument).total_amount;

                return (
                    <span className="block">
                        {amount === null ? '—' : formatCurrencyWithCents(Number(amount))}
                    </span>
                );
            },
        },
        {
            title: 'Notas',
            key: 'notes',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const notes = (record as unknown as PurchaseDocument).notes;

                return notes ? (
                    <Tooltip title={notes}>
                        <span className="block max-w-xs truncate">{notes}</span>
                    </Tooltip>
                ) : (
                    '—'
                );
            },
        },
        ...(canManage
            ? [
                  {
                      title: 'Acciones',
                      key: 'actions',
                      width: 96,
                      render: (_: unknown, record?: Record<string, unknown>) => {
                          const document = record as unknown as PurchaseDocument;

                          return (
                              <CanDo permission="purchases.edit">
                                  <div className="flex items-center gap-1">
                                      <ActionButton
                                          icon={<EditOutlined />}
                                          label="Editar documento"
                                          action={() => startEdit(document)}
                                      />
                                      <Popconfirm
                                          title="¿Eliminar este documento?"
                                          description="Esta acción no se puede deshacer."
                                          okText="Eliminar"
                                          cancelText="Cancelar"
                                          okButtonProps={{ danger: true }}
                                          onConfirm={() => void remove(document)}
                                      >
                                          <Tooltip title="Eliminar documento">
                                              <AntButton
                                                  type="text"
                                                  danger
                                                  icon={<DeleteOutlined />}
                                                  aria-label="Eliminar documento"
                                              />
                                          </Tooltip>
                                      </Popconfirm>
                                  </div>
                              </CanDo>
                          );
                      },
                  },
              ]
            : []),
    ];

    return (
        <section className="mt-8" aria-labelledby="purchase-documents-heading">
            <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2
                    id="purchase-documents-heading"
                    className="m-0 text-xl font-semibold text-centra-primary"
                >
                    Documentos del proveedor
                </h2>
                {canManage && (
                    <CanDo permission="purchases.edit">
                        <Button
                            variant="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            action={startCreate}
                            aria-label="Agregar documento"
                            label="Agregar documento"
                        />
                    </CanDo>
                )}
            </div>
            {status === 'draft' && (
                <p className="mb-3 text-sm text-gray-500">
                    Los documentos del proveedor se podrán registrar cuando la compra esté
                    confirmada.
                </p>
            )}
            {!documents.length ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No hay documentos del proveedor registrados."
                />
            ) : (
                <>
                    <div className="hidden md:block">
                        <Table
                            columns={columns as Parameters<typeof Table>[0]['columns']}
                            dataSource={documents as unknown as Record<string, unknown>[]}
                            pagination={false}
                            size="small"
                        />
                    </div>
                    <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white md:hidden">
                        {documents.map((document) => (
                            <article
                                key={document.id}
                                className="p-4"
                                data-testid="purchase-document"
                            >
                                <div className="grid gap-y-3">
                                    <div className="min-w-0">
                                        <p className="m-0 font-semibold">{labels[document.type]}</p>
                                        <p className="m-0 break-words text-sm">{document.number}</p>
                                    </div>
                                    <p className="m-0 text-sm text-gray-500">
                                        {formatDateShort(document.issued_at)}
                                        {document.total_amount !== null && (
                                            <>
                                                {' '}
                                                ·{' '}
                                                {formatCurrencyWithCents(
                                                    Number(document.total_amount)
                                                )}
                                            </>
                                        )}
                                    </p>
                                    {document.notes && (
                                        <p className="mb-0 whitespace-pre-wrap text-sm text-gray-600">
                                            {document.notes}
                                        </p>
                                    )}
                                    {canManage && (
                                        <CanDo permission="purchases.edit">
                                            <div className="flex shrink-0 gap-2">
                                                <Button
                                                    variant="default"
                                                    size="small"
                                                    label="Editar"
                                                    action={() => startEdit(document)}
                                                />
                                                <Popconfirm
                                                    title="¿Eliminar este documento?"
                                                    description="Esta acción no se puede deshacer."
                                                    okText="Eliminar"
                                                    cancelText="Cancelar"
                                                    okButtonProps={{ danger: true }}
                                                    onConfirm={() => void remove(document)}
                                                >
                                                    <Button
                                                        variant="text"
                                                        danger
                                                        size="small"
                                                        label="Eliminar"
                                                    />
                                                </Popconfirm>
                                            </div>
                                        </CanDo>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                </>
            )}
            <Modal
                open={open}
                onClose={close}
                title={editing ? 'Editar documento del proveedor' : 'Agregar documento'}
                width={560}
                loading={saving}
                destroyOnClose={false}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="default"
                            label="Cancelar"
                            disabled={saving}
                            action={close}
                        />
                        <Button
                            label={editing ? 'Guardar cambios' : 'Guardar documento'}
                            loading={saving}
                            disabled={saving}
                            action={() => form.submit()}
                        />
                    </div>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ type: 'invoice', issued_at: dayjs() }}
                    onFinish={(values) => void submit(values)}
                >
                    <Form.Item
                        name="type"
                        label="Tipo"
                        rules={[{ required: true, message: 'Seleccioná el tipo de documento.' }]}
                    >
                        <Select
                            onChange={(value: PurchaseDocumentType) => setDocumentType(value)}
                            options={Object.entries(labels).map(([value, label]) => ({
                                value,
                                label,
                            }))}
                        />
                    </Form.Item>
                    <Form.Item
                        name="number"
                        label="Número"
                        rules={[
                            {
                                required: true,
                                whitespace: true,
                                message: 'Ingresá el número del documento.',
                            },
                            { max: 100, message: 'El número no puede superar 100 caracteres.' },
                        ]}
                    >
                        <Input maxLength={100} />
                    </Form.Item>
                    <Form.Item
                        name="issued_at"
                        label="Fecha de emisión"
                        rules={[{ required: true, message: 'Seleccioná la fecha de emisión.' }]}
                    >
                        <DatePicker className="w-full" format="DD/MM/YYYY" />
                    </Form.Item>
                    <Form.Item
                        name="total_amount"
                        dependencies={['type']}
                        label="Importe total"
                        rules={[
                            {
                                required: amountRequiredTypes.includes(documentType),
                                message: 'Ingresá el importe total.',
                            },
                            {
                                validator: async (_, value?: string) => {
                                    if (value && !isPositiveAmount(value))
                                        throw new Error(
                                            'Ingresá un importe mayor a cero con hasta 2 decimales.'
                                        );
                                },
                            },
                        ]}
                    >
                        <InputNumber<string>
                            stringMode
                            className="w-full"
                            min="0"
                            precision={2}
                            prefix="$"
                            inputMode="decimal"
                            placeholder="Opcional según tipo de documento"
                            formatter={formatMoneyInput}
                            parser={parseMoneyInput}
                        />
                    </Form.Item>
                    <Form.Item
                        name="notes"
                        label="Notas"
                        rules={[
                            { max: 2000, message: 'Las notas no pueden superar 2000 caracteres.' },
                        ]}
                    >
                        <Input.TextArea rows={3} maxLength={2000} />
                    </Form.Item>
                </Form>
            </Modal>
        </section>
    );
};

export default PurchaseDocumentsSection;
