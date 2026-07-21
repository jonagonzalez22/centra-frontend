import { Input, Spin, Empty } from 'antd';
import { Search } from 'lucide-react';
import { useProductSearch } from '../../hooks/useProductSearch';
import { usePOSStore } from '../../stores/usePOSStore';

export const POSProductSearch: React.FC = () => {
  const {
    query,
    setQuery,
    results,
    searchingFull,
    showDropdown,
    setShowDropdown,
    activeIndex,
    handleInputChange,
    handlePressEnter,
    handleKeyDown,
    handleFocus,
    handleBlur,
    handleSelect,
  } = useProductSearch();

  const items = usePOSStore((s) => s.items);

  return (
    <div className="relative">
      <Spin spinning={searchingFull} size="small">
        <Input
          placeholder="Buscar producto por nombre, SKU o código de barras..."
          value={query}
          onChange={handleInputChange}
          onPressEnter={handlePressEnter}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          size="large"
          prefix={<Search size={16} className="text-gray-400" />}
          allowClear
          onClear={() => {
            setQuery('');
            setShowDropdown(false);
          }}
        />
      </Spin>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.length > 0 ? (
            results.map((p, index) => {
              const inCart = items.find((i) => i.product_id === p.id);
              const isActive = index === activeIndex;
              return (
                <div
                  key={p.id}
                  className={`px-4 py-2.5 cursor-pointer flex items-center justify-between border-b border-gray-100 last:border-b-0 transition-colors ${
                    isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(p.id);
                  }}
                  onMouseEnter={() => setShowDropdown(true)}
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm truncate ${isActive ? 'font-semibold' : 'font-medium'}`}
                    >
                      {p.name}
                    </div>
                    <div className="text-xs text-gray-400">{p.sku}</div>
                  </div>
                  {inCart && (
                    <span className="text-xs text-blue-500 ml-2 whitespace-nowrap">
                      {inCart.quantity} en carrito
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-6">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  query.length < 2
                    ? 'Escribí al menos 2 caracteres'
                    : 'Sin resultados'
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
