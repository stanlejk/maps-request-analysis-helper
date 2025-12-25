import LogAnalyzer from "@/components/LogAnalyzer";

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">API Log Analyzer</h1>
        <p className="text-gray-400">
          Paste your iOS console logs to extract and analyze API endpoints.
          Results are automatically saved and can be viewed in History.
        </p>
      </div>
      <LogAnalyzer />
    </div>
  );
}
