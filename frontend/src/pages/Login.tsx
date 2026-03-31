import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Signed in successfully!');
      navigate('/app/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
      setServerError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0d1117',
        px: 2,
      }}
    >
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h4"
          sx={{ color: '#e6edf3', fontWeight: 600, mb: 1 }}
        >
          Sign in to GitHubClone
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{
          width: '100%',
          maxWidth: 340,
          bgcolor: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 2,
          p: 3,
        }}
      >
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Typography sx={{ color: '#e6edf3', mb: 0.5, fontSize: 14 }}>
          Email address
        </Typography>
        <TextField
          fullWidth
          size="small"
          autoComplete="email"
          autoFocus
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#0d1117',
              color: '#e6edf3',
              '& fieldset': { borderColor: '#30363d' },
              '&:hover fieldset': { borderColor: '#58a6ff' },
              '&.Mui-focused fieldset': { borderColor: '#58a6ff' },
            },
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography sx={{ color: '#e6edf3', fontSize: 14 }}>
            Password
          </Typography>
          <Link
            component={RouterLink}
            to="/forgot-password"
            sx={{ color: '#58a6ff', fontSize: 12, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Forgot password?
          </Link>
        </Box>
        <TextField
          fullWidth
          size="small"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          error={!!errors.password}
          helperText={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
          })}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setShowPassword((prev) => !prev)}
                  sx={{ color: '#8b949e' }}
                >
                  {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#0d1117',
              color: '#e6edf3',
              '& fieldset': { borderColor: '#30363d' },
              '&:hover fieldset': { borderColor: '#58a6ff' },
              '&.Mui-focused fieldset': { borderColor: '#58a6ff' },
            },
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          sx={{
            bgcolor: '#238636',
            color: '#fff',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { bgcolor: '#2ea043' },
            '&.Mui-disabled': { bgcolor: '#238636', opacity: 0.6 },
          }}
        >
          {isLoading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign in'}
        </Button>
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: 340,
          mt: 2,
          border: '1px solid #30363d',
          borderRadius: 2,
          p: 2,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: '#e6edf3', fontSize: 14 }}>
          New to GitHubClone?{' '}
          <Link
            component={RouterLink}
            to="/register"
            sx={{ color: '#58a6ff', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Create an account
          </Link>
          .
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
