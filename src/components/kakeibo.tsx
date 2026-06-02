"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface KakeiboRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
}

const INITIAL_RECORDS: KakeiboRecord[] = [
  { id: "1", date: "2026-02-15", category: "給料",           amount:  250000 },
  { id: "2", date: "2026-02-16", category: "カフェ代",       amount:   -650  },
  { id: "3", date: "2026-02-17", category: "食費（スーパー）", amount:  -4200  },
  { id: "4", date: "2026-02-20", category: "サブスク更新",   amount:  -1200  },
  { id: "5", date: "2026-02-25", category: "家賃",           amount: -85000  },
];

interface Props {
  onClose: () => void;
}

export default function Kakeibo({ onClose }: Props) {
  const [records, setRecords] = useState<KakeiboRecord[]>(INITIAL_RECORDS);
  const [date,     setDate]     = useState("");
  const [category, setCategory] = useState("");
  const [amount,   setAmount]   = useState("");
  const [error,    setError]    = useState("");

  const { totalBalance, totalIncome, totalExpense } = useMemo(() => {
    const totalBalance  = records.reduce((s, r) => s + r.amount, 0);
    const totalIncome   = records.filter(r => r.amount > 0).reduce((s, r) => s + r.amount, 0);
    const totalExpense  = records.filter(r => r.amount < 0).reduce((s, r) => s + r.amount, 0);
    return { totalBalance, totalIncome, totalExpense };
  }, [records]);

  const handleAdd = () => {
    if (!date || !category || !amount) { setError("すべての項目を入力してください"); return; }
    const num = Number(amount);
    if (isNaN(num)) { setError("金額は数値で入力してください"); return; }
    setRecords(prev => [
      ...prev,
      { id: String(Date.now()), date, category, amount: num },
    ]);
    setDate(""); setCategory(""); setAmount(""); setError("");
  };

  const handleDelete = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    /* ── オーバーレイ ── */
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* ── モーダル本体 ── */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-teal-500" />
            <h2 className="text-lg font-bold text-gray-800">家計簿</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* スクロール領域 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

          {/* サマリーカード */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-2xl p-3 text-center">
              <p className="text-[10px] text-gray-400 font-medium mb-1">純資産</p>
              <p className={`text-sm font-bold ${totalBalance >= 0 ? "text-gray-800" : "text-red-500"}`}>
                {totalBalance.toLocaleString()}円
              </p>
            </div>
            <div className="bg-teal-50 rounded-2xl p-3 text-center">
              <div className="flex justify-center mb-1">
                <TrendingUp className="w-3 h-3 text-teal-500" />
              </div>
              <p className="text-[10px] text-teal-600 font-medium mb-1">収入</p>
              <p className="text-sm font-bold text-teal-600">
                +{totalIncome.toLocaleString()}円
              </p>
            </div>
            <div className="bg-red-50 rounded-2xl p-3 text-center">
              <div className="flex justify-center mb-1">
                <TrendingDown className="w-3 h-3 text-red-400" />
              </div>
              <p className="text-[10px] text-red-400 font-medium mb-1">支出</p>
              <p className="text-sm font-bold text-red-400">
                {totalExpense.toLocaleString()}円
              </p>
            </div>
          </div>

          {/* 入力フォーム */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500">新しい記録を追加</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="col-span-2 sm:col-span-1 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
              <input
                type="text"
                placeholder="項目（例：食費、給料）"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
              <input
                type="number"
                placeholder="金額（支出はマイナス）"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button
              onClick={handleAdd}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-xl h-9 text-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> 記録する
            </Button>
          </div>

          {/* 履歴リスト */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500">履歴</p>
            {sorted.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">記録がありません</p>
            ) : (
              sorted.map(r => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: r.amount >= 0 ? "#14b8a6" : "#f87171" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{r.category}</p>
                    <p className="text-xs text-gray-400">{r.date}</p>
                  </div>
                  <p className={`text-sm font-bold shrink-0 ${r.amount >= 0 ? "text-teal-500" : "text-red-400"}`}>
                    {r.amount >= 0 ? "+" : ""}{r.amount.toLocaleString()}円
                  </p>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
