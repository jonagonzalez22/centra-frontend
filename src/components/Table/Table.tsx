import { Table as AntTable, GetProp, TableProps as AntTableProp } from 'antd';

type TablePaginationConfig = Exclude<GetProp<AntTableProp, 'pagination'>, boolean>;
type TableChangeHandler = GetProp<AntTableProp, 'onChange'>;

type TableColumn = {
    title: string;
    dataIndex?: string;
    key: string;
    responsive?: ('xxxl' | 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs')[];
    render?: (text?: unknown, record?: Record<string, unknown>) => React.ReactNode;
};

interface TableProps {
    columns: TableColumn[];
    dataSource: Record<string, unknown>[] | [];
    pagination?: TablePaginationConfig;
    loading?: boolean;
    emptyText?: string;
    onChange?: TableChangeHandler;
    scroll?: { x?: number | string };
}

const Table: React.FC<TableProps> = ({
    columns,
    dataSource,
    pagination,
    loading,
    emptyText,
    onChange,
    scroll,
}) => {
    return (
        <AntTable
            dataSource={dataSource}
            columns={columns}
            rowKey="id"
            pagination={{ ...pagination, hideOnSinglePage: true }}
            loading={loading}
            locale={{ emptyText: emptyText || 'No hay datos' }}
            onChange={onChange}
            scroll={scroll}
        />
    );
};

export default Table;
