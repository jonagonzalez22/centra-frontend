import { Tag as AntTag } from 'antd';

interface TagWrapperProps {
    children: React.ReactNode;
    color?: string;
    className?: string;
}

const Tag: React.FC<TagWrapperProps> = ({ children, color = 'blue', className }) => {
    return (
        <AntTag color={color} className={className}>
            {children}
        </AntTag>
    );
};

export default Tag;