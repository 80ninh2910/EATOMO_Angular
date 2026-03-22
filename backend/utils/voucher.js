function normalizeVoucherCode(code) {
  return String(code || '').trim().toUpperCase();
}

function formatCurrency(amount) {
  return `${Number(amount || 0).toLocaleString('vi-VN')}₫`;
}

function buildVoucherValidation(voucher, amount) {
  if (!voucher) {
    return { valid: false, message: 'Invalid voucher code' };
  }

  const now = new Date();

  if (!voucher.isActive) {
    return { valid: false, message: 'Voucher is inactive' };
  }

  if (voucher.validFrom && voucher.validFrom > now) {
    return { valid: false, message: 'Voucher is not yet valid' };
  }

  if (voucher.validUntil && voucher.validUntil < now) {
    return { valid: false, message: 'Voucher has expired' };
  }

  if (voucher.currentUses >= voucher.maxUses) {
    return { valid: false, message: 'Voucher has been fully redeemed' };
  }

  const parsedAmount =
    amount === undefined || amount === null || amount === '' ? null : Number(amount);

  if (parsedAmount !== null && Number.isFinite(parsedAmount) && parsedAmount < voucher.minOrderValue) {
    return {
      valid: false,
      minOrderValue: voucher.minOrderValue,
      message: `Minimum order value for voucher ${voucher.code} is ${formatCurrency(voucher.minOrderValue)}`
    };
  }

  return {
    valid: true,
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    maxDiscountAmount: voucher.maxDiscountAmount,
    minOrderValue: voucher.minOrderValue,
    message:
      voucher.discountType === 'percentage'
        ? `Voucher applied! ${voucher.discountValue}% off`
        : `Voucher applied! ${formatCurrency(voucher.discountValue)} off`
  };
}

function calculateVoucherDiscount(voucher, subtotal) {
  let discountAmount = 0;

  if (voucher.discountType === 'percentage') {
    discountAmount = Math.round((subtotal * voucher.discountValue) / 100);
    if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
      discountAmount = voucher.maxDiscountAmount;
    }
  } else {
    discountAmount = voucher.discountValue;
  }

  return Math.min(discountAmount, subtotal);
}

module.exports = {
  normalizeVoucherCode,
  buildVoucherValidation,
  calculateVoucherDiscount
};
