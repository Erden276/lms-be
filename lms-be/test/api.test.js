import request from 'supertest';

const baseURL = 'https://lms-be-production-efde.up.railway.app';

describe('LMS API End-to-End Tests', () => {
  it('Harus menolak login dengan password salah (401 Unauthorized)', async () => {
    const res = await request(baseURL)
      .post('/api/auth/login')
      .send({
        nomorInduk: "2025001",
        password: "salahbanget"
      });
      
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('status', 'error');
  });

  it('Harus berhasil login dengan kredensial benar', async () => {
    const res = await request(baseURL)
      .post('/api/auth/login')
      .send({
        nomorInduk: "2025001",
        password: "password123"
      });
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty('token');
  });
});
