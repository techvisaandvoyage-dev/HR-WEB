const getEmployeeIdFromToken = () => {
  try {
    const token = localStorage.getItem('employeeToken');
    const payload = token?.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(window.atob(paddedBase64)).id || null;
  } catch (error) {
    console.error('Unable to identify the logged-in employee:', error);
    return null;
  }
};

export const getEmployeeStorageKey = (name) => {
  const employeeId = getEmployeeIdFromToken();
  return employeeId ? `employee:${employeeId}:${name}` : null;
};

export const getEmployeeStoredValue = (name, fallback) => {
  const key = getEmployeeStorageKey(name);
  if (!key) return fallback;

  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Unable to read ${name}:`, error);
    return fallback;
  }
};

export const setEmployeeStoredValue = (name, value) => {
  const key = getEmployeeStorageKey(name);
  if (!key) return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Unable to save ${name}:`, error);
  }
};
