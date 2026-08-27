import { Component } from '@angular/core';
import { NgFor, NgTemplateOutlet } from '@angular/common';

interface ProductCategory {
  label: string;
  /**
   * Draft placeholder subcategories — typical for a UAE networking/cabling
   * wholesaler, but NOT confirmed against Rychlost's real catalog yet.
   * Replace with the actual subcategory list before this goes live.
   */
  items: string[];
}

@Component({
  selector: 'app-category-nav',
  standalone: true,
  imports: [NgFor, NgTemplateOutlet],
  templateUrl: './category-nav.component.html',
  styleUrl: './category-nav.component.css',
})
export class CategoryNavComponent {
  // TODO(content): confirm the real subcategory names with the client —
  // these are draft placeholders only. "AC Connectivity" is assumed to mean
  // "Active Connectivity" (switches, connectors); confirm the intended meaning.
  readonly categories: ProductCategory[] = [
    {
      label: 'Structured Cabling',
      items: ['Cat5e Cable', 'Cat6 Cable', 'Cat6A Cable', 'Cat7 / Cat8 Cable', 'Patch Panels', 'Patch Cords', 'Cable Management'],
    },
    {
      label: 'Fibre Optics',
      items: ['Single-Mode Fiber Cable', 'Multi-Mode Fiber Cable', 'Fiber Patch Cords', 'Fiber Pigtails & Splice Products', 'Fiber Enclosures & Trays', 'Media Converters'],
    },
    {
      label: 'Racks & Cabinets',
      items: ['Wall-Mount Racks', 'Floor-Standing Racks', 'Open-Frame Racks', 'Rack Accessories', 'Rack PDUs & Cable Managers'],
    },
    {
      label: 'AC Connectivity',
      items: ['Network Switches', 'Media Converters', 'Patch Cords & Connectors', 'Wall Plates & Faceplates', 'RJ45 Connectors & Keystone Jacks'],
    },
    {
      label: 'Elevator Cables',
      items: ['Elevator Traveling Cables', 'Elevator Control Cables', 'Flat / Flexible Cables', 'Elevator Communication Cables'],
    },
  ];
}
