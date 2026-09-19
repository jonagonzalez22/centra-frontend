import { Select, Segmented, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';
import { usePOSStore } from '../../stores/usePOSStore';
import { useCustomerSearch } from '../../hooks/useCustomerSearch';

const MANUAL_OPTION_PREFIX = '__manual_customer_name__:';

export const POSOperationConfig: React.FC = () => {
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const type = usePOSStore((s) => s.type);
  const customer = usePOSStore((s) => s.customer);
  const customer_display_name = usePOSStore((s) => s.customer_display_name);
  const requested_delivery_date = usePOSStore((s) => s.requested_delivery_date);
  const setType = usePOSStore((s) => s.setType);
  const setCustomer = usePOSStore((s) => s.setCustomer);
  const setCustomerDisplayName = usePOSStore((s) => s.setCustomerDisplayName);
  const setRequestedDeliveryDate = usePOSStore((s) => s.setRequestedDeliveryDate);

  const { query, setQuery, results, loading: customerLoading } = useCustomerSearch();
  const manualName = query.trim();
  const selectedManualName = customer_display_name?.trim();
  const customerOptions = results.map((c) => ({
    label: (
      <div className="flex min-w-0 items-center gap-3 py-1.5">
        <span className="min-w-0 flex-1 truncate font-medium text-gray-800">{c.display_name}</span>
        {c.document_number && (
          <span className="max-w-[45%] shrink truncate text-xs text-gray-400">
            {[c.document_type?.name, c.document_number].filter(Boolean).join(' ')}
          </span>
        )}
      </div>
    ),
    value: c.id,
  }));

  const selectManualName = () => {
    setCustomerDisplayName(manualName || null);
    setQuery('');
    setCustomerDropdownOpen(false);
  };

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
          value={
            customer?.id ??
            (selectedManualName ? `${MANUAL_OPTION_PREFIX}${selectedManualName}` : undefined)
          }
          labelRender={({ value, label }) =>
            typeof value === 'string' && value.startsWith(MANUAL_OPTION_PREFIX) ? (
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 truncate">
                <span className="truncate font-medium text-gray-800">{selectedManualName}</span>
                <span className="shrink-0 text-xs text-gray-400">· Solo para esta venta</span>
              </span>
            ) : customer ? (
              <span className="truncate font-medium text-gray-800">{customer.display_name}</span>
            ) : (
              label
            )
          }
          searchValue={query}
          placeholder={type === 'sale' ? 'Buscar o ingresar nombre...' : 'Buscar cliente...'}
          notFoundContent={
            customerLoading
              ? 'Buscando...'
              : query.length < 2
                ? 'Escribí al menos 2 caracteres'
                : 'No encontramos clientes con ese nombre'
          }
          filterOption={false}
          defaultActiveFirstOption={false}
          listItemHeight={40}
          listHeight={200}
          loading={customerLoading}
          open={customerDropdownOpen}
          onOpenChange={setCustomerDropdownOpen}
          onSearch={(value) => {
            if (customer || customer_display_name) {
              setCustomer(null);
              setCustomerDisplayName(null);
            }
            setQuery(value.slice(0, 100));
          }}
          onSelect={(value) => {
            if (value.startsWith(MANUAL_OPTION_PREFIX)) {
              setCustomerDisplayName(value.slice(MANUAL_OPTION_PREFIX.length).trim() || null);
            } else {
              const found = results.find((c) => c.id === value);
              if (found) setCustomer(found);
            }
            setQuery('');
            setCustomerDropdownOpen(false);
          }}
          onClear={() => {
            setCustomer(null);
            setCustomerDisplayName(null);
            setQuery('');
          }}
          allowClear
          style={{ width: '100%' }}
          options={customerOptions}
          popupRender={(menu) =>
            type === 'sale' && manualName ? (
              <div>
                {menu}
                <div className="border-t border-gray-100">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={selectManualName}
                  >
                    <PlusOutlined className="text-gray-400" />
                    <span className="truncate">Usar “{manualName}” para esta venta</span>
                  </button>
                </div>
              </div>
            ) : (
              menu
            )
          }
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
            format="DD/MM/YYYY"
            className="w-full"
            disabledDate={(current) => current && current.isBefore(dayjs(), 'day')}
          />
        </div>
      )}
    </div>
  );
};
