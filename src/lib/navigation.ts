import {
  Activity,
  Award,
  CalendarClock,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Rocket,
  Settings,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  description?: string;
};

export const primaryNav: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, description: "Your day at a glance" },
  { title: "Tasks", url: "/tasks", icon: ListTodo, description: "Work tasks & JIRA issues" },
  { title: "Activity", url: "/activity", icon: Activity, description: "GitHub & velocity" },
];

export const growthNav: NavItem[] = [
  { title: "Brag Sheet", url: "/brag", icon: Award, description: "Log your wins" },
  { title: "Promotion", url: "/promotion", icon: TrendingUp, description: "Path to the next level" },
  { title: "Career", url: "/career", icon: Rocket, description: "Development goals" },
  { title: "Feedback", url: "/feedback", icon: MessageSquare, description: "1:1s & feedback" },
  { title: "Vision Board", url: "/vision", icon: Sparkles, description: "Where you're headed" },
  { title: "Timeline", url: "/timeline", icon: CalendarClock, description: "Important dates" },
];

export const settingsNav: NavItem = { title: "Settings", url: "/settings", icon: Settings };

export const allNav: NavItem[] = [...primaryNav, ...growthNav, settingsNav];
