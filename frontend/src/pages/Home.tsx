import { Box, Container, Typography, Button, Grid, Card, CardContent, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CodeIcon from '@mui/icons-material/Code';
import SecurityIcon from '@mui/icons-material/Security';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import GroupsIcon from '@mui/icons-material/Groups';
import StorageIcon from '@mui/icons-material/Storage';
import PublicIcon from '@mui/icons-material/Public';

const MotionBox = motion(Box);
const MotionTypography = motion(Typography);
const MotionCard = motion(Card);

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const slideUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.15 },
  }),
};

const features = [
  {
    icon: <CodeIcon sx={{ fontSize: 40, color: '#58a6ff' }} />,
    title: 'Collaborative Coding',
    description:
      'Work together on code with pull requests, code review, and inline comments that keep every conversation in context.',
  },
  {
    icon: <RocketLaunchIcon sx={{ fontSize: 40, color: '#58a6ff' }} />,
    title: 'Automation & CI/CD',
    description:
      'Automate your workflow from idea to production with built-in CI/CD, Actions, and package management.',
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40, color: '#58a6ff' }} />,
    title: 'Advanced Security',
    description:
      'Find and fix vulnerabilities before they reach production with native security features built into every step.',
  },
  {
    icon: <GroupsIcon sx={{ fontSize: 40, color: '#58a6ff' }} />,
    title: 'Team Management',
    description:
      'Organize teams, manage permissions, and streamline onboarding so everyone can contribute from day one.',
  },
];

const stats = [
  { value: '100M+', label: 'Developers', icon: <PublicIcon sx={{ fontSize: 32, color: '#8b949e' }} /> },
  { value: '330M+', label: 'Repositories', icon: <StorageIcon sx={{ fontSize: 32, color: '#8b949e' }} /> },
  { value: '4M+', label: 'Organizations', icon: <GroupsIcon sx={{ fontSize: 32, color: '#8b949e' }} /> },
  { value: '90%', label: 'Fortune 100', icon: <SecurityIcon sx={{ fontSize: 32, color: '#8b949e' }} /> },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: '#0d1117', minHeight: '100vh', color: '#e6edf3' }}>
      {/* Hero Section */}
      <Box
        sx={{
          pt: { xs: 10, md: 16 },
          pb: { xs: 8, md: 14 },
          textAlign: 'center',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(88,166,255,0.08) 0%, transparent 60%)',
        }}
      >
        <Container maxWidth="md">
          <MotionTypography
            variant="h1"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem' },
              fontWeight: 800,
              lineHeight: 1.15,
              mb: 3,
              background: 'linear-gradient(180deg, #e6edf3 0%, #8b949e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Where the world builds software
          </MotionTypography>

          <MotionTypography
            variant="h6"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            sx={{ color: '#8b949e', maxWidth: 600, mx: 'auto', mb: 5, fontWeight: 400, lineHeight: 1.6 }}
          >
            Millions of developers and companies build, ship, and maintain their software on our
            platform — the largest and most advanced development platform in the world.
          </MotionTypography>

          <MotionBox initial="hidden" animate="visible" variants={fadeIn}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/auth/register')}
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
                Sign up for free
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/auth/login')}
                sx={{
                  borderColor: '#30363d',
                  color: '#e6edf3',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  textTransform: 'none',
                  borderRadius: '8px',
                  '&:hover': { borderColor: '#58a6ff', color: '#58a6ff' },
                }}
              >
                Learn more →
              </Button>
            </Stack>
          </MotionBox>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#0d1117' }}>
        <Container maxWidth="lg">
          <MotionTypography
            variant="h3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            sx={{ textAlign: 'center', fontWeight: 700, mb: 2 }}
          >
            Everything you need
          </MotionTypography>
          <MotionTypography
            variant="body1"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            sx={{ textAlign: 'center', color: '#8b949e', mb: 8, maxWidth: 560, mx: 'auto' }}
          >
            A complete developer platform to build, scale, and deliver secure software.
          </MotionTypography>

          <Grid container spacing={3}>
            {features.map((feature, i) => (
              <Grid item xs={12} sm={6} md={3} key={feature.title}>
                <MotionCard
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={slideUp}
                  sx={{
                    bgcolor: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '12px',
                    height: '100%',
                    transition: 'border-color 0.2s',
                    '&:hover': { borderColor: '#58a6ff' },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#e6edf3' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8b949e', lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Statistics Section */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)',
        }}
      >
        <Container maxWidth="lg">
          <MotionTypography
            variant="h3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            sx={{ textAlign: 'center', fontWeight: 700, mb: 1 }}
          >
            Trusted by the world&apos;s leading teams
          </MotionTypography>
          <MotionTypography
            variant="body1"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            sx={{ textAlign: 'center', color: '#8b949e', mb: 8 }}
          >
            Powering the world&apos;s software — from startups to the Fortune 100.
          </MotionTypography>

          <Grid container spacing={4} justifyContent="center">
            {stats.map((stat, i) => (
              <Grid item xs={6} md={3} key={stat.label}>
                <MotionBox
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={slideUp}
                  sx={{ textAlign: 'center' }}
                >
                  <Box sx={{ mb: 1 }}>{stat.icon}</Box>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 800, color: '#e6edf3', mb: 0.5 }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8b949e', fontSize: '0.95rem' }}>
                    {stat.label}
                  </Typography>
                </MotionBox>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center', bgcolor: '#0d1117' }}>
        <Container maxWidth="sm">
          <MotionBox initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              Ready to start building?
            </Typography>
            <Typography variant="body1" sx={{ color: '#8b949e', mb: 4 }}>
              Join the millions of developers already shipping on our platform.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/auth/register')}
              sx={{
                bgcolor: '#238636',
                color: '#fff',
                fontWeight: 600,
                px: 5,
                py: 1.5,
                fontSize: '1rem',
                textTransform: 'none',
                borderRadius: '8px',
                '&:hover': { bgcolor: '#2ea043' },
              }}
            >
              Sign up for free
            </Button>
          </MotionBox>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 5,
          borderTop: '1px solid #30363d',
          bgcolor: '#0d1117',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#e6edf3' }}>
                GitClone
              </Typography>
              <Typography variant="body2" sx={{ color: '#8b949e', lineHeight: 1.7 }}>
                The complete developer platform to build, scale, and deliver secure software.
              </Typography>
            </Grid>
            {['Product', 'Resources', 'Company'].map((section) => (
              <Grid item xs={6} sm={4} md={3} key={section}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#e6edf3' }}>
                  {section}
                </Typography>
                {['Features', 'Documentation', 'Pricing'].map((link) => (
                  <Typography
                    key={link}
                    variant="body2"
                    sx={{
                      color: '#8b949e',
                      mb: 0.75,
                      cursor: 'pointer',
                      '&:hover': { color: '#58a6ff' },
                    }}
                  >
                    {link}
                  </Typography>
                ))}
              </Grid>
            ))}
          </Grid>
          <Typography
            variant="body2"
            sx={{ color: '#484f58', textAlign: 'center', mt: 6, fontSize: '0.8rem' }}
          >
            © {new Date().getFullYear()} GitClone, Inc. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
