import React from 'react';
import { useStores } from '../../hooks/useStores';

export const StoreList: React.FC = () => {
  const { stores, loading, error, refetch } = useStores();

  if (loading) return <div className="p-4 text-blue-600">Cargando tiendas...</div>;

  if (error)
    return (
      <div className="p-4 text-red-600">
        {error}
        <button onClick={refetch} className="ml-2 underline">
          Reintentar
        </button>
      </div>
    );

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Listado de Tiendas (MVP)</h2>

      {stores.length === 0 ? (
        <p className="text-gray-500">No hay tiendas registradas aún.</p>
      ) : (
        <ul className="space-y-3">
          {stores.map((store) => (
            <li key={store.id} className="p-4 border rounded-md hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg text-indigo-700">{store.name}</p>
                  <p className="text-sm text-gray-600">{store.email || 'Sin email'}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    store.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {store.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={refetch}
        className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
      >
        Actualizar Lista
      </button>
    </div>
  );
};
