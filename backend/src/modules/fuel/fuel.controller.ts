
import { Request, Response } from 'express';
import { FuelService } from './fuel.service';

export class FuelController {
  private service: FuelService;

  constructor() {
    this.service = new FuelService();
  }

  // GET /api/v1/machines/:id/fuel
  public getMachineFuelStats = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const stats = await this.service.getFuelStats(id);
      
      if (!stats) {
        return res.status(404).json({ message: 'No fuel data found' });
      }

      return res.json({
        data: stats,
        meta: {
          generated_at: new Date()
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
}
