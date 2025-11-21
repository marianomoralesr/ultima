import { supabase } from '../../supabaseClient';

export interface CustomEvent {
  id?: string;
  name: string;
  label: string;
  description: string;
  category: 'standard' | 'custom';
  icon_name?: string;
  color?: string;
  bg_color?: string;
  facebook_event_mapping?: string;
  gtm_event_mapping?: string;
  active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TriggerOption {
  value: string;
  label: string;
  description: string;
  requires_selector: boolean;
  requires_url_pattern: boolean;
  supports_conditions: boolean;
}

export const TRIGGER_TYPES: TriggerOption[] = [
  {
    value: 'pageview',
    label: 'Page View',
    description: 'Triggers when user visits a specific page',
    requires_selector: false,
    requires_url_pattern: true,
    supports_conditions: false
  },
  {
    value: 'button_click',
    label: 'Button Click',
    description: 'Triggers when user clicks a specific button or element',
    requires_selector: true,
    requires_url_pattern: false,
    supports_conditions: true
  },
  {
    value: 'element_click',
    label: 'Element Click (CSS Selector)',
    description: 'Triggers when user clicks any element matching CSS selector',
    requires_selector: true,
    requires_url_pattern: false,
    supports_conditions: true
  },
  {
    value: 'form_submit',
    label: 'Form Submit',
    description: 'Triggers when user submits a form',
    requires_selector: true,
    requires_url_pattern: false,
    supports_conditions: true
  },
  {
    value: 'url_pattern',
    label: 'URL Pattern Match',
    description: 'Triggers when URL matches a specific pattern (supports wildcards)',
    requires_selector: false,
    requires_url_pattern: true,
    supports_conditions: false
  },
  {
    value: 'element_visible',
    label: 'Element Becomes Visible',
    description: 'Triggers when an element enters viewport',
    requires_selector: true,
    requires_url_pattern: false,
    supports_conditions: true
  },
  {
    value: 'scroll_depth',
    label: 'Scroll Depth',
    description: 'Triggers when user scrolls to a certain percentage',
    requires_selector: false,
    requires_url_pattern: false,
    supports_conditions: true
  },
  {
    value: 'time_on_page',
    label: 'Time on Page',
    description: 'Triggers after user spends X seconds on page',
    requires_selector: false,
    requires_url_pattern: false,
    supports_conditions: true
  },
  {
    value: 'custom',
    label: 'Custom JavaScript',
    description: 'Advanced: custom trigger logic using JavaScript',
    requires_selector: false,
    requires_url_pattern: false,
    supports_conditions: true
  }
];

export interface SelectorMethod {
  value: string;
  label: string;
  description: string;
  example: string;
}

export const SELECTOR_METHODS: SelectorMethod[] = [
  {
    value: 'css',
    label: 'CSS Selector',
    description: 'Use CSS selector syntax',
    example: '#financiamiento-button, .cta-button, button[data-action="submit"]'
  },
  {
    value: 'text',
    label: 'Button Text',
    description: 'Match element containing specific text',
    example: 'Financiamientos, Solicitar, Comenzar'
  },
  {
    value: 'url',
    label: 'Link URL',
    description: 'Match links with specific URLs',
    example: '/escritorio/aplicacion, /financiamientos'
  },
  {
    value: 'id',
    label: 'Element ID',
    description: 'Match element by ID attribute',
    example: 'submit-btn, hero-cta'
  },
  {
    value: 'class',
    label: 'CSS Class',
    description: 'Match elements by CSS class',
    example: 'btn-primary, cta-button'
  }
];

export class CustomEventsService {
  /**
   * Get all custom events
   */
  static async getAllEvents(): Promise<CustomEvent[]> {
    const { data, error } = await supabase
      .from('custom_events')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching custom events:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get active events only
   */
  static async getActiveEvents(): Promise<CustomEvent[]> {
    const { data, error } = await supabase
      .from('custom_events')
      .select('*')
      .eq('active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching active custom events:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create a new custom event
   */
  static async createEvent(event: Omit<CustomEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CustomEvent> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('custom_events')
      .insert([{
        ...event,
        created_by: user?.id,
        active: event.active ?? true
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating custom event:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update a custom event
   */
  static async updateEvent(id: string, updates: Partial<CustomEvent>): Promise<CustomEvent> {
    const { data, error } = await supabase
      .from('custom_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating custom event:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a custom event
   */
  static async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('custom_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting custom event:', error);
      throw error;
    }
  }

  /**
   * Toggle event active status
   */
  static async toggleEventStatus(id: string): Promise<CustomEvent> {
    const { data: event } = await supabase
      .from('custom_events')
      .select('active')
      .eq('id', id)
      .single();

    if (!event) throw new Error('Event not found');

    return this.updateEvent(id, { active: !event.active });
  }

  /**
   * Build CSS selector from user-friendly inputs
   */
  static buildSelector(method: string, value: string): string {
    switch (method) {
      case 'css':
        return value;
      case 'text':
        return `*:has-text("${value}")`;
      case 'url':
        return `a[href*="${value}"]`;
      case 'id':
        return `#${value}`;
      case 'class':
        return `.${value}`;
      default:
        return value;
    }
  }

  /**
   * Validate CSS selector
   */
  static validateSelector(selector: string): boolean {
    try {
      document.querySelector(selector);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Match URL pattern (supports wildcards)
   */
  static matchURLPattern(url: string, pattern: string): boolean {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(url);
  }

  /**
   * Get all standard Facebook Pixel events
   */
  static getFacebookStandardEvents(): string[] {
    return [
      'PageView',
      'ViewContent',
      'Search',
      'AddToCart',
      'AddToWishlist',
      'InitiateCheckout',
      'AddPaymentInfo',
      'Purchase',
      'Lead',
      'CompleteRegistration',
      'Contact',
      'CustomizeProduct',
      'Donate',
      'FindLocation',
      'Schedule',
      'StartTrial',
      'SubmitApplication',
      'Subscribe'
    ];
  }
}

export default CustomEventsService;
