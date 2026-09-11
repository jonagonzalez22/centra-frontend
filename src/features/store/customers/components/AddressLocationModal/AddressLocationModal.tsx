import { Typography } from 'antd';
import Modal from '@/components/Modal/Modal';
import { Button } from '@/components/Button';
import { AddressMap } from '../AddressMap/AddressMap';
import type { CustomerAddress } from '../../types/customerAddress.types';

interface AddressLocationModalProps {
    open: boolean;
    address: CustomerAddress | null;
    onClose: () => void;
}

const getAddressLine = (address: CustomerAddress) =>
    `${address.street} ${address.number}${address.floor ? `, Piso ${address.floor}` : ''}${
        address.apartment ? `, Depto ${address.apartment}` : ''
    }`;

const getLocalityLine = (address: CustomerAddress) =>
    [address.locality?.name, address.locality?.province?.name].filter(Boolean).join(', ');

export const AddressLocationModal = ({ open, address, onClose }: AddressLocationModalProps) => {
    if (!address || address.latitude === null || address.longitude === null) {
        return null;
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Ubicación del domicilio"
            width={720}
            footer={
                <div className="flex justify-end">
                    <Button variant="default" label="Cerrar" action={onClose} />
                </div>
            }
            destroyOnClose
        >
            <div className="mb-4">
                <Typography.Text strong>{getAddressLine(address)}</Typography.Text>
                {getLocalityLine(address) && (
                    <Typography.Paragraph type="secondary" className="mb-0">
                        {getLocalityLine(address)}
                    </Typography.Paragraph>
                )}
            </div>
            <AddressMap
                latitude={address.latitude}
                longitude={address.longitude}
                readOnly
            />
        </Modal>
    );
};
