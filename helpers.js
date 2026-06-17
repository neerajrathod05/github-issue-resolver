function applyDiscount(price, discountPercent) {
  if (discountPercent < 0) {
    throw new Error('Discount percent cannot be negative');
  }
  return price - (price * discountPercent / 100);
}