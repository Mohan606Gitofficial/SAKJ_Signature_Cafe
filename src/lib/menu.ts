export type MenuCategory = "Coffee" | "Tea & more" | "From the oven";

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
    name: "Signature Filter",
    description: "Slow-brewed, full-bodied and finished with a little jaggery.",
    price: 140,
    category: "Coffee",
    image_url:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=85",
    available: true,
  },
  {
    id: "velvet-cappuccino",
    name: "Velvet Cappuccino",
    description: "A double shot under a cloud of silky, steamed milk.",
    price: 180,
    category: "Coffee",
    image_url:
      "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=900&q=85",
    available: true,
  },
  {
    id: "iced-caramel",
    name: "Iced Caramel Latte",
    description: "Espresso, chilled milk and our house-made caramel.",
    price: 210,
    category: "Coffee",
    image_url:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=85",
    available: true,
  },
  {
    id: "rose-chai",
    name: "Rose Chai",
    description: "Warming spiced tea with a gentle rose and cardamom finish.",
    price: 150,
    category: "Tea & more",
    image_url:
      "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=900&q=85",
    available: true,
  },
  {
    id: "pistachio-croissant",
    name: "Pistachio Croissant",
    description: "Flaky, golden layers filled with roasted pistachio cream.",
    price: 190,
    category: "From the oven",
    image_url:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=85",
    available: true,
  },
  {
    id: "dark-chocolate-cookie",
    name: "Dark Chocolate Cookie",
    description: "Crisp edges, a soft centre and generous chocolate chunks.",
    price: 110,
    category: "From the oven",
    image_url:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=85",
    available: true,
  },
];

export const menuCategories: Array<"All" | MenuCategory> = [
  "All",
  "Coffee",
  "Tea & more",
  "From the oven",
];
