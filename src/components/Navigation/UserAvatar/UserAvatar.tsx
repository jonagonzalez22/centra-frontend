import { Avatar } from 'antd';
import React from 'react';

export interface UserAvatarProps {
    name: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ name }) => {
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return <Avatar className="tw-bg-blue-600 tw-text-white tw-font-medium">{initials}</Avatar>;
};
