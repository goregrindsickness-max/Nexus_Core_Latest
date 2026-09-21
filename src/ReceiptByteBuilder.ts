import { Sale, InventoryItem } from './types';

export class ReceiptByteBuilder {
  private buffer: number[] = [];
  private encoder = new TextEncoder();

  constructor() {
    this.init();
  }

  // ESC @ - Initialize printer
  init(): this {
    this.buffer.push(0x1B, 0x40);
    return this;
  }

  // ESC a n - Set alignment
  // 0 or 0x00: Left
  // 1 or 0x01: Center
  // 2 or 0x02: Right
  alignLeft(): this {
    this.buffer.push(0x1B, 0x61, 0x00);
    return this;
  }

  alignCenter(): this {
    this.buffer.push(0x1B, 0x61, 0x01);
    return this;
  }

  alignRight(): this {
    this.buffer.push(0x1B, 0x61, 0x02);
    return this;
  }

  // GS ! n - Set character size
  // doubleHeight: 0x1D, 0x21, 0x10
  textDoubleHeight(): this {
    this.buffer.push(0x1D, 0x21, 0x10);
    return this;
  }

  // doubleWidth: 0x1D, 0x21, 0x01
  textDoubleWidth(): this {
    this.buffer.push(0x1D, 0x21, 0x01);
    return this;
  }

  // doubleHeight and doubleWidth: 0x1D, 0x21, 0x11
  textDoubleBoth(): this {
    this.buffer.push(0x1D, 0x21, 0x11);
    return this;
  }

  // Reset text size to normal: GS ! 00 -> 1D 21 00
  textNormalSize(): this {
    this.buffer.push(0x1D, 0x21, 0x00);
    return this;
  }

  // Raw text feed
  text(str: string): this {
    const bytes = this.encoder.encode(str);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  line(str: string = ''): this {
    this.text(str + '\n');
    return this;
  }

  // Feed n line breaks
  feed(n: number = 1): this {
    for (let i = 0; i < n; i++) {
      this.buffer.push(0x0A);
    }
    return this;
  }

  // GS V 66 00 -> 1D 56 42 00 paper cut command
  cutPaper(): this {
    this.buffer.push(0x1D, 0x56, 0x42, 0x00);
    return this;
  }

  // Get raw bytes
  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Serializes standard Sale records into ESC/POS commands
 */
export function serializeSaleToReceiptBytes(
  sale: Sale,
  bandName: string,
  items: InventoryItem[]
): Uint8Array {
  const builder = new ReceiptByteBuilder();
  
  builder.alignCenter()
    .textDoubleBoth()
    .line(bandName.toUpperCase())
    .textNormalSize()
    .line('================================')
    .alignCenter()
    .line('** OFFICIAL MERCHANDISE SLIP **')
    .alignLeft()
    .feed(1)
    .line(`TRANSACTION ID: ${sale.id.toUpperCase()}`)
    .line(`DATE: ${new Date(sale.created_at).toLocaleString()}`)
    .line(`PAYMENT METHOD: ${sale.payment_method.toUpperCase()}`)
    .line('--------------------------------')
    .feed(1);

  // Print items
  let totalQty = 0;
  if (sale.cart_items && sale.cart_items.length > 0) {
    sale.cart_items.forEach((item) => {
      const name = item?.name + (item.variantName ? ` [${item.variantName.toUpperCase()}]` : '');
      const lineStr = `${item.quantity}x ${name}`;
      const priceStr = `$${(item.price * item.quantity).toFixed(2)}`;
      
      // Calculate padding for a clean column look (32-char line width max)
      const spaceNeeded = 32 - lineStr.length - priceStr.length;
      const spaces = spaceNeeded > 0 ? ' '.repeat(spaceNeeded) : ' ';
      builder.line(`${lineStr}${spaces}${priceStr}`);
      totalQty += item.quantity;
    });
  } else {
    // Singular item fallback
    const mockItemStr = `${sale.quantity || 1}x ${sale.item_name || 'Custom Sale'}`;
    const priceStr = `$${(sale.amount || 0).toFixed(2)}`;
    const spaceNeeded = 32 - mockItemStr.length - priceStr.length;
    const spaces = spaceNeeded > 0 ? ' '.repeat(spaceNeeded) : ' ';
    builder.line(`${mockItemStr}${spaces}${priceStr}`);
    totalQty = sale.quantity || 1;
  }

  builder.feed(1)
    .line('--------------------------------')
    .alignRight()
    .textDoubleHeight()
    .line(`TOTAL ITEMS: ${totalQty}`)
    .line(`TOTAL PAID: $${(sale.amount || 0).toFixed(2)}`)
    .textNormalSize()
    .feed(2)
    .alignCenter()
    .line('THANK YOU FOR SUPPORTING LIVE MUSIC!')
    .line('Powered by NEXUS CORE')
    .feed(3)
    .cutPaper();

  return builder.getBytes();
}
