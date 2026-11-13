import { useAuth } from "../stores/auth";
const base = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const token = useAuth.getState().token;
    const r = await fetch(`${base}${path}`, {
        ...opts,
        headers: {
            ...(opts.body instanceof FormData
                ? {}
                : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...opts.headers,
        },
    });
    if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "No se pudo completar la solicitud");
    }
    return (r.status === 204 ? undefined : await r.json()) as T;
}
