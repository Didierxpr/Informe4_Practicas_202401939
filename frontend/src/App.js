import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:3001";

export default function App() {
  const [view, setView] = useState("login");
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [refreshPosts, setRefreshPosts] = useState(0);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  const logout = () => {
    setUser(null);
    setToken("");
    setView("login");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-900 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Opiniones ECYS</h1>
            <p className="text-sm text-slate-300">Frontend React para tu proyecto</p>
          </div>

          {user && (
            <nav className="flex flex-wrap items-center gap-2">
              <NavButton label="Inicio" onClick={() => setView("feed")} />
              <NavButton label="Crear publicación" onClick={() => setView("createPost")} />
              <NavButton label="Mi perfil" onClick={() => setView("profile")} />
              <button
                onClick={logout}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold hover:bg-red-600"
              >
                Cerrar sesión
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {!user ? (
          view === "register" ? (
            <RegisterForm setView={setView} />
          ) : (
            <LoginForm
              setUser={setUser}
              setToken={setToken}
              setView={setView}
            />
          )
        ) : (
          <>
            {view === "feed" && (
              <Feed
                key={refreshPosts}
                user={user}
                token={token}
                onNeedRefresh={() => setRefreshPosts((v) => v + 1)}
              />
            )}
            {view === "createPost" && (
              <CreatePost
                user={user}
                token={token}
                onCreated={() => {
                  setRefreshPosts((v) => v + 1);
                  setView("feed");
                }}
              />
            )}
            {view === "profile" && <Profile user={user} token={token} />}
          </>
        )}

        {!user && (
          <div className="mt-4 text-center">
            {view === "login" ? (
              <button
                onClick={() => setView("register")}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                ¿No tienes cuenta? Regístrate aquí
              </button>
            ) : (
              <button
                onClick={() => setView("login")}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                Ya tengo cuenta, ir al login
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function NavButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-600"
    >
      {label}
    </button>
  );
}

function Card({ title, subtitle, children, right }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function LoginForm({ setUser, setToken, setView }) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo iniciar sesión");

      const localUser = data.user || {
        id_estudiante: data.id_estudiante,
        nombre: data.nombre,
        correo,
      };

      setToken(data.token || "");
      setUser(localUser);
      setView("feed");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Card title="Iniciar sesión" subtitle="Ingresa con tu correo y contraseña">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Correo" value={correo} onChange={setCorreo} type="email" />
          <Input label="Contraseña" value={password} onChange={setPassword} type="password" />
          {error && <ErrorText text={error} />}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </Card>
    </div>
  );
}

function RegisterForm({ setView }) {
  const [form, setForm] = useState({
    nombre: "",
    carnet: "",
    correo: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo registrar");

      setMessage("Usuario registrado correctamente. Ahora puedes iniciar sesión.");
      setForm({ nombre: "", carnet: "", correo: "", password: "" });
      setTimeout(() => setView("login"), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Card title="Registro" subtitle="Crea tu usuario para publicar y comentar">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Nombre" value={form.nombre} onChange={(v) => update("nombre", v)} />
          <Input label="Carnet" value={form.carnet} onChange={(v) => update("carnet", v)} />
          <Input label="Correo" type="email" value={form.correo} onChange={(v) => update("correo", v)} />
          <Input label="Contraseña" type="password" value={form.password} onChange={(v) => update("password", v)} />
          {message && <SuccessText text={message} />}
          {error && <ErrorText text={error} />}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Registrarme"}
          </button>
        </form>
      </Card>
    </div>
  );
}

function Feed({ user, token, onNeedRefresh }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    texto: "",
    curso: "",
    catedratico: "",
  });
  const [selectedPost, setSelectedPost] = useState(null);

  const loadPosts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/publicaciones`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudieron cargar las publicaciones");
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const text = filters.texto.toLowerCase();
      const matchText =
        !text ||
        post.titulo?.toLowerCase().includes(text) ||
        post.contenido?.toLowerCase().includes(text) ||
        post.nombre_curso?.toLowerCase().includes(text) ||
        post.catedratico?.toLowerCase().includes(text);

      const matchCurso =
        !filters.curso || post.nombre_curso?.toLowerCase().includes(filters.curso.toLowerCase());

      const matchCatedratico =
        !filters.catedratico ||
        post.catedratico?.toLowerCase().includes(filters.catedratico.toLowerCase());

      return matchText && matchCurso && matchCatedratico;
    });
  }, [posts, filters]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card title="Filtros" subtitle="Busca publicaciones por texto, curso o catedrático">
        <div className="space-y-4">
          <Input label="Buscar" value={filters.texto} onChange={(v) => setFilters((p) => ({ ...p, texto: v }))} />
          <Input label="Curso" value={filters.curso} onChange={(v) => setFilters((p) => ({ ...p, curso: v }))} />
          <Input
            label="Catedrático"
            value={filters.catedratico}
            onChange={(v) => setFilters((p) => ({ ...p, catedratico: v }))}
          />
          <button
            onClick={loadPosts}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Recargar publicaciones
          </button>
        </div>
      </Card>

      <div className="space-y-4">
        <Card
          title={`Bienvenido, ${user?.nombre || "usuario"}`}
          subtitle="Aquí verás las publicaciones más recientes"
          right={
            <button
              onClick={onNeedRefresh}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Actualizar feed
            </button>
          }
        >
          {loading && <p>Cargando publicaciones...</p>}
          {error && <ErrorText text={error} />}
          {!loading && !error && filteredPosts.length === 0 && (
            <p className="text-slate-600">No hay publicaciones para mostrar.</p>
          )}

          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div key={post.id_publicacion} className="rounded-2xl border border-slate-200 p-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold">{post.titulo}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {formatDate(post.fecha_publicacion)}
                  </span>
                </div>
                <p className="mb-3 text-sm text-slate-500">
                  Publicado por: <strong>{post.estudiante || "Sin nombre"}</strong>
                </p>
                <div className="mb-3 flex flex-wrap gap-2 text-xs">
                  {post.nombre_curso && <Tag text={`Curso: ${post.nombre_curso}`} />}
                  {post.catedratico && <Tag text={`Catedrático: ${post.catedratico}`} />}
                </div>
                <p className="mb-4 whitespace-pre-wrap text-slate-700">{post.contenido}</p>
                <button
                  onClick={() => setSelectedPost(post)}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Ver comentarios
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {selectedPost && (
        <CommentsModal
          post={selectedPost}
          user={user}
          token={token}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}

function CreatePost({ user, token, onCreated }) {
  const [cursos, setCursos] = useState([]);
  const [catedraticos, setCatedraticos] = useState([]);
  const [form, setForm] = useState({
    titulo: "",
    contenido: "",
    id_curso: "",
    id_catedratico: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [coursesRes, teachersRes] = await Promise.all([
          fetch(`${API_BASE}/cursos`),
          fetch(`${API_BASE}/catedraticos`),
        ]);

        const coursesData = await coursesRes.json();
        const teachersData = await teachersRes.json();

        setCursos(Array.isArray(coursesData) ? coursesData : []);
        setCatedraticos(Array.isArray(teachersData) ? teachersData : []);
      } catch {
        setCursos([]);
        setCatedraticos([]);
      }
    };

    loadData();
  }, []);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        ...form,
        id_estudiante: user?.id_estudiante,
        id_curso: form.id_curso ? Number(form.id_curso) : null,
        id_catedratico: form.id_catedratico ? Number(form.id_catedratico) : null,
      };

      const res = await fetch(`${API_BASE}/publicaciones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo crear la publicación");

      setMessage("Publicación creada correctamente.");
      setForm({ titulo: "", contenido: "", id_curso: "", id_catedratico: "" });
      setTimeout(onCreated, 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card title="Crear publicación" subtitle="Comparte tu opinión sobre un curso o catedrático">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Título" value={form.titulo} onChange={(v) => update("titulo", v)} />
          <TextArea label="Contenido" value={form.contenido} onChange={(v) => update("contenido", v)} />

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Curso"
              value={form.id_curso}
              onChange={(v) => update("id_curso", v)}
              options={cursos.map((c) => ({ value: c.id_curso, label: c.nombre_curso }))}
            />
            <Select
              label="Catedrático"
              value={form.id_catedratico}
              onChange={(v) => update("id_catedratico", v)}
              options={catedraticos.map((c) => ({ value: c.id_catedratico, label: c.nombre }))}
            />
          </div>

          {message && <SuccessText text={message} />}
          {error && <ErrorText text={error} />}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Publicando..." : "Publicar"}
          </button>
        </form>
      </Card>
    </div>
  );
}

function CommentsModal({ post, user, token, onClose }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadComments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/comentarios/${post.id_publicacion}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudieron cargar los comentarios");
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [post.id_publicacion]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/comentarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          contenido: content,
          id_publicacion: post.id_publicacion,
          id_estudiante: user.id_estudiante,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo guardar el comentario");
      setContent("");
      loadComments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">Comentarios</h3>
            <p className="text-sm text-slate-500">{post.titulo}</p>
          </div>
          <button onClick={onClose} className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-300">
            Cerrar
          </button>
        </div>

        <div className="mb-6 rounded-xl bg-slate-50 p-4">
          <p className="font-semibold">{post.estudiante}</p>
          <p className="mt-2 whitespace-pre-wrap text-slate-700">{post.contenido}</p>
        </div>

        <form onSubmit={submitComment} className="mb-6 space-y-3">
          <TextArea label="Agregar comentario" value={content} onChange={setContent} rows={3} />
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Comentar"}
          </button>
        </form>

        {error && <ErrorText text={error} />}
        {loading ? (
          <p>Cargando comentarios...</p>
        ) : comments.length === 0 ? (
          <p className="text-slate-600">Todavía no hay comentarios.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id_comentario} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-semibold">{comment.nombre}</p>
                  <span className="text-xs text-slate-500">{formatDate(comment.fecha)}</span>
                </div>
                <p className="whitespace-pre-wrap text-slate-700">{comment.contenido}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [courseForm, setCourseForm] = useState({ id_curso: "", nota: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProfile = async () => {
    try {
      const [profileRes, allCoursesRes] = await Promise.all([
        fetch(`${API_BASE}/perfil/${user.id_estudiante}`),
        fetch(`${API_BASE}/cursos`),
      ]);
      const profileData = await profileRes.json();
      const allCoursesData = await allCoursesRes.json();

      setProfile(profileData.usuario || null);
      setCourses(profileData.cursos || []);
      setAllCourses(Array.isArray(allCoursesData) ? allCoursesData : []);
    } catch {
      setError("No se pudo cargar el perfil.");
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user.id_estudiante]);

  const totalCreditos = courses.reduce((acc, item) => acc + Number(item.creditos || 0), 0);

  const addCourse = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/curso-aprobado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_estudiante: user.id_estudiante,
          id_curso: Number(courseForm.id_curso),
          nota: Number(courseForm.nota),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo guardar el curso");
      setCourseForm({ id_curso: "", nota: "" });
      setMessage("Curso aprobado agregado correctamente.");
      loadProfile();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card title="Mi perfil" subtitle="Información del estudiante y cursos aprobados">
        {error && <ErrorText text={error} />}
        {profile ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Info label="Nombre" value={profile.nombre} />
              <Info label="Carnet" value={profile.carnet} />
              <Info label="Correo" value={profile.correo} />
              <Info label="Créditos acumulados" value={String(totalCreditos)} />
            </div>

            <div>
              <h3 className="mb-3 text-lg font-bold">Cursos aprobados</h3>
              {courses.length === 0 ? (
                <p className="text-slate-600">Aún no has agregado cursos aprobados.</p>
              ) : (
                <div className="space-y-3">
                  {courses.map((course, idx) => (
                    <div key={`${course.nombre_curso}-${idx}`} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{course.nombre_curso}</p>
                        <span className="text-sm text-slate-500">Nota: {course.nota}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p>Cargando perfil...</p>
        )}
      </Card>

      <Card title="Agregar curso aprobado" subtitle="Solo tú puedes administrar tus cursos">
        <form onSubmit={addCourse} className="space-y-4">
          <Select
            label="Curso"
            value={courseForm.id_curso}
            onChange={(v) => setCourseForm((p) => ({ ...p, id_curso: v }))}
            options={allCourses.map((c) => ({ value: c.id_curso, label: c.nombre_curso }))}
          />
          <Input
            label="Nota"
            type="number"
            value={courseForm.nota}
            onChange={(v) => setCourseForm((p) => ({ ...p, nota: v }))}
          />
          {message && <SuccessText text={message} />}
          {error && <ErrorText text={error} />}
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Guardar curso
          </button>
        </form>
      </Card>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 5 }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      >
        <option value="">Selecciona una opción</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Tag({ text }) {
  return <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">{text}</span>;
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-base font-bold">{value || "-"}</p>
    </div>
  );
}

function ErrorText({ text }) {
  return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{text}</p>;
}

function SuccessText({ text }) {
  return <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{text}</p>;
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}
