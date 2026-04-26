import api from './client'

export const getUsers = () =>
  api.get('/users').then(r => r.data)

/** Création d'un utilisateur avec rôle — réservé admin */
export const createUser = (data: { email: string; password: string; role: string }) =>
  api.post('/users', data).then(r => r.data)
