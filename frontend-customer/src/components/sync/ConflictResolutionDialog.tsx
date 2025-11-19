import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import type { Conflict } from '../../services/sync';
import type { ConflictAnalysis, ConflictDifference } from '@/services/sync/types';

interface ConflictResolutionDialogProps {
  open: boolean;
  onClose: () => void;
  conflict: Conflict | null;
  analysis: ConflictAnalysis | null;
  onResolve: (resolution: {
    strategy: 'local' | 'server' | 'merge' | 'manual';
    resolvedData?: unknown;
    notes?: string;
  }) => void;
}

export const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  open,
  onClose,
  conflict,
  analysis,
  onResolve,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<'local' | 'server' | 'merge' | 'manual'>(() => 
    analysis?.recommendedAction ?? 'manual'
  );
  const [mergeData, setMergeData] = useState<Record<string, unknown>>(() => 
    analysis ? { ...(analysis.serverVersion as Record<string, unknown>) } : {}
  );
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    if (analysis && (analysis.recommendedAction !== selectedStrategy || JSON.stringify(analysis.serverVersion) !== JSON.stringify(mergeData))) {
      setSelectedStrategy(analysis.recommendedAction);
      setMergeData({ ...(analysis.serverVersion as Record<string, unknown>) });
    }
    // React Hook useEffect syncs props to state when dialog opens with new conflict
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon color="error" />;
      case 'high': return <WarningIcon color="warning" />;
      case 'medium': return <InfoIcon color="info" />;
      default: return <InfoIcon color="action" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const renderDifferences = (differences: ConflictDifference[]) => {
    return (
      <List dense>
        {differences.map((diff, index) => (
          <ListItem key={index} divider={index < differences.length - 1}>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {diff.field}
                  </Typography>
                  <Chip
                    label={diff.type.replace('_', ' ')}
                    size="small"
                    color={getSeverityColor(diff.significance)}
                    variant="outlined"
                  />
                  <Chip
                    label={diff.fieldCategory}
                    size="small"
                    variant="filled"
                  />
                </Box>
              }
              secondary={
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    محلي: {JSON.stringify(diff.localValue)}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    خادم: {JSON.stringify(diff.serverValue)}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  };

  const renderStrategyOptions = () => {
    const options = [
      {
        value: 'local',
        label: 'اختيار النسخة المحلية',
        description: 'سيتم الاحتفاظ بالتغييرات المحلية وتجاهل التغييرات من الخادم',
        recommended: analysis?.recommendedAction === 'local',
      },
      {
        value: 'server',
        label: 'اختيار نسخة الخادم',
        description: 'سيتم الاحتفاظ ببيانات الخادم وتجاهل التغييرات المحلية',
        recommended: analysis?.recommendedAction === 'server',
      },
      {
        value: 'merge',
        label: 'دمج البيانات',
        description: 'دمج التغييرات من كلا النسختين (متاح لبعض أنواع البيانات)',
        disabled: analysis?.recommendedAction === 'manual',
        recommended: analysis?.recommendedAction === 'merge',
      },
      {
        value: 'manual',
        label: 'حل يدوي',
        description: 'قم بتحرير البيانات المدمجة يدوياً',
        recommended: analysis?.recommendedAction === 'manual',
      },
    ];

    return (
      <RadioGroup
        value={selectedStrategy}
        onChange={(e) => setSelectedStrategy(e.target.value as 'local' | 'server' | 'merge' | 'manual')}
      >
        {options.map((option) => (
          <Paper
            key={option.value}
            sx={{
              p: 2,
              mb: 1,
              border: option.recommended ? '2px solid' : '1px solid',
              borderColor: option.recommended ? 'primary.main' : 'divider',
              bgcolor: option.recommended ? 'primary.50' : 'background.paper',
            }}
          >
            <FormControlLabel
              value={option.value}
              control={<Radio />}
              label={
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">
                      {option.label}
                    </Typography>
                    {option.recommended && (
                      <Chip label="موصى به" size="small" color="primary" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {option.description}
                  </Typography>
                </Box>
              }
              disabled={option.disabled ?? false}
              sx={{ width: '100%', alignItems: 'flex-start' }}
            />
          </Paper>
        ))}
      </RadioGroup>
    );
  };

  const handleResolve = () => {
    let resolvedData = undefined;

    if (selectedStrategy === 'local') {
      resolvedData = conflict?.localVersion;
    } else if (selectedStrategy === 'server') {
      resolvedData = conflict?.serverVersion;
    } else if (selectedStrategy === 'merge') {
      resolvedData = mergeData;
    } else if (selectedStrategy === 'manual') {
      resolvedData = mergeData;
    }

    onResolve({
      strategy: selectedStrategy,
      resolvedData,
      notes: resolutionNotes,
    });

    onClose();
  };

  if (!conflict || !analysis) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getSeverityIcon(analysis.severity)}
          <Typography variant="h6">
            حل تضارب البيانات
          </Typography>
          <Chip
            label={analysis.severity}
            color={getSeverityColor(analysis.severity)}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            {conflict.entity}: {conflict.entityId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            تم اكتشاف تضارب في البيانات بين النسخة المحلية والنسخة على الخادم
          </Typography>
        </Box>

        {/* معلومات المخاطر */}
        <Alert
          severity={analysis.severity === 'critical' ? 'error' : 'warning'}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            <strong>المخاطر:</strong>
          </Typography>
          <Typography variant="body2">
            • فقدان بيانات: {analysis.riskAssessment.dataLoss === 'none' ? 'لا يوجد' :
              analysis.riskAssessment.dataLoss === 'low' ? 'منخفض' :
              analysis.riskAssessment.dataLoss === 'medium' ? 'متوسط' : 'عالي'}
          </Typography>
          <Typography variant="body2">
            • تأثير على الأعمال: {analysis.riskAssessment.businessImpact === 'none' ? 'لا يوجد' :
              analysis.riskAssessment.businessImpact === 'low' ? 'منخفض' :
              analysis.riskAssessment.businessImpact === 'medium' ? 'متوسط' : 'عالي'}
          </Typography>
          <Typography variant="body2">
            • تأثير على المستخدم: {analysis.riskAssessment.userImpact === 'none' ? 'لا يوجد' :
              analysis.riskAssessment.userImpact === 'low' ? 'منخفض' :
              analysis.riskAssessment.userImpact === 'medium' ? 'متوسط' : 'عالي'}
          </Typography>
        </Alert>

        {/* الاختلافات */}
        <Accordion defaultExpanded sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              تفاصيل الاختلافات ({analysis.differences.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderDifferences(analysis.differences)}
          </AccordionDetails>
        </Accordion>

        {/* خيارات الحل */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            اختر طريقة الحل
          </Typography>
          {renderStrategyOptions()}
        </Box>

        {/* محرر البيانات للحل اليدوي */}
        {selectedStrategy === 'manual' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              تحرير البيانات المدمجة
            </Typography>
            <TextField
              multiline
              rows={10}
              fullWidth
              value={JSON.stringify(mergeData, null, 2)}
              onChange={(e) => {
                try {
                  setMergeData(JSON.parse(e.target.value));
                } catch (error: unknown) {
                  console.error(error);
                  // تجاهل الأخطاء أثناء الكتابة
                }
              }}
              sx={{ fontFamily: 'monospace' }}
            />
          </Box>
        )}

        {/* ملاحظات الحل */}
        <TextField
          label="ملاحظات الحل (اختياري)"
          multiline
          rows={2}
          fullWidth
          value={resolutionNotes}
          onChange={(e) => setResolutionNotes(e.target.value)}
          placeholder="أضف ملاحظات حول سبب اختيار هذا الحل..."
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          إلغاء
        </Button>
        <Button
          onClick={handleResolve}
          variant="contained"
          startIcon={<CheckCircleIcon />}
        >
          حل التضارب
        </Button>
      </DialogActions>
    </Dialog>
  );
};
