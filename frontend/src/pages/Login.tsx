// src/pages/login.tsx
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export default function Login() {
  const handleLogin = () => {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      // redirect_uri: `${import.meta.env.VITE_BACKEND_URL}/auth/google/callback`,
        redirect_uri: `http://localhost:8000/auth/google/callback`,
        response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

    window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  };

  return (
    <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
      <button onClick={handleLogin}>
        Login with Google
      </button>
    </div>
  );
}
