import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CompanySettings } from './CompanySettings';
import { SystemSettings } from './SystemSettings';
import { SecuritySettings } from './SecuritySettings';
import { BackupSettings } from './BackupSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }} dir={isRTL ? 'rtl' : 'ltr'}>
        <Typography color="text.primary">
          {t('settings.title', 'إعدادات النظام')}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('settings.title', 'إعدادات النظام')}
        </Typography>
      </Box>

      {/* Settings Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <Tab
              icon={<BusinessIcon />}
              label={t('settings.tabs.company', 'الشركة')}
              {...a11yProps(0)}
            />
            <Tab
              icon={<SettingsIcon />}
              label={t('settings.tabs.system', 'النظام')}
              {...a11yProps(1)}
            />
            <Tab
              icon={<SecurityIcon />}
              label={t('settings.tabs.security', 'الأمان')}
              {...a11yProps(2)}
            />
            <Tab
              icon={<BackupIcon />}
              label={t('settings.tabs.backup', 'النسخ الاحتياطي')}
              {...a11yProps(3)}
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <CompanySettings />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <SystemSettings />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <SecuritySettings />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <BackupSettings />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings;
