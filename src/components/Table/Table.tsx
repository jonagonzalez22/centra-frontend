import { Table as AntTable, GetProp, TableProps as AntTableProp } from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';

type TablePaginationConfig = Exclude<GetProp<AntTableProp, 'pagination'>, boolean>;
type TableChangeHandler = GetProp<AntTableProp, 'onChange'>;

type TableColumn = {
    title: string;
    dataIndex?: string;
    key: string;
    width?: number;
    responsive?: ('xxxl' | 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs')[];
    render?: (text?: unknown, record?: Record<string, unknown>) => React.ReactNode;
};

interface TableProps {
    columns: TableColumn[];
    dataSource: Record<string, unknown>[] | [];
    pagination?: TablePaginationConfig | false;
    loading?: boolean;
    emptyText?: string;
    onChange?: TableChangeHandler;
    scroll?: { x?: number | string };
    size?: 'small' | 'middle' | 'large';
    rowSelection?: TableRowSelection<Record<string, unknown>>;
    components?: AntTableProp['components'];
    onRow?: AntTableProp['onRow'];
}

const Table: React.FC<TableProps> = ({
    columns,
    dataSource,
    pagination,
    loading,
    emptyText,
    onChange,
    scroll,
    size = 'middle',
    rowSelection,
    components,
    onRow,
}) => {
    return (
        <AntTable
            dataSource={dataSource}
            columns={columns}
            rowKey="id"
            pagination={pagination === false ? false : { ...pagination, hideOnSinglePage: true }}
            loading={loading}
            locale={{ emptyText: emptyText || 'No hay datos' }}
            onChange={onChange}
            scroll={scroll}
            size={size}
            rowSelection={rowSelection}
            components={components}
            onRow={onRow}
        />
    );
};

export default Table;
