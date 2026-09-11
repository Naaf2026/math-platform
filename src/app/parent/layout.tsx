import ParentLearningAlerts from "@/components/parent-learning-alerts";
import ParentIntelligenceDashboard from "@/components/parent-intelligence-dashboard";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto max-w-6xl px-5 pt-5 sm:px-8">
        <ParentLearningAlerts />
      </div>
      <ParentIntelligenceDashboard />
      {children}
    </>
  );
}
