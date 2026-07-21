import {
  Activity,
  Award,
  CalendarClock,
  Inbox,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Network,
  Rocket,
  Settings,
  Tags,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  description?: string;
};

export const primaryNav: NavItem[] = [
  { title: "Home", url: "/", icon: LayoutDashboard, description: "Overview & daily journal" },
  { title: "Inbox", url: "/inbox", icon: Inbox, description: "Quick captures to organize" },
  { title: "Tasks", url: "/tasks", icon: ListTodo, description: "Work tasks & JIRA issues" },
  { title: "Activity", url: "/activity", icon: Activity, description: "GitHub & velocity" },
];

export const growthNav: NavItem[] = [
  { title: "Brag Sheet", url: "/brag", icon: Award, description: "Log your wins" },
  { title: "Growth", url: "/growth", icon: Rocket, description: "Goals & promotion path" },
  { title: "Feedback", url: "/feedback", icon: MessageSquare, description: "1:1s & feedback" },
  { title: "Timeline", url: "/timeline", icon: CalendarClock, description: "Important dates" },
  { title: "Tags", url: "/tags", icon: Tags, description: "Browse by theme" },
  { title: "Graph", url: "/graph", icon: Network, description: "How everything connects" },
];

export const settingsNav: NavItem = { title: "Settings", url: "/settings", icon: Settings };

export const allNav: NavItem[] = [...primaryNav, ...growthNav, settingsNav];
