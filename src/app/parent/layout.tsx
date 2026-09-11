import ParentLearningAlerts from "@/components/parent-learning-alerts";
import ParentIntelligenceDashboard from "@/components/parent-intelligence-dashboard";
import ParentIntelligenceActionCenter from "@/components/parent-intelligence-action-center";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div className="mx-auto max-w-6xl px-5 pt-5 sm:px-8">
        <ParentLearningAlerts />
      </div>
      <ParentIntelligenceDashboard />
      <ParentIntelligenceActionCenter />
    </>
  );
}
