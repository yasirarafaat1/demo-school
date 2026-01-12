const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

class BackendService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Backend service error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Email services
  async sendFeeEmail(emailData) {
    return this.request('/send-fee-email', {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  // Generic database operations
  async getTableData(table, filters = {}) {
    return this.request(`/database/${table}`, {
      method: 'POST',
      body: JSON.stringify({
        operation: 'select',
        filters,
      }),
    });
  }

  async insertTableData(table, data) {
    return this.request(`/database/${table}`, {
      method: 'POST',
      body: JSON.stringify({
        operation: 'insert',
        data,
      }),
    });
  }

  async updateTableData(table, data, filters) {
    return this.request(`/database/${table}`, {
      method: 'POST',
      body: JSON.stringify({
        operation: 'update',
        data,
        filters,
      }),
    });
  }

  async deleteTableData(table, filters) {
    return this.request(`/database/${table}`, {
      method: 'POST',
      body: JSON.stringify({
        operation: 'delete',
        filters,
      }),
    });
  }

  // Student management
  async getStudents(filters = {}) {
    return this.getTableData('students', filters);
  }

  async addStudent(studentData) {
    return this.insertTableData('students', studentData);
  }

  async updateStudent(studentId, studentData) {
    return this.updateTableData('students', studentData, { id: studentId });
  }

  async deleteStudent(studentId) {
    return this.deleteTableData('students', { id: studentId });
  }

  // Fee management
  async getFees(filters = {}) {
    return this.getTableData('fees', filters);
  }

  async addFee(feeData) {
    return this.insertTableData('fees', feeData);
  }

  async updateFee(feeId, feeData) {
    return this.updateTableData('fees', feeData, { id: feeId });
  }

  // Result management
  async getResults(filters = {}) {
    return this.getTableData('results', filters);
  }

  async addResult(resultData) {
    return this.insertTableData('results', resultData);
  }

  async updateResult(resultId, resultData) {
    return this.updateTableData('results', resultData, { id: resultId });
  }

  async deleteResult(resultId) {
    return this.deleteTableData('results', { id: resultId });
  }

  // Staff management
  async getStaff(filters = {}) {
    return this.getTableData('staff', filters);
  }

  async addStaff(staffData) {
    return this.insertTableData('staff', staffData);
  }

  async updateStaff(staffId, staffData) {
    return this.updateTableData('staff', staffData, { id: staffId });
  }

  async deleteStaff(staffId) {
    return this.deleteTableData('staff', { id: staffId });
  }

  // Settings management
  async getSettings(filters = {}) {
    return this.getTableData('settings', filters);
  }

  async updateSetting(key, value) {
    return this.updateTableData('settings', { value }, { key });
  }
}

// Create singleton instance
const backendService = new BackendService();

export default backendService;
