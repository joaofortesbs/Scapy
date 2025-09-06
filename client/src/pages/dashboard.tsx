import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User, WeeklyProgress } from "@shared/schema";
import PainelInterface from "@/interface/secao/painel";
import Header from "@/components/header"; // Assuming Header is imported from a components directory

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("painel");

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: weeklyProgress } = useQuery<WeeklyProgress>({
    queryKey: ["/api/weekly-progress"],
  });

  // Assuming onLogout is a function defined elsewhere or passed down
  const onLogout = () => {
    // Implement logout logic here, e.g., clear session, redirect
    console.log("User logged out");
  };

  const handleSectionChange = (section: string) => {
    if (section !== "painel") {
      alert("Esta seção estará disponível em breve!");
      return;
    }
    setActiveSection(section);
  };

  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <PainelInterface
        user={user}
        weeklyProgress={weeklyProgress}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
    </>
  );
}