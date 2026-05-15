import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';

export type TextLinkProps = LinkProps;

const TextLink = ({ to, children, ...linkProps }: TextLinkProps) => {
    return (
        <Link to={to} {...linkProps}>
            {children}
        </Link>
    );
};

export default TextLink;
