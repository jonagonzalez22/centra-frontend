import { Tabs as AntTabs } from 'antd';

export interface TabsItem {
    key: string;
    label: string;
    children: React.ReactNode;
    disabled?: boolean;
}

interface TabsProps {
    items: TabsItem[];
    defaultActiveKey?: string;
    activeKey?: string;
    onChange?: (key: string) => void;
    className?: string;
}

const Tabs: React.FC<TabsProps> = ({
    items,
    defaultActiveKey,
    activeKey,
    onChange,
    className,
}) => {
    return (
        <AntTabs
            items={items}
            defaultActiveKey={defaultActiveKey}
            activeKey={activeKey}
            onChange={onChange}
            className={className}
            animated={{ inkBar: true, tabPane: false }}
        />
    );
};

export default Tabs;