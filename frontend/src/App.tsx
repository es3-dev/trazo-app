import { useEffect, useState } from "react";
import {
    NavLink,
    Navigate,
    Route,
    Routes,
    useNavigate,
    useParams,
} from "react-router-dom";
import {
    BarChart3,
    Building2,
    ClipboardList,
    FileText,
    LogOut,
    Menu,
    Users,
    Settings,
    CalendarDays,
    ClipboardCheck,
} from "lucide-react";
import { api, uploadUrl } from "./services/api";
import { useAuth } from "./stores/auth";
const nav = [
    ["/", "Panel", BarChart3],
    ["/obras", "Obras", Building2],
    ["/personas", "Personal", Users],
    ["/partes", "Partes diarios", ClipboardList],
    ["/planificacion", "Planificación", CalendarDays],
    ["/inspecciones", "Inspecciones", ClipboardCheck],
    ["/documentos", "Documentos", FileText],
    ["/administracion", "Administración", Settings],
] as const;
const today = () => new Date().toISOString().slice(0, 10);
const canAdmin = (roles: string[] = []) =>
    roles.includes("ADMINISTRADOR") || roles.includes("ADMIN");
function Shell({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const { user, clear } = useAuth();
    const go = useNavigate();
    return (
        <div className="shell">
            <aside className={open ? "open" : ""}>
                <div className="brand">
                    <i />
                    TRAZO
                </div>
                <nav>
                    {nav.map(([to, label, I]) => (
                        <NavLink end={to === "/"} to={to} onClick={() => setOpen(false)}>
                            <I size={18} />
                            {label}
                        </NavLink>
                    ))}
                </nav>
                <div className="account">
                    <span>{user?.nombre}</span>
                    <button
                        onClick={() => {
                            clear();
                            go("/login");
                        }}
                    >
                        <LogOut size={17} />
                        Salir
                    </button>
                </div>
            </aside>
            <main>
                <header>
                    <button className="mobile-menu" onClick={() => setOpen(!open)}>
                        <Menu />
                    </button>
                    <div>
                        <small>Control diario de obra</small>
                        <h1>
                            {nav.find((x) => location.pathname === x[0])?.[1] || "TRAZO"}
                        </h1>
                    </div>
                    <div className="header-user">
                        <span>{user?.roles?.[0]?.replace(/_/g, " ") || "Operación"}</span>
                        <b>
                            {user?.nombre
                                ?.split(" ")
                                .map((word: string) => word[0])
                                .join("")
                                .slice(0, 2)}
                        </b>
                    </div>
                </header>
                {children}
            </main>
        </div>
    );
}
function Login() {
    const { set, token } = useAuth();
    const [email, setEmail] = useState("valentina.rojas@trazo.com"),
        [password, setPassword] = useState("Trazo2026!"),
        [error, setError] = useState("");
    if (token) return <Navigate to="/" />;
    return (
        <div className="login">
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                        const d = await api<any>("/auth/login", {
                            method: "POST",
                            body: JSON.stringify({ email, password }),
                        });
                        set(d.token, d.user);
                    } catch (x: any) {
                        setError(x.message);
                    }
                }}
            >
                <div className="brand dark">
                    <i />
                    TRAZO
                </div>
                <h1>Accede a tu operación</h1>
                <p>Control diario, documental y de personal.</p>
                {error && <div className="notice error">{error}</div>}
                <label>
                    Correo
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                    />
                </label>
                <label>
                    Contraseña
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                    />
                </label>
                <button className="primary">Iniciar sesión</button>
            </form>
        </div>
    );
}
function Dashboard() {
    const [d, setD] = useState<any>();
    useEffect(() => {
        void api("/dashboard").then(setD);
    }, []);
    if (!d) return <Loading />;
    const priorities = [
        {
            label: "Firmas pendientes",
            value: d.alerts?.firmasPendientes || 0,
            to: "/partes",
            tone: "dark",
        },
        {
            label: "Plan con retrasos",
            value: d.alerts?.atrasadas || 0,
            to: "/planificacion",
            tone: "warm",
        },
        {
            label: "Inspecciones abiertas",
            value: d.alerts?.inspeccionesAbiertas || 0,
            to: "/inspecciones",
            tone: "cool",
        },
    ];
    return (
        <section className="page command-center">
            <section className="command-hero">
                <div>
                    <p className="eyebrow">Centro de operaciones</p>
                    <h2>Decide qué mover hoy.</h2>
                    <span>
                        Una lectura rápida de ejecución, calidad y control documental de tus
                        obras.
                    </span>
                </div>
                <div className="hero-actions">
                    <NavLink to="/partes/nuevo" className="primary link">
                        Registrar jornada
                    </NavLink>
                    <NavLink to="/planificacion" className="ghostlink">
                        Ver plan de obra →
                    </NavLink>
                </div>
            </section>
            <section className="priority-grid">
                {priorities.map((x) => (
                    <NavLink to={x.to} className={"priority-card " + x.tone}>
                        <span>{x.label}</span>
                        <strong>{x.value}</strong>
                        <small>
                            {x.value ? "Requiere revisión" : "Todo bajo control"} →
                        </small>
                    </NavLink>
                ))}
            </section>
            <section className="operations-layout">
                <section className="panel health-panel">
                    <div className="panel-title">
                        <div>
                            <p className="eyebrow">Semáforo operativo</p>
                            <h3>Salud por obra</h3>
                        </div>
                        <NavLink to="/obras">Ver obras →</NavLink>
                    </div>
                    {d.health?.length ? (
                        d.health.map((h: any) => (
                            <NavLink to={"/obras/" + h.id} className="health-row">
                                <div className={"health-dot " + h.estado.toLowerCase()} />
                                <div className="health-name">
                                    <b>{h.nombre}</b>
                                    <span>{h.expediente || "Sin expediente"}</span>
                                </div>
                                <div className="health-signals">
                                    <span>{h.retrasos} retrasos</span>
                                    <span>{h.inspecciones} inspecciones</span>
                                    <span>{h.firmas} firmas</span>
                                </div>
                                <em className={h.estado.toLowerCase()}>{h.estado}</em>
                            </NavLink>
                        ))
                    ) : (
                        <Empty text="Crea una obra activa para ver su lectura operativa." />
                    )}
                </section>
                <section className="panel pulse-panel">
                    <p className="eyebrow">Pulso del sistema</p>
                    <div className="pulse-number">
                        {d.metrics.activas}
                        <span>obras activas</span>
                    </div>
                    <div className="pulse-stats">
                        <div>
                            <b>{d.metrics.partes}</b>
                            <span>partes</span>
                        </div>
                        <div>
                            <b>{d.metrics.personas}</b>
                            <span>personas</span>
                        </div>
                        <div>
                            <b>{d.metrics.documentos}</b>
                            <span>archivos</span>
                        </div>
                    </div>
                    <NavLink to="/inspecciones" className="ghostlink">
                        Abrir control de calidad →
                    </NavLink>
                </section>
            </section>
            <section className="split activity-layout">
                <section className="panel">
                    <div className="panel-title">
                        <h3>Actividad reciente</h3>
                        <NavLink to="/partes">Ver historial →</NavLink>
                    </div>
                    {d.recent.length ? (
                        d.recent.map((p: any) => (
                            <NavLink
                                to={"/partes/" + p.id}
                                className="activity activity-link"
                            >
                                <b>{p.obra.nombre}</b>
                                <span>
                                    {new Date(p.fecha).toLocaleDateString()} ·{" "}
                                    {p.redactor.nombres} {p.redactor.apellidos}
                                </span>
                            </NavLink>
                        ))
                    ) : (
                        <Empty text="Registra el primer parte de la obra." />
                    )}
                </section>
                <section className="panel next-steps">
                    <p className="eyebrow">Ruta de trabajo</p>
                    <h3>Convierte el campo en evidencia.</h3>
                    <ol>
                        <li>Registra la jornada y sus evidencias.</li>
                        <li>Actualiza avance y bloqueos del plan.</li>
                        <li>Cierra hallazgos de inspección.</li>
                    </ol>
                    <NavLink to="/partes/nuevo">Iniciar registro →</NavLink>
                </section>
            </section>
        </section>
    );
}
function List({ kind }: { kind: "obras" | "personas" }) {
    const [r, setR] = useState<any>();
    const [show, setShow] = useState(false);
    const user = useAuth((s) => s.user);
    const [error, setError] = useState("");
    const [roles, setRoles] = useState<any[]>([]),
        [editPerson, setEditPerson] = useState<any>();
    const load = async () => {
        setError("");
        try {
            const result = await api<any>("/" + kind + "?perPage=100");
            setR(result);
            if (kind === "personas") setRoles(await api<any[]>("/catalogos/roles"));
        } catch (x: any) {
            setError(x.message);
            setR({ data: [] });
        }
    };
    useEffect(() => {
        void load();
    }, []);
    const obra = kind === "obras";
    const remove = async (x: any) => {
        const label = obra ? x.nombre : `${x.nombres} ${x.apellidos}`;
        if (
            !window.confirm(`¿Eliminar ${label}? Esta acción no se puede deshacer.`)
        )
            return;
        try {
            await api("/" + kind + "/" + x.id, { method: "DELETE" });
            load();
        } catch (e: any) {
            setError(e.message);
        }
    };
    return (
        <section className="page">
            <div className="intro">
                <div>
                    <p className="eyebrow">{obra ? "Proyecto" : "Equipo"}</p>
                    <h2>{obra ? "Obras" : "Personal"}</h2>
                </div>
                <button className="primary" onClick={() => setShow(true)}>
                    Añadir {obra ? "obra" : "persona"}
                </button>
            </div>
            <section className="panel table">
                <div className="tablehead">
                    <span>{obra ? "Obra" : "Nombre"}</span>
                    <span>{obra ? "Estado" : "Contacto"}</span>
                    <span>{obra ? "Personal" : "Roles del sistema"}</span>
                    {canAdmin(user?.roles) && <span>Acciones</span>}
                </div>
                {error && (
                    <div className="notice error">
                        No se pudo cargar el listado: {error}.{" "}
                        <button className="textbutton" onClick={load}>
                            Reintentar
                        </button>
                    </div>
                )}
                {!r ? (
                    <Loading />
                ) : (
                    (r.data || []).map((x: any) => (
                        <div className="tablerow">
                            {obra ? (
                                <NavLink className="rowlink" to={"/obras/" + x.id}>
                                    {x.nombre}
                                </NavLink>
                            ) : (
                                <b>{x.nombres + " " + x.apellidos}</b>
                            )}
                            <span>
                                {obra ? (
                                    <em className="status activa">{x.estado}</em>
                                ) : (
                                    x.email || "Sin correo"
                                )}
                            </span>
                            <span className="rolecell">
                                {obra ? (
                                    x._count.asignaciones
                                ) : (
                                    <>
                                        {x.roles.map((z: any) => z.rol.nombre).join(", ") ||
                                            "Sin rol"}
                                        <button
                                            className="textbutton"
                                            onClick={() => setEditPerson(x)}
                                        >
                                            Editar roles
                                        </button>
                                    </>
                                )}
                            </span>
                            {canAdmin(user?.roles) && (
                                <span className="admin-actions">
                                    {!obra && (
                                        <button
                                            className="textbutton"
                                            onClick={() => setEditPerson(x)}
                                        >
                                            Editar
                                        </button>
                                    )}
                                    <button
                                        className="textbutton dangertext"
                                        onClick={() => remove(x)}
                                    >
                                        Eliminar
                                    </button>
                                </span>
                            )}
                        </div>
                    ))
                )}
            </section>
            {show && (
                <NewRecord
                    kind={kind}
                    done={() => {
                        setShow(false);
                        load();
                    }}
                />
            )}
            {editPerson && (
                <RoleEditor
                    person={editPerson}
                    roles={roles}
                    done={() => {
                        setEditPerson(undefined);
                        load();
                    }}
                />
            )}
        </section>
    );
}
function RoleEditor({
    person,
    roles,
    done,
}: {
    person: any;
    roles: any[];
    done: () => void;
}) {
    const [err, setErr] = useState("");
    const selected = person.roles.map((x: any) => String(x.rol.id));
    const save = async (e: any) => {
        e.preventDefault();
        const ids = new FormData(e.currentTarget).getAll("roleIds").map(Number);
        try {
            await api("/personas/" + person.id, {
                method: "PATCH",
                body: JSON.stringify({ roleIds: ids }),
            });
            done();
        } catch (x: any) {
            setErr(x.message);
        }
    };
    return (
        <div className="modal">
            <form className="modalcard roleeditor" onSubmit={save}>
                <h2>
                    Roles de {person.nombres} {person.apellidos}
                </h2>
                <p>Los roles definen sus privilegios dentro de TRAZO.</p>
                {err && <div className="notice error">{err}</div>}
                <label>
                    Roles del sistema
                    <select name="roleIds" multiple defaultValue={selected}>
                        {roles.map((r) => (
                            <option value={r.id}>{r.nombre}</option>
                        ))}
                    </select>
                </label>
                <footer>
                    <button type="button" className="secondary" onClick={done}>
                        Cancelar
                    </button>
                    <button className="primary">Guardar privilegios</button>
                </footer>
            </form>
        </div>
    );
}
function ObraDetail() {
    const { id } = useParams();
    const [obra, setObra] = useState<any>();
    const [people, setPeople] = useState<any[]>([]),
        [roles, setRoles] = useState<any[]>([]),
        [companies, setCompanies] = useState<any[]>([]);
    const [form, setForm] = useState({ personaId: "", rolId: "", empresaId: "" }),
        [msg, setMsg] = useState("");
    const load = () => api<any>("/obras/" + id).then(setObra);
    useEffect(() => {
        void load();
        void Promise.all([
            api<any>("/personas?perPage=100"),
            api<any[]>("/catalogos/roles"),
            api<any[]>("/catalogos/empresas"),
        ]).then(([p, r, e]) => {
            setPeople(p.data);
            setRoles(r);
            setCompanies(e);
        });
    }, [id]);
    const assign = async () => {
        try {
            await api("/obras/" + id + "/asignaciones", {
                method: "POST",
                body: JSON.stringify({
                    personaId: Number(form.personaId),
                    rolId: Number(form.rolId),
                    empresaId: form.empresaId ? Number(form.empresaId) : undefined,
                }),
            });
            setMsg("Personal asignado correctamente.");
            setForm({ personaId: "", rolId: "", empresaId: "" });
            load();
        } catch (x: any) {
            setMsg(x.message);
        }
    };
    const unassign = async (assignId: number) => {
        if (!window.confirm("¿Retirar a esta persona de la obra?")) return;
        try {
            await api("/obras/" + id + "/asignaciones/" + assignId, {
                method: "DELETE",
            });
            setMsg("Asignación retirada.");
            load();
        } catch (x: any) {
            setMsg(x.message);
        }
    };
    if (!obra) return <Loading />;
    return (
        <section className="page">
            <div className="intro">
                <div>
                    <p className="eyebrow">{obra.expediente || "Sin expediente"}</p>
                    <h2>{obra.nombre}</h2>
                    <span>{obra.direccion || "Sin dirección registrada"}</span>
                </div>
                <div className="actions">
                    <NavLink className="primary link" to="/partes/nuevo">
                        Registrar parte
                    </NavLink>
                    <NavLink className="secondary link" to="/obras">
                        Volver a obras
                    </NavLink>
                </div>
            </div>
            <div className="metrics obra-metrics">
                <article>
                    <span>Estado</span>
                    <strong className="metrictext">{obra.estado}</strong>
                </article>
                <article>
                    <span>Partes registrados</span>
                    <strong>{obra.partes.length}</strong>
                </article>
                <article>
                    <span>Documentos</span>
                    <strong>{obra.documentos.length}</strong>
                </article>
                <article>
                    <span>Personal</span>
                    <strong>{obra.asignaciones.length}</strong>
                </article>
            </div>
            <div className="detailgrid">
                <section className="panel">
                    <h3>Ficha de obra</h3>
                    <div className="fact">
                        <span>Promotor</span>
                        <b>{obra.promotor || "—"}</b>
                    </div>
                    <div className="fact">
                        <span>Constructora</span>
                        <b>{obra.empresaConstructora || "—"}</b>
                    </div>
                    <div className="fact">
                        <span>Dirección facultativa</span>
                        <b>{obra.direccionFacultativa || "—"}</b>
                    </div>
                </section>
                <section className="panel">
                    <h3>Asignar personal</h3>
                    {msg && (
                        <div
                            className={
                                "notice " +
                                (msg.includes("correctamente") ? "success" : "error")
                            }
                        >
                            {msg}
                        </div>
                    )}
                    <div className="assignform">
                        <select
                            value={form.personaId}
                            onChange={(e) => setForm({ ...form, personaId: e.target.value })}
                        >
                            <option value="">Persona</option>
                            {people.map((p) => (
                                <option value={p.id}>
                                    {p.nombres} {p.apellidos}
                                </option>
                            ))}
                        </select>
                        <select
                            value={form.rolId}
                            onChange={(e) => setForm({ ...form, rolId: e.target.value })}
                        >
                            <option value="">Rol en obra</option>
                            {roles.map((r) => (
                                <option value={r.id}>{r.nombre}</option>
                            ))}
                        </select>
                        <select
                            value={form.empresaId}
                            onChange={(e) => setForm({ ...form, empresaId: e.target.value })}
                        >
                            <option value="">Empresa (opcional)</option>
                            {companies.map((e) => (
                                <option value={e.id}>{e.razonSocial}</option>
                            ))}
                        </select>
                        <button
                            className="primary"
                            onClick={assign}
                            disabled={!form.personaId || !form.rolId}
                        >
                            Asignar
                        </button>
                    </div>
                </section>
                <section className="panel detailblock">
                    <h3>
                        Personal asignado <small>{obra.asignaciones.length}</small>
                    </h3>
                    {obra.asignaciones.length ? (
                        obra.asignaciones.map((a: any) => (
                            <div className="activity assignment">
                                <div>
                                    <b>
                                        {a.persona.nombres} {a.persona.apellidos} · {a.rol.nombre}
                                    </b>
                                    <span>
                                        {a.empresa?.razonSocial || "Sin empresa asociada"}
                                    </span>
                                </div>
                                <button className="textbutton" onClick={() => unassign(a.id)}>
                                    Retirar
                                </button>
                            </div>
                        ))
                    ) : (
                        <Empty text="Aún no hay personal asignado." />
                    )}
                </section>
                <section className="panel detailblock">
                    <h3>Últimos partes</h3>
                    {obra.partes.length ? (
                        obra.partes.map((p: any) => (
                            <NavLink className="activity rowlink" to={"/partes/" + p.id}>
                                <b>{new Date(p.fecha).toLocaleDateString()}</b>
                                <span>
                                    {p.firmaRedactor
                                        ? "Firmado por redactor"
                                        : "Pendiente de firma"}
                                </span>
                            </NavLink>
                        ))
                    ) : (
                        <Empty text="No hay partes para esta obra." />
                    )}
                </section>
                <section className="panel detailblock">
                    <h3>Documentos vinculados</h3>
                    {obra.documentos.length ? (
                        obra.documentos.map((d: any) => (
                            <div className="activity">
                                <b>{d.nombreOriginal}</b>
                                <span>{d.estado}</span>
                            </div>
                        ))
                    ) : (
                        <Empty text="No hay documentos para esta obra." />
                    )}
                    <NavLink
                        className="secondary link compactlink"
                        to={"/documentos?obraId=" + obra.id}
                    >
                        Ver documentos de la obra
                    </NavLink>
                </section>
            </div>
        </section>
    );
}
function NewRecord({ kind, done }: { kind: string; done: () => void }) {
    const [roles, setRoles] = useState<any[]>([]),
        [occupations, setOccupations] = useState<any[]>([]),
        [companies, setCompanies] = useState<any[]>([]),
        [err, setErr] = useState("");
    useEffect(() => {
        if (kind === "personas")
            void Promise.all([
                api<any[]>("/catalogos/roles"),
                api<any[]>("/catalogos/ocupaciones"),
                api<any[]>("/catalogos/empresas"),
            ]).then(([a, b, c]) => {
                setRoles(a);
                setOccupations(b);
                setCompanies(c);
            });
    }, [kind]);
    const submit = async (e: any) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const o: any = Object.fromEntries(f);
        if (kind === "personas") {
            o.roleIds = f.getAll("roleIds").map(Number);
            o.ocupacionIds = f.getAll("ocupacionIds").map(Number);
            o.empresaId = o.empresaId ? Number(o.empresaId) : undefined;
        }
        try {
            await api("/" + kind, { method: "POST", body: JSON.stringify(o) });
            done();
        } catch (x: any) {
            setErr(x.message);
        }
    };
    const obra = kind === "obras";
    return (
        <div className="modal">
            <form className="modalcard" onSubmit={submit}>
                <h2>Nueva {obra ? "obra" : "persona"}</h2>
                {err && <div className="notice error">{err}</div>}
                {obra ? (
                    <>
                        <label>
                            Nombre
                            <input name="nombre" required />
                        </label>
                        <label>
                            Expediente
                            <input name="expediente" />
                        </label>
                        <label>
                            Dirección
                            <input name="direccion" />
                        </label>
                        <label>
                            Promotor
                            <input name="promotor" />
                        </label>
                        <label>
                            Constructora
                            <input name="empresaConstructora" />
                        </label>
                        <label>
                            Dirección facultativa
                            <input name="direccionFacultativa" />
                        </label>
                    </>
                ) : (
                    <>
                        <label>
                            Nombres
                            <input name="nombres" required />
                        </label>
                        <label>
                            Apellidos
                            <input name="apellidos" required />
                        </label>
                        <label>
                            Documento
                            <input name="documento" />
                        </label>
                        <label>
                            Correo
                            <input name="email" type="email" />
                        </label>
                        <label>
                            Teléfono
                            <input name="telefono" />
                        </label>
                        <label>
                            Empresa
                            <select name="empresaId">
                                <option value="">Sin vincular</option>
                                {companies.map((x) => (
                                    <option value={x.id}>{x.razonSocial}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Roles (Ctrl/Cmd para varios)
                            <select name="roleIds" multiple required>
                                {roles.map((x) => (
                                    <option value={x.id}>{x.nombre}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Ocupaciones
                            <select name="ocupacionIds" multiple>
                                {occupations.map((x) => (
                                    <option value={x.id}>{x.nombre}</option>
                                ))}
                            </select>
                        </label>
                    </>
                )}
                <footer>
                    <button type="button" className="secondary" onClick={done}>
                        Cancelar
                    </button>
                    <button className="primary">Guardar</button>
                </footer>
            </form>
        </div>
    );
}
function Admin() {
    const [types, setTypes] = useState<any>({});
    const [type, setType] = useState("roles"),
        [name, setName] = useState(""),
        [msg, setMsg] = useState("");
    const fields: any = {
        roles: "Rol del sistema",
        ocupaciones: "Ocupación",
        equipos: "Equipo / maquinaria",
        empresas: "Empresa",
        categorias: "Categoría documental",
    };
    const load = () =>
        api<any[]>("/catalogos/" + type)
            .then((x) => setTypes((p: any) => ({ ...p, [type]: x })))
            .catch((e: any) => setMsg(e.message));
    useEffect(() => {
        void load();
    }, [type]);
    const add = async () => {
        const data =
            type === "empresas"
                ? { nitRut: "PEND-" + Date.now(), razonSocial: name }
                : type === "equipos"
                    ? { descripcion: name }
                    : { nombre: name };
        try {
            await api("/catalogos/" + type, {
                method: "POST",
                body: JSON.stringify(data),
            });
            setName("");
            setMsg("Registro creado.");
            load();
        } catch (e: any) {
            setMsg(e.message);
        }
    };
    const rename = async (x: any) => {
        const current = x.nombre || x.razonSocial || x.descripcion;
        const value = window.prompt("Nuevo nombre", current);
        if (!value || value === current) return;
        const data =
            type === "empresas"
                ? { razonSocial: value }
                : type === "equipos"
                    ? { descripcion: value }
                    : { nombre: value };
        try {
            await api("/catalogos/" + type + "/" + x.id, {
                method: "PATCH",
                body: JSON.stringify(data),
            });
            setMsg("Registro actualizado.");
            load();
        } catch (e: any) {
            setMsg(e.message);
        }
    };
    const remove = async (x: any) => {
        const label = x.nombre || x.razonSocial || x.descripcion;
        if (
            !window.confirm(
                "¿Eliminar " +
                label +
                "? Esta acción puede estar bloqueada si ya tiene relaciones.",
            )
        )
            return;
        try {
            await api("/catalogos/" + type + "/" + x.id, { method: "DELETE" });
            setMsg("Registro eliminado.");
            load();
        } catch (e: any) {
            setMsg(e.message);
        }
    };
    return (
        <section className="page">
            <div className="intro">
                <div>
                    <p className="eyebrow">Configuración</p>
                    <h2>Catálogos operativos</h2>
                </div>
            </div>
            <div className="tabs">
                {Object.entries(fields).map(([k, v]) => (
                    <button
                        className={type === k ? "active" : ""}
                        onClick={() => setType(k)}
                    >
                        {v as string}
                    </button>
                ))}
            </div>
            <section className="panel">
                <h3>{fields[type]}</h3>
                {type === "roles" && (
                    <p className="helper">
                        Los roles controlan los privilegios de cada persona.
                    </p>
                )}
                {msg && (
                    <div
                        className={
                            "notice " +
                            (msg.includes("creado") ||
                                msg.includes("actualizado") ||
                                msg.includes("eliminado")
                                ? "success"
                                : "error")
                        }
                    >
                        {msg}
                    </div>
                )}
                <div className="inlineform">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={"Nuevo " + fields[type].toLowerCase()}
                    />
                    <button className="primary" onClick={add} disabled={!name}>
                        Añadir
                    </button>
                </div>
                <div className="catalog catalog-manager">
                    {(types[type] || []).map((x: any) => (
                        <div>
                            <span>{x.nombre || x.razonSocial || x.descripcion}</span>
                            <button onClick={() => rename(x)}>Editar</button>
                            <button className="dangerlink" onClick={() => remove(x)}>
                                Eliminar
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </section>
    );
}
function DailyReport() {
    const [user] = [useAuth((s) => s.user)];
    const [obras, setObras] = useState<any[]>([]),
        [emp, setEmp] = useState<any[]>([]),
        [ocu, setOcu] = useState<any[]>([]),
        [eq, setEq] = useState<any[]>([]),
        [msg, setMsg] = useState("");
    const [pendingPhotos, setPendingPhotos] = useState<
        { file: File; preview: string }[]
    >([]);
    const [report, setReport] = useState<any>({
        obraId: "",
        fecha: today(),
        redactorId: user?.id,
        horaEntrada: "07:00",
        horaSalida: "17:00",
        climas: [{ franjaHoraria: "Mañana", condicion: "Despejado" }],
        asistencias: [],
        maquinarias: [],
        tareas: [
            {
                zona: "",
                descripcion: "",
                avance: "0%",
                trabajoExtra: false,
                autorizado: false,
            },
        ],
        incidencias: [],
        suministros: [],
        observaciones: [],
    });
    useEffect(() => {
        void Promise.all([
            api<any>("/obras"),
            api<any[]>("/catalogos/empresas"),
            api<any[]>("/catalogos/ocupaciones"),
            api<any[]>("/catalogos/equipos"),
        ]).then(([a, b, c, d]) => {
            setObras(a.data);
            setEmp(b);
            setOcu(c);
            setEq(d);
        });
    }, []);
    const set = (k: string, v: any) => setReport((p: any) => ({ ...p, [k]: v }));
    const row = (key: string, base: any) => set(key, [...report[key], base]);
    const field = (key: string, i: number, k: string, v: any) => {
        const a = [...report[key]];
        a[i] = { ...a[i], [k]: v };
        set(key, a);
    };
    const selectPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(event.target.files || []);
        const valid = selected.filter((file) =>
            ["image/jpeg", "image/png", "image/webp"].includes(file.type),
        );
        const available = Math.max(0, 10 - pendingPhotos.length);
        const accepted = valid
            .slice(0, available)
            .map((file) => ({ file, preview: URL.createObjectURL(file) }));
        if (accepted.length)
            setPendingPhotos((current) => [...current, ...accepted]);
        if (valid.length !== selected.length)
            setMsg("Solo se admiten imágenes JPG, PNG o WEBP.");
        else if (selected.length > available)
            setMsg("Puedes adjuntar un máximo de 10 evidencias por parte.");
        event.target.value = "";
    };
    const removePendingPhoto = (index: number) =>
        setPendingPhotos((current) => {
            URL.revokeObjectURL(current[index].preview);
            return current.filter((_, photoIndex) => photoIndex !== index);
        });
    const save = async () => {
        try {
            if (!report.obraId)
                throw new Error("Selecciona la obra antes de guardar el parte.");
            const created = await api<any>("/partes", {
                method: "POST",
                body: JSON.stringify({
                    ...report,
                    obraId: Number(report.obraId),
                    redactorId: Number(report.redactorId),
                    asistencias: report.asistencias.map((x: any) => ({
                        ...x,
                        empresaId: Number(x.empresaId),
                        ocupacionId: Number(x.ocupacionId),
                        numTrabajadores: Number(x.numTrabajadores),
                        horasTotales: Number(x.horasTotales),
                    })),
                    maquinarias: report.maquinarias.map((x: any) => ({
                        ...x,
                        equipoId: Number(x.equipoId),
                    })),
                }),
            });
            if (pendingPhotos.length) {
                const body = new FormData();
                pendingPhotos.forEach(({ file }) => body.append("files", file));
                await api("/partes/" + created.id + "/evidencias", {
                    method: "POST",
                    body,
                });
                pendingPhotos.forEach(({ preview }) => URL.revokeObjectURL(preview));
                setPendingPhotos([]);
            }
            setMsg("Parte diario y evidencias guardados correctamente.");
        } catch (x: any) {
            setMsg(x.message);
        }
    };
    return (
        <section className="page">
            <div className="intro">
                <div>
                    <p className="eyebrow">Bitácora digital</p>
                    <h2>Nuevo parte diario</h2>
                </div>
                <button className="primary" onClick={save}>
                    Guardar parte
                </button>
            </div>
            {msg && (
                <div
                    className={
                        "notice " + (msg.includes("correctamente") ? "success" : "error")
                    }
                >
                    {msg}
                </div>
            )}
            <div className="report">
                <Section title="1. Información general">
                    <label>
                        Obra
                        <select
                            value={report.obraId}
                            onChange={(e) => set("obraId", e.target.value)}
                            required
                        >
                            <option value="">Selecciona una obra</option>
                            {obras.map((x) => (
                                <option value={x.id}>{x.nombre}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Fecha
                        <input
                            type="date"
                            value={report.fecha}
                            onChange={(e) => set("fecha", e.target.value)}
                        />
                    </label>
                    <label>
                        Entrada
                        <input
                            type="time"
                            value={report.horaEntrada}
                            onChange={(e) => set("horaEntrada", e.target.value)}
                        />
                    </label>
                    <label>
                        Salida
                        <input
                            type="time"
                            value={report.horaSalida}
                            onChange={(e) => set("horaSalida", e.target.value)}
                        />
                    </label>
                </Section>
                <Section title="2. Evidencias fotográficas">
                    <div className="pending-evidence">
                        <div>
                            <b>Fotos de la jornada</b>
                            <span>
                                Revisa cada imagen antes de confirmar el parte. Máximo 10
                                archivos.
                            </span>
                        </div>
                        <label className="uploadbutton">
                            Añadir fotos
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={selectPhotos}
                            />
                        </label>
                        {pendingPhotos.length > 0 && (
                            <div className="pending-photogrid">
                                {pendingPhotos.map((photo, index) => (
                                    <figure key={photo.preview}>
                                        <img
                                            src={photo.preview}
                                            alt={`Vista previa de ${photo.file.name}`}
                                        />
                                        <figcaption title={photo.file.name}>
                                            {photo.file.name}
                                        </figcaption>
                                        <button
                                            type="button"
                                            className="remove-photo"
                                            onClick={() => removePendingPhoto(index)}
                                        >
                                            Quitar
                                        </button>
                                    </figure>
                                ))}
                            </div>
                        )}
                    </div>
                </Section>
                <Section title="3. Clima">
                    <Rows
                        rows={report.climas}
                        add={() =>
                            row("climas", {
                                franjaHoraria: "Tarde",
                                condicion: "",
                                temperatura: "",
                                precipitacion: "",
                                vientoMph: "",
                            })
                        }
                    >
                        {(x: any, i: number) => (
                            <>
                                <input
                                    placeholder="Franja"
                                    value={x.franjaHoraria}
                                    onChange={(e) =>
                                        field("climas", i, "franjaHoraria", e.target.value)
                                    }
                                />
                                <input
                                    placeholder="Condición"
                                    value={x.condicion}
                                    onChange={(e) =>
                                        field("climas", i, "condicion", e.target.value)
                                    }
                                />
                                <input
                                    placeholder="Temperatura °C"
                                    value={x.temperatura || ""}
                                    onChange={(e) =>
                                        field("climas", i, "temperatura", e.target.value)
                                    }
                                />
                            </>
                        )}
                    </Rows>
                </Section>
                <Section title="3. Personal y asistencia">
                    <Rows
                        rows={report.asistencias}
                        add={() =>
                            row("asistencias", {
                                empresaId: "",
                                ocupacionId: "",
                                numTrabajadores: "",
                                horasTotales: "",
                            })
                        }
                    >
                        {(x: any, i: number) => (
                            <>
                                <select
                                    value={x.empresaId}
                                    onChange={(e) =>
                                        field("asistencias", i, "empresaId", e.target.value)
                                    }
                                >
                                    <option>Empresa</option>
                                    {emp.map((q) => (
                                        <option value={q.id}>{q.razonSocial}</option>
                                    ))}
                                </select>
                                <select
                                    value={x.ocupacionId}
                                    onChange={(e) =>
                                        field("asistencias", i, "ocupacionId", e.target.value)
                                    }
                                >
                                    <option>Ocupación</option>
                                    {ocu.map((q) => (
                                        <option value={q.id}>{q.nombre}</option>
                                    ))}
                                </select>
                                <input
                                    placeholder="Trabajadores"
                                    type="number"
                                    onChange={(e) =>
                                        field("asistencias", i, "numTrabajadores", e.target.value)
                                    }
                                />
                                <input
                                    placeholder="Horas totales"
                                    type="number"
                                    onChange={(e) =>
                                        field("asistencias", i, "horasTotales", e.target.value)
                                    }
                                />
                            </>
                        )}
                    </Rows>
                </Section>
                <Section title="4. Actividades ejecutadas">
                    <Rows
                        rows={report.tareas}
                        add={() =>
                            row("tareas", {
                                zona: "",
                                descripcion: "",
                                avance: "0%",
                                trabajoExtra: false,
                                autorizado: false,
                            })
                        }
                    >
                        {(x: any, i: number) => (
                            <>
                                <input
                                    placeholder="Zona"
                                    value={x.zona}
                                    onChange={(e) => field("tareas", i, "zona", e.target.value)}
                                />
                                <input
                                    placeholder="Descripción de actividad"
                                    value={x.descripcion}
                                    onChange={(e) =>
                                        field("tareas", i, "descripcion", e.target.value)
                                    }
                                />
                                <input
                                    placeholder="Avance"
                                    value={x.avance}
                                    onChange={(e) => field("tareas", i, "avance", e.target.value)}
                                />
                            </>
                        )}
                    </Rows>
                </Section>
                <Section title="5. Maquinaria, HSE y observaciones">
                    <Rows
                        rows={report.maquinarias}
                        add={() =>
                            row("maquinarias", { equipoId: "", estadoOperativo: "Operativo" })
                        }
                    >
                        {(x: any, i: number) => (
                            <>
                                <select
                                    onChange={(e) =>
                                        field("maquinarias", i, "equipoId", e.target.value)
                                    }
                                >
                                    <option>Equipo</option>
                                    {eq.map((q) => (
                                        <option value={q.id}>{q.descripcion}</option>
                                    ))}
                                </select>
                                <input
                                    value={x.estadoOperativo}
                                    onChange={(e) =>
                                        field("maquinarias", i, "estadoOperativo", e.target.value)
                                    }
                                />
                            </>
                        )}
                    </Rows>
                    <Rows
                        rows={report.incidencias}
                        add={() =>
                            row("incidencias", { tipo: "", hora: "", descripcion: "" })
                        }
                    >
                        {(x: any, i: number) => (
                            <>
                                <input
                                    placeholder="Incidencia HSE"
                                    onChange={(e) =>
                                        field("incidencias", i, "tipo", e.target.value)
                                    }
                                />
                                <input
                                    type="time"
                                    onChange={(e) =>
                                        field("incidencias", i, "hora", e.target.value)
                                    }
                                />
                                <input
                                    placeholder="Descripción"
                                    onChange={(e) =>
                                        field("incidencias", i, "descripcion", e.target.value)
                                    }
                                />
                            </>
                        )}
                    </Rows>
                    <Rows
                        rows={report.observaciones}
                        add={() =>
                            row("observaciones", {
                                tipoRegistro: "Observación",
                                responsableAsignado: "",
                                plazo: "",
                                descripcion: "",
                            })
                        }
                    >
                        {(x: any, i: number) => (
                            <>
                                <input
                                    placeholder="Tipo"
                                    onChange={(e) =>
                                        field("observaciones", i, "tipoRegistro", e.target.value)
                                    }
                                />
                                <input
                                    placeholder="Responsable"
                                    onChange={(e) =>
                                        field(
                                            "observaciones",
                                            i,
                                            "responsableAsignado",
                                            e.target.value,
                                        )
                                    }
                                />
                                <input
                                    placeholder="Descripción / visita"
                                    onChange={(e) =>
                                        field("observaciones", i, "descripcion", e.target.value)
                                    }
                                />
                            </>
                        )}
                    </Rows>
                </Section>
            </div>
        </section>
    );
}
function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="panel reportsection">
            <h3>{title}</h3>
            <div className="formgrid">{children}</div>
        </section>
    );
}
function Rows({
    rows,
    add,
    children,
}: {
    rows: any[];
    add: () => void;
    children: any;
}) {
    return (
        <div className="rows">
            {rows.map((x, i) => (
                <div className="row">{children(x, i)}</div>
            ))}
            <button type="button" className="addrow" onClick={add}>
                + Añadir registro
            </button>
        </div>
    );
}
function ParteList() {
    const [data, setData] = useState<any>();
    const [obras, setObras] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        obraId: "",
        from: "",
        to: "",
        firma: "",
    });
    const load = () => {
        const q = new URLSearchParams({
            perPage: "100",
            ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
        });
        return api<any>("/partes?" + q).then(setData);
    };
    useEffect(() => {
        void api<any>("/obras?perPage=100").then((x) => setObras(x.data));
    }, []);
    useEffect(() => {
        void load();
    }, [filters]);
    return (
        <section className="page">
            <div className="intro">
                <div>
                    <p className="eyebrow">Historial de obra</p>
                    <h2>Partes diarios realizados</h2>
                </div>
                <NavLink className="primary link" to="/partes/nuevo">
                    Nuevo parte
                </NavLink>
            </div>
            <section className="panel filters">
                <select
                    value={filters.obraId}
                    onChange={(e) => setFilters({ ...filters, obraId: e.target.value })}
                >
                    <option value="">Todas las obras</option>
                    {obras.map((o) => (
                        <option value={o.id}>{o.nombre}</option>
                    ))}
                </select>
                <label>
                    Desde
                    <input
                        type="date"
                        value={filters.from}
                        onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                    />
                </label>
                <label>
                    Hasta
                    <input
                        type="date"
                        value={filters.to}
                        onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                    />
                </label>
                <select
                    value={filters.firma}
                    onChange={(e) => setFilters({ ...filters, firma: e.target.value })}
                >
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendientes de firma</option>
                    <option value="completo">Firmados completamente</option>
                </select>
                <button
                    className="secondary"
                    onClick={() =>
                        setFilters({ obraId: "", from: "", to: "", firma: "" })
                    }
                >
                    Limpiar
                </button>
            </section>
            <section className="panel table">
                <div className="tablehead">
                    <span>Obra</span>
                    <span>Fecha</span>
                    <span>Estado de firmas</span>
                </div>
                {!data ? (
                    <Loading />
                ) : data.data.length ? (
                    data.data.map((p: any) => (
                        <NavLink className="tablerow partelink" to={"/partes/" + p.id}>
                            <b>{p.obra.nombre}</b>
                            <span>{new Date(p.fecha).toLocaleDateString()}</span>
                            <span>
                                {p.firmaRedactor && p.firmaDireccion
                                    ? "Completamente firmado"
                                    : p.firmaRedactor
                                        ? "Pendiente dirección"
                                        : "Pendiente redactor"}
                            </span>
                        </NavLink>
                    ))
                ) : (
                    <Empty text="No existen partes con estos filtros." />
                )}
            </section>
        </section>
    );
}
function ParteDetail() {
    const { id } = useParams();
    const user = useAuth((s) => s.user);
    const [p, setP] = useState<any>();
    const [msg, setMsg] = useState("");
    const reload = () => api<any>("/partes/" + id).then(setP);
    useEffect(() => {
        void reload();
    }, [id]);
    if (!p) return <Loading />;
    const sign = async (tipo: string) => {
        try {
            await api("/partes/" + id + "/firmas/" + tipo, { method: "POST" });
            setMsg("Firma registrada correctamente.");
            reload();
        } catch (x: any) {
            setMsg(x.message);
        }
    };
    const list = (
        title: string,
        items: any[],
        render: (x: any) => React.ReactNode,
    ) => (
        <section className="panel detailblock">
            <h3>
                {title} <small>{items.length}</small>
            </h3>
            {items.length ? (
                items.map((x) => <div className="activity">{render(x)}</div>)
            ) : (
                <Empty text="Sin registros." />
            )}
        </section>
    );
    const canDirector =
        user?.roles.includes("ADMINISTRADOR") || user?.roles.includes("DIRECTOR");
    const canWriter =
        user?.id === p.redactorId || user?.roles.includes("ADMINISTRADOR");
    return (
        <section className="page printarea">
            <div className="intro no-print">
                <div>
                    <p className="eyebrow">{p.obra.nombre}</p>
                    <h2>Parte del {new Date(p.fecha).toLocaleDateString()}</h2>
                    <span>
                        Redactado por {p.redactor.nombres} {p.redactor.apellidos}
                    </span>
                </div>
                <div className="actions">
                    <button className="secondary" onClick={() => window.print()}>
                        Imprimir / PDF
                    </button>
                    <NavLink className="secondary link" to="/partes">
                        Volver al historial
                    </NavLink>
                </div>
            </div>
            <div className="print-header">
                <h1>TRAZO · Parte diario de obra</h1>
                <p>
                    {p.obra.nombre} · {new Date(p.fecha).toLocaleDateString()}
                </p>
            </div>
            {msg && <div className="notice success">{msg}</div>}
            <section className="panel signatures">
                <div>
                    <b>Firma del redactor</b>
                    <span>{p.firmaRedactor ? "Firmado" : "Pendiente"}</span>
                    {!p.firmaRedactor && canWriter && (
                        <button className="primary" onClick={() => sign("redactor")}>
                            Firmar parte
                        </button>
                    )}
                </div>
                <div>
                    <b>Aprobación dirección facultativa</b>
                    <span>{p.firmaDireccion ? "Aprobado" : "Pendiente"}</span>
                    {!p.firmaDireccion && canDirector && (
                        <button className="primary" onClick={() => sign("direccion")}>
                            Aprobar parte
                        </button>
                    )}
                </div>
            </section>
            <div className="detailgrid">
                {list("Condiciones climáticas", p.climas, (x) => (
                    <>
                        <b>
                            {x.franjaHoraria}: {x.condicion}
                        </b>
                        <span>
                            {x.temperatura || "—"} °C · Viento {x.vientoMph || "—"} mph
                        </span>
                    </>
                ))}
                {list("Asistencia", p.asistencias, (x) => (
                    <>
                        <b>
                            {x.empresa.razonSocial} — {x.ocupacion.nombre}
                        </b>
                        <span>
                            {x.numTrabajadores} trabajadores · {x.horasTotales} horas
                        </span>
                    </>
                ))}
                {list("Tareas ejecutadas", p.tareas, (x) => (
                    <>
                        <b>
                            {x.zona} · {x.avance}
                        </b>
                        <span>{x.descripcion}</span>
                    </>
                ))}
                {list("Maquinaria", p.maquinarias, (x) => (
                    <>
                        <b>{x.equipo.descripcion}</b>
                        <span>{x.estadoOperativo}</span>
                    </>
                ))}
                {list("Incidencias HSE", p.incidencias, (x) => (
                    <>
                        <b>{x.tipo}</b>
                        <span>{x.descripcion}</span>
                    </>
                ))}
                {list("Suministros", p.suministros, (x) => (
                    <>
                        <b>{x.descripcionMaterial}</b>
                        <span>
                            {x.empresa.razonSocial} · {x.conforme ? "Conforme" : "Pendiente"}
                        </span>
                    </>
                ))}
                {list("Observaciones y visitas", p.observaciones, (x) => (
                    <>
                        <b>{x.tipoRegistro}</b>
                        <span>{x.descripcion}</span>
                    </>
                ))}
                <PhotoEvidence
                    parteId={p.id}
                    evidencias={p.evidencias}
                    onUploaded={reload}
                />
            </div>
        </section>
    );
}
function PhotoEvidence({
    parteId,
    evidencias,
    onUploaded,
}: {
    parteId: number;
    evidencias: any[];
    onUploaded: () => void;
}) {
    const [msg, setMsg] = useState("");
    const upload = async (e: any) => {
        const files = e.target.files;
        if (!files?.length) return;
        const body = new FormData();
        Array.from(files).forEach((f: any) => body.append("files", f));
        try {
            await api("/partes/" + parteId + "/evidencias", { method: "POST", body });
            setMsg("Evidencias cargadas.");
            onUploaded();
        } catch (x: any) {
            setMsg(x.message);
        }
    };
    return (
        <section className="panel evidence">
            <div>
                <h3>Evidencias fotográficas</h3>
                <span>JPG, PNG o WEBP · hasta 10 fotos</span>
            </div>
            <label className="uploadbutton">
                Añadir fotos
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={upload}
                />
            </label>
            {msg && <p>{msg}</p>}
            <div className="photogrid">
                {evidencias.length ? (
                    evidencias.map((x) => (
                        <a href={uploadUrl(x.ruta)} target="_blank" rel="noreferrer">
                            <img
                                src={uploadUrl(x.ruta)}
                                alt={x.descripcion || x.nombreOriginal}
                            />
                            <span>{x.descripcion || x.nombreOriginal}</span>
                        </a>
                    ))
                ) : (
                    <Empty text="No hay evidencias cargadas aún." />
                )}
            </div>
        </section>
    );
}
function Planificacion() {
    const [obras, setObras] = useState<any[]>([]),
        [items, setItems] = useState<any[]>([]),
        [obraId, setObraId] = useState(""),
        [estado, setEstado] = useState(""),
        [show, setShow] = useState(false),
        [msg, setMsg] = useState("");
    const load = () => {
        const q = new URLSearchParams();
        if (obraId) q.set("obraId", obraId);
        if (estado) q.set("estado", estado);
        return api<any[]>("/planificacion?" + q).then(setItems);
    };
    useEffect(() => {
        void api<any>("/obras?perPage=100").then((x) => setObras(x.data));
    }, []);
    useEffect(() => {
        void load();
    }, [obraId, estado]);
    const update = async (item: any, data: any) => {
        try {
            await api("/planificacion/" + item.id, {
                method: "PATCH",
                body: JSON.stringify({
                    ...item,
                    obraId: item.obraId,
                    inicio: item.inicio,
                    fin: item.fin,
                    ...data,
                }),
            });
            setMsg("Actividad actualizada.");
            load();
        } catch (x: any) {
            setMsg(x.message);
        }
    };
    const create = async (e: any) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const data = Object.fromEntries(f);
        try {
            await api("/planificacion", {
                method: "POST",
                body: JSON.stringify({
                    ...data,
                    obraId: Number(data.obraId),
                    avance: Number(data.avance || 0),
                }),
            });
            setShow(false);
            setMsg("Actividad planificada.");
            load();
        } catch (x: any) {
            setMsg(x.message);
        }
    };
    const overdue = (x: any) =>
        x.estado !== "COMPLETADA" && new Date(x.fin) < new Date();
    return (
        <section className="page">
            <div className="intro">
                <div>
                    <p className="eyebrow">Plan de ejecución</p>
                    <h2>Planificación de obra</h2>
                </div>
                <button className="primary" onClick={() => setShow(true)}>
                    Nueva actividad
                </button>
            </div>
            {msg && (
                <div
                    className={
                        "notice " +
                        (msg.includes("actualizada") || msg.includes("planificada")
                            ? "success"
                            : "error")
                    }
                >
                    {msg}
                </div>
            )}
            <section className="panel filters">
                <select value={obraId} onChange={(e) => setObraId(e.target.value)}>
                    <option value="">Todas las obras</option>
                    {obras.map((o) => (
                        <option value={o.id}>{o.nombre}</option>
                    ))}
                </select>
                <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                    <option value="">Todos los estados</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN_CURSO">En curso</option>
                    <option value="BLOQUEADA">Bloqueada</option>
                    <option value="COMPLETADA">Completada</option>
                </select>
            </section>
            <div className="planboard">
                {items.length ? (
                    items.map((x) => (
                        <article
                            className={
                                "planitem " +
                                x.estado.toLowerCase() +
                                (overdue(x) ? " overdue" : "")
                            }
                        >
                            <div className="planhead">
                                <div>
                                    <small>
                                        {x.obra.nombre} · {x.zona || "Sin zona"}
                                    </small>
                                    <h3>{x.nombre}</h3>
                                    <span>
                                        {x.responsable || "Sin responsable"} ·{" "}
                                        {new Date(x.inicio).toLocaleDateString()} —{" "}
                                        {new Date(x.fin).toLocaleDateString()}
                                    </span>
                                </div>
                                <select
                                    value={x.estado}
                                    onChange={(e) => update(x, { estado: e.target.value })}
                                >
                                    <option value="PENDIENTE">Pendiente</option>
                                    <option value="EN_CURSO">En curso</option>
                                    <option value="BLOQUEADA">Bloqueada</option>
                                    <option value="COMPLETADA">Completada</option>
                                </select>
                            </div>
                            <div className="progressline">
                                <i style={{ width: x.avance + "%" }} />
                            </div>
                            <div className="progresscontrols">
                                <b>{x.avance}%</b>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    defaultValue={x.avance}
                                    onMouseUp={(e: any) =>
                                        update(x, {
                                            avance: Number(e.currentTarget.value),
                                            estado:
                                                Number(e.currentTarget.value) === 100
                                                    ? "COMPLETADA"
                                                    : x.estado,
                                        })
                                    }
                                />
                                {overdue(x) && <em>Retrasada</em>}
                            </div>
                        </article>
                    ))
                ) : (
                    <Empty text="No hay actividades planificadas con estos filtros." />
                )}
            </div>
            {show && (
                <div className="modal">
                    <form className="modalcard planform" onSubmit={create}>
                        <h2>Planificar actividad</h2>
                        <label>
                            Obra
                            <select name="obraId" required>
                                <option value="">Selecciona obra</option>
                                {obras.map((o) => (
                                    <option value={o.id}>{o.nombre}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Actividad
                            <input
                                name="nombre"
                                placeholder="Ej. Fundida de placa nivel 2"
                                required
                            />
                        </label>
                        <label>
                            Zona
                            <input name="zona" placeholder="Nivel 2 / Eje A-B" />
                        </label>
                        <label>
                            Responsable
                            <input name="responsable" placeholder="Nombre o cargo" />
                        </label>
                        <label>
                            Inicio
                            <input type="date" name="inicio" required />
                        </label>
                        <label>
                            Fin previsto
                            <input type="date" name="fin" required />
                        </label>
                        <label>
                            Avance inicial
                            <input
                                type="number"
                                min="0"
                                max="100"
                                name="avance"
                                defaultValue="0"
                            />
                        </label>
                        <label>
                            Estado
                            <select name="estado">
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="EN_CURSO">En curso</option>
                                <option value="BLOQUEADA">Bloqueada</option>
                            </select>
                        </label>
                        <footer>
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => setShow(false)}
                            >
                                Cancelar
                            </button>
                            <button className="primary">Añadir al plan</button>
                        </footer>
                    </form>
                </div>
            )}
        </section>
    );
}
function Inspecciones() {
    const [user] = [useAuth((s) => s.user)];
    const [obras, setObras] = useState<any[]>([]),
        [items, setItems] = useState<any[]>([]),
        [obraId, setObraId] = useState(""),
        [estado, setEstado] = useState(""),
        [show, setShow] = useState(false),
        [msg, setMsg] = useState("");
    const load = () => {
        const q = new URLSearchParams();
        if (obraId) q.set("obraId", obraId);
        if (estado) q.set("estado", estado);
        return api<any[]>("/inspecciones?" + q).then(setItems);
    };
    useEffect(() => {
        void api<any>("/obras?perPage=100").then((x) => setObras(x.data));
    }, []);
    useEffect(() => {
        void load();
    }, [obraId, estado]);
    const create = async (e: any) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const d = Object.fromEntries(f);
        try {
            await api("/inspecciones", {
                method: "POST",
                body: JSON.stringify({ ...d, obraId: Number(d.obraId) }),
            });
            setShow(false);
            setMsg("Inspección registrada.");
            load();
        } catch (x: any) {
            setMsg(x.message);
        }
    };
    const close = async (x: any) => {
        try {
            await api("/inspecciones/" + x.id, {
                method: "PATCH",
                body: JSON.stringify({ estado: "CERRADA" }),
            });
            setMsg("Hallazgo cerrado.");
            load();
        } catch (e: any) {
            setMsg(e.message);
        }
    };
    return (
        <section className="page">
            <div className="intro">
                <div>
                    <p className="eyebrow">Aseguramiento en obra</p>
                    <h2>Inspecciones y calidad</h2>
                </div>
                <button className="primary" onClick={() => setShow(true)}>
                    Nueva inspección
                </button>
            </div>
            {msg && (
                <div
                    className={
                        "notice " +
                        (msg.includes("registrada") || msg.includes("cerrado")
                            ? "success"
                            : "error")
                    }
                >
                    {msg}
                </div>
            )}
            <section className="panel filters">
                <select value={obraId} onChange={(e) => setObraId(e.target.value)}>
                    <option value="">Todas las obras</option>
                    {obras.map((o) => (
                        <option value={o.id}>{o.nombre}</option>
                    ))}
                </select>
                <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                    <option value="">Todos los estados</option>
                    <option value="ABIERTA">Abiertas</option>
                    <option value="EN_SEGUIMIENTO">En seguimiento</option>
                    <option value="CERRADA">Cerradas</option>
                </select>
            </section>
            <div className="inspectionlist">
                {items.length ? (
                    items.map((x) => (
                        <article className={"inspection " + x.resultado.toLowerCase()}>
                            <div className="inspectionhead">
                                <div>
                                    <small>
                                        {x.obra.nombre} · {new Date(x.fecha).toLocaleDateString()} ·{" "}
                                        {x.tipo}
                                    </small>
                                    <h3>{x.zona || "Obra general"}</h3>
                                    <span>Responsable: {x.responsable}</span>
                                </div>
                                <em className={"badge " + x.estado.toLowerCase()}>
                                    {x.estado.replace("_", " ")}
                                </em>
                            </div>
                            {x.hallazgos && (
                                <p>
                                    <b>Hallazgo:</b> {x.hallazgos}
                                </p>
                            )}
                            {x.acciones && (
                                <p>
                                    <b>Acción:</b> {x.acciones}
                                </p>
                            )}
                            <footer>
                                <span>
                                    Resultado: <b>{x.resultado.replace("_", " ")}</b>
                                    {x.plazo &&
                                        " · plazo " + new Date(x.plazo).toLocaleDateString()}
                                </span>
                                {x.estado !== "CERRADA" && (
                                    <button className="secondary" onClick={() => close(x)}>
                                        Cerrar hallazgo
                                    </button>
                                )}
                            </footer>
                        </article>
                    ))
                ) : (
                    <Empty text="No hay inspecciones para estos filtros." />
                )}
            </div>
            {show && (
                <div className="modal">
                    <form className="modalcard inspectionform" onSubmit={create}>
                        <h2>Nueva inspección</h2>
                        <label>
                            Obra
                            <select name="obraId" required>
                                <option value="">Selecciona obra</option>
                                {obras.map((o) => (
                                    <option value={o.id}>{o.nombre}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Fecha
                            <input type="date" name="fecha" defaultValue={today()} required />
                        </label>
                        <label>
                            Tipo
                            <select name="tipo">
                                <option value="CALIDAD">Calidad</option>
                                <option value="SEGURIDAD">Seguridad</option>
                                <option value="AMBIENTAL">Ambiental</option>
                            </select>
                        </label>
                        <label>
                            Zona / frente
                            <input name="zona" placeholder="Ej. Nivel 2, eje B-C" />
                        </label>
                        <label>
                            Responsable
                            <input
                                name="responsable"
                                defaultValue={user?.nombre || ""}
                                required
                            />
                        </label>
                        <label>
                            Resultado
                            <select name="resultado">
                                <option value="CONFORME">Conforme</option>
                                <option value="OBSERVACIONES">Con observaciones</option>
                                <option value="NO_CONFORME">No conforme</option>
                            </select>
                        </label>
                        <label className="wide">
                            Hallazgos
                            <textarea
                                name="hallazgos"
                                placeholder="Describe lo observado y la evidencia relevante"
                            />
                        </label>
                        <label className="wide">
                            Acción correctiva
                            <input
                                name="acciones"
                                placeholder="Acción requerida para cerrar el hallazgo"
                            />
                        </label>
                        <label>
                            Plazo
                            <input type="date" name="plazo" />
                        </label>
                        <footer>
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => setShow(false)}
                            >
                                Cancelar
                            </button>
                            <button className="primary">Registrar inspección</button>
                        </footer>
                    </form>
                </div>
            )}
        </section>
    );
}
function Documents() {
    const user = useAuth((s) => s.user);
    const [docs, setDocs] = useState<any>();
    const [obras, setObras] = useState<any[]>([]);
    const [categorias, setCategorias] = useState<any[]>([]);
    const [personas, setPersonas] = useState<any[]>([]);
    const [obraId, setObraId] = useState(
        () => new URLSearchParams(window.location.search).get("obraId") || "",
    );
    const [show, setShow] = useState(false);
    const [msg, setMsg] = useState("");
    const load = () =>
        api<any>("/documentos" + (obraId ? "?obraId=" + obraId : "")).then(setDocs);
    useEffect(() => {
        void Promise.all([
            api<any>("/obras?perPage=100"),
            api<any[]>("/catalogos/categorias"),
            api<any>("/personas?perPage=100"),
        ]).then(([o, c, p]) => {
            setObras(o.data);
            setCategorias(c);
            setPersonas(p.data);
        });
    }, []);
    useEffect(() => {
        void load();
    }, [obraId]);
    const upload = async (e: any) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        if (!(f.get("file") as File)?.name) {
            setMsg("Selecciona un archivo antes de cargarlo.");
            return;
        }
        try {
            await api("/documentos", { method: "POST", body: f });
            setShow(false);
            setMsg("Documento cargado y vinculado a la obra.");
            load();
        } catch (x: any) {
            setMsg(x.message);
        }
    };
    return (
        <section className="page">
            <div className="intro">
                <div>
                    <p className="eyebrow">Repositorio de obra</p>
                    <h2>Documentos</h2>
                </div>
                <button className="primary" onClick={() => setShow(true)}>
                    Cargar documento
                </button>
            </div>
            {msg && (
                <div
                    className={
                        "notice " + (msg.includes("cargado") ? "success" : "error")
                    }
                >
                    {msg}
                </div>
            )}
            <section className="panel filters">
                <select value={obraId} onChange={(e) => setObraId(e.target.value)}>
                    <option value="">Todas las obras</option>
                    {obras.map((o) => (
                        <option value={o.id}>{o.nombre}</option>
                    ))}
                </select>
            </section>
            <section className="panel table">
                <div className="tablehead documentrow">
                    <span>Archivo</span>
                    <span>Obra</span>
                    <span>Categoría</span>
                    <span>Responsable</span>
                    {canAdmin(user?.roles) && <span>Acciones</span>}
                </div>
                {!docs ? (
                    <Loading />
                ) : docs.data.length ? (
                    docs.data.map((d: any) => (
                        <div className="tablerow documentrow">
                            <a
                                href={uploadUrl(d.ruta)} target="_blank" rel="noreferrer"
                            >
                                {d.nombreOriginal}
                            </a>
                            <span>{d.obra.nombre}</span>
                            <span>{d.categoria.nombre}</span>
                            <span>
                                {d.responsable.nombres} {d.responsable.apellidos}
                            </span>
                            {canAdmin(user?.roles) && (
                                <button
                                    className="textbutton dangertext"
                                    onClick={async () => {
                                        if (!window.confirm("¿Eliminar este documento?")) return;
                                        try {
                                            await api("/documentos/" + d.id, { method: "DELETE" });
                                            load();
                                        } catch (e: any) {
                                            setMsg(e.message);
                                        }
                                    }}
                                >
                                    Eliminar
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <Empty text="No hay documentos cargados para esta selección." />
                )}
            </section>
            {show && (
                <div className="modal">
                    <form className="modalcard uploadform" onSubmit={upload}>
                        <h2>Cargar documento</h2>
                        <label>
                            Archivo PDF, imagen o XLSX
                            <input
                                name="file"
                                type="file"
                                accept="application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                required
                            />
                        </label>
                        <label>
                            Obra
                            <select name="obraId" required>
                                <option value="">Selecciona una obra</option>
                                {obras.map((o) => (
                                    <option value={o.id}>{o.nombre}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Categoría
                            <select name="categoriaId" required>
                                <option value="">Selecciona categoría</option>
                                {categorias.map((c) => (
                                    <option value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Responsable
                            <select name="responsableId" defaultValue={user?.id} required>
                                {personas.map((p) => (
                                    <option value={p.id}>
                                        {p.nombres} {p.apellidos}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Estado
                            <select name="estado">
                                <option value="VIGENTE">Vigente</option>
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="VENCIDO">Vencido</option>
                                <option value="ARCHIVADO">Archivado</option>
                            </select>
                        </label>
                        <footer>
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => setShow(false)}
                            >
                                Cancelar
                            </button>
                            <button className="primary">Cargar</button>
                        </footer>
                    </form>
                </div>
            )}
        </section>
    );
}
function Loading() {
    return <div className="loading">Cargando información…</div>;
}
function Empty({ text }: { text: string }) {
    return <div className="empty">{text}</div>;
}
function Protected({ children }: { children: React.ReactNode }) {
    return useAuth((s) => s.token) ? (
        <Shell>{children}</Shell>
    ) : (
        <Navigate to="/login" />
    );
}
export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/"
                element={
                    <Protected>
                        <Dashboard />
                    </Protected>
                }
            />
            <Route
                path="/obras"
                element={
                    <Protected>
                        <List kind="obras" />
                    </Protected>
                }
            />
            <Route
                path="/obras/:id"
                element={
                    <Protected>
                        <ObraDetail />
                    </Protected>
                }
            />
            <Route
                path="/personas"
                element={
                    <Protected>
                        <List kind="personas" />
                    </Protected>
                }
            />
            <Route
                path="/partes"
                element={
                    <Protected>
                        <ParteList />
                    </Protected>
                }
            />
            <Route
                path="/planificacion"
                element={
                    <Protected>
                        <Planificacion />
                    </Protected>
                }
            />
            <Route
                path="/inspecciones"
                element={
                    <Protected>
                        <Inspecciones />
                    </Protected>
                }
            />
            <Route
                path="/partes/nuevo"
                element={
                    <Protected>
                        <DailyReport />
                    </Protected>
                }
            />
            <Route
                path="/partes/:id"
                element={
                    <Protected>
                        <ParteDetail />
                    </Protected>
                }
            />
            <Route
                path="/documentos"
                element={
                    <Protected>
                        <Documents />
                    </Protected>
                }
            />
            <Route
                path="/administracion"
                element={
                    <Protected>
                        <Admin />
                    </Protected>
                }
            />
        </Routes>
    );
}
