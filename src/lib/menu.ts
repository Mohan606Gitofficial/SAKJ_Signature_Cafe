export type MenuCategory = "Coffee" | "Tea & more";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image_url: string;
  available: boolean;
}

export const starterMenu: MenuItem[] = [
  {
    id: "signature-filter",
    name: "Normal Tea",
    description: "Simple, comforting and perfect anytime.",
    price: 20,
    category: "Tea & more",
    image_url: "/menu/products/normal-tea.png",
    available: true,
  },
  {
    id: "velvet-cappuccino",
    name: "Masala Tea",
    description: "Classic Indian masala chai made with finest spices.",
    price: 30,
    category: "Tea & more",
    image_url: "/menu/products/masala-tea.png",
    available: true,
  },
  {
    id: "iced-caramel",
    name: "Ginger Tea",
    description: "Aromatic and soothing tea made with fresh ginger.",
    price: 30,
    category: "Tea & more",
    image_url: "/menu/products/ginger-tea.png",
    available: true,
  },
  {
    id: "rose-chai",
    name: "Lemon Tea",
    description: "Refreshing tea with a tangy lemon twist.",
    price: 30,
    category: "Tea & more",
    image_url: "/menu/products/lemon-tea.png",
    available: true,
  },
  {
    id: "pistachio-croissant",
    name: "Green Tea",
    description: "Light, healthy and refreshing green tea.",
    price: 30,
    category: "Tea & more",
    image_url: "/menu/products/green-tea.png",
    available: true,
  },
  {
    id: "dark-chocolate-cookie",
    name: "Kashmiri Kahwa",
    description: "Traditional Kahwa with saffron, almonds and aromatic spices.",
    price: 30,
    category: "Tea & more",
    image_url: "/menu/products/kashmiri-kahwa.png",
    available: true,
  },
  {
    id: "purple-tea-sangu-poo",
    name: "Purple Tea (Sangu Poo)",
    description: "Delightful and refreshing tea made from Sangu Poo.",
    price: 30,
    category: "Tea & more",
    image_url: "/menu/products/purple-tea-sangu-poo.png",
    available: true,
  },
  {
    id: "coffee",
    name: "Coffee",
    description: "Rich, aromatic coffee to uplift your mood.",
    price: 30,
    category: "Coffee",
    image_url: "/menu/products/coffee.png",
    available: true,
  },
];

export const menuCategories: Array<"All" | MenuCategory> = [
  "All",
  "Tea & more",
  "Coffee",
];
