import { create } from "zustand";
type User = { id: number; nombre: string; email: string; roles: string[] };
type S = {
    token: string | null;
    user: User | null;
    set: (token: string, user: User) => void;
    clear: () => void;
};
export const useAuth = create<S>((set) => ({
    token: localStorage.getItem("trazo_token"),
    user: JSON.parse(localStorage.getItem("trazo_user") || "null"),
    set: (token, user) => {
        localStorage.setItem("trazo_token", token);
        localStorage.setItem("trazo_user", JSON.stringify(user));
        set({ token, user });
    },
    clear: () => {
        localStorage.removeItem("trazo_token");
        localStorage.removeItem("trazo_user");
        set({ token: null, user: null });
    },
}));
