// localStorage can be unavailable (private browsing, blocked site data)
export function loadItem(key) {
    try {
        return localStorage.getItem(key)
    } catch {
        return null
    }
}

export function saveItem(key, value) {
    try {
        localStorage.setItem(key, value)
    } catch (e) {
        console.error(e)
    }
}
