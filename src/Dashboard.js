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
  const [filterTanggal, setFilterTanggal] = useState(null)

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
  }, [])

  const fetchData = async (userId) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('tanggal', { ascending: true })

    if (!error) {
      const filtered = filterTanggal
        ? data.filter((d) => d.tanggal === format(filterTanggal, 'yyyy-MM-dd'))
        : data
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

  const downloadPDF = async () => {
    const input = document.getElementById('tabel-transaksi')
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-end mb-4">
        <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-1 rounded text-sm">
          Logout
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="max-w-4xl mx-auto bg-white shadow p-6 rounded-lg">
        <img src="/logo-umkm.png" alt="Logo UMKM" className="h-60 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-purple-600 mb-2 text-center">📊 Dashboard Keuangan UMKM</h1>

        <div className="mb-4">
          <DatePicker
            selected={filterTanggal}
            onChange={(date) => setFilterTanggal(date)}
            dateFormat="yyyy-MM-dd"
            className="border px-3 py-2 rounded"
            placeholderText="Filter berdasarkan tanggal"
          />
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

        <div id="tabel-transaksi" className="overflow-x-auto">
          <table className="w-full text-sm border border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border">Tanggal</th>
                <th className="p-2 border">Tipe</th>
                <th className="p-2 border">Catatan</th>
                <th className="p-2 border">Jumlah</th>
                <th className="p-2 border">Saldo</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-8">
          <motion.p initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} className="text-lg font-semibold text-purple-700">✨ Buat UMKM, Biar Semangat Terus! ✨</motion.p>
          <p className="text-sm text-gray-600 mt-1">Kami Mahasiswa STTC - Prodi Informatika | Kelompok 2</p>
          <p className="text-sm text-gray-700 font-semibold mt-1">Team: Three Start ⭐⭐⭐</p>
          <div className="flex justify-center gap-4 mt-4">
            <div className="text-center">
              <img src="/team1.jpg" alt="Tim 1" className="w-20 h-20 rounded-full object-cover border" />
              <p className="text-xs mt-1">Hasbi</p>
            </div>
            <div className="text-center">
              <img src="/team2.jpg" alt="Tim 2" className="w-20 h-20 rounded-full object-cover border" />
              <p className="text-xs mt-1">Anggota 2</p>
            </div>
            <div className="text-center">
              <img src="/team3.jpg" alt="Tim 3" className="w-20 h-20 rounded-full object-cover border" />
              <p className="text-xs mt-1">Anggota 3</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
