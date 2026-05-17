"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SalesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [paymentStatus, setPaymentStatus] = useState(
    searchParams.get("paymentStatus") || "all",
  );
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (category.trim()) params.set("category", category.trim());
    if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    router.push(`/sales${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function handleReset() {
    setSearch("");
    setCategory("");
    setPaymentStatus("all");
    setStartDate("");
    setEndDate("");
    router.push("/sales");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-6"
    >
      <Input
        placeholder="Search item, customer, notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <Select value={paymentStatus} onValueChange={setPaymentStatus}>
        <SelectTrigger>
          <SelectValue placeholder="Payment status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="partial">Partial</SelectItem>
          <SelectItem value="unpaid">Unpaid</SelectItem>
        </SelectContent>
      </Select>

      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Apply
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </form>
  );
}
