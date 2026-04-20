import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Hosgeldin, {user?.full_name}!</h1>
        <p style={styles.info}>Email: {user?.email}</p>
        <p style={styles.info}>Kullanici ID: {user?.id}</p>
        <p style={styles.success}>
          Giris basarili! Burasi ana sayfa. Sonraki adimda harcama 
          ekleme ve pasta grafik ekleyecegiz.
        </p>
        <button onClick={handleLogout} style={styles.button}>
          Cikis Yap
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    width: '100%',
  },
  title: {
    color: '#333',
    marginBottom: '20px',
  },
  info: {
    color: '#666',
    marginBottom: '10px',
  },
  success: {
    background: '#e8f5e9',
    color: '#2e7d32',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '20px',
    marginBottom: '20px',
  },
  button: {
    padding: '12px 24px',
    background: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default Home;