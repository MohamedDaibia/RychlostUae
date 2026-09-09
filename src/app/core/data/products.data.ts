export interface Product {
  slug: string;
  name: string;
  type: string;
  category: string;
  description: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Placeholder catalog content, written to build out the Products list and
// Product Details pages — NOT the confirmed Rychlost product list. Swap in
// the real catalog (name / type / description — still no pricing) once the
// client provides it. This file is the single source of truth for the
// catalog; both ProductsComponent and ProductDetailComponent read from it.
//
// `category` values here match the 4-category set used by the footer
// (footer.component.html) and the homepage "What We Supply" cards
// (product-categories.component.html) — treated as the settled taxonomy
// since, unlike CategoryNavComponent's 5-category/item list, nothing flags
// it as unconfirmed. CategoryNavComponent's own category/item names (its
// TODO already flags them as a draft, unconfirmed with the client) don't
// line up 1:1 with these — see the best-effort query-param matching in
// ProductsComponent.ngOnInit. Reconcile both lists with the client before
// this ships.
const RAW_PRODUCTS: Omit<Product, 'slug'>[] = [
  // Structured & Custom Cabling
  { name: 'Cat5e UTP Cable, 305m Box', type: 'Cat5e Cable', category: 'Structured & Custom Cabling', description: 'Solid-copper Cat5e UTP cable in a pull-box, suited to voice and general data drops in low-density installs.' },
  { name: 'Cat6 UTP Cable, 305m Box', type: 'Cat6 Cable', category: 'Structured & Custom Cabling', description: 'Unshielded Cat6 cable rated for gigabit runs, in a pull-box format that avoids kinks and knots during pulls.' },
  { name: 'Cat6 Riser-Rated Cable, 305m Box', type: 'Cat6 Cable', category: 'Structured & Custom Cabling', description: 'Riser-rated (CMR) Cat6 cable for vertical runs between floors, jacketed to meet fire-code requirements for shafts and risers.' },
  { name: 'Cat6A F/UTP Cable, 305m Box', type: 'Cat6A Cable', category: 'Structured & Custom Cabling', description: 'Foil-shielded Cat6A cable for 10-gigabit backbone runs, holding performance over longer distances than unshielded Cat6.' },
  { name: 'Cat8 S/FTP Cable, 305m Box', type: 'Cat7 / Cat8 Cable', category: 'Structured & Custom Cabling', description: 'Fully shielded Cat8 cable built for short, high-speed data-centre and switch-to-switch links up to 40 Gbps.' },
  { name: '24-Port Cat6 Patch Panel', type: 'Patch Panels', category: 'Structured & Custom Cabling', description: 'Rack-mount patch panel with 24 punch-down ports and a rear cable-management bar, labelled for quick circuit ID.' },
  { name: 'Cat6 Patch Cord, Booted', type: 'Patch Cords', category: 'Structured & Custom Cabling', description: 'Factory-terminated Cat6 patch cord with snagless boots, stocked in standard lengths for rack and desk drops.' },
  { name: 'Horizontal Cable Manager, 1U', type: 'Cable Management', category: 'Structured & Custom Cabling', description: '1U rack-mount cable manager with front and rear finger channels, keeps patch-cord runs dressed and labelled.' },
  { name: 'OS2 Single-Mode Fiber Cable', type: 'Single-Mode Fiber Cable', category: 'Structured & Custom Cabling', description: '9/125 single-mode fiber cable for long-haul backbone links between buildings or floors.' },
  { name: 'OM4 Multi-Mode Fiber Cable', type: 'Multi-Mode Fiber Cable', category: 'Structured & Custom Cabling', description: '50/125 OM4 multi-mode fiber built for high-bandwidth, short-to-medium-reach links within a campus or building.' },
  { name: 'LC-LC Fiber Patch Cord, Duplex', type: 'Fiber Patch Cords', category: 'Structured & Custom Cabling', description: 'Duplex LC-LC fiber patch cord with a factory polish, used for switch-to-panel and panel-to-equipment links.' },
  { name: '12-Port Fiber Enclosure', type: 'Fiber Enclosures & Trays', category: 'Structured & Custom Cabling', description: 'Rack-mount fiber enclosure with slide-out splice trays, housing adapter panels for up to 12 fiber connections.' },

  // Rack Enclosures & Cabinets
  { name: '9U Wall-Mount Rack Cabinet', type: 'Wall-Mount Racks', category: 'Rack Enclosures & Cabinets', description: 'Compact wall-mount cabinet for small comms rooms, with a lockable front door and side-panel access.' },
  { name: '42U Floor-Standing Server Rack', type: 'Floor-Standing Racks', category: 'Rack Enclosures & Cabinets', description: 'Full-height 42U enclosure with mesh front and rear doors for airflow, built for server and networking racks.' },
  { name: '24U Open-Frame Rack', type: 'Open-Frame Racks', category: 'Rack Enclosures & Cabinets', description: 'Two-post open-frame rack for equipment that does not need enclosed side panels, easing cable access.' },
  { name: 'Rack Shelf, Fixed 1U', type: 'Rack Accessories', category: 'Rack Enclosures & Cabinets', description: 'Fixed-mount 1U shelf for equipment without rack ears, rated to carry standard networking hardware.' },
  { name: 'Vertical Rack PDU, 24-Outlet', type: 'Rack PDUs & Cable Managers', category: 'Rack Enclosures & Cabinets', description: 'Zero-U vertical power distribution unit that mounts along the rear rail, freeing up horizontal rack space.' },

  // AV & Connectivity Equipment
  { name: '24-Port Gigabit PoE Switch', type: 'Network Switches', category: 'AV & Connectivity Equipment', description: 'Managed 24-port switch with PoE+ on every port, sized for access-layer deployments feeding APs and cameras.' },
  { name: '8-Port Unmanaged Switch', type: 'Network Switches', category: 'AV & Connectivity Equipment', description: 'Compact unmanaged switch for small offices or closets where plug-and-play connectivity is enough.' },
  { name: 'Gigabit Fiber-to-Copper Media Converter', type: 'Media Converters', category: 'AV & Connectivity Equipment', description: 'Converts a single-mode fiber link to RJ45 copper, extending Ethernet runs beyond standard copper distance limits.' },
  { name: 'RJ45 Field-Termination Plug', type: 'Patch Cords & Connectors', category: 'AV & Connectivity Equipment', description: 'Pass-through RJ45 connector for field termination, designed for use with a standard crimp tool.' },
  { name: 'Dual-Port Keystone Wall Plate', type: 'Wall Plates & Faceplates', category: 'AV & Connectivity Equipment', description: 'Two-gang wall plate that holds a pair of keystone jacks for desk or wall data outlets.' },
  { name: 'Cat6 Keystone Jack', type: 'RJ45 Connectors & Keystone Jacks', category: 'AV & Connectivity Equipment', description: 'Tool-less Cat6 keystone jack for wall plates and patch panels, terminates without a punch-down tool.' },

  // Networking & Telecom Hardware
  { name: 'Elevator Traveling Cable, Flat PVC', type: 'Elevator Traveling Cables', category: 'Networking & Telecom Hardware', description: 'Flexible flat traveling cable rated for continuous flex duty between an elevator car and shaft wiring.' },
  { name: 'Elevator Control Cable, Shielded', type: 'Elevator Control Cables', category: 'Networking & Telecom Hardware', description: 'Shielded multi-core control cable for elevator signalling and control circuits.' },
  { name: 'Flat Flexible Cable, Multi-Core', type: 'Flat / Flexible Cables', category: 'Networking & Telecom Hardware', description: 'Multi-core flat cable for tight, flex-heavy routing such as cable-carrier and moving-panel applications.' },
  { name: 'Elevator Intercom Cable', type: 'Elevator Communication Cables', category: 'Networking & Telecom Hardware', description: 'Dedicated cable pairs for elevator intercom and emergency-communication circuits.' },
  { name: 'Telecom Junction Box, Surface-Mount', type: 'Telecom Junction Boxes', category: 'Networking & Telecom Hardware', description: 'Surface-mount junction box for organising and protecting telecom cable splices and terminations.' },
  { name: 'Gigabit PoE Injector', type: 'PoE Injectors & Splitters', category: 'Networking & Telecom Hardware', description: 'Single-port PoE injector that adds power-over-Ethernet to a non-PoE switch port for cameras or access points.' },
];

export const PRODUCTS: Product[] = RAW_PRODUCTS.map((p) => ({ ...p, slug: slugify(p.name) }));

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return PRODUCTS.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, limit);
}
