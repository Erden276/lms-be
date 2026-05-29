export class DashboardDosenController {
constructor(dashboardDosenUseCase) {
    this.useCase = dashboardDosenUseCase;
}

  // Menggunakan arrow function untuk menghindari error hilangnya konteks 'this' [cite: 520, 526]
getDashboard = async (req, res) => {
    try {
      // Mengambil nomorInduk dari token JWT yang sudah di-decode oleh authMiddleware
        const nomorInduk = req.user.nomorInduk; 
        const dashboardData = await this.useCase.getDashboardData(nomorInduk);
        res.status(200).json(dashboardData);
    } catch (error) {
        console.error("Dashboard Dosen Error:", error.message);
        res.status(500).json({ error: error.message });
    }
    };
}