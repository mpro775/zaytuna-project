import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Collapse,
  Divider,
  Tooltip,
  Autocomplete,
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Save as SaveIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Download as ExportIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// ============================================
// Types
// ============================================

export type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in' | 'notIn';

export interface FilterField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'select' | 'multiselect' | 'boolean' | 'autocomplete';
  operators?: FilterOperator[];
  options?: { value: string; label: string }[];
  fetchOptions?: () => Promise<{ value: string; label: string }[]>;
  defaultOperator?: FilterOperator;
  placeholder?: string;
}

export interface FilterCondition {
  fieldId: string;
  operator: FilterOperator;
  value: unknown;
  value2?: unknown; // For 'between' operator
}

export interface SavedFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
  isDefault?: boolean;
}

export interface AdvancedFiltersProps {
  fields: FilterField[];
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (name: string, conditions: FilterCondition[]) => void;
  onDeleteFilter?: (filterId: string) => void;
  onApplyFilter?: (filter: SavedFilter) => void;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  showQuickFilters?: boolean;
  quickFilters?: { label: string; conditions: FilterCondition[] }[];
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

// ============================================
// Operator Labels
// ============================================

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'يساوي',
  contains: 'يحتوي',
  startsWith: 'يبدأ بـ',
  endsWith: 'ينتهي بـ',
  gt: 'أكبر من',
  gte: 'أكبر من أو يساوي',
  lt: 'أقل من',
  lte: 'أقل من أو يساوي',
  between: 'بين',
  in: 'ضمن',
  notIn: 'ليس ضمن',
};

const getDefaultOperators = (type: FilterField['type']): FilterOperator[] => {
  switch (type) {
    case 'text':
      return ['equals', 'contains', 'startsWith', 'endsWith'];
    case 'number':
      return ['equals', 'gt', 'gte', 'lt', 'lte', 'between'];
    case 'date':
    case 'datetime':
      return ['equals', 'gt', 'gte', 'lt', 'lte', 'between'];
    case 'select':
      return ['equals'];
    case 'multiselect':
      return ['in', 'notIn'];
    case 'boolean':
      return ['equals'];
    case 'autocomplete':
      return ['equals', 'in'];
    default:
      return ['equals'];
  }
};

// ============================================
// Filter Row Component
// ============================================

interface FilterRowProps {
  fields: FilterField[];
  condition: FilterCondition;
  onChange: (condition: FilterCondition) => void;
  onRemove: () => void;
}

const FilterRow: React.FC<FilterRowProps> = ({
  fields,
  condition,
  onChange,
  onRemove,
}) => {
  const { t } = useTranslation();
  const field = fields.find((f) => f.id === condition.fieldId);
  const operators = field?.operators || getDefaultOperators(field?.type || 'text');

  const renderValueInput = () => {
    if (!field) return null;

    const commonProps = {
      size: 'small' as const,
      fullWidth: true,
      value: condition.value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        onChange({ ...condition, value: e.target.value }),
    };

    switch (field.type) {
      case 'text':
        return <TextField {...commonProps} placeholder={field.placeholder || 'أدخل قيمة'} />;

      case 'number':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              {...commonProps}
              type="number"
              placeholder="قيمة"
            />
            {condition.operator === 'between' && (
              <TextField
                size="small"
                type="number"
                fullWidth
                value={condition.value2 || ''}
                onChange={(e) => onChange({ ...condition, value2: e.target.value })}
                placeholder="إلى"
              />
            )}
          </Box>
        );

      case 'date':
      case 'datetime':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              type={field.type === 'datetime' ? 'datetime-local' : 'date'}
              fullWidth
              value={condition.value || ''}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            {condition.operator === 'between' && (
              <TextField
                size="small"
                type={field.type === 'datetime' ? 'datetime-local' : 'date'}
                fullWidth
                value={condition.value2 || ''}
                onChange={(e) => onChange({ ...condition, value2: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            )}
          </Box>
        );

      case 'select':
        return (
          <TextField
            size="small"
            select
            fullWidth
            value={condition.value || ''}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
          >
            {field.options?.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        );

      case 'multiselect':
        return (
          <Autocomplete
            multiple
            size="small"
            options={field.options || []}
            getOptionLabel={(opt) => opt.label}
            value={(field.options || []).filter((opt) =>
              ((condition.value as string[]) || []).includes(opt.value)
            )}
            onChange={(_, newValue) =>
              onChange({ ...condition, value: newValue.map((v) => v.value) })
            }
            renderInput={(params) => (
              <TextField
                id={params.id}
                disabled={params.disabled}
                fullWidth={params.fullWidth}
                InputProps={params.InputProps}
                inputProps={params.inputProps}
                size="small"
                placeholder="اختر..."
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return <Chip key={key} label={option.label} size="small" {...tagProps} />;
              })
            }
          />
        );

      case 'boolean':
        return (
          <TextField
            size="small"
            select
            fullWidth
            value={condition.value === true ? 'true' : condition.value === false ? 'false' : ''}
            onChange={(e) => onChange({ ...condition, value: e.target.value === 'true' })}
          >
            <MenuItem value="true">{t('common.yes', 'نعم')}</MenuItem>
            <MenuItem value="false">{t('common.no', 'لا')}</MenuItem>
          </TextField>
        );

      case 'autocomplete':
        return (
          <Autocomplete
            size="small"
            options={field.options || []}
            getOptionLabel={(opt) => opt.label}
            value={field.options?.find((opt) => opt.value === condition.value) || null}
            onChange={(_, newValue) => onChange({ ...condition, value: newValue?.value || '' })}
            renderInput={(params) => (
              <TextField
                id={params.id}
                disabled={params.disabled}
                fullWidth={params.fullWidth}
                InputProps={params.InputProps}
                inputProps={params.inputProps}
                size="small"
                placeholder={field.placeholder ?? 'اختر...'}
              />
            )}
          />
        );

      default:
        return <TextField {...commonProps} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1.5 }}>
      {/* Field Selection */}
      <TextField
        size="small"
        select
        sx={{ minWidth: 150 }}
        value={condition.fieldId}
        onChange={(e) =>
          onChange({
            ...condition,
            fieldId: e.target.value,
            operator: 'equals',
            value: '',
            value2: undefined,
          })
        }
      >
        {fields.map((f) => (
          <MenuItem key={f.id} value={f.id}>
            {f.label}
          </MenuItem>
        ))}
      </TextField>

      {/* Operator Selection */}
      <TextField
        size="small"
        select
        sx={{ minWidth: 120 }}
        value={condition.operator}
        onChange={(e) =>
          onChange({ ...condition, operator: e.target.value as FilterOperator })
        }
      >
        {operators.map((op) => (
          <MenuItem key={op} value={op}>
            {OPERATOR_LABELS[op]}
          </MenuItem>
        ))}
      </TextField>

      {/* Value Input */}
      <Box sx={{ flexGrow: 1, minWidth: 200 }}>{renderValueInput()}</Box>

      {/* Remove Button */}
      <IconButton size="small" color="error" onClick={onRemove}>
        <DeleteIcon />
      </IconButton>
    </Box>
  );
};

// ============================================
// Main Component
// ============================================

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  fields,
  conditions,
  onChange,
  savedFilters = [],
  onSaveFilter,
  onDeleteFilter,
  onApplyFilter,
  onExport,
  showQuickFilters = true,
  quickFilters = [],
  title,
  collapsible = true,
  defaultExpanded = true,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [savedFilterMenuAnchor, setSavedFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  const handleAddCondition = useCallback(() => {
    const newCondition: FilterCondition = {
      fieldId: fields[0]?.id || '',
      operator: 'equals',
      value: '',
    };
    onChange([...conditions, newCondition]);
  }, [conditions, fields, onChange]);

  const handleRemoveCondition = useCallback(
    (index: number) => {
      const newConditions = conditions.filter((_, i) => i !== index);
      onChange(newConditions);
    },
    [conditions, onChange]
  );

  const handleUpdateCondition = useCallback(
    (index: number, condition: FilterCondition) => {
      const newConditions = [...conditions];
      newConditions[index] = condition;
      onChange(newConditions);
    },
    [conditions, onChange]
  );

  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const handleSaveFilter = () => {
    if (newFilterName && onSaveFilter) {
      onSaveFilter(newFilterName, conditions);
      setNewFilterName('');
      setSaveDialogOpen(false);
    }
  };

  const handleApplyQuickFilter = (filterConditions: FilterCondition[]) => {
    onChange(filterConditions);
  };

  const activeFiltersCount = conditions.filter((c) => c.value !== '' && c.value !== undefined).length;

  return (
    <Paper sx={{ mb: 3 }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: collapsible ? 'pointer' : 'default',
        }}
        onClick={collapsible ? () => setExpanded(!expanded) : undefined}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title || t('filters.advanced', 'الفلاتر المتقدمة')}
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip
              label={`${activeFiltersCount} ${t('filters.active', 'نشط')}`}
              size="small"
              color="primary"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <Tooltip title={t('filters.savedFilters', 'الفلاتر المحفوظة')}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSavedFilterMenuAnchor(e.currentTarget);
                }}
              >
                <BookmarkIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Save Filter */}
          {onSaveFilter && conditions.length > 0 && (
            <Tooltip title={t('filters.saveFilter', 'حفظ الفلتر')}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSaveDialogOpen(true);
                }}
              >
                <BookmarkBorderIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Export */}
          {onExport && (
            <Tooltip title={t('common.export', 'تصدير')}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setExportMenuAnchor(e.currentTarget);
                }}
              >
                <ExportIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Clear All */}
          {conditions.length > 0 && (
            <Tooltip title={t('filters.clearAll', 'مسح الكل')}>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Expand/Collapse */}
          {collapsible && (
            <IconButton size="small">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Quick Filters */}
      {showQuickFilters && quickFilters.length > 0 && (
        <>
          <Divider />
          <Box sx={{ px: 2, py: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              {t('filters.quickFilters', 'فلاتر سريعة')}:
            </Typography>
            {quickFilters.map((qf, index) => (
              <Chip
                key={index}
                label={qf.label}
                variant="outlined"
                size="small"
                onClick={() => handleApplyQuickFilter(qf.conditions)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </>
      )}

      {/* Filter Conditions */}
      <Collapse in={expanded || !collapsible}>
        <Divider />
        <Box sx={{ p: 2 }}>
          {conditions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              {t('filters.noFilters', 'لا توجد فلاتر. اضغط على "إضافة فلتر" للبدء.')}
            </Typography>
          ) : (
            conditions.map((condition, index) => (
              <FilterRow
                key={index}
                fields={fields}
                condition={condition}
                onChange={(c) => handleUpdateCondition(index, c)}
                onRemove={() => handleRemoveCondition(index)}
              />
            ))
          )}

          {/* Add Filter Button */}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddCondition}
            size="small"
            sx={{ mt: 1 }}
          >
            {t('filters.addFilter', 'إضافة فلتر')}
          </Button>
        </Box>
      </Collapse>

      {/* Saved Filters Menu */}
      <Menu
        anchorEl={savedFilterMenuAnchor}
        open={Boolean(savedFilterMenuAnchor)}
        onClose={() => setSavedFilterMenuAnchor(null)}
      >
        {savedFilters.map((filter) => (
          <MenuItem
            key={filter.id}
            onClick={() => {
              onApplyFilter?.(filter);
              setSavedFilterMenuAnchor(null);
            }}
          >
            <ListItemIcon>
              <BookmarkIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={filter.name} />
            {onDeleteFilter && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFilter(filter.id);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </MenuItem>
        ))}
      </Menu>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={() => { onExport?.('csv'); setExportMenuAnchor(null); }}>
          {t('export.csv', 'CSV')}
        </MenuItem>
        <MenuItem onClick={() => { onExport?.('excel'); setExportMenuAnchor(null); }}>
          {t('export.excel', 'Excel')}
        </MenuItem>
        <MenuItem onClick={() => { onExport?.('pdf'); setExportMenuAnchor(null); }}>
          {t('export.pdf', 'PDF')}
        </MenuItem>
      </Menu>

      {/* Save Filter Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('filters.saveFilter', 'حفظ الفلتر')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('filters.filterName', 'اسم الفلتر')}
            value={newFilterName}
            onChange={(e) => setNewFilterName(e.target.value)}
            sx={{ mt: 2 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>{t('common.cancel', 'إلغاء')}</Button>
          <Button
            variant="contained"
            onClick={handleSaveFilter}
            disabled={!newFilterName}
            startIcon={<SaveIcon />}
          >
            {t('common.save', 'حفظ')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AdvancedFilters;
