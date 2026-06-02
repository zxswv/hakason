// app/components/CompanyList.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  MapPin,
  JapaneseYen,
  Briefcase,
  FileText,
  Search,
  Clock,
  Star,
} from "lucide-react";

// CompaniesテーブルとSelectionsテーブルを結合した想定の型定義
export interface CompanySelection {
  company_id: number;
  company_name: string;
  description: string;
  job_categories: string;
  benefits: string;
  starting_salary: number;
  locations: string;
  selection_flow: string;
  memo: string;
  // Selectionsテーブル由来のデータ
  status:
    | "検討中"
    | "応募済"
    | "書類選考中"
    | "1次面接"
    | "最終面接"
    | "内定"
    | "お見送り";
  priority: number; // 1〜5
  next_deadline?: string;
}

const sampleData: CompanySelection[] = [
  {
    company_id: 1,
    company_name: "株式会社テクノロジー",
    description:
      "最先端の技術を活用したWebアプリケーションやシステム開発を行っています。",
    job_categories: "フロントエンドエンジニア",
    benefits: "完全週休2日制, リモートワーク可",
    starting_salary: 250000,
    locations: "東京都渋谷区",
    selection_flow: "書類選考 -> 1次面接 -> 最終面接",
    memo: "モダンな技術スタック。",
    status: "1次面接",
    priority: 5,
    next_deadline: "2026-06-15 13:00",
  },
  {
    company_id: 2,
    company_name: "グローバルシステムズ",
    description:
      "大規模な業務システム開発からインフラ構築まで幅広く手掛けるSIer。",
    job_categories: "システムエンジニア",
    benefits: "住宅手当, 資格取得報奨金",
    starting_salary: 235000,
    locations: "大阪府大阪市",
    selection_flow: "説明会 -> 適性検査 -> 面接(2回)",
    memo: "研修制度が充実。",
    status: "応募済",
    priority: 3,
    next_deadline: "2026-06-10 23:59",
  },
  {
    company_id: 3,
    company_name: "フューチャーデザイン",
    description: "UI/UXデザインに特化したクリエイティブエージェンシー。",
    job_categories: "UIデザイナー, Webエンジニア",
    benefits: "フレックスタイム制",
    starting_salary: 260000,
    locations: "東京都港区",
    selection_flow: "ポートフォリオ提出 -> 面接(3回)",
    memo: "デザインドリブンな開発環境。",
    status: "検討中",
    priority: 4,
  },
];

// ステータスに応じたバッジの色分け関数
const getStatusColor = (status: string) => {
  switch (status) {
    case "検討中":
      return "bg-gray-500";
    case "応募済":
      return "bg-blue-500";
    case "書類選考中":
      return "bg-yellow-500";
    case "1次面接":
    case "最終面接":
      return "bg-orange-500";
    case "内定":
      return "bg-green-500";
    default:
      return "bg-gray-300";
  }
};

export default function CompanyList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // フィルタリング処理（依存配列の値が変わるたびに再計算）
  const filteredCompanies = useMemo(() => {
    return sampleData.filter((company) => {
      // 1. 検索キーワードの判定（企業名または概要）
      const matchesSearch =
        company.company_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        company.description.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. ステータスの判定
      const matchesStatus =
        statusFilter === "all" || company.status === statusFilter;

      // 3. 優先度の判定
      const matchesPriority =
        priorityFilter === "all" ||
        company.priority.toString() === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [searchQuery, statusFilter, priorityFilter]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">選考管理ボード</h1>
      </div>

      {/* コントロールバー（検索＆フィルター） */}
      <div className="flex flex-col sm:flex-row gap-4 bg-muted/30 p-4 rounded-lg border">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="企業名やキーワードで検索..."
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="検討中">検討中</SelectItem>
              <SelectItem value="応募済">応募済</SelectItem>
              <SelectItem value="書類選考中">書類選考中</SelectItem>
              <SelectItem value="1次面接">1次面接</SelectItem>
              <SelectItem value="最終面接">最終面接</SelectItem>
              <SelectItem value="内定">内定</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[120px] bg-background">
              <SelectValue placeholder="優先度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="5">⭐️ 5</SelectItem>
              <SelectItem value="4">⭐️ 4</SelectItem>
              <SelectItem value="3">⭐️ 3</SelectItem>
              <SelectItem value="2">⭐️ 2</SelectItem>
              <SelectItem value="1">⭐️ 1</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 企業リストグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map((company) => (
            <Card
              key={company.company_id}
              className="flex flex-col hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 w-full h-1 ${getStatusColor(company.status)}`}
              />
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    className={`${getStatusColor(company.status)} hover:${getStatusColor(company.status)}`}
                  >
                    {company.status}
                  </Badge>
                  <div className="flex items-center text-amber-500 text-sm font-bold">
                    <Star className="w-4 h-4 fill-current mr-1" />
                    {company.priority}
                  </div>
                </div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Building2 className="w-5 h-5 text-primary" />
                  {company.company_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow">
                {company.next_deadline && (
                  <div className="flex items-center gap-2 text-sm font-medium text-destructive bg-destructive/10 p-2 rounded-md">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      次期締切:{" "}
                      {new Date(company.next_deadline).toLocaleDateString(
                        "ja-JP",
                      )}
                    </span>
                  </div>
                )}
                <CardDescription className="line-clamp-2">
                  {company.description}
                </CardDescription>

                <div className="space-y-2 pt-2">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Briefcase className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{company.job_categories}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{company.locations}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 p-4 mt-auto border-t">
                <div className="w-full text-sm">
                  <span className="font-semibold block mb-1">
                    現在の選考フロー:
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {company.selection_flow}
                  </span>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            条件に一致する企業が見つかりませんでした。
          </div>
        )}
      </div>
    </div>
  );
}
