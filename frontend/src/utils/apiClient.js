const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem("token");
  const headers = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
    throw new Error("Sesi telah habis, silakan login kembali.");
  }
  
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
};

export const apiClient = {
  get: async (endpoint) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  post: async (endpoint, body) => {
    const isFormData = body instanceof FormData;
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: getAuthHeaders(isFormData),
      body: isFormData ? body : JSON.stringify(body),
    });
    return handleResponse(response);
  },
  
  put: async (endpoint, body) => {
    const isFormData = body instanceof FormData;
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: getAuthHeaders(isFormData),
      body: isFormData ? body : JSON.stringify(body),
    });
    return handleResponse(response);
  },
  
  patch: async (endpoint, body) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },
  
  delete: async (endpoint) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  }
};
