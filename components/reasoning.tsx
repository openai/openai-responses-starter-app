import { ReasoningItem } from "@/lib/assistant";
import { Brain, CheckCircle, Loader2 } from "lucide-react";
import React from "react";
import ReactMarkdown from "react-markdown";

interface ReasoningProps {
  item: ReasoningItem;
}

const statusIcon = (status: ReasoningItem["status"]) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case "incomplete":
      return <Brain className="h-4 w-4 text-amber-500" />;
    case "in_progress":
    default:
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
  }
};

const statusLabel = (status: ReasoningItem["status"]) => {
  switch (status) {
    case "completed":
      return "Reasoning complete";
    case "incomplete":
      return "Reasoning incomplete";
    case "in_progress":
    default:
      return "Reasoning";
  }
};

const mapValuesToString = (map: Record<number, string>) =>
  Object.keys(map)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => map[Number(key)])
    .filter((text) => text && text.trim().length > 0)
    .join("\n\n");

const Reasoning: React.FC<ReasoningProps> = ({ item }) => {
  const summaryText = mapValuesToString(item.summaries);
  const detailText = mapValuesToString(item.texts);
  const hasSummary = summaryText.length > 0;
  const hasDetails = detailText.length > 0;

  return (
    <div className="flex flex-col text-sm text-stone-700">
      <div className="flex gap-2 items-start">
        <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-stone-100">
          {statusIcon(item.status)}
        </div>
        <div className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-stone-500">
            {statusLabel(item.status)}
          </div>
          <div className="mt-1 whitespace-pre-wrap">
            {hasSummary ? (
              <ReactMarkdown>{summaryText}</ReactMarkdown>
            ) : (
              <span className="text-stone-400">考え中...</span>
            )}
          </div>
          {hasDetails && (
            <div className="mt-3 border-t border-stone-200 pt-3 text-xs text-stone-600">
              <ReactMarkdown>{detailText}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reasoning;
