import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';
import type { AnchorHTMLAttributes } from 'react';

export type TextLinkProps = LinkProps;

const TextLink = ({ to, children, ...linkProps }: TextLinkProps) => {
    if (to === '#') {
        const anchorProps = linkProps as AnchorHTMLAttributes<HTMLAnchorElement>;

        return (
            <a href="#" {...anchorProps}>
                {children}
            </a>
        );
    }

    return (
        <Link to={to} {...linkProps}>
            {children}
        </Link>
    );
};

export default TextLink;
