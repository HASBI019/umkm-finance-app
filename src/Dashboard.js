import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [tipe, setTipe] = useState('pemasukan')
  const [jumlah, setJumlah] = useState('')
  const [catatan, setCatatan] = useState('')
  const [data, setData] = useState([])
  const [grafik, setGrafik] = useState([
    { name: 'Pemasukan', value: 0 },
    { name: 'Pengeluaran', value: 0 }
  ])
  const [saldo, setSaldo] = useState(0)
  const [filter, setFilter] = useState('semua')

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        fetchData(session.user.id)
      } else {
        window.location.href = '/' // redirect kalau belum login
      }
    }
    getSession()
  }, [filter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('transactions').insert([
      {
        user_id: user.id,
        tipe,
        jumlah: parseFloat(jumlah),
        catatan,
        tanggal: new Date()
      }
    ])

    if (!error) {
      alert('✅ Transaksi berhasil!')
      setJumlah('')
      setCatatan('')
      fetchData(user.id)
    } else {
      alert('❌ Gagal: ' + error.message)
    }
  }

  const fetchData = async (userId) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('tanggal', { ascending: false })

    if (!error) {
      const now = new Date()
      const filtered = data.filter((item) => {
        const tgl = new Date(item.tanggal)
        if (filter === 'hari') {
          return tgl.toDateString() === now.toDateString()
        }
        if (filter === 'minggu') {
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay())
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          return tgl >= weekStart && tgl <= weekEnd
        }
        if (filter === 'bulan') {
          return tgl.getMonth() === now.getMonth() && tgl.getFullYear() === now.getFullYear()
        }
        if (filter === 'tahun') {
          return tgl.getFullYear() === now.getFullYear()
        }
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

  const downloadPDF = async () => {
    const input = document.getElementById('laporan-area')
    const canvas = await html2canvas(input)
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save('laporan-keuangan.pdf')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">⏳ Memuat... atau Anda belum login.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100 p-6">
      <div id="laporan-area" className="max-w-xl mx-auto bg-white shadow-lg rounded-xl p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-purple-600">📘 Keuangan UMKM</h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/'
            }}
            className="bg-red-500 text-white px-4 py-1 rounded-md text-sm hover:bg-red-600"
          >
            🚪 Logout
          </button>
        </div>

        {/* Sisa saldo + filter + PDF */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div className={`py-2 px-4 rounded-md font-semibold text-xl 
            ${saldo >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            💼 Sisa Saldo: Rp {saldo.toLocaleString()}
          </div>

          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="semua">📊 Semua</option>
              <option value="hari">📅 Hari Ini</option>
              <option value="minggu">🗓️ Minggu Ini</option>
              <option value="bulan">🗓️ Bulan Ini</option>
              <option value="tahun">📆 Tahun Ini</option>
            </select>

            <button
              onClick={downloadPDF}
              className="bg-gray-700 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-800"
            >
              📄 Download PDF
            </button>
          </div>
        </div>

        {/* Grafik */}
        <div className="my-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Grafik Keuangan</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={grafik}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label
              >
                <Cell fill="#34d399" />
                <Cell fill="#f87171" />
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Form Transaksi */}
        <form onSubmit={handleSubmit} className="space-y-3 mb-6">
          <select
            value={tipe}
            onChange={(e) => setTipe(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          >
            <option value="pemasukan">💰 Pemasukan</option>
            <option value="pengeluaran">💸 Pengeluaran</option>
          </select>
          <input
            type="number"
            placeholder="Jumlah (Rp)"
            className="w-full px-4 py-2 border rounded-md"
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Catatan (Contoh: Penjualan, Beli Bahan)"
            className="w-full px-4 py-2 border rounded-md"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition"
          >
            Simpan Transaksi
          </button>
        </form>

        {/* Riwayat */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Riwayat Transaksi</h2>
          <ul className="divide-y">
            {data.map((item) => (
              <li key={item.id} className="py-3 flex justify-between items-center text-sm">
                <span>
                  {item.tipe === 'pemasukan' ? '💰' : '💸'} <strong>{item.catatan || '(Tanpa catatan)'}</strong>
                  <br />
                  <span className="text-xs text-gray-500">{item.tanggal}</span>
                </span>
                <span className={item.tipe === 'pemasukan' ? 'text-green-600' : 'text-red-500'}>
                  Rp {Number(item.jumlah).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
