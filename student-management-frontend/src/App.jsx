import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, GraduationCap, Users, RefreshCw, X } from 'lucide-react';

const API = 'http://localhost:8080/api/students';
const emptyForm = { name: '', rollNumber: '', email: '', phone: '', department: '', year: '' };

export default function App() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadStudents() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      setStudents(await response.json());
    } catch {
      setError('Cannot connect to the backend. Start Spring Boot on port 8080 and check MySQL settings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStudents(); }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return students.filter(s =>
      [s.name, s.rollNumber, s.email, s.department].some(v => (v || '').toLowerCase().includes(term))
    );
  }, [students, search]);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(student) {
    setEditingId(student.id);
    setForm({
      name: student.name || '', rollNumber: student.rollNumber || '',
      email: student.email || '', phone: student.phone || '',
      department: student.department || '', year: student.year ?? ''
    });
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const payload = { ...form, year: form.year === '' ? null : Number(form.year) };
    try {
      const response = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed (${response.status})`);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadStudents();
    } catch (e) {
      setError(`Could not save student. ${e.message}`);
    }
  }

  async function deleteStudent(student) {
    if (!window.confirm(`Delete ${student.name}? This cannot be undone.`)) return;
    try {
      const response = await fetch(`${API}/${student.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      await loadStudents();
    } catch {
      setError('Could not delete student. Check that the backend is running.');
    }
  }

  function changeField(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon"><GraduationCap size={24} /></div><div><strong>Campus</strong><span>STUDENT PORTAL</span></div></div>
        <div className="nav-label">WORKSPACE</div>
        <div className="nav-item active"><Users size={18} /> Students <span className="nav-count">{students.length}</span></div>
        <div className="sidebar-bottom"><div className="avatar">SM</div><div><strong>Admin Panel</strong><span>Student administrator</span></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div><span className="eyebrow">ACADEMIC MANAGEMENT</span><h1>Students</h1></div><button className="button secondary" onClick={loadStudents}><RefreshCw size={16} /> Refresh</button></header>
        <section className="welcome"><div><span className="welcome-tag">STUDENT DIRECTORY</span><h2>Manage your students</h2><p>Add, edit, search and maintain student records in one place.</p></div><div className="welcome-graphic"><GraduationCap size={76} strokeWidth={1.25} /></div></section>

        {error && <div className="error-banner" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}><X size={16}/></button></div>}

        <section className="stats-grid"><div className="stat-card"><div className="stat-icon purple"><Users size={20}/></div><div><span>Total students</span><strong>{students.length}</strong></div></div><div className="stat-card"><div className="stat-icon blue"><GraduationCap size={20}/></div><div><span>Matching records</span><strong>{filtered.length}</strong></div></div></section>

        <section className="directory-card">
          <div className="directory-header"><div><h2>Student directory</h2><p>View and manage student information</p></div><button className="button primary" onClick={openAdd}><Plus size={17}/> Add student</button></div>
          <div className="toolbar"><div className="search-box"><Search size={18}/><input aria-label="Search students" placeholder="Search name, roll number, email..." value={search} onChange={e => setSearch(e.target.value)}/></div><span className="result-count">{filtered.length} record{filtered.length === 1 ? '' : 's'}</span></div>

          {loading ? <div className="empty-state">Loading student records…</div> : filtered.length === 0 ? <div className="empty-state"><div className="empty-icon"><Users size={26}/></div><strong>{search ? 'No matching students' : 'No students yet'}</strong><p>{search ? 'Try a different search term.' : 'Add your first student to get started.'}</p>{!search && <button className="button primary" onClick={openAdd}><Plus size={16}/> Add student</button>}</div> :
          <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>ROLL NUMBER</th><th>DEPARTMENT</th><th>YEAR</th><th>EMAIL</th><th>ACTIONS</th></tr></thead><tbody>
            {filtered.map(student => <tr key={student.id}><td><div className="student-cell"><div className="student-avatar">{(student.name || '?').slice(0,1).toUpperCase()}</div><div><strong>{student.name}</strong><span>{student.phone || 'No phone added'}</span></div></div></td><td><span className="roll-pill">{student.rollNumber}</span></td><td>{student.department || '—'}</td><td>{student.year ? `Year ${student.year}` : '—'}</td><td>{student.email || '—'}</td><td><div className="actions"><button className="icon-button edit" aria-label={`Edit ${student.name}`} onClick={() => openEdit(student)}><Pencil size={16}/></button><button className="icon-button delete" aria-label={`Delete ${student.name}`} onClick={() => deleteStudent(student)}><Trash2 size={16}/></button></div></td></tr>)}
          </tbody></table></div>}
        </section>
        <footer>Student Management System <span>•</span> React + Spring Boot</footer>
      </main>

      {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title"><div className="modal-heading"><div><span className="eyebrow">{editingId ? 'UPDATE RECORD' : 'NEW RECORD'}</span><h2 id="form-title">{editingId ? 'Edit student' : 'Add a student'}</h2></div><button className="icon-button" aria-label="Close form" onClick={() => setShowForm(false)}><X size={20}/></button></div><form onSubmit={handleSubmit}><div className="form-grid">
        <label>Full name *<input name="name" required maxLength="100" value={form.name} onChange={changeField} placeholder="e.g. Varsha Bandi"/></label>
        <label>Roll number *<input name="rollNumber" required maxLength="50" value={form.rollNumber} onChange={changeField} placeholder="e.g. CSE001"/></label>
        <label>Email address<input type="email" name="email" value={form.email} onChange={changeField} placeholder="student@example.com"/></label>
        <label>Phone number<input name="phone" maxLength="20" value={form.phone} onChange={changeField} placeholder="Phone number"/></label>
        <label>Department<input name="department" value={form.department} onChange={changeField} placeholder="e.g. CSE"/></label>
        <label>Year of study<select name="year" value={form.year} onChange={changeField}><option value="">Select year</option><option value="1">1st year</option><option value="2">2nd year</option><option value="3">3rd year</option><option value="4">4th year</option></select></label>
        </div><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="button primary">{editingId ? 'Save changes' : 'Create student'}</button></div></form></section></div>}
    </div>
  );
}
