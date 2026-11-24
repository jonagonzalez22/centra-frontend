import { Spin, Typography } from 'antd';
import { useState } from 'react';
import Modal from '@/components/Modal/Modal';
import { Button } from '@/components/Button';
import { AddressMap } from '../AddressMap/AddressMap';
import { toMapCoordinates } from '../AddressMap/coordinates';
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
    const [mapReady, setMapReady] = useState(false);

    const handleClose = () => {
        setMapReady(false);
        onClose();
    };

    if (!address) {
        return null;
    }

    const coordinates = toMapCoordinates(address.latitude, address.longitude);

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Ubicación del domicilio"
            width={720}
            footer={
                <div className="flex justify-end">
                    <Button variant="default" label="Cerrar" action={onClose} />
                </div>
            }
            destroyOnClose
            afterOpenChange={setMapReady}
        >
            <div className="mb-4">
                <Typography.Text strong>{getAddressLine(address)}</Typography.Text>
                {getLocalityLine(address) && (
                    <Typography.Paragraph type="secondary" className="mb-0">
                        {getLocalityLine(address)}
                    </Typography.Paragraph>
                )}
            </div>
            {!coordinates ? (
                <Typography.Paragraph type="secondary" className="mb-0">
                    Este domicilio todavía no tiene una ubicación válida. Podés editarlo para buscar o confirmar el punto.
                </Typography.Paragraph>
            ) : mapReady ? (
                <AddressMap
                    latitude={coordinates.lat}
                    longitude={coordinates.lng}
                    readOnly
                />
            ) : (
                <div
                    className="flex items-center justify-center"
                    style={{ height: 280 }}
                    aria-label="Preparando mapa"
                >
                    <Spin />
                </div>
            )}
        </Modal>
    );
};
