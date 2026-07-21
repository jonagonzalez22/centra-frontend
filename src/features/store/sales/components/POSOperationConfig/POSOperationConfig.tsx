import { Select, Segmented, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { usePOSStore } from '../../stores/usePOSStore';
import { useCustomerSearch } from '../../hooks/useCustomerSearch';

export const POSOperationConfig: React.FC = () => {
  const type = usePOSStore((s) => s.type);
  const customer = usePOSStore((s) => s.customer);
  const requested_delivery_date = usePOSStore((s) => s.requested_delivery_date);
  const setType = usePOSStore((s) => s.setType);
  const setCustomer = usePOSStore((s) => s.setCustomer);
  const setRequestedDeliveryDate = usePOSStore((s) => s.setRequestedDeliveryDate);

  const { query, setQuery, results, loading: customerLoading } = useCustomerSearch();

  return (
    <div className="space-y-3">
      <Segmented
        value={type}
        onChange={(val) => setType(val as 'sale' | 'order')}
        options={[
          { value: 'sale', label: 'Venta por mostrador' },
          { value: 'order', label: 'Pedido programado' },
        ]}
        block
        size="large"
      />

      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Cliente{type === 'sale' ? ' (opcional)' : ' '}
          {type === 'order' && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <Select
          showSearch
          value={customer?.id ?? undefined}
          placeholder="Buscar cliente..."
          notFoundContent={
            customerLoading ? 'Buscando...' : query.length < 2 ? 'Escribí al menos 2 caracteres' : 'Sin resultados'
          }
          filterOption={false}
          loading={customerLoading}
          onSearch={setQuery}
          onSelect={(id) => {
            const found = results.find((c) => c.id === id);
            if (found) setCustomer(found);
          }}
          onClear={() => setCustomer(null)}
          allowClear
          style={{ width: '100%' }}
          options={results.map((c) => ({
            label: (
              <div className="flex justify-between items-center">
                <span>{c.display_name}</span>
                <span className="text-xs text-gray-400">{c.document_number}</span>
              </div>
            ),
            value: c.id,
          }))}
        />
      </div>

      {type === 'order' && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha de entrega</label>
          <DatePicker
            value={requested_delivery_date ? dayjs(requested_delivery_date) : null}
            onChange={(date) =>
              setRequestedDeliveryDate(date ? date.format('YYYY-MM-DD') : null)
            }
            className="w-full"
            disabledDate={(current) => current && current.isBefore(dayjs(), 'day')}
          />
        </div>
      )}
    </div>
  );
};
