// User.ts
export interface User {
    id: number;
    name: string;
    email: string;
    store_id: number | null;
    roles: string[];     
    permissions: string[]; 
}