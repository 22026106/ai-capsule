function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>AI Capsule</h1>
      <p>Save and manage your useful AI prompts in one place.</p>
      <a href="/auth/github">
        <button>Log in with GitHub</button>
      </a>
    </div>
  );
}

export default Home;