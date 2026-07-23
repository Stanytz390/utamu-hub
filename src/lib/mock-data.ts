import profile1 from "@/assets/profile-1.jpg";
import profile2 from "@/assets/profile-2.jpg";
import profile3 from "@/assets/profile-3.jpg";
import profile4 from "@/assets/profile-4.jpg";
import videoThumb1 from "@/assets/video-thumb-1.jpg";
import group1 from "@/assets/group-1.jpg";

export type Category = "all" | "utamu" | "dadaz" | "groups";

export type VideoItem = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price_sq: number; // SQ coins, 0 = free
  duration: string;
  views: string;
  creator: string;
  createdAt: string;
};

export type ProfileItem = {
  id: string;
  username: string;
  avatar: string;
  cover: string;
  location: string;
  status: "free" | "work" | "service";
  bio: string;
  price?: string;
  whatsapp: string;
  phone: string;
  followers: number;
  likes: number;
  photos: string[];
};

export type GroupItem = {
  id: string;
  name: string;
  description: string;
  logo: string;
  members: number;
  category: string;
  link: string;
};

export const videos: VideoItem[] = [
  {
    id: "v1",
    title: "Utamu wa Mchana",
    description: "Video moto ya siku ya leo. Piga download uone.",
    thumbnail: videoThumb1,
    price_sq: 0,
    duration: "0:42",
    views: "12.4K",
    creator: "@utamuking",
    createdAt: "2025-07-01",
  },
  {
    id: "v2",
    title: "Kimasomaso Nights",
    description: "Exclusive premium video — HD quality.",
    thumbnail: profile1,
    price_sq: 10,
    duration: "2:15",
    views: "45.1K",
    creator: "@zawadi",
    createdAt: "2025-07-15",
  },
  {
    id: "v3",
    title: "Dar Vibes",
    description: "Poa na sio ghali. Lipa mara moja tu.",
    thumbnail: profile3,
    price_sq: 5,
    duration: "1:08",
    views: "8.9K",
    creator: "@dartown",
    createdAt: "2025-07-20",
  },
  {
    id: "v4",
    title: "Weekend Special",
    description: "Free video ya wiki. Enjoy!",
    thumbnail: profile2,
    price_sq: 0,
    duration: "0:55",
    views: "22.7K",
    creator: "@weekend",
    createdAt: "2025-07-18",
  },
  {
    id: "v5",
    title: "Mama Mkubwa",
    description: "Content premium yenye viwango vya juu.",
    thumbnail: profile4,
    price_sq: 20,
    duration: "3:30",
    views: "67.3K",
    creator: "@mkubwa",
    createdAt: "2025-07-22",
  },
];

export const profiles: ProfileItem[] = [
  {
    id: "p1",
    username: "Zawadi Neema",
    avatar: profile1,
    cover: profile1,
    location: "Dar es Salaam",
    status: "service",
    bio: "Massage + companionship. Discretion guaranteed.",
    price: "TSh 50,000 / hr",
    whatsapp: "+255700000001",
    phone: "+255700000001",
    followers: 12400,
    likes: 89200,
    photos: [profile1, profile2, profile3, profile4],
  },
  {
    id: "p2",
    username: "Amina Grace",
    avatar: profile2,
    cover: profile2,
    location: "Arusha",
    status: "work",
    bio: "Model & content creator. DM for bookings.",
    price: "TSh 30,000 / session",
    whatsapp: "+255700000002",
    phone: "+255700000002",
    followers: 8700,
    likes: 45100,
    photos: [profile2, profile1, profile4],
  },
  {
    id: "p3",
    username: "Neema Kito",
    avatar: profile3,
    cover: profile3,
    location: "Mwanza",
    status: "free",
    bio: "Just here for the vibes ✨",
    whatsapp: "+255700000003",
    phone: "+255700000003",
    followers: 24100,
    likes: 156000,
    photos: [profile3, profile1, profile2, profile4],
  },
  {
    id: "p4",
    username: "Baraka Joy",
    avatar: profile4,
    cover: profile4,
    location: "Dodoma",
    status: "service",
    bio: "Professional services. Call anytime.",
    price: "TSh 40,000 / hr",
    whatsapp: "+255700000004",
    phone: "+255700000004",
    followers: 5600,
    likes: 21300,
    photos: [profile4, profile3, profile1],
  },
];

export const groups: GroupItem[] = [
  {
    id: "g1",
    name: "UTAMU PORI VIP",
    description: "Group ya premium content — daily uploads. Members only.",
    logo: group1,
    members: 2400,
    category: "Premium",
    link: "https://chat.whatsapp.com/example1",
  },
  {
    id: "g2",
    name: "Dar Nightlife 254",
    description: "Vibes zote za Dar. Events, meetups na zaidi.",
    logo: group1,
    members: 1800,
    category: "Events",
    link: "https://chat.whatsapp.com/example2",
  },
  {
    id: "g3",
    name: "Kimasomaso Free",
    description: "Free content daily. Join sasa!",
    logo: group1,
    members: 5600,
    category: "Free",
    link: "https://chat.whatsapp.com/example3",
  },
  {
    id: "g4",
    name: "Bongo Business Hub",
    description: "Network ya wafanyabiashara. Post huduma zako.",
    logo: group1,
    members: 3200,
    category: "Business",
    link: "https://chat.whatsapp.com/example4",
  },
];