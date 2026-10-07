/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Order } from '../types';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

/**
 * Safe wrapper for Meta (Facebook) Pixel calls
 */
export const fbq = (...args: any[]) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      window.fbq(...args);
    } catch (err) {
      console.warn('[Meta Pixel] Error calling fbq:', err);
    }
  }
};

/**
 * Track PageView event
 */
export const trackFbPageView = (viewName?: string) => {
  fbq('track', 'PageView', viewName ? { page: viewName } : undefined);
};

/**
 * Track ViewContent event when a user looks at a product detail
 */
export const trackFbViewContent = (product: Product) => {
  if (!product) return;
  fbq('track', 'ViewContent', {
    content_name: product.name,
    content_category: product.category,
    content_ids: [product.id, product.sku].filter(Boolean),
    content_type: 'product',
    value: product.price,
    currency: 'THB'
  });
};

/**
 * Track AddToCart event when a product is added to cart
 */
export const trackFbAddToCart = (product: Product, quantity = 1) => {
  if (!product) return;
  fbq('track', 'AddToCart', {
    content_name: product.name,
    content_category: product.category,
    content_ids: [product.id, product.sku].filter(Boolean),
    content_type: 'product',
    value: product.price * quantity,
    currency: 'THB'
  });
};

/**
 * Track InitiateCheckout event
 */
export const trackFbInitiateCheckout = (items: { product: Product; quantity: number }[], totalAmount: number) => {
  fbq('track', 'InitiateCheckout', {
    content_ids: items.map(i => i.product.id),
    content_type: 'product',
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    value: totalAmount,
    currency: 'THB'
  });
};

/**
 * Track Purchase event on order completion
 */
export const trackFbPurchase = (order: Order) => {
  if (!order) return;
  fbq('track', 'Purchase', {
    content_ids: order.items.map(i => i.productId),
    content_type: 'product',
    value: order.totalAmount,
    currency: 'THB',
    order_id: order.id,
    num_items: order.items.reduce((sum, i) => sum + i.quantity, 0)
  });
};

/**
 * Track Lead event (e.g., registration or contact form submission)
 */
export const trackFbLead = (leadDetails?: Record<string, any>) => {
  fbq('track', 'Lead', leadDetails);
};
