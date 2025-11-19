import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  TreeView,
  TreeItem,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Avatar,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useProducts } from '@/hooks';
import type { Category, CreateCategoryDto } from '@/services/products';

// Validation schema
const categorySchema = z.object({
  name: z.string().min(1, 'اسم الفئة مطلوب').max(100, 'اسم الفئة طويل جداً'),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting,
  } = useProducts();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuCategory, setMenuCategory] = useState<Category | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  // Build category tree
  const buildTree = (parentId?: string): Category[] => {
    return categories
      .filter(cat => cat.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const categoryTree = buildTree();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, category: Category) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuCategory(category);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuCategory(null);
  };

  const handleAddCategory = (parentId?: string) => {
    setSelectedCategory(null);
    setIsEditing(false);
    reset({
      name: '',
      description: '',
      parentId: parentId || '',
    });
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsEditing(true);
    reset({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId || '',
    });
    handleMenuClose();
  };

  const handleDeleteCategory = (category: Category) => {
    if (window.confirm(t('categories.confirmDelete', 'هل أنت متأكد من حذف هذه الفئة؟'))) {
      deleteCategory(category.id);
    }
    handleMenuClose();
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditing && selectedCategory) {
        await updateCategory(selectedCategory.id, {
          ...data,
          isActive: true,
        });
      } else {
        await createCategory({
          ...data,
          sortOrder: categories.length,
        });
      }
      reset();
      setSelectedCategory(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const renderTree = (nodes: Category[]) => {
    return nodes.map((node) => {
      const hasChildren = categories.some(cat => cat.parentId === node.id);

      return (
        <TreeItem
          key={node.id}
          nodeId={node.id}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
              <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                <CategoryIcon sx={{ fontSize: 14 }} />
              </Avatar>
              <Typography variant="body2" sx={{ flex: 1 }}>
                {node.name}
              </Typography>
              {!node.isActive && (
                <Chip
                  label={t('categories.inactive', 'غير نشط')}
                  size="small"
                  color="default"
                  variant="outlined"
                />
              )}
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, node)}
                sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          {hasChildren && renderTree(buildTree(node.id))}
        </TreeItem>
      );
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      dir={t('dir')}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {t('categories.title', 'إدارة الفئات')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleAddCategory()}
          size="small"
        >
          {t('categories.add', 'إضافة فئة')}
        </Button>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', gap: 3, minHeight: 500 }}>
        {/* Categories Tree */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            {t('categories.tree', 'شجرة الفئات')}
          </Typography>

          <TreeView
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            sx={{
              '& .MuiTreeItem-root': {
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              },
            }}
          >
            {renderTree(categoryTree)}
          </TreeView>

          {categories.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <CategoryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="body2">
                {t('categories.noCategories', 'لا توجد فئات')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Category Form */}
        <Box sx={{ flex: 1, borderLeft: 1, borderColor: 'divider', pl: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            {isEditing
              ? t('categories.edit', 'تعديل الفئة')
              : t('categories.add', 'إضافة فئة جديدة')
            }
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label={t('categories.name', 'اسم الفئة')}
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
              size="small"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label={t('categories.description', 'الوصف')}
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message}
              size="small"
            />

            <TextField
              select
              fullWidth
              label={t('categories.parent', 'الفئة الأم')}
              {...register('parentId')}
              size="small"
            >
              <MenuItem value="">
                <em>{t('categories.noParent', 'فئة رئيسية')}</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isCreating || isUpdating}
                sx={{ flex: 1 }}
              >
                {isEditing ? t('common.actions.save', 'حفظ') : t('common.actions.add', 'إضافة')}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  reset();
                  setSelectedCategory(null);
                  setIsEditing(false);
                }}
                disabled={isCreating || isUpdating}
              >
                {t('common.actions.cancel', 'إلغاء')}
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {t('common.actions.close', 'إغلاق')}
        </Button>
      </DialogActions>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuCategory && handleEditCategory(menuCategory)}>
          <EditIcon sx={{ mr: 1 }} />
          {t('common.actions.edit', 'تعديل')}
        </MenuItem>
        <MenuItem onClick={() => menuCategory && handleAddCategory(menuCategory.id)}>
          <AddIcon sx={{ mr: 1 }} />
          {t('categories.addSubcategory', 'إضافة فئة فرعية')}
        </MenuItem>
        <MenuItem
          onClick={() => menuCategory && handleDeleteCategory(menuCategory)}
          disabled={isDeleting}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          {t('common.actions.delete', 'حذف')}
        </MenuItem>
      </Menu>
    </Dialog>
  );
};

export default CategoryManager;
