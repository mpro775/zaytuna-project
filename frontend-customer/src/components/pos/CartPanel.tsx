import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Divider,
  List,
  ListItem,

  Paper,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  LocalOffer as DiscountIcon,
  ShoppingCart as CartIcon,
  Receipt as ReceiptIcon,
  Clear as ClearIcon,
  Note as NoteIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Cart,  QuickCustomer } from '@/services/pos';

interface CartPanelProps {
  cart: Cart;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItemDiscount: (itemId: string, discount: number, type: 'percentage' | 'fixed') => void;
  onUpdateItemNote: (itemId: string, note: string) => void;
  onClearCart: () => void;
  onSelectCustomer: (customer: QuickCustomer | null) => void;
  onAddCartDiscount: (discount: number, type: 'percentage' | 'fixed') => void;
  onCheckout: () => void;
  onHoldCart: () => void;
  customers: QuickCustomer[];
  isSearchingCustomers: boolean;
  onSearchCustomers: (query: string) => void;
  disabled?: boolean;
}

const CartPanel: React.FC<CartPanelProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateItemDiscount,
  onUpdateItemNote,
  onClearCart,
  onSelectCustomer,
  onAddCartDiscount,
  onCheckout,
  onHoldCart,
  customers,
  isSearchingCustomers,
  onSearchCustomers,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteValue, setNoteValue] = useState('');
  const [customerSearchValue, setCustomerSearchValue] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleOpenDiscountDialog = (itemId: string, currentDiscount: number, currentType: 'percentage' | 'fixed') => {
    setEditingItem(itemId);
    setDiscountValue(currentDiscount);
    setDiscountType(currentType);
    setDiscountDialogOpen(true);
  };

  const handleSaveDiscount = () => {
    if (editingItem) {
      onUpdateItemDiscount(editingItem, discountValue, discountType);
    } else {
      onAddCartDiscount(discountValue, discountType);
    }
    setDiscountDialogOpen(false);
    setEditingItem(null);
    setDiscountValue(0);
  };

  const handleOpenNoteDialog = (itemId: string, currentNote: string) => {
    setEditingItem(itemId);
    setNoteValue(currentNote);
    setNoteDialogOpen(true);
  };

  const handleSaveNote = () => {
    if (editingItem) {
      onUpdateItemNote(editingItem, noteValue);
    }
    setNoteDialogOpen(false);
    setEditingItem(null);
    setNoteValue('');
  };

  const handleCustomerSearch = (_: React.SyntheticEvent, value: string) => {
    setCustomerSearchValue(value);
    if (value.length >= 2) {
      onSearchCustomers(value);
    }
  };

  const isEmpty = cart.items.length === 0;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CartIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('pos.cart', 'السلة')}
            </Typography>
            <Chip
              label={cart.items.length}
              size="small"
              color="primary"
              sx={{ fontWeight: 700 }}
            />
          </Box>
          {!isEmpty && (
            <Tooltip title={t('pos.clearCart', 'مسح السلة')}>
              <IconButton size="small" color="error" onClick={onClearCart} disabled={disabled}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Customer Selection */}
        <Autocomplete
          options={customers}
          getOptionLabel={(option) => `${option.name} ${option.phone ? `(${option.phone})` : ''}`}
          value={cart.customerId ? customers.find((c) => c.id === cart.customerId) || null : null}
          onChange={(_, newValue) => onSelectCustomer(newValue)}
          onInputChange={handleCustomerSearch}
          inputValue={customerSearchValue}
          loading={isSearchingCustomers}
          disabled={disabled}
          size="small"
          renderInput={(params) => (
            <TextField
              id={params.id}
              disabled={params.disabled}
              fullWidth={params.fullWidth}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
              inputProps={params.inputProps}
              size="small"
              placeholder={t('pos.selectCustomer', 'اختر عميل (اختياري)')}
            />
          )}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            return (
              <Box component="li" key={key} {...otherProps}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.phone} • {option.loyaltyTier} • {option.loyaltyPoints} نقطة
                  </Typography>
                </Box>
              </Box>
            );
          }}
          noOptionsText={t('pos.noCustomersFound', 'لا يوجد عملاء')}
        />

        {/* Selected Customer Info */}
        {cart.customerName && (
          <Paper variant="outlined" sx={{ mt: 1, p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                <PersonIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                {cart.customerName}
              </Typography>
              <IconButton size="small" onClick={() => onSelectCustomer(null)}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        )}
      </Box>

      {/* Cart Items */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {isEmpty ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 3,
            }}
          >
            <CartIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" align="center">
              {t('pos.emptyCart', 'السلة فارغة')}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {t('pos.emptyCartHint', 'اختر منتجات من القائمة')}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {cart.items.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    py: 1.5,
                    px: 2,
                  }}
                >
                  {/* Item Info Row */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Box sx={{ flexGrow: 1, pr: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(item.price)} × {item.quantity}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatCurrency(item.total)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Quantity Controls */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={disabled || item.quantity <= 1}
                        color="primary"
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <TextField
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0) {
                            onUpdateQuantity(item.id, val);
                          }
                        }}
                        size="small"
                        type="number"
                        disabled={disabled}
                        sx={{ width: 60 }}
                        inputProps={{ min: 1, style: { textAlign: 'center' } }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={disabled}
                        color="primary"
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {/* Discount */}
                      <Tooltip title={t('pos.itemDiscount', 'خصم')}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDiscountDialog(item.id, item.discount, item.discountType)}
                          disabled={disabled}
                          color={item.discount > 0 ? 'success' : 'default'}
                        >
                          <DiscountIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {/* Note */}
                      <Tooltip title={t('pos.itemNote', 'ملاحظة')}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenNoteDialog(item.id, item.notes || '')}
                          disabled={disabled}
                          color={item.notes ? 'info' : 'default'}
                        >
                          <NoteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {/* Delete */}
                      <Tooltip title={t('pos.removeItem', 'حذف')}>
                        <IconButton
                          size="small"
                          onClick={() => onRemoveItem(item.id)}
                          disabled={disabled}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Item Discount Badge */}
                  {item.discount > 0 && (
                    <Chip
                      size="small"
                      icon={<DiscountIcon sx={{ fontSize: 14 }} />}
                      label={item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}
                      color="success"
                      variant="outlined"
                      sx={{ mt: 1, alignSelf: 'flex-start' }}
                    />
                  )}

                  {/* Item Note */}
                  {item.notes && (
                    <Typography variant="caption" color="info.main" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                      📝 {item.notes}
                    </Typography>
                  )}
                </ListItem>
                {index < cart.items.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Cart Summary */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        {/* Subtotal */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t('pos.subtotal', 'المجموع الفرعي')}
          </Typography>
          <Typography variant="body2">{formatCurrency(cart.subtotal)}</Typography>
        </Box>

        {/* Discount */}
        {cart.totalDiscount > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="success.main">
              {t('pos.discount', 'الخصم')}
            </Typography>
            <Typography variant="body2" color="success.main">
              -{formatCurrency(cart.totalDiscount)}
            </Typography>
          </Box>
        )}

        {/* Tax */}
        {cart.totalTax > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('pos.tax', 'الضريبة')}
            </Typography>
            <Typography variant="body2">{formatCurrency(cart.totalTax)}</Typography>
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Grand Total */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('pos.total', 'الإجمالي')}
          </Typography>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
            {formatCurrency(cart.grandTotal)}
          </Typography>
        </Box>

        {/* Cart Discount Button */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<DiscountIcon />}
          onClick={() => {
            setEditingItem(null);
            setDiscountDialogOpen(true);
          }}
          disabled={disabled || isEmpty}
          sx={{ mb: 1 }}
        >
          {t('pos.addDiscount', 'خصم على الفاتورة')}
        </Button>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={onHoldCart}
            disabled={disabled || isEmpty}
            sx={{ flexGrow: 1 }}
          >
            {t('pos.holdCart', 'تعليق')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<ReceiptIcon />}
            onClick={onCheckout}
            disabled={disabled || isEmpty}
            sx={{ flexGrow: 2, py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
          >
            {t('pos.checkout', 'الدفع')}
          </Button>
        </Box>
      </Box>

      {/* Discount Dialog */}
      <Dialog open={discountDialogOpen} onClose={() => setDiscountDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {editingItem ? t('pos.itemDiscount', 'خصم على المنتج') : t('pos.cartDiscount', 'خصم على الفاتورة')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              label={t('pos.discountValue', 'قيمة الخصم')}
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {discountType === 'percentage' ? '%' : 'ر.ي'}
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              variant={discountType === 'percentage' ? 'contained' : 'outlined'}
              onClick={() => setDiscountType('percentage')}
              fullWidth
            >
              {t('pos.percentage', 'نسبة مئوية')} %
            </Button>
            <Button
              variant={discountType === 'fixed' ? 'contained' : 'outlined'}
              onClick={() => setDiscountType('fixed')}
              fullWidth
            >
              {t('pos.fixed', 'مبلغ ثابت')}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscountDialogOpen(false)}>{t('common.cancel', 'إلغاء')}</Button>
          <Button variant="contained" onClick={handleSaveDiscount}>
            {t('common.save', 'حفظ')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('pos.itemNote', 'ملاحظة على المنتج')}</DialogTitle>
        <DialogContent>
          <TextField
            label={t('pos.note', 'الملاحظة')}
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>{t('common.cancel', 'إلغاء')}</Button>
          <Button variant="contained" onClick={handleSaveNote}>
            {t('common.save', 'حفظ')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CartPanel;
