import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  AppBar,
  Toolbar,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Alert,
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Settings as SettingsIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  History as HistoryIcon,
  Pause as PauseIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  Keyboard as KeyboardIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Components
import { ProductGrid, CartPanel, PaymentModal, ShiftManager } from '@/components/pos';

// Hooks
import {
  usePOSProducts,
  usePOSCategories,
  useSearchByBarcode,
  useCurrentShift,
  useOpenShift,
  useCloseShift,
  useCreateTransaction,
  useFrequentCustomers,
} from '@/services/pos';
import { useAuth } from '@/contexts';

// Types
import type { Cart, CartItem, POSProduct, POSFilters, Payment, QuickCustomer } from '@/services/pos';

// Generate unique ID for cart items
const generateCartItemId = () => `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Calculate cart totals
const calculateCartTotals = (items: CartItem[]): Omit<Cart, 'items' | 'customerId' | 'customerName' | 'notes'> => {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  items.forEach((item) => {
    const itemSubtotal = item.price * item.quantity;
    let itemDiscount = 0;

    if (item.discountType === 'percentage') {
      itemDiscount = itemSubtotal * (item.discount / 100);
    } else {
      itemDiscount = item.discount * item.quantity;
    }

    const afterDiscount = itemSubtotal - itemDiscount;
    const itemTax = afterDiscount * (item.taxRate / 100);

    subtotal += itemSubtotal;
    totalDiscount += itemDiscount;
    totalTax += itemTax;
  });

  const grandTotal = subtotal - totalDiscount + totalTax;

  return { subtotal, totalDiscount, totalTax, grandTotal };
};

const POS: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // State
  const [filters, setFilters] = useState<POSFilters>({ inStock: true });
  const [cart, setCart] = useState<Cart>({
    items: [],
    subtotal: 0,
    totalDiscount: 0,
    totalTax: 0,
    grandTotal: 0,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [searchedCustomers, setSearchedCustomers] = useState<QuickCustomer[]>([]);

  // API Hooks
  const { data: products = [], isLoading: productsLoading, error: productsError } = usePOSProducts(filters);
  const { data: categories = [] } = usePOSCategories();
  const { data: currentShift, isLoading: shiftLoading } = useCurrentShift();
  const { data: frequentCustomers = [] } = useFrequentCustomers();
  const openShiftMutation = useOpenShift();
  const closeShiftMutation = useCloseShift();
  const createTransactionMutation = useCreateTransaction();
  const searchByBarcodeMutation = useSearchByBarcode();

  // Network status listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success(t('pos.online', 'تم استعادة الاتصال'));
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error(t('pos.offline', 'انقطع الاتصال - وضع Offline'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Fullscreen handler
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleClearCart = useCallback(() => {
    setCart({
      items: [],
      subtotal: 0,
      totalDiscount: 0,
      totalTax: 0,
      grandTotal: 0,
    });
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 - Help / Keyboard shortcuts
      if (e.key === 'F1') {
        e.preventDefault();
        toast(t('pos.keyboardShortcuts', 'F2: باركود | F3: بحث | F4: دفع | F8: مسح | F11: ملء الشاشة'));
      }
      // F4 - Quick payment
      if (e.key === 'F4' && cart.items.length > 0) {
        e.preventDefault();
        setPaymentModalOpen(true);
      }
      // F8 - Clear cart
      if (e.key === 'F8') {
        e.preventDefault();
        handleClearCart();
      }
      // F11 - Fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.items.length, toggleFullscreen, handleClearCart, t]);

  // Product selection handler
  const handleProductSelect = useCallback((product: POSProduct) => {
    if (!currentShift) {
      toast.error(t('pos.noShift', 'يجب فتح وردية أولاً'));
      return;
    }

    if (product.trackInventory && product.stockQuantity <= 0) {
      toast.error(t('pos.outOfStock', 'المنتج غير متوفر في المخزون'));
      return;
    }

    setCart((prev) => {
      // Check if product already in cart
      const existingIndex = prev.items.findIndex(
        (item) => item.productId === product.id && !item.variantId
      );

      let newItems: CartItem[];

      if (existingIndex >= 0) {
        // Update quantity
        newItems = prev.items.map((item, index) => {
          if (index === existingIndex) {
            const newQuantity = item.quantity + 1;
            const itemSubtotal = item.price * newQuantity;
            let discount = 0;
            if (item.discountType === 'percentage') {
              discount = itemSubtotal * (item.discount / 100);
            } else {
              discount = item.discount * newQuantity;
            }
            const afterDiscount = itemSubtotal - discount;
            const taxAmount = afterDiscount * (item.taxRate / 100);
            const total = afterDiscount + taxAmount;

            return {
              ...item,
              quantity: newQuantity,
              subtotal: itemSubtotal,
              taxAmount,
              total,
            };
          }
          return item;
        });
      } else {
        // Add new item
        const taxRate = product.taxRate || 0;
        const taxAmount = product.price * (taxRate / 100);
        const total = product.price + taxAmount;

        const newItem: CartItem = {
          id: generateCartItemId(),
          productId: product.id,
          name: product.name,
          ...(product.barcode ? { barcode: product.barcode } : {}),
          price: product.price,
          quantity: 1,
          discount: 0,
          discountType: 'percentage',
          taxRate,
          taxAmount,
          subtotal: product.price,
          total,
        };

        newItems = [...prev.items, newItem];
      }

      const totals = calculateCartTotals(newItems);
      return {
        ...prev,
        items: newItems,
        ...totals,
      };
    });

    // Play sound feedback
    const audio = new Audio('/sounds/beep.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Ignore if no audio file
  }, [currentShift, t]);

  // Barcode search handler
  const handleBarcodeSearch = useCallback(async (barcode: string) => {
    try {
      const product = await searchByBarcodeMutation.mutateAsync(barcode);
      if (product) {
        handleProductSelect(product);
      } else {
        toast.error(t('pos.productNotFound', 'لم يتم العثور على المنتج'));
      }
    } catch {
      toast.error(t('pos.barcodeError', 'خطأ في البحث بالباركود'));
    }
  }, [searchByBarcodeMutation, handleProductSelect, t]);

  // Cart manipulation handlers
  const handleUpdateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) return;

    setCart((prev) => {
      const newItems = prev.items.map((item) => {
        if (item.id === itemId) {
          const itemSubtotal = item.price * quantity;
          let discount = 0;
          if (item.discountType === 'percentage') {
            discount = itemSubtotal * (item.discount / 100);
          } else {
            discount = item.discount * quantity;
          }
          const afterDiscount = itemSubtotal - discount;
          const taxAmount = afterDiscount * (item.taxRate / 100);
          const total = afterDiscount + taxAmount;

          return {
            ...item,
            quantity,
            subtotal: itemSubtotal,
            taxAmount,
            total,
          };
        }
        return item;
      });

      const totals = calculateCartTotals(newItems);
      return { ...prev, items: newItems, ...totals };
    });
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setCart((prev) => {
      const newItems = prev.items.filter((item) => item.id !== itemId);
      const totals = calculateCartTotals(newItems);
      return { ...prev, items: newItems, ...totals };
    });
  }, []);

  const handleUpdateItemDiscount = useCallback((itemId: string, discount: number, type: 'percentage' | 'fixed') => {
    setCart((prev) => {
      const newItems = prev.items.map((item) => {
        if (item.id === itemId) {
          const itemSubtotal = item.price * item.quantity;
          let discountAmount = 0;
          if (type === 'percentage') {
            discountAmount = itemSubtotal * (discount / 100);
          } else {
            discountAmount = discount * item.quantity;
          }
          const afterDiscount = itemSubtotal - discountAmount;
          const taxAmount = afterDiscount * (item.taxRate / 100);
          const total = afterDiscount + taxAmount;

          return {
            ...item,
            discount,
            discountType: type,
            taxAmount,
            total,
          };
        }
        return item;
      });

      const totals = calculateCartTotals(newItems);
      return { ...prev, items: newItems, ...totals };
    });
  }, []);

  const handleUpdateItemNote = useCallback((itemId: string, notes: string) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, notes } : item
      ),
    }));
  }, []);

  const handleSelectCustomer = useCallback((customer: QuickCustomer | null) => {
    setCart((prev) => {
      if (customer) {
        return { ...prev, customerId: customer.id, customerName: customer.name };
      }
      return {
        items: prev.items,
        subtotal: prev.subtotal,
        totalDiscount: prev.totalDiscount,
        totalTax: prev.totalTax,
        grandTotal: prev.grandTotal,
        ...(prev.notes ? { notes: prev.notes } : {}),
      };
    });
  }, []);

  const handleAddCartDiscount = useCallback((discount: number, type: 'percentage' | 'fixed') => {
    // This would add a cart-level discount
    // For now, we'll apply it proportionally to all items
    setCart((prev) => {
      if (prev.items.length === 0) return prev;

      const totalDiscount = type === 'percentage'
        ? prev.subtotal * (discount / 100)
        : discount;

      return {
        ...prev,
        totalDiscount: prev.totalDiscount + totalDiscount,
        grandTotal: prev.subtotal - prev.totalDiscount - totalDiscount + prev.totalTax,
      };
    });
  }, []);

  // Shift handlers
  const handleOpenShift = useCallback(async (openingCash: number) => {
    await openShiftMutation.mutateAsync(openingCash);
    toast.success(t('pos.shiftOpened', 'تم فتح الوردية بنجاح'));
  }, [openShiftMutation, t]);

  const handleCloseShift = useCallback(async (closingCash: number, notes?: string) => {
    if (!currentShift) return;
    await closeShiftMutation.mutateAsync({
      shiftId: currentShift.id,
      closingCash,
      ...(notes ? { notes } : {}),
    });
    toast.success(t('pos.shiftClosed', 'تم إغلاق الوردية بنجاح'));
  }, [closeShiftMutation, currentShift, t]);

  // Payment handlers
  const handleCheckout = useCallback(() => {
    if (!currentShift) {
      toast.error(t('pos.noShift', 'يجب فتح وردية أولاً'));
      return;
    }
    setPaymentModalOpen(true);
  }, [currentShift, t]);

  const handleCompletePayment = useCallback(async (payments: Payment[], printReceipt: boolean) => {
    if (!currentShift) return;

    await createTransactionMutation.mutateAsync({
      cart,
      payments,
      ...(cart.customerId ? { customerId: cart.customerId } : {}),
      warehouseId: 'default', // TODO: Get from settings
    });

    toast.success(t('pos.saleComplete', 'تمت العملية بنجاح!'));

    // Clear cart after successful sale
    handleClearCart();

    if (printReceipt) {
      // TODO: Implement receipt printing
    }
  }, [cart, createTransactionMutation, currentShift, handleClearCart, t]);

  const handleHoldCart = useCallback(() => {
    // TODO: Implement cart hold functionality
    toast.success(t('pos.cartHeld', 'تم تعليق السلة'));
  }, [t]);

  // Customer search handler
  const handleSearchCustomers = useCallback((query: string) => {
    setCustomerSearchQuery(query);
    // In real implementation, this would call the API
    // For now, filter frequent customers
    const filtered = frequentCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone?.includes(query)
    );
    setSearchedCustomers(filtered);
  }, [frequentCustomers]);

  // Combined customers list
  const availableCustomers = useMemo(() => {
    if (customerSearchQuery.length >= 2) {
      return searchedCustomers;
    }
    return frequentCustomers;
  }, [customerSearchQuery, searchedCustomers, frequentCustomers]);

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  // Shift not available - show shift manager
  const hasActiveShift = !!currentShift;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
      {/* Top Bar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense" sx={{ justifyContent: 'space-between' }}>
          {/* Left Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              زيتون POS
            </Typography>

            {/* Branch/Warehouse Info */}
            <Chip
              icon={<StoreIcon />}
              label={user?.branch ?? t('pos.defaultBranch', 'الفرع الرئيسي')}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* Right Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Online/Offline Status */}
            <Tooltip title={isOnline ? t('pos.online', 'متصل') : t('pos.offline', 'غير متصل')}>
              <Chip
                icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
                label={isOnline ? t('pos.online', 'متصل') : t('pos.offline', 'Offline')}
                color={isOnline ? 'success' : 'error'}
                size="small"
              />
            </Tooltip>

            {/* Keyboard Shortcuts */}
            <Tooltip title={t('pos.keyboardShortcuts', 'اختصارات لوحة المفاتيح (F1)')}>
              <IconButton size="small">
                <KeyboardIcon />
              </IconButton>
            </Tooltip>

            {/* History */}
            <Tooltip title={t('pos.history', 'سجل العمليات')}>
              <IconButton size="small" onClick={() => navigate('/pos/history')}>
                <Badge badgeContent={0} color="error">
                  <HistoryIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Held Carts */}
            <Tooltip title={t('pos.heldCarts', 'السلات المعلقة')}>
              <IconButton size="small">
                <Badge badgeContent={0} color="warning">
                  <PauseIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Fullscreen */}
            <Tooltip title={isFullscreen ? t('pos.exitFullscreen', 'خروج من ملء الشاشة') : t('pos.fullscreen', 'ملء الشاشة (F11)')}>
              <IconButton size="small" onClick={toggleFullscreen}>
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>

            {/* User Menu */}
            <IconButton size="small" onClick={handleMenuOpen}>
              <PersonIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
              <MenuItem disabled>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={user?.username} secondary={user?.role} />
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('pos.settings', 'الإعدادات')} />
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/dashboard'); }}>
                <ListItemIcon>
                  <ReceiptIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('pos.backToDashboard', 'لوحة التحكم')} />
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primary={t('pos.logout', 'تسجيل الخروج')} />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Shift Manager */}
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <ShiftManager
          currentShift={currentShift ?? null}
          isLoadingShift={shiftLoading}
          onOpenShift={handleOpenShift}
          onCloseShift={handleCloseShift}
          isOpeningShift={openShiftMutation.isPending}
          isClosingShift={closeShiftMutation.isPending}
        />
      </Box>

      {/* Main Content */}
      {hasActiveShift ? (
        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Cart Panel (Right in RTL) */}
          <Box sx={{ width: 400, flexShrink: 0 }}>
            <CartPanel
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onUpdateItemDiscount={handleUpdateItemDiscount}
              onUpdateItemNote={handleUpdateItemNote}
              onClearCart={handleClearCart}
              onSelectCustomer={handleSelectCustomer}
              onAddCartDiscount={handleAddCartDiscount}
              onCheckout={handleCheckout}
              onHoldCart={handleHoldCart}
              customers={availableCustomers}
              isSearchingCustomers={false}
              onSearchCustomers={handleSearchCustomers}
            />
          </Box>

          {/* Products Grid (Left in RTL) */}
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <ProductGrid
              products={products}
              categories={categories}
              isLoading={productsLoading}
              error={productsError}
              onProductSelect={handleProductSelect}
              onBarcodeSearch={handleBarcodeSearch}
              filters={filters}
              onFilterChange={setFilters}
            />
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.200',
          }}
        >
          <Alert severity="info" sx={{ maxWidth: 500 }}>
            <Typography variant="body1">
              {t('pos.openShiftFirst', 'افتح وردية جديدة للبدء في استخدام نقطة البيع')}
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        cart={cart}
        onComplete={handleCompletePayment}
        isProcessing={createTransactionMutation.isPending}
      />
    </Box>
  );
};

export default POS;
