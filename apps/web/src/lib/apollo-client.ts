// 🚀 Apollo Client Configuration
// Works with both Vite and Next.js

import { ApolloClient, createHttpLink, from, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// HTTP Link
const httpLink = createHttpLink({
  uri:
    process.env.NODE_ENV === 'production'
      ? 'https://githubclone.com/graphql'
      : 'http://localhost:3000/graphql',
});

// Auth Link
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth_token');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error Link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);

    // Handle 401 errors (unauthorized)
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      // Clear auth token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/auth/login';
    }
  }
});

// Cache Configuration
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        repositories: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
        users: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
        issues: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
        pullRequests: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
      },
    },
    Repository: {
      fields: {
        issues: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
        pullRequests: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
      },
    },
  },
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: process.env.NODE_ENV === 'development',
});

// Export for use in components
export default apolloClient;
