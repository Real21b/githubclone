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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    if (!acceptedTerms) {
      toast.error('Please accept the Terms of Service to continue.');
      return;
    }
    setServerError(null);
    setIsLoading(true);
    try {
      await registerUser(data.username, data.email, data.password);
      toast.success('Account created successfully!');
      navigate('/app/dashboard');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Registration failed. Please try again.';
      setServerError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputSx = {
    mb: 2,
    '& .MuiOutlinedInput-root': {
      bgcolor: '#0d1117',
      color: '#e6edf3',
      '& fieldset': { borderColor: '#30363d' },
      '&:hover fieldset': { borderColor: '#58a6ff' },
      '&.Mui-focused fieldset': { borderColor: '#58a6ff' },
    },
    '& .MuiFormHelperText-root': { color: '#f85149' },
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
        py: 4,
      }}
    >
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ color: '#e6edf3', fontWeight: 600, mb: 0.5 }}>
          Create your account
        </Typography>
        <Typography sx={{ color: '#8b949e', fontSize: 14 }}>
          Welcome to GitHubClone! Let&apos;s get started.
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{
          width: '100%',
          maxWidth: 380,
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

        <Typography sx={{ color: '#e6edf3', mb: 0.5, fontSize: 14 }}>Username</Typography>
        <TextField
          fullWidth
          size="small"
          autoComplete="username"
          autoFocus
          placeholder="Choose a username"
          error={!!errors.username}
          helperText={errors.username?.message}
          {...register('username', {
            required: 'Username is required',
            minLength: { value: 3, message: 'Username must be at least 3 characters' },
            pattern: {
              value: /^[a-zA-Z0-9_-]+$/,
              message: 'Username can only contain letters, numbers, hyphens, and underscores',
            },
          })}
          sx={inputSx}
        />

        <Typography sx={{ color: '#e6edf3', mb: 0.5, fontSize: 14 }}>Email address</Typography>
        <TextField
          fullWidth
          size="small"
          autoComplete="email"
          placeholder="you@example.com"
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          sx={inputSx}
        />

        <Typography sx={{ color: '#e6edf3', mb: 0.5, fontSize: 14 }}>Password</Typography>
        <TextField
          fullWidth
          size="small"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="At least 6 characters"
          error={!!errors.password}
          helperText={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
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
          sx={inputSx}
        />

        <Typography sx={{ color: '#e6edf3', mb: 0.5, fontSize: 14 }}>Confirm password</Typography>
        <TextField
          fullWidth
          size="small"
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Confirm your password"
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === passwordValue || 'Passwords do not match',
          })}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  sx={{ color: '#8b949e' }}
                >
                  {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              sx={{
                color: '#30363d',
                '&.Mui-checked': { color: '#58a6ff' },
              }}
            />
          }
          label={
            <Typography sx={{ color: '#8b949e', fontSize: 13 }}>
              I agree to the{' '}
              <Link href="#" sx={{ color: '#58a6ff', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" sx={{ color: '#58a6ff', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Privacy Policy
              </Link>
            </Typography>
          }
          sx={{ mb: 2, alignItems: 'flex-start', '& .MuiCheckbox-root': { pt: 0.5 } }}
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
          {isLoading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Create account'}
        </Button>
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: 380,
          mt: 2,
          border: '1px solid #30363d',
          borderRadius: 2,
          p: 2,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: '#e6edf3', fontSize: 14 }}>
          Already have an account?{' '}
          <Link
            component={RouterLink}
            to="/login"
            sx={{ color: '#58a6ff', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Sign in
          </Link>
          .
        </Typography>
      </Box>
    </Box>
  );
};

export default Register;
