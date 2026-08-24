import api from './http'

async function unwrap(responsePromise) {
  const response = await responsePromise
  return response.data
}

export function loginRequest(payload) {
  return unwrap(api.post('/token/', payload))
}

export function registerRequest(payload) {
  return unwrap(api.post('/register/', payload))
}

export function refreshTokenRequest(payload) {
  return unwrap(api.post('/token/refresh/', payload))
}

export function logoutRequest(refresh) {
  return unwrap(api.post('/logout/', { refresh }))
}

export function getProfileRequest() {
  return unwrap(api.get('/user/profile/'))
}

export function listChildren(params = {}) {
  return unwrap(api.get('/enfants/', { params }))
}

export function createChild(payload) {
  return unwrap(api.post('/enfants/', payload))
}

export function updateChild(id, payload) {
  return unwrap(api.put(`/enfants/${id}/`, payload))
}

export function deleteChild(id) {
  return unwrap(api.delete(`/enfants/${id}/`))
}

export function listParents(params = {}) {
  return unwrap(api.get('/parents/', { params }))
}

export function createParent(payload) {
  return unwrap(api.post('/parents/', payload))
}

export function updateParent(id, payload) {
  return unwrap(api.put(`/parents/${id}/`, payload))
}

export function deleteParent(id) {
  return unwrap(api.delete(`/parents/${id}/`))
}

export function addChildToParent(parentId, childId) {
  return unwrap(api.post(`/parents/${parentId}/add-enfant/`, { enfant_id: childId }))
}

export function removeChildFromParent(parentId, childId) {
  return unwrap(api.post(`/parents/${parentId}/remove-enfant/`, { enfant_id: childId }))
}

export function listCarnets(params = {}) {
  return unwrap(api.get('/carnets/', { params }))
}

export function createCarnet(payload) {
  return unwrap(api.post('/carnets/', payload))
}

export function updateCarnet(id, payload) {
  return unwrap(api.put(`/carnets/${id}/`, payload))
}

export function deleteCarnet(id) {
  return unwrap(api.delete(`/carnets/${id}/`))
}

export function getCarnetDetail(id) {
  return unwrap(api.get(`/carnets/${id}/detail/`))
}

export function updatePayment(carnetId, paymentId, payload) {
  return unwrap(
    api.put(`/carnets/${carnetId}/paiement/${paymentId}/update-status-montant/`, payload),
  )
}
