import { Box, Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SearchOffIcon from '@mui/icons-material/SearchOff';

const MotionBox = motion(Box);

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        bgcolor: '#0d1117',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e6edf3',
      }}
    >
      <Container maxWidth="sm">
        <MotionBox
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          sx={{ textAlign: 'center' }}
        >
          <SearchOffIcon
            sx={{
              fontSize: 80,
              color: '#30363d',
              mb: 2,
            }}
          />

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '6rem', md: '8rem' },
              fontWeight: 800,
              lineHeight: 1,
              mb: 2,
              background: 'linear-gradient(180deg, #e6edf3 0%, #484f58 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontWeight: 600, mb: 1.5, color: '#e6edf3' }}
          >
            This is not the page you&apos;re looking for
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: '#8b949e', mb: 4, maxWidth: 400, mx: 'auto', lineHeight: 1.6 }}
          >
            The page you requested could not be found. It may have been moved, deleted, or
            never existed in the first place.
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/')}
            sx={{
              bgcolor: '#238636',
              color: '#fff',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': { bgcolor: '#2ea043' },
            }}
          >
            Take me home
          </Button>

          <Typography
            variant="body2"
            sx={{ color: '#484f58', mt: 5, fontSize: '0.8rem' }}
          >
            If you believe this is a mistake, please contact support.
          </Typography>
        </MotionBox>
      </Container>
    </Box>
  );
}
