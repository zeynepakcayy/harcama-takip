import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useAuth } from '../context/AuthContext';
import { expensesAPI } from '../services/api';
import AddExpenseModal from '../components/AddExpenseModal';

// Chart.js'e pasta grafik yeteneklerini ekle
ChartJS.register(ArcElement, Tooltip, Legend);

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [expensesRes, summaryRes, categoryRes] = await Promise.all([
        expensesAPI.getAll(),
        expensesAPI.getSummary(),
        expensesAPI.getByCategory(),
      ]);

      setExpenses(expensesRes.data.data);
      setSummary(summaryRes.data.data);
      setCategoryData(categoryRes.data.data);
    } catch (err) {
      console.error('Veri yukleme hatasi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu harcamayi silmek istedigine emin misin?')) return;

    try {
      await expensesAPI.delete(id);
      loadAllData();
    } catch (err) {
      alert('Silme basarisiz: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Pasta grafik icin veri
  const pieChartData = {
    labels: categoryData.map((c) => c.category_name),
    datasets: [
      {
        data: categoryData.map((c) => c.total_amount),
        backgroundColor: categoryData.map((c) => c.category_color),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 15, font: { size: 13 } },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toFixed(2)} TL (${percentage}%)`;
          },
        },
      },
    },
  };

  if (loading) {
    return <div style={styles.loading}>Yukleniyor...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Harcama Takip</h1>
          <p style={styles.userName}>Hosgeldin, {user?.full_name}</p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Cikis Yap
        </button>
      </div>

      {/* Ozet Kartlari */}
      <div style={styles.summaryGrid}>
        <div style={{ ...styles.summaryCard, borderLeftColor: '#667eea' }}>
          <div style={styles.summaryLabel}>Toplam Harcama</div>
          <div style={styles.summaryValue}>
            {summary?.total_amount.toFixed(2)} TL
          </div>
        </div>
        <div style={{ ...styles.summaryCard, borderLeftColor: '#4CAF50' }}>
          <div style={styles.summaryLabel}>Bu Ay</div>
          <div style={styles.summaryValue}>
            {summary?.this_month_total.toFixed(2)} TL
          </div>
        </div>
        <div style={{ ...styles.summaryCard, borderLeftColor: '#FF9800' }}>
          <div style={styles.summaryLabel}>Toplam Islem</div>
          <div style={styles.summaryValue}>{summary?.total_count}</div>
        </div>
        <div style={{ ...styles.summaryCard, borderLeftColor: '#F44336' }}>
          <div style={styles.summaryLabel}>En Yuksek</div>
          <div style={styles.summaryValue}>
            {summary?.max_amount.toFixed(2)} TL
          </div>
        </div>
      </div>

      {/* Ana Icerik: Grafik + Liste */}
      <div style={styles.mainContent}>
        {/* Pasta Grafik */}
        <div style={styles.chartCard}>
          <h2 style={styles.sectionTitle}>Kategoriye Gore Harcamalar</h2>
          {categoryData.length > 0 ? (
            <div style={styles.chartWrapper}>
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          ) : (
            <div style={styles.emptyChart}>
              Henuz harcama eklemedin. Ilk harcamani ekle, grafik burada gorunecek!
            </div>
          )}
        </div>

        {/* Harcama Listesi */}
        <div style={styles.listCard}>
          <div style={styles.listHeader}>
            <h2 style={styles.sectionTitle}>Son Harcamalar</h2>
            <button onClick={() => setShowModal(true)} style={styles.addBtn}>
              + Yeni
            </button>
          </div>

          {expenses.length === 0 ? (
            <div style={styles.empty}>
              Henuz harcama yok. "+ Yeni" butonuna bas!
            </div>
          ) : (
            <div style={styles.expensesList}>
              {expenses.map((exp) => (
                <div key={exp.id} style={styles.expenseItem}>
                  <div 
                    style={{ 
                      ...styles.colorDot, 
                      backgroundColor: exp.category_color 
                    }}
                  />
                  <div style={styles.expenseInfo}>
                    <div style={styles.expenseName}>
                      {exp.category_name}
                    </div>
                    {exp.description && (
                      <div style={styles.expenseDesc}>{exp.description}</div>
                    )}
                    <div style={styles.expenseDate}>
                      {new Date(exp.expense_date).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                  <div style={styles.expenseAmount}>
                    {parseFloat(exp.amount).toFixed(2)} TL
                  </div>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    style={styles.deleteBtn}
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AddExpenseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadAllData}
      />
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loading: {
    padding: '100px',
    textAlign: 'center',
    fontSize: '18px',
    color: '#666',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  title: {
    color: '#667eea',
    fontSize: '26px',
    marginBottom: '5px',
  },
  userName: {
    color: '#666',
    fontSize: '14px',
  },
  logoutBtn: {
    padding: '10px 20px',
    background: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px',
  },
  summaryCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    borderLeft: '4px solid',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  summaryLabel: {
    color: '#999',
    fontSize: '13px',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  summaryValue: {
    color: '#333',
    fontSize: '22px',
    fontWeight: '700',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: '20px',
  },
  chartCard: {
    background: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  listCard: {
    background: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    color: '#333',
    fontSize: '18px',
    marginBottom: '20px',
  },
  chartWrapper: {
    height: '350px',
    position: 'relative',
  },
  emptyChart: {
    padding: '50px 20px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  addBtn: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  empty: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
  },
  expensesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '500px',
    overflowY: 'auto',
  },
  expenseItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#f9f9f9',
    borderRadius: '10px',
  },
  colorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  expenseInfo: {
    flex: 1,
    minWidth: 0,
  },
  expenseName: {
    fontWeight: '600',
    color: '#333',
    fontSize: '14px',
  },
  expenseDesc: {
    color: '#666',
    fontSize: '12px',
    marginTop: '2px',
  },
  expenseDate: {
    color: '#999',
    fontSize: '11px',
    marginTop: '2px',
  },
  expenseAmount: {
    fontWeight: '700',
    color: '#333',
    fontSize: '15px',
  },
  deleteBtn: {
    padding: '6px 12px',
    background: '#ffebee',
    color: '#c62828',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default Home;