// API base URL configuration
// Empty string means same-origin (relative to current host)
// When using Live Server or separate frontend, point to Spring Boot backend
window.API_BASE = window.location.port === '8088' ? '' : 'http://localhost:8088';
