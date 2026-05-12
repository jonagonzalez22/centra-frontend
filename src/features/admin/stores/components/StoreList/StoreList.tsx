import React from 'react';
import { useStores } from '../../hooks/useStores';
import './StoreList.css';

export const StoreList: React.FC = () => {
    const { stores, loading, error, refetch } = useStores();

    if (loading) return <div className="storeListLoadingMessage">Cargando tiendas...</div>;

    if (error)
        return (
            <div className="storeListErrorMessage">
                {error}
                <button onClick={() => refetch()} className="storeListRetryButton">
                    Reintentar
                </button>
            </div>
        );

    return (
        <div className="storeListContainer">
            <h2 className="storeListTitle">Listado de Tiendas (MVP)</h2>

            {stores.length === 0 ? (
                <p className="storeListEmptyMessage">No hay tiendas registradas aún.</p>
            ) : (
                <ul className="storeListItems">
                    {stores.map((store) => (
                        <li key={store.id} className="storeListItem">
                            <div className="storeListItemContent">
                                <div>
                                    <p className="storeListStoreName">{store.name}</p>
                                    <p className="storeListStoreEmail">{store.email || 'Sin email'}</p>
                                </div>
                                <span
                                    className={`storeListStatusBadge ${
                                        store.is_active
                                            ? 'storeListStatusBadgeActive'
                                            : 'storeListStatusBadgeInactive'
                                    }`}
                                >
                                    {store.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <button onClick={() => refetch()} className="storeListRefreshButton">
                Actualizar Lista
            </button>
        </div>
    );
};