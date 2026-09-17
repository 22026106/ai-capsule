import { useEffect, useState } from 'react';

function Dashboard() {
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    project_name: '',
    prompt_title: '',
    prompt_text: ''
  });

  async function loadCapsules() {
    const res = await fetch('/api/capsules', { credentials: 'include' });
    if (res.status === 401) {
      window.location.href = '/';
      return;
    }
    const data = await res.json();
    setCapsules(data);
    setLoading(false);
  }

  useEffect(() => {
    loadCapsules();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (editingId) {
      // UPDATE
      await fetch(`/api/capsules/${editingId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
    } else {
      // CREATE
      await fetch('/api/capsules', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
    }

    setForm({ project_name: '', prompt_title: '', prompt_text: '' });
    setEditingId(null);
    loadCapsules();
  }

  function startEdit(capsule) {
    setEditingId(capsule.id);
    setForm({
      project_name: capsule.project_name,
      prompt_title: capsule.prompt_title,
      prompt_text: capsule.prompt_text
    });
  }

  async function handleDelete(id) {
    await fetch(`/api/capsules/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    loadCapsules();
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Dashboard</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <input
          name="project_name"
          placeholder="Project name"
          value={form.project_name}
          onChange={handleChange}
          required
        />
        <input
          name="prompt_title"
          placeholder="Prompt title"
          value={form.prompt_title}
          onChange={handleChange}
          required
        />
        <textarea
          name="prompt_text"
          placeholder="Prompt text"
          value={form.prompt_text}
          onChange={handleChange}
          required
        />
        <button type="submit">{editingId ? 'Update' : 'Create'}</button>
      </form>

      {capsules.length === 0 ? (
        <p>No capsules yet.</p>
      ) : (
        <ul>
          {capsules.map((c) => (
            <li key={c.id} style={{ marginBottom: '1rem' }}>
              <strong>{c.prompt_title}</strong> — {c.project_name}
              <br />
              <button onClick={() => startEdit(c)}>Edit</button>
              <button onClick={() => handleDelete(c.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;