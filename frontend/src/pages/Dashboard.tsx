import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Skeleton,
  Alert,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Search as SearchIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ForkRight as ForkRightIcon,
  Add as AddIcon,
  Book as BookIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { GET_REPOSITORIES, CREATE_REPOSITORY } from '../graphql/queries';
import { useAuth } from '../contexts/AuthContext';

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Scala: '#c22d40',
  Vue: '#41b883',
  Svelte: '#ff3e00',
};

interface Repository {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  starsCount: number;
  forksCount: number;
  watchersCount: number;
  language: string;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    username: string;
    avatar: string;
  };
}

const RepositorySkeleton: React.FC = () => (
  <Box sx={{ py: 3, borderBottom: '1px solid #30363d' }}>
    <Skeleton variant="text" width="30%" sx={{ bgcolor: '#21262d', mb: 1 }} />
    <Skeleton variant="text" width="60%" sx={{ bgcolor: '#21262d', mb: 2 }} />
    <Box sx={{ display: 'flex', gap: 3 }}>
      <Skeleton variant="text" width={80} sx={{ bgcolor: '#21262d' }} />
      <Skeleton variant="text" width={50} sx={{ bgcolor: '#21262d' }} />
      <Skeleton variant="text" width={50} sx={{ bgcolor: '#21262d' }} />
      <Skeleton variant="text" width={100} sx={{ bgcolor: '#21262d' }} />
    </Box>
  </Box>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDescription, setNewRepoDescription] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const { data, loading, error, refetch } = useQuery(GET_REPOSITORIES);
  const [createRepository, { loading: creating }] = useMutation(CREATE_REPOSITORY, {
    onCompleted: () => {
      setDialogOpen(false);
      setNewRepoName('');
      setNewRepoDescription('');
      setNewRepoPrivate(false);
      refetch();
    },
  });

  const repositories: Repository[] = data?.repositories ?? data?.getRepositories ?? [];

  const filteredRepositories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return repositories;
    return repositories.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.language?.toLowerCase().includes(query)
    );
  }, [repositories, searchQuery]);

  const sidebarRepos = useMemo(() => {
    const query = sidebarSearch.toLowerCase().trim();
    if (!query) return repositories.slice(0, 10);
    return repositories
      .filter((repo) => repo.name.toLowerCase().includes(query))
      .slice(0, 10);
  }, [repositories, sidebarSearch]);

  const handleCreateRepository = () => {
    if (!newRepoName.trim()) return;
    createRepository({
      variables: {
        input: {
          name: newRepoName.trim(),
          description: newRepoDescription.trim(),
          isPrivate: newRepoPrivate,
        },
      },
    });
  };

  const formatUpdatedTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const getLanguageColor = (language: string) =>
    LANGUAGE_COLORS[language] || '#8b949e';

  return (
    <Box sx={{ bgcolor: '#0d1117', minHeight: '100vh', color: '#e6edf3' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto', px: 3, py: 4 }}>
        <Grid container spacing={4}>
          {/* Left Sidebar */}
          <Grid item xs={12} md={3}>
            <Box sx={{ position: 'sticky', top: 24 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={user?.avatar}
                  alt={user?.username ?? 'User'}
                  sx={{ width: 260, height: 260, mb: 2, border: '1px solid #30363d' }}
                />
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#e6edf3' }}>
                  {user?.displayName || user?.username || 'User'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b949e' }}>
                  {user?.username || 'username'}
                </Typography>
              </Box>

              {user?.bio && (
                <Typography
                  variant="body2"
                  sx={{ color: '#8b949e', mb: 2, lineHeight: 1.6 }}
                >
                  {user.bio}
                </Typography>
              )}

              <Divider sx={{ borderColor: '#30363d', my: 2 }} />

              <TextField
                fullWidth
                size="small"
                placeholder="Find a repository…"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#8b949e', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#0d1117',
                    color: '#e6edf3',
                    fontSize: 14,
                    '& fieldset': { borderColor: '#30363d' },
                    '&:hover fieldset': { borderColor: '#58a6ff' },
                    '&.Mui-focused fieldset': { borderColor: '#58a6ff' },
                  },
                }}
              />

              <List dense disablePadding>
                {sidebarRepos.map((repo) => (
                  <ListItem
                    key={repo.id}
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#161b22' },
                      cursor: 'pointer',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      {repo.language ? (
                        <CircleIcon
                          sx={{
                            fontSize: 12,
                            color: getLanguageColor(repo.language),
                          }}
                        />
                      ) : (
                        <BookIcon sx={{ fontSize: 16, color: '#8b949e' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={repo.name}
                      primaryTypographyProps={{
                        fontSize: 14,
                        color: '#e6edf3',
                        noWrap: true,
                        fontWeight: 600,
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={9}>
            {/* Top Bar */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
                borderBottom: '1px solid #30363d',
                pb: 2,
              }}
            >
              <Tabs
                value={tabValue}
                onChange={(_, v) => setTabValue(v)}
                sx={{
                  '& .MuiTab-root': { color: '#8b949e', textTransform: 'none', fontWeight: 600 },
                  '& .Mui-selected': { color: '#e6edf3' },
                  '& .MuiTabs-indicator': { bgcolor: '#f78166' },
                }}
              >
                <Tab
                  icon={<BookIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Repositories
                      <Chip
                        label={repositories.length}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 12,
                          bgcolor: '#30363d',
                          color: '#e6edf3',
                        }}
                      />
                    </Box>
                  }
                />
              </Tabs>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                sx={{
                  bgcolor: '#238636',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: 14,
                  '&:hover': { bgcolor: '#2ea043' },
                }}
              >
                New
              </Button>
            </Box>

            {/* Search Bar */}
            <TextField
              fullWidth
              size="small"
              placeholder="Find a repository…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#8b949e', fontSize: 20 }} />
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

            {/* Error State */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  bgcolor: '#3d1f1f',
                  color: '#f85149',
                  border: '1px solid #f8514950',
                  mb: 3,
                }}
              >
                Failed to load repositories. Please try again later.
              </Alert>
            )}

            {/* Loading State */}
            {loading && (
              <Box>
                {[1, 2, 3, 4, 5].map((i) => (
                  <RepositorySkeleton key={i} />
                ))}
              </Box>
            )}

            {/* Empty State */}
            {!loading && !error && filteredRepositories.length === 0 && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 8,
                  border: '1px solid #30363d',
                  borderRadius: 2,
                  bgcolor: '#161b22',
                }}
              >
                <BookIcon sx={{ fontSize: 48, color: '#8b949e', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#e6edf3', mb: 1 }}>
                  {searchQuery
                    ? 'No repositories match your search'
                    : 'You don\u2019t have any repositories yet'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b949e', mb: 3 }}>
                  {searchQuery
                    ? 'Try a different search term.'
                    : 'Repositories contain all of your project\u2019s files and revision history.'}
                </Typography>
                {!searchQuery && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setDialogOpen(true)}
                    sx={{
                      bgcolor: '#238636',
                      color: '#ffffff',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': { bgcolor: '#2ea043' },
                    }}
                  >
                    New repository
                  </Button>
                )}
              </Box>
            )}

            {/* Repository List */}
            {!loading &&
              filteredRepositories.map((repo) => (
                <Box
                  key={repo.id}
                  sx={{
                    py: 3,
                    borderBottom: '1px solid #30363d',
                    '&:hover': { bgcolor: '#161b2205' },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          component="a"
                          href={`/${repo.owner?.username}/${repo.name}`}
                          sx={{
                            color: '#58a6ff',
                            fontWeight: 600,
                            fontSize: 20,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {repo.name}
                        </Typography>
                        <Chip
                          label={repo.isPrivate ? 'Private' : 'Public'}
                          size="small"
                          icon={
                            repo.isPrivate ? (
                              <LockIcon sx={{ fontSize: 14, color: '#8b949e !important' }} />
                            ) : (
                              <LockOpenIcon sx={{ fontSize: 14, color: '#8b949e !important' }} />
                            )
                          }
                          variant="outlined"
                          sx={{
                            height: 22,
                            fontSize: 12,
                            color: '#8b949e',
                            borderColor: '#30363d',
                            '& .MuiChip-label': { px: 0.5 },
                          }}
                        />
                      </Box>

                      {repo.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#8b949e',
                            mb: 2,
                            maxWidth: 600,
                            lineHeight: 1.5,
                          }}
                        >
                          {repo.description}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                        {repo.language && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CircleIcon
                              sx={{
                                fontSize: 12,
                                color: getLanguageColor(repo.language),
                              }}
                            />
                            <Typography variant="caption" sx={{ color: '#8b949e', fontSize: 12 }}>
                              {repo.language}
                            </Typography>
                          </Box>
                        )}

                        {repo.starsCount > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <StarBorderIcon sx={{ fontSize: 16, color: '#8b949e' }} />
                            <Typography variant="caption" sx={{ color: '#8b949e', fontSize: 12 }}>
                              {repo.starsCount.toLocaleString()}
                            </Typography>
                          </Box>
                        )}

                        {repo.forksCount > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ForkRightIcon sx={{ fontSize: 16, color: '#8b949e' }} />
                            <Typography variant="caption" sx={{ color: '#8b949e', fontSize: 12 }}>
                              {repo.forksCount.toLocaleString()}
                            </Typography>
                          </Box>
                        )}

                        <Typography variant="caption" sx={{ color: '#8b949e', fontSize: 12 }}>
                          Updated {formatUpdatedTime(repo.updatedAt)}
                        </Typography>
                      </Box>
                    </Box>

                    <IconButton size="small" sx={{ color: '#8b949e', mt: 0.5 }}>
                      <StarBorderIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>
              ))}
          </Grid>
        </Grid>
      </Box>

      {/* New Repository Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#161b22',
            color: '#e6edf3',
            border: '1px solid #30363d',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #30363d', fontWeight: 600 }}>
          Create a new repository
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ color: '#8b949e', mb: 3 }}>
            A repository contains all project files, including the revision history.
          </Typography>

          <Typography variant="body2" sx={{ color: '#e6edf3', mb: 1, fontWeight: 600 }}>
            Repository name *
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={newRepoName}
            onChange={(e) => setNewRepoName(e.target.value)}
            placeholder="my-awesome-project"
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

          <Typography variant="body2" sx={{ color: '#e6edf3', mb: 1, fontWeight: 600 }}>
            Description (optional)
          </Typography>
          <TextField
            fullWidth
            size="small"
            multiline
            rows={3}
            value={newRepoDescription}
            onChange={(e) => setNewRepoDescription(e.target.value)}
            placeholder="A short description of your repository"
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

          <Divider sx={{ borderColor: '#30363d', my: 2 }} />

          <FormControlLabel
            control={
              <Switch
                checked={newRepoPrivate}
                onChange={(e) => setNewRepoPrivate(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#58a6ff' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    bgcolor: '#58a6ff',
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ color: '#e6edf3', fontWeight: 600 }}>
                  {newRepoPrivate ? 'Private' : 'Public'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#8b949e' }}>
                  {newRepoPrivate
                    ? 'You choose who can see and commit to this repository.'
                    : 'Anyone on the internet can see this repository.'}
                </Typography>
              </Box>
            }
            sx={{ ml: 0 }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #30363d', px: 3, py: 2 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{ color: '#8b949e', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateRepository}
            disabled={!newRepoName.trim() || creating}
            sx={{
              bgcolor: '#238636',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: '#2ea043' },
              '&.Mui-disabled': { bgcolor: '#238636', opacity: 0.5 },
            }}
          >
            {creating ? 'Creating…' : 'Create repository'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
