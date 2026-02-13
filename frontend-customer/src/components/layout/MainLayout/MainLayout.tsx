import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  PointOfSale as PointOfSaleIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Warehouse as WarehouseIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  LocalShipping as SupplierIcon,
  AdminPanelSettings as AdminIcon,
  AccountBalance as AccountingIcon,
  ShoppingBasket as PurchasingIcon,
  AssignmentReturn as ReturnsIcon,
  AccountCircle,
  Logout,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts';
import { useUiStore } from '@/store';
import { LanguageSwitcher } from '@/components/ui';
import { SyncStatusIndicator, OfflineBanner } from '@/components/sync';
import { MockModeBanner } from '@/components/ui/MockModeBanner';
import Breadcrumb from '../Breadcrumb';
import Footer from '../Footer';

const drawerWidth = 280;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useUiStore();

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
  };

  // صلاحيات القائمة حسب الدور (من GUIDE.md)
  // admin: كامل | manager: فروع، مخازن، منتجات، مبيعات | cashier: فواتير، منتجات، مخزون | warehouse_manager: مخزون فقط
  const knownRoles = ['admin', 'manager', 'cashier', 'warehouse_manager'];
  const userRole = knownRoles.includes(user?.role as string) ? (user?.role as string) : 'cashier';
  const canAccess = (allowedRoles: string[]) => allowedRoles.includes(userRole);

  const allMenuItems = [
    // Main Operations
    { textKey: 'navigation.dashboard', icon: <DashboardIcon />, path: '/dashboard', section: 'main', allowedRoles: ['admin', 'manager', 'cashier', 'warehouse_manager'] },
    { textKey: 'navigation.pos', icon: <PointOfSaleIcon />, path: '/pos', section: 'main', allowedRoles: ['admin', 'manager', 'cashier'] },

    // Products & Inventory
    { textKey: 'navigation.products', icon: <StoreIcon />, path: '/products', section: 'inventory', allowedRoles: ['admin', 'manager', 'cashier', 'warehouse_manager'] },
    { textKey: 'navigation.inventory', icon: <InventoryIcon />, path: '/inventory', section: 'inventory', allowedRoles: ['admin', 'manager', 'cashier', 'warehouse_manager'] },

    // Sales & Customers
    { textKey: 'navigation.sales', icon: <ShoppingCartIcon />, path: '/sales', section: 'sales', allowedRoles: ['admin', 'manager', 'cashier'] },
    { textKey: 'navigation.customers', icon: <PersonIcon />, path: '/customers', section: 'sales', allowedRoles: ['admin', 'manager', 'cashier'] },
    { textKey: 'navigation.suppliers', icon: <SupplierIcon />, path: '/suppliers', section: 'sales', allowedRoles: ['admin', 'manager'] },
    { textKey: 'navigation.purchasing', icon: <PurchasingIcon />, path: '/purchasing/orders', section: 'sales', allowedRoles: ['admin', 'manager'] },
    { textKey: 'navigation.returns', icon: <ReturnsIcon />, path: '/returns', section: 'sales', allowedRoles: ['admin', 'manager'] },

    // Business Management
    { textKey: 'navigation.branches', icon: <BusinessIcon />, path: '/branches', section: 'management', allowedRoles: ['admin', 'manager'] },
    { textKey: 'navigation.warehouses', icon: <WarehouseIcon />, path: '/warehouses', section: 'management', allowedRoles: ['admin', 'manager', 'warehouse_manager'] },

    // Reports & Accounting
    { textKey: 'navigation.reports', icon: <AssessmentIcon />, path: '/reports', section: 'reports', allowedRoles: ['admin', 'manager'] },
    { textKey: 'navigation.accounting', icon: <AccountingIcon />, path: '/accounting', section: 'reports', allowedRoles: ['admin'] },

    // Admin (admin only)
    { textKey: 'navigation.admin', icon: <AdminIcon />, path: '/admin', section: 'admin', allowedRoles: ['admin'] },
    { textKey: 'navigation.users', icon: <PeopleIcon />, path: '/users', section: 'admin', allowedRoles: ['admin'] },

    // Settings
    { textKey: 'navigation.settings', icon: <SettingsIcon />, path: '/settings', section: 'system', allowedRoles: ['admin', 'manager', 'cashier', 'warehouse_manager'] },
  ];

  const menuItems = allMenuItems.filter(item => canAccess(item.allowedRoles));

  const sectionConfig = [
    { key: 'main', label: 'الرئيسية' },
    { key: 'inventory', label: 'إدارة المخزون' },
    { key: 'sales', label: 'المبيعات والعملاء' },
    { key: 'management', label: 'إدارة الأعمال' },
    { key: 'reports', label: 'التقارير والمحاسبة' },
    { key: 'admin', label: 'الإدارة' },
    { key: 'system', label: 'النظام' },
  ];

  const sections = sectionConfig
    .map(({ key, label }) => ({
      key,
      label,
      items: menuItems.filter(item => item.section === key),
    }))
    .filter(section => section.items.length > 0);

  const drawer = (
    <Box sx={{
      height: '100vh',
      maxHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      overflow: 'hidden', // منع overflow من الحاوي الخارجي
    }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 3,
          borderBottom: `1px solid ${theme.palette.primary.light}20`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 1
        }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
              ز
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                fontWeight: 700,
                fontSize: '1.25rem',
                lineHeight: 1.2
              }}
            >
              زيتون
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.75rem'
              }}
            >
              SaaS Platform
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        p: 1,
        minHeight: 0, // مهم لـ flex containers
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '3px',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.5)',
          },
        },
        // Scrollbar للمتصفحات الأخرى
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1)',
      }}>
        {sections.map((section, sectionIndex) => (
          <Box key={section.key}>
            {sectionIndex > 0 && (
              <Box sx={{ px: 2, py: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: '0.5px'
                  }}
                >
                  {section.label}
                </Typography>
              </Box>
            )}

            <List sx={{ px: 1, py: 0 }}>
              {section.items.map((item) => {
                const isSelected = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
                return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) {
                        setMobileOpen(false);
                      }
                    }}
                    sx={{
                      borderRadius: 2,
                      mx: 0.5,
                      px: 2,
                      py: 1.5,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateX(4px)',
                        '& .MuiListItemIcon-root': {
                          transform: 'scale(1.1)',
                        }
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        borderRight: `3px solid ${theme.palette.secondary.main}`,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '& .MuiListItemText-primary': {
                          fontWeight: 600,
                          color: 'white',
                        },
                        '& .MuiListItemIcon-root': {
                          color: theme.palette.secondary.main,
                        }
                      }
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        minWidth: 40,
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={t(item.textKey)}
                      primaryTypographyProps={{
                        sx: {
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                        }
                      }}
                    />
                    {isSelected && (
                      <ChevronRightIcon
                        sx={{
                          color: theme.palette.secondary.main,
                          fontSize: '1.2rem',
                          ml: 'auto',
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* User Section */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.primary.light}20`,
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </Typography>
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: '0.85rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.username || t('common.user')}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.7rem',
              }}
            >
              {user?.role || 'User'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleLogout}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <Logout sx={{ fontSize: '1.2rem' }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Offline Banner */}
      <OfflineBanner />
      
      {/* Mock Mode Banner */}
      <MockModeBanner />

      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: {
            xs: '100%',
            md: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%'
          },
          right: { md: sidebarOpen ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(['width', 'right'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerToggle}
            sx={{ ml: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {t('app.name')}
          </Typography>

          {/* Sync Status Indicator */}
          <Box sx={{ mr: 1 }}>
            <SyncStatusIndicator compact />
          </Box>

          {/* Language Switcher */}
          <Box sx={{ mr: 1 }}>
            <LanguageSwitcher />
          </Box>

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              {t('common.actions.welcome', { name: user?.username || t('common.user') })}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              color="inherit"
              onClick={handleProfileMenuOpen}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
          </Box>

          <Menu
            id="primary-search-account-menu"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={handleProfileMenuClose}>
              <AccountCircle sx={{ mr: 1 }} />
              الملف الشخصي
            </MenuItem>
            <MenuItem onClick={handleProfileMenuClose}>
              <SettingsIcon sx={{ mr: 1 }} />
              الإعدادات
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              تسجيل الخروج
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{
          width: {
            xs: 0,
            md: sidebarOpen ? drawerWidth : 0
          },
          flexShrink: { md: 0 },
          position: 'fixed',
          right: { md: 0 },
          top: { md: 0 },
          height: { md: '100vh' },
          zIndex: { md: theme.zIndex.drawer },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          anchor="right"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="persistent"
          anchor="right"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              position: 'relative',
            },
          }}
          open={sidebarOpen}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: {
            xs: '100%',
            md: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%'
          },
          minHeight: '100vh',
          backgroundColor: theme.palette.grey[50],
          marginRight: { md: sidebarOpen ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Breadcrumb />
        <Box sx={{ flex: 1, minHeight: 'calc(100vh - 140px)' }}>
          {children}
        </Box>
        <Footer compact />
      </Box>
    </Box>
  );
};

export default MainLayout;
