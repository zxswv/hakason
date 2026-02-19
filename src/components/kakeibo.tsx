"use client";

import { revalidatePath } from 'next/cache';

interface Record {
  id: number;
  date: string;
  category: string;
  amount: number;
}

// 初期表示を賑やかにするためのダミーデータ（APIが空の場合のバックアップや一括追加用）
const plannedRecords = [
  { date: '2026-02-15', category: '給料', amount: 250000 },
  { date: '2026-02-16', category: 'カフェ代', amount: -650 },
  { date: '2026-02-17', category: '食費（スーパー）', amount: -4200 },
  { date: '2026-02-20', category: 'サブスク更新', amount: -1200 },
  { date: '2026-02-25', category: '家賃', amount: -85000 },
];

export default async function kakeibo() {
  const API_URL = 'http://localhost:3000/api/records';

  // 1. データ取得
  let records: Record[] = [];
  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (res.ok) {
      records = await res.json();
    }
  } catch (e) {
    console.error("Fetch error:", e);
  }

  // 2. 収支計算ロジック
  const totalBalance = records.reduce((sum, r) => sum + r.amount, 0);
  const totalIncome = records.filter(r => r.amount > 0).reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = records.filter(r => r.amount < 0).reduce((sum, r) => sum + r.amount, 0);

  // 3. Server Actions
  async function addRecord(formData: FormData) {
    'use server';
    const newRecord = {
      date: formData.get('date'),
      category: formData.get('category'),
      amount: Number(formData.get('amount')),
    };
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    });
    revalidatePath('/');
  }

  async function addDummyDataAction() {
    'use server';
    await Promise.all(plannedRecords.map(record => 
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })
    ));
    revalidatePath('/');
  }

  return (
    <div style={{ padding: '40px', fontFamily: '"Helvetica Neue", Arial, sans-serif', maxWidth: '800px', margin: '0 auto', backgroundColor: '#fcfcfc' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#333', fontSize: '28px' }}>家計簿</h1>
        <p style={{ color: '#666' }}>Next.js 16 Server Components による高速な財務管理</p>
      </header>

      {/* サマリーカードセクション */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
        <div style={cardStyle('#fff', '#333')}>
          <small>現在の純資産</small>
          <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{totalBalance.toLocaleString()}円</div>
        </div>
        <div style={cardStyle('#e6fffa', '#285e61')}>
          <small>総収入</small>
          <div style={{ fontSize: '22px', fontWeight: 'bold' }}>+{totalIncome.toLocaleString()}円</div>
        </div>
        <div style={cardStyle('#fff5f5', '#822727')}>
          <small>総支出</small>
          <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{totalExpense.toLocaleString()}円</div>
        </div>
      </div>

      {/* 操作パネル */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <form action={addRecord} style={{ display: 'flex', gap: '8px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
          <input type="date" name="date" required style={inputStyle} />
          <input type="text" name="category" placeholder="項目" required style={inputStyle} />
          <input type="number" name="amount" placeholder="金額" required style={inputStyle} />
          <button type="submit" style={btnStyle('#333', '#fff')}>記録</button>
        </form>

      </div>

      {/* 履歴テーブル */}
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f7fafc', textAlign: 'left', borderBottom: '2px solid #eee' }}>
              <th style={thStyle}>日付</th>
              <th style={thStyle}>カテゴリ</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>金額</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '30px', color: '#a0aec0' }}>取引データが見当たりません</td></tr>
            ) : (
              records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f7fafc' }}>
                  <td style={tdStyle}>{r.date}</td>
                  <td style={tdStyle}>{r.category}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', color: r.amount < 0 ? '#e53e3e' : '#38a169' }}>
                    {r.amount.toLocaleString()}円
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// スタイル補助
const cardStyle = (bg: string, color: string) => ({
  backgroundColor: bg,
  color: color,
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  border: '1px solid #eee'
});

const inputStyle = { padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '14px' };
const thStyle = { padding: '12px 15px', color: '#4a5568', fontSize: '14px', fontWeight: '600' };
const tdStyle = { padding: '12px 15px', fontSize: '15px' };
const btnStyle = (bg: string, color: string, border = 'none') => ({
  backgroundColor: bg, color: color, border: border, padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
});