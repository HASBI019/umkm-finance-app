import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function Laporan() {
  const [user, setUser] = useState(null)
  const [data, setData] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pemasukan, setPemasukan] = useState(0)
  const [pengeluaran, setPengeluaran] = useState(0)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      } else {
        window.location.href = '/'
      }
    }
    getSession()
  }, [])

  const fetchFilteredData = async () => {
    if (!startDate || !endDate) {
      alert("Pilih tanggal mulai dan akhir terlebih dahulu")
      return
    }

    const { data: transaksi, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('tanggal', startDate)
      .lte('tanggal', endDate)
      .order('tanggal', { ascending: true })

    if (!error) {
      setData(transaksi)
      const masuk = transaksi
        .filter(t => t.tipe === 'pemasukan')
        .reduce((a, b) => a + Number(b.jumlah), 0)
      const keluar = transaksi
        .filter(t => t.tipe === 'pengeluaran')
        .reduce((a, b) => a + Number(b.jumlah), 0)

      setPemasukan(masuk)
      setPengeluaran(keluar)
    }
  }

  const downloadPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Laporan Keuangan UMKM", 14, 15)

    doc.setFontSize(10)
    doc.text(`Periode: ${startDate} s.d. ${endDate}`, 14, 22)

    const rows = data.map((item, i) => [
      i + 1,
      item.tanggal,
      item.tipe,
      item.catatan || '-',
      `Rp ${Number(item.jumlah).toLocaleString()}`
    ])

    doc.autoTable({
      head: [['No', 'Tanggal', 'Tipe', 'Catatan', 'Jumlah']],
      body: rows,
      startY: 28,
      styles: { fontSize: 9 },
    })

    const totalY = doc.lastAutoTable.finalY + 10

    doc.text(`Total Pemasukan: Rp ${pemasukan.toLocaleString()}`, 14, totalY)
    doc.text(`Total Pengeluaran: Rp ${pengeluaran.toLocaleString()}`, 14, totalY + 6)
    doc.text(`Sisa Saldo: Rp ${(pemasukan - pengeluaran).toLocaleString()}`, 14, totalY + 12)

    doc.save(`Laporan-Keuangan-${startDate}-sd-${endDate}.pdf`)
  }

  if (!user) {
    return <p className="text-center mt-20 text-gray-600">🔐 Memuat... atau Anda belum login.</p>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-purple-600 mb-4 text-center">📄 Laporan Keuangan UMKM</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={fetchFilteredData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            🔍 Tampilkan Data
          </button>
          <button
            onClick={downloadPDF}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            📥 Download PDF
          </button>
        </div>

        <table className="w-full text-sm mt-4 border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">No</th>
              <th className="p-2 border">Tanggal</th>
              <th className="p-2 border">Tipe</th>
              <th className="p-2 border">Catatan</th>
              <th className="p-2 border">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={item.id} className="text-center">
                <td className="p-2 border">{i + 1}</td>
                <td className="p-2 border">{item.tanggal}</td>
                <td className="p-2 border">{item.tipe}</td>
                <td className="p-2 border">{item.catatan || '-'}</td>
                <td className="p-2 border">Rp {Number(item.jumlah).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.length > 0 && (
          <div className="mt-4 text-sm text-gray-800">
            <p>✅ Total Pemasukan: <strong className="text-green-600">Rp {pemasukan.toLocaleString()}</strong></p>
            <p>❌ Total Pengeluaran: <strong className="text-red-600">Rp {pengeluaran.toLocaleString()}</strong></p>
            <p>💼 Sisa Saldo: <strong className="text-purple-600">Rp {(pemasukan - pengeluaran).toLocaleString()}</strong></p>
          </div>
        )}
      </div>
    </div>
  )
}
