import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import { ClerkProvider, Show, SignIn, SignUp, useAuth, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Bike,
  CalendarRange,
  Check,
  CheckCheck,
  ChevronDown,
  Clock3,
  DollarSign,
  Filter,
  Home,
  ImagePlus,
  MapPin,
  Menu,
  Package,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
  Trash2,
  Truck,
  UserCircle,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  getGetDashboardSummaryQueryKey,
  getGetOrderQueryKey,
  getGetReportsOverviewQueryKey,
  getListOrdersQueryKey,
  getListNotificationsQueryKey,
  getListProductsQueryKey,
  getListRidersQueryKey,
  useCreateOrder,
  useCreateProduct,
  useDeleteProduct,
  useGetDashboardSummary,
  useGetOrder,
  useGetReportsOverview,
  useListNotifications,
  useListOrders,
  useListProducts,
  useListRiders,
  useUpdateOrderStatus,
  useUpdateProduct,
} from '@workspace/api-client-react';
import type { Order, OrderItem, Product, ProductInput, Rider } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const brandLogo = `${basePath}/bh-african-market-logo.jpg`;
const configuredClerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkPubKey = configuredClerkPubKey ? publishableKeyFromHost(window.location.hostname, configuredClerkPubKey) : undefined;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

type Role = 'customer' | 'admin' | 'rider';
type DemoRole = Role | null;
type CartLine = { product: Product; quantity: number };
type RiderWrite = Pick<Rider, 'name' | 'type' | 'phone'> & Partial<Pick<Rider, 'status'>>;
type Category = { id: number; name: string };

const DEFAULT_CATEGORIES = ['Pantry', 'Snacks', 'Spices', 'Drinks', 'Meal kits', 'Frozen foods', 'Fresh produce'];
const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1515003197242-cdcd46e23f25?auto=format&fit=crop&w=900&q=85',
];

function imageUrlForDisplay(imageUrl: string) {
  return imageUrl.startsWith('/objects/') ? `/api/storage${imageUrl}` : imageUrl;
}

function foodImageForProduct(product: Pick<Product, 'id' | 'name' | 'category'>) {
  const text = `${product.name} ${product.category}`.toLowerCase();
  if (text.includes('spice') || text.includes('pepper')) return FOOD_IMAGES[1];
  if (text.includes('rice') || text.includes('jollof')) return FOOD_IMAGES[2];
  if (text.includes('chip') || text.includes('snack')) return FOOD_IMAGES[0];
  return FOOD_IMAGES[product.id % FOOD_IMAGES.length];
}

function demoRequestHeaders() {
  if (typeof window === 'undefined') return {} as Record<string, string>;
  const role = window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY);
  return role ? { 'x-demo-role': role === 'admin' ? 'super_admin' : role } : {} as Record<string, string>;
}

async function riderRequest<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(demoRequestHeaders());
  if (init.body) headers.set('Content-Type', 'application/json');
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  const response = await fetch(path, {
    ...init,
    headers,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || `Request failed (${response.status})`);
  }
  return response.status === 204 ? undefined as T : await response.json() as T;
}

type DemoAuthContextValue = {
  role: DemoRole;
  setRole: (role: DemoRole) => void;
};

const DemoAuthContext = createContext<DemoAuthContextValue | null>(null);
const DEMO_ROLE_STORAGE_KEY = 'afrocart-demo-role';

const DEMO_PRODUCTS: Product[] = [
  { id: 1, name: 'Shito Pepper Sauce', description: 'Smoky, bright and slow-cooked in Accra style.', price: 8.5, category: 'Pantry', origin: 'Ghana', imageUrl: '', inStock: true, featured: true },
  { id: 2, name: 'Golden Plantain Chips', description: 'Thin-sliced ripe plantain, fried crisp and lightly salted.', price: 6.75, category: 'Snacks', origin: 'Ghana', imageUrl: '', inStock: true, featured: true },
  { id: 3, name: 'Suya Spice Blend', description: 'The warm peanut, ginger and cayenne blend for proper suya nights.', price: 7.25, category: 'Spices', origin: 'Nigeria', imageUrl: '', inStock: true, featured: false },
  { id: 4, name: 'Jollof Rice Kit', description: 'Parboiled rice, pepper base and the pantry notes for a deep pot.', price: 14, category: 'Meal kits', origin: 'West Africa', imageUrl: '', inStock: true, featured: true },
  { id: 5, name: 'Kelewele Marinade', description: 'Ginger, clove and warm pepper for caramelized plantain.', price: 9.5, category: 'Pantry', origin: 'Ghana', imageUrl: '', inStock: false, featured: false },
  { id: 6, name: 'Moin Moin Mix', description: 'Bean pudding base made for soft, savory Sunday mornings.', price: 11.25, category: 'Meal kits', origin: 'Nigeria', imageUrl: '', inStock: true, featured: false },
];

const DEMO_ORDER: Order = {
  id: 1048,
  customerName: 'Amara Mensah',
  customerAddress: '118 Oak Street, Newark, NJ',
  items: [
    { productId: 1, name: 'Shito Pepper Sauce', quantity: 2, price: 8.5 },
    { productId: 4, name: 'Jollof Rice Kit', quantity: 1, price: 14 },
  ],
  subtotal: 31,
  deliveryFee: 4.5,
  total: 35.5,
  status: 'in_transit',
  riderName: 'Kwame Boateng',
  riderType: 'company',
  createdAt: '2025-02-18T14:30:00.000Z',
  eta: 'Today, 6:40 PM',
  events: [
    { label: 'Order received', description: 'The market has your order.', timestamp: '2:30 PM', completed: true },
    { label: 'Being packed', description: 'Your staples are being gathered fresh.', timestamp: '2:46 PM', completed: true },
    { label: 'Picked up', description: 'Kwame collected your bag from the market.', timestamp: '3:18 PM', completed: true },
    { label: 'On the way', description: 'Your rider is headed to your neighborhood.', timestamp: '3:24 PM', completed: true },
    { label: 'At your door', description: 'The final hello is almost here.', timestamp: '6:40 PM', completed: false },
  ],
};

const DEMO_RIDERS: Rider[] = [
  { id: 1, name: 'Kwame Boateng', type: 'company', status: 'delivering', phone: '(973) 555-0148', activeOrders: 3 },
  { id: 2, name: 'Nana Owusu', type: 'company', status: 'available', phone: '(862) 555-0119', activeOrders: 0 },
  { id: 3, name: 'CitySprint Partners', type: 'partner', status: 'available', phone: '(201) 555-0184', activeOrders: 1 },
];

const STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  delivered: 'Delivered',
};

const STATUS_STEPS = ['received', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered'];

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function initials(value: string) {
  return value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function roleFromPath(path: string): Role {
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/rider')) return 'rider';
  return 'customer';
}

function useAfroAuth() {
  const demo = useContext(DemoAuthContext);
  if (demo) return { isLoaded: true, isSignedIn: Boolean(demo.role) };
  return useAuth();
}

function useAfroUser() {
  const demo = useContext(DemoAuthContext);
  if (demo) {
    const names: Record<Exclude<DemoRole, null>, { fullName: string; firstName: string; email: string; role: Role }> = {
      customer: { fullName: 'Amara Mensah', firstName: 'Amara', email: 'customer@afrocart.demo', role: 'customer' },
      admin: { fullName: 'Amara Mensah', firstName: 'Amara', email: 'admin@afrocart.demo', role: 'admin' },
      rider: { fullName: 'Kwame Boateng', firstName: 'Kwame', email: 'rider@afrocart.demo', role: 'rider' },
    };
    const profile = demo.role ? names[demo.role] : undefined;
    return {
      user: profile
        ? { fullName: profile.fullName, firstName: profile.firstName, primaryEmailAddress: { emailAddress: profile.email }, publicMetadata: { role: profile.role === 'admin' ? 'super_admin' : profile.role } }
        : null,
    };
  }
  return useUser();
}

function useAfroClerk() {
  const demo = useContext(DemoAuthContext);
  if (demo) {
    return { signOut: async (_options?: { redirectUrl?: string }) => demo.setRole(null) };
  }
  return useClerk();
}

function AuthButtons() {
  const demo = useContext(DemoAuthContext);
  if (demo) {
    return <Link href="/demo-access" className="rounded-xl bg-[#071a4d] px-3 py-2 text-xs font-extrabold text-[#f8da82]" data-testid="link-demo-access">Preview access</Link>;
  }
  return (
    <div className="flex items-center gap-2">
      <Link href="/sign-in" className="rounded-xl px-3 py-2 text-xs font-extrabold text-[#704d2e] hover:bg-[#f3e5c8]" data-testid="link-sign-in">Sign in</Link>
      <Link href="/sign-up" className="rounded-xl bg-[#071a4d] px-3 py-2 text-xs font-extrabold text-[#f8da82]" data-testid="link-sign-up">Create account</Link>
    </div>
  );
}

function AuthLoading() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#fbf7ee] text-sm font-bold text-[#765638]">Loading your market account…</div>;
}

function ProductVisual({ product, compact = false }: { product: Product; compact?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const palette = ['from-[#633c23] to-[#b3762e]', 'from-[#d99c28] to-[#f0c95a]', 'from-[#8b4d35] to-[#d49a62]', 'from-[#3f644d] to-[#a6b95c]'];
  const color = palette[product.id % palette.length];
  const imageSrc = imageUrlForDisplay(product.imageUrl) || foodImageForProduct(product);
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${color} ${compact ? 'h-20 w-20 rounded-xl' : 'h-52 rounded-t-[1.15rem]'}`}>
      {imageSrc && !imageFailed ? (
        <img src={imageSrc} alt={product.name} onError={() => setImageFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <>
          <div className="absolute -right-7 -top-10 h-36 w-36 rounded-full border-[18px] border-white/15" />
          <div className="absolute -bottom-14 -left-8 h-40 w-40 rounded-full border-[22px] border-black/10" />
          <span className={`absolute ${compact ? 'bottom-2 left-2 text-lg' : 'bottom-4 left-5 text-5xl'} font-serif text-white/90`}>{initials(product.name)}</span>
        </>
      )}
      {product.featured && !compact && <span className="absolute left-4 top-4 rounded-full bg-[#f2c653] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#4a2d1b]">Market favorite</span>}
    </div>
  );
}

function SkeletonRows({ count = 4 }: { count?: number }) {
  return <div className="space-y-3">{Array.from({ length: count }).map((_, index) => <div key={index} className="skeleton h-16 rounded-2xl" />)}</div>;
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-[#d8c7ad] bg-[#fbf5e9] px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0dca4] text-[#684020]"><PackageOpenIcon /></div>
      <h3 className="font-serif text-2xl text-[#4f301d]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#876b4f]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function PackageOpenIcon() {
  return <PackageCheck size={24} strokeWidth={1.7} />;
}

function Header({ role }: { role: Role }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { isSignedIn } = useAfroAuth();
  const { user } = useAfroUser();
  const { signOut } = useAfroClerk();
  const queryClient = useQueryClient();
  const notifications = useListNotifications({
    query: {
      queryKey: [...getListNotificationsQueryKey(), role],
      enabled: isSignedIn,
      retry: false,
      refetchInterval: 15000,
    },
  });
  useEffect(() => {
    if (isSignedIn) void queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
  }, [isSignedIn, role, queryClient]);
  const unread = (notifications.data ?? []).filter((notification) => !notification.read).length;
  const customerNav = [
    { href: '/', label: 'Shop the market', icon: Store },
    { href: '/orders', label: 'My orders', icon: Package },
    { href: '/profile', label: 'My profile', icon: UserCircle },
  ];
  const adminNav = [
    { href: '/admin', label: 'Operations overview', icon: Home },
    { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { href: '/admin/products', label: 'Catalog', icon: Tag },
    { href: '/admin/riders', label: 'Riders', icon: Bike },
    { href: '/admin/orders', label: 'Order queue', icon: Truck },
  ];
  const riderNav = [{ href: '/rider', label: 'Delivery queue', icon: Bike }];
  const nav = role === 'admin' ? adminNav : role === 'rider' ? riderNav : customerNav;
  const displayName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'BH African Market customer';
  const displayRole = role === 'admin' ? 'Super admin' : role === 'rider' ? 'Rider view' : 'Customer account';
  return (
    <header className="sticky top-0 z-40 border-b border-[#dfceb4] bg-[#fbf7ee]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-5 px-5 md:px-9">
        <button className="mr-1 rounded-lg p-2 text-[#6d4a2b] md:hidden" onClick={() => setMobileOpen((open) => !open)} data-testid="button-open-navigation"><Menu size={22} /></button>
         <Link href="/" className="group flex items-center gap-3" data-testid="link-afrocart-home">
           <img src={brandLogo} alt="BH African Market logo" className="h-14 w-14 rounded-full border-2 border-[#e6b83f] object-cover shadow-[3px_3px_0_#d62525] md:h-16 md:w-16" />
          <div className="hidden sm:block"><div className="font-serif text-[22px] leading-none tracking-tight text-[#111318]">BH African Market</div><div className="mt-1 text-[9px] font-extrabold uppercase tracking-[.18em] text-[#d62525]">Authentic African products · Quality · Community</div></div>
        </Link>
        <nav className="ml-7 hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return <Link key={item.href} href={item.href} className={`nav-link flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${active ? 'bg-[#f0ddb0] text-[#57331d]' : 'text-[#846a4e] hover:bg-[#f5ead5] hover:text-[#57331d]'}`} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={16} /><span>{item.label}</span></Link>;
          })}
        </nav>
         <div className="ml-auto flex items-center gap-2">
           {!isSignedIn ? <AuthButtons /> : null}
           <div className="relative">
            <button onClick={() => setNotificationsOpen((open) => !open)} aria-expanded={notificationsOpen} className="relative rounded-xl p-2.5 text-[#745132] transition hover:bg-[#f2e3c7]" data-testid="button-notifications"><Bell size={19} />{unread > 0 && <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#b64c32] px-1 text-[9px] font-extrabold text-white" data-testid="status-notification-count">{unread}</span>}</button>
            {notificationsOpen && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#dfceb4] bg-[#fffaf1] shadow-2xl" data-testid="panel-notifications">
              <div className="flex items-center justify-between border-b border-[#eadcc7] px-4 py-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#d62525]">BH African Market updates</p><h2 className="font-serif text-xl text-[#111318]">Notifications</h2></div><Bell size={17} className="text-[#c28b00]" /></div>
               <div className="max-h-80 overflow-y-auto">{notifications.isLoading ? <p className="px-4 py-5 text-sm text-[#8c6d50]">Checking for updates…</p> : notifications.isError ? <p className="px-4 py-5 text-sm text-[#a35e49]">Notifications are temporarily unavailable.</p> : (notifications.data ?? []).length === 0 ? <p className="px-4 py-5 text-sm text-[#8c6d50]">No updates yet.</p> : (notifications.data ?? []).map((notification) => <button key={notification.id} onClick={() => { void riderRequest(`/api/notifications/${notification.id}/read`, { method: 'PATCH' }).then(() => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() })); }} className={`block w-full border-b border-[#f0e5d3] px-4 py-3 text-left last:border-0 ${notification.read ? '' : 'bg-[#fff7df] hover:bg-[#fff0c5]'}`} data-testid={`notification-${notification.id}`}><div className="flex items-start justify-between gap-3"><p className="text-sm font-extrabold text-[#5e3a22]">{notification.title}</p><span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#a17c55]">{notification.read ? 'Read' : notification.time}</span></div><p className="mt-1 text-xs leading-5 text-[#806348]">{notification.message}</p>{!notification.read && <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#b27e35]"><CheckCheck size={12} /> Mark read</span>}</button>)}</div>
            </div>}
          </div>
            {isSignedIn && <div className="hidden items-center gap-2 border-l border-[#dfceb4] pl-3 sm:flex"><Link href="/profile" className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-[#f3e5c8]" data-testid="link-profile"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5bd68] text-xs font-extrabold text-[#5a351f]">{initials(displayName)}</div><div><p className="max-w-32 truncate text-xs font-extrabold text-[#55321e]">{displayName}</p><p className="text-[10px] text-[#9a7e5d]">{displayRole}</p></div></Link><button onClick={() => void signOut({ redirectUrl: basePath || '/' })} className="rounded-lg p-1 text-[#987957] hover:bg-[#f3e5c8]" title="Sign out" data-testid="button-sign-out"><ChevronDown size={14} /></button></div>}
        </div>
      </div>
        {mobileOpen && <div className="border-t border-[#dfceb4] bg-[#fffaf1] px-5 py-3 md:hidden">{isSignedIn ? <><Link href="/profile" onClick={() => setMobileOpen(false)} className="mb-3 flex items-center gap-3 rounded-xl bg-[#f3e5c8] px-3 py-2" data-testid="mobile-link-profile"><UserCircle size={18} /><span><p className="text-xs font-extrabold text-[#5b381f]">{displayName}</p><p className="text-[10px] text-[#927357]">{displayRole}</p></span></Link>{nav.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 border-t border-[#eadcc7] py-3 text-sm font-bold text-[#684a2d]" data-testid={`mobile-link-${item.label.toLowerCase().replaceAll(' ', '-')}`}><item.icon size={16} />{item.label}</Link>)}<button onClick={() => void signOut({ redirectUrl: basePath || '/' })} className="w-full border-t border-[#eadcc7] py-3 text-left text-sm font-bold text-[#8d5036]" data-testid="mobile-button-sign-out">Sign out</button></> : <AuthButtons />}</div>}
    </header>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <div className="grain app-shell"><Header role={roleFromPath(location)} />{children}</div>;
}

function FoodMarquee({ products }: { products: Product[] }) {
  const tiles = products.filter((product) => product.inStock);
  if (!tiles.length) return null;
  const repeated = [...tiles, ...tiles];
  return (
    <section className="food-marquee mt-6 overflow-hidden rounded-[1.35rem] border border-[#d9c39a] bg-[#f4e5bd] py-3 md:mt-8" aria-label="Food from the market">
      <div className="mb-2 flex items-center justify-between px-4 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#7a5728] md:px-6">
        <span>Fresh from the shelves</span>
        <span className="hidden sm:inline">Scroll the market</span>
      </div>
      <div className="food-marquee-track flex w-max gap-3 px-3">
        {repeated.map((product, index) => (
          <div key={`${product.id}-${index}`} className="flex w-52 items-center gap-3 rounded-xl border border-[#e0cfa6] bg-[#fffaf1]/90 p-2.5 shadow-sm">
            <img src={foodImageForProduct(product)} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold text-[#5e3a22]">{product.name}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#a9793d]">{product.origin}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Storefront() {
  const productsQuery = useListProducts(undefined, { query: { queryKey: getListProductsQueryKey(), retry: false } });
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAfroAuth();
  const { user } = useAfroUser();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('118 Oak Street, Newark, NJ');
  const [notice, setNotice] = useState('');
  const [, setLocation] = useLocation();
  const products = productsQuery.data ?? DEMO_PRODUCTS;
  const categories = ['All', ...Array.from(new Set(products.map((product) => product.category)))];
  const visibleProducts = products.filter((product) => (category === 'All' || product.category === category) && `${product.name} ${product.description} ${product.origin}`.toLowerCase().includes(search.toLowerCase()));
  const featured = products.filter((product) => product.featured);
  const liveProductsUnavailable = productsQuery.isError && !productsQuery.data;
  const cartTotal = cart.reduce((total, line) => total + line.product.price * line.quantity, 0);
  const addToCart = (product: Product) => {
    if (!product.inStock) return;
    setCart((current) => current.some((line) => line.product.id === product.id) ? current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { product, quantity: 1 }]);
    setNotice(`${product.name} added to your bag`);
    window.setTimeout(() => setNotice(''), 2200);
  };
  const updateQuantity = (id: number, delta: number) => setCart((current) => current.map((line) => line.product.id === id ? { ...line, quantity: line.quantity + delta } : line).filter((line) => line.quantity > 0));
  const placeOrder = () => {
    const items: OrderItem[] = cart.map((line) => ({ productId: line.product.id, name: line.product.name, quantity: line.quantity, price: line.product.price }));
    if (!items.length) return;
    if (!isSignedIn) {
      setNotice('Create an account or sign in to place your order.');
      setLocation('/sign-up');
      return;
    }
    if (!checkoutName.trim() || !checkoutAddress.trim()) {
      setNotice('Add your name and delivery address first.');
      return;
    }
    createOrder.mutate({ data: { customerName: checkoutName.trim(), customerAddress: checkoutAddress.trim(), items, riderType: 'company' } }, {
      onSuccess: (order) => { queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }); queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() }); setCart([]); setCheckoutOpen(false); setCartOpen(false); setLocation(`/orders/${order.id}`); },
      onError: (error) => setNotice(error instanceof Error ? error.message : 'We could not place that order. Your bag is safe — try again.')
    });
  };
  return (
    <main className="mx-auto max-w-[1440px] px-5 pb-16 md:px-9">
      <section className="relative mt-6 overflow-hidden rounded-[1.7rem] bg-[#603921] px-6 py-10 text-[#fff7e8] md:mt-8 md:px-12 md:py-16">
        <div className="absolute -right-16 -top-32 h-96 w-96 rounded-full border-[56px] border-[#dcae43]/25" /><div className="absolute -bottom-40 right-28 h-72 w-72 rounded-full border-[34px] border-[#e5c66a]/20" />
         <div className="relative max-w-xl animate-rise"><p className="mb-4 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.24em] text-[#f3cc65]"><span className="h-2 w-2 rounded-full bg-[#f3cc65] pulse-dot" />The neighborhood market, now at your door</p><h1 className="font-serif text-5xl leading-[.98] tracking-[-.025em] md:text-7xl">The flavors that make a place feel like home.</h1><p className="mt-6 max-w-md text-sm leading-7 text-[#ebd9b8] md:text-base">Ghanaian pantry staples, West African meal kits and the little things you miss — picked with care and delivered around your corner.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#market" className="button-lift inline-flex items-center gap-2 rounded-xl bg-[#f2c653] px-5 py-3 text-sm font-extrabold text-[#55321e]" data-testid="link-browse-market">Browse the market <ArrowRight size={16} /></a><Link href="/orders" className="inline-flex items-center gap-2 rounded-xl border border-[#d8b36b]/50 px-5 py-3 text-sm font-bold text-[#fff3d1] hover:bg-white/10" data-testid="link-track-orders">Track an order <MapPin size={15} /></Link>{!isSignedIn && <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl border border-[#f3cc65]/50 px-5 py-3 text-sm font-bold text-[#f3cc65] hover:bg-white/10" data-testid="link-hero-create-account">Create your account</Link>}</div>{isSignedIn && <p className="mt-4 text-xs font-bold text-[#e7d4ad]">Welcome back, {user?.firstName || 'neighbor'}.</p>}</div>
        <div className="absolute bottom-8 right-8 hidden w-64 rotate-[-5deg] rounded-2xl border border-[#f4d884]/30 bg-[#f3d170] p-4 text-[#57331d] shadow-2xl md:block"><div className="mb-4 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest"><span>Market note</span><span>01 / 04</span></div><p className="font-serif text-2xl leading-tight">“Good food is a family story you can share.”</p><div className="mt-5 border-t border-[#8f612b]/25 pt-3 text-[10px] font-bold text-[#855d30]">This week in Newark</div></div>
      </section>
       <FoodMarquee products={products} />
      <section className="py-9 md:py-12" id="market">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#ae7831]">From the shelves</p><h2 className="mt-1 font-serif text-4xl text-[#53321f]">A good kind of familiar.</h2></div><div className="relative w-full md:w-80"><Search className="absolute left-3.5 top-3.5 text-[#a3835e]" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shito, plantain, jollof..." className="focus-ring h-11 w-full rounded-xl border border-[#dcc9ad] bg-[#fffaf1] pl-10 pr-4 text-sm text-[#55321e] placeholder:text-[#b29a7c]" data-testid="input-search-products" /></div></div>
        <div className="mb-7 flex items-center gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-extrabold transition ${category === item ? 'border-[#603921] bg-[#603921] text-[#f8dc8b]' : 'border-[#ddcbb1] bg-[#fffaf1] text-[#896b4a] hover:border-[#a9804d]'}`} data-testid={`button-filter-${item.toLowerCase().replaceAll(' ', '-')}`}><Filter size={12} className="mr-1 inline" />{item}</button>)}</div>
         {productsQuery.isLoading && !productsQuery.data ? <SkeletonRows count={2} /> : <><div className="mb-5 flex items-center justify-between rounded-xl border border-[#e3c96e] bg-[#fff4c9] px-4 py-3 text-xs font-bold text-[#76532b]">{liveProductsUnavailable ? <><span>The live shelves are reconnecting. Showing the latest market preview.</span><button onClick={() => productsQuery.refetch()} className="rounded-lg bg-[#071a4d] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#ffd447]" data-testid="button-retry-products">Retry</button></> : <span>{products.length} market picks ready for delivery.</span>}</div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visibleProducts.map((product, index) => <article key={product.id} className={`product-card animate-rise rounded-[1.15rem] border border-[#dfceb4] bg-[#fffaf1] ${index > 2 ? 'animate-rise-1' : ''}`} data-testid={`card-product-${product.id}`}><ProductVisual product={product} /><div className="p-5"><div className="mb-2 flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#ad7d3f]">{product.origin} · {product.category}</p><h3 className="mt-1 font-serif text-2xl leading-tight text-[#56351f]">{product.name}</h3></div><span className="font-mono text-sm font-bold text-[#744522]" data-testid={`text-price-${product.id}`}>{money(product.price)}</span></div><p className="line-clamp-2 min-h-12 text-sm leading-6 text-[#8a6d51]">{product.description}</p><button onClick={() => addToCart(product)} disabled={!product.inStock} className={`button-lift mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-extrabold ${product.inStock ? 'bg-[#e8bd4d] text-[#55321e]' : 'cursor-not-allowed bg-[#eee4d5] text-[#ae9b83]'}`} data-testid={`button-add-product-${product.id}`}>{product.inStock ? <><Plus size={16} /> Add to bag</> : 'Temporarily out of stock'}</button></div></article>)}</div></>}
      </section>
      <section className="grid gap-5 border-t border-[#e1d2ba] py-10 md:grid-cols-3"><div className="rounded-2xl bg-[#f0dfb5] p-6"><p className="font-mono text-xs font-bold text-[#7b552c]">01 / ROOTED</p><h3 className="mt-3 font-serif text-2xl text-[#5c361e]">A shelf with a story</h3><p className="mt-2 text-sm leading-6 text-[#80613e]">Every product is sourced with the memory, method and maker in mind.</p></div><div className="rounded-2xl bg-[#e3ebd9] p-6"><p className="font-mono text-xs font-bold text-[#597044]">02 / READY</p><h3 className="mt-3 font-serif text-2xl text-[#405c3a]">Packed like it matters</h3><p className="mt-2 text-sm leading-6 text-[#607654]">Clear updates from our market team until your order lands.</p></div><div className="rounded-2xl bg-[#f2d4c7] p-6"><p className="font-mono text-xs font-bold text-[#965139]">03 / NEARBY</p><h3 className="mt-3 font-serif text-2xl text-[#743a29]">Your corner, closer</h3><p className="mt-2 text-sm leading-6 text-[#865c4b]">Company and partner riders keep local delivery dependable.</p></div></section>
      {notice && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#55321e] px-5 py-3 text-sm font-bold text-[#f9dc88] shadow-2xl" data-testid="status-cart-notice">{notice}</div>}
      {cart.length > 0 && <button onClick={() => setCartOpen(true)} className="button-lift fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-2xl bg-[#603921] px-4 py-3 text-left text-[#fff2d1] shadow-2xl md:right-9" data-testid="button-open-cart"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edc34f] text-[#55321e]"><ShoppingBag size={18} /></span><span><span className="block text-xs font-extrabold">{cart.reduce((sum, line) => sum + line.quantity, 0)} items in bag</span><span className="font-mono text-xs text-[#e9c878]">{money(cartTotal)}</span></span><ArrowRight size={16} /></button>}
      {(cartOpen || checkoutOpen) && <div className="fixed inset-0 z-50 bg-[#3b2416]/40 backdrop-blur-sm" onClick={() => { if (!createOrder.isPending) { setCartOpen(false); setCheckoutOpen(false); } }} />}
       {cartOpen && <aside className="fixed bottom-0 right-0 top-0 z-[51] flex w-full max-w-md flex-col bg-[#fffaf1] p-6 shadow-2xl animate-rise" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-[#e1d2ba] pb-5"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#a9793d]">Your market bag</p><h2 className="font-serif text-3xl text-[#56351f]">Ready when you are.</h2></div><button onClick={() => setCartOpen(false)} className="rounded-xl p-2 text-[#795638] hover:bg-[#f0dfbe]" data-testid="button-close-cart"><X size={20} /></button></div><div className="flex-1 space-y-4 overflow-y-auto py-5">{cart.map((line) => <div key={line.product.id} className="flex gap-3" data-testid={`row-cart-${line.product.id}`}><ProductVisual product={line.product} compact /><div className="min-w-0 flex-1"><h3 className="font-bold text-[#5b381f]">{line.product.name}</h3><p className="mt-1 font-mono text-xs text-[#9a7245]">{money(line.product.price)}</p><div className="mt-2 flex items-center gap-3"><button onClick={() => updateQuantity(line.product.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ddc9a9] text-[#754b2c]" data-testid={`button-decrease-${line.product.id}`}>−</button><span className="font-mono text-xs font-bold">{line.quantity}</span><button onClick={() => updateQuantity(line.product.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ddc9a9] text-[#754b2c]" data-testid={`button-increase-${line.product.id}`}>+</button></div></div><span className="font-mono text-xs font-bold text-[#633c23]">{money(line.product.price * line.quantity)}</span></div>)}</div><div className="border-t border-[#e1d2ba] pt-5"><div className="mb-4 flex justify-between text-sm"><span className="text-[#8e7255]">Subtotal</span><span className="font-mono font-bold text-[#56351f]">{money(cartTotal)}</span></div><button onClick={() => { setCartOpen(false); setCheckoutName((current) => current || user?.fullName || user?.firstName || ''); setCheckoutOpen(true); }} className="button-lift w-full rounded-xl bg-[#603921] py-3.5 text-sm font-extrabold text-[#f8da82]" data-testid="button-start-checkout">Continue to delivery <ArrowRight className="ml-2 inline" size={16} /></button></div></aside>}
       {checkoutOpen && <aside className="fixed bottom-0 right-0 top-0 z-[51] flex w-full max-w-md flex-col bg-[#fffaf1] p-6 shadow-2xl animate-rise" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-[#e1d2ba] pb-5"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#a9793d]">Almost home</p><h2 className="font-serif text-3xl text-[#56351f]">Delivery details</h2></div><button onClick={() => setCheckoutOpen(false)} className="rounded-xl p-2 text-[#795638]" data-testid="button-close-checkout"><X size={20} /></button></div><div className="space-y-4 py-5"><label className="block text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Name<input value={checkoutName} onChange={(event) => setCheckoutName(event.target.value)} placeholder={user?.fullName || user?.firstName || 'Your name'} className="mt-2 h-11 w-full rounded-xl border border-[#ddc9a9] bg-white px-3 text-sm" data-testid="input-checkout-name" /></label><label className="block text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Delivery address<input value={checkoutAddress} onChange={(event) => setCheckoutAddress(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#ddc9a9] bg-white px-3 text-sm" data-testid="input-checkout-address" /></label><div className="rounded-xl bg-[#f3e6ca] p-4 text-sm text-[#795a3b]"><div className="flex justify-between"><span>Market bag</span><span className="font-mono font-bold">{money(cartTotal)}</span></div><div className="mt-2 flex justify-between"><span>Neighborhood delivery</span><span className="font-mono font-bold">$4.50</span></div><div className="mt-3 flex justify-between border-t border-[#ddc9a9] pt-3 font-bold text-[#56351f]"><span>Total today</span><span className="font-mono">{money(cartTotal + 4.5)}</span></div></div></div><div className="mt-auto"><button onClick={placeOrder} disabled={createOrder.isPending} className="button-lift w-full rounded-xl bg-[#603921] py-3.5 text-sm font-extrabold text-[#f8da82] disabled:opacity-60" data-testid="button-place-order">{createOrder.isPending ? 'Placing your order...' : 'Place order'}</button><p className="mt-3 text-center text-xs text-[#9b7d5c]">Your rider will send arrival updates.</p></div></aside>}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === 'delivered' ? 'bg-[#dce8cf] text-[#4d6b3e]' : status === 'in_transit' || status === 'picked_up' ? 'bg-[#f3d993] text-[#72511d]' : 'bg-[#f1dfd2] text-[#8d5036]';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.1em] ${tone}`} data-testid={`status-order-${status}`}>{STATUS_LABELS[status] ?? status}</span>;
}

function OrdersPage() {
  const ordersQuery = useListOrders({ role: 'customer' }, { query: { queryKey: getListOrdersQueryKey({ role: 'customer' }), retry: false } });
  const orders = ordersQuery.data ?? [DEMO_ORDER];
  return <main className="mx-auto max-w-[1160px] px-5 py-10 md:px-9 md:py-14"><div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#a9793d]">Your neighborhood ledger</p><h1 className="mt-2 font-serif text-5xl text-[#53321f]">My orders</h1><p className="mt-2 text-sm text-[#8c6d50]">Every bag, every update, right here.</p></div><Link href="/" className="button-lift inline-flex items-center gap-2 self-start rounded-xl bg-[#603921] px-4 py-3 text-sm font-extrabold text-[#f9da83]" data-testid="link-order-more"><Plus size={16} /> Shop for more</Link></div>{ordersQuery.isLoading && !ordersQuery.data ? <SkeletonRows count={3} /> : ordersQuery.isError && !ordersQuery.data ? <EmptyState title="Your order book is offline" description="We could not load your recent orders. Give it another try in a moment." action={<button onClick={() => ordersQuery.refetch()} className="rounded-xl bg-[#603921] px-4 py-2 text-sm font-bold text-[#f9da83]" data-testid="button-retry-orders">Try again</button>} /> : <div className="space-y-4">{orders.map((order) => <Link href={`/orders/${order.id}`} key={order.id} className="group block rounded-[1.25rem] border border-[#dfceb4] bg-[#fffaf1] p-5 transition hover:-translate-y-1 hover:border-[#d1a94f] hover:shadow-[0_14px_38px_rgba(91,54,24,.1)]" data-testid={`card-order-${order.id}`}><div className="flex flex-col gap-5 md:flex-row md:items-center"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f0dca8] text-[#66401e]"><Package size={24} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><p className="font-mono text-xs font-bold text-[#9b7449]">ORDER #{order.id}</p><StatusBadge status={order.status} /></div><h2 className="mt-2 font-serif text-2xl text-[#56351f]">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}</h2><p className="mt-1 text-sm text-[#8c6d50]">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Placed recently'} · {order.customerAddress}</p></div><div className="flex items-center justify-between gap-6 md:justify-end"><div className="text-left md:text-right"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#a17d59]">Order total</p><p className="mt-1 font-mono text-lg font-bold text-[#633c23]">{money(order.total)}</p></div><ArrowRight className="text-[#b48543] transition group-hover:translate-x-1" size={20} /></div></div></Link>)}</div>}</main>;
}

function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const query = useGetOrder(id, { query: { queryKey: getGetOrderQueryKey(id), retry: false } });
  const order = query.data ?? (id === DEMO_ORDER.id ? DEMO_ORDER : undefined);
  if (query.isLoading && !order) return <main className="mx-auto max-w-[1000px] px-5 py-12"><SkeletonRows count={4} /></main>;
  if (query.isError && !order) return <main className="mx-auto max-w-[1000px] px-5 py-12"><EmptyState title="We lost that order" description="The tracking link may have expired or the market is reconnecting." action={<Link href="/orders" className="rounded-xl bg-[#603921] px-4 py-2 text-sm font-bold text-[#f9da83]" data-testid="link-back-orders">Back to orders</Link>} /></main>;
  if (!order) return <main className="mx-auto max-w-[1000px] px-5 py-12"><EmptyState title="Order not found" description="That market bag is not in our ledger." action={<Link href="/orders" className="rounded-xl bg-[#603921] px-4 py-2 text-sm font-bold text-[#f9da83]" data-testid="link-orders-empty">View your orders</Link>} /></main>;
  const currentIndex = STATUS_STEPS.indexOf(order.status);
  return <main className="mx-auto max-w-[1120px] px-5 py-9 md:px-9 md:py-14"><Link href="/orders" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#8a6748] hover:text-[#5b381f]" data-testid="link-back-to-orders"><ArrowLeft size={16} /> All orders</Link><div className="grid gap-6 lg:grid-cols-[1.4fr_.8fr]"><section><div className="rounded-[1.4rem] bg-[#603921] p-6 text-[#fff5df] md:p-9"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs font-bold text-[#e9c87a]">ORDER #{order.id}</p><h1 className="mt-2 font-serif text-4xl md:text-5xl">Your bag is on the way.</h1><p className="mt-3 text-sm text-[#ead6b1]">Estimated arrival <strong className="text-[#f6d270]">{order.eta || 'Today, soon'}</strong></p></div><StatusBadge status={order.status} /></div><div className="mt-10"><div className="relative flex justify-between">{STATUS_STEPS.map((step, index) => <div key={step} className="relative z-10 flex w-12 flex-col items-center gap-2"><div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${index <= currentIndex ? 'border-[#f2c653] bg-[#f2c653] text-[#56351f]' : 'border-[#a57d50] bg-[#70472a] text-[#b8956c]'}`}>{index <= currentIndex ? <Check size={16} strokeWidth={3} /> : <span className="font-mono text-[10px]">{String(index + 1).padStart(2, '0')}</span>}</div><span className={`hidden text-center text-[10px] font-bold md:block ${index <= currentIndex ? 'text-[#f6d270]' : 'text-[#b9956c]'}`}>{STATUS_LABELS[step]}</span></div>)}<div className="absolute left-6 right-6 top-[17px] h-1 bg-[#8d5e36]" /><div className="absolute left-6 top-[17px] h-1 bg-[#f2c653] transition-all" style={{ width: `calc(${Math.max(0, currentIndex) / 5 * 100}% - ${currentIndex > 0 ? 10 : 0}px)` }} /></div></div></div><div className="mt-6 rounded-[1.4rem] border border-[#dfceb4] bg-[#fffaf1] p-6 md:p-8"><div className="mb-7 flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a9793d]">The journey</p><h2 className="mt-1 font-serif text-3xl text-[#56351f]">Order updates</h2></div><Clock3 className="text-[#bb8841]" size={22} /></div><div className="space-y-6">{order.events.map((event, index) => <div className="relative flex gap-4" key={`${event.label}-${index}`} data-testid={`event-order-${index}`}>{index < order.events.length - 1 && <div className="absolute bottom-[-24px] left-[11px] top-7 w-px bg-[#e0ceb0]" />}<div className={`relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full border-4 border-[#fffaf1] ${event.completed ? 'bg-[#6f913d]' : 'bg-[#e4d6c1]'}`} /> <div><h3 className={`text-sm font-extrabold ${event.completed ? 'text-[#59351f]' : 'text-[#a78d70]'}`}>{event.label}</h3><p className="mt-1 text-sm text-[#917357]">{event.description}</p><p className="mt-1 font-mono text-[10px] text-[#b08b5d]">{event.timestamp}</p></div></div>)}</div></div></section><aside className="space-y-5"><div className="rounded-[1.4rem] border border-[#dfceb4] bg-[#fffaf1] p-6"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a9793d]">Delivery partner</p><div className="mt-4 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e5bd68] font-extrabold text-[#5c351f]">{initials(order.riderName || 'AF')}</div><div><h3 className="font-bold text-[#56351f]">{order.riderName || 'Assigning a rider'}</h3><p className="mt-1 text-xs text-[#927459]">{order.riderType === 'partner' ? 'Trusted partner rider' : order.riderType === 'company' ? 'AfroCart rider' : 'We are matching the closest rider'}</p></div></div><div className="mt-5 flex items-center gap-2 rounded-xl bg-[#edf1e3] px-3 py-2.5 text-xs font-bold text-[#5e7545]"><span className="h-2 w-2 rounded-full bg-[#719548] pulse-dot" /> Live delivery updates on</div></div><div className="rounded-[1.4rem] bg-[#f0dfb5] p-6"><div className="flex items-center gap-2 text-[#755129]"><MapPin size={16} /><p className="text-[10px] font-extrabold uppercase tracking-[.16em]">Delivering to</p></div><p className="mt-3 font-serif text-2xl text-[#5b381f]">{order.customerAddress}</p><div className="mt-5 border-t border-[#d9bd7a] pt-4"><div className="flex justify-between text-sm"><span className="text-[#876741]">Subtotal</span><span className="font-mono font-bold text-[#62401f]">{money(order.subtotal)}</span></div><div className="mt-2 flex justify-between text-sm"><span className="text-[#876741]">Delivery</span><span className="font-mono font-bold text-[#62401f]">{money(order.deliveryFee)}</span></div><div className="mt-3 flex justify-between border-t border-[#d9bd7a] pt-3 font-bold text-[#53321f]"><span>Total</span><span className="font-mono">{money(order.total)}</span></div></div></div></aside></div></main>;
}

function KpiCard({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: typeof DollarSign; tone: string }) {
  return <div className="rounded-[1.2rem] border border-[#dfceb4] bg-[#fffaf1] p-5"><div className="flex items-start justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={19} /></div><ArrowDownRight size={15} className="text-[#8b6b4c]" /></div><p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a17c55]">{label}</p><p className="mt-1 font-serif text-3xl text-[#56351f]" data-testid={`text-kpi-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</p><p className="mt-1 text-xs text-[#917357]">{note}</p></div>;
}

function ProfilePage() {
  const { user } = useAfroUser();
  const { isSignedIn } = useAfroAuth();
  const ordersQuery = useListOrders({ role: 'customer' }, { query: { queryKey: getListOrdersQueryKey({ role: 'customer' }), retry: false } });
  const displayName = user?.fullName || user?.firstName || 'BH African Market customer';
  const email = user?.primaryEmailAddress?.emailAddress || 'customer@afrocart.demo';
  const profileRole = user?.publicMetadata?.role === 'super_admin' ? 'Super admin' : user?.publicMetadata?.role === 'rider' ? 'Delivery rider' : 'Customer';
  if (!isSignedIn) return null;
  return (
    <main className="mx-auto max-w-[1000px] px-5 py-10 md:px-9 md:py-14">
      <div className="mb-8">
        <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#a9793d]">Your market account</p>
        <h1 className="mt-2 font-serif text-5xl text-[#53321f]">My profile</h1>
        <p className="mt-2 text-sm text-[#8c6d50]">Keep your account details and market activity in one place.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-[.8fr_1.2fr]">
        <section className="rounded-[1.5rem] bg-[#071a4d] p-7 text-[#fff8e8] md:p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ffd447] text-xl font-extrabold text-[#071a4d]">{initials(displayName)}</div>
          <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#ffd447]">Account profile</p>
          <h2 className="mt-2 font-serif text-4xl">{displayName}</h2>
          <p className="mt-3 break-words text-sm text-[#dbe3f3]">{email}</p>
          <span className="mt-6 inline-flex rounded-full border border-[#ffd447]/40 px-3 py-1.5 text-xs font-extrabold text-[#ffd447]">{profileRole}</span>
        </section>
        <section className="rounded-[1.5rem] border border-[#dfceb4] bg-[#fffaf1] p-7 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#a9793d]">Activity snapshot</p><h2 className="mt-1 font-serif text-3xl text-[#56351f]">Your market history</h2></div>
            <UserCircle className="text-[#c28b00]" size={28} />
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#f3e5c8] p-5"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#957044]">Orders placed</p><p className="mt-2 font-serif text-4xl text-[#56351f]">{ordersQuery.data?.length ?? 0}</p></div>
            <div className="rounded-2xl bg-[#e3ebd9] p-5"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#597044]">Updates</p><p className="mt-2 font-serif text-4xl text-[#405c3a]">Live</p></div>
          </div>
          <Link href="/orders" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ffd447] px-4 py-3 text-sm font-extrabold text-[#111318]" data-testid="link-profile-orders">View my orders <ArrowRight size={16} /></Link>
        </section>
      </div>
    </main>
  );
}

function AdminOverview() {
  const summaryQuery = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey(), retry: false } });
  const summary = summaryQuery.data ?? { revenueToday: 1842.5, activeOrders: 18, deliveredToday: 42, lowStock: 4, ordersByStatus: [{ status: 'received', count: 5 }, { status: 'preparing', count: 4 }, { status: 'ready', count: 3 }, { status: 'in_transit', count: 6 }] };
  const ordersQuery = useListOrders({ role: 'super_admin' }, { query: { queryKey: getListOrdersQueryKey({ role: 'super_admin' }), retry: false } });
  const recent = (ordersQuery.data ?? [DEMO_ORDER]).slice(0, 4);
  return <main className="mx-auto max-w-[1440px] px-5 py-9 md:px-9 md:py-14"><div className="mb-9 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#a9793d]">Tuesday, February 18 · Newark market</p><h1 className="mt-2 font-serif text-5xl text-[#53321f]">Good morning, Amara.</h1><p className="mt-2 text-sm text-[#8c6d50]">Here is the shape of the market today.</p></div><div className="flex items-center gap-2 rounded-xl bg-[#edf1e3] px-3 py-2 text-xs font-bold text-[#597044]"><span className="h-2 w-2 rounded-full bg-[#6f913d] pulse-dot" /> All systems are in rhythm</div></div>{summaryQuery.isLoading && !summaryQuery.data ? <SkeletonRows count={2} /> : <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><KpiCard label="Revenue today" value={money(summary.revenueToday)} note="12.4% vs last Tuesday" icon={DollarSign} tone="bg-[#f0dca8] text-[#77501f]" /><KpiCard label="Active orders" value={String(summary.activeOrders)} note="5 need attention now" icon={ShoppingBag} tone="bg-[#e5c8b7] text-[#8b4e37]" /><KpiCard label="Delivered today" value={String(summary.deliveredToday)} note="96% landed on time" icon={PackageCheck} tone="bg-[#dce8cf] text-[#597544]" /><KpiCard label="Low stock watch" value={String(summary.lowStock)} note="Catalog needs a look" icon={Tag} tone="bg-[#e8d4dd] text-[#895169]" /></div><div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><section className="rounded-[1.4rem] border border-[#dfceb4] bg-[#fffaf1] p-6"><div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a9793d]">Live pulse</p><h2 className="mt-1 font-serif text-3xl text-[#56351f]">Orders by status</h2></div><Link href="/admin/orders" className="text-xs font-extrabold text-[#9c6f32] hover:text-[#5d381f]" data-testid="link-view-order-queue">View queue <ArrowRight className="ml-1 inline" size={13} /></Link></div><div className="mt-8 space-y-5">{summary.ordersByStatus.map((item) => { const max = Math.max(...summary.ordersByStatus.map((entry) => entry.count), 1); return <div key={item.status} data-testid={`row-status-${item.status}`}><div className="mb-2 flex justify-between text-xs font-bold"><span className="text-[#785a3e]">{STATUS_LABELS[item.status] ?? item.status}</span><span className="font-mono text-[#a07235]">{item.count}</span></div><div className="h-3 overflow-hidden rounded-full bg-[#f0e4d1]"><div className="h-full rounded-full bg-[#c89a3f] transition-all" style={{ width: `${item.count / max * 100}%` }} /></div></div>})}</div></section><section className="rounded-[1.4rem] bg-[#603921] p-6 text-[#fff3d6]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#e4bd69]">Need a hand?</p><h2 className="mt-1 font-serif text-3xl">Catalog health</h2></div><ShieldCheck className="text-[#f0c953]" size={24} /></div><p className="mt-8 text-5xl font-serif text-[#f2cb61]">{summary.lowStock}<span className="ml-2 text-lg text-[#d4b47c]">items low</span></p><p className="mt-2 max-w-xs text-sm leading-6 text-[#dfc9a5]">A quick shelf check now keeps tomorrow's orders honest.</p><Link href="/admin/products" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#f2c653] px-4 py-3 text-xs font-extrabold text-[#56351f]" data-testid="link-check-catalog">Check catalog <ArrowRight size={15} /></Link></section></div><section className="mt-6 rounded-[1.4rem] border border-[#dfceb4] bg-[#fffaf1] p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a9793d]">On the floor</p><h2 className="mt-1 font-serif text-3xl text-[#56351f]">Recent orders</h2></div><Link href="/admin/orders" className="text-xs font-extrabold text-[#9c6f32]" data-testid="link-recent-orders">See all orders <ArrowRight className="ml-1 inline" size={13} /></Link></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-[#eadcc7] text-[10px] uppercase tracking-[.14em] text-[#a17c55]"><th className="pb-3">Order</th><th className="pb-3">Customer</th><th className="pb-3">Rider</th><th className="pb-3">Status</th><th className="pb-3 text-right">Total</th></tr></thead><tbody>{recent.map((order) => <tr key={order.id} className="border-b border-[#f0e5d3] last:border-0" data-testid={`row-recent-order-${order.id}`}><td className="py-4 font-mono text-xs font-bold text-[#8c643a]">#{order.id}</td><td className="py-4 text-sm font-bold text-[#5e3a22]">{order.customerName}</td><td className="py-4 text-sm text-[#8c6e52]">{order.riderName || 'Unassigned'}</td><td className="py-4"><StatusBadge status={order.status} /></td><td className="py-4 text-right font-mono text-sm font-bold text-[#603921]">{money(order.total)}</td></tr>)}</tbody></table></div></section></>}</main>;
}

function ReportsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');
  const reportsQuery = useGetReportsOverview({ range }, { query: { queryKey: getGetReportsOverviewQueryKey({ range }), retry: false } });
  const report = reportsQuery.data ?? {
    range,
    revenue: 6842.5,
    orders: 138,
    averageOrderValue: 49.58,
    deliveryRate: 96,
    dailyRevenue: [
      { label: 'Mon', revenue: 720, orders: 16 },
      { label: 'Tue', revenue: 980, orders: 21 },
      { label: 'Wed', revenue: 860, orders: 18 },
      { label: 'Thu', revenue: 1120, orders: 24 },
      { label: 'Fri', revenue: 1260, orders: 27 },
      { label: 'Sat', revenue: 980, orders: 20 },
      { label: 'Sun', revenue: 922.5, orders: 12 },
    ],
    topProducts: [
      { name: 'Golden Tropics Plantain Chips', units: 48, revenue: 312 },
      { name: "Auntie Ama's Shito", units: 36, revenue: 315 },
      { name: 'Jollof Rice Starter', units: 29, revenue: 268.25 },
      { name: 'Hibiscus Sobolo', units: 25, revenue: 175 },
    ],
    riderPerformance: [
      { name: 'Nana Owusu', type: 'company', deliveries: 42, onTimeRate: 98 },
      { name: 'SwiftDrop Partners', type: 'partner', deliveries: 31, onTimeRate: 94 },
      { name: 'Kwame Mensah', type: 'company', deliveries: 26, onTimeRate: 92 },
    ],
  };
  const maxRevenue = Math.max(...report.dailyRevenue.map((day) => day.revenue), 1);
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-9 md:px-9 md:py-14">
      <div className="mb-9 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#a9793d]">Super admin · reporting desk</p>
          <h1 className="mt-2 font-serif text-5xl text-[#53321f]">Know the shape of the market.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#8c6d50]">Revenue, order volume, best sellers, and delivery performance in one place.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-[#dfceb4] bg-[#fffaf1] p-1">
          <CalendarRange size={15} className="ml-2 text-[#9c7444]" />
          {(['7d', '30d', '90d'] as const).map((option) => (
            <button key={option} onClick={() => setRange(option)} className={`rounded-lg px-3 py-2 text-xs font-extrabold ${range === option ? 'bg-[#603921] text-[#f9da83]' : 'text-[#8f6e4d] hover:bg-[#f3e5c8]'}`} data-testid={`button-report-range-${option}`}>
              {option === '7d' ? '7 days' : option === '30d' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>
      </div>
      {reportsQuery.isLoading && !reportsQuery.data ? <SkeletonRows count={2} /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Revenue" value={money(report.revenue)} note={`Across the last ${range === '7d' ? '7' : range === '30d' ? '30' : '90'} days`} icon={DollarSign} tone="bg-[#f0dca8] text-[#77501f]" />
            <KpiCard label="Orders placed" value={String(report.orders)} note="All customer orders in range" icon={ShoppingBag} tone="bg-[#e5c8b7] text-[#8b4e37]" />
            <KpiCard label="Average order" value={money(report.averageOrderValue)} note="Average basket value" icon={TrendingUp} tone="bg-[#e3ebd9] text-[#597044]" />
            <KpiCard label="On-time delivery" value={`${Math.round(report.deliveryRate)}%`} note="Delivered without delay" icon={Truck} tone="bg-[#e8d4dd] text-[#895169]" />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
            <section className="rounded-[1.4rem] border border-[#dfceb4] bg-[#fffaf1] p-6 md:p-7">
              <div className="flex items-start justify-between">
                <div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a9793d]">Sales pulse</p><h2 className="mt-1 font-serif text-3xl text-[#56351f]">Revenue by day</h2></div>
                <BarChart3 className="text-[#b27e35]" size={22} />
              </div>
              <div className="mt-8 flex h-64 items-end gap-2 border-b border-[#eadcc7] pb-0 sm:gap-4">
                {report.dailyRevenue.map((day) => (
                  <div key={day.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className="rounded-md bg-[#603921] px-2 py-1 text-[10px] font-bold text-[#f9da83] opacity-0 transition group-hover:opacity-100">{money(day.revenue)}</span>
                    <div className="w-full max-w-12 rounded-t-xl bg-gradient-to-t from-[#8e5d2f] to-[#e3b94e] transition-all group-hover:from-[#603921] group-hover:to-[#f2c653]" style={{ height: `${Math.max(9, day.revenue / maxRevenue * 78)}%` }} />
                    <span className="pb-3 text-[10px] font-bold text-[#9b7957]">{day.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between text-xs text-[#9a7b5d]"><span>Orders are grouped by customer order date.</span><span className="font-mono font-bold text-[#7f5a32]">{report.orders} total orders</span></div>
            </section>
            <section className="rounded-[1.4rem] bg-[#603921] p-6 text-[#fff3d6] md:p-7">
              <div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#e4bd69]">Shelf intelligence</p><h2 className="mt-1 font-serif text-3xl">Top products</h2></div><TrendingUp className="text-[#f0c953]" size={22} /></div>
              <div className="mt-7 space-y-5">{report.topProducts.map((product, index) => { const max = Math.max(...report.topProducts.map((item) => item.revenue), 1); return <div key={product.name} data-testid={`row-top-product-${index}`}><div className="mb-2 flex items-center justify-between gap-3"><span className="truncate text-sm font-bold text-[#f8e7c5]">{product.name}</span><span className="shrink-0 font-mono text-xs text-[#f0c953]">{money(product.revenue)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#815636]"><div className="h-full rounded-full bg-[#f0c953]" style={{ width: `${product.revenue / max * 100}%` }} /></div><p className="mt-1 text-[10px] text-[#d8bf96]">{product.units} units moved</p></div>; })}</div>
            </section>
          </div>
          <section className="mt-6 rounded-[1.4rem] border border-[#dfceb4] bg-[#fffaf1] p-6 md:p-7">
            <div className="mb-5 flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a9793d]">Delivery network</p><h2 className="mt-1 font-serif text-3xl text-[#56351f]">Rider performance</h2></div><Bike className="text-[#b27e35]" size={22} /></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead><tr className="border-b border-[#eadcc7] text-[10px] uppercase tracking-[.14em] text-[#a17c55]"><th className="pb-3">Rider</th><th className="pb-3">Type</th><th className="pb-3">Deliveries</th><th className="pb-3 text-right">On time</th></tr></thead><tbody>{report.riderPerformance.map((rider) => <tr key={rider.name} className="border-b border-[#f0e5d3] last:border-0" data-testid={`row-rider-report-${rider.name.toLowerCase().replaceAll(' ', '-')}`}><td className="py-4 font-bold text-[#5e3a22]">{rider.name}</td><td className="py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${rider.type === 'partner' ? 'bg-[#f2d4c7] text-[#8e503c]' : 'bg-[#e3ebd9] text-[#597044]'}`}>{rider.type}</span></td><td className="py-4 font-mono text-sm text-[#765638]">{rider.deliveries}</td><td className="py-4 text-right font-mono text-sm font-bold text-[#597044]">{Math.round(rider.onTimeRate)}%</td></tr>)}</tbody></table></div>
          </section>
        </>
      )}
    </main>
  );
}

function ProductEditor({ product, onClose, onSaved }: { product?: Product; onClose: () => void; onSaved: () => void }) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const [form, setForm] = useState<ProductInput>({ name: product?.name ?? '', description: product?.description ?? '', price: product?.price ?? 0, category: product?.category ?? 'Pantry', origin: product?.origin ?? 'Ghana', imageUrl: product?.imageUrl ?? '', inStock: product?.inStock ?? true, featured: product?.featured ?? false });
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = useState('');
  const [categoryMode, setCategoryMode] = useState(false);
  const [imagePreview, setImagePreview] = useState(product?.imageUrl ? imageUrlForDisplay(product.imageUrl) : '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMessage, setImageMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  useEffect(() => {
    void riderRequest<Category[]>('/api/categories')
      .then((items) => setCategories(Array.from(new Set([...DEFAULT_CATEGORIES, ...items.map((item) => item.name)]))))
      .catch(() => setCategories(DEFAULT_CATEGORIES));
  }, []);
  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      const created = await riderRequest<Category>('/api/categories', { method: 'POST', body: JSON.stringify({ name }) });
      setCategories((current) => Array.from(new Set([...current, created.name])));
      setForm((current) => ({ ...current, category: created.name }));
      setNewCategory('');
      setCategoryMode(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not add category.');
    }
  };
  const save = () => {
    if (!form.name.trim()) return;
    setSaveError('');
    const done = () => { onSaved(); onClose(); };
    const failed = (error: unknown) => setSaveError(error instanceof Error ? error.message : 'Could not save this product.');
    if (product) updateProduct.mutate({ id: product.id, data: form }, { onSuccess: done, onError: failed });
    else createProduct.mutate({ data: form }, { onSuccess: done, onError: failed });
  };
  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageMessage('Choose a JPG, PNG, WEBP, or GIF image.');
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setImageMessage('Keep product images under 6MB.');
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    setImageMessage('Uploading picture...');
    try {
      const response = await fetch('/api/storage/uploads/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-role': 'super_admin' },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!response.ok) throw new Error('Upload URL unavailable');
      const { uploadURL, objectPath } = await response.json() as { uploadURL: string; objectPath: string };
      const uploadResponse = await fetch(uploadURL, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!uploadResponse.ok) throw new Error('Image upload failed');
       setForm((current) => ({ ...current, imageUrl: objectPath }));
       setImagePreview(imageUrlForDisplay(objectPath));
      setImageMessage('Picture ready to save.');
    } catch {
      setImageMessage('Image storage is unavailable right now. You can paste an image URL instead.');
    } finally {
      setUploadingImage(false);
    }
  };
  const pending = createProduct.isPending || updateProduct.isPending; /*
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#3b2416]/40 p-0 backdrop-blur-sm md:items-center md:p-6"><div className="w-full max-w-xl rounded-t-[1.5rem] bg-[#fffaf1] p-6 shadow-2xl md:rounded-[1.5rem] md:p-8" data-testid="dialog-product-editor"><div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a9793d]">Catalog desk</p><h2 className="mt-1 font-serif text-3xl text-[#56351f]">{product ? 'Edit product' : 'Add to the shelves'}</h2></div><button onClick={onClose} className="rounded-xl p-2 text-[#795638]" data-testid="button-close-product-editor"><X size={20} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2 text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#ddc9a9] bg-white px-3 text-sm normal-case tracking-normal" data-testid="input-product-name" /></label><label className="sm:col-span-2 text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 min-h-20 w-full rounded-xl border border-[#ddc9a9] bg-white p-3 text-sm normal-case tracking-normal" data-testid="input-product-description" /></label><label className="text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Price<input type="number" min="0" step="0.25" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} className="mt-2 h-11 w-full rounded-xl border border-[#ddc9a9] bg-white px-3 text-sm normal-case tracking-normal" data-testid="input-product-price" /></label><label className="text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Category<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#ddc9ad] bg-white px-3 text-sm normal-case tracking-normal" data-testid="input-product-category" /></label><label className="text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Origin<input value={form.origin} onChange={(event) => setForm({ ...form, origin: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#ddc9a9] bg-white px-3 py-3 text-sm normal-case tracking-normal" data-testid="input-product-origin" /></label><div className="text-xs font-extrabold uppercase tracking-wider text-[#805e3e]"><span>Product picture</span><div className="mt-2 flex items-center gap-3"><label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#ddc9a9] bg-[#f5ead5] px-3 text-xs font-extrabold normal-case tracking-normal text-[#704d2e] hover:bg-[#efdfc0]"><ImagePlus size={16} />{uploadingImage ? 'Uploading...' : 'Choose image'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} data-testid="input-product-image-file" /></label>{imagePreview && <img src={imagePreview} alt="Product preview" className="h-11 w-11 rounded-lg object-cover" /></div><p className="mt-1 text-[10px] font-normal normal-case tracking-normal text-[#9a7d5d]">{imageMessage || 'JPG, PNG, WEBP or GIF · up to 6MB'}</p></div><label className="sm:col-span-2 text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Image URL<input value={form.imageUrl} onChange={(event) => { setForm({ ...form, imageUrl: event.target.value }); setImagePreview(imageUrlForDisplay(event.target.value)); }} placeholder="Or paste a hosted image URL" className="mt-2 h-11 w-full rounded-xl border border-[#ddc9a9] bg-white px-3 text-sm normal-case tracking-normal" data-testid="input-product-image" /></label></div><div className="mt-5 flex flex-wrap gap-5 text-sm font-bold text-[#704d2e]"><label className="flex items-center gap-2"><input type="checkbox" checked={form.inStock} onChange={(event) => setForm({ ...form, inStock: event.target.checked })} className="accent-[#603921]" data-testid="input-product-stock" /> In stock</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} className="accent-[#603921]" data-testid="input-product-featured" /> Market favorite</label></div>{saveError && <p className="mt-4 rounded-xl bg-[#f3d8ce] px-3 py-2 text-xs font-bold text-[#8d5036]" data-testid="status-product-save-error">{saveError}</p>}<div className="mt-7 flex justify-end gap-3"><button onClick={onClose} className="rounded-xl px-4 py-3 text-sm font-bold text-[#856a4c]" data-testid="button-cancel-product">Cancel</button><button onClick={save} disabled={pending || uploadingImage || !form.name.trim()} className="button-lift rounded-xl bg-[#603921] px-5 py-3 text-sm font-extrabold text-[#f8da82] disabled:opacity-50" data-testid="button-save-product">{pending ? 'Saving...' : product ? 'Save changes' : 'Add product'}</button></div></div></div>;
}

  */
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#3b2416]/40 p-0 backdrop-blur-sm md:items-center md:p-6">
      <div className="w-full max-w-xl rounded-t-[1.5rem] bg-[#fffaf1] p-6 shadow-2xl md:rounded-[1.5rem] md:p-8" data-testid="dialog-product-editor">
        <div className="flex items-start justify-between">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a9793d]">Catalog desk</p><h2 className="mt-1 font-serif text-3xl text-[#56351f]">{product ? 'Edit product' : 'Add to the shelves'}</h2></div>
          <button onClick={onClose} className="rounded-xl p-2 text-[#795638]" data-testid="button-close-product-editor"><X size={20} /></button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#ddc9a9] bg-white px-3 text-sm normal-case tracking-normal" data-testid="input-product-name" /></label>
          <label className="sm:col-span-2 text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 min-h-20 w-full rounded-xl border border-[#ddc9a9] bg-white p-3 text-sm normal-case tracking-normal" data-testid="input-product-description" /></label>
          <label className="text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Price<input type="number" min="0" step="0.25" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} className="mt-2 h-11 w-full rounded-xl border border-[#ddc9a9] bg-white px-3 text-sm normal-case tracking-normal" data-testid="input-product-price" /></label>
           <label className="text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Category<select value={categoryMode ? '__new__' : form.category} onChange={(event) => { if (event.target.value === '__new__') setCategoryMode(true); else { setCategoryMode(false); setForm({ ...form, category: event.target.value }); } }} className="mt-2 h-11 w-full rounded-xl border border-[#ddc9ad] bg-white px-3 text-sm normal-case tracking-normal" data-testid="select-product-category">{categories.map((category) => <option key={category} value={category}>{category}</option>)}<option value="__new__">+ Add a category…</option></select>{categoryMode && <div className="mt-2 flex gap-2"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="New category name" className="h-10 min-w-0 flex-1 rounded-lg border border-[#ddc9ad] bg-white px-3 text-sm normal-case tracking-normal" data-testid="input-new-category" /><button type="button" onClick={() => void addCategory()} className="rounded-lg bg-[#071a4d] px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#ffd447]" data-testid="button-add-category">Add</button></div>}</label>
          <label className="text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Origin<input value={form.origin} onChange={(event) => setForm({ ...form, origin: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#ddc9a9] bg-white px-3 text-sm normal-case tracking-normal" data-testid="input-product-origin" /></label>
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">
            <span>Product picture</span>
            <div className="mt-2 flex items-center gap-3">
              <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#ddc9a9] bg-[#f5ead5] px-3 text-xs font-extrabold normal-case tracking-normal text-[#704d2e] hover:bg-[#efdfc0]"><ImagePlus size={16} />{uploadingImage ? 'Uploading...' : 'Choose image'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} data-testid="input-product-image-file" /></label>
              {imagePreview && <img src={imagePreview} alt="Product preview" className="h-11 w-11 rounded-lg object-cover" onError={() => setImagePreview('')} />}
            </div>
            <p className="mt-1 text-[10px] font-normal normal-case tracking-normal text-[#9a7d5d]">{imageMessage || 'JPG, PNG, WEBP or GIF · up to 6MB'}</p>
          </div>
          <label className="sm:col-span-2 text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Image URL<input value={form.imageUrl} onChange={(event) => { setForm({ ...form, imageUrl: event.target.value }); setImagePreview(imageUrlForDisplay(event.target.value)); }} placeholder="Or paste a hosted image URL" className="mt-2 h-11 w-full rounded-xl border border-[#ddc9a9] bg-white px-3 text-sm normal-case tracking-normal" data-testid="input-product-image" /></label>
        </div>
        <div className="mt-5 flex flex-wrap gap-5 text-sm font-bold text-[#704d2e]">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.inStock} onChange={(event) => setForm({ ...form, inStock: event.target.checked })} className="accent-[#603921]" data-testid="input-product-stock" /> In stock</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} className="accent-[#603921]" data-testid="input-product-featured" /> Market favorite</label>
        </div>
        {saveError && <p className="mt-4 rounded-xl bg-[#f3d8ce] px-3 py-2 text-xs font-bold text-[#8d5036]" data-testid="status-product-save-error">{saveError}</p>}
        <div className="mt-7 flex justify-end gap-3"><button onClick={onClose} className="rounded-xl px-4 py-3 text-sm font-bold text-[#856a4c]" data-testid="button-cancel-product">Cancel</button><button onClick={save} disabled={pending || uploadingImage || !form.name.trim()} className="button-lift rounded-xl bg-[#603921] px-5 py-3 text-sm font-extrabold text-[#f8da82] disabled:opacity-50" data-testid="button-save-product">{pending ? 'Saving...' : product ? 'Save changes' : 'Add product'}</button></div>
      </div>
    </div>
  );
}

function AdminProducts() {
  const queryClient = useQueryClient();
  const productsQuery = useListProducts(undefined, { query: { queryKey: getListProductsQueryKey(), retry: false } });
  const deleteProduct = useDeleteProduct();
  const [editor, setEditor] = useState<Product | 'new' | null>(null);
  const [search, setSearch] = useState('');
  const products = (productsQuery.data ?? DEMO_PRODUCTS).filter((product) => `${product.name} ${product.category} ${product.origin}`.toLowerCase().includes(search.toLowerCase()));
  const refresh = () => queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
  const remove = (product: Product) => { if (window.confirm(`Remove ${product.name} from the catalog?`)) deleteProduct.mutate({ id: product.id }, { onSuccess: refresh }); };
  return <main className="mx-auto max-w-[1440px] px-5 py-9 md:px-9 md:py-14"><div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#a9793d]">Super admin · catalog</p><h1 className="mt-2 font-serif text-5xl text-[#53321f]">The shelves</h1><p className="mt-2 text-sm text-[#8c6d50]">Keep every story, price and stock signal up to date.</p></div><button onClick={() => setEditor('new')} className="button-lift inline-flex items-center gap-2 self-start rounded-xl bg-[#603921] px-4 py-3 text-sm font-extrabold text-[#f9da83]" data-testid="button-add-product"><Plus size={17} /> Add product</button></div><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full max-w-sm"><Search className="absolute left-3.5 top-3.5 text-[#a3835e]" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalog" className="h-11 w-full rounded-xl border border-[#ddc9ad] bg-[#fffaf1] pl-10 pr-4 text-sm" data-testid="input-search-catalog" /></div><p className="text-xs font-bold text-[#927357]">{products.length} products showing</p></div>{productsQuery.isLoading && !productsQuery.data ? <SkeletonRows count={5} /> : <div className="overflow-hidden rounded-[1.3rem] border border-[#dfceb4] bg-[#fffaf1]"><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead className="bg-[#f3e7d0]"><tr className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#987350]"><th className="px-5 py-4">Product</th><th className="px-5 py-4">Category</th><th className="px-5 py-4">Price</th><th className="px-5 py-4">Shelf signal</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody>{products.map((product) => <tr key={product.id} className="border-t border-[#efe4d2]" data-testid={`row-product-${product.id}`}><td className="px-5 py-4"><div className="flex items-center gap-3"><ProductVisual product={product} compact /><div><p className="font-bold text-[#5e3a22]">{product.name}</p><p className="mt-1 text-xs text-[#927357]">{product.origin}</p></div></div></td><td className="px-5 py-4 text-sm text-[#806348]">{product.category}</td><td className="px-5 py-4 font-mono text-sm font-bold text-[#633c23]">{money(product.price)}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 text-xs font-bold ${product.inStock ? 'text-[#628047]' : 'text-[#a35e49]'}`}><span className={`h-2 w-2 rounded-full ${product.inStock ? 'bg-[#759c4a]' : 'bg-[#bd6a4c]'}`} />{product.inStock ? 'In stock' : 'Out of stock'}{product.featured && <span className="ml-2 rounded-full bg-[#f1d589] px-2 py-1 text-[9px] uppercase text-[#805c23]">Favorite</span>}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => setEditor(product)} className="rounded-lg p-2 text-[#826346] hover:bg-[#f1e2c5] hover:text-[#5c351f]" data-testid={`button-edit-product-${product.id}`}><Pencil size={16} /></button><button onClick={() => remove(product)} disabled={deleteProduct.isPending} className="rounded-lg p-2 text-[#a16652] hover:bg-[#f3ddd4]" data-testid={`button-delete-product-${product.id}`}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>{products.length === 0 && <EmptyState title="The shelf is quiet" description="No products match that search." action={<button onClick={() => setSearch('')} className="text-sm font-bold text-[#8b642f]" data-testid="button-clear-catalog-search">Clear search</button>} />}</div>}{editor && <ProductEditor product={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} onSaved={refresh} />}</main>;
}

function AdminRiders() {
  const queryClient = useQueryClient();
  const ridersQuery = useListRiders({ query: { queryKey: getListRidersQueryKey(), retry: false } });
  const riders = ridersQuery.data ?? DEMO_RIDERS;
  const [editor, setEditor] = useState<Rider | 'new' | null>(null);
  const [form, setForm] = useState<RiderWrite>({ name: '', type: 'company', phone: '', status: 'available' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const refresh = () => queryClient.invalidateQueries({ queryKey: getListRidersQueryKey() });

  const openEditor = (rider?: Rider) => {
    setError('');
    setForm(rider
      ? { name: rider.name, type: rider.type, phone: rider.phone, status: rider.status }
      : { name: '', type: 'company', phone: '', status: 'available' });
    setEditor(rider ?? 'new');
  };

  const save = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and phone are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await riderRequest<Rider>(editor === 'new' ? '/api/riders' : `/api/riders/${editor?.id}`, {
        method: editor === 'new' ? 'POST' : 'PATCH',
        body: JSON.stringify(form),
      });
      await refresh();
      setEditor(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save rider.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (rider: Rider) => {
    if (!window.confirm(`Remove ${rider.name} from the delivery network?`)) return;
    setError('');
    try {
      await riderRequest<void>(`/api/riders/${rider.id}`, { method: 'DELETE' });
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not remove rider.');
    }
  };

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-9 md:px-9 md:py-14">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#a9793d]">Super admin · delivery network</p>
          <h1 className="mt-2 font-serif text-5xl text-[#53321f]">Your riders</h1>
          <p className="mt-2 text-sm text-[#8c6d50]">Add delivery staff, keep contact details current, and take riders offline when needed.</p>
        </div>
        <button onClick={() => openEditor()} className="button-lift inline-flex items-center gap-2 self-start rounded-xl bg-[#603921] px-4 py-3 text-sm font-extrabold text-[#f9da83]" data-testid="button-add-rider"><Plus size={17} /> Add rider</button>
      </div>
      {error && <p className="mb-5 rounded-xl bg-[#f3d8ce] px-4 py-3 text-sm font-bold text-[#8d5036]" data-testid="status-rider-error">{error}</p>}
      {ridersQuery.isLoading && !ridersQuery.data ? <SkeletonRows count={3} /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {riders.map((rider) => (
            <article key={rider.id} className="rounded-[1.3rem] border border-[#dfceb4] bg-[#fffaf1] p-5" data-testid={`card-rider-${rider.id}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0dca8] font-serif text-xl text-[#6f4a20]">{initials(rider.name)}</div>
                  <div><h2 className="font-serif text-2xl text-[#56351f]">{rider.name}</h2><p className="mt-1 text-xs text-[#927357]">{rider.phone}</p></div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${rider.status === 'offline' ? 'bg-[#eee4d5] text-[#8f7c65]' : rider.status === 'delivering' ? 'bg-[#f2d4c7] text-[#8e503c]' : 'bg-[#e3ebd9] text-[#597044]'}`}>{rider.status}</span>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-[#efe4d2] pt-4 text-xs">
                <span className="font-bold uppercase tracking-wider text-[#a17c55]">{rider.type} rider</span>
                <span className="font-mono font-bold text-[#765638]">{rider.activeOrders} active {rider.activeOrders === 1 ? 'order' : 'orders'}</span>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => openEditor(rider)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#ddc9ad] px-3 py-2 text-xs font-extrabold text-[#704d2e] hover:bg-[#f3e5c8]" data-testid={`button-edit-rider-${rider.id}`}><Pencil size={14} /> Edit</button>
                <button onClick={() => void remove(rider)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#edcfc4] px-3 py-2 text-xs font-extrabold text-[#a16652] hover:bg-[#f3ddd4]" data-testid={`button-delete-rider-${rider.id}`}><Trash2 size={14} /> Remove</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {editor && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#3b2416]/40 p-0 backdrop-blur-sm md:items-center md:p-6">
        <div className="w-full max-w-lg rounded-t-[1.5rem] bg-[#fffaf1] p-6 shadow-2xl md:rounded-[1.5rem] md:p-8" data-testid="dialog-rider-editor">
          <div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a9793d]">Delivery network</p><h2 className="mt-1 font-serif text-3xl text-[#56351f]">{editor === 'new' ? 'Add rider' : 'Edit rider'}</h2></div><button onClick={() => setEditor(null)} className="rounded-xl p-2 text-[#795638]" data-testid="button-close-rider-editor"><X size={20} /></button></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#ddc9a9] bg-white px-3 text-sm normal-case tracking-normal" data-testid="input-rider-name" /></label>
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#ddc9a9] bg-white px-3 text-sm normal-case tracking-normal" data-testid="input-rider-phone" /></label>
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Rider['type'] })} className="mt-2 h-11 w-full rounded-xl border border-[#ddc9a9] bg-white px-3 text-sm normal-case tracking-normal" data-testid="select-rider-type"><option value="company">Company</option><option value="partner">Partner</option></select></label>
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#805e3e]">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Rider['status'] })} className="mt-2 h-11 w-full rounded-xl border border-[#ddc9a9] bg-white px-3 text-sm normal-case tracking-normal" data-testid="select-rider-status"><option value="available">Available</option><option value="offline">Offline</option><option value="delivering">Delivering</option></select></label>
          </div>
          {error && <p className="mt-4 rounded-xl bg-[#f3d8ce] px-3 py-2 text-xs font-bold text-[#8d5036]">{error}</p>}
          <div className="mt-7 flex justify-end gap-3"><button onClick={() => setEditor(null)} className="rounded-xl px-4 py-3 text-sm font-bold text-[#856a4c]">Cancel</button><button onClick={() => void save()} disabled={saving} className="button-lift rounded-xl bg-[#603921] px-5 py-3 text-sm font-extrabold text-[#f8da82] disabled:opacity-50" data-testid="button-save-rider">{saving ? 'Saving...' : 'Save rider'}</button></div>
        </div>
      </div>}
    </main>
  );
}

function AdminOrders() {
  const queryClient = useQueryClient();
  const ordersQuery = useListOrders({ role: 'super_admin' }, { query: { queryKey: getListOrdersQueryKey({ role: 'super_admin' }), retry: false } });
  const ridersQuery = useListRiders({ query: { queryKey: getListRidersQueryKey(), retry: false } });
  const updateOrder = useUpdateOrderStatus();
  const orders = ordersQuery.data ?? [DEMO_ORDER, { ...DEMO_ORDER, id: 1047, customerName: 'Kojo Asante', status: 'preparing', riderName: null, riderType: 'unassigned', total: 46.25 }];
  const riders = ridersQuery.data ?? DEMO_RIDERS;
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? orders : orders.filter((order) => order.status === filter);
  const update = (id: number, data: { status?: 'received' | 'preparing' | 'ready' | 'picked_up' | 'in_transit' | 'delivered'; riderName?: string | null; riderType?: 'company' | 'partner' | 'unassigned' }) => updateOrder.mutate({ id, data }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({ role: 'super_admin' }) }); queryClient.invalidateQueries({ queryKey: getListRidersQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); } });
  return <main className="mx-auto max-w-[1440px] px-5 py-9 md:px-9 md:py-14"><div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#a9793d]">Super admin · fulfillment</p><h1 className="mt-2 font-serif text-5xl text-[#53321f]">The order queue</h1><p className="mt-2 text-sm text-[#8c6d50]">Move each order forward, then get it into capable hands.</p></div><div className="flex items-center gap-2 rounded-xl bg-[#f0dfb5] px-3 py-2 text-xs font-bold text-[#79572d]"><Users size={15} /> {riders.filter((rider) => rider.status !== 'offline').length} riders on shift</div></div><div className="mb-5 flex gap-2 overflow-x-auto pb-1">{['all', 'received', 'preparing', 'ready', 'in_transit', 'delivered'].map((item) => <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-extrabold ${filter === item ? 'bg-[#603921] text-[#f8da82]' : 'border border-[#ddc9ad] bg-[#fffaf1] text-[#896c4d]'}`} data-testid={`button-order-filter-${item}`}>{item === 'all' ? 'All orders' : STATUS_LABELS[item]}</button>)}</div>{ordersQuery.isLoading && !ordersQuery.data ? <SkeletonRows count={5} /> : <div className="space-y-4">{filtered.map((order) => <div key={order.id} className="rounded-[1.3rem] border border-[#dfceb4] bg-[#fffaf1] p-5 md:p-6" data-testid={`card-admin-order-${order.id}`}><div className="flex flex-col gap-5 xl:flex-row xl:items-center"><div className="min-w-[260px] flex-1"><div className="flex items-center gap-3"><span className="font-mono text-xs font-bold text-[#9b7449]">#{order.id}</span><StatusBadge status={order.status} /></div><h2 className="mt-2 font-serif text-2xl text-[#56351f]">{order.customerName}</h2><p className="mt-1 flex items-center gap-1 text-sm text-[#927357]"><MapPin size={13} /> {order.customerAddress}</p><p className="mt-2 text-xs text-[#9f805e]">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(' · ')}</p></div><div className="flex flex-wrap items-center gap-3"><label className="text-[10px] font-extrabold uppercase tracking-wider text-[#997653]">Move to<select value={order.status} onChange={(event) => update(order.id, { status: event.target.value as 'received' })} className="mt-1 block h-10 rounded-xl border border-[#ddc9ad] bg-white px-3 text-xs font-bold text-[#613d23]" data-testid={`select-status-${order.id}`}>{STATUS_STEPS.map((step) => <option key={step} value={step}>{STATUS_LABELS[step]}</option>)}</select></label><label className="text-[10px] font-extrabold uppercase tracking-wider text-[#997653]">Rider<select value={order.riderName || ''} onChange={(event) => { const rider = riders.find((item) => item.name === event.target.value); update(order.id, { riderName: rider?.name || null, riderType: rider?.type || 'unassigned' }); }} className="mt-1 block h-10 max-w-[170px] rounded-xl border border-[#ddc9ad] bg-white px-3 text-xs font-bold text-[#613d23]" data-testid={`select-rider-${order.id}`}><option value="">Unassigned</option>{riders.filter((rider) => rider.status !== 'offline').map((rider) => <option key={rider.id} value={rider.name}>{rider.name}</option>)}</select></label><div className="ml-auto text-right"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#a17c55]">Total</p><p className="font-mono font-bold text-[#603921]">{money(order.total)}</p></div></div></div></div>)}</div>}</main>;
}

function RiderPage() {
  const queryClient = useQueryClient();
  const ordersQuery = useListOrders({ role: 'rider' }, { query: { queryKey: getListOrdersQueryKey({ role: 'rider' }), retry: false } });
  const updateOrder = useUpdateOrderStatus();
  const orders = ordersQuery.data ?? [DEMO_ORDER, { ...DEMO_ORDER, id: 1046, customerName: 'Efua Addo', status: 'ready', riderName: 'Nana Owusu', riderType: 'company', customerAddress: '24 Maple Avenue, Irvington, NJ', eta: 'Today, 7:15 PM' }];
  const active = orders.filter((order) => order.status !== 'delivered');
  const nextStatus = (status: string) => status === 'ready' ? 'picked_up' : status === 'picked_up' ? 'in_transit' : status === 'in_transit' ? 'delivered' : status;
  const advance = (order: Order) => updateOrder.mutate({ id: order.id, data: { status: nextStatus(order.status) as 'picked_up' } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({ role: 'rider' }) }); queryClient.invalidateQueries({ queryKey: getListRidersQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(order.id) }); } });
  return <main className="mx-auto max-w-[1120px] px-5 py-9 md:px-9 md:py-14"><div className="mb-8 rounded-[1.5rem] bg-[#603921] p-6 text-[#fff3d6] md:p-8"><div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"><div><p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#e4bd69]"><Bike size={14} /> Rider console · company route</p><h1 className="mt-2 font-serif text-5xl">Good route, Kwame.</h1><p className="mt-3 max-w-lg text-sm leading-6 text-[#e4d2af]">Keep the handoff clear. Update each stop when it leaves your hands.</p></div><div className="rounded-2xl border border-[#bf9253]/40 bg-[#71462a] p-4 md:min-w-[190px]"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#e4bd69]">On your route</p><p className="mt-1 font-serif text-4xl text-[#f2ca61]">{active.length}</p><p className="text-xs text-[#e3cda9]">active deliveries</p></div></div></div><div className="mb-5 flex items-end justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#a9793d]">Your stops</p><h2 className="mt-1 font-serif text-4xl text-[#53321f]">Delivery queue</h2></div><div className="flex items-center gap-2 text-xs font-bold text-[#658044]"><span className="h-2 w-2 rounded-full bg-[#759c4a] pulse-dot" /> You are available</div></div>{ordersQuery.isLoading && !ordersQuery.data ? <SkeletonRows count={3} /> : <div className="space-y-4">{orders.map((order, index) => <article key={order.id} className="rounded-[1.3rem] border border-[#dfceb4] bg-[#fffaf1] p-5 md:p-6" data-testid={`card-rider-order-${order.id}`}><div className="flex flex-col gap-5 md:flex-row md:items-center"><div className="flex items-start gap-4 md:min-w-[300px] md:flex-1"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9c75e] font-mono text-sm font-bold text-[#603921]">0{index + 1}</div><div><div className="flex flex-wrap items-center gap-3"><span className="font-mono text-xs font-bold text-[#9b7449]">ORDER #{order.id}</span><StatusBadge status={order.status} /></div><h3 className="mt-2 font-serif text-2xl text-[#56351f]">{order.customerName}</h3><p className="mt-1 flex items-center gap-1 text-sm text-[#927357]"><MapPin size={14} /> {order.customerAddress}</p></div></div><div className="rounded-xl bg-[#f3e7d0] px-4 py-3 md:min-w-[180px]"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#a17c55]">Arrival window</p><p className="mt-1 text-sm font-bold text-[#654222]">{order.eta || 'Update customer'}</p></div><button onClick={() => advance(order)} disabled={order.status === 'delivered' || updateOrder.isPending} className="button-lift inline-flex items-center justify-center gap-2 rounded-xl bg-[#603921] px-5 py-3 text-sm font-extrabold text-[#f8da82] disabled:cursor-not-allowed disabled:bg-[#e9dfd0] disabled:text-[#a59076]" data-testid={`button-advance-order-${order.id}`}>{order.status === 'ready' ? 'Mark picked up' : order.status === 'picked_up' ? 'Start delivery' : order.status === 'in_transit' ? 'Mark delivered' : order.status === 'delivered' ? 'Delivered' : 'Waiting for pack'}<ArrowRight size={16} /></button></div></article>)}</div>}</main>;
}

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${brandLogo}`,
  },
  variables: {
    colorPrimary: '#071a4d',
    colorForeground: '#111318',
    colorMutedForeground: '#596273',
    colorDanger: '#d62525',
    colorBackground: '#f7f8fa',
    colorInput: '#ffffff',
    colorInputForeground: '#111318',
    colorNeutral: '#c9cdd5',
    fontFamily: 'Manrope, sans-serif',
    borderRadius: '0.9rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffaf1] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-[0_18px_50px_rgba(91,54,24,.12)]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'font-serif text-[#56351f]',
    headerSubtitle: 'text-[#8c6d50]',
    socialButtonsBlockButtonText: 'text-[#56351f]',
    formFieldLabel: 'text-[#704d2e]',
    footerActionLink: 'text-[#8b642f]',
    footerActionText: 'text-[#8c6d50]',
    dividerText: 'text-[#8c6d50]',
    identityPreviewEditButton: 'text-[#8b642f]',
    formFieldSuccessText: 'text-[#597044]',
    alertText: 'text-[#8d5036]',
    logoBox: 'h-12',
    logoImage: 'max-h-12',
    socialButtonsBlockButton: 'border-[#dfceb4] bg-[#fffdf8] hover:bg-[#f3e7d0]',
    formButtonPrimary: 'bg-[#603921] text-[#f8da82] hover:bg-[#744522]',
    formFieldInput: 'border-[#dfceb4] bg-[#fffdf8] text-[#56351f]',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[#eadcc7]',
    alert: 'bg-[#f3d8ce]',
    otpCodeFieldInput: 'border-[#dfceb4] bg-[#fffdf8] text-[#56351f]',
    formFieldRow: 'text-[#704d2e]',
    main: 'bg-transparent',
  },
};

function SignInPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#fbf7ee] px-4 py-10"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#fbf7ee] px-4 py-10"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const previousUserId = useRef<string | null | undefined>(undefined);
  const client = useQueryClient();
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const nextUserId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== nextUserId) client.clear();
      previousUserId.current = nextUserId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function DemoAccessPage() {
  const demo = useContext(DemoAuthContext);
  const [, setLocation] = useLocation();
  if (!demo) return <Redirect to="/" />;
  const choose = (role: Exclude<DemoRole, null>) => {
    demo.setRole(role);
    setLocation(role === 'admin' ? '/admin' : role === 'rider' ? '/rider' : '/');
  };
  return (
    <main className="flex min-h-[calc(100dvh-76px)] items-center justify-center px-5 py-12 md:px-9">
      <section className="w-full max-w-3xl overflow-hidden rounded-[1.6rem] border border-[#d8c7ad] bg-[#fffaf1] shadow-[0_22px_70px_rgba(60,35,18,.12)]">
        <div className="bg-[#2f2119] px-6 py-8 text-[#fff8eb] md:px-10 md:py-10">
          <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#d8af58]">Local preview access</p>
          <h1 className="mt-3 max-w-xl font-serif text-4xl leading-tight md:text-5xl">Choose a workspace to see how BH African Market works.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#d9c9b5]">This preview account is for your current workspace only. It skips email verification so you can review the customer, admin, and rider flows immediately.</p>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
          {[
            { role: 'customer' as const, eyebrow: 'Shopper', title: 'Customer account', body: 'Browse food, place an order, and follow the delivery timeline.', action: 'Open storefront', icon: ShoppingBag },
            { role: 'admin' as const, eyebrow: 'Owner view', title: 'Super admin', body: 'Upload products, set prices, assign riders, and monitor arrivals.', action: 'Open admin', icon: ShieldCheck },
            { role: 'rider' as const, eyebrow: 'Delivery view', title: 'Rider console', body: 'Pick up parcels, update stops, and mark deliveries complete.', action: 'Open rider', icon: Bike },
          ].map((item) => (
            <button key={item.role} onClick={() => choose(item.role)} className="group rounded-2xl border border-[#ddcbb1] bg-[#fffdf8] p-5 text-left transition hover:-translate-y-1 hover:border-[#b9873b] hover:shadow-[0_14px_30px_rgba(91,54,24,.1)]" data-testid={`button-demo-role-${item.role}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0dca8] text-[#6f4a20]"><item.icon size={20} /></div>
              <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#aa7835]">{item.eyebrow}</p>
              <h2 className="mt-1 font-serif text-2xl text-[#4e2e1c]">{item.title}</h2>
              <p className="mt-2 min-h-16 text-sm leading-6 text-[#826a4e]">{item.body}</p>
              <span className="mt-4 inline-flex items-center text-xs font-extrabold text-[#704522] group-hover:text-[#a16d2d]">{item.action} <ArrowRight size={14} className="ml-1" /></span>
            </button>
          ))}
        </div>
        <div className="border-t border-[#eadcc7] px-6 py-4 text-center text-xs text-[#927357] md:px-8">When you connect Clerk, these previews become real role-gated accounts.</div>
      </section>
    </main>
  );
}

function AccessDenied({ area }: { area: string }) {
  const { signOut } = useAfroClerk();
  return <main className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-center justify-center px-5 text-center"><ShieldCheck size={42} className="text-[#b27e35]" /><p className="mt-5 text-[11px] font-extrabold uppercase tracking-[.18em] text-[#a9793d]">Account access</p><h1 className="mt-2 font-serif text-4xl text-[#53321f]">This {area} is restricted.</h1><p className="mt-3 text-sm leading-6 text-[#8c6d50]">Ask an AfroCart owner to assign the correct role to your account, or return to the market.</p><div className="mt-6 flex gap-3"><Link href="/" className="rounded-xl bg-[#603921] px-4 py-3 text-sm font-extrabold text-[#f8da82]">Back to market</Link><button onClick={() => void signOut({ redirectUrl: basePath || '/' })} className="rounded-xl border border-[#dfceb4] px-4 py-3 text-sm font-bold text-[#704d2e]">Sign out</button></div></main>;
}

function Router() {
  const [location] = useLocation();
  const { isLoaded, isSignedIn } = useAfroAuth();
  const { user } = useAfroUser();
  const demo = useContext(DemoAuthContext);
  if (!isLoaded) return <AuthLoading />;
  const privateArea = location.startsWith('/orders') || location.startsWith('/admin') || location.startsWith('/rider') || location.startsWith('/profile');
  if (privateArea && !isSignedIn) return <Redirect to={demo ? '/demo-access' : '/sign-in'} />;
  const role = user?.publicMetadata?.role;
  if (location.startsWith('/admin') && role !== 'super_admin') return <AppShell><AccessDenied area="admin workspace" /></AppShell>;
  if (location.startsWith('/rider') && role !== 'rider' && role !== 'super_admin') return <AppShell><AccessDenied area="rider workspace" /></AppShell>;
  return <ErrorBoundary resetKey={location}><AppShell><Switch><Route path="/" component={Storefront} /><Route path="/home" component={() => <Redirect to="/" />} /><Route path="/profile" component={ProfilePage} /><Route path="/orders" component={OrdersPage} /><Route path="/orders/:id" component={OrderDetailPage} /><Route path="/admin" component={AdminOverview} /><Route path="/admin/reports" component={ReportsPage} /><Route path="/admin/products" component={AdminProducts} /><Route path="/admin/riders" component={AdminRiders} /><Route path="/admin/orders" component={AdminOrders} /><Route path="/rider" component={RiderPage} /><Route component={NotFound} /></Switch></AppShell></ErrorBoundary>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in environment');
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to your BH African Market account' } }, signUp: { start: { title: 'Create your BH African Market account', subtitle: 'Save your market bag and track every delivery' } } }} routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}><QueryClientProvider client={queryClient}><ClerkQueryClientCacheInvalidator /><TooltipProvider><Switch><Route path="/sign-in/*?" component={SignInPage} /><Route path="/sign-up/*?" component={SignUpPage} /><Route component={Router} /></Switch><Toaster /></TooltipProvider></QueryClientProvider></ClerkProvider>;
}

function DemoAuthProviderWithRoutes() {
  const [role, setRoleState] = useState<DemoRole>(() => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY);
    return stored === 'customer' || stored === 'admin' || stored === 'rider' ? stored : null;
  });
  const setRole = (nextRole: DemoRole) => {
    setRoleState(nextRole);
    if (typeof window !== 'undefined') {
      if (nextRole) window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, nextRole);
      else window.localStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
    }
  };
  return (
    <DemoAuthContext.Provider value={{ role, setRole }}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Switch>
            <Route path="/demo-access" component={DemoAccessPage} />
            <Route path="/sign-in/*?" component={DemoAccessPage} />
            <Route path="/sign-up/*?" component={DemoAccessPage} />
            <Route component={Router} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </DemoAuthContext.Provider>
  );
}

function App() {
  return <WouterRouter base={basePath}>{clerkPubKey ? <ClerkProviderWithRoutes /> : <DemoAuthProviderWithRoutes />}</WouterRouter>;
}

export default App;