import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [tipe, setTipe] = useState('pemasukan')
  const [jumlah, setJumlah] = useState('')
  const [catatan, setCatatan] = useState('')
  const [tanggal, setTanggal] = useState(new Date())
  const [data, setData] = useState([])
  const [grafik, setGrafik] = useState([
    { name: 'Pemasukan', value: 0 },
    { name: 'Pengeluaran', value: 0 }
  ])
  const [saldo, setSaldo] = useState(0)
  const [tanggalDari, setTanggalDari] = useState(null)
  const [tanggalKe, setTanggalKe] = useState(null)

  const [editId, setEditId] = useState(null)
  const [editJumlah, setEditJumlah] = useState('')
  const [editCatatan, setEditCatatan] = useState('')

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        fetchData(session.user.id)
      } else {
        window.location.href = '/'
      }
    }
    getSession()
  }, [tanggalDari, tanggalKe])

  const fetchData = async (userId) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('tanggal', { ascending: true })

    if (!error) {
      const filtered = data.filter((d) => {
        const tgl = new Date(d.tanggal)
        if (tanggalDari && tgl < tanggalDari) return false
        if (tanggalKe && tgl > tanggalKe) return false
        return true
      })

      setData(filtered)

      const pemasukan = filtered
        .filter((item) => item.tipe === 'pemasukan')
        .reduce((acc, curr) => acc + Number(curr.jumlah), 0)

      const pengeluaran = filtered
        .filter((item) => item.tipe === 'pengeluaran')
        .reduce((acc, curr) => acc + Number(curr.jumlah), 0)

      setGrafik([
        { name: 'Pemasukan', value: pemasukan },
        { name: 'Pengeluaran', value: pengeluaran }
      ])

      setSaldo(pemasukan - pengeluaran)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return alert("⚠️ Kamu belum login.")
    if (!tanggal || !jumlah) return alert("📅 Tanggal dan jumlah wajib diisi.")

    const { error } = await supabase.from('transactions').insert([{
      user_id: user.id,
      tipe,
      jumlah: parseFloat(jumlah),
      catatan,
      tanggal: format(tanggal, 'yyyy-MM-dd')
    }])

    if (!error) {
      setJumlah('')
      setCatatan('')
      setTanggal(new Date())
      fetchData(user.id)
    } else {
      alert('❌ Gagal menyimpan: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Yakin ingin menghapus transaksi ini?')) {
      await supabase.from('transactions').delete().eq('id', id)
      fetchData(user.id)
    }
  }

  const handleEdit = (item) => {
    setEditId(item.id)
    setEditJumlah(item.jumlah)
    setEditCatatan(item.catatan)
  }

  const handleUpdate = async () => {
    if (!editId) return
    await supabase.from('transactions')
      .update({ jumlah: parseFloat(editJumlah), catatan: editCatatan })
      .eq('id', editId)

    setEditId(null)
    setEditJumlah('')
    setEditCatatan('')
    fetchData(user.id)
  }

  const downloadPDF = async () => {
    const input = document.getElementById('laporan-pdf')
    const canvas = await html2canvas(input)
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save('riwayat-transaksi.pdf')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const getSaldoSementara = (index) => {
    let sisa = 0
    for (let i = 0; i <= index; i++) {
      const item = data[i]
      sisa += item.tipe === 'pemasukan' ? Number(item.jumlah) : -Number(item.jumlah)
    }
    return sisa
  }

  return (
    <div
  className="min-h-screen bg-cover bg-center p-6"
  style={{ backgroundImage: "url('/bg-umkm.jpg')" }}
>

      <div className="flex justify-end mb-4">
        <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-1 rounded text-sm">
          Logout
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="max-w-4xl mx-auto bg-white shadow p-6 rounded-lg">
        <div className="text-center mb-4">
          <img
            src={user?.user_metadata?.avatar_url || '/default-profile.png'}
            alt="Profil"
            className="w-16 h-16 rounded-full mx-auto border"
          />
          <p className="text-sm text-gray-700 mt-1">{user?.user_metadata?.name || user?.email}</p>
        </div>

        <img src="/logo-umkm.png" alt="Logo UMKM" className="h-120 w-auto mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-purple-600 mb-2 text-center">📊 Dashboard Keuangan UMKM</h1>

        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">📅 Dari Tanggal</label>
            <DatePicker
              selected={tanggalDari}
              onChange={(date) => setTanggalDari(date)}
              dateFormat="yyyy-MM-dd"
              placeholderText="Mulai"
              className="border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">📅 Sampai Tanggal</label>
            <DatePicker
              selected={tanggalKe}
              onChange={(date) => setTanggalKe(date)}
              dateFormat="yyyy-MM-dd"
              placeholderText="Sampai"
              className="border px-3 py-2 rounded"
            />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Grafik Keuangan</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={grafik} dataKey="value" nameKey="name" outerRadius={80} label>
                <Cell fill="#10B981" />
                <Cell fill="#EF4444" />
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4 mb-6">
          <DatePicker
            selected={tanggal}
            onChange={(date) => setTanggal(date)}
            dateFormat="yyyy-MM-dd"
            className="border px-3 py-2 rounded w-full"
            placeholderText="Pilih tanggal transaksi"
          />
          <select value={tipe} onChange={(e) => setTipe(e.target.value)} className="border px-3 py-2 rounded">
            <option value="pemasukan">💰 Pemasukan</option>
            <option value="pengeluaran">💸 Pengeluaran</option>
          </select>
          <input
            type="number"
            placeholder="Jumlah (Rp)"
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value)}
            className="border px-3 py-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <div className="sm:col-span-2">
            <button type="submit" className="bg-purple-600 text-white w-full py-2 rounded hover:bg-purple-700">
              Simpan Transaksi
            </button>
          </div>
        </form>

        {/* Bagian PDF */}
        <div id="laporan-pdf">
          <div className="mb-4 text-left text-sm text-gray-700">
            <p><strong>Nama Pengguna:</strong> {user?.user_metadata?.name || user?.email}</p>
          </div>

          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Riwayat Transaksi</h2>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded text-sm font-medium ${saldo >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                💼 Sisa Saldo: Rp {saldo.toLocaleString()}
              </div>
              <button onClick={downloadPDF} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                📥 Download PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="mt-4 flex flex-col items-center justify-center text-sm text-gray-700">
            <p>Laporan Transaksi Pengguna</p>
            <p className="mt-1"></p>
          </div>
            <table className="w-full text-sm border border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 border">Tanggal</th>
                  <th className="p-2 border">Tipe</th>
                  <th className="p-2 border">Catatan</th>
                  <th className="p-2 border">Jumlah</th>
                  <th className="p-2 border">Saldo</th>
                  <th className="p-2 border">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={item.id}>
                    <td className="p-2 border">{item.tanggal}</td>
                    <td className="p-2 border capitalize">{item.tipe}</td>
                    <td className="p-2 border">{item.catatan || '-'}</td>
                    <td className="p-2 border">Rp {Number(item.jumlah).toLocaleString()}</td>
                    <td className="p-2 border">Rp {getSaldoSementara(index).toLocaleString()}</td>
                    <td className="p-2 border flex gap-2">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 text-xs">✏️ Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 text-xs">🗑️ Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          
        </div>

        {editId && (
          <div className="bg-yellow-50 p-4 mt-4 rounded shadow border">
            <h3 className="font-semibold text-yellow-700 mb-2">Edit Transaksi</h3>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                type="number"
                value={editJumlah}
                onChange={(e) => setEditJumlah(e.target.value)}
                className="border px-2 py-1 rounded w-full"
                placeholder="Jumlah"
              />
              <input
                type="text"
                value={editCatatan}
                onChange={(e) => setEditCatatan(e.target.value)}
                className="border px-2 py-1 rounded w-full"
                placeholder="Catatan"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleUpdate} className="bg-green-600 text-white px-4 py-1 rounded">✅ Simpan</button>
              <button onClick={() => setEditId(null)} className="bg-gray-400 text-white px-4 py-1 rounded">❌ Batal</button>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <motion.p initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} className="text-lg font-semibold text-purple-700">✨ Buat UMKM, Semangat Terus! ✨</motion.p>
          <p className="text-sm text-gray-600 mt-1">Kami Mahasiswa STTC - Prodi Informatika | MK Sistem Informasi | Kelompok 2 Siap Membantu UMKM</p>
          <p className="text-sm text-gray-700 font-semibold mt-1">MY TEAM : THREE START⭐⭐⭐</p>
          <div className="flex justify-center gap-4 mt-4">
            <div className="text-center">
              <img src="/team1.jpg" alt="Tim 1" className="w-20 h-20 rounded-full object-cover border" />
              <p className="text-xs mt-1">Deden</p>
            </div>
            <div className="text-center">
              <img src="/team2.jpg" alt="Tim 2" className="w-20 h-20 rounded-full object-cover border" />
              <p className="text-xs mt-1">Hasbi</p>
            </div>
            <div className="text-center">
              <img src="/team3.jpg" alt="Tim 3" className="w-20 h-20 rounded-full object-cover border" />
              <p className="text-xs mt-1">Wajdi</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
