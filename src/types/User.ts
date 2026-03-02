export interface User {
  id: number
  nom: string
  prenom: string
  email: string
  matricule: string
  actif: number
  profil_id: number
  created_at: string
  updated_at: string
  profil: Profil
}

export interface Profil {
  id: number
  libelle: string
  created_at: string
  updated_at: string
}