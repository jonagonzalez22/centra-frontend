import { Table as AntTable, GetProp, TableProps as AntTableProp } from 'antd';

type TablePaginationConfig = Exclude<GetProp<AntTableProp, 'pagination'>, boolean>;
type TableChangeHandler = GetProp<AntTableProp, 'onChange'>;

type TableColumn = {
    title: string;
    dataIndex?: string;
    key: string;
    render?: (text?: unknown, record?: Record<string, unknown>) => React.ReactNode;
};

interface TableProps {
    columns: TableColumn[];
    dataSource: Record<string, string>[] | [];
    pagination?: TablePaginationConfig;
    loading?: boolean;
    emptyText?: string;
    onChange?: TableChangeHandler;
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
