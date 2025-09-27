import { gql } from '@apollo/client'

export const GET_REPOSITORIES = gql`
  query GetRepositories {
    repositories {
      id
      name
      description
      isPrivate
      starsCount
      forksCount
      watchersCount
      language
      defaultBranch
      createdAt
      updatedAt
      owner {
        id
        username
        avatar
      }
    }
  }
`

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      username
      email
      bio
      avatar
      followersCount
      followingCount
      createdAt
    }
  }
`

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      username
      email
      bio
      avatar
      followersCount
      followingCount
      repositories {
        id
        name
        description
        isPrivate
        starsCount
        forksCount
        language
        createdAt
      }
      createdAt
    }
  }
`

export const GET_REPOSITORY = gql`
  query GetRepository($id: ID!) {
    repository(id: $id) {
      id
      name
      description
      isPrivate
      starsCount
      forksCount
      watchersCount
      language
      defaultBranch
      createdAt
      updatedAt
      owner {
        id
        username
        avatar
      }
    }
  }
`

export const LOGIN = gql`
  mutation Login($loginInput: LoginInput!) {
    login(loginInput: $loginInput) {
      access_token
      user {
        id
        username
        email
        bio
        avatar
        followersCount
        followingCount
      }
    }
  }
`

export const REGISTER = gql`
  mutation Register($registerInput: RegisterInput!) {
    register(registerInput: $registerInput) {
      access_token
      user {
        id
        username
        email
        bio
        avatar
        followersCount
        followingCount
      }
    }
  }
`

export const CREATE_REPOSITORY = gql`
  mutation CreateRepository($createRepositoryInput: CreateRepositoryInput!) {
    createRepository(createRepositoryInput: $createRepositoryInput) {
      id
      name
      description
      isPrivate
      starsCount
      forksCount
      language
      defaultBranch
      createdAt
    }
  }
`

export const STAR_REPOSITORY = gql`
  mutation StarRepository($id: ID!) {
    starRepository(id: $id) {
      id
      starsCount
    }
  }
`

export const FORK_REPOSITORY = gql`
  mutation ForkRepository($id: ID!, $newOwnerId: ID!) {
    forkRepository(id: $id, newOwnerId: $newOwnerId) {
      id
      name
      description
      isPrivate
      starsCount
      forksCount
      language
      defaultBranch
      createdAt
    }
  }
`
