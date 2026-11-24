import { useEffect, useState, useRef } from 'react';
import { Form, Input, Select, Checkbox, Modal, Spin, message } from 'antd';
import { EnvironmentOutlined, InfoCircleOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import { GeocodingService } from '@/features/shared/geocoding/services/geocoding.service';
import api from '@/api/api.config';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import { AddressMap, type AddressMapRef } from '../AddressMap';
import type {
    CustomerAddress,
    CreateCustomerAddressDto,
    UpdateCustomerAddressDto,
    AddressType,
} from '../../types/customerAddress.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { ApiListResponse } from '@/interfaces/ApiListResponse.interface';
import './AddressFormDrawer.css';

interface ProvinceOption {
    id: string;
    name: string;
}

interface LocalityOption {
    id: string;
    name: string;
}

const ADDRESS_TYPE_OPTIONS: { label: string; value: AddressType }[] = [
    { label: 'Entrega', value: 'delivery' },
    { label: 'Cobranza', value: 'billing' },
    { label: 'Otro', value: 'other' },
];

interface AddressFormDrawerProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    address?: CustomerAddress;
    addresses: CustomerAddress[];
    onCreate: (dto: CreateCustomerAddressDto) => Promise<void>;
    onUpdate: (id: string, dto: UpdateCustomerAddressDto) => Promise<void>;
}

export const AddressFormDrawer: React.FC<AddressFormDrawerProps> = ({
    open,
    onClose,
    onSuccess,
    address,
    addresses,
    onCreate,
    onUpdate,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [provinceOptions, setProvinceOptions] = useState<{ label: string; value: string }[]>([]);
    const [localityOptions, setLocalityOptions] = useState<{ label: string; value: string }[]>([]);
    const [localitiesLoading, setLocalitiesLoading] = useState(false);
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [locationStatus, setLocationStatus] = useState<'none' | 'pending' | 'confirmed' | 'legacy'>('none');
    const [locationSource, setLocationSource] = useState<'geocoding' | 'manual' | 'coordinates' | 'shared_link' | null>(null);
    const [locationLabel, setLocationLabel] = useState<string | null>(null);
    const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
    const [geocodingLoading, setGeocodingLoading] = useState(false);
    const [pasteModalOpen, setPasteModalOpen] = useState(false);
    const [pastedValue, setPastedValue] = useState('');
    const [pasteLoading, setPasteLoading] = useState(false);
    const [locationConfirmationOpen, setLocationConfirmationOpen] = useState(false);
    const [pendingSubmitValues, setPendingSubmitValues] = useState<Record<string, unknown> | null>(null);
    const [locationHighlighted, setLocationHighlighted] = useState(false);
    const [locationJustConfirmed, setLocationJustConfirmed] = useState(false);
    const mapRef = useRef<AddressMapRef>(null);
    const locationSectionRef = useRef<HTMLDivElement>(null);
    const submittingRef = useRef(false);
    const reviewLocationRequestedRef = useRef(false);

    const isEditing = !!address;
    const title = isEditing ? 'Editar Domicilio' : 'Agregar Domicilio';
    const hasAnotherDeliveryAddress = addresses.some(
        (item) => item.type === 'delivery' && item.id !== address?.id
    );
    const addressTypeOptions = ADDRESS_TYPE_OPTIONS.map((option) => ({
        ...option,
        disabled: option.value === 'delivery' && hasAnotherDeliveryAddress,
    }));

    const fetchProvinces = async () => {
        try {
            const { data } = await api.get<ApiListResponse<{ items: ProvinceOption[] }>>(
                API_ENDPOINTS.STORE.GEOGRAPHY.PROVINCES
            );
            setProvinceOptions(data.data.items.map((p) => ({ label: p.name, value: p.id })));
        } catch {
            message.error('Error al cargar las provincias.');
        }
    };

    const fetchLocalities = async (provinceId: string) => {
        setLocalitiesLoading(true);
        try {
            const { data } = await api.get<ApiListResponse<{ items: LocalityOption[] }>>(
                `${API_ENDPOINTS.STORE.GEOGRAPHY.PROVINCE_LOCALITIES(provinceId)}?paginate=false`
            );
            setLocalityOptions(data.data.items.map((l) => ({ label: l.name, value: l.id })));
        } catch {
            message.error('Error al cargar las localidades.');
        } finally {
            setLocalitiesLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;

        fetchProvinces();

        if (address) {
            form.setFieldsValue({
                street: address.street,
                number: address.number,
                floor: address.floor ?? undefined,
                apartment: address.apartment ?? undefined,
                postal_code: address.postal_code ?? undefined,
                province_id: address.locality?.province?.id,
                locality_id: address.locality?.id,
                observations: address.observations ?? undefined,
                type: address.type,
                is_main: address.is_main,
            });
            setLatitude(address.latitude);
            setLongitude(address.longitude);
            setLocationStatus(address.location_status ?? (address.latitude === null ? 'none' : 'legacy'));
            setLocationSource(address.location_source ?? null);
            setLocationHighlighted(false);
            setLocationJustConfirmed(false);
            setLocalityOptions([]);

            if (address.locality?.province?.id) {
                setSelectedProvinceId(address.locality.province.id);
                fetchLocalities(address.locality.province.id);
            }
        } else {
            form.resetFields();
            setLatitude(null);
            setLongitude(null);
            setLocationStatus('none');
            setLocationSource(null);
            setLocationLabel(null);
            setLocationHighlighted(false);
            setLocationJustConfirmed(false);
            setSelectedProvinceId(null);
            setLocalityOptions([]);
        }
    }, [open, address, form]);

    const handleProvinceChange = (provinceId: string) => {
        setSelectedProvinceId(provinceId);
        form.setFieldsValue({ locality_id: undefined });
        setLocalityOptions([]);
        if (provinceId) {
            fetchLocalities(provinceId);
        }
    };

    const handleCoordinatesChange = (lat: number, lng: number) => {
        setLatitude(lat);
        setLongitude(lng);
        setLocationStatus('pending');
        setLocationSource('manual');
        setLocationJustConfirmed(false);
    };

    const invalidateLocation = () => {
        if (latitude === null && longitude === null) return;
        setLatitude(null);
        setLongitude(null);
        setLocationStatus('none');
        setLocationSource(null);
        setLocationLabel(null);
        setLocationJustConfirmed(false);
    };

    const formValues = Form.useWatch([], form);
    const isDeliveryAddress = formValues?.type === 'delivery';
    const canSearchLocation = !!(
        formValues?.street &&
        formValues?.number &&
        selectedProvinceId &&
        formValues?.locality_id
    );

    const handleSearchLocation = async () => {
        const street = form.getFieldValue('street') as string | undefined;
        const number = form.getFieldValue('number') as string | undefined;
        const localityId = form.getFieldValue('locality_id') as string | undefined;

        if (!street || !number || !selectedProvinceId || !localityId) return;

        const provinceName =
            provinceOptions.find((p) => p.value === selectedProvinceId)?.label ?? '';
        const localityName =
            localityOptions.find((l) => l.value === localityId)?.label ?? '';

        const fullAddress = `${street} ${number}, ${localityName}, ${provinceName}, Argentina`;

        setGeocodingLoading(true);
        try {
            const found = await mapRef.current?.search(fullAddress);
            if (!found) {
                message.warning(
                    'No pudimos encontrar la dirección. Verifique los datos ingresados o utilice la opción "Pegar ubicación".'
                );
            } else {
                setLatitude(found.latitude);
                setLongitude(found.longitude);
                setLocationStatus('pending');
                setLocationSource('geocoding');
                setLocationLabel(found.formatted_address);
                setLocationJustConfirmed(false);
                message.info(found.quality === 'precise' ? 'Revisá el punto y confirmá la ubicación.' : 'Google encontró una ubicación aproximada. Ajustá o confirmá el punto.');
            }
        } finally {
            setGeocodingLoading(false);
        }
    };

    const handlePasteLocation = async () => {
        if (!pastedValue.trim()) return;

        setPasteLoading(true);
        try {
            const result = await GeocodingService.searchAddress(pastedValue.trim());
            setLatitude(result.latitude);
            setLongitude(result.longitude);
            setLocationStatus('pending');
            setLocationSource(result.provider === 'coordinates' ? 'coordinates' : result.provider.endsWith('_link') ? 'shared_link' : 'geocoding');
            setLocationLabel(result.formatted_address);
            setLocationJustConfirmed(false);
            message.success('Ubicación aplicada. Revisala en el mapa y confirmala antes de guardar.');
            setPasteModalOpen(false);
            setPastedValue('');
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'No se pudo resolver la ubicación.');
        } finally {
            setPasteLoading(false);
        }
    };

    const persistAddress = async (values: Record<string, unknown>, confirmLocation: boolean): Promise<boolean> => {
        if (submittingRef.current) return false;

        submittingRef.current = true;
        setLoading(true);
        try {
            const payload = {
                street: values.street as string,
                number: values.number as string,
                floor: values.floor as string | null,
                apartment: values.apartment as string | null,
                postal_code: (values.postal_code as string | undefined)?.trim() || null,
                locality_id: values.locality_id as string,
                observations: values.observations as string | null,
                type: values.type as AddressType,
                latitude,
                longitude,
                confirm_location: confirmLocation,
                location_source: locationSource,
                is_main: values.is_main as boolean,
            };

            if (isEditing && address) {
                await onUpdate(address.id, payload);
            } else {
                await onCreate(payload);
            }
            onSuccess();
            return true;
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.errors) {
                const fieldErrors = Object.entries(apiError.errors).map(([field, messages]) => ({
                    name: [field],
                    errors: messages as string[],
                }));
                form.setFields(fieldErrors as Parameters<typeof form.setFields>[0]);
            }
            return false;
        } finally {
            submittingRef.current = false;
            setLoading(false);
        }
    };

    const handleSubmit = (values: Record<string, unknown>) => {
        if (values.type === 'delivery' && locationStatus !== 'confirmed') {
            setPendingSubmitValues(values);
            setLocationConfirmationOpen(true);
            return;
        }

        void persistAddress(values, locationStatus === 'confirmed');
    };

    const scrollToLocationSection = () => {
        window.requestAnimationFrame(() => {
            const section = locationSectionRef.current;
            const drawerBody = section?.closest('.ant-drawer-body');
            if (!section || !(drawerBody instanceof HTMLElement)) return;

            drawerBody.scrollTo({
                top: Math.max(0, section.offsetTop - drawerBody.offsetTop - 12),
                behavior: 'smooth',
            });

            window.setTimeout(() => setLocationHighlighted(false), 1800);
        });
    };

    const reviewLocation = () => {
        reviewLocationRequestedRef.current = true;
        setLocationHighlighted(true);
        setLocationConfirmationOpen(false);
    };

    const handleLocationConfirmationOpenChange = (visible: boolean) => {
        if (visible || !reviewLocationRequestedRef.current) return;

        reviewLocationRequestedRef.current = false;
        scrollToLocationSection();
    };

    const confirmLocation = () => {
        setLocationStatus('confirmed');
        setLocationJustConfirmed(true);
        setLocationHighlighted(false);
    };

    const saveWithoutLocationConfirmation = () => {
        if (!pendingSubmitValues || loading) return;

        const values = pendingSubmitValues;
        setLocationConfirmationOpen(false);
        setPendingSubmitValues(null);
        void persistAddress(values, false).then((saved) => {
            if (saved) {
                message.info('Domicilio guardado. La ubicación deberá confirmarse antes de utilizarla para repartos.');
            }
        });
    };

    const handleClose = () => {
        if (!loading) onClose();
    };

    return (
        <>
            <Drawer
                open={open}
                onClose={handleClose}
                title={title}
                width={560}
                footer={
                    <div className="flex items-center justify-end gap-3">
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
                            action={() => form.submit()}
                        />
                    </div>
                }
                destroyOnClose={false}
            >
                <Form
                    id="addressForm"
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    validateTrigger="onBlur"
                >
                    <div className="grid grid-cols-2 gap-3">
                        <Form.Item
                            name="street"
                            label="Calle"
                            rules={[{ required: true, message: 'La calle es obligatoria.' }]}
                            className="col-span-1"
                        >
                            <Input placeholder="Av. Corrientes" onChange={invalidateLocation} />
                        </Form.Item>

                        <Form.Item
                            name="number"
                            label="Altura"
                            rules={[{ required: true, message: 'La altura es obligatoria.' }]}
                            className="col-span-1"
                        >
                            <Input placeholder="1000" onChange={invalidateLocation} />
                        </Form.Item>

                        <Form.Item name="floor" label="Piso" className="col-span-1">
                            <Input placeholder="3" />
                        </Form.Item>

                        <Form.Item name="apartment" label="Depto" className="col-span-1">
                            <Input placeholder="A" />
                        </Form.Item>

                        <Form.Item
                            name="postal_code"
                            label="Código Postal (opcional)"
                            className="col-span-2"
                        >
                            <Input placeholder="C1001" />
                        </Form.Item>

                        <Form.Item
                            name="province_id"
                            label="Provincia"
                            className="col-span-1"
                            rules={[{ required: true, message: 'La provincia es obligatoria.' }]}
                        >
                            <Select
                                placeholder="Seleccioná una provincia"
                                options={provinceOptions}
                                onChange={(value) => { invalidateLocation(); handleProvinceChange(value); }}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                            />
                        </Form.Item>

                        <Form.Item
                            name="locality_id"
                            label="Localidad"
                            className="col-span-1"
                            rules={[{ required: true, message: 'La localidad es obligatoria.' }]}
                        >
                            <Select
                                placeholder={
                                    selectedProvinceId
                                        ? 'Seleccioná una localidad'
                                        : 'Primero seleccioná una provincia'
                                }
                                options={localityOptions}
                                disabled={!selectedProvinceId}
                                loading={localitiesLoading}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                onChange={invalidateLocation}
                            />
                        </Form.Item>

                        <Form.Item
                            name="type"
                            label="Tipo"
                            rules={[{ required: true, message: 'El tipo de dirección es obligatorio.' }]}
                            className="col-span-2"
                        >
                            <Select
                                placeholder="Seleccioná el tipo de domicilio"
                                options={addressTypeOptions}
                            />
                        </Form.Item>

                        <Form.Item
                            name="observations"
                            label="Referencias para la entrega"
                            className="col-span-2"
                        >
                            <Input.TextArea
                                placeholder="Portón negro.
Casa de dos plantas.
Llamar antes de llegar.
Ingreso por calle lateral."
                                rows={3}
                            />
                        </Form.Item>

                        <Form.Item
                            name="is_main"
                            valuePropName="checked"
                            className="col-span-2"
                        >
                            <Checkbox>Domicilio Principal</Checkbox>
                        </Form.Item>
                    </div>

                    <div
                        ref={locationSectionRef}
                        className={`mt-4 rounded-md ${locationHighlighted ? 'ring-2 ring-blue-300 ring-offset-2 p-2' : ''}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                {isDeliveryAddress ? 'Ubicación de entrega' : 'Ubicación del domicilio'}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="default"
                                    size="small"
                                    label="Pegar ubicación"
                                    icon={<PaperClipOutlined />}
                                    action={() => setPasteModalOpen(true)}
                                />
                                <Button
                                    variant="primary"
                                    size="small"
                                    label="Buscar ubicación"
                                    icon={<EnvironmentOutlined />}
                                    disabled={!canSearchLocation}
                                    loading={geocodingLoading}
                                    action={handleSearchLocation}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                            Busque automáticamente la ubicación utilizando la dirección ingresada o pegue una ubicación enviada por el cliente.
                        </p>
                        {locationStatus === 'confirmed' ? (
                            <div className="delivery-location-status delivery-location-status--confirmed">
                                <strong>{isDeliveryAddress ? 'Ubicación lista para entregas' : 'Ubicación confirmada'}</strong>
                                {locationJustConfirmed && (
                                    <span>
                                        {isDeliveryAddress
                                            ? 'El punto de entrega está verificado. Guardá el domicilio para conservar los cambios.'
                                            : 'El punto del domicilio está verificado. Guardá el domicilio para conservar los cambios.'}
                                    </span>
                                )}
                            </div>
                        ) : latitude !== null && longitude !== null ? (
                            <div className={`delivery-location-status ${isDeliveryAddress ? 'delivery-location-status--pending' : 'delivery-location-status--informative'}`}>
                                <InfoCircleOutlined aria-hidden />
                                <div>
                                    <strong>Ubicación pendiente de confirmación</strong>
                                    <span>
                                        {isDeliveryAddress
                                            ? 'Verificá que el marcador indique el punto correcto de entrega. Podés moverlo para ajustarlo.'
                                            : 'Verificá que el marcador coincida con la dirección del domicilio. Podés moverlo para ajustarlo.'}
                                    </span>
                                    {locationLabel && <small>Resultado encontrado: {locationLabel}</small>}
                                </div>
                            </div>
                        ) : (
                            <p className="delivery-location-empty-state">Seleccioná un punto en el mapa, buscá una dirección o pegá una ubicación para poder confirmarla.</p>
                        )}
                        <AddressMap
                            ref={mapRef}
                            latitude={latitude}
                            longitude={longitude}
                            onCoordinatesChange={handleCoordinatesChange}
                            isSearching={geocodingLoading}
                        />
                        {latitude !== null && longitude !== null && locationStatus !== 'confirmed' && (
                            <div className="delivery-location-confirmation-action">
                                <Button
                                    variant="primary"
                                    size="large"
                                    label={isDeliveryAddress ? 'Confirmar este punto de entrega' : 'Confirmar ubicación'}
                                    action={confirmLocation}
                                />
                            </div>
                        )}
                    </div>
                </Form>
            </Drawer>

            <Modal
                title="¿Querés confirmar la ubicación?"
                open={locationConfirmationOpen}
                onCancel={() => setLocationConfirmationOpen(false)}
                afterOpenChange={handleLocationConfirmationOpenChange}
                maskClosable={!loading}
                keyboard={!loading}
                rootClassName="location-confirmation-modal"
                footer={
                    <div className="location-confirmation-actions">
                        <Button
                            variant="text"
                            label="Cancelar"
                            disabled={loading}
                            action={() => {
                                setLocationConfirmationOpen(false);
                                setPendingSubmitValues(null);
                            }}
                        />
                        <Button
                            variant="default"
                            label="Guardar sin confirmar"
                            loading={loading}
                            disabled={!pendingSubmitValues}
                            action={saveWithoutLocationConfirmation}
                        />
                        <Button
                            variant="primary"
                            label="Ir al mapa y confirmar"
                            disabled={loading}
                            action={reviewLocation}
                        />
                    </div>
                }
                width={620}
            >
                <div className="location-confirmation-content">
                    <p className="location-confirmation-message">
                        Verificá que el marcador indique la ubicación correcta del domicilio.
                    </p>
                    <div className="location-confirmation-note">
                        <InfoCircleOutlined aria-hidden />
                        <span>Podés guardar sin confirmar, pero este domicilio no estará disponible para repartos hasta verificar su ubicación.</span>
                    </div>
                </div>
            </Modal>

            <Modal
                title="Pegar ubicación"
                open={pasteModalOpen}
                maskClosable={!pasteLoading}
                keyboard={!pasteLoading}
                onCancel={() => {
                    if (pasteLoading) return;
                    setPasteModalOpen(false);
                    setPastedValue('');
                }}
                footer={[
                    <Button
                        key="cancel"
                        variant="default"
                        label="Cancelar"
                        disabled={pasteLoading}
                        action={() => {
                            setPasteModalOpen(false);
                            setPastedValue('');
                        }}
                    />,
                    <Button
                        key="accept"
                        variant="primary"
                        label="Resolver"
                        loading={pasteLoading}
                        disabled={!pastedValue.trim()}
                        action={handlePasteLocation}
                    />,
                ]}
                width={480}
            >
                <div className="relative">
                    {pasteLoading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                            <Spin size="large" />
                        </div>
                    )}
                    <p className="text-sm text-gray-600 mb-3">
                        Pegá aquí un enlace de Google Maps, Apple Maps o unas coordenadas.
                    </p>
                    <Input
                        value={pastedValue}
                        onChange={(e) => setPastedValue(e.target.value)}
                        placeholder="Pegue aquí link de Google Maps, Apple Maps o coordenadas"
                        disabled={pasteLoading}
                    />
                </div>
            </Modal>
        </>
    );
};
