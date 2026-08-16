import {
  ChefHat,
  CloudDrizzle,
  GitGraphIcon,
  LayoutDashboard,
  ListOrderedIcon,
  LucideTable2,
  MenuSquareIcon,
  Settings,
  Home,
} from "lucide-react";
export const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    exact: true,
  },
  {
    to: "/dashboard/orders",
    label: "Orders",
    icon: <ListOrderedIcon size={18} />,
  },
  {
    to: "/dashboard/menu",
    label: "Menu Items",
    icon: <MenuSquareIcon size={18} />,
  },
  {
    to: "/dashboard/collections",
    label: "Collections",
    icon: <CloudDrizzle size={18} />,
  },
  {
    to: "/dashboard/tables",
    label: "Tables",
    icon: <LucideTable2 size={18} />,
  },
  { to: "/dashboard/kitchen", label: "Kitchen", icon: <ChefHat size={18} /> },
  {
    to: "/dashboard/analytics",
    label: "Analytics",
    icon: <GitGraphIcon size={18} />,
  },
];

export const BOTTOM_ITEMS = [
  { to: "/dashboard/setup", label: "Settings", icon: <Settings size={18} /> },
  { to: "/", label: "Back to App", icon: <Home size={18} /> },
];
