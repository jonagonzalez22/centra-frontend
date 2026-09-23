import { Alert } from 'antd';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import type { OperationResponse, ReceiptData } from '../../interfaces/sale.interface';
import { SalesService } from '../../services/sales.service';
import { createA4ReceiptPdf, printA4PdfBlob } from '../../documents/a4-pdf.service';
import { printTicketReceipt } from '../../documents/ticket-print.service';

interface SaleSuccessModalProps {
    sale: Pick<OperationResponse, 'id' | 'operation_number'>;
    onClose: () => void;
}

export const SaleSuccessModal: React.FC<SaleSuccessModalProps> = ({ sale, onClose }) => {
    const [receipt, setReceipt] = useState<ReceiptData | null>(null);
    const [loadingReceipt, setLoadingReceipt] = useState(false);
    const [receiptError, setReceiptError] = useState<string | null>(null);
    const [a4PdfBlob, setA4PdfBlob] = useState<Blob | null>(null);

    useEffect(() => {
        setReceipt(null);
        setReceiptError(null);
        setA4PdfBlob(null);
    }, [sale.id]);

    const loadReceipt = async (): Promise<ReceiptData> => {
        if (receipt) return receipt;

        const receiptData = await SalesService.getReceipt(sale.id);
        setReceipt(receiptData);

        return receiptData;
    };

    const handleTicketPrint = async () => {
        setLoadingReceipt(true);
        setReceiptError(null);

        try {
            await printTicketReceipt(await loadReceipt());
        } catch {
            setReceiptError('La venta fue registrada, pero no se pudo imprimir el ticket.');
        } finally {
            setLoadingReceipt(false);
        }
    };

    const handleA4Print = async () => {
        setLoadingReceipt(true);
        setReceiptError(null);

        try {
            const receiptData = await loadReceipt();
            const pdfBlob = a4PdfBlob ?? (await createA4ReceiptPdf(receiptData));

            if (!a4PdfBlob) setA4PdfBlob(pdfBlob);
            await printA4PdfBlob(pdfBlob);
        } catch {
            setReceiptError('La venta fue registrada, pero no se pudo generar el comprobante A4.');
        } finally {
            setLoadingReceipt(false);
        }
    };

    return (
        <>
            <Modal
                open
                onClose={onClose}
                title="Venta registrada"
                width={420}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="default"
                            label="Cerrar"
                            action={onClose}
                            disabled={loadingReceipt}
                        />
                        <Button
                            variant="primary"
                            label="Imprimir ticket"
                            action={handleTicketPrint}
                            loading={loadingReceipt}
                            disabled={loadingReceipt}
                        />
                        <Button
                            variant="primary"
                            label="Imprimir A4"
                            action={handleA4Print}
                            loading={loadingReceipt}
                            disabled={loadingReceipt}
                        />
                    </div>
                }
            >
                <div className="space-y-3">
                    <p className="m-0">
                        Venta <strong>{sale.operation_number}</strong> registrada correctamente.
                    </p>
                    {receiptError && <Alert type="error" message={receiptError} showIcon />}
                </div>
            </Modal>
        </>
    );
};
