import { Table as AntTable, GetProp, TableProps as AntTableProp } from 'antd';

type TablePaginationConfig = Exclude<GetProp<AntTableProp, 'pagination'>, boolean>;

type TableColumn = {
    title: string;
    dataIndex?: string;
    key: string;
    render?: (text?: string, record?: any) => React.ReactNode;
};

interface TableProps {
    columns: TableColumn[];
    dataSource: Record<string, string>[] | [];
    pagination?: TablePaginationConfig;
    loading?: boolean;
    emptyText?: string;
    onChange?: (
        pagination: TablePaginationConfig,
        filters: Record<string, any>,
        sorter: Record<string, any>
    ) => void;
}

const Table: React.FC<TableProps> = ({
    columns,
    dataSource,
    pagination,
    loading,
    emptyText,
    onChange,
}) => {
    return (
        <AntTable
            dataSource={dataSource}
            columns={columns}
            pagination={{ ...pagination, hideOnSinglePage: true }}
            loading={loading}
            locale={{ emptyText: emptyText || 'No hay datos' }}
            onChange={onChange}
        />
    );
};

export default Table;
