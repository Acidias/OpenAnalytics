"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface DateRangePickerProps {
  value?: string;
  onChange?: (value: string) => void;
}

export function DateRangePicker({ value = "7d", onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[160px]">
          <Calendar className="mr-2 h-4 w-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="24h">Last 24 hours</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
          <SelectItem value="12m">Last 12 months</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
