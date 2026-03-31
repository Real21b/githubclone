import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, Typography, Link } from '@mui/material';
import { GitHub as GitHubIcon } from '@mui/icons-material';

const FOOTER_LINKS = [
  { label: 'Terms', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Security', href: '#' },
  { label: 'Contact', href: '#' },
];

const AuthLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#0d1117',
        px: 2,
      }}
    >
      {/* Logo */}
      <GitHubIcon
        onClick={() => navigate('/')}
        sx={{
          fontSize: 48,
          color: '#e6edf3',
          mb: 3,
          cursor: 'pointer',
          '&:hover': { color: '#8b949e' },
        }}
      />

      {/* Auth card */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 340,
          bgcolor: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '6px',
          p: 3,
          mb: 2,
        }}
      >
        <Outlet />
      </Box>

      {/* Secondary card (e.g. "New to GitHub? Create an account.") */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 340,
          border: '1px solid #30363d',
          borderRadius: '6px',
          p: 2,
          textAlign: 'center',
          mb: 4,
        }}
      >
        <Typography sx={{ fontSize: 14, color: '#e6edf3' }}>
          New to GitHub Clone?{' '}
          <Link
            onClick={() => navigate('/auth/register')}
            sx={{
              color: '#58a6ff',
              cursor: 'pointer',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Create an account
          </Link>
          .
        </Typography>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 2,
          pb: 4,
        }}
      >
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            sx={{
              fontSize: 12,
              color: '#58a6ff',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {link.label}
          </Link>
        ))}
        <Typography sx={{ fontSize: 12, color: '#8b949e' }}>
          © {new Date().getFullYear()} GitHub Clone
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthLayout;
