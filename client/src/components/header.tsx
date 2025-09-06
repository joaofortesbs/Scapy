import { Button } from "@/components/ui/button";
import { User, Target, LogOut } from "lucide-react";

interface HeaderProps {
  user?: {
    fullName: string;
    email: string;
  };
  onLogout?: () => void;
}

export { Header };
export default Header;