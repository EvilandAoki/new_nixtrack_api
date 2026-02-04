import { Response } from 'express';
import { DepartmentModel } from '../models/department.model';
import { CityModel } from '../models/city.model';
import { StatusModel } from '../models/status.model';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export class CatalogController {
  // Departments
  static async getDepartments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { country_code } = req.query;
      const departments = await DepartmentModel.findAll(country_code as string | undefined);
      sendSuccess(res, departments);
    } catch (error) {
      sendError(res, 'Failed to get departments', 500);
    }
  }

  static async getDepartmentById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const department = await DepartmentModel.findById(id);

      if (!department) {
        sendError(res, 'Department not found', 404);
        return;
      }

      sendSuccess(res, department);
    } catch (error) {
      sendError(res, 'Failed to get department', 500);
    }
  }

  // Cities
  static async getCities(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { department_code, search } = req.query;

      if (search && typeof search === 'string') {
        const cities = await CityModel.search(search);
        sendSuccess(res, cities);
        return;
      }

      const cities = await CityModel.findAll(department_code as string | undefined);
      sendSuccess(res, cities);
    } catch (error) {
      sendError(res, 'Failed to get cities', 500);
    }
  }

  static async getCityById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const city = await CityModel.findById(id);

      if (!city) {
        sendError(res, 'City not found', 404);
        return;
      }

      sendSuccess(res, city);
    } catch (error) {
      sendError(res, 'Failed to get city', 500);
    }
  }

  // Statuses
  static async getStatuses(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const statuses = await StatusModel.findAll();
      sendSuccess(res, statuses);
    } catch (error) {
      sendError(res, 'Failed to get statuses', 500);
    }
  }

  static async getStatusById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const status = await StatusModel.findById(id);

      if (!status) {
        sendError(res, 'Status not found', 404);
        return;
      }

      sendSuccess(res, status);
    } catch (error) {
      sendError(res, 'Failed to get status', 500);
    }
  }
}
