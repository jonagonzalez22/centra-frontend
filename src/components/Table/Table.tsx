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
}

const Table: React.FC<TableProps> = ({ columns, dataSource, pagination, loading, emptyText }) => {
    return (
        <AntTable
            dataSource={dataSource}
            columns={columns}
            pagination={{ ...pagination, hideOnSinglePage: true }}
            loading={loading}
            locale={{ emptyText: emptyText || 'No hay datos' }}
        />
    );
};

export default Table;
