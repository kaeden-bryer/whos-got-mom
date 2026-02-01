export default function Login() {
  return (
    <div className="Mn">
      <div id="WGM_logo">
      <img src="/WGM_logo.png" alt="Who's Got Mom Logo" style={{ width: '200px', marginBottom: '1rem' }} />
      </div>
      <h1 id="login-header">Sign in</h1>
      <form>
        <div>
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
