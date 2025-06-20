import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [tipe, setTipe] = useState('pemasukan')
  const [jumlah, setJumlah] = useState('')
  const [catatan, setCatatan] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [data, setData] = useState([])
  const [grafik, setGrafik] = useState([
    { name: 'Pemasukan', value: 0 },
    { name: 'Pengeluaran', value: 0 }
  ])
  const [saldo, setSaldo] = useState(0)

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
      .order('tanggal', { ascending: true }) // urutkan naik

    if (!error) {
      setData(data)

      const pemasukan = data
        .filter((item) => item.tipe === 'pemasukan')
        .reduce((acc, curr) => acc + Number(curr.jumlah), 0)

      const pengeluaran = data
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
      tanggal
    }])

    if (!error) {
      setJumlah('')
      setCatatan('')
      setTanggal('')
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

  // Hitung saldo per baris untuk ditampilkan di tabel
  const getSaldoSementara = (index) => {
    let saldo = 0
    for (let i = 0; i <= index; i++) {
      const item = data[i]
      if (item.tipe === 'pemasukan') {
        saldo += Number(item.jumlah)
      } else {
        saldo -= Number(item.jumlah)
      }
    }
    return saldo
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Logout */}
      <div className="flex justify-end mb-4">
        <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-1 rounded text-sm">
          Logout
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow p-6 rounded-lg">
        <h1 className="text-2xl font-bold text-purple-600 mb-4 text-center">📊 Dashboard Keuangan UMKM</h1>

        {/* Grafik */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Grafik Keuangan</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={grafik} dataKey="value" nameKey="name" outerRadius={80} label>
                <Cell fill="#10B981" /> {/* Pemasukan */}
                <Cell fill="#EF4444" /> {/* Pengeluaran */}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4 mb-6">
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="border px-3 py-2 rounded"
            required
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

        {/* Tombol Download + Sisa Saldo */}
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

        {/* Tabel */}
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
      </div>
    </div>
  )
}
