import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { 
  Camera, 
  LogOut, 
  User, 
  Users, 
  BookOpen, 
  QrCode, 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  School
} from 'lucide-react';

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- UTILS ---
const COLLECTION_PATH = (colName) => `artifacts/${appId}/public/data/${colName}`;

// Format Tanggal Indonesia
const formatDate = (date) => {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const formatTime = (date) => {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// --- COMPONENTS ---

// 1. LOGIN COMPONENT
const Login = ({ onLogin, loading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Simulasi email karena firebase butuh email
    const email = `${username.toLowerCase().replace(/\s/g, '')}@mtsdarulhuda.com`;
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-green-600">
        <div className="text-center mb-8">
          <School className="w-16 h-16 text-green-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">ABSENSI MTS DARUL HUDA</h1>
          <p className="text-gray-500 text-sm">Silakan login untuk melanjutkan</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input 
              type="password" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Memuat...' : 'MASUK'}
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-gray-400">
          Versi 1.0.0 • MTS Darul Huda
        </div>
      </div>
    </div>
  );
};

// 2. ADMIN DASHBOARD
const AdminDashboard = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('siswa'); // siswa, guru, mapel
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = (type) => {
    setLoading(true);
    let colName = '';
    if (type === 'siswa') colName = 'users'; // Filter role siswa nanti
    else if (type === 'guru') colName = 'users'; // Filter role guru nanti
    else if (type === 'mapel') colName = 'subjects';

    const q = query(collection(db, COLLECTION_PATH(colName)));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (type === 'siswa') items = items.filter(i => i.role === 'siswa');
      if (type === 'guru') items = items.filter(i => i.role === 'guru');
      
      setDataList(items);
      setLoading(false);
    });
    return () => unsubscribe();
  };

  const handleAdd = async () => {
    setLoading(true);
    try {
      if (activeTab === 'mapel') {
        await addDoc(collection(db, COLLECTION_PATH('subjects')), {
          name: formData.name
        });
      } else {
        // Create User logic (Simulated for this demo, usually needs Cloud Functions for creating auth users properly)
        // Disini kita hanya simpan data ke Firestore untuk demo
        await addDoc(collection(db, COLLECTION_PATH('users')), {
          ...formData,
          role: activeTab, // siswa atau guru
          createdAt: serverTimestamp()
        });
        
        // Note: Di aplikasi real production, kita juga harus createAuthUser di Firebase Auth
      }
      setShowForm(false);
      setFormData({});
      alert('Data berhasil ditambahkan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menambah data');
    }
    setLoading(false);
  };

  const handleDelete = async (id, colName) => {
    if(!confirm('Yakin ingin menghapus?')) return;
    try {
      await deleteDoc(doc(db, COLLECTION_PATH(colName), id));
    } catch (error) {
      alert('Gagal menghapus');
    }
  };

  return (
    <div className="p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Panel Admin</h2>
        <div className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
          Hi, {currentUser.username}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        {['siswa', 'guru', 'mapel'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setShowForm(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize whitespace-nowrap ${
              activeTab === tab ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            Data {tab}
          </button>
        ))}
      </div>

      {/* Action Bar */}
      <div className="mb-4">
        <button 
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white p-3 rounded-lg shadow-sm hover:bg-green-700"
        >
          <Plus size={18} /> Tambah {activeTab}
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4 capitalize">Tambah {activeTab}</h3>
            
            <div className="space-y-3">
              <input 
                placeholder={activeTab === 'mapel' ? "Nama Mata Pelajaran" : "Nama Lengkap"}
                className="w-full p-2 border rounded"
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
              
              {activeTab !== 'mapel' && (
                <>
                  <input 
                    placeholder="Username Login"
                    className="w-full p-2 border rounded"
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                  <input 
                    placeholder="Nomor Induk / NIP"
                    className="w-full p-2 border rounded"
                    type="number"
                    onChange={e => setFormData({...formData, idNumber: e.target.value})}
                  />
                </>
              )}

              {activeTab === 'siswa' && (
                <input 
                  placeholder="Kelas (Contoh: 7A)"
                  className="w-full p-2 border rounded"
                  onChange={e => setFormData({...formData, className: e.target.value})}
                />
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => setShowForm(false)}
                className="flex-1 p-2 border rounded text-gray-600"
              >
                Batal
              </button>
              <button 
                onClick={handleAdd}
                disabled={loading}
                className="flex-1 p-2 bg-green-600 text-white rounded"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data List */}
      <div className="space-y-3">
        {dataList.length === 0 && !loading && (
          <div className="text-center py-10 text-gray-400">Belum ada data</div>
        )}
        
        {dataList.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-800">{item.name}</p>
              {activeTab !== 'mapel' && (
                <p className="text-xs text-gray-500">
                  {item.idNumber} | {activeTab === 'siswa' ? item.className : item.username}
                </p>
              )}
            </div>
            <button 
              onClick={() => handleDelete(item.id, activeTab === 'mapel' ? 'subjects' : 'users')}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. TEACHER DASHBOARD (SCANNER & REPORTS)
const TeacherDashboard = ({ currentUser }) => {
  const [mode, setMode] = useState('menu'); // menu, scan, report
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [logs, setLogs] = useState([]);

  // Load Mapel
  useEffect(() => {
    const q = query(collection(db, COLLECTION_PATH('subjects')));
    getDocs(q).then(snap => {
      setSubjects(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
  }, []);

  const handleScan = async (data) => {
    if (!data) return;
    // Format QR Data: SISWA_ID
    
    // Cari siswa berdasarkan ID
    const studentId = data;
    
    try {
      // Cek apakah siswa ada
      const userRef = doc(db, COLLECTION_PATH('users'), studentId);
      // Di real app kita getDoc userRef, tapi untuk simplifikasi kita percaya ID valid dulu atau query by id
      
      // Simpan Absensi
      await addDoc(collection(db, COLLECTION_PATH('attendance')), {
        studentId: studentId,
        teacherId: currentUser.id,
        subjectId: selectedSubject,
        subjectName: subjects.find(s => s.id === selectedSubject)?.name || 'Unknown',
        timestamp: serverTimestamp(),
        dateString: new Date().toISOString().split('T')[0],
        status: 'Hadir'
      });

      setScanResult({ success: true, message: `Absen Berhasil: ${studentId}` });
      setTimeout(() => setScanResult(null), 3000);
    } catch (err) {
      setScanResult({ success: false, message: 'Gagal mencatat absen' });
    }
  };

  // Mock Scanner karena akses kamera di iframe terbatas
  const MockScanner = ({ onScan }) => {
    const [manualId, setManualId] = useState('');
    return (
      <div className="bg-black p-6 rounded-xl text-white text-center">
        <div className="animate-pulse w-48 h-48 border-4 border-green-500 mx-auto mb-4 flex items-center justify-center rounded-lg bg-gray-900">
          <Camera size={48} className="text-green-500" />
        </div>
        <p className="mb-4 text-sm">Arahkan kamera ke QR Code Siswa</p>
        
        {/* Fallback Manual Input */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2">Alternatif (Jika Kamera Error):</p>
          <div className="flex gap-2">
            <input 
              className="text-black p-2 rounded flex-1 text-sm" 
              placeholder="Masukkan ID Siswa"
              value={manualId}
              onChange={e => setManualId(e.target.value)}
            />
            <button 
              onClick={() => onScan(manualId)}
              className="bg-green-600 px-4 py-2 rounded font-bold text-sm"
            >
              Kirim
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ReportView = () => {
    const [reportData, setReportData] = useState([]);
    
    useEffect(() => {
      const q = query(
        collection(db, COLLECTION_PATH('attendance')), 
        orderBy('timestamp', 'desc')
      );
      const unsub = onSnapshot(q, (snap) => {
        // Disini harusnya join dengan data siswa, tapi kita tampilkan raw dulu
        setReportData(snap.docs.map(d => ({id: d.id, ...d.data()})));
      });
      return () => unsub();
    }, []);

    const downloadCSV = () => {
      const headers = "Tanggal,Jam,ID Siswa,Mata Pelajaran,Status\n";
      const rows = reportData.map(row => {
        const date = row.timestamp ? row.timestamp.toDate() : new Date();
        return `${formatDate(date)},${formatTime(date)},${row.studentId},${row.subjectName},${row.status}`;
      }).join("\n");
      
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_Absensi_${new Date().toISOString()}.csv`;
      a.click();
    };

    return (
      <div className="bg-white rounded-lg p-4 shadow-sm min-h-screen">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Laporan Kehadiran</h3>
          <button onClick={downloadCSV} className="text-green-600 flex items-center gap-1 text-sm">
            <Download size={16} /> Excel/CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-2">Waktu</th>
                <th className="p-2">Siswa ID</th>
                <th className="p-2">Mapel</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">
                    <div className="font-bold">{r.timestamp && formatTime(r.timestamp.toDate())}</div>
                    <div className="text-xs text-gray-500">{r.timestamp && formatDate(r.timestamp.toDate())}</div>
                  </td>
                  <td className="p-2">{r.studentId}</td>
                  <td className="p-2">{r.subjectName}</td>
                  <td className="p-2 text-green-600 font-bold">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (mode === 'scan') {
    return (
      <div className="p-4 h-screen flex flex-col">
        <button onClick={() => setMode('menu')} className="mb-4 flex items-center text-gray-600">
          <ArrowLeft size={20} className="mr-2" /> Kembali
        </button>
        
        <div className="flex-1 flex flex-col items-center">
          <h2 className="text-xl font-bold mb-2">Scan QR Siswa</h2>
          <p className="text-gray-500 mb-6 text-sm">Mapel: {subjects.find(s=>s.id===selectedSubject)?.name}</p>
          
          <MockScanner onScan={handleScan} />

          {scanResult && (
            <div className={`mt-6 p-4 rounded-lg w-full text-center text-white ${scanResult.success ? 'bg-green-500' : 'bg-red-500'}`}>
              {scanResult.success ? <CheckCircle className="mx-auto mb-2"/> : <XCircle className="mx-auto mb-2"/>}
              {scanResult.message}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'report') {
    return (
      <div className="p-4">
         <button onClick={() => setMode('menu')} className="mb-4 flex items-center text-gray-600">
          <ArrowLeft size={20} className="mr-2" /> Kembali
        </button>
        <ReportView />
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Menu Guru</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Mata Pelajaran Hari Ini</label>
        <select 
          className="w-full p-3 border rounded-lg bg-white"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">-- Pilih Mapel --</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => {
            if(!selectedSubject) return alert('Pilih mata pelajaran dulu!');
            setMode('scan');
          }}
          className="bg-green-600 text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 hover:bg-green-700 transition"
        >
          <QrCode size={32} />
          <span className="font-bold">Mulai Absen</span>
        </button>

        <button 
          onClick={() => setMode('report')}
          className="bg-blue-600 text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 hover:bg-blue-700 transition"
        >
          <FileText size={32} />
          <span className="font-bold">Laporan</span>
        </button>
      </div>
    </div>
  );
};

// 4. STUDENT DASHBOARD
const StudentDashboard = ({ currentUser }) => {
  return (
    <div className="p-4 h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-xl border border-gray-100 text-center">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{currentUser.name}</h2>
          <p className="text-gray-500">{currentUser.className} | {currentUser.idNumber}</p>
        </div>
        
        <div className="bg-white p-4 inline-block rounded-xl border-2 border-green-500 mb-4">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${currentUser.id}`} 
            alt="QR Code Siswa"
            className="w-48 h-48"
          />
        </div>
        
        <p className="text-sm text-gray-400">Tunjukkan QR Code ini kepada Guru untuk melakukan absensi.</p>
        
        <div className="mt-8 border-t pt-4 w-full">
          <h3 className="text-left text-sm font-bold text-gray-700 mb-2">Riwayat Hari Ini</h3>
          {/* Mock history */}
          <div className="bg-green-50 p-3 rounded-lg flex justify-between items-center text-sm">
            <span>Matematika</span>
            <span className="font-bold text-green-700">Hadir</span>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial Auth & Data Load
  useEffect(() => {
    const initApp = async () => {
      // Auth Listener
      onAuthStateChanged(auth, async (authUser) => {
        if (authUser) {
          setUser(authUser);
          // Cari data user di Firestore berdasarkan email (yang kita buat dari username)
          // Di app real, gunakan UID. Disini kita simulasi query.
          // Fallback untuk admin default
          if (authUser.email === 'admin@mtsdarulhuda.com') {
             setUserData({ username: 'admin', role: 'admin', name: 'Administrator' });
          } else {
             // Cari user di firestore yang punya username cocok
             const username = authUser.email.split('@')[0];
             const q = query(collection(db, COLLECTION_PATH('users')), where('username', '==', username));
             const querySnapshot = await getDocs(q);
             if (!querySnapshot.empty) {
               const docData = querySnapshot.docs[0];
               setUserData({ id: docData.id, ...docData.data() });
             } else {
               // Fallback jika data firestore terhapus tapi auth masih ada
               setUserData({ username: username, role: 'siswa', name: 'Siswa Demo' });
             }
          }
        } else {
          setUser(null);
          setUserData(null);
        }
        setLoading(false);
      });
    };
    initApp();
  }, []);

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
       // Auto Create Admin if not exists (FOR DEMO PURPOSE)
       if (email === 'admin@mtsdarulhuda.com' && error.code === 'auth/user-not-found') {
         await createUserWithEmailAndPassword(auth, email, password);
         await signInWithEmailAndPassword(auth, email, password);
       } else {
         alert("Login Gagal: Periksa username/password");
       }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Render Logic
  if (loading) return <div className="flex items-center justify-center h-screen bg-green-50 text-green-600">Memuat Sistem...</div>;

  if (!user || !userData) {
    return <Login onLogin={handleLogin} loading={loading} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Header Mobile */}
      <header className="bg-green-600 text-white p-4 flex justify-between items-center shadow-lg z-10 relative">
        <div className="flex items-center gap-2">
          <School size={24} />
          <h1 className="font-bold text-lg">MTS DARUL HUDA</h1>
        </div>
        <button onClick={handleLogout} className="bg-green-700 p-2 rounded-full hover:bg-green-800">
          <LogOut size={18} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="h-[calc(100vh-64px)] overflow-y-auto">
        {userData.role === 'admin' && <AdminDashboard currentUser={userData} />}
        {userData.role === 'guru' && <TeacherDashboard currentUser={userData} />}
        {userData.role === 'siswa' && <StudentDashboard currentUser={userData} />}
      </main>
    </div>
  );
}
