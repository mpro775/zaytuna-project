import React, { useMemo } from 'react';
import {
  Chip,
  Box,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Table, type Column, type Action } from '@/components/ui/Table';
import { type StockItem } from '@/services/inventory';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface InventoryTableProps {
  data: StockItem[];
  loading?: boolean;
  onEdit?: (stockItem: StockItem) => void;
  onDelete?: (stockItem: StockItem) => void;
  onAdjustStock?: (stockItem: StockItem) => void;
  onViewMovements?: (stockItem: StockItem) => void;
  onTransfer?: (stockItem: StockItem) => void;
  showActions?: boolean;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  data,
  loading = false,
  onEdit,
  onDelete,
  onAdjustStock,
  onViewMovements,
  onTransfer,
  showActions = true,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const columns: Column<StockItem>[] = useMemo(() => [
    {
      id: 'productVariant',
      label: t('inventory.table.product', 'المنتج'),
      minWidth: 200,
      render: (_value: unknown, row: StockItem) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.productVariant.product.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.productVariant.name}
            {row.productVariant.sku && ` (${row.productVariant.sku})`}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'warehouse',
      label: t('inventory.table.warehouse', 'المخزن'),
      minWidth: 150,
      render: (_value: unknown, row: StockItem) => (
        <Box>
          <Typography variant="body2">{row.warehouse.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.warehouse.code}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'quantity',
      label: t('inventory.table.quantity', 'الكمية'),
      align: 'center',
      minWidth: 100,
      render: (value: unknown, row: StockItem) => {
        const quantity = typeof value === 'number' ? value : row.quantity;
        const isLowStock = row.isLowStock;
        const isOutOfStock = quantity === 0;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: isOutOfStock ? 'error.main' : isLowStock ? 'warning.main' : 'success.main',
              }}
            >
              {quantity}
            </Typography>
            {isOutOfStock && <ErrorIcon color="error" fontSize="small" />}
            {isLowStock && !isOutOfStock && <WarningIcon color="warning" fontSize="small" />}
          </Box>
        );
      },
    },
    {
      id: 'stockLevels',
      label: t('inventory.table.stockLevels', 'مستويات المخزون'),
      align: 'center',
      minWidth: 150,
      render: (_value: unknown, row: StockItem) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
          <Chip
            label={`${t('inventory.table.min', 'الحد الأدنى')}: ${row.minStock}`}
            size="small"
            variant="outlined"
            color="info"
          />
          <Chip
            label={`${t('inventory.table.max', 'الحد الأقصى')}: ${row.maxStock}`}
            size="small"
            variant="outlined"
            color="secondary"
          />
        </Box>
      ),
    },
    {
      id: 'status',
      label: t('inventory.table.status', 'الحالة'),
      align: 'center',
      minWidth: 120,
      render: (_value: unknown, row: StockItem) => {
        let statusColor: 'success' | 'warning' | 'error' = 'success';
        let statusLabel = t('inventory.status.normal', 'طبيعي');

        if (row.quantity === 0) {
          statusColor = 'error';
          statusLabel = t('inventory.status.outOfStock', 'نفد المخزون');
        } else if (row.isLowStock) {
          statusColor = 'warning';
          statusLabel = t('inventory.status.lowStock', 'مخزون منخفض');
        } else if (row.isOverStock) {
          statusColor = 'warning';
          statusLabel = t('inventory.status.overStock', 'مخزون زائد');
        }

        return (
          <Chip
            label={statusLabel}
            size="small"
            color={statusColor}
            variant="filled"
          />
        );
      },
    },
    {
      id: 'updatedAt',
      label: t('inventory.table.lastUpdated', 'آخر تحديث'),
      align: 'center',
      minWidth: 120,
      render: (value: unknown, row: StockItem) => {
        const dateValue = typeof value === 'string' ? value : row.updatedAt;
        const formatOptions = isRTL ? { locale: ar } : {};
        return (
          <Typography variant="caption" color="text.secondary">
            {format(new Date(dateValue), 'dd/MM/yyyy', formatOptions)}
          </Typography>
        );
      },
    },
  ], [t, isRTL]);

  const actions: Action<StockItem>[] = useMemo(() => {
    if (!showActions) return [];

    const actionList: Action<StockItem>[] = [];

    if (onAdjustStock) {
      actionList.push({
        id: 'adjust-stock',
        label: t('inventory.actions.adjustStock', 'تعديل المخزون'),
        icon: <AddIcon fontSize="small" />,
        color: 'primary',
        onClick: (row) => onAdjustStock!(row),
      });
    }

    if (onViewMovements) {
      actionList.push({
        id: 'view-movements',
        label: t('inventory.actions.viewMovements', 'عرض الحركات'),
        icon: <RemoveIcon fontSize="small" />,
        color: 'info',
        onClick: (row) => onViewMovements!(row),
      });
    }

    if (onTransfer) {
      actionList.push({
        id: 'transfer',
        label: t('inventory.actions.transfer', 'نقل المخزون'),
        icon: <RemoveIcon fontSize="small" />,
        color: 'secondary',
        onClick: (row) => onTransfer!(row),
      });
    }

    if (onEdit) {
      actionList.push({
        id: 'edit',
        label: t('common.actions.edit', 'تعديل'),
        icon: <EditIcon fontSize="small" />,
        color: 'primary',
        onClick: (row) => onEdit!(row),
      });
    }

    if (onDelete) {
      actionList.push({
        id: 'delete',
        label: t('common.actions.delete', 'حذف'),
        icon: <DeleteIcon fontSize="small" />,
        color: 'error',
        onClick: (row) => onDelete!(row),
      });
    }

    return actionList;
  }, [showActions, onAdjustStock, onViewMovements, onTransfer, onEdit, onDelete, t]);

  return (
    <Table<StockItem>
      columns={columns}
      data={data}
      loading={loading}
      actions={actions}
      emptyMessage={t('inventory.table.noData', 'لا توجد عناصر مخزون')}
      stickyHeader
      maxHeight={600}
    />
  );
};

export default InventoryTable;
