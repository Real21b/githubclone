import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, IconButton, Typography, InputBase, Avatar,
  Menu, MenuItem, Divider, Badge, Tooltip, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, useMediaQuery, useTheme, Container, alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  BugReport as IssuesIcon,
  MergeType as PullRequestIcon,
  Explore as ExploreIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const NAV_LINKS = [
  { label: 'Pull Requests', path: '/app/pulls', icon: <PullRequestIcon fontSize="small" /> },
  { label: 'Issues', path: '/app/issues', icon: <IssuesIcon fontSize="small" /> },
  { label: 'Marketplace', path: '/app/marketplace', icon: <CodeIcon fontSize="small" /> },
  { label: 'Explore', path: '/app/explore', icon: <ExploreIcon fontSize="small" /> },
];

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createAnchorEl, setCreateAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const userMenuOpen = Boolean(anchorEl);
  const createMenuOpen = Boolean(createAnchorEl);

  const handleUserMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleUserMenuClose = () => setAnchorEl(null);
  const handleCreateMenuOpen = (e: React.MouseEvent<HTMLElement>) => setCreateAnchorEl(e.currentTarget);
  const handleCreateMenuClose = () => setCreateAnchorEl(null);

  const handleNavigate = (path: string) => {
    navigate(path);
    handleUserMenuClose();
    handleCreateMenuClose();
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/auth/login');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/app/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const userInitial = user?.username?.charAt(0).toUpperCase() ?? '?';

  /* ---- Mobile Drawer ---- */
  const mobileDrawer = (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      PaperProps={{
        sx: {
          width: 260,
          bgcolor: '#161b22',
          borderRight: '1px solid #30363d',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <GitHubIcon sx={{ color: '#e6edf3', fontSize: 28 }} />
        <Typography variant="subtitle1" sx={{ color: '#e6edf3', fontWeight: 600 }}>
          GitHub Clone
        </Typography>
      </Box>
      <Divider sx={{ borderColor: '#30363d' }} />
      <List sx={{ px: 1 }}>
        <ListItemButton
          onClick={() => handleNavigate('/app/dashboard')}
          selected={location.pathname === '/app/dashboard'}
          sx={drawerItemSx}
        >
          <ListItemIcon sx={{ color: '#8b949e', minWidth: 36 }}>
            <DashboardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Dashboard" primaryTypographyProps={{ fontSize: 14 }} />
        </ListItemButton>

        {NAV_LINKS.map((link) => (
          <ListItemButton
            key={link.path}
            onClick={() => handleNavigate(link.path)}
            selected={location.pathname.startsWith(link.path)}
            sx={drawerItemSx}
          >
            <ListItemIcon sx={{ color: '#8b949e', minWidth: 36 }}>
              {link.icon}
            </ListItemIcon>
            <ListItemText primary={link.label} primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ borderColor: '#30363d' }} />
      <List sx={{ px: 1 }}>
        <ListItemButton onClick={() => handleNavigate('/app/profile')} sx={drawerItemSx}>
          <ListItemIcon sx={{ color: '#8b949e', minWidth: 36 }}>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profile" primaryTypographyProps={{ fontSize: 14 }} />
        </ListItemButton>
        <ListItemButton onClick={() => handleNavigate('/app/settings')} sx={drawerItemSx}>
          <ListItemIcon sx={{ color: '#8b949e', minWidth: 36 }}>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: 14 }} />
        </ListItemButton>
        <ListItemButton onClick={handleLogout} sx={drawerItemSx}>
          <ListItemIcon sx={{ color: '#da3633', minWidth: 36 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Sign out"
            primaryTypographyProps={{ fontSize: 14, color: '#da3633' }}
          />
        </ListItemButton>
      </List>
    </Drawer>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#0d1117' }}>
      {/* ---- Top Navigation Bar ---- */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: '#161b22',
          borderBottom: '1px solid #30363d',
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: 48, sm: 56 } }}>
          {/* Hamburger – mobile only */}
          {isMobile && (
            <IconButton
              size="small"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ color: '#e6edf3' }}
              aria-label="open navigation menu"
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <IconButton
            size="small"
            onClick={() => handleNavigate('/app/dashboard')}
            sx={{ color: '#e6edf3', '&:hover': { color: '#8b949e' } }}
            aria-label="home"
          >
            <GitHubIcon sx={{ fontSize: 28 }} />
          </IconButton>

          {/* Desktop nav links */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
              {NAV_LINKS.map((link) => (
                <Typography
                  key={link.path}
                  onClick={() => handleNavigate(link.path)}
                  sx={{
                    px: 1,
                    py: 0.5,
                    fontSize: 14,
                    fontWeight: location.pathname.startsWith(link.path) ? 600 : 400,
                    color: '#e6edf3',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    '&:hover': { bgcolor: alpha('#e6edf3', 0.08) },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Box>
          )}

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Search bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: '6px',
              px: 1.5,
              py: 0.25,
              width: isMobile ? 160 : 280,
              transition: 'width 0.2s',
              '&:focus-within': {
                width: isMobile ? 200 : 380,
                borderColor: '#58a6ff',
              },
            }}
          >
            <SearchIcon sx={{ color: '#8b949e', fontSize: 18, mr: 0.5 }} />
            <InputBase
              placeholder="Search or jump to…"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              sx={{
                flex: 1,
                color: '#e6edf3',
                fontSize: 14,
                '& input::placeholder': { color: '#8b949e', opacity: 1 },
              }}
              inputProps={{ 'aria-label': 'search' }}
            />
            {!isMobile && (
              <Box
                sx={{
                  border: '1px solid #30363d',
                  borderRadius: '4px',
                  px: 0.5,
                  fontSize: 11,
                  color: '#8b949e',
                  lineHeight: '18px',
                  ml: 0.5,
                  whiteSpace: 'nowrap',
                }}
              >
                {navigator.platform?.toUpperCase().includes('MAC') ? '⌘K' : 'Ctrl+K'}
              </Box>
            )}
          </Box>

          {/* Action icons */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, gap: 0.5 }}>
            {/* New repo / create */}
            <Tooltip title="Create new…">
              <IconButton
                size="small"
                onClick={handleCreateMenuOpen}
                sx={{ color: '#e6edf3', '&:hover': { color: '#8b949e' } }}
                aria-label="create new"
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                size="small"
                onClick={() => handleNavigate('/app/notifications')}
                sx={{ color: '#e6edf3', '&:hover': { color: '#8b949e' } }}
                aria-label="notifications"
              >
                <Badge
                  variant="dot"
                  color="info"
                  sx={{ '& .MuiBadge-dot': { bgcolor: '#58a6ff' } }}
                >
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User avatar */}
            <Tooltip title={user?.username ?? 'Account'}>
              <IconButton
                size="small"
                onClick={handleUserMenuOpen}
                sx={{ ml: 0.5 }}
                aria-label="user menu"
              >
                <Avatar
                  src={user?.avatar}
                  alt={user?.username}
                  sx={{ width: 28, height: 28, fontSize: 14, bgcolor: '#30363d', color: '#e6edf3' }}
                >
                  {userInitial}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ---- Create Menu ---- */}
      <Menu
        anchorEl={createAnchorEl}
        open={createMenuOpen}
        onClose={handleCreateMenuClose}
        PaperProps={{ sx: menuPaperSx }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleNavigate('/app/new')} sx={menuItemSx}>
          <CodeIcon fontSize="small" sx={{ mr: 1, color: '#8b949e' }} />
          New repository
        </MenuItem>
        <MenuItem onClick={() => handleNavigate('/app/import')} sx={menuItemSx}>
          <AddIcon fontSize="small" sx={{ mr: 1, color: '#8b949e' }} />
          Import repository
        </MenuItem>
      </Menu>

      {/* ---- User Menu ---- */}
      <Menu
        anchorEl={anchorEl}
        open={userMenuOpen}
        onClose={handleUserMenuClose}
        PaperProps={{ sx: menuPaperSx }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>
            {user?.username ?? 'User'}
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#8b949e' }}>
            {user?.email ?? ''}
          </Typography>
        </Box>
        <Divider sx={{ borderColor: '#30363d' }} />
        <MenuItem onClick={() => handleNavigate('/app/profile')} sx={menuItemSx}>
          <PersonIcon fontSize="small" sx={{ mr: 1, color: '#8b949e' }} />
          Your profile
        </MenuItem>
        <MenuItem onClick={() => handleNavigate('/app/dashboard')} sx={menuItemSx}>
          <DashboardIcon fontSize="small" sx={{ mr: 1, color: '#8b949e' }} />
          Dashboard
        </MenuItem>
        <Divider sx={{ borderColor: '#30363d' }} />
        <MenuItem onClick={() => handleNavigate('/app/settings')} sx={menuItemSx}>
          <SettingsIcon fontSize="small" sx={{ mr: 1, color: '#8b949e' }} />
          Settings
        </MenuItem>
        <Divider sx={{ borderColor: '#30363d' }} />
        <MenuItem onClick={handleLogout} sx={{ ...menuItemSx, color: '#da3633' }}>
          <LogoutIcon fontSize="small" sx={{ mr: 1, color: '#da3633' }} />
          Sign out
        </MenuItem>
      </Menu>

      {/* ---- Mobile Drawer ---- */}
      {mobileDrawer}

      {/* ---- Main Content ---- */}
      <Box component="main" sx={{ flex: 1 }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

/* ---- Reusable style objects ---- */
const menuPaperSx = {
  bgcolor: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '12px',
  minWidth: 200,
  mt: 0.5,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
} as const;

const menuItemSx = {
  fontSize: 14,
  color: '#e6edf3',
  px: 2,
  py: 0.75,
  '&:hover': { bgcolor: 'rgba(88,166,255,0.1)' },
} as const;

const drawerItemSx = {
  borderRadius: '6px',
  mb: 0.25,
  color: '#e6edf3',
  '&.Mui-selected': { bgcolor: 'rgba(88,166,255,0.15)', color: '#58a6ff' },
  '&:hover': { bgcolor: 'rgba(88,166,255,0.08)' },
} as const;

export default Layout;
